import logging
import os
import tempfile
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, Request, UploadFile

from core.limiter import limiter
from core.security import decrypt_text, get_current_user
from repositories import consultations as consultation_repo
from schemas.consultations import ConsultationListItem, ConsultationResponse, ConsultationStatus, ConsultationStatusResponse
from services.consultations import ConsentNotGivenError, InvalidAudioFileError, create_consultation, validate_audio_file
from services import transcription as transcription_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/consultations", tags=["consultations"])


@router.get("", response_model=List[ConsultationListItem])
async def list_consultations(
    patient_name: Optional[str] = Query(None, max_length=100),
    patient_id: Optional[str] = Query(None),
    current_user_id: str = Depends(get_current_user),
):
    rows = consultation_repo.list_by_user(current_user_id, patient_name, patient_id)
    return [
        ConsultationListItem(
            id=r["id"],
            patient_name=r.get("patient_name"),
            patient_id=r.get("patient_id"),
            status=r["status"],
            created_at=r["created_at"],
            error_msg=r.get("error_msg"),
        )
        for r in rows
    ]


@router.post("/upload", status_code=202, response_model=ConsultationResponse)
@limiter.limit("5/minute")
async def upload_audio(
    request: Request,
    background_tasks: BackgroundTasks,
    audio_file: UploadFile = File(...),
    patient_name: Optional[str] = Form(None, max_length=255),
    patient_consent: bool = Form(...),
    live_transcript: Optional[str] = Form(None, max_length=500_000),  # ~500KB texto
    patient_id: Optional[str] = Form(None),
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

    try:
        consultation_id = create_consultation(current_user_id, patient_name, patient_consent, patient_id)
    except ConsentNotGivenError:
        raise HTTPException(
            status_code=422,
            detail="Consentimento do paciente é obrigatório para processar o áudio (LGPD Art. 7).",
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    ext = os.path.splitext(audio_file.filename or "audio")[1].lower() or ".bin"
    tmp_dir = tempfile.gettempdir()
    file_path = os.path.join(tmp_dir, f"{consultation_id}{ext}")

    with open(file_path, "wb") as f:
        f.write(contents)

    consultation_repo.update_status(consultation_id, ConsultationStatus.PENDING.value, audio_path=file_path)

    background_tasks.add_task(transcription_service.process, consultation_id, file_path, live_transcript)

    return ConsultationResponse(
        consultation_id=consultation_id,
        status=ConsultationStatus.PENDING,
        message="Áudio recebido. Transcrição em andamento.",
    )


@router.get("/{consultation_id}/status", response_model=ConsultationStatusResponse)
async def get_consultation_status(
    consultation_id: str,
    current_user_id: str = Depends(get_current_user),
):
    consultation = consultation_repo.get_by_id(consultation_id)

    if not consultation:
        raise HTTPException(status_code=404, detail="Consulta não encontrada.")

    if consultation["user_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Acesso negado.")

    transcript = None
    if consultation["status"] == ConsultationStatus.TRANSCRIBED and consultation.get("transcript_encrypted"):
        # Verificar expiração antes de retornar dado de saúde (LGPD — minimização de dados)
        expires_at_str = consultation.get("transcript_expires_at")
        if expires_at_str:
            expires_at = datetime.fromisoformat(expires_at_str)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > expires_at:
                raise HTTPException(status_code=410, detail="Transcrição expirou e não está mais disponível.")

        try:
            transcript = decrypt_text(consultation["transcript_encrypted"])
        except Exception:
            logger.error("Erro ao decriptografar transcrição [%s]", consultation_id)
            raise HTTPException(status_code=500, detail="Erro ao recuperar transcrição.")

    return ConsultationStatusResponse(
        consultation_id=consultation["id"],
        status=consultation["status"],
        patient_name=consultation.get("patient_name"),
        transcript=transcript,
        error_msg=consultation.get("error_msg"),
        created_at=consultation["created_at"],
    )
