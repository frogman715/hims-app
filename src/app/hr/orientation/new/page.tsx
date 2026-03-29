"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

const ORIENTATION_ENTRY_STEPS = [
  {
    title: "1. Assign the employee",
    detail: "Use the correct employee profile so orientation history stays attached to the right office record.",
  },
  {
    title: "2. Set the session owner",
    detail: "Record the trainer and session date that will be used for accountability and follow-up.",
  },
  {
    title: "3. Document onboarding scope",
    detail: "Capture the exact onboarding topics and completion state so HR and line management can verify the handover.",
  },
] as const;

export default function NewOrientationPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    orientationDate: new Date().toISOString().split("T")[0],
    topics: "",
    trainer: "",
    completed: false,
    notes: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/orientations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        router.push("/hr/orientation");
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Orientation session could not be created.");
      }
    } catch (error) {
      console.error("Error creating orientation:", error);
      setErrorMessage("An error occurred while scheduling the orientation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Orientation Entry"
        title="Schedule new orientation"
        subtitle="Register onboarding orientation sessions for office staff and keep induction records aligned with HR operating procedures."
        helperLinks={[
          { href: "/hr/orientation", label: "Orientation" },
          { href: "/hr/employees", label: "Employee Register" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Session Type", value: "Onboarding", detail: "Use this page for employee onboarding and induction records." },
          { label: "Required Inputs", value: "Employee + Date + Trainer", detail: "These are the minimum session controls for accountability." },
          { label: "Completion Rule", value: "Evidence First", detail: "Mark completed only after the session is actually delivered." },
        ]}
        actions={(
          <Link href="/hr/orientation">
            <Button variant="secondary" size="sm">Back to Orientation</Button>
          </Link>
        )}
      />

      <section className="surface-card space-y-8 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          {ORIENTATION_ENTRY_STEPS.map((step) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-5">
            <h2 className="text-base font-semibold text-slate-900">Orientation planning note</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Use this form to schedule onboarding, assign the trainer, and document the core topics
              that must be covered before the employee starts full duties.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Session Checklist</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>Assign the correct employee and date.</li>
              <li>Record trainer accountability.</li>
              <li>Document mandatory onboarding topics.</li>
              <li>Mark completion only after orientation is delivered.</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            <Select
              id="employeeId"
              name="employeeId"
              label="Employee"
              required
              value={formData.employeeId}
              onChange={handleInputChange}
              disabled={loading}
              options={employees.map((employee) => ({
                value: employee.id,
                label: `${employee.fullName} - ${employee.position} (${employee.department})`,
              }))}
              placeholder={loading ? "Loading employees..." : "Select an employee"}
              helperText="Choose the employee who must complete the orientation session."
            />

            <Input
              id="orientationDate"
              name="orientationDate"
              type="date"
              label="Orientation Date"
              required
              value={formData.orientationDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              id="trainer"
              name="trainer"
              label="Trainer / Instructor"
              required
              value={formData.trainer}
              onChange={handleInputChange}
              placeholder="Enter the responsible trainer or coordinator"
            />

            <label className="flex rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                id="completed"
                name="completed"
                type="checkbox"
                checked={formData.completed}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600"
              />
              <div className="ml-3">
                <p className="text-sm font-semibold text-slate-900">Mark as completed</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Enable this only if the session has already been conducted and the record is being entered after completion.
                </p>
              </div>
            </label>
          </div>

          <Textarea
            id="topics"
            name="topics"
            label="Topics Covered"
            required
            rows={4}
            value={formData.topics}
            onChange={handleInputChange}
            placeholder="List the orientation topics, policies, safety briefings, and department induction items."
            helperText="Keep the topic list specific so HR and line management can review the onboarding scope."
          />

          <Textarea
            id="notes"
            name="notes"
            label="Additional Notes"
            rows={4}
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Add any scheduling notes, attendance remarks, or follow-up actions."
          />

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
            <Link href="/hr/orientation">
              <Button type="button" variant="secondary">Close Form</Button>
            </Link>
            <Button type="submit" isLoading={submitting}>
              {submitting ? "Scheduling Session..." : "Schedule orientation"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
