import logging
from fastapi import APIRouter, HTTPException, Request

from core.limiter import limiter
from schemas.users import UserCreate, UserResponse
from services.users import EmailAlreadyExistsError, WeakPasswordError, create_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


@router.post("", status_code=201, response_model=dict)
@limiter.limit("10/minute")
def post_user(request: Request, body: UserCreate):
    try:
        user, token = create_user(body)
    except WeakPasswordError as e:
        raise HTTPException(
            status_code=422,
            detail={"message": "Senha não atende aos critérios de segurança.", "violations": e.violations},
        )
    except EmailAlreadyExistsError:
        raise HTTPException(status_code=409, detail="E-mail já cadastrado.")
    except Exception as e:
        logger.exception("Erro inesperado em POST /users")
        raise HTTPException(status_code=500, detail=str(e))

    return {"user": user.model_dump(), "access_token": token, "token_type": "bearer"}
