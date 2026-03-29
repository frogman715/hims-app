"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { canAccessOfficePath } from "@/lib/office-access";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface CrewSignOffSummary {
  id: string;
  status: string;
  signOffDate: string;
  arrivalDate?: string | null;
  passportReceived?: boolean;
  seamanBookReceived?: boolean;
  debriefingCompleted?: boolean;
  finalWageAmount?: number | null;
  crew?: {
    fullName?: string;
    rank?: string;
    phone?: string | null;
  } | null;
  assignment?: {
    vessel?: {
      name?: string | null;
    } | null;
  } | null;
}

const SIGN_OFF_STATUS_META: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Pending", tone: "bg-yellow-100 text-yellow-800" },
  DOCUMENTS_RECEIVED: { label: "Documents Received", tone: "bg-blue-100 text-blue-800" },
  DEBRIEFING_DONE: { label: "Debriefing Done", tone: "bg-purple-100 text-purple-800" },
  WAGES_CALCULATED: { label: "Wages Calculated", tone: "bg-cyan-100 text-cyan-800" },
  WAGES_PAID: { label: "Wages Paid", tone: "bg-green-100 text-green-800" },
  COMPLETED: { label: "Completed", tone: "bg-gray-100 text-gray-800" },
};

export default function CrewSignOffPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [signOffs, setSignOffs] = useState<CrewSignOffSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    const allowed = canAccessOfficePath(
      "/api/crewing/sign-off",
      [...(session.user?.roles ?? []), session.user?.role ?? ""].filter(Boolean),
      session.user?.isSystemAdmin === true,
      "GET"
    );

    if (!allowed) {
      setIsAuthorized(false);
      return;
    }

    setIsAuthorized(true);
  }, [session, status, router]);

  const fetchSignOffs = useCallback(async () => {
    try {
      setError(null);
      const url = filter === "ALL" 
        ? "/api/crewing/sign-off"
        : `/api/crewing/sign-off?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const signOffData = Array.isArray(data.signOffs)
          ? (data.signOffs as CrewSignOffSummary[])
          : [];
        setSignOffs(signOffData);
      } else {
        setError("Failed to fetch sign-off data");
      }
    } catch (error) {
      console.error("Failed to fetch sign-offs:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch sign-off data");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAuthorized) {
      fetchSignOffs();
    }
  }, [fetchSignOffs, isAuthorized]);

  const getStatusLabel = (status: string) => {
    return SIGN_OFF_STATUS_META[status]?.label || status.replace(/_/g, " ");
  };

  const signOffSteps = [
    { step: 1, title: "Report to Crewing", icon: "📋", status: "PENDING" },
    { step: 2, title: "Submit Documents", icon: "📄", status: "DOCUMENTS_RECEIVED" },
    { step: 3, title: "De-briefing", icon: "💬", status: "DEBRIEFING_DONE" },
    { step: 4, title: "Wage Calculation", icon: "🧮", status: "WAGES_CALCULATED" },
    { step: 5, title: "Payment", icon: "💰", status: "WAGES_PAID" },
    { step: 6, title: "Document Withdrawal", icon: "✅", status: "COMPLETED" }
  ];

  if (status === "loading" || (loading && !isAuthorized)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900" />
      </div>
    );
  }

  if (!session || !isAuthorized) {
    return (
      <section className="surface-card border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900 shadow-sm">
            Access to sign-off management is restricted for your role.
      </section>
    );
  }

  if (error) {
    return (
      <section className="surface-card border-rose-200 bg-rose-50 p-6">
        <h3 className="mb-2 text-lg font-semibold text-rose-800">Error Loading Sign-Off Data</h3>
        <p className="mb-4 text-rose-700">{error}</p>
        <Button type="button" variant="danger" size="sm" onClick={() => fetchSignOffs()}>
          Try Again
        </Button>
      </section>
    );
  }

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Return Operations</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Crew sign-off management</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">HGQS Annex D sign-off procedures and wage settlement review.</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => router.push('/crewing')}>
            Back to crewing
          </Button>
        </div>
      </section>

      <section className="surface-card border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900 shadow-sm">
          Sign-off is handled as a controlled operations board. Open the record from workflow handling, then track documents, debriefing, wage settlement, and final closure here.
      </section>

      <section className="surface-card p-6">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">Sign-off process flow</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {signOffSteps.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-2xl">
                    {step.icon}
                  </div>
                  <div className="text-xs font-semibold text-slate-700">{step.title}</div>
                  <div className="mt-1 text-sm text-slate-600">Step {step.step}</div>
                </div>
                {index < signOffSteps.length - 1 && (
                  <div className="absolute top-8 left-full hidden h-0.5 w-full -translate-x-1/2 bg-slate-300 md:block" />
                )}
              </div>
            ))}
          </div>
      </section>

      <section className="surface-card p-2 flex gap-2 overflow-x-auto">
          {["ALL", "PENDING", "DOCUMENTS_RECEIVED", "DEBRIEFING_DONE", "WAGES_CALCULATED", "WAGES_PAID", "COMPLETED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-lg px-4 py-2 font-medium whitespace-nowrap ${
                filter === status ? "bg-amber-600 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {status === "ALL" ? "All" : getStatusLabel(status)}
            </button>
          ))}
      </section>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900" />
        </div>
      ) : signOffs.length === 0 ? (
          <section className="surface-card p-12 text-center">
            <div className="text-6xl mb-4">🚢</div>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">No Sign-Off Records</h3>
            <p className="text-slate-700">
              {filter === "ALL"
                ? "No sign-off records have been opened yet for returning crew."
                : `No sign-off records are currently in ${getStatusLabel(filter)}.`}
            </p>
          </section>
      ) : (
          <div className="grid gap-4">
            {signOffs.map((signOff) => (
              <div key={signOff.id} className="surface-card p-6 transition-shadow hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{signOff.crew?.fullName}</h3>
                    <p className="text-slate-700">{signOff.crew?.rank}</p>
                    <p className="text-sm text-slate-500">Sign-Off: {new Date(signOff.signOffDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={signOff.status} label={getStatusLabel(signOff.status)} className="px-3 py-2" />
                </div>

                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Passport:</span>
                    <span className={`ml-2 font-medium ${signOff.passportReceived ? "text-green-600" : "text-red-600"}`}>
                      {signOff.passportReceived ? "✓ Received" : "✗ Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Seaman Book:</span>
                    <span className={`ml-2 font-medium ${signOff.seamanBookReceived ? "text-green-600" : "text-red-600"}`}>
                      {signOff.seamanBookReceived ? "✓ Received" : "✗ Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">De-briefing:</span>
                    <span className={`ml-2 font-medium ${signOff.debriefingCompleted ? "text-green-600" : "text-red-600"}`}>
                      {signOff.debriefingCompleted ? "✓ Done" : "✗ Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Final Wage:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      {signOff.finalWageAmount ? `$${signOff.finalWageAmount.toLocaleString()}` : "Not calculated"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    Status Update Page Not Live Yet
                  </button>
                </div>
              </div>
            ))}
          </div>
      )}

      <div className="mt-12 text-center text-sm text-slate-500">
          <p>HGQS Procedures Manual - Annex D | Sign-Off Seafarer Management</p>
      </div>
    </div>
  );
}
