"use client"

export const snippetsData = [
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
  // 5 NEW ADDITIONAL SNIPPETS
  {
    id: "typescript-utility-types",
    title: "TypeScript Utility Types",
    description: "Essential TypeScript utility types and advanced patterns",
    category: "Development",
    icon: "Code2",
    color: "bg-blue-700",
    content: `// Basic Utility Types
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

// Partial - Make all properties optional
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number; }

// Required - Make all properties required
type RequiredUser = Required<User>;
// { id: number; name: string; email: string; age: number; }

// Pick - Select specific properties
type UserBasic = Pick<User, 'id' | 'name'>;
// { id: number; name: string; }

// Omit - Exclude specific properties
type UserWithoutId = Omit<User, 'id'>;
// { name: string; email: string; age?: number; }

// Record - Create object type with specific keys and values
type UserRoles = Record<'admin' | 'user' | 'guest', boolean>;
// { admin: boolean; user: boolean; guest: boolean; }

// Advanced Patterns
type NonNullable<T> = T extends null | undefined ? never : T;
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

// Conditional Types
type ApiResponse<T> = T extends string 
  ? { message: T } 
  : { data: T };

// Template Literal Types
type EventName<T extends string> = \`on\${Capitalize<T>}\`;
type ButtonEvents = EventName<'click' | 'hover' | 'focus'>;
// 'onClick' | 'onHover' | 'onFocus'

// Mapped Types
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Generic Constraints
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}

// Discriminated Unions
type LoadingState = 
  | { status: 'loading' }
  | { status: 'success'; data: any }
  | { status: 'error'; error: string };

function handleState(state: LoadingState) {
  switch (state.status) {
    case 'loading':
      return 'Loading...';
    case 'success':
      return state.data;
    case 'error':
      return state.error;
  }
}`,
    language: "typescript",
    tags: ["typescript", "types", "utility", "generics", "advanced"],
    isFavorite: false,
    lastUsed: new Date("2024-01-28"),
  },
  {
    id: "nextjs-api-routes",
    title: "Next.js API Routes Patterns",
    description: "Complete Next.js API routes with error handling and middleware",
    category: "Development",
    icon: "Server",
    color: "bg-black",
    content: `// app/api/users/route.ts - App Router API Route
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const createUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(18).max(120).optional(),
});

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Simulate database query
    const users = await getUsersFromDB({ page, limit });
    
    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: users.length,
      }
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = createUserSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await findUserByEmail(validatedData.email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 409 }
      );
    }
    
    // Create user
    const newUser = await createUser(validatedData);
    
    return NextResponse.json(
      { success: true, data: newUser },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('POST /api/users error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// app/api/users/[id]/route.ts - Dynamic Route
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    const user = await getUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error(\`GET /api/users/\${params.id} error:\`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// Middleware for authentication
export async function middleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  try {
    const decoded = verifyJWT(token);
    // Add user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid token' },
      { status: 401 }
    );
  }
}`,
    language: "typescript",
    tags: ["nextjs", "api", "routes", "validation", "middleware"],
    isFavorite: true,
    lastUsed: new Date("2024-01-29"),
  },
  {
    id: "database-queries-advanced",
    title: "Advanced Database Queries",
    description: "Complex SQL queries for reporting and analytics",
    category: "SQL Server",
    icon: "Database",
    color: "bg-indigo-600",
    content: `-- Complex JOIN with Multiple Tables
SELECT 
    u.id,
    u.name,
    u.email,
    p.title as profile_title,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_spent,
    AVG(o.total_amount) as avg_order_value,
    MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= DATEADD(YEAR, -1, GETDATE())
GROUP BY u.id, u.name, u.email, p.title
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC;

-- Window Functions for Analytics
SELECT 
    product_name,
    category,
    price,
    -- Ranking within category
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) as price_rank,
    RANK() OVER (PARTITION BY category ORDER BY price DESC) as price_rank_with_ties,
    
    -- Running totals
    SUM(price) OVER (PARTITION BY category ORDER BY price) as running_total,
    
    -- Moving averages
    AVG(price) OVER (
        PARTITION BY category 
        ORDER BY price 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as moving_avg_3,
    
    -- Percentiles
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) 
        OVER (PARTITION BY category) as median_price,
    
    -- Lead/Lag for comparisons
    LAG(price, 1) OVER (PARTITION BY category ORDER BY price) as prev_price,
    LEAD(price, 1) OVER (PARTITION BY category ORDER BY price) as next_price
FROM products;

-- Common Table Expressions (CTE) for Hierarchical Data
WITH EmployeeHierarchy AS (
    -- Anchor: Top-level managers
    SELECT 
        employee_id,
        name,
        manager_id,
        0 as level,
        CAST(name AS NVARCHAR(MAX)) as hierarchy_path
    FROM employees 
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive: All subordinates
    SELECT 
        e.employee_id,
        e.name,
        e.manager_id,
        eh.level + 1,
        CAST(eh.hierarchy_path + ' -> ' + e.name AS NVARCHAR(MAX))
    FROM employees e
    INNER JOIN EmployeeHierarchy eh ON e.manager_id = eh.employee_id
)
SELECT 
    employee_id,
    name,
    level,
    hierarchy_path,
    REPLICATE('  ', level) + name as indented_name
FROM EmployeeHierarchy
ORDER BY hierarchy_path;

-- Pivot Table for Cross-Tab Reports
SELECT 
    product_category,
    [2023-01] as Jan_2023,
    [2023-02] as Feb_2023,
    [2023-03] as Mar_2023,
    [2023-04] as Apr_2023,
    [2023-05] as May_2023,
    [2023-06] as Jun_2023
FROM (
    SELECT 
        product_category,
        FORMAT(order_date, 'yyyy-MM') as order_month,
        total_amount
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE order_date >= '2023-01-01'
) as source_data
PIVOT (
    SUM(total_amount)
    FOR order_month IN ([2023-01], [2023-02], [2023-03], [2023-04], [2023-05], [2023-06])
) as pivot_table;

-- Advanced Filtering with EXISTS and NOT EXISTS
-- Find customers who have ordered in the last 30 days but not in the last 7 days
SELECT DISTINCT c.customer_id, c.name, c.email
FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.customer_id = c.customer_id 
    AND o.order_date >= DATEADD(DAY, -30, GETDATE())
)
AND NOT EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.customer_id = c.customer_id 
    AND o.order_date >= DATEADD(DAY, -7, GETDATE())
);

-- Performance Optimization with Indexes
CREATE NONCLUSTERED INDEX IX_Orders_CustomerDate 
ON orders (customer_id, order_date DESC)
INCLUDE (total_amount, status);

-- Stored Procedure with Error Handling
CREATE PROCEDURE sp_ProcessOrder
    @CustomerId INT,
    @ProductId INT,
    @Quantity INT,
    @OrderId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check inventory
        DECLARE @AvailableStock INT;
        SELECT @AvailableStock = stock_quantity 
        FROM products 
        WHERE id = @ProductId;
        
        IF @AvailableStock < @Quantity
        BEGIN
            THROW 50001, 'Insufficient stock available', 1;
        END
        
        -- Create order
        INSERT INTO orders (customer_id, product_id, quantity, order_date, status)
        VALUES (@CustomerId, @ProductId, @Quantity, GETDATE(), 'pending');
        
        SET @OrderId = SCOPE_IDENTITY();
        
        -- Update inventory
        UPDATE products 
        SET stock_quantity = stock_quantity - @Quantity
        WHERE id = @ProductId;
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;`,
    language: "sql",
    tags: ["sql", "advanced", "analytics", "cte", "window-functions", "pivot"],
    isFavorite: false,
    lastUsed: new Date("2024-01-30"),
  },
  {
    id: "react-performance-optimization",
    title: "React Performance Optimization",
    description: "Advanced React patterns for optimal performance",
    category: "Development",
    icon: "Zap",
    color: "bg-yellow-600",
    content: `import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { debounce } from 'lodash';

// 1. React.memo for component memoization
const ExpensiveComponent = memo(({ data, onUpdate }) => {
  console.log('ExpensiveComponent rendered');
  
  return (
    <div>
      {data.map(item => (
        <div key={item.id} onClick={() => onUpdate(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.onUpdate === nextProps.onUpdate
  );
});

// 2. useMemo for expensive calculations
function DataProcessor({ items, filters }) {
  const processedData = useMemo(() => {
    console.log('Processing data...');
    return items
      .filter(item => filters.includes(item.category))
      .map(item => ({
        ...item,
        processedValue: expensiveCalculation(item.value)
      }))
      .sort((a, b) => b.processedValue - a.processedValue);
  }, [items, filters]);

  return <div>{/* Render processed data */}</div>;
}

// 3. useCallback for stable function references
function SearchComponent({ onSearch, placeholder }) {
  const [query, setQuery] = useState('');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      onSearch(searchQuery);
    }, 300),
    [onSearch]
  );

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  return (
    <input
      type="text"
      value={query}
      onChange={handleInputChange}
      placeholder={placeholder}
    />
  );
}

// 4. Code Splitting with React.lazy
const HeavyComponent = lazy(() => import('./HeavyComponent'));
const AdminPanel = lazy(() => 
  import('./AdminPanel').then(module => ({
    default: module.AdminPanel
  }))
);

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading heavy component...</div>}>
        <HeavyComponent />
      </Suspense>
      
      <Suspense fallback={<div>Loading admin panel...</div>}>
        <AdminPanel />
      </Suspense>
    </div>
  );
}

// 5. Virtual Scrolling for Large Lists
import { FixedSizeList as List } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <div className="list-item">
        {items[index].name}
      </div>
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
}

// 6. Custom Hook for Optimized API Calls
function useOptimizedFetch(url, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
}

// 7. Intersection Observer for Lazy Loading
function useLazyLoad(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

function LazyImage({ src, alt, placeholder }) {
  const [ref, isVisible] = useLazyLoad();

  return (
    <div ref={ref}>
      {isVisible ? (
        <img src={src || "/placeholder.svg"} alt={alt} />
      ) : (
        <div className="placeholder">{placeholder}</div>
      )}
    </div>
  );
}

// 8. Error Boundary for Better UX
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 9. Performance Monitoring Hook
function usePerformanceMonitor(componentName) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.log(\`\${componentName} render time: \${endTime - startTime}ms\`);
    };
  });
}`,
    language: "javascript",
    tags: ["react", "performance", "optimization", "memoization", "lazy-loading"],
    isFavorite: true,
    lastUsed: new Date("2024-01-31"),
  },
  {
    id: "security-best-practices",
    title: "Web Security Best Practices",
    description: "Essential security patterns for web applications",
    category: "Documentation",
    icon: "Shield",
    color: "bg-red-700",
    content: `# Web Security Best Practices Checklist

## 1. Authentication & Authorization

### JWT Security
\`\`\`javascript
// Secure JWT implementation
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Generate secure tokens
function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
}

// Secure password hashing
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}
\`\`\`

### Session Security
\`\`\`javascript
// Express session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    httpOnly: true, // Prevent XSS
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'strict' // CSRF protection
  },
  store: new RedisStore({ client: redisClient })
}));
\`\`\`

## 2. Input Validation & Sanitization

### Server-side Validation
\`\`\`javascript
const validator = require('validator');
const xss = require('xss');

function validateAndSanitizeInput(input) {
  // Validate
  if (!validator.isLength(input, { min: 1, max: 255 })) {
    throw new Error('Invalid input length');
  }
  
  // Sanitize
  const sanitized = xss(input, {
    whiteList: {}, // No HTML allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
  
  return validator.escape(sanitized);
}

// SQL Injection Prevention
const query = 'SELECT * FROM users WHERE email = ? AND status = ?';
db.query(query, [email, status], callback);
\`\`\`

## 3. HTTPS & Security Headers

### Security Headers Middleware
\`\`\`javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.example.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
\`\`\`

## 4. Rate Limiting & DDoS Protection

### Rate Limiting
\`\`\`javascript
const rateLimit = require('express-rate-limit');

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
\`\`\`

## 5. Data Protection

### Encryption at Rest
\`\`\`javascript
const crypto = require('crypto');

class DataEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(
      this.algorithm, 
      this.secretKey, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
\`\`\`

## 6. API Security

### API Key Management
\`\`\`javascript
// API key validation middleware
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Hash the provided key and compare with stored hash
  const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  if (!isValidApiKey(hashedKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
\`\`\`

## 7. Logging & Monitoring

### Security Event Logging
\`\`\`javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.Console()
  ]
});

// Log security events
function logSecurityEvent(event, details) {
  securityLogger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent
  });
}

// Failed login attempt
logSecurityEvent('FAILED_LOGIN', {
  email: 'user@example.com',
  ip: req.ip,
  userAgent: req.get('User-Agent')
});
\`\`\`

## 8. Environment & Secrets Management

### Environment Variables
\`\`\`bash
# .env.example
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key
ENCRYPTION_KEY=your-32-character-encryption-key
SESSION_SECRET=your-session-secret
API_RATE_LIMIT=100
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
\`\`\`

### Secrets Validation
\`\`\`javascript
// Validate required environment variables on startup
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'SESSION_SECRET'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(\`Missing required environment variable: \${envVar}\`);
    process.exit(1);
  }
});

// Validate secret strength
function validateSecretStrength(secret, minLength = 32) {
  if (secret.length < minLength) {
    throw new Error(\`Secret must be at least \${minLength} characters long\`);
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(secret)) {
    throw new Error('Secret must contain uppercase, lowercase, number, and special character');
  }
}
\`\`\`

## 9. Security Testing

### Automated Security Tests
\`\`\`javascript
// Security test examples
describe('Security Tests', () => {
  test('should reject requests without proper authentication', async () => {
    const response = await request(app)
      .get('/api/protected')
      .expect(401);
  });

  test('should sanitize user input', async () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const response = await request(app)
      .post('/api/comments')
      .send({ content: maliciousInput })
      .expect(400);
  });

  test('should enforce rate limiting', async () => {
    const requests = Array(10).fill().map(() => 
      request(app).post('/api/auth/login')
    );
    
    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
\`\`\`

## 10. Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Implement proper authentication & authorization
- [ ] Validate and sanitize all inputs
- [ ] Use parameterized queries to prevent SQL injection
- [ ] Implement rate limiting
- [ ] Set security headers (CSP, HSTS, etc.)
- [ ] Keep dependencies updated
- [ ] Use secure session management
- [ ] Implement proper error handling (don't leak info)
- [ ] Log security events
- [ ] Regular security audits and penetration testing
- [ ] Implement CSRF protection
- [ ] Use secure password policies
- [ ] Encrypt sensitive data at rest
- [ ] Implement proper access controls
- [ ] Regular backup and disaster recovery testing`,
    language: "markdown",
    tags: ["security", "authentication", "encryption", "best-practices", "web"],
    isFavorite: true,
    lastUsed: new Date("2024-02-01"),
  },
]
