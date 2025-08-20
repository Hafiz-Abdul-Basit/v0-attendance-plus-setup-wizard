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
