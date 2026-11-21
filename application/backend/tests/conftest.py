from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.security import create_access_token, get_password_hash
from app.db.base import Base
from app.main import app
from app.models.user import User

# In-memory SQLite engine for fast, isolated test execution
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables before test session and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    """Provide a clean database session per test with rollback."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db: Session) -> Generator[TestClient, None, None]:
    """Provide a FastAPI TestClient with the get_db dependency overridden."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a standard active user for tests."""
    user = User(
        email="testuser@example.com",
        full_name="Test Operator",
        hashed_password=get_password_hash("ValidPass123!"),
        role="user",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db: Session) -> User:
    """Create an administrator user for tests."""
    user = User(
        email="admin@example.com",
        full_name="Admin Lead",
        hashed_password=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def other_user(db: Session) -> User:
    """Create a secondary user to test tenancy isolation."""
    user = User(
        email="other@example.com",
        full_name="Other Team Member",
        hashed_password=get_password_hash("OtherPass123!"),
        role="user",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def user_auth_headers(test_user: User) -> dict:
    """Generate authorization headers for standard user."""
    token = create_access_token(
        subject=test_user.id,
        extra_claims={"email": test_user.email, "role": test_user.role},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(admin_user: User) -> dict:
    """Generate authorization headers for admin user."""
    token = create_access_token(
        subject=admin_user.id,
        extra_claims={"email": admin_user.email, "role": admin_user.role},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_auth_headers(other_user: User) -> dict:
    """Generate authorization headers for other user."""
    token = create_access_token(
        subject=other_user.id,
        extra_claims={"email": other_user.email, "role": other_user.role},
    )
    return {"Authorization": f"Bearer {token}"}
