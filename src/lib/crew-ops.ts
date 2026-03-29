import type { Prisma, PrismaClient, CrewOperationalStatus } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { generatePDF } from "@/lib/pdf-generator";

export const CREW_CODE_PREFIX = "HGI-CRW-";

export const CREW_STATUS_VALUES = [
  "AVAILABLE",
  "ON_BOARD",
  "STANDBY",
  "MEDICAL",
  "DOCUMENT_ISSUE",
] as const;

export type CrewStatusValue = (typeof CREW_STATUS_VALUES)[number];
export type CrewFileBucket = "passport" | "seamanbook" | "certificates" | "medical" | "visa";

type CrewCreateDelegate = Pick<PrismaClient["crew"], "create" | "findFirst">;

export function isCrewOperationalStatus(value: unknown): value is CrewStatusValue {
  return typeof value === "string" && CREW_STATUS_VALUES.includes(value as CrewStatusValue);
}

export function normalizeCrewOperationalStatus(value: unknown): CrewOperationalStatus {
  if (isCrewOperationalStatus(value)) {
    return value as CrewOperationalStatus;
  }

  return "AVAILABLE";
}

export async function generateNextCrewCode(delegate: Pick<CrewCreateDelegate, "findFirst">): Promise<string> {
  const lastCrew = await delegate.findFirst({
    where: {
      crewCode: {
        startsWith: CREW_CODE_PREFIX,
      },
    },
    orderBy: {
      crewCode: "desc",
    },
    select: {
      crewCode: true,
    },
  });

  const lastNumber = Number.parseInt(lastCrew?.crewCode?.slice(CREW_CODE_PREFIX.length) ?? "0", 10);
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;

  return `${CREW_CODE_PREFIX}${String(nextNumber).padStart(4, "0")}`;
}

