from typing import Optional

from repositories import patients as repo


class PatientNotFoundError(Exception):
    pass


class PatientAccessDeniedError(Exception):
    pass


def create_patient(user_id: str, data: dict) -> dict:
    clean = {k: v for k, v in data.items() if v is not None}
    return repo.create(user_id, clean)


def list_patients(user_id: str, search: Optional[str] = None) -> list[dict]:
    return repo.list_by_user(user_id, search)


def get_patient(patient_id: str, user_id: str) -> dict:
    patient = repo.get_by_id(patient_id)
    if not patient:
        raise PatientNotFoundError()
    if patient["user_id"] != user_id:
        raise PatientAccessDeniedError()
    return patient


def update_patient(patient_id: str, user_id: str, data: dict) -> dict:
    patient = repo.get_by_id(patient_id)
    if not patient:
        raise PatientNotFoundError()
    if patient["user_id"] != user_id:
        raise PatientAccessDeniedError()
    clean = {k: v for k, v in data.items() if v is not None}
    return repo.update(patient_id, clean)
