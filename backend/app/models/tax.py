import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TaxConfig(Base):
    __tablename__ = "tax_config"
    __table_args__ = {"schema": "taxes"}

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    tax_name: Mapped[str] = mapped_column(String(100), nullable=False)
    tax_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # IVA, PPM, etc.
    rate: Mapped[Decimal] = mapped_column(Numeric(7, 4), nullable=False)
    applies_to: Mapped[str] = mapped_column(String(50), nullable=False)  # sales/purchases/both
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<TaxConfig code={self.tax_code} rate={self.rate}>"


class PpmPayment(Base):
    """Pagos Provisionales Mensuales (Chile)."""

    __tablename__ = "ppm_payments"
    __table_args__ = {"schema": "taxes"}

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    period_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("accounting.periods.id"), nullable=False, index=True
    )
    taxable_base: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    ppm_rate: Mapped[Decimal] = mapped_column(Numeric(7, 4), nullable=False)
    amount_due: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0.00"))
    payment_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending/paid/overdue
    folio: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<PpmPayment period={self.period_id} amount={self.amount_due} status={self.status}>"


class TaxResult(Base):
    """Resultado consolidado de impuestos por período."""

    __tablename__ = "tax_results"
    __table_args__ = {"schema": "taxes"}

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    period_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("accounting.periods.id"), nullable=False, unique=True, index=True
    )
    total_sales: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0.00"))
    total_purchases: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0.00"))
    iva_collected: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0.00"))
    iva_paid: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0.00"))
    iva_balance: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0.00"))
    ppm_paid: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0.00"))
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_filed: Mapped[bool] = mapped_column(default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<TaxResult period={self.period_id} balance={self.iva_balance}>"
