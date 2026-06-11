"""Testes de aceitação — Sugestão de Exames por Hipótese Diagnóstica.

LLM e repository mockados; criptografia real (chave do .env via main.py).
"""
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from core.security import encrypt_text, get_current_user
from main import app
from repositories.exam_suggestions import SuggestionAccessDeniedError
from schemas.soap import SOAPContent
from services.llm_client import LLMError

OWNER_ID = "owner-uuid-111"
OTHER_ID = "other-uuid-222"
CONSULTATION_ID = "consulta-abc-123"
SUGGESTION_ID = "exam-sug-999"

CANNED_EXAMS_JSON = (
    '{"sugestoes":[{"exam_name":"Hemograma completo","category":"laboratorial",'
    '"justification":"Avalia anemia.","hypothesis_ref":"Anemia ferropriva","priority":"alta"},'
    '{"exam_name":"Ferritina serica","category":"laboratorial",'
    '"justification":"Avalia estoque de ferro.","hypothesis_ref":"Anemia ferropriva","priority":"media"}]}'
)

_SOAP = SOAPContent(
    subjetivo="Fadiga e palidez.",
    objetivo="Palidez cutânea.",
    avaliacao="Suspeita de anemia ferropriva.",
    plano="Investigar.",
    cid="D50.9",
    hipoteses_diagnosticas=["Anemia ferropriva"],
)


@pytest.fixture()
def as_owner():
    app.dependency_overrides[get_current_user] = lambda: OWNER_ID
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def as_other():
    app.dependency_overrides[get_current_user] = lambda: OTHER_ID
    yield TestClient(app)
    app.dependency_overrides.clear()


def _soap_fields(user_id: str = OWNER_ID, soap_status: str = "confirmed") -> dict:
    enc, _ = encrypt_text(_SOAP.model_dump_json())
    return {
        "soap_encrypted": enc,
        "soap_iv": "",
        "soap_status": soap_status,
        "user_id": user_id,
        "status": "TRANSCRIBED",
    }


def _exam(suggestion_id: str = SUGGESTION_ID, user_id: str = OWNER_ID, status: str = "sugerido", is_manual: bool = False) -> dict:
    return {
        "id": suggestion_id,
        "consultation_id": CONSULTATION_ID,
        "user_id": user_id,
        "exam_name": "Hemograma completo",
        "category": "laboratorial",
        "justification": "Avalia anemia.",
        "hypothesis_ref": "Anemia ferropriva",
        "priority": "alta",
        "status": status,
        "is_manual": is_manual,
        "created_at": "2026-06-11T00:00:00Z",
    }


def _fake_bulk(records):
    return [{**r, "id": f"ex{i}", "created_at": "2026-06-11T00:00:00Z"} for i, r in enumerate(records)]


# ---------------------------------------------------------------------------
# POST / — gerar
# ---------------------------------------------------------------------------

class TestGenerateSuggestions:
    def test_gera_com_soap_confirmado_retorna_202(self, as_owner):
        with patch("repositories.consultations.get_soap_fields", return_value=_soap_fields()), \
             patch("repositories.exam_suggestions.delete_by_consultation"), \
             patch("repositories.exam_suggestions.bulk_create", side_effect=_fake_bulk), \
             patch("services.llm_client.call_llm", return_value=CANNED_EXAMS_JSON):
            res = as_owner.post(f"/consultations/{CONSULTATION_ID}/exam-suggestions")

        assert res.status_code == 202
        body = res.json()
        assert body["count"] == 2
        assert body["suggestions"][0]["exam_name"] == "Hemograma completo"
        assert body["suggestions"][0]["status"] == "sugerido"

    def test_gera_sem_soap_confirmado_retorna_409(self, as_owner):
        with patch("repositories.consultations.get_soap_fields",
                   return_value=_soap_fields(soap_status="generated")):
            res = as_owner.post(f"/consultations/{CONSULTATION_ID}/exam-suggestions")
        assert res.status_code == 409

    def test_gera_de_outro_medico_retorna_403(self, as_other):
        with patch("repositories.consultations.get_soap_fields", return_value=_soap_fields(user_id=OWNER_ID)):
            res = as_other.post(f"/consultations/{CONSULTATION_ID}/exam-suggestions")
        assert res.status_code == 403

    def test_llm_falha_resposta_amigavel_nao_500(self, as_owner):
        with patch("repositories.consultations.get_soap_fields", return_value=_soap_fields()), \
             patch("services.llm_client.call_llm", side_effect=LLMError("indisponível")):
            res = as_owner.post(f"/consultations/{CONSULTATION_ID}/exam-suggestions")
        assert res.status_code == 502
        assert res.status_code != 500


# ---------------------------------------------------------------------------
# GET / — listar
# ---------------------------------------------------------------------------

class TestListSuggestions:
    def test_lista_sugestoes(self, as_owner):
        with patch("repositories.exam_suggestions.list_by_consultation", return_value=[_exam(), _exam("ex2")]):
            res = as_owner.get(f"/consultations/{CONSULTATION_ID}/exam-suggestions")
        assert res.status_code == 200
        assert len(res.json()) == 2


# ---------------------------------------------------------------------------
# PATCH /{id} — aceitar/rejeitar/editar
# ---------------------------------------------------------------------------

class TestPatchSuggestion:
    def test_aceitar_atualiza_status(self, as_owner):
        with patch("repositories.exam_suggestions.update", return_value=_exam(status="aceito")):
            res = as_owner.patch(
                f"/consultations/{CONSULTATION_ID}/exam-suggestions/{SUGGESTION_ID}",
                json={"status": "aceito"},
            )
        assert res.status_code == 200
        assert res.json()["status"] == "aceito"

    def test_patch_de_outro_medico_retorna_403(self, as_other):
        with patch("repositories.exam_suggestions.update", side_effect=SuggestionAccessDeniedError("Acesso negado.")):
            res = as_other.patch(
                f"/consultations/{CONSULTATION_ID}/exam-suggestions/{SUGGESTION_ID}",
                json={"status": "aceito"},
            )
        assert res.status_code == 403


# ---------------------------------------------------------------------------
# POST /manual — adicionar manualmente
# ---------------------------------------------------------------------------

class TestManualSuggestion:
    def test_adiciona_manual_retorna_201(self, as_owner):
        with patch("repositories.consultations.get_soap_fields", return_value=_soap_fields()), \
             patch("repositories.exam_suggestions.create_manual", return_value=_exam(is_manual=True)):
            res = as_owner.post(
                f"/consultations/{CONSULTATION_ID}/exam-suggestions/manual",
                json={
                    "exam_name": "Hemograma completo",
                    "category": "laboratorial",
                    "justification": "Avalia anemia.",
                    "priority": "alta",
                },
            )
        assert res.status_code == 201
        assert res.json()["is_manual"] is True
