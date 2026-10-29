#!/bin/bash
# ==============================================================================
# Nayara Self-Assessment Dashboard — Automated Production Backup
# Backs up SQLite database (data/audits.db) & Uploaded Media (public/uploads/)
# ==============================================================================

set -e

BACKUP_DIR="/media/yuvraj/New Volume/xamp/htdocs/selfaccessdashboard/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARGET_DIR="${BACKUP_DIR}/${TIMESTAMP}"

mkdir -p "${TARGET_DIR}"

APP_ROOT="/media/yuvraj/New Volume/xamp/htdocs/selfaccessdashboard"

echo "==> Backing up database..."
if [ -f "${APP_ROOT}/data/audits.db" ]; then
    cp "${APP_ROOT}/data/audits.db" "${TARGET_DIR}/audits_${TIMESTAMP}.db"
    echo "    Database backed up to ${TARGET_DIR}/audits_${TIMESTAMP}.db"
fi

echo "==> Backing up uploaded files..."
if [ -d "${APP_ROOT}/public/uploads" ]; then
    tar -czf "${TARGET_DIR}/uploads_${TIMESTAMP}.tar.gz" -C "${APP_ROOT}/public" uploads
    echo "    Uploads archived to ${TARGET_DIR}/uploads_${TIMESTAMP}.tar.gz"
fi

# Keep only the last 14 backups
find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +

echo "==> Backup completed successfully at $(date)"
