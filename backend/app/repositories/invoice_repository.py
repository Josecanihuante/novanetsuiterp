"""Repositorio CRUD para Invoice e InvoiceItem."""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.commerce import Invoice, InvoiceItem
from app.schemas.commerce import InvoiceCreate, InvoiceUpdate


class InvoiceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, invoice_id: str) -> Optional[Invoice]:
        return (
            self.db.query(Invoice)
            .options(joinedload(Invoice.items))
            .filter(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
            .first()
        )

    def get_by_number(self, number: str) -> Optional[Invoice]:
        return self.db.query(Invoice).filter(
            Invoice.invoice_number == number, Invoice.deleted_at.is_(None)
        ).first()

    def list(
        self,
        customer_id: Optional[str] = None,
        period_id: Optional[str] = None,
        status: Optional[str] = None,
        invoice_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Invoice]:
        q = self.db.query(Invoice).filter(Invoice.deleted_at.is_(None))
        if customer_id:
            q = q.filter(Invoice.customer_id == customer_id)
        if period_id:
            q = q.filter(Invoice.period_id == period_id)
        if status:
            q = q.filter(Invoice.status == status)
        if invoice_type:
            q = q.filter(Invoice.invoice_type == invoice_type)
        return q.order_by(Invoice.issue_date.desc()).offset(skip).limit(limit).all()

    def create(self, data: InvoiceCreate) -> Invoice:
        # Calcular totales a partir de los ítems
        subtotal = Decimal("0.00")
        tax_amount = Decimal("0.00")

        invoice = Invoice(
            invoice_number=data.invoice_number,
            invoice_type=data.invoice_type,
            customer_id=data.customer_id,
            vendor_id=data.vendor_id,
            period_id=data.period_id,
            issue_date=data.issue_date,
            due_date=data.due_date,
            payment_condition=data.payment_condition,
            currency=data.currency,
            notes=data.notes,
        )
        self.db.add(invoice)
        self.db.flush()

        for item_data in data.items:
            net = item_data.quantity * item_data.unit_price
            net_after_discount = net * (1 - item_data.discount_pct / 100)
            item_tax = net_after_discount * (item_data.tax_rate / 100)
            item_subtotal = net_after_discount

            item = InvoiceItem(
                invoice_id=invoice.id,
                product_id=item_data.product_id,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                discount_pct=item_data.discount_pct,
                tax_rate=item_data.tax_rate,
                subtotal=item_subtotal.quantize(Decimal("0.01")),
                line_order=item_data.line_order,
            )
            self.db.add(item)
            subtotal += item_subtotal
            tax_amount += item_tax

        if data.currency == "CLP":
            # Forzamos cálculos redondos sin decimales para CLP
            subtotal = round(subtotal)
            tax_amount = round(subtotal * Decimal("0.19"))
            
        invoice.subtotal = subtotal.quantize(Decimal("1")) if data.currency == "CLP" else subtotal.quantize(Decimal("0.01"))
        invoice.tax_amount = tax_amount.quantize(Decimal("1")) if data.currency == "CLP" else tax_amount.quantize(Decimal("0.01"))
        invoice.total = (invoice.subtotal + invoice.tax_amount)

        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def update(self, invoice: Invoice, data: InvoiceUpdate) -> Invoice:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(invoice, field, value)
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def soft_delete(self, invoice: Invoice) -> Invoice:
        invoice.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        return invoice
