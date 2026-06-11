"""Service de geração e revisão do prontuário SOAP (MVP2).

Orquestra: descriptografa transcript → chama LLM → valida/criptografa SOAP.
Toda regra de negócio vive aqui; acesso ao banco é delegado ao repository
(arquitetura router → service → repository).

Human-in-the-loop: o SOAP gerado fica em 'generated' e só vira 'confirmed'
mediante ação explícita do médico (confirm_soap). Nada é confirmado sozinho.
"""
import json
import logging

from core.security import decrypt_text, encrypt_text
from repositories import consultations as repo
from schemas.soap import SOAPConfirm, SOAPContent
from services import llm_client, soap_prompt
from services.llm_client import LLMError

logger = logging.getLogger(__name__)

_MAX_HIPOTESES = 3


class SOAPNotFoundError(Exception):
    """Consulta inexistente."""


class SOAPNotReadyError(Exception):
    """Transcript ausente, status incorreto ou SOAP ainda não gerado."""


class SOAPAccessDeniedError(Exception):
    """Consulta pertence a outro médico."""


class SOAPAlreadyConfirmedError(Exception):
    """SOAP já confirmado — não pode ser reconfirmado/rejeitado."""


class SOAPGenerationError(Exception):
    """Falha ao gerar/interpretar o SOAP (LLM indisponível ou JSON inválido).
    Mensagem é amigável e segura para exibir ao médico."""


def _parse_soap(raw: str) -> SOAPContent:
    """Converte a resposta bruta do LLM em SOAPContent validado.
    Defensivo contra cercas markdown mesmo com json_mode ligado."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lstrip().lower().startswith("json"):
            cleaned = cleaned.lstrip()[4:]
    try:
        data = json.loads(cleaned)
    except (json.JSONDecodeError, TypeError) as e:
        logger.error("SOAP: JSON inválido do LLM: %s", e)
        raise SOAPGenerationError("Não foi possível interpretar o prontuário gerado. Tente novamente.")
    try:
        soap = SOAPContent(**data)
    except Exception as e:  # noqa: BLE001 — qualquer divergência de schema
        logger.error("SOAP: formato inesperado do LLM: %s", e)
        raise SOAPGenerationError("Prontuário gerado em formato inesperado. Tente novamente.")
    soap.hipoteses_diagnosticas = soap.hipoteses_diagnosticas[:_MAX_HIPOTESES]
    return soap


def _decrypt_soap(soap_encrypted: str) -> SOAPContent:
    return SOAPContent(**json.loads(decrypt_text(soap_encrypted)))


def generate_soap(consultation_id: str, user_id: str) -> dict:
    consultation = repo.get_by_id(consultation_id)
    if not consultation:
        raise SOAPNotFoundError("Consulta não encontrada.")
    if consultation["user_id"] != user_id:
        raise SOAPAccessDeniedError("Acesso negado.")
    if consultation["status"] != "TRANSCRIBED" or not consultation.get("transcript_encrypted"):
        raise SOAPNotReadyError("Transcrição não disponível.")

    transcript = decrypt_text(consultation["transcript_encrypted"])
    prompt, system = soap_prompt.build_prompt(transcript)

    try:
        raw = llm_client.call_llm(prompt, system, max_tokens=1500, temperature=0.2)
    except LLMError as e:
        raise SOAPGenerationError(str(e))

    soap = _parse_soap(raw)

    encrypted, iv = encrypt_text(soap.model_dump_json())
    repo.save_soap(consultation_id, encrypted, iv, "generated")
    logger.info("SOAP gerado [%s]", consultation_id)

    return {"consultation_id": consultation_id, "soap": soap, "soap_status": "generated"}


def confirm_soap(consultation_id: str, user_id: str, body: SOAPConfirm) -> dict:
    fields = repo.get_soap_fields(consultation_id)
    if not fields:
        raise SOAPNotFoundError("Consulta não encontrada.")
    if fields["user_id"] != user_id:
        raise SOAPAccessDeniedError("Acesso negado.")
    if fields["soap_status"] == "confirmed":
        raise SOAPAlreadyConfirmedError("Prontuário já confirmado.")
    if fields["soap_status"] != "generated" or not fields.get("soap_encrypted"):
        raise SOAPNotReadyError("Não há prontuário gerado para revisar.")

    if body.action == "reject":
        repo.clear_soap(consultation_id)
        logger.info("SOAP rejeitado [%s]", consultation_id)
        return {
            "consultation_id": consultation_id,
            "soap": SOAPContent(subjetivo="", objetivo="", avaliacao="", plano=""),
            "soap_status": "rejected",
        }

    if body.action != "confirm":
        raise SOAPNotReadyError("Ação inválida. Use 'confirm' ou 'reject'.")

    # Aplicar edições opcionais do médico sobre o SOAP gerado.
    current = _decrypt_soap(fields["soap_encrypted"])
    edits = {
        k: v
        for k, v in {
            "subjetivo": body.subjetivo,
            "objetivo": body.objetivo,
            "avaliacao": body.avaliacao,
            "plano": body.plano,
            "cid": body.cid,
            "hipoteses_diagnosticas": body.hipoteses_diagnosticas,
        }.items()
        if v is not None
    }
    updated = current.model_copy(update=edits)

    encrypted, iv = encrypt_text(updated.model_dump_json())
    repo.save_soap(consultation_id, encrypted, iv, "confirmed")
    logger.info("SOAP confirmado [%s]", consultation_id)

    return {"consultation_id": consultation_id, "soap": updated, "soap_status": "confirmed"}


def get_soap(consultation_id: str, user_id: str) -> dict:
    fields = repo.get_soap_fields(consultation_id)
    if not fields:
        raise SOAPNotFoundError("Consulta não encontrada.")
    if fields["user_id"] != user_id:
        raise SOAPAccessDeniedError("Acesso negado.")
    if fields["soap_status"] in (None, "pending") or not fields.get("soap_encrypted"):
        raise SOAPNotReadyError("Prontuário ainda não gerado.")

    soap = _decrypt_soap(fields["soap_encrypted"])
    return {"consultation_id": consultation_id, "soap": soap, "soap_status": fields["soap_status"]}
