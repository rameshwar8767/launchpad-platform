from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.task import Task
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    """Repository handling task database queries, search, filtering, and aggregations."""
    def __init__(self):
        super().__init__(Task)

    def get_by_id_and_user(
        self, db: Session, task_id: int, user_id: Optional[str] = None
    ) -> Optional[Task]:
        stmt = select(Task).where(Task.id == task_id)
        if user_id:
            stmt = stmt.where(Task.user_id == user_id)
        return db.scalars(stmt).first()

    def get_filtered_tasks(
        self,
        db: Session,
        *,
        user_id: Optional[str] = None,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        overdue_only: bool = False,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 10,
    ) -> Tuple[List[Task], int]:
        """Query tasks with multi-field search, filtering, sorting, and pagination."""
        stmt = select(Task)
        count_stmt = select(func.count(Task.id))

        # User filter (standard users see only their tasks)
        if user_id:
            stmt = stmt.where(Task.user_id == user_id)
            count_stmt = count_stmt.where(Task.user_id == user_id)

        # Keyword search across title and description
        if search and search.strip():
            term = f"%{search.strip()}%"
            search_clause = or_(Task.title.ilike(term), Task.description.ilike(term))
            stmt = stmt.where(search_clause)
            count_stmt = count_stmt.where(search_clause)

        # Status filter
        if status and status.strip():
            stmt = stmt.where(Task.status == status.strip())
            count_stmt = count_stmt.where(Task.status == status.strip())

        # Priority filter
        if priority and priority.strip():
            stmt = stmt.where(Task.priority == priority.strip())
            count_stmt = count_stmt.where(Task.priority == priority.strip())

        # Overdue filter (due_date in past and status != 'completed')
        if overdue_only:
            now = datetime.now(timezone.utc)
            overdue_clause = (Task.due_date < now) & (Task.status != "completed")
            stmt = stmt.where(overdue_clause)
            count_stmt = count_stmt.where(overdue_clause)

        # Total matching count
        total_count = db.scalar(count_stmt) or 0

        # Sorting
        sort_column = getattr(Task, sort_by, Task.created_at)
        if sort_order.lower() == "asc":
            stmt = stmt.order_by(sort_column.asc())
        else:
            stmt = stmt.order_by(sort_column.desc())

        # Pagination
        stmt = stmt.offset(skip).limit(limit)
        tasks = list(db.scalars(stmt).all())

        return tasks, total_count

    def get_dashboard_metrics(
        self, db: Session, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Compute aggregated task metrics and breakdowns in single grouped queries."""
        base_filter = []
        if user_id:
            base_filter.append(Task.user_id == user_id)

        now = datetime.now(timezone.utc)

        # Total count
        total_stmt = select(func.count(Task.id))
        if base_filter:
            total_stmt = total_stmt.where(*base_filter)
        total_tasks = db.scalar(total_stmt) or 0

        # Status breakdown
        status_stmt = select(Task.status, func.count(Task.id)).group_by(Task.status)
        if base_filter:
            status_stmt = status_stmt.where(*base_filter)
        status_counts = dict(db.execute(status_stmt).all())

        # Priority breakdown
        priority_stmt = select(Task.priority, func.count(Task.id)).group_by(Task.priority)
        if base_filter:
            priority_stmt = priority_stmt.where(*base_filter)
        priority_counts = dict(db.execute(priority_stmt).all())

        # Overdue count
        overdue_filter = base_filter + [Task.due_date < now, Task.status != "completed"]
        overdue_stmt = select(func.count(Task.id)).where(*overdue_filter)
        overdue_count = db.scalar(overdue_stmt) or 0

        # Recent 5 tasks
        recent_stmt = select(Task)
        if base_filter:
            recent_stmt = recent_stmt.where(*base_filter)
        recent_stmt = recent_stmt.order_by(Task.created_at.desc()).limit(5)
        recent_tasks = list(db.scalars(recent_stmt).all())

        return {
            "total_tasks": total_tasks,
            "completed_tasks": status_counts.get("completed", 0),
            "in_progress_tasks": status_counts.get("in_progress", 0),
            "todo_tasks": status_counts.get("todo", 0),
            "blocked_tasks": status_counts.get("blocked", 0),
            "overdue_tasks": overdue_count,
            "priority_distribution": {
                "critical": priority_counts.get("critical", 0),
                "high": priority_counts.get("high", 0),
                "medium": priority_counts.get("medium", 0),
                "low": priority_counts.get("low", 0),
            },
            "status_distribution": {
                "todo": status_counts.get("todo", 0),
                "in_progress": status_counts.get("in_progress", 0),
                "completed": status_counts.get("completed", 0),
                "blocked": status_counts.get("blocked", 0),
            },
            "recent_tasks": recent_tasks,
        }


task_repo = TaskRepository()
