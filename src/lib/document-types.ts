/**
 * Centralized document type definitions
 * Used across crew portal and crewing department
 */

export interface DocumentType {
  value: string;
  label: string;
  category: "identity" | "certification" | "safety" | "technical" | "management" | "health" | "other";
}

export const DOCUMENT_TYPES: DocumentType[] = [
  // Identity Documents
  { value: "PASSPORT", label: "Passport", category: "identity" },
  { value: "SEAMAN_BOOK", label: "Seaman Book", category: "identity" },

  // Certification & Qualifications
  { value: "COC_IJAZAH_NAUTICA", label: "COC / Ijazah Nautica", category: "certification" },
  { value: "COE_ENDORSEMENT", label: "COE / Endorsement", category: "certification" },

  // Safety Certificates
  { value: "BST", label: "Basic Safety Training (BST)", category: "safety" },
  { value: "SCRB", label: "Survival Craft & Rescue Boat (SCRB)", category: "safety" },
  { value: "AFF", label: "Advanced Fire Fighting (AFF)", category: "safety" },
  { value: "MEFA", label: "Medical First Aid (MEFA)", category: "safety" },

  // Technical Certificates
  { value: "GMDSS", label: "GMDSS", category: "technical" },
  { value: "MC", label: "Maintenance Course (MC)", category: "technical" },
  { value: "ARPA", label: "ARPA", category: "technical" },
  { value: "RADAR", label: "RADAR", category: "technical" },
  { value: "ECDIS", label: "ECDIS", category: "technical" },

  // Management Certificates
  { value: "SSO", label: "Senior Seafarers Officer (SSO)", category: "management" },
  { value: "BRM", label: "Bridge Resource Management (BRM)", category: "management" },

  // Health & Medical
  { value: "YELLOW_FEVER", label: "Yellow Fever Vaccination", category: "health" },

  // Additional Certifications
  { value: "ORU_GOC", label: "ORU / GOC", category: "other" },
  { value: "BOCT", label: "BOCT", category: "other" },
  { value: "ACT", label: "ACT", category: "other" },
  { value: "AOT", label: "AOT", category: "other" },
  { value: "SSAT", label: "SSAT", category: "other" },
  { value: "SDSD", label: "SDSD", category: "other" },

  // Generic
  { value: "OTHER", label: "Other Document", category: "other" },
];

export function getDocumentTypeLabel(value: string): string {
  const doc = DOCUMENT_TYPES.find((d) => d.value === value);
  return doc ? doc.label : value;
}

export function getDocumentTypesByCategory(category: DocumentType["category"]): DocumentType[] {
  return DOCUMENT_TYPES.filter((d) => d.category === category);
}

export function getAllDocumentTypes(): DocumentType[] {
  return DOCUMENT_TYPES;
}
