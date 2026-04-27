from fastapi import APIRouter, HTTPException, Request

from core.limiter import limiter
from schemas.demo_requests import DemoRequestCreate, DemoRequestResponse
from services import demo_requests as service

router = APIRouter(prefix="/demo-requests", tags=["demo_requests"])


@router.post("", response_model=DemoRequestResponse, status_code=201)
@limiter.limit("5/minute")
async def create_demo_request(request: Request, body: DemoRequestCreate):
    try:
        record = service.create_demo_request(
            company_name=body.company_name,
            role=body.role,
            doctor_count=body.doctor_count,
            email=body.email,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao registrar solicitação.") from e

    return DemoRequestResponse(
        id=record["id"],
        message="Solicitação recebida com sucesso! Entraremos em contato em breve.",
    )
