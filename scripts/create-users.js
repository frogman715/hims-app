const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Initialize Prisma Client using the same adapter as the app
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined. Please set it in your .env file before running create-users.js.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createUsers() {
  console.log('\n🚀 Creating HIMS Users...\n');

  try {
    // Check if users already exist
    const existingUsers = await prisma.user.count();
    
    if (existingUsers > 0) {
      console.log(`⚠️  Found ${existingUsers} existing users. Deleting...`);
      await prisma.user.deleteMany({});
      console.log('✅ Old users deleted.\n');
    }

    const users = [
      {
        id: 'clxuser001rinaldy',
        email: 'rinaldy@hanmarine.co',
        name: 'Rinaldy (Director)',
        role: 'DIRECTOR',
        password: 'director2025'
      },
      {
        id: 'clxuser002arief',
        email: 'arief@hanmarine.co',
        name: 'Arief (Director)',
        role: 'DIRECTOR',
        password: 'admin2025'
      },
      {
        id: 'clxuser003dino',
        email: 'dino@hanmarine.co',
        name: 'Dino (Accounting)',
        role: 'ACCOUNTING',
        password: 'accounting2025'
      },
      {
        id: 'clxuser004cdmo',
        email: 'cdmo@hanmarine.co',
        name: 'CDMO (Crew Document Management)',
        role: 'CDMO',
        password: 'cdmo123'
      },
      {
        id: 'clxuser005operational',
        email: 'operational@hanmarine.co',
        name: 'Operational Manager',
        role: 'OPERATIONAL',
        password: 'operational123'
      },
      {
        id: 'clxuser006hr',
        email: 'hr@hanmarine.co',
        name: 'HR Officer',
        role: 'HR',
        password: 'hr123'
      },
      {
        id: 'clxuser007crew',
        email: 'crew@hanmarine.co',
        name: 'Crew Portal',
        role: 'CREW_PORTAL',
        password: 'crew2025'
      },
      {
        id: 'clxuser008auditor',
        email: 'auditor@hanmarine.co',
        name: 'External Auditor',
        role: 'OPERATIONAL',
        password: 'auditor2025'
      }
    ];

    // Create users
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      });
      console.log(`✅ Created: ${user.email} (${user.role})`);
    }

    console.log('\n========================================');
    console.log('✅ ALL USERS CREATED SUCCESSFULLY!');
    console.log('========================================\n');
    console.log('DEFAULT CREDENTIALS:');
    for (const { email, password, role } of users) {
      console.log(`- ${email} (${role}) -> ${password}`);
    }
    console.log('\n🌐 Login di: https://app.hanmarine.co/auth/signin');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createUsers()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
