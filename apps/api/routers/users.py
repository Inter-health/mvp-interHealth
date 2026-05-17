import logging
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request

from core.limiter import limiter
from core.security import get_current_user
from core.utils import get_real_ip
from repositories import audit_logs as audit_repo
from repositories import users as user_repo
from schemas.audit_logs import AuditAction
from schemas.users import UserCreate, UserResponse, UserUpdate
from services.users import EmailAlreadyExistsError, WeakPasswordError, create_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


def _audit_user_created(user_id: str, action: AuditAction, ip_address: str | None) -> None:
    try:
        audit_repo.create_audit_log(user_id, action, ip_address)
    except Exception:
        logger.exception("Falha ao registrar audit log para user_id=%s", user_id)


@router.post(
    "",
    status_code=201,
    response_model=dict,
    summary="Cadastro de médico",
    description="Cria uma nova conta de médico. Retorna o perfil criado e um JWT para uso imediato.",
    responses={
        409: {"description": "E-mail já cadastrado"},
        422: {"description": "Senha fraca ou dados inválidos"},
    },
)
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


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Perfil do médico autenticado",
    description="Retorna os dados do médico logado (nome, CRM, especialidade, EHR).",
    responses={401: {"description": "Token ausente ou inválido"}},
)
def get_me(current_user_id: str = Depends(get_current_user)):
    user = user_repo.get_by_id(current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return UserResponse(
        id=user["id"],
        name=user["name"],
        crm=user["crm"] or "",
        email=user["email"],
        specialty=user.get("specialty") or "",
        ehrProvider=user.get("ehr_provider") or "",
        terms_accepted=user["terms_accepted"],
    )


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Atualizar perfil do médico",
    description="Atualiza CRM, especialidade ou sistema de prontuário (EHR) do médico autenticado. Usado no onboarding após o primeiro cadastro.",
    responses={
        400: {"description": "Nenhum campo informado para atualizar"},
        401: {"description": "Token ausente ou inválido"},
    },
)
def patch_me(body: UserUpdate, current_user_id: str = Depends(get_current_user)):
    data: dict = {}
    if body.crm is not None:
        data["crm"] = body.crm
    if body.specialty is not None:
        data["specialty"] = body.specialty
    if body.ehrProvider is not None:
        data["ehr_provider"] = body.ehrProvider

    if not data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar.")

    row = user_repo.update_by_id(current_user_id, data)
    if not row:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    return UserResponse(
        id=row["id"],
        name=row["name"],
        crm=row["crm"] or "",
        email=row["email"],
        specialty=row.get("specialty") or "",
        ehrProvider=row.get("ehr_provider") or "",
        terms_accepted=row["terms_accepted"],
    )
