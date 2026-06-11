"""Service de sugestão de exames por hipótese diagnóstica.

Regra central: só gera sugestões a partir de um SOAP **confirmado** pelo médico.
Nenhuma sugestão é aplicada automaticamente — o médico aceita/rejeita/edita.

Reutiliza as exceções de domínio de services.soap para mapeamento consistente
no router (mesma semântica de acesso/posse/SOAP não pronto).
"""
import json
import logging

from pydantic import BaseModel, ValidationError

from core.security import decrypt_text
from repositories import consultations as consult_repo
from repositories import exam_suggestions as repo
from schemas.exam_suggestions import (
    CategoryType,
    ExamSuggestionManual,
    ExamSuggestionPatch,
    PriorityType,
)
from schemas.soap import SOAPContent
from services import exam_suggestion_prompt, llm_client
from services.llm_client import LLMError
from services.soap import (
    SOAPAccessDeniedError,
    SOAPGenerationError,
    SOAPNotFoundError,
    SOAPNotReadyError,
)

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
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lstrip().lower().startswith("json"):
            cleaned = cleaned.lstrip()[4:]
    try:
        data = json.loads(cleaned)
    except (json.JSONDecodeError, TypeError) as e:
        logger.error("Exames: JSON inválido do LLM: %s", e)
        raise SOAPGenerationError("Não foi possível interpretar as sugestões geradas. Tente novamente.")

    items = data.get("sugestoes", []) if isinstance(data, dict) else []
    parsed: list[_LLMSuggestion] = []
    for item in items:
        try:
            parsed.append(_LLMSuggestion(**item))
        except (ValidationError, TypeError):
            continue  # descarta item malformado, mantém o resto (degradação graciosa)
    if not parsed:
        raise SOAPGenerationError("As sugestões geradas vieram em formato inesperado. Tente novamente.")
    return parsed[:_MAX_SUGGESTIONS]


def _verify_ownership(consultation_id: str, user_id: str) -> dict:
    fields = consult_repo.get_soap_fields(consultation_id)
    if not fields:
        raise SOAPNotFoundError("Consulta não encontrada.")
    if fields["user_id"] != user_id:
        raise SOAPAccessDeniedError("Acesso negado.")
    return fields


def generate_suggestions(consultation_id: str, user_id: str) -> list[dict]:
    fields = _verify_ownership(consultation_id, user_id)
    if fields["soap_status"] != "confirmed" or not fields.get("soap_encrypted"):
        raise SOAPNotReadyError("SOAP não confirmado pelo médico.")

    soap = SOAPContent(**json.loads(decrypt_text(fields["soap_encrypted"])))
    prompt, system = exam_suggestion_prompt.build_prompt(soap)

    try:
        raw = llm_client.call_llm(prompt, system, max_tokens=2048, temperature=0.2)
    except LLMError as e:
        raise SOAPGenerationError(str(e))

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
            "status": "sugerido",
            "is_manual": False,
        }
        for s in suggestions
    ]

    # Regenerar substitui as sugestões automáticas anteriores.
    repo.delete_by_consultation(consultation_id, user_id)
    created = repo.bulk_create(records)
    logger.info("Geradas %d sugestões de exame [%s]", len(created), consultation_id)
    return created


def list_suggestions(consultation_id: str, user_id: str) -> list[dict]:
    return repo.list_by_consultation(consultation_id, user_id)


def patch_suggestion(suggestion_id: str, user_id: str, patch: ExamSuggestionPatch) -> dict:
    data = patch.model_dump(exclude_none=True)
    # Edição do nome sem status explícito marca a sugestão como 'editado'.
    if "exam_name" in data and "status" not in data:
        data["status"] = "editado"
    return repo.update(suggestion_id, user_id, data)


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
        "status": "sugerido",
        "is_manual": True,
    }
    return repo.create_manual(record)
