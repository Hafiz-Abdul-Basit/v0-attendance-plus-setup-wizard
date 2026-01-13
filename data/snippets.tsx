export const snippetsData = [
  {
    id: "frontend-webconfig",
    title: "Frontend Web.config",
    description: "Complete web.config file for Angular frontend application with proper routing and MIME types",
    content: `<?xml version="1.0" encoding="utf-8"?>
<configuration>

  <system.webServer>

    <rewrite>
      <rules>
        <rule name="Angular Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>

  </system.webServer>

</configuration>`,
    category: "IIS & Web Server",
    language: "XML",
    icon: "Settings",
    color: "bg-blue-600",
    tags: ["web.config", "angular", "frontend", "iis", "routing"],
    lastUsed: new Date("2024-01-15"),
  },

  {
    id: "backend-webconfig",
    title: "Backend Web.config",
    description: "Complete web.config for .NET Core backend API with CORS, authentication, and security headers",
    content: `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath=".\RK12.AttPlus.Administration.API.exe" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="OutOfProcess" />
    </system.webServer>
  </location>
</configuration>
<!--ProjectGuid: ea5e6680-3822-4c89-bba0-1f0645140e4f-->`,
    category: "IIS & Web Server",
    language: "XML",
    icon: "Server",
    color: "bg-blue-600",
    tags: ["web.config", "backend", "api", "cors", "security"],
    lastUsed: new Date("2024-01-14"),
  },

  {
    id: "mongodb-replica",
    title: "MongoDB Replica Set Setup",
    description:
      "Complete guide to configure MongoDB replica set for high availability on Windows, including mongod.cfg and mongosh steps",
    content: `# MongoDB Replica Set Setup on Windows

Replication Set (Why we need replication & full correct format of command):

1. Stop MongoDB Service from Services.

2. Browse to MongoDB folder until BIN (C:\\Program Files\\MongoDB\\Server\\7.0\\bin).

3. Edit mongod.cfg file in editor. Replace #replication: with below:
replication:
  replSetName: "rs0"

4. Restart MongoDB Service:
   net stop mongodb
   net start mongodb

Mongosh Settings:

a. Download Mongosh components from:
   https://downloads.mongodb.com/compass/mongosh-2.3.1-win32-x64.zip

b. Unzip the file and browse to Bin folder:
   "<Unzipped Drive>:\\MongoDB\\mongosh-<Mongosh version>-win32-x64\\bin"

c. Open Command Prompt, navigate to the folder, and run:
   mongosh.exe
   rs.initiate()
   rs.status()

5. Update the MongoDB connection string to:
   mongodb://localhost:27017/?replicaSet=rs0

6. Restart MongoDB Service from Services.

# Notes:
- This setup ensures high availability and automatic failover.
- All commands should be run with administrator privileges.
- Ensure ports used by MongoDB are not blocked by firewall.`,
    category: "MongoDB",
    language: "Shell",
    icon: "Database",
    color: "bg-green-600",
    tags: ["mongodb", "replica-set", "high-availability", "clustering", "windows"],
    lastUsed: new Date("2024-01-13"),
  },

  {
    id: "sql-update-table-paths",
    title: "Update History Tables File Paths",
    description:
      "Update document file paths in SQL Server by replacing the base directory with a new academic year path",
    content: `-- Update SQL Table Paths
-- Purpose:
-- Move file references from rollover directory (E:\\RaaWee\\RollOver\\2024-2025)
-- to local application storage (D:\\myNGApp\\Raawee)

------------------------------------------------------------
-- 1. Update History_StudentFiles paths
------------------------------------------------------------
UPDATE History_StudentFiles
SET DocumentPath = REPLACE(
    DocumentPath,
    'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentFiles',
    'D:\\myNGApp\\Raawee\\History_StudentFiles'
)
WHERE DocumentPath LIKE
    'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentFiles%';

------------------------------------------------------------
-- 2. Update History_StudentDocuments paths
------------------------------------------------------------
UPDATE History_StudentDocuments
SET DocPath = REPLACE(
    DocPath,
    'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentDocuments\\StudentsDocumentLibrary-',
    'D:\\myNGApp\\Raawee\\History_StudentDocuments\\'
)
WHERE DocPath LIKE
    'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentDocuments\\StudentsDocumentLibrary-%';

------------------------------------------------------------
-- 3. Preview changes BEFORE running UPDATE (Best Practice)
------------------------------------------------------------
SELECT 
    DocPath AS OldPath,
    REPLACE(
        DocPath,
        'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentDocuments\\StudentsDocumentLibrary-',
        'D:\\myNGApp\\Raawee\\History_StudentDocuments\\'
    ) AS NewPath
FROM History_StudentDocuments
WHERE DocPath LIKE
    'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentDocuments\\StudentsDocumentLibrary-%';

------------------------------------------------------------
-- 4. Reverse preview changes for verification
------------------------------------------------------------
SELECT
    REPLACE(
        'D:\\myNGApp\\Raawee\\History_StudentDocuments\\',
        'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentDocuments\\StudentsDocumentLibrary-'
    ) AS NewPath
FROM History_StudentDocuments
WHERE DocPath LIKE
    'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentDocuments\\StudentsDocumentLibrary-%';
`,
    category: "SQL Server",
    language: "SQL",
    icon: "Database",
    color: "bg-red-600",
    tags: ["sql", "update", "file-paths", "migration", "maintenance"],
    lastUsed: new Date("2024-01-12"),
  },
  {
    id: "user-data-table",
    title: "User Management Data Table",
    description: "Interactive table with sample user data - view, edit, and download as Excel/CSV",
    content: `INTERACTIVE_TABLE`,
    category: "User Management",
    language: "Interactive",
    icon: "Users",
    color: "bg-purple-600",
    tags: ["excel", "csv", "download", "interactive", "user-data", "table"],
    lastUsed: new Date("2024-01-10"),
    isInteractive: true,
    tableData: [
      {
        Username: "Abdul.Basit",
        Email: "Ab@raaweek12.com",
        CampusID: "ALL",
        FirstName: "Abdul",
        LastName: "Basit",
        RoleId: 1,
      },
      {
        Username: "Ibteisam.Ahmed",
        Email: "IA@raaweek12.com",
        CampusID: "1|4|7",
        FirstName: "Ibteisam",
        LastName: "Ahmed",
        RoleId: 2,
      },
      {
        Username: "Yasir.Saeed",
        Email: "YS@raaweek12.com",
        CampusID: "2",
        FirstName: "Yasir",
        LastName: "Saeed",
        RoleId: 4,
      },
      {
        Username: "Muhammad.Ahsan",
        Email: "MA@raaweek12.com",
        CampusID: "3",
        FirstName: "Muhammad",
        LastName: "Ahsan",
        RoleId: 1,
      },
      {
        Username: "Shahzaib.Rehman",
        Email: "SR@raaweek12.com",
        CampusID: "4",
        FirstName: "Shahzaib",
        LastName: "Rehman",
        RoleId: 3,
      },
      {
        Username: "Islam.Khalil",
        Email: "IK@raaweek12.com",
        CampusID: "ALL",
        FirstName: "Islam",
        LastName: "Khalil",
        RoleId: 7,
      },
      {
        Username: "Qasim.Khan",
        Email: "QK@raaweek12.com",
        CampusID: "1",
        FirstName: "Qasim",
        LastName: "Khan",
        RoleId: 8,
      },
      {
        Username: "Syed.Humail",
        Email: "SY@raaweek12.com",
        CampusID: "3|1|5",
        FirstName: "Syed",
        LastName: "Humail",
        RoleId: 9,
      },
      {
        Username: "Daniyal.Siddique",
        Email: "DS@raaweek12.com",
        CampusID: "4",
        FirstName: "Daniyal",
        LastName: "Siddique",
        RoleId: 3,
      },
      {
        Username: "Zafar.Khan",
        Email: "ZK@raaweek12.com",
        CampusID: "ALL",
        FirstName: "Zafar",
        LastName: "Khan",
        RoleId: 8,
      },
    ],
  },
  {
    id: "user-roles-setup",
    title: "User Roles Setup",
    description: "Complete setup for user roles and permissions in ASP.NET Identity system",
    content: `USE [IdentityDB]
GO
INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [CampusSelection], [Active]) VALUES (N'1', NULL, N'Campus Officer', N'CAMPUSOFFICER', N'2', 1)
GO
INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [CampusSelection], [Active]) VALUES (N'10', NULL, N'Attendance Director', N'ATTENDANCEDIRECTOR', N'2', 1)
GO
INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [CampusSelection], [Active]) VALUES (N'11', NULL, N'Teacher', N'TEACHER', N'2', 1)
GO
INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [CampusSelection], [Active]) VALUES (N'2', NULL, N'Radmin', N'RADMIN', N'0', 1)
GO
INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [CampusSelection], [Active]) VALUES (N'3', NULL, N'Campus Attendance Officer', N'CAMPUSATTENDANCEOFFICER', N'2', 1)
GO
INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [CampusSelection], [Active]) VALUES (N'4', NULL, N'Principal', N'PRINCIPAL', N'1', 1)
GO
INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [CampusSelection], [Active]) VALUES (N'5', NULL, N'Assistant Principal', N'ASSISTANTPRINCIPAL', N'2', 1)
GO
INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [CampusSelection], [Active]) VALUES (N'6', NULL, N'District Attendance Officer', N'ATTENDANCEOFFICER', N'2', 1)
GO
INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [CampusSelection], [Active]) VALUES (N'7', NULL, N'Director', N'DIRECTOR', N'0', 1)
GO
INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [CampusSelection], [Active]) VALUES (N'8', NULL, N'SPUser', N'SPUSER', N'2', 1)
GO
INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [CampusSelection], [Active]) VALUES (N'9', NULL, N'Counselor', N'COUNSELOR', N'2', 1)
GO`,
    category: "User Management",
    language: "SQL",
    icon: "Shield",
    color: "bg-purple-600",
    tags: ["roles", "permissions", "identity", "claims", "security"],
    lastUsed: new Date("2024-01-09"),
  },

  {
    id: "users-configuration",
    title: "User Configuration (For Single User)",
    description:
      "Manage user claims, roles, and campuses for a single user in Identity and TDPS system via stored procedure",
    content: `USE [TDPS]
GO

/****** Object:  StoredProcedure [dbo].[spTDPS_AddOrUpdateAttPlusUser]    Script Date: 8/20/2025 7:33:52 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spTDPS_AddOrUpdateAttPlusUser]
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

	-- First Case -- Add a new User
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
			WHERE UserId = @UserID;

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
				FROM IdentityDB.dbo.AspNetUsers;
			END
			ELSE 
			BEGIN
				UPDATE [TDPS].dbo.AttplusUsers
				SET RoleId = @roleid, [ActionTakenBy] = @AdminUserName, [ActionTakenId] = @AdminUserID
				WHERE Email = @emailaddress;
			END

			DELETE [TDPS].[dbo].[CampusUser] WHERE UserId = @UserID;
			INSERT INTO [TDPS].[dbo].[CampusUser] ([CampusID], [UserId], [Email], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) 
			SELECT  CampusID, @UserID, @Username, @AdminUserName, GETDATE(), NULL, NULL
			FROM #TempCampusIDs;

		END

	COMMIT TRANSACTION;
	END TRY
	BEGIN CATCH
		IF XACT_STATE() <> 0
			ROLLBACK TRANSACTION;

		DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
		DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
		DECLARE @ErrorState INT = ERROR_STATE();

		RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
	END CATCH

	DROP TABLE #TempCampusIDs
END
GO`,
    category: "User Management",
    language: "SQL",
    icon: "Key",
    color: "bg-purple-600",
    tags: ["claims", "permissions", "identity", "properties", "users"],
    lastUsed: new Date("2024-01-07"),
  },
  {
    id: "users-configuration-multiple",
    title: "User Configuration (For Multiple Users)",
    description:
      "Add or update multiple users in Identity and TDPS system using a dynamic table and loop via stored procedure",
    content: `USE [TDPS]
GO

/****** Object:  StoredProcedure [dbo].[spTDPS_AddOrUpdateAttPlusUserMultipleUserUsingDynamicTable]    Script Date: 8/20/2025 7:34:01 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[spTDPS_AddOrUpdateAttPlusUserMultipleUserUsingDynamicTable]
AS
BEGIN	
	BEGIN TRY
	BEGIN TRANSACTION;

		-- Create a temp table with row numbers
		SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS RowNum, FIELD1, FIELD2, FIELD3, FIELD4, FIELD5
		INTO #TempTable
		FROM DYNAMICTABLE1;

		DECLARE @Row INT = 1;
		DECLARE @Max INT = (SELECT COUNT(*) FROM #TempTable);
		DECLARE @emailaddress varchar(100),
				@username varchar(100),
				@firstname varchar(100),
				@lastname varchar(100),
				@campusIDs varchar(500),
				@roleid nvarchar(450) = '1',
				@clientAbbrev varchar(100) = 'LODIUSDCA';
		
		-- Add or update users
		WHILE @Row <= @Max
		BEGIN
			SELECT @firstname = FIELD1, @lastname = FIELD2, @emailaddress = FIELD3, @campusIDs = FIELD4, @username = FIELD5
			FROM #TempTable WHERE RowNum = @Row;

			-- Call single-user stored procedure
			DECLARE @RC int;
			EXECUTE @RC = [dbo].[spTDPS_AddOrUpdateAttPlusUser] 
								@emailaddress
								,@username
								,@firstname
								,@lastname
								,@roleid
								,@campusIDs
								,@clientAbbrev;

			SET @Row += 1;
		END

		DROP TABLE #TempTable;

		-- Deactivate users not in the current dynamic table
		SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS RowNum, Email 
		INTO #TempTable1
		FROM IdentityDB.dbo.AspNetUsers 
		JOIN IdentityDB.dbo.AspNetUserRoles ON IdentityDB.dbo.AspNetUsers.Id = IdentityDB.dbo.AspNetUserRoles.UserId and RoleId = @roleid
		WHERE Email NOT IN (
			SELECT DISTINCT FIELD3 FROM DYNAMICTABLE1
		);

		SET @Row = 1;
		DECLARE @Max1 INT = (SELECT COUNT(*) FROM #TempTable1);

		WHILE @Row <= @Max1
		BEGIN
			SELECT @emailaddress = Email
			FROM #TempTable1 WHERE RowNum = @Row;

			-- Remove user from Identity and TDPS
			DELETE IdentityDB.dbo.AspNetUserRoles WHERE UserId = (SELECT Id FROM IdentityDB.dbo.AspNetUsers WHERE Email = @emailaddress);
			DELETE IdentityDB.dbo.AspNetUserClaims WHERE UserId = (SELECT Id FROM IdentityDB.dbo.AspNetUsers WHERE Email = @emailaddress);
			DELETE TDPS.dbo.AttplusUsers WHERE Email = @emailaddress;
			DELETE TDPS.dbo.CampusUser WHERE UserId = (SELECT Id FROM IdentityDB.dbo.AspNetUsers WHERE Email = @emailaddress);

			SET @Row += 1;
		END

		DROP TABLE #TempTable1;

	COMMIT TRANSACTION;
	END TRY
	BEGIN CATCH
		IF XACT_STATE() <> 0
			ROLLBACK TRANSACTION;

		DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
		DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
		DECLARE @ErrorState INT = ERROR_STATE();

		RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
	END CATCH
END
GO`,
    category: "User Management",
    language: "SQL",
    icon: "Key",
    color: "bg-purple-600",
    tags: ["claims", "permissions", "identity", "properties", "users", "bulk"],
    lastUsed: new Date("2024-01-07"),
  },

  {
    id: "mongodb-backup-restore",
    title: "MongoDB Backup & Restore (CMD)",
    description:
      "Step-by-step MongoDB backup and restore operations using mongodump and mongorestore commands in Windows CMD",
    content: `-- Part 1: Backup (mongodump)
-- Use this to extract data from the database and save it as a file.

1. Open CMD as Administrator.

2. Navigate to MongoDB Tools folder:
   cd "C:\\Program Files\\MongoDB\\Tools\\100\\bin"

3. Run the backup command:
   mongodump --db [DatabaseName] --out "[DestinationPath]"

Example:
   mongodump --db ConfigurationDB --out C:\\Backups\\Jan2026

-- Part 2: Restore (mongorestore)
-- Use this to restore data from backup files into a database.

1. Navigate to the same Tools folder:
   cd "C:\\Program Files\\MongoDB\\Tools\\100\\bin"

2. Run the restore command:
   mongorestore --db [DatabaseName] "[PathToBackupFolder]" --drop

Example:
   mongorestore --db ConfigurationDB C:\\Backups\\Jan2026\\ConfigurationDB --drop`,
    category: "MongoDB",
    language: "Shell",
    icon: "Database",
    color: "bg-green-600",
    tags: ["backup", "restore", "mongodb", "cmd", "windows", "automation"],
    lastUsed: new Date("2026-01-08"),
  },

  {
    id: "tdps-truncate-tables",
    title: "TDPS Database Table Cleanup",
    description: "Truncate all tables in TDPS, IdentityDB, Esign, and Message Center databases for fresh data import",
    content: `-- =====================================================================================================
-- ===================================== TDPS Database ===============================================
-- =====================================================================================================

-- Truncate tables in TDPS database
TRUNCATE TABLE dbo.Alert_Data2;
TRUNCATE TABLE dbo.Alert_Grammar_Mapping;
TRUNCATE TABLE dbo.Alert_Push_Notification;
TRUNCATE TABLE dbo.Alert_Users;
TRUNCATE TABLE dbo.Alerts_Devices;
TRUNCATE TABLE AttplusUsers;
TRUNCATE TABLE dbo.CampaignAnalytics;
TRUNCATE TABLE dbo.CampainTemplateInfo;
TRUNCATE TABLE dbo.CampaignFiles;
TRUNCATE TABLE dbo.CampaignTemplateLayoutDetails;
TRUNCATE TABLE dbo.CampaignTemplateTypes;
TRUNCATE TABLE dbo.CampaignUploadedTemplatesData;
TRUNCATE TABLE dbo.CampaignUserTemplateData;
TRUNCATE TABLE dbo.CAMPUS_DAILY_ENROLLMENT_Staging;
TRUNCATE TABLE dbo.CAMPUS_DAILY_ENROLLMENT;
TRUNCATE TABLE ConcernReasons;
TRUNCATE TABLE dbo.CampusUser;
TRUNCATE TABLE dbo.COUNSELOR_INFO;
TRUNCATE TABLE dbo.CourseTeacher;
TRUNCATE TABLE dbo.DAILY_MEMBERSHIP_Delta;
TRUNCATE TABLE dbo.DAILY_MEMBERSHIP_Production;
TRUNCATE TABLE dbo.DAILY_MEMBERSHIP_Staging;
TRUNCATE TABLE dbo.EmailAlertLog;
TRUNCATE TABLE dbo.EmailToStudent;
TRUNCATE TABLE dbo.Error_Absent_Days;
TRUNCATE TABLE dbo.Error_Action_Board;
TRUNCATE TABLE dbo.Error_Membership;
TRUNCATE TABLE dbo.Error_Period_Skipped;
TRUNCATE TABLE dbo.Error_Request_Action_Details;
TRUNCATE TABLE dbo.Error_Student_DemoGraphic;
TRUNCATE TABLE dbo.Error_Student_Requests;
TRUNCATE TABLE dbo.Error_Summer_Notes;
TRUNCATE TABLE dbo.Error_Tardys;
TRUNCATE TABLE iApp_Config;
TRUNCATE TABLE iApp_DownloadMenu;
TRUNCATE TABLE iApp_Interventions;
TRUNCATE TABLE iApp_MainMenu;
TRUNCATE TABLE ManagePrintQueues;
TRUNCATE TABLE dbo.PI_Documents;
TRUNCATE TABLE dbo.PI_Devices;
TRUNCATE TABLE dbo.PI_Reasons;
TRUNCATE TABLE dbo.Print_Completion_Record;
TRUNCATE TABLE dbo.ScheduleInterventions;
TRUNCATE TABLE dbo.Sent_Completion_Record;
TRUNCATE TABLE dbo.STUDENT_ABSENT_DAYS;
TRUNCATE TABLE dbo.STUDENT_ABSENT_DAYS_ADA;
TRUNCATE TABLE dbo.STUDENT_ABSENT_DAYS_ADA_BAK;
TRUNCATE TABLE dbo.STUDENT_ABSENT_DAYS_ADA_Production;
TRUNCATE TABLE dbo.STUDENT_ABSENT_DAYS_ADA_Test;
TRUNCATE TABLE dbo.STUDENT_ABSENT_DAYS_BAK;
TRUNCATE TABLE dbo.STUDENT_ABSENT_DAYS_Delta;
TRUNCATE TABLE dbo.STUDENT_ABSENT_DAYS_Production;
TRUNCATE TABLE dbo.STUDENT_ABSENT_DAYS_Staging;
TRUNCATE TABLE dbo.STUDENT_ABSENT_DAYS_Staging_Test;
TRUNCATE TABLE dbo.STUDENT_CAMPUS_INFO_LOG;
TRUNCATE TABLE dbo.STUDENT_CAMPUS_INFO_LOG_LY;
TRUNCATE TABLE dbo.STUDENT_DEMOGRAPHIC_INFO;
TRUNCATE TABLE dbo.STUDENT_DEMOGRAPHIC_INFO_bak;
TRUNCATE TABLE dbo.STUDENT_DEMOGRAPHIC_INFO_Delta;
TRUNCATE TABLE dbo.STUDENT_DEMOGRAPHIC_INFO_Production;
TRUNCATE TABLE dbo.STUDENT_DEMOGRAPHIC_INFO_Staging;
TRUNCATE TABLE Student_Enrollment_Info;
TRUNCATE TABLE dbo.STUDENT_GUARDIAN_INFO;
TRUNCATE TABLE StudentInterventionHold;
TRUNCATE TABLE StudentInterventionSuppressed;
TRUNCATE TABLE dbo.STUDENT_PERIODS_SKIPPED;
TRUNCATE TABLE dbo.STUDENT_PERIODS_SKIPPED_Bak;
TRUNCATE TABLE dbo.STUDENT_PERIODS_SKIPPED_Delta;
TRUNCATE TABLE dbo.STUDENT_PERIODS_SKIPPED_Production;
TRUNCATE TABLE dbo.STUDENT_PERIODS_SKIPPED_Staging;
TRUNCATE TABLE dbo.STUDENT_PERIODS_SKIPPED_Staging_Test;
TRUNCATE TABLE dbo.STUDENT_RECOVERY_INFO;
TRUNCATE TABLE dbo.STUDENT_TARDY;
TRUNCATE TABLE dbo.STUDENT_TARDY_Delta;
TRUNCATE TABLE dbo.STUDENT_TARDY_bak;
TRUNCATE TABLE dbo.STUDENT_TARDY_Production;
TRUNCATE TABLE dbo.STUDENT_TARDY_Staging;
TRUNCATE TABLE dbo.STUDENT_TARDY_Staging_Test;
TRUNCATE TABLE STUDENT_LAT_LONG;
TRUNCATE TABLE dbo.STUDENT_TYPES;
TRUNCATE TABLE dbo.SummerNotes;
TRUNCATE TABLE dbo.TDPS_5X5_Test;
TRUNCATE TABLE dbo.TDPS_ABSENCECALENDER_EMAILLOG;
TRUNCATE TABLE dbo.TDPS_ACTION_BOARD;
TRUNCATE TABLE dbo.TDPS_ACTION_BOARD_MENU_CONFIGURATION;
TRUNCATE TABLE dbo.TDPS_ACTION_BOARD_USERFILTER;
TRUNCATE TABLE TDPS_AdminBlock_Logs;
TRUNCATE TABLE TDPS_Alert_Push_Notifications;
TRUNCATE TABLE TDPS_Alert_Push_Notifications_Error;
TRUNCATE TABLE dbo.TDPS_ARCSchedules;
TRUNCATE TABLE TDPS_BARRIER_RESOURCES;
TRUNCATE TABLE TDPS_Bookmark;
TRUNCATE TABLE TDPS_CalendarEvent;
TRUNCATE TABLE dbo.TDPS_Campaigns_Data;
TRUNCATE TABLE dbo.TDPS_ChecklistSetup;
TRUNCATE TABLE dbo.TDPS_CommunicationOptout;
TRUNCATE TABLE TDPS_ConcernDepartment;
TRUNCATE TABLE dbo.TDPS_Communications;
TRUNCATE TABLE dbo.TDPS_ContinuousAbsences;
TRUNCATE TABLE dbo.TDPS_CurrentYear_Comparison;
TRUNCATE TABLE dbo.TDPS_Daily_Comparison;
TRUNCATE TABLE dbo.TDPS_DailyPeriodsSkippedNotifier;
TRUNCATE TABLE dbo.TDPS_DeletedInputComments;
TRUNCATE TABLE dbo.TDPS_Department;
TRUNCATE TABLE dbo.TDPS_DepartmentEmailAddress;
TRUNCATE TABLE dbo.TDPS_Discipline;
TRUNCATE TABLE dbo.TDPS_DuplicateData_Logs;
TRUNCATE TABLE dbo.TDPS_DisableEmail;
TRUNCATE TABLE dbo.TDPS_EmailSMSConfiguration;
TRUNCATE TABLE dbo.TDPS_Emails_Log;
TRUNCATE TABLE dbo.TDPS_EnrollmentType;
TRUNCATE TABLE dbo.TDPS_EnrollmentTypeData;
TRUNCATE TABLE dbo.TDPS_EnrollmentTypeDataTemp;
TRUNCATE TABLE dbo.TDPS_ErrorLog_PeridoSkippedToAbsentDays;
TRUNCATE TABLE dbo.TDPS_FeederPattern;
TRUNCATE TABLE dbo.TDPS_GradeWiseEnrollment;
TRUNCATE TABLE dbo.TDPS_InterventionsChecklistData;
TRUNCATE TABLE dbo.TDPS_InterventionsChecklistSetup;
TRUNCATE TABLE dbo.TDPS_LessThanFiveAlertLog;
TRUNCATE TABLE dbo.TDPS_LessThanFiveCampaignSetup;
TRUNCATE TABLE dbo.TDPS_MeetingDates;
TRUNCATE TABLE dbo.TDPS_Messaging_Campaign;
TRUNCATE TABLE dbo.TDPS_NotesFromAeries;
TRUNCATE TABLE dbo.TDPS_ParentInvolvementCenter;
TRUNCATE TABLE dbo.TDPS_PARENTALERT_LOG;
TRUNCATE TABLE dbo.TDPS_Perfect_Attendance_Star_Log;
TRUNCATE TABLE dbo.TDPS_PostCardLog;
TRUNCATE TABLE dbo.TDPS_ProvidedInterventions;
TRUNCATE TABLE dbo.TDPS_REGISTERED_DEVICES;
TRUNCATE TABLE dbo.TDPS_ReversedScheduledMeeting;
TRUNCATE TABLE dbo.TDPS_Request_Action_Details;
TRUNCATE TABLE TDPS_SetupDynamicTables;
TRUNCATE TABLE TDPS_SetupDynamicTablesColumns;
TRUNCATE TABLE TDPS_Shoutouts;
TRUNCATE TABLE TDPS_ShoutoutsStudentsDetails;
TRUNCATE TABLE TDPS_STUDENT_DOCUMENT_LIBRARY;
TRUNCATE TABLE dbo.TDPS_STUDENT_HOLD_INFO;
TRUNCATE TABLE dbo.TDPS_STUDENT_MONITORING;
TRUNCATE TABLE dbo.TDPS_STUDENT_REQUESTS;
TRUNCATE TABLE StudentEnrolledDays;
TRUNCATE TABLE dbo.TDPS_StudentWhiteList;
TRUNCATE TABLE dbo.TDPS_ThoughtOfTheDay;
TRUNCATE TABLE dbo.TDPS_User_Students;
TRUNCATE TABLE dbo.TDPS_USER_ROLE_CONFIGURATION_DETAILS;
TRUNCATE TABLE dbo.TDPS_WebPart_Setting;
TRUNCATE TABLE dbo.TDPS_YTDAbsencesComparisonData;
TRUNCATE TABLE UnsubscribeEmail;
TRUNCATE TABLE dbo.TIPI_Message;
TRUNCATE TABLE dbo.TIPI_Subject;
TRUNCATE TABLE dbo.TI_Comments;
TRUNCATE TABLE dbo.TI_CommentsTemplate;
TRUNCATE TABLE dbo.TI_CommentCategory;
TRUNCATE TABLE dbo.TI_Devices;
TRUNCATE TABLE dbo.TI_Setup;

-- =====================================================================================================
-- IdentityDB Database
-- =====================================================================================================

TRUNCATE TABLE AspNetRoleClaims;
TRUNCATE TABLE AspNetUserClaims;
TRUNCATE TABLE AspNetUserLogins;
TRUNCATE TABLE AspNetUserRoles;
TRUNCATE TABLE AspNetUsers;
TRUNCATE TABLE AspNetUserTokens;

-- =====================================================================================================
-- Esign Database
-- =====================================================================================================

TRUNCATE TABLE DocumentStudentMapping;
TRUNCATE TABLE Reminder;
TRUNCATE TABLE RequestActionDetails;
TRUNCATE TABLE TDPS_Communications;
TRUNCATE TABLE tracking_log;
TRUNCATE TABLE ClickTracking;
TRUNCATE TABLE Participant;
TRUNCATE TABLE WorkflowPersistenceDetail;
TRUNCATE TABLE WorkflowPersistenceMaster;
TRUNCATE TABLE Conversation;
TRUNCATE TABLE ESignContractUpload;
TRUNCATE TABLE dbo.UtilityExceptionLog;

-- =====================================================================================================
-- Message Center Database
-- =====================================================================================================

TRUNCATE TABLE ConversationMessages;
TRUNCATE TABLE ConversationParticipants;
TRUNCATE TABLE Conversations;
TRUNCATE TABLE ParticipantMessageTracking;
TRUNCATE TABLE Participants;`,
    category: "SQL Server",
    language: "SQL",
    icon: "Database",
    color: "bg-red-600",
    tags: ["truncate", "cleanup", "tdps", "identitydb", "esign", "messagecenter", "database", "reset"],
    lastUsed: new Date("2026-01-08"),
  },
  {
    id: "tdps-client-dependent-select",
    title: "TDPS SchoolOpenDates Setup",
    description: "Query TDPS data based on client/campus specific requirements and generate School Open Dates",
    content: `-- ====================================================================
-- TDPS SchoolOpenDates Table Setup
-- ====================================================================

-- Drop the table if it exists
IF OBJECT_ID('dbo.TDPS_SchoolOpenDates', 'U') IS NOT NULL
    DROP TABLE dbo.TDPS_SchoolOpenDates;

-- Create the table if it does not exist
IF NOT EXISTS (
   SELECT * 
   FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_NAME = 'TDPS_SchoolOpenDates' AND TABLE_SCHEMA = 'dbo'
)
BEGIN
   CREATE TABLE dbo.TDPS_SchoolOpenDates (
       DateValue DATE PRIMARY KEY -- Adjust columns and types as needed
   );

   -- Populate the table with all school open dates for the current school year
   WITH DateSeries AS (
       -- Initial row from configuration, starting the series with the StartDate
       SELECT CAST(StartDate AS DATE) AS DateValue, CAST(EndDate AS DATE) AS EndDate
       FROM TDPS_ConfigurationSettings
       WHERE ConfigurationKey = 'CurrentSchoolYear'

       UNION ALL

       -- Recursive part, adding 1 day at a time
       SELECT DATEADD(DAY, 1, DateValue) AS DateValue, EndDate
       FROM DateSeries
       WHERE DateValue < EndDate
   )
   INSERT INTO dbo.TDPS_SchoolOpenDates
   SELECT DateValue
   FROM DateSeries
   WHERE DATENAME(WEEKDAY, DateValue) NOT IN ('Saturday', 'Sunday')
     AND NOT EXISTS (
         SELECT 1 
         FROM TDPS_DesignatedHoliday 
         WHERE DateValue BETWEEN StartDate AND EndDate
           AND ForSchoolCloseDayCalculation = 1
     )
   OPTION (MAXRECURSION 366);
END;`,
    category: "SQL Server",
    language: "SQL",
    icon: "Database",
    color: "bg-red-600",
    tags: ["tdps", "client-specific", "campus", "queries", "school-open-dates", "reporting"],
    lastUsed: new Date("2026-01-08"),
  },
  {
    id: "sql-server-file-migration",
    title: "SQL Server - Migrate File References",
    description:
      "Move file references from rollover directory to local application storage using SQL UPDATE and REPLACE",
    content: `
------------------------------------------------------------
-- SQL Server Migration Script
------------------------------------------------------------
-- Move file references from rollover directory (E:\\RaaWee\\RollOver\\2024-2025)
-- to local application storage (D:\\myNGApp\\Raawee)

------------------------------------------------------------
-- 1. Update History_StudentFiles paths
------------------------------------------------------------
UPDATE History_StudentFiles
SET FilePath = REPLACE(
    FilePath,
    'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentFiles',
    'D:\\myNGApp\\Raawee\\History_StudentFiles'
)
WHERE FilePath LIKE
    'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentFiles%';

------------------------------------------------------------
-- 2. Update History_StudentDocuments paths
------------------------------------------------------------
UPDATE History_StudentDocuments
SET DocPath = REPLACE(
    DocPath,
    'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentDocuments\\StudentsDocumentLibrary-',
    'D:\\myNGApp\\Raawee\\History_StudentDocuments\\'
)
WHERE DocPath LIKE
    'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentDocuments\\StudentsDocumentLibrary-%';

------------------------------------------------------------
-- 3. Verify updated paths
------------------------------------------------------------
SELECT TOP 10
    FileID,
    FilePath
FROM History_StudentFiles
WHERE FilePath LIKE
    'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentDocuments\\StudentsDocumentLibrary-%';

------------------------------------------------------------
-- 4. Reverse preview changes for verification
------------------------------------------------------------
SELECT
    REPLACE(
        'D:\\myNGApp\\Raawee\\History_StudentDocuments\\',
        'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentDocuments\\StudentsDocumentLibrary-'
    ) AS NewPath
FROM History_StudentDocuments
WHERE DocPath LIKE
    'E:\\RaaWee\\RollOver\\2024-2025\\DocumentLibrary\\History_StudentDocuments\\StudentsDocumentLibrary-%';
`,
    category: "SQL Server",
    language: "SQL",
    icon: "Database",
    color: "bg-red-600",
    tags: ["sql", "update", "file-paths", "migration", "maintenance"],
    lastUsed: new Date("2026-01-08"),
  },
  {
    id: "latest-bookmarks",
    title: "Template Bookmarks",
    description:
      "Essential development resources, documentation links, and merge field placeholders for quick reference",
    content: `# Development Bookmarks & Resources

## Placeholders
<<ACTIVEISD>>
<<ABSENCESDATE>>
<<ACTIONTYPE>>
<<ACTIVESEMESTER>>
<<ALLABSENCESCOUNT>>
<<ALLABSENCESCOUNTFROMINTDATE>>
<<ALLABSENCESCOUNTTILLLETTERPRINTED>>
<<ALLABSENCESCOUNTTILLLETTERPRINTEDFROMINTDATE>>
<<ALLABSENCESDATES>>
<<ALLABSENCESDATESFROMINTDATE>>
<<ALLABSENCESDATESTILLLETTERPRINTED>>
<<ALLABSENCESDATESTILLLETTERPRINTEDFROMINTDATE>>
<<ALLFULLABSENCESCOUNT>>
<<ALLFULLABSENCESCOUNTFROMINTDATE>>
<<ALLFULLABSENCESDATES>>
<<ALLFULLABSENCESDATESBULLETS>>
<<ALLABSENCESDATESBULLETS>>
<<ALLFULLABSENCESDATESFROMINTDATE>>
<<ASSISTANTPRINCIPALNAME>>
<<ATTENDANCEOFFICERNAME>>
<<ATTENDANCEOFFICERNAMEASCURRENTUSER>>
<<ATTENDANCERATE>>
<<AVGSPEEDDAYS>>
<<CAMPUSSTATE>>
<<CAMPUSTYPE>>
<<CAMPUSZIPCODE>>
<<CAMPUSID>>
<<CREATEDDATE>>
<<CAMPUSCITYSTATEZIP>>
<<CAMPUSCOMPLETEADDRESS>>
<<CAMPUSEMAILADDRESS>>
<<CAMPUSADDRESS>>
<<CAMPUSNAME>>
<<CAMPUSPHONENO>>
<<CURRENTDATEWITHMONTHNAMEANDDASH>>
<<CURRENTDATEWITHMONTHNAMEANDSLASH>>
<<CURRENTDATEWITHMONTHNAMEANDSPACE>>
<<CURRENTDATEWITHMONTHNUMBER>>
<<CURRENTFORMATTEDDATE>>
<<CURRENTUSERNAME>>
<<CAUSENUMBER>>
<<COURTACTIONVALIDITY>>
<<CAMPUSSTARTTIME>>
<<CONFERENCEROOMANDCAMPUSADDRESS>>
<<CONFERENCELOCATION>>
<<CONFERENCEROOM>>
<<DATEOFBIRTH>>
<<DAYSENROLLED>>
<<DAYSPRESENT>>
<<EXABSENCESCOUNT>>
<<EXABSENCESCOUNTFROMINTDATE>>
<<EXABSENCESCOUNTTILLLETTERPRINTED>>
<<EXABSENCESCOUNTTILLLETTERPRINTEDFROMINTDATE>>
<<EXABSENCESDATES>>
<<EXABSENCESDATESFROMINTDATE>>
<<EXABSENCESDATESTILLLETTERPRINTED>>
<<EXABSENCESDATESTILLLETTERPRINTEDFROMINTDATE>>
<<EXFULLABSENCESCOUNT>>
<<EXFULLABSENCESCOUNTFROMINTDATE>>
<<EXFULLABSENCESDATES>>
<<EXFULLABSENCESDATESFROMINTDATE>>
<<EXABSENCESCOUNTINWORDS>>
<<EXFULLABSENCESDATESBULLETS>>
<<EXABSENCESDATESBULLETS>>
<<ENROLLMENTDATE>>
<<FIRSTCONTACTNAME>>
<<FIRSTCONTACTPHONE>>
<<FIRSTCONTACTEMAIL>>
<<FIRSTWLDATE>>
<<GRADEABSENCESSUMMARYENGLISH>>
<<GUARDIANZIPCODE>>
<<GRADE>>
<<GUARDIANADDRESS>>
<<GUARDIANDOB>>
<<GUARDIANEMAIL>>
<<GUARDIANGENDER-1>>
<<GUARDIANNAME>>
<<GUARDIANRELATIONSHIP>>
<<GUARDIANHOMELANGUAGE>>
<<HEARINGDATE>>
<<LASTABSENCEDATE>>
<<LASTSCHOOLYEAR>>
<<LOSSEXCUSEDINSTRUCTIONSHOURS>>
<<LOSSINSTRUCTIONSHOURS>>
<<LOSSUNEXCUSEDINSTRUCTIONSHOURS>>
<<LYABSENCESCOUNT>>
<<LYEXCCOUNT>>
<<LYGRADE>>
<<LYLT30>>
<<LYMT30>>
<<LYSUSPENSIONCOUNT>>
<<LYTARDYCOUNT>>
<<LYUNEXCOUNT>>
<<MONITERINGDATEEND>>
<<MONITERINGDATESTART>>
<<MODIFIEDDATE>>
<<MONTHNAME>>
<<NOTICEDATE>>
<<PARENTEMAILADDRESS>>
<<PARENTPHONENUMBER>>
<<PARENTCITY>>
<<PARENTCITYSTATEZIP>>
<<PARENTCURRENTADDRESS>>
<<PARENTORCURRENTADDRESS>>
<<PARENTORCURRENTCITYSTATEZIP>>
<<PARENTFIRSTANDLASTNAME>>
<<PARENTFIRSTNAME>>
<<PARENTFULLADDRESS>>
<<PARENTFULLNAME>>
<<PARENTNAME>>
<<PARENTLASTANDFIRSTNAME>>
<<PARENTLASTNAME>>
<<PARENTMIDDLENAME>>
<<PARENTPHONENO>>
<<PARENTSTATE>>
<<PARENTZIPCODE>>
<<PRINCIPALNAME>>
<<PICPHONE>>
<<PICSPECIALIST>>
<<REQUESTATTENDACEOFFICERNAME>>
<<REQUESTFORMDATE>>
<<STUDENTID>>
<<STUDENTNAME>>
<<STUDENTCURRENTADDRESS>>
<<STUDENTSOCIALSecurityNO>>
<<STUDENTCURRENTCITYSTATEZIP>>
<<STUDENTDATEOFBIRTH>>
<<STUDENTFIRSTANDLASTNAME>>
<<STUDENTFIRSTNAME>>
<<STUDENTFULLNAME>>
<<STUDENTGENDER>>
<<STUDENTAGE>>
<<STUDENTGRADE>>
<<STUDENTLASTANDFIRSTNAME>>
<<STUDENTLASTNAME>>
<<STUDENTMIDDLENAME>>
<<STUDENTNAMEANDID>>
<<STUDENTPHONENUMBER>>
<<STUDENTRACE>>
<<SCHOOLDISTRICT>>
<<STUDENTZIPCODE>>
<<SARTDATE>>
<<SCHOOLYEAR>>
<<SECONDCONTACTNAME>>
<<SECONDCONTACTPHONE>>
<<SECONDNOTLETTERDATE>>
<<SCHEDULEDDATE>>
<<SCHEDULEDDATEWITHMONTHNAMEANDSPACE>>
<<SCHEDULEDTIME>>
<<SCHEDULEDMONTH>>
<<TODAYSDATE>>
<<USERNAME>>
<<UNXABSENCESCOUNT>>
<<UNXABSENCESCOUNTFROMINTDATE>>
<<UNXABSENCESCOUNTTILLLETTERPRINTED>>
<<UNXABSENCESCOUNTTILLLETTERPRINTEDFROMINTDATE>>
<<UNXABSENCESDATES>>
<<UNXABSENCESDATESFROMINTDATE>>
<<UNXABSENCESDATESTILLLETTERPRINTED>>
<<UNXABSENCESDATESTILLLETTERPRINTEDFROMINTDATE>>
<<UNXFULLABSENCESCOUNT>>
<<UNXFULLABSENCESCOUNTFROMINTDATE>>
<<UNXFULLABSENCESDATES>>
<<UNXFULLABSENCESDATESFROMINTDATE>>
<<UNXFULLABSENCESDATESBULLETS>>
<<UNXABSENCESDATESBULLETS>>
<<SARBDATE>>
<<LYUNEXCOUNT>>`,
    category: "Documentation",
    language: "Markdown",
    icon: "BookOpen",
    color: "bg-indigo-600",
    tags: ["bookmarks", "resources", "documentation", "tools", "learning", "placeholders"],
    lastUsed: new Date("2023-12-31"),
  },
  {
    id: "admin-user-creation",
    title: "System Admin Creation Script",
    description:
      "Comprehensive setup for SystemAdmin role, administrative user account, and TDPS_SETUP key synchronization.",
    content: `use [TDPS]
 
DECLARE @NewId UNIQUEIDENTIFIER = NEWID();
 
IF NOT EXISTS (
    SELECT 1 FROM AttplusUsers 
    WHERE UserName = 'Attplus.Admin' 
       OR Email = 'attplusadmin@raaweek12.com'
)
BEGIN
    INSERT INTO AttplusUsers 
    (Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed, 
     PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed, 
     TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount, FirstName, LastName, 
     RoleId, ActionTakenBy, ActionTakenId) 
    VALUES 
    (@NewId, 'Attplus.Admin', 'ATTPLUS.ADMIN', 'attplusadmin@raaweek12.com', 'ATTPLUSADMIN@RAAWEEK12.COM', 1, 
     NEWID(), NEWID(), NEWID(), '1234567890', 1, 
     0, NULL, 1, 0, 'Attplus', 'Admin', 
     12, 'Attplus Admin', @NewId);
END
 
-- Entry in TDPS AttplusUserRoles Table
IF NOT EXISTS (
    SELECT 1 FROM AttplusUserRoles 
    WHERE Name = 'SystemAdmin' 
       OR NormalizedName = 'SYSTEMADMIN'
)
BEGIN
    INSERT INTO AttplusUserRoles (Id, ConcurrencyStamp, Name, NormalizedName, Active, CampusSelection)
    VALUES (12, NULL, 'SystemAdmin', 'SYSTEMADMIN', 1, 2);
END
 
-- Entry in TDPS TDPS_SETUP Table
DECLARE @AdminId UNIQUEIDENTIFIER;
 
-- Fetch the ID of Attplus.Admin from AttPlusUser
SELECT @AdminId = Id 
FROM AttplusUsers 
WHERE Email = 'attplusadmin@raaweek12.com';
 
-- Check if 'AttplusAdminID' key exists in TDPS_SETUP
IF EXISTS (SELECT 1 FROM TDPS_SETUP WHERE [Key] = 'AttplusAdminID')
BEGIN
    -- Update the existing record
    UPDATE TDPS_SETUP 
    SET [Value] = CAST(@AdminId AS NVARCHAR(MAX)) -- Ensuring type compatibility if Value is string-based
    WHERE [Key] = 'AttplusAdminID';
END
ELSE
BEGIN
    -- Insert a new record if it doesn't exist
    INSERT INTO TDPS_SETUP ([Key], [Value])
    VALUES ('AttplusAdminID', CAST(@AdminId AS NVARCHAR(MAX)));
END`,
    category: "User Management",
    language: "SQL",
    icon: "Shield",
    color: "bg-purple-600",
    tags: ["tdps", "system-admin", "setup", "attplus", "initialization"],
    lastUsed: new Date("2026-01-08"),
  },
  {
    id: "v-tdps-user-role-view",
    title: "TDPS User Role View",
    description:
      "SQL View to aggregate Campus, User, and Role data, providing a unified look at user permissions and action logs.",
    content: `USE [TDPS]
GO

/****** Object:  View [dbo].[vTDPS_UserRoleView]    Script Date: 2/24/2025 12:34:40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[vTDPS_UserRoleView] AS
SELECT
    c.CampusId,
    c.CampusName,
    u.RoleId,
    r.Name AS RoleName,
    r.NormalizedName,
    u.Id AS UserId,
    u.Email,
    u.NormalizedEmail,
    u.Username,
    u.FirstName,
    u.LastName,
    u.NormalizedUserName,
    u.ActionTakenBy,
    u.ActionTakenId,
    cu.CreatedDate AS ActionTakenDate
FROM
    [AttplusUsers] u
LEFT JOIN
    [AttplusUserRoles] r
    ON u.RoleId = r.Id -- Match RoleId with the roles table
LEFT JOIN
    [CampusUser] cu
    ON u.Id = cu.UserId
LEFT JOIN
    [Campuses] c
    ON cu.CampusId = c.CampusId;
GO`,
    category: "Database Views",
    language: "SQL",
    icon: "Table",
    color: "bg-blue-600",
    tags: ["sql-view", "user-management", "reporting", "tdps", "schema"],
    lastUsed: new Date("2025-02-24"),
  },
  {
    id: "vm-activation-commands",
    title: "VM & Windows Activation Commands",
    description: "Quick reference for Windows activation and VM management commands",
    content: `# VM & Windows Activation Commands

## Windows Activation
1. **Rearm Windows Activation Timer**  
_(Run as Administrator)_ 

slmgr /rearm

2. **Display License Information**  
_(Run as Administrator)_  

slmgr /dlv

## VM Operations

3. **Restart Virtual Machine**  

_Can be run inside the VM or via PowerShell on host_

Restart-Computer

> Tip: Always save your work before restarting the VM.`,
    category: "Quick Scripts",
    language: "Markdown",
    icon: "Cpu",
    color: "bg-yellow-600",
    tags: ["vm", "windows", "activation", "commands", "restart"],
    lastUsed: new Date(),
  },
  {
    id: "iis-ssl-multi-site-setup",
    title: "IIS Site Setup (PowerShell)",
    description:
      "PowerShell script to automatically create IIS sites, app pools, HTTPS bindings, and apply SSL certificates using a friendly name",
    content: `Import-Module WebAdministration

# --- SSL Certificate Friendly Name ---
$certFriendlyName = "*raaweek12_24-25"

# --- Find SSL Certificate ---
$cert = Get-ChildItem -Path Cert:\\LocalMachine\\My | Where-Object { $_.FriendlyName -eq $certFriendlyName }

if (-not $cert) {
    Write-Host "❌ SSL Certificate '$certFriendlyName' not found in LocalMachine\\My store." -ForegroundColor Red
    exit 1
}

$thumbprint = $cert.Thumbprint -replace " ", ""
Write-Host "🔍 Found SSL Certificate '$certFriendlyName' with Thumbprint: $thumbprint"
Write-Host ""

# --- Base Path for Projects ---
$basePath = "D:\\myNGApp\\Deployments\\Rk12.AttPlus.Integration"

# --- Hosts ---
$commonHost = "attplusgv.raaweek12.com"
$gatewayHost = "gatewaygv.raaweek12.com"

# --- Site List ---
$sites = @(
    @{ Name = "Rk12.AttPlus.Intervention.API"; Port = 7189; Path = "$basePath\\Rk12.AttPlus.Intervention.API"; Host = $commonHost },
    @{ Name = "Rk12.AttPlus.Analysis.API"; Port = 7296; Path = "$basePath\\Rk12.AttPlus.Analysis.API"; Host = $commonHost },
    @{ Name = "Rk12.AttPlus.Administration.API"; Port = 7239; Path = "$basePath\\Rk12.AttPlus.Administration.API"; Host = $commonHost },
    @{ Name = "Rk12.AttPlus.CourtManagement.API"; Port = 7007; Path = "$basePath\\Rk12.AttPlus.CourtManagement.API"; Host = $commonHost },
    @{ Name = "Rk12.AttPlus.Identity.API"; Port = 7206; Path = "$basePath\\Rk12.AttPlus.Identity.API"; Host = $commonHost },
    @{ Name = "Rk12.AttPlus.SentLetter.API"; Port = 7101; Path = "$basePath\\RK12.AttPlus.Intervention.SendLetter.QConsumer"; Host = $commonHost },
    @{ Name = "Rk12.AttPlus.LetterDispatch.API"; Port = 7119; Path = "$basePath\\Rk12.AttPlus.LetterDispatch.API"; Host = $commonHost },
    @{ Name = "Rk12.AttPlus.MessageHub.API"; Port = 7120; Path = "$basePath\\Rk12.AttPlus.MessageHub"; Host = $commonHost },
    @{ Name = "Rk12.AttPlus.Miscellaneous.API"; Port = 7061; Path = "$basePath\\Rk12.AttPlus.Miscellaneous.API"; Host = $commonHost },
    @{ Name = "Rk12.AttPlus.ApiGateway"; Port = 443; Path = "$basePath\\Rk12.AttPlus.ApiGateway"; Host = $gatewayHost },
    @{ Name = "Rk12.AttPlus.Angular.Web"; Port = 443; Path = "$basePath\\Rk12.AttPlus.Angular.Web"; Host = $commonHost }
)

# --- Loop through all sites ---
foreach ($s in $sites) {
    $siteName = $s.Name
    $appPool = $siteName
    $physicalPath = $s.Path
    $port = $s.Port
    $siteHost = $s.Host

    Write-Host "⚙️ Configuring $siteName ($siteHost:$port)..."

    if (-not (Test-Path "IIS:\\AppPools\\$appPool")) {
        New-WebAppPool -Name $appPool | Out-Null
    }

    Set-ItemProperty "IIS:\\AppPools\\$appPool" -Name processModel.identityType -Value "LocalSystem"
    Set-ItemProperty "IIS:\\AppPools\\$appPool" -Name managedRuntimeVersion -Value ""
    Set-ItemProperty "IIS:\\AppPools\\$appPool" -Name managedPipelineMode -Value "Integrated"
    Set-ItemProperty "IIS:\\AppPools\\$appPool" -Name startMode -Value "AlwaysRunning"

    if (-not (Test-Path "IIS:\\Sites\\$siteName")) {
        New-Website -Name $siteName -Port 99999 -PhysicalPath $physicalPath -ApplicationPool $appPool | Out-Null
        Remove-WebBinding -Name $siteName -Protocol http -Port 99999 -ErrorAction SilentlyContinue
    }

    $bindingPath = "IIS:\\SslBindings\\0.0.0.0!$port!$siteHost"
    if (Test-Path $bindingPath) { Remove-Item $bindingPath -ErrorAction SilentlyContinue }

    New-WebBinding -Name $siteName -Protocol https -Port $port -HostHeader $siteHost -SslFlags 0 | Out-Null
    New-Item -Path $bindingPath -Thumbprint $thumbprint -SSLFlags 0 | Out-Null

    Start-Website -Name $siteName
}

Write-Host "🎉 All AttendancePlus sites created with HTTPS and started successfully!"`,
    category: "IIS & Web Server",
    language: "PowerShell",
    icon: "Server",
    color: "bg-purple-600",
    tags: ["iis", "powershell", "ssl", "https", "automation", "deployment"],
    lastUsed: new Date("2024-01-20"),
  },
  {
    id: "hosts-file-configuration",
    title: "Windows Hosts File Configuration",
    description:
      "Steps to update the Windows hosts file with client, API gateway, and docs URLs to avoid loopback issues",
    content: `Update the hosts file

Update the IP and Client URLs in the hosts file to avoid loopback issues. Please follow the steps below:

1. Open File Explorer.
2. Navigate to the folder:
   C:\\Windows\\System32\\drivers\\etc
3. Open the "hosts" file in any text editor (run the editor as Administrator).
4. Add the following entries to the hosts file:

   a. <Local IP>    <clientname>.raaweek12.com
   b. <Local IP>    apigateway<clientname>.raaweek12.com
   c. <Local IP>    <clientname>docs.raaweek12.com

5. Save the file and close the editor.

Note:
- Replace <Local IP> with your machine or server IP address.
- Replace <clientname> with the actual client identifier.`,
    category: "Quick Scripts",
    language: "Text",
    icon: "Cpu",
    color: "bg-yellow-600",
    tags: ["hosts-file", "dns", "loopback", "api-gateway", "windows"],
    lastUsed: new Date("2024-01-14"),
  },
]
