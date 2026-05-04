from datetime import datetime, timedelta, timezone

from core.database import get_client

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def get_by_email(email: str) -> dict | None:
    result = get_client().table("users").select("id").eq("email", email).execute()
    return result.data[0] if result.data else None


def get_by_email_with_hash(email: str) -> dict | None:
    result = (
        get_client()
        .table("users")
        .select("id, name, crm, email, specialty, ehr_provider, terms_accepted, password_hash, failed_login_attempts, locked_until")
        .eq("email", email)
        .execute()
    )
    return result.data[0] if result.data else None


def increment_failed_attempts(email: str) -> None:
    """Incrementa tentativas falhas. Bloqueia a conta por LOCKOUT_MINUTES ao atingir MAX_FAILED_ATTEMPTS."""
    row = get_by_email_with_hash(email)
    if not row:
        return

    new_attempts = row.get("failed_login_attempts", 0) + 1
    update: dict = {"failed_login_attempts": new_attempts}

    if new_attempts >= MAX_FAILED_ATTEMPTS:
        locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
        update["locked_until"] = locked_until.isoformat()

    get_client().table("users").update(update).eq("email", email).execute()


def reset_failed_attempts(user_id: str) -> None:
    """Zera contador e remove bloqueio após login bem-sucedido."""
    get_client().table("users").update({
        "failed_login_attempts": 0,
        "locked_until": None,
    }).eq("id", user_id).execute()


def get_by_id(user_id: str) -> dict | None:
    result = (
        get_client()
        .table("users")
        .select("id, name, crm, email, specialty, ehr_provider, terms_accepted")
        .eq("id", user_id)
        .execute()
    )
    return result.data[0] if result.data else None


def create(data: dict) -> dict:
    result = get_client().table("users").insert(data).execute()
    return result.data[0]
