"""Schemas Pydantic v2 para Product y StockMovement."""
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ── Product ───────────────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    sku: str = Field(..., max_length=100)
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    unit_of_measure: str = Field(default="unit", max_length=20)
    sale_price: Decimal = Field(..., ge=0)
    cost_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    min_stock: Decimal = Field(default=Decimal("0.00"), ge=0)
    is_active: bool = True
    is_taxable: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    sale_price: Optional[Decimal] = Field(None, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    min_stock: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None
    is_taxable: Optional[bool] = None


class ProductResponse(ProductBase):
    id: str
    stock_quantity: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── StockMovement ─────────────────────────────────────────────────────────────

class StockMovementBase(BaseModel):
    product_id: str
    movement_type: str = Field(..., pattern=r"^(in|out|adjustment)$")
    quantity: Decimal = Field(..., ne=0)
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class StockMovementCreate(StockMovementBase):
    pass


class StockMovementResponse(StockMovementBase):
    id: str
    stock_before: Decimal
    stock_after: Decimal
    created_by: str
    created_at: datetime

    model_config = {"from_attributes": True}
