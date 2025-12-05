/**
 * Script to clean all dummy data from HIMS
 * Keep only: Users, System config
 * Delete: All crew, principals, vessels, applications, contracts, documents
 */

const { PrismaClient } = require('@prisma/client');
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

    console.log('Deleting Crew Replacements...');
    const replacements = await prisma.crewReplacement.deleteMany({});
    console.log(`✅ Deleted ${replacements.count} crew replacements`);

    console.log('Deleting Monthly Checklists...');
    const checklists = await prisma.monthlyChecklist.deleteMany({});
    console.log(`✅ Deleted ${checklists.count} monthly checklists`);

    console.log('Deleting External Compliance records...');
    const compliance = await prisma.externalCompliance.deleteMany({});
    console.log(`✅ Deleted ${compliance.count} external compliance records`);

    console.log('Deleting Crew List entries...');
    const crewList = await prisma.crewList.deleteMany({});
    console.log(`✅ Deleted ${crewList.count} crew list entries`);

    console.log('Deleting Disciplinary records...');
    const disciplinary = await prisma.disciplinary.deleteMany({});
    console.log(`✅ Deleted ${disciplinary.count} disciplinary records`);

    console.log('Deleting Recruitment records...');
    const recruitment = await prisma.recruitment.deleteMany({});
    console.log(`✅ Deleted ${recruitment.count} recruitment records`);

    console.log('Deleting Orientation records...');
    const orientation = await prisma.orientation.deleteMany({});
    console.log(`✅ Deleted ${orientation.count} orientation records`);

    console.log('Deleting Crew...');
    const crew = await prisma.crew.deleteMany({});
    console.log(`✅ Deleted ${crew.count} crew members`);

    console.log('Deleting Vessels...');
    const vessels = await prisma.vessel.deleteMany({});
    console.log(`✅ Deleted ${vessels.count} vessels`);

    console.log('Deleting Wage Scales...');
    const wageScales = await prisma.wageScale.deleteMany({});
    console.log(`✅ Deleted ${wageScales.count} wage scales`);

    console.log('Deleting Agency Fees...');
    const agencyFees = await prisma.agencyFee.deleteMany({});
    console.log(`✅ Deleted ${agencyFees.count} agency fees`);

    console.log('Deleting Agency Agreements...');
    const agencyAgreements = await prisma.agencyAgreement.deleteMany({});
    console.log(`✅ Deleted ${agencyAgreements.count} agency agreements`);

    console.log('Deleting Insurance records...');
    const insurance = await prisma.insurance.deleteMany({});
    console.log(`✅ Deleted ${insurance.count} insurance records`);

    console.log('Deleting Principals...');
    const principals = await prisma.principal.deleteMany({});
    console.log(`✅ Deleted ${principals.count} principals`);

    console.log('\n✨ Data cleanup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Kept: ${await prisma.user.count()} users`);
    console.log(`   - Ready for fresh data input`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanData()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
