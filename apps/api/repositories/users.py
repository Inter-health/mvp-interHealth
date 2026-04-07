from core.database import get_client


def get_by_email(email: str) -> dict | None:
    result = get_client().table("users").select("id").eq("email", email).execute()
    return result.data[0] if result.data else None


def create(data: dict) -> dict:
    result = get_client().table("users").insert(data).execute()
    return result.data[0]
