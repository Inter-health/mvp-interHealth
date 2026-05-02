from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    terms_accepted: bool
    crm: str = Field(default="", max_length=50)
    specialty: Optional[str] = Field(None, max_length=100)
    ehrProvider: Optional[str] = Field(None, max_length=100)


class UserUpdate(BaseModel):
    crm: Optional[str] = None
    specialty: Optional[str] = None
    ehrProvider: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: str
    crm: str
    email: str
    specialty: str
    ehrProvider: str
    terms_accepted: bool
