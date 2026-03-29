"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { canAccessOfficePath } from "@/lib/office-access";
import { normalizeToUserRoles } from "@/lib/type-guards";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

interface Seafarer {
  id: string;
  fullName: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
  rank: string | null;
  photoUrl?: string | null;
  assignments: Array<{
    id: number;
    rank: string | null;
    status: string;
    vessel: { name: string };
  }>;
}

const formatDate = (value: string | null) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function getCrewDisplayName(seafarer: Pick<Seafarer, "id" | "fullName">) {
  const normalized = seafarer.fullName?.trim();
  return normalized && normalized.length > 0 ? normalized : `Crew ${seafarer.id}`;
}

function CrewAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const fallbackSrc = "/logo.png";
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<string[]>([]);
  const [hasImageError, setHasImageError] = useState(false);
  const imageSrc = photoUrl && !failedPhotoUrls.includes(photoUrl) ? photoUrl : fallbackSrc;

  if (!hasImageError) {
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-full">
        <Image
          src={imageSrc}
          alt={name}
          fill
          unoptimized
          className="object-cover"
          onError={() => {
            if (photoUrl && imageSrc !== fallbackSrc) {
              setFailedPhotoUrls((previous) =>
                previous.includes(photoUrl) ? previous : [...previous, photoUrl]
              );
              return;
            }
            setHasImageError(true);
          }}
        />
      </div>
    );
  }

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

