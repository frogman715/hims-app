import type {
  CompletenessSummary,
  CrewDocumentSeed,
  CrewIdentitySeed,
  CrewFolderDefinition,
  HgiRootDefinition,
  IntegrationPhaseDefinition,
  RequiredDocumentDefinition,
  SchemaProposalModel,
} from '@/lib/document-control/types';

export const HGI_ROOT_NAME = 'HGI';

export const DOCUMENT_INTEGRATION_CONFIG = {
  mode: 'REFERENCE_ONLY',
  allowOfficeServerWrites: false,
  allowFolderCreationFromVps: false,
  nextcloudBaseUrl: process.env.NEXT_PUBLIC_NEXTCLOUD_BASE_URL || null,
  templateRoot: `${HGI_ROOT_NAME}/TEMPLATE_CREW`,
  crewRoot: `${HGI_ROOT_NAME}/CREW`,
  inboxRoot: `${HGI_ROOT_NAME}/INBOX_UPLOAD`,
} as const;

export const HGI_ROOTS: readonly HgiRootDefinition[] = [
  {
    key: 'CREW',
    pathSegment: 'CREW',
    owner: 'Crewing',
    purpose: 'Master crew record library containing one controlled folder per crew member.',
  },
  {
    key: 'TEMPLATE_CREW',
    pathSegment: 'TEMPLATE_CREW',
    owner: 'Crewing',
    purpose: 'Locked template structure used when creating or auditing crew folders.',
  },
  {
    key: 'INBOX_UPLOAD',
    pathSegment: 'INBOX_UPLOAD',
    owner: 'Shared Services',
    purpose: 'Temporary intake area for newly received files before classification and filing.',
  },
  {
    key: 'OPERATIONAL',
    pathSegment: 'OPERATIONAL',
    owner: 'Operations',
    purpose: 'Voyage, vessel, dispatch, and operational support documents not owned by crew folders.',
  },
  {
    key: 'ACCOUNTING',
    pathSegment: 'ACCOUNTING',
    owner: 'Accounting',
    purpose: 'Controlled financial records, salary support, invoices, and payment references.',
  },
  {
    key: 'LEGAL',
    pathSegment: 'LEGAL',
    owner: 'Legal',
    purpose: 'Contracts, dispute files, company legal references, and controlled legal correspondence.',
  },
  {
    key: 'SHARED_FORMS',
    pathSegment: 'SHARED_FORMS',
    owner: 'Quality',
    purpose: 'Approved shared forms, checklists, and company-issued document templates.',
  },
  {
    key: 'ARCHIVE',
    pathSegment: 'ARCHIVE',
    owner: 'Shared Services',
    purpose: 'Closed or superseded records retained under controlled archive rules.',
  },
] as const;

export const CREW_FOLDER_STRUCTURE: readonly CrewFolderDefinition[] = [
  {
    key: '00_ADMIN',
    pathSegment: '00_ADMIN',
    purpose: 'Index sheet, folder ownership note, and manual completeness checklist.',
  },
  {
    key: '01_ID_PERSONAL',
    pathSegment: '01_ID_PERSONAL',
    purpose: 'Passport, seaman book, ID, CV, personal profile, and personal master data support files.',
  },
  {
    key: '02_CERTIFICATES',
    pathSegment: '02_CERTIFICATES',
    purpose: 'COC, COE, STCW, tanker, technical, and statutory competency certificates.',
  },
  {
    key: '03_MEDICAL',
    pathSegment: '03_MEDICAL',
    purpose: 'Medical certificates, medical advice, drug and alcohol tests, and vaccination records.',
  },
  {
    key: '04_TRAINING',
    pathSegment: '04_TRAINING',
    purpose: 'Training records, owner training, familiarization, and orientation support documents.',
  },
  {
    key: '05_CONTRACTS',
    pathSegment: '05_CONTRACTS',
    purpose: 'SEA, employment contracts, appendices, and signed contractual correspondence.',
  },
  {
    key: '06_TRAVEL_VISAS',
    pathSegment: '06_TRAVEL_VISAS',
    purpose: 'Visa records, travel clearances, tickets, hotel references, and dispatch travel support.',
  },
  {
    key: '07_ASSIGNMENT',
    pathSegment: '07_ASSIGNMENT',
    purpose: 'Joining package, assignment notes, vessel placement, and dispatch support evidence.',
  },
  {
    key: '08_APPRAISAL',
    pathSegment: '08_APPRAISAL',
    purpose: 'Performance reports, debriefing, disciplinary records, and evaluation follow-up.',
  },
  {
    key: '09_PAYROLL_REFERENCE',
    pathSegment: '09_PAYROLL_REFERENCE',
    purpose: 'Payroll support copies needed by crewing, excluding the accounting master record.',
  },
  {
    key: '10_CORRESPONDENCE',
    pathSegment: '10_CORRESPONDENCE',
    purpose: 'Key email printouts, owner requests, and crew correspondence retained as record.',
  },
  {
    key: '99_ARCHIVE',
    pathSegment: '99_ARCHIVE',
    purpose: 'Superseded or inactive crew documents retained inside the folder before final archive transfer.',
  },
] as const;

