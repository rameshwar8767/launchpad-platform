from typing import Any, Dict

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

router = APIRouter(tags=["Health & Probes"])


@router.get("/health/live", summary="Kubernetes Liveness Probe")
def liveness() -> Dict[str, Any]:
    """Lightweight probe verifying that the FastAPI process is alive and serving traffic."""
    return {
        "status": "alive",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@router.get("/health/ready", summary="Kubernetes Readiness Probe")
def readiness(response: Response, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Readiness probe verifying that backend dependencies (PostgreSQL database) are reachable."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "database": "connected",
        }
    except Exception as exc:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "not_ready",
            "service": settings.PROJECT_NAME,
            "database": "disconnected",
            "error": str(exc),
        }
