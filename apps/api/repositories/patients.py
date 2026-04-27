from datetime import datetime, timezone
from typing import Optional

from core.database import get_client


def create(user_id: str, data: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    payload = {"user_id": user_id, "created_at": now, "updated_at": now, **data}
    result = get_client().table("patients").insert(payload).execute()
    return result.data[0]


def get_by_id(patient_id: str) -> Optional[dict]:
    result = get_client().table("patients").select("*").eq("id", patient_id).execute()
    return result.data[0] if result.data else None


def list_by_user(user_id: str, search: Optional[str] = None) -> list[dict]:
    query = (
        get_client()
        .table("patients")
        .select("id, name, date_of_birth, gender, phone, email, created_at")
        .eq("user_id", user_id)
        .order("name")
    )
    if search:
        query = query.ilike("name", f"%{search}%")
    return query.execute().data


def update(patient_id: str, data: dict) -> dict:
    data = {**data, "updated_at": datetime.now(timezone.utc).isoformat()}
    result = get_client().table("patients").update(data).eq("id", patient_id).execute()
    return result.data[0]
