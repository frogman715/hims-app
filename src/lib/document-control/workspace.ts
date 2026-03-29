import { formatDateLabel } from '@/lib/formatters';
import { summarizeCrewCompleteness } from '@/lib/document-control/config';
import type {
  CompletenessRequirementResult,
  CrewDocumentSeed,
  CrewIdentitySeed,
  DocumentCompletenessStatus,
} from '@/lib/document-control/types';

export type FolderStatus = 'NOT_LINKED' | 'LINKED' | 'REVIEW_PENDING' | 'REVIEWED';

export interface StoredCrewDocumentWorkspaceFields {
  officeFolderPath?: string | null;
  nextcloudUrl?: string | null;
  folderStatus?: FolderStatus | null;
  lastDocumentReviewAt?: string | Date | null;
  lastDocumentReviewBy?: string | null;
}

export interface CrewDocumentCompletenessView {
  status: DocumentCompletenessStatus;
  totalRequired: number;
  complete: number;
  present: number;
  missingCount: number;
  needsReviewCount: number;
  percent: number;
  nextAction: string;
}

export interface CrewDocumentWorkspaceView extends StoredCrewDocumentWorkspaceFields {
  folderStatus: FolderStatus;
  documentCompleteness: CrewDocumentCompletenessView;
  missingDocuments: string[];
  needsReviewDocuments: string[];
  requiredDocuments: CompletenessRequirementResult[];
  expiryAlerts: {
    expiringSoon: number;
    expired: number;
  };
}

export function getFolderStatusLabel(status: FolderStatus) {
  switch (status) {
    case 'LINKED':
      return 'Linked';
    case 'REVIEW_PENDING':
      return 'Review Pending';
    case 'REVIEWED':
      return 'Reviewed';
    case 'NOT_LINKED':
    default:
      return 'Not Linked';
  }
}

export function buildCrewDocumentWorkspaceView(params: {
  documents: readonly CrewDocumentSeed[];
  identity?: CrewIdentitySeed | null;
  stored?: StoredCrewDocumentWorkspaceFields | null;
}): CrewDocumentWorkspaceView {
  const summary = summarizeCrewCompleteness(params.documents, params.identity);
  const stored = params.stored ?? {};
  const percent =
    summary.totalRequired > 0 ? Math.round((summary.complete / summary.totalRequired) * 100) : 0;

  return {
    officeFolderPath: stored.officeFolderPath ?? null,
    nextcloudUrl: stored.nextcloudUrl ?? null,
    folderStatus: stored.folderStatus ?? (stored.officeFolderPath || stored.nextcloudUrl ? 'LINKED' : 'NOT_LINKED'),
    lastDocumentReviewAt: stored.lastDocumentReviewAt ?? null,
    lastDocumentReviewBy: stored.lastDocumentReviewBy ?? null,
    documentCompleteness: {
      status: summary.status,
      totalRequired: summary.totalRequired,
      complete: summary.complete,
      present: summary.present,
      missingCount: summary.missing.length,
      needsReviewCount: summary.needsReview.length,
      percent,
      nextAction: summary.nextAction,
    },
    missingDocuments: summary.missing,
    needsReviewDocuments: summary.needsReview,
    requiredDocuments: summary.requirements,
    expiryAlerts: {
      expiringSoon: summary.expiringSoon,
      expired: summary.expired,
    },
  };
}

export function formatDocumentReviewLabel(workspace: Pick<CrewDocumentWorkspaceView, 'lastDocumentReviewAt' | 'lastDocumentReviewBy'>) {
  if (!workspace.lastDocumentReviewAt) {
    return 'No review recorded';
  }

  const dateLabel = formatDateLabel(workspace.lastDocumentReviewAt, 'en-GB');
  if (!workspace.lastDocumentReviewBy) {
    return `Reviewed ${dateLabel}`;
  }

  return `Reviewed ${dateLabel} by ${workspace.lastDocumentReviewBy}`;
}

export function getDocumentWorkspaceSchemaProposal() {
  return {
    enumBlock: `enum CrewDocumentWorkspaceStatus {
  NOT_LINKED
  LINKED
  REVIEW_PENDING
  REVIEWED
}`,
    crewRelationBlock: `model Crew {
  // ...
  documentWorkspace      CrewDocumentWorkspace?
}`,
    userRelationBlock: `model User {
  // ...
  reviewedCrewDocumentWorkspaces CrewDocumentWorkspace[] @relation("CrewDocumentWorkspaceReviewedBy")
}`,
    modelBlock: `model CrewDocumentWorkspace {
  id                     String                      @id @default(cuid())
  crewId                 String                      @unique
  officeFolderPath       String?
  nextcloudUrl           String?
  folderStatus           CrewDocumentWorkspaceStatus?
  folderTemplateVersion  String?
  lastDocumentReviewAt   DateTime?
  lastDocumentReviewBy   String?
  notes                  String?

  crew                   Crew                        @relation(fields: [crewId], references: [id], onDelete: Cascade)
  reviewer               User?                       @relation("CrewDocumentWorkspaceReviewedBy", fields: [lastDocumentReviewBy], references: [id], onDelete: SetNull)

  createdAt              DateTime                    @default(now())
  updatedAt              DateTime                    @updatedAt

  @@index([folderStatus])
  @@index([lastDocumentReviewAt])
  @@index([lastDocumentReviewBy])
}`,
    rationale: [
      'Store only durable manual metadata in CrewDocumentWorkspace.',
      'Keep completeness, missing documents, and expiry alerts derived from CrewDocument rows at read time.',
      'Use nullable-first fields so existing crew rows do not require backfill before deployment.',
    ],
    nullableFirstMigrationPlan: [
      '1. Add enum CrewDocumentWorkspaceStatus and create CrewDocumentWorkspace with every business field nullable, including folderStatus.',
      '2. Add Crew.documentWorkspace and User.reviewedCrewDocumentWorkspaces relations in Prisma without changing existing CrewDocument rows.',
      '3. Deploy application code that left-joins documentWorkspace and falls back to computed defaults when no row exists or fields are null.',
      '4. Backfill optional metadata only for crews that already have verified office paths or review records.',
      '5. After operational use proves the shape, decide whether folderStatus should become non-null with a database default of NOT_LINKED. Do not enforce that in the first migration.',
    ],
    minimalReadApiChanges: [
      'Add documentWorkspace: true to the prisma.crew.findUnique include in src/app/api/crewing/seafarers/[id]/route.ts.',
      'Replace the hard-coded null workspaceFields object with seafarer.documentWorkspace.',
      'Keep buildCrewDocumentWorkspaceView(...) as the response adapter so derived completeness and expiry values remain computed in one place.',
      'Do not add POST/PUT/PATCH handlers for workspace metadata in this step.',
    ],
    postponed: [
      'Any endpoint that writes officeFolderPath, nextcloudUrl, notes, review markers, or folder status.',
      'Folder creation, Samba writes, Nextcloud writes, or any VPS-driven filesystem integration.',
      'A separate normalized per-requirement status table such as CrewDocumentRequirementStatus.',
      'Automatic backfill, folder-template generation, or scheduled synchronization jobs.',
    ],
  };
}
