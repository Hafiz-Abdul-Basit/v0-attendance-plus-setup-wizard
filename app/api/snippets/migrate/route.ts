import { NextResponse } from "next/server"
import { getDatabase, isMongoDBAvailable } from "@/lib/mongodb"
import type { Snippet } from "@/types/snippet"

// This endpoint will migrate ALL your existing snippets to MongoDB
export async function POST() {
  try {
    if (!isMongoDBAvailable()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const db = await getDatabase()
    const collection = db.collection<Snippet>("snippets")

    // Check if snippets already exist
    const existingCount = await collection.countDocuments()
    if (existingCount > 0) {
      return NextResponse.json({
        message: "Snippets already migrated",
        count: existingCount,
      })
    }

    // ALL your existing snippets with proper icons and categories
    const allSnippets = [
      // IIS & Web Server Category
      {
        id: "frontend-webconfig",
        title: "Frontend Web.config",
        description: "Angular routing configuration for IIS",
        category: "IIS & Web Server",
        icon: "Server",
        color: "bg-blue-500",
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
        language: "xml",
        tags: ["angular", "iis", "routing", "web.config"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "backend-webconfig",
        title: "Backend Web.config",
        description: "ASP.NET Core API configuration for IIS",
        category: "IIS & Web Server",
        icon: "Settings",
        color: "bg-green-500",
        content: `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath=".\\RK12.AttPlus.APIGateway.exe" 
                  stdoutLogEnabled="true" 
                  stdoutLogFile=".\\logs\\stdout" 
                  hostingModel="OutOfProcess" />
    </system.webServer>
  </location>
</configuration>
<!--ProjectGuid: 2089E993-1AEA-4A64-B581-DECAB43FCDCD-->`,
        language: "xml",
        tags: ["aspnet", "core", "api", "iis", "web.config"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "powershell-iis",
        title: "PowerShell IIS Commands",
        description: "Essential PowerShell commands for IIS management",
        category: "IIS & Web Server",
        icon: "Terminal",
        color: "bg-blue-600",
        content: `# Import IIS module
Import-Module WebAdministration

# List all websites
Get-Website

# List all application pools
Get-IISAppPool

# Restart application pool
Restart-WebAppPool -Name "YourAppPoolName"

# Reset IIS
iisreset /restart

# Check website status
Get-Website -Name "YourWebsiteName" | Select-Object Name, State, PhysicalPath`,
        language: "powershell",
        tags: ["powershell", "iis", "webadministration", "restart"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // MongoDB Category
      {
        id: "mongodb-replica",
        title: "MongoDB Replica Set",
        description: "Essential MongoDB shell commands",
        category: "MongoDB",
        icon: "Database",
        color: "bg-emerald-500",
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
        language: "bash",
        tags: ["mongodb", "replica", "shell", "commands"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "mongodb-backup-restore",
        title: "MongoDB Backup & Restore",
        description: "MongoDB backup and restore commands",
        category: "MongoDB",
        icon: "Database",
        color: "bg-green-600",
        content: `# Go to MongoDB tools path
# Eg: C:\\Program Files\\MongoDB\\Tools\\100\\bin

# Restore database
mongorestore --db databasename backupfilepath

# Backup database
mongodump --db databasename --out backupfilepath`,
        language: "bash",
        tags: ["mongodb", "backup", "restore", "mongodump", "mongorestore"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // SQL Server Category
      {
        id: "sql-server-common-queries",
        title: "SQL Server Common Queries",
        description: "Essential SQL commands for database operations",
        category: "SQL Server",
        icon: "Database",
        color: "bg-red-500",
        content: `-- Select Top N Rows
SELECT TOP 10 * FROM TableName;

-- Select with WHERE condition
SELECT * FROM TableName
WHERE ColumnName = 'Value';

-- Like with wildcards
SELECT * FROM TableName
WHERE ColumnName LIKE '%keyword%';

-- Add New Column
ALTER TABLE Employees ADD Email NVARCHAR(100);

-- Drop Column
ALTER TABLE Employees DROP COLUMN Email;

-- Update Row
UPDATE Employees
SET FirstName = 'Jane'
WHERE EmployeeID = 1;

-- Delete Row
DELETE FROM Employees
WHERE EmployeeID = 1;

-- Backup Database
BACKUP DATABASE YourDatabase
TO DISK = 'D:\\Backups\\YourDatabase.bak';

-- Restore Database
RESTORE DATABASE YourDatabase
FROM DISK = 'D:\\Backups\\YourDatabase.bak'
WITH REPLACE;`,
        language: "sql",
        tags: ["sql", "server", "queries", "backup", "restore"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tdps-truncate-tables",
        title: "TDPS Database Cleanup",
        description: "Truncate all TDPS database tables for fresh setup",
        category: "SQL Server",
        icon: "Database",
        color: "bg-red-600",
        content: `-- ============================================================================================================================= TDPS Database ==============================================================
-- Truncate all these tables
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
TRUNCATE TABLE dbo.CampusUser;
TRUNCATE TABLE ConcernReasons;
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
TRUNCATE TABLE dbo.STUDENT_ABSENT_DAYS_Bak;
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
TRUNCATE TABLE dbo.TDPS_Messaging_Campaign_Tags;
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
TRUNCATE TABLE [TDPS_StudentEnrolledDays];
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
TRUNCATE TABLE dbo.TI_Setup;`,
        language: "sql",
        tags: ["tdps", "database", "cleanup", "truncate", "tables"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "identitydb-truncate-tables",
        title: "IdentityDB Cleanup",
        description: "Clean IdentityDB tables for fresh user setup",
        category: "SQL Server",
        icon: "Database",
        color: "bg-purple-600",
        content: `-- ================================================================== IdentityDB Database =======================================================
-- Truncate all these tables
TRUNCATE TABLE AspNetRoleClaims;
TRUNCATE TABLE AspNetUserClaims;
TRUNCATE TABLE AspNetUserLogins;
TRUNCATE TABLE AspNetUserRoles;
TRUNCATE TABLE AspNetUsers;
TRUNCATE TABLE AspNetUserTokens;`,
        language: "sql",
        tags: ["identity", "database", "cleanup", "aspnet", "users"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "esign-truncate-tables",
        title: "eSign Database Cleanup",
        description: "Clean eSign database tables",
        category: "SQL Server",
        icon: "Database",
        color: "bg-orange-600",
        content: `-- =========================================================== Esign Database ===========================================================
-- Truncate all these tables
TRUNCATE TABLE DocumentStudentMapping;
TRUNCATE TABLE Reminder;
TRUNCATE TABLE RequestActionDetails;
TRUNCATE TABLE TDPS_Communications;
TRUNCATE TABLE Tracking_Log;
TRUNCATE TABLE ClickTracking;
TRUNCATE TABLE Participant;
TRUNCATE TABLE WorkflowPersistenceDetail;
TRUNCATE TABLE WorkflowPersistenceMaster;
TRUNCATE TABLE Conversation;
TRUNCATE TABLE ESignContractUpload;
TRUNCATE TABLE dbo.UtilityExceptionLog;`,
        language: "sql",
        tags: ["esign", "database", "cleanup", "documents", "workflow"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // User Management Category
      {
        id: "user-roles-setup",
        title: "Setup User Roles",
        description: "Initialize AspNetRoles for AttendancePlus system",
        category: "User Management",
        icon: "Users",
        color: "bg-purple-500",
        content: `--STEP #1 - ATTACH SCRIPT OF NETROLES
INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [Active], [CampusSelection]) 
VALUES (N'1', NULL, N'CampusOfficer', N'CAMPUSOFFICER', 1, N'2');

INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [Active], [CampusSelection]) 
VALUES (N'2', NULL, N'Radmin', N'RADMIN', 1, N'2');

INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [Active], [CampusSelection]) 
VALUES (N'3', NULL, N'CampusAttendanceOfficer', N'CAMPUSATTENDANCEOFFICER', 1, N'2');

INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [Active], [CampusSelection]) 
VALUES (N'4', NULL, N'Principal', N'PRINCIPAL', 1, N'2');

INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [Active], [CampusSelection]) 
VALUES (N'5', NULL, N'AssistantPrincipal', N'ASSISTANTPRINCIPAL', 1, N'2');

INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [Active], [CampusSelection]) 
VALUES (N'6', NULL, N'AttendanceOfficer', N'ATTENDANCEOFFICER', 1, N'2');

INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [Active], [CampusSelection]) 
VALUES (N'7', NULL, N'Director', N'DIRECTOR', 1, N'2');

INSERT [dbo].[AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName], [Active], [CampusSelection]) 
VALUES (N'8', NULL, N'SPUser', N'SPUSER', 1, N'2');

--DROP IF EXISTS
SELECT * INTO [TDPS].dbo.AttplusUserRoles FROM IdentityDB.dbo.AspNetRoles;`,
        language: "sql",
        tags: ["user", "roles", "aspnet", "identity", "setup"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "user-creation",
        title: "User Creation & Configuration",
        description: "Complete user setup with claims and campus assignments",
        category: "User Management",
        icon: "UserPlus",
        color: "bg-indigo-500",
        content: `--STEP #2 - CREATE NEW USER
DECLARE @NewId UNIQUEIDENTIFIER = NEWID();
DECLARE @userName nvarchar(MAX) = 'USER NAME HERE';
DECLARE @userEmail nvarchar(MAX) = 'USER EMAIL HERE';

IF NOT EXISTS (
  SELECT 1 FROM AspNetUsers
  WHERE UserName = @userName OR Email = @userEmail
)
BEGIN
  INSERT INTO AspNetUsers
  (Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed,
   PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
   TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount, FirstName, LastName)
  VALUES
  (@NewId, @userName, UPPER(@userName), @userEmail, UPPER(@userEmail), 1,
   NEWID(), NEWID(), NEWID(), '1234567890', 1,
   0, NULL, 0, 0, 'Attplus', 'Admin');
END`,
        language: "sql",
        tags: ["user", "creation", "aspnet", "identity"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "user-claims",
        title: "User Claims Configuration",
        description: "Configure user claims and role assignments",
        category: "User Management",
        icon: "Key",
        color: "bg-yellow-500",
        content: `--STEP #3 - CONFIGURE USER CLAIMS
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
VALUES (@userid, 1);`,
        language: "sql",
        tags: ["user", "claims", "roles", "identity", "configuration"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "campus-assignment",
        title: "Campus Assignment",
        description: "Assign users to campuses and configure filters",
        category: "User Management",
        icon: "Shield",
        color: "bg-orange-500",
        content: `--STEP #4 - CAMPUS ASSIGNMENT
-- Switch to TDPS Database
USE [TDPS];

DECLARE @userid NVARCHAR(200) = 'USER ID HERE';
DECLARE @Username VARCHAR(200) = 'USERNAME HERE';

-- Insert into CampusUser (PUT YOUR CAMPUS IDS)
INSERT INTO [dbo].[CampusUser] 
([CampusID], [UserId], [Email], [CreatedBy], [CreatedDate], [LastModifiedBy], [LastModifiedDate]) 
VALUES 
  (N'1', @userid, @Username, N'manual-sqlscript', GETDATE(), NULL, NULL),
  (N'2', @userid, @Username, N'manual-sqlscript', GETDATE(), NULL, NULL),
  (N'3', @userid, @Username, N'manual-sqlscript', GETDATE(), NULL, NULL),
  (N'4', @userid, @Username, N'manual-sqlscript', GETDATE(), NULL, NULL),
  (N'5', @userid, @Username, N'manual-sqlscript', GETDATE(), NULL, NULL),
  (N'6', @userid, @Username, N'manual-sqlscript', GETDATE(), NULL, NULL);

-- Insert into User Filter
INSERT INTO [dbo].[TDPS_ACTION_BOARD_USERFILTER] 
([UserLogin], [FilterCriteria], [student_grades], [student_lastName], [student_others])
VALUES (@userid, N'Grade IN (''1'', ''2'', ''3'', ''4'', ''5'', ''6'', ''7'', ''8'', ''9'', ''10'', ''11'', ''12'')', NULL, NULL, NULL);`,
        language: "sql",
        tags: ["campus", "assignment", "user", "filter", "tdps"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "database-sync",
        title: "Database Synchronization",
        description: "Synchronize user data between databases",
        category: "User Management",
        icon: "Users",
        color: "bg-teal-500",
        content: `--STEP #5 - DATABASE SYNCHRONIZATION
-- Create backup of users
SELECT * INTO [TDPS].dbo.AttplusUsers FROM IdentityDB.dbo.AspNetUsers;

-- Add additional columns
ALTER TABLE AttplusUsers
ADD ActionTakenBy NVARCHAR(MAX), 
  ActionTakenId NVARCHAR(max),
  RoleId NVARCHAR(450);

-- Update user information
UPDATE A  
SET A.FirstName = B.FirstName, 
  A.LastName = B.LastName,
  A.RoleId = R.RoleId  
FROM TDPS.dbo.AttplusUsers A  
INNER JOIN IdentityDB.dbo.AspNetUsers B ON A.Email = B.Email  
INNER JOIN IdentityDB.dbo.AspNetUserRoles R ON B.Id = R.UserId;

-- Configure filter table columns
ALTER TABLE TDPS_ACTION_BOARD_USERFILTER
ALTER COLUMN student_grades VARCHAR(MAX) NULL;

ALTER TABLE TDPS_ACTION_BOARD_USERFILTER
ALTER COLUMN student_lastName VARCHAR(MAX) NULL;

ALTER TABLE TDPS_ACTION_BOARD_USERFILTER
ALTER COLUMN student_others VARCHAR(MAX) NULL;

-- Verification queries
SELECT * FROM [TDPS].[dbo].[CampusUser] WHERE [UserId] = 'USER_ID_HERE';
SELECT * FROM [TDPS].[dbo].[TDPS_ACTION_BOARD_USERFILTER] WHERE [UserLogin] = 'USER_ID_HERE';
SELECT * FROM [IdentityDB].[dbo].[AspNetUserClaims] WHERE [UserId] = 'USER_ID_HERE';`,
        language: "sql",
        tags: ["database", "sync", "users", "backup", "verification"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "admin-user-creation",
        title: "Admin User Creation",
        description: "Create system administrator user",
        category: "User Management",
        icon: "Shield",
        color: "bg-red-600",
        content: `// Admin User Creation

use [TDPS] 
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
        language: "sql",
        tags: ["admin", "user", "system", "setup", "tdps"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Development Category
      {
        id: "angular-dev",
        title: "Angular Development",
        description: "Angular development commands with memory optimization",
        category: "Development",
        icon: "Code2",
        color: "bg-red-500",
        content: `# Serve with increased memory allocation
node --max_old_space_size=8192 ./node_modules/@angular/cli/bin/ng serve

# Alternative using npx
npx --node-options="--max_old_space_size=8192" ng serve

# For production build with increased memory
node --max_old_space_size=8192 ./node_modules/@angular/cli/bin/ng build --configuration production`,
        language: "bash",
        tags: ["angular", "development", "memory", "build", "serve"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "period-skipped-table-properties",
        title: "Period Skipped Table Properties",
        description: "C# properties for period skipped data structure",
        category: "Development",
        icon: "Code2",
        color: "bg-purple-600",
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
        language: "csharp",
        tags: ["csharp", "properties", "data", "structure", "attendance"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Documentation Category
      {
        id: "latest-bookmarks",
        title: "Latest Bookmarks",
        description: "Complete list of available template bookmarks",
        category: "Documentation",
        icon: "BookOpen",
        color: "bg-indigo-600",
        content: `<<ACTIVEISD>>
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
<<STUDENTSOCIALSECURITYNO>>
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
<<UNXABSENCESDATESBULLETS>>`,
        language: "text",
        tags: ["bookmarks", "templates", "variables", "documentation"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Tools & Apps Category
      {
        id: "abdul-basit-apps",
        title: "Abdul Basit Apps",
        description: "Collection of useful web applications and tools",
        category: "Tools & Apps",
        icon: "Wrench",
        color: "bg-teal-600",
        content: `Abdul Basit Apps - Useful Web Tools

🛠️ JSON Kit
**URL:** https://jsonkit.vercel.app/
**Description:** A comprehensive JSON toolkit for developers

📋 AttendancePlus Setup Guide
**URL:** https://attendance-plus-setup-guide.vercel.app/
**Description:** Complete installation wizard for AttendancePlus System

🕵️ Route JSON Detective
**URL:** https://route-json-detective-abdul.lovable.app/
**Description:** Advanced JSON analysis and debugging tool

🚀 MongoDB Compass Tools
**URL:** https://github.com/Hafiz-Abdul-Basit/Mongo-Tool
 
🚀 Aeries Data Extractor
**URL:** https://github.com/Hafiz-Abdul-Basit/Aeries-Data-Extractor`,
        language: "text",
        tags: ["tools", "apps", "web", "utilities", "json"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const result = await collection.insertMany(allSnippets)

    return NextResponse.json({
      message: "All snippets migrated successfully to MongoDB!",
      count: result.insertedCount,
      details:
        "Migration includes all categories: IIS & Web Server, MongoDB, SQL Server, User Management, Development, Documentation, and Tools & Apps with proper icons and organization.",
    })
  } catch (error) {
    console.error("Error migrating snippets:", error)
    return NextResponse.json({ error: "Failed to migrate snippets" }, { status: 500 })
  }
}
