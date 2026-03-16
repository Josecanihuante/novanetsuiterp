from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.schemas.period import PeriodCreate, PeriodUpdate, PeriodResponse
from app.services.period_service import (
    get_period,
    get_periods,
    create_period,
    update_period,
    delete_period,
)

router = APIRouter(prefix="/periods", tags=["periods"])


@router.get("/", response_model=List[PeriodResponse])
def list_periods(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve periods.
    """
    periods = get_periods(db, skip=skip, limit=limit)
    return periods


@router.post("/", response_model=PeriodResponse, status_code=status.HTTP_201_CREATED)
def create_period_endpoint(
    period: PeriodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create new period.
    """
    return create_period(db, period, current_user.id)


@router.get("/{period_id}", response_model=PeriodResponse)
def read_period(
    period_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get period by ID.
    """
    db_period = get_period(db, period_id)
    if not db_period:
        raise HTTPException(status_code=404, detail="Period not found")
    return db_period


@router.put("/{period_id}", response_model=PeriodResponse)
def update_period_endpoint(
    period_id: uuid.UUID,
    period: PeriodUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update period.
    """
    db_period = update_period(db, period_id, period, current_user.id)
    if not db_period:
        raise HTTPException(status_code=404, detail="Period not found")
    return db_period


@router.delete("/{period_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_period_endpoint(
    period_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete period.
    """
    success = delete_period(db, period_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Period not found")
    return None