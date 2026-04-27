from repositories import demo_requests as repo
from services import email as email_service


def create_demo_request(
    company_name: str,
    role: str,
    doctor_count: str,
    email: str,
) -> dict:
    clean_email = email.strip().lower()
    clean_company = company_name.strip()

    record = repo.create(
        company_name=clean_company,
        role=role,
        doctor_count=doctor_count,
        email=clean_email,
    )

    # Falha no e-mail não bloqueia o cadastro
    try:
        email_service.send_demo_request_notification(
            company_name=clean_company,
            role=role,
            doctor_count=doctor_count,
            email=clean_email,
        )
    except Exception:
        pass

    return record
