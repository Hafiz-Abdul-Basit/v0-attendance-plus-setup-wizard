-- History Tables Selection Queries
-- Queries for retrieving historical data and audit trails

USE AttendancePlusDB;
GO

-- Get attendance history for a specific student
SELECT 
    ah.HistoryId,
    s.StudentNumber,
    s.FirstName + ' ' + s.LastName AS StudentName,
    ah.AttendanceDate,
    ah.OldStatus,
    ah.NewStatus,
    ah.ChangeReason,
    ah.ChangedBy,
    ah.ChangeDate
FROM AttendanceHistory ah
INNER JOIN Students s ON ah.StudentId = s.StudentId
WHERE ah.StudentId = @StudentId -- Replace with actual student ID
ORDER BY ah.ChangeDate DESC;

-- Get user activity history
SELECT 
    ual.LogId,
    ual.UserId,
    u.UserName,
    ual.Action,
    ual.TableName,
    ual.RecordId,
    ual.OldValues,
    ual.NewValues,
    ual.Timestamp,
    ual.IpAddress
FROM UserActivityLogs ual
LEFT JOIN AspNetUsers u ON ual.UserId = u.Id
WHERE ual.Timestamp >= DATEADD(day, -30, GETDATE()) -- Last 30 days
ORDER BY ual.Timestamp DESC;

-- Get grade change history
SELECT 
    gh.HistoryId,
    s.StudentNumber,
    s.FirstName + ' ' + s.LastName AS StudentName,
    c.ClassName,
    gh.OldGrade,
    gh.NewGrade,
    gh.ChangeReason,
    gh.ChangedBy,
    gh.ChangeDate
FROM GradeHistory gh
INNER JOIN Students s ON gh.StudentId = s.StudentId
INNER JOIN Classes c ON gh.ClassId = c.ClassId
WHERE gh.ChangeDate >= DATEADD(day, -90, GETDATE()) -- Last 90 days
ORDER BY gh.ChangeDate DESC;

-- Get system configuration changes
SELECT 
    scl.LogId,
    scl.ConfigKey,
    scl.OldValue,
    scl.NewValue,
    scl.ChangedBy,
    scl.ChangeDate,
    scl.ChangeReason
FROM SystemConfigLogs scl
ORDER BY scl.ChangeDate DESC;

-- Get data export history
SELECT 
    eh.ExportId,
    eh.ExportType,
    eh.ExportedBy,
    u.UserName,
    eh.ExportDate,
    eh.RecordCount,
    eh.FilePath,
    eh.Status
FROM ExportHistory eh
LEFT JOIN AspNetUsers u ON eh.ExportedBy = u.Id
ORDER BY eh.ExportDate DESC;
