"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { pushAppNotice } from "@/lib/app-notice";

interface CrewOption {
  id: string;
  fullName: string;
  rank: string;
}

interface ContractOption {
  id: string;
  crewId: string;
  contractNumber: string;
}

interface Allotment {
  id: string;
  contractId: string;
  contractNumber: string;
  amount: number;
  currency: string;
  seafarer: {
    id: string;
    name: string;
    rank: string;
  };
}

export default function Allotments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [allotments, setAllotments] = useState<Allotment[]>([]);
  const [crews, setCrews] = useState<CrewOption[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    crewId: "",
    contractId: "",
    amount: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    void fetchData();
  }, [session, status, router]);

  async function fetchData() {
    try {
      const [allotmentResponse, crewResponse, contractResponse] = await Promise.all([
        fetch("/api/accounting/allotments"),
        fetch("/api/crew?limit=1000"),
        fetch("/api/contracts"),
      ]);

      if (allotmentResponse.ok) {
        setAllotments(await allotmentResponse.json());
      }
      if (crewResponse.ok) {
        const data = await crewResponse.json();
        setCrews(data.crews || []);
      }
      if (contractResponse.ok) {
        setContracts(await contractResponse.json());
      }
    } catch (error) {
      console.error("Error fetching allotments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      const response = await fetch("/api/accounting/allotments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewId: formData.crewId,
          contractId: formData.contractId || undefined,
          amount: Number(formData.amount),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save allotment");
      }

      setShowForm(false);
      setFormData({ crewId: "", contractId: "", amount: "" });
      await fetchData();
    } catch (error) {
      console.error("Error creating allotment:", error);
      pushAppNotice({
        tone: "error",
        title: "Allotment could not be saved",
        message: "The home allotment record could not be saved.",
      });
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <section className="surface-card flex min-h-[320px] items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" />
            <p className="mt-4 text-sm text-slate-600">Loading allotment register...</p>
          </div>
        </section>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const linkedContracts = allotments.filter((allotment) => allotment.contractId).length;
  const totalAllotment = allotments.reduce((sum, allotment) => sum + allotment.amount, 0);

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Accounting Workspace"
        title="Home Allotments"
        subtitle="Maintain approved home allotment values against live sea contracts so payroll transfers, family remittance planning, and contract review stay aligned."
        highlights={[
          {
            label: "Active Records",
            value: allotments.length,
            detail: "Crew allotment instructions currently active in the register.",
          },
          {
            label: "Linked Contracts",
            value: linkedContracts,
            detail: "Entries already tied to a current contract reference.",
          },
          {
            label: "Register Value",
            value: `USD ${totalAllotment.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            detail: "Total allotment exposure captured in the current register.",
          },
        ]}
        helperLinks={[
          { href: "/accounting/salary", label: "Salary Desk" },
          { href: "/contracts", label: "Contract Register" },
          { href: "/crewing/assignments", label: "Assignment Desk" },
        ]}
        actions={(
          <div className="flex items-center gap-3">
            <Link href="/accounting/salary">
              <Button variant="secondary" size="sm">Salary Desk</Button>
            </Link>
            <Button size="sm" onClick={() => setShowForm(true)}>Set Allotment</Button>
          </div>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-5 text-sm leading-6 text-slate-700">
          Keep allotment values aligned with the latest sea contract or payroll instruction so salary transfers remain traceable and current.
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">Allotment Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Crew</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Contract</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {allotments.map((allotment) => (
                  <tr key={allotment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{allotment.seafarer.name}</div>
                      <div className="text-sm text-slate-500">{allotment.seafarer.rank}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{allotment.contractNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {allotment.currency} {allotment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {allotments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500">
                      No allotment values found yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Set Home Allotment</h3>
                <p className="mt-1 text-sm text-slate-600">Assign the approved allotment value to the selected crew record.</p>
              </div>
              <button type="button" className="text-sm font-medium text-slate-500 hover:text-slate-900" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <Select
                id="crewId"
                name="crewId"
                label="Crew"
                required
                value={formData.crewId}
                onChange={(event) => setFormData((current) => ({ ...current, crewId: event.target.value, contractId: "" }))}
                options={crews.map((crew) => ({ value: crew.id, label: `${crew.fullName} - ${crew.rank}` }))}
                placeholder="Select crew"
              />

              <Select
                id="contractId"
                name="contractId"
                label="Contract"
                value={formData.contractId}
                onChange={(event) => setFormData((current) => ({ ...current, contractId: event.target.value }))}
                options={contracts
                  .filter((contract) => !formData.crewId || contract.crewId === formData.crewId)
                  .map((contract) => ({ value: contract.id, label: contract.contractNumber }))}
                placeholder="Latest sea contract"
              />

              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                label="Allotment Amount"
                required
                value={formData.amount}
                onChange={(event) => setFormData((current) => ({ ...current, amount: event.target.value }))}
              />

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Allotment</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
