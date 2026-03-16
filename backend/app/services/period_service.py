from sqlalchemy.orm import Session
from app.models.accounting import Period
from app.schemas.period import PeriodCreate, PeriodUpdate, PeriodResponse
from typing import List, Optional
import uuid
from datetime import datetime


def get_period(db: Session, period_id: uuid.UUID) -> Optional[Period]:
    return db.query(Period).filter(Period.id == period_id, Period.deleted_at.is_(None)).first()


def get_periods(db: Session, skip: int = 0, limit: int = 100) -> List[Period]:
    return db.query(Period).filter(Period.deleted_at.is_(None)).offset(skip).limit(limit).all()


def create_period(db: Session, period: PeriodCreate, current_user_id: uuid.UUID) -> Period:
    db_period = Period(
        id=uuid.uuid4(),
        name=period.name,
        start_date=period.start_date,
        end_date=period.end_date,
        fiscal_year=period.fiscal_year,
        is_closed=period.is_closed
    )
    db.add(db_period)
    db.commit()
    db.refresh(db_period)
    return db_period


def update_period(db: Session, period_id: uuid.UUID, period: PeriodUpdate, current_user_id: uuid.UUID) -> Optional[Period]:
    db_period = get_period(db, period_id)
    if db_period:
        update_data = period.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_period, field, value)
        db_period.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_period)
    return db_period


def delete_period(db: Session, period_id: uuid.UUID, current_user_id: uuid.UUID) -> bool:
    db_period = get_period(db, period_id)
    if db_period:
        db_period.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False