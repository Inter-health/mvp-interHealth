from datetime import datetime, timezone
from typing import Optional

from core.database import get_client


def create(user_id: str, patient_name: Optional[str], patient_consent: bool) -> dict:
    result = get_client().table("consultations").insert({
        "user_id": user_id,
        "patient_name": patient_name,
        "patient_consent": patient_consent,
        "status": "PENDING",
    }).execute()
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


def clear_audio_path(consultation_id: str) -> None:
    get_client().table("consultations").update({
        "audio_path": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", consultation_id).execute()
