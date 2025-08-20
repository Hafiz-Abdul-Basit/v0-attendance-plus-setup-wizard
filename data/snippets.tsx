// ============================================
// SNIPPET VISIBILITY CONFIGURATION
// ============================================
// Set to false to hide any snippet from the UI
const SNIPPET_VISIBILITY = {
  "frontend-webconfig": true,
  "backend-webconfig": true,
  "mongodb-replica": true,
  "angular-dev-setup": true,
  "sql-server-cmdline": true,
  "user-data-table": true,
  "user-roles-setup": false,
  "user-creation": true,
  "user-claims": false,
  "campus-assignment": false,
  "database-sync": false,
  "mongodb-backup-restore": true,
  "tdps-truncate-tables": false,
  "tdps-client-dependent-select": false,
  "latest-bookmarks": true,
  "admin-user-creation": true,
  "abdul-basit-apps": false,
  "period-skipped-table-properties": true,
} as const

// ============================================
// ORIGINAL SNIPPETS DATA (UNCHANGED)
// ============================================
const allSnippetsData = [
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
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>
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
  <system.webServer>
    <modules>
      <remove name="WebDAVModule" />
    </modules>
    <handlers>
      <remove name="WebDAV" />
      <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
    </handlers>
    <aspNetCore processPath="dotnet" arguments=".\\YourApp.dll" stdoutLogEnabled="false" stdoutLogFile=".\\logs\\stdout" />
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="DENY" />
        <add name="X-XSS-Protection" value="1; mode=block" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>`,
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
  description: "Complete script to initialize and configure MongoDB replica set for high availability",
  content: `# Connect to MongoDB
mongosh.exe

# Initialize replica set
rs.initiate()

# Check replica set status
rs.status()

# Add replica set member (if needed)
rs.add("localhost:27018")

# Check replica set configuration
rs.conf()

# Force reconfigure (if needed)
rs.reconfig(config, {force: true})`,
  category: "MongoDB",
  language: "Shell",
  icon: "Database",
  color: "bg-green-600",
  tags: ["mongodb", "replica-set", "high-availability", "clustering"],
  lastUsed: new Date("2024-01-13"),
},
 {
  id: "angular-dev-setup",
  title: "Angular Heap Serve & Build",
  description: "Run Angular serve and production build commands with higher memory allocation to prevent build failures",
  content: `# Serve with increased memory allocation
node --max_old_space_size=8192 ./node_modules/@angular/cli/bin/ng serve

# Alternative using npx
npx --node-options="--max_old_space_size=8192" ng serve

# For production build with increased memory
node --max_old_space_size=8192 ./node_modules/@angular/cli/bin/ng build --configuration production`,
  category: "Development",
  language: "Shell",
  icon: "Code2",
  color: "bg-orange-600",
  tags: ["angular", "serve", "build", "memory", "cli"],
  lastUsed: new Date("2024-01-12"),
},

  {
    id: "sql-server-cmdline",
    title: "SQL Server Command Line Execution",
    description: "Execute SQL scripts using sqlcmd with various authentication methods and parameters",
    content: `-- Execute SQL script with SQL Server Authentication
sqlcmd -S <ServerName> -d <DatabaseName> -U <UserName> -P <Password> -i "C:\\Path\\To\\YourScript.sql"

-- Execute SQL script with Windows Authentication
sqlcmd -S localhost -d MyDatabase -E -i "C:\\Scripts\\BigScript.sql"

-- Execute with output to file
sqlcmd -S localhost -d MyDatabase -E -i "C:\\Scripts\\Query.sql" -o "C:\\Output\\Results.txt"

-- Execute inline query
sqlcmd -S localhost -d MyDatabase -E -Q "SELECT TOP 10 * FROM Users"

-- Execute with variables
sqlcmd -S localhost -d MyDatabase -E -v DatabaseName="MyDB" -i "C:\\Scripts\\Script.sql"

-- Batch execution with error handling
sqlcmd -S localhost -d MyDatabase -E -i "C:\\Scripts\\Migration.sql" -b -V 16`,
    category: "SQL Server",
    language: "SQL",
    icon: "Terminal",
    color: "bg-red-600",
    tags: ["sqlcmd", "command-line", "sql-server", "batch", "authentication"],
    lastUsed: new Date("2024-01-11"),
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
    title: "User Roles Configuration",
    description: "Complete setup for user roles and permissions in ASP.NET Identity system",
    content: `-- Create Roles Table and Insert Default Roles
INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
VALUES 
    (NEWID(), 'SuperAdmin', 'SUPERADMIN', NEWID()),
    (NEWID(), 'Admin', 'ADMIN', NEWID()),
    (NEWID(), 'Manager', 'MANAGER', NEWID()),
    (NEWID(), 'Teacher', 'TEACHER', NEWID()),
    (NEWID(), 'Student', 'STUDENT', NEWID());

-- Assign User to Role
INSERT INTO AspNetUserRoles (UserId, RoleId)
SELECT u.Id, r.Id
FROM AspNetUsers u, AspNetRoles r
WHERE u.Email = 'admin@example.com' AND r.Name = 'Admin';

-- Create Claims for Roles
INSERT INTO AspNetRoleClaims (RoleId, ClaimType, ClaimValue)
SELECT r.Id, 'permission', 'CanManageUsers'
FROM AspNetRoles r
WHERE r.Name = 'Admin';`,
    category: "User Management",
    language: "SQL",
    icon: "Shield",
    color: "bg-purple-600",
    tags: ["roles", "permissions", "identity", "claims", "security"],
    lastUsed: new Date("2024-01-09"),
  },
 {
  id: "user-creation",
  title: "User Account Creation",
  description: "SQL script for creating new user accounts with proper hashing and default settings",
  content: `USE [TDPS]
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
GO`,
  category: "User Management",
  language: "SQL",
  icon: "UserPlus",
  color: "bg-purple-600",
  tags: ["user-creation", "identity", "accounts", "claims"],
  lastUsed: new Date("2024-01-08"),
},

  {
    id: "user-claims",
    title: "User Claims Management",
    description: "Manage user claims for custom properties and permissions in Identity system",
    content: `-- Add Claims to User
INSERT INTO AspNetUserClaims (UserId, ClaimType, ClaimValue)
SELECT Id, 'Campus', 'Main Campus'
FROM AspNetUsers
WHERE Email = 'user@example.com';

-- Update User Claim
UPDATE AspNetUserClaims 
SET ClaimValue = 'New Value'
WHERE UserId = (SELECT Id FROM AspNetUsers WHERE Email = 'user@example.com')
AND ClaimType = 'Department';

-- Remove User Claim
DELETE FROM AspNetUserClaims
WHERE UserId = (SELECT Id FROM AspNetUsers WHERE Email = 'user@example.com')
AND ClaimType = 'OldClaim';

-- Get All Claims for User
SELECT u.Email, uc.ClaimType, uc.ClaimValue
FROM AspNetUsers u
JOIN AspNetUserClaims uc ON u.Id = uc.UserId
WHERE u.Email = 'user@example.com';`,
    category: "User Management",
    language: "SQL",
    icon: "Key",
    color: "bg-purple-600",
    tags: ["claims", "permissions", "identity", "properties"],
    lastUsed: new Date("2024-01-07"),
  },
  {
    id: "campus-assignment",
    title: "Campus User Assignment",
    description: "Assign users to specific campuses and manage multi-campus access permissions",
    content: `-- Assign User to Single Campus
UPDATE AspNetUserClaims 
SET ClaimValue = '1'
WHERE UserId = (SELECT Id FROM AspNetUsers WHERE Email = 'user@example.com')
AND ClaimType = 'CampusId';

-- Assign User to Multiple Campuses
UPDATE AspNetUserClaims 
SET ClaimValue = '1|2|3'
WHERE UserId = (SELECT Id FROM AspNetUsers WHERE Email = 'user@example.com')
AND ClaimType = 'CampusId';

-- Get Users by Campus
SELECT u.Email, u.UserName, uc.ClaimValue as CampusIds
FROM AspNetUsers u
JOIN AspNetUserClaims uc ON u.Id = uc.UserId
WHERE uc.ClaimType = 'CampusId'
AND (uc.ClaimValue = '1' OR uc.ClaimValue LIKE '%|1|%' OR uc.ClaimValue LIKE '1|%' OR uc.ClaimValue LIKE '%|1');

-- Remove Campus Assignment
DELETE FROM AspNetUserClaims
WHERE ClaimType = 'CampusId'
AND UserId = (SELECT Id FROM AspNetUsers WHERE Email = 'user@example.com');`,
    category: "User Management",
    language: "SQL",
    icon: "Users",
    color: "bg-purple-600",
    tags: ["campus", "assignment", "multi-campus", "permissions"],
    lastUsed: new Date("2024-01-06"),
  },
  {
    id: "database-sync",
    title: "Database Synchronization",
    description: "Scripts for synchronizing data between different database environments",
    content: `-- Sync Users Between Databases
INSERT INTO [TargetDB].[dbo].[AspNetUsers]
SELECT * FROM [SourceDB].[dbo].[AspNetUsers]
WHERE Id NOT IN (SELECT Id FROM [TargetDB].[dbo].[AspNetUsers]);

-- Sync User Claims
INSERT INTO [TargetDB].[dbo].[AspNetUserClaims]
SELECT * FROM [SourceDB].[dbo].[AspNetUserClaims]
WHERE Id NOT IN (SELECT Id FROM [TargetDB].[dbo].[AspNetUserClaims]);

-- Sync Roles
INSERT INTO [TargetDB].[dbo].[AspNetRoles]
SELECT * FROM [SourceDB].[dbo].[AspNetRoles]
WHERE Id NOT IN (SELECT Id FROM [TargetDB].[dbo].[AspNetRoles]);

-- Compare Record Counts
SELECT 
    'Users' as TableName,
    (SELECT COUNT(*) FROM [SourceDB].[dbo].[AspNetUsers]) as SourceCount,
    (SELECT COUNT(*) FROM [TargetDB].[dbo].[AspNetUsers]) as TargetCount;`,
    category: "SQL Server",
    language: "SQL",
    icon: "Database",
    color: "bg-red-600",
    tags: ["sync", "migration", "database", "backup"],
    lastUsed: new Date("2024-01-05"),
  },

  {
  id: "period-skipped-table-properties",
  title: "Period Skipped Columns",
  description: "Contains detailed attendance, absence, and owed minutes/hours data for each student",
  content: `StudentId
Course
Period
TeacherName
Grade
CampusName
Absences
ExcusedAbsences
UnexcusedAbsences
OwedTotal
OwedToRecover
MinutesOwedInTotal
MinutesOwedToRecover
HoursOwedTotal
HoursOwedToRecover
TotalPossibleDays
TotalDaysPresent
TotalDaysAbsent
AttendancePercent`,
  category: "SQL Server",
  language: "Plain Text",
  icon: "BookOpen",
  color: "bg-blue-600",
  tags: ["student", "attendance", "absences", "owed", "data"],
  lastUsed: new Date("2024-08-21"),
},
 {
  id: "mongodb-backup-restore",
  title: "MongoDB Backup & Restore",
  description: "Complete MongoDB backup and restore operations with compression and scheduling",
  content: `# Go to MongoDB tools path
# Eg: C:\\Program Files\\MongoDB\\Tools\\100\\bin

# Restore database
mongorestore --db databasename backupfilepath

# Backup database
mongodump --db databasename --out backupfilepath`,
  category: "MongoDB",
  language: "Shell",
  icon: "Database",
  color: "bg-green-600",
  tags: ["backup", "restore", "mongodb", "compression", "automation"],
  lastUsed: new Date("2024-01-04"),
},

  {
    id: "tdps-truncate-tables",
    title: "TDPS Database Table Cleanup",
    description: "Truncate all tables in TDPS database for fresh data import",
    content: `-- TDPS Database Table Truncation Script
-- Use with caution - this will delete all data

USE TDPS_Database;

-- Disable foreign key constraints
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"

-- Truncate all tables
TRUNCATE TABLE Students;
TRUNCATE TABLE Teachers;
TRUNCATE TABLE Classes;
TRUNCATE TABLE Attendance;
TRUNCATE TABLE Subjects;
TRUNCATE TABLE Schedules;
TRUNCATE TABLE Grades;
TRUNCATE TABLE Parents;
TRUNCATE TABLE Fees;
TRUNCATE TABLE Announcements;

-- Re-enable foreign key constraints
EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all"

-- Verify tables are empty
SELECT 
    TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES t2 WHERE t2.TABLE_NAME = t1.TABLE_NAME) as RecordCount
