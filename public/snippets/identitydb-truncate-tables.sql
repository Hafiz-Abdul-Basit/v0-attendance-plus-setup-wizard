-- Identity Database Table Truncation Script
-- WARNING: This will delete all user data and authentication information

USE AttendancePlusIdentityDB;
GO

-- Disable foreign key constraints
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all";

-- Truncate Identity tables in correct order
TRUNCATE TABLE AspNetUserTokens;
TRUNCATE TABLE AspNetUserRoles;
TRUNCATE TABLE AspNetUserLogins;
TRUNCATE TABLE AspNetUserClaims;
TRUNCATE TABLE AspNetRoleClaims;
TRUNCATE TABLE AspNetUsers;
TRUNCATE TABLE AspNetRoles;

-- Truncate custom tables
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'UserProfiles')
    TRUNCATE TABLE UserProfiles;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'RefreshTokens')
    TRUNCATE TABLE RefreshTokens;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs')
    TRUNCATE TABLE AuditLogs;

-- Re-enable foreign key constraints
EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all";

PRINT 'All Identity database tables have been truncated successfully!';
PRINT 'WARNING: All user accounts and authentication data has been permanently deleted!';
PRINT 'You will need to recreate admin users and roles.';
