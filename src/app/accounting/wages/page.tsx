'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
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
  vessel?: {
    name: string;
  } | null;
}

interface WageRecord {
  id: string;
  month: number;
  year: number;
  basicWage: number;
  overtime: number;
  allowances: number;
  deductions: number;
  totalAmount: number;
  currency: string;
  status: string;
  crew: {
    id: string;
    fullName: string;
    rank: string;
  };
  contract?: {
    id: string;
    contractNumber: string;
    vessel?: {
      name: string;
    } | null;
  } | null;
}

export default function Wages() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wages, setWages] = useState<WageRecord[]>([]);
  const [crews, setCrews] = useState<CrewOption[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    crewId: '',
    contractId: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    basicWage: '',
    overtime: '0',
    allowances: '0',
    deductions: '0',
    currency: 'USD',
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
      const [wageResponse, crewResponse, contractResponse] = await Promise.all([
        fetch("/api/accounting/wages"),
        fetch("/api/crew?limit=1000"),
        fetch("/api/contracts"),
      ]);

      if (wageResponse.ok) {
        setWages(await wageResponse.json());
      }

      if (crewResponse.ok) {
        const data = await crewResponse.json();
        setCrews(data.crews || []);
      }

      if (contractResponse.ok) {
        setContracts(await contractResponse.json());
      }
    } catch (error) {
      console.error("Error fetching wages:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      const response = await fetch("/api/accounting/wages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewId: formData.crewId,
          contractId: formData.contractId || undefined,
          month: Number(formData.month),
          year: Number(formData.year),
          basicWage: Number(formData.basicWage),
          overtime: Number(formData.overtime),
          allowances: Number(formData.allowances),
          deductions: Number(formData.deductions),
          currency: formData.currency,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create wage record");
      }

      setShowForm(false);
      setFormData({
        crewId: '',
        contractId: '',
        month: String(new Date().getMonth() + 1),
        year: String(new Date().getFullYear()),
        basicWage: '',
        overtime: '0',
        allowances: '0',
        deductions: '0',
        currency: 'USD',
      });
      await fetchData();
    } catch (error) {
      console.error("Error creating wage record:", error);
      pushAppNotice({
        tone: "error",
        title: "Wage record could not be saved",
        message: "The wage record could not be saved.",
      });
    }
  }

  if (status === "loading" || loading) {
    return <div className="section-stack"><section className="surface-card flex min-h-[320px] items-center justify-center p-8"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" /><p className="mt-4 text-sm text-slate-600">Loading wage register...</p></div></section></div>;
  }

  if (!session) {
    return null;
  }

  const totalWages = wages.reduce((sum, wage) => sum + wage.totalAmount, 0);
  const pendingWages = wages.filter((wage) => wage.status !== "PAID" && wage.status !== "CANCELLED").length;

  return (
    <div className="section-stack mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHero
        eyebrow="Finance Payroll"
        title="Wage management"
        subtitle="Maintain monthly crew salary records tied to active contracts, wage components, and payroll review status."
        helperLinks={[
          { href: "/accounting/salary", label: "Payroll hub" },
          { href: "/contracts", label: "Contracts" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Total Wage Value", value: `USD ${totalWages.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, detail: "Current cumulative total across listed wage records." },
          { label: "Wage Records", value: wages.length.toLocaleString("id-ID"), detail: "Entries currently available in payroll storage." },
          { label: "Open Payroll Items", value: pendingWages.toLocaleString("id-ID"), detail: "Records not yet closed in finance processing." },
        ]}
        actions={(
          <>
            <Link href="/accounting/salary" className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700">
              Back to payroll hub
            </Link>
            <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              Add wage record
            </button>
          </>
        )}
      />

      <main>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-300">
            <h2 className="text-xl font-semibold text-gray-900">Wage Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crew</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wages.map((wage) => (
                  <tr key={wage.id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{wage.crew.fullName}</div>
                      <div className="text-sm text-gray-500">{wage.crew.rank}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {wage.contract?.contractNumber || "No contract"}
                      <div className="text-xs text-gray-500">{wage.contract?.vessel?.name || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {String(wage.month).padStart(2, "0")}/{wage.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {wage.currency} {wage.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{wage.status}</td>
                  </tr>
                ))}
                {wages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No wage records yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showForm ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6">Add Wage Record</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                required
                value={formData.crewId}
                onChange={(event) => setFormData((current) => ({ ...current, crewId: event.target.value, contractId: '' }))}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg"
              >
                <option value="">Select crew</option>
                {crews.map((crew) => (
                  <option key={crew.id} value={crew.id}>
                    {crew.fullName} - {crew.rank}
                  </option>
                ))}
              </select>

              <select
                value={formData.contractId}
                onChange={(event) => setFormData((current) => ({ ...current, contractId: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg"
              >
                <option value="">Optional contract</option>
                {contracts
                  .filter((contract) => !formData.crewId || contract.crewId === formData.crewId)
                  .map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.contractNumber}{contract.vessel?.name ? ` - ${contract.vessel.name}` : ""}
                    </option>
                  ))}
              </select>

              <div className="grid grid-cols-2 gap-4">
                <input type="number" min="1" max="12" required value={formData.month} onChange={(event) => setFormData((current) => ({ ...current, month: event.target.value }))} className="w-full px-3 py-2 border border-gray-400 rounded-lg" placeholder="Month" />
                <input type="number" min="2000" max="2100" required value={formData.year} onChange={(event) => setFormData((current) => ({ ...current, year: event.target.value }))} className="w-full px-3 py-2 border border-gray-400 rounded-lg" placeholder="Year" />
              </div>

              <input type="number" step="0.01" required value={formData.basicWage} onChange={(event) => setFormData((current) => ({ ...current, basicWage: event.target.value }))} className="w-full px-3 py-2 border border-gray-400 rounded-lg" placeholder="Basic wage" />
              <input type="number" step="0.01" value={formData.overtime} onChange={(event) => setFormData((current) => ({ ...current, overtime: event.target.value }))} className="w-full px-3 py-2 border border-gray-400 rounded-lg" placeholder="Overtime" />
              <input type="number" step="0.01" value={formData.allowances} onChange={(event) => setFormData((current) => ({ ...current, allowances: event.target.value }))} className="w-full px-3 py-2 border border-gray-400 rounded-lg" placeholder="Allowances" />
              <input type="number" step="0.01" value={formData.deductions} onChange={(event) => setFormData((current) => ({ ...current, deductions: event.target.value }))} className="w-full px-3 py-2 border border-gray-400 rounded-lg" placeholder="Deductions" />

              <select value={formData.currency} onChange={(event) => setFormData((current) => ({ ...current, currency: event.target.value }))} className="w-full px-3 py-2 border border-gray-400 rounded-lg">
                <option value="USD">USD</option>
                <option value="IDR">IDR</option>
              </select>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium">
                  Save
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