export const REQUIRED_CREW_DOCUMENTS: readonly RequiredDocumentDefinition[] = [
  {
    code: 'PASSPORT',
    label: 'Passport',
    category: 'identity',
    requiredFor: 'all-crew',
    acceptedDocTypes: ['PASSPORT', 'PASPOR'],
    requiresExpiry: true,
  },
  {
    code: 'SEAMAN_BOOK',
    label: 'Seaman Book',
    category: 'identity',
    requiredFor: 'all-crew',
    acceptedDocTypes: ['SEAMAN_BOOK', 'SEAMAN BOOK', 'SEAMANBOOK', 'BOOK'],
    requiresExpiry: true,
  },
  {
    code: 'BST',
    label: 'BST',
    category: 'certification',
    requiredFor: 'all-crew',
    acceptedDocTypes: ['BST', 'BASIC_SAFETY_TRAINING'],
    requiresExpiry: true,
  },
  {
    code: 'NATIONAL_MEDICAL_EXAM_CERT',
    label: 'Medical Certificate',
    category: 'medical',
    requiredFor: 'all-crew',
    acceptedDocTypes: [
      'MEDICAL_CERTIFICATE',
      'MEDICAL CERTIFICATE',
      'MEDICAL',
      'MC',
      'MCU',
      'NATIONAL_MEDICAL_EXAM_CERT',
      'FLAG_STATE_MEDICAL_EXAM_CERT',
    ],
    requiresExpiry: true,
  },
  {
    code: 'COC_IJAZAH_NAUTICA',
    label: 'COC / License',
    category: 'certification',
    requiredFor: 'licensed-rank',
    acceptedDocTypes: ['COC', 'IJAZAH', 'LICENSE', 'LICENSE_CERTIFICATE'],
    requiresExpiry: true,
  },
  {
    code: 'COE_ENDORSEMENT',
    label: 'COE / Endorsement',
    category: 'certification',
    requiredFor: 'licensed-rank',
    acceptedDocTypes: ['COE', 'ENDORSEMENT'],
    requiresExpiry: true,
  },
  {
    code: 'AFF',
    label: 'AFF',
    category: 'certification',
    requiredFor: 'licensed-rank',
    acceptedDocTypes: ['AFF', 'ADVANCED_FIRE_FIGHTING'],
    requiresExpiry: true,
  },
  {
    code: 'MEFA',
    label: 'MEFA',
    category: 'certification',
    requiredFor: 'licensed-rank',
    acceptedDocTypes: ['MEFA', 'MEDICAL_FIRST_AID'],
    requiresExpiry: true,
  },
  {
    code: 'SCRB',
    label: 'SCRB',
    category: 'certification',
    requiredFor: 'licensed-rank',
    acceptedDocTypes: ['SCRB', 'SURVIVAL_CRAFT', 'RESCUE_BOAT'],
    requiresExpiry: true,
  },
  {
    code: 'SEA',
    label: 'SEA / Employment Contract',
    category: 'contract',
    requiredFor: 'joining-crew',
    acceptedDocTypes: ['SEA', 'EMPLOYMENT_CONTRACT', 'CONTRACT'],
    requiresExpiry: false,
  },
  {
    code: 'VISA',
    label: 'Visa / Travel Clearance',
    category: 'travel',
    requiredFor: 'joining-crew',
    acceptedDocTypes: ['VISA', 'TRAVEL_CLEARANCE'],
    requiresExpiry: true,
  },
] as const;

