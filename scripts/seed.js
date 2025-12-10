// scripts/seed.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding HIMS basic data...');

  // Roles are enums, no need to create them in database

  // Realign legacy demo accounts that previously used the hims.com domain
  const legacyEmailMappings = [
    { from: 'cdmo@hims.com', to: 'cdmo@hanmarine.com' },
    { from: 'director@hims.com', to: 'director@hanmarine.com' },
    { from: 'operational@hims.com', to: 'operational@hanmarine.com' },
    { from: 'accounting@hims.com', to: 'accounting@hanmarine.com' },
    { from: 'hr@hims.com', to: 'hr@hanmarine.com' },
    { from: 'crew@hims.com', to: 'crew@hanmarine.com' },
  ];
  for (const mapping of legacyEmailMappings) {
    await prisma.user
      .update({
        where: { email: mapping.from },
        data: { email: mapping.to },
      })
      .catch(() => undefined);
  }

  // Create main admin user (DIRECTOR role with full access)
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@hanmarine.com' },
    update: {},
    create: {
      email: 'admin@hanmarine.com',
      name: 'Admin Hanmarine',
      password: adminPassword,
      role: 'DIRECTOR',
    },
  });

  // Create system admin user (CDMO)
  const systemAdminPassword = await bcrypt.hash('cdmo123', 10);
  const systemAdminUser = await prisma.user.upsert({
    where: { email: 'cdmo@hanmarine.com' },
    update: {},
    create: {
      email: 'cdmo@hanmarine.com',
      name: 'CDMO Administrator',
      password: systemAdminPassword,
      role: 'CDMO',
      isSystemAdmin: true, // System admin override
    },
  });

  // Create Director user
  const directorPassword = await bcrypt.hash('director123', 10);
  await prisma.user.upsert({
    where: { email: 'director@hanmarine.com' },
    update: {},
    create: {
      email: 'director@hanmarine.com',
      name: 'Director',
      password: directorPassword,
      role: 'DIRECTOR',
    },
  });

  // Create Accounting user
  const accountingPassword = await bcrypt.hash('accounting123', 10);
  await prisma.user.upsert({
    where: { email: 'accounting@hanmarine.com' },
    update: {},
    create: {
      email: 'accounting@hanmarine.com',
      name: 'Accounting Officer',
      password: accountingPassword,
      role: 'ACCOUNTING',
    },
  });

  // Create Operational user
  const operationalPassword = await bcrypt.hash('operational123', 10);
  await prisma.user.upsert({
    where: { email: 'operational@hanmarine.com' },
    update: {},
    create: {
      email: 'operational@hanmarine.com',
      name: 'Operational Manager',
      password: operationalPassword,
      role: 'OPERATIONAL',
    },
  });

  // Create HR user
  const hrPassword = await bcrypt.hash('hr123', 10);
  await prisma.user.upsert({
    where: { email: 'hr@hanmarine.com' },
    update: {},
    create: {
      email: 'hr@hanmarine.com',
      name: 'HR Officer',
      password: hrPassword,
      role: 'HR',
    },
  });

  // Create Crew Portal user
  const crewPortalPassword = await bcrypt.hash('crew123', 10);
  await prisma.user.upsert({
    where: { email: 'crew@hanmarine.com' },
    update: {},
    create: {
      email: 'crew@hanmarine.com',
      name: 'Crew Portal User',
      password: crewPortalPassword,
      role: 'CREW_PORTAL',
    },
  });

  // Create principal and vessel
  const principal = await prisma.principal.upsert({
    where: { id: 'principal-1' },
    update: {},
    create: {
      id: 'principal-1',
      name: 'Lundqvist Rederierna',
      address: 'Finland',
      country: 'Finland',
    },
  });

  const vessel = await prisma.vessel.upsert({
    where: { id: 'vessel-1' },
    update: {},
    create: {
      id: 'vessel-1',
      name: 'MT Alfa Finlandia',
      flag: 'INDONESIA',
      type: 'TANKER',
    },
  });

  // Create sample documents - some expired, some expiring soon
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const fifteenDaysFromNow = new Date();
  fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);

  // Create sample seafarers
  const s1 = await prisma.crew.upsert({
    where: { id: 'crew-1' },
    update: {},
    create: {
      id: 'crew-1',
      fullName: 'Budi Santoso',
      rank: 'Captain',
      nationality: 'Indonesia',
    },
  });

  const s2 = await prisma.crew.upsert({
    where: { id: 'crew-2' },
    update: {},
    create: {
      id: 'crew-2',
      fullName: 'Ahmad Rahman',
      rank: 'Chief Engineer',
      nationality: 'Indonesia',
    },
  });

  // Create assignments
  await prisma.assignment.upsert({
    where: { id: 'assignment-1' },
    update: {},
    create: {
      id: 'assignment-1',
      crewId: s1.id,
      vesselId: vessel.id,
      principalId: principal.id,
      rank: 'Captain',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-07-15'),
      status: 'ACTIVE',
    },
  });

  await prisma.assignment.upsert({
    where: { id: 'assignment-2' },
    update: {},
    create: {
      id: 'assignment-2',
      crewId: s2.id,
      vesselId: vessel.id,
      principalId: principal.id,
      rank: 'Chief Engineer',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-08-01'),
      status: 'ACTIVE',
    },
  });

  // Create assignment that expires soon (within 30 days)
  await prisma.assignment.upsert({
    where: { id: 'assignment-3' },
    update: {},
    create: {
      id: 'assignment-3',
      crewId: s1.id,
      vesselId: vessel.id,
      principalId: principal.id,
      rank: 'Chief Officer',
      startDate: new Date('2024-10-01'),
      endDate: fifteenDaysFromNow, // Expires in 15 days - should show as expiring soon
      status: 'ACTIVE',
    },
  });

  // Create ex-crew for replacement
  const exCrew = await prisma.crew.upsert({
    where: { id: 'crew-3' },
    update: {},
    create: {
      id: 'crew-3',
      fullName: 'Joko Widodo',
      rank: 'Deck Officer',
      nationality: 'Indonesia',
      status: 'OFF_SIGNED',
    },
  });

  // Create new applicant
  const newApplicant = await prisma.crew.upsert({
    where: { id: 'crew-4' },
    update: {},
    create: {
      id: 'crew-4',
      fullName: 'Siti Aminah',
      rank: 'Chief Officer',
      nationality: 'Indonesia',
      status: 'STANDBY',
    },
  });

  await prisma.application.upsert({
    where: { id: 'application-1' },
    update: {},
    create: {
      id: 'application-1',
      crewId: newApplicant.id,
      position: 'Chief Officer',
      applicationDate: new Date('2024-11-01'),
      status: 'RECEIVED',
    },
  });

  // Create crew replacements for the expiring assignment
  await prisma.crewReplacement.upsert({
    where: { id: 'replacement-1' },
    update: {},
    create: {
      id: 'replacement-1',
      crewId: s1.id,
      replacementCrewId: exCrew.id,
      reason: 'Contract expiry - Chief Officer position',
      status: 'PENDING',
      requestedBy: systemAdminUser.id,
      approvedBy: systemAdminUser.id,
      approvedAt: new Date(),
      remarks: 'Experienced officer, good performance record',
    },
  });

  await prisma.crewReplacement.upsert({
    where: { id: 'replacement-2' },
    update: {},
    create: {
      id: 'replacement-2',
      crewId: s1.id,
      replacementCrewId: newApplicant.id,
      reason: 'Contract expiry - Chief Officer position',
      status: 'PENDING',
      requestedBy: systemAdminUser.id,
      remarks: 'New applicant, needs training',
    },
  });

  // Create sample documents
  // await prisma.prepareJoining.upsert({
  //   where: { id: 1 },
  //   update: {},
  //   create: {
  //     replacementId: 1,
  //     vesselType: 'TANKER',
  //     status: 'IN_PROGRESS',
  //     visaRequired: true,
  //     visaStatus: 'APPROVED',
  //     flagCertificate: true,
  //     flagCertStatus: 'APPROVED',
  //     medicalCheck: true,
  //     medicalStatus: 'PASSED',
  //     cocCertificate: true,
  //     cocStatus: 'APPROVED',
  //     copCertificate: true,
  //     copStatus: 'APPROVED',
  //     bstCertificate: true,
  //     bstStatus: 'APPROVED',
  //     gocCertificate: true,
  //     gocStatus: 'APPROVED',
  //     koreaLicense: false,
  //     kmlCertificate: false,
  //     ticketReady: true,
  //     overallStatus: 'READY_TO_JOIN',
  //   },
  // });

  await prisma.crewDocument.upsert({
    where: { id: 'doc-1' },
    update: {},
    create: {
      id: 'doc-1',
      crewId: s1.id,
      docType: 'PASSPORT',
      docNumber: 'P123456789',
      issueDate: new Date('2023-01-01'),
      expiryDate: fifteenDaysFromNow, // Expires in 15 days - should show as expiring soon
      remarks: 'Main passport',
    },
  });

  await prisma.crewDocument.upsert({
    where: { id: 'doc-2' },
    update: {},
    create: {
      id: 'doc-2',
      crewId: s1.id,
      docType: 'COC',
      docNumber: 'C987654321',
      issueDate: new Date('2022-06-01'),
      expiryDate: thirtyDaysFromNow, // Expires in 30 days - should show as expiring soon
      remarks: 'Certificate of Competency',
    },
  });

  await prisma.crewDocument.upsert({
    where: { id: 'doc-3' },
    update: {},
    create: {
      id: 'doc-3',
      crewId: s2.id,
      docType: 'MEDICAL',
      docNumber: 'M555666777',
      issueDate: new Date('2023-06-01'),
      expiryDate: new Date('2023-12-01'), // Already expired - should show as expired
      remarks: 'Medical fitness certificate',
    },
  });

  console.log('Done seeding ✅');
  console.log('===========================================');
  console.log('LOGIN CREDENTIALS - HANMARINE HIMS:');
  console.log('===========================================');
  console.log('🔑 MAIN ADMIN (DIRECTOR):');
  console.log('   Email: admin@hanmarine.com');
  console.log('   Password: admin123');
  console.log('   Role: DIRECTOR (Full Access)');
  console.log('');
  console.log('🔑 CDMO (System Admin):');
  console.log('   Email: cdmo@hanmarine.com');
  console.log('   Password: cdmo123');
  console.log('   Role: CDMO (Technical Admin)');
  console.log('');
  console.log('🔑 DIRECTOR:');
  console.log('   Email: director@hanmarine.com');
  console.log('   Password: director123');
  console.log('   Role: DIRECTOR');
  console.log('');
  console.log('🔑 OPERATIONAL:');
  console.log('   Email: operational@hanmarine.com');
  console.log('   Password: operational123');
  console.log('   Role: OPERATIONAL');
  console.log('');
  console.log('🔑 ACCOUNTING:');
  console.log('   Email: accounting@hanmarine.com');
  console.log('   Password: accounting123');
  console.log('   Role: ACCOUNTING');
  console.log('');
  console.log('🔑 HR:');
  console.log('   Email: hr@hanmarine.com');
  console.log('   Password: hr123');
  console.log('   Role: HR');
  console.log('');
  console.log('🔑 CREW PORTAL:');
  console.log('   Email: crew@hanmarine.com');
  console.log('   Password: crew123');
  console.log('   Role: CREW_PORTAL');
  console.log('===========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
