import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from core.limiter import limiter
from core.utils import get_real_ip
from repositories import audit_logs as audit_repo
from schemas.audit_logs import AuditAction
from schemas.users import UserCreate, UserResponse
from services.users import EmailAlreadyExistsError, WeakPasswordError, create_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


def _audit_user_created(user_id: str, action: AuditAction, ip_address: str | None) -> None:
    try:
        audit_repo.create_audit_log(user_id, action, ip_address)
    except Exception:
        logger.exception("Falha ao registrar audit log para user_id=%s", user_id)


@router.post("", status_code=201, response_model=dict)
@limiter.limit("10/minute")
def post_user(request: Request, body: UserCreate, background_tasks: BackgroundTasks):
    ip_address = get_real_ip(request)
    try:
        user, token = create_user(body)
    except WeakPasswordError as e:
        raise HTTPException(
            status_code=422,
            detail={"message": "Senha não atende aos critérios de segurança.", "violations": e.violations},
        )
    except EmailAlreadyExistsError:
        raise HTTPException(status_code=409, detail="E-mail já cadastrado.")
    except Exception:
        logger.exception("Erro inesperado em POST /users")
        raise HTTPException(status_code=500, detail="Erro interno. Tente novamente.")

    background_tasks.add_task(_audit_user_created, user.id, AuditAction.USER_CREATED, ip_address)

    return {"user": user.model_dump(), "access_token": token, "token_type": "bearer"}
