"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TreatmentRequest {
  id: number;
  requestType: string;
  description: string;
  requestedDate: string;
  status: string;
  approvedBy?: string;
  seafarer: {
    fullName: string;
  };
  assignment?: {
    rank: string;
    vessel: {
      name: string;
    };
  };
}

export default function TreatmentRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [treatmentRequests, setTreatmentRequests] = useState<TreatmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchTreatmentRequests();
    }
  }, [session]);

  const fetchTreatmentRequests = async () => {
    try {
      const response = await fetch("/api/treatment-requests");
      if (response.ok) {
        const data = await response.json();
        setTreatmentRequests(data);
      }
    } catch (error) {
      console.error("Error fetching treatment requests:", error);
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
              Medical Treatment Requests (CR-16)
            </h1>
            <button
              onClick={() => router.push("/crewing/treatment-requests/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Add Treatment Request
            </button>
          </div>
          <p className="text-sm text-gray-800">Form permintaan medical treatment yang harus di-approve Crewing Manager</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {treatmentRequests.map((request) => (
                <li key={request.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {request.seafarer.fullName}
                          </p>
                          {request.assignment && (
                            <p className="ml-2 text-sm text-gray-500">
                              - {request.assignment.rank} on {request.assignment.vessel.name}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Type: {request.requestType}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              Requested: {new Date(request.requestedDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className={`inline-flex items-center px-4.5 py-0.5 rounded-full text-xs font-medium ${
                              request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                            {request.approvedBy && (
                              <span className="ml-2">Approved by: {request.approvedBy}</span>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-700">
                          {request.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => router.push(`/crewing/treatment-requests/${request.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Review
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