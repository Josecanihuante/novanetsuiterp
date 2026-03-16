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


# ── Schemas Pydantic v2 para Invoice e InvoiceItem.

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, model_validator


# ── InvoiceItem ───────────────────────────────────────────────────────────────

class InvoiceItemBase(BaseModel):
    product_id: Optional[str] = None
    description: str
    quantity: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)
    discount_pct: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    tax_rate: Decimal = Field(default=Decimal("19.00"), ge=0)
    line_order: int = 0


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemResponse(InvoiceItemBase):
    id: str
    invoice_id: str
    subtotal: Decimal

    model_config = {"from_attributes": True}


# ── Invoice ───────────────────────────────────────────────────────────────────

class InvoiceBase(BaseModel):
    invoice_number: str = Field(..., max_length=50)
    invoice_type: str = Field(..., pattern=r"^(sales|purchase|credit_note|debit_note)$")
    customer_id: Optional[str] = None
    vendor_id: Optional[str] = None
    period_id: str
    issue_date: datetime
    due_date: datetime
    currency: str = Field(default="CLP", max_length=3)
    notes: Optional[str] = None

    @model_validator(mode="after")
    def check_party(self) -> "InvoiceBase":
        if self.invoice_type in ("sales", "credit_note", "debit_note") and not self.customer_id:
            raise ValueError("Las facturas de venta requieren customer_id.")
        if self.invoice_type == "purchase" and not self.vendor_id:
            raise ValueError("Las facturas de compra requieren vendor_id.")
        return self


class InvoiceCreate(InvoiceBase):
    items: list[InvoiceItemCreate] = Field(..., min_length=1)


class InvoiceUpdate(BaseModel):
    status: Optional[str] = Field(
        None, pattern=r"^(draft|issued|paid|overdue|cancelled)$"
    )
    notes: Optional[str] = None
    due_date: Optional[datetime] = None


class InvoiceResponse(InvoiceBase):
    id: str
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal
    paid_amount: Decimal
    status: str
    created_at: datetime
    updated_at: datetime
    items: list[InvoiceItemResponse] = []

    model_config = {"from_attributes": True}