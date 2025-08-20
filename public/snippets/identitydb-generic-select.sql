-- Identity Database Generic Selection Queries
-- Common queries for user management and authentication

USE AttendancePlusIdentityDB;
GO

-- Get all users with their roles
SELECT 
    u.Id,
    u.UserName,
    u.Email,
    u.EmailConfirmed,
    u.PhoneNumber,
    u.LockoutEnd,
    u.AccessFailedCount,
    STRING_AGG(r.Name, ', ') AS Roles
FROM AspNetUsers u
LEFT JOIN AspNetUserRoles ur ON u.Id = ur.UserId
LEFT JOIN AspNetRoles r ON ur.RoleId = r.Id
GROUP BY u.Id, u.UserName, u.Email, u.EmailConfirmed, u.PhoneNumber, u.LockoutEnd, u.AccessFailedCount
ORDER BY u.UserName;

-- Get all roles with their claims
SELECT 
    r.Id,
    r.Name,
    r.NormalizedName,
    STRING_AGG(rc.ClaimType + ':' + rc.ClaimValue, ', ') AS Claims
FROM AspNetRoles r
LEFT JOIN AspNetRoleClaims rc ON r.Id = rc.RoleId
GROUP BY r.Id, r.Name, r.NormalizedName
ORDER BY r.Name;

-- Get users with specific role
SELECT 
    u.Id,
    u.UserName,
    u.Email,
    u.EmailConfirmed,
    u.CreatedDate
FROM AspNetUsers u
INNER JOIN AspNetUserRoles ur ON u.Id = ur.UserId
INNER JOIN AspNetRoles r ON ur.RoleId = r.Id
WHERE r.Name = 'Admin' -- Change role name as needed
ORDER BY u.UserName;

-- Get user login history (if audit table exists)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs')
BEGIN
    SELECT TOP 100
        al.UserId,
        u.UserName,
        al.Action,
        al.Timestamp,
        al.IpAddress,
        al.UserAgent
    FROM AuditLogs al
    INNER JOIN AspNetUsers u ON al.UserId = u.Id
    WHERE al.Action IN ('Login', 'Logout', 'LoginFailed')
    ORDER BY al.Timestamp DESC;
END

-- Get locked out users
SELECT 
    u.Id,
    u.UserName,
    u.Email,
    u.LockoutEnd,
    u.AccessFailedCount
FROM AspNetUsers u
WHERE u.LockoutEnd > GETDATE()
ORDER BY u.LockoutEnd DESC;

-- Get users without email confirmation
SELECT 
    u.Id,
    u.UserName,
    u.Email,
    u.CreatedDate
FROM AspNetUsers u
WHERE u.EmailConfirmed = 0
ORDER BY u.CreatedDate DESC;

-- Get user claims
SELECT 
    u.UserName,
    uc.ClaimType,
    uc.ClaimValue
FROM AspNetUsers u
INNER JOIN AspNetUserClaims uc ON u.Id = uc.UserId
ORDER BY u.UserName, uc.ClaimType;

-- Get role membership count
SELECT 
    r.Name AS RoleName,
    COUNT(ur.UserId) AS UserCount
FROM AspNetRoles r
LEFT JOIN AspNetUserRoles ur ON r.Id = ur.RoleId
GROUP BY r.Id, r.Name
ORDER BY UserCount DESC;
