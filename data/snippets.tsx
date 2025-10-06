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
  "user-roles-setup": true,
  "user-creation": true,
  "user-claims": true,
  "campus-assignment": true,
  "database-sync": true,
  "mongodb-backup-restore": true,
  "tdps-truncate-tables": true,
  "tdps-client-dependent-select": true,
  "latest-bookmarks": true,
  "admin-user-creation": true,
  "abdul-basit-apps": true,
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
    content: `#!/bin/bash

# MongoDB Replica Set Configuration Script

# Set variables
BACKUP_DIR="/backup/mongodb"
DB_NAME="attendanceplus"
DATE=$(date +%Y%m%d_%H%M%S)

# Start MongoDB instances
mongod --replSet rs0 --port 27017 --dbpath /data/db1 --fork --logpath /var/log/mongodb/mongod1.log
mongod --replSet rs0 --port 27018 --dbpath /data/db2 --fork --logpath /var/log/mongodb/mongod2.log
mongod --replSet rs0 --port 27019 --dbpath /data/db3 --fork --logpath /var/log/mongodb/mongod3.log

# Initialize replica set
mongo --port 27017 --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'localhost:27017' },
    { _id: 1, host: 'localhost:27018' },
    { _id: 2, host: 'localhost:27019' }
  ]
})
"

# Check replica set status
mongo --port 27017 --eval "rs.status()"`,
    category: "MongoDB",
    language: "Shell",
    icon: "Database",
    color: "bg-green-600",
    tags: ["mongodb", "replica-set", "high-availability", "clustering"],
    lastUsed: new Date("2024-01-13"),
  },
  {
    id: "angular-dev-setup",
    title: "Angular Development Setup",
    description: "Complete Angular development environment setup with all necessary dependencies",
    content: `#!/bin/bash

# Angular Development Environment Setup

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Angular CLI globally
npm install -g @angular/cli@latest

# Create new Angular project
ng new my-angular-app --routing --style=scss

# Navigate to project directory
cd my-angular-app

# Install additional dependencies
npm install bootstrap@latest
npm install @angular/material @angular/cdk @angular/animations
npm install rxjs@latest

# Install development dependencies
npm install --save-dev @types/node
npm install --save-dev typescript@latest

# Start development server
ng serve --open`,
    category: "Development",
    language: "Shell",
    icon: "Code2",
    color: "bg-orange-600",
    tags: ["angular", "setup", "development", "cli", "dependencies"],
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
    content: `-- Create New User Account
DECLARE @UserId NVARCHAR(450) = NEWID();
DECLARE @Email NVARCHAR(256) = 'newuser@example.com';
DECLARE @UserName NVARCHAR(256) = 'newuser@example.com';

INSERT INTO AspNetUsers (
    Id, UserName, NormalizedUserName, Email, NormalizedEmail,
    EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp,
    PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount
)
VALUES (
    @UserId, @UserName, UPPER(@UserName), @Email, UPPER(@Email),
    1, 'AQAAAAEAACcQAAAAEExample...', NEWID(), NEWID(),
    0, 0, 1, 0
);

-- Add User Claims
INSERT INTO AspNetUserClaims (UserId, ClaimType, ClaimValue)
VALUES 
    (@UserId, 'FirstName', 'John'),
    (@UserId, 'LastName', 'Doe'),
    (@UserId, 'Department', 'IT');`,
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
    id: "mongodb-backup-restore",
    title: "MongoDB Backup & Restore",
    description: "Complete MongoDB backup and restore operations with compression and scheduling",
    content: `#!/bin/bash

# MongoDB Backup Script
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="attendanceplus"

# Create backup directory
mkdir -p $BACKUP_DIR

# Full database backup with compression
mongodump --db $DB_NAME --gzip --archive=$BACKUP_DIR/\${DB_NAME}_\${DATE}.gz

# Backup specific collection
mongodump --db $DB_NAME --collection users --gzip --archive=$BACKUP_DIR/users_\${DATE}.gz

# Restore from backup
mongorestore --db $DB_NAME --gzip --archive=$BACKUP_DIR/\${DB_NAME}_\${DATE}.gz

# Restore to different database
mongorestore --db \${DB_NAME}_restored --gzip --archive=$BACKUP_DIR/\${DB_NAME}_\${DATE}.gz

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: \${DB_NAME}_\${DATE}.gz"`,
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
    id: "latest-bookmarks",
    title: "Development Bookmarks",
    description: "Essential development resources and documentation links for quick reference",
    content: `# Development Bookmarks & Resources

## Documentation
- ASP.NET Core: https://docs.microsoft.com/en-us/aspnet/core/
- Angular: https://angular.io/docs
- MongoDB: https://docs.mongodb.com/
- SQL Server: https://docs.microsoft.com/en-us/sql/

## Tools & Utilities
- Postman: https://www.postman.com/
- MongoDB Compass: https://www.mongodb.com/products/compass
- SQL Server Management Studio: https://docs.microsoft.com/en-us/sql/ssms/
- Visual Studio Code: https://code.visualstudio.com/

## Libraries & Frameworks
- Bootstrap: https://getbootstrap.com/
- jQuery: https://jquery.com/
- Chart.js: https://www.chartjs.org/
- Moment.js: https://momentjs.com/

## Learning Resources
- Stack Overflow: https://stackoverflow.com/
- GitHub: https://github.com/
- CodePen: https://codepen.io/
- MDN Web Docs: https://developer.mozilla.org/

## Deployment & Hosting
- IIS Configuration: https://docs.microsoft.com/en-us/iis/
- Azure: https://azure.microsoft.com/
- Docker: https://docs.docker.com/
- Nginx: https://nginx.org/en/docs/`,
    category: "Documentation",
    language: "Markdown",
    icon: "BookOpen",
    color: "bg-indigo-600",
    tags: ["bookmarks", "resources", "documentation", "tools", "learning"],
    lastUsed: new Date("2023-12-31"),
  },
  {
    id: "admin-user-creation",
    title: "Admin User Creation Script",
    description: "Create administrative user accounts with full permissions and proper role assignments",
    content: `-- Create Admin User with Full Permissions
DECLARE @AdminUserId NVARCHAR(450) = NEWID();
DECLARE @AdminEmail NVARCHAR(256) = 'admin@attendanceplus.com';
DECLARE @AdminUserName NVARCHAR(256) = 'admin@attendanceplus.com';

-- Insert Admin User
INSERT INTO AspNetUsers (
    Id, UserName, NormalizedUserName, Email, NormalizedEmail,
    EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp,
    PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount
)
VALUES (
    @AdminUserId, @AdminUserName, UPPER(@AdminUserName), @AdminEmail, UPPER(@AdminEmail),
    1, 'AQAAAAEAACcQAAAAEAdminHashedPassword...', NEWID(), NEWID(),
    0, 0, 0, 0
);

-- Assign Admin Role
INSERT INTO AspNetUserRoles (UserId, RoleId)
SELECT @AdminUserId, Id FROM AspNetRoles WHERE Name = 'SuperAdmin';

-- Add Admin Claims
INSERT INTO AspNetUserClaims (UserId, ClaimType, ClaimValue)
VALUES 
    (@AdminUserId, 'FirstName', 'System'),
    (@AdminUserId, 'LastName', 'Administrator'),
    (@AdminUserId, 'CampusId', 'ALL'),
    (@AdminUserId, 'Department', 'IT'),
    (@AdminUserId, 'CanManageUsers', 'true'),
    (@AdminUserId, 'CanManageSystem', 'true');

-- Verify Admin User Creation
SELECT u.Email, r.Name as Role, uc.ClaimType, uc.ClaimValue
FROM AspNetUsers u
LEFT JOIN AspNetUserRoles ur ON u.Id = ur.UserId
LEFT JOIN AspNetRoles r ON ur.RoleId = r.Id
LEFT JOIN AspNetUserClaims uc ON u.Id = uc.UserId
WHERE u.Email = @AdminEmail;`,
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
