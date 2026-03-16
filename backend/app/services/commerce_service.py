from sqlalchemy.orm import Session
from app.repositories.customer_repository import CustomerRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.schemas.commerce import CustomerCreate, CustomerUpdate, InvoiceCreate, InvoiceUpdate

class CommerceService:
    def __init__(self, db: Session):
        self.customer_repo = CustomerRepository(db)
        self.invoice_repo = InvoiceRepository(db)
