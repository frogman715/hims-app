"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

interface AgencyFeeRow {
  id: string;
  feeType: string;
  amount: number;
  currency: string;
  dueDate: string;
  paidDate: string | null;
  status: string;
  description: string | null;
  principal?: {
    name?: string | null;
  } | null;
  contract?: {
    contractNumber?: string | null;
  } | null;
}

function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB");
}

function getBillingState(fee: AgencyFeeRow) {
  if (fee.status === "PAID") {
    return { label: "Paid", className: "bg-emerald-50 text-emerald-700" };
  }
  if (fee.status === "CANCELLED") {
    return { label: "Cancelled", className: "bg-slate-100 text-slate-600" };
  }

  const dueDate = new Date(fee.dueDate);
  if (!Number.isNaN(dueDate.getTime()) && dueDate < new Date()) {
    return { label: "Overdue", className: "bg-rose-50 text-rose-700" };
  }

  return { label: "Pending", className: "bg-amber-50 text-amber-700" };
}

export default function BillingPage() {
  const [fees, setFees] = useState<AgencyFeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFees = async () => {
      try {
        setError(null);
        const response = await fetch("/api/agency-fees", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load billing records");
        }
        const data = await response.json();
        setFees(Array.isArray(data) ? data : []);
      } catch (loadError) {
        console.error("Error loading billing records:", loadError);
        setError(loadError instanceof Error ? loadError.message : "Failed to load billing records");
      } finally {
        setLoading(false);
      }
    };

    loadFees();
  }, []);

  const summary = useMemo(() => {
    return fees.reduce(
      (accumulator, fee) => {
        const state = getBillingState(fee);
        if (state.label === "Pending") {
          accumulator.pending += 1;
        } else if (state.label === "Overdue") {
          accumulator.overdue += 1;
        } else if (state.label === "Paid") {
          accumulator.paid += 1;
        }

        if (state.label !== "Paid" && state.label !== "Cancelled") {
          accumulator.outstanding += fee.amount;
        }

        return accumulator;
      },
      { pending: 0, overdue: 0, paid: 0, outstanding: 0 }
    );
  }, [fees]);

  return (
    <div className="section-stack page-shell px-6 py-10">
      <WorkspaceHero
        eyebrow="Finance Billing"
        title="Billing follow-up"
        subtitle="Review agency fee receivables, due dates, and payment status from one finance queue built for follow-up, not raw data browsing."
        helperLinks={[
          { href: "/accounting", label: "Finance workspace" },
          { href: "/agency-fees", label: "Agency fee ledger" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Outstanding Value", value: formatMoney("USD", summary.outstanding), detail: "Pending and overdue receivables." },
          { label: "Pending", value: summary.pending.toLocaleString("id-ID"), detail: "Open billing items not yet overdue." },
          { label: "Overdue", value: summary.overdue.toLocaleString("id-ID"), detail: "Items requiring collection follow-up." },
          { label: "Paid", value: summary.paid.toLocaleString("id-ID"), detail: "Closed finance items already settled." },
        ]}
        actions={(
          <>
            <Link href="/accounting" className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700">
              Back to finance
            </Link>
            <Link href="/agency-fees" className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              Open agency fee ledger
            </Link>
          </>
        )}
      />

        <section className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-4">
          <p className="text-sm font-semibold text-blue-900">How to use this page</p>
          <p className="mt-1 text-sm text-blue-800">
            This billing view tracks live agency fee records. Use the detailed agency fee ledger for creation and edits, then return here for payment follow-up.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Outstanding Value</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatMoney("USD", summary.outstanding)}</p>
            <p className="mt-1 text-sm text-slate-600">Pending and overdue receivables</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
            <p className="mt-2 text-2xl font-extrabold text-amber-700">{summary.pending}</p>
            <p className="mt-1 text-sm text-slate-600">Not yet settled and not overdue</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overdue</p>
            <p className="mt-2 text-2xl font-extrabold text-rose-700">{summary.overdue}</p>
            <p className="mt-1 text-sm text-slate-600">Requires payment follow-up</p>
          </div>
          <div className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paid</p>
            <p className="mt-2 text-2xl font-extrabold text-emerald-700">{summary.paid}</p>
            <p className="mt-1 text-sm text-slate-600">Closed finance items</p>
          </div>
        </section>

        <section className="surface-card">
          <div className="surface-card__header px-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Agency Fee Billing Queue</h2>
              <p className="mt-1 text-sm text-slate-500">Finance-facing list of due, overdue, and paid agency fee records.</p>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-sm text-slate-500">Loading billing records...</div>
          ) : error ? (
            <div className="px-6 py-10">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {error}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto px-2 pb-2">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Principal</th>
                    <th className="px-4 py-3 text-left">Contract</th>
                    <th className="px-4 py-3 text-left">Fee Type</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Due Date</th>
                    <th className="px-4 py-3 text-left">Paid Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee) => {
                    const state = getBillingState(fee);

                    return (
                      <tr key={fee.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-slate-800">{fee.principal?.name ?? "Unassigned principal"}</td>
                        <td className="px-4 py-3 text-slate-600">{fee.contract?.contractNumber ?? "-"}</td>
                        <td className="px-4 py-3 text-slate-700">{fee.feeType}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(fee.currency, fee.amount)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDate(fee.dueDate)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDate(fee.paidDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`badge-soft ${state.className}`}>{state.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {fees.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                        No agency fee billing records are available yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </div>
  );
}
