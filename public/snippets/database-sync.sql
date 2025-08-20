-- Database Synchronization Script for AttendancePlus
-- Handles data synchronization between different environments

USE AttendancePlusDB;
GO

-- Create sync tracking table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncLog')
BEGIN
    CREATE TABLE SyncLog (
        SyncId INT IDENTITY(1,1) PRIMARY KEY,
        TableName NVARCHAR(128) NOT NULL,
        Operation NVARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
        RecordId NVARCHAR(50),
        SyncDate DATETIME2 DEFAULT GETDATE(),
        SourceSystem NVARCHAR(50),
        TargetSystem NVARCHAR(50),
        Status NVARCHAR(20) DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
        ErrorMessage NVARCHAR(MAX),
        RetryCount INT DEFAULT 0
    );
END;

-- Create stored procedure for data synchronization
CREATE OR ALTER PROCEDURE sp_SyncData
    @TableName NVARCHAR(128),
    @Operation NVARCHAR(10),
    @RecordId NVARCHAR(50),
    @SourceSystem NVARCHAR(50),
    @TargetSystem NVARCHAR(50)
AS
BEGIN
    BEGIN TRY
        -- Log sync operation
        INSERT INTO SyncLog (TableName, Operation, RecordId, SourceSystem, TargetSystem)
        VALUES (@TableName, @Operation, @RecordId, @SourceSystem, @TargetSystem);
        
        DECLARE @SyncId INT = SCOPE_IDENTITY();
        
        -- Perform sync operation based on table and operation
        IF @TableName = 'Students' AND @Operation = 'INSERT'
        BEGIN
            -- Example sync logic for students
            -- This would contain actual sync logic
            PRINT 'Syncing student data...';
        END
        
        -- Update sync status to success
        UPDATE SyncLog 
        SET Status = 'SUCCESS' 
        WHERE SyncId = @SyncId;
        
    END TRY
    BEGIN CATCH
        -- Update sync status to failed
        UPDATE SyncLog 
        SET Status = 'FAILED', 
            ErrorMessage = ERROR_MESSAGE() 
        WHERE SyncId = @SyncId;
        
        THROW;
    END CATCH
END;
GO

-- Create procedure to retry failed syncs
CREATE OR ALTER PROCEDURE sp_RetryFailedSyncs
AS
BEGIN
    DECLARE @SyncId INT, @TableName NVARCHAR(128), @Operation NVARCHAR(10), 
            @RecordId NVARCHAR(50), @SourceSystem NVARCHAR(50), @TargetSystem NVARCHAR(50);
    
    DECLARE sync_cursor CURSOR FOR
    SELECT SyncId, TableName, Operation, RecordId, SourceSystem, TargetSystem
    FROM SyncLog
    WHERE Status = 'FAILED' AND RetryCount < 3;
    
    OPEN sync_cursor;
    FETCH NEXT FROM sync_cursor INTO @SyncId, @TableName, @Operation, @RecordId, @SourceSystem, @TargetSystem;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        BEGIN TRY
            -- Increment retry count
            UPDATE SyncLog SET RetryCount = RetryCount + 1 WHERE SyncId = @SyncId;
            
            -- Retry sync operation
            EXEC sp_SyncData @TableName, @Operation, @RecordId, @SourceSystem, @TargetSystem;
            
        END TRY
        BEGIN CATCH
            PRINT 'Retry failed for SyncId: ' + CAST(@SyncId AS NVARCHAR(10));
        END CATCH
        
        FETCH NEXT FROM sync_cursor INTO @SyncId, @TableName, @Operation, @RecordId, @SourceSystem, @TargetSystem;
    END;
    
    CLOSE sync_cursor;
    DEALLOCATE sync_cursor;
END;
GO
