"""Repositorio CRUD para Customer y Vendor."""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.customer import Customer, Vendor
from app.schemas.customer import CustomerCreate, CustomerUpdate, VendorCreate, VendorUpdate


class CustomerRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, customer_id: str) -> Optional[Customer]:
        return self.db.query(Customer).filter(
            Customer.id == customer_id, Customer.deleted_at.is_(None)
        ).first()

    def get_by_tax_id(self, tax_id: str) -> Optional[Customer]:
        return self.db.query(Customer).filter(
            Customer.tax_id == tax_id, Customer.deleted_at.is_(None)
        ).first()

    def list(self, skip: int = 0, limit: int = 50, is_active: Optional[bool] = None) -> list[Customer]:
        q = self.db.query(Customer).filter(Customer.deleted_at.is_(None))
        if is_active is not None:
            q = q.filter(Customer.is_active == is_active)
        return q.order_by(Customer.name).offset(skip).limit(limit).all()

    def create(self, data: CustomerCreate) -> Customer:
        customer = Customer(**data.model_dump())
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(customer)
        return customer

    def update(self, customer: Customer, data: CustomerUpdate) -> Customer:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(customer, field, value)
        self.db.commit()
        self.db.refresh(customer)
        return customer

    def soft_delete(self, customer: Customer) -> Customer:
        customer.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        return customer


class VendorRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, vendor_id: str) -> Optional[Vendor]:
        return self.db.query(Vendor).filter(
            Vendor.id == vendor_id, Vendor.deleted_at.is_(None)
        ).first()

    def get_by_tax_id(self, tax_id: str) -> Optional[Vendor]:
        return self.db.query(Vendor).filter(
            Vendor.tax_id == tax_id, Vendor.deleted_at.is_(None)
        ).first()

    def list(self, skip: int = 0, limit: int = 50, is_active: Optional[bool] = None) -> list[Vendor]:
        q = self.db.query(Vendor).filter(Vendor.deleted_at.is_(None))
        if is_active is not None:
            q = q.filter(Vendor.is_active == is_active)
        return q.order_by(Vendor.name).offset(skip).limit(limit).all()

    def create(self, data: VendorCreate) -> Vendor:
        vendor = Vendor(**data.model_dump())
        self.db.add(vendor)
        self.db.commit()
        self.db.refresh(vendor)
        return vendor

    def update(self, vendor: Vendor, data: VendorUpdate) -> Vendor:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(vendor, field, value)
        self.db.commit()
        self.db.refresh(vendor)
        return vendor

    def soft_delete(self, vendor: Vendor) -> Vendor:
        vendor.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        return vendor
