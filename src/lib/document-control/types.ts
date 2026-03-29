export type HgiRootKey =
  | 'CREW'
  | 'TEMPLATE_CREW'
  | 'INBOX_UPLOAD'
  | 'OPERATIONAL'
  | 'ACCOUNTING'
  | 'LEGAL'
  | 'SHARED_FORMS'
  | 'ARCHIVE';

export type DivisionOwner =
  | 'Crewing'
  | 'Operations'
  | 'Accounting'
  | 'Legal'
  | 'Quality'
  | 'Shared Services';

export type CrewFolderKey =
  | '00_ADMIN'
  | '01_ID_PERSONAL'
  | '02_CERTIFICATES'
  | '03_MEDICAL'
  | '04_TRAINING'
  | '05_CONTRACTS'
  | '06_TRAVEL_VISAS'
  | '07_ASSIGNMENT'
  | '08_APPRAISAL'
  | '09_PAYROLL_REFERENCE'
  | '10_CORRESPONDENCE'
  | '99_ARCHIVE';

export interface HgiRootDefinition {
  key: HgiRootKey;
  pathSegment: string;
  owner: DivisionOwner;
  purpose: string;
}

export interface CrewFolderDefinition {
  key: CrewFolderKey;
  pathSegment: string;
  purpose: string;
}

export interface CrewIdentitySeed {
  crewId: string;
  crewCode?: string | null;
  fullName: string;
  rank?: string | null;
  status?: string | null;
  crewStatus?: string | null;
  assignments?: Array<{
    status?: string | null;
  }>;
}

export interface CrewDocumentSeed {
  docType: string;
  docNumber?: string | null;
  expiryDate?: string | Date | null;
}

export interface RequiredDocumentDefinition {
  code: string;
  label: string;
  category: 'identity' | 'certification' | 'medical' | 'contract' | 'travel';
  requiredFor: 'all-crew' | 'joining-crew' | 'licensed-rank';
  acceptedDocTypes: readonly string[];
  requiresExpiry: boolean;
}

export type DocumentCompletenessStatus = 'COMPLETE' | 'INCOMPLETE' | 'EXPIRED' | 'NEEDS_REVIEW';

export interface CompletenessRequirementResult {
  code: string;
  label: string;
  category: RequiredDocumentDefinition['category'];
  status: DocumentCompletenessStatus;
  matchedDocumentType: string | null;
  matchedDocumentId: string | null;
  expiryDate: string | null;
  requiresExpiry: boolean;
  detail: string;
}

export interface CompletenessSummary {
  status: DocumentCompletenessStatus;
  totalRequired: number;
  complete: number;
  present: number;
  missing: string[];
  needsReview: string[];
  nextAction: string;
  expiringSoon: number;
  expired: number;
  requirements: CompletenessRequirementResult[];
}

export interface IntegrationPhaseDefinition {
  phase: 'PHASE_1' | 'PHASE_2' | 'PHASE_3';
  title: string;
  scope: string[];
  risk: string;
  implementationApproach: string[];
  repoAreas: string[];
}

export interface SchemaProposalField {
  name: string;
  type: string;
  nullable: boolean;
  purpose: string;
}

export interface SchemaProposalModel {
  model: string;
  purpose: string;
  fields: SchemaProposalField[];
}
