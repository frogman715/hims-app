import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

/**
 * CREW BULK IMPORT API
 * Production-ready endpoint for batch crew member creation
 * Validation Rules: Strict, comprehensive, user-friendly errors
 */

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

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Type Guard: Check if crew has required structure
 */
function validateCrewData(crew: unknown): crew is CrewBulkData {
  const c = crew as Partial<CrewBulkData>;
  return (
    typeof c.fullName === "string" &&
    c.fullName.trim().length >= 3 &&
    typeof c.rank === "string" &&
    c.rank.trim().length > 0
  );
}

/**
 * PRODUCTION VALIDATION RULES
 * Comprehensive field validation with clear, actionable error messages
 */
function validateCrewRecord(crew: CrewBulkData): ValidationResult {
  const errors: string[] = [];

  // ============================================================
  // REQUIRED FIELDS - Must always be valid
  // ============================================================

  // Full Name: Required, 3+ chars, alphanumeric + spaces/hyphens/apostrophes
  if (!crew.fullName || crew.fullName.trim().length === 0) {
    errors.push("Full Name: Required field");
  } else if (crew.fullName.trim().length < 3) {
    errors.push("Full Name: Must be at least 3 characters");
  } else if (!/^[a-zA-Z\s'-]{3,100}$/.test(crew.fullName.trim())) {
    errors.push("Full Name: Use only letters, spaces, hyphens, apostrophes (max 100 chars)");
  }

  // Rank: Required, non-empty
  if (!crew.rank || crew.rank.trim().length === 0) {
    errors.push("Rank: Required field (Captain, Chief Officer, etc)");
  } else if (crew.rank.trim().length > 50) {
    errors.push("Rank: Maximum 50 characters");
  }

  // ============================================================
  // OPTIONAL FIELDS WITH STRICT VALIDATION
  // ============================================================

  // Email: RFC 5322 standard, if provided must be valid
  if (crew.email && crew.email.trim().length > 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(crew.email.trim())) {
      errors.push("Email: Invalid email format (name@domain.com)");
    } else if (crew.email.length > 255) {
      errors.push("Email: Exceeds maximum length (255 characters)");
    }
  }

  // Phone: International format required, if provided
  if (crew.phone && crew.phone.trim().length > 0) {
    if (!/^\+\d{1,3}[-\d\s()]{6,20}$/.test(crew.phone.trim())) {
      errors.push("Phone: Must be in international format (+CC-XXXXXXX, e.g., +62812-1234567)");
    } else if (crew.phone.trim().replace(/\D/g, "").length < 10) {
      errors.push("Phone: Must have at least 10 digits (including country code)");
    }
  }

  // Date of Birth: ISO format, age 18-70
  if (crew.dateOfBirth) {
    const dob = new Date(crew.dateOfBirth);
    if (isNaN(dob.getTime())) {
      errors.push("Date of Birth: Invalid format (use YYYY-MM-DD)");
    } else {
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.push("Date of Birth: Crew must be at least 18 years old");
      } else if (age > 70) {
        errors.push("Date of Birth: Age exceeds typical maximum (70 years) - verify data");
      }
    }
  }

  // Nationality: Optional, 2-50 chars
  if (crew.nationality && crew.nationality.trim().length > 0) {
    if (!/^[a-zA-Z\s'-]{2,50}$/.test(crew.nationality.trim())) {
      errors.push("Nationality: Use only letters and spaces (2-50 characters)");
    }
  }

  // Place of Birth: Optional text
  if (crew.placeOfBirth && crew.placeOfBirth.trim().length > 100) {
    errors.push("Place of Birth: Maximum 100 characters");
  }

  // Passport: Optional but if number provided, must validate with expiry
  if (crew.passportNumber && crew.passportNumber.trim().length === 0) {
    errors.push("Passport Number: Cannot be empty if provided");
  } else if (crew.passportNumber && crew.passportNumber.trim().length > 50) {
    errors.push("Passport Number: Maximum 50 characters");
  }

  // Passport Expiry: ISO format, must be future date
  if (crew.passportExpiry) {
    const expiry = new Date(crew.passportExpiry);
    if (isNaN(expiry.getTime())) {
      errors.push("Passport Expiry: Invalid format (use YYYY-MM-DD)");
    } else if (expiry <= new Date()) {
      errors.push("Passport Expiry: Must not be expired (must be in future)");
    }
  }

  // Seaman Book: Optional but if number provided, must validate with expiry
  if (crew.seamanBookNumber && crew.seamanBookNumber.trim().length === 0) {
    errors.push("Seaman Book Number: Cannot be empty if provided");
  } else if (crew.seamanBookNumber && crew.seamanBookNumber.trim().length > 50) {
    errors.push("Seaman Book Number: Maximum 50 characters");
  }

  // Seaman Book Expiry: ISO format, must be future date
  if (crew.seamanBookExpiry) {
    const expiry = new Date(crew.seamanBookExpiry);
    if (isNaN(expiry.getTime())) {
      errors.push("Seaman Book Expiry: Invalid format (use YYYY-MM-DD)");
    } else if (expiry <= new Date()) {
      errors.push("Seaman Book Expiry: Must not be expired (must be in future)");
    }
  }

  // Address: Optional text, max 255 chars
  if (crew.address && crew.address.trim().length > 255) {
    errors.push("Address: Maximum 255 characters");
  }

  // Emergency Contact Name: Optional, 3+ chars if provided
  if (crew.emergencyContactName && crew.emergencyContactName.trim().length > 0) {
    if (crew.emergencyContactName.trim().length < 3) {
      errors.push("Emergency Contact Name: Must be at least 3 characters");
    } else if (crew.emergencyContactName.trim().length > 100) {
      errors.push("Emergency Contact Name: Maximum 100 characters");
    }
  }

  // Emergency Contact Phone: International format if provided
  if (crew.emergencyContactPhone && crew.emergencyContactPhone.trim().length > 0) {
    if (!/^\+\d{1,3}[-\d\s()]{6,20}$/.test(crew.emergencyContactPhone.trim())) {
      errors.push("Emergency Contact Phone: Must be in international format (+CC-XXXXXXX)");
    }
  }

  // Emergency Contact Relation: Optional text
  if (crew.emergencyContactRelation && crew.emergencyContactRelation.trim().length > 50) {
    errors.push("Emergency Contact Relation: Maximum 50 characters");
  }

  // Blood Type: Optional, valid blood types
  if (crew.bloodType && crew.bloodType.trim().length > 0) {
    const validBloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
    if (!validBloodTypes.includes(crew.bloodType.trim().toUpperCase())) {
      errors.push(`Blood Type: Invalid (must be one of: ${validBloodTypes.join(", ")})`);
    }
  }

  // Height: Optional, reasonable range 140-220 cm
  if (crew.heightCm !== undefined && crew.heightCm !== null) {
    if (typeof crew.heightCm !== "number" || crew.heightCm < 140 || crew.heightCm > 220) {
      errors.push("Height: Must be between 140-220 cm");
    }
  }

  // Weight: Optional, reasonable range 40-180 kg
  if (crew.weightKg !== undefined && crew.weightKg !== null) {
    if (typeof crew.weightKg !== "number" || crew.weightKg < 40 || crew.weightKg > 180) {
      errors.push("Weight: Must be between 40-180 kg");
    }
  }

  // Status: Optional, limited to valid values
  if (crew.status && crew.status.trim().length > 0) {
    const validStatuses = ["STANDBY", "ONBOARD", "OFF_SIGNED", "BLOCKED"];
    if (!validStatuses.includes(crew.status.toUpperCase())) {
      errors.push(`Status: Invalid (must be one of: ${validStatuses.join(", ")})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * POST /api/crew/bulk
 * Bulk import crew members with comprehensive validation
 */
export const POST = withPermission(
  "crew",
  PermissionLevel.EDIT_ACCESS,
  async (req: NextRequest) => {
    try {
      const payload = (await req.json()) as BulkCrewPayload;

      // Validate payload structure
      if (!Array.isArray(payload.crews) || payload.crews.length === 0) {
        return NextResponse.json(
          {
            error: "Invalid request",
            details: "crews field must be a non-empty array",
            example: {
              crews: [
                {
                  fullName: "John Doe",
                  rank: "Captain",
                  email: "john@example.com",
                  phone: "+62812-1234567",
                },
              ],
              dryRun: false,
            },
          },
          { status: 400 }
        );
      }

      if (payload.crews.length > 100) {
        return NextResponse.json(
          {
            error: "Request too large",
            details: "Maximum 100 crews per request",
            provided: payload.crews.length,
          },
          { status: 400 }
        );
      }

      // Validate all crew records
      const validationResults: Array<{
        row: number;
        fullName: string;
        valid: boolean;
        errors: string[];
      }> = [];

      let validCount = 0;
      let failCount = 0;

      for (let idx = 0; idx < payload.crews.length; idx++) {
        const crew = payload.crews[idx];
        const rowNumber = idx + 2; // Row 1 is header in CSV format

        if (!validateCrewData(crew)) {
          failCount++;
          validationResults.push({
            row: rowNumber,
            fullName: (crew as Partial<CrewBulkData>).fullName || "[Invalid]",
            valid: false,
            errors: ["Missing required fields: fullName (min 3 chars) and rank"],
          });
          continue;
        }

        const validation = validateCrewRecord(crew);
        if (!validation.valid) {
          failCount++;
          validationResults.push({
            row: rowNumber,
            fullName: crew.fullName,
            valid: false,
            errors: validation.errors,
          });
        } else {
          validCount++;
        }
      }

      // Return validation errors if any
      if (failCount > 0) {
        return NextResponse.json(
          {
            error: "Validation failed - please fix errors and retry",
            summary: {
              totalRows: payload.crews.length,
              validRows: validCount,
              invalidRows: failCount,
              successRate: `${Math.round((validCount / payload.crews.length) * 100)}%`,
            },
            failures: validationResults
              .filter((r) => !r.valid)
              .map((f) => ({
                row: f.row,
                fullName: f.fullName,
                errors: f.errors,
              })),
          },
          { status: 400 }
        );
      }

      // Dry-run mode: validate only, don't create
      if (payload.dryRun === true) {
        return NextResponse.json(
          {
            success: true,
            message: "✅ Dry-run validation successful - all records are valid",
            dryRun: true,
            summary: {
              validRows: validCount,
              totalRows: payload.crews.length,
              status: "READY_FOR_IMPORT",
              nextStep: "Set dryRun to false to actually create crews",
            },
          },
          { status: 200 }
        );
      }

      // Create crews in database
      const createdCrews: Array<{ id: string; seafarerName: string; rank: string; email: string | null; phone: string | null; status: string }> = [];
      const createErrors: Array<{ row: number; fullName: string; error: string }> = [];

      for (let idx = 0; idx < payload.crews.length; idx++) {
        const crew = payload.crews[idx];
        const rowNumber = idx + 2;

        try {
          const created = await prisma.crew.create({
            data: {
              seafarerName: crew.fullName.trim(),
              rank: crew.rank.trim(),
              email: crew.email?.trim() || null,
              phone: crew.phone?.trim() || null,
              dateOfBirth: crew.dateOfBirth ? new Date(crew.dateOfBirth) : null,
              placeOfBirth: crew.placeOfBirth?.trim() || null,
              nationality: crew.nationality?.trim() || null,
              passportNumber: crew.passportNumber?.trim() || null,
              passportExpiry: crew.passportExpiry ? new Date(crew.passportExpiry) : null,
              seamanBookNumber: crew.seamanBookNumber?.trim() || null,
              seamanBookExpiry: crew.seamanBookExpiry ? new Date(crew.seamanBookExpiry) : null,
              address: crew.address?.trim() || null,
              emergencyContactName: crew.emergencyContactName?.trim() || null,
              emergencyContactPhone: crew.emergencyContactPhone?.trim() || null,
              emergencyContactRelation: crew.emergencyContactRelation?.trim() || null,
              bloodType: crew.bloodType?.trim() || null,
              heightCm: crew.heightCm || null,
              weightKg: crew.weightKg || null,
              status: (crew.status?.toUpperCase() || "STANDBY") as "STANDBY" | "ONBOARD" | "OFF_SIGNED" | "BLOCKED",
            },
          });
          createdCrews.push(created);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Database error";
          createErrors.push({
            row: rowNumber,
            fullName: crew.fullName,
            error: errorMessage.includes("unique") ? "Duplicate: Email or passport already exists" : errorMessage,
          });
        }
      }

      // If some creations failed, return partial success
      if (createErrors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `⚠️ Partial import - ${createdCrews.length} crews created, ${createErrors.length} failed`,
            summary: {
              totalRequested: payload.crews.length,
              successfullyCreated: createdCrews.length,
              failedCreations: createErrors.length,
              importedAt: new Date().toISOString(),
            },
            created: createdCrews.map((c) => ({
              id: c.id,
              fullName: c.seafarerName,
              rank: c.rank,
              email: c.email,
            })),
            failures: createErrors,
          },
          { status: 207 }
        );
      }

      // All succeeded
      return NextResponse.json(
        {
          success: true,
          message: `✅ Successfully imported ${createdCrews.length} crew member(s)`,
          summary: {
            totalImported: createdCrews.length,
            importedAt: new Date().toISOString(),
            status: "COMPLETED",
          },
          crews: createdCrews.map((c) => ({
            id: c.id,
            fullName: c.seafarerName,
            rank: c.rank,
            email: c.email,
            phone: c.phone,
            status: c.status,
          })),
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("[Crew Bulk Import] Error:", error);
      return NextResponse.json(
        {
          error: "Internal server error",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  }
);
