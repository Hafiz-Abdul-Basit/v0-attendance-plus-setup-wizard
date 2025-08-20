USE [TDPS]
GO
/****** Object:  StoredProcedure [dbo].[spTDPS_AddOrUpdateAttPlusUser]    Script Date: 8/20/2025 7:33:52 AM ******/
SET ANSI_NULLS ON
GO
 
SET QUOTED_IDENTIFIER ON
GO
 
-- =============================================
-- Author:	Usama Ahmed
-- Create date: 01 - August - 2025
-- Description:	This SP will be used to add or update a single user.
-- =============================================
CREATE OR ALTER     PROCEDURE [dbo].[spTDPS_AddOrUpdateAttPlusUser]
	@emailaddress varchar(100),
	@username varchar(100),
	@firstname varchar(100),
	@lastname varchar(100),
	@roleid nvarchar(450),
	@campusIDs varchar(500),
	@clientAbbrev varchar(100)
AS
BEGIN
	
 
		-- Step 1: Create a temp table to hold the split values
		CREATE TABLE #TempCampusIDs (
			CampusID VARCHAR(50)
		);
 
		-- Step 2: Split and insert into the temp table
		INSERT INTO #TempCampusIDs (CampusID)
		SELECT value
		FROM STRING_SPLIT(@campusIDs, ',')
		WHERE value IS NOT NULL AND LTRIM(RTRIM(value)) <> '';
 
		--First Case -- Add a new User
		DECLARE @UserID UNIQUEIDENTIFIER = NEWID();
		DECLARE @AdminUserID nvarchar(500) = (SELECT [Value] from TDPS.dbo.TDPS_SETUP where [Key] = 'AttplusAdminID')
		DECLARE @AdminUserName nvarchar(500) = (SELECT s.FirstName + ' ' + s.LastName from TDPS.dbo.AttplusUsers s where Id = @AdminUserID)
 
		BEGIN TRY
		BEGIN TRANSACTION;
 
			IF NOT EXISTS (
				SELECT 1 FROM IdentityDB.dbo.AspNetUsers
				WHERE Email = @emailaddress
			)
			BEGIN
			
				-- User Creation Script for AttendancePlus
				-- Creates database users and assigns appropriate roles
				USE AttendancePlusDB;
				GO

				-- Create login at server level (run on master database)
				-- USE master;
				-- CREATE LOGIN [AttendanceApp] WITH PASSWORD = 'SecurePassword123!';

				-- Create database user
				CREATE USER [AttendanceApp] FOR LOGIN [AttendanceApp];

				-- Add user to appropriate role
				ALTER ROLE AttendanceAdmin ADD MEMBER [AttendanceApp];

				-- Create additional users for different access levels
				CREATE USER [AttendanceReadOnly] WITHOUT LOGIN;
				ALTER ROLE AttendanceReporter ADD MEMBER [AttendanceReadOnly];

				-- Create service account user
				CREATE USER [AttendanceService] WITHOUT LOGIN;
				ALTER ROLE AttendanceUser ADD MEMBER [AttendanceService];

				-- Grant specific permissions
				GRANT CONNECT TO [AttendanceApp];
				GRANT CONNECT TO [AttendanceReadOnly];
				GRANT CONNECT TO [AttendanceService];

				-- Create application-specific stored procedures
				CREATE OR ALTER PROCEDURE sp_GetUserPermissions
				    @Username NVARCHAR(128)
				AS
				BEGIN
				    SELECT 
				        dp.name AS principal_name,
				        dp.type_desc AS principal_type,
				        o.name AS object_name,
				        p.permission_name,
				        p.state_desc AS permission_state
				    FROM sys.database_permissions p
				        LEFT JOIN sys.objects o ON p.major_id = o.object_id
				        LEFT JOIN sys.database_principals dp ON p.grantee_principal_id = dp.principal_id
				    WHERE dp.name = @Username;
				END;
				GO

				USE [TDPS];
				GO

				DECLARE @PasswordHash UNIQUEIDENTIFIER = NEWID();
				DECLARE @SecurityStamp UNIQUEIDENTIFIER = NEWID();
				DECLARE @ConcurrencyStamp UNIQUEIDENTIFIER = NEWID();
			
			
				-- Insert a new User
				INSERT INTO IdentityDB.dbo.AspNetUsers
				(Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed,
				 PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
				 TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount, FirstName, LastName)
				VALUES
				(@UserID, @userName, UPPER(@userName), @emailaddress, UPPER(@emailaddress), 1,
				 @PasswordHash, @SecurityStamp, @ConcurrencyStamp, '1234567890', 1, 0, NULL, 0, 0, @firstname, @lastname);
 
				 -- Insert User Claims
				INSERT INTO IdentityDB.dbo.[AspNetUserClaims] ([ClaimType], [ClaimValue], [UserId]) 
				VALUES (N'Username', @Username, @UserID);
				INSERT INTO IdentityDB.dbo.[AspNetUserClaims] ([ClaimType], [ClaimValue], [UserId]) 
				VALUES (N'Email', @emailaddress, @UserID);
				INSERT INTO IdentityDB.dbo.[AspNetUserClaims] ([ClaimType], [ClaimValue], [UserId]) 
				VALUES (N'ClientAbbrev', @clientAbbrev, @UserID);
				INSERT INTO IdentityDB.dbo.[AspNetUserClaims] ([ClaimType], [ClaimValue], [UserId]) 
				VALUES (N'ClientId', N'1', @UserID);
				INSERT INTO IdentityDB.dbo.[AspNetUserClaims] ([ClaimType], [ClaimValue], [UserId]) 
				VALUES (N'UserId', @UserID, @UserID); 
				INSERT INTO IdentityDB.dbo.[AspNetUserClaims] ([ClaimType], [ClaimValue], [UserId]) 
				VALUES (N'UserFullName', @firstname + ' ' + @lastname, @UserID);
 
 
				-- Insert User Role
				INSERT INTO IdentityDB.dbo.[AspNetUserRoles] ([UserId], [RoleId])
				VALUES (@UserID, @roleid);
 
				-- Insert user into TDPS table 						
				INSERT INTO [TDPS].dbo.AttplusUsers
				(Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed,
				 PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
				 TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount, FirstName, LastName, RoleId, ActionTakenBy, ActionTakenId)
				VALUES
				(@UserID, @userName, UPPER(@userName), @emailaddress, UPPER(@emailaddress), 1,
				 @PasswordHash, @SecurityStamp, @ConcurrencyStamp, '1234567890', 1, 0, NULL, 0, 0, @firstname, @lastname, @roleid, @AdminUserName, @AdminUserID);
			 
				 -- Insert user campuses into TDPS table 
				INSERT INTO [TDPS].[dbo].[CampusUser] ([CampusID], [UserId], [Email], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) 
				SELECT  CampusID, @UserID, @Username, @AdminUserName, GETDATE(), NULL, NULL
				FROM #TempCampusIDs;
 
			END
			ELSE
			-- UPDATE User
			BEGIN
 
				SELECT @UserID = Id FROM IdentityDB.dbo.AspNetUsers WHERE Email = @emailaddress;
 
				UPDATE IdentityDB.dbo.[AspNetUserRoles] 
				SET RoleId = @roleid
				where UserId = @UserID
 
				IF NOT EXISTS (
					SELECT 1 FROM [TDPS].dbo.AttplusUsers
					WHERE Email = @emailaddress
				)
				BEGIN
					INSERT INTO [TDPS].dbo.AttplusUsers
				   ([Id], [AccessFailedCount], [ConcurrencyStamp], [Email], [EmailConfirmed], [LockoutEnabled]
				   ,[LockoutEnd], [NormalizedEmail], [NormalizedUserName], [PasswordHash], [PhoneNumber], [PhoneNumberConfirmed]
				   ,[SecurityStamp], [TwoFactorEnabled], [UserName], [RoleId], [ActionTakenBy], [FirstName], [LastName], [ActionTakenId])
				   SELECT [Id], [AccessFailedCount], [ConcurrencyStamp], [Email], [EmailConfirmed], [LockoutEnabled]
				   ,[LockoutEnd], [NormalizedEmail], [NormalizedUserName], [PasswordHash], [PhoneNumber], [PhoneNumberConfirmed]
				   ,[SecurityStamp], [TwoFactorEnabled], [UserName], @roleid, @AdminUserName, [FirstName], [LastName], @AdminUserID
					FROM IdentityDB.dbo.AspNetUsers
				END
				ELSE 
				BEGIN
					UPDATE [TDPS].dbo.AttplusUsers
					SET RoleId = @roleid, [ActionTakenBy] = @AdminUserName, [ActionTakenId] = @AdminUserID
					WHERE Email = @emailaddress
				END
 
				DELETE [TDPS].[dbo].[CampusUser] WHERE UserId = @UserID
				INSERT INTO [TDPS].[dbo].[CampusUser] ([CampusID], [UserId], [Email], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) 
				SELECT  CampusID, @UserID, @Username, @AdminUserName, GETDATE(), NULL, NULL
				FROM #TempCampusIDs;
 
			END
 
		COMMIT TRANSACTION;
		END TRY
		BEGIN CATCH
			IF XACT_STATE() <> 0
				ROLLBACK TRANSACTION;
 
			-- Optional: log or return error
			DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
			DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
			DECLARE @ErrorState INT = ERROR_STATE();
 
			RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
		END CATCH
 
		
		
		DROP TABLE #TempCampusIDs
END
GO
