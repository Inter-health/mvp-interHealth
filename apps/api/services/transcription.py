import logging
import os
import time
from datetime import datetime, timedelta, timezone

from core.security import encrypt_text
from repositories import consultations as repo
from schemas.consultations import ConsultationStatus

logger = logging.getLogger(__name__)

_SPEAKER_LABELS = {
    "SPEAKER_00": "[MÉDICO]",
    "SPEAKER_01": "[PACIENTE]",
}

TRANSCRIPT_TTL_DAYS = 30

# Transcrição simulada usada quando WHISPER_MODEL=mock (desenvolvimento local)
_MOCK_TRANSCRIPT = (
    "[MÉDICO]: Bom dia! Em que posso ajudá-lo hoje?\n"
    "[PACIENTE]: Bom dia, doutor. Estou com dor de cabeça forte há dois dias e enjoo.\n"
    "[MÉDICO]: A dor é constante ou vem em crises?\n"
    "[PACIENTE]: Vem em crises, principalmente de manhã. A luz me incomoda bastante.\n"
    "[MÉDICO]: Você tem histórico familiar de enxaqueca?\n"
    "[PACIENTE]: Sim, minha mãe tem. Mas nunca tive algo tão intenso.\n"
    "[MÉDICO]: Vou verificar sua pressão e fazer um exame neurológico básico. "
    "Você tomou algum analgésico?\n"
    "[PACIENTE]: Tomei dipirona ontem à noite, mas aliviou pouco.\n"
    "[MÉDICO]: Pressão está normal, 120 por 80. Quadro sugestivo de enxaqueca com aura. "
    "Vou prescrever um triptano para as crises e um preventivo diário.\n"
    "[PACIENTE]: Preciso fazer algum exame?\n"
    "[MÉDICO]: Por enquanto não. Se não melhorar em 30 dias, pedimos ressonância. "
    "Retorne em um mês."
)


def _mock_diarize(text: str) -> str:
    """Simula diarização dividindo por frases e alternando MÉDICO/PACIENTE."""
    import re
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    if not sentences:
        return f"[MÉDICO]: {text}"
    speakers = ["[MÉDICO]", "[PACIENTE]"]
    return "\n".join(
        f"{speakers[i % 2]}: {s}" for i, s in enumerate(sentences)
    )


def _mock_process(consultation_id: str, live_transcript: str | None = None) -> None:
    """Simula o pipeline WhisperX + pyannote para desenvolvimento local.
    Usa o live_transcript do frontend quando disponível; caso contrário usa texto de exemplo.
    """
    repo.update_status(consultation_id, ConsultationStatus.PROCESSING.value)
    logger.info("[MOCK] Simulando transcrição [%s]", consultation_id)
    time.sleep(3)
    if live_transcript and live_transcript.strip():
        transcript = _mock_diarize(live_transcript.strip())
        source = "live+diarize"
    else:
        transcript = _MOCK_TRANSCRIPT
        source = "exemplo"
    encrypted, iv = encrypt_text(transcript)
    expires_at = datetime.now(timezone.utc) + timedelta(days=TRANSCRIPT_TTL_DAYS)
    repo.save_transcript(consultation_id, encrypted, iv, expires_at)
    logger.info("[MOCK] Transcrição salva (%s) [%s]", source, consultation_id)


def _label(speaker: str) -> str:
    return _SPEAKER_LABELS.get(speaker, f"[FALANTE {speaker.split('_')[-1]}]")


def _format_transcript(segments: list) -> str:
    lines = []
    current_speaker = None
    current_text: list[str] = []

    for seg in segments:
        speaker = seg.get("speaker", "SPEAKER_00")
        text = seg.get("text", "").strip()
        if not text:
            continue
        if speaker != current_speaker:
            if current_speaker is not None and current_text:
                lines.append(f"{_label(current_speaker)}: {' '.join(current_text)}")
            current_speaker = speaker
            current_text = [text]
        else:
            current_text.append(text)

    if current_speaker is not None and current_text:
        lines.append(f"{_label(current_speaker)}: {' '.join(current_text)}")

    return "\n".join(lines)


