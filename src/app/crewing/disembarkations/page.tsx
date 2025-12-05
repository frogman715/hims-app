"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Disembarkation {
  id: number;
  reason: string;
  requestedDate: string;
  plannedDate?: string;
  actualDate?: string;
  status: string;
  remarks?: string;
  seafarer: {
    fullName: string;
  };
  assignment: {
    rank: string;
    vessel: {
      name: string;
    };
  };
}

export default function DisembarkationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [disembarkations, setDisembarkations] = useState<Disembarkation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchDisembarkations();
    }
  }, [session]);

  const fetchDisembarkations = async () => {
    try {
      const response = await fetch("/api/disembarkations");
      if (response.ok) {
        const data = await response.json();
        setDisembarkations(data);
      }
    } catch (error) {
      console.error("Error fetching disembarkations:", error);
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
              Disembarkation Applications (CR-13)
            </h1>
            <button
              onClick={() => router.push("/crewing/disembarkations/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Add Disembarkation
            </button>
          </div>
          <p className="text-sm text-gray-800">Pengajuan sign-off dengan alasan kontrak selesai, medical, emergency</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {disembarkations.map((disembarkation) => (
                <li key={disembarkation.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {disembarkation.seafarer.fullName}
                          </p>
                          <p className="ml-2 text-sm text-gray-500">
                            - {disembarkation.assignment.rank} on {disembarkation.assignment.vessel.name}
                          </p>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Reason: {disembarkation.reason}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              Requested: {new Date(disembarkation.requestedDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className={`inline-flex items-center px-4.5 py-0.5 rounded-full text-xs font-medium ${
                              disembarkation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              disembarkation.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {disembarkation.status}
                            </span>
                            {disembarkation.plannedDate && (
                              <span className="ml-2">
                                Planned: {new Date(disembarkation.plannedDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {disembarkation.remarks && (
                          <p className="mt-2 text-sm text-gray-700">
                            Remarks: {disembarkation.remarks}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => router.push(`/crewing/disembarkations/${disembarkation.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Process
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