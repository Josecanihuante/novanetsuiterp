"""Endpoints del motor de contabilización y mapeo de cuentas."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.models.invoice_mapping import InvoiceAccountMapping, PurchaseInvoice
from app.models.commerce import Invoice
from app.services.accounting_engine import AccountingEngine
from app.services.sii_import_service import SIIImportService

router = APIRouter(prefix="/accounting-engine", tags=["Motor Contabilización"])


# ── Guards de rol ─────────────────────────────────────────────────────────────

def require_admin_or_contador(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role == "viewer":
        raise HTTPException(
            status_code=403,
            detail={"code": "FORBIDDEN", "message": "Viewers no pueden contabilizar."},
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail={"code": "FORBIDDEN", "message": "Solo administradores."},
        )
    return current_user


# ── CONTABILIZACIÓN MANUAL DE VENTAS ─────────────────────────────────────────

@router.post("/invoices/{invoice_id}/contabilizar")
def contabilizar_venta(
    invoice_id: UUID,
    mapping_id: Optional[UUID] = None,
    posted: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_contador),
):
    """
    Contabiliza manualmente una factura de venta.

    El asiento se genera con:
    - DEBE  CxC Clientes    → total
    - HABER Ingresos        → subtotal neto
    - HABER IVA Débito      → tax_amount

    Solo disponible para admin y contador.
    """
    invoice = db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND"})

    engine = AccountingEngine(db)
    entry  = engine.contabilizar_venta(
        invoice, mapping_id=mapping_id, posted=posted, created_by=current_user.id
    )
    db.commit()
    return {
        "success": True,
        "data": {
            "entry_number": entry.entry_number,
            "entry_id":     str(entry.id),
            "status":       entry.status,
        },
    }


# ── CONTABILIZACIÓN MANUAL DE COMPRAS ────────────────────────────────────────

@router.post("/purchase-invoices/{purchase_id}/contabilizar")
def contabilizar_compra(
    purchase_id: UUID,
    mapping_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_contador),
):
    """
    Contabiliza una factura de compra importada del SII.

    El asiento queda en borrador (status='draft') para revisión manual.
    """
    purchase = db.get(PurchaseInvoice, purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND"})

    engine = AccountingEngine(db)
    entry  = engine.contabilizar_compra(
        purchase, mapping_id=mapping_id, posted=False, created_by=current_user.id
    )
    db.commit()
    return {
        "success": True,
        "data": {
            "entry_number": entry.entry_number,
            "entry_id":     str(entry.id),
            "status":       entry.status,
        },
    }


# ── IMPORTACIÓN RCV SII ───────────────────────────────────────────────────────

@router.post("/sii/import-rcv")
async def import_rcv(
    csv_file: UploadFile = File(...),
    period_month: int = Query(..., ge=1, le=12),
    period_year:  int = Query(..., ge=2020, le=2030),
    auto_contabilizar: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_contador),
):
    """
    Importa el Registro de Compras del SII desde archivo CSV.

    Para descargar el CSV del SII:
    1. Ir a misiimovil.cl
    2. Servicios Online → Registro de Compras y Ventas
    3. Seleccionar mes y año
    4. Compras → Descargar → formato CSV
    """
    if not csv_file.filename or not csv_file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail={"code": "ARCHIVO_INVALIDO", "message": "El archivo debe ser un .csv"},
        )
    content = await csv_file.read()
    csv_str = content.decode("utf-8-sig")   # utf-8-sig maneja BOM de Excel

    svc   = SIIImportService(db)
    stats = svc.import_rcv_csv(
        csv_str, period_month, period_year,
        auto_contabilizar=auto_contabilizar,
        created_by=current_user.id,
    )
    return {"success": True, "data": stats}


# ── LISTADO DE FACTURAS DE COMPRA ─────────────────────────────────────────────

@router.get("/purchase-invoices")
def list_purchase_invoices(
    status: Optional[str] = None,
    month:  Optional[int] = Query(None, ge=1, le=12),
    year:   Optional[int] = Query(None, ge=2020, le=2030),
    skip:   int = Query(0, ge=0),
    limit:  int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista facturas de compra importadas del SII con filtros opcionales."""
    q = db.query(PurchaseInvoice)
    if status:
        q = q.filter(PurchaseInvoice.status == status)
    if month:
        q = q.filter(extract("month", PurchaseInvoice.fecha_emision) == month)
    if year:
        q = q.filter(extract("year", PurchaseInvoice.fecha_emision) == year)

    total = q.count()
    items = q.order_by(PurchaseInvoice.fecha_emision.desc()).offset(skip).limit(limit).all()

    return {
        "success": True,
        "total":   total,
        "data": [
            {
                "id":               str(p.id),
                "document_type":    p.document_type,
                "folio":            p.folio,
                "fecha_emision":    p.fecha_emision.isoformat(),
                "rut_emisor":       p.rut_emisor,
                "razon_social":     p.razon_social_emisor,
                "monto_neto":       float(p.monto_neto),
                "monto_iva":        float(p.monto_iva),
                "monto_total":      float(p.monto_total),
                "status":           p.status,
                "journal_entry_id": str(p.journal_entry_id) if p.journal_entry_id else None,
            }
            for p in items
        ],
    }


# ── MAPEO DE CUENTAS ──────────────────────────────────────────────────────────

@router.get("/account-mappings")
def list_mappings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista todos los mapeos de cuentas contables activos."""
    mappings = (
        db.query(InvoiceAccountMapping)
        .filter(InvoiceAccountMapping.is_active == True)    # noqa: E712
        .all()
    )
    return {
        "success": True,
        "data": [
            {
                "id":                    str(m.id),
                "mapping_type":          m.mapping_type,
                "description":           m.description,
                "is_default":            m.is_default,
                "account_receivable_id": str(m.account_receivable_id) if m.account_receivable_id else None,
                "account_income_id":     str(m.account_income_id)     if m.account_income_id     else None,
                "account_iva_debito_id": str(m.account_iva_debito_id) if m.account_iva_debito_id else None,
                "account_payable_id":    str(m.account_payable_id)    if m.account_payable_id    else None,
                "account_expense_id":    str(m.account_expense_id)    if m.account_expense_id    else None,
                "account_iva_credito_id":str(m.account_iva_credito_id)if m.account_iva_credito_id else None,
            }
            for m in mappings
        ],
    }


@router.post("/account-mappings")
def create_mapping(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Crea un nuevo mapeo de cuentas contables. Solo admin."""
    # Prevenir inyección de campos no permitidos
    allowed = {
        "mapping_type", "description", "is_default",
        "account_receivable_id", "account_income_id", "account_iva_debito_id",
        "account_payable_id", "account_expense_id", "account_iva_credito_id",
    }
    clean = {k: v for k, v in data.items() if k in allowed}
    mapping = InvoiceAccountMapping(**clean, created_by=current_user.id)
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return {"success": True, "data": {"id": str(mapping.id), "mapping_type": mapping.mapping_type}}


@router.put("/account-mappings/{mapping_id}")
def update_mapping(
    mapping_id: UUID,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Actualiza un mapeo de cuentas contables. Solo admin."""
    mapping = db.get(InvoiceAccountMapping, mapping_id)
    if not mapping:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND"})
    allowed = {
        "description", "is_default", "is_active",
        "account_receivable_id", "account_income_id", "account_iva_debito_id",
        "account_payable_id", "account_expense_id", "account_iva_credito_id",
    }
    for k, v in data.items():
        if k in allowed:
            setattr(mapping, k, v)
    db.commit()
    db.refresh(mapping)
    return {"success": True, "data": {"id": str(mapping.id)}}
