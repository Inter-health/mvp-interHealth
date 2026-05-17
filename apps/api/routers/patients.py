import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from core.security import get_current_user
from schemas.patients import PatientCreate, PatientListItem, PatientResponse, PatientUpdate
from services import patients as patient_service
from services.patients import PatientAccessDeniedError, PatientNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/patients", tags=["patients"])

_DB_ERROR = "Erro ao acessar o banco de dados. Verifique se a migração foi aplicada."


def _db(fn):
    """Executa fn() convertendo qualquer exceção não-HTTP em 500 JSON (com CORS)."""
    try:
        return fn()
    except HTTPException:
        raise
    except (PatientNotFoundError, PatientAccessDeniedError):
        raise
    except Exception as e:
        logger.error("DB error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=_DB_ERROR)


@router.post(
    "",
    status_code=201,
    response_model=PatientResponse,
    summary="Cadastrar paciente",
    description="Cria um novo paciente vinculado ao médico autenticado.",
    responses={401: {"description": "Token ausente ou inválido"}},
)
async def create_patient(
    body: PatientCreate,
    current_user_id: str = Depends(get_current_user),
):
    patient = _db(lambda: patient_service.create_patient(current_user_id, body.model_dump()))
    logger.info("Paciente criado [%s] por médico [%s]", patient["id"], current_user_id)
    return PatientResponse(**patient)


@router.get(
    "",
    response_model=List[PatientListItem],
    summary="Listar pacientes",
    description="Retorna todos os pacientes do médico autenticado. Aceita filtro opcional por nome via `search`.",
    responses={401: {"description": "Token ausente ou inválido"}},
)
async def list_patients(
    search: Optional[str] = Query(None, max_length=100),
    current_user_id: str = Depends(get_current_user),
):
    rows = _db(lambda: patient_service.list_patients(current_user_id, search))
    return [PatientListItem(**r) for r in rows]


@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Detalhe do paciente",
    description="Retorna todos os dados de um paciente específico. Somente o médico que cadastrou tem acesso.",
    responses={
        401: {"description": "Token ausente ou inválido"},
        403: {"description": "Paciente não pertence ao médico autenticado"},
        404: {"description": "Paciente não encontrado"},
    },
)
async def get_patient(
    patient_id: str,
    current_user_id: str = Depends(get_current_user),
):
    try:
        patient = _db(lambda: patient_service.get_patient(patient_id, current_user_id))
    except PatientNotFoundError:
        raise HTTPException(status_code=404, detail="Paciente não encontrado.")
    except PatientAccessDeniedError:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return PatientResponse(**patient)


@router.patch(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Atualizar paciente",
    description="Atualiza os dados de um paciente. Somente o médico que cadastrou pode editar.",
    responses={
        401: {"description": "Token ausente ou inválido"},
        403: {"description": "Paciente não pertence ao médico autenticado"},
        404: {"description": "Paciente não encontrado"},
    },
)
async def update_patient(
    patient_id: str,
    body: PatientUpdate,
    current_user_id: str = Depends(get_current_user),
):
    try:
        updated = _db(
            lambda: patient_service.update_patient(
                patient_id, current_user_id, body.model_dump(exclude_none=True)
            )
        )
    except PatientNotFoundError:
        raise HTTPException(status_code=404, detail="Paciente não encontrado.")
    except PatientAccessDeniedError:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return PatientResponse(**updated)
