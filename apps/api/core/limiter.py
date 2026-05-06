from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def _get_real_ip(request: Request) -> str:
    # Em produção (Render), o IP real chega via X-Forwarded-For.
    # get_remote_address() retornaria o IP do proxy, tornando o rate limiter
    # inútil (todos os clientes compartilham o mesmo "IP").
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=_get_real_ip)
