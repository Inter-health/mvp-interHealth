from schemas.auth import LoginRequest
from schemas.users import UserResponse
from repositories import users as users_repo
from core.security import verify_password, create_access_token


class InvalidCredentialsError(Exception):
    pass


def login(body: LoginRequest) -> tuple[UserResponse, str]:
    row = users_repo.get_by_email_with_hash(body.email)

    if not row or not verify_password(body.password, row["password_hash"]):
        raise InvalidCredentialsError()

    token = create_access_token(row["id"])
    user = UserResponse(
        id=row["id"],
        name=row["name"],
        crm=row["crm"],
        email=row["email"],
        specialty=row["specialty"],
        ehrProvider=row["ehr_provider"],
        terms_accepted=row["terms_accepted"],
    )
    return user, token
