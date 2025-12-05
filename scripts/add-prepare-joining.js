// scripts/add-prepare-joining.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Adding prepare joining data...');

  // Create prepare joining for approved replacement
  await prisma.prepareJoining.upsert({
    where: { id: 1 },
    update: {},
    create: {
      replacementId: 2,
      vesselType: 'TANKER',
      status: 'IN_PROGRESS',
      visaRequired: true,
      visaStatus: 'APPROVED',
      flagCertificate: true,
      flagCertStatus: 'APPROVED',
      medicalCheck: true,
      medicalStatus: 'PASSED',
      cocCertificate: true,
      cocStatus: 'APPROVED',
      copCertificate: true,
      copStatus: 'APPROVED',
      bstCertificate: true,
      bstStatus: 'APPROVED',
      gocCertificate: true,
      gocStatus: 'APPROVED',
      koreaLicense: false,
      kmlCertificate: false,
      ticketReady: true,
      overallStatus: 'READY_TO_JOIN',
    },
  });

  console.log('Done adding prepare joining ✅');
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