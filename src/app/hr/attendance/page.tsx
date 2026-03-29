"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { WorkspaceEmptyState } from "@/components/feedback/WorkspaceEmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Attendance {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  notes?: string;
  employee: {
    fullName: string;
    position?: string;
    department?: string;
  };
}

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  "half-day": "Half Day",
  leave: "On Leave",
};

export default function AttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchAttendances();
    }
  }, [session]);

  const fetchAttendances = async () => {
    try {
      const response = await fetch("/api/attendances");
      if (response.ok) {
        const data = await response.json();
        setAttendances(data);
      }
    } catch (error) {
      console.error("Error fetching attendances:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading attendance records...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const presentCount = attendances.filter((item) => item.status === "present").length;
  const lateCount = attendances.filter((item) => item.status === "late").length;
  const leaveCount = attendances.filter((item) => item.status === "leave").length;

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Attendance Workspace"
        title="Attendance management"
        subtitle="Track employee attendance, check-in and check-out times, and current attendance status."
        helperLinks={[
          { href: "/hr", label: "HR Workspace" },
          { href: "/hr/employees", label: "Employee Register" },
        ]}
        highlights={[
          { label: "Attendance Records", value: attendances.length, detail: "Current attendance records loaded in the register." },
          { label: "Present", value: presentCount, detail: "Employees recorded as present in the current data set." },
          { label: "Late", value: lateCount, detail: "Records that still need lateness review or acknowledgement." },
          { label: "On Leave", value: leaveCount, detail: "Attendance entries already tied to approved leave handling." },
        ]}
        actions={(
          <>
            <Link href="/hr" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
              Back to HR
            </Link>
            <Link href="/hr/attendance/new" className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Record Attendance
            </Link>
          </>
        )}
      />

      <section className="surface-card p-6">
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">1. Keep one daily result</p>
            <p className="mt-2 text-sm text-slate-600">Each record should represent one employee on one workday with one final attendance outcome.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">2. Review timing accuracy</p>
            <p className="mt-2 text-sm text-slate-600">Check-in and check-out should match the real attendance trail before editing or deleting.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">3. Use delete carefully</p>
            <p className="mt-2 text-sm text-slate-600">Delete only incorrect duplicates or invalid entries, not normal attendance corrections.</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {attendances.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-slate-900">No attendance records</h3>
              <p className="mt-1 text-sm text-slate-600">Get started by recording the first attendance entry.</p>
              <div className="mt-6">
                <Link href="/hr/attendance/new" className="inline-flex items-center rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800">
                  Register First Attendance
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendances.map((attendance) => (
                    <tr key={attendance.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {attendance.employee.fullName}
                            </div>
                            <div className="text-sm text-slate-600">
                              {attendance.employee.position} • {attendance.employee.department}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {new Date(attendance.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={attendance.status}
                          label={ATTENDANCE_STATUS_LABELS[attendance.status] ?? attendance.status}
                          className="px-4 py-2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => router.push(`/hr/attendance/${attendance.id}`)}
                          className="mr-4 text-cyan-700 hover:text-cyan-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => router.push(`/hr/attendance/${attendance.id}/delete`)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {attendances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10">
                        <WorkspaceEmptyState
                          title="No attendance records in this view"
                          message="Add attendance or adjust the selected review period to continue."
                        />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
