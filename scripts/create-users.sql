-- Reset dan create users baru dengan password: admin123

-- Delete all existing users
DELETE FROM "User";

-- Insert users dengan bcrypt hash untuk "admin123"
-- Hash generated: $2b$10$uO.30AbZqkAKJeRKFQDGnezXnsev/Ni5qArT8H88NQuCG2Jyrd8AW

INSERT INTO "User" (id, email, name, role, password, "createdAt", "updatedAt")
VALUES
  ('clxuser001admin', 'admin@hanmarine.co', 'Administrator', 'DIRECTOR', '$2b$10$uO.30AbZqkAKJeRKFQDGnezXnsev/Ni5qArT8H88NQuCG2Jyrd8AW', NOW(), NOW()),
  ('clxuser002rinaldy', 'rinaldy@hanmarine.co', 'Rinaldy Anwar (Director)', 'DIRECTOR', '$2b$10$uO.30AbZqkAKJeRKFQDGnezXnsev/Ni5qArT8H88NQuCG2Jyrd8AW', NOW(), NOW()),
  ('clxuser003arief', 'arief@hanmarine.co', 'Arief Setiawan (Accounting)', 'ACCOUNTING', '$2b$10$uO.30AbZqkAKJeRKFQDGnezXnsev/Ni5qArT8H88NQuCG2Jyrd8AW', NOW(), NOW()),
  ('clxuser004dino', 'dino@hanmarine.co', 'Dino Prasetyo (Operational)', 'OPERATIONAL', '$2b$10$uO.30AbZqkAKJeRKFQDGnezXnsev/Ni5qArT8H88NQuCG2Jyrd8AW', NOW(), NOW()),
  ('clxuser005cdmo', 'cdmo@hanmarine.co', 'CDMO Manager', 'CDMO', '$2b$10$uO.30AbZqkAKJeRKFQDGnezXnsev/Ni5qArT8H88NQuCG2Jyrd8AW', NOW(), NOW()),
  ('clxuser006hr', 'hr@hanmarine.co', 'HR Manager', 'HR', '$2b$10$uO.30AbZqkAKJeRKFQDGnezXnsev/Ni5qArT8H88NQuCG2Jyrd8AW', NOW(), NOW()),
  ('clxuser007crew', 'crew@hanmarine.co', 'Crew Portal User', 'CREW_PORTAL', '$2b$10$uO.30AbZqkAKJeRKFQDGnezXnsev/Ni5qArT8H88NQuCG2Jyrd8AW', NOW(), NOW()),
  ('clxuser008auditor', 'auditor@hanmarine.co', 'Quality Auditor', 'HR', '$2b$10$uO.30AbZqkAKJeRKFQDGnezXnsev/Ni5qArT8H88NQuCG2Jyrd8AW', NOW(), NOW());

-- Verify
SELECT id, email, name, role FROM "User" ORDER BY email;
