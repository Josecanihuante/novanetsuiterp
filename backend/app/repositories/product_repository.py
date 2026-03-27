"""Repositorio CRUD para Product y StockMovement."""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.models.inventory import Product, StockMovement
from app.schemas.inventory import ProductCreate, ProductUpdate, StockMovementCreate


class ProductRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, product_id: str) -> Optional[Product]:
        return self.db.query(Product).filter(
            Product.id == product_id, Product.deleted_at.is_(None)
        ).first()

    def get_by_sku(self, sku: str) -> Optional[Product]:
        return self.db.query(Product).filter(
            Product.sku == sku, Product.deleted_at.is_(None)
        ).first()

    def list(
        self,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        low_stock: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Product]:
        q = self.db.query(Product).filter(Product.deleted_at.is_(None))
        if category:
            q = q.filter(Product.category == category)
        if is_active is not None:
            q = q.filter(Product.is_active == is_active)
        if low_stock:
            q = q.filter(Product.stock_quantity <= Product.min_stock)
        return q.order_by(Product.name).offset(skip).limit(limit).all()

    def create(self, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product: Product, data: ProductUpdate) -> Product:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(product, field, value)
        self.db.commit()
        self.db.refresh(product)
        return product

    def soft_delete(self, product: Product) -> Product:
        product.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        return product

    def register_movement(
        self, product: Product, data: StockMovementCreate, created_by: str
    ) -> StockMovement:
        """Registra un movimiento de stock y actualiza la cantidad en producto."""
        stock_before = product.stock_quantity
        if data.movement_type == "in":
            stock_after = stock_before + data.quantity
        elif data.movement_type == "out":
            stock_after = stock_before - data.quantity
        else:  # adjustment
            stock_after = stock_before + data.quantity  # positivo o negativo

        movement = StockMovement(
            product_id=product.id,
            movement_type=data.movement_type,
            quantity=data.quantity,
            stock_before=stock_before,
            stock_after=stock_after,
            reference=data.reference,
            notes=data.notes,
            created_by=created_by,
        )
        product.stock_quantity = stock_after
        self.db.add(movement)
        self.db.commit()
        self.db.refresh(movement)
        return movement
