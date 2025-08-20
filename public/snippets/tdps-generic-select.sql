-- These tables will not be truncated when we set up a new client, as their data is generic for all clients.
-- We do not need to add it ourselves; you can take the data for these tables from the design.
SELECT * FROM AttplusUserRoles;
SELECT * FROM GoogleCalendarCredentials;
SELECT * FROM iApp_Groups;
SELECT * FROM ManagePrintQueues;
SELECT * FROM TDPS_CaliforniaDashboardSetup;
SELECT * FROM TDPS_ConcernCategory;
SELECT * FROM TDPS_ConcernSetup;
SELECT * FROM dbo.[TDPS_Help Navigation];
SELECT * FROM TDPS_History_Comparison_Setup;
SELECT * FROM dbo.TDPS_HoldCategory;
SELECT * FROM dbo.TDPS_HoldReasons;
SELECT * FROM TDPS_InterventionEffectivenessTemplate;
SELECT * FROM TDPS_MissedPeriodsThreshold;
SELECT * FROM TDPS_NotesTypes;
SELECT * FROM TDPS_StudentFileSections;
SELECT * FROM TDPS_SuppressedReasons;
SELECT * FROM TDPS_YTDAbsencesComparisonSetup;
