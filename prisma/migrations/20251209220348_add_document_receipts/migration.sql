DO $$
BEGIN
	-- Some databases may not have the table yet (fresh install running on shadow DB)
	-- so we swallow the undefined_table error to keep the migration linear.
	ALTER TABLE "DocumentReceipt" ALTER COLUMN "updatedAt" DROP DEFAULT;
EXCEPTION
	WHEN undefined_table THEN
		NULL; -- Table not created yet, skip adjustment
END;
$$;
