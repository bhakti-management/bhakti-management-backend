#!/bin/bash

# ==============================================================================
# Bhakti Management - PostgreSQL Automated Backup Script
# ==============================================================================
# This script dumps the self-hosted PostgreSQL database and retains the last 7 days.
# Set this script to run daily via cron:
# Example Cron Entry (runs daily at 2:00 AM):
# 0 2 * * * /bin/bash /path/to/bhakti-back-end/backup.sh >> /path/to/bhakti-back-end/logs/backup.log 2>&1
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration
DB_USER="postgres"
DB_NAME="bhakti_db"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="$(dirname "$0")/backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/bhakti_db_backup_$DATE.sql.gz"
RETENTION_DAYS=7

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "========================================="
echo "📅 Starting Database Backup: $(date)"
echo "========================================="

# Run pg_dump and compress the output using gzip
# Note: PGPASSWORD should be set in environment or loaded here if necessary
echo "🗄️ Dumping database '$DB_NAME' to $BACKUP_FILE..."

# If running inside docker-compose, run the backup via the docker container
if [ -n "$(docker ps -q -f name=bhakti-db)" ]; then
  echo "🐳 Detected Docker container running. Backing up via Docker container..."
  docker exec -t bhakti-db pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"
else
  echo "🖥️ Backing up local PostgreSQL host..."
  pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"
fi

echo "✅ Backup file created successfully: $BACKUP_FILE"

# Clean up backups older than RETENTION_DAYS days
echo "🧹 Cleaning up old backups (retaining last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "bhakti_db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print || true

echo "========================================="
echo "🎉 Backup Process Complete: $(date)"
echo "========================================="
