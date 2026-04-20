import ipaddress
from fastapi import Request


def get_real_ip(request: Request) -> str | None:
    """Extrai o IP real do cliente, considerando reverse proxy (X-Forwarded-For).

    Em produção (Render), o app roda atrás de um proxy que prefixa o IP real
    do cliente no cabeçalho X-Forwarded-For. O valor mais à esquerda é o IP
    originador — os demais são proxies intermediários.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        raw = forwarded_for.split(",")[0].strip()
        return _sanitize_ip(raw)
    if request.client:
        return _sanitize_ip(request.client.host)
    return None


def _sanitize_ip(raw: str) -> str | None:
    """Valida e normaliza um endereço IP. Retorna None se inválido."""
    try:
        return str(ipaddress.ip_address(raw))
    except ValueError:
        return None
