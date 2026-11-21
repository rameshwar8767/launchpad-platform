# LaunchPad Platform - Database Backup, Recovery & Disaster Recovery Runbook (Phase 4)

**Document Version:** 1.0.0  
**Date:** November 2026  
**Status:** Approved  
**Author:** Senior Architecture & DevSecOps Engineering Team  

---

## 1. Overview & Operational Objectives

This runbook specifies standard operating procedures (SOPs) for backing up, verifying, and recovering the **LaunchPad Platform** PostgreSQL database.

### Recovery Objectives
- **Recovery Point Objective (RPO):** < 15 minutes (maximum acceptable data loss).
- **Recovery Time Objective (RTO):** < 30 minutes (maximum acceptable downtime to restore service).

---

## 2. Backup Procedures

### 2.1 Logical Backups (`pg_dump`)
Logical backups export SQL commands and table schemas, ideal for version upgrades and portability across environments.

#### Complete Database Backup (Custom Compressed Format)
```bash
# Export compressed archive of launchpad_db
pg_dump -h localhost -p 5432 -U launchpad_user -d launchpad_db -F c -b -v -f "launchpad_backup_$(date +%Y%m%d_%H%M%S).dump"
```

#### Schema-Only Export (DDL Verification)
```bash
pg_dump -h localhost -p 5432 -U launchpad_user -d launchpad_db --schema-only -f "schema_export.sql"
```

### 2.2 Automated Scheduled Cron Backup
In production or Docker hosts, schedule daily compressed backups to persistent storage:
```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/launchpad/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/launchpad_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

export PGPASSWORD="${POSTGRES_PASSWORD}"
pg_dump -h "${POSTGRES_SERVER}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -F c -f "${BACKUP_FILE}"

# Retain backups for 14 days, purging older archives
find "${BACKUP_DIR}" -type f -name "*.dump" -mtime +14 -delete

echo "Backup created successfully: ${BACKUP_FILE}"
```

---

## 3. Restoration & Recovery Procedures

### 3.1 Restoring from Custom Compressed Backup (`pg_restore`)
```bash
# Set password in environment to avoid interactive prompt
export PGPASSWORD="launchpad_password"

# Restore database with clean drop-before-create
pg_restore -h localhost -p 5432 -U launchpad_user -d launchpad_db -c -v "launchpad_backup_20261121_180000.dump"
```

### 3.2 Point-In-Time Recovery (PITR) with WAL Archiving
For cloud-managed deployments (e.g. AWS RDS PostgreSQL or KubeBlocks / CloudNativePG in Kubernetes):
1. **Continuous Archiving:** Enable Write-Ahead Log (WAL) archiving to durable object storage (e.g., AWS S3).
2. **Snapshot Baseline:** Daily automated volume snapshots.
3. **Point-In-Time Rollback:** In the event of catastrophic data corruption or human error:
   - Restore cluster from snapshot preceding the incident.
   - Replay WAL segments up to target timestamp (`recovery_target_time = '2026-11-21 17:30:00 UTC'`).
   - Re-route backend database connection strings.

---

## 4. Disaster Recovery (DR) Verification Checklist

- [ ] Verify backup files are created and non-empty (>0 bytes).
- [ ] Test restoration into an isolated temporary database weekly.
- [ ] Confirm `alembic_version` table exists and matches current revision after restoration.
- [ ] Verify test queries execute against restored tables (`SELECT COUNT(*) FROM users;`).
- [ ] Validate non-root file permissions on backup archives.
