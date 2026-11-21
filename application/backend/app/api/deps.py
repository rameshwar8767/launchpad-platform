from typing import Generator, Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repo import user_repo
from app.services.exceptions import PermissionDeniedException, TokenValidationException

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
    authorization: Optional[str] = Header(default=None),
) -> User:
    """Extract, decode, and validate the JWT Bearer token, returning the current user."""
    # Allow Bearer token from OAuth2 scheme or Authorization header
    token_str = token
    if not token_str and authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token_str = parts[1]

    if not token_str:
        raise TokenValidationException("Missing authentication token.")

    payload = decode_token(token_str)
    if not payload or payload.get("type") != "access":
        raise TokenValidationException("Invalid or expired access token.")

    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise TokenValidationException("Token payload missing subject identifier.")

    user = user_repo.get(db, user_id)
    if not user:
        raise TokenValidationException("User associated with this token was not found.")

    if not user.is_active:
        raise PermissionDeniedException("This user account is inactive.")

    return user


def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the authenticated user possesses the admin role."""
    if current_user.role != "admin":
        raise PermissionDeniedException("Administrator privileges required.")
    return current_user
