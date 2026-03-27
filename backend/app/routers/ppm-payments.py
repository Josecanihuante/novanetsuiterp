from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.schemas.ppm_payment import PpmPaymentCreate, PpmPaymentUpdate, PpmPaymentResponse
from app.services.tax_result_service import get_tax_result  # We need tax results for PPM calculation
from app.services.ppm_service import calcular_ppm
from app.models.taxes import TaxConfig

router = APIRouter(prefix="/ppm-payments", tags=["ppm-payments"])


@router.get("/", response_model=List[PpmPaymentResponse])
def list_ppm_payments(
    skip: int = 0,
    limit: int = 100,
    period_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve PPM payments with optional filtering.
    """
    query = db.query(PpmPayment).filter(PpmPayment.deleted_at.is_(None))
    if period_id:
        query = query.filter(PpmPayment.period_id == period_id)
    payments = query.offset(skip).limit(limit).all()
    return payments


@router.post("/calculate", response_model=dict)
def calculate_ppm(
    period_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculate PPM for a given period.
    """
    # Get the period
    period = db.query(Period).filter(Period.id == period_id, Period.deleted_at.is_(None)).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    
    # Get tax configuration
    tax_config = db.query(TaxConfig).filter(TaxConfig.tax_code == "PPM", TaxConfig.is_active == True).first()
    if not tax_config:
        # Default configuration
        class DefaultConfig:
            tax_regime = "general"
        config = DefaultConfig()
    else:
        config = tax_config
    
    # Get tax result for the same period (to get gross income)
    tax_result = db.query(TaxResult).filter(
        TaxResult.period_id == period_id, 
        TaxResult.deleted_at.is_(None)
    ).first()
    
    if not tax_result:
        raise HTTPException(status_code=404, detail="Tax result not found for period. Calculate taxes first.")
    
    # Get tax result from previous year for historical calculation
    previous_year_result = db.query(TaxResult).filter(
        TaxResult.fiscal_year == period.fiscal_year - 1,
        TaxResult.deleted_at.is_(None)
    ).first()
    
    # Calculate PPM
    ppm_result = calcular_ppm(
        mes=period.start_date.month,
        anio=period.start_date.year,
        ingresos_brutos=float(tax_result.total_sales or 0),
        config=config,
        tax_anterior=previous_year_result
    )
    
    return ppm_result


@router.post("/", response_model=PpmPaymentResponse, status_code=status.HTTP_201_CREATED)
def create_ppm_payment(
    payment: PpmPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create new PPM payment record.
    """
    # Verify period exists
    period = db.query(Period).filter(Period.id == payment.period_id, Period.deleted_at.is_(None)).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    
    # Check if PPM payment already exists for this period
    existing = db.query(PpmPayment).filter(
        PpmPayment.period_id == payment.period_id,
        PpmPayment.deleted_at.is_(None)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="PPM payment already exists for this period")
    
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


@router.get("/{payment_id}", response_model=PpmPaymentResponse)
def read_ppm_payment(
    payment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get PPM payment by ID.
    """
    db_payment = db.query(PpmPayment).filter(
        PpmPayment.id == payment_id, 
        PpmPayment.deleted_at.is_(None)
    ).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="PPM payment not found")
    return db_payment


@router.put("/{payment_id}", response_model=PpmPaymentResponse)
def update_ppm_payment(
    payment_id: uuid.UUID,
    payment: PpmPaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update PPM payment.
    """
    db_payment = db.query(PpmPayment).filter(
        PpmPayment.id == payment_id, 
        PpmPayment.deleted_at.is_(None)
    ).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="PPM payment not found")
    
    update_data = payment.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_payment, field, value)
    
    db_payment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_payment)
    return db_payment


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ppm_payment(
    payment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete PPM payment.
    """
    db_payment = db.query(PpmPayment).filter(
        PpmPayment.id == payment_id, 
        PpmPayment.deleted_at.is_(None)
    ).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="PPM payment not found")
    
    db_payment.deleted_at = datetime.utcnow()
    db.commit()
    return None