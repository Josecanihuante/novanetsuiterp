"""
Motor de contabilización automática de facturas.
Genera asientos contables según el mapeo de cuentas configurado.

Adaptaciones al schema real del proyecto:
- JournalEntry.status  ('draft' | 'posted')  en lugar de is_posted boolean
- JournalEntry.entry_date  es DateTime (timezone=True)
- Invoice.issue_date  (no invoice_date)
- JournalEntry.created_by  es obligatorio → usa un UUID de sistema
"""
import logging
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.accounting import JournalEntry, JournalLine, Period, Account
from app.models.invoice_mapping import InvoiceAccountMapping, PurchaseInvoice
from app.models.commerce import Invoice

logger = logging.getLogger(__name__)

# UUID de sistema para asientos automáticos (no asociados a un usuario real)
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class AccountingEngine:

    def __init__(self, db: Session):
        self.db = db

    # ── UTILIDADES ───────────────────────────────────────────────────────────

    def get_active_period(self, target_dt: datetime) -> Period:
        """Obtiene el período contable activo para una fecha dada."""
        period = (
            self.db.query(Period)
            .filter(
                Period.start_date <= target_dt,
                Period.end_date   >= target_dt,
                Period.is_closed  == False,     # noqa: E712
            )
            .first()
        )
        if not period:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "NO_PERIOD_AVAILABLE",
                    "message": (
                        f"No existe un período contable abierto para la fecha "
                        f"{target_dt.date()}. Verifique que el período esté creado "
                        f"y no esté cerrado."
                    ),
                },
            )
        return period

    def get_default_mapping(self, mapping_type: str) -> InvoiceAccountMapping:
        """Obtiene el mapeo de cuentas por defecto para un tipo de documento."""
        mapping = (
            self.db.query(InvoiceAccountMapping)
            .filter(
                InvoiceAccountMapping.mapping_type == mapping_type,
                InvoiceAccountMapping.is_default   == True,    # noqa: E712
                InvoiceAccountMapping.is_active    == True,    # noqa: E712
            )
            .first()
        )
        if not mapping:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "NO_ACCOUNT_MAPPING",
                    "message": (
                        f"No existe un mapeo de cuentas por defecto para tipo '{mapping_type}'. "
                        "Configure el mapeo en Contabilidad → Mapeo de Cuentas."
                    ),
                },
            )
        return mapping

    def get_account(self, account_id: UUID, role: str) -> Account:
        """Obtiene una cuenta contable y valida que exista."""
        account = self.db.get(Account, account_id)
        if not account:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "ACCOUNT_NOT_FOUND",
                    "message": f"La cuenta contable para '{role}' no existe en el plan de cuentas.",
                },
            )
        return account

    # ── FACTURAS DE VENTA ────────────────────────────────────────────────────

    def contabilizar_venta(
        self,
        invoice: Invoice,
        mapping_id: Optional[UUID] = None,
        posted: bool = True,
        created_by: Optional[UUID] = None,
    ) -> JournalEntry:
        """
        Genera el asiento contable para una factura de venta emitida.

        Asiento:
          DEBE   CxC Clientes          → total
          HABER  Ingresos (cuenta 4-x) → subtotal (neto)
          HABER  IVA Débito Fiscal     → tax_amount
        """
        if invoice.journal_entry_id:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "ALREADY_POSTED",
                    "message": "Esta factura ya tiene un asiento contable generado.",
                },
            )

        issue_dt = invoice.issue_date
        period   = self.get_active_period(issue_dt)
        mapping  = (
            self.db.get(InvoiceAccountMapping, mapping_id)
            if mapping_id
            else self.get_default_mapping("sale")
        )

        cxc     = self.get_account(mapping.account_receivable_id, "CxC Clientes")
        ingreso = self.get_account(mapping.account_income_id,     "Ingresos")
        iva_df  = self.get_account(mapping.account_iva_debito_id, "IVA Débito Fiscal")

        entry_number = self._next_entry_number("VTA", issue_dt)
        status_val   = "posted" if posted else "draft"
        user_id      = created_by or SYSTEM_USER_ID

        entry = JournalEntry(
            entry_number=entry_number,
            entry_date=issue_dt,
            description=(
                f"Factura {invoice.invoice_number} — "
                f"{invoice.customer.name if invoice.customer else 'Cliente'}"
            ),
            status=status_val,
            period_id=period.id,
            created_by=user_id,
        )
        self.db.add(entry)
        self.db.flush()

        lines = [
            JournalLine(
                journal_entry_id=entry.id,
                account_id=cxc.id,
                debit=Decimal(str(invoice.total)),
                credit=Decimal("0"),
                description=f"CxC {invoice.invoice_number}",
                line_order=1,
            ),
            JournalLine(
                journal_entry_id=entry.id,
                account_id=ingreso.id,
                debit=Decimal("0"),
                credit=Decimal(str(invoice.subtotal)),
                description=f"Ingreso {invoice.invoice_number}",
                line_order=2,
            ),
            JournalLine(
                journal_entry_id=entry.id,
                account_id=iva_df.id,
                debit=Decimal("0"),
                credit=Decimal(str(invoice.tax_amount)),
                description=f"IVA DF {invoice.invoice_number}",
                line_order=3,
            ),
        ]
        for line in lines:
            self.db.add(line)

        invoice.journal_entry_id   = entry.id
        invoice.account_mapping_id = mapping.id

        self.db.flush()
        logger.info(
            "Asiento %s generado para factura %s | Total: %s | Período: %s",
            entry_number, invoice.invoice_number, invoice.total, period.name,
        )
        return entry

    # ── FACTURAS DE COMPRA ───────────────────────────────────────────────────

    def contabilizar_compra(
        self,
        purchase: PurchaseInvoice,
        mapping_id: Optional[UUID] = None,
        posted: bool = False,   # compras quedan en borrador por defecto para revisión
        created_by: Optional[UUID] = None,
    ) -> JournalEntry:
        """
        Genera el asiento contable para una factura de compra recibida.

        Asiento:
          DEBE   Gasto (cuenta 5-x o 6-x)  → monto_neto
          DEBE   IVA Crédito Fiscal         → monto_iva
          HABER  CxP Proveedores            → monto_total
        """
        if purchase.journal_entry_id:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "ALREADY_POSTED",
                    "message": "Esta factura de compra ya tiene un asiento contable.",
                },
            )

        fecha_dt = purchase.fecha_emision
        period   = self.get_active_period(fecha_dt)
        mapping  = (
            self.db.get(InvoiceAccountMapping, mapping_id)
            if mapping_id
            else self.get_default_mapping("purchase")
        )

        gasto  = self.get_account(mapping.account_expense_id,     "Gasto")
        iva_cf = self.get_account(mapping.account_iva_credito_id, "IVA Crédito Fiscal")
        cxp    = self.get_account(mapping.account_payable_id,     "CxP Proveedores")

        entry_number = self._next_entry_number("CMP", fecha_dt)
        status_val   = "posted" if posted else "draft"
        user_id      = created_by or SYSTEM_USER_ID

        entry = JournalEntry(
            entry_number=entry_number,
            entry_date=fecha_dt,
            description=f"Factura recibida {purchase.folio} — {purchase.razon_social_emisor}",
            status=status_val,
            period_id=period.id,
            created_by=user_id,
        )
        self.db.add(entry)
        self.db.flush()

        lines = [
            JournalLine(
                journal_entry_id=entry.id,
                account_id=gasto.id,
                debit=Decimal(str(purchase.monto_neto)),
                credit=Decimal("0"),
                description=f"Gasto factura {purchase.folio} — {purchase.razon_social_emisor}",
                line_order=1,
            ),
            JournalLine(
                journal_entry_id=entry.id,
                account_id=iva_cf.id,
                debit=Decimal(str(purchase.monto_iva)),
                credit=Decimal("0"),
                description=f"IVA CF factura {purchase.folio}",
                line_order=2,
            ),
            JournalLine(
                journal_entry_id=entry.id,
                account_id=cxp.id,
                debit=Decimal("0"),
                credit=Decimal(str(purchase.monto_total)),
                description=f"CxP {purchase.razon_social_emisor}",
                line_order=3,
            ),
        ]
        for line in lines:
            self.db.add(line)

        purchase.journal_entry_id   = entry.id
        purchase.account_mapping_id = mapping.id
        purchase.status             = "contabilizada"

        self.db.flush()
        logger.info(
            "Asiento %s generado para compra folio %s | Total: %s",
            entry_number, purchase.folio, purchase.monto_total,
        )
        return entry

    # ── HELPERS ──────────────────────────────────────────────────────────────

    def _next_entry_number(self, prefix: str, entry_date: datetime) -> str:
        """Genera el siguiente número de asiento: VTA-2025-0001."""
        year = entry_date.year
        last = (
            self.db.query(JournalEntry)
            .filter(JournalEntry.entry_number.like(f"{prefix}-{year}-%"))
            .order_by(JournalEntry.entry_number.desc())
            .first()
        )
        seq = 1
        if last:
            try:
                seq = int(last.entry_number.split("-")[-1]) + 1
            except (ValueError, IndexError):
                seq = 1
        return f"{prefix}-{year}-{str(seq).zfill(4)}"
