"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  buildContractExpiryAlert,
  selectLatestRelevantContract,
  type ContractExpiryAlert,
  type ContractLike,
} from "@/lib/contract-expiry";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface AssignmentResponseItem {
  id: string | number;
  status: string;
  rank: string | null;
  startDate?: string | null;
  endDate?: string | null;
  signOnDate?: string | null;
  signOffDate?: string | null;
  vesselId: string | number;
  vessel?: {
    name?: string | null;
  } | null;
  crew?: {
    fullName?: string | null;
  } | null;
  seafarer?: {
    fullName?: string | null;
  } | null;
  crewId?: string | number | null;
  principal?: {
    name?: string | null;
  } | null;
}

interface CrewMember {
  id: string;
  crewId: string;
  seafarerName: string;
  rank: string;
  signOnDate: string;
  signOffDate?: string;
  status: "ONBOARD" | "DEPARTED" | "PLANNED" | "UNKNOWN";
  principalName?: string;
  contractAlert?: ContractExpiryAlert | null;
}

interface VesselCrew {
  vesselId: string;
  vesselName: string;
  crewMembers: CrewMember[];
  totalCrew: number;
  activeCrew: number;
}

interface ContractResponseItem extends ContractLike {
  crew?: {
    id?: string | null;
    fullName?: string | null;
  } | null;
  vessel?: {
    id?: string | null;
    name?: string | null;
  } | null;
}

function normalizeStatus(value: string): CrewMember["status"] {
  if (value === "ONBOARD" || value === "ACTIVE") return "ONBOARD";
  if (value === "COMPLETED") return "DEPARTED";
  if (value === "PLANNED" || value === "ASSIGNED") return "PLANNED";
  return "UNKNOWN";
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB");
}

function getNextAction(member: CrewMember) {
  if (member.contractAlert && member.contractAlert.band !== "OK") {
    return member.contractAlert.nextAction;
  }
  if (member.status === "ONBOARD") {
    return "Monitor onboard movement and keep the sign-off plan current.";
  }
  if (member.status === "DEPARTED") {
    return "Movement completed. Keep this assignment for vessel history and audit trail.";
  }
  if (member.signOffDate) {
    return "Review the planned sign-off date and confirm any change from the assignment desk.";
  }
  return "Movement still planned. Confirm pickup, sign-on, and final handover timing.";
}

