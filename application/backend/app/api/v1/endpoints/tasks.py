from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.task import (
    TaskCreate,
    TaskPriority,
    TaskPriorityUpdate,
    TaskResponse,
    TaskStatus,
    TaskStatusUpdate,
    TaskUpdate,
)
from app.services.task_service import task_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get(
    "",
    response_model=PaginatedResponse[TaskResponse],
    summary="List & Filter Tasks",
)
def list_tasks(
    search: Optional[str] = Query(default=None, description="Search title and description"),
    status: Optional[TaskStatus] = Query(default=None, description="Filter by status"),
    priority: Optional[TaskPriority] = Query(default=None, description="Filter by priority"),
    overdue_only: bool = Query(default=False, description="Filter only overdue uncompleted tasks"),
    sort_by: str = Query(default="created_at", description="Field to sort by: created_at, due_date, priority, title"),
    sort_order: str = Query(default="desc", description="Sort direction: asc or desc"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve paginated tasks with full-text search, filtering, and custom sorting."""
    return task_service.list_tasks(
        db,
        current_user,
        search=search,
        status=status.value if status else None,
        priority=priority.value if priority else None,
        overdue_only=overdue_only,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.post(
    "",
    response_model=APIResponse[TaskResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Task",
)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new task work item owned by the authenticated user."""
    task = task_service.create_task(db, current_user.id, task_in)
    return APIResponse(
        success=True,
        data=task,
        message="Task created successfully.",
    )


@router.get(
    "/{task_id}",
    response_model=APIResponse[TaskResponse],
    summary="Retrieve Task Details",
)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve complete metadata and status of a specific task."""
    task = task_service.get_task(db, task_id, current_user)
    return APIResponse(success=True, data=task)


@router.put(
    "/{task_id}",
    response_model=APIResponse[TaskResponse],
    summary="Update Task",
)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update title, description, priority, status, or due date of an existing task."""
    task = task_service.update_task(db, task_id, current_user, task_in)
    return APIResponse(
        success=True,
        data=task,
        message="Task updated successfully.",
    )


@router.patch(
    "/{task_id}/status",
    response_model=APIResponse[TaskResponse],
    summary="Update Task Status",
)
def update_task_status(
    task_id: int,
    status_in: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Transition task status across the workflow (todo, in_progress, completed, blocked)."""
    task = task_service.update_status(db, task_id, current_user, status_in.status)
    return APIResponse(
        success=True,
        data=task,
        message=f"Task status transitioned to '{status_in.status.value}'.",
    )


@router.patch(
    "/{task_id}/priority",
    response_model=APIResponse[TaskResponse],
    summary="Update Task Priority",
)
def update_task_priority(
    task_id: int,
    priority_in: TaskPriorityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change task urgency level (low, medium, high, critical)."""
    task = task_service.update_priority(db, task_id, current_user, priority_in.priority)
    return APIResponse(
        success=True,
        data=task,
        message=f"Task priority updated to '{priority_in.priority.value}'.",
    )


@router.delete(
    "/{task_id}",
    response_model=APIResponse[dict],
    summary="Delete Task",
)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently delete a task work item."""
    task_service.delete_task(db, task_id, current_user)
    return APIResponse(
        success=True,
        data={"id": task_id},
        message="Task deleted successfully.",
    )
