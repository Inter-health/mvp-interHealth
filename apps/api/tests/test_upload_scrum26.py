"""
Testes de aceite — SCRUM-26: Endpoint de upload e validação de arquivo de áudio
Critérios:
  - Formatos válidos (.wav, .mp3, .m4a, .webm) + MIME correto → 202
  - Formato inválido → 422 com mensagem descritiva
  - Arquivo muito grande (>100 MB) → 422
  - Sem autenticação → 401
  - Token inválido → 401
  - Token expirado → 401
  - Background task agendada após upload válido
"""
import io
import os
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock

import jwt
import pytest
from fastapi.testclient import TestClient

from main import app
from core.security import get_current_user

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
UPLOAD_URL = "/consultations/upload"

client = TestClient(app)


def _make_token(user_id: str = TEST_USER_ID, expired: bool = False) -> str:
    secret = os.environ.get("JWT_SECRET", "test-secret-key-for-tests-only")
    exp = datetime.now(timezone.utc) + (timedelta(hours=-1) if expired else timedelta(hours=12))
    return jwt.encode({"sub": user_id, "exp": exp, "iat": datetime.now(timezone.utc)}, secret, algorithm="HS256")


def _auth_headers(token: str | None = None) -> dict:
    return {"authorization": f"Bearer {token or _make_token()}"}


def _audio_file(filename: str = "consulta.wav", content_type: str = "audio/wav", size: int = 1024):
    return ("audio_file", (filename, io.BytesIO(b"x" * size), content_type))


@pytest.fixture(autouse=True)
def mock_db_calls():
    """Evita chamadas reais ao Supabase durante os testes."""
    fake_consultation = {"id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"}
    with patch("repositories.consultations.create", return_value=fake_consultation) as mock_create, \
         patch("repositories.consultations.update_status") as mock_update:
        yield mock_create, mock_update


class TestUploadValidFormats:
    """SCRUM-26 — Formatos e MIME types válidos retornam 202."""

    @pytest.mark.parametrize("filename,content_type", [
        ("audio.wav",  "audio/wav"),
        ("audio.mp3",  "audio/mpeg"),
        ("audio.m4a",  "audio/mp4"),
        ("audio.webm", "audio/webm"),
    ])
    def test_valid_format_returns_202(self, filename, content_type):
        res = client.post(
            UPLOAD_URL,
            headers=_auth_headers(),
            files=[_audio_file(filename, content_type)],
        )
        assert res.status_code == 202

    def test_response_contains_consultation_id_and_status(self):
        res = client.post(
            UPLOAD_URL,
            headers=_auth_headers(),
            files=[_audio_file()],
        )
        body = res.json()
        assert "consultation_id" in body
        assert body["status"] == "PENDING"
        assert "message" in body

    def test_optional_patient_name_accepted(self):
        res = client.post(
            UPLOAD_URL,
            headers=_auth_headers(),
            files=[_audio_file()],
            data={"patient_name": "Maria Silva", "patient_consent": "true"},
        )
        assert res.status_code == 202

    def test_patient_consent_defaults_to_false(self, mock_db_calls):
        mock_create, _ = mock_db_calls
        client.post(
            UPLOAD_URL,
            headers=_auth_headers(),
            files=[_audio_file()],
        )
        _, kwargs = mock_create.call_args if mock_create.call_args else (None, {})
        args = mock_create.call_args[0] if mock_create.call_args else []
        assert args[2] is False  # patient_consent


