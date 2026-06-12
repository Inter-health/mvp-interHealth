"""Service de geração e revisão do prontuário SOAP (MVP2).

Orquestra: descriptografa transcript → chama LLM → valida/criptografa SOAP.
Toda regra de negócio vive aqui; acesso ao banco é delegado ao repository
(arquitetura router → service → repository).

Human-in-the-loop: o SOAP gerado fica em 'generated' e só vira 'confirmed'
mediante ação explícita do médico (confirm_soap). Nada é confirmado sozinho.
"""
import logging

from core.security import decrypt_text, encrypt_text
from repositories import consultations as repo
from schemas.soap import SOAPConfirm, SOAPContent, SoapStatus
from services import llm_client, soap_prompt
from services.exceptions import (
    AccessDeniedError,
    AlreadyConfirmedError,
    GenerationError,
    NotFoundError,
    NotReadyError,
)
from services.llm_client import LLMError

logger = logging.getLogger(__name__)

_MAX_HIPOTESES = 3


def decrypt_soap(soap_encrypted: str) -> SOAPContent:
    """Descriptografa e reidrata o SOAP em repouso. Reutilizado pelo service de exames."""
    return SOAPContent(**llm_client.parse_json(decrypt_text(soap_encrypted)))


def _parse_soap(raw: str) -> SOAPContent:
    """Converte a resposta bruta do LLM em SOAPContent validado."""
    try:
        data = llm_client.parse_json(raw)
    except ValueError as e:
        logger.error("SOAP: JSON inválido do LLM: %s", e)
        raise GenerationError("Não foi possível interpretar o prontuário gerado. Tente novamente.")
    try:
        soap = SOAPContent(**data)
    except Exception as e:  # noqa: BLE001 — qualquer divergência de schema
        logger.error("SOAP: formato inesperado do LLM: %s", e)
        raise GenerationError("Prontuário gerado em formato inesperado. Tente novamente.")
    soap.hipoteses_diagnosticas = soap.hipoteses_diagnosticas[:_MAX_HIPOTESES]
    return soap


def generate_soap(consultation_id: str, user_id: str) -> dict:
    consultation = repo.get_by_id(consultation_id)
    if not consultation:
        raise NotFoundError("Consulta não encontrada.")
    if consultation["user_id"] != user_id:
        raise AccessDeniedError("Acesso negado.")
    if consultation["status"] != "TRANSCRIBED" or not consultation.get("transcript_encrypted"):
        raise NotReadyError("Transcrição não disponível.")

    transcript = decrypt_text(consultation["transcript_encrypted"])
    prompt, system = soap_prompt.build_prompt(transcript)

    try:
        raw = llm_client.call_llm(prompt, system, max_tokens=1500, temperature=0.2)
    except LLMError as e:
        raise GenerationError(str(e))

    soap = _parse_soap(raw)

    encrypted, _ = encrypt_text(soap.model_dump_json())
    repo.save_soap(consultation_id, encrypted, SoapStatus.GENERATED)
    logger.info("SOAP gerado [%s]", consultation_id)

    return {"consultation_id": consultation_id, "soap": soap, "soap_status": SoapStatus.GENERATED}


def confirm_soap(consultation_id: str, user_id: str, body: SOAPConfirm) -> dict:
    fields = repo.get_soap_fields(consultation_id)
    if not fields:
        raise NotFoundError("Consulta não encontrada.")
    if fields["user_id"] != user_id:
        raise AccessDeniedError("Acesso negado.")
    if fields["soap_status"] == SoapStatus.CONFIRMED:
        raise AlreadyConfirmedError("Prontuário já confirmado.")
    if fields["soap_status"] != SoapStatus.GENERATED or not fields.get("soap_encrypted"):
        raise NotReadyError("Não há prontuário gerado para revisar.")

    if body.action == "reject":
        repo.clear_soap(consultation_id)
        logger.info("SOAP rejeitado [%s]", consultation_id)
        return {
            "consultation_id": consultation_id,
            "soap": SOAPContent(subjetivo="", objetivo="", avaliacao="", plano=""),
            "soap_status": SoapStatus.REJECTED,
        }

    if body.action != "confirm":
        raise NotReadyError("Ação inválida. Use 'confirm' ou 'reject'.")

    updated = _apply_edits(decrypt_soap(fields["soap_encrypted"]), body)

    encrypted, _ = encrypt_text(updated.model_dump_json())
    repo.save_soap(consultation_id, encrypted, SoapStatus.CONFIRMED)
    logger.info("SOAP confirmado [%s]", consultation_id)

    return {"consultation_id": consultation_id, "soap": updated, "soap_status": SoapStatus.CONFIRMED}


def _apply_edits(current: SOAPContent, body: SOAPConfirm) -> SOAPContent:
    """Sobrepõe ao SOAP gerado apenas os campos que o médico editou (não-nulos)."""
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
    return current.model_copy(update=edits)


def get_soap(consultation_id: str, user_id: str) -> dict:
    fields = repo.get_soap_fields(consultation_id)
    if not fields:
        raise NotFoundError("Consulta não encontrada.")
    if fields["user_id"] != user_id:
        raise AccessDeniedError("Acesso negado.")
    if fields["soap_status"] in (None, SoapStatus.PENDING) or not fields.get("soap_encrypted"):
        raise NotReadyError("Prontuário ainda não gerado.")

    soap = decrypt_soap(fields["soap_encrypted"])
    return {"consultation_id": consultation_id, "soap": soap, "soap_status": fields["soap_status"]}
