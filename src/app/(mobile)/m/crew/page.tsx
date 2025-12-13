import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCrew } from "@/lib/authz";
import MobileShell from "./MobileShell";

const cardClass = "rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-950/90 via-slate-900/75 to-slate-950/90 p-6 shadow-[0_20px_45px_-22px_rgba(16,185,129,0.55)] backdrop-blur";
const statCardClass = "rounded-3xl border border-slate-800/40 bg-slate-950/65 p-4 shadow-inner shadow-slate-900/40";
const badgeClass = "inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-100";

type CrewSummary = {
  name: string;
  rank: string;
  status: string;
  nextJoinDate: string;
  expiringDocs: number;
  pendingUploads: number;
};

const fallbackSummary: CrewSummary = {
  name: "Crew Example",
  rank: "3/O",
  status: "Standby",
  nextJoinDate: "2026-01-10",
  expiringDocs: 2,
  pendingUploads: 3,
};

function formatStatus(value?: string | null) {
  if (!value) {
    return fallbackSummary.status;
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateDisplay(value: string) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

async function getCrewSummary(userId: string | undefined): Promise<CrewSummary> {
  if (!userId) {
    return fallbackSummary;
  }

  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const include = {
      documents: {
        where: { isActive: true },
        select: { expiryDate: true, fileUrl: true },
      },
      assignments: {
        orderBy: { startDate: "desc" },
        take: 3,
        select: {
          startDate: true,
          status: true,
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
      return fallbackSummary;
    }

    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + 60);

    const expiringDocs = crew.documents.reduce((count, document) => {
      if (!document.expiryDate) {
        return count;
      }
      return document.expiryDate <= threshold ? count + 1 : count;
    }, 0);

    const pendingUploads = crew.documents.reduce((count, document) => {
      return !document.fileUrl ? count + 1 : count;
    }, 0);

    const upcomingAssignment = crew.assignments.find((assignment) => assignment.startDate >= now);
    const latestAssignment = crew.assignments[0];
    const nextJoinSource = upcomingAssignment?.startDate ?? latestAssignment?.startDate ?? null;
    const nextJoinDate = nextJoinSource
      ? nextJoinSource.toISOString().split("T")[0]
      : fallbackSummary.nextJoinDate;

    return {
      name: crew.fullName,
      rank: crew.rank,
      status: formatStatus(crew.status),
      nextJoinDate,
      expiringDocs,
      pendingUploads,
    };
  } catch (error) {
    console.error("Failed to load crew summary", error);
    return fallbackSummary;
  }
}

export default async function CrewHomePage() {
  const { user } = await requireCrew();
  const summary = await getCrewSummary(user.id);
  const formattedJoinDate = formatDateDisplay(summary.nextJoinDate);
  const safeStatus = formatStatus(summary.status);

  return (
    <MobileShell
      title={`Hi, ${summary.name}`}
      subtitle={`${summary.rank} • Stay ready for your next voyage.`}
      activeTab="home"
    >
      <div className="space-y-6">
        <section className={`${cardClass} space-y-5`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M8 2v4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 2v4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4.5 9h15" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="4.5" y="5" width="15" height="16" rx="2" />
                  <path d="M12 13h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-300/90">Next Joining</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-100">{formattedJoinDate}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300/90">
                  Ensure travel documents and medical checks are up to date before embarkation day.
                </p>
              </div>
            </div>
            <span className={badgeClass}>{safeStatus}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/m/crew/documents"
              className={`${statCardClass} transition hover:border-emerald-400/50 hover:bg-slate-900/70`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-300/90">Expiring Docs</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-100">{summary.expiringDocs}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-100">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 6v6l3 2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-300/90">Certificates expiring within the next 60 days.</p>
            </Link>

            <Link
              href="/m/crew/upload"
              className={`${statCardClass} transition hover:border-emerald-400/50 hover:bg-slate-900/70`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-300/90">Pending Uploads</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-100">{summary.pendingUploads}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-100">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 16V4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.5 7.5 12 4l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13A1.5 1.5 0 0 0 20 18.5V16" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-300/90">Upload pending files to keep your onboarding complete.</p>
            </Link>
          </div>
        </section>

        <section className={`${cardClass} space-y-4`}>
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-200">Readiness Checklist</h2>
              <p className="mt-1 text-xs text-slate-300/90">Monitor priorities before your next deployment.</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-200">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12.8V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </header>
          <ul className="space-y-3 text-sm text-slate-100">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-100">1</span>
              <div>
                <p className="font-semibold">Confirm joining schedule</p>
                <p className="text-xs text-slate-300/90">Coordinate travel minimum 14 days before embarkation.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/25 text-amber-100">2</span>
              <div>
                <p className="font-semibold">Renew expiring certificates</p>
                <p className="text-xs text-slate-300/90">Upload BST, AFF, medical, or visa copies that expire soon.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/25 text-sky-100">3</span>
              <div>
                <p className="font-semibold">Notify office of changes</p>
                <p className="text-xs text-slate-300/90">Update contact info if you switch phone number or address.</p>
              </div>
            </li>
          </ul>
        </section>

        <section className={`${cardClass} space-y-4`}>
          <header>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-200">Quick Links</h2>
            <p className="mt-1 text-xs text-slate-300/90">Access your document wallet or upload new files instantly.</p>
          </header>
          <div className="flex flex-col gap-3">
            <Link
              href="/m/crew/documents"
              className="flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-400/60 hover:bg-slate-900/70"
            >
              <span>View certificate wallet</span>
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/m/crew/upload"
              className="flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-400/60 hover:bg-slate-900/70"
            >
              <span>Upload new document</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
