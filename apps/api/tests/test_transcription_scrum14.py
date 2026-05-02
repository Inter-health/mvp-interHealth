"""
Testes de aceitação SCRUM-14 — Validar transcrição antes de salvar.
Cobre _validate_transcript() e sua integração nos 3 pipelines: mock, AssemblyAI e WhisperX.
"""
import sys
from unittest.mock import MagicMock

# Mockar whisperx e pyannote para evitar download de modelos pesados
_whisperx_mock = MagicMock()
_pyannote_mock = MagicMock()
sys.modules.setdefault("whisperx", _whisperx_mock)
sys.modules.setdefault("pyannote", MagicMock())
sys.modules.setdefault("pyannote.audio", _pyannote_mock)

from unittest.mock import patch

import pytest


# ---------------------------------------------------------------------------
# Fixtures de ambiente
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def env_vars(monkeypatch):
    from cryptography.fernet import Fernet
    monkeypatch.setenv("TRANSCRIPT_ENCRYPTION_KEY", Fernet.generate_key().decode())
    monkeypatch.setenv("JWT_SECRET", "secret-para-testes-minimo-32-chars!!")
    monkeypatch.setenv("HUGGINGFACE_TOKEN", "hf_test_token")


@pytest.fixture()
def mock_repo():
    with patch("services.transcription.repo") as m:
        yield m


# ---------------------------------------------------------------------------
# Testes unitários de _validate_transcript
# ---------------------------------------------------------------------------

class TestValidateTranscript:
    def test_transcript_valido_retorna_lista_vazia(self):
        from services.transcription import _validate_transcript
        transcript = "[MÉDICO]: " + "palavra " * 20
        errors = _validate_transcript(transcript, speakers={"SPEAKER_00", "SPEAKER_01"})
        assert errors == []

    def test_transcript_vazio_retorna_erro(self):
        from services.transcription import _validate_transcript
        errors = _validate_transcript("", speakers={"SPEAKER_00"})
        assert any("vazia" in e.lower() for e in errors)

    def test_transcript_apenas_espacos_retorna_erro(self):
        from services.transcription import _validate_transcript
        errors = _validate_transcript("   ", speakers={"SPEAKER_00"})
        assert any("vazia" in e.lower() for e in errors)

    def test_transcript_curto_retorna_erro(self):
        from services.transcription import _validate_transcript
        errors = _validate_transcript("[MÉDICO]: apenas cinco palavras aqui.", speakers={"SPEAKER_00"})
        assert any("curta" in e.lower() or "20" in e for e in errors)

    def test_transcript_com_exatamente_20_palavras_e_valido(self):
        from services.transcription import _validate_transcript
        transcript = " ".join(["palavra"] * 20)
        errors = _validate_transcript(transcript, speakers={"SPEAKER_00"})
        assert errors == []

    def test_sem_speakers_retorna_erro(self):
        from services.transcription import _validate_transcript
        transcript = "[MÉDICO]: " + "palavra " * 20
        errors = _validate_transcript(transcript, speakers=set())
        assert any("speaker" in e.lower() for e in errors)

    def test_speakers_none_ignora_verificacao_de_speaker(self):
        from services.transcription import _validate_transcript
        transcript = "[MÉDICO]: " + "palavra " * 20
        # speakers=None → não verifica speakers (modo mock)
        errors = _validate_transcript(transcript, speakers=None)
        assert errors == []

    def test_multiplos_erros_retornados(self):
        from services.transcription import _validate_transcript
        errors = _validate_transcript("", speakers=set())
        assert len(errors) >= 2


# ---------------------------------------------------------------------------
# Testes de integração — pipeline mock
# ---------------------------------------------------------------------------

