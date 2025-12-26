import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

export interface CrewBulkData {
  fullName: string;
  rank: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  seamanBookNumber?: string | null;
  seamanBookExpiry?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  bloodType?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  status?: string | null;
}

export interface BulkCrewPayload {
  crews: CrewBulkData[];
  dryRun?: boolean;
}

function validateCrewData(crew: unknown): crew is CrewBulkData {
  const c = crew as Partial<CrewBulkData>;
  return (
    typeof c.fullName === "string" &&
    c.fullName.trim().length >= 3 &&
    typeof c.rank === "string" &&
    c.rank.trim().length > 0
  );
}

function validateCrewRecord(crew: CrewBulkData): string[] {
  const errors: string[] = [];

  // Full Name validation
  if (!crew.fullName || crew.fullName.trim().length < 3) {
    errors.push("Full Name must be at least 3 characters");
  }

  // Rank validation
  if (!crew.rank || crew.rank.trim().length === 0) {
    errors.push("Rank is required");
  }

  // Email validation (if provided)
  if (crew.email && !crew.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push("Invalid email format");
  }

  // Date of Birth validation (if provided)
  if (crew.dateOfBirth) {
    const dob = new Date(crew.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (age < 18) {
      errors.push("Crew must be at least 18 years old");
    }
  }

  // Passport Expiry validation (if provided)
  if (crew.passportExpiry) {
    const expiry = new Date(crew.passportExpiry);
    if (expiry < new Date()) {
      errors.push("Passport is expired");
    }
  }

  // Seaman Book Expiry validation (if provided)
  if (crew.seamanBookExpiry) {
    const expiry = new Date(crew.seamanBookExpiry);
    if (expiry < new Date()) {
      errors.push("Seaman Book is expired");
    }
  }

  return errors;
}

export const POST = withPermission(
  "crew",
  PermissionLevel.EDIT_ACCESS,
  async (req: NextRequest) => {
    try {
      const payload = (await req.json()) as BulkCrewPayload;

      if (!Array.isArray(payload.crews) || payload.crews.length === 0) {
        return NextResponse.json(
          { error: "Invalid crews payload - must be non-empty array" },
          { status: 400 }
        );
      }

      // Validate all crew data
      const validationResults: Array<{
        index: number;
        crew: CrewBulkData;
        errors: string[];
      }> = [];

      payload.crews.forEach((crew, index) => {
        const errors = validateCrewData(crew)
          ? validateCrewRecord(crew)
          : ["Invalid crew data: fullName and rank required"];

        if (errors.length > 0) {
          validationResults.push({ index, crew, errors });
        }
      });

      // If there are validation errors
      if (validationResults.length > 0) {
        return NextResponse.json(
          {
            error: "Validation failed",
            validCount: payload.crews.length - validationResults.length,
            failCount: validationResults.length,
            totalCount: payload.crews.length,
            failures: validationResults.map(r => ({
              row: r.index + 2, // +2 because row 1 is header, and array is 0-indexed
              fullName: r.crew.fullName,
              errors: r.errors,
            })),
          },
          { status: 400 }
        );
      }

      // Dry run mode - validate only, don't create
      if (payload.dryRun) {
        return NextResponse.json({
          success: true,
          dryRun: true,
          message: `All ${payload.crews.length} crews are valid and ready to create`,
          validCount: payload.crews.length,
          crews: payload.crews.map(c => ({
            fullName: c.fullName,
            rank: c.rank,
            status: "READY_TO_CREATE",
          })),
        });
      }

      // Create crews in bulk
      const createdCrews = await Promise.all(
        payload.crews.map(crew =>
          prisma.crew.create({
            data: {
              fullName: crew.fullName.trim(),
              rank: crew.rank.trim(),
              email: crew.email?.trim() ?? null,
              phone: crew.phone?.trim() ?? null,
              dateOfBirth: crew.dateOfBirth
                ? new Date(crew.dateOfBirth)
                : null,
              placeOfBirth: crew.placeOfBirth?.trim() ?? null,
              nationality: crew.nationality?.trim() ?? null,
              passportNumber: crew.passportNumber?.trim() ?? null,
              passportExpiry: crew.passportExpiry
                ? new Date(crew.passportExpiry)
                : null,
              seamanBookNumber: crew.seamanBookNumber?.trim() ?? null,
              seamanBookExpiry: crew.seamanBookExpiry
                ? new Date(crew.seamanBookExpiry)
                : null,
              address: crew.address?.trim() ?? null,
              emergencyContactName: crew.emergencyContactName?.trim() ?? null,
              emergencyContactPhone: crew.emergencyContactPhone?.trim() ?? null,
              emergencyContactRelation:
                crew.emergencyContactRelation?.trim() ?? null,
              bloodType: crew.bloodType?.trim() ?? null,
              heightCm: crew.heightCm ?? null,
              weightKg: crew.weightKg ?? null,
            },
          })
        )
      );

      return NextResponse.json(
        {
          success: true,
          created: createdCrews.length,
          crews: createdCrews.map(c => ({
            id: c.id,
            fullName: c.fullName,
            rank: c.rank,
            email: c.email,
            phone: c.phone,
          })),
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error bulk creating crews:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
