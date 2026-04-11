"""
Modelos SQLAlchemy para:
- accounting.invoice_account_mapping  → mapeo de cuentas contables por tipo de factura
- commerce.purchase_invoices          → facturas de compra importadas del SII
"""
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    UUID, Boolean, CheckConstraint, Date, DateTime,
    ForeignKey, Integer, Numeric, SmallInteger, String, Text,
    UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ── Mapeo de cuentas contables ────────────────────────────────────────────────

class InvoiceAccountMapping(Base):
    """Mapeo de cuentas contables por tipo de documento (sale / purchase / credit_note)."""
    __tablename__ = "invoice_account_mapping"
    __table_args__ = (
        CheckConstraint(
            "mapping_type IN ('sale', 'purchase', 'credit_note')",
            name="ck_mapping_type",
        ),
        {"schema": "accounting"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    mapping_type: Mapped[str] = mapped_column(String(20), nullable=False)

    # Cuentas para VENTA
    account_receivable_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounting.accounts.id"), nullable=True
    )
    account_income_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounting.accounts.id"), nullable=True
    )
    account_iva_debito_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounting.accounts.id"), nullable=True
    )

    # Cuentas para COMPRA
    account_payable_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounting.accounts.id"), nullable=True
    )
    account_expense_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounting.accounts.id"), nullable=True
    )
    account_iva_credito_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounting.accounts.id"), nullable=True
    )

    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<InvoiceAccountMapping type={self.mapping_type} default={self.is_default}>"


# ── Facturas de compra (importadas del SII) ───────────────────────────────────

class PurchaseInvoice(Base):
    """Facturas de compra recibidas: importadas del Registro de Compras SII o ingresadas manualmente."""
    __tablename__ = "purchase_invoices"
    __table_args__ = (
        UniqueConstraint("document_type", "folio", "rut_emisor", name="uq_purchase_inv"),
        CheckConstraint(
            "status IN ('pendiente','contabilizada','anulada')",
            name="ck_purchase_status",
        ),
        CheckConstraint(
            "source IN ('sii_import','manual')",
            name="ck_purchase_source",
        ),
        {"schema": "commerce"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_type: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=33)
    folio: Mapped[int] = mapped_column(Integer, nullable=False)
    fecha_emision: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_recepcion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Emisor (proveedor)
    rut_emisor: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    razon_social_emisor: Mapped[str] = mapped_column(String(255), nullable=False)
    vendor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("commerce.vendors.id"), nullable=True, index=True
    )

    # Montos
    monto_neto: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    monto_iva: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    monto_total: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0"))

    # Contabilización
    journal_entry_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounting.journal_entries.id"), nullable=True
    )
    account_mapping_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounting.invoice_account_mapping.id"), nullable=True
    )

    # Estado
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pendiente", index=True)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="sii_import")
    sii_import_batch_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<PurchaseInvoice rut={self.rut_emisor} folio={self.folio} status={self.status}>"
