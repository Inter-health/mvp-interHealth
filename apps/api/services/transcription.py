import logging
import os
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


def process(consultation_id: str, file_path: str) -> None:
    """Pipeline completo: transcrição WhisperX + diarização pyannote.
    Executado em background pelo FastAPI BackgroundTasks.
    """
    try:
        import whisperx
        from pyannote.audio import Pipeline

        repo.update_status(consultation_id, ConsultationStatus.PROCESSING.value)
        logger.info("Iniciando transcrição [%s]", consultation_id)

        # 1. Transcrição com WhisperX
        model = whisperx.load_model(
            "large-v3-turbo",
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
        # Log detalhado interno — mensagem genérica ao usuário (evita vazamento de stack trace)
        logger.error("Erro no pipeline [%s]: %s", consultation_id, e, exc_info=True)
        repo.update_status(
            consultation_id,
            ConsultationStatus.ERROR.value,
            error_msg="Erro ao processar áudio.",
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
