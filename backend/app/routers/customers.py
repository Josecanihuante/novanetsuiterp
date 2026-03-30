"""Router Clientes y Proveedores."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.repositories.customer_repository import CustomerRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.schemas.commerce import CustomerCreate, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["Customers"])


def _rbac_write(user: User):
    if user.role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Sin permisos."}},
        )


def _cust_dict(c) -> dict:
    return {
        "id": c.id, "tax_id": c.tax_id, "name": c.name,
        "trade_name": c.trade_name, "email": c.email, "phone": c.phone,
        "address": c.address, "city": c.city, "country": c.country,
        "credit_limit": float(c.credit_limit),
        "payment_terms_days": c.payment_terms_days,
        "is_active": c.is_active,
    }


@router.get("", response_model=dict, summary="Listar clientes")
def list_customers(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = CustomerRepository(db)
    customers = repo.list(skip=(page - 1) * size, limit=size, is_active=is_active, search=search)
    return {
        "success": True,
        "data": [_cust_dict(c) for c in customers],
        "meta": {"page": page, "size": size, "count": len(customers)},
    }


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Crear cliente")
def create_customer(
    body: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    repo = CustomerRepository(db)
    if repo.get_by_tax_id(body.tax_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "DUPLICATE_TAX_ID", "message": f"Ya existe cliente con RUT {body.tax_id}."}},
        )
    customer = repo.create(body)
    return {"success": True, "data": _cust_dict(customer)}


@router.get("/{customer_id}", response_model=dict, summary="Detalle de cliente")
def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = CustomerRepository(db)
    customer = repo.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Cliente no encontrado."}})
    return {"success": True, "data": _cust_dict(customer)}


@router.put("/{customer_id}", response_model=dict, summary="Editar cliente")
def update_customer(
    customer_id: str,
    body: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    repo = CustomerRepository(db)
    customer = repo.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Cliente no encontrado."}})
    customer = repo.update(customer, body)
    return {"success": True, "data": _cust_dict(customer)}


@router.delete("/{customer_id}", response_model=dict, summary="Eliminar cliente (soft delete)")
def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Solo admin puede eliminar."}})
    repo = CustomerRepository(db)
    customer = repo.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Cliente no encontrado."}})
    repo.soft_delete(customer)
    return {"success": True, "data": {"message": "Cliente eliminado correctamente."}}


@router.get("/{customer_id}/invoices", response_model=dict, summary="Historial de facturas del cliente")
def customer_invoices(
    customer_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer_repo = CustomerRepository(db)
    if not customer_repo.get_by_id(customer_id):
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Cliente no encontrado."}})
    inv_repo = InvoiceRepository(db)
    invoices = inv_repo.list(customer_id=customer_id, skip=(page - 1) * size, limit=size)
    return {
        "success": True,
        "data": [
            {
                "id": i.id, "invoice_number": i.invoice_number,
                "issue_date": i.issue_date.isoformat(),
                "total": float(i.total), "status": i.status,
            }
            for i in invoices
        ],
        "meta": {"page": page, "size": size, "count": len(invoices)},
    }
