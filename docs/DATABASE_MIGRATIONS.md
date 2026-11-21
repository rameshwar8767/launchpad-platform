# LaunchPad Platform - Database Migration Strategy & Guide (Phase 4)

**Document Version:** 1.0.0  
**Date:** November 2026  
**Status:** Approved  
**Author:** Senior Architecture & DevSecOps Engineering Team  

---

## 1. Overview & Zero-Downtime Philosophy

In the **LaunchPad Platform**, database schema changes are treated with the same engineering rigor as application code. Schema migrations are strictly version-controlled using **Alembic** and executed as declarative, repeatable revisions.

### Golden Rules for Production Migrations:
1. **Never rely on `metadata.create_all()` in production:** Table auto-creation creates unversioned schemas and cannot handle data migrations or zero-downtime alterations.
2. **Backward Compatibility First (Expand and Contract Pattern):**
   - **Phase 1 (Expand):** Add new nullable columns or new tables. Application code is deployed that writes to both old and new columns.
   - **Phase 2 (Migrate):** Backfill historical data in background batches.
   - **Phase 3 (Contract):** Application stops reading old column. A subsequent migration drops the old column or applies `NOT NULL` constraints.
3. **Always provide an explicit `downgrade()` implementation:** Every migration must be reversible without manual intervention.

---

## 2. Alembic Configuration & Directory Structure

```
application/backend/
├── alembic/
│   ├── versions/
│   │   └── 0001_initial_schema.py   # Baseline schema revision
│   ├── env.py                       # Runtime migration environment
│   └── script.py.mako               # Template for new revisions
└── alembic.ini                      # Alembic CLI configuration
```

---

## 3. Migration Operational Commands

### 3.1 Applying Migrations
Apply all pending revisions up to the latest version:
```bash
cd application/backend
alembic upgrade head
```

Apply a specific revision target:
```bash
alembic upgrade 0001_initial_schema
```

### 3.2 Rolling Back Migrations
Revert the single most recent migration step:
```bash
alembic downgrade -1
```

Revert all migrations back to base:
```bash
alembic downgrade base
```

### 3.3 Generating New Revisions
Generate an empty migration template:
```bash
alembic revision -m "add_category_to_tasks"
```

Auto-generate revision comparing SQLAlchemy models to database:
```bash
alembic revision --autogenerate -m "add_category_to_tasks"
```
> [!WARNING]
> Always manually inspect auto-generated migrations before committing. Auto-generation may fail to detect table renames or index name changes accurately.

### 3.4 Checking Current Revision State
```bash
# View active database revision
alembic current

# View revision history
alembic history --verbose
```

---

## 4. Kubernetes & CI/CD Migration Execution

In containerized and Kubernetes environments, migrations must **never** run concurrently from multiple pod replicas.

### Recommended Approaches:
1. **Kubernetes `Job` (Recommended for GitOps / Helm):**
   - Run a one-shot Kubernetes `Job` executing `alembic upgrade head` before the backend `Deployment` rollouts begin.
   - Argo CD supports `PreSync` or `Sync` resource hooks to ensure migrations complete before pods are rotated.
2. **Container Entrypoint Guard (Docker Compose / Local):**
   - In single-replica or development setups, an entrypoint script executes `alembic upgrade head` prior to launching Uvicorn.
