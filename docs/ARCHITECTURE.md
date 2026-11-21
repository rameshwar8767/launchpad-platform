# LaunchPad Platform - System Architecture Specification (Phase 2)

**Document Version:** 1.0.0  
**Date:** November 2026  
**Status:** Approved  
**Author:** Senior Architecture & DevSecOps Engineering Team  

---

## 1. System Context & Overview

The **LaunchPad Platform** is an enterprise-grade cloud-native task management application built to demonstrate production-level software engineering, microservice containerization, and modern GitOps/DevOps practices.

### 1.1 High-Level System Context (C4 Context)

```mermaid
graph TD
    User["End User / DevOps Engineer<br>(Browser / Client)"]
    
    subgraph LaunchPadPlatform["LaunchPad Platform Ecosystem"]
        Frontend["Frontend SPA<br>(React 19, Vite, Tailwind CSS)<br>Port: 8080 (Nginx)"]
        Backend["Backend REST API<br>(FastAPI, Python 3.13, Pydantic v2)<br>Port: 8000 (Uvicorn)"]
        Database[("Primary Database<br>(PostgreSQL 16 Engine)<br>Port: 5432")]
    end
    
    subgraph Observability["Observability & Infrastructure"]
        Prometheus["Prometheus Server<br>(Metrics Scraper)"]
        Grafana["Grafana Dashboards<br>(Telemetry Visualization)"]
        Kubelet["Kubernetes Kubelet<br>(Liveness / Readiness Probes)"]
    end

    User -->|"HTTPS / REST API Requests"| Frontend
    Frontend -->|"Proxied API Calls (/api/v1)"| Backend
    Backend -->|"SQLAlchemy 2.0 (TCP 5432)"| Database
    Backend -->|"Metrics Endpoint (/metrics)"| Prometheus
    Prometheus -->|"Datasource Query"| Grafana
    Kubelet -->|"Probes (/health/live, /health/ready)"| Backend
```

---

## 2. Frontend Architecture

The frontend is a modern Single Page Application (SPA) developed with **React 19**, **TypeScript 5+**, **Vite**, and **Tailwind CSS**. It is structured according to clear architectural boundaries separating presentational components, business hooks, API service communication, and routing state.

### 2.1 Component & Data Flow Hierarchy

```mermaid
graph TD
    subgraph ClientLayers["Frontend Layered Architecture"]
        Router["React Router v6/v7<br>(Protected & Public Route Guards)"]
        
        subgraph Layouts["Layout Components"]
            AuthLayout["AuthLayout (Login, Register)"]
            DashboardLayout["DashboardLayout (Sidebar, Header, Profile)"]
        end
        
        subgraph Views["View Pages"]
            DashboardView["DashboardPage (KPIs, Charts, Recent)"]
            TasksView["TasksPage (Table, Filters, Pagination)"]
            TaskModalView["TaskModal (Create / Edit Task)"]
        end
        
        subgraph StateManagement["State & Data Layers"]
            AuthContext["Auth Context (JWT State, User Profile)"]
            TanStackQuery["TanStack Query Client<br>(Server Cache, Invalidation, Stale-Time)"]
            ZodValidation["Zod Schemas + React Hook Form"]
        end
        
        subgraph NetworkLayer["HTTP Network Layer"]
            APIClient["Axios / Fetch HTTP Client<br>(Bearer Interceptor, 401 Refresh Flow)"]
        end
    end

    Router --> Layouts
    AuthLayout --> Views
    DashboardLayout --> Views
    Views --> ZodValidation
    Views --> TanStackQuery
    Views --> AuthContext
    TanStackQuery --> APIClient
    AuthContext --> APIClient
    APIClient -->|"REST Calls (/api/v1)"| FastAPIBackend["FastAPI Backend"]
```

