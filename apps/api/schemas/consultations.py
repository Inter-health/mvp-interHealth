from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ConsultationStatus(str, Enum):
    RECORDING = "RECORDING"
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    TRANSCRIBED = "TRANSCRIBED"
    ERROR = "ERROR"


class ConsultationResponse(BaseModel):
    consultation_id: str
    status: ConsultationStatus
    message: str


class ConsultationStatusResponse(BaseModel):
    consultation_id: str
    status: ConsultationStatus
    patient_name: Optional[str] = None
    transcript: Optional[str] = None
    error_msg: Optional[str] = None
    created_at: str


class ConsultationListItem(BaseModel):
    id: str
    patient_name: Optional[str] = None
    patient_id: Optional[str] = None
    status: ConsultationStatus
    created_at: str
    error_msg: Optional[str] = None
