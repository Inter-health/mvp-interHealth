from datetime import datetime, timezone
from typing import Optional

from core.database import get_client


def create(
    user_id: str,
    patient_name: Optional[str],
    patient_consent: bool,
    patient_id: Optional[str] = None,
) -> dict:
    payload: dict = {
        "user_id": user_id,
        "patient_name": patient_name,
        "patient_consent": patient_consent,
        "status": "PENDING",
    }
    if patient_id:
        payload["patient_id"] = patient_id
    result = get_client().table("consultations").insert(payload).execute()
    return result.data[0]


def update_status(
    consultation_id: str,
    status: str,
    error_msg: Optional[str] = None,
    audio_path: Optional[str] = None,
) -> None:
    data: dict = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if error_msg is not None:
        data["error_msg"] = error_msg
    if audio_path is not None:
        data["audio_path"] = audio_path
    get_client().table("consultations").update(data).eq("id", consultation_id).execute()


def save_transcript(
    consultation_id: str,
    encrypted: str,
    iv: str,
    expires_at: datetime,
) -> None:
    get_client().table("consultations").update({
        "transcript_encrypted": encrypted,
        "transcript_iv": iv,
        "transcript_expires_at": expires_at.isoformat(),
        "status": "TRANSCRIBED",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", consultation_id).execute()


def get_by_id(consultation_id: str) -> Optional[dict]:
    result = get_client().table("consultations").select(
        "id, user_id, patient_name, status, transcript_encrypted, transcript_iv, "
        "transcript_expires_at, error_msg, created_at"
    ).eq("id", consultation_id).execute()
    return result.data[0] if result.data else None


def list_by_user(
    user_id: str,
    patient_name: Optional[str] = None,
    patient_id: Optional[str] = None,
) -> list[dict]:
    query = (
        get_client()
        .table("consultations")
        .select("id, patient_name, patient_id, status, created_at, error_msg, patient_consent")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
    )
    if patient_name:
        query = query.ilike("patient_name", f"%{patient_name}%")
    if patient_id:
        query = query.eq("patient_id", patient_id)
    return query.execute().data


def clear_audio_path(consultation_id: str) -> None:
    get_client().table("consultations").update({
        "audio_path": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", consultation_id).execute()


# ---------------------------------------------------------------------------
# SOAP — Prontuário Inteligente (MVP2)
# ---------------------------------------------------------------------------

def save_soap(
    consultation_id: str,
    soap_encrypted: str,
    soap_status: str,
) -> None:
    # O IV é embutido no token Fernet — não há IV separado para persistir.
    get_client().table("consultations").update({
        "soap_encrypted": soap_encrypted,
        "soap_status": soap_status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", consultation_id).execute()


def get_soap_fields(consultation_id: str) -> Optional[dict]:
    result = get_client().table("consultations").select(
        "soap_encrypted, soap_status, user_id, status"
    ).eq("id", consultation_id).execute()
    return result.data[0] if result.data else None


def clear_soap(consultation_id: str) -> None:
    get_client().table("consultations").update({
        "soap_encrypted": None,
        "soap_status": "rejected",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", consultation_id).execute()
