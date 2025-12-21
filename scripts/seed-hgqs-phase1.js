// scripts/seed-hgqs-phase1.js
// Seed sample Risk and Audit data for Phase 1D demo
// Run: node scripts/seed-hgqs-phase1.js

require('dotenv').config();

const { $Enums } = require('@prisma/client');
const { prisma } = require('./prismaClient');

async function main() {
  console.log("🌱 Seeding HGQS Phase 1 Demo Data...");

  // Get a user to be the creator (using DIRECTOR role as QMR proxy)
  const creator = await prisma.user.findFirst({
    where: { role: "DIRECTOR" },
  });

  if (!creator) {
    console.error("❌ No user found in database. Please run seed-users first.");
    process.exit(1);
  }

  console.log(`✓ Using creator: ${creator.email}`);

  // Create sample risks with proper scoring
  const risks = [];

  // Risk 1: Loss of Key Personnel
  const risk1 = await prisma.risk.create({
    data: {
      title: "Loss of Key Personnel",
      description: "Key technical staff retirement could disrupt design control and quality assurance operations",
      source: "OPERATIONAL",
      probability: 3, // Possible
      impact: 4, // Major
      riskScore: 3 * 4, // 12 = Yellow
      status: "ACTIVE",
      treatmentStrategy: "MITIGATE",
      treatmentPlan: "Cross-train junior staff on critical quality procedures and create documentation",
      createdById: creator.id,
    },
  });
  risks.push(risk1);
  console.log(`✓ Created risk 1: ${risk1.title} (Score: ${risk1.riskScore})`);

  // Risk 2: Design Control Gaps
  const risk2 = await prisma.risk.create({
    data: {
      title: "Design Control Procedure Gaps",
      description: "Current design review documentation does not fully meet regulatory requirements",
      source: "REGULATORY",
      probability: 4, // Likely
      impact: 5, // Catastrophic
      riskScore: 4 * 5, // 20 = Red
      status: "ACTIVE",
      treatmentStrategy: "MITIGATE",
      treatmentPlan: "Update design control SOP and conduct internal audit",
      createdById: creator.id,
    },
  });
  risks.push(risk2);
  console.log(`✓ Created risk 2: ${risk2.title} (Score: ${risk2.riskScore})`);

  // Risk 3: Supplier Quality Control
  const risk3 = await prisma.risk.create({
    data: {
      title: "Supplier Quality Records",
      description: "Inadequate supplier quality agreement and record retention procedures",
      source: "OPERATIONAL",
      probability: 2, // Unlikely
      impact: 3, // Moderate
      riskScore: 2 * 3, // 6 = Green
      status: "ACCEPTED",
      treatmentStrategy: "ACCEPT",
      treatmentPlan: "Monitor supplier performance quarterly, accept residual risk",
      createdById: creator.id,
    },
  });
  risks.push(risk3);
  console.log(`✓ Created risk 3: ${risk3.title} (Score: ${risk3.riskScore})`);

  // Add audit logs for each risk
  for (const risk of risks) {
    await prisma.riskAuditLog.create({
      data: {
        riskId: risk.id,
        action: "CREATED",
        changedFields: {
          title: risk.title,
          riskScore: risk.riskScore,
          status: risk.status,
        },
        changedById: creator.id,
      },
    });
  }
  console.log(`✓ Added audit logs for ${risks.length} risks`);

  // Add a sample action to the first risk
  const action = await prisma.riskAction.create({
    data: {
      riskId: risks[0].id,
      description: "Schedule cross-training sessions for junior staff",
      owner: creator.id,
      status: "PENDING",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });
  console.log(`✓ Added action to risk 1: ${action.description}`);

  // Create sample audit schedules
  const audits = [];

  // Audit 1: Design Control Audit
  const audit1 = await prisma.auditSchedule.create({
    data: {
      title: "Design Control Audit",
      description: "Audit of design review, approval, and documentation procedures",
      auditType: "INTERNAL_QMS",
      frequency: "ANNUAL",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "PLANNED",
      auditors: [creator.id],
      auditees: ["design-team@hanmarine.co"],
    },
  });
  audits.push(audit1);
  console.log(`✓ Created audit 1: ${audit1.title}`);

  // Audit 2: Supplier Quality Audit
  const audit2 = await prisma.auditSchedule.create({
    data: {
      title: "Supplier Quality Management Audit",
      description: "Audit of supplier agreements, quality records, and monitoring",
      auditType: "SURVEILLANCE",
      frequency: "ANNUAL",
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: "PLANNED",
      auditors: [creator.id],
      auditees: ["procurement@hanmarine.co"],
    },
  });
  audits.push(audit2);
  console.log(`✓ Created audit 2: ${audit2.title}`);

  // Add sample finding to first audit
  const finding = await prisma.auditFinding.create({
    data: {
      scheduleId: audits[0].id,
      findingNumber: `AUD-2025-001`,
      clause: "8.3.3",
      description: "Design review records retained for only 6 months instead of required 3 years",
      severity: "MAJOR_NC",
      evidence: ["Design Review File CR-2024-001: Records marked for deletion", "Archive folder shows 6-month cutoff"],
    },
  });
  console.log(`✓ Added finding to audit 1: ${finding.findingNumber}`);

  // Add sample audit report to first audit
  const report = await prisma.auditReport.create({
    data: {
      scheduleId: audits[0].id,
      reportNumber: `AUD-RPT-2025-001`,
      summary: "Audit revealed 1 major non-conformance requiring corrective action",
      recommendations: "1. Update design review retention policy to 3 years\n2. Implement automated archival\n3. Train staff on procedures",
      findings: {
        majorNC: 1,
        minorNC: 0,
        observations: 2,
      },
      status: "GENERATED",
    },
  });
  console.log(`✓ Generated audit report: ${report.reportNumber}`);

  console.log("\n✨ HGQS Phase 1 demo data seeded successfully!");
  console.log(`   - ${risks.length} risks created`);
  console.log(`   - ${audits.length} audit schedules created`);
  console.log(`   - 1 audit finding created`);
  console.log(`   - 1 audit report generated`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