const assignmentStatusTone = (status: string) => {
  switch (status.toUpperCase()) {
    case "ONBOARD":
      return "bg-emerald-100 text-emerald-700";
    case "PLANNED":
      return "bg-amber-100 text-amber-700";
    case "STANDBY":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function Seafarers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seafarers, setSeafarers] = useState<Seafarer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;
  const canManageSeafarers = canAccessOfficePath("/api/crewing/seafarers", userRoles, isSystemAdmin, "POST");
  const canManageAssignments = canAccessOfficePath("/api/assignments", userRoles, isSystemAdmin, "POST");
  const canArchiveCrew = session?.user?.isSystemAdmin === true;

  const getOfficeFetchError = useCallback(
    async (response: Response, restrictedLabel: string, failedLabel: string) => {
      const payload = await response.json().catch(() => null);

      if (response.status === 401) {
        router.push("/auth/signin");
        return null;
      }

      if (response.status === 403) {
        return payload?.error || restrictedLabel;
      }

      return payload?.error || failedLabel;
    },
    [router]
  );

  const fetchSeafarers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/crewing/seafarers", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setSeafarers(Array.isArray(data?.data) ? data.data : []);
      } else {
        setError(
          await getOfficeFetchError(
            response,
            "Access to the seafarers list is restricted for your role.",
            "Seafarer data could not be loaded. Please try again or contact admin."
          )
        );
      }
    } catch (error) {
      console.error("Error fetching seafarers:", error);
      setError("Seafarer data could not be loaded. Please try again or contact admin.");
    } finally {
      setLoading(false);
    }
  }, [getOfficeFetchError]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchSeafarers();
    }
  }, [session, fetchSeafarers]);

  const tableRows = seafarers.map((seafarer) => {
    const latestAssignment = seafarer.assignments[0];
    const assignmentStatus = latestAssignment?.status?.toUpperCase() ?? "UNASSIGNED";
    const profileBlocked = !seafarer.rank;
    const deskAction =
      profileBlocked
        ? {
            label: "Complete biodata",
            helper: "Rank is still missing.",
            href: `/crewing/seafarers/${seafarer.id}/biodata`,
          }
        : !latestAssignment
          ? {
              label: canManageAssignments ? "Create assignment" : "Review biodata",
              helper: canManageAssignments ? "Crew is available without an active assignment." : "Crew has no active assignment yet.",
              href: canManageAssignments ? `/crewing/assignments/new?seafarerId=${seafarer.id}` : `/crewing/seafarers/${seafarer.id}/biodata`,
            }
          : assignmentStatus === "ONBOARD"
            ? {
                label: "Check assignment",
                helper: "Crew is already onboard.",
                href: `/crewing/seafarers/${seafarer.id}/biodata`,
              }
            : {
                label: "Open documents",
                helper: "Review crew documents before further movement.",
                href: `/crewing/seafarers/${seafarer.id}/documents`,
              };
    return {
      ...seafarer,
      latestAssignment,
      statusTone: latestAssignment ? assignmentStatusTone(latestAssignment.status ?? "") : "bg-slate-100 text-slate-700",
      deskAction,
    };
  });

  const missingRankCount = tableRows.filter((seafarer) => !seafarer.rank).length;
  const unassignedCount = tableRows.filter((seafarer) => !seafarer.latestAssignment).length;
  const onboardCount = tableRows.filter((seafarer) => seafarer.latestAssignment?.status?.toUpperCase() === "ONBOARD").length;

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <WorkspaceHero
          eyebrow="Crewing Master"
          title="Seafarer records"
          subtitle="Active crew master data for document staff, crewing office review, and downstream assignment coordination."
        />
        <section className="surface-card px-6 py-12 text-center text-sm text-slate-600">
          Loading seafarer register...
        </section>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="section-stack">
        <WorkspaceHero
          eyebrow="Crewing Master"
          title="Seafarer records"
          subtitle="Active crew master data for document staff, crewing office review, and downstream assignment coordination."
        />
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h3 className="text-lg font-semibold text-rose-900">Error loading seafarers</h3>
          <p className="mt-2 text-sm text-rose-800">{error}</p>
          <button
            onClick={() => fetchSeafarers()}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Crewing Master"
        title="Seafarer records"
        subtitle={
          canManageSeafarers
            ? "Controlled master data for active seafarers. Recruitment candidates remain outside this register until hired and transferred into crew records."
            : "Read-only active crew register for office review and downstream assignment coordination."
        }
        helperLinks={[
          { href: "/crewing/documents", label: "Document control" },
          { href: "/crewing/assignments", label: "Assignments" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Total Crew", value: seafarers.length.toLocaleString("id-ID"), detail: "Active seafarer records in the master pool." },
          { label: "Missing Rank", value: missingRankCount.toLocaleString("id-ID"), detail: "Profiles that still need master-data completion." },
          { label: "Without Assignment", value: unassignedCount.toLocaleString("id-ID"), detail: "Crew available without a current movement record." },
          { label: "Currently Onboard", value: onboardCount.toLocaleString("id-ID"), detail: "Seafarers whose latest assignment is onboard." },
        ]}
        actions={(
          <>
            <Button variant="ghost" onClick={() => router.push("/crewing")}>Back to crewing</Button>
            {canManageSeafarers ? (
              <Button onClick={() => router.push("/crewing/seafarers/new")}>New seafarer</Button>
            ) : (
              <span className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                View only
              </span>
            )}
          </>
        )}
      />

      <section className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Master Database</h2>
              <p className="text-sm text-slate-500">Overview of officially hired officers and ratings in the active crew pool.</p>
              <p className="mt-1 text-xs text-slate-400">
                Crew removal is controlled. Normal office flow uses update or archive, not hard delete.
                {canArchiveCrew ? " System admin can archive a crew record from biodata." : ""}
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-400">Total: {seafarers.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Name</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Position/Rank</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Nationality</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Date of Birth</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Assignment</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Status</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Desk Action</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {tableRows.map((seafarer) => (
                  <tr key={seafarer.id} className="transition hover:bg-emerald-50/40">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <CrewAvatar
                          name={getCrewDisplayName(seafarer)}
                          photoUrl={seafarer.photoUrl ?? null}
                        />
                        <button
                          type="button"
                          onClick={() => router.push(`/crewing/seafarers/${seafarer.id}/biodata`)}
                          className="text-sm font-semibold text-slate-900 transition hover:text-emerald-600"
                        >
                          {getCrewDisplayName(seafarer)}
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className="font-semibold text-slate-900">{seafarer.rank ?? "—"}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{seafarer.nationality ?? "—"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{formatDate(seafarer.dateOfBirth)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {seafarer.latestAssignment ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{seafarer.latestAssignment.vessel.name}</p>
                          <p className="text-xs text-slate-500">{seafarer.latestAssignment.rank ?? "—"}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">No assignment</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {seafarer.latestAssignment ? (
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${seafarer.statusTone}`}>
                          {seafarer.latestAssignment.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">UNASSIGNED</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{seafarer.deskAction.label}</p>
                        <p className="text-xs text-slate-500">{seafarer.deskAction.helper}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(seafarer.deskAction.href)}
                          className="border-emerald-300 text-emerald-700"
                        >
                          {seafarer.deskAction.label}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(`/crewing/seafarers/${seafarer.id}/documents`)}
                          className="border-slate-300 text-slate-700"
                        >
                          Documents
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(`/crewing/seafarers/${seafarer.id}/trainings`)}
                          className="border-slate-300 text-slate-700"
                        >
                          Trainings
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(`/crewing/seafarers/${seafarer.id}/medical`)}
                          className="border-slate-300 text-slate-700"
                        >
                          Medical
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                      No seafarers found. Add your first seafarer to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
    </div>
  );
}
