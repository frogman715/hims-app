import { prisma } from "@/lib/prisma";
import { requireCrew } from "@/lib/authz";
import MobileShell from "../MobileShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cardClass = "rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-950/90 via-slate-900/75 to-slate-950/90 p-6 shadow-[0_20px_45px_-22px_rgba(16,185,129,0.55)] backdrop-blur";
const sectionCardClass = "rounded-3xl border border-slate-800/40 bg-slate-950/65 p-6";

type CrewProfile = {
  name: string;
  email: string;
  rank: string;
  phone: string;
  nationality: string;
  lastVessel: string;
};

const fallbackProfile: CrewProfile = {
  name: "Crew Example",
  email: "crew@example.com",
  rank: "3/O",
  phone: "+62 812-0000-0000",
  nationality: "Indonesia",
  lastVessel: "MT Hanmarine",
};

async function getCrewProfile(userId: string | undefined): Promise<CrewProfile> {
  if (!userId) {
    return fallbackProfile;
  }

  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not configured, falling back to static crew profile");
    return fallbackProfile;
  }

  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    const include = {
      assignments: {
        orderBy: { startDate: "desc" },
        take: 1,
        select: {
          rank: true,
          vessel: {
            select: { name: true },
          },
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
      return {
        ...fallbackProfile,
        name: userRecord?.name ?? fallbackProfile.name,
        email: userRecord?.email ?? fallbackProfile.email,
      };
    }

    const latestAssignment = crew.assignments[0];

    return {
      name: crew.fullName,
      email: userRecord?.email ?? fallbackProfile.email,
      rank: latestAssignment?.rank ?? crew.rank,
      phone: crew.phone ?? fallbackProfile.phone,
      nationality: crew.nationality ?? fallbackProfile.nationality,
      lastVessel: latestAssignment?.vessel?.name ?? fallbackProfile.lastVessel,
    };
  } catch (error) {
    console.error("Failed to load crew profile", error);
    return fallbackProfile;
  }
}

export default async function CrewProfilePage() {
  const { user, session } = await requireCrew();

  const sessionFallback: CrewProfile = {
    ...fallbackProfile,
    name: session.user?.name ?? fallbackProfile.name,
    email: session.user?.email ?? fallbackProfile.email,
  };

  let profile: CrewProfile = sessionFallback;

  try {
    profile = await Promise.race<CrewProfile>([
      getCrewProfile(user.id),
      new Promise<CrewProfile>((resolve) => {
        setTimeout(() => {
          console.warn("Crew profile query timed out, using session fallback");
          resolve(sessionFallback);
        }, 300);
      }),
    ]);
  } catch (error) {
    console.error("Failed to load crew profile", error);
    profile = sessionFallback;
  }

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "CR";

  return (
    <MobileShell
      title="Crew Profile"
      subtitle="Personal information synced with HIMS."
      activeTab="profile"
    >
      <div className="space-y-6">
        <section className={`${cardClass} flex items-center gap-4 text-sm text-slate-200`}>
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/30 via-emerald-500/15 to-slate-900 text-xl font-semibold text-emerald-50">
            {initials}
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-100">{profile.name}</h2>
            <p className="mt-1 text-xs uppercase tracking-widest text-emerald-100">{profile.rank}</p>
            <p className="mt-2 text-xs text-slate-300/90">Latest vessel: {profile.lastVessel}</p>
          </div>
        </section>

        <section className={sectionCardClass}>
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-200">Contact Details</h3>
              <p className="mt-1 text-xs text-slate-300/90">Ensure the office can reach you for crew changes.</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 5a2 2 0 0 1 2-2h2l2 4-2 1a12 12 0 0 0 6 6l1-2 4 2v2a2 2 0 0 1-2 2h-1C8.82 18 6 15.18 6 11V7a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </header>
          <dl className="mt-4 space-y-4 text-sm text-slate-200">
            <div className="rounded-2xl border border-slate-800/40 bg-slate-950/60 px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-300/90">Email</dt>
              <dd className="mt-1 text-sm font-medium text-slate-100">{profile.email}</dd>
            </div>
            <div className="rounded-2xl border border-slate-800/40 bg-slate-950/60 px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-300/90">Phone</dt>
              <dd className="mt-1 text-sm font-medium text-slate-100">{profile.phone}</dd>
            </div>
          </dl>
        </section>

        <section className={sectionCardClass}>
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-200">Personal Information</h3>
              <p className="mt-1 text-xs text-slate-300/90">Data shared with principals and port authorities.</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-200">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5z" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </span>
          </header>
          <dl className="mt-4 space-y-4 text-sm text-slate-200">
            <div className="rounded-2xl border border-slate-800/40 bg-slate-950/60 px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-300/90">Nationality</dt>
              <dd className="mt-1 text-sm font-medium text-slate-100">{profile.nationality}</dd>
            </div>
            <div className="rounded-2xl border border-slate-800/40 bg-slate-950/60 px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-300/90">Latest Vessel</dt>
              <dd className="mt-1 text-sm font-medium text-slate-100">{profile.lastVessel}</dd>
            </div>
          </dl>
        </section>
      </div>
    </MobileShell>
  );
}
