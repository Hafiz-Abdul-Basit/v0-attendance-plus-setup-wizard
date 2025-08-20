-- TDPS Client-Dependent Data Selection Queries
-- These queries retrieve data specific to client configurations

USE TDPSDB;
GO

-- Get all students for a specific client/campus
SELECT 
    s.StudentId,
    s.StudentNumber,
    s.FirstName,
    s.LastName,
    s.Grade,
    s.CampusId,
    c.CampusName
FROM Students s
INNER JOIN Campus c ON s.CampusId = c.CampusId
WHERE c.ClientId = @ClientId -- Replace with actual client ID
ORDER BY s.LastName, s.FirstName;

-- Get attendance records for specific date range and client
SELECT 
    ar.AttendanceId,
    s.StudentNumber,
    s.FirstName + ' ' + s.LastName AS StudentName,
    cl.ClassName,
    p.PeriodName,
    ar.AttendanceDate,
    ar.Status,
    ar.Notes
FROM AttendanceRecords ar
INNER JOIN Students s ON ar.StudentId = s.StudentId
INNER JOIN Classes cl ON ar.ClassId = cl.ClassId
INNER JOIN Periods p ON ar.PeriodId = p.PeriodId
INNER JOIN Campus camp ON s.CampusId = camp.CampusId
WHERE camp.ClientId = @ClientId
AND ar.AttendanceDate BETWEEN @StartDate AND @EndDate
ORDER BY ar.AttendanceDate DESC, s.LastName;

-- Get teacher assignments for specific client
SELECT 
    t.TeacherId,
    t.FirstName + ' ' + t.LastName AS TeacherName,
    cl.ClassName,
    p.PeriodName,
    ta.AssignmentDate,
    camp.CampusName
FROM TeacherAssignments ta
INNER JOIN Teachers t ON ta.TeacherId = t.TeacherId
INNER JOIN Classes cl ON ta.ClassId = cl.ClassId
INNER JOIN Periods p ON ta.PeriodId = p.PeriodId
INNER JOIN Campus camp ON cl.CampusId = camp.CampusId
WHERE camp.ClientId = @ClientId
AND ta.IsActive = 1
ORDER BY t.LastName, cl.ClassName;

-- Get client-specific configuration settings
SELECT 
    cs.SettingKey,
    cs.SettingValue,
    cs.Description,
    cs.LastModified
FROM ClientSettings cs
WHERE cs.ClientId = @ClientId
ORDER BY cs.SettingKey;

-- Get attendance summary by campus for client
SELECT 
    camp.CampusName,
    COUNT(DISTINCT s.StudentId) AS TotalStudents,
    COUNT(ar.AttendanceId) AS TotalAttendanceRecords,
    SUM(CASE WHEN ar.Status = 'Present' THEN 1 ELSE 0 END) AS PresentCount,
    SUM(CASE WHEN ar.Status = 'Absent' THEN 1 ELSE 0 END) AS AbsentCount,
    SUM(CASE WHEN ar.Status = 'Tardy' THEN 1 ELSE 0 END) AS TardyCount
FROM Campus camp
LEFT JOIN Students s ON camp.CampusId = s.CampusId
LEFT JOIN AttendanceRecords ar ON s.StudentId = ar.StudentId
WHERE camp.ClientId = @ClientId
AND ar.AttendanceDate >= DATEADD(day, -30, GETDATE()) -- Last 30 days
GROUP BY camp.CampusId, camp.CampusName
ORDER BY camp.CampusName;
