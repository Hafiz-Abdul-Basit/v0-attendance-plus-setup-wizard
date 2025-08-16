"use client"

import React from "react"
import type { ReactElement } from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Code2,
  Database,
  Settings,
  Terminal,
  FileText,
  Users,
  Shield,
  UserPlus,
  Key,
  BookOpen,
  Search,
  X,
  Copy,
  Folder,
  FolderOpen,
  Server,
  Wrench,
  Star,
  Download,
  Heart,
  Clock,
  Filter,
  Grid3X3,
  List,
  Tag,
  Zap,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Icon mapping for dynamic icons
const iconMap: Record<string, ReactElement> = {
  Code2,
  Database,
  Settings,
  Terminal,
  FileText,
  Users,
  Shield,
  UserPlus,
  Key,
  BookOpen,
  Server,
  Wrench,
  Star,
  Zap,
}

// Folder definitions
const folders = {
  "IIS & Web Server": {
    name: "IIS & Web Server",
    icon: "Server",
    color: "bg-blue-600",
    description: "Web server configuration and management",
  },
  MongoDB: {
    name: "MongoDB",
    icon: "Database",
    color: "bg-green-600",
    description: "MongoDB database operations and configuration",
  },
  "SQL Server": {
    name: "SQL Server",
    icon: "Database",
    color: "bg-red-600",
    description: "SQL Server queries and database management",
  },
  "User Management": {
    name: "User Management",
    icon: "Users",
    color: "bg-purple-600",
    description: "User creation, roles, and security configuration",
  },
  Development: {
    name: "Development",
    icon: "Code2",
    color: "bg-orange-600",
    description: "Development tools and configurations",
  },
  Documentation: {
    name: "Documentation",
    icon: "BookOpen",
    color: "bg-indigo-600",
    description: "Reference materials and documentation",
  },
  "Tools & Apps": {
    name: "Tools & Apps",
    icon: "Wrench",
    color: "bg-teal-600",
    description: "Useful applications and utilities",
  },
  "Quick Scripts": {
    name: "Quick Scripts",
    icon: "Zap",
    color: "bg-yellow-600",
    description: "Fast utility scripts and one-liners",
  },
}

// All your previous snippets + new mock snippets
const staticSnippets = [
  // IIS & Web Server Category
  {
    id: "frontend-webconfig",
    title: "Frontend Web.config",
    description: "Angular routing configuration for IIS",
    category: "IIS & Web Server",
    icon: "FileText",
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
    isFavorite: false,
    lastUsed: new Date("2024-01-15"),
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
    isFavorite: true,
    lastUsed: new Date("2024-01-20"),
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
    isFavorite: false,
    lastUsed: new Date("2024-01-10"),
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
    isFavorite: true,
    lastUsed: new Date("2024-01-18"),
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
    isFavorite: false,
    lastUsed: new Date("2024-01-12"),
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
    isFavorite: true,
    lastUsed: new Date("2024-01-22"),
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
TRUNCATE TABLE Alerts_Devices;
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
TRUNCATE TABLE dbo.EmailToStudent;`,
    language: "sql",
    tags: ["tdps", "database", "cleanup", "truncate", "tables"],
    isFavorite: false,
    lastUsed: new Date("2024-01-08"),
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
    isFavorite: false,
    lastUsed: new Date("2024-01-05"),
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
    isFavorite: true,
    lastUsed: new Date("2024-01-25"),
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
    isFavorite: false,
    lastUsed: new Date("2024-01-14"),
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
END`,
    language: "sql",
    tags: ["admin", "user", "system", "setup", "tdps"],
    isFavorite: false,
    lastUsed: new Date("2024-01-03"),
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
    isFavorite: true,
    lastUsed: new Date("2024-01-21"),
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
    isFavorite: false,
    lastUsed: new Date("2024-01-07"),
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
<<CAMPUSPHONENO>>`,
    language: "text",
    tags: ["bookmarks", "templates", "variables", "documentation"],
    isFavorite: false,
    lastUsed: new Date("2024-01-11"),
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
    isFavorite: true,
    lastUsed: new Date("2024-01-19"),
  },

  // NEW MOCK SNIPPETS
  {
    id: "react-hooks-cheatsheet",
    title: "React Hooks Cheatsheet",
    description: "Essential React hooks with examples",
    category: "Development",
    icon: "Code2",
    color: "bg-blue-500",
    content: `// useState Hook
const [count, setCount] = useState(0);
const [user, setUser] = useState({ name: '', email: '' });

// useEffect Hook
useEffect(() => {
  // Effect logic here
  return () => {
    // Cleanup logic here
  };
}, [dependency]);

// useContext Hook
const theme = useContext(ThemeContext);

// useReducer Hook
const [state, dispatch] = useReducer(reducer, initialState);

// useMemo Hook
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// useCallback Hook
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// Custom Hook Example
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}`,
    language: "javascript",
    tags: ["react", "hooks", "javascript", "frontend"],
    isFavorite: true,
    lastUsed: new Date("2024-01-23"),
  },
  {
    id: "css-flexbox-grid",
    title: "CSS Flexbox & Grid Layouts",
    description: "Modern CSS layout techniques",
    category: "Development",
    icon: "Code2",
    color: "bg-pink-500",
    content: `/* Flexbox Container */
.flex-container {
  display: flex;
  justify-content: center; /* horizontal alignment */
  align-items: center; /* vertical alignment */
  flex-direction: row; /* row | column */
  flex-wrap: wrap; /* wrap | nowrap */
  gap: 1rem;
}

/* Flexbox Items */
.flex-item {
  flex: 1; /* grow, shrink, basis */
  flex-grow: 1;
  flex-shrink: 0;
  flex-basis: auto;
}

/* CSS Grid Container */
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 1rem;
  grid-template-areas: 
    "header header header"
    "sidebar main main"
    "footer footer footer";
}

