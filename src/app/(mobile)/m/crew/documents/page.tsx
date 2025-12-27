import { prisma } from "@/lib/prisma";
import { requireCrew } from "@/lib/authz";
import MobileShell from "../MobileShell";

const cardClass = "rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-950/90 via-slate-900/75 to-slate-950/90 p-6 shadow-[0_20px_45px_-22px_rgba(16,185,129,0.55)] backdrop-blur";
const badgeStyles: Record<CrewDocument["status"], string> = {
  VALID: "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-500/40",
  EXPIRED: "bg-rose-500/20 text-rose-100 ring-1 ring-rose-500/40",
  EXPIRING_SOON: "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/40",
  PENDING: "bg-sky-500/20 text-sky-100 ring-1 ring-sky-500/40",
};

type CrewDocument = {
  id: string;
  type: string;
  number: string;
  issuedAt: string;
  expiryAt: string;
  status: "VALID" | "EXPIRED" | "EXPIRING_SOON" | "PENDING";
  daysUntilExpiry?: number;
};

const fallbackDocuments: CrewDocument[] = [
  {
    id: "1",
    type: "BST",
    number: "123456",
    issuedAt: "2023-08-10",
    expiryAt: "2028-08-10",
    status: "VALID",
    daysUntilExpiry: 1560,
  },
  {
    id: "2",
    type: "AFF",
    number: "987654",
    issuedAt: "2020-01-01",
    expiryAt: "2025-01-01",
    status: "EXPIRED",
    daysUntilExpiry: -720,
  },
];

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString().split("T")[0] : "—";
}

function formatDocType(value: string | null | undefined) {
  if (!value) {
    return "DOCUMENT";
  }
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getDocumentStatus(expiryDate: Date | null | undefined): "VALID" | "EXPIRED" | "EXPIRING_SOON" | "PENDING" {
  if (!expiryDate) {
    return "PENDING";
  }

  const now = new Date();
  const thirteenMonthsFromNow = new Date();
  thirteenMonthsFromNow.setMonth(thirteenMonthsFromNow.getMonth() + 13);

  if (expiryDate < now) {
    return "EXPIRED";
  }

  if (expiryDate <= thirteenMonthsFromNow) {
    return "EXPIRING_SOON";
  }

  return "VALID";
}

function getDaysUntilExpiry(expiryDate: Date | null | undefined): number | undefined {
  if (!expiryDate) {
    return undefined;
  }

  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

async function getCrewDocuments(userId: string | undefined): Promise<CrewDocument[]> {
  if (!userId) {
    return fallbackDocuments;
  }

  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const include = {
      documents: {
        where: { isActive: true },
        orderBy: { expiryDate: "asc" },
        select: {
          id: true,
          docType: true,
          docNumber: true,
          issueDate: true,
          expiryDate: true,
          fileUrl: true,
        },
      },
    } as const;

    let crew = await prisma.crew.findUnique({ where: { id: userId }, include });
    if (!crew && userRecord?.email) {
      crew = await prisma.crew.findFirst({
        where: { email: userRecord.email },
        include,
      });
    }

    if (!crew) {
      return fallbackDocuments;
    }

    if (crew.documents.length === 0) {
      return fallbackDocuments;
    }

    return crew.documents.map((document) => {
      const status = getDocumentStatus(document.expiryDate);
      const daysUntilExpiry = getDaysUntilExpiry(document.expiryDate);

      return {
        id: document.id,
        type: formatDocType(document.docType),
        number: document.docNumber ?? "—",
        issuedAt: formatDate(document.issueDate ?? null),
        expiryAt: formatDate(document.expiryDate ?? null),
        status,
        daysUntilExpiry,
      };
    });
  } catch (error) {
    console.error("Failed to load crew documents", error);
    return fallbackDocuments;
  }
}

export default async function CrewDocumentsPage() {
  const { user } = await requireCrew();
  const docs = await getCrewDocuments(user.id);

  // Sort documents: EXPIRING_SOON first, then PENDING, then VALID, then EXPIRED
  const sortedDocs = [...docs].sort((a, b) => {
    const priorityOrder = { EXPIRING_SOON: 0, PENDING: 1, VALID: 2, EXPIRED: 3 };
    const priorityA = priorityOrder[a.status];
    const priorityB = priorityOrder[b.status];
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // Within same priority, sort by days until expiry (if applicable)
    if (a.daysUntilExpiry !== undefined && b.daysUntilExpiry !== undefined) {
      return a.daysUntilExpiry - b.daysUntilExpiry;
    }
    return 0;
  });

  return (
    <MobileShell
      title="Document Wallet"
      subtitle="Review your certificates and plan renewals on time."
      activeTab="documents"
    >
      <div className="space-y-6">
        <section className={`${cardClass} space-y-3`}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 4h10l4 4v12H5V4z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-200">Active Certificates</h2>
              <p className="mt-1 text-xs text-slate-300/90">Maintain valid copies to keep voyage clearance smooth.</p>
            </div>
          </div>
          <p className="text-xs text-slate-300/90">
            Use the wallet to verify expiry dates, renew documents early, and upload latest scans via the mobile app.
          </p>
        </section>

        {sortedDocs.map((doc) => (
          <article key={doc.id} className={`${cardClass} space-y-4 text-sm`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <h3 className="text-base font-semibold text-slate-100">{doc.type}</h3>
                <p className="text-xs text-slate-300/90">Document No. {doc.number}</p>
              </div>
              <span className={`whitespace-nowrap px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${badgeStyles[doc.status]}`}>
                {doc.status === "EXPIRING_SOON"
                  ? "Expiring Soon"
                  : doc.status === "PENDING"
                    ? "Pending Review"
                    : doc.status}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-xs text-slate-200 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-2xl border border-slate-800/40 bg-slate-950/60 px-3 py-3">
                <span className="font-semibold text-slate-100">Issued</span>
                <span className="text-slate-300/90">{doc.issuedAt}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-800/40 bg-slate-950/60 px-3 py-3">
                <span className="font-semibold text-slate-100">Expiry</span>
                <span
                  className={
                    doc.status === "EXPIRED"
                      ? "text-rose-200"
                      : doc.status === "EXPIRING_SOON"
                        ? "text-amber-200"
                        : "text-slate-300/90"
                  }
                >
                  {doc.expiryAt}
                </span>
              </div>
            </div>
            {doc.daysUntilExpiry !== undefined && doc.status !== "PENDING" && (
              <div className="rounded-2xl border border-slate-800/40 bg-slate-950/60 px-3 py-2">
                <p className="text-[11px] font-semibold text-slate-300/90">
                  {doc.status === "EXPIRED"
                    ? `Expired ${Math.abs(doc.daysUntilExpiry)} days ago`
                    : doc.status === "EXPIRING_SOON"
                      ? `Expires in ${doc.daysUntilExpiry} days`
                      : `Valid for ${doc.daysUntilExpiry} days`}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </MobileShell>
  );
}
