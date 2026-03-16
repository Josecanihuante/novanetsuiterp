"""Router Facturas."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.repositories.invoice_repository import InvoiceRepository
from app.schemas.commerce import InvoiceCreate, InvoiceUpdate

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def _rbac_write(user: User):
    if user.role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Sin permisos."}},
        )


def _invoice_dict(inv) -> dict:
    return {
        "id": inv.id, "invoice_number": inv.invoice_number,
        "invoice_type": inv.invoice_type, "status": inv.status,
        "customer_id": inv.customer_id, "vendor_id": inv.vendor_id,
        "issue_date": inv.issue_date.isoformat(),
        "due_date": inv.due_date.isoformat(),
        "currency": inv.currency,
        "subtotal": float(inv.subtotal),
        "tax_amount": float(inv.tax_amount),
        "total": float(inv.total),
        "paid_amount": float(inv.paid_amount),
        "notes": inv.notes,
    }


@router.get("", response_model=dict, summary="Listar facturas")
def list_invoices(
    invoice_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = InvoiceRepository(db)
    skip = (page - 1) * size
    invoices = repo.list(status=status_filter, invoice_type=invoice_type, skip=skip, limit=size)
    return {
        "success": True,
        "data": [_invoice_dict(i) for i in invoices],
        "meta": {"page": page, "size": size, "count": len(invoices)},
    }


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Crear factura (IVA 19% automático)")
def create_invoice(
    body: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    repo = InvoiceRepository(db)
    if repo.get_by_number(body.invoice_number):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "DUPLICATE_NUMBER", "message": f"Ya existe la factura {body.invoice_number}."}},
        )
    invoice = repo.create(body)
    return {"success": True, "data": _invoice_dict(invoice)}


@router.get("/{invoice_id}", response_model=dict, summary="Detalle con líneas")
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = InvoiceRepository(db)
    invoice = repo.get_by_id(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Factura no encontrada."}})
    data = _invoice_dict(invoice)
    data["items"] = [
        {
            "id": it.id, "description": it.description,
            "quantity": float(it.quantity), "unit_price": float(it.unit_price),
            "discount_pct": float(it.discount_pct), "tax_rate": float(it.tax_rate),
            "subtotal": float(it.subtotal),
        }
        for it in invoice.items
    ]
    return {"success": True, "data": data}


@router.put("/{invoice_id}", response_model=dict, summary="Editar factura (solo borradores)")
def update_invoice(
    invoice_id: str,
    body: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    repo = InvoiceRepository(db)
    invoice = repo.get_by_id(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Factura no encontrada."}})
    if invoice.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "NOT_DRAFT", "message": "Solo se pueden editar facturas en borrador."}},
        )
    invoice = repo.update(invoice, body)
    return {"success": True, "data": _invoice_dict(invoice)}


@router.patch("/{invoice_id}/issue", response_model=dict, summary="Emitir factura (draft → issued)")
def issue_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    repo = InvoiceRepository(db)
    invoice = repo.get_by_id(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Factura no encontrada."}})
    if invoice.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "NOT_DRAFT", "message": "Solo se pueden emitir facturas en borrador."}},
        )
    invoice = repo.update(invoice, InvoiceUpdate(status="issued"))
    return {"success": True, "data": {"id": invoice.id, "status": invoice.status}}