export async function createCrewWithGeneratedCode(
  delegate: CrewCreateDelegate,
  data: Prisma.CrewCreateInput
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const crewCode = await generateNextCrewCode(delegate);

    try {
      return await delegate.create({
        data: {
          ...data,
          crewCode,
          crewStatus: data.crewStatus ?? "AVAILABLE",
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("crewCode")
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to allocate a unique crew code");
}

export function classifyCrewDocumentFolder(docType: string): CrewFileBucket {
  const normalized = docType.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");

  if (normalized.includes("PASSPORT") || normalized === "PASPOR") {
    return "passport";
  }

  if (normalized.includes("SEAMAN") && normalized.includes("BOOK")) {
    return "seamanbook";
  }

  if (normalized.includes("MEDICAL") || normalized === "MC" || normalized.includes("YELLOW_FEVER")) {
    return "medical";
  }

  if (normalized.includes("VISA")) {
    return "visa";
  }

  return "certificates";
}

export function buildCrewCvHtml(crew: {
  crewCode?: string | null;
  fullName: string;
  rank: string;
  nationality?: string | null;
  placeOfBirth?: string | null;
  dateOfBirth?: Date | string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  crewStatus?: string | null;
  documents?: Array<{
    docType: string;
    docNumber: string;
    expiryDate?: Date | string | null;
  }>;
  seaServiceHistories?: Array<{
    vesselName: string;
    companyName?: string | null;
    flag?: string | null;
    rank: string;
    vesselType?: string | null;
    grt?: number | null;
    engineOutput?: string | null;
    status: string;
    signOnDate: Date | string;
    signOffDate?: Date | string | null;
    reasonForSignOff?: string | null;
  }>;
}) {
  const formatDate = (value: Date | string | null | undefined) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const documents = (crew.documents ?? [])
    .slice(0, 8)
    .map(
      (document) => `
        <tr>
          <td>${escapeHtml(document.docType)}</td>
          <td>${escapeHtml(document.docNumber)}</td>
          <td>${escapeHtml(formatDate(document.expiryDate))}</td>
        </tr>`
    )
    .join("");

  const formatPeriod = (from: Date | string, to: Date | string | null | undefined) => {
    return `${formatDate(from)} / ${to ? formatDate(to) : "Present"}`;
  };

  const calculateMonthSpan = (from: Date | string, to: Date | string | null | undefined) => {
    const start = new Date(from);
    const end = to ? new Date(to) : new Date();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return "-";
    }

    const wholeMonths =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      (end.getDate() >= start.getDate() ? 1 : 0);

    return String(Math.max(wholeMonths, 1));
  };

  const seaServiceRows = (crew.seaServiceHistories ?? [])
    .slice()
    .sort((left, right) => {
      const leftDate = new Date(left.signOnDate).getTime();
      const rightDate = new Date(right.signOnDate).getTime();
      return rightDate - leftDate;
    })
    .map(
      (record, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(record.vesselName)}${record.flag ? `<span class="subtle">Flag: ${escapeHtml(record.flag)}</span>` : `<span class="subtle">Flag: Not recorded</span>`}</td>
          <td class="center">-</td>
          <td>${escapeHtml(formatPeriod(record.signOnDate, record.signOffDate))}</td>
          <td class="center">${escapeHtml(calculateMonthSpan(record.signOnDate, record.signOffDate))}</td>
          <td>${escapeHtml(record.rank)}</td>
          <td>${escapeHtml(record.vesselType ?? "Type not recorded")}</td>
          <td>${
            record.grt !== null && record.grt !== undefined
              ? `${escapeHtml(record.grt.toLocaleString("en-US"))} GRT`
              : "GRT not recorded"
          }${record.engineOutput ? `<span class="subtle">${escapeHtml(record.engineOutput)}</span>` : `<span class="subtle">Output not recorded</span>`}</td>
          <td>${escapeHtml(record.companyName ?? "Not recorded")}</td>
          <td>${escapeHtml(record.reasonForSignOff ?? (record.status === "ONGOING" ? "Currently serving" : "Not recorded"))}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${escapeHtml(crew.fullName)} CV</title>
      <style>
        body { font-family: Arial, sans-serif; color: #1f2937; margin: 32px; }
        h1, h2 { margin: 0; }
        .muted { color: #6b7280; }
        .subtle { display: block; margin-top: 3px; font-size: 10px; color: #6b7280; }
        .header { border-bottom: 3px solid #0f766e; padding-bottom: 16px; margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; margin-bottom: 24px; }
        .card { border: 1px solid #d1d5db; border-radius: 10px; padding: 14px; }
        .label { font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.04em; }
        .value { font-size: 15px; font-weight: 600; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #d1d5db; padding: 8px 10px; font-size: 12px; text-align: left; vertical-align: top; }
        th { background: #f3f4f6; }
        .section { margin-top: 24px; }
        .center { text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(crew.fullName)}</h1>
        <p class="muted">${escapeHtml(crew.rank)}${crew.crewCode ? ` • ${escapeHtml(crew.crewCode)}` : ""}</p>
      </div>
      <div class="grid">
        ${renderCard("Crew Status", crew.crewStatus ?? "-")}
        ${renderCard("Nationality", crew.nationality ?? "-")}
        ${renderCard("Date of Birth", formatDate(crew.dateOfBirth))}
        ${renderCard("Place of Birth", crew.placeOfBirth ?? "-")}
        ${renderCard("Phone", crew.phone ?? "-")}
        ${renderCard("Email", crew.email ?? "-")}
        ${renderCard("Address", crew.address ?? "-")}
      </div>
      <div class="section">
        <h2>Current Documents</h2>
        <table>
          <thead>
            <tr><th>Type</th><th>Number</th><th>Expiry</th></tr>
          </thead>
          <tbody>${documents || '<tr><td colspan="3">No document data</td></tr>'}</tbody>
        </table>
      </div>
      <div class="section">
        <h2>Sea Carrier</h2>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Vessel Name</th>
              <th>Wage (US$)</th>
              <th>Period From / To</th>
              <th>M</th>
              <th>Rank</th>
              <th>Vsl Type / Eng Type</th>
              <th>GRT / Output</th>
              <th>Agent / Principal</th>
              <th>Reason for Leaving</th>
            </tr>
          </thead>
          <tbody>${seaServiceRows || '<tr><td colspan="10">No verified sea service history recorded</td></tr>'}</tbody>
        </table>
      </div>
    </body>
  </html>`;
}

export async function generateCrewCvPdf(crew: Parameters<typeof buildCrewCvHtml>[0], filename: string) {
  const html = buildCrewCvHtml(crew);
  return generatePDF(html, filename, {
    format: "A4",
    margin: {
      top: "12mm",
      right: "10mm",
      bottom: "12mm",
      left: "10mm",
    },
  });
}

function renderCard(label: string, value: string) {
  return `<div class="card"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
