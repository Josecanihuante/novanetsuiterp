from sqlalchemy.orm import Session
from app.models.taxes import TaxResult
from app.schemas.tax_result import TaxResultCreate, TaxResultUpdate, TaxResultResponse
from typing import List, Optional
import uuid
from datetime import datetime


def get_tax_result(db: Session, result_id: uuid.UUID) -> Optional[TaxResult]:
    return db.query(TaxResult).filter(
        TaxResult.id == result_id, 
        TaxResult.deleted_at.is_(None)
    ).first()


def get_tax_results(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    period_id: Optional[uuid.UUID] = None
) -> List[TaxResult]:
    query = db.query(TaxResult).filter(TaxResult.deleted_at.is_(None))
    if period_id:
        query = query.filter(TaxResult.period_id == period_id)
    return query.offset(skip).limit(limit).all()


def create_tax_result(
    db: Session, 
    result: TaxResultCreate, 
    current_user_id: uuid.UUID
) -> TaxResult:
    db_result = TaxResult(
        id=uuid.uuid4(),
        period_id=result.period_id,
        total_sales=result.total_sales,
        total_purchases=result.total_purchases,
        iva_collected=result.iva_collected,
        iva_paid=result.iva_paid,
        iva_balance=result.iva_balance,
        ppm_paid=result.ppm_paid,
        calculated_at=result.calculated_at or datetime.utcnow(),
        is_filed=result.is_filed
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


def update_tax_result(
    db: Session, 
    result_id: uuid.UUID, 
    result: TaxResultUpdate, 
    current_user_id: uuid.UUID
) -> Optional[TaxResult]:
    db_result = get_tax_result(db, result_id)
    if db_result:
        update_data = result.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_result, field, value)
        db_result.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_result)
    return db_result


def delete_tax_result(db: Session, result_id: uuid.UUID, current_user_id: uuid.UUID) -> bool:
    db_result = get_tax_result(db, result_id)
    if db_result:
        db_result.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False