from schemas.audit_logs import AuditAction
from core.database import get_client


def create_audit_log(user_id: str, action: AuditAction, ip_address: str | None) -> None:
    get_client().table("audit_logs").insert({
        "user_id": user_id,
        "action": action.value,
        "ip_address": ip_address,
    }).execute()
