"""Exceções de domínio compartilhadas entre os services (MVP2+).

Centralizar aqui evita o acoplamento em que um service importava as exceções de
outro (ex.: o service de exames dependia de `services.soap` só pelos nomes das
exceções, que nem eram semanticamente de "SOAP"). Os routers mapeiam estas
exceções para status HTTP; os repositories NÃO as lançam (autorização é regra de
negócio e vive no service).
"""


class DomainError(Exception):
    """Base de erros de regra de negócio. Mensagem é segura para exibir ao usuário."""


class NotFoundError(DomainError):
    """Recurso inexistente (consulta, SOAP ou sugestão)."""


class AccessDeniedError(DomainError):
    """Recurso pertence a outro médico."""


class NotReadyError(DomainError):
    """Pré-condição de estado não satisfeita (transcrição/SOAP ausente, ação inválida)."""


class AlreadyConfirmedError(DomainError):
    """SOAP já confirmado — não pode ser reconfirmado/rejeitado."""


class GenerationError(DomainError):
    """Falha ao gerar/interpretar conteúdo via LLM (indisponível ou formato inválido).
    Mensagem amigável e segura para exibir ao médico."""
