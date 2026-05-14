from datetime import datetime, timezone

from schemas.auth import LoginRequest
from schemas.users import UserResponse
from repositories import users as users_repo
from core.security import verify_password, create_access_token

# Hash dummy usado quando o e-mail não existe, para que verify_password() gaste
# o mesmo tempo de CPU que gastaria com um hash real (mitiga timing attack de
# enumeração de e-mails via diferença de latência ~30ms vs ~280ms).
_DUMMY_HASH = "$2b$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jKMUm"


class InvalidCredentialsError(Exception):
    pass


class AccountLockedError(Exception):
    def __init__(self, locked_until: datetime):
        self.locked_until = locked_until


def login(body: LoginRequest) -> tuple[UserResponse, str]:
    row = users_repo.get_by_email_with_hash(body.email)

    if row:
        locked_until_raw = row.get("locked_until")
        if locked_until_raw:
            locked_until = datetime.fromisoformat(locked_until_raw)
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)
            if locked_until > datetime.now(timezone.utc):
                raise AccountLockedError(locked_until)

    # Sempre chama verify_password — mesmo quando o e-mail não existe — para que
    # o tempo de resposta seja constante (~280ms bcrypt) independente de o e-mail
    # estar cadastrado ou não. Sem isso, um atacante enumeraria e-mails medindo
    # a diferença de latência entre ~30ms (inválido) e ~280ms (válido).
    password_hash = row["password_hash"] if row else _DUMMY_HASH
    password_ok = verify_password(body.password, password_hash)

    if not row or not password_ok:
        users_repo.increment_failed_attempts(body.email)
        raise InvalidCredentialsError()

    users_repo.reset_failed_attempts(row["id"])
    token = create_access_token(row["id"])
    user = UserResponse(
        id=row["id"],
        name=row["name"],
        crm=row.get("crm") or "",
        email=row["email"],
        specialty=row.get("specialty"),
        ehrProvider=row.get("ehr_provider"),
        terms_accepted=row["terms_accepted"],
    )
    return user, token
