import { HGI_ROOT_NAME } from '@/lib/document-control/config';
import type { CrewIdentitySeed } from '@/lib/document-control/types';

function sanitizeSegment(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

export function formatCrewFolderName(seed: CrewIdentitySeed) {
  const preferredCode = seed.crewCode?.trim() || seed.crewId;
  const code = sanitizeSegment(preferredCode);
  const name = sanitizeSegment(seed.fullName);
  const rank = sanitizeSegment(seed.rank?.trim() || 'UNASSIGNED');
  return `${code}__${name}__${rank}`;
}

export function buildCrewFolderPath(seed: CrewIdentitySeed) {
  return `${HGI_ROOT_NAME}/CREW/${formatCrewFolderName(seed)}`;
}

export function formatDocumentFileName(params: {
  crewCode?: string | null;
  crewName: string;
  documentCode: string;
  issueDate?: string | Date | null;
  version?: number;
  extension?: string;
}) {
  const issueDate = params.issueDate ? new Date(params.issueDate) : new Date();
  const datePart = Number.isNaN(issueDate.getTime())
    ? 'UNDATED'
    : issueDate.toISOString().slice(0, 10).replace(/-/g, '');
  const crewPart = sanitizeSegment(params.crewCode?.trim() || params.crewName);
  const documentPart = sanitizeSegment(params.documentCode);
  const version = `V${String(params.version ?? 1).padStart(2, '0')}`;
  const extension = params.extension
    ? params.extension.startsWith('.')
      ? params.extension.toLowerCase()
      : `.${params.extension.toLowerCase()}`
    : '';

  return `${datePart}_${crewPart}_${documentPart}_${version}${extension}`;
}

export function formatInboxUploadFileName(params: {
  uploaderInitials: string;
  crewName: string;
  documentCode: string;
  extension?: string;
}) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const uploader = sanitizeSegment(params.uploaderInitials);
  const crew = sanitizeSegment(params.crewName);
  const document = sanitizeSegment(params.documentCode);
  const extension = params.extension
    ? params.extension.startsWith('.')
      ? params.extension.toLowerCase()
      : `.${params.extension.toLowerCase()}`
    : '';

  return `${stamp}_INBOX_${uploader}_${crew}_${document}${extension}`;
}
