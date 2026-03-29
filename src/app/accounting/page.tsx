import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AccountingPage() {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "accounting",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    redirectOnDisallowed: "/dashboard",
  });

  const expenses = await prisma.officeExpense.findMany({
    orderBy: { expenseDate: "desc" },
    take: 5,
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  const agencyFees = await prisma.agencyFee.findMany({
    select: {
      amount: true,
      status: true,
      dueDate: true,
    },
  });

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const outstandingFees = agencyFees.reduce((sum, fee) => {
    if (fee.status === "PAID" || fee.status === "CANCELLED") {
      return sum;
    }
    return sum + fee.amount;
  }, 0);
  const overdueFees = agencyFees.filter((fee) => {
    if (fee.status === "PAID" || fee.status === "CANCELLED") {
      return false;
    }
    return fee.dueDate < new Date();
  }).length;

  const summaryCards = [
    {
      title: "Office Expenses",
      value: `IDR ${totalExpenses.toLocaleString("id-ID")}`,
      note: "Latest posted records",
      icon: "🏢",
      accent: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Crew Salaries",
      value: "Open Module",
      note: "Payroll and disbursement desk",
      icon: "👥",
      accent: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Exchange Expenses",
      value: "Open Module",
      note: "Crew change cost tracking",
      icon: "🔄",
      accent: "bg-purple-500/10 text-purple-600",
    },
    {
      title: "Billing Queue",
      value: `USD ${outstandingFees.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      note: overdueFees > 0 ? `${overdueFees} overdue fee item(s)` : "No overdue fee items",
      icon: "🧾",
      accent: "bg-amber-500/10 text-amber-600",
    },
  ];

  const quickActions = [
    {
      href: "/accounting/office-expense",
      title: "Office Expenses",
      description: "Record and review office spending",
      icon: "💼",
    },
    {
      href: "/accounting/salary",
      title: "Crew Salaries",
      description: "Manage payroll and salary processing",
      icon: "💳",
    },
    {
      href: "/accounting/leave-pay",
      title: "Leave Pay",
      description: "Handle off-signing disbursements",
      icon: "🌴",
    },
    {
      href: "/accounting/billing",
      title: "Billing Follow-up",
      description: "Track due, overdue, and paid agency fee items",
      icon: "🧾",
    },
    {
      href: "/accounting/exchange",
      title: "Exchange Expenses",
      description: "Track travel and crew change costs",
      icon: "🌍",
    },
  ];

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Finance Workspace</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Accounting and cash-control operations</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use this page as the finance entry desk for payroll support, office expenses, billing follow-up, and exchange-cost monitoring.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="action-pill text-sm">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4">
          <p className="text-sm font-semibold text-amber-900">How to use this page</p>
          <p className="mt-1 text-sm text-amber-800">
            Start from the finance overview, then move into payroll, leave pay, office expense, or billing follow-up depending on the transaction type.
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Finance priorities</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>Keep office expense entries posted with owner and transaction date.</li>
            <li>Separate payroll, agency fee, and travel-cost follow-up clearly.</li>
            <li>Use this workspace as the internal control desk, not only as a link hub.</li>
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="surface-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.title}</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{card.value}</p>
                <p className="mt-1 text-sm text-slate-600">{card.note}</p>
              </div>
              <span className={`badge-soft ${card.accent}`}>{card.icon}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} className="surface-card p-5 hover:translate-y-[-2px]">
            <div className="flex items-start gap-3">
              <span className="badge-soft bg-slate-100 text-slate-700" aria-hidden="true">
                {action.icon}
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">{action.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="surface-card">
        <div className="surface-card__header px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent office expenses</h2>
              <p className="mt-1 text-sm text-slate-500">Latest posted entries from the office expense ledger.</p>
            </div>
            <Link href="/accounting/office-expense" className="action-pill px-4 py-2 text-sm">
              Open full ledger
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto px-2 pb-2">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Created By</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-800">
                    {new Date(expense.expenseDate).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-soft bg-blue-50 text-blue-700">{expense.expenseType}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{expense.description}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {expense.currency} {expense.amount.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{expense.user?.name ?? "Unknown"}</td>
                </tr>
              ))}
              {expenses.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    No office expenses have been posted yet. Start with petty cash, transport, or vendor invoices.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
