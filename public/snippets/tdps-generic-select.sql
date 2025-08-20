-- TDPS Generic Selection Queries
-- Common queries used across all clients

USE TDPSDB;
GO

-- Get all active students
SELECT 
    StudentId,
    StudentNumber,
    FirstName,
    LastName,
    Grade,
    DateOfBirth,
    EnrollmentDate,
    IsActive
FROM Students
WHERE IsActive = 1
ORDER BY Grade, LastName, FirstName;

-- Get all classes with teacher information
SELECT 
    cl.ClassId,
    cl.ClassName,
    cl.ClassCode,
    cl.Grade,
    t.FirstName + ' ' + t.LastName AS TeacherName,
    p.PeriodName,
    cl.MaxCapacity,
    cl.IsActive
FROM Classes cl
LEFT JOIN TeacherAssignments ta ON cl.ClassId = ta.ClassId AND ta.IsActive = 1
LEFT JOIN Teachers t ON ta.TeacherId = t.TeacherId
LEFT JOIN Periods p ON ta.PeriodId = p.PeriodId
WHERE cl.IsActive = 1
ORDER BY cl.Grade, cl.ClassName;

-- Get attendance statistics for current month
SELECT 
    DATEPART(day, AttendanceDate) AS Day,
    COUNT(*) AS TotalRecords,
    SUM(CASE WHEN Status = 'Present' THEN 1 ELSE 0 END) AS Present,
    SUM(CASE WHEN Status = 'Absent' THEN 1 ELSE 0 END) AS Absent,
    SUM(CASE WHEN Status = 'Tardy' THEN 1 ELSE 0 END) AS Tardy,
    CAST(SUM(CASE WHEN Status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) AS AttendanceRate
FROM AttendanceRecords
WHERE MONTH(AttendanceDate) = MONTH(GETDATE())
AND YEAR(AttendanceDate) = YEAR(GETDATE())
GROUP BY DATEPART(day, AttendanceDate)
ORDER BY Day;

-- Get students with perfect attendance (current month)
SELECT 
    s.StudentId,
    s.StudentNumber,
    s.FirstName + ' ' + s.LastName AS StudentName,
    s.Grade,
    COUNT(ar.AttendanceId) AS TotalDays,
    SUM(CASE WHEN ar.Status = 'Present' THEN 1 ELSE 0 END) AS PresentDays
FROM Students s
INNER JOIN AttendanceRecords ar ON s.StudentId = ar.StudentId
WHERE MONTH(ar.AttendanceDate) = MONTH(GETDATE())
AND YEAR(ar.AttendanceDate) = YEAR(GETDATE())
AND s.IsActive = 1
GROUP BY s.StudentId, s.StudentNumber, s.FirstName, s.LastName, s.Grade
HAVING COUNT(ar.AttendanceId) = SUM(CASE WHEN ar.Status = 'Present' THEN 1 ELSE 0 END)
ORDER BY s.Grade, s.LastName;

-- Get system usage statistics
SELECT 
    'Total Students' AS Metric,
    COUNT(*) AS Value
FROM Students
WHERE IsActive = 1

UNION ALL

SELECT 
    'Total Teachers' AS Metric,
    COUNT(*) AS Value
FROM Teachers
WHERE IsActive = 1

UNION ALL

SELECT 
    'Total Classes' AS Metric,
    COUNT(*) AS Value
FROM Classes
WHERE IsActive = 1

UNION ALL

SELECT 
    'Attendance Records (This Month)' AS Metric,
    COUNT(*) AS Value
FROM AttendanceRecords
WHERE MONTH(AttendanceDate) = MONTH(GETDATE())
AND YEAR(AttendanceDate) = YEAR(GETDATE());
