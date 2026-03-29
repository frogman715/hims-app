"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { pushAppNotice } from "@/lib/app-notice";

interface CrewOption {
  id: string;
  fullName: string;
  rank: string;
}

interface ExchangeExpense {
  id: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  idrAmount: number;
  expenseDate: string;
  description: string;
  status: string;
  crew: {
    id: string;
    fullName: string;
    rank: string;
  };
}

export default function ExchangeExpensePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExchangeExpense[]>([]);
  const [crews, setCrews] = useState<CrewOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    crewId: "",
    description: "",
    amount: "",
    currency: "USD",
    exchangeRate: "16500",
    expenseDate: new Date().toISOString().split("T")[0],
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
      const [expenseResponse, crewResponse] = await Promise.all([
        fetch("/api/accounting/exchange-expense"),
        fetch("/api/crew?limit=1000"),
      ]);

      if (expenseResponse.ok) {
        const data = await expenseResponse.json();
        setExpenses(data.data || []);
      }

      if (crewResponse.ok) {
        const data = await crewResponse.json();
        setCrews(data.crews || []);
      }
    } catch (error) {
      console.error("Error fetching exchange expenses:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      const response = await fetch("/api/accounting/exchange-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewId: formData.crewId,
          description: formData.description,
          amount: Number(formData.amount),
          currency: formData.currency,
          exchangeRate: Number(formData.exchangeRate),
          expenseDate: formData.expenseDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save exchange expense");
      }

      setShowForm(false);
      setFormData({
        crewId: "",
        description: "",
        amount: "",
        currency: "USD",
        exchangeRate: "16500",
        expenseDate: new Date().toISOString().split("T")[0],
      });
      await fetchData();
    } catch (error) {
      console.error("Error creating expense:", error);
      pushAppNotice({
        tone: "error",
        title: "Exchange expense could not be saved",
        message: "The exchange expense record could not be saved.",
      });
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <section className="surface-card flex min-h-[320px] items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" />
            <p className="mt-4 text-sm text-slate-600">Loading exchange expense register...</p>
          </div>
        </section>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const idrExposure = expenses.reduce((sum, expense) => sum + expense.idrAmount, 0);
  const pendingReview = expenses.filter((expense) => expense.status !== "APPROVED").length;

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Accounting Workspace"
        title="Crew Exchange Expenses"
        subtitle="Track crew-change, travel, and exchange expenses with complete FX references so finance and operations can reconcile mobilization costs without duplicate follow-up."
        highlights={[
          {
            label: "Expense Entries",
            value: expenses.length,
            detail: "Recorded exchange expense items in the active register.",
          },
          {
            label: "USD Exposure",
            value: `USD ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            detail: "Original-currency total across all exchange-related costs.",
          },
          {
            label: "IDR Equivalent",
            value: `IDR ${idrExposure.toLocaleString("id-ID")}`,
            detail: "Converted value using the captured FX rates.",
          },
          {
            label: "Pending Review",
            value: pendingReview,
            detail: "Entries still awaiting accounting closure or approval.",
          },
        ]}
        helperLinks={[
          { href: "/accounting", label: "Accounting Desk" },
          { href: "/accounting/wages", label: "Wages Workspace" },
          { href: "/crewing/prepare-joining", label: "Prepare Joining" },
        ]}
        actions={(
          <div className="flex items-center gap-3">
            <Link href="/accounting">
              <Button variant="secondary" size="sm">Accounting Desk</Button>
            </Link>
            <Button size="sm" onClick={() => setShowForm(true)}>Add Expense</Button>
          </div>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Total Exchange Expenses</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              USD {totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-2 text-sm text-slate-600">Current register total based on recorded exchange expense entries.</p>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-5 text-sm leading-6 text-slate-700">
            Keep FX references, dates, and expense descriptions complete so accounting and operations can reconcile crew-change costs consistently.
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">Exchange Expense Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Crew</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">FX</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {new Date(expense.expenseDate).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{expense.crew.fullName}</div>
                      <div className="text-sm text-slate-500">{expense.crew.rank}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      1 {expense.currency} = IDR {expense.exchangeRate.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {expense.currency} {expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      <div className="text-xs text-slate-500">IDR {expense.idrAmount.toLocaleString("id-ID")}</div>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                      No exchange expenses recorded yet.
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Add Exchange Expense</h3>
                <p className="mt-1 text-sm text-slate-600">Record crew-change or travel-related expense values with the applicable FX rate.</p>
              </div>
              <button type="button" className="text-sm font-medium text-slate-500 hover:text-slate-900" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <Select
                id="crewId"
                name="crewId"
                label="Crew"
                required
                value={formData.crewId}
                onChange={(event) => setFormData((current) => ({ ...current, crewId: event.target.value }))}
                options={crews.map((crew) => ({ value: crew.id, label: `${crew.fullName} - ${crew.rank}` }))}
                placeholder="Select crew"
              />

              <Textarea
                id="description"
                name="description"
                label="Description"
                rows={3}
                required
                value={formData.description}
                onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                placeholder="Describe the crew-change expense"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  label="Amount"
                  required
                  value={formData.amount}
                  onChange={(event) => setFormData((current) => ({ ...current, amount: event.target.value }))}
                />
                <Select
                  id="currency"
                  name="currency"
                  label="Currency"
                  value={formData.currency}
                  onChange={(event) => setFormData((current) => ({ ...current, currency: event.target.value }))}
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "IDR", label: "IDR" },
                  ]}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  id="exchangeRate"
                  name="exchangeRate"
                  type="number"
                  step="0.01"
                  label="Exchange Rate"
                  required
                  value={formData.exchangeRate}
                  onChange={(event) => setFormData((current) => ({ ...current, exchangeRate: event.target.value }))}
                />
                <Input
                  id="expenseDate"
                  name="expenseDate"
                  type="date"
                  label="Expense Date"
                  required
                  value={formData.expenseDate}
                  onChange={(event) => setFormData((current) => ({ ...current, expenseDate: event.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Expense</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
