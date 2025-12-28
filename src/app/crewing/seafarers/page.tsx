"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface Seafarer {
  id: number;
  fullName: string;
  nationality: string;
  dateOfBirth: string | null;
  photoUrl?: string;
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
  }, [session]);

  const fetchSeafarers = async () => {
    try {
      const response = await fetch("/api/seafarers");
      if (response.ok) {
        const data = await response.json();
        setSeafarers(data);
      }
    } catch (error) {
      console.error("Error fetching seafarers:", error);
    } finally {
      setLoading(false);
    }
  };

  const tableRows = seafarers.map((seafarer) => {
    const latestAssignment = seafarer.assignments[0];
    return {
      ...seafarer,
      latestAssignment,
      statusTone: latestAssignment ? assignmentStatusTone(latestAssignment.status ?? "") : "bg-slate-100 text-slate-700",
    };
  });

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Crewing</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Seafarers List</h1>
            <p className="mt-2 text-sm text-slate-600">Manage seafarer profiles and information (CR-01)</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="ghost" onClick={() => router.push("/crewing")}>Back to Crewing</Button>
            <Button onClick={() => router.push("/crewing/seafarers/new")}>New Seafarer</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Master Database</h2>
              <p className="text-sm text-slate-500">Overview of all registered officers and ratings.</p>
            </div>
            <span className="text-sm font-semibold text-slate-400">Total: {seafarers.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Name</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Nationality</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Date of Birth</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Assignment</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Status</th>
                  <th scope="col" className="whitespace-nowrap px-6 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {tableRows.map((seafarer) => (
                  <tr key={seafarer.id} className="transition hover:bg-emerald-50/40">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        {seafarer.photoUrl ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-full">
                            <Image
                              src={seafarer.photoUrl}
                              alt={seafarer.fullName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                            {seafarer.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => router.push(`/crewing/seafarers/${seafarer.id}/biodata`)}
                          className="text-sm font-semibold text-slate-900 transition hover:text-emerald-600"
                        >
                          {seafarer.fullName}
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{seafarer.nationality}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{formatDate(seafarer.dateOfBirth)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {seafarer.latestAssignment ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{seafarer.latestAssignment.rank ?? "—"}</p>
                          <p className="text-sm text-slate-500">{seafarer.latestAssignment.vessel.name}</p>
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
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex justify-end gap-2">
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
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      No seafarers found. Add your first seafarer to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}