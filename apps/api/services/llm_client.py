"""Cliente LLM — geração de texto via Google Gemini.

Usado pelo motor de SOAP e pela sugestão de exames. Centraliza a chamada ao
provedor para que services não conheçam detalhes do SDK.

Provedor: Google Gemini (modelo padrão `gemini-2.5-flash`).
Chave: variável de ambiente `GEMINI_API_KEY` (nunca hardcoded — LGPD/segredos).

Falhas (rede, cota, resposta vazia) são convertidas em `LLMError` com mensagem
amigável, para que a camada de service degrade graciosamente sem vazar stack
trace ao médico (Regra 7 — falhas de serviços auxiliares não quebram a tela).
"""
import logging
import os
import time

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gemini-2.5-flash"
DEFAULT_TEMPERATURE = 0.3
_MAX_ATTEMPTS = 2  # 1 tentativa + 1 retry

# Cliente é criado sob demanda (lazy) e reutilizado entre chamadas.
_client = None


class LLMError(Exception):
    """Falha amigável na geração via LLM. Mensagem segura para exibir ao usuário."""


def _get_client():
    """Inicializa o cliente Gemini uma única vez. Import lazy: a app sobe mesmo
    sem o SDK instalado (ex.: ambientes que não usam geração)."""
    global _client
    if _client is not None:
        return _client

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise LLMError("Serviço de geração indisponível no momento.")

    try:
        from google import genai
    except ImportError as e:  # pragma: no cover - dependência ausente
        logger.error("google-genai não instalado: %s", e)
        raise LLMError("Serviço de geração indisponível no momento.")

    _client = genai.Client(api_key=api_key)
    return _client


def call_llm(
    prompt: str,
    system: str,
    model: str | None = None,
    max_tokens: int = 1500,
    temperature: float = DEFAULT_TEMPERATURE,
    json_mode: bool = True,
) -> str:
    """Gera texto a partir de `prompt`, ancorado por `system`.

    json_mode=True força `application/json` no provedor — o retorno é uma string
    JSON válida (sem markdown), ideal para parse determinístico de SOAP/exames.

    Retorna o texto bruto da resposta. Lança `LLMError` em qualquer falha.
    """
    from google.genai import types

    client = _get_client()
    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=temperature,
        max_output_tokens=max_tokens,
        response_mime_type="application/json" if json_mode else "text/plain",
    )

    last_error: Exception | None = None
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            response = client.models.generate_content(
                model=model or DEFAULT_MODEL,
                contents=prompt,
                config=config,
            )
            text = (response.text or "").strip()
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
