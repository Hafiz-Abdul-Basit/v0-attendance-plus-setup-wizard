#!/bin/bash

# MongoDB Backup and Restore Script for AttendancePlus
# This script handles MongoDB backup and restore operations

# Configuration
DB_NAME="attendanceplus"
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="attendanceplus_backup_$DATE"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Function to create backup
create_backup() {
    echo "Starting MongoDB backup..."
    echo "Database: $DB_NAME"
    echo "Backup location: $BACKUP_DIR/$BACKUP_NAME"
    
    mongodump --db $DB_NAME --out $BACKUP_DIR/$BACKUP_NAME
    
    if [ $? -eq 0 ]; then
        echo "Backup completed successfully!"
        
        # Compress backup
        cd $BACKUP_DIR
        tar -czf "$BACKUP_NAME.tar.gz" $BACKUP_NAME
        rm -rf $BACKUP_NAME
        
        echo "Backup compressed: $BACKUP_NAME.tar.gz"
    else
        echo "Backup failed!"
        exit 1
    fi
}

# Function to restore backup
restore_backup() {
    if [ -z "$1" ]; then
        echo "Usage: restore_backup <backup_file>"
        echo "Available backups:"
        ls -la $BACKUP_DIR/*.tar.gz
        return 1
    fi
    
    RESTORE_FILE="$1"
    
    if [ ! -f "$BACKUP_DIR/$RESTORE_FILE" ]; then
        echo "Backup file not found: $BACKUP_DIR/$RESTORE_FILE"
        return 1
    fi
    
    echo "Starting MongoDB restore..."
    echo "Restore file: $RESTORE_FILE"
    
    # Extract backup
    cd $BACKUP_DIR
    tar -xzf $RESTORE_FILE
    
    # Get extracted directory name
    EXTRACTED_DIR=$(tar -tzf $RESTORE_FILE | head -1 | cut -f1 -d"/")
    
    # Restore database
    mongorestore --db $DB_NAME --drop $BACKUP_DIR/$EXTRACTED_DIR/$DB_NAME
    
    if [ $? -eq 0 ]; then
        echo "Restore completed successfully!"
        rm -rf $BACKUP_DIR/$EXTRACTED_DIR
    else
        echo "Restore failed!"
        exit 1
    fi
}

# Function to list backups
list_backups() {
    echo "Available backups:"
    ls -la $BACKUP_DIR/*.tar.gz 2>/dev/null || echo "No backups found"
}

# Function to cleanup old backups (keep last 7 days)
cleanup_old_backups() {
    echo "Cleaning up old backups (keeping last 7 days)..."
    find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
    echo "Cleanup completed!"
}

# Main script logic
case "$1" in
    "backup")
        create_backup
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "list")
        list_backups
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 {backup|restore|list|cleanup}"
        echo "  backup          - Create a new backup"
        echo "  restore <file>  - Restore from backup file"
        echo "  list           - List available backups"
        echo "  cleanup        - Remove backups older than 7 days"
        exit 1
        ;;
esac
