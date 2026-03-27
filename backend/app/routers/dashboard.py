from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.services.dashboard_service import get_dashboard_stats, get_dashboard_charts

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get dashboard statistics.
    """
    return get_dashboard_stats(db)


@router.get("/charts")
def get_dashboard_charts_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get dashboard chart data.
    """
    return get_dashboard_charts(db)