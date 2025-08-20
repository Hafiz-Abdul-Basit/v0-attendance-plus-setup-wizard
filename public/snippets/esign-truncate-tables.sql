-- E-Sign Database Table Truncation Script
-- WARNING: This will delete all electronic signature data

USE ESignDB;
GO

-- Disable foreign key constraints
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all";

-- Truncate e-signature tables in correct order
TRUNCATE TABLE SignatureAuditLogs;
TRUNCATE TABLE DocumentSignatures;
TRUNCATE TABLE SignatureRequests;
TRUNCATE TABLE DocumentVersions;
TRUNCATE TABLE Documents;
TRUNCATE TABLE SignatureTemplates;
TRUNCATE TABLE NotificationLogs;

-- Reset identity columns
DBCC CHECKIDENT ('Documents', RESEED, 0);
DBCC CHECKIDENT ('DocumentVersions', RESEED, 0);
DBCC CHECKIDENT ('SignatureRequests', RESEED, 0);
DBCC CHECKIDENT ('DocumentSignatures', RESEED, 0);
DBCC CHECKIDENT ('SignatureTemplates', RESEED, 0);

-- Re-enable foreign key constraints
EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all";

PRINT 'All E-Sign database tables have been truncated successfully!';
PRINT 'WARNING: All electronic signature data has been permanently deleted!';
