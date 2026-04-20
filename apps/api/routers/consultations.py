import logging
import os
import tempfile
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile

from core.limiter import limiter
from core.security import get_current_user
from repositories import consultations as consultation_repo
from schemas.consultations import ConsultationResponse
from services.consultations import InvalidAudioFileError, create_consultation, validate_audio_file

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/consultations", tags=["consultations"])


async def _process_audio_stub(consultation_id: str, file_path: str) -> None:
    """Stub do pipeline de transcrição — será implementado no SCRUM-27."""
    pass


@router.post("/upload", status_code=202, response_model=ConsultationResponse)
@limiter.limit("5/minute")
async def upload_audio(
    request: Request,
    background_tasks: BackgroundTasks,
    audio_file: UploadFile = File(...),
    patient_name: Optional[str] = Form(None),
    patient_consent: bool = Form(False),
    current_user_id: str = Depends(get_current_user),
):
    contents = await audio_file.read()

    try:
        validate_audio_file(
            audio_file.filename or "",
            audio_file.content_type or "",
            len(contents),
        )
    except InvalidAudioFileError as e:
        raise HTTPException(status_code=422, detail=e.message)

    consultation_id = create_consultation(current_user_id, patient_name, patient_consent)

    ext = os.path.splitext(audio_file.filename or "audio")[1].lower() or ".bin"
    tmp_dir = tempfile.gettempdir()
    file_path = os.path.join(tmp_dir, f"{consultation_id}{ext}")

    with open(file_path, "wb") as f:
        f.write(contents)

    consultation_repo.update_status(consultation_id, "PENDING", audio_path=file_path)

    background_tasks.add_task(_process_audio_stub, consultation_id, file_path)

    return ConsultationResponse(
        consultation_id=consultation_id,
        status="PENDING",
        message="Áudio recebido. Transcrição em andamento.",
    )
