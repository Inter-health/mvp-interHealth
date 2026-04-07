from fastapi import APIRouter, HTTPException
from schemas.users import UserCreate, UserResponse
from services.users import create_user, EmailAlreadyExistsError, WeakPasswordError

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", status_code=201, response_model=dict)
def post_user(body: UserCreate):
    try:
        user, token = create_user(body)
    except WeakPasswordError as e:
        raise HTTPException(
            status_code=422,
            detail={"message": "Senha não atende aos critérios de segurança.", "violations": e.violations},
        )
    except EmailAlreadyExistsError:
        raise HTTPException(status_code=409, detail="E-mail já cadastrado.")

    return {"user": user.model_dump(), "access_token": token, "token_type": "bearer"}
