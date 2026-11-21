from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repo import user_repo
from app.repositories.token_repo import token_repo
from app.schemas.auth import AccessTokenResponse, LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.exceptions import (
    DuplicateResourceException,
    InvalidCredentialsException,
    TokenValidationException,
)


class AuthService:
    """Service orchestrating registration, credential verification, and token operations."""

    def register(self, db: Session, user_in: UserCreate) -> UserResponse:
        existing = user_repo.get_by_email(db, user_in.email)
        if existing:
            raise DuplicateResourceException("An account with this email address already exists.")

        hashed_pw = get_password_hash(user_in.password)
        user = user_repo.create_user(
            db,
            email=user_in.email,
            hashed_password=hashed_pw,
            full_name=user_in.full_name,
            role="user",
        )
        return UserResponse.model_validate(user)

    def login(self, db: Session, login_data: LoginRequest) -> TokenResponse:
        user = user_repo.get_by_email(db, login_data.email)
        if not user or not user.is_active:
            raise InvalidCredentialsException()

        if not verify_password(login_data.password, user.hashed_password):
            raise InvalidCredentialsException()

        access_token = create_access_token(
            subject=user.id,
            extra_claims={"email": user.email, "role": user.role},
        )
        raw_refresh, token_hash, expires_at = create_refresh_token(subject=user.id)
        token_repo.create_token_record(
            db, user_id=user.id, token_hash=token_hash, expires_at=expires_at
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )

    def refresh_token(self, db: Session, raw_token: str) -> AccessTokenResponse:
        token_hash = hash_token(raw_token)
        token_record = token_repo.get_by_hash(db, token_hash)
        now = datetime.now(timezone.utc)

        if not token_record or token_record.revoked:
            raise TokenValidationException("Refresh token is invalid or has been revoked.")

        # Ensure tz-aware comparison
        expires_at = token_record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < now:
            raise TokenValidationException("Refresh token has expired.")

        user = user_repo.get(db, token_record.user_id)
        if not user or not user.is_active:
            raise TokenValidationException("User account is inactive or no longer exists.")

        access_token = create_access_token(
            subject=user.id,
            extra_claims={"email": user.email, "role": user.role},
        )
        return AccessTokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    def logout(self, db: Session, raw_token: str) -> bool:
        token_hash = hash_token(raw_token)
        return token_repo.revoke_token(db, token_hash)


auth_service = AuthService()
