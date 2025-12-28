# Production Database Seeding Instructions

## Problem
Login credentials are not working on the production application because the database hasn't been seeded with test users.

## Solution
There are two ways to seed the production database:

### Option 1: Using the API Endpoint (Easiest)
I've added a seed endpoint to the application. To use it:

```bash
curl -X POST http://localhost:3000/api/admin/seed-users \
  -H "Content-Type: application/json"
```

Run this on the VPS server (in the application's working directory).

**Steps:**
1. SSH into the VPS: `ssh hanmarine@31.97.223.11`
2. Navigate to the application directory (find with: `find ~ -name "package.json" -path "*/hims*"`)
3. Make sure you've pulled the latest code: `git pull origin main`
4. Ensure the application is built: `npm run build`
5. Run the seed curl command above
6. Restart the application: `pm2 restart all` or `npm start`

### Option 2: Using the Seed Script Directly
If you prefer to run the seed script directly:

```bash
npm run seed
```

This requires:
1. Environment variables configured correctly (DATABASE_URL pointing to hims_prod)
2. The application to be in its home directory
3. Node.js and npm to be available

### Option 3: Manual Database Insert
If neither option above works, you can manually insert users using psql:

```sql
-- Connect to production database
psql -U hims_user -d hims_prod -h localhost

-- Hash a password (using bcryptjs: password = "admin2025" hashed)
-- Hash value (bcrypt cost 10): $2a$10$MojRv2POmq.mKvXJi.C.EOcuSfr3.vNQE4O5K0m3V4TJnXBhRUKYW

INSERT INTO "User" (
  id, 
  email, 
  name, 
  password, 
  role, 
  "isActive", 
  "isSystemAdmin"
) VALUES 
  (
    gen_random_uuid(), 
    'arief@hanmarine.co', 
    'Arief', 
    '$2a$10$MojRv2POmq.mKvXJi.C.EOcuSfr3.vNQE4O5K0m3V4TJnXBhRUKYW', 
    'DIRECTOR', 
    true, 
    false
  ),
  (
    gen_random_uuid(), 
    'rinaldy@hanmarine.co', 
    'Rinaldy (Director)', 
    '$2a$10$MojRv2POmq.mKvXJi.C.EOcuSfr3.vNQE4O5K0m3V4TJnXBhRUKYW', 
    'DIRECTOR', 
    true, 
    true
  );
```

## Available Test User Credentials

Once seeded, these credentials will be available:

| Email | Password | Role |
|-------|----------|------|
| arief@hanmarine.co | admin2025 | DIRECTOR |
| rinaldy@hanmarine.co | director2025 | DIRECTOR |
| dino@hanmarine.co | accounting2025 | ACCOUNTING |
| cdmo@hanmarine.co | cdmo123 | CDMO |
| operational@hanmarine.co | operational123 | OPERATIONAL |
| hr@hanmarine.co | hr123 | HR |
| crew@hanmarine.co | crew2025 | CREW_PORTAL |

## Try Logging In
After seeding, visit: https://app.hanmarine.co/auth/signin

Use any of the credentials above to log in. Once logged in, you'll be able to:
- View the crew list
- See crew photos
- Manage crew information
- Upload photos

## Troubleshooting

**If seed endpoint returns error:**
- Make sure you've deployed the latest code (contains the seed endpoint)
- Check if the application is running
- For production, you may need to set SEED_SECRET_KEY environment variable

**If API still returns 401:**
- Verify database has users: `psql -d hims_prod -c "SELECT COUNT(*) FROM \"User\";"`
- Check application logs for errors
- Ensure NextAuth is properly configured

**If you still can't log in:**
1. Check the User table exists: `psql -d hims_prod -c "\dt User"`
2. Verify the password hash is correct
3. Check if the user's `isActive` field is true
