from typing import Literal, Optional

from pydantic import BaseModel, Field

CategoryType = Literal["laboratorial", "imagem", "funcional", "outro"]
PriorityType = Literal["alta", "media", "baixa"]
StatusType = Literal["sugerido", "aceito", "rejeitado", "editado"]


class ExamStatus:
    """Estados de uma sugestão de exame (evita strings mágicas nos services)."""
    SUGGESTED = "sugerido"
    ACCEPTED = "aceito"
    REJECTED = "rejeitado"
    EDITED = "editado"


class ExamSuggestion(BaseModel):
    id: str
    consultation_id: str
    exam_name: str
    category: CategoryType
    justification: str
    hypothesis_ref: str
    priority: PriorityType
    status: StatusType
    is_manual: bool
    created_at: str


class ExamSuggestionPatch(BaseModel):
    """Aceitar / rejeitar / editar uma sugestão (ação explícita do médico)."""
    status: Optional[StatusType] = None
    exam_name: Optional[str] = None


class ExamSuggestionManual(BaseModel):
    """Exame adicionado manualmente pelo médico."""
    exam_name: str
    category: CategoryType
    justification: str
    hypothesis_ref: str = Field(default="Manual")
    priority: PriorityType