class TestUploadInvalidFormats:
    """SCRUM-26 — Formatos inválidos retornam 422 com mensagem descritiva."""

    @pytest.mark.parametrize("filename,content_type", [
        ("documento.pdf", "application/pdf"),
        ("video.mp4",     "video/mp4"),
        ("imagem.png",    "image/png"),
        ("texto.txt",     "text/plain"),
    ])
    def test_invalid_format_returns_422(self, filename, content_type):
        res = client.post(
            UPLOAD_URL,
            headers=_auth_headers(),
            files=[_audio_file(filename, content_type)],
        )
        assert res.status_code == 422

    def test_invalid_format_detail_is_descriptive(self):
        res = client.post(
            UPLOAD_URL,
            headers=_auth_headers(),
            files=[_audio_file("arquivo.pdf", "application/pdf")],
        )
        assert res.status_code == 422
        assert "pdf" in res.json()["detail"].lower() or "formato" in res.json()["detail"].lower()

    def test_wrong_mime_type_for_valid_extension_returns_422(self):
        """Extensão .wav com MIME type errado deve ser rejeitado."""
        res = client.post(
            UPLOAD_URL,
            headers=_auth_headers(),
            files=[_audio_file("audio.wav", "application/octet-stream")],
        )
        assert res.status_code == 422


class TestUploadFileSizeLimit:
    """SCRUM-26 — Arquivos acima de 100 MB retornam 422."""

    def test_file_over_100mb_returns_422(self):
        over_limit = 100 * 1024 * 1024 + 1
        res = client.post(
            UPLOAD_URL,
            headers=_auth_headers(),
            files=[_audio_file("grande.wav", "audio/wav", size=over_limit)],
        )
        assert res.status_code == 422

    def test_file_over_limit_detail_mentions_size(self):
        over_limit = 100 * 1024 * 1024 + 1
        res = client.post(
            UPLOAD_URL,
            headers=_auth_headers(),
            files=[_audio_file("grande.wav", "audio/wav", size=over_limit)],
        )
        detail = res.json()["detail"].lower()
        assert "100" in detail or "grande" in detail or "limite" in detail

    def test_file_exactly_100mb_is_accepted(self):
        exact_limit = 100 * 1024 * 1024
        res = client.post(
            UPLOAD_URL,
            headers=_auth_headers(),
            files=[_audio_file("limite.wav", "audio/wav", size=exact_limit)],
        )
        assert res.status_code == 202


class TestUploadAuthentication:
    """SCRUM-26 — Endpoint exige autenticação JWT válida."""

    def test_missing_auth_header_returns_401(self):
        res = client.post(UPLOAD_URL, files=[_audio_file()])
        assert res.status_code == 401

    def test_invalid_token_returns_401(self):
        res = client.post(
            UPLOAD_URL,
            headers={"authorization": "Bearer token.invalido.aqui"},
            files=[_audio_file()],
        )
        assert res.status_code == 401

    def test_expired_token_returns_401(self):
        expired_token = _make_token(expired=True)
        res = client.post(
            UPLOAD_URL,
            headers=_auth_headers(expired_token),
            files=[_audio_file()],
        )
        assert res.status_code == 401

    def test_malformed_bearer_returns_401(self):
        res = client.post(
            UPLOAD_URL,
            headers={"authorization": "Basic dXNlcjpwYXNz"},
            files=[_audio_file()],
        )
        assert res.status_code == 401


class TestUploadBackgroundTask:
    """SCRUM-26 — Background task é agendada após upload válido."""

    def test_background_task_scheduled_on_valid_upload(self):
        with patch("routers.consultations._process_audio_stub") as mock_task:
            res = client.post(
                UPLOAD_URL,
                headers=_auth_headers(),
                files=[_audio_file()],
            )
            assert res.status_code == 202
            mock_task.assert_called_once()

    def test_background_task_receives_consultation_id_and_path(self):
        with patch("routers.consultations._process_audio_stub") as mock_task:
            client.post(
                UPLOAD_URL,
                headers=_auth_headers(),
                files=[_audio_file("audio.wav", "audio/wav")],
            )
            args = mock_task.call_args[0]
            consultation_id, file_path = args[0], args[1]
            assert isinstance(consultation_id, str) and len(consultation_id) > 0
            assert file_path.endswith(".wav")
