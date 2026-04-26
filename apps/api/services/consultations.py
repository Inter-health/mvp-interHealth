import os
from typing import Optional

from repositories import consultations as repo

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm"}
ALLOWED_MIME_TYPES = {"audio/wav", "audio/mpeg", "audio/mp4", "audio/webm"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


class InvalidAudioFileError(Exception):
    def __init__(self, message: str):
        self.message = message


class ConsentNotGivenError(Exception):
    pass


def validate_audio_file(filename: str, content_type: str, file_size: int) -> None:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise InvalidAudioFileError(
            f"Formato não suportado '{ext}'. Formatos aceitos: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    if content_type not in ALLOWED_MIME_TYPES:
        raise InvalidAudioFileError(
            f"Tipo de conteúdo inválido: '{content_type}'."
        )
    if file_size > MAX_FILE_SIZE:
        raise InvalidAudioFileError("Arquivo muito grande. Limite máximo: 100 MB.")


def create_consultation(
    user_id: str,
    patient_name: Optional[str],
    patient_consent: bool,
    patient_id: Optional[str] = None,
) -> str:
    if not patient_consent:
        raise ConsentNotGivenError()
    # Resolve authoritative name from patient registry when patient_id is provided
    if patient_id:
        from repositories import patients as patient_repo
        p = patient_repo.get_by_id(patient_id)
        if p:
            patient_name = p["name"]
    row = repo.create(user_id, patient_name, patient_consent, patient_id)
    return row["id"]
