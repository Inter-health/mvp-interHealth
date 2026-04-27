from core.database import get_client


def create(company_name: str, role: str, doctor_count: str, email: str) -> dict:
    client = get_client()
    result = (
        client.table("demo_requests")
        .insert({
            "company_name": company_name,
            "role": role,
            "doctor_count": doctor_count,
            "email": email,
        })
        .execute()
    )
    return result.data[0]
