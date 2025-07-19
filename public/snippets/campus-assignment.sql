--STEP #4 - CAMPUS ASSIGNMENT
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
VALUES (@userid, N'Grade IN (''1'', ''2'', ''3'', ''4'', ''5'', ''6'', ''7'', ''8'', ''9'', ''10'', ''11'', ''12'')', NULL, NULL, NULL);
