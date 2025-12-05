"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchPrepareJoinings();
  }, [session, status, selectedStatus, router]);

  const fetchPrepareJoinings = async () => {
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
      setLoading(false);
    }
  };

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
        fetchPrepareJoinings();
      }
    } catch (error) {
      console.error("Error updating checklist:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statusOptions = [
    { value: "ALL", label: "All Status", color: "gray", icon: "📋" },
    { value: "PENDING", label: "Pending", color: "gray", icon: "⏳" },
    { value: "DOCUMENTS", label: "Documents", color: "blue", icon: "📄" },
    { value: "MEDICAL", label: "Medical", color: "green", icon: "🏥" },
    { value: "TRAINING", label: "Training", color: "purple", icon: "📚" },
    { value: "TRAVEL", label: "Travel", color: "orange", icon: "✈️" },
    { value: "READY", label: "Ready", color: "teal", icon: "✅" },
    { value: "DISPATCHED", label: "Dispatched", color: "indigo", icon: "🚢" },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      PENDING: { color: "bg-gray-100 text-gray-800", text: "Pending" },
      DOCUMENTS: { color: "bg-blue-100 text-blue-800", text: "Documents" },
      MEDICAL: { color: "bg-green-100 text-green-800", text: "Medical" },
      TRAINING: { color: "bg-purple-100 text-purple-800", text: "Training" },
      TRAVEL: { color: "bg-orange-100 text-orange-800", text: "Travel" },
      READY: { color: "bg-teal-100 text-teal-800", text: "Ready to Join" },
      DISPATCHED: { color: "bg-indigo-100 text-indigo-800", text: "Dispatched" },
    };

    const item = config[status] || { color: "bg-gray-100 text-gray-800", text: status };
    return (
      <span className={`px-3 py-2 rounded-full text-xs font-semibold ${item.color}`}>
        {item.text}
      </span>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Preparing to Join
              </h1>
              <p className="text-gray-700">
                Step-by-step checklist untuk seafarer siap berangkat ke kapal
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/crewing/workflow"
                className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:border-blue-500 hover:text-blue-700 transition-all duration-200 shadow-md hover:shadow-md"
              >
                ← Workflow
              </Link>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {statusOptions.map((option) => {
              const isActive = selectedStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-500"
                  }`}
                >
                  {option.icon} {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {prepareJoinings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
              Tidak ada preparation
            </h3>
            <p className="text-gray-700 mb-6">
              Belum ada crew yang sedang preparing to join
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {prepareJoinings.map((pj) => {
              const progress = getProgressPercentage(pj);
              return (
                <div
                  key={pj.id}
                  className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:border-green-300 transition-all duration-200"
                >
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 border-b-2 border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl">
                            {pj.crew.fullName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-2xl font-extrabold text-gray-900">
                              {pj.crew.fullName}
                            </h3>
                            <p className="text-gray-700">
                              {pj.crew.rank} • {pj.crew.nationality || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-gray-700 mb-1">Vessel</div>
                            <div className="font-semibold text-gray-900">
                              {pj.vessel?.name || "TBD"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-700 mb-1">Principal</div>
                            <div className="font-semibold text-gray-900">
                              {pj.principal?.name || "TBD"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-700 mb-1">Status</div>
                            {getStatusBadge(pj.status)}
                          </div>
                          <div>
                            <div className="text-sm text-gray-700 mb-1">Progress</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-teal-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-gray-900">
                                {progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-bold text-gray-900">
                        Checklist Progress
                      </h4>
                      <Link
                        href={`/api/forms/letter-guarantee/${pj.id}`}
                        target="_blank"
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 text-sm font-semibold flex items-center gap-2 transition-all"
                      >
                        📄 Generate Letter Guarantee
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-100 rounded-xl p-4">
                        <div className="font-bold text-blue-900 mb-3">
                          📄 Documents
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pj.passportValid}
                              onChange={(e) =>
                                updateChecklistItem(
                                  pj.id,
                                  "passportValid",
                                  e.target.checked
                                )
                              }
                              className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">Passport Valid</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pj.seamanBookValid}
                              onChange={(e) =>
                                updateChecklistItem(
                                  pj.id,
                                  "seamanBookValid",
                                  e.target.checked
                                )
                              }
                              className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">Seaman Book Valid</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pj.certificatesValid}
                              onChange={(e) =>
                                updateChecklistItem(
                                  pj.id,
                                  "certificatesValid",
                                  e.target.checked
                                )
                              }
                              className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">Certificates Valid</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pj.visaValid}
                              onChange={(e) =>
                                updateChecklistItem(
                                  pj.id,
                                  "visaValid",
                                  e.target.checked
                                )
                              }
                              className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">Visa Valid</span>
                          </label>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-xl p-4">
                        <div className="font-bold text-green-900 mb-3">
                          🏥 Medical & Training
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pj.medicalValid}
                              onChange={(e) =>
                                updateChecklistItem(
                                  pj.id,
                                  "medicalValid",
                                  e.target.checked
                                )
                              }
                              className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">Medical Valid</span>
                          </label>
                          {pj.medicalExpiry && (
                            <div className="text-xs text-gray-700 ml-7">
                              Exp: {new Date(pj.medicalExpiry).toLocaleDateString("id-ID")}
                            </div>
                          )}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pj.orientationCompleted}
                              onChange={(e) =>
                                updateChecklistItem(
                                  pj.id,
                                  "orientationCompleted",
                                  e.target.checked
                                )
                              }
                              className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">Orientation Done</span>
                          </label>
                        </div>
                      </div>

                      <div className="bg-orange-50 rounded-xl p-4">
                        <div className="font-bold text-orange-900 mb-3">
                          ✈️ Travel Arrangements
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pj.ticketBooked}
                              onChange={(e) =>
                                updateChecklistItem(
                                  pj.id,
                                  "ticketBooked",
                                  e.target.checked
                                )
                              }
                              className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">Ticket Booked</span>
                          </label>
                          {pj.flightNumber && (
                            <div className="text-xs text-gray-700 ml-7">
                              Flight: {pj.flightNumber}
                            </div>
                          )}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pj.hotelBooked}
                              onChange={(e) =>
                                updateChecklistItem(
                                  pj.id,
                                  "hotelBooked",
                                  e.target.checked
                                )
                              }
                              className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">Hotel Booked</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pj.transportArranged}
                              onChange={(e) =>
                                updateChecklistItem(
                                  pj.id,
                                  "transportArranged",
                                  e.target.checked
                                )
                              }
                              className="w-5 h-5 text-green-600 rounded"
                            />
                            <span className="text-sm">Transport Arranged</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {pj.remarks && (
                      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                        <div className="text-sm text-gray-700 mb-1">Remarks</div>
                        <div className="text-sm text-gray-700">{pj.remarks}</div>
                      </div>
                    )}
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
