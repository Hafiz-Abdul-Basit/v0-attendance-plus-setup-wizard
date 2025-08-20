--STEP #1 - ATTACH SCRIPT OF NETROLES
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
SELECT * INTO [TDPS].dbo.AttplusUserRoles FROM IdentityDB.dbo.AspNetRoles;
