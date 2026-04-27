"""
Testes de aceite — SCRUM-35: Integração Front-End com Back-End

Cobre os dois endpoints novos implementados para a integração:
  - GET /users/me
  - GET /consultations
"""
import os
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
import pytest
from fastapi.testclient import TestClient

from main import app

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
OTHER_USER_ID = "00000000-0000-0000-0000-000000000002"

client = TestClient(app)


def _make_token(user_id: str = TEST_USER_ID, expired: bool = False) -> str:
    secret = os.environ.get("JWT_SECRET", "test-secret-key-for-tests-only")
    exp = datetime.now(timezone.utc) + (timedelta(hours=-1) if expired else timedelta(hours=12))
    return jwt.encode({"sub": user_id, "exp": exp, "iat": datetime.now(timezone.utc)}, secret, algorithm="HS256")


def _auth(user_id: str = TEST_USER_ID, expired: bool = False) -> dict:
    return {"authorization": f"Bearer {_make_token(user_id, expired)}"}


FAKE_USER = {
    "id": TEST_USER_ID,
    "name": "João Silva",
    "crm": "12345-SP",
    "email": "joao@email.com",
    "specialty": "Clínica Geral",
    "ehr_provider": "iClinic",
    "terms_accepted": True,
}

FAKE_CONSULTATIONS = [
    {
        "id": "cccc0001-0000-0000-0000-000000000000",
        "patient_name": "Maria Oliveira",
        "status": "TRANSCRIBED",
        "created_at": "2026-04-23T10:00:00+00:00",
        "error_msg": None,
        "patient_consent": True,
    },
    {
        "id": "cccc0002-0000-0000-0000-000000000000",
        "patient_name": "Carlos Souza",
        "status": "PROCESSING",
        "created_at": "2026-04-23T09:00:00+00:00",
        "error_msg": None,
        "patient_consent": True,
    },
]


# ══════════════════════════════════════════════════════════════
# GET /users/me
# ══════════════════════════════════════════════════════════════

class TestGetUsersMe:
    """GET /users/me — retorna dados do médico autenticado."""

    def test_returns_200_with_valid_token(self):
        with patch("repositories.users.get_by_id", return_value=FAKE_USER):
            res = client.get("/users/me", headers=_auth())
        assert res.status_code == 200

    def test_response_contains_required_fields(self):
        with patch("repositories.users.get_by_id", return_value=FAKE_USER):
            body = client.get("/users/me", headers=_auth()).json()
        assert body["id"] == TEST_USER_ID
        assert body["name"] == "João Silva"
        assert body["crm"] == "12345-SP"
        assert body["email"] == "joao@email.com"
        assert body["specialty"] == "Clínica Geral"

    def test_response_does_not_contain_password_hash(self):
        user_with_hash = {**FAKE_USER, "password_hash": "$2b$12$..."}
        with patch("repositories.users.get_by_id", return_value=user_with_hash):
            body = client.get("/users/me", headers=_auth()).json()
        assert "password_hash" not in body

    def test_without_token_returns_401(self):
        res = client.get("/users/me")
        assert res.status_code == 401

    def test_expired_token_returns_401(self):
        res = client.get("/users/me", headers=_auth(expired=True))
        assert res.status_code == 401

    def test_invalid_token_returns_401(self):
        res = client.get("/users/me", headers={"authorization": "Bearer token.invalido"})
        assert res.status_code == 401

    def test_user_not_found_in_db_returns_404(self):
        with patch("repositories.users.get_by_id", return_value=None):
            res = client.get("/users/me", headers=_auth())
        assert res.status_code == 404

    def test_ehrprovider_mapped_from_ehr_provider_column(self):
        """ehr_provider (snake_case do banco) deve ser exposto como ehrProvider."""
        with patch("repositories.users.get_by_id", return_value=FAKE_USER):
            body = client.get("/users/me", headers=_auth()).json()
        assert body["ehrProvider"] == "iClinic"

    def test_nullable_specialty_returns_empty_string(self):
        user = {**FAKE_USER, "specialty": None}
        with patch("repositories.users.get_by_id", return_value=user):
            body = client.get("/users/me", headers=_auth()).json()
        assert body["specialty"] == ""


# ══════════════════════════════════════════════════════════════
# GET /consultations
# ══════════════════════════════════════════════════════════════

class TestListConsultations:
    """GET /consultations — lista consultas do médico autenticado."""

    def test_returns_200_with_valid_token(self):
        with patch("repositories.consultations.list_by_user", return_value=FAKE_CONSULTATIONS):
            res = client.get("/consultations", headers=_auth())
        assert res.status_code == 200

    def test_returns_list_of_consultations(self):
        with patch("repositories.consultations.list_by_user", return_value=FAKE_CONSULTATIONS):
            body = client.get("/consultations", headers=_auth()).json()
        assert isinstance(body, list)
        assert len(body) == 2

    def test_consultation_item_has_required_fields(self):
        with patch("repositories.consultations.list_by_user", return_value=FAKE_CONSULTATIONS):
            body = client.get("/consultations", headers=_auth()).json()
        item = body[0]
        assert "id" in item
        assert "patient_name" in item
        assert "status" in item
        assert "created_at" in item

    def test_consultation_item_does_not_expose_transcript(self):
        """Listagem não deve expor transcrição (dado sensível — só em /status)."""
        consultation_with_transcript = {**FAKE_CONSULTATIONS[0], "transcript_encrypted": "dados-cifrados"}
        with patch("repositories.consultations.list_by_user", return_value=[consultation_with_transcript]):
            body = client.get("/consultations", headers=_auth()).json()
        assert "transcript" not in body[0]
        assert "transcript_encrypted" not in body[0]

    def test_empty_list_when_no_consultations(self):
        with patch("repositories.consultations.list_by_user", return_value=[]):
            body = client.get("/consultations", headers=_auth()).json()
        assert body == []

    def test_without_token_returns_401(self):
        res = client.get("/consultations")
        assert res.status_code == 401

    def test_expired_token_returns_401(self):
        res = client.get("/consultations", headers=_auth(expired=True))
        assert res.status_code == 401

    def test_filter_by_patient_name_passes_to_repository(self):
        """Query param patient_name deve ser repassado ao repository."""
        with patch("repositories.consultations.list_by_user", return_value=[FAKE_CONSULTATIONS[0]]) as mock_repo:
            client.get("/consultations?patient_name=Maria", headers=_auth())
        mock_repo.assert_called_once_with(TEST_USER_ID, "Maria")

    def test_without_filter_passes_none_to_repository(self):
        with patch("repositories.consultations.list_by_user", return_value=FAKE_CONSULTATIONS) as mock_repo:
            client.get("/consultations", headers=_auth())
        mock_repo.assert_called_once_with(TEST_USER_ID, None)

    def test_only_returns_authenticated_user_consultations(self):
        """Repository deve ser chamado com o user_id do token, nunca de outro usuário."""
        with patch("repositories.consultations.list_by_user", return_value=[]) as mock_repo:
            client.get("/consultations", headers=_auth(OTHER_USER_ID))
        mock_repo.assert_called_once_with(OTHER_USER_ID, None)

    def test_status_values_are_valid(self):
        valid_statuses = {"PENDING", "PROCESSING", "TRANSCRIBED", "ERROR", "RECORDING"}
        with patch("repositories.consultations.list_by_user", return_value=FAKE_CONSULTATIONS):
            body = client.get("/consultations", headers=_auth()).json()
        for item in body:
            assert item["status"] in valid_statuses
