import os
import re
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

_PASSWORD_RULES = [
    (r".{8,}", "mínimo 8 caracteres"),
    (r"[A-Z]", "pelo menos uma letra maiúscula"),
    (r"[a-z]", "pelo menos uma letra minúscula"),
    (r"\d", "pelo menos um número"),
    (r"[^A-Za-z0-9]", "pelo menos um caractere especial"),
]


def validate_password(password: str) -> list[str]:
    """Retorna lista de critérios não atendidos. Vazia = senha válida."""
    return [msg for pattern, msg in _PASSWORD_RULES if not re.search(pattern, password)]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str) -> str:
    secret = os.environ["JWT_SECRET"]
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm="HS256")
