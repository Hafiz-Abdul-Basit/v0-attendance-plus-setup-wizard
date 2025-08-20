-- User Claims and Identity Setup for AttendancePlus
-- ASP.NET Core Identity tables and claims configuration

USE AttendancePlusIdentityDB;
GO

-- Insert default roles
INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
VALUES 
    (NEWID(), 'SuperAdmin', 'SUPERADMIN', NEWID()),
    (NEWID(), 'Admin', 'ADMIN', NEWID()),
    (NEWID(), 'Teacher', 'TEACHER', NEWID()),
    (NEWID(), 'Student', 'STUDENT', NEWID());

-- Insert default claims types
INSERT INTO AspNetRoleClaims (RoleId, ClaimType, ClaimValue)
SELECT r.Id, 'permission', 'attendance.read'
FROM AspNetRoles r WHERE r.Name IN ('Admin', 'Teacher', 'Student');

INSERT INTO AspNetRoleClaims (RoleId, ClaimType, ClaimValue)
SELECT r.Id, 'permission', 'attendance.write'
FROM AspNetRoles r WHERE r.Name IN ('Admin', 'Teacher');

INSERT INTO AspNetRoleClaims (RoleId, ClaimType, ClaimValue)
SELECT r.Id, 'permission', 'users.manage'
FROM AspNetRoles r WHERE r.Name = 'Admin';

INSERT INTO AspNetRoleClaims (RoleId, ClaimType, ClaimValue)
SELECT r.Id, 'permission', 'system.admin'
FROM AspNetRoles r WHERE r.Name = 'SuperAdmin';

-- Create stored procedure for user claim management
CREATE OR ALTER PROCEDURE sp_AddUserClaim
    @UserId NVARCHAR(450),
    @ClaimType NVARCHAR(MAX),
    @ClaimValue NVARCHAR(MAX)
AS
BEGIN
    INSERT INTO AspNetUserClaims (UserId, ClaimType, ClaimValue)
    VALUES (@UserId, @ClaimType, @ClaimValue);
END;
GO

-- Create stored procedure to get user permissions
CREATE OR ALTER PROCEDURE sp_GetUserPermissions
    @UserId NVARCHAR(450)
AS
BEGIN
    SELECT DISTINCT
        uc.ClaimType,
        uc.ClaimValue
    FROM AspNetUsers u
    LEFT JOIN AspNetUserClaims uc ON u.Id = uc.UserId
    LEFT JOIN AspNetUserRoles ur ON u.Id = ur.UserId
    LEFT JOIN AspNetRoleClaims rc ON ur.RoleId = rc.RoleId
    WHERE u.Id = @UserId
    AND (uc.ClaimType IS NOT NULL OR rc.ClaimType IS NOT NULL);
END;
GO
