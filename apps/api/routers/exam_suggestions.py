"""Router de sugestão de exames. Sem lógica de negócio — delega ao service e
mapeia exceções de domínio para HTTP. JWT obrigatório em todos os endpoints.
"""
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from core.limiter import limiter
from core.security import get_current_user
from repositories.exam_suggestions import SuggestionAccessDeniedError, SuggestionNotFoundError
from schemas.exam_suggestions import ExamSuggestion, ExamSuggestionManual, ExamSuggestionPatch
from services import exam_suggestions as service
from services.soap import (
    SOAPAccessDeniedError,
    SOAPGenerationError,
    SOAPNotFoundError,
    SOAPNotReadyError,
)

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/consultations/{consultation_id}/exam-suggestions",
    tags=["exam_suggestions"],
)


class GenerateExamsResponse(BaseModel):
    suggestions: List[ExamSuggestion]
    count: int


@router.post(
    "",
    status_code=202,
    response_model=GenerateExamsResponse,
    summary="Gerar sugestões de exames via IA",
    description=(
        "Gera sugestões de exames a partir das hipóteses diagnósticas do SOAP "
        "**confirmado**. Sugestões são assistivas — o médico aceita/rejeita/edita "
        "cada uma. Regenerar substitui as sugestões automáticas anteriores."
    ),
    responses={
        401: {"description": "Token ausente ou inválido"},
        403: {"description": "Consulta pertence a outro médico"},
        404: {"description": "Consulta não encontrada"},
        409: {"description": "SOAP não confirmado pelo médico"},
        502: {"description": "Falha temporária na geração (IA indisponível)"},
    },
)
@limiter.limit("10/minute")
async def generate(
    request: Request,
    consultation_id: str,
    current_user_id: str = Depends(get_current_user),
):
    try:
        created = service.generate_suggestions(consultation_id, current_user_id)
    except SOAPNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SOAPAccessDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except SOAPNotReadyError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except SOAPGenerationError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return GenerateExamsResponse(suggestions=created, count=len(created))


@router.get(
    "",
    response_model=List[ExamSuggestion],
    summary="Listar sugestões de exames",
    responses={401: {"description": "Token ausente ou inválido"}},
)
async def list_suggestions(
    consultation_id: str,
    current_user_id: str = Depends(get_current_user),
):
    return service.list_suggestions(consultation_id, current_user_id)


@router.patch(
    "/{suggestion_id}",
    response_model=ExamSuggestion,
    summary="Aceitar, rejeitar ou editar uma sugestão",
    responses={
        401: {"description": "Token ausente ou inválido"},
        403: {"description": "Sugestão pertence a outro médico"},
        404: {"description": "Sugestão não encontrada"},
    },
)
async def patch_suggestion(
    consultation_id: str,
    suggestion_id: str,
    body: ExamSuggestionPatch,
    current_user_id: str = Depends(get_current_user),
):
    try:
        return service.patch_suggestion(suggestion_id, current_user_id, body)
    except SuggestionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SuggestionAccessDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post(
    "/manual",
    status_code=201,
    response_model=ExamSuggestion,
    summary="Adicionar exame manualmente",
    responses={
        401: {"description": "Token ausente ou inválido"},
        403: {"description": "Consulta pertence a outro médico"},
        404: {"description": "Consulta não encontrada"},
    },
)
async def add_manual(
    consultation_id: str,
    body: ExamSuggestionManual,
    current_user_id: str = Depends(get_current_user),
):
    try:
        return service.add_manual(consultation_id, current_user_id, body)
    except SOAPNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SOAPAccessDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
