from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.dashboard import DashboardMetricsResponse
from app.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Metrics"])


@router.get(
    "/stats",
    response_model=APIResponse[DashboardMetricsResponse],
    summary="Dashboard Metrics & Statistics",
)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve summary counts, priority/status distribution, and recent activity for the dashboard."""
    metrics = dashboard_service.get_metrics(db, current_user)
    return APIResponse(success=True, data=metrics)
