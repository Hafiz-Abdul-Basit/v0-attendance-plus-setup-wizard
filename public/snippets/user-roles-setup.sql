-- User Roles Setup for AttendancePlus
-- This script creates the necessary roles and permissions

USE AttendancePlusDB;
GO

-- Create custom roles
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'AttendanceAdmin')
    CREATE ROLE AttendanceAdmin;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'AttendanceUser')
    CREATE ROLE AttendanceUser;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'AttendanceReporter')
    CREATE ROLE AttendanceReporter;

-- Grant permissions to AttendanceAdmin role
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO AttendanceAdmin;
GRANT EXECUTE ON SCHEMA::dbo TO AttendanceAdmin;

-- Grant permissions to AttendanceUser role
GRANT SELECT, INSERT, UPDATE ON dbo.Attendance TO AttendanceUser;
GRANT SELECT ON dbo.Students TO AttendanceUser;
GRANT SELECT ON dbo.Classes TO AttendanceUser;
GRANT SELECT ON dbo.Periods TO AttendanceUser;

-- Grant permissions to AttendanceReporter role
GRANT SELECT ON SCHEMA::dbo TO AttendanceReporter;

-- Create stored procedures for role management
CREATE OR ALTER PROCEDURE sp_AddUserToRole
    @Username NVARCHAR(128),
    @RoleName NVARCHAR(128)
AS
BEGIN
    DECLARE @SQL NVARCHAR(MAX);
    SET @SQL = 'ALTER ROLE ' + QUOTENAME(@RoleName) + ' ADD MEMBER ' + QUOTENAME(@Username);
    EXEC sp_executesql @SQL;
END;
GO

-- Example usage:
-- EXEC sp_AddUserToRole 'john.doe', 'AttendanceUser';
