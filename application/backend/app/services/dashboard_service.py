from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.task_repo import task_repo
from app.schemas.dashboard import DashboardMetricsResponse, DashboardStats
from app.schemas.task import TaskResponse


class DashboardService:
    """Service computing aggregated performance and task distribution metrics."""

    def get_metrics(self, db: Session, current_user: User) -> DashboardMetricsResponse:
        # Admins view aggregate platform metrics; standard users view personal metrics
        filter_user_id = None if current_user.role == "admin" else current_user.id
        raw_metrics = task_repo.get_dashboard_metrics(db, user_id=filter_user_id)

        return DashboardMetricsResponse(
            stats=DashboardStats(
                total_tasks=raw_metrics["total_tasks"],
                completed_tasks=raw_metrics["completed_tasks"],
                in_progress_tasks=raw_metrics["in_progress_tasks"],
                todo_tasks=raw_metrics["todo_tasks"],
                blocked_tasks=raw_metrics["blocked_tasks"],
                overdue_tasks=raw_metrics["overdue_tasks"],
            ),
            priority_distribution=raw_metrics["priority_distribution"],
            status_distribution=raw_metrics["status_distribution"],
            recent_tasks=[
                TaskResponse.model_validate(t) for t in raw_metrics["recent_tasks"]
            ],
        )


dashboard_service = DashboardService()
