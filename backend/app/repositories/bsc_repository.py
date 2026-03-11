"""Repositorio para métricas y snapshots del Balanced Scorecard."""
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

class BSCSnapshotRepository:
    """Maneja las operaciones de base de datos para los Snapshots del BSC."""
    
    def __init__(self, db: Session):
        self.db = db

    def get_latest_snapshots(self, period_id: Optional[str], limit: int = 200) -> list[dict]:
        """Obtiene los últimos snapshots calculados filtrados opcionalmente por período."""
        query = """
            SELECT metric_name, metric_value, metric_unit, calculated_at, period_id
            FROM financial.bsc_snapshots
            WHERE (:period_id IS NULL OR period_id = CAST(:period_id AS UUID))
              AND deleted_at IS NULL
            ORDER BY calculated_at DESC
            LIMIT :limit
        """
        rows = self.db.execute(text(query), {"period_id": period_id, "limit": limit}).fetchall()
        
        return [
            {
                "metric_name": r.metric_name,
                "metric_value": float(r.metric_value) if r.metric_value is not None else None,
                "metric_unit": r.metric_unit,
                "calculated_at": r.calculated_at.isoformat(),
                "period_id": str(r.period_id),
            }
            for r in rows
        ]
