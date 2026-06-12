"""Service de sugestão de exames por hipótese diagnóstica.

Regra central: só gera sugestões a partir de um SOAP **confirmado** pelo médico.
Nenhuma sugestão é aplicada automaticamente — o médico aceita/rejeita/edita.

Autorização (posse da consulta/sugestão) é checada aqui, no service — nunca no
repository. Exceções de domínio vêm de services.exceptions (sem acoplar a soap).
"""
import logging

from pydantic import BaseModel, ValidationError

from repositories import consultations as consult_repo
from repositories import exam_suggestions as repo
from schemas.exam_suggestions import (
    CategoryType,
    ExamStatus,
    ExamSuggestionManual,
    ExamSuggestionPatch,
    PriorityType,
)
from schemas.soap import SoapStatus
from services import exam_suggestion_prompt, llm_client
from services import soap as soap_service
from services.exceptions import (
    AccessDeniedError,
    GenerationError,
    NotFoundError,
    NotReadyError,
)
from services.llm_client import LLMError

logger = logging.getLogger(__name__)

_MAX_SUGGESTIONS = 8


class _LLMSuggestion(BaseModel):
    """Valida cada item retornado pelo LLM, descartando os malformados."""
    exam_name: str
    category: CategoryType
    justification: str
    hypothesis_ref: str
    priority: PriorityType


def _parse_suggestions(raw: str) -> list[_LLMSuggestion]:
    try:
        data = llm_client.parse_json(raw)
    except ValueError as e:
        logger.error("Exames: JSON inválido do LLM: %s", e)
        raise GenerationError("Não foi possível interpretar as sugestões geradas. Tente novamente.")

    items = data.get("sugestoes", []) if isinstance(data, dict) else []
    parsed: list[_LLMSuggestion] = []
    for item in items:
        try:
            parsed.append(_LLMSuggestion(**item))
        except (ValidationError, TypeError):
            continue  # descarta item malformado, mantém o resto (degradação graciosa)
    if not parsed:
        raise GenerationError("As sugestões geradas vieram em formato inesperado. Tente novamente.")
    return parsed[:_MAX_SUGGESTIONS]


def _verify_ownership(consultation_id: str, user_id: str) -> dict:
    fields = consult_repo.get_soap_fields(consultation_id)
    if not fields:
        raise NotFoundError("Consulta não encontrada.")
    if fields["user_id"] != user_id:
        raise AccessDeniedError("Acesso negado.")
    return fields


def generate_suggestions(consultation_id: str, user_id: str) -> list[dict]:
    fields = _verify_ownership(consultation_id, user_id)
    if fields["soap_status"] != SoapStatus.CONFIRMED or not fields.get("soap_encrypted"):
        raise NotReadyError("SOAP não confirmado pelo médico.")

    soap = soap_service.decrypt_soap(fields["soap_encrypted"])
    prompt, system = exam_suggestion_prompt.build_prompt(soap)

    try:
        raw = llm_client.call_llm(prompt, system, max_tokens=2048, temperature=0.2)
    except LLMError as e:
        raise GenerationError(str(e))

    suggestions = _parse_suggestions(raw)
    records = [
        {
            "consultation_id": consultation_id,
            "user_id": user_id,
            "exam_name": s.exam_name,
            "category": s.category,
            "justification": s.justification,
            "hypothesis_ref": s.hypothesis_ref,
            "priority": s.priority,
            "status": ExamStatus.SUGGESTED,
            "is_manual": False,
        }
        for s in suggestions
    ]

    # Cria as novas ANTES de apagar as antigas: o médico nunca fica sem dados se a
    # escrita falhar (atomicidade prática). A remoção só atinge sugestões automáticas
    # — exames manuais são preservados — e exclui as recém-criadas.
    created = repo.bulk_create(records)
    repo.delete_auto_by_consultation(
        consultation_id, user_id, exclude_ids=[c["id"] for c in created]
    )
    logger.info("Geradas %d sugestões de exame [%s]", len(created), consultation_id)
    return created


def list_suggestions(consultation_id: str, user_id: str) -> list[dict]:
    return repo.list_by_consultation(consultation_id, user_id)


def patch_suggestion(
    consultation_id: str,
    suggestion_id: str,
    user_id: str,
    patch: ExamSuggestionPatch,
) -> dict:
    existing = repo.get_by_id(suggestion_id)
    if not existing:
        raise NotFoundError("Sugestão não encontrada.")
    if existing["user_id"] != user_id:
        raise AccessDeniedError("Acesso negado.")
    if existing["consultation_id"] != consultation_id:
        raise NotFoundError("Sugestão não pertence a esta consulta.")

    data = patch.model_dump(exclude_none=True)
    # Edição do nome sem status explícito marca a sugestão como 'editado'.
    if "exam_name" in data and "status" not in data:
        data["status"] = ExamStatus.EDITED
    return repo.update(suggestion_id, data)


def add_manual(consultation_id: str, user_id: str, data: ExamSuggestionManual) -> dict:
    _verify_ownership(consultation_id, user_id)
    record = {
        "consultation_id": consultation_id,
        "user_id": user_id,
        "exam_name": data.exam_name,
        "category": data.category,
        "justification": data.justification,
        "hypothesis_ref": data.hypothesis_ref or "Manual",
        "priority": data.priority,
        "status": ExamStatus.SUGGESTED,
        "is_manual": True,
    }
    return repo.create_manual(record)
