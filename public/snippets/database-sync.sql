--STEP #5 - DATABASE SYNCHRONIZATION
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
SELECT * FROM [IdentityDB].[dbo].[AspNetUserClaims] WHERE [UserId] = 'USER_ID_HERE';
