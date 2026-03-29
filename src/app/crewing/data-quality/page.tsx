"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";

type DataQualityIssue = {
  type: string;
  message: string;
  severity: "high" | "medium";
};

type CrewQualityItem = {
  id: string;
  crewCode: string | null;
  fullName: string;
  rank: string;
  crewStatus: string;
  issues: DataQualityIssue[];
  expiringDocuments: Array<{
    id: string;
    docType: string;
    expiryDate: string | null;
  }>;
};

type DataQualityResponse = {
  generatedAt: string;
  summary: {
    totalCrewsWithIssues: number;
    highSeverity: number;
    mediumSeverity: number;
    byType: Record<string, number>;
  };
  data: CrewQualityItem[];
};

function mapIssueLabel(issue: DataQualityIssue) {
  if (issue.type === "DOCUMENT_EXPIRING") {
    return "Blocked by Missing/Expiring Items";
  }
  if (issue.type === "NO_ACTIVE_ASSIGNMENT") {
    return "Assignment Risk Advisory";
  }
  if (issue.severity === "high") {
    return "Blocked by Missing/Expiring Items";
  }
  return "Needs Attention";
}

export default function DataQualityPage() {
  const [payload, setPayload] = useState<DataQualityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/crewing/data-quality", { cache: "no-store" });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data) {
          throw new Error(data?.error ?? "Failed to load data quality review");
        }

        if (active) {
          setPayload(data as DataQualityResponse);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load data quality review");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const generatedAt = useMemo(() => {
    if (!payload?.generatedAt) return "Not available";
    return new Date(payload.generatedAt).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [payload?.generatedAt]);

  return (
    <div className="section-stack">
        <section className="surface-card p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">Data Quality</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Crew Data Quality Review</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Advisory only. This page is review output for office staff. It is not an automatic approval flow and does
            not replace manual director review, owner review, or Prepare Joining.
          </p>
          <p className="mt-3 text-xs font-medium text-slate-500">Last generated: {generatedAt}</p>
        </section>

        {loading ? (
          <section className="surface-card p-10 text-center text-sm text-slate-600">
            Loading review output...
          </section>
        ) : error ? (
          <section className="surface-card border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
            {error}
          </section>
        ) : payload ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="surface-card p-5">
                <p className="text-sm text-slate-500">Crew needing review</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{payload.summary.totalCrewsWithIssues}</p>
              </div>
              <div className="surface-card p-5">
                <p className="text-sm text-slate-500">Blocked by Missing/Expiring Items</p>
                <p className="mt-2 text-3xl font-semibold text-rose-700">{payload.summary.highSeverity}</p>
              </div>
              <div className="surface-card p-5">
                <p className="text-sm text-slate-500">Needs Attention</p>
                <p className="mt-2 text-3xl font-semibold text-amber-700">{payload.summary.mediumSeverity}</p>
              </div>
            </div>

            <section className="surface-card overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Review Output</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {payload.data.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">No advisory items found.</div>
                ) : (
                  payload.data.map((crew) => (
                    <div key={crew.id} className="px-6 py-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <Link
                            href={`/crewing/seafarers/${crew.id}/biodata`}
                            className="text-lg font-semibold text-slate-900 transition hover:text-cyan-700"
                          >
                            {crew.fullName}
                          </Link>
                          <p className="text-sm text-slate-500">
                            {crew.crewCode ?? "No code"} • {crew.rank} • {crew.crewStatus}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/crewing/seafarers/${crew.id}/biodata`}
                            className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700"
                          >
                            Crew Profile
                          </Link>
                          <Link
                            href="/crewing/prepare-joining"
                            className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700"
                          >
                            Prepare Joining
                          </Link>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {crew.issues.map((issue, index) => (
                          <StatusBadge
                            key={`${crew.id}-${issue.type}-${index}`}
                            status={issue.severity === "high" ? "REJECTED" : "PENDING_REVIEW"}
                            label={`${mapIssueLabel(issue)}: ${issue.message}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        ) : null}
    </div>
  );
}
