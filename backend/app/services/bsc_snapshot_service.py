from sqlalchemy.orm import Session
from app.models.financial import BscSnapshot
from app.schemas.financial import BscSnapshotCreate, BscSnapshotResponse
from typing import List, Optional
import uuid
from datetime import datetime


def get_bsc_snapshot(db: Session, snapshot_id: uuid.UUID) -> Optional[BscSnapshot]:
    return db.query(BscSnapshot).filter(
        BscSnapshot.id == snapshot_id, 
        BscSnapshot.deleted_at.is_(None)
    ).first()


def get_bsc_snapshots(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    period_id: Optional[uuid.UUID] = None,
    perspective: Optional[str] = None
) -> List[BscSnapshot]:
    query = db.query(BscSnapshot).filter(BscSnapshot.deleted_at.is_(None))
    if period_id:
        query = query.filter(BscSnapshot.period_id == period_id)
    if perspective:
        query = query.filter(BscSnapshot.perspective == perspective)
    return query.offset(skip).limit(limit).all()


def create_bsc_snapshot(
    db: Session, 
    snapshot: BscSnapshotCreate, 
    current_user_id: uuid.UUID
) -> BscSnapshot:
    db_snapshot = BscSnapshot(
        id=uuid.uuid4(),
        period_id=snapshot.period_id,
        perspective=snapshot.perspective,
        metric_code=snapshot.kpi_name,  # Using kpi_name as metric_code
        metric_name=snapshot.kpi_name,
        actual_value=snapshot.actual_value,
        target_value=snapshot.target_value,
        status=snapshot.status
    )
    db.add(db_snapshot)
    db.commit()
    db.refresh(db_snapshot)
    return db_snapshot


def update_bsc_snapshot(
    db: Session, 
    snapshot_id: uuid.UUID, 
    snapshot: BscSnapshotCreate, 
    current_user_id: uuid.UUID
) -> Optional[BscSnapshot]:
    db_snapshot = get_bsc_snapshot(db, snapshot_id)
    if db_snapshot:
        db_snapshot.perspective = snapshot.perspective
        db_snapshot.metric_code = snapshot.kpi_name
        db_snapshot.metric_name = snapshot.kpi_name
        db_snapshot.actual_value = snapshot.actual_value
        db_snapshot.target_value = snapshot.target_value
        db_snapshot.status = snapshot.status
        db_snapshot.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_snapshot)
    return db_snapshot


def delete_bsc_snapshot(db: Session, snapshot_id: uuid.UUID, current_user_id: uuid.UUID) -> bool:
    db_snapshot = get_bsc_snapshot(db, snapshot_id)
    if db_snapshot:
        db_snapshot.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False