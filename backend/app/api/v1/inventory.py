"""Router Inventario (Productos y Movimientos de Stock)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate, StockMovementCreate

router = APIRouter(tags=["Inventory"])


def _rbac_write(user: User):
    if user.role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Sin permisos."}},
        )


def _prod_dict(p) -> dict:
    return {
        "id": p.id, "sku": p.sku, "name": p.name,
        "category": p.category, "unit_of_measure": p.unit_of_measure,
        "sale_price": float(p.sale_price), "cost_price": float(p.cost_price),
        "stock_quantity": float(p.stock_quantity), "min_stock": float(p.min_stock),
        "is_active": p.is_active, "is_taxable": p.is_taxable,
        "low_stock_alert": float(p.stock_quantity) <= float(p.min_stock),
    }


# ── Productos ──────────────────────────────────────────────────────────────────
products_router = APIRouter(prefix="/products")


@products_router.get("", response_model=dict, summary="Listar productos")
def list_products(
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    low_stock: bool = Query(False, description="Solo productos con stock bajo mínimo"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = ProductRepository(db)
    products = repo.list(
        category=category, is_active=is_active,
        low_stock=low_stock, skip=(page - 1) * size, limit=size,
    )
    return {
        "success": True,
        "data": [_prod_dict(p) for p in products],
        "meta": {"page": page, "size": size, "count": len(products)},
    }


@products_router.post("", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Crear producto")
def create_product(
    body: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    repo = ProductRepository(db)
    if repo.get_by_sku(body.sku):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "error": {"code": "DUPLICATE_SKU", "message": f"Ya existe un producto con SKU {body.sku}."}},
        )
    product = repo.create(body)
    return {"success": True, "data": _prod_dict(product)}


@products_router.get("/{product_id}", response_model=dict, summary="Detalle de producto")
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = ProductRepository(db)
    product = repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Producto no encontrado."}})
    return {"success": True, "data": _prod_dict(product)}


@products_router.put("/{product_id}", response_model=dict, summary="Editar producto")
def update_product(
    product_id: str,
    body: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    repo = ProductRepository(db)
    product = repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Producto no encontrado."}})
    product = repo.update(product, body)
    return {"success": True, "data": _prod_dict(product)}


@products_router.delete("/{product_id}", response_model=dict, summary="Eliminar producto (soft delete)")
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail={"success": False, "error": {"code": "FORBIDDEN", "message": "Solo admin puede eliminar."}})
    repo = ProductRepository(db)
    product = repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Producto no encontrado."}})
    repo.soft_delete(product)
    return {"success": True, "data": {"message": "Producto eliminado correctamente."}}


# ── Movimientos de Stock ──────────────────────────────────────────────────────
stock_router = APIRouter(prefix="/stock")


@stock_router.get("/movements", response_model=dict, summary="Movimientos de stock")
def list_movements(
    product_id: str = Query(..., description="UUID del producto"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = ProductRepository(db)
    product = repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Producto no encontrado."}})

    movements = product.stock_movements[(page - 1) * size:(page - 1) * size + size]
    return {
        "success": True,
        "data": [
            {
                "id": m.id, "movement_type": m.movement_type,
                "quantity": float(m.quantity),
                "stock_before": float(m.stock_before),
                "stock_after": float(m.stock_after),
                "reference": m.reference, "notes": m.notes,
                "created_at": m.created_at.isoformat(),
            }
            for m in movements
        ],
        "meta": {"page": page, "size": size, "count": len(movements)},
    }


@stock_router.post("/movements", response_model=dict, status_code=status.HTTP_201_CREATED, summary="Registrar movimiento manual")
def create_movement(
    body: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _rbac_write(current_user)
    repo = ProductRepository(db)
    product = repo.get_by_id(body.product_id)
    if not product:
        raise HTTPException(status_code=404, detail={"success": False, "error": {"code": "NOT_FOUND", "message": "Producto no encontrado."}})

    movement = repo.register_movement(product, body, created_by=current_user.id)
    return {
        "success": True,
        "data": {
            "id": movement.id,
            "movement_type": movement.movement_type,
            "quantity": float(movement.quantity),
            "stock_before": float(movement.stock_before),
            "stock_after": float(movement.stock_after),
        },
    }


# Router combinado
router.include_router(products_router)
router.include_router(stock_router)
