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
  
  // MCU Section
  mcuScheduled: boolean;
  mcuScheduledDate: string | null;
  mcuCompleted: boolean;
  mcuCompletedDate: string | null;
  mcuDoctorName: string | null;
  mcuClinicName: string | null;
  mcuResult: string | null;
  mcuRestrictions: string | null;
  mcuRemarks: string | null;
  vaccineYellowFever: boolean;
  vaccineHepatitisA: boolean;
  vaccineHepatitisB: boolean;
  vaccineTyphoid: boolean;
  vaccineOther: string | null;
  vaccineExpiryDate: string | null;

  // Equipment Section
  safetyLifeJacket: boolean;
  safetyHelmet: boolean;
  safetyShoes: boolean;
  safetyGloves: boolean;
  safetyHarnessVest: boolean;
  workUniform: boolean;
  workIDCard: boolean;
  workAccessCard: boolean;
  workStationery: boolean;
  workToolsProvided: boolean;
  personalPassport: boolean;
  personalVisa: boolean;
  personalTickets: boolean;
  personalVaccineCard: boolean;
  personalMedicalCert: boolean;
  vesselStatroomAssigned: boolean;
  vesselStatroomNumber: string | null;
  vesselContractSigned: boolean;
  vesselBriefingScheduled: boolean;
  vesselBriefingDate: string | null;
  vesselOrientationDone: boolean;
  vesselEmergencyDrill: boolean;

  // Pre-Departure Section
  preDepartureDocCheck: boolean;
  preDepartureEquipCheck: boolean;
  preDepartureMedicalOK: boolean;
  preDepartureEmergency: boolean;
  preDepartureSalaryOK: boolean;
  preDeparturePerDiem: boolean;
  preDepartureFinalCheck: boolean;
  preDepartureApprovedBy: string | null;
  preDepartureApprovedAt: string | null;
  preDepartureChecklistBy: string | null;
  
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
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Optional spinner flag keeps inline updates responsive without flashing the full-page loader.
  const fetchPrepareJoinings = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
      setError(null);
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
      } else {
        setError("Failed to fetch prepare joinings");
      }
    } catch (error) {
      console.error("Error fetching prepare joinings:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch prepare joinings");
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Prepare Joinings</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => fetchPrepareJoinings(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
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
    { value: "CANCELLED", label: "Cancelled", icon: "❌" },
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
      CANCELLED: { accent: "bg-red-500/10 text-red-600", text: "Cancelled" },
    };

    const item = config[status] || { accent: "bg-slate-500/10 text-slate-700", text: status };
    return <span className={`badge-soft ${item.accent}`}>{item.text}</span>;
  };

  const getProgressPercentage = (pj: PrepareJoining) => {
    const checks = [
      // Document checks (5)
      pj.passportValid,
      pj.seamanBookValid,
      pj.certificatesValid,
      pj.medicalValid,
      pj.visaValid,
      // Medical checks (2)
      pj.orientationCompleted,
      pj.mcuCompleted,
      // Travel checks (3)
      pj.ticketBooked,
      pj.hotelBooked,
      pj.transportArranged,
      // Equipment checks (5)
      pj.safetyLifeJacket,
      pj.workUniform,
      pj.personalPassport,
      pj.vesselStatroomAssigned,
      pj.vesselContractSigned,
      // Pre-departure (1)
      pj.preDepartureFinalCheck,
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
              Integrated checklist to ensure crew is ready to depart to destination vessel.
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
              No active preparation
            </h3>
            <p className="text-slate-600">
              No crew currently in preparing to join stage.
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
                          {pj.medicalCheckDate && (
                            <div className="ml-7">
                              <input
                                type="date"
                                value={pj.medicalCheckDate ? new Date(pj.medicalCheckDate).toISOString().split('T')[0] : ''}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "medicalCheckDate", e.target.value)
                                }
                                className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                placeholder="Check Date"
                              />
                            </div>
                          )}
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
                          {pj.orientationDate && (
                            <div className="ml-7">
                              <input
                                type="date"
                                value={pj.orientationDate ? new Date(pj.orientationDate).toISOString().split('T')[0] : ''}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "orientationDate", e.target.value)
                                }
                                className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                placeholder="Orientation Date"
                              />
                            </div>
                          )}
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
                            <div className="ml-7">
                              <input
                                type="text"
                                value={pj.flightNumber}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "flightNumber", e.target.value)
                                }
                                className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                placeholder="Flight Number"
                              />
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
                          {pj.hotelName ? (
                            <div className="ml-7">
                              <input
                                type="text"
                                value={pj.hotelName}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "hotelName", e.target.value)
                                }
                                className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                placeholder="Hotel Name"
                              />
                            </div>
                          ) : null}
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
                          {pj.departurePort && (
                            <div className="ml-7">
                              <input
                                type="text"
                                value={pj.departurePort}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "departurePort", e.target.value)
                                }
                                className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                placeholder="Departure Port"
                              />
                            </div>
                          )}
                          {pj.arrivalPort && (
                            <div className="ml-7">
                              <input
                                type="text"
                                value={pj.arrivalPort}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "arrivalPort", e.target.value)
                                }
                                className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                placeholder="Arrival Port"
                              />
                            </div>
                          )}
                          {pj.departureDate && (
                            <div className="ml-7">
                              <input
                                type="date"
                                value={pj.departureDate ? new Date(pj.departureDate).toISOString().split('T')[0] : ''}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "departureDate", e.target.value)
                                }
                                className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                placeholder="Departure Date"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* MCU SECTION */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">💉 MCU (Medical Check-up)</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-red-200/70 bg-red-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-red-500/10 text-red-600">🏥</span>
                            <span>MCU Scheduling</span>
                          </div>
                          <div className="space-y-3">
                            <label className="flex items-center gap-3 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.mcuScheduled}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "mcuScheduled", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>MCU Scheduled</span>
                            </label>
                            {pj.mcuScheduledDate && (
                              <div className="ml-7">
                                <input
                                  type="date"
                                  value={pj.mcuScheduledDate ? new Date(pj.mcuScheduledDate).toISOString().split('T')[0] : ''}
                                  onChange={(e) =>
                                    updateChecklistItem(pj.id, "mcuScheduledDate", e.target.value)
                                  }
                                  className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                  placeholder="Scheduled Date"
                                />
                              </div>
                            )}
                            <label className="flex items-center gap-3 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.mcuCompleted}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "mcuCompleted", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>MCU Completed</span>
                            </label>
                            {pj.mcuCompletedDate && (
                              <div className="ml-7">
                                <input
                                  type="date"
                                  value={pj.mcuCompletedDate ? new Date(pj.mcuCompletedDate).toISOString().split('T')[0] : ''}
                                  onChange={(e) =>
                                    updateChecklistItem(pj.id, "mcuCompletedDate", e.target.value)
                                  }
                                  className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                  placeholder="Completed Date"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl border border-red-200/70 bg-red-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-red-500/10 text-red-600">📋</span>
                            <span>MCU Details</span>
                          </div>
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={pj.mcuDoctorName || ''}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "mcuDoctorName", e.target.value)
                              }
                              placeholder="Doctor Name"
                              className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              value={pj.mcuClinicName || ''}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "mcuClinicName", e.target.value)
                              }
                              placeholder="Clinic Name"
                              className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                            />
                            <select
                              value={pj.mcuResult || ''}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "mcuResult", e.target.value || null)
                              }
                              className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">-- Select Result --</option>
                              <option value="PASSED">✅ PASSED</option>
                              <option value="CONDITIONAL">⚠️ CONDITIONAL</option>
                              <option value="FAILED">❌ FAILED</option>
                            </select>
                            <input
                              type="text"
                              value={pj.mcuRestrictions || ''}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "mcuRestrictions", e.target.value)
                              }
                              placeholder="Medical Restrictions (if any)"
                              className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-4 md:col-span-2">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-blue-500/10 text-blue-600">💉</span>
                            <span>Vaccinations</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vaccineYellowFever}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vaccineYellowFever", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Yellow Fever</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vaccineHepatitisA}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vaccineHepatitisA", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Hepatitis A</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vaccineHepatitisB}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vaccineHepatitisB", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Hepatitis B</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vaccineTyphoid}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vaccineTyphoid", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Typhoid</span>
                            </label>
                          </div>
                          <div className="mt-3 space-y-2">
                            <input
                              type="text"
                              value={pj.vaccineOther || ''}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "vaccineOther", e.target.value)
                              }
                              placeholder="Other Vaccinations"
                              className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                            />
                            {pj.vaccineExpiryDate && (
                              <div>
                                <label className="text-xs text-slate-600">Vaccine Expiry</label>
                                <input
                                  type="date"
                                  value={pj.vaccineExpiryDate ? new Date(pj.vaccineExpiryDate).toISOString().split('T')[0] : ''}
                                  onChange={(e) =>
                                    updateChecklistItem(pj.id, "vaccineExpiryDate", e.target.value)
                                  }
                                  className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EQUIPMENT SECTION */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">👷 Equipment (Perlengkapan Crew)</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-yellow-200/70 bg-yellow-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-yellow-500/10 text-yellow-600">🛡️</span>
                            <span>Safety Equipment</span>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.safetyLifeJacket}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "safetyLifeJacket", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Life Jacket</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.safetyHelmet}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "safetyHelmet", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Safety Helmet</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.safetyShoes}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "safetyShoes", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Safety Shoes</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.safetyGloves}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "safetyGloves", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Safety Gloves</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.safetyHarnessVest}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "safetyHarnessVest", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Harness/Vest</span>
                            </label>
                          </div>
                        </div>

                        <div className="rounded-xl border border-green-200/70 bg-green-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-green-500/10 text-green-600">👔</span>
                            <span>Work Equipment</span>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.workUniform}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "workUniform", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Uniform</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.workIDCard}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "workIDCard", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>ID Card</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.workAccessCard}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "workAccessCard", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Access Card</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.workStationery}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "workStationery", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Stationery</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.workToolsProvided}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "workToolsProvided", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Tools Provided</span>
                            </label>
                          </div>
                        </div>

                        <div className="rounded-xl border border-purple-200/70 bg-purple-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-purple-500/10 text-purple-600">👜</span>
                            <span>Personal Items</span>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.personalPassport}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "personalPassport", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Passport</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.personalVisa}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "personalVisa", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Visa</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.personalTickets}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "personalTickets", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Tickets</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.personalVaccineCard}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "personalVaccineCard", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Vaccine Card</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.personalMedicalCert}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "personalMedicalCert", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Medical Cert</span>
                            </label>
                          </div>
                        </div>

                        <div className="rounded-xl border border-cyan-200/70 bg-cyan-50/60 p-4">
                          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                            <span className="badge-soft bg-cyan-500/10 text-cyan-600">🚢</span>
                            <span>Vessel Pre-requisites</span>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vesselStatroomAssigned}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vesselStatroomAssigned", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Stateroom Assigned</span>
                            </label>
                            {pj.vesselStatroomNumber && (
                              <input
                                type="text"
                                value={pj.vesselStatroomNumber}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vesselStatroomNumber", e.target.value)
                                }
                                placeholder="Stateroom #"
                                className="w-full text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                              />
                            )}
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vesselContractSigned}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vesselContractSigned", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Contract Signed</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vesselBriefingScheduled}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vesselBriefingScheduled", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Briefing Scheduled</span>
                            </label>
                            {pj.vesselBriefingDate && (
                              <input
                                type="date"
                                value={pj.vesselBriefingDate ? new Date(pj.vesselBriefingDate).toISOString().split('T')[0] : ''}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vesselBriefingDate", e.target.value)
                                }
                                className="text-xs w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                              />
                            )}
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vesselOrientationDone}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vesselOrientationDone", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Orientation Done</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={pj.vesselEmergencyDrill}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "vesselEmergencyDrill", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Emergency Drill</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PRE-DEPARTURE SECTION */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">✅ Final Pre-Departure Check (48 Hours)</h4>
                      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.preDepartureDocCheck}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDepartureDocCheck", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="font-medium">✓ All Documents Valid</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.preDepartureEquipCheck}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDepartureEquipCheck", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="font-medium">✓ All Equipment Ready</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.preDepartureMedicalOK}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDepartureMedicalOK", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="font-medium">✓ Medical Cleared</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.preDepartureEmergency}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDepartureEmergency", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="font-medium">✓ Emergency Contact OK</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.preDepartureSalaryOK}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDepartureSalaryOK", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="font-medium">✓ Salary Confirmed</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={pj.preDeparturePerDiem}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDeparturePerDiem", e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="font-medium">✓ Per Diem Confirmed</span>
                          </label>
                        </div>
                        
                        <div className="mt-6 p-4 border-t border-emerald-200 space-y-4">
                          <label className="flex items-center gap-3 text-lg text-slate-900 font-bold">
                            <input
                              type="checkbox"
                              checked={pj.preDepartureFinalCheck}
                              onChange={(e) =>
                                updateChecklistItem(pj.id, "preDepartureFinalCheck", e.target.checked)
                              }
                              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>🎯 FINAL APPROVAL - Ready to Depart</span>
                          </label>
                          
                          {pj.preDepartureApprovedBy && (
                            <div className="ml-8">
                              <input
                                type="text"
                                value={pj.preDepartureApprovedBy}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "preDepartureApprovedBy", e.target.value)
                                }
                                placeholder="Approved By (Name/ID)"
                                className="w-full text-sm px-3 py-2 rounded border border-emerald-300 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          )}
                          
                          {pj.preDepartureApprovedAt && (
                            <div className="ml-8">
                              <label className="text-xs text-slate-600">Approval Date/Time</label>
                              <input
                                type="datetime-local"
                                value={pj.preDepartureApprovedAt ? new Date(pj.preDepartureApprovedAt).toISOString().slice(0, 16) : ''}
                                onChange={(e) =>
                                  updateChecklistItem(pj.id, "preDepartureApprovedAt", e.target.value)
                                }
                                className="w-full text-sm px-3 py-2 rounded border border-emerald-300 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {pj.remarks ? (
                      <div className="rounded-xl border border-slate-200 bg-white/70 p-4 mt-6">
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
