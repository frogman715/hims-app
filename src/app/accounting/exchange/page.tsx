'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ExchangeExpense {
  id: string;
  seafarerId: number;
  seafarerName: string;
  rank: string;
  expenseType: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  createdBy: string;
}

export default function ExchangeExpensePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExchangeExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    seafarerId: '',
    expenseType: 'TICKET',
    description: '',
    amount: '',
    currency: 'USD',
    expenseDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    } else {
      fetchExpenses();
    }
  }, [session, status, router]);

  const fetchExpenses = async () => {
    try {
      // TODO: Replace with actual API call when available
      // const response = await fetch("/api/accounting/exchange-expense");
      // if (response.ok) {
      //   const data = await response.json();
      //   setExpenses(data);
      // }
      setExpenses([]);
    } catch (error) {
      console.error("Error fetching exchange expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for API call
    console.log("Exchange expense record:", formData);
    setShowForm(false);
    setFormData({
      seafarerId: '',
      expenseType: 'TICKET',
      description: '',
      amount: '',
      currency: 'USD',
      expenseDate: new Date().toISOString().split('T')[0],
    });
  };

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white backdrop-blur-lg shadow-2xl border-b border-white/20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                Crew Exchange Expenses
              </h1>
              <p className="text-lg text-gray-700 mt-2 font-medium">Track costs for crew changes and replacements</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/accounting"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                ← Back to Accounting
              </Link>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                + Add Expense
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Summary Card */}
          <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-white p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Total Exchange Expenses</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">
                  USD {totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600 mt-1">All time</p>
              </div>
              <div className="text-5xl">🔄</div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">ℹ️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Crew Exchange Costs</h3>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  Exchange expenses include all costs related to crew changes: flight tickets, visas, medical tests, 
                  accommodation, ground transportation, and agent fees. These costs are typically reimbursed by 
                  principals or included in monthly invoices.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white rounded-lg p-2 text-center">
                    <div className="font-semibold text-purple-700">✈️ Tickets</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <div className="font-semibold text-purple-700">🏨 Hotels</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <div className="font-semibold text-purple-700">🚕 Transport</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <div className="font-semibold text-purple-700">📋 Visas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-gray-900">Exchange Expense Records</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seafarer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(expense.expenseDate).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{expense.seafarerName}</div>
                        <div className="text-xs text-gray-500">{expense.rank}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-4 py-2 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {expense.expenseType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {expense.currency} {expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {expense.createdBy}
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                        No exchange expenses recorded yet. Add expenses related to crew changes and replacements.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Exchange Expense Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6">Add Exchange Expense</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Seafarer ID
                </label>
                <input
                  type="number"
                  required
                  value={formData.seafarerId}
                  onChange={(e) => setFormData({ ...formData, seafarerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter seafarer ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Expense Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Expense Type
                </label>
                <select
                  required
                  value={formData.expenseType}
                  onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="TICKET">Flight Ticket</option>
                  <option value="HOTEL">Hotel Accommodation</option>
                  <option value="TRANSPORT">Ground Transport</option>
                  <option value="VISA">Visa Fees</option>
                  <option value="MEDICAL">Medical Test</option>
                  <option value="AGENT_FEE">Agent Fee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Description
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Jakarta to Singapore flight"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                    Currency
                  </label>
                  <select
                    required
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="IDR">IDR</option>
                    <option value="SGD">SGD</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Add Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