FROM INFORMATION_SCHEMA.TABLES t1
WHERE TABLE_TYPE = 'BASE TABLE';`,
    category: "SQL Server",
    language: "SQL",
    icon: "Database",
    color: "bg-red-600",
    tags: ["truncate", "cleanup", "tdps", "database", "reset"],
    lastUsed: new Date("2024-01-02"),
  },
  {
    id: "tdps-client-dependent-select",
    title: "TDPS Client-Dependent Data Query",
    description: "Query TDPS data based on client/campus specific requirements",
    content: `-- TDPS Client-Dependent Data Queries
-- Filter data based on campus/client assignments

-- Get students by campus
SELECT s.*, c.CampusName
FROM Students s
JOIN Campus c ON s.CampusId = c.Id
WHERE c.ClientId = @ClientId;

-- Get attendance by campus and date range
SELECT a.*, s.StudentName, c.ClassName
FROM Attendance a
JOIN Students s ON a.StudentId = s.Id
JOIN Classes c ON a.ClassId = c.Id
JOIN Campus camp ON s.CampusId = camp.Id
WHERE camp.ClientId = @ClientId
AND a.AttendanceDate BETWEEN @StartDate AND @EndDate;

-- Get teachers assigned to specific campus
SELECT t.*, c.CampusName
FROM Teachers t
JOIN TeacherCampusAssignment tca ON t.Id = tca.TeacherId
JOIN Campus c ON tca.CampusId = c.Id
WHERE c.ClientId = @ClientId;

