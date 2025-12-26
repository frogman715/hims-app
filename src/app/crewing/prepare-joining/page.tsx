"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface PrepareJoining {
  id: string;
  crewId: string;
  vesselId: string | null;
  principalId: string | null;
  status: string;
  passportValid: boolean;
  seamanBookValid: boolean;
  certificatesValid: boolean;
  medicalValid: boolean;
  visaValid: boolean;
  medicalCheckDate: string | null;
  medicalExpiry: string | null;
  orientationDate: string | null;
  orientationCompleted: boolean;
  departureDate: string | null;
  departurePort: string | null;
  arrivalPort: string | null;
  flightNumber: string | null;
  ticketBooked: boolean;
  hotelBooked: boolean;
  hotelName: string | null;
  transportArranged: boolean;
  remarks: string | null;
  crew: {
    id: string;
    fullName: string;
    rank: string;
    nationality: string | null;
    phone: string | null;
  };
  vessel: {
    id: string;
    name: string;
    type: string;
  } | null;
  principal: {
    id: string;
    name: string;
  } | null;
}

export default function PrepareJoiningPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prepareJoinings, setPrepareJoinings] = useState<PrepareJoining[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Optional spinner flag keeps inline updates responsive without flashing the full-page loader.
  const fetchPrepareJoinings = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const url =
        selectedStatus === "ALL"
          ? "/api/prepare-joining"
          : `/api/prepare-joining?status=${selectedStatus}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPrepareJoinings(data.data || data);
      }
    } catch (error) {
      console.error("Error fetching prepare joinings:", error);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [selectedStatus]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchPrepareJoinings();
  }, [session, status, router, fetchPrepareJoinings]);

  const updateChecklistItem = async (
    id: string,
    field: string,
    value: boolean | string
  ) => {
    try {
      const response = await fetch(`/api/prepare-joining/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        await fetchPrepareJoinings(false);
      }
    } catch (error) {
      console.error("Error updating checklist:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        <p className="text-sm font-semibold text-slate-600">
          Loading data preparing crew…
        </p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statusOptions = [
    { value: "ALL", label: "All Status", icon: "📋" },
    { value: "PENDING", label: "Pending", icon: "⏳" },
    { value: "DOCUMENTS", label: "Documents", icon: "📄" },
    { value: "MEDICAL", label: "Medical", icon: "🏥" },
    { value: "TRAINING", label: "Training", icon: "📚" },
    { value: "TRAVEL", label: "Travel", icon: "✈️" },
    { value: "READY", label: "Ready", icon: "✅" },
    { value: "DISPATCHED", label: "Dispatched", icon: "🚢" },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { accent: string; text: string }> = {
      PENDING: { accent: "bg-slate-500/10 text-slate-700", text: "Pending" },
      DOCUMENTS: { accent: "bg-blue-500/10 text-blue-600", text: "Documents" },
      MEDICAL: { accent: "bg-emerald-500/10 text-emerald-600", text: "Medical" },
      TRAINING: { accent: "bg-purple-500/10 text-purple-600", text: "Training" },
      TRAVEL: { accent: "bg-orange-500/10 text-orange-600", text: "Travel" },
      READY: { accent: "bg-teal-500/10 text-teal-600", text: "Ready to Join" },
      DISPATCHED: { accent: "bg-indigo-500/10 text-indigo-600", text: "Dispatched" },
    };

    const item = config[status] || { accent: "bg-slate-500/10 text-slate-700", text: status };
    return <span className={`badge-soft ${item.accent}`}>{item.text}</span>;
  };

  const getProgressPercentage = (pj: PrepareJoining) => {
    const checks = [
      pj.passportValid,
      pj.seamanBookValid,
      pj.certificatesValid,
      pj.medicalValid,
      pj.visaValid,
      pj.orientationCompleted,
      pj.ticketBooked,
      pj.hotelBooked,
      pj.transportArranged,
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  };

  return (
    <div className="min-h-screen pb-12">
      <div className="page-shell px-6 py-10 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Preparing to Join</h1>
            <p className="text-base text-slate-600 mt-1">
              Checklist terpadu memastikan crew siap berangkat ke kapal tujuan.
            </p>
          </div>
          <Link href="/crewing/workflow" className="action-pill text-sm">
            ← Crew Workflow
          </Link>
        </div>

        <div className="surface-card p-5">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const isActive = selectedStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className="action-pill text-sm"
                  style={
                    isActive
                      ? {
                          background: "linear-gradient(135deg, #10b981, #14b8a6)",
                          color: "#ffffff",
                          borderColor: "transparent",
                        }
                      : undefined
                  }
                >
                  <span className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {prepareJoinings.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Tidak ada preparation aktif
            </h3>
            <p className="text-slate-600">
              No crew yang sedang pada tahap preparing to join.
            </p>
          </div>
        ) : (
          <div className="section-stack">
            {prepareJoinings.map((pj) => {
              const progress = getProgressPercentage(pj);
              return (
                <div key={pj.id} className="surface-card overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-b border-emerald-100/70 p-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                          {pj.crew.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold text-slate-900">{pj.crew.fullName}</h3>
                          <p className="text-sm text-slate-600">
                            {pj.crew.rank} • {pj.crew.nationality || "N/A"}
                          </p>
                          {pj.crew.phone ? (
                            <p className="text-xs text-slate-500 mt-1">📞 {pj.crew.phone}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="grid w-full gap-4 sm:grid-cols-2 md:max-w-2xl md:grid-cols-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Vessel
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {pj.vessel?.name || "TBD"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Principal
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {pj.principal?.name || "TBD"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </p>
                          <div className="mt-1">{getStatusBadge(pj.status)}</div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Progress
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-emerald-100/70">
                              <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-slate-900">{progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <h4 className="text-lg font-semibold text-slate-900">Checklist Progress</h4>
                      <Link
                        href={`/api/forms/letter-guarantee/${pj.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg"
                      >
                        📄 Generate Letter Guarantee
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-4">
                        <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                          <span className="badge-soft bg-blue-500/10 text-blue-600">📄</span>
                          <span>Documents</span>
                        </div>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.passportValid}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "passportValid", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Passport Valid</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.seamanBookValid}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "seamanBookValid", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Seaman Book Valid</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.certificatesValid}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "certificatesValid", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Certificates Valid</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.visaValid}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "visaValid", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Visa Valid</span>
                          </label>
                        </div>
                      </div>

                      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-4">
                        <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                          <span className="badge-soft bg-emerald-500/10 text-emerald-600">🏥</span>
                          <span>Medical & Training</span>
                        </div>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.medicalValid}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "medicalValid", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Medical Valid</span>
                          </label>
                          {pj.medicalExpiry ? (
                            <div className="ml-7 text-xs font-medium text-slate-500">
                              Exp: {new Date(pj.medicalExpiry).toLocaleDateString("id-ID")}
                            </div>
                          ) : null}
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.orientationCompleted}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "orientationCompleted", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Orientation Complete</span>
                          </label>
                        </div>
                      </div>

                      <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-4">
                        <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                          <span className="badge-soft bg-amber-500/10 text-amber-600">✈️</span>
                          <span>Travel & Logistics</span>
                        </div>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.ticketBooked}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "ticketBooked", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Ticket Booked</span>
                          </label>
                          {pj.flightNumber ? (
                            <div className="ml-7 text-xs font-medium text-slate-500">
                              Flight: {pj.flightNumber}
                            </div>
                          ) : null}
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.hotelBooked}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "hotelBooked", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Hotel Booked</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.transportArranged}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "transportArranged", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>Transport Arranged</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {pj.remarks ? (
                      <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Remarks
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{pj.remarks}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
