"""Router do prontuário SOAP — MVP2.

Sem lógica de negócio: recebe HTTP, delega ao service, mapeia exceções de
domínio para status HTTP. JWT obrigatório em todos os endpoints.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from core.limiter import limiter
from core.security import get_current_user
from schemas.soap import SOAPConfirm, SOAPContent, SOAPResponse
from services import soap as soap_service
from services.exceptions import (
    AccessDeniedError,
    AlreadyConfirmedError,
    GenerationError,
    NotFoundError,
    NotReadyError,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/consultations/{consultation_id}/soap", tags=["soap"])


def _to_response(result: dict) -> SOAPResponse:
    return SOAPResponse(
        consultation_id=result["consultation_id"],
        soap=result["soap"] if isinstance(result["soap"], SOAPContent) else SOAPContent(**result["soap"]),
        soap_status=result["soap_status"],
    )


@router.post(
    "/generate",
    status_code=201,
    response_model=SOAPResponse,
    summary="Gerar prontuário SOAP via IA",
    description=(
        "Gera o prontuário SOAP a partir da transcrição da consulta usando IA. "
        "O resultado fica em status `generated` e **exige confirmação do médico** "
        "(human-in-the-loop) antes de ser considerado válido. "
        "A IA não prescreve nem solicita exames — apenas documenta a consulta."
    ),
    responses={
        401: {"description": "Token ausente ou inválido"},
        403: {"description": "Consulta pertence a outro médico"},
        404: {"description": "Consulta não encontrada"},
        409: {"description": "Transcrição não disponível"},
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
        result = soap_service.generate_soap(consultation_id, current_user_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except AccessDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotReadyError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except GenerationError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return _to_response(result)


@router.get(
    "",
    response_model=SOAPResponse,
    summary="Buscar prontuário SOAP",
    description="Retorna o SOAP gerado ou confirmado da consulta.",
    responses={
        401: {"description": "Token ausente ou inválido"},
        403: {"description": "Consulta pertence a outro médico"},
        404: {"description": "SOAP ainda não gerado"},
    },
)
async def get_soap(
    consultation_id: str,
    current_user_id: str = Depends(get_current_user),
):
    try:
        result = soap_service.get_soap(consultation_id, current_user_id)
    except AccessDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except (NotFoundError, NotReadyError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _to_response(result)


@router.post(
    "/confirm",
    response_model=SOAPResponse,
    summary="Confirmar ou rejeitar o prontuário SOAP",
    description=(
        "Confirma o SOAP (com edições opcionais do médico) ou o rejeita. "
        "Ação explícita do médico — nenhum prontuário é validado automaticamente."
    ),
    responses={
        401: {"description": "Token ausente ou inválido"},
        403: {"description": "Consulta pertence a outro médico"},
        404: {"description": "Consulta não encontrada"},
        409: {"description": "SOAP não está pronto para revisão ou já confirmado"},
    },
)
async def confirm(
    consultation_id: str,
    body: SOAPConfirm,
    current_user_id: str = Depends(get_current_user),
):
    try:
        result = soap_service.confirm_soap(consultation_id, current_user_id, body)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except AccessDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except (NotReadyError, AlreadyConfirmedError) as e:
        raise HTTPException(status_code=409, detail=str(e))
    return _to_response(result)
