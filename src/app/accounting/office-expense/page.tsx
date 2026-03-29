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

interface OfficeExpense {
  id: string;
  expenseType: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  receiptUrl?: string;
  user: {
    id: string;
    name: string;
  };
}

export default function OfficeExpensePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expenses, setExpenses] = useState<OfficeExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "OFFICE",
    description: "",
    amount: "",
    currency: "IDR",
    receiptUrl: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    } else {
      void fetchExpenses();
    }
  }, [session, status, router]);

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/accounting/office-expense");
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching office expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/accounting/office-expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formData.date,
          type: formData.type,
          description: formData.description,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          receiptUrl: formData.receiptUrl || undefined,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({
          date: new Date().toISOString().split("T")[0],
          type: "OFFICE",
          description: "",
          amount: "",
          currency: "IDR",
          receiptUrl: "",
        });
        void fetchExpenses();
      }
    } catch (error) {
      console.error("Error creating office expense:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <section className="surface-card flex min-h-[320px] items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" />
            <p className="mt-4 text-sm text-slate-600">Loading office expense register...</p>
          </div>
        </section>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const withReceipt = expenses.filter((expense) => expense.receiptUrl).length;
  const expenseTypes = new Set(expenses.map((expense) => expense.expenseType)).size;

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Accounting Workspace"
        title="Office Expenses"
        subtitle="Track office operational spending, receipt coverage, and ownership so internal finance review stays clean, auditable, and easy to understand."
        highlights={[
          {
            label: "Expense Entries",
            value: expenses.length,
            detail: "Operational spending records currently stored in the register.",
          },
          {
            label: "Register Total",
            value: `IDR ${totalExpenses.toLocaleString("id-ID")}`,
            detail: "Cumulative value from the current office expense log.",
          },
          {
            label: "Receipt Coverage",
            value: `${withReceipt}/${expenses.length || 0}`,
            detail: "Entries already linked to a receipt or supporting reference.",
          },
          {
            label: "Expense Types",
            value: expenseTypes,
            detail: "Distinct cost categories active in this workspace.",
          },
        ]}
        helperLinks={[
          { href: "/accounting", label: "Accounting Desk" },
          { href: "/accounting/exchange", label: "Exchange Costs" },
          { href: "/accounting/billing", label: "Billing Desk" },
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Total Expenses</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">IDR {totalExpenses.toLocaleString("id-ID")}</p>
            <p className="mt-2 text-sm text-slate-600">Current cumulative value from the office expense register.</p>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-5 text-sm leading-6 text-slate-700">
            Record the date, type, description, and receipt reference carefully so internal finance review remains clean and traceable.
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">Expense Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {new Date(expense.expenseDate).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                        {expense.expenseType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {expense.currency} {expense.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{expense.user.name}</td>
                  </tr>
                ))}
                {expenses.length === 0 ? (
                  <tr>
                    <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={5}>
                      No expenses recorded yet. Add the first entry to start this register.
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
                <h3 className="text-xl font-semibold text-slate-900">Add Office Expense</h3>
                <p className="mt-1 text-sm text-slate-600">Create a finance register entry for office operational spending.</p>
              </div>
              <button type="button" className="text-sm font-medium text-slate-500 hover:text-slate-900" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  id="date"
                  name="date"
                  type="date"
                  label="Date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
                <Select
                  id="type"
                  name="type"
                  label="Type"
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  options={[
                    { value: "OFFICE", label: "Office" },
                    { value: "CREW_EXCHANGE", label: "Crew Exchange" },
                    { value: "MEDICAL", label: "Medical" },
                    { value: "HOTEL", label: "Hotel" },
                    { value: "TRANSPORT", label: "Transport" },
                    { value: "VISA", label: "Visa" },
                    { value: "TICKET", label: "Ticket" },
                    { value: "AGENT_FEE", label: "Agent Fee" },
                  ]}
                />
              </div>

              <Textarea
                id="description"
                name="description"
                label="Description"
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the expense"
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
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
                <Select
                  id="currency"
                  name="currency"
                  label="Currency"
                  required
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  options={[
                    { value: "IDR", label: "IDR" },
                    { value: "USD", label: "USD" },
                    { value: "EUR", label: "EUR" },
                    { value: "SGD", label: "SGD" },
                  ]}
                />
              </div>

              <Input
                id="receiptUrl"
                name="receiptUrl"
                type="url"
                label="Receipt URL"
                value={formData.receiptUrl}
                onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                placeholder="https://..."
              />

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Add Expense</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
