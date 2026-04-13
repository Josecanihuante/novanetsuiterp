import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import UUID, Boolean, DateTime, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"
    __table_args__ = {"schema": "users"}

    id:         Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rut:        Mapped[str]        = mapped_column(String(20), unique=True, nullable=False)
    name:       Mapped[str]        = mapped_column(String(255), nullable=False)
    trade_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    activity:   Mapped[str | None] = mapped_column(String(255), nullable=True)
    address:    Mapped[str | None] = mapped_column(Text, nullable=True)
    city:       Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone:      Mapped[str | None] = mapped_column(String(50), nullable=True)
    email:      Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_url:   Mapped[str | None] = mapped_column(Text, nullable=True)
    tax_regime: Mapped[str]        = mapped_column(String(30), nullable=False, default="general")
    ppm_rate:   Mapped[Decimal]    = mapped_column(Numeric(8, 6), nullable=False, default=Decimal("0.028"))
    is_active:  Mapped[bool]       = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime]   = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime]   = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Company rut={self.rut} name={self.name}>"
