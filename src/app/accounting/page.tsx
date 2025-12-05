import Link from "next/link";

async function getOfficeExpenses() {
  const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/accounting/office-expense`, {
    cache: 'no-store'
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export default async function AccountingPage() {
  const expenses = await getOfficeExpenses();
  const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Accounting & Finance</h1>
        <p className="text-sm text-gray-500">
          Kelola gaji crew, biaya operasional, dan laporan keuangan.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-sm font-medium text-gray-500">Office Expenses</h3>
          <p className="text-2xl font-extrabold">IDR {totalExpenses.toLocaleString()}</p>
          <p className="text-sm text-gray-700">This month</p>
        </div>

        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-sm font-medium text-gray-500">Crew Salaries</h3>
          <p className="text-2xl font-extrabold">-</p>
          <p className="text-sm text-gray-700">Pending payment</p>
        </div>

        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-sm font-medium text-gray-500">Exchange Expenses</h3>
          <p className="text-2xl font-extrabold">-</p>
          <p className="text-sm text-gray-700">This month</p>
        </div>

        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-sm font-medium text-gray-500">Invoices</h3>
          <p className="text-2xl font-extrabold">-</p>
          <p className="text-sm text-gray-700">Outstanding</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/accounting/office-expense"
          className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow"
        >
          <h3 className="font-medium">Office Expenses</h3>
          <p className="text-sm text-gray-500">Input & track office costs</p>
        </Link>

        <Link
          href="/accounting/salary"
          className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow"
        >
          <h3 className="font-medium">Crew Salaries</h3>
          <p className="text-sm text-gray-500">Manage crew payments</p>
        </Link>

        <Link
          href="/accounting/leave-pay"
          className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow"
        >
          <h3 className="font-medium">Leave Pay</h3>
          <p className="text-sm text-gray-500">Off-signing payments</p>
        </Link>

        <Link
          href="/accounting/exchange"
          className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow"
        >
          <h3 className="font-medium">Exchange Expenses</h3>
          <p className="text-sm text-gray-500">Crew change costs</p>
        </Link>
      </div>

      {/* Recent Office Expenses */}
      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Office Expenses</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Created By</th>
              </tr>
            </thead>
            <tbody>
              {expenses.slice(0, 5).map((expense: any) => (
                <tr key={expense.id} className="border-t">
                  <td className="px-4 py-2">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-xs px-4 py-2 rounded border">
                      {expense.type}
                    </span>
                  </td>
                  <td className="px-4 py-2">{expense.description}</td>
                  <td className="px-4 py-2 font-medium">
                    {expense.currency} {expense.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{expense.createdBy.name}</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-4 text-center text-gray-500"
                    colSpan={5}
                  >
                    No office expenses recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {expenses.length > 0 && (
          <div className="p-4 border-t">
            <Link
              href="/accounting/office-expense"
              className="text-sm text-blue-600 hover:underline"
            >
              View all expenses →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}