/* Grid Items */
.grid-header { grid-area: header; }
.grid-sidebar { grid-area: sidebar; }
.grid-main { grid-area: main; }
.grid-footer { grid-area: footer; }

/* Responsive Grid */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "header"
      "main"
      "sidebar"
      "footer";
  }
}`,
    language: "css",
    tags: ["css", "flexbox", "grid", "layout", "responsive"],
    isFavorite: false,
    lastUsed: new Date("2024-01-16"),
  },
  {
    id: "git-commands-cheatsheet",
    title: "Git Commands Cheatsheet",
    description: "Most used Git commands for daily workflow",
    category: "Quick Scripts",
    icon: "Zap",
    color: "bg-orange-500",
    content: `# Basic Git Commands
git init                    # Initialize repository
git clone <url>            # Clone repository
git status                 # Check status
git add .                  # Stage all changes
git add <file>             # Stage specific file
git commit -m "message"    # Commit changes
git push origin main       # Push to remote
git pull origin main       # Pull from remote

# Branch Management
git branch                 # List branches
git branch <name>          # Create branch
git checkout <branch>      # Switch branch
git checkout -b <branch>   # Create and switch
git merge <branch>         # Merge branch
git branch -d <branch>     # Delete branch

# Undo Changes
git reset HEAD~1           # Undo last commit (keep changes)
git reset --hard HEAD~1    # Undo last commit (discard changes)
git checkout -- <file>     # Discard file changes
git revert <commit>        # Revert commit

# Stash Changes
git stash                  # Stash changes
git stash pop              # Apply stashed changes
git stash list             # List stashes
git stash drop             # Delete stash

