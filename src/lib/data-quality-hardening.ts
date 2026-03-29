import { DocumentControlStatus } from "@prisma/client";

export const ACTIVE_CONTRACT_STATUSES = ["DRAFT", "ACTIVE"] as const;
export const ACTIVE_RECRUITMENT_STATUSES = [
  "APPLICANT",
  "SCREENING",
  "INTERVIEW",
  "SELECTED",
  "APPROVED",
  "ON_HOLD",
] as const;
export const ACTIVE_DOCUMENT_CONTROL_STATUSES: DocumentControlStatus[] = [
  DocumentControlStatus.DRAFT,
  DocumentControlStatus.FOR_APPROVAL,
  DocumentControlStatus.APPROVED,
  DocumentControlStatus.ACTIVE,
];

export type ContractOverlapCandidate = {
  id: string;
  crewId: string;
  contractNumber: string;
  contractKind: string;
  status: string;
  contractStart: Date;
  contractEnd: Date;
  crew?: {
    fullName: string | null;
  } | null;
};

export type ContractOverlapGroup = {
  key: string;
  crewId: string;
  crewName: string;
  count: number;
  contractIds: string[];
  contractNumbers: string[];
  statuses: string[];
  rangeStart: Date;
  rangeEnd: Date;
};

export type RecruitmentDuplicateCandidate = {
  id: string;
  status: string;
  recruitmentDate: Date;
  crew: {
    fullName: string | null;
    rank: string | null;
    email: string | null;
    phone: string | null;
  };
};

export type RecruitmentDuplicateGroup = {
  key: string;
  candidateName: string;
  position: string;
  count: number;
  recruitmentIds: string[];
  statuses: string[];
  matchedBy: "EMAIL" | "PHONE" | "NAME_POSITION";
  email: string | null;
  phone: string | null;
};

export type DocumentRegistryCandidate = {
  id: string;
  code: string;
  title: string;
  documentType: string;
  department: string;
  status: string;
  createdAt: Date;
};

export type DocumentRegistryDuplicateGroup = {
  key: string;
  title: string;
  documentType: string;
  department: string;
  count: number;
  documentIds: string[];
  codes: string[];
  statuses: string[];
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

function buildDocumentKey(input: {
  title: string;
  documentType: string;
  department: string;
}) {
  return [
    normalizeText(input.title),
    normalizeText(input.documentType),
    normalizeText(input.department),
  ].join("::");
}

export function normalizeContractNumber(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function contractDateRangesOverlap(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date
) {
  return leftStart <= rightEnd && rightStart <= leftEnd;
}

export function detectContractOverlapGroups(
  contracts: ContractOverlapCandidate[]
): ContractOverlapGroup[] {
  const grouped = new Map<string, ContractOverlapCandidate[]>();

  for (const contract of contracts) {
    const key = `${contract.crewId}::${contract.contractKind}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(contract);
    grouped.set(key, bucket);
  }

  const overlaps: ContractOverlapGroup[] = [];

  for (const [key, bucket] of grouped.entries()) {
    const sorted = [...bucket].sort(
      (left, right) => left.contractStart.getTime() - right.contractStart.getTime()
    );

    let current: ContractOverlapCandidate[] = [];
    let currentEnd: Date | null = null;

    for (const contract of sorted) {
      if (
        current.length === 0 ||
        !currentEnd ||
        contract.contractStart > currentEnd
      ) {
        if (current.length > 1) {
          overlaps.push(buildContractOverlapGroup(key, current));
        }
        current = [contract];
        currentEnd = contract.contractEnd;
        continue;
      }

      current.push(contract);
      if (contract.contractEnd > currentEnd) {
        currentEnd = contract.contractEnd;
      }
    }

    if (current.length > 1) {
      overlaps.push(buildContractOverlapGroup(key, current));
    }
  }

  return overlaps.sort((left, right) => right.count - left.count);
}

function buildContractOverlapGroup(
  key: string,
  contracts: ContractOverlapCandidate[]
): ContractOverlapGroup {
  const rangeStart = contracts.reduce(
    (current, contract) =>
      contract.contractStart < current ? contract.contractStart : current,
    contracts[0].contractStart
  );
  const rangeEnd = contracts.reduce(
    (current, contract) =>
      contract.contractEnd > current ? contract.contractEnd : current,
    contracts[0].contractEnd
  );

  return {
    key,
    crewId: contracts[0].crewId,
    crewName: contracts[0].crew?.fullName?.trim() || "Unnamed crew",
    count: contracts.length,
    contractIds: contracts.map((contract) => contract.id),
    contractNumbers: contracts.map((contract) => contract.contractNumber),
    statuses: Array.from(new Set(contracts.map((contract) => contract.status))),
    rangeStart,
    rangeEnd,
  };
}

export function detectDuplicateRecruitmentGroups(
  recruitments: RecruitmentDuplicateCandidate[]
): RecruitmentDuplicateGroup[] {
  const groups = new Map<string, RecruitmentDuplicateGroup>();

  for (const recruitment of recruitments) {
    const candidateName = normalizeText(recruitment.crew.fullName);
    const position = normalizeText(recruitment.crew.rank);
    const email = normalizeText(recruitment.crew.email);
    const phone = normalizeText(recruitment.crew.phone);

    const duplicateKey = email
      ? `EMAIL::${email}`
      : phone
        ? `PHONE::${phone}`
        : `NAME_POSITION::${candidateName}::${position}`;

    const matchedBy = email
      ? "EMAIL"
      : phone
        ? "PHONE"
        : "NAME_POSITION";

    const group = groups.get(duplicateKey) ?? {
      key: duplicateKey,
      candidateName: recruitment.crew.fullName?.trim() || "Unnamed candidate",
      position: recruitment.crew.rank?.trim() || "Unassigned position",
      count: 0,
      recruitmentIds: [],
      statuses: [],
      matchedBy,
      email: recruitment.crew.email,
      phone: recruitment.crew.phone,
    };

    group.count += 1;
    group.recruitmentIds.push(recruitment.id);
    group.statuses = Array.from(new Set([...group.statuses, recruitment.status]));
    groups.set(duplicateKey, group);
  }

  return [...groups.values()]
    .filter((group) => group.count > 1)
    .sort((left, right) => right.count - left.count);
}

export function detectDuplicateDocumentRegistryGroups(
  documents: DocumentRegistryCandidate[]
): DocumentRegistryDuplicateGroup[] {
  const groups = new Map<string, DocumentRegistryDuplicateGroup>();

  for (const document of documents) {
    const key = buildDocumentKey(document);
    const group = groups.get(key) ?? {
      key,
      title: document.title,
      documentType: document.documentType,
      department: document.department,
      count: 0,
      documentIds: [],
      codes: [],
      statuses: [],
    };

    group.count += 1;
    group.documentIds.push(document.id);
    group.codes.push(document.code);
    group.statuses = Array.from(new Set([...group.statuses, document.status]));
    groups.set(key, group);
  }

  return [...groups.values()]
    .filter((group) => group.count > 1)
    .sort((left, right) => right.count - left.count);
}

export function buildDocumentRegistryConflictKey(input: {
  title: string;
  documentType: string;
  department: string;
}) {
  return buildDocumentKey(input);
}
