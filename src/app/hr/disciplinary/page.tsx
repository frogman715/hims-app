'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface DisciplinaryAction {
  id: number;
  employeeId: number;
  employee: {
    fullName: string;
    position: string | null;
    department: string | null;
  };
  code: string;
  description: string;
  correctiveAction: string;
  date: string;
}

export default function Disciplinary() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    code: '',
    description: '',
    correctiveAction: '',
    date: '',
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    } else {
      fetchDisciplinaryActions();
    }
  }, [session, status, router]);

  const fetchDisciplinaryActions = async () => {
    try {
      const response = await fetch("/api/disciplinary");
      if (response.ok) {
        const data = await response.json();
        setDisciplinaryActions(data);
      }
    } catch (error) {
      console.error("Error fetching disciplinary actions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/disciplinary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: parseInt(formData.employeeId),
          code: formData.code,
          description: formData.description,
          correctiveAction: formData.correctiveAction,
          date: formData.date || new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ employeeId: '', code: '', description: '', correctiveAction: '', date: '' });
        fetchDisciplinaryActions();
      }
    } catch (error) {
      console.error("Error creating disciplinary action:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading disciplinary register...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const openCases = disciplinaryActions.length;
  const uniqueEmployees = new Set(
    disciplinaryActions.map((action) => action.employeeId)
  ).size;
  const latestAction = disciplinaryActions[0]?.date
    ? new Date(disciplinaryActions[0].date).toLocaleDateString()
    : "No cases logged";

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="HR Discipline"
        title="Disciplinary Actions"
        subtitle="Record disciplinary cases, preserve corrective-action traceability, and keep HR review aligned with the active employee conduct procedure."
        helperLinks={[{ href: "/hr", label: "HR Workspace" }]}
        highlights={[
          {
            label: "Open Records",
            value: openCases,
            detail: "Active disciplinary entries currently stored in the register.",
          },
          {
            label: "Employees Impacted",
            value: uniqueEmployees,
            detail: "Distinct employees referenced across disciplinary cases.",
          },
          {
            label: "Latest Entry",
            value: latestAction,
            detail: "Most recent disciplinary action date recorded by HR.",
          },
        ]}
        actions={(
          <>
            <Link href="/hr" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
              Back to HR
            </Link>
            <Button type="button" size="sm" onClick={() => setShowForm(true)}>
              Add Disciplinary Action
            </Button>
          </>
        )}
      />

      <section className="surface-card p-6">
          <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-5">
              <h2 className="text-base font-semibold text-slate-900">Case handling note</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Record only confirmed disciplinary cases here. Use the corrective-action field to capture the office response that should be reviewed during follow-up.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Desk Scope</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                <li>Log formal disciplinary actions.</li>
                <li>Track corrective follow-up commitments.</li>
                <li>Keep HR conduct records audit-ready.</li>
              </ul>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-slate-900">Disciplinary Records</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Corrective Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {disciplinaryActions.map((action) => (
                    <tr key={action.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{action.employee.fullName}</div>
                        <div className="text-sm text-slate-500">{action.employee.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-4 py-2 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {action.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-sm text-slate-900">
                          {action.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-sm text-slate-900">
                          {action.correctiveAction}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {new Date(action.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </section>

      {/* Add Disciplinary Action Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
            <h3 className="mb-6 text-xl font-semibold text-slate-900">Add Disciplinary Action</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                id="disciplinary-employee-id"
                label="Employee ID"
                type="number"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="Enter employee ID"
              />
              <Input
                id="disciplinary-code"
                label="Disciplinary Code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., AD-01, AD-02"
              />
              <Textarea
                id="disciplinary-description"
                label="Description"
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the disciplinary incident..."
              />
              <Textarea
                id="disciplinary-corrective-action"
                label="Corrective Action"
                rows={3}
                required
                value={formData.correctiveAction}
                onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })}
                placeholder="Specify the corrective measures to be taken..."
              />
              <Input
                id="disciplinary-date"
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1">
                  Record Action
                </Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
