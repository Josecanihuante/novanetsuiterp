from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class BscSnapshotBase(BaseModel):
    period_id: str
    perspective: str = Field(..., pattern=r"^(financial|customer|internal|learning)$")
    kpi_name: str = Field(..., max_length=100)
    actual_value: Decimal = Field(..., ge=0)
    target_value: Decimal = Field(..., ge=0)
    status: str = Field(..., pattern=r"^(green|yellow|red)$")
    details: str | None = None

class BscSnapshotCreate(BscSnapshotBase):
    pass

class BscSnapshotResponse(BscSnapshotBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
