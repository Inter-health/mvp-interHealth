"""Testes de aceitação — Motor de SOAP (MVP2).

LLM (services.llm_client.call_llm) e repository são mockados; nenhuma chamada
real à API Gemini ou ao Supabase é feita. A criptografia usa a chave real do
.env (carregada por main.py), exercitando encrypt/decrypt de verdade.
"""
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from core.security import encrypt_text, get_current_user
from main import app
from schemas.soap import SOAPContent
from services.llm_client import LLMError

OWNER_ID = "owner-uuid-111"
OTHER_ID = "other-uuid-222"
CONSULTATION_ID = "consulta-abc-123"

CANNED_SOAP_JSON = (
    '{"subjetivo":"Cefaleia ha 3 dias com fotofobia.",'
    '"objetivo":"PA 120/80, exame neurologico normal.",'
    '"avaliacao":"Quadro compativel com enxaqueca com aura.",'
    '"plano":"Sumatriptano. Retorno em 30 dias.",'
    '"cid":"G43.1",'
    '"hipoteses_diagnosticas":["Enxaqueca com aura"]}'
)

SAMPLE_TRANSCRIPT = (
    "[MÉDICO]: Bom dia, em que posso ajudar?\n"
    "[PACIENTE]: Dor de cabeça há 3 dias, piora com luz.\n"
    "[MÉDICO]: Pressão 120/80, exame neurológico normal. Enxaqueca com aura."
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


def _consultation(user_id: str = OWNER_ID, status: str = "TRANSCRIBED", with_transcript: bool = True) -> dict:
    enc, _ = encrypt_text(SAMPLE_TRANSCRIPT) if with_transcript else ("", "")
    return {
        "id": CONSULTATION_ID,
        "user_id": user_id,
        "status": status,
        "transcript_encrypted": enc if with_transcript else None,
    }


def _soap_fields(user_id: str = OWNER_ID, soap_status: str = "generated", with_soap: bool = True) -> dict:
    enc, _ = encrypt_text(CANNED_SOAP_JSON) if with_soap else ("", "")
    return {
        "soap_encrypted": enc if with_soap else None,
        "soap_iv": "",
        "soap_status": soap_status,
        "user_id": user_id,
        "status": "TRANSCRIBED",
    }


# ---------------------------------------------------------------------------
# POST /generate
# ---------------------------------------------------------------------------

class TestGenerateSOAP:
    def test_gera_soap_com_transcript_retorna_202(self, as_owner):
        with patch("repositories.consultations.get_by_id", return_value=_consultation()), \
             patch("repositories.consultations.save_soap") as save, \
             patch("services.llm_client.call_llm", return_value=CANNED_SOAP_JSON):
            res = as_owner.post(f"/consultations/{CONSULTATION_ID}/soap/generate")

        assert res.status_code == 202
        body = res.json()
        assert body["soap_status"] == "generated"
        assert body["soap"]["cid"] == "G43.1"
        assert body["soap"]["hipoteses_diagnosticas"] == ["Enxaqueca com aura"]
        save.assert_called_once()
        # persistido em 'generated' e criptografado (não plaintext)
        _, enc_arg, _, status_arg = save.call_args[0]
        assert status_arg == "generated"
        assert "subjetivo" not in enc_arg

    def test_gera_soap_sem_transcript_retorna_409(self, as_owner):
        with patch("repositories.consultations.get_by_id",
                   return_value=_consultation(status="PENDING", with_transcript=False)):
            res = as_owner.post(f"/consultations/{CONSULTATION_ID}/soap/generate")
        assert res.status_code == 409

    def test_gera_soap_de_outro_medico_retorna_403(self, as_other):
        with patch("repositories.consultations.get_by_id", return_value=_consultation(user_id=OWNER_ID)):
            res = as_other.post(f"/consultations/{CONSULTATION_ID}/soap/generate")
        assert res.status_code == 403

    def test_consulta_inexistente_retorna_404(self, as_owner):
        with patch("repositories.consultations.get_by_id", return_value=None):
            res = as_owner.post(f"/consultations/{CONSULTATION_ID}/soap/generate")
        assert res.status_code == 404

    def test_llm_falha_resposta_amigavel_nao_500(self, as_owner):
        with patch("repositories.consultations.get_by_id", return_value=_consultation()), \
             patch("services.llm_client.call_llm", side_effect=LLMError("indisponível")):
            res = as_owner.post(f"/consultations/{CONSULTATION_ID}/soap/generate")
        assert res.status_code == 502
        assert res.status_code != 500
        assert "detail" in res.json()


# ---------------------------------------------------------------------------
# GET /
# ---------------------------------------------------------------------------

class TestGetSOAP:
    def test_get_soap_apos_geracao_retorna_200(self, as_owner):
        with patch("repositories.consultations.get_soap_fields", return_value=_soap_fields()):
            res = as_owner.get(f"/consultations/{CONSULTATION_ID}/soap")
        assert res.status_code == 200
        assert res.json()["soap"]["avaliacao"].startswith("Quadro")

    def test_get_soap_nao_gerado_retorna_404(self, as_owner):
        with patch("repositories.consultations.get_soap_fields",
                   return_value=_soap_fields(soap_status="pending", with_soap=False)):
            res = as_owner.get(f"/consultations/{CONSULTATION_ID}/soap")
        assert res.status_code == 404

    def test_get_soap_outro_medico_retorna_403(self, as_other):
        with patch("repositories.consultations.get_soap_fields", return_value=_soap_fields(user_id=OWNER_ID)):
            res = as_other.get(f"/consultations/{CONSULTATION_ID}/soap")
        assert res.status_code == 403


# ---------------------------------------------------------------------------
# POST /confirm
# ---------------------------------------------------------------------------

class TestConfirmSOAP:
    def test_confirm_atualiza_status_para_confirmed(self, as_owner):
        with patch("repositories.consultations.get_soap_fields", return_value=_soap_fields()), \
             patch("repositories.consultations.save_soap") as save:
            res = as_owner.post(
                f"/consultations/{CONSULTATION_ID}/soap/confirm",
                json={"action": "confirm"},
            )
        assert res.status_code == 200
        assert res.json()["soap_status"] == "confirmed"
        _, _, _, status_arg = save.call_args[0]
        assert status_arg == "confirmed"

    def test_confirm_aplica_edicoes_do_medico(self, as_owner):
        with patch("repositories.consultations.get_soap_fields", return_value=_soap_fields()), \
             patch("repositories.consultations.save_soap"):
            res = as_owner.post(
                f"/consultations/{CONSULTATION_ID}/soap/confirm",
                json={"action": "confirm", "plano": "Plano editado pelo médico."},
            )
        assert res.status_code == 200
        assert res.json()["soap"]["plano"] == "Plano editado pelo médico."

    def test_reject_zera_e_status_rejected(self, as_owner):
        with patch("repositories.consultations.get_soap_fields", return_value=_soap_fields()), \
             patch("repositories.consultations.clear_soap") as clear:
            res = as_owner.post(
                f"/consultations/{CONSULTATION_ID}/soap/confirm",
                json={"action": "reject"},
            )
        assert res.status_code == 200
        assert res.json()["soap_status"] == "rejected"
        clear.assert_called_once()

    def test_confirm_de_outro_medico_retorna_403(self, as_other):
        with patch("repositories.consultations.get_soap_fields", return_value=_soap_fields(user_id=OWNER_ID)):
            res = as_other.post(
                f"/consultations/{CONSULTATION_ID}/soap/confirm",
                json={"action": "confirm"},
            )
        assert res.status_code == 403
