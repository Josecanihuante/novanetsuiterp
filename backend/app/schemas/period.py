from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


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
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    fiscal_year: Optional[int] = Field(None, ge=2000, le=2100)
    is_closed: Optional[bool] = None


class PeriodResponse(PeriodBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}