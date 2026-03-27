import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import UUID, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BscSnapshot(Base):
    __tablename__ = "bsc_snapshots"
    __table_args__ = {"schema": "financial"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    period_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounting.periods.id"), nullable=False, index=True
    )
    metric_code: Mapped[str] = mapped_column(String(50), nullable=False)
    metric_name: Mapped[str] = mapped_column(String(255), nullable=False)
    perspective: Mapped[str] = mapped_column(String(50), nullable=False) # financial, customer, internal, learning
    actual_value: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0.00"))
    target_value: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0.00"))
    status: Mapped[str] = mapped_column(String(20), nullable=False) # success, warning, danger
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<BscSnapshot metric={self.metric_code} value={self.actual_value}>"
