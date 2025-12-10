import Link from "next/link";

export const dynamic = "force-dynamic";

interface OfficeExpenseCreator {
  name: string;
}

interface OfficeExpense {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  currency: string;
  createdBy: OfficeExpenseCreator;
}

function isOfficeExpense(value: unknown): value is OfficeExpense {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const expense = value as Partial<OfficeExpense>;
  return (
    typeof expense.id === "string" &&
    typeof expense.date === "string" &&
    typeof expense.type === "string" &&
    typeof expense.description === "string" &&
    typeof expense.amount === "number" &&
    typeof expense.currency === "string" &&
    typeof expense.createdBy === "object" &&
    expense.createdBy !== null &&
    typeof expense.createdBy.name === "string"
  );
}

async function getOfficeExpenses(): Promise<OfficeExpense[]> {
  const apiBase = process.env.NEXTAUTH_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${apiBase}/api/accounting/office-expense`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload.filter(isOfficeExpense);
  } catch (error) {
    console.error("Failed to load office expenses:", error);
    return [];
  }
}

export default async function AccountingPage() {
  const expenses = await getOfficeExpenses();
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const summaryCards = [
    {
      title: "Office Expenses",
      value: `IDR ${totalExpenses.toLocaleString("id-ID")}`,
      note: "This month",
      icon: "🏢",
      accent: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Crew Salaries",
      value: "—",
      note: "Pending payment",
      icon: "👥",
      accent: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Exchange Expenses",
      value: "—",
      note: "This month",
      icon: "🔄",
      accent: "bg-purple-500/10 text-purple-600",
    },
    {
      title: "Invoices",
      value: "—",
      note: "Outstanding",
      icon: "🧾",
      accent: "bg-amber-500/10 text-amber-600",
    },
  ];

  const quickActions = [
    {
      href: "/accounting/office-expense",
      title: "Office Expenses",
      description: "Input & monitor office spending",
      icon: "💼",
    },
    {
      href: "/accounting/salary",
      title: "Crew Salaries",
      description: "Manage allotments & payroll",
      icon: "💳",
    },
    {
      href: "/accounting/leave-pay",
      title: "Leave Pay",
      description: "Handle off-signing disbursements",
      icon: "🌴",
    },
    {
      href: "/accounting/exchange",
      title: "Exchange Expenses",
      description: "Record crew change costs",
      icon: "🌍",
    },
  ];

  return (
    <div className="min-h-screen pb-12">
      <div className="page-shell px-6 py-10 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Accounting & Finance</h1>
            <p className="text-base text-slate-600 mt-1">
              Kelola gaji crew, biaya operasional, dan laporan keuangan secara real time.
            </p>
          </div>
          <Link href="/dashboard" className="action-pill">
            ← Back to Dashboard
          </Link>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.title} className="surface-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {card.title}
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-2">
                    {card.value}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{card.note}</p>
                </div>
                <span className={`badge-soft ${card.accent}`}>{card.icon}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="surface-card p-5 hover:translate-y-[-2px]"
            >
              <div className="flex items-start gap-3">
                <span className="badge-soft bg-slate-100 text-slate-700" aria-hidden="true">
                  {action.icon}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{action.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="surface-card">
          <div className="surface-card__header px-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent Office Expenses</h2>
                <p className="text-sm text-slate-500 mt-1">Snapshot of the latest five records submitted by the team.</p>
              </div>
              {expenses.length > 0 && (
                <Link
                  href="/accounting/office-expense"
                  className="action-pill text-sm px-4 py-2"
                >
                  View full ledger →
                </Link>
              )}
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
                {expenses.slice(0, 5).map((expense) => (
                  <tr key={expense.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-800">
                      {new Date(expense.date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-soft bg-blue-50 text-blue-700">
                        {expense.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{expense.description}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {expense.currency} {expense.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{expense.createdBy.name}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      No office expenses recorded yet. Start by logging petty cash or vendor invoices.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}