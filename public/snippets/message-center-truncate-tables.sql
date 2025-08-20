-- Message Center Database Table Truncation Script
-- WARNING: This will delete all message and notification data

USE MessageCenterDB;
GO

-- Disable foreign key constraints
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all";

-- Truncate message center tables in correct order
TRUNCATE TABLE MessageAttachments;
TRUNCATE TABLE MessageRecipients;
TRUNCATE TABLE Messages;
TRUNCATE TABLE NotificationPreferences;
TRUNCATE TABLE NotificationLogs;
TRUNCATE TABLE MessageTemplates;
TRUNCATE TABLE MessageCategories;

-- Reset identity columns
DBCC CHECKIDENT ('Messages', RESEED, 0);
DBCC CHECKIDENT ('MessageRecipients', RESEED, 0);
DBCC CHECKIDENT ('MessageAttachments', RESEED, 0);
DBCC CHECKIDENT ('NotificationLogs', RESEED, 0);
DBCC CHECKIDENT ('MessageTemplates', RESEED, 0);
DBCC CHECKIDENT ('MessageCategories', RESEED, 0);

-- Re-enable foreign key constraints
EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all";

PRINT 'All Message Center database tables have been truncated successfully!';
PRINT 'WARNING: All messages and notifications have been permanently deleted!';
