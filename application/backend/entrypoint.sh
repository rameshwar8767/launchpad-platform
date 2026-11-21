#!/usr/bin/env sh
set -e

echo "[LaunchPad] Waiting for PostgreSQL and running database migrations..."
alembic upgrade head || {
    echo "[LaunchPad] Warning: Alembic migration failed or database unreachable, proceeding to start application..."
}

echo "[LaunchPad] Starting Uvicorn API server..."
exec "$@"
