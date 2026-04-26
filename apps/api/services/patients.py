from typing import Optional

from repositories import patients as repo


def create_patient(user_id: str, data: dict) -> dict:
    clean = {k: v for k, v in data.items() if v is not None}
    return repo.create(user_id, clean)


def list_patients(user_id: str, search: Optional[str] = None) -> list[dict]:
    return repo.list_by_user(user_id, search)


def update_patient(patient_id: str, data: dict) -> dict:
    clean = {k: v for k, v in data.items() if v is not None}
    return repo.update(patient_id, clean)
