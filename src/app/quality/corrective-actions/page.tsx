'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface CorrectiveAction {
  id: number;
  findingId: number | null;
  description: string;
  rootCause: string | null;
  action: string;
  pic: string;
  dueDate: string;
  status: string;
  auditFinding: {
    audit: {
      id: number;
      title: string;
      type: string;
    };
  } | null;
}

export default function CorrectiveActions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    findingId: '',
    description: '',
    rootCause: '',
    action: '',
    pic: '',
    dueDate: '',
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    } else {
      fetchActions();
    }
  }, [session, status, router]);

  const fetchActions = async () => {
    try {
      const response = await fetch("/api/quality/corrective-actions");
      if (response.ok) {
        const data = await response.json();
        setActions(data);
      }
    } catch (error) {
      console.error("Error fetching corrective actions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/quality/corrective-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          findingId: formData.findingId ? parseInt(formData.findingId) : null,
          description: formData.description,
          rootCause: formData.rootCause,
          action: formData.action,
          pic: formData.pic,
          dueDate: formData.dueDate,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ findingId: '', description: '', rootCause: '', action: '', pic: '', dueDate: '' });
        fetchActions();
      }
    } catch (error) {
      console.error("Error creating corrective action:", error);
    }
  };

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white backdrop-blur-lg shadow-2xl border-b border-white/20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Corrective Actions
              </h1>
              <p className="text-lg text-gray-700 mt-2 font-medium">Track and resolve non-conformities</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/quality"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                ← Back to Quality
              </Link>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                + Add Action
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Corrective Actions Table */}
          <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-gray-900">Corrective Actions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PIC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {actions.map((action) => (
                    <tr key={action.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{action.description}</div>
                        {action.rootCause && (
                          <div className="text-sm text-gray-500 mt-1">
                            Root Cause: {action.rootCause}
                          </div>
                        )}
                        <div className="text-sm text-gray-800 mt-1">
                          Action: {action.action}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {action.pic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(action.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                          action.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : action.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : action.status === 'OVERDUE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {action.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {action.auditFinding ? action.auditFinding.audit.title : 'General'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Corrective Action Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6">Add Corrective Action</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Audit Finding ID (Optional)
                </label>
                <input
                  type="number"
                  value={formData.findingId}
                  onChange={(e) => setFormData({ ...formData, findingId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Leave empty for general corrective action"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Describe the non-conformity or issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Root Cause
                </label>
                <textarea
                  value={formData.rootCause}
                  onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Identify the root cause of the issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Corrective Action
                </label>
                <textarea
                  required
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Describe the corrective action to be taken"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Person In Charge (PIC)
                </label>
                <input
                  type="text"
                  required
                  value={formData.pic}
                  onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Name of person responsible"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Add Action
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