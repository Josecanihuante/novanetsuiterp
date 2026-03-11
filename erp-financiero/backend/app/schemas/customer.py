"""Schemas Pydantic v2 para Customer y Vendor."""
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ── Customer ──────────────────────────────────────────────────────────────────

class CustomerBase(BaseModel):
    tax_id: str = Field(..., max_length=20)
    name: str = Field(..., max_length=255)
    trade_name: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    country: str = Field(default="CHL", max_length=3)
    credit_limit: Decimal = Field(default=Decimal("0.00"), ge=0)
    payment_terms_days: int = Field(default=30, ge=0)
    is_active: bool = True


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    trade_name: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    credit_limit: Optional[Decimal] = Field(None, ge=0)
    payment_terms_days: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Vendor ────────────────────────────────────────────────────────────────────

class VendorBase(BaseModel):
    tax_id: str = Field(..., max_length=20)
    name: str = Field(..., max_length=255)
    trade_name: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    payment_terms_days: int = Field(default=30, ge=0)
    is_active: bool = True


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    trade_name: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    payment_terms_days: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class VendorResponse(VendorBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
