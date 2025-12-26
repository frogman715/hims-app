#!/usr/bin/env node

/**
 * Bulk Crew Import Script
 * 
 * Usage:
 *   npx ts-node scripts/bulk-import-crew.ts crews.csv
 *   npx ts-node scripts/bulk-import-crew.ts crews.csv --dry-run
 * 
 * CSV Format: See crew-bulk-import-template.csv
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

interface CrewRecord {
  fullName: string;
  rank: string;
  email?: string;
  phone?: string;
  nationality?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  passportNumber?: string;
  passportExpiry?: string;
  seamanBookNumber?: string;
  seamanBookExpiry?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  bloodType?: string;
  heightCm?: string;
  weightKg?: string;
  status?: string;
}

const API_BASE_URL = process.env.API_URL || "http://localhost:3000";
const API_TOKEN = process.env.API_TOKEN || "";

class Colors {
  static green = "\x1b[32m";
  static red = "\x1b[31m";
  static yellow = "\x1b[33m";
  static blue = "\x1b[34m";
  static reset = "\x1b[0m";
}

function log(color: string, message: string) {
  console.log(`${color}${message}${Colors.reset}`);
}

async function bulkImportCrew(
  csvFilePath: string,
  dryRun: boolean = false
): Promise<void> {
  try {
    // Check file exists
    if (!fs.existsSync(csvFilePath)) {
      log(Colors.red, `❌ File not found: ${csvFilePath}`);
      process.exit(1);
    }

    log(Colors.blue, `📂 Reading file: ${csvFilePath}`);

    // Read and parse CSV
    const fileContent = fs.readFileSync(csvFilePath, "utf-8");
    const records: CrewRecord[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        if (!value || value.trim() === "") return null;
        
        // Convert numeric fields
        if (context.column === "heightCm" || context.column === "weightKg") {
          const num = Number(value);
          return Number.isNaN(num) ? null : num;
        }
        
        return value;
      },
    });

    log(Colors.blue, `📋 Found ${records.length} crew records\n`);

    if (records.length === 0) {
      log(Colors.yellow, "⚠️  No records to import");
      process.exit(0);
    }

    // Show preview of first few records
    log(Colors.blue, "Preview of first 3 records:");
    records.slice(0, 3).forEach((record, index) => {
      console.log(
        `  ${index + 1}. ${record.fullName} (${record.rank})`
      );
    });

    if (records.length > 3) {
      console.log(`  ... and ${records.length - 3} more records\n`);
    } else {
      console.log("");
    }

    // Prepare payload
    const payload = {
      crews: records,
      dryRun,
    };

    log(
      Colors.blue,
      `🔍 Mode: ${dryRun ? "DRY RUN (Validation only)" : "ACTUAL IMPORT"}`
    );
    log(Colors.blue, `🌐 API: ${API_BASE_URL}/api/crew/bulk\n`);
    log(Colors.yellow, "Sending request to API...\n");

    // Send to API
    const response = await fetch(`${API_BASE_URL}/api/crew/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_TOKEN && { Authorization: `Bearer ${API_TOKEN}` }),
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as Record<string, unknown>;

    if (response.ok) {
      log(Colors.green, "✅ SUCCESS!\n");

      if (dryRun) {
        log(Colors.green, `✓ Validation passed for all ${records.length} crews`);
        log(
          Colors.yellow,
          "\n💡 Run again without --dry-run to actually import:"
        );
        log(Colors.yellow, `   npx ts-node scripts/bulk-import-crew.ts ${path.basename(csvFilePath)}\n`);
      } else {
        log(Colors.green, `✓ Created ${result.created} crews\n`);
        log(Colors.blue, "📊 Created Crews:");
        (result.crews as unknown as Record<string, unknown>[])?.forEach((crew: Record<string, unknown>) => {
          console.log(`  • ${crew.fullName} (${crew.rank})`);
          if (crew.email) console.log(`    Email: ${crew.email}`);
          if (crew.phone) console.log(`    Phone: ${crew.phone}`);
        });
        console.log("");
      }
    } else {
      log(Colors.red, "❌ IMPORT FAILED!\n");
      log(Colors.red, `Error: ${result.error}\n`);

      if (result.failures && result.failures.length > 0) {
        log(Colors.red, `❌ Validation errors on ${result.failCount} records:\n`);
        (result.failures as unknown as Record<string, unknown>[]).forEach((failure: Record<string, unknown>) => {
          log(Colors.red, `  Row ${failure.row}: ${failure.fullName}`);
          (failure.errors as string[]).forEach((err: string) => {
            log(Colors.red, `    • ${err}`);
          });
        });
      }

      process.exit(1);
    }
  } catch (error) {
    log(Colors.red, `❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);
const csvFile = args[0];
const isDryRun = args.includes("--dry-run");

if (!csvFile) {
  log(Colors.yellow, "📋 Bulk Crew Import Script\n");
  log(Colors.blue, "Usage:");
  console.log("  npx ts-node scripts/bulk-import-crew.ts <csv-file>");
  console.log("  npx ts-node scripts/bulk-import-crew.ts <csv-file> --dry-run\n");
  log(Colors.blue, "Example:");
  console.log("  npx ts-node scripts/bulk-import-crew.ts crews.csv");
  console.log("  npx ts-node scripts/bulk-import-crew.ts crews.csv --dry-run\n");
  process.exit(1);
}

bulkImportCrew(csvFile, isDryRun);
