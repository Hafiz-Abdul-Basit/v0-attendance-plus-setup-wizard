--STEP #3 - CONFIGURE USER CLAIMS
USE [IdentityDB];
GO

DECLARE @userid NVARCHAR(200);
DECLARE @Username VARCHAR(200);
DECLARE @email VARCHAR(200);

-- Fetch User Details
SELECT @userid = [Id], @email = [Email], @Username = [UserName]
FROM [dbo].[AspNetUsers]
WHERE [Id] = N'user id here';

-- Insert User Claims
INSERT INTO [dbo].[AspNetUserClaims] ([ClaimType], [ClaimValue], [UserId]) 
VALUES (N'Username', @Username, @userid);

INSERT INTO [dbo].[AspNetUserClaims] ([ClaimType], [ClaimValue], [UserId]) 
VALUES (N'Email', @email, @userid);

INSERT INTO [dbo].[AspNetUserClaims] ([ClaimType], [ClaimValue], [UserId]) 
VALUES (N'ClientAbbrev', N'Client abbrev value', @userid);

INSERT INTO [dbo].[AspNetUserClaims] ([ClaimType], [ClaimValue], [UserId]) 
VALUES (N'ClientId', N'1', @userid);

INSERT INTO [dbo].[AspNetUserClaims] ([ClaimType], [ClaimValue], [UserId]) 
VALUES (N'UserId', @userid, @userid);

INSERT INTO [dbo].[AspNetUserClaims] ([ClaimType], [ClaimValue], [UserId]) 
VALUES (N'UserFullName', N'FULL NAME HERE', @userid);

-- Insert User Role
INSERT INTO [dbo].[AspNetUserRoles] ([UserId], [RoleId])
VALUES (@userid, 1);
