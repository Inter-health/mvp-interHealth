from datetime import datetime, timezone

from schemas.auth import LoginRequest
from schemas.users import UserResponse
from repositories import users as users_repo
from core.security import verify_password, create_access_token


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

    if not row or not verify_password(body.password, row["password_hash"]):
        users_repo.increment_failed_attempts(body.email)
        raise InvalidCredentialsError()

    users_repo.reset_failed_attempts(row["id"])
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
