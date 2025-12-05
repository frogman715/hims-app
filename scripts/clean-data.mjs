/**
 * Script to clean all dummy data from HIMS
 * Keep only: Users, System config
 * Delete: All crew, principals, vessels, applications, contracts, documents
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanData() {
  console.log('🧹 Starting data cleanup...\n');

  try {
    // Delete in correct order (foreign key constraints)
    
    console.log('Deleting Assignments...');
    const assignments = await prisma.assignment.deleteMany({});
    console.log(`✅ Deleted ${assignments.count} assignments`);

    console.log('Deleting Contracts...');
    const contracts = await prisma.contract.deleteMany({});
    console.log(`✅ Deleted ${contracts.count} contracts`);

    console.log('Deleting Applications...');
    const applications = await prisma.application.deleteMany({});
    console.log(`✅ Deleted ${applications.count} applications`);

    console.log('Deleting Seafarer Documents...');
    const documents = await prisma.seafarerDocument.deleteMany({});
    console.log(`✅ Deleted ${documents.count} documents`);

    console.log('Deleting Crew...');
    const crew = await prisma.crew.deleteMany({});
    console.log(`✅ Deleted ${crew.count} crew members`);

    console.log('Deleting Vessels...');
    const vessels = await prisma.vessel.deleteMany({});
    console.log(`✅ Deleted ${vessels.count} vessels`);

    console.log('Deleting Principals...');
    const principals = await prisma.principal.deleteMany({});
    console.log(`✅ Deleted ${principals.count} principals`);

    console.log('Deleting Wage Scales...');
    const wageScales = await prisma.wageScale.deleteMany({});
    console.log(`✅ Deleted ${wageScales.count} wage scales`);

    console.log('Deleting Agency Fees...');
    const agencyFees = await prisma.agencyFee.deleteMany({});
    console.log(`✅ Deleted ${agencyFees.count} agency fees`);

    console.log('Deleting Insurance...');
    const insurance = await prisma.insurance.deleteMany({});
    console.log(`✅ Deleted ${insurance.count} insurance records`);

    console.log('Deleting Orientations...');
    const orientations = await prisma.orientation.deleteMany({});
    console.log(`✅ Deleted ${orientations.count} orientations`);

    console.log('Deleting Recruitments...');
    const recruitments = await prisma.recruitment.deleteMany({});
    console.log(`✅ Deleted ${recruitments.count} recruitments`);

    console.log('Deleting Procedures...');
    const procedures = await prisma.procedure.deleteMany({});
    console.log(`✅ Deleted ${procedures.count} procedures`);

    console.log('Deleting Audits...');
    const audits = await prisma.audit.deleteMany({});
    console.log(`✅ Deleted ${audits.count} audits`);

    console.log('Deleting External Compliance...');
    const externalCompliance = await prisma.externalCompliance.deleteMany({});
    console.log(`✅ Deleted ${externalCompliance.count} external compliance records`);

    console.log('\n✨ Database cleaned successfully!');
    console.log('Preserved: Users, System configuration\n');

  } catch (error) {
    console.error('❌ Error cleaning data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanData();
