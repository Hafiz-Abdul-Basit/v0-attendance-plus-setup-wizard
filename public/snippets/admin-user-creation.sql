// Admin User Creation

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
END
