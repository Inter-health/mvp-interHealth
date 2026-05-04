from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class PatientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    cpf: Optional[str] = Field(None, max_length=14)          # 000.000.000-00
    date_of_birth: Optional[str] = Field(None, max_length=10, pattern=r"^\d{4}-\d{2}-\d{2}$")
    gender: Optional[str] = Field(None, pattern=r"^[MFO]$")  # M, F ou O
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    notes: Optional[str] = Field(None, max_length=5000)


class PatientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    cpf: Optional[str] = Field(None, max_length=14)
    date_of_birth: Optional[str] = Field(None, max_length=10, pattern=r"^\d{4}-\d{2}-\d{2}$")
    gender: Optional[str] = Field(None, pattern=r"^[MFO]$")
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    notes: Optional[str] = Field(None, max_length=5000)


class PatientListItem(BaseModel):
    id: str
    name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    created_at: str


class PatientResponse(BaseModel):
    id: str
    name: str
    cpf: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str