-- Summary report by campus
SELECT 
    c.CampusName,
    COUNT(DISTINCT s.Id) as TotalStudents,
    COUNT(DISTINCT t.Id) as TotalTeachers,
    COUNT(DISTINCT cl.Id) as TotalClasses
FROM Campus c
LEFT JOIN Students s ON c.Id = s.CampusId
LEFT JOIN TeacherCampusAssignment tca ON c.Id = tca.CampusId
LEFT JOIN Teachers t ON tca.TeacherId = t.Id
LEFT JOIN Classes cl ON c.Id = cl.CampusId
WHERE c.ClientId = @ClientId
GROUP BY c.Id, c.CampusName;`,
    category: "SQL Server",
    language: "SQL",
    icon: "Database",
    color: "bg-red-600",
    tags: ["tdps", "client-specific", "campus", "queries", "reporting"],
    lastUsed: new Date("2024-01-01"),
  },
 {
  "id": "latest-bookmarks",
  "title": "Latest Bookmarks",
  "description": "Essential system placeholders for quick reference in development",
  "content": " <<ACTIVEISD>>\n <<ABSENCESDATE>>\n <<ACTIONTYPE>>\n <<ACTIVESEMESTER>>\n <<ALLABSENCESCOUNT>>\n <<ALLABSENCESCOUNTFROMINTDATE>>\n <<ALLABSENCESCOUNTTILLLETTERPRINTED>>\n <<ALLABSENCESCOUNTTILLLETTERPRINTEDFROMINTDATE>>\n <<ALLABSENCESDATES>>\n <<ALLABSENCESDATESFROMINTDATE>>\n <<ALLABSENCESDATESTILLLETTERPRINTED>>\n <<ALLABSENCESDATESTILLLETTERPRINTEDFROMINTDATE>>\n <<ALLFULLABSENCESCOUNT>>\n <<ALLFULLABSENCESCOUNTFROMINTDATE>>\n <<ALLFULLABSENCESDATES>>\n <<ALLFULLABSENCESDATESBULLETS>>\n <<ALLABSENCESDATESBULLETS>>\n <<ALLFULLABSENCESDATESFROMINTDATE>>\n <<ASSISTANTPRINCIPALNAME>>\n <<ATTENDANCEOFFICERNAME>>\n <<ATTENDANCEOFFICERNAMEASCURRENTUSER>>\n <<ATTENDANCERATE>>\n <<AVGSPEEDDAYS>>\n <<CAMPUSSTATE>>\n <<CAMPUSTYPE>>\n <<CAMPUSZIPCODE>>\n <<CAMPUSID>>\n <<CREATEDDATE>>\n <<CAMPUSCITYSTATEZIP>>\n <<CAMPUSCOMPLETEADDRESS>>\n <<CAMPUSEMAILADDRESS>>\n <<CAMPUSADDRESS>>\n <<CAMPUSNAME>>\n <<CAMPUSPHONENO>>\n <<CURRENTDATEWITHMONTHNAMEANDDASH>>\n <<CURRENTDATEWITHMONTHNAMEANDSLASH>>\n <<CURRENTDATEWITHMONTHNAMEANDSPACE>>\n <<CURRENTDATEWITHMONTHNUMBER>>\n <<CURRENTFORMATTEDDATE>>\n <<CURRENTUSERNAME>>\n <<CAUSENUMBER>>\n <<COURTACTIONVALIDITY>>\n <<CAMPUSSTARTTIME>>\n <<CONFERENCEROOMANDCAMPUSADDRESS>>\n <<CONFERENCELOCATION>>\n <<CONFERENCEROOM>>\n <<DATEOFBIRTH>>\n <<DAYSENROLLED>>\n <<DAYSPRESENT>>\n <<EXABSENCESCOUNT>>\n <<EXABSENCESCOUNTFROMINTDATE>>\n <<EXABSENCESCOUNTTILLLETTERPRINTED>>\n <<EXABSENCESCOUNTTILLLETTERPRINTEDFROMINTDATE>>\n <<EXABSENCESDATES>>\n <<EXABSENCESDATESFROMINTDATE>>\n <<EXABSENCESDATESTILLLETTERPRINTED>>\n <<EXABSENCESDATESTILLLETTERPRINTEDFROMINTDATE>>\n <<EXFULLABSENCESCOUNT>>\n <<EXFULLABSENCESCOUNTFROMINTDATE>>\n <<EXFULLABSENCESDATES>>\n <<EXFULLABSENCESDATESFROMINTDATE>>\n <<EXABSENCESCOUNTINWORDS>>\n <<EXFULLABSENCESDATESBULLETS>>\n <<EXABSENCESDATESBULLETS>>\n <<ENROLLMENTDATE>>\n <<FIRSTCONTACTNAME>>\n <<FIRSTCONTACTPHONE>>\n <<FIRSTWLDATE>>\n <<GRADEABSENCESSUMMARYENGLISH>>\n <<GUARDIANZIPCODE>>\n <<GRADE>>\n <<GUARDIANADDRESS>>\n <<GUARDIANDOB>>\n <<GUARDIANEMAIL>>\n <<GUARDIANGENDER-1>>\n <<GUARDIANNAME>>\n <<GUARDIANRELATIONSHIP>>\n <<GUARDIANHOMELANGUAGE>>\n <<HEARINGDATE>>\n <<LASTABSENCEDATE>>\n <<LASTSCHOOLYEAR>>\n <<LOSSEXCUSEDINSTRUCTIONSHOURS>>\n <<LOSSINSTRUCTIONSHOURS>>\n <<LOSSUNEXCUSEDINSTRUCTIONSHOURS>>\n <<LYABSENCESCOUNT>>\n <<LYEXCCOUNT>>\n <<LYGRADE>>\n <<LYLT30>>\n <<LYMT30>>\n <<LYSUSPENSIONCOUNT>>\n <<LYTARDYCOUNT>>\n <<LYUNEXCOUNT>>\n <<MONITERINGDATEEND>>\n <<MONITERINGDATESTART>>\n <<MODIFIEDDATE>>\n <<MONTHNAME>>\n <<NOTICEDATE>>\n <<PARENTEMAILADDRESS>>\n <<PARENTPHONENUMBER>>\n <<PARENTCITY>>\n <<PARENTCITYSTATEZIP>>\n <<PARENTCURRENTADDRESS>>\n <<PARENTORCURRENTADDRESS>>\n <<PARENTORCURRENTCITYSTATEZIP>>\n <<PARENTFIRSTANDLASTNAME>>\n <<PARENTFIRSTNAME>>\n <<PARENTFULLADDRESS>>\n <<PARENTFULLNAME>>\n <<PARENTNAME>>\n <<PARENTLASTANDFIRSTNAME>>\n <<PARENTLASTNAME>>\n <<PARENTMIDDLENAME>>\n <<PARENTPHONENO>>\n <<PARENTSTATE>>\n <<PARENTZIPCODE>>\n <<PRINCIPALNAME>>\n <<PICPHONE>>\n <<PICSPECIALIST>>\n <<REQUESTATTENDACEOFFICERNAME>>\n <<REQUESTFORMDATE>>\n <<STUDENTID>>\n <<STUDENTNAME>>\n <<STUDENTCURRENTADDRESS>>\n <<STUDENTSOCIALSECURITYNO>>\n <<STUDENTCURRENTCITYSTATEZIP>>\n <<STUDENTDATEOFBIRTH>>\n <<STUDENTFIRSTANDLASTNAME>>\n <<STUDENTFIRSTNAME>>\n <<STUDENTFULLNAME>>\n <<STUDENTGENDER>>\n <<STUDENTAGE>>\n <<STUDENTGRADE>>\n <<STUDENTLASTANDFIRSTNAME>>\n <<STUDENTLASTNAME>>\n <<STUDENTMIDDLENAME>>\n <<STUDENTNAMEANDID>>\n <<STUDENTPHONENUMBER>>\n <<STUDENTRACE>>\n <<SCHOOLDISTRICT>>\n <<STUDENTZIPCODE>>\n <<SARTDATE>>\n <<SCHOOLYEAR>>\n <<SECONDCONTACTNAME>>\n <<SECONDCONTACTPHONE>>\n <<SECONDNOTLETTERDATE>>\n <<SCHEDULEDDATE>>\n <<SCHEDULEDDATEWITHMONTHNAMEANDSPACE>>\n <<SCHEDULEDTIME>>\n <<SCHEDULEDMONTH>>\n <<TODAYSDATE>>\n <<USERNAME>>\n <<UNXABSENCESCOUNT>>\n <<UNXABSENCESCOUNTFROMINTDATE>>\n <<UNXABSENCESCOUNTTILLLETTERPRINTED>>\n <<UNXABSENCESCOUNTTILLLETTERPRINTEDFROMINTDATE>>\n <<UNXABSENCESDATES>>\n <<UNXABSENCESDATESFROMINTDATE>>\n <<UNXABSENCESDATESTILLLETTERPRINTED>>\n <<UNXABSENCESDATESTILLLETTERPRINTEDFROMINTDATE>>\n <<UNXFULLABSENCESCOUNT>>\n <<UNXFULLABSENCESCOUNTFROMINTDATE>>\n <<UNXFULLABSENCESDATES>>\n <<UNXFULLABSENCESDATESFROMINTDATE>>\n <<UNXFULLABSENCESDATESBULLETS>>\n <<UNXABSENCESDATESBULLETS>>",
  "category": "Documentation",
  "language": "Markdown",
  "icon": "BookOpen",
  "color": "bg-indigo-600",
  "tags": ["bookmarks", "resources", "placeholders", "attendance", "campus"],
  "lastUsed": "2025-08-21"
},
 {
  id: "admin-user-creation",
  title: "Admin User Creation Script",
  description: "Create administrative user accounts with full permissions and proper role assignments",
  content: `-- Admin User Creation

