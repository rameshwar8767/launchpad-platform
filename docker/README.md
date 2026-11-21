# Docker Setup for LaunchPad Platform

This directory contains standalone Docker orchestration configurations for running the LaunchPad Task Manager stack.

## Architecture

The stack consists of three isolated container services attached to a custom bridge network `launchpad-net`:

1. **`postgres`**: PostgreSQL 16 Alpine with persistent volume `postgres_data` and automatic readiness health checks.
2. **`backend`**: FastAPI application running on Python 3.13-slim with multi-stage non-root container, automatic database migration wait loop on startup, and health probes.
3. **`frontend`**: React 19 + Vite single page application built and served via Nginx unprivileged Alpine on port 8080, reverse proxying `/api` requests directly to `backend:8000`.

---

## Quickstart

### 1. Configure Environment
Copy the example environment file if you haven't already:
```bash
cp .env.example .env
```

### 2. Start the Stack
From this `docker/` directory:
```bash
docker compose --env-file .env up --build -d
```
*(Or from the project root: `docker compose -f docker/docker-compose.yml --env-file docker/.env up --build -d`)*

### 3. Verify Service Status
```bash
docker compose ps
```

All three services should show status `Up` (with `postgres` reporting `healthy`).

---

## Service Endpoints

| Service | Host URL | Description |
|---|---|---|
| **Frontend UI** | [http://localhost:8080](http://localhost:8080) | React SPA dashboard & task management |
| **Backend API** | [http://localhost:8000](http://localhost:8000) | FastAPI RESTful API server |
| **Swagger UI** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive OpenAPI documentation |
| **API Health** | [http://localhost:8000/health](http://localhost:8000/health) | Readiness & liveness probe endpoint |
| **PostgreSQL** | `localhost:5432` | Database instance (`launchpad_db`) |

---

## Useful Commands

### Viewing Logs
```bash
# Follow logs for all services
docker compose logs -f

# Follow backend logs specifically
docker compose logs -f backend
```

### Stopping the Stack
```bash
# Stop containers (preserves database data)
docker compose down

# Stop containers and wipe volumes (fresh restart)
docker compose down -v
```

### Running Migrations Inside the Backend Container
Database migrations run automatically at container startup via `entrypoint.sh`. To manually inspect or run migrations:
```bash
docker compose exec backend alembic upgrade head
```
