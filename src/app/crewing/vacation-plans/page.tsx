"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface VacationPlan {
  id: number;
  plannedStart: string;
  plannedEnd: string;
  reason: string;
  status: string;
  seafarer: {
    fullName: string;
  };
  assignment?: {
    rank: string;
    vessel: {
      name: string;
    };
  };
  replacement?: {
    fullName: string;
  };
}

export default function VacationPlansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vacationPlans, setVacationPlans] = useState<VacationPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchVacationPlans();
    }
  }, [session]);

  const fetchVacationPlans = async () => {
    try {
      const response = await fetch("/api/vacation-plans");
      if (response.ok) {
        const data = await response.json();
        setVacationPlans(data);
      }
    } catch (error) {
      console.error("Error fetching vacation plans:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
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
            <h1 className="text-3xl font-bold text-gray-900">
              Crew Vacation Plans (CR-07)
            </h1>
            <button
              onClick={() => router.push("/crewing/vacation-plans/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Add Vacation Plan
            </button>
          </div>
          <p className="text-sm text-gray-600">Rencana cuti crew untuk rotasi dan replacement planning</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {vacationPlans.map((plan) => (
                <li key={plan.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {plan.seafarer.fullName}
                          </p>
                          {plan.assignment && (
                            <p className="ml-2 text-sm text-gray-500">
                              - {plan.assignment.rank} on {plan.assignment.vessel.name}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Vacation: {new Date(plan.plannedStart).toLocaleDateString()} - {new Date(plan.plannedEnd).toLocaleDateString()}
                            </p>
                            {plan.reason && (
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                Reason: {plan.reason}
                              </p>
                            )}
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              plan.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              plan.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {plan.status}
                            </span>
                            {plan.replacement && (
                              <span className="ml-2">Replacement: {plan.replacement.fullName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => router.push(`/crewing/vacation-plans/${plan.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}