USE [TDPS] 
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
SELECT @AdminId = Id FROM AttplusUsers WHERE Email = 'attplusadmin@raaweek12.com'; 

-- Check if 'AttplusAdminID' key exists in TDPS_SETUP
IF EXISTS (SELECT 1 FROM TDPS_SETUP WHERE [Key] = 'AttplusAdminID')
BEGIN    
    -- Update the existing record    
    UPDATE TDPS_SETUP     
    SET [Value] = @AdminId     
    WHERE [Key] = 'AttplusAdminID';
END
ELSE
BEGIN    
    -- Insert a new record if it doesn't exist    
    INSERT INTO TDPS_SETUP ([Key], [Value])    
    VALUES ('AttplusAdminID', @AdminId);
END`,
  category: "User Management",
  language: "SQL",
  icon: "Shield",
  color: "bg-purple-600",
  tags: ["admin", "user-creation", "permissions", "roles", "system"],
  lastUsed: new Date("2023-12-30"),
},

  {
    id: "abdul-basit-apps",
    title: "Abdul Basit Applications List",
    description:
      "List of applications and tools commonly used by Abdul Basit for development and system administration",
    content: `# Abdul Basit's Essential Applications & Tools

## Development Environment
- Visual Studio 2022 Professional
- Visual Studio Code
- SQL Server Management Studio (SSMS)
- MongoDB Compass
- Postman API Testing Tool
- Git for Windows
- Node.js LTS
- Angular CLI

