-- Select Top N Rows
SELECT TOP 10 * FROM TableName;

-- Select with WHERE condition
SELECT * FROM TableName
WHERE ColumnName = 'Value';

-- Like with wildcards
SELECT * FROM TableName
WHERE ColumnName LIKE '%keyword%';

-- Add New Column
ALTER TABLE Employees ADD Email NVARCHAR(100);

-- Drop Column
ALTER TABLE Employees DROP COLUMN Email;

-- Update Row
UPDATE Employees
SET FirstName = 'Jane'
WHERE EmployeeID = 1;

-- Delete Row
DELETE FROM Employees
WHERE EmployeeID = 1;

-- Backup Database
BACKUP DATABASE YourDatabase
TO DISK = 'D:\Backups\YourDatabase.bak';

-- Restore Database
RESTORE DATABASE YourDatabase
FROM DISK = 'D:\Backups\YourDatabase.bak'
WITH REPLACE;

-- Common SQL Server queries for AttendancePlus
-- Database maintenance and monitoring queries

-- Check database size and usage
SELECT 
    DB_NAME() AS DatabaseName,
    (SELECT SUM(size) * 8 / 1024 FROM sys.database_files WHERE type = 0) AS DataSizeMB,
    (SELECT SUM(size) * 8 / 1024 FROM sys.database_files WHERE type = 1) AS LogSizeMB;

-- Check table sizes
SELECT 
    t.NAME AS TableName,
    s.Name AS SchemaName,
    p.rows AS RowCounts,
    SUM(a.total_pages) * 8 AS TotalSpaceKB, 
    SUM(a.used_pages) * 8 AS UsedSpaceKB, 
    (SUM(a.total_pages) - SUM(a.used_pages)) * 8 AS UnusedSpaceKB
FROM 
    sys.tables t
INNER JOIN      
    sys.indexes i ON t.OBJECT_ID = i.object_id
INNER JOIN 
    sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
INNER JOIN 
    sys.allocation_units a ON p.partition_id = a.container_id
LEFT OUTER JOIN 
    sys.schemas s ON t.schema_id = s.schema_id
WHERE 
    t.NAME NOT LIKE 'dt%' 
    AND t.is_ms_shipped = 0
    AND i.OBJECT_ID > 255 
GROUP BY 
    t.Name, s.Name, p.Rows
ORDER BY 
    TotalSpaceKB DESC;

-- Check active connections
SELECT 
    session_id,
    login_name,
    host_name,
    program_name,
    status,
    cpu_time,
    memory_usage,
    total_scheduled_time,
    total_elapsed_time,
    last_request_start_time,
    last_request_end_time
FROM sys.dm_exec_sessions
WHERE is_user_process = 1;

-- Check long running queries
SELECT 
    r.session_id,
    r.status,
    r.command,
    r.cpu_time,
    r.total_elapsed_time,
    t.text AS query_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.total_elapsed_time > 30000; -- queries running longer than 30 seconds
