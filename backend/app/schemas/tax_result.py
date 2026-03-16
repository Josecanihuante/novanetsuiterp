from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class TaxResultBase(BaseModel):
    period_id: str
    total_sales: Decimal = Field(default=Decimal("0.00"), ge=0)
    total_purchases: Decimal = Field(default=Decimal("0.00"), ge=0)
    iva_collected: Decimal = Field(default=Decimal("0.00"), ge=0)
    iva_paid: Decimal = Field(default=Decimal("0.00"), ge=0)
    iva_balance: Decimal = Field(..., ge=-1000000, le=1000000)  # Can be negative
    ppm_paid: Decimal = Field(default=Decimal("0.00"), ge=0)
    calculated_at: datetime
    is_filed: bool = False


class TaxResultCreate(TaxResultBase):
    pass


class TaxResultUpdate(BaseModel):
    total_sales: Optional[Decimal] = Field(None, ge=0)
    total_purchases: Optional[Decimal] = Field(None, ge=0)
    iva_collected: Optional[Decimal] = Field(None, ge=0)
    iva_paid: Optional[Decimal] = Field(None, ge=0)
    iva_balance: Optional[Decimal] = Field(None, ge=-1000000, le=1000000)
    ppm_paid: Optional[Decimal] = Field(None, ge=0)
    calculated_at: Optional[datetime] = None
    is_filed: Optional[bool] = None


class TaxResultResponse(TaxResultBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}