class TestMockPipelineValidation:
    def test_live_transcript_curto_resulta_em_error(self, mock_repo, monkeypatch):
        """Transcrição ao vivo com menos de 20 palavras → status ERROR."""
        monkeypatch.setenv("WHISPER_MODEL", "mock")

        from services.transcription import process
        process("consulta-abc", "/tmp/fake.wav", live_transcript="Olá doutor, estou bem.")

        mock_repo.update_status.assert_called_with(
            "consulta-abc", "ERROR", error_msg="Transcrição muito curta (menos de 20 palavras)."
        )
        mock_repo.save_transcript.assert_not_called()

    def test_live_transcript_vazio_resulta_em_error(self, mock_repo, monkeypatch):
        """live_transcript vazio sem fallback gera transcript vazio → status ERROR."""
        monkeypatch.setenv("WHISPER_MODEL", "mock")

        # Forçar _mock_diarize a retornar string vazia sobrescrevendo o _MOCK_TRANSCRIPT
        with patch("services.transcription._MOCK_TRANSCRIPT", ""):
            from services.transcription import process
            process("consulta-abc", "/tmp/fake.wav", live_transcript="   ")

        mock_repo.update_status.assert_called_with(
            "consulta-abc", "ERROR", error_msg="Transcrição vazia."
        )
        mock_repo.save_transcript.assert_not_called()

    def test_mock_transcript_padrao_e_salvo(self, mock_repo, monkeypatch):
        """Transcript de exemplo padrão tem >20 palavras → deve ser salvo com sucesso."""
        monkeypatch.setenv("WHISPER_MODEL", "mock")

        from services.transcription import process
        process("consulta-ok", "/tmp/fake.wav")

        mock_repo.save_transcript.assert_called_once()
        mock_repo.update_status.assert_any_call("consulta-ok", "PROCESSING")


# ---------------------------------------------------------------------------
# Testes de integração — pipeline AssemblyAI
# ---------------------------------------------------------------------------

class TestAssemblyAIPipelineValidation:
    def _make_utterance(self, speaker: str, text: str):
        u = MagicMock()
        u.speaker = speaker
        u.text = text
        return u

    def test_transcript_curto_via_assemblyai_resulta_em_error(self, mock_repo, monkeypatch):
        """AssemblyAI retorna transcript com < 20 palavras → status ERROR."""
        monkeypatch.setenv("WHISPER_MODEL", "assemblyai")
        monkeypatch.setenv("ASSEMBLYAI_API_KEY", "aai_test_key")

        short_utterances = [self._make_utterance("A", "Olá doutor.")]

        aai_mock = MagicMock()
        aai_mock.settings = MagicMock()
        mock_transcript = MagicMock()
        mock_transcript.status = MagicMock()
        mock_transcript.utterances = short_utterances
        # status != error
        aai_mock.TranscriptStatus.error = "error"
        mock_transcript.status = "completed"
        aai_mock.Transcriber.return_value.transcribe.return_value = mock_transcript

        with patch.dict(sys.modules, {"assemblyai": aai_mock}):
            from services.transcription import process
            process("consulta-short", "/tmp/fake.wav")

        mock_repo.update_status.assert_called_with(
            "consulta-short", "ERROR", error_msg=pytest.approx("ValueError: Transcrição muito curta (menos de 20 palavras).", abs=0)
        )
        mock_repo.save_transcript.assert_not_called()

    def test_sem_utterances_via_assemblyai_resulta_em_error(self, mock_repo, monkeypatch):
        """AssemblyAI retorna 0 utterances (nenhum speaker) → status ERROR."""
        monkeypatch.setenv("WHISPER_MODEL", "assemblyai")
        monkeypatch.setenv("ASSEMBLYAI_API_KEY", "aai_test_key")

        aai_mock = MagicMock()
        aai_mock.settings = MagicMock()
        mock_transcript = MagicMock()
        aai_mock.TranscriptStatus.error = "error"
        mock_transcript.status = "completed"
        mock_transcript.utterances = []
        aai_mock.Transcriber.return_value.transcribe.return_value = mock_transcript

        with patch.dict(sys.modules, {"assemblyai": aai_mock}):
            from services.transcription import process
            process("consulta-nospeaker", "/tmp/fake.wav")

        mock_repo.update_status.assert_called_with(
            "consulta-nospeaker", "ERROR", error_msg=pytest.approx("ValueError: Transcrição vazia.; Nenhum speaker identificado.", abs=0)
        )
        mock_repo.save_transcript.assert_not_called()
