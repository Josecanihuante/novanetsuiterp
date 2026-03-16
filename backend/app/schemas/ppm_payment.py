from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class PpmPaymentBase(BaseModel):
    period_id: str
    taxable_base: Decimal = Field(..., ge=0)
    ppm_rate: Decimal = Field(..., ge=0, le=100)  # as percentage
    amount_due: Decimal = Field(..., ge=0)
    amount_paid: Decimal = Field(default=Decimal("0.00"), ge=0)
    payment_date: Optional[datetime] = None
    status: str = Field(default="pending", pattern=r"^(pending|paid|overdue)$")
    folio: Optional[str] = Field(None, max_length=50)


class PpmPaymentCreate(PpmPaymentBase):
    pass


class PpmPaymentUpdate(BaseModel):
    taxable_base: Optional[Decimal] = Field(None, ge=0)
    ppm_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    amount_due: Optional[Decimal] = Field(None, ge=0)
    amount_paid: Optional[Decimal] = Field(None, ge=0)
    payment_date: Optional[datetime] = None
    status: Optional[str] = Field(None, pattern=r"^(pending|paid|overdue)$")
    folio: Optional[str] = Field(None, max_length=50)


class PpmPaymentResponse(PpmPaymentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}