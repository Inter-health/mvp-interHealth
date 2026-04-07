from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    crm: str
    email: EmailStr
    password: str
    specialty: str
    ehrProvider: str
    terms_accepted: bool


class UserResponse(BaseModel):
    id: str
    name: str
    crm: str
    email: str
    specialty: str
    ehrProvider: str
    terms_accepted: bool