def _assemblyai_process(consultation_id: str, file_path: str) -> None:
    """Diarização real via AssemblyAI (cloud). Identifica MÉDICO e PACIENTE pelo áudio."""
    import assemblyai as aai

    api_key = os.environ.get("ASSEMBLYAI_API_KEY", "")
    if not api_key:
        raise ValueError("ASSEMBLYAI_API_KEY não configurada.")

    aai.settings.api_key = api_key
    repo.update_status(consultation_id, ConsultationStatus.PROCESSING.value)
    logger.info("[AssemblyAI] Enviando áudio para diarização [%s]", consultation_id)

    config = aai.TranscriptionConfig(
        speaker_labels=True,
        language_code="pt",
    )
    transcriber = aai.Transcriber()
    result = transcriber.transcribe(file_path, config=config)

    if result.status == aai.TranscriptStatus.error:
        raise Exception(f"AssemblyAI: {result.error}")

    # Mapeia speakers em ordem de aparição: A → [MÉDICO], B → [PACIENTE], C+ → [FALANTE X]
    _labels = ["[MÉDICO]", "[PACIENTE]"]
    speaker_map: dict[str, str] = {}
    lines = []

    for utterance in result.utterances:
        if utterance.speaker not in speaker_map:
            idx = len(speaker_map)
            speaker_map[utterance.speaker] = (
                _labels[idx] if idx < len(_labels) else f"[FALANTE {utterance.speaker}]"
            )
        lines.append(f"{speaker_map[utterance.speaker]}: {utterance.text}")

    transcript = "\n".join(lines)
    logger.info(
        "[AssemblyAI] Diarização concluída: %d falas, %d speakers [%s]",
        len(lines), len(speaker_map), consultation_id,
    )

    encrypted, iv = encrypt_text(transcript)
    expires_at = datetime.now(timezone.utc) + timedelta(days=TRANSCRIPT_TTL_DAYS)
    repo.save_transcript(consultation_id, encrypted, iv, expires_at)


def process(consultation_id: str, file_path: str, live_transcript: str | None = None) -> None:
    """Pipeline de transcrição + diarização.
    WHISPER_MODEL=assemblyai → AssemblyAI cloud (diarização real)
    WHISPER_MODEL=mock       → transcrição simulada (sem API key)
    outro valor              → WhisperX + pyannote local (produção)
    """
    try:
        mode = os.environ.get("WHISPER_MODEL", "mock")

        if mode == "mock":
            _mock_process(consultation_id, live_transcript)
            return

        if mode == "assemblyai":
            _assemblyai_process(consultation_id, file_path)
            return

        import whisperx
        from pyannote.audio import Pipeline

        repo.update_status(consultation_id, ConsultationStatus.PROCESSING.value)
        logger.info("Iniciando transcrição [%s]", consultation_id)

        # 1. Transcrição com WhisperX
        # Em produção usar "large-v3-turbo"; localmente usar "small" ou "base" (menos RAM)
        whisper_model = mode
        model = whisperx.load_model(
            whisper_model,
            device="cpu",
            language="pt",
            compute_type="int8",
        )
        audio = whisperx.load_audio(file_path)
        result = model.transcribe(audio, language="pt")

        # 2. Alinhamento de timestamps
        model_a, metadata = whisperx.load_align_model(language_code="pt", device="cpu")
        result = whisperx.align(
            result["segments"], model_a, metadata, audio, device="cpu"
        )

        # 3. Diarização com pyannote
        huggingface_token = os.environ["HUGGINGFACE_TOKEN"]
        diarize_pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=huggingface_token,
        )
        diarize_segments = diarize_pipeline(file_path)

        # 4. Atribuir speakers aos segmentos
        result = whisperx.assign_word_speakers(diarize_segments, result)

        # 5. Formatar transcrição diarizada
        transcript = _format_transcript(result["segments"])
        logger.info("Transcrição gerada: %d palavras [%s]", len(transcript.split()), consultation_id)

        # 6. Criptografar (LGPD — dados em repouso)
        encrypted, iv = encrypt_text(transcript)

        # 7. Salvar no banco com TTL de 30 dias
        expires_at = datetime.now(timezone.utc) + timedelta(days=TRANSCRIPT_TTL_DAYS)
        repo.save_transcript(consultation_id, encrypted, iv, expires_at)
        logger.info("Transcrição salva com sucesso [%s]", consultation_id)

    except Exception as e:
        logger.error("Erro no pipeline [%s]: %s", consultation_id, e, exc_info=True)
        repo.update_status(
            consultation_id,
            ConsultationStatus.ERROR.value,
            error_msg=f"[DEBUG] {type(e).__name__}: {e}",
        )

    finally:
        # LGPD — minimização de dados: deletar áudio após processamento
        # Usa os.remove diretamente (sem if exists) para evitar race condition TOCTOU
        try:
            os.remove(file_path)
            logger.info("Áudio deletado (LGPD) [%s]", consultation_id)
        except FileNotFoundError:
            pass  # já foi deletado, nenhuma ação necessária
        except Exception as e:
            logger.warning("Falha ao deletar áudio [%s]: %s", consultation_id, e)

        # Limpar referência ao arquivo deletado no banco
        try:
            repo.clear_audio_path(consultation_id)
        except Exception as e:
            logger.warning("Falha ao limpar audio_path no banco [%s]: %s", consultation_id, e)
