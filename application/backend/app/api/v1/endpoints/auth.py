from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
)
from app.schemas.common import APIResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="User Registration",
)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account with secure password hashing."""
    user = auth_service.register(db, user_in)
    return APIResponse(
        success=True,
        data=user,
        message="User account successfully created.",
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Authentication",
)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password, issuing access and refresh tokens."""
    return auth_service.login(db, login_data)


@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh Access Token",
)
def refresh(token_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Exchange an active refresh token for a newly signed access token."""
    return auth_service.refresh_token(db, token_data.refresh_token)


@router.post(
    "/logout",
    response_model=APIResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Session Logout",
)
def logout(token_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Revoke the submitted refresh token, terminating the active session."""
    auth_service.logout(db, token_data.refresh_token)
    return APIResponse(
        success=True,
        data={},
        message="Session revoked successfully.",
    )


@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Current User Profile",
)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve details and role permissions of the currently authenticated user."""
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
    )
