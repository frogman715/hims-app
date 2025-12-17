import {
  PrismaClient,
  Role,
  QualityDocumentStatus,
  WorkflowStatus,
  AcknowledgementStatus,
  PermissionAccessLevel
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowProductionSeed = process.env.ALLOW_PRODUCTION_SEED === 'true';

  if (isProduction && !allowProductionSeed) {
    throw new Error(
      'Seed aborted: ALLOW_PRODUCTION_SEED=true is required when NODE_ENV=production.'
    );
  }

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
      role: Role.DIRECTOR, // kalau mau bikin role khusus admin, nanti bisa diubah
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
    {
      name: 'Quality Manager',
      email: 'qmr@hanmarine.co',
      password: 'qmr2025',
      role: Role.QMR,
    },
    {
      name: 'HR Admin Lead',
      email: 'hr-admin@hanmarine.co',
      password: 'hradmin2025',
      role: Role.HR_ADMIN,
    },
    {
      name: 'Section Head Ops',
      email: 'section.head@hanmarine.co',
      password: 'section2025',
      role: Role.SECTION_HEAD,
    },
    {
      name: 'HGQS Staff',
      email: 'staff@hanmarine.co',
      password: 'staff2025',
      role: Role.STAFF,
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

  const director = await prisma.user.findUnique({ where: { email: 'rinaldy@hanmarine.co' } });
  const qmr = await prisma.user.findUnique({ where: { email: 'qmr@hanmarine.co' } });

  if (!director || !qmr) {
    throw new Error('Baseline users missing for HGQS seed');
  }

  await prisma.hgqsManualVersion.upsert({
    where: {
      docNumber_revisionNumber: {
        docNumber: 'HGQS-MAN-001',
        revisionNumber: 'R1',
      },
    },
    update: {
      status: QualityDocumentStatus.ACTIVE,
      effectiveDate: new Date('2025-01-01'),
      summary: 'Quality Management System manual baseline seed',
      notes: 'Seeded initial manual version for HGQS rollout',
      approvedByUserId: director.id,
    },
    create: {
      docNumber: 'HGQS-MAN-001',
      title: 'Quality Management System Manual',
      revisionNumber: 'R1',
      status: QualityDocumentStatus.ACTIVE,
      effectiveDate: new Date('2025-01-01'),
      fileUrl: '/hgqs/manuals/HGQS-MAN-001-R1.pdf',
      summary: 'Quality Management System manual baseline seed',
      notes: 'Seeded initial manual version for HGQS rollout',
      createdById: qmr.id,
      uploadedByUserId: qmr.id,
      approvedByUserId: director.id,
    },
  });

  await prisma.hgqsProcedure.upsert({
    where: { procedureCode: 'HGQS-PR-001' },
    update: {
      status: QualityDocumentStatus.ACTIVE,
      tags: ['DOCUMENT_CONTROL', 'QMS'],
    },
    create: {
      procedureCode: 'HGQS-PR-001',
      title: 'Document Control Procedure',
      department: 'Quality',
      controlNumber: 'QMS-01',
      description: 'Establishes controls for issuing, revising, and archiving quality documents.',
      fileUrl: '/hgqs/procedures/HGQS-PR-001.pdf',
      status: QualityDocumentStatus.ACTIVE,
      tags: ['DOCUMENT_CONTROL', 'QMS'],
      ownerId: qmr.id,
      createdById: qmr.id,
    },
  });

  await prisma.hgqsGuideline.upsert({
    where: { slug: 'hgqs-crew-safety-briefing' },
    update: {
      status: QualityDocumentStatus.ACTIVE,
      content: 'Crew safety briefing guideline v1.0',
    },
    create: {
      slug: 'hgqs-crew-safety-briefing',
      title: 'Crew Safety Briefing',
      version: 'v1.0',
      status: QualityDocumentStatus.ACTIVE,
      content: 'Crew safety briefing guideline v1.0',
      fileUrl: '/hgqs/guidelines/HGQS-GD-001.pdf',
      acknowledgementRequired: true,
      ownerId: qmr.id,
      createdById: qmr.id,
    },
  });

  await prisma.hgqsGuidelineAssignment.upsert({
    where: { id: 'seed-assignment-crew-safety' },
    update: {
      status: WorkflowStatus.REVIEWED,
    },
    create: {
      id: 'seed-assignment-crew-safety',
      guideline: {
        connect: { slug: 'hgqs-crew-safety-briefing' },
      },
      assignedBy: { connect: { id: director.id } },
      createdBy: { connect: { id: director.id } },
      assignedToRole: Role.SECTION_HEAD,
      dueDate: new Date('2025-02-01'),
      note: 'Initial distribution to section heads',
      status: WorkflowStatus.SUBMITTED,
    },
  });

  const safetyGuideline = await prisma.hgqsGuideline.findUniqueOrThrow({
    where: { slug: 'hgqs-crew-safety-briefing' },
    select: { id: true },
  });

  await prisma.hgqsPolicyAcknowledgement.upsert({
    where: {
      guidelineId_assigneeId: {
        guidelineId: safetyGuideline.id,
        assigneeId: qmr.id,
      },
    },
    update: {
      status: AcknowledgementStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date('2025-01-05'),
      acknowledgedById: director.id,
    },
    create: {
      guideline: { connect: { slug: 'hgqs-crew-safety-briefing' } },
      assignee: { connect: { id: qmr.id } },
      status: AcknowledgementStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date('2025-01-05'),
      acknowledgedBy: { connect: { id: director.id } },
      createdBy: { connect: { id: director.id } },
      signature: 'seed-signature-qmr',
      notes: 'Seed acknowledgement for baseline guideline',
    },
  });

  const MODULES = [
    'dashboard',
    'crew',
    'principals',
    'contracts',
    'applications',
    'assignments',
    'vessels',
    'documents',
    'medical',
    'visas',
    'agencyFees',
    'accounting',
    'wageScales',
    'agencyAgreements',
    'disciplinary',
    'quality',
    'nationalHolidays',
    'compliance',
    'crewing',
    'insurance',
    'dispatches',
    'pkl',
  ] as const;

  const matrix: Partial<Record<Role, Record<(typeof MODULES)[number], PermissionAccessLevel>>> = {
    [Role.DIRECTOR]: Object.fromEntries(
      MODULES.map((module) => [module, PermissionAccessLevel.FULL_ACCESS])
    ) as Record<(typeof MODULES)[number], PermissionAccessLevel>,
    [Role.QMR]: {
      dashboard: PermissionAccessLevel.FULL_ACCESS,
      crew: PermissionAccessLevel.VIEW_ACCESS,
      principals: PermissionAccessLevel.VIEW_ACCESS,
      contracts: PermissionAccessLevel.VIEW_ACCESS,
      applications: PermissionAccessLevel.VIEW_ACCESS,
      assignments: PermissionAccessLevel.VIEW_ACCESS,
      vessels: PermissionAccessLevel.VIEW_ACCESS,
      documents: PermissionAccessLevel.EDIT_ACCESS,
      medical: PermissionAccessLevel.VIEW_ACCESS,
      visas: PermissionAccessLevel.VIEW_ACCESS,
      agencyFees: PermissionAccessLevel.NO_ACCESS,
      accounting: PermissionAccessLevel.NO_ACCESS,
      wageScales: PermissionAccessLevel.VIEW_ACCESS,
      agencyAgreements: PermissionAccessLevel.VIEW_ACCESS,
      disciplinary: PermissionAccessLevel.EDIT_ACCESS,
      quality: PermissionAccessLevel.FULL_ACCESS,
      nationalHolidays: PermissionAccessLevel.VIEW_ACCESS,
      compliance: PermissionAccessLevel.FULL_ACCESS,
      crewing: PermissionAccessLevel.VIEW_ACCESS,
      insurance: PermissionAccessLevel.VIEW_ACCESS,
      dispatches: PermissionAccessLevel.VIEW_ACCESS,
      pkl: PermissionAccessLevel.VIEW_ACCESS,
    },
    [Role.HR_ADMIN]: {
      dashboard: PermissionAccessLevel.FULL_ACCESS,
      crew: PermissionAccessLevel.FULL_ACCESS,
      principals: PermissionAccessLevel.VIEW_ACCESS,
      contracts: PermissionAccessLevel.EDIT_ACCESS,
      applications: PermissionAccessLevel.FULL_ACCESS,
      assignments: PermissionAccessLevel.FULL_ACCESS,
      vessels: PermissionAccessLevel.VIEW_ACCESS,
      documents: PermissionAccessLevel.FULL_ACCESS,
      medical: PermissionAccessLevel.FULL_ACCESS,
      visas: PermissionAccessLevel.EDIT_ACCESS,
      agencyFees: PermissionAccessLevel.NO_ACCESS,
      accounting: PermissionAccessLevel.NO_ACCESS,
      wageScales: PermissionAccessLevel.VIEW_ACCESS,
      agencyAgreements: PermissionAccessLevel.VIEW_ACCESS,
      disciplinary: PermissionAccessLevel.FULL_ACCESS,
      quality: PermissionAccessLevel.EDIT_ACCESS,
      nationalHolidays: PermissionAccessLevel.FULL_ACCESS,
      compliance: PermissionAccessLevel.EDIT_ACCESS,
      crewing: PermissionAccessLevel.FULL_ACCESS,
      insurance: PermissionAccessLevel.EDIT_ACCESS,
      dispatches: PermissionAccessLevel.VIEW_ACCESS,
      pkl: PermissionAccessLevel.FULL_ACCESS,
    },
    [Role.ACCOUNTING]: {
      dashboard: PermissionAccessLevel.FULL_ACCESS,
      crew: PermissionAccessLevel.VIEW_ACCESS,
      principals: PermissionAccessLevel.VIEW_ACCESS,
      contracts: PermissionAccessLevel.FULL_ACCESS,
      applications: PermissionAccessLevel.NO_ACCESS,
      assignments: PermissionAccessLevel.NO_ACCESS,
      vessels: PermissionAccessLevel.VIEW_ACCESS,
      documents: PermissionAccessLevel.VIEW_ACCESS,
      medical: PermissionAccessLevel.NO_ACCESS,
      visas: PermissionAccessLevel.NO_ACCESS,
      agencyFees: PermissionAccessLevel.FULL_ACCESS,
      accounting: PermissionAccessLevel.FULL_ACCESS,
      wageScales: PermissionAccessLevel.FULL_ACCESS,
      agencyAgreements: PermissionAccessLevel.EDIT_ACCESS,
      disciplinary: PermissionAccessLevel.NO_ACCESS,
      quality: PermissionAccessLevel.NO_ACCESS,
      nationalHolidays: PermissionAccessLevel.VIEW_ACCESS,
      compliance: PermissionAccessLevel.NO_ACCESS,
      crewing: PermissionAccessLevel.VIEW_ACCESS,
      insurance: PermissionAccessLevel.VIEW_ACCESS,
      dispatches: PermissionAccessLevel.VIEW_ACCESS,
      pkl: PermissionAccessLevel.VIEW_ACCESS,
    },
    [Role.SECTION_HEAD]: {
      dashboard: PermissionAccessLevel.VIEW_ACCESS,
      crew: PermissionAccessLevel.VIEW_ACCESS,
      principals: PermissionAccessLevel.NO_ACCESS,
      contracts: PermissionAccessLevel.NO_ACCESS,
      applications: PermissionAccessLevel.NO_ACCESS,
      assignments: PermissionAccessLevel.VIEW_ACCESS,
      vessels: PermissionAccessLevel.VIEW_ACCESS,
      documents: PermissionAccessLevel.VIEW_ACCESS,
      medical: PermissionAccessLevel.NO_ACCESS,
      visas: PermissionAccessLevel.NO_ACCESS,
      agencyFees: PermissionAccessLevel.NO_ACCESS,
      accounting: PermissionAccessLevel.NO_ACCESS,
      wageScales: PermissionAccessLevel.NO_ACCESS,
      agencyAgreements: PermissionAccessLevel.NO_ACCESS,
      disciplinary: PermissionAccessLevel.VIEW_ACCESS,
      quality: PermissionAccessLevel.EDIT_ACCESS,
      nationalHolidays: PermissionAccessLevel.VIEW_ACCESS,
      compliance: PermissionAccessLevel.EDIT_ACCESS,
      crewing: PermissionAccessLevel.VIEW_ACCESS,
      insurance: PermissionAccessLevel.NO_ACCESS,
      dispatches: PermissionAccessLevel.VIEW_ACCESS,
      pkl: PermissionAccessLevel.VIEW_ACCESS,
    },
    [Role.STAFF]: {
      dashboard: PermissionAccessLevel.VIEW_ACCESS,
      crew: PermissionAccessLevel.VIEW_ACCESS,
      principals: PermissionAccessLevel.NO_ACCESS,
      contracts: PermissionAccessLevel.NO_ACCESS,
      applications: PermissionAccessLevel.NO_ACCESS,
      assignments: PermissionAccessLevel.NO_ACCESS,
      vessels: PermissionAccessLevel.NO_ACCESS,
      documents: PermissionAccessLevel.VIEW_ACCESS,
      medical: PermissionAccessLevel.NO_ACCESS,
      visas: PermissionAccessLevel.NO_ACCESS,
      agencyFees: PermissionAccessLevel.NO_ACCESS,
      accounting: PermissionAccessLevel.NO_ACCESS,
      wageScales: PermissionAccessLevel.NO_ACCESS,
      agencyAgreements: PermissionAccessLevel.NO_ACCESS,
      disciplinary: PermissionAccessLevel.NO_ACCESS,
      quality: PermissionAccessLevel.VIEW_ACCESS,
      nationalHolidays: PermissionAccessLevel.VIEW_ACCESS,
      compliance: PermissionAccessLevel.VIEW_ACCESS,
      crewing: PermissionAccessLevel.NO_ACCESS,
      insurance: PermissionAccessLevel.NO_ACCESS,
      dispatches: PermissionAccessLevel.NO_ACCESS,
      pkl: PermissionAccessLevel.NO_ACCESS,
    },
  };

  const prioritizedRoles: Role[] = [
    Role.DIRECTOR,
    Role.QMR,
    Role.HR_ADMIN,
    Role.ACCOUNTING,
    Role.SECTION_HEAD,
    Role.STAFF,
  ];

  for (const role of prioritizedRoles) {
    const modules = (matrix[role] ?? {}) as Record<(typeof MODULES)[number], PermissionAccessLevel>;
    for (const moduleKey of MODULES) {
      const level = modules[moduleKey] ?? PermissionAccessLevel.NO_ACCESS;
      await prisma.roleModulePermission.upsert({
        where: {
          role_moduleKey: {
            role,
            moduleKey,
          },
        },
        update: {
          level,
        },
        create: {
          role,
          moduleKey,
          level,
          createdById: director.id,
        },
      });
    }
  }

  console.log('Permission matrix seeded for priority roles');

  console.log('HGQS baseline data seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
