"""
Testes de aceitação — Ownership de pacientes e security headers (PR #22).

Cobre:
- POST /patients cria paciente normalmente → 201
- GET  /patients/{id} com JWT de outro médico → 403
- PATCH /patients/{id} com JWT de outro médico → 403
- GET  /patients/{id} inexistente → 404
- Response headers incluem X-Frame-Options: DENY
"""
import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from core.security import get_current_user
from main import app

OWNER_ID = "owner-uuid-111"
OTHER_ID = "other-uuid-222"
PATIENT_ID = str(uuid.uuid4())


def _patient(user_id: str = OWNER_ID) -> dict:
    return {
        "id": PATIENT_ID,
        "user_id": user_id,
        "name": "Paciente Teste",
        "cpf": None,
        "date_of_birth": None,
        "gender": None,
        "phone": None,
        "email": None,
        "notes": None,
        "created_at": "2026-01-01T00:00:00+00:00",
        "updated_at": "2026-01-01T00:00:00+00:00",
    }


# ---------------------------------------------------------------------------
# Fixtures — dependency_overrides para autenticação sem JWT real
# ---------------------------------------------------------------------------

@pytest.fixture()
def as_owner():
    """Autentica requisições como médico dono (OWNER_ID)."""
    app.dependency_overrides[get_current_user] = lambda: OWNER_ID
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def as_other():
    """Autentica requisições como outro médico (OTHER_ID)."""
    app.dependency_overrides[get_current_user] = lambda: OTHER_ID
    yield TestClient(app)
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# POST /patients — criação normal
# ---------------------------------------------------------------------------

class TestCreatePatient:
    def test_cria_paciente_retorna_201(self, as_owner):
        """POST /patients com dados válidos retorna 201 e o paciente criado."""
        with patch("repositories.patients.create", return_value=_patient()):
            res = as_owner.post("/patients", json={"name": "Paciente Teste"})

        assert res.status_code == 201
        assert res.json()["name"] == "Paciente Teste"
        assert res.json()["id"] == PATIENT_ID

    def test_cria_paciente_sem_nome_retorna_422(self, as_owner):
        """POST /patients sem nome retorna 422."""
        res = as_owner.post("/patients", json={})
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# GET /patients/{id} — ownership
# ---------------------------------------------------------------------------

class TestGetPatientOwnership:
    def test_dono_acessa_proprio_paciente_200(self, as_owner):
        """GET /patients/{id} pelo dono do paciente retorna 200."""
        with patch("repositories.patients.get_by_id", return_value=_patient(OWNER_ID)):
            res = as_owner.get(f"/patients/{PATIENT_ID}")

        assert res.status_code == 200
        assert res.json()["id"] == PATIENT_ID

    def test_outro_medico_recebe_403(self, as_other):
        """GET /patients/{id} por médico diferente retorna 403."""
        with patch("repositories.patients.get_by_id", return_value=_patient(OWNER_ID)):
            res = as_other.get(f"/patients/{PATIENT_ID}")

        assert res.status_code == 403

    def test_paciente_inexistente_retorna_404(self, as_owner):
        """GET /patients/{id} inexistente retorna 404."""
        with patch("repositories.patients.get_by_id", return_value=None):
            res = as_owner.get(f"/patients/{PATIENT_ID}")

        assert res.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /patients/{id} — ownership
# ---------------------------------------------------------------------------

class TestUpdatePatientOwnership:
    def test_dono_atualiza_proprio_paciente_200(self, as_owner):
        """PATCH /patients/{id} pelo dono retorna 200."""
        updated = {**_patient(OWNER_ID), "name": "Nome Atualizado"}
        with patch("repositories.patients.get_by_id", return_value=_patient(OWNER_ID)), \
             patch("repositories.patients.update", return_value=updated):
            res = as_owner.patch(f"/patients/{PATIENT_ID}", json={"name": "Nome Atualizado"})

        assert res.status_code == 200
        assert res.json()["name"] == "Nome Atualizado"

    def test_outro_medico_patch_recebe_403(self, as_other):
        """PATCH /patients/{id} por médico diferente retorna 403."""
        with patch("repositories.patients.get_by_id", return_value=_patient(OWNER_ID)):
            res = as_other.patch(f"/patients/{PATIENT_ID}", json={"name": "Tentativa"})

        assert res.status_code == 403

    def test_patch_paciente_inexistente_retorna_404(self, as_owner):
        """PATCH /patients/{id} inexistente retorna 404."""
        with patch("repositories.patients.get_by_id", return_value=None):
            res = as_owner.patch(f"/patients/{PATIENT_ID}", json={"name": "Qualquer"})

        assert res.status_code == 404


# ---------------------------------------------------------------------------
# Security headers — presença nas respostas da API
# ---------------------------------------------------------------------------

class TestSecurityHeaders:
    def test_x_frame_options_deny(self):
        """Todas as respostas incluem X-Frame-Options: DENY."""
        res = TestClient(app).get("/health")
        assert res.headers.get("x-frame-options") == "DENY"

    def test_x_content_type_options_nosniff(self):
        """Todas as respostas incluem X-Content-Type-Options: nosniff."""
        res = TestClient(app).get("/health")
        assert res.headers.get("x-content-type-options") == "nosniff"

    def test_referrer_policy(self):
        """Todas as respostas incluem Referrer-Policy."""
        res = TestClient(app).get("/health")
        assert res.headers.get("referrer-policy") == "strict-origin-when-cross-origin"

    def test_permissions_policy(self):
        """Todas as respostas incluem Permissions-Policy."""
        res = TestClient(app).get("/health")
        assert "permissions-policy" in res.headers
