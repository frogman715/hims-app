'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HR() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Human Resources</h1>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              Back to Dashboard
            </button>
          </div>
          <p className="text-sm text-gray-800">Employee management and office administration</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Employee Management */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">👥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-900 truncate">
                        Employee Management
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Manage staff profiles and information
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 px-5 py-3">
                <div className="text-sm">
                  <button
                    onClick={() => router.push("/hr/employees")}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    View Employees →
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">📅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-900 truncate">
                        Attendance Tracking
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Monitor employee attendance and time
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 px-5 py-3">
                <div className="text-sm">
                  <button
                    onClick={() => router.push("/hr/attendance")}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Track Attendance →
                  </button>
                </div>
              </div>
            </div>

            {/* Leave Management */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">🏖️</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-900 truncate">
                        Leave Management
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Handle leave requests and approvals
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 px-5 py-3">
                <div className="text-sm">
                  <button
                    onClick={() => router.push("/hr/leaves")}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Manage Leaves →
                  </button>
                </div>
              </div>
            </div>

            {/* Disciplinary Actions */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">⚖️</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-900 truncate">
                        Disciplinary Actions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Record and track disciplinary measures
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 px-5 py-3">
                <div className="text-sm">
                  <button
                    onClick={() => router.push("/hr/disciplinary")}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    View Records →
                  </button>
                </div>
              </div>
            </div>

            {/* Recruitment */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">🎯</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-900 truncate">
                        Recruitment (AD-06)
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Interview and hire new employees
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 px-5 py-3">
                <div className="text-sm">
                  <button
                    onClick={() => router.push("/hr/recruitment")}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Manage Recruitment →
                  </button>
                </div>
              </div>
            </div>

            {/* Orientation */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">🎓</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-900 truncate">
                        Orientation (AD-14)
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        New employee orientation program
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 px-5 py-3">
                <div className="text-sm">
                  <button
                    onClick={() => router.push("/hr/orientation")}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Schedule Orientation →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}