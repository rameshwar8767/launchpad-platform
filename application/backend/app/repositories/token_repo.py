from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.token import RefreshToken
from app.repositories.base import BaseRepository


class TokenRepository(BaseRepository[RefreshToken]):
    """Repository managing refresh token tracking, verification, and revocation."""
    def __init__(self):
        super().__init__(RefreshToken)

    def create_token_record(
        self,
        db: Session,
        *,
        user_id: str,
        token_hash: str,
        expires_at: datetime
    ) -> RefreshToken:
        token_obj = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            revoked=False,
        )
        db.add(token_obj)
        db.commit()
        db.refresh(token_obj)
        return token_obj

    def get_by_hash(self, db: Session, token_hash: str) -> Optional[RefreshToken]:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        return db.scalars(stmt).first()

    def revoke_token(self, db: Session, token_hash: str) -> bool:
        token_obj = self.get_by_hash(db, token_hash)
        if token_obj and not token_obj.revoked:
            token_obj.revoked = True
            db.commit()
            return True
        return False

    def revoke_all_for_user(self, db: Session, user_id: str) -> int:
        stmt = select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked.is_(False)
        )
        tokens = list(db.scalars(stmt).all())
        count = len(tokens)
        for token in tokens:
            token.revoked = True
        db.commit()
        return count


token_repo = TokenRepository()