function getContractAlertStyles(band?: ContractExpiryAlert["band"] | null) {
  if (band === "EXPIRED") return "border-rose-300 bg-rose-50 text-rose-800";
  if (band === "CRITICAL") return "border-rose-200 bg-rose-50 text-rose-700";
  if (band === "URGENT") return "border-amber-200 bg-amber-50 text-amber-700";
  if (band === "FOLLOW_UP") return "border-cyan-200 bg-cyan-50 text-cyan-800";
  if (band === "EARLY_WARNING") return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getContractAlertLabel(alert?: ContractExpiryAlert | null) {
  if (!alert) return "Contract not recorded";
  if (alert.band === "EXPIRED") return `Expired ${Math.abs(alert.daysRemaining)} day(s) ago`;
  if (alert.band === "CRITICAL") return `Critical · ${alert.daysRemaining} day(s) left`;
  if (alert.band === "URGENT") return `Urgent · ${alert.daysRemaining} day(s) left`;
  if (alert.band === "FOLLOW_UP") return `Follow up · ${alert.daysRemaining} day(s) left`;
  if (alert.band === "EARLY_WARNING") return `Early warning · ${alert.daysRemaining} day(s) left`;
  return `Valid · ${alert.daysRemaining} day(s) left`;
}

export default function VesselCrewListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const vesselId = String(params.id);
  const [vessel, setVessel] = useState<VesselCrew | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [router, session, status]);

  const fetchVesselCrew = useCallback(async () => {
    try {
      setError(null);
      const [assignmentsRes, contractsRes] = await Promise.all([
        fetch(`/api/assignments?vesselId=${vesselId}`),
        fetch("/api/contracts"),
      ]);
      if (!assignmentsRes.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const assignments = (await assignmentsRes.json()) as AssignmentResponseItem[];
      const contracts = contractsRes.ok ? ((await contractsRes.json()) as ContractResponseItem[]) : [];
      const contractsByCrew = new Map<string, ContractResponseItem[]>();

      for (const contract of contracts) {
        const crewId = String(contract.crewId ?? contract.crew?.id ?? "");
        if (!crewId) continue;
        const current = contractsByCrew.get(crewId) ?? [];
        current.push({
          ...contract,
          crewId,
          vesselId: contract.vesselId ?? contract.vessel?.id ?? null,
        });
        contractsByCrew.set(crewId, current);
      }

      const crewMembers: CrewMember[] = assignments.map((assignment) => ({
        crewId: String(assignment.crewId ?? assignment.id),
        id: String(assignment.id),
        seafarerName: assignment.seafarer?.fullName || assignment.crew?.fullName || "Unknown Crew",
        rank: assignment.rank?.trim() || "Rank not set",
        signOnDate: assignment.signOnDate || assignment.startDate || "",
        signOffDate: assignment.signOffDate || assignment.endDate || undefined,
        status: normalizeStatus(assignment.status),
        principalName: assignment.principal?.name?.trim() || undefined,
        contractAlert: (() => {
          const crewId = String(assignment.crewId ?? assignment.id);
          const contract = selectLatestRelevantContract(contractsByCrew.get(crewId) ?? [], vesselId);
          return contract ? buildContractExpiryAlert(contract) : null;
        })(),
      }));

      setVessel({
        vesselId,
        vesselName: assignments[0]?.vessel?.name?.trim() || "Unknown Vessel",
        crewMembers,
        totalCrew: crewMembers.length,
        activeCrew: crewMembers.filter((member) => member.status === "ONBOARD").length,
      });
    } catch (fetchError) {
      console.error("Error fetching vessel crew:", fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load crew data for this vessel.");
      setVessel(null);
    } finally {
      setLoading(false);
    }
  }, [vesselId]);

  useEffect(() => {
    if (session && vesselId) {
      fetchVesselCrew();
    }
  }, [fetchVesselCrew, session, vesselId]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900" />
        <p className="text-sm font-semibold text-slate-600">Loading vessel crew board...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!vessel) {
    return (
      <section className="surface-card border-rose-200 bg-rose-50 p-8">
        <h3 className="text-sm font-medium text-rose-900">Vessel data not found</h3>
        <p className="mt-1 text-sm text-rose-700">
          {error || "Ensure this vessel already has live assignment records."}
        </p>
        <div className="mt-4">
          <Button type="button" variant="secondary" onClick={() => router.push("/crewing/crew-list")}>
            Back to crew list
          </Button>
        </div>
      </section>
    );
  }

  const totalDeparted = vessel.crewMembers.filter((member) => member.status === "DEPARTED").length;
  const totalPlanned = vessel.crewMembers.filter((member) => member.status === "PLANNED").length;
  const expiringContracts45 = vessel.crewMembers.filter(
    (member) =>
      member.status === "ONBOARD" &&
      member.contractAlert &&
      ["EXPIRED", "CRITICAL", "URGENT"].includes(member.contractAlert.band)
  ).length;

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">Vessel Manning</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{vessel.vesselName} crew board</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Live crew complement for this vessel based on assignment records.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => router.push("/crewing/crew-list")}>
              Back to crew list
            </Button>
            <Link href="/crewing/assignments/new" className="action-pill text-sm">
              Create assignment
            </Link>
          </div>
        </div>
      </section>

        <section className="surface-card border-sky-200 bg-sky-50 p-5">
          <p className="text-sm font-semibold text-sky-900">How to use this board</p>
          <p className="mt-1 text-sm text-sky-800">
            This vessel page is a monitoring board only. Update movement timing, onboard status, and sign-off plans from
            the assignment record linked in each row.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          <div className="surface-card p-6">
            <p className="text-sm font-medium text-gray-700">Vessel</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{vessel.vesselName}</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-sm font-medium text-gray-700">Active Crew</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{vessel.activeCrew}</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-sm font-medium text-gray-700">Departed Records</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{totalDeparted}</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-sm font-medium text-gray-700">Planned Movements</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{totalPlanned}</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-sm font-medium text-gray-700">Contracts ≤ 45 Days</p>
            <p className="mt-2 text-2xl font-extrabold text-rose-700">{expiringContracts45}</p>
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-extrabold text-white">Crew Members</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crew</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sign On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sign Off</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Alert</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vessel.crewMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.seafarerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.rank}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(member.signOnDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(member.signOffDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={member.status} className="px-4 py-2" />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {member.contractAlert ? (
                        <div className={`inline-flex rounded-2xl border px-3 py-2 text-xs font-semibold ${getContractAlertStyles(member.contractAlert.band)}`}>
                          <div>
                            <p>{getContractAlertLabel(member.contractAlert)}</p>
                            <p className="mt-1 font-medium opacity-80">End {formatDate(member.contractAlert.contractEnd)}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          Contract not linked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <p className="mb-2 max-w-sm text-slate-700">{getNextAction(member)}</p>
                      <button
                        onClick={() => router.push(`/crewing/assignments/${member.id}`)}
                        className="rounded-full border border-indigo-300 px-3 py-1 text-xs font-semibold text-indigo-700 hover:border-indigo-500 hover:text-indigo-800"
                      >
                        Open Assignment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {vessel.crewMembers.length === 0 ? (
          <section className="surface-card py-12 text-center">
            <h3 className="mt-2 text-sm font-medium text-slate-900">No crew members assigned</h3>
            <p className="mt-1 text-sm text-slate-600">This vessel currently has no live assignment records.</p>
            <div className="mt-6">
              <Link href="/crewing/assignments/new" className="action-pill">
                Create Assignment
              </Link>
            </div>
          </section>
        ) : null}
    </div>
  );
}
