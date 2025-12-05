"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Employee Orientation (AD-14)
              </h1>
              <p className="text-sm text-gray-600">Karyawan baru harus menjalani orientation program</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/hr")}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ← Back to HR
              </button>
              <button
                onClick={() => router.push("/hr/orientation/new")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Schedule Orientation
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {orientations.map((orientation) => (
                <li key={orientation.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {orientation.employee.fullName}
                          </p>
                          <p className="ml-2 text-sm text-gray-500">
                            - {orientation.employee.position || 'N/A'} ({orientation.employee.department || 'N/A'})
                          </p>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Date: {new Date(orientation.orientationDate).toLocaleDateString()}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              Trainer: {orientation.trainer}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              orientation.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {orientation.completed ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          Topics: {orientation.topics}
                        </p>
                        {orientation.notes && (
                          <p className="mt-1 text-sm text-gray-600">
                            Notes: {orientation.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => router.push(`/hr/orientation/${orientation.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
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
        </div>
      </main>
    </div>
  );
}