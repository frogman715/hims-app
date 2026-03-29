'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { WorkspaceEmptyState } from "@/components/feedback/WorkspaceEmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Leave {
  id: number;
  employeeId: number;
  employee: {
    fullName: string;
    position: string | null;
    department: string | null;
  };
  type: string;
  startDate: string;
  endDate: string;
  status: string;
}

const LEAVE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Declined',
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  Sick: 'Sick Leave',
  Emergency: 'Emergency Leave',
  Bereavement: 'Bereavement Leave',
  Annual: 'Annual Leave',
  Maternity: 'Maternity Leave',
  Paternity: 'Paternity Leave',
};

export default function Leaves() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, approved
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'Sick',
    startDate: '',
    endDate: '',
  });
  const formSteps = [
    {
      label: 'Step 1',
      title: 'Select Employee',
      detail: 'Start with the correct employee record so the leave history stays attached to the right profile.',
    },
    {
      label: 'Step 2',
      title: 'Choose Leave Category',
      detail: 'Use one standard leave type so reporting and approval queues stay consistent.',
    },
    {
      label: 'Step 3',
      title: 'Set Leave Period',
      detail: 'Capture the exact start and end dates to avoid overlap with attendance and payroll review.',
    },
  ];

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    } else {
      fetchLeaves();
    }
  }, [session, status, router]);

  const fetchLeaves = async () => {
    try {
      const response = await fetch("/api/leaves");
      if (response.ok) {
        const data = await response.json();
        setLeaves(data);
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/leaves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: parseInt(formData.employeeId),
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ employeeId: '', type: 'Sick', startDate: '', endDate: '' });
        fetchLeaves();
      }
    } catch (error) {
      console.error("Error creating leave:", error);
    }
  };

  const getFilteredLeaves = () => {
    switch (filter) {
      case 'pending':
        return leaves.filter(leave => leave.status === 'PENDING');
      case 'approved':
        return leaves.filter(leave => leave.status === 'APPROVED');
      default:
        return leaves;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading leave desk...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const filteredLeaves = getFilteredLeaves();
  const pendingCount = leaves.filter((leave) => leave.status === 'PENDING').length;
  const approvedCount = leaves.filter((leave) => leave.status === 'APPROVED').length;
  const rejectedCount = leaves.filter((leave) => leave.status === 'REJECTED').length;

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="HR Workspace"
        title="Leave Management"
        subtitle="Manage employee leave requests, approvals, and review queues from one office-facing workspace with cleaner approval language and better leave visibility."
        highlights={[
          { label: 'Leave Requests', value: leaves.length, detail: 'Leave records currently tracked in the HR register.' },
          { label: 'Pending Review', value: pendingCount, detail: 'Requests still waiting for review or approval.' },
          { label: 'Approved', value: approvedCount, detail: 'Requests already cleared for execution.' },
          { label: 'Declined', value: rejectedCount, detail: 'Requests that were rejected and closed.' },
        ]}
        helperLinks={[
          { href: '/hr', label: 'HR Workspace' },
          { href: '/hr/employees', label: 'Employee Register' },
          { href: '/hr/attendance', label: 'Attendance Desk' },
        ]}
        actions={(
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => router.push('/hr')}>HR Workspace</Button>
            <Button type="button" size="sm" onClick={() => setShowForm(true)}>
              Request Leave
            </Button>
          </>
        )}
      />

      <section className="surface-card p-6">
          {/* Filter Buttons */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Leave Status Filter</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-cyan-700 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  All Leaves ({leaves.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Pending ({leaves.filter(l => l.status === 'PENDING').length})
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Approved ({leaves.filter(l => l.status === 'APPROVED').length})
                </button>
              </div>
            </div>
          </div>

          {/* Leaves Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-slate-900">
                {filter === 'all' ? 'All Leave Requests' : filter === 'pending' ? 'Pending Approvals' : 'Approved Leaves'}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeaves.map((leave) => {
                    const startDate = new Date(leave.startDate);
                    const endDate = new Date(leave.endDate);
                    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                    return (
                      <tr key={leave.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{leave.employee.fullName}</div>
                          <div className="text-sm text-slate-500">{leave.employee.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {leave.employee.department || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {LEAVE_TYPE_LABELS[leave.type] ?? leave.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {startDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {endDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {duration} day{duration > 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge
                            status={leave.status}
                            label={LEAVE_STATUS_LABELS[leave.status] ?? leave.status}
                            className="px-4 py-2"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10">
                        <WorkspaceEmptyState
                          title="No leave records in this view"
                          message="Create a leave request or change the current filter to review other records."
                        />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
      </section>

      {/* Request Leave Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
            <h3 className="mb-6 text-xl font-semibold text-slate-900">Request Leave</h3>
            <div className="mb-6 grid gap-3">
              {formSteps.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                id="leave-employee-id"
                label="Employee ID"
                type="number"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="Enter employee ID"
              />
              <Select
                id="leave-type"
                label="Leave Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'Sick', label: 'Sick Leave' },
                  { value: 'Emergency', label: 'Emergency Leave' },
                  { value: 'Bereavement', label: 'Bereavement Leave' },
                  { value: 'Annual', label: 'Annual Leave' },
                  { value: 'Maternity', label: 'Maternity Leave' },
                  { value: 'Paternity', label: 'Paternity Leave' },
                ]}
              />
              <Input
                id="leave-start-date"
                label="Start Date"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <Input
                id="leave-end-date"
                label="End Date"
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1">
                  Submit Request
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
