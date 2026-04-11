"""Modelos SQLAlchemy para el schema sii (Documentos Tributarios Electrónicos)."""
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    UUID, Boolean, CheckConstraint, Date, DateTime,
    ForeignKey, Integer, Numeric, SmallInteger, String, Text, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DocumentType(Base):
    """Tipos de DTE soportados por el SII."""
    __tablename__ = "document_types"
    __table_args__ = {"schema": "sii"}

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    code: Mapped[int] = mapped_column(SmallInteger, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    def __repr__(self) -> str:
        return f"<DocumentType code={self.code} name={self.name}>"


class CafFolios(Base):
    """Folios CAF por tipo de documento, entregados por el SII."""
    __tablename__ = "caf_folios"
    __table_args__ = {"schema": "sii"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_type: Mapped[int] = mapped_column(
        SmallInteger,
        ForeignKey("sii.document_types.code"),
        nullable=False,
        index=True,
    )
    folio_desde: Mapped[int] = mapped_column(Integer, nullable=False)
    folio_hasta: Mapped[int] = mapped_column(Integer, nullable=False)
    folio_actual: Mapped[int] = mapped_column(Integer, nullable=False)
    # XML completo del CAF entregado por el SII — NO exponer en endpoints públicos
    caf_xml: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_vencimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return (
            f"<CafFolios type={self.document_type} "
            f"range={self.folio_desde}-{self.folio_hasta} "
            f"actual={self.folio_actual}>"
        )


class DteEmitido(Base):
    """DTEs emitidos por la empresa."""
    __tablename__ = "dte_emitidos"
    __table_args__ = (
        UniqueConstraint("document_type", "folio", "ambiente", name="uq_dte_tipo_folio_ambiente"),
        CheckConstraint(
            "estado_sii IN ('PENDIENTE','ENVIADO','ACEPTADO','ACEPTADO_REPAROS','RECHAZADO','ANULADO')",
            name="ck_dte_estado_sii",
        ),
        {"schema": "sii"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    invoice_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commerce.invoices.id"),
        nullable=True,
        index=True,
    )
    document_type: Mapped[int] = mapped_column(
        SmallInteger,
        ForeignKey("sii.document_types.code"),
        nullable=False,
    )
    folio: Mapped[int] = mapped_column(Integer, nullable=False)
    fecha_emision: Mapped[date] = mapped_column(Date, nullable=False)

    rut_receptor: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    razon_social_receptor: Mapped[str] = mapped_column(String(255), nullable=False)

    monto_neto: Mapped[Decimal] = mapped_column(
        Numeric(18, 0), nullable=False, default=Decimal("0")
    )
    monto_iva: Mapped[Decimal] = mapped_column(
        Numeric(18, 0), nullable=False, default=Decimal("0")
    )
    monto_total: Mapped[Decimal] = mapped_column(
        Numeric(18, 0), nullable=False, default=Decimal("0")
    )

    # XML firmado completo — disponible solo en producción con certificado
    xml_firmado: Mapped[str | None] = mapped_column(Text, nullable=True)
    # ID de seguimiento asignado por el SII al recibir el envío
    track_id: Mapped[str | None] = mapped_column(String(50), nullable=True)

    estado_sii: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PENDIENTE", index=True
    )
    error_mensaje: Mapped[str | None] = mapped_column(Text, nullable=True)
    pdf_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    ambiente: Mapped[str] = mapped_column(
        String(20), nullable=False, default="CERTIFICACION"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relación hacia la factura de origen
    invoice: Mapped["Invoice | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Invoice", foreign_keys=[invoice_id]
    )

    def __repr__(self) -> str:
        return (
            f"<DteEmitido type={self.document_type} "
            f"folio={self.folio} estado={self.estado_sii}>"
        )