# View History
git log                    # View commit history
git log --oneline          # Compact history
git diff                   # View changes
git show <commit>          # Show commit details`,
    language: "bash",
    tags: ["git", "version-control", "commands", "workflow"],
    isFavorite: true,
    lastUsed: new Date("2024-01-24"),
  },
  {
    id: "docker-compose-template",
    title: "Docker Compose Template",
    description: "Full-stack application with database",
    category: "Development",
    icon: "Settings",
    color: "bg-blue-600",
    content: `version: '3.8'

services:
  # Frontend Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@postgres:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  # PostgreSQL Database
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:`,
    language: "yaml",
    tags: ["docker", "compose", "containers", "deployment"],
    isFavorite: false,
    lastUsed: new Date("2024-01-13"),
  },
  {
    id: "javascript-array-methods",
    title: "JavaScript Array Methods",
    description: "Comprehensive guide to array manipulation",
    category: "Quick Scripts",
    icon: "Zap",
    color: "bg-yellow-500",
    content: `const numbers = [1, 2, 3, 4, 5];
const users = [
  { id: 1, name: 'John', age: 30 },
  { id: 2, name: 'Jane', age: 25 },
  { id: 3, name: 'Bob', age: 35 }
];

// MAP - Transform each element
const doubled = numbers.map(n => n * 2);
const names = users.map(user => user.name);

// FILTER - Select elements that match condition
const evens = numbers.filter(n => n % 2 === 0);
const adults = users.filter(user => user.age >= 30);

// REDUCE - Reduce array to single value
const sum = numbers.reduce((acc, n) => acc + n, 0);
const totalAge = users.reduce((acc, user) => acc + user.age, 0);

// FIND - Find first matching element
const user = users.find(u => u.id === 2);
const firstAdult = users.find(u => u.age >= 30);

// SOME & EVERY - Test conditions
const hasAdults = users.some(u => u.age >= 30);
const allAdults = users.every(u => u.age >= 18);

// SORT - Sort array
const sortedByAge = users.sort((a, b) => a.age - b.age);
const sortedByName = users.sort((a, b) => a.name.localeCompare(b.name));

// INCLUDES & INDEXOF
const hasThree = numbers.includes(3);
const indexOfThree = numbers.indexOf(3);

// SLICE & SPLICE
const firstThree = numbers.slice(0, 3);
const removed = numbers.splice(1, 2); // Remove 2 elements starting at index 1

// FLAT & FLATMAP
const nested = [[1, 2], [3, 4], [5]];
const flattened = nested.flat();
const flatMapped = nested.flatMap(arr => arr.map(n => n * 2));`,
    language: "javascript",
    tags: ["javascript", "arrays", "methods", "functional"],
    isFavorite: true,
    lastUsed: new Date("2024-01-26"),
  },
  {
    id: "tailwind-utility-classes",
    title: "Tailwind CSS Utility Classes",
    description: "Most commonly used Tailwind classes",
    category: "Quick Scripts",
    icon: "Terminal",
    color: "bg-cyan-500",
    content: `<!-- Layout & Spacing -->
<div class="container mx-auto px-4">
  <div class="flex justify-between items-center">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="p-4 m-2 space-y-4">
        <!-- Content -->
      </div>
    </div>
  </div>
</div>

<!-- Typography -->
<h1 class="text-4xl font-bold text-gray-900 leading-tight">
<h2 class="text-2xl font-semibold text-gray-800">
<p class="text-base text-gray-600 leading-relaxed">
<span class="text-sm font-medium text-blue-600 uppercase tracking-wide">

<!-- Colors & Backgrounds -->
<div class="bg-white text-gray-900">
<div class="bg-blue-500 text-white">
<div class="bg-gradient-to-r from-purple-400 to-pink-400">
<div class="border border-gray-200 rounded-lg shadow-sm">

<!-- Responsive Design -->
<div class="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5">
<div class="hidden sm:block md:hidden lg:block">
<div class="text-sm sm:text-base md:text-lg lg:text-xl">

<!-- Flexbox & Grid -->
<div class="flex flex-col sm:flex-row justify-center items-center">
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
<div class="flex-1 flex-shrink-0 flex-grow">

<!-- States & Interactions -->
<button class="hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 active:bg-blue-700 disabled:opacity-50">
<div class="group hover:shadow-lg transition-all duration-300">
  <div class="group-hover:scale-105 transform">

<!-- Positioning -->
<div class="relative">
  <div class="absolute top-0 right-0 -mt-2 -mr-2">
    <div class="fixed inset-0 z-50">
      <div class="sticky top-0 z-10">`,
    language: "html",
    tags: ["tailwind", "css", "utility", "classes", "responsive"],
    isFavorite: false,
    lastUsed: new Date("2024-01-17"),
  },
  {
    id: "api-error-handling",
    title: "API Error Handling Patterns",
    description: "Robust error handling for API calls",
    category: "Development",
    icon: "Shield",
    color: "bg-red-500",
    content: `// Async/Await with Try-Catch
async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Fetch error:', error);
    return { success: false, error: error.message };
  }
}

// Promise-based Error Handling
function fetchWithRetry(url, options = {}, retries = 3) {
  return fetch(url, options)
    .then(response => {
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      return response.json();
    })
    .catch(error => {
      if (retries > 0) {
        console.log(\`Retrying... (\${retries} attempts left)\`);
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(fetchWithRetry(url, options, retries - 1));
          }, 1000);
        });
      }
      throw error;
    });
}

// Custom Error Classes
class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Error Handler Utility
function handleAPIError(error) {
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        // Redirect to login
        window.location.href = '/login';
        break;
      case 403:
        showNotification('Access denied', 'error');
        break;
      case 404:
        showNotification('Resource not found', 'error');
        break;
      case 500:
        showNotification('Server error. Please try again later.', 'error');
        break;
      default:
        showNotification(error.message, 'error');
    }
  } else if (error instanceof NetworkError) {
    showNotification('Network error. Check your connection.', 'error');
  } else {
    showNotification('An unexpected error occurred.', 'error');
  }
}`,
    language: "javascript",
    tags: ["javascript", "api", "error-handling", "async"],
    isFavorite: false,
    lastUsed: new Date("2024-01-09"),
  },
  {
    id: "regex-patterns",
    title: "Common Regex Patterns",
    description: "Useful regular expressions for validation",
    category: "Quick Scripts",
    icon: "Zap",
    color: "bg-green-500",
    content: `// Email Validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = emailRegex.test('user@example.com');

// Phone Number (US Format)
const phoneRegex = /^$$\d{3}$$\s\d{3}-\d{4}$/;
const isValidPhone = phoneRegex.test('(123) 456-7890');

// Password Strength (8+ chars, uppercase, lowercase, number, special)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const isStrongPassword = passwordRegex.test('MyPass123!');

// URL Validation
const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
const isValidUrl = urlRegex.test('https://example.com');

// Credit Card Number (removes spaces/dashes)
const creditCardRegex = /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/;
const isValidCard = creditCardRegex.test('1234 5678 9012 3456');

// Date Format (MM/DD/YYYY)
const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
const isValidDate = dateRegex.test('12/31/2023');

// Hex Color Code
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const isValidHex = hexColorRegex.test('#FF5733');

// Username (alphanumeric, underscore, 3-16 chars)
const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
const isValidUsername = usernameRegex.test('user_123');

// IP Address (IPv4)
const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const isValidIP = ipRegex.test('192.168.1.1');

// Social Security Number
const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
const isValidSSN = ssnRegex.test('123-45-6789');

// Extract Numbers from String
const numberRegex = /\d+/g;
const numbers = 'Price: $25.99, Quantity: 3'.match(numberRegex);

// Remove HTML Tags
const htmlRegex = /<[^>]*>/g;
const cleanText = '<p>Hello <strong>World</strong></p>'.replace(htmlRegex, '');`,
    language: "javascript",
    tags: ["regex", "validation", "patterns", "javascript"],
    isFavorite: true,
    lastUsed: new Date("2024-01-27"),
  },
  {
    id: "npm-package-scripts",
    title: "NPM Package.json Scripts",
    description: "Useful npm scripts for development workflow",
    category: "Quick Scripts",
    icon: "Terminal",
    color: "bg-purple-500",
    content: `{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    // Development
    "dev": "next dev",
    "start": "next start",
    "build": "next build",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    
    // Testing
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    
    // Database
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    
    // Deployment
    "deploy": "npm run build && npm run deploy:vercel",
    "deploy:vercel": "vercel --prod",
    "deploy:netlify": "netlify deploy --prod",
    
    // Code Quality
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "pre-commit": "lint-staged",
    "prepare": "husky install",
    
    // Utilities
    "clean": "rm -rf .next dist build",
    "clean:deps": "rm -rf node_modules package-lock.json && npm install",
    "analyze": "cross-env ANALYZE=true npm run build",
    "bundle-analyzer": "npx @next/bundle-analyzer",
    
    // Docker
    "docker:build": "docker build -t my-app .",
    "docker:run": "docker run -p 3000:3000 my-app",
    "docker:compose": "docker-compose up -d",
    
    // Git Hooks
    "postinstall": "husky install",
    "pre-push": "npm run type-check && npm run test",
    
    // Environment Management
    "env:local": "cp .env.example .env.local",
    "env:staging": "cp .env.staging .env.local",
    "env:production": "cp .env.production .env.local"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}`,
    language: "json",
    tags: ["npm", "scripts", "package.json", "workflow"],
    isFavorite: false,
    lastUsed: new Date("2024-01-06"),
  },
  {
    id: "environment-variables-guide",
    title: "Environment Variables Best Practices",
    description: "Managing environment variables across different platforms",
    category: "Documentation",
    icon: "Key",
    color: "bg-yellow-600",
    content: `# Environment Variables Guide

## Local Development (.env.local)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

## Production (.env.production)
NEXT_PUBLIC_APP_URL=https://myapp.com
NEXT_PUBLIC_API_URL=https://api.myapp.com
DATABASE_URL=postgresql://user:password@prod-db:5432/myapp
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=production-jwt-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

## Vercel Environment Variables
# Add these in Vercel Dashboard > Settings > Environment Variables
DATABASE_URL (Production, Preview, Development)
JWT_SECRET (Production, Preview, Development)
STRIPE_SECRET_KEY (Production, Preview)
NEXT_PUBLIC_APP_URL (Production, Preview, Development)

## Docker Environment Variables
# docker-compose.yml
environment:
  - NODE_ENV=production
  - DATABASE_URL=\${DATABASE_URL}
  - JWT_SECRET=\${JWT_SECRET}

# .env file for Docker
NODE_ENV=production
DATABASE_URL=postgresql://user:password@postgres:5432/myapp
JWT_SECRET=docker-jwt-secret

## GitHub Actions Secrets
# Add these in GitHub > Settings > Secrets and Variables > Actions
DATABASE_URL
JWT_SECRET
VERCEL_TOKEN
STRIPE_SECRET_KEY

## Best Practices
1. Never commit .env files to version control
2. Use NEXT_PUBLIC_ prefix for client-side variables
3. Keep sensitive data in server-side variables only
4. Use different values for different environments
5. Document all required environment variables
6. Use strong, unique secrets for production
7. Rotate secrets regularly
8. Use a secrets management service for production

## Loading Environment Variables in Code
// Next.js automatically loads .env files
const dbUrl = process.env.DATABASE_URL;
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;

// Node.js with dotenv
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;

// Validation
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}`,
    language: "text",
    tags: ["environment", "variables", "security", "deployment"],
    isFavorite: false,
    lastUsed: new Date("2024-01-04"),
  },
]

