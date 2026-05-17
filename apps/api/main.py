import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from core.limiter import limiter
from routers import users, auth, consultations, patients, demo_requests

load_dotenv(Path(__file__).resolve().parent / ".env")

logger = logging.getLogger(__name__)

# Valida variáveis de ambiente obrigatórias antes de registrar qualquer rota.
# Sem isso, a app sobe "saudável" (GET /health → 200) mesmo sem JWT_SECRET,
# só explodindo na primeira requisição real que precisar da variável.
_REQUIRED_ENV_VARS = [
    "JWT_SECRET",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "TRANSCRIPT_ENCRYPTION_KEY",
]
for _var in _REQUIRED_ENV_VARS:
    if not os.environ.get(_var):
        raise RuntimeError(f"Variável de ambiente obrigatória ausente: {_var}")

_DESCRIPTION = """
Plataforma **InterHealth** — API REST para gestão de consultas médicas com transcrição automática de áudio.

## Autenticação

Endpoints protegidos exigem um **JWT Bearer Token**. Obtenha-o via `POST /auth/login` e inclua no header:

```
Authorization: Bearer <token>
```

Clique em **Authorize** (🔒) no topo desta página, cole `Bearer <token>` e teste os endpoints autenticados.

## Conformidade LGPD

- Transcrições criptografadas em repouso (AES-256 / Fernet)
- Dados armazenados no Supabase São Paulo (residência de dados BR)
- Transcrições expiram automaticamente em **30 dias**
- Consentimento do paciente obrigatório para processamento de áudio (Art. 7 LGPD)
"""

_TAGS_METADATA = [
    {"name": "auth", "description": "Autenticação de médicos. Retorna JWT com validade de **12 horas**."},
    {"name": "users", "description": "Cadastro e gestão do perfil do médico autenticado."},
    {"name": "consultations", "description": "Upload de áudio, polling de status e histórico de consultas."},
    {"name": "patients", "description": "Cadastro e busca de pacientes vinculados ao médico."},
    {"name": "demo_requests", "description": "Solicitação de demonstração para clínicas e hospitais (B2B)."},
]

app = FastAPI(
    title="InterHealth API",
    description=_DESCRIPTION,
    version="1.0.0",
    contact={"name": "InterHealth", "email": "contato@interhealth.com.br"},
    openapi_tags=_TAGS_METADATA,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Converte exceções não tratadas em respostas JSON com CORS headers.
    Sem isso, o ServerErrorMiddleware gera texto puro sem Access-Control-Allow-Origin,
    e o browser bloqueia a resposta como falha de CORS ("Failed to fetch").
    """
    logger.error("Unhandled exception [%s %s]: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor."})

cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(consultations.router)
app.include_router(patients.router)
app.include_router(demo_requests.router)


@app.get("/health", tags=["health"], summary="Health check")
def health():
    return {"status": "ok"}


_PUBLIC_ROUTES = {
    ("get", "/health"),
    ("post", "/auth/login"),
    ("post", "/users"),
    ("post", "/demo-requests"),
}


def _build_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        contact={"name": "InterHealth", "email": "contato@interhealth.com.br"},
        routes=app.routes,
        tags=_TAGS_METADATA,
    )
    schema.setdefault("components", {}).setdefault("securitySchemes", {})["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Token JWT obtido em `POST /auth/login`. Validade: 12 horas.",
    }
    for path, methods in schema.get("paths", {}).items():
        for method, operation in methods.items():
            if (method, path) not in _PUBLIC_ROUTES:
                operation["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return schema


app.openapi = _build_openapi