export const DOCUMENT_PHASES: readonly IntegrationPhaseDefinition[] = [
  {
    phase: 'PHASE_1',
    title: 'Reference Linking Only',
    scope: [
      'Store office folder path and Nextcloud URL in HIMS.',
      'Show folder planning and document completeness as read-only reference.',
      'Do not create or modify office-server folders from the VPS.',
    ],
    risk: 'Low. Additive metadata only, with no cross-server file operations.',
    implementationApproach: [
      'Add config and naming helpers in the app.',
      'Expose read-only workspace widgets in crew pages.',
      'Keep all office filing actions manual and SOP-driven.',
    ],
    repoAreas: [
      'src/lib/document-control',
      'src/app/crewing/seafarers/[id]/documents/page.tsx',
      'docs/',
      'prisma/schema.prisma (proposal only, no migration yet)',
    ],
  },
  {
    phase: 'PHASE_2',
    title: 'Controlled Folder Creation',
    scope: [
      'Support Create Crew Folder from HIMS.',
      'Track required document completeness and missing items.',
      'Record manual verification checkpoints.',
    ],
    risk: 'Medium. Requires controlled office integration and clear permission boundaries.',
    implementationApproach: [
      'Use an office-side worker or service account, not direct VPS writes.',
      'Create folders from TEMPLATE_CREW only after validation.',
      'Write audit logs for every folder creation or metadata update.',
    ],
    repoAreas: [
      'prisma/schema.prisma',
      'src/app/api/crewing/.../route.ts',
      'src/lib/document-control',
      'src/app/crewing/seafarers/[id]/documents/page.tsx',
    ],
  },
  {
    phase: 'PHASE_3',
    title: 'Automation and Monitoring',
    scope: [
      'Automation, alerts, expiry monitoring, and structured folder generation.',
      'Operational reminders for missing or expiring crew records.',
      'Longer-term document lifecycle reporting.',
    ],
    risk: 'Higher. Automation must be backed by verified data ownership and durable integrations.',
    implementationApproach: [
      'Drive alerts from normalized document status tables, not raw file presence alone.',
      'Use scheduled jobs for expiry and missing-document monitoring.',
      'Keep manual override paths for exceptions and owner-specific requirements.',
    ],
    repoAreas: [
      'scripts/',
      'src/app/api/crewing/documents/...',
      'src/lib/document-control',
      'dashboard and readiness surfaces',
    ],
  },
] as const;

export const DOCUMENT_SCHEMA_PROPOSAL: readonly SchemaProposalModel[] = [
  {
    model: 'CrewDocumentWorkspace',
    purpose: 'Stores the approved office path and Nextcloud URL for one crew member without storing files in HIMS.',
    fields: [
      { name: 'id', type: 'String @id @default(cuid())', nullable: false, purpose: 'Primary key.' },
      { name: 'crewId', type: 'String @unique', nullable: false, purpose: 'One workspace per crew member.' },
      { name: 'officeFolderPath', type: 'String', nullable: true, purpose: 'Manual or generated office document path under HGI.' },
      { name: 'nextcloudUrl', type: 'String', nullable: true, purpose: 'Direct Nextcloud folder link.' },
      { name: 'folderTemplateVersion', type: 'String', nullable: true, purpose: 'Template version used for this workspace.' },
      { name: 'lastReviewedAt', type: 'DateTime', nullable: true, purpose: 'Latest manual completeness or filing review.' },
      { name: 'notes', type: 'String', nullable: true, purpose: 'Controlled operational notes for filing follow-up.' },
    ],
  },
  {
    model: 'CrewDocumentRequirementStatus',
    purpose: 'Tracks per-crew completeness and missing requirements without changing file storage behavior.',
    fields: [
      { name: 'id', type: 'String @id @default(cuid())', nullable: false, purpose: 'Primary key.' },
      { name: 'crewId', type: 'String', nullable: false, purpose: 'Crew owner.' },
      { name: 'documentCode', type: 'String', nullable: false, purpose: 'Requirement code used by the checklist.' },
      { name: 'isRequired', type: 'Boolean @default(true)', nullable: false, purpose: 'Supports owner- or rank-specific rules.' },
      { name: 'isPresent', type: 'Boolean @default(false)', nullable: false, purpose: 'Presence check result.' },
      { name: 'sourceDocumentId', type: 'String', nullable: true, purpose: 'Linked CrewDocument record when matched.' },
      { name: 'expiryDate', type: 'DateTime', nullable: true, purpose: 'Normalized expiry reference for alerts.' },
      { name: 'lastCheckedAt', type: 'DateTime', nullable: true, purpose: 'Latest recomputation or manual review timestamp.' },
    ],
  },
] as const;

function normalizeDocumentCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function includesNormalized(haystack: string, needle: string) {
  return haystack.includes(normalizeDocumentCode(needle));
}

function parseExpiryDate(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateLabel(value: Date | null) {
  if (!value) {
    return 'No expiry date';
  }

  return value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeRank(value: string | null | undefined) {
  return normalizeDocumentCode(value ?? '');
}

function isLicensedRank(rank: string | null | undefined) {
  const normalizedRank = normalizeRank(rank);
  if (!normalizedRank) {
    return false;
  }

  if (normalizedRank.includes('CADET') || normalizedRank.includes('TRAINEE') || normalizedRank.includes('OS') || normalizedRank.includes('AB')) {
    return false;
  }

  return [
    'MASTER',
    'CAPTAIN',
    'OFFICER',
    'MATE',
    'ENGINEER',
    'ELECTRO',
    'ETO',
    'PILOT',
  ].some((token) => normalizedRank.includes(token));
}

function isJoiningCrew(identity?: CrewIdentitySeed | null) {
  if (!identity) {
    return false;
  }

  const assignmentStatuses = (identity.assignments ?? []).map((assignment) => normalizeDocumentCode(assignment.status ?? ''));
  if (assignmentStatuses.some((status) => ['ONBOARD', 'PLANNED', 'ASSIGNED', 'ACTIVE'].includes(status))) {
    return true;
  }

  const crewStatus = normalizeDocumentCode(identity.crewStatus ?? identity.status ?? '');
  return ['ON_BOARD', 'ONBOARD', 'PLANNED', 'ASSIGNED', 'ACTIVE'].includes(crewStatus);
}

export function getRequiredDocumentRules(identity?: CrewIdentitySeed | null) {
  return REQUIRED_CREW_DOCUMENTS.filter((requirement) => {
    switch (requirement.requiredFor) {
      case 'all-crew':
        return true;
      case 'licensed-rank':
        return isLicensedRank(identity?.rank);
      case 'joining-crew':
        return isJoiningCrew(identity);
      default:
        return false;
    }
  });
}

export function summarizeCrewCompleteness(
  documents: readonly CrewDocumentSeed[],
  identity?: CrewIdentitySeed | null,
  referenceDate = new Date()
): CompletenessSummary {
  const threshold = new Date(referenceDate.getTime());
  threshold.setMonth(threshold.getMonth() + 3);

  const missing: string[] = [];
  const needsReview: string[] = [];
  let expiringSoon = 0;
  let expired = 0;
  let present = 0;
  let complete = 0;
  const requirements = getRequiredDocumentRules(identity).map((requirement) => {
    const matchingDocuments = documents.filter((document) => {
      const normalizedType = normalizeDocumentCode(document.docType);
      return requirement.acceptedDocTypes.some((acceptedType) => includesNormalized(normalizedType, acceptedType));
    });

    if (matchingDocuments.length === 0) {
      missing.push(requirement.label);
      return {
        code: requirement.code,
        label: requirement.label,
        category: requirement.category,
        status: 'INCOMPLETE' as const,
        matchedDocumentType: null,
        matchedDocumentId: null,
        expiryDate: null,
        requiresExpiry: requirement.requiresExpiry,
        detail: `${requirement.label} is required but not uploaded.`,
      };
    }

    present += 1;

    const parsedDocuments = matchingDocuments.map((document) => ({
      ...document,
      parsedExpiryDate: parseExpiryDate(document.expiryDate),
    }));

    if (!requirement.requiresExpiry) {
      complete += 1;
      return {
        code: requirement.code,
        label: requirement.label,
        category: requirement.category,
        status: 'COMPLETE' as const,
        matchedDocumentType: matchingDocuments[0].docType,
        matchedDocumentId: 'id' in matchingDocuments[0] && typeof matchingDocuments[0].id === 'string' ? matchingDocuments[0].id : null,
        expiryDate: null,
        requiresExpiry: requirement.requiresExpiry,
        detail: `${requirement.label} is present in uploaded documents.`,
      };
    }

    const validDatedDocuments = parsedDocuments
      .filter((document) => document.parsedExpiryDate instanceof Date)
      .sort((left, right) => (right.parsedExpiryDate?.getTime() ?? 0) - (left.parsedExpiryDate?.getTime() ?? 0));

    if (validDatedDocuments.length === 0) {
      needsReview.push(requirement.label);
      return {
        code: requirement.code,
        label: requirement.label,
        category: requirement.category,
        status: 'NEEDS_REVIEW' as const,
        matchedDocumentType: matchingDocuments[0].docType,
        matchedDocumentId: 'id' in matchingDocuments[0] && typeof matchingDocuments[0].id === 'string' ? matchingDocuments[0].id : null,
        expiryDate: null,
        requiresExpiry: requirement.requiresExpiry,
        detail: `${requirement.label} is uploaded but expiry metadata is missing or invalid.`,
      };
    }

    const bestDocument = validDatedDocuments[0];
    const expiry = bestDocument.parsedExpiryDate;
    if (!expiry) {
      needsReview.push(requirement.label);
      return {
        code: requirement.code,
        label: requirement.label,
        category: requirement.category,
        status: 'NEEDS_REVIEW' as const,
        matchedDocumentType: bestDocument.docType,
        matchedDocumentId: 'id' in bestDocument && typeof bestDocument.id === 'string' ? bestDocument.id : null,
        expiryDate: null,
        requiresExpiry: requirement.requiresExpiry,
        detail: `${requirement.label} needs review before completeness can be confirmed.`,
      };
    }

    if (expiry <= referenceDate) {
      expired += 1;
      return {
        code: requirement.code,
        label: requirement.label,
        category: requirement.category,
        status: 'EXPIRED' as const,
        matchedDocumentType: bestDocument.docType,
        matchedDocumentId: 'id' in bestDocument && typeof bestDocument.id === 'string' ? bestDocument.id : null,
        expiryDate: expiry.toISOString(),
        requiresExpiry: requirement.requiresExpiry,
        detail: `${requirement.label} expired on ${formatDateLabel(expiry)}.`,
      };
    }

    if (expiry <= threshold) {
      expiringSoon += 1;
    }

    complete += 1;
    return {
      code: requirement.code,
      label: requirement.label,
      category: requirement.category,
      status: 'COMPLETE' as const,
      matchedDocumentType: bestDocument.docType,
      matchedDocumentId: 'id' in bestDocument && typeof bestDocument.id === 'string' ? bestDocument.id : null,
      expiryDate: expiry.toISOString(),
      requiresExpiry: requirement.requiresExpiry,
      detail:
        expiry <= threshold
          ? `${requirement.label} is valid but expires on ${formatDateLabel(expiry)}.`
          : `${requirement.label} is valid until ${formatDateLabel(expiry)}.`,
    };
  });

  const status =
    expired > 0
      ? 'EXPIRED'
      : missing.length > 0
        ? 'INCOMPLETE'
        : needsReview.length > 0
          ? 'NEEDS_REVIEW'
          : 'COMPLETE';

  const nextAction =
    status === 'EXPIRED'
      ? `Replace expired required document${expired > 1 ? 's' : ''} and update the upload record.`
      : status === 'INCOMPLETE'
        ? `Upload the missing required document${missing.length > 1 ? 's' : ''} for this crew record.`
        : status === 'NEEDS_REVIEW'
          ? `Review document type mapping or expiry metadata before marking completeness as clear.`
          : expiringSoon > 0
            ? `No missing required documents. Monitor ${expiringSoon} document${expiringSoon > 1 ? 's' : ''} in the 3-month watch window.`
            : 'No document action required right now.';

  return {
    status,
    totalRequired: requirements.length,
    complete,
    present,
    missing,
    needsReview,
    nextAction,
    expiringSoon,
    expired,
    requirements,
  };
}
