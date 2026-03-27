from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.schemas.financial import BscSnapshotCreate, BscSnapshotResponse
from app.services.bsc_snapshot_service import (
    get_bsc_snapshot,
    get_bsc_snapshots,
    create_bsc_snapshot,
    update_bsc_snapshot,
    delete_bsc_snapshot,
)

router = APIRouter(prefix="/bsc-snapshots", tags=["bsc-snapshots"])


@router.get("/", response_model=List[BscSnapshotResponse])
def list_bsc_snapshots(
    skip: int = 0,
    limit: int = 100,
    period_id: Optional[uuid.UUID] = None,
    perspective: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve BSC snapshots with optional filtering.
    """
    snapshots = get_bsc_snapshots(db, skip=skip, limit=limit, period_id=period_id, perspective=perspective)
    return snapshots


@router.post("/", response_model=BscSnapshotResponse, status_code=status.HTTP_201_CREATED)
def create_bsc_snapshot_endpoint(
    snapshot: BscSnapshotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create new BSC snapshot.
    """
    return create_bsc_snapshot(db, snapshot, current_user.id)


@router.get("/{snapshot_id}", response_model=BscSnapshotResponse)
def read_bsc_snapshot(
    snapshot_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get BSC snapshot by ID.
    """
    db_snapshot = get_bsc_snapshot(db, snapshot_id)
    if not db_snapshot:
        raise HTTPException(status_code=404, detail="BSC snapshot not found")
    return db_snapshot


@router.put("/{snapshot_id}", response_model=BscSnapshotResponse)
def update_bsc_snapshot_endpoint(
    snapshot_id: uuid.UUID,
    snapshot: BscSnapshotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update BSC snapshot.
    """
    db_snapshot = update_bsc_snapshot(db, snapshot_id, snapshot, current_user.id)
    if not db_snapshot:
        raise HTTPException(status_code=404, detail="BSC snapshot not found")
    return db_snapshot


@router.delete("/{snapshot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bsc_snapshot_endpoint(
    snapshot_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete BSC snapshot.
    """
    success = delete_bsc_snapshot(db, snapshot_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="BSC snapshot not found")
    return None