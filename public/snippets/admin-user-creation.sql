-- Admin User Creation Script for AttendancePlus
-- Creates default admin user and assigns necessary permissions

USE AttendancePlusIdentityDB;
GO

-- Variables for admin user
DECLARE @AdminUserId NVARCHAR(450) = NEWID();
DECLARE @AdminRoleId NVARCHAR(450);
DECLARE @SuperAdminRoleId NVARCHAR(450);
DECLARE @AdminEmail NVARCHAR(256) = 'admin@attendanceplus.com';
DECLARE @AdminUserName NVARCHAR(256) = 'admin';
DECLARE @PasswordHash NVARCHAR(MAX) = 'AQAAAAEAACcQAAAAEJ7QQaEQaEQaEQaEQaEQaEQaEQaEQaEQaEQaEQaEQaEQaEQaEQaEQaEQaEQaEQaEQaEQ=='; -- Change this!

-- Get role IDs
SELECT @AdminRoleId = Id FROM AspNetRoles WHERE Name = 'Admin';
SELECT @SuperAdminRoleId = Id FROM AspNetRoles WHERE Name = 'SuperAdmin';

-- Create admin user if not exists
IF NOT EXISTS (SELECT * FROM AspNetUsers WHERE UserName = @AdminUserName)
BEGIN
    INSERT INTO AspNetUsers (
        Id, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp,
        PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount
    )
    VALUES (
        @AdminUserId, @AdminUserName, UPPER(@AdminUserName), @AdminEmail, UPPER(@AdminEmail),
        1, @PasswordHash, NEWID(), NEWID(),
        0, 0, 1, 0
    );
    
    PRINT 'Admin user created successfully!';
END
ELSE
BEGIN
    SELECT @AdminUserId = Id FROM AspNetUsers WHERE UserName = @AdminUserName;
    PRINT 'Admin user already exists.';
END

-- Assign SuperAdmin role to admin user
IF NOT EXISTS (SELECT * FROM AspNetUserRoles WHERE UserId = @AdminUserId AND RoleId = @SuperAdminRoleId)
BEGIN
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    VALUES (@AdminUserId, @SuperAdminRoleId);
    
    PRINT 'SuperAdmin role assigned to admin user.';
END

-- Add admin claims
INSERT INTO AspNetUserClaims (UserId, ClaimType, ClaimValue)
SELECT @AdminUserId, 'permission', 'system.admin'
WHERE NOT EXISTS (SELECT * FROM AspNetUserClaims WHERE UserId = @AdminUserId AND ClaimType = 'permission' AND ClaimValue = 'system.admin');

INSERT INTO AspNetUserClaims (UserId, ClaimType, ClaimValue)
SELECT @AdminUserId, 'permission', 'users.manage'
WHERE NOT EXISTS (SELECT * FROM AspNetUserClaims WHERE UserId = @AdminUserId AND ClaimType = 'permission' AND ClaimValue = 'users.manage');

INSERT INTO AspNetUserClaims (UserId, ClaimType, ClaimValue)
SELECT @AdminUserId, 'permission', 'attendance.manage'
WHERE NOT EXISTS (SELECT * FROM AspNetUserClaims WHERE UserId = @AdminUserId AND ClaimType = 'permission' AND ClaimValue = 'attendance.manage');

-- Create additional admin users
DECLARE @SecondAdminId NVARCHAR(450) = NEWID();
DECLARE @SecondAdminEmail NVARCHAR(256) = 'support@attendanceplus.com';
DECLARE @SecondAdminUserName NVARCHAR(256) = 'support';

IF NOT EXISTS (SELECT * FROM AspNetUsers WHERE UserName = @SecondAdminUserName)
BEGIN
    INSERT INTO AspNetUsers (
        Id, UserName, NormalizedUserName, Email, NormalizedEmail, 
        EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp,
        PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount
    )
    VALUES (
        @SecondAdminId, @SecondAdminUserName, UPPER(@SecondAdminUserName), @SecondAdminEmail, UPPER(@SecondAdminEmail),
        1, @PasswordHash, NEWID(), NEWID(),
        0, 0, 1, 0
    );
    
    -- Assign Admin role (not SuperAdmin)
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    VALUES (@SecondAdminId, @AdminRoleId);
    
    PRINT 'Support admin user created successfully!';
END

PRINT 'Admin user setup completed!';
PRINT 'Default credentials:';
PRINT 'Username: admin / Email: admin@attendanceplus.com';
PRINT 'Username: support / Email: support@attendanceplus.com';
PRINT 'WARNING: Please change the default passwords immediately!';
