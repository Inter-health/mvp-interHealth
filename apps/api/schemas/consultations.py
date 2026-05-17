from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ConsultationStatus(str, Enum):
    RECORDING = "RECORDING"
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    TRANSCRIBED = "TRANSCRIBED"
    ERROR = "ERROR"


class ConsultationResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "consultation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "status": "PENDING",
                "message": "Áudio recebido. Transcrição em andamento.",
            }
        }
    )

    consultation_id: str = Field(..., description="UUID da consulta criada")
    status: ConsultationStatus = Field(..., description="Status atual da consulta")
    message: str = Field(..., description="Mensagem informativa sobre o processamento")


class ConsultationStatusResponse(BaseModel):
    consultation_id: str = Field(..., description="UUID da consulta")
    status: ConsultationStatus = Field(..., description="Status atual: PENDING → PROCESSING → TRANSCRIBED | ERROR")
    patient_name: Optional[str] = Field(None, description="Nome do paciente informado no upload")
    transcript: Optional[str] = Field(None, description="Transcrição decriptada (disponível apenas quando status=TRANSCRIBED)")
    error_msg: Optional[str] = Field(None, description="Mensagem de erro (disponível quando status=ERROR)")
    created_at: str = Field(..., description="Data/hora de criação (ISO 8601)")


class ConsultationListItem(BaseModel):
    id: str = Field(..., description="UUID da consulta")
    patient_name: Optional[str] = Field(None, description="Nome do paciente")
    patient_id: Optional[str] = Field(None, description="UUID do paciente cadastrado (se vinculado)")
    status: ConsultationStatus = Field(..., description="Status atual da consulta")
    created_at: str = Field(..., description="Data/hora de criação (ISO 8601)")
    error_msg: Optional[str] = Field(None, description="Mensagem de erro (quando status=ERROR)")