### 2.2 Frontend Directory Structure
```
application/frontend/
├── src/
│   ├── assets/            # Static image assets and SVGs
│   ├── components/        # Reusable UI component library
│   │   ├── ui/            # Atomic primitives: Button, Input, Select, Badge, Card, Modal
│   │   ├── layout/        # Sidebar, Navbar, Breadcrumbs, Layout wrapper
│   │   └── tasks/         # TaskCard, TaskTable, TaskFilters, TaskFormModal
│   ├── context/           # AuthContext, ThemeContext
│   ├── hooks/             # Custom hooks (useTasks, useDashboard, useAuth)
│   ├── layouts/           # AuthLayout, AppLayout
│   ├── pages/             # Login, Register, Dashboard, Tasks, Profile, NotFound
│   ├── services/          # apiClient.ts, authService.ts, taskService.ts
│   ├── types/             # TypeScript type definitions (Task, User, API payloads)
│   ├── utils/             # Formatting (dates, status badges, priority colors)
│   ├── App.tsx            # Root application router setup
│   ├── index.css          # Tailwind CSS directives & custom design tokens
│   └── main.tsx           # Entrypoint with QueryClientProvider & AuthProvider
├── tailwind.config.js     # Tailwind CSS theme configuration
└── vite.config.ts         # Vite build and dev server configuration
```

---

## 3. Backend Architecture

The backend is built with **FastAPI** on **Python 3.13**, implementing a clean, modular, layered architecture with dependency injection.

### 3.1 Layered Backend Architecture

```mermaid
graph TD
    subgraph FastAPIServer["FastAPI Application"]
        Middleware["Middleware Pipeline<br>(CORS, Request Logging, Error Handling, Prometheus)"]
        
        subgraph APILayer["API Routing Layer (app/api/v1)"]
            AuthRouter["/api/v1/auth (Register, Login, Refresh, Me)"]
            TaskRouter["/api/v1/tasks (CRUD, Search, Filter, Status)"]
            DashboardRouter["/api/v1/dashboard (Metrics, Distribution)"]
            HealthRouter["/health (live, ready)"]
        end
        
        subgraph SecurityLayer["Security & Dependency Injection"]
            AuthDependency["get_current_user / get_current_active_admin"]
            DBSessionDependency["get_db (SQLAlchemy Session)"]
            TokenService["JWT Creation & Decoding (PyJWT / Passlib Bcrypt)"]
        end
        
        subgraph ServiceLayer["Service Layer (app/services)"]
            UserService["UserService (User registration, authentication)"]
            TaskService["TaskService (Business rules, ownership validation)"]
            DashboardService["DashboardService (Aggregate metrics computation)"]
        end
        
        subgraph RepositoryLayer["Repository Layer (app/repositories)"]
            UserRepository["UserRepository (DB queries for Users)"]
            TaskRepository["TaskRepository (DB queries for Tasks)"]
        end
        
        subgraph DBLayer["Data Layer (app/db & app/models)"]
            SQLAlchemyModels["SQLAlchemy 2.0 ORM Models<br>(User, Task, RefreshToken)"]
            DatabaseSession["PostgreSQL Connection Pool (async/sync engine)"]
        end
    end

    Middleware --> APILayer
    APILayer --> SecurityLayer
    APILayer --> ServiceLayer
    SecurityLayer --> ServiceLayer
    ServiceLayer --> RepositoryLayer
    RepositoryLayer --> DBLayer
    DBLayer --> PostgreSQL[("PostgreSQL 16")]
```

### 3.2 Backend Modular Structure
```
application/backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py          # Authentication & token endpoints
│   │       │   ├── tasks.py         # Task CRUD, filters, pagination
│   │       │   ├── dashboard.py     # Aggregated metric summaries
│   │       │   └── health.py        # K8s liveness & readiness probes
│   │       └── router.py            # API v1 consolidated router
│   ├── core/
│   │   ├── config.py                # Pydantic BaseSettings environment config
│   │   ├── security.py              # Password hashing & JWT token operations
│   │   └── logging.py               # Structured JSON logger configuration
│   ├── db/
│   │   ├── base.py                  # DeclarativeBase metadata
│   │   └── session.py               # SQLAlchemy engine & session factory
│   ├── middleware/
│   │   ├── error_handler.py         # Centralized exception translation
│   │   └── request_id.py            # Correlation ID injection
│   ├── models/
│   │   ├── base.py                  # Abstract base model with ID & timestamps
│   │   ├── user.py                  # User SQLAlchemy model
│   │   └── task.py                  # Task SQLAlchemy model
│   ├── repositories/
│   │   ├── base.py                  # Generic repository CRUD pattern
│   │   ├── user_repo.py             # User SQL persistence methods
│   │   └── task_repo.py             # Task SQL query and filter methods
│   ├── schemas/
│   │   ├── auth.py                  # Token and Login Pydantic schemas
│   │   ├── user.py                  # User create/read Pydantic schemas
│   │   ├── task.py                  # Task request/response Pydantic schemas
│   │   └── common.py                # Pagination and Error envelope schemas
│   ├── services/
│   │   ├── auth_service.py          # Authentication business logic
│   │   ├── task_service.py          # Task business operations & validations
│   │   └── dashboard_service.py     # Aggregation & metric calculations
│   └── main.py                      # FastAPI application entrypoint
├── alembic/                         # Database migration scripts
├── tests/                           # Pytest unit and integration test suite
├── requirements.txt                 # Pinned Python package dependencies
├── pyproject.toml                   # Tool configurations (Ruff, Pytest)
├── alembic.ini                      # Alembic migration configuration
└── Dockerfile                       # Multi-stage production Dockerfile
```

