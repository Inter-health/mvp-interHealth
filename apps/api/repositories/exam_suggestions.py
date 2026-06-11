"""Repository de sugestões de exames — único ponto de acesso ao Supabase.

Segue o caveat do SDK v2: update não encadeia .select(); fazemos UPDATE e
depois um SELECT separado para devolver a linha atualizada.
"""
from datetime import datetime, timezone

from core.database import get_client

_COLUMNS = (
    "id, consultation_id, user_id, exam_name, category, justification, "
    "hypothesis_ref, priority, status, is_manual, created_at"
)


class SuggestionNotFoundError(Exception):
    pass


class SuggestionAccessDeniedError(Exception):
    pass


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


def bulk_create(records: list[dict]) -> list[dict]:
    if not records:
        return []
    return get_client().table("exam_suggestions").insert(records).execute().data


def update(suggestion_id: str, user_id: str, patch: dict) -> dict:
    existing = (
        get_client()
        .table("exam_suggestions")
        .select("user_id")
        .eq("id", suggestion_id)
        .execute()
    )
    if not existing.data:
        raise SuggestionNotFoundError("Sugestão não encontrada.")
    if existing.data[0]["user_id"] != user_id:
        raise SuggestionAccessDeniedError("Acesso negado.")

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


def create_manual(record: dict) -> dict:
    return get_client().table("exam_suggestions").insert(record).execute().data[0]


def delete_by_consultation(consultation_id: str, user_id: str) -> None:
    (
        get_client()
        .table("exam_suggestions")
        .delete()
        .eq("consultation_id", consultation_id)
        .eq("user_id", user_id)
        .execute()
    )
