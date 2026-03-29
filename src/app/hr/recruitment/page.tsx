"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getRecruitmentBadgeTone,
  getRecruitmentStatusLabel,
  type RecruitmentStatus,
} from "@/lib/recruitment-flow";
import { PermissionLevel, hasPermission } from "@/lib/permissions";
import { normalizeToUserRoles } from "@/lib/type-guards";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

interface Recruitment {
  id: string;
  crewId: string;
  candidateName: string | null;
  position: string | null;
  appliedDate: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  status: RecruitmentStatus;
  statusLabel: string;
  notes?: string | null;
}

export default function RecruitmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const canManageRecruitment = hasPermission(userRoles, "crewing", PermissionLevel.EDIT_ACCESS);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchRecruitments();
    }
  }, [session]);

  const fetchRecruitments = async () => {
    try {
      const response = await fetch("/api/recruitments");
      if (response.ok) {
        const data = await response.json();
        setRecruitments(data);
        setError(null);
      } else {
        const payload = await response.json().catch(() => null);
        setError(payload?.error || "Recruitment data could not be loaded.");
      }
    } catch (error) {
      console.error("Error fetching recruitments:", error);
      setError("Recruitment data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading recruitment pipeline...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const pendingReviewCount = recruitments.filter((item) => item.status !== "HIRED" && item.status !== "REJECTED").length;
  const hiredCount = recruitments.filter((item) => item.status === "HIRED").length;
  const declinedCount = recruitments.filter((item) => item.status === "REJECTED").length;

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Recruitment Workspace"
        title="Recruitment management"
        subtitle="Controlled maritime candidate pipeline before handover into the active seafarer pool."
        helperLinks={[
          { href: "/hr", label: "HR Workspace" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Candidate Pool", value: recruitments.length, detail: "All candidate records currently visible in recruitment." },
          { label: "Pending Review", value: pendingReviewCount, detail: "Candidates still inside screening, approval, or hiring review." },
          { label: "Hired", value: hiredCount, detail: "Candidates already approved and handed over to seafarer records." },
          { label: "Declined", value: declinedCount, detail: "Candidates closed without hire and kept for traceability." },
        ]}
        actions={(
          <>
            <Link href="/hr" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
              Back to HR
            </Link>
            {canManageRecruitment ? (
              <Link href="/hr/recruitment/new" className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Register Candidate
              </Link>
            ) : null}
          </>
        )}
      />

      <section className="surface-card p-6">
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">1. Review active pipeline</p>
              <p className="mt-2 text-sm text-slate-600">Start with candidates still waiting for approval, screening, or hire decisions.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">2. Keep decision linear</p>
              <p className="mt-2 text-sm text-slate-600">Use recruitment detail only for the next supported action: approve, decline, or hire.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">3. Handover after hire</p>
              <p className="mt-2 text-sm text-slate-600">Active seafarer records should open only after the recruitment case is approved for hire.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-slate-900">Recruitment Candidates</h2>
            </div>
            {error ? (
              <div className="border-b border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            <ul className="divide-y divide-gray-200">
              {recruitments.map((recruitment) => (
                <li key={recruitment.id} className="transition-colors duration-200 hover:bg-slate-50">
                  <div className="px-6 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="truncate text-lg font-semibold text-cyan-800">
                            {recruitment.candidateName || `Candidate ${recruitment.crewId}`}
                          </p>
                          <p className="ml-3 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-500">
                            Position: {recruitment.position || "Not assigned"}
                          </p>
                        </div>
                        <div className="mt-3 sm:flex sm:justify-between">
                          <div className="sm:flex">
                              <p className="flex items-center text-sm text-slate-500">
                              📅 Applied: {new Date(recruitment.appliedDate).toLocaleDateString()}
                            </p>
                            {recruitment.phone ? (
                              <p className="mt-2 flex items-center text-sm text-slate-500 sm:ml-6 sm:mt-0">
                                ☎ {recruitment.phone}
                              </p>
                            ) : null}
                            {recruitment.email ? (
                              <p className="mt-2 flex items-center text-sm text-slate-500 sm:ml-6 sm:mt-0">
                                ✉ {recruitment.email}
                              </p>
                            ) : null}
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold ${getRecruitmentBadgeTone(recruitment.status)}`}>
                              {getRecruitmentStatusLabel(recruitment.status)}
                            </span>
                          </div>
                        </div>
                        {recruitment.notes && (
                          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                            📝 Notes: {recruitment.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <Link
                          href={`/hr/recruitment/${recruitment.id}`}
                          className="inline-flex items-center rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
                        >
                          {canManageRecruitment ? "Process" : "Review"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {recruitments.length === 0 && (
              <div className="px-6 py-12 text-center">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">No candidates yet</h3>
                <p className="mb-4 text-slate-500">Start by adding your first recruitment candidate.</p>
                {canManageRecruitment ? (
                  <Link
                    href="/hr/recruitment/new"
                    className="inline-flex items-center rounded-lg bg-cyan-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800"
                  >
                    Add First Candidate
                  </Link>
                ) : null}
              </div>
            )}
          </div>
      </section>
    </div>
  );
}
