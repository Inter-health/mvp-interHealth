"""
Testes de aceitação SCRUM-27 — Pipeline WhisperX + pyannote.
whisperx e pyannote são mockados via sys.modules para evitar download de modelos.
"""
import sys
from unittest.mock import MagicMock

# Mockar whisperx e pyannote para que os lazy imports dentro de process() recebam mocks
_whisperx_mock = MagicMock()
_pyannote_mock = MagicMock()
sys.modules["whisperx"] = _whisperx_mock
sys.modules["pyannote"] = MagicMock()
sys.modules["pyannote.audio"] = _pyannote_mock

import os
from datetime import datetime, timezone
from unittest.mock import patch

import pytest


# ---------------------------------------------------------------------------
# Fixtures de ambiente
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def env_vars(monkeypatch):
    monkeypatch.setenv("HUGGINGFACE_TOKEN", "hf_test_token")
    from cryptography.fernet import Fernet
    monkeypatch.setenv("TRANSCRIPT_ENCRYPTION_KEY", Fernet.generate_key().decode())
    monkeypatch.setenv("JWT_SECRET", "secret-para-testes-minimo-32-chars!!")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _seg(text: str, speaker: str) -> dict:
    return {"text": text, "start": 0.0, "end": 1.0, "speaker": speaker, "words": []}


FAKE_SEGMENTS = [
    _seg("Como você está?", "SPEAKER_00"),
    _seg("Estou bem, obrigado.", "SPEAKER_01"),
]
FAKE_RESULT = {"segments": FAKE_SEGMENTS, "language": "pt"}


# ---------------------------------------------------------------------------
# Fixtures de mock do pipeline
# ---------------------------------------------------------------------------

@pytest.fixture()
def mock_whisperx():
    mock = MagicMock()
    mock.load_model.return_value = MagicMock(transcribe=MagicMock(return_value=FAKE_RESULT))
    mock.load_audio.return_value = MagicMock()
    mock.load_align_model.return_value = (MagicMock(), MagicMock())
    mock.align.return_value = FAKE_RESULT
    mock.assign_word_speakers.return_value = FAKE_RESULT
    sys.modules["whisperx"] = mock
    yield mock
    sys.modules["whisperx"] = _whisperx_mock


@pytest.fixture()
def mock_pyannote():
    mock_module = MagicMock()
    mock_pipeline = MagicMock()
    mock_pipeline.from_pretrained.return_value = MagicMock(return_value=MagicMock())
    mock_module.Pipeline = mock_pipeline
    sys.modules["pyannote.audio"] = mock_module
    yield mock_pipeline
    sys.modules["pyannote.audio"] = _pyannote_mock


@pytest.fixture()
def mock_repo():
    with patch("services.transcription.repo") as m:
        yield m


# ---------------------------------------------------------------------------
# Testes de _format_transcript
# ---------------------------------------------------------------------------

class TestFormatTranscript:
    def test_medico_e_paciente_identificados(self):
        from services.transcription import _format_transcript
        segments = [
            _seg("Bom dia, como você está?", "SPEAKER_00"),
            _seg("Tenho sentido dores de cabeça.", "SPEAKER_01"),
        ]
        result = _format_transcript(segments)
        assert "[MÉDICO]: Bom dia, como você está?" in result
        assert "[PACIENTE]: Tenho sentido dores de cabeça." in result

    def test_falas_consecutivas_agrupadas(self):
        from services.transcription import _format_transcript
        segments = [
            _seg("Primeira frase.", "SPEAKER_00"),
            _seg("Segunda frase.", "SPEAKER_00"),
        ]
        result = _format_transcript(segments)
        assert result.count("[MÉDICO]:") == 1
        assert "Primeira frase. Segunda frase." in result

    def test_speaker_desconhecido_recebe_label_generico(self):
        from services.transcription import _format_transcript
        result = _format_transcript([_seg("Texto.", "SPEAKER_02")])
        assert "[FALANTE 02]:" in result

    def test_segmentos_vazios_ignorados(self):
        from services.transcription import _format_transcript
        segments = [
            _seg("", "SPEAKER_00"),
            _seg("Texto válido.", "SPEAKER_01"),
        ]
        result = _format_transcript(segments)
        assert "[MÉDICO]" not in result
        assert "[PACIENTE]: Texto válido." in result


# ---------------------------------------------------------------------------
# Testes do pipeline process()
# ---------------------------------------------------------------------------

class TestProcessPipeline:
    def test_pipeline_completo_salva_transcript(
        self, mock_whisperx, mock_pyannote, mock_repo, tmp_path
    ):
        audio = tmp_path / "consulta.wav"
        audio.write_bytes(b"fake-audio")

        from services.transcription import process
        process("consulta-123", str(audio))

        mock_repo.update_status.assert_any_call("consulta-123", "PROCESSING")
        mock_repo.save_transcript.assert_called_once()
        consultation_id, encrypted, iv, _ = mock_repo.save_transcript.call_args[0]
        assert consultation_id == "consulta-123"
        assert isinstance(encrypted, str) and len(encrypted) > 0

    def test_audio_deletado_apos_processamento(
        self, mock_whisperx, mock_pyannote, mock_repo, tmp_path
    ):
        audio = tmp_path / "consulta.wav"
        audio.write_bytes(b"fake-audio")

        from services.transcription import process
        process("consulta-123", str(audio))

        assert not audio.exists()

    def test_status_error_em_falha_do_modelo(self, mock_pyannote, mock_repo, tmp_path):
        audio = tmp_path / "consulta.wav"
        audio.write_bytes(b"fake-audio")

        failing = MagicMock(load_model=MagicMock(side_effect=RuntimeError("Modelo não carregou")))
        sys.modules["whisperx"] = failing

        from services.transcription import process
        process("consulta-123", str(audio))

        sys.modules["whisperx"] = _whisperx_mock
        # error_msg deve ser genérico (não expõe stack trace ao usuário)
        mock_repo.update_status.assert_called_with(
            "consulta-123", "ERROR", error_msg="Erro ao processar áudio."
        )

    def test_audio_deletado_mesmo_em_caso_de_erro(
        self, mock_pyannote, mock_repo, tmp_path
    ):
        audio = tmp_path / "consulta.wav"
        audio.write_bytes(b"fake-audio")

        failing = MagicMock(load_model=MagicMock(side_effect=RuntimeError("Falha")))
        sys.modules["whisperx"] = failing

        from services.transcription import process
        process("consulta-123", str(audio))

        sys.modules["whisperx"] = _whisperx_mock
        assert not audio.exists()

    def test_huggingface_token_passado_ao_pipeline(
        self, mock_whisperx, mock_pyannote, mock_repo, tmp_path
    ):
        audio = tmp_path / "consulta.wav"
        audio.write_bytes(b"fake-audio")

        from services.transcription import process
        process("consulta-123", str(audio))

        mock_pyannote.from_pretrained.assert_called_once_with(
            "pyannote/speaker-diarization-3.1",
            use_auth_token="hf_test_token",
        )

    def test_transcript_expires_em_30_dias(
        self, mock_whisperx, mock_pyannote, mock_repo, tmp_path
    ):
        audio = tmp_path / "consulta.wav"
        audio.write_bytes(b"fake-audio")

        from services.transcription import process, TRANSCRIPT_TTL_DAYS
        process("consulta-123", str(audio))

        _, _, _, expires_at = mock_repo.save_transcript.call_args[0]
        delta = expires_at - datetime.now(timezone.utc)
        assert TRANSCRIPT_TTL_DAYS - 1 <= delta.days <= TRANSCRIPT_TTL_DAYS
