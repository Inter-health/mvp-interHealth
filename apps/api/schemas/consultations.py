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
    status: str
    message: str


class ConsultationStatusResponse(BaseModel):
    consultation_id: str
    status: str
    transcript: Optional[str] = None
    error_msg: Optional[str] = None
    created_at: str
