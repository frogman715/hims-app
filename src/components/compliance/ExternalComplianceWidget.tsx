"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ExternalComplianceStats {
  dephub: {
    total: number;
    verified: number;
    expired: number;
    pending: number;
  };
  schengen: {
    total: number;
    verified: number;
    expired: number;
    pending: number;
  };
}

interface Props {
  className?: string;
}

const FALLBACK_STATS: ExternalComplianceStats = {
  dephub: { total: 0, verified: 0, expired: 0, pending: 0 },
  schengen: { total: 0, verified: 0, expired: 0, pending: 0 },
};

export default function ExternalComplianceWidget({ className = "" }: Props) {
  const [stats, setStats] = useState<ExternalComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/external-compliance/stats", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as ExternalComplianceStats;
        setStats(payload);
        setErrorMessage(null);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setStats(FALLBACK_STATS);
        setErrorMessage(
          "Tidak dapat memuat status compliance eksternal saat ini. Data ditampilkan dalam mode offline."
        );
        console.warn("external-compliance stats fallback", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className={`surface-card p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">External Compliance Systems</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200/60 rounded w-3/4" />
          <div className="h-4 bg-slate-200/60 rounded w-1/2" />
          <div className="h-4 bg-slate-200/60 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`surface-card ${className}`}>
      <div className="surface-card__header px-6">
        <h3 className="text-lg font-semibold text-slate-900">External Compliance Systems</h3>
        <p className="text-sm text-slate-600 mt-1">Real-time integration status</p>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {errorMessage ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs font-medium text-amber-800">
            {errorMessage}
          </div>
        ) : null}

        {/* Note about KOSMA */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 text-sm mb-1">KOSMA Certificate</h4>
              <p className="text-xs text-slate-700 mb-2">
                KOSMA adalah sertifikat pelatihan Korea (bukan compliance tracking). Data sertifikat KOSMA dikelola di <strong>Documents Management</strong>.
              </p>
              <div className="flex gap-2">
                <Link
                  href="/crewing/documents?type=KOSMA"
                  className="inline-flex items-center gap-1 rounded border border-blue-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                >
                  View KOSMA Documents →
                </Link>
                <a
                  href="https://www.marinerights.or.kr/fro_end_kor/html/main/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-blue-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Apply Training
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Dephub Certificate */}
        <div className="border-l-4 border-green-500 bg-green-50/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="font-semibold text-slate-900">Dephub Indonesia</h4>
            </div>
            <div className="flex gap-2">
              <a
                href="https://pelaut.dephub.go.id/login-perusahaan"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-green-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm transition hover:border-green-300 hover:bg-green-50"
              >
                Verify Certificate →
              </a>
              <a
                href="https://pelaut.dephub.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-green-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm transition hover:border-green-300 hover:bg-green-50"
              >
                Portal
              </a>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center text-sm">
            <div className="rounded-xl border border-white/40 bg-white/75 py-3 shadow-sm">
              <div className="text-xl font-bold text-slate-900">{stats.dephub.total}</div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/75 py-3 shadow-sm">
              <div className="text-xl font-bold text-green-600">{stats.dephub.verified}</div>
              <div className="text-xs text-slate-500">Verified</div>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/75 py-3 shadow-sm">
              <div className="text-xl font-bold text-red-600">{stats.dephub.expired}</div>
              <div className="text-xs text-slate-500">Expired</div>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/75 py-3 shadow-sm">
              <div className="text-xl font-bold text-yellow-600">{stats.dephub.pending}</div>
              <div className="text-xs text-slate-500">Pending</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Validasi sijil dan sertifikat pelaut Indonesia
          </p>
        </div>

        {/* Schengen Visa Netherlands */}
        <div className="border-l-4 border-purple-500 bg-purple-50/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-semibold text-slate-900">Schengen Visa NL</h4>
            </div>
            <div className="flex gap-2">
              <a
                href="https://consular.mfaservices.nl/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-purple-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm transition hover:border-purple-300 hover:bg-purple-50"
              >
                Apply Visa →
              </a>
              <a
                href="https://consular.mfaservices.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-purple-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm transition hover:border-purple-300 hover:bg-purple-50"
              >
                Portal
              </a>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center text-sm">
            <div className="rounded-xl border border-white/40 bg-white/75 py-3 shadow-sm">
              <div className="text-xl font-bold text-slate-900">{stats.schengen.total}</div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/75 py-3 shadow-sm">
              <div className="text-xl font-bold text-green-600">{stats.schengen.verified}</div>
              <div className="text-xs text-slate-500">Approved</div>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/75 py-3 shadow-sm">
              <div className="text-xl font-bold text-red-600">{stats.schengen.expired}</div>
              <div className="text-xs text-slate-500">Expired</div>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/75 py-3 shadow-sm">
              <div className="text-xl font-bold text-yellow-600">{stats.schengen.pending}</div>
              <div className="text-xs text-slate-500">Processing</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Visa Schengen Belanda untuk crew kapal tanker
          </p>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/70 rounded-b-xl">
        <Link
          href="/compliance/external"
          className="action-pill text-sm"
        >
          View All Compliance Records →
        </Link>
      </div>
    </div>
  );
}
