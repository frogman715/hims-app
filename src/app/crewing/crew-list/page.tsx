"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  buildContractExpiryAlert,
  getContractExpiryBand,
  selectLatestRelevantContract,
  type ContractExpiryAlert,
  type ContractLike,
} from "@/lib/contract-expiry";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
    nationality?: string | null;
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
  principal?: {
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
    return "Monitor onboard status and keep the planned sign-off timing updated.";
  }
  if (member.status === "DEPARTED") {
    return "Movement completed. Keep the assignment only for vessel history and audit trail.";
  }
  if (member.signOffDate) {
    return "Review the planned sign-off timing and confirm any change from the assignment desk.";
  }
  return "Movement still planned. Confirm pickup, sign-on, and final vessel handover timing.";
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

export default function CrewListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vesselCrews, setVesselCrews] = useState<VesselCrew[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [router, session, status]);

  useEffect(() => {
    if (!session) return;

    async function fetchCrewList() {
      try {
        setError(null);
        const [assignmentsRes, contractsRes] = await Promise.all([fetch("/api/assignments"), fetch("/api/contracts")]);
        if (!assignmentsRes.ok) {
          throw new Error("Failed to fetch crew assignments");
        }

        const assignments = (await assignmentsRes.json()) as AssignmentResponseItem[];
        const contracts = contractsRes.ok ? ((await contractsRes.json()) as ContractResponseItem[]) : [];
        const vesselMap = new Map<string, VesselCrew>();
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

        for (const assignment of assignments) {
          const vesselId = String(assignment.vesselId);
          const crewId = String(assignment.crewId ?? assignment.id);
          const vesselName = assignment.vessel?.name?.trim() || "Unknown Vessel";
          const contract = selectLatestRelevantContract(contractsByCrew.get(crewId) ?? [], vesselId);
          const contractAlert = contract ? buildContractExpiryAlert(contract) : null;

          if (!vesselMap.has(vesselId)) {
            vesselMap.set(vesselId, {
              vesselId,
              vesselName,
              crewMembers: [],
              totalCrew: 0,
              activeCrew: 0,
            });
          }

          const vesselData = vesselMap.get(vesselId);
          if (!vesselData) continue;

          const member: CrewMember = {
            id: String(assignment.id),
            crewId,
            seafarerName: assignment.crew?.fullName?.trim() || "Unknown Crew",
            rank: assignment.rank?.trim() || "Rank not set",
            signOnDate: assignment.signOnDate || assignment.startDate || "",
            signOffDate: assignment.signOffDate || assignment.endDate || undefined,
            status: normalizeStatus(assignment.status),
            principalName: assignment.principal?.name?.trim() || undefined,
            contractAlert,
          };

          vesselData.crewMembers.push(member);
          if (member.status === "ONBOARD") {
            vesselData.activeCrew += 1;
          }
        }

        const nextVessels = Array.from(vesselMap.values())
          .map((vessel) => ({
            ...vessel,
            totalCrew: vessel.crewMembers.length,
          }))
          .sort((left, right) => left.vesselName.localeCompare(right.vesselName));

        setVesselCrews(nextVessels);
      } catch (fetchError) {
        console.error("Error fetching crew list:", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load crew list data.");
        setVesselCrews([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCrewList();
  }, [session]);

  const filteredVesselCrews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return vesselCrews;
    }

    return vesselCrews
      .map((vessel) => ({
        ...vessel,
        crewMembers: vessel.crewMembers.filter((member) =>
          [vessel.vesselName, member.seafarerName, member.rank].join(" ").toLowerCase().includes(query)
        ),
      }))
      .filter((vessel) => vessel.vesselName.toLowerCase().includes(query) || vessel.crewMembers.length > 0)
      .map((vessel) => ({
        ...vessel,
        totalCrew: vessel.crewMembers.length,
        activeCrew: vessel.crewMembers.filter((member) => member.status === "ONBOARD").length,
      }));
  }, [searchQuery, vesselCrews]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900" />
        <p className="text-sm font-semibold text-slate-600">Loading crew list...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <section className="surface-card border-rose-200 bg-rose-50 p-6">
        <h3 className="text-lg font-semibold text-rose-900">Error Loading Crew List</h3>
        <p className="mt-2 text-sm text-rose-700">{error}</p>
      </section>
    );
  }

  const totalActive = vesselCrews.reduce((sum, vessel) => sum + vessel.activeCrew, 0);
  const totalDeparted = vesselCrews.reduce(
    (sum, vessel) => sum + vessel.crewMembers.filter((member) => member.status === "DEPARTED").length,
    0
  );
  const totalPlanned = vesselCrews.reduce(
    (sum, vessel) => sum + vessel.crewMembers.filter((member) => member.status === "PLANNED").length,
    0
  );
  const expiringContracts45 = vesselCrews.reduce(
    (sum, vessel) =>
      sum +
      vessel.crewMembers.filter((member) => {
        const band = member.contractAlert ? getContractExpiryBand(member.contractAlert.daysRemaining) : "OK";
        return member.status === "ONBOARD" && ["EXPIRED", "CRITICAL", "URGENT"].includes(band);
      }).length,
    0
  );

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">Vessel Manning</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Crew onboard board</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Monitor onboard, planned, and departed crew by vessel using live assignment data and contract alerts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => router.push("/crewing")}>
              Back to crewing
            </Button>
            <Link href="/crewing/assignments/new" className="action-pill text-sm">
              Create assignment
            </Link>
          </div>
        </div>
      </section>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="surface-card p-6">
            <p className="text-sm font-medium text-slate-600">Total Vessels</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{vesselCrews.length}</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-sm font-medium text-slate-600">Active Crew</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{totalActive}</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-sm font-medium text-slate-600">Departed Records</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{totalDeparted}</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-sm font-medium text-slate-600">Planned Movements</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{totalPlanned}</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-sm font-medium text-slate-600">Contracts ≤ 45 Days</p>
            <p className="mt-2 text-2xl font-extrabold text-rose-700">{expiringContracts45}</p>
          </div>
        </div>

      <section className="grid gap-4 lg:grid-cols-[1fr,320px]">
          <div className="surface-card border-sky-200 bg-sky-50 p-5">
            <p className="text-sm font-semibold text-sky-900">How to use this board</p>
            <p className="mt-1 text-sm text-sky-800">
              This page is generated from active assignment records. Create or update movements from the Transport Assignment page,
              then return here to monitor onboard, planned, and departed crew by vessel.
            </p>
          </div>
          <div className="surface-card p-5">
            <Input
              id="crew-list-search"
              type="text"
              label="Search vessel, crew, or rank"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Type a keyword"
              helperText="Search by vessel name, crew member, or rank to narrow the current board."
            />
          </div>
      </section>

        <div className="section-stack">
          {filteredVesselCrews.map((vessel) => (
            <div key={vessel.vesselId} className="surface-card overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600/95 via-indigo-500/90 to-blue-600/90 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white/90 rounded-lg flex items-center justify-center">
                      <span className="text-indigo-600 text-lg font-bold">V</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-white">{vessel.vesselName}</h2>
                      <p className="text-indigo-100">
                        {vessel.activeCrew} onboard • {vessel.totalCrew} records shown
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100/90">
                        {
                          vessel.crewMembers.filter((member) =>
                            member.status === "ONBOARD" &&
                            member.contractAlert &&
                            ["EXPIRED", "CRITICAL", "URGENT"].includes(member.contractAlert.band)
                          ).length
                        }{" "}
                        contracts within 45 days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedVessel(selectedVessel === vessel.vesselId ? null : vessel.vesselId)}
                      className="action-pill text-xs bg-white/90 border-white/60 text-indigo-700 hover:bg-white"
                    >
                      {selectedVessel === vessel.vesselId ? "Hide Details" : "Open Quick View"}
                    </button>
                    <Link
                      href={`/crewing/crew-list/vessel/${vessel.vesselId}`}
                      className="action-pill text-xs bg-white/90 border-white/60 text-indigo-700 hover:bg-white"
                    >
                      Vessel Board
                    </Link>
                  </div>
                </div>
              </div>

              {selectedVessel === vessel.vesselId ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Crew</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sign On</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sign Off</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contract Alert</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Next Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {vessel.crewMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{member.seafarerName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{member.rank}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{formatDate(member.signOnDate)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{formatDate(member.signOffDate)}</td>
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
                          <td className="px-6 py-4 text-sm">
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
              ) : (
                <div className="px-6 py-4 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-slate-700">
                      <div>
                        <span className="font-semibold text-slate-900">{vessel.activeCrew}</span> onboard records
                      </div>
                      <div>
                        <span className="font-semibold text-rose-600">
                          {vessel.crewMembers.filter((member) => member.status === "DEPARTED").length}
                        </span>{" "}
                        departed records
                      </div>
                      <div>
                        <span className="font-semibold text-rose-600">
                          {
                            vessel.crewMembers.filter(
                              (member) =>
                                member.status === "ONBOARD" &&
                                member.contractAlert &&
                                ["EXPIRED", "CRITICAL", "URGENT"].includes(member.contractAlert.band)
                            ).length
                          }
                        </span>{" "}
                        contracts within 45 days
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedVessel(vessel.vesselId)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold"
                    >
                      Open Quick View
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredVesselCrews.length === 0 ? (
          <section className="surface-card py-12 text-center">
            <h3 className="mt-2 text-sm font-medium text-slate-900">
              {vesselCrews.length === 0 ? "No crew data available" : "No crew record matches the current search"}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {vesselCrews.length === 0
                ? "Crew lists are generated automatically from assignment records."
                : "Adjust the keyword to see more vessels or crew members."}
            </p>
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
