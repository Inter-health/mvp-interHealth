import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from core.security import get_current_user
from repositories import patients as patient_repo
from schemas.patients import PatientCreate, PatientListItem, PatientResponse, PatientUpdate
from services import patients as patient_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/patients", tags=["patients"])

_DB_ERROR = "Erro ao acessar o banco de dados. Verifique se a migração foi aplicada."


def _db(fn):
    """Executa fn() convertendo qualquer exceção não-HTTP em 500 JSON (com CORS)."""
    try:
        return fn()
    except HTTPException:
        raise
    except Exception as e:
        logger.error("DB error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=_DB_ERROR)


@router.post("", status_code=201, response_model=PatientResponse)
async def create_patient(
    body: PatientCreate,
    current_user_id: str = Depends(get_current_user),
):
    patient = _db(lambda: patient_service.create_patient(current_user_id, body.model_dump()))
    logger.info("Paciente criado [%s] por médico [%s]", patient["id"], current_user_id)
    return PatientResponse(**patient)


@router.get("", response_model=List[PatientListItem])
async def list_patients(
    search: Optional[str] = Query(None, max_length=100),
    current_user_id: str = Depends(get_current_user),
):
    rows = _db(lambda: patient_service.list_patients(current_user_id, search))
    return [PatientListItem(**r) for r in rows]


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    current_user_id: str = Depends(get_current_user),
):
    patient = _db(lambda: patient_repo.get_by_id(patient_id))
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado.")
    if patient["user_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return PatientResponse(**patient)


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    body: PatientUpdate,
    current_user_id: str = Depends(get_current_user),
):
    patient = _db(lambda: patient_repo.get_by_id(patient_id))
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado.")
    if patient["user_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    updated = _db(lambda: patient_service.update_patient(patient_id, body.model_dump(exclude_none=True)))
    return PatientResponse(**updated)
