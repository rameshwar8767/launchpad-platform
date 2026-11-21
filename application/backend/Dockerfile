# Stage 1: Dependency builder stage
FROM python:3.13-slim AS builder

WORKDIR /build

# Install build essentials required for compiling C-extensions if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Minimal, hardened production runtime
FROM python:3.13-slim AS runner

WORKDIR /app

# Install minimal runtime dependencies (libpq for postgresql client and curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root user and group
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /sbin/nologin -d /app appuser

# Copy installed Python packages from builder stage
COPY --from=builder /root/.local /home/appuser/.local

# Copy application source code
COPY . .

# Set environment variables for non-root execution and Python optimization
ENV PATH="/home/appuser/.local/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Fix file permissions and ensure entrypoint is executable
RUN chown -R appuser:appgroup /app /home/appuser && \
    chmod +x /app/entrypoint.sh

# Switch to unprivileged non-root user
USER 10001

EXPOSE 8000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health/live || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]

# Start Uvicorn production server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
