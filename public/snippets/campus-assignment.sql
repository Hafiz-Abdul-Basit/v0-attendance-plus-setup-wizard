-- Campus Assignment Script for AttendancePlus
-- Manages user-campus relationships and permissions

USE AttendancePlusDB;
GO

-- Create Campus table if not exists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Campus')
BEGIN
    CREATE TABLE Campus (
        CampusId INT IDENTITY(1,1) PRIMARY KEY,
        CampusName NVARCHAR(100) NOT NULL,
        CampusCode NVARCHAR(10) NOT NULL UNIQUE,
        Address NVARCHAR(255),
        City NVARCHAR(50),
        State NVARCHAR(50),
        ZipCode NVARCHAR(10),
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedDate DATETIME2 DEFAULT GETDATE()
    );
END;

-- Create UserCampusAssignment table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserCampusAssignment')
BEGIN
    CREATE TABLE UserCampusAssignment (
        AssignmentId INT IDENTITY(1,1) PRIMARY KEY,
        UserId NVARCHAR(450) NOT NULL,
        CampusId INT NOT NULL,
        RoleId NVARCHAR(450),
        IsActive BIT DEFAULT 1,
        AssignedDate DATETIME2 DEFAULT GETDATE(),
        AssignedBy NVARCHAR(450),
        FOREIGN KEY (CampusId) REFERENCES Campus(CampusId),
        UNIQUE(UserId, CampusId)
    );
END;

-- Insert sample campuses
INSERT INTO Campus (CampusName, CampusCode, Address, City, State, ZipCode)
VALUES 
    ('Main Campus', 'MAIN', '123 Education St', 'Springfield', 'IL', '62701'),
    ('North Campus', 'NORTH', '456 Learning Ave', 'Springfield', 'IL', '62702'),
    ('South Campus', 'SOUTH', '789 Knowledge Blvd', 'Springfield', 'IL', '62703');

-- Stored procedure to assign user to campus
CREATE OR ALTER PROCEDURE sp_AssignUserToCampus
    @UserId NVARCHAR(450),
    @CampusId INT,
    @RoleId NVARCHAR(450) = NULL,
    @AssignedBy NVARCHAR(450)
AS
BEGIN
    BEGIN TRY
        INSERT INTO UserCampusAssignment (UserId, CampusId, RoleId, AssignedBy)
        VALUES (@UserId, @CampusId, @RoleId, @AssignedBy);
        
        SELECT 'User successfully assigned to campus' AS Message;
    END TRY
    BEGIN CATCH
        SELECT ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END;
GO

-- Stored procedure to get user campus assignments
CREATE OR ALTER PROCEDURE sp_GetUserCampusAssignments
    @UserId NVARCHAR(450)
AS
BEGIN
    SELECT 
        uca.AssignmentId,
        c.CampusId,
        c.CampusName,
        c.CampusCode,
        uca.RoleId,
        uca.IsActive,
        uca.AssignedDate
    FROM UserCampusAssignment uca
    INNER JOIN Campus c ON uca.CampusId = c.CampusId
    WHERE uca.UserId = @UserId
    AND uca.IsActive = 1;
END;
GO

-- Example usage:
-- EXEC sp_AssignUserToCampus 'user-guid-here', 1, 'role-guid-here', 'admin-user-guid';
-- EXEC sp_GetUserCampusAssignments 'user-guid-here';
