from typing import Dict, List

from pydantic import BaseModel

from app.schemas.task import TaskResponse


class DashboardStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    todo_tasks: int
    blocked_tasks: int
    overdue_tasks: int


class DashboardMetricsResponse(BaseModel):
    stats: DashboardStats
    priority_distribution: Dict[str, int]
    status_distribution: Dict[str, int]
    recent_tasks: List[TaskResponse]
