from typing import List, Optional

from pydantic import BaseModel, Field


class SOAPContent(BaseModel):
    """Conteúdo clínico estruturado no formato SOAP (CFM Res. 1.638/2002)."""
    subjetivo: str = Field(..., description="Queixas e relato do paciente (S)")
    objetivo: str = Field(..., description="Achados e dados do exame do médico (O)")
    avaliacao: str = Field(..., description="Avaliação clínica e raciocínio diagnóstico (A)")
    plano: str = Field(..., description="Conduta, prescrições e orientações (P)")
    cid: Optional[str] = Field(None, description="Código CID-10 no formato 'X00.0'")
    hipoteses_diagnosticas: List[str] = Field(default_factory=list, description="Até 3 hipóteses diagnósticas")


class SOAPResponse(BaseModel):
    consultation_id: str = Field(..., description="UUID da consulta")
    soap: SOAPContent = Field(..., description="Conteúdo SOAP descriptografado")
    soap_status: str = Field(..., description="pending | generated | confirmed | rejected")


class SOAPConfirm(BaseModel):
    """Confirmação ou rejeição do SOAP pelo médico (human-in-the-loop).

    Quando action='confirm', o médico pode enviar edições opcionais que
    sobrescrevem o SOAP gerado antes de persistir como confirmado.
    """
    action: str = Field(..., description="'confirm' ou 'reject'")
    subjetivo: Optional[str] = None
    objetivo: Optional[str] = None
    avaliacao: Optional[str] = None
    plano: Optional[str] = None
    cid: Optional[str] = None
    hipoteses_diagnosticas: Optional[List[str]] = None