---

## 4. Authentication & Security Architecture

### 4.1 Token Lifecycle & Refresh Flow (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (React SPA)
    participant API as FastAPI Backend (/api/v1)
    participant DB as PostgreSQL Database

    User->>API: POST /api/v1/auth/login {email, password}
    API->>DB: Query user by email
    DB-->>API: User record (including hashed_password)
    API->>API: Verify password with bcrypt
    alt Password Invalid
        API-->>User: 401 Unauthorized {"error": "Invalid credentials"}
    else Password Valid
        API->>API: Generate Access Token (15 min) & Refresh Token (7 days)
        API->>DB: Record refresh token hash (for revocation tracking)
        API-->>User: 200 OK {access_token, refresh_token, token_type: "bearer", user}
    end

    Note over User, API: Standard Authenticated Request Flow
    User->>API: GET /api/v1/tasks (Header: Authorization: Bearer <access_token>)
    API->>API: Verify JWT signature & expiration
    API->>DB: Fetch user's tasks
    DB-->>API: Task dataset
    API-->>User: 200 OK {tasks, meta}

    Note over User, API: Token Expiration & Refresh Flow
    User->>API: GET /api/v1/tasks (Expired Token)
    API-->>User: 401 Unauthorized {"code": "TOKEN_EXPIRED"}
    User->>API: POST /api/v1/auth/refresh {refresh_token}
    API->>DB: Verify refresh token active & unrevoked
    API->>API: Issue new Access Token
    API-->>User: 200 OK {access_token, token_type: "bearer"}
    User->>API: Retry GET /api/v1/tasks with new Access Token
    API-->>User: 200 OK {tasks, meta}
```

---

## 5. Container & Cloud Deployment Topology

```mermaid
graph TD
    subgraph HostEnvironment["Container Cluster (Docker Compose / Kubernetes)"]
        subgraph IngressRouting["Ingress / Reverse Proxy"]
            NginxProxy["Frontend Container (Nginx Alpine)<br>Serves static assets & proxies /api -> Backend"]
        end

        subgraph ApplicationServices["Workload Pods"]
            FastAPIPod["Backend Container (FastAPI)<br>Port: 8000 | Non-Root UID 10001"]
        end

        subgraph StorageLayer["Data Tier"]
            PostgreSQLPod[("PostgreSQL 16 Container<br>Port: 5432 | Persistent Volume")]
        end
    end

    ExternalClient["Client Browser"] -->|Port 80/8080| NginxProxy
    NginxProxy -->|"Static React Assets"| ExternalClient
    NginxProxy -->|"Proxy /api/v1 -> Backend:8000"| FastAPIPod
    FastAPIPod -->|"TCP 5432 (SSL/TLS or Internal Network)"| PostgreSQLPod
```

---

## 6. Architecture Quality & Governance Verification

1. **Separation of Concerns:** Zero SQL code in API route handlers; business logic strictly isolated inside `services/`; database access encapsulated inside `repositories/`.
2. **Type Safety:** 100% end-to-end typing from PostgreSQL database models to Pydantic schemas on the backend, and TypeScript interfaces on the frontend.
3. **Defense in Depth:** Least-privilege containers, non-root execution, parameterized queries, short-lived tokens, secure password hashing, and origin-restricted CORS.
