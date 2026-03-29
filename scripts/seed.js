// scripts/seed.js
require('dotenv').config();

const { Role } = require('@prisma/client');
const { prisma } = require('./prismaClient');
const bcrypt = require('bcryptjs');

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
  console.error('Seed script is blocked in production. Set ALLOW_PRODUCTION_SEED=true only for controlled recovery.');
  process.exit(1);
}

async function main() {
  console.log('Seeding HIMS users...');

const users = [
  {
    name: 'Director HGI',
    email: 'director@hanmarine.co',
    password: 'Director2026!',
    role: Role.DIRECTOR,
    isSystemAdmin: false,
  },
  {
    name: 'Owner HGI',
    email: 'owner@hanmarine.co',
    password: 'Owner2026!',
    role: Role.DIRECTOR,
    isSystemAdmin: false,
  },
  {
    name: 'Accounting HGI',
    email: 'accounting@hanmarine.co',
    password: 'Accounting2026!',
    role: Role.ACCOUNTING,
    isSystemAdmin: false,
  },
  {
    name: 'Document Staff HGI',
    email: 'document@hanmarine.co',
    password: 'Document2026!',
    role: Role.CDMO,
    isSystemAdmin: false,
  },
  {
    name: 'Operational Staff HGI',
    email: 'operational@hanmarine.co',
    password: 'Operational2026!',
    role: Role.OPERATIONAL,
    isSystemAdmin: false,
  },
  {
    name: 'Admin HGI',
    email: 'admin@hanmarine.co',
    password: 'Admin2026!',
    role: Role.HR_ADMIN,
    isSystemAdmin: true,
  }
]; 

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        isSystemAdmin: u.isSystemAdmin ?? false,
        isActive: true,
        password: hashed,
      },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        isSystemAdmin: u.isSystemAdmin ?? false,
        isActive: true,
        password: hashed,
      },
    });
  }

  console.log('Seed users inserted/updated');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
