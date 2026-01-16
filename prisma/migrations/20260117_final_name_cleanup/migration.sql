-- Final aggressive fix: strip ALL role suffixes from user names using regex
UPDATE "User" 
SET "name" = TRIM(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          "name",
          ' \(Director\)$', ''),
        ' \(Accounting\)$', ''),
      ' \(Crew Document Management\)$', ''),
    ' \(System Admin\)$', '')
)
WHERE "name" ~ '\(Director\)|\(Accounting\)|\(Crew Document Management\)|\(System Admin\)';
