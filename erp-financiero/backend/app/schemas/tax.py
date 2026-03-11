"""Schemas Pydantic v2 para TaxConfig, PpmPayment y TaxResult."""
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ── TaxConfig ─────────────────────────────────────────────────────────────────

class TaxConfigBase(BaseModel):
    tax_name: str = Field(..., max_length=100)
    tax_code: str = Field(..., max_length=20)
    rate: Decimal = Field(..., ge=0, le=100)
    applies_to: str = Field(..., pattern=r"^(sales|purchases|both)$")
    is_active: bool = True
    effective_from: datetime
    effective_to: Optional[datetime] = None


class TaxConfigCreate(TaxConfigBase):
    pass


class TaxConfigUpdate(BaseModel):
    rate: Optional[Decimal] = Field(None, ge=0, le=100)
    is_active: Optional[bool] = None
    effective_to: Optional[datetime] = None


class TaxConfigResponse(TaxConfigBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── PpmPayment ────────────────────────────────────────────────────────────────

class PpmPaymentBase(BaseModel):
    period_id: str
    taxable_base: Decimal = Field(..., ge=0)
    ppm_rate: Decimal = Field(..., ge=0, le=100)
    amount_due: Decimal = Field(..., ge=0)
    folio: Optional[str] = Field(None, max_length=50)


class PpmPaymentCreate(PpmPaymentBase):
    pass


class PpmPaymentUpdate(BaseModel):
    amount_paid: Optional[Decimal] = Field(None, ge=0)
    payment_date: Optional[datetime] = None
    status: Optional[str] = Field(None, pattern=r"^(pending|paid|overdue)$")
    folio: Optional[str] = Field(None, max_length=50)


class PpmPaymentResponse(PpmPaymentBase):
    id: str
    amount_paid: Decimal
    payment_date: Optional[datetime]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── TaxResult ─────────────────────────────────────────────────────────────────

class TaxResultBase(BaseModel):
    period_id: str
    total_sales: Decimal = Decimal("0.00")
    total_purchases: Decimal = Decimal("0.00")
    iva_collected: Decimal = Decimal("0.00")
    iva_paid: Decimal = Decimal("0.00")
    iva_balance: Decimal = Decimal("0.00")
    ppm_paid: Decimal = Decimal("0.00")
    calculated_at: datetime
    is_filed: bool = False


class TaxResultCreate(TaxResultBase):
    pass


class TaxResultResponse(TaxResultBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
