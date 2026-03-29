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
}

interface LeavePay {
  id: string;
  amount: number;
  currency: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  crew: {
    id: string;
    fullName: string;
    rank: string;
  };
  contract?: {
    id: string;
    contractNumber: string;
  } | null;
}

export default function LeavePayPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leavePays, setLeavePays] = useState<LeavePay[]>([]);
  const [crews, setCrews] = useState<CrewOption[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    crewId: '',
    contractId: '',
    leaveType: 'ANNUAL',
    amount: '',
    currency: 'USD',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
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
      const [leavePayResponse, crewResponse, contractResponse] = await Promise.all([
        fetch("/api/accounting/leave-pay"),
        fetch("/api/crew?limit=1000"),
        fetch("/api/contracts"),
      ]);

      if (leavePayResponse.ok) {
        const data = await leavePayResponse.json();
        setLeavePays(data.data || []);
      }
      if (crewResponse.ok) {
        const data = await crewResponse.json();
        setCrews(data.crews || []);
      }
      if (contractResponse.ok) {
        setContracts(await contractResponse.json());
      }
    } catch (error) {
      console.error("Error fetching leave pays:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      const response = await fetch("/api/accounting/leave-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewId: formData.crewId,
          contractId: formData.contractId || undefined,
          leaveType: formData.leaveType,
          amount: Number(formData.amount),
          currency: formData.currency,
          startDate: formData.startDate,
          endDate: formData.endDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save leave pay");
      }

      setShowForm(false);
      setFormData({
        crewId: '',
        contractId: '',
        leaveType: 'ANNUAL',
        amount: '',
        currency: 'USD',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      });
      await fetchData();
    } catch (error) {
      console.error("Error creating leave pay:", error);
      pushAppNotice({
        tone: "error",
        title: "Leave pay could not be saved",
        message: "The leave pay record could not be saved.",
      });
    }
  }

  if (status === "loading" || loading) {
    return <div className="section-stack"><section className="surface-card flex min-h-[320px] items-center justify-center p-8"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" /><p className="mt-4 text-sm text-slate-600">Loading leave pay register...</p></div></section></div>;
  }

  if (!session) {
    return null;
  }

  const totalLeavePay = leavePays.reduce((sum, pay) => sum + pay.amount, 0);
  const activeRecords = leavePays.filter((pay) => pay.status !== "PAID" && pay.status !== "CANCELLED").length;

  return (
    <div className="section-stack mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHero
        eyebrow="Finance Leave Pay"
        title="Leave pay management"
        subtitle="Track leave pay items per crew and contract in one finance-controlled workspace for post-sign-off and contract-related disbursements."
        helperLinks={[
          { href: "/accounting/salary", label: "Payroll hub" },
          { href: "/accounting", label: "Finance workspace" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Total Leave Pay", value: `USD ${totalLeavePay.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, detail: "Current value across all listed leave pay records." },
          { label: "Records", value: leavePays.length.toLocaleString("id-ID"), detail: "Leave pay entries currently stored." },
          { label: "Open Items", value: activeRecords.toLocaleString("id-ID"), detail: "Items still active in finance processing." },
        ]}
        actions={(
          <>
            <Link href="/accounting" className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700">
              Back to accounting
            </Link>
            <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              Add leave pay
            </button>
          </>
        )}
      />

      <main className="space-y-6">
        <div className="surface-card p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Total Leave Pay</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">
            USD {totalLeavePay.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-300">
            <h2 className="text-xl font-semibold text-gray-900">Leave Pay Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crew</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leavePays.map((pay) => (
                  <tr key={pay.id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{pay.crew.fullName}</div>
                      <div className="text-xs text-gray-500">{pay.crew.rank}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {pay.contract?.contractNumber || "No contract"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {pay.leaveType}
                      <div className="text-xs text-gray-500">
                        {new Date(pay.startDate).toLocaleDateString("id-ID")} - {new Date(pay.endDate).toLocaleDateString("id-ID")} ({pay.days} days)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pay.currency} {pay.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pay.status}</td>
                  </tr>
                ))}
                {leavePays.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No leave pay records yet.
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
            <h3 className="text-xl font-extrabold text-gray-900 mb-6">Add Leave Pay Record</h3>
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
                      {contract.contractNumber}
                    </option>
                  ))}
              </select>

              <select
                value={formData.leaveType}
                onChange={(event) => setFormData((current) => ({ ...current, leaveType: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg"
              >
                <option value="ANNUAL">Annual</option>
                <option value="SICK">Sick</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="UNPAID">Unpaid</option>
                <option value="OTHER">Other</option>
              </select>

              <div className="grid grid-cols-2 gap-4">
                <input type="date" required value={formData.startDate} onChange={(event) => setFormData((current) => ({ ...current, startDate: event.target.value }))} className="w-full px-3 py-2 border border-gray-400 rounded-lg" />
                <input type="date" required value={formData.endDate} onChange={(event) => setFormData((current) => ({ ...current, endDate: event.target.value }))} className="w-full px-3 py-2 border border-gray-400 rounded-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" required value={formData.amount} onChange={(event) => setFormData((current) => ({ ...current, amount: event.target.value }))} className="w-full px-3 py-2 border border-gray-400 rounded-lg" placeholder="Amount" />
                <select value={formData.currency} onChange={(event) => setFormData((current) => ({ ...current, currency: event.target.value }))} className="w-full px-3 py-2 border border-gray-400 rounded-lg">
                  <option value="USD">USD</option>
                  <option value="IDR">IDR</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg font-medium">
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