## Database Tools
- SQL Server 2019/2022
- MongoDB Community Server
- Redis Server
- MySQL Workbench
- phpMyAdmin

## System Administration
- IIS Manager
- Windows Admin Center
- PowerShell ISE
- Remote Desktop Manager
- PuTTY SSH Client
- WinSCP File Transfer
- 7-Zip Archive Manager

## Productivity Tools
- Microsoft Office 365
- Notepad++
- Beyond Compare
- TeamViewer
- Skype for Business

## Design & Documentation
- Draw.io (Diagrams)
- Snagit (Screenshots)
- Adobe Acrobat Reader
- Markdown Editor
- Confluence (Documentation)

## Communication
- Microsoft Teams
- Slack
- WhatsApp Desktop
- Zoom Client

## Utilities
- Windows Terminal
- PowerToys
- Everything Search
- CCleaner
- Malwarebytes
- Windows Defender`,
    category: "Tools & Apps",
    language: "Markdown",
    icon: "Wrench",
    color: "bg-teal-600",
    tags: ["applications", "tools", "development", "productivity", "utilities"],
    lastUsed: new Date("2023-12-29"),
  },
]

// ============================================
// EXPORTED DATA (FILTERED BY VISIBILITY)
// ============================================
export const snippetsData = allSnippetsData.filter(
  (snippet) => SNIPPET_VISIBILITY[snippet.id as keyof typeof SNIPPET_VISIBILITY],
)

// ============================================
// UTILITY FUNCTIONS
// ============================================
export const getSnippetById = (id: string) => {
  return snippetsData.find((snippet) => snippet.id === id)
}

export const getVisibleSnippetsCount = () => {
  return snippetsData.length
}

export const getTotalSnippetsCount = () => {
  return allSnippetsData.length
}

export const getHiddenSnippetsCount = () => {
  return allSnippetsData.length - snippetsData.length
}

// Export visibility config for admin purposes
export const getSnippetVisibilityConfig = () => {
  return SNIPPET_VISIBILITY
}
