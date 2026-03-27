"""Router Proveedores (Vendors)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.models.commerce import Vendor
from app.schemas.commerce import VendorCreate, VendorUpdate

router = APIRouter(prefix="/vendors", tags=["Vendors"])


def _rbac_write(user: User) -> None:
    if user.role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Sin permisos para esta operación."}},
        )


def _rbac_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Solo admin puede realizar esta operación."}},
        )


@router.get("", response_model=dict, summary="Listar proveedores")
def list_vendors(
    search: Optional[str] = Query(None, description="Buscar por nombre o RUT"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Vendor).filter(Vendor.is_active.is_(True))
    if search:
        query = query.filter(
            Vendor.name.ilike(f"%{search}%") | Vendor.tax_id.ilike(f"%{search}%")
        )
    total = query.count()
    skip = (page - 1) * size
    vendors = query.order_by(Vendor.name).offset(skip).limit(size).all()

    return {
        "success": True,
        "data": [
            {
                "id": str(v.id), "tax_id": v.tax_id, "name": v.name,
                "trade_name": v.trade_name, "email": v.email, "phone": v.phone,
                "payment_terms_days": v.payment_terms_days, "is_active": v.is_active,
            }
            for v in vendors
        ],
        "meta": {"page": page, "size": size, "count": total},
    }


@router.get("/{vendor_id}", response_model=dict, summary="Detalle de proveedor")
def get_vendor(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.is_active.is_(True)).first()
    if not vendor:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Proveedor no encontrado."}},
        )
    return {
        "success": True,
        "data": {
            "id": str(vendor.id), "tax_id": vendor.tax_id, "name": vendor.name,
            "trade_name": vendor.trade_name, "email": vendor.email, "phone": vendor.phone,
            "address": vendor.address, "payment_terms_days": vendor.payment_terms_days,
            "is_active": vendor.is_active,
            "created_at": vendor.created_at.isoformat(),
        },
    }


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Crear proveedor")
def create_vendor(
    body: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    # Verificar RUT duplicado
    existing = db.query(Vendor).filter(Vendor.tax_id == body.tax_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "DUPLICATE_TAX_ID", "message": f"Ya existe un proveedor con el RUT {body.tax_id}."}},
        )
    vendor = Vendor(**body.model_dump())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return {
        "success": True,
        "data": {"id": str(vendor.id), "tax_id": vendor.tax_id, "name": vendor.name},
    }


@router.put("/{vendor_id}", response_model=dict, summary="Actualizar proveedor")
def update_vendor(
    vendor_id: str,
    body: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.is_active.is_(True)).first()
    if not vendor:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Proveedor no encontrado."}},
        )
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vendor, field, value)
    db.commit()
    db.refresh(vendor)
    return {"success": True, "data": {"id": str(vendor.id), "name": vendor.name}}


@router.delete("/{vendor_id}", response_model=dict, summary="Eliminar proveedor (soft delete)")
def delete_vendor(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_admin(current_user)
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.is_active.is_(True)).first()
    if not vendor:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Proveedor no encontrado."}},
        )
    vendor.is_active = False
    from datetime import datetime, timezone
    vendor.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True, "data": {"message": "Proveedor eliminado correctamente."}}
