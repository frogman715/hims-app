-- Clean all data for production deployment
-- Preserves only admin@hanmarine.co user

-- Disable foreign key checks
SET session_replication_role = replica;

-- Delete all data from dependent tables first
DELETE FROM "ActivityLog";
DELETE FROM "TransportLog";
DELETE FROM "DocumentReceiving";
DELETE FROM "OfficeExpense";
DELETE FROM "CrewReplacement";
DELETE FROM "Interview";
DELETE FROM "Application";
DELETE FROM "PrepareJoining";
DELETE FROM "Assignment";
DELETE FROM "SeafarerDocument";
DELETE FROM "ExternalCompliance";
DELETE FROM "Crew";
DELETE FROM "Vessel";
DELETE FROM "Principal";
DELETE FROM "AgencyAgreement";
DELETE FROM "Orientation";
DELETE FROM "Recruitment";
DELETE FROM "FormTemplate";

-- Delete all users except admin@hanmarine.co
DELETE FROM "User" WHERE email != 'admin@hanmarine.co';

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verify cleanup
SELECT 'Crew' as table_name, COUNT(*) as count FROM "Crew"
UNION ALL
SELECT 'Vessel', COUNT(*) FROM "Vessel"
UNION ALL
SELECT 'Principal', COUNT(*) FROM "Principal"
UNION ALL
SELECT 'Assignment', COUNT(*) FROM "Assignment"
UNION ALL
SELECT 'Application', COUNT(*) FROM "Application"
UNION ALL
SELECT 'User', COUNT(*) FROM "User";
