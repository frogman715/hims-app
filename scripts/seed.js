/ scripts/seed.js
require('dotenv').config();

const { Role } = require('@prisma/client');
const { prisma } = require('./prismaClient');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Seeding HIMS users...');

  const users = [
    {
      name: 'Rinaldy (Director)',
      email: 'rinaldy@hanmarine.co',
      password: 'director2025',
      role: Role.DIRECTOR,
      isSystemAdmin: true,
    },
    {
      name: 'Arief',
      email: 'arief@hanmarine.co',
      password: 'admin2025',
      role: Role.DIRECTOR,
    },
    {
      name: 'Dino (Accounting)',
      email: 'dino@hanmarine.co',
      password: 'accounting2025',
      role: Role.ACCOUNTING,
    },
    {
      name: 'CDMO',
      email: 'cdmo@hanmarine.co',
      password: 'cdmo123',
      role: Role.CDMO,
    },
    {
      name: 'Operational Manager',
      email: 'operational@hanmarine.co',
      password: 'operational123',
      role: Role.OPERATIONAL,
    },
    {
      name: 'HR Officer',
      email: 'hr@hanmarine.co',
      password: 'hr123',
      role: Role.HR,
    },
    {
      name: 'Crew Portal',
      email: 'crew@hanmarine.co',
      password: 'crew2025',
      role: Role.CREW_PORTAL,
    },
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
