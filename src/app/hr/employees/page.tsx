'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface Employee {
  id: number;
  fullName: string;
  position: string | null;
  department: string | null;
  hireDate: string | null;
  attendances: Array<{
    id: number;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
  }>;
  leaves: Array<{
    id: number;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  disciplinaryActions: Array<{
    id: number;
    code: string;
    description: string;
    date: string;
  }>;
  orientations: Array<{
    id: number;
    orientationDate: string;
    topics: string;
    completed: boolean;
  }>;
}

export default function Employees() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    position: '',
    department: '',
    hireDate: '',
  });
  const formSteps = [
    {
      label: 'Step 1',
      title: 'Create Staff Identity',
      detail: 'Register the employee name and role used across HR, attendance, and administration records.',
    },
    {
      label: 'Step 2',
      title: 'Assign Department',
      detail: 'Place the employee in the correct internal function so reporting and approvals stay accurate.',
    },
    {
      label: 'Step 3',
      title: 'Start Employment Timeline',
      detail: 'Capture the hire date to anchor attendance, leave, and orientation history.',
    },
  ];

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    } else {
      fetchEmployees();
    }
  }, [session, status, router]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          position: formData.position || null,
          department: formData.department || null,
          hireDate: formData.hireDate || null,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ fullName: '', position: '', department: '', hireDate: '' });
        fetchEmployees();
      }
    } catch (error) {
      console.error("Error creating employee:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading employee register...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const departmentsCovered = new Set(employees.map((employee) => employee.department).filter(Boolean)).size;
  const linkedLeaveRecords = employees.reduce((sum, employee) => sum + employee.leaves.length, 0);
  const orientationRecords = employees.reduce((sum, employee) => sum + employee.orientations.length, 0);

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="HR Workspace"
        title="Employee Management"
        subtitle="Manage shore staff profiles and supporting HR information in one internal register with clearer ownership, department structure, and linked HR history."
        highlights={[
          { label: 'Employee Records', value: employees.length, detail: 'Internal employee profiles currently available in the register.' },
          { label: 'Departments Covered', value: departmentsCovered, detail: 'Distinct office departments represented in the current employee list.' },
          { label: 'Linked Leave Records', value: linkedLeaveRecords, detail: 'Leave entries currently connected to employee records.' },
          { label: 'Orientation Records', value: orientationRecords, detail: 'Onboarding orientation entries linked across employee profiles.' },
        ]}
        helperLinks={[
          { href: '/hr', label: 'HR Workspace' },
          { href: '/hr/attendance', label: 'Attendance Desk' },
          { href: '/hr/leaves', label: 'Leave Desk' },
        ]}
        actions={(
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => router.push('/hr')}>HR Workspace</Button>
            <Button type="button" size="sm" onClick={() => setShowForm(true)}>
              Register Employee
            </Button>
          </>
        )}
      />

      <section className="surface-card p-6">
          {/* Employees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <div key={employee.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-700">
                      <span className="text-white text-lg font-bold">
                        {employee.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{employee.fullName}</h3>
                      <p className="text-sm text-slate-600">{employee.position || 'No position'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Department:</span>
                      <span className="text-sm text-slate-900">{employee.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Hire Date:</span>
                      <span className="text-sm text-slate-900">
                        {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Pending Leaves:</span>
                      <span className="text-sm text-slate-900">{employee.leaves.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Recent Attendance:</span>
                      <span className="text-sm text-slate-900">{employee.attendances.length} records</span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="flex space-x-2">
                      <div className="flex-1 text-center">
                        <div className="text-sm text-slate-600">Orientations</div>
                        <div className="text-lg font-bold text-cyan-700">{employee.orientations.length}</div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-sm text-slate-600">Disciplinary</div>
                        <div className="text-lg font-bold text-red-600">{employee.disciplinaryActions.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
      </section>

      {/* Add Employee Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
            <h3 className="mb-6 text-xl font-semibold text-slate-900">Add New Employee</h3>
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
                id="employee-full-name"
                label="Full Name"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
              />
              <Input
                id="employee-position"
                label="Position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g., Crewing Manager"
              />
              <Select
                id="employee-department"
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                options={[
                  { value: '', label: 'Select Department' },
                  { value: 'Crewing', label: 'Crewing' },
                  { value: 'HR', label: 'HR' },
                  { value: 'Accounting', label: 'Accounting' },
                  { value: 'Quality', label: 'Quality' },
                  { value: 'Operations', label: 'Operations' },
                ]}
              />
              <Input
                id="employee-hire-date"
                label="Hire Date"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1">
                  Register Employee
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
