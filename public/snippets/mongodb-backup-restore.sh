# Go to MongoDB tools path
# Eg: C:\Program Files\MongoDB\Tools\100\bin

# Restore database
mongorestore --db databasename backupfilepath

# Backup database
mongodump --db databasename --out backupfilepath
