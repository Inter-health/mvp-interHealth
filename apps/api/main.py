import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from core.limiter import limiter
from routers import users, auth, consultations, patients, demo_requests

load_dotenv(Path(__file__).resolve().parent / ".env")

logger = logging.getLogger(__name__)

app = FastAPI(title="InterHealth API")
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
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(consultations.router)
app.include_router(patients.router)
app.include_router(demo_requests.router)


@app.get("/health")
def health():
    return {"status": "ok"}
