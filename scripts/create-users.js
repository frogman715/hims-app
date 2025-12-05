const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Initialize Prisma Client
const prisma = new PrismaClient();

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

    // Hash password: "admin123" untuk semua user (easy to remember)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const users = [
      {
        id: 'clxuser001admin',
        email: 'admin@hanmarine.co',
        name: 'Administrator',
        role: 'DIRECTOR',
        password: hashedPassword
      },
      {
        id: 'clxuser002rinaldy',
        email: 'rinaldy@hanmarine.co',
        name: 'Rinaldy Anwar (Director)',
        role: 'DIRECTOR',
        password: hashedPassword
      },
      {
        id: 'clxuser003arief',
        email: 'arief@hanmarine.co',
        name: 'Arief Setiawan (Accounting)',
        role: 'ACCOUNTING',
        password: hashedPassword
      },
      {
        id: 'clxuser004dino',
        email: 'dino@hanmarine.co',
        name: 'Dino Prasetyo (Operational)',
        role: 'OPERATIONAL',
        password: hashedPassword
      },
      {
        id: 'clxuser005cdmo',
        email: 'cdmo@hanmarine.co',
        name: 'CDMO Manager',
        role: 'CDMO',
        password: hashedPassword
      },
      {
        id: 'clxuser006hr',
        email: 'hr@hanmarine.co',
        name: 'HR Manager',
        role: 'HR',
        password: hashedPassword
      },
      {
        id: 'clxuser007crew',
        email: 'crew@hanmarine.co',
        name: 'Crew Portal User',
        role: 'CREW_PORTAL',
        password: hashedPassword
      },
      {
        id: 'clxuser008auditor',
        email: 'auditor@hanmarine.co',
        name: 'Quality Auditor',
        role: 'HR', // Use HR role for auditor
        password: hashedPassword
      }
    ];

    // Create users
    for (const userData of users) {
      const user = await prisma.user.create({
        data: userData
      });
      console.log(`✅ Created: ${user.email} (${user.role})`);
    }

    console.log('\n========================================');
    console.log('✅ ALL USERS CREATED SUCCESSFULLY!');
    console.log('========================================\n');
    console.log('LOGIN CREDENTIALS (untuk semua user):');
    console.log('');
    console.log('Email: admin@hanmarine.co');
    console.log('Password: admin123');
    console.log('');
    console.log('Email: rinaldy@hanmarine.co');
    console.log('Password: admin123');
    console.log('');
    console.log('Email: arief@hanmarine.co');
    console.log('Password: admin123');
    console.log('');
    console.log('... (semua user pakai password: admin123)');
    console.log('');
    console.log('🌐 Login di: http://localhost:3000/auth/signin');
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
