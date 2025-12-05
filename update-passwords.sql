-- SQL UPDATE statements with hashed passwords:

UPDATE "User" SET password = '$2b$10$/FDuQNTMHode5NFIR/aBhOWdhlcAomAF2xguLlCZJ7FjSVWYrhws6' WHERE email = 'rinaldy@hanmarine.co';
UPDATE "User" SET password = '$2b$10$KXU6SROPjb4FVfAD0VXBYuabwb0cHHVo2WvsUOjFW67gVl9FES9U.' WHERE email = 'arief@hanmarine.co';
UPDATE "User" SET password = '$2b$10$0Lo6WgEXGSNTbgFn5OKKq.v.Udj8VezqmVL5.Muzr9zENxy1xgqTW' WHERE email = 'dino@hanmarine.co';
UPDATE "User" SET password = '$2b$10$ADo9Xl11r8jpvvbS7Av/2eaF97u8P.oR6VxskzB1wtUosSH1YSPxq' WHERE email = 'cdmo@hanmarine.co';
UPDATE "User" SET password = '$2b$10$pNJtXg/OXDVNG5dLei6YauiPoVhuDsXK5V0WqZRgtWOhHLgLX6f/m' WHERE email = 'operational@hanmarine.co';
UPDATE "User" SET password = '$2b$10$6a.grbwTff.CQVZJwR67huDRaZUPrLBaXW9GNLtHFKIQ66Za3hlTu' WHERE email = 'hr@hanmarine.co';

-- Verify:
SELECT email, role FROM "User" ORDER BY email;
