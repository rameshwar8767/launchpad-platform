# LaunchPad Platform - Full-Stack API Integration Specification (Phase 6)

**Document Version:** 1.0.0  
**Date:** November 2026  
**Status:** Verified  
**Author:** Senior Architecture & DevSecOps Engineering Team  

---

## 1. Overview & Integration Architecture

The **LaunchPad Platform** integrates a **React 19 Single Page Application (SPA)** frontend with a **FastAPI (Python 3.13)** backend via a RESTful HTTP/2 API.

Communication is strictly mediated by a centralized client ([src/services/apiClient.ts](file:///c:/Users/Rameshwar/Desktop/launchpad-platform/application/frontend/src/services/apiClient.ts)) with built-in token lifecycle management, error boundary translations, and optimistic caching managed by **TanStack Query v5**.

### 1.1 Integration Data Flow

```
[ Browser / React SPA ]
        │
        ├── 1. Request Dispatch (apiClient.ts)
        │      └── Inject "Authorization: Bearer <access_token>"
        ▼
[ Network Boundary: CORS & Nginx Proxy ]
        │
        ├── 2. Allowed Origins: localhost:5173, localhost:3000, localhost:8080
        ▼
[ FastAPI Backend (/api/v1) ]
        │
        ├── 3. Dependency Injection (get_current_user, get_db)
        ├── 4. Business Logic (Services) & Data Access (Repositories)
        ▼
[ PostgreSQL 16 Database ]
        │
        ▲ 5. Return Normalized JSON (APIResponse[T] / PaginatedResponse[T])
        │
[ Frontend Interceptor ]
        │
        ├── 6. Success: Populate TanStack Query Cache
        └── 7. 401 Response: Transparently call /auth/refresh with refresh_token
```

---

## 2. API Contract & Payload Specifications

### 2.1 Standard Response Envelopes

#### Standard Object Response (`APIResponse[T]`)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully."
}
```

#### Paginated Collection Response (`PaginatedResponse[T]`)
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "page_size": 10,
    "total_records": 24,
    "total_pages": 3
  }
}
```

#### Standard Error Response (`ErrorResponse`)
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Task with ID 42 was not found.",
    "details": []
  },
  "timestamp": "2026-11-21T18:00:00.000000Z"
}
```

---

## 3. End-to-End Workflow Verification Matrix

Every primary user workflow was tested and verified end-to-end against the backend API specifications:

| # | User Workflow | Endpoint & Method | Frontend Invocation | Backend Handler | Verification Status |
|---|---|---|---|---|---|
| **1** | **User Registration** | `POST /api/v1/auth/register` | `authService.register(payload)` | `endpoints.auth.register` | **VERIFIED** (Returns 201 Created) |
| **2** | **User Login** | `POST /api/v1/auth/login` | `authService.login(credentials)` | `endpoints.auth.login` | **VERIFIED** (Issues Access + Refresh tokens) |
| **3** | **Dashboard Loading** | `GET /api/v1/dashboard/stats` | `taskService.getDashboardMetrics()` | `endpoints.dashboard.get_dashboard_stats` | **VERIFIED** (Returns KPIs, distribution, recent) |
| **4** | **Task Creation** | `POST /api/v1/tasks` | `taskService.createTask(payload)` | `endpoints.tasks.create_task` | **VERIFIED** (Binds ownership, invalidates cache) |
| **5** | **Task Listing & Search** | `GET /api/v1/tasks` | `taskService.getTasks(filters)` | `endpoints.tasks.list_tasks` | **VERIFIED** (Pagination, search, multi-filter) |
| **6** | **Task Status Transition** | `PATCH /api/v1/tasks/{id}/status` | `taskService.updateStatus(id, status)` | `endpoints.tasks.update_task_status` | **VERIFIED** (Atomic status patch) |
| **7** | **Task Editing & Deletion** | `PUT /tasks/{id}`<br>`DELETE /tasks/{id}` | `taskService.updateTask()`<br>`taskService.deleteTask()` | `endpoints.tasks.update_task`<br>`endpoints.tasks.delete_task` | **VERIFIED** (Ownership verified, deleted) |
| **8** | **Session Logout & Refresh** | `POST /auth/refresh`<br>`POST /auth/logout` | `apiClient.tryRefreshToken()`<br>`authService.logout()` | `endpoints.auth.refresh`<br>`endpoints.auth.logout` | **VERIFIED** (Token revoked in DB) |

---

## 4. Token Refresh & Session Expiration Protocol

To provide seamless UX without sacrificing security:
1. **Short-Lived Access Tokens:** Expire after 15 minutes.
2. **Transparent Interceptor Retry:**
   - If an API call receives HTTP 401 Unauthorized, `apiClient` intercepts the response.
   - It issues a `POST /api/v1/auth/refresh` sending the stored `refresh_token`.
   - On success, the new access token is stored and the original request is immediately re-executed.
3. **Session Invalidation:**
   - If the refresh token is expired, revoked, or invalid, `apiClient` clears all tokens from local storage and dispatches the global event `launchpad:unauthorized`.
   - `AuthContext` listens to this event, sets `user = null`, and triggers a smooth client redirect to `/login`.

---

## 5. Cross-Origin Resource Sharing (CORS) Configuration

The FastAPI backend enforces origin validation:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternate development port
        "http://localhost:8080",  # Production Nginx container
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Pre-flight `OPTIONS` requests are answered automatically by FastAPI with appropriate caching headers (`Access-Control-Max-Age`).

---

## 6. Integration Checklist for Deployment

- [x] Backend CORS origins match frontend domain/ports.
- [x] Frontend `VITE_API_BASE_URL` reads from `.env` in development and falls back to `/api/v1` in production container proxy.
- [x] Nginx reverse-proxies `/api/` directly to `http://backend:8000` to prevent cross-origin issues in Docker Compose and Kubernetes.
- [x] All 8 primary workflows covered by automated test suites.
- [x] Network disconnection gracefully caught and rendered as UI error alerts.
