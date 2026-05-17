from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Dr. João Silva",
                "email": "joao.silva@hospital.com.br",
                "password": "Senha@123",
                "terms_accepted": True,
                "crm": "12345-SP",
                "specialty": "Clínica Geral",
                "ehrProvider": "Tasy",
            }
        }
    )

    name: str = Field(..., min_length=1, max_length=255, description="Nome completo do médico")
    email: EmailStr = Field(..., description="E-mail para login")
    password: str = Field(
        ..., min_length=8, max_length=128,
        description="Senha (mín. 8 chars, letra maiúscula, minúscula, número e caractere especial)",
    )
    terms_accepted: bool = Field(..., description="Aceite dos termos de uso e política de privacidade")
    crm: str = Field(default="", max_length=50, description="Número do CRM (ex: 12345-SP). Pode ser preenchido depois.")
    specialty: Optional[str] = Field(None, max_length=100, description="Especialidade médica")
    ehrProvider: Optional[str] = Field(None, max_length=100, description="Sistema de prontuário eletrônico (EHR)")


class UserUpdate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "crm": "12345-SP",
                "specialty": "Clínica Geral",
                "ehrProvider": "Tasy",
            }
        }
    )

    crm: Optional[str] = Field(None, max_length=50, description="Número do CRM")
    specialty: Optional[str] = Field(None, max_length=100, description="Especialidade médica")
    ehrProvider: Optional[str] = Field(None, max_length=100, description="Sistema de prontuário eletrônico")


class UserResponse(BaseModel):
    id: str = Field(..., description="UUID do médico")
    name: str = Field(..., description="Nome completo")
    crm: str = Field(..., description="Número do CRM")
    email: str = Field(..., description="E-mail")
    specialty: Optional[str] = Field(None, description="Especialidade médica")
    ehrProvider: Optional[str] = Field(None, description="Sistema de prontuário eletrônico")
    terms_accepted: bool = Field(..., description="Termos de uso aceitos")