type SortOption = "name" | "category" | "recent" | "favorites"
type ViewMode = "grid" | "list"

/** Props from the parent wizard */
interface SnippetsContentProps {
  filteredSnippetId?: string | null
  onClearFilter?: () => void
}

export function SnippetsContent({ filteredSnippetId, onClearFilter }: SnippetsContentProps) {
  // State management
  const [selectedSnippetCode, setSelectedSnippetCode] = useState<string | null>(null)
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false)
  const [currentSnippet, setCurrentSnippet] = useState<any>(null)
  const [localSearchQuery, setLocalSearchQuery] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<SortOption>("recent")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("snippet-favorites")
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: Set<string>) => {
    localStorage.setItem("snippet-favorites", JSON.stringify([...newFavorites]))
    setFavorites(newFavorites)
  }

  /** ------------------------------------------------------------
   *  Helpers
   *  ------------------------------------------------------------ */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!", {
      style: { background: "#10b981", color: "white", border: "none" },
    })
  }

  const toggleFavorite = (snippetId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(snippetId)) {
      newFavorites.delete(snippetId)
      toast.success("Removed from favorites")
    } else {
      newFavorites.add(snippetId)
      toast.success("Added to favorites")
    }
    saveFavorites(newFavorites)
  }

  const exportSnippets = () => {
    const dataStr = JSON.stringify(staticSnippets, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "snippets-export.json"
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Snippets exported successfully!")
  }

  /** Get filtered and sorted snippets */
  const getFilteredSnippets = () => {
    let filtered = staticSnippets

    // Filter by parent-supplied snippet ID first
    if (filteredSnippetId) {
      return filtered.filter((s) => s.id === filteredSnippetId)
    }

    // Filter by selected folder
    if (selectedFolder) {
      filtered = filtered.filter((s) => s.category === selectedFolder)
    }

    // Filter by search query
    if (localSearchQuery.trim()) {
      const query = localSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query) ||
          s.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Sort snippets
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title)
        case "category":
          return a.category.localeCompare(b.category)
        case "recent":
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        case "favorites":
          const aFav = favorites.has(a.id) ? 1 : 0
          const bFav = favorites.has(b.id) ? 1 : 0
          return bFav - aFav
        default:
          return 0
      }
    })

    return filtered
  }

  const filteredSnippets = getFilteredSnippets()

  /** Load snippet content and open modal */
  const handleSnippetClick = (snippet: any) => {
    setCurrentSnippet(snippet)
    setSelectedSnippetCode(snippet.content)
    setIsSnippetModalOpen(true)

    // Update last used date
    snippet.lastUsed = new Date()
  }

  // Get folder statistics
  const getFolderStats = (folderName: string) => {
    return staticSnippets.filter((s) => s.category === folderName).length
  }

  // Handle search with history
  const handleSearch = (query: string) => {
    setLocalSearchQuery(query)
    if (query.trim() && !searchHistory.includes(query.trim())) {
      const newHistory = [query.trim(), ...searchHistory.slice(0, 4)]
      setSearchHistory(newHistory)
      localStorage.setItem("search-history", JSON.stringify(newHistory))
    }
  }

  // Load search history
  useEffect(() => {
    const savedHistory = localStorage.getItem("search-history")
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
  }, [])

  /** ------------------------------------------------------------
   *  Render
   *  ------------------------------------------------------------ */
  return (
    <div>
      {/* Top Search Bar */}
      <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-purple-900 mb-1">Search Code Snippets</h3>
            <p className="text-sm text-purple-700">
              Find snippets by title, description, content, or tags. Use keyboard shortcuts for quick access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportSnippets}
              className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
            >
              <Download className="w-4 h-4" />
              Export All
            </Button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
          <Input
            value={localSearchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search snippets by title, description, content, or tags..."
            className="pl-12 pr-12 py-3 text-base border-2 border-purple-200 focus:border-purple-400 focus:ring-purple-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          />
          {localSearchQuery && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocalSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-purple-100 text-purple-500"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && !localSearchQuery && (
          <div className="mt-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-600 font-medium">Recent:</span>
            <div className="flex gap-2 flex-wrap">
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => setLocalSearchQuery(term)}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs hover:bg-purple-200 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="recent">Recently Used</option>
              <option value="name">Name A-Z</option>
              <option value="category">Category</option>
              <option value="favorites">Favorites First</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          {filteredSnippetId
            ? `Showing filtered snippet`
            : selectedFolder
              ? `${filteredSnippets.length} snippet${filteredSnippets.length !== 1 ? "s" : ""} in ${selectedFolder}`
              : localSearchQuery.trim()
                ? `${filteredSnippets.length} snippet${filteredSnippets.length !== 1 ? "s" : ""} found`
                : `${staticSnippets.length} total snippets`}
        </div>
      </div>

      {/* Folder Navigation */}
      {!filteredSnippetId && !localSearchQuery && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Folder className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Browse by Category</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(folders).map(([folderName, folderInfo]) => {
              const FolderIcon = iconMap[folderInfo.icon] || FileText
              const count = getFolderStats(folderName)
              const isSelected = selectedFolder === folderName

              return (
                <button
                  key={folderName}
                  onClick={() => setSelectedFolder(isSelected ? null : folderName)}
                  className={`group relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? "border-purple-300 bg-purple-50 shadow-lg scale-[1.02]"
                      : "border-gray-200 hover:border-purple-200 hover:bg-purple-25 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-10 h-10 rounded-lg ${folderInfo.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}
                    >
                      {isSelected ? <FolderOpen className="w-5 h-5" /> : <FolderIcon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-semibold transition-colors ${isSelected ? "text-purple-900" : "text-gray-900 group-hover:text-purple-700"}`}
                      >
                        {folderName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            isSelected ? "bg-purple-200 text-purple-800" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {count} snippet{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{folderInfo.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {(selectedFolder || localSearchQuery) && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {selectedFolder && (
            <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              <Tag className="w-3 h-3" />
              {selectedFolder}
              <button onClick={() => setSelectedFolder(null)} className="ml-1 hover:bg-purple-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {localSearchQuery && (
            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <Search className="w-3 h-3" />"{localSearchQuery}"
              <button onClick={() => setLocalSearchQuery("")} className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filteredSnippetId && onClearFilter && (
            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <Filter className="w-3 h-3" />
              Filtered View
              <button onClick={onClearFilter} className="ml-1 hover:bg-green-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Snippets Display */}
      {filteredSnippets.length ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredSnippets.map((snip) => {
            const Icon = iconMap[snip.icon] || FileText
            const isFavorite = favorites.has(snip.id)

            if (viewMode === "list") {
              return (
                <div
                  key={snip.id}
                  className="group relative cursor-pointer rounded-xl border-2 border-gray-200 hover:border-purple-300 bg-white p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-4"
                  onClick={() => handleSnippetClick(snip)}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${snip.color} text-white shadow-md group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {snip.title}
                      </h3>
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 flex-shrink-0">
                        {snip.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">{snip.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">{snip.language}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">{new Date(snip.lastUsed).toLocaleDateString()}</span>
                      <div className="flex gap-1 ml-auto">
                        {snip.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(snip.id)
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        isFavorite
                          ? "text-red-500 hover:bg-red-50"
                          : "text-gray-400 hover:bg-gray-50 hover:text-red-500"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                    </button>
                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  </div>
                </div>
              )
            }

            return (
              <div
                key={snip.id}
                className="group relative cursor-pointer rounded-xl border-2 border-gray-200 hover:border-purple-300 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 h-64 flex flex-col hover:scale-[1.02] transform"
                onClick={() => handleSnippetClick(snip)}
              >
                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(snip.id)
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${
                    isFavorite
                      ? "text-red-500 hover:bg-red-50"
                      : "text-gray-400 hover:bg-gray-50 hover:text-red-500 opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                </button>

                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${snip.color} text-white shadow-md group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {snip.title}
                    </h3>
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {snip.category}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 flex-1 line-clamp-3 mb-4">{snip.description}</p>

                <div className="mt-auto pt-4 border-t border-purple-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="text-purple-600 font-medium">Click to view & copy</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{snip.language}</span>
                      <Copy className="w-4 h-4 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-1 flex-wrap">
                    {snip.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                    {snip.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{snip.tags.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No snippets found</p>
          <p className="text-gray-400 text-sm mt-2">
            {selectedFolder ? `No snippets found in ${selectedFolder} folder` : "Try adjusting your search terms"}
          </p>
          {(selectedFolder || localSearchQuery) && (
            <Button
              onClick={() => {
                setSelectedFolder(null)
                setLocalSearchQuery("")
              }}
              className="mt-4 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* Snippet View Modal */}
      {currentSnippet && (
        <Dialog open={isSnippetModalOpen} onOpenChange={setIsSnippetModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${currentSnippet.color} text-white shadow-lg`}
                >
                  {React.createElement(iconMap[currentSnippet.icon] || FileText, { className: "h-5 w-5" })}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{currentSnippet.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{currentSnippet.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    {currentSnippet.category}
                  </span>
                  <button
                    onClick={() => toggleFavorite(currentSnippet.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      favorites.has(currentSnippet.id)
                        ? "text-red-500 hover:bg-red-50"
                        : "text-gray-400 hover:bg-gray-50 hover:text-red-500"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(currentSnippet.id) ? "fill-current" : ""}`} />
                  </button>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="relative flex-1 overflow-hidden">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => selectedSnippetCode && copyToClipboard(selectedSnippetCode)}
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg border-0"
                  disabled={!selectedSnippetCode}
                >
                  <Copy className="h-4 w-4" />
                  Copy Code
                </Button>
              </div>

              <div className="bg-gray-900 rounded-lg overflow-hidden h-[65vh]">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-gray-400 text-sm font-mono ml-2">{currentSnippet.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-xs">{currentSnippet.language}</span>
                    <span className="text-gray-400 text-xs">
                      Last used: {new Date(currentSnippet.lastUsed).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedSnippetCode}
                  </pre>
                </div>
              </div>

              {/* Tags and Info */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {currentSnippet.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedSnippetCode?.split("\n").length || 0} lines • {selectedSnippetCode?.length || 0} characters
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Export the snippets array for backward compatibility
export const snippets = staticSnippets
