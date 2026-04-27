from pydantic import BaseModel, EmailStr


class DemoRequestCreate(BaseModel):
    company_name: str
    role: str
    doctor_count: str
    email: EmailStr


class DemoRequestResponse(BaseModel):
    id: str
    message: str
