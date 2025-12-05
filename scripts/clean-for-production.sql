-- CLEAN DATABASE FOR PRODUCTION DEPLOYMENT
-- Only keeps admin user, removes all dummy data

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
DELETE FROM "Contract";
DELETE FROM "Crew";
DELETE FROM "Vessel";
DELETE FROM "Principal";
DELETE FROM "ExternalCompliance";
DELETE FROM "FormSubmission";
DELETE FROM "FormTemplate";
DELETE FROM "MonthlyChecklist";

-- Keep only admin user
DELETE FROM "User" WHERE email != 'admin@hims.com';
