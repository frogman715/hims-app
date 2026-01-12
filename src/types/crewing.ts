import { z } from "zod";
import type { Crew, Assignment, Application, CrewDocument, Vessel, Principal } from "@prisma/client";

// ===========================
// CREW SEARCH TYPES
// ===========================

export interface CrewSearchResult {
  id: string;
  fullName: string;
  rank: string;
  status: string;
  nationality?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  seamanBookNumber?: string | null;
  seamanBookExpiry?: string | null;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  latestAssignment: {
    rank: string | null;
    vesselName: string | null;
    principalName: string | null;
    status: string;
    startDate: string;
    endDate: string | null;
  } | null;
  latestApplication: {
    status: string;
    appliedAt: string;
    principalName: string | null;
    vesselType: string | null;
  } | null;
  expiringDocuments: Array<{
    id: string;
    docType: string;
    docNumber: string | null;
    expiryDate: string | null;
  }>;
}

export interface CrewSearchResponse {
  results: CrewSearchResult[];
  total: number;
  page: number;
  pageSize: number;
}

// ===========================
// CREW WITH RELATIONS
// ===========================

export interface CrewWithAssignment extends Crew {
  latestAssignment: (Assignment & {
    vessel: Vessel;
    principal: Principal | null;
  }) | null;
  documents: CrewDocument[];
  expiringDocuments: CrewDocument[];
}

export interface ApplicationWithRelations extends Application {
  crew: Crew;
  principal: Principal | null;
}

export interface AssignmentWithRelations extends Assignment {
  crew: Crew;
  vessel: Vessel;
  principal: Principal | null;
}

// ===========================
// OVERVIEW STATS
// ===========================

export interface CrewingOverviewStats {
  activeSeafarers: number;
  principalCount: number;
  vesselCount: number;
  activeAssignments: number;
  plannedAssignments: number;
  pendingApplications: number;
  applicationInProgress: number;
  scheduledInterviews: number;
  prepareJoiningInProgress: number;
  crewReplacementPending: number;
  documentsExpiringSoon: number;
  complianceRate: number | null;
  documentReceiptsTotal: number;
  trainingInProgress: number;
  signOffThisMonth: number;
  externalComplianceActive: number;
}

export interface CrewingOverviewResponse {
  stats: CrewingOverviewStats;
  recentActivities: Array<{
    id: string;
    userName: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
  }>;
}

// ===========================
// UI COMPONENT TYPES
// ===========================

export interface OverviewCard {
  label: string;
  value: string;
  description: string;
  icon: string;
  accent: string;
}

export interface QuickAction {
  href: string;
  label: string;
  description: string;
  icon: string;
  accent: string;
}

export interface ModuleLink {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  stats: string;
}

export interface ModuleCategory {
  category: string;
  description: string;
  modules: ModuleLink[];
}

// ===========================
// ZOD VALIDATION SCHEMAS
// ===========================

export const createSeafarerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  rank: z.string().min(2, "Rank is required"),
  dateOfBirth: z.string().optional().nullable(),
  placeOfBirth: z.string().optional().nullable(),
  nationality: z.string().min(2, "Nationality is required"),
  passportNumber: z.string().optional().nullable(),
  passportExpiry: z.string().optional().nullable(),
  seamanBookNumber: z.string().optional().nullable(),
  seamanBookExpiry: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  heightCm: z.number().int().positive().optional().nullable(),
  weightKg: z.number().int().positive().optional().nullable(),
  coverallSize: z.string().optional().nullable(),
  shoeSize: z.string().optional().nullable(),
  waistSize: z.string().optional().nullable(),
});

export type CreateSeafarerInput = z.infer<typeof createSeafarerSchema>;

export const updateSeafarerSchema = createSeafarerSchema.partial();
export type UpdateSeafarerInput = z.infer<typeof updateSeafarerSchema>;

export const createApplicationSchema = z.object({
  crewId: z.string().min(1, "Crew ID is required"),
  position: z.string().min(2, "Position is required"),
  vesselType: z.string().optional().nullable(),
  principalId: z.string().optional().nullable(),
  applicationDate: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = z.object({
  status: z.enum(["RECEIVED", "REVIEWING", "INTERVIEW", "PASSED", "OFFERED", "ACCEPTED", "REJECTED", "CANCELLED"]),
  reviewedBy: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

export const createAssignmentSchema = z.object({
  crewId: z.string().min(1, "Crew ID is required"),
  vesselId: z.string().min(1, "Vessel ID is required"),
  principalId: z.string().optional().nullable(),
  rank: z.string().min(2, "Rank is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  status: z.string().optional().default("ACTIVE"),
  remarks: z.string().optional().nullable(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = createAssignmentSchema.partial();
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

// ===========================
// APPLICATION STATE MACHINE
// ===========================

export const APPLICATION_STATE_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ["REVIEWING", "REJECTED"],
  REVIEWING: ["INTERVIEW", "REJECTED", "CANCELLED"],
  INTERVIEW: ["PASSED", "FAILED", "CANCELLED"],
  PASSED: ["OFFERED", "REJECTED"],
  OFFERED: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: [],
  REJECTED: [],
  CANCELLED: [],
  FAILED: [],
};

export function isValidStateTransition(currentStatus: string, newStatus: string): boolean {
  const allowedTransitions = APPLICATION_STATE_TRANSITIONS[currentStatus];
  return allowedTransitions ? allowedTransitions.includes(newStatus) : false;
}

// ===========================
// DOCUMENT EXPIRY HELPERS
// ===========================

export function getDocumentExpiryColor(expiryDate: string | null): string {
  if (!expiryDate) return "text-slate-500";
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return "text-red-600"; // Expired
  if (daysUntilExpiry < 30) return "text-red-600"; // Less than 30 days
  if (daysUntilExpiry < 90) return "text-orange-600"; // 30-90 days
  if (daysUntilExpiry < 180) return "text-yellow-600"; // 90-180 days
  return "text-green-600"; // More than 180 days
}

export function getDocumentExpiryBadgeColor(expiryDate: string | null): string {
  if (!expiryDate) return "bg-slate-100 text-slate-600";
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return "bg-red-100 text-red-700"; // Expired
  if (daysUntilExpiry < 30) return "bg-red-100 text-red-700"; // Less than 30 days
  if (daysUntilExpiry < 90) return "bg-orange-100 text-orange-700"; // 30-90 days
  if (daysUntilExpiry < 180) return "bg-yellow-100 text-yellow-700"; // 90-180 days
  return "bg-green-100 text-green-700"; // More than 180 days
}

export function calculateDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
