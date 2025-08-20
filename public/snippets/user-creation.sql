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
-- Description:	This SP will be user to add or update a single user.
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
