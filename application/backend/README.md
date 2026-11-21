# LaunchPad Task Manager - Backend API

The **LaunchPad Backend** is a high-performance, modular, and secure REST API service built with **Python 3.13**, **FastAPI**, **Pydantic v2**, and **SQLAlchemy 2.0**. It serves as the primary workload for the LaunchPad Platform DevOps portfolio.

---

## 1. Architectural Highlights

- **Clean Layered Architecture:**
  - `app/api/v1/`: API route controllers and endpoint handlers.
  - `app/core/`: Configuration via Pydantic settings, bcrypt security hashing, and JWT utilities.
  - `app/db/`: SQLAlchemy 2.0 database engine, session lifecycle, and base declarations.
  - `app/models/`: Declarative relational models (`User`, `Task`, `RefreshToken`).
  - `app/schemas/`: Pydantic request, response, and pagination validation schemas.
  - `app/services/`: Isolated business logic and domain exceptions.
  - `app/repositories/`: Data access layer abstracting SQL queries.
  - `app/middleware/`: Centralized JSON error translation and logging.
- **Enterprise Security:**
  - Strict input validation via Pydantic v2.
  - Passwords hashed with standard `bcrypt` (work factor 12).
  - Short-lived JWT access tokens (15 minutes).
  - Tracked, database-stored refresh tokens (7 days) with instant revocation on logout.
  - Multi-tenant isolation: Users cannot view, modify, or delete tasks belonging to other accounts.
- **Cloud-Native & Observability:**
  - Dedicated `/health/live` and `/health/ready` Kubernetes probes.
  - Embedded Prometheus `/metrics` telemetry scraper.
  - Multi-stage non-root container (`UID 10001`).

---

## 2. Directory Taxonomy

```
application/backend/
├── app/
│   ├── api/
│   │   ├── deps.py                  # FastAPI dependency injection (DB, auth, admin)
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py          # /api/v1/auth (register, login, refresh, logout, me)
│   │       │   ├── tasks.py         # /api/v1/tasks (CRUD, filter, search, paginate)
│   │       │   ├── dashboard.py     # /api/v1/dashboard/stats (KPIs, distribution)
│   │       │   └── health.py        # /health/live, /health/ready
│   │       └── router.py            # API v1 consolidated router
│   ├── core/
│   │   ├── config.py                # Pydantic BaseSettings environment configuration
│   │   ├── security.py              # Bcrypt hashing and JWT token management
│   │   └── logging.py               # Structured application logger
│   ├── db/
│   │   ├── base.py                  # SQLAlchemy DeclarativeBase
│   │   └── session.py               # Engine & sessionmaker with connection pooling
│   ├── middleware/
│   │   └── error_handler.py         # Centralized error mapping & structured JSON errors
│   ├── models/
│   │   ├── base.py                  # TimestampMixin (created_at, updated_at)
│   │   ├── user.py                  # User ORM model
│   │   ├── task.py                  # Task ORM model
│   │   └── token.py                 # RefreshToken ORM model
│   ├── repositories/
│   │   ├── base.py                  # Generic repository CRUD operations
│   │   ├── user_repo.py             # User SQL persistence methods
│   │   ├── task_repo.py             # Task SQL query builder, search, and pagination
│   │   └── token_repo.py            # Refresh token tracking and revocation
│   ├── schemas/
│   │   ├── common.py                # Standard PaginatedResponse and ErrorResponse
│   │   ├── auth.py                  # Token and login payload schemas
│   │   ├── user.py                  # User request/response schemas
│   │   ├── task.py                  # Task CRUD and enum schemas
│   │   └── dashboard.py             # KPI metrics and chart aggregation schemas
│   ├── services/
│   │   ├── exceptions.py            # Domain exceptions (NotFound, NotPermitted, etc.)
│   │   ├── auth_service.py          # Registration, login, token refresh logic
│   │   ├── task_service.py          # Task business operations & access control
│   │   └── dashboard_service.py     # Dashboard calculation logic
│   └── main.py                      # FastAPI application entrypoint & middleware
├── tests/
│   ├── conftest.py                  # Pytest fixtures (in-memory SQLite, test client)
│   ├── test_auth.py                 # Authentication & authorization test suite
│   ├── test_dashboard.py            # Dashboard metrics test suite
│   ├── test_health.py               # Health probe & root endpoint tests
│   └── test_tasks.py                # Task CRUD, filters, and tenancy isolation tests
├── Dockerfile                       # Multi-stage non-root container build
├── .dockerignore
├── .env.example                     # Environment variable template
├── pyproject.toml                   # Pytest and Ruff tool configurations
└── requirements.txt                 # Pinned Python package dependencies
```

---

## 3. Local Development Setup

### 3.1 Prerequisites
- Python 3.11+ (Python 3.13 verified)
- PostgreSQL 16 (or SQLite for local unit testing)

### 3.2 Installation
```bash
cd application/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3.3 Configuration
Copy `.env.example` to `.env` and configure your database parameters:
```bash
cp .env.example .env
```

### 3.4 Running the Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`
- OpenAPI Specification: `http://localhost:8000/api/v1/openapi.json`
- Metrics: `http://localhost:8000/metrics`
- Liveness Probe: `http://localhost:8000/health/live`
- Readiness Probe: `http://localhost:8000/health/ready`

---

## 4. Running Automated Tests

All tests run against an isolated in-memory SQLite database, guaranteeing reproducible, zero-side-effect test executions:

```bash
# Run all tests
pytest tests -v

# Run with test coverage
pytest tests --cov=app --cov-report=term-missing
```

---

## 5. Container Execution

Build and run the backend container:

```bash
docker build -t launchpad-backend:latest -f Dockerfile .
docker run -p 8000:8000 --env-file .env launchpad-backend:latest
```
