from math import ceil
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.task_repo import task_repo
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.task import (
    TaskCreate,
    TaskPriority,
    TaskResponse,
    TaskStatus,
    TaskUpdate,
)
from app.services.exceptions import EntityNotFoundException, PermissionDeniedException


class TaskService:
    """Service managing business rules and permissions for task lifecycle operations."""

    def create_task(self, db: Session, user_id: str, task_in: TaskCreate) -> TaskResponse:
        task_data = task_in.model_dump()
        task_data["user_id"] = user_id
        task_obj = task_repo.create(db, obj_in=task_data)
        return TaskResponse.model_validate(task_obj)

    def get_task(self, db: Session, task_id: int, current_user: User) -> TaskResponse:
        task = task_repo.get(db, task_id)
        if not task:
            raise EntityNotFoundException("Task", task_id)

        # Non-admin users may only access tasks they own
        if current_user.role != "admin" and task.user_id != current_user.id:
            raise PermissionDeniedException("You do not have access to this task.")

        return TaskResponse.model_validate(task)

    def list_tasks(
        self,
        db: Session,
        current_user: User,
        *,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        overdue_only: bool = False,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 10,
    ) -> PaginatedResponse[TaskResponse]:
        skip = (page - 1) * page_size
        # Admins can view all tasks; standard users only their own
        filter_user_id = None if current_user.role == "admin" else current_user.id

        tasks, total_records = task_repo.get_filtered_tasks(
            db,
            user_id=filter_user_id,
            search=search,
            status=status,
            priority=priority,
            overdue_only=overdue_only,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=page_size,
        )

        total_pages = ceil(total_records / page_size) if total_records > 0 else 0

        return PaginatedResponse(
            success=True,
            data=[TaskResponse.model_validate(t) for t in tasks],
            meta=PaginationMeta(
                page=page,
                page_size=page_size,
                total_records=total_records,
                total_pages=total_pages,
            ),
        )

    def update_task(
        self,
        db: Session,
        task_id: int,
        current_user: User,
        task_in: TaskUpdate,
    ) -> TaskResponse:
        task = task_repo.get(db, task_id)
        if not task:
            raise EntityNotFoundException("Task", task_id)

        if current_user.role != "admin" and task.user_id != current_user.id:
            raise PermissionDeniedException("You cannot edit tasks belonging to other users.")

        updated = task_repo.update(db, db_obj=task, obj_in=task_in)
        return TaskResponse.model_validate(updated)

    def update_status(
        self,
        db: Session,
        task_id: int,
        current_user: User,
        status: TaskStatus,
    ) -> TaskResponse:
        return self.update_task(
            db, task_id, current_user, TaskUpdate(status=status)
        )

    def update_priority(
        self,
        db: Session,
        task_id: int,
        current_user: User,
        priority: TaskPriority,
    ) -> TaskResponse:
        return self.update_task(
            db, task_id, current_user, TaskUpdate(priority=priority)
        )

    def delete_task(self, db: Session, task_id: int, current_user: User) -> bool:
        task = task_repo.get(db, task_id)
        if not task:
            raise EntityNotFoundException("Task", task_id)

        if current_user.role != "admin" and task.user_id != current_user.id:
            raise PermissionDeniedException("You cannot delete tasks belonging to other users.")

        task_repo.remove(db, id=task_id)
        return True


task_service = TaskService()
