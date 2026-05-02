import logging
from fastapi import APIRouter, HTTPException, Request

from core.limiter import limiter
from schemas.auth import LoginRequest
from services.auth import AccountLockedError, InvalidCredentialsError, login

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", status_code=200, response_model=dict)
@limiter.limit("10/minute")
def post_login(request: Request, body: LoginRequest):
    try:
        user, token = login(body)
    except AccountLockedError as e:
        raise HTTPException(
            status_code=423,
            detail=f"Conta bloqueada por {e.locked_until.strftime('%H:%M')} UTC após 5 tentativas. Tente novamente em 15 minutos.",
        )
    except InvalidCredentialsError:
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    except Exception:
        logger.exception("Erro inesperado em POST /auth/login")
        raise HTTPException(status_code=500, detail="Erro interno.")

    return {"user": user.model_dump(), "access_token": token, "token_type": "bearer"}
