from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.schemas.tax_result import TaxResultCreate, TaxResultUpdate, TaxResultResponse
from app.services.tax_result_service import (
    get_tax_result,
    get_tax_results,
    create_tax_result,
    update_tax_result,
    delete_tax_result,
)

router = APIRouter(prefix="/tax-results", tags=["tax-results"])


@router.get("/", response_model=List[TaxResultResponse])
def list_tax_results(
    skip: int = 0,
    limit: int = 100,
    period_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve tax results with optional filtering.
    """
    results = get_tax_results(db, skip=skip, limit=limit, period_id=period_id)
    return results


@router.post("/", response_model=TaxResultResponse, status_code=status.HTTP_201_CREATED)
def create_tax_result_endpoint(
    result: TaxResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create new tax result.
    """
    return create_tax_result(db, result, current_user.id)


@router.get("/{result_id}", response_model=TaxResultResponse)
def read_tax_result(
    result_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get tax result by ID.
    """
    db_result = get_tax_result(db, result_id)
    if not db_result:
        raise HTTPException(status_code=404, detail="Tax result not found")
    return db_result


@router.put("/{result_id}", response_model=TaxResultResponse)
def update_tax_result_endpoint(
    result_id: uuid.UUID,
    result: TaxResultUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update tax result.
    """
    db_result = update_tax_result(db, result_id, result, current_user.id)
    if not db_result:
        raise HTTPException(status_code=404, detail="Tax result not found")
    return db_result


@router.delete("/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tax_result_endpoint(
    result_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete tax result.
    """
    success = delete_tax_result(db, result_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Tax result not found")
    return None