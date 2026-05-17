from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "medico@hospital.com.br",
                "password": "Senha@123",
            }
        }
    )

    email: EmailStr = Field(..., description="E-mail do médico cadastrado")
    password: str = Field(..., description="Senha do médico")
