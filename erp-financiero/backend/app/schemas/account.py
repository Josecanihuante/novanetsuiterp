"""Schemas Pydantic v2 para Account y Period."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

# ── Account ───────────────────────────────────────────────────────────────────

class AccountBase(BaseModel):
    code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=255)
    account_type: str = Field(..., pattern=r"^(asset|liability|equity|revenue|expense)$")
    parent_id: Optional[str] = None
    description: Optional[str] = None


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    account_type: Optional[str] = Field(None, pattern=r"^(asset|liability|equity|revenue|expense)$")
    parent_id: Optional[str] = None
    description: Optional[str] = None


class AccountResponse(AccountBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Period ────────────────────────────────────────────────────────────────────

class PeriodBase(BaseModel):
    name: str = Field(..., max_length=50)
    start_date: datetime
    end_date: datetime
    fiscal_year: int = Field(..., ge=2000, le=2100)
    is_closed: bool = False


class PeriodCreate(PeriodBase):
    pass


class PeriodUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    is_closed: Optional[bool] = None


class PeriodResponse(PeriodBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
