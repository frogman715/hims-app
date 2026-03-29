"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

interface Orientation {
  id: number;
  orientationDate: string;
  topics: string;
  trainer: string;
  completed: boolean;
  notes?: string;
  employee: {
    fullName: string;
    position?: string;
    department?: string;
  };
}

export default function OrientationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orientations, setOrientations] = useState<Orientation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchOrientations();
    }
  }, [session]);

  const fetchOrientations = async () => {
    try {
      const response = await fetch("/api/orientations");
      if (response.ok) {
        const data = await response.json();
        setOrientations(data);
      }
    } catch (error) {
      console.error("Error fetching orientations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading orientation register...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const completedCount = orientations.filter((item) => item.completed).length;
  const pendingCount = orientations.filter((item) => !item.completed).length;

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Orientation Workspace"
        title="Employee orientation"
        subtitle="Schedule and monitor employee orientation records according to the active internal onboarding procedure."
        helperLinks={[
          { href: "/hr", label: "HR Workspace" },
          { href: "/hr/employees", label: "Employee Register" },
        ]}
        highlights={[
          { label: "Orientation Records", value: orientations.length, detail: "Current onboarding sessions loaded in the register." },
          { label: "Completed", value: completedCount, detail: "Sessions already delivered and recorded as complete." },
          { label: "Pending", value: pendingCount, detail: "Sessions still waiting to be delivered or confirmed." },
        ]}
        actions={(
          <>
            <button
              onClick={() => router.push("/hr")}
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800"
            >
              Back to HR
            </button>
            <button
              onClick={() => router.push("/hr/orientation/new")}
              className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Schedule Orientation
            </button>
          </>
        )}
      />

      <section className="surface-card p-6">
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">1. Assign the correct employee</p>
              <p className="mt-2 text-sm text-slate-600">Orientation history should always stay attached to the correct employee record.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">2. Review onboarding scope</p>
              <p className="mt-2 text-sm text-slate-600">Trainer, topics, and date should match the real onboarding session delivered by the office.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">3. Close with evidence</p>
              <p className="mt-2 text-sm text-slate-600">Mark completed only after the induction session is delivered and the notes are sufficient.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-gray-200">
              {orientations.map((orientation) => (
                <li key={orientation.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="truncate text-sm font-medium text-cyan-800">
                            {orientation.employee.fullName}
                          </p>
                          <p className="ml-2 text-sm text-slate-500">
                            - {orientation.employee.position || 'N/A'} ({orientation.employee.department || 'N/A'})
                          </p>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-slate-500">
                              Date: {new Date(orientation.orientationDate).toLocaleDateString()}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-slate-500 sm:ml-6 sm:mt-0">
                              Trainer: {orientation.trainer}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                            <span className={`inline-flex items-center px-4.5 py-0.5 rounded-full text-xs font-medium ${
                              orientation.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {orientation.completed ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">
                          Topics: {orientation.topics}
                        </p>
                        {orientation.notes && (
                          <p className="mt-1 text-sm text-slate-600">
                            Notes: {orientation.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => router.push(`/hr/orientation/${orientation.id}`)}
                          className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
      </section>
    </div>
  );
}
