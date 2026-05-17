from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PatientCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Maria Souza",
                "cpf": "123.456.789-00",
                "date_of_birth": "1985-03-15",
                "gender": "F",
                "phone": "(11) 99999-9999",
                "email": "maria.souza@email.com",
                "notes": "Paciente hipertensa. Uso de Losartana 50mg.",
            }
        }
    )

    name: str = Field(..., min_length=1, max_length=255, description="Nome completo do paciente")
    cpf: Optional[str] = Field(None, max_length=14, description="CPF no formato 000.000.000-00")
    date_of_birth: Optional[str] = Field(None, max_length=10, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Data de nascimento (YYYY-MM-DD)")
    gender: Optional[str] = Field(None, pattern=r"^[MFO]$", description="Gênero: M (masculino), F (feminino), O (outro)")
    phone: Optional[str] = Field(None, max_length=20, description="Telefone de contato")
    email: Optional[EmailStr] = Field(None, description="E-mail do paciente")
    notes: Optional[str] = Field(None, max_length=5000, description="Observações clínicas (máx. 5000 caracteres)")


class PatientUpdate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "phone": "(11) 88888-8888",
                "notes": "Passou a usar Enalapril 10mg.",
            }
        }
    )

    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Nome completo")
    cpf: Optional[str] = Field(None, max_length=14, description="CPF no formato 000.000.000-00")
    date_of_birth: Optional[str] = Field(None, max_length=10, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Data de nascimento (YYYY-MM-DD)")
    gender: Optional[str] = Field(None, pattern=r"^[MFO]$", description="Gênero: M, F ou O")
    phone: Optional[str] = Field(None, max_length=20, description="Telefone de contato")
    email: Optional[EmailStr] = Field(None, description="E-mail do paciente")
    notes: Optional[str] = Field(None, max_length=5000, description="Observações clínicas")


class PatientListItem(BaseModel):
    id: str = Field(..., description="UUID do paciente")
    name: str = Field(..., description="Nome completo")
    date_of_birth: Optional[str] = Field(None, description="Data de nascimento (YYYY-MM-DD)")
    gender: Optional[str] = Field(None, description="Gênero: M, F ou O")
    phone: Optional[str] = Field(None, description="Telefone de contato")
    email: Optional[str] = Field(None, description="E-mail do paciente")
    created_at: str = Field(..., description="Data de cadastro (ISO 8601)")


class PatientResponse(BaseModel):
    id: str = Field(..., description="UUID do paciente")
    name: str = Field(..., description="Nome completo")
    cpf: Optional[str] = Field(None, description="CPF no formato 000.000.000-00")
    date_of_birth: Optional[str] = Field(None, description="Data de nascimento (YYYY-MM-DD)")
    gender: Optional[str] = Field(None, description="Gênero: M, F ou O")
    phone: Optional[str] = Field(None, description="Telefone de contato")
    email: Optional[str] = Field(None, description="E-mail do paciente")
    notes: Optional[str] = Field(None, description="Observações clínicas")
    created_at: str = Field(..., description="Data de cadastro (ISO 8601)")
    updated_at: str = Field(..., description="Última atualização (ISO 8601)")
