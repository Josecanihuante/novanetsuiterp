from sqlalchemy.orm import Session
from app.models.taxes import PpmPayment
from app.schemas.ppm_payment import PpmPaymentCreate, PpmPaymentUpdate, PpmPaymentResponse
from typing import List, Optional
import uuid
from datetime import datetime


def get_ppm_payment(db: Session, payment_id: uuid.UUID) -> Optional[PpmPayment]:
    return db.query(PpmPayment).filter(
        PpmPayment.id == payment_id, 
        PpmPayment.deleted_at.is_(None)
    ).first()


def get_ppm_payments(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    period_id: Optional[uuid.UUID] = None
) -> List[PpmPayment]:
    query = db.query(PpmPayment).filter(PpmPayment.deleted_at.is_(None))
    if period_id:
        query = query.filter(PpmPayment.period_id == period_id)
    return query.offset(skip).limit(limit).all()


def create_ppm_payment(
    db: Session, 
    payment: PpmPaymentCreate, 
    current_user_id: uuid.UUID
) -> PpmPayment:
    # Verify period exists
    from app.models.accounting import Period
    period = db.query(Period).filter(Period.id == payment.period_id, Period.deleted_at.is_(None)).first()
    if not period:
        raise ValueError("Period not found")
    
    # Check if PPM payment already exists for this period
    existing = db.query(PpmPayment).filter(
        PpmPayment.period_id == payment.period_id,
        PpmPayment.deleted_at.is_(None)
    ).first()
    if existing:
        raise ValueError("PPM payment already exists for this period")
    
    db_payment = PpmPayment(
        id=uuid.uuid4(),
        period_id=payment.period_id,
        taxable_base=payment.taxable_base,
        ppm_rate=payment.ppm_rate,
        amount_due=payment.amount_due,
        amount_paid=payment.amount_paid,
        payment_date=payment.payment_date,
        status=payment.status,
        folio=payment.folio
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment


def update_ppm_payment(
    db: Session, 
    payment_id: uuid.UUID, 
    payment: PpmPaymentUpdate, 
    current_user_id: uuid.UUID
) -> Optional[PpmPayment]:
    db_payment = get_ppm_payment(db, payment_id)
    if db_payment:
        update_data = payment.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_payment, field, value)
        db_payment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_payment)
    return db_payment


def delete_ppm_payment(db: Session, payment_id: uuid.UUID, current_user_id: uuid.UUID) -> bool:
    db_payment = get_ppm_payment(db, payment_id)
    if db_payment:
        db_payment.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False