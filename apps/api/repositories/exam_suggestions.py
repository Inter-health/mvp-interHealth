"""Repository de sugestões de exames — único ponto de acesso ao Supabase.

Camada de dados pura: NÃO contém regra de negócio nem autorização (posse é
checada no service). Segue o caveat do SDK v2: update não encadeia .select();
fazemos UPDATE e depois um SELECT separado para devolver a linha atualizada.
"""
from datetime import datetime, timezone
from typing import Optional

from core.database import get_client

_COLUMNS = (
    "id, consultation_id, user_id, exam_name, category, justification, "
    "hypothesis_ref, priority, status, is_manual, created_at"
)


def list_by_consultation(consultation_id: str, user_id: str) -> list[dict]:
    return (
        get_client()
        .table("exam_suggestions")
        .select(_COLUMNS)
        .eq("consultation_id", consultation_id)
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
        .data
    )


def get_by_id(suggestion_id: str) -> Optional[dict]:
    result = (
        get_client()
        .table("exam_suggestions")
        .select(_COLUMNS)
        .eq("id", suggestion_id)
        .execute()
    )
    return result.data[0] if result.data else None


def bulk_create(records: list[dict]) -> list[dict]:
    if not records:
        return []
    return get_client().table("exam_suggestions").insert(records).execute().data


def create_manual(record: dict) -> dict:
    return get_client().table("exam_suggestions").insert(record).execute().data[0]


def update(suggestion_id: str, patch: dict) -> dict:
    data = {**patch, "updated_at": datetime.now(timezone.utc).isoformat()}
    get_client().table("exam_suggestions").update(data).eq("id", suggestion_id).execute()

    result = (
        get_client()
        .table("exam_suggestions")
        .select(_COLUMNS)
        .eq("id", suggestion_id)
        .execute()
    )
    return result.data[0]


def delete_auto_by_consultation(
    consultation_id: str,
    user_id: str,
    exclude_ids: Optional[list[str]] = None,
) -> None:
    """Remove apenas sugestões AUTOMÁTICAS (is_manual=False) da consulta.

    Exames adicionados manualmente pelo médico são preservados. `exclude_ids`
    protege as sugestões recém-criadas (regenerar cria antes de apagar)."""
    query = (
        get_client()
        .table("exam_suggestions")
        .delete()
        .eq("consultation_id", consultation_id)
        .eq("user_id", user_id)
        .eq("is_manual", False)
    )
    if exclude_ids:
        query = query.not_.in_("id", exclude_ids)
    query.execute()
