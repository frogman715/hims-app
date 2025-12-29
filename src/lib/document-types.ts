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
  { value: "PASSPORT", label: "PASPOR (Passport)", category: "identity" },
  { value: "SEAMAN_BOOK", label: "SEAMAN BOOK", category: "identity" },
  { value: "NATIONAL_SEAMAN_BOOK", label: "NATIONAL SEAMAN BOOK", category: "identity" },
  { value: "NATIONAL_LICENSE", label: "NATIONAL LICENSE", category: "identity" },
  { value: "FLAG_STATE_SEAMAN_BOOK", label: "FLAG STATE SEAMAN BOOK (ID BOOK)", category: "identity" },
  { value: "FLAG_STATE_LICENSE", label: "FLAG STATE LICENSE", category: "identity" },

  // Certification & Qualifications
  { value: "COC_IJAZAH_NAUTICA", label: "COC / IJAZAH NAUTIKA", category: "certification" },
  { value: "COE_ENDORSEMENT", label: "COE / ENDORSEMENT", category: "certification" },
  { value: "FLAG_STATE_SPECIAL_QUALIFICATION_TANKER", label: "FLAG STATE SPECIAL QUALIFICATION FOR TANKER VESSEL SERVICE", category: "certification" },

  // Safety Certificates
  { value: "BST", label: "BST (Basic Safety Training)", category: "safety" },
  { value: "SCRB", label: "SCRB", category: "safety" },
  { value: "AFF", label: "AFF (Advanced Fire Fighting)", category: "safety" },
  { value: "MEFA", label: "MEFA (Medical First Aid)", category: "safety" },
  { value: "SAFETY_COURSE_BASIC", label: "SAFETY COURSE, BASIC", category: "safety" },
  { value: "SAFETY_COURSE_SURVIVAL_CRAFT", label: "SAFETY COURSE, SURVIVAL CRAFT", category: "safety" },
  { value: "SAFETY_COURSE_FIRE_FIGHTING", label: "SAFETY COURSE, FIRE FIGHTING", category: "safety" },
  { value: "SAFETY_COURSE_FIRST_AID", label: "SAFETY COURSE, FIRST AID", category: "safety" },
  { value: "SAFETY_COURSE_RESCUE_BOAT", label: "SAFETY COURSE, RESCUE BOAT", category: "safety" },

  // Technical & Training Certificates
  { value: "GMDSS", label: "GMDSS", category: "technical" },
  { value: "NATIONAL_GMDSS_GOC", label: "NATIONAL GMDSS-GOC", category: "technical" },
  { value: "FLAG_STATE_GMDSS_GOC", label: "FLAG STATE GMDSS-GOC", category: "technical" },
  { value: "MC", label: "MC (Maintenance Course)", category: "technical" },
  { value: "ARPA", label: "ARPA TRAINING COURSE", category: "technical" },
  { value: "RADAR", label: "RADAR TRAINING COURSE", category: "technical" },
  { value: "ECDIS", label: "ECDIS", category: "technical" },
  { value: "ERM", label: "ENGINE ROOM SIMULATOR TRAINING", category: "technical" },
  { value: "SHIP_HANDLING_SIMULATION", label: "SHIP HANDLING SIMULATION", category: "technical" },
  { value: "WELDING_CERTIFICATE", label: "WELDING CERTIFICATE", category: "technical" },

  // Tanker Courses
  { value: "TANKER_COURSE_FAMILIZATION", label: "TANKER COURSE, FAMILIZATION", category: "other" },
  { value: "TANKER_COURSE_ADVANCED_OIL", label: "TANKER COURSE, ADVANCED (OIL)", category: "other" },
  { value: "TANKER_COURSE_ADVANCED_LPG", label: "TANKER COURSE, ADVANCED (LPG)", category: "other" },
  { value: "TANKER_COURSE_ADVANCED_CHEMICAL", label: "TANKER COURSE, ADVANCED (CHEMICAL)", category: "other" },

  // Management Certificates
  { value: "SSO", label: "SSO (Ship Security Officer)", category: "management" },
  { value: "BRM", label: "BRM (Bridge Resource Management)", category: "management" },
  { value: "BRIDGE_TEAM_RESOURCE_MANAGEMENT", label: "BRIDGE TEAM / RESOURCE MANAGEMENT", category: "management" },
  { value: "ISPS", label: "ISPS", category: "management" },

  // Health & Medical
  { value: "YELLOW_FEVER", label: "YELLOW FEVER (Vaccination)", category: "health" },
  { value: "NATIONAL_MEDICAL_EXAM_CERT", label: "NATIONAL MEDICAL EXAM. CERT.", category: "health" },
  { value: "FLAG_STATE_MEDICAL_EXAM_CERT", label: "FLAG STATE MEDICAL EXAM. CERT.", category: "health" },
  { value: "CHOLERA", label: "VACCINATION - CHOLERA", category: "health" },
  { value: "DRUG_ALCOHOL_TEST", label: "DRUG AND ALCOHOL TEST", category: "health" },

  // Specialized Courses & Training
  { value: "POLLUTION_PREVENTION_COURSE", label: "POLLUTION PREVENTION COURSE", category: "other" },
  { value: "MEDICAL_CARE_COURSE", label: "MEDICAL CARE COURSE", category: "other" },
  { value: "SENIOR_OFF_REFRESHER_COURSE", label: "SENIOR OFF'S REFRESHER COURSE", category: "other" },
  { value: "LGT", label: "LGT", category: "other" },
  { value: "NATIONAL_STCW_WATCH_KEEPING", label: "NATIONAL STCW-WATCH KEEPING", category: "other" },
  { value: "FLAG_STATE_SPECIAL_QUALIFICATION_RATINGS", label: "FLAG STATE SPECIAL QUALIFICATION FOR RATINGS (STCW95 ENDORSEMENT)", category: "other" },
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
