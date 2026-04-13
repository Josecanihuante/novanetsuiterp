"""Schemas Pydantic v2 para la entidad User."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

ROLES_VALIDOS = r"^(superadmin|admin|contador|viewer)$"


class UserBase(BaseModel):
    email:     EmailStr
    full_name: str  = Field(..., min_length=2, max_length=255)
    role:      str  = Field(default="viewer", pattern=ROLES_VALIDOS)
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    role:      Optional[str] = Field(None, pattern=ROLES_VALIDOS)
    is_active: Optional[bool] = None
    password:  Optional[str] = Field(None, min_length=8)


class UserResponse(UserBase):
    id:         str
    company_id: Optional[UUID] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
