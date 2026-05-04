from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    crm: str = Field(..., max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    specialty: str = Field(..., max_length=100)
    ehrProvider: str = Field(..., max_length=100)
    terms_accepted: bool


class UserResponse(BaseModel):
    id: str
    name: str
    crm: str
    email: str
    specialty: str
    ehrProvider: str
    terms_accepted: bool
