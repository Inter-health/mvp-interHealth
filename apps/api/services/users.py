from schemas.users import UserCreate, UserResponse
from repositories import users as users_repo
from core.security import validate_password, hash_password, create_access_token


class EmailAlreadyExistsError(Exception):
    pass


class WeakPasswordError(Exception):
    def __init__(self, violations: list[str]):
        self.violations = violations


def create_user(body: UserCreate) -> tuple[UserResponse, str]:
    violations = validate_password(body.password)
    if violations:
        raise WeakPasswordError(violations)

    if users_repo.get_by_email(body.email):
        raise EmailAlreadyExistsError()

    row = users_repo.create({
        "name": body.name,
        "crm": body.crm,
        "email": body.email,
        "password_hash": hash_password(body.password),
        "specialty": body.specialty,
        "ehr_provider": body.ehrProvider,
        "terms_accepted": body.terms_accepted,
    })

    token = create_access_token(row["id"])
    user = UserResponse(
        id=row["id"],
        name=row["name"],
        crm=row["crm"] or "",
        email=row["email"],
        specialty=row.get("specialty") or "",
        ehrProvider=row.get("ehr_provider") or "",
        terms_accepted=row["terms_accepted"],
    )
    return user, token
