from sqlalchemy.orm import Session
from app.repositories.product_repository import ProductRepository
from app.schemas.inventory import ProductCreate, ProductUpdate

class InventoryService:
    def __init__(self, db: Session):
        self.product_repo = ProductRepository(db)
