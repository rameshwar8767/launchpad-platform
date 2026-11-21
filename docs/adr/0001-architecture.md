# Architectural Decision Record (ADR) 0001: Core Technology Stack & Layered Architecture

**Document ID:** ADR-0001  
**Date:** November 2026  
**Status:** Accepted  
**Deciders:** Senior Software Architect, DevSecOps Engineer, Backend Lead, Frontend Lead  

---

## 1. Context and Problem Statement

The **LaunchPad Platform** requires a resilient, scalable, container-ready web application (**LaunchPad Task Manager**) to act as the primary operational workload for a modern cloud-native DevOps portfolio. 

The application must demonstrate production engineering standards:
- Clear separation of concerns between UI, business rules, data access, and infrastructure.
- High developer productivity with strong end-to-end type safety.
- Microservice container readiness with low memory footprint and high throughput.
- Automated testing support, security best practices, and observability hooks.

---

## 2. Decision Drivers

- **Performance & Concurrency:** Async I/O capability for high-throughput API endpoints.
- **Developer Ergonomics & Type Safety:** Seamless end-to-end typing from SQL models to Pydantic schemas and TypeScript interfaces.
- **Maintainability & Modularity:** Clean isolation of business logic from framework-specific routing.
- **DevOps Integration:** First-class Docker, Kubernetes (health probes, metrics), and CI/CD automation readiness.
- **Security:** Standard cryptographic hashing, short-lived JWT authentication, and SQL injection prevention.

---

## 3. Considered Alternatives

### Backend Framework
- **FastAPI (Selected):** Modern, asynchronous, built on Starlette and Pydantic, auto-generates OpenAPI 3.0 documentation, minimal boilerplate, high performance.
- **Django / Django REST Framework:** Robust but monolithic; heavy memory footprint and excessive boilerplate for modern microservices.
- **Flask:** Lightweight, but lacks built-in async support, type-driven validation, and native OpenAPI generation.

### Database & ORM
- **PostgreSQL 16 + SQLAlchemy 2.x + Alembic (Selected):** Enterprise-grade relational integrity, strong typing via SQLAlchemy 2.0 `Mapped` attributes, reliable migration pipeline via Alembic.
- **MongoDB / NoSQL:** Lacks relational foreign key guarantees and ACID transaction safety for structured user/task relationships.

### Frontend Technology
- **React 19 + TypeScript + Vite + Tailwind CSS (Selected):** Rapid HMR build tooling, component-driven design system, utility-first CSS, wide ecosystem support.
- **Next.js (SSR):** Overkill for this application tier, introduces Node.js server runtime overhead into Kubernetes instead of simple static Nginx CDN/container distribution.

### Client State Management
- **TanStack Query v5 + React Context (Selected):** Best-in-class server state caching, automatic background invalidation, and optimistic updates without Redux boilerplate.

---

## 4. Decision Outcome

We decided to adopt:
1. **Backend:** Python 3.13 + FastAPI + Pydantic v2 + SQLAlchemy 2.0 ORM + Alembic migrations.
2. **Database:** PostgreSQL 16 with B-tree and composite indexing.
3. **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + TanStack Query + React Hook Form + Zod.
4. **Architecture Style:** Layered Modular Architecture (`Router -> Service -> Repository -> ORM Model`).
5. **Security Baseline:** Bcrypt password hashing + stateless JWT access tokens with rotating refresh tokens.

---

## 5. Consequences and Trade-offs

### Positive Consequences
- **Automatic Documentation:** FastAPI generates live interactive Swagger UI (`/docs`) and ReDoc (`/redoc`) without manual sync.
- **Elimination of SQL Injection:** 100% of queries bound through parameterized SQLAlchemy ORM.
- **Zero-Downtime Migration Support:** Schema evolution tracked through versioned Alembic revisions.
- **Lightweight Production Container:** Frontend packaged into unprivileged Nginx Alpine container (<30MB); Backend into Python-slim container (<150MB).

### Negative Consequences / Mitigations
- **Alembic Learning Curve:** Developers must generate and review Alembic migration scripts rather than relying on auto-sync.  
  *Mitigation:* Documented migration workflows in `docs/DATABASE_MIGRATIONS.md`.
- **JWT Invalidation Complexity:** Stateless JWTs cannot be revoked instantly without a token blacklist.  
  *Mitigation:* Short access token lifetimes (15 minutes) paired with tracked database refresh tokens for session revocation.
