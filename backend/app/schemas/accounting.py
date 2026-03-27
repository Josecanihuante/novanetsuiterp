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


"""Schemas Pydantic v2 para JournalEntry y JournalLine."""
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, model_validator


# ── JournalLine ───────────────────────────────────────────────────────────────

class JournalLineBase(BaseModel):
    account_id: str
    debit: Decimal = Field(default=Decimal("0.00"), ge=0)
    credit: Decimal = Field(default=Decimal("0.00"), ge=0)
    description: Optional[str] = None
    line_order: int = 0

    @model_validator(mode="after")
    def debit_or_credit_not_both(self) -> "JournalLineBase":
        if self.debit > 0 and self.credit > 0:
            raise ValueError("Una línea no puede tener simultáneamente débito y crédito.")
        return self


class JournalLineCreate(JournalLineBase):
    pass


class JournalLineResponse(JournalLineBase):
    id: str
    journal_entry_id: str

    model_config = {"from_attributes": True}


# ── JournalEntry ──────────────────────────────────────────────────────────────

class JournalEntryBase(BaseModel):
    period_id: str
    entry_number: str = Field(..., max_length=50)
    entry_date: datetime
    description: Optional[str] = None
    reference: Optional[str] = Field(None, max_length=100)
    status: str = Field(default="draft", pattern=r"^(draft|posted|cancelled)$")


class JournalEntryCreate(JournalEntryBase):
    lines: list[JournalLineCreate] = Field(..., min_length=2)

    @model_validator(mode="after")
    def lines_must_balance(self) -> "JournalEntryCreate":
        total_debit = sum(l.debit for l in self.lines)
        total_credit = sum(l.credit for l in self.lines)
        if total_debit != total_credit:
            raise ValueError(
                f"El asiento no cuadra: débito={total_debit} ≠ crédito={total_credit}"
            )
        return self


class JournalEntryUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r"^(draft|posted|cancelled)$")
    reference: Optional[str] = Field(None, max_length=100)


class JournalEntryResponse(JournalEntryBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    lines: list[JournalLineResponse] = []

    model_config = {"from_attributes": True}


class PeriodBase(BaseModel):
    name: str = Field(..., max_length=50)
    start_date: datetime
    end_date: datetime
    is_closed: bool = False
    fiscal_year: int

class PeriodCreate(PeriodBase):
    pass

class PeriodUpdate(BaseModel):
    name: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    is_closed: bool | None = None
    fiscal_year: int | None = None

class PeriodResponse(PeriodBase):
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = {'from_attributes': True}
