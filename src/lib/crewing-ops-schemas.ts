import { CrewTaskStatus, CrewTaskType } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = z
  .union([z.string(), z.null(), z.literal("")])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const optionalEmailString = z
  .union([z.string().email(), z.null(), z.literal("")])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value ? value : null;
  });

const optionalDateString = z
  .union([z.string().datetime({ offset: true }), z.string().date(), z.null(), z.literal("")])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value ? value : null;
  });

export const principalCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Company name is required"),
    country: optionalTrimmedString,
    address: optionalTrimmedString,
    contactPerson: optionalTrimmedString,
    phone: optionalTrimmedString,
    email: optionalEmailString,
    taxId: optionalTrimmedString,
    registrationNumber: optionalTrimmedString,
    agreementDate: optionalDateString,
    agreementExpiry: optionalDateString,
    status: optionalTrimmedString,
  })
  .strict();

export const principalUpdateSchema = principalCreateSchema.extend({
  country: optionalTrimmedString,
});

export const interviewCreateSchema = z
  .object({
    applicationId: z.string().trim().min(1, "Application ID is required"),
    scheduledDate: optionalDateString,
    interviewerName: optionalTrimmedString,
    notes: optionalTrimmedString,
  })
  .strict();

export const crewTaskCreateSchema = z
  .object({
    crewId: z.string().trim().min(1, "Crew ID is required"),
    taskType: z.nativeEnum(CrewTaskType),
    title: z.string().trim().min(1, "Task title is required"),
    description: optionalTrimmedString,
    assignedTo: optionalTrimmedString,
    dueDate: optionalDateString,
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
  })
  .strict();

export const crewTaskUpdateSchema = z
  .object({
    status: z.nativeEnum(CrewTaskStatus).optional(),
    assignedTo: optionalTrimmedString,
    dueDate: optionalDateString,
    remarks: optionalTrimmedString,
    completedAt: optionalDateString,
    completedBy: optionalTrimmedString,
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one field must be provided",
  });

export const crewTaskAutoCreateSchema = z
  .object({
    crewId: z.string().trim().min(1, "Crew ID is required"),
  })
  .strict();
