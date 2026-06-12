"""Cliente LLM — geração de texto via provedor plugável (Strategy).

Usado pelo motor de SOAP e pela sugestão de exames. Centraliza a chamada ao
provedor para que services não conheçam detalhes do SDK.

Padrão Strategy: `LLMProvider` define a interface; `GeminiProvider` é a estratégia
concreta atual (Google Gemini, modelo padrão `gemini-2.5-flash`). Trocar/adicionar
provedor (ex.: Claude) = nova classe + `set_provider()`, sem tocar em `call_llm`
(Open/Closed). `call_llm` mantém a política estável: retry, checagem de resposta
vazia e conversão de falhas em `LLMError` (mensagem amigável — Regra 7).

Chave: variável de ambiente `GEMINI_API_KEY` (nunca hardcoded — LGPD/segredos).
"""
import json
import logging
import os
import time
from typing import Any, Protocol

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gemini-2.5-flash"
DEFAULT_TEMPERATURE = 0.3
_MAX_ATTEMPTS = 2  # 1 tentativa + 1 retry


class LLMError(Exception):
    """Falha amigável na geração via LLM. Mensagem segura para exibir ao usuário."""


class LLMProvider(Protocol):
    """Estratégia de geração. Implementações fazem UMA chamada ao provedor
    (sem retry — política de retry vive em `call_llm`) e devolvem o texto bruto."""

    def generate(
        self,
        prompt: str,
        system: str,
        *,
        model: str,
        max_tokens: int,
        temperature: float,
        json_mode: bool,
    ) -> str: ...


class GeminiProvider:
    """Estratégia concreta: Google Gemini via `google-genai`.

    Cliente criado sob demanda (lazy) e reutilizado: a app sobe mesmo sem o SDK
    instalado ou sem a chave (ambientes que não usam geração)."""

    def __init__(self) -> None:
        self._client = None

    def _get_client(self):
        if self._client is not None:
            return self._client

        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise LLMError("Serviço de geração indisponível no momento.")

        try:
            from google import genai
        except ImportError as e:  # pragma: no cover - dependência ausente
            logger.error("google-genai não instalado: %s", e)
            raise LLMError("Serviço de geração indisponível no momento.")

        self._client = genai.Client(api_key=api_key)
        return self._client

    def generate(
        self,
        prompt: str,
        system: str,
        *,
        model: str,
        max_tokens: int,
        temperature: float,
        json_mode: bool,
    ) -> str:
        from google.genai import types

        client = self._get_client()
        config = types.GenerateContentConfig(
            system_instruction=system,
            temperature=temperature,
            max_output_tokens=max_tokens,
            response_mime_type="application/json" if json_mode else "text/plain",
        )
        response = client.models.generate_content(model=model, contents=prompt, config=config)
        return (response.text or "").strip()


# Estratégia ativa. Injetável (testes / troca de provedor) via set_provider().
_provider: LLMProvider = GeminiProvider()


def set_provider(provider: LLMProvider) -> None:
    """Substitui o provedor LLM ativo (Open/Closed: novo provedor sem editar call_llm)."""
    global _provider
    _provider = provider


def call_llm(
    prompt: str,
    system: str,
    model: str | None = None,
    max_tokens: int = 1500,
    temperature: float = DEFAULT_TEMPERATURE,
    json_mode: bool = True,
) -> str:
    """Gera texto a partir de `prompt`, ancorado por `system`, via provedor ativo.

    json_mode=True força `application/json` no provedor — o retorno é uma string
    JSON válida (sem markdown), ideal para parse determinístico de SOAP/exames.

    Retorna o texto bruto da resposta. Lança `LLMError` em qualquer falha.
    """
    last_error: Exception | None = None
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            text = _provider.generate(
                prompt,
                system,
                model=model or DEFAULT_MODEL,
                max_tokens=max_tokens,
                temperature=temperature,
                json_mode=json_mode,
            )
            if not text:
                raise LLMError("Resposta vazia do modelo.")
            return text
        except LLMError:
            raise
        except Exception as e:  # noqa: BLE001 — qualquer falha do SDK vira retry/LLMError
            last_error = e
            logger.warning("Falha na chamada LLM (tentativa %d/%d): %s", attempt, _MAX_ATTEMPTS, e)
            if attempt < _MAX_ATTEMPTS:
                time.sleep(0.5 * attempt)

    logger.error("LLM indisponível após %d tentativas: %s", _MAX_ATTEMPTS, last_error)
    raise LLMError("Não foi possível gerar agora. Tente novamente em instantes.")


def parse_json(raw: str) -> Any:
    """Extrai JSON da resposta do LLM, tolerante a cercas markdown (```json ... ```),
    mesmo com json_mode ligado. Lança `ValueError` se não for JSON válido — o
    service traduz para a mensagem de domínio apropriada (SOAP vs exames)."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lstrip().lower().startswith("json"):
            cleaned = cleaned.lstrip()[4:]
    try:
        return json.loads(cleaned)
    except (json.JSONDecodeError, TypeError) as e:
        raise ValueError(str(e))
