import pytest
from core.limiter import limiter


@pytest.fixture(autouse=True)
def disable_rate_limiter():
    """Desabilita o rate limiter durante os testes para não interferir nos resultados."""
    limiter.enabled = False
    yield
    limiter.enabled = True
