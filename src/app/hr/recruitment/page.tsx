"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Recruitment {
  id: number;
  candidateName: string;
  position: string;
  appliedDate: string;
  interviewDate?: string;
  interviewer?: string;
  result?: string;
  status: string;
  notes?: string;
}

export default function RecruitmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchRecruitments();
    }
  }, [session]);

  const fetchRecruitments = async () => {
    try {
      const response = await fetch("/api/recruitments");
      if (response.ok) {
        const data = await response.json();
        setRecruitments(data);
      }
    } catch (error) {
      console.error("Error fetching recruitments:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white backdrop-blur-lg shadow-2xl border-b border-white/20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Recruitment Management
              </h1>
              <p className="text-lg text-gray-700 mt-2 font-medium">
                Form interview AD-06 untuk menilai kandidat shore staff
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/hr"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                ← Back to HR
              </Link>
              <Link
                href="/hr/recruitment/new"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                + Add Candidate
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-gray-900">Recruitment Candidates</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {recruitments.map((recruitment) => (
                <li key={recruitment.id} className="hover:bg-gray-100 transition-colors duration-200">
                  <div className="px-6 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-lg font-semibold text-indigo-600 truncate">
                            {recruitment.candidateName}
                          </p>
                          <p className="ml-3 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                            Position: {recruitment.position}
                          </p>
                        </div>
                        <div className="mt-3 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              📅 Applied: {new Date(recruitment.appliedDate).toLocaleDateString()}
                            </p>
                            {recruitment.interviewDate && (
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                🎤 Interview: {new Date(recruitment.interviewDate).toLocaleDateString()}
                              </p>
                            )}
                            {recruitment.interviewer && (
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                👤 Interviewer: {recruitment.interviewer}
                              </p>
                            )}
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold ${
                              recruitment.status === 'HIRED' ? 'bg-green-100 text-green-800' :
                              recruitment.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              recruitment.status === 'INTERVIEWED' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {recruitment.status}
                            </span>
                            {recruitment.result && (
                              <span className="ml-3 text-sm font-medium">
                                Result: <span className={`${
                                  recruitment.result === 'PASSED' || recruitment.result === 'EXCELLENT' || recruitment.result === 'GOOD' ? 'text-green-600' :
                                  recruitment.result === 'FAILED' || recruitment.result === 'POOR' ? 'text-red-600' :
                                  'text-yellow-600'
                                }`}>{recruitment.result}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        {recruitment.notes && (
                          <p className="mt-3 text-sm text-gray-700 bg-gray-100 p-3 rounded-lg">
                            📝 Notes: {recruitment.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <Link
                          href={`/hr/recruitment/${recruitment.id}`}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          Process
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {recruitments.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-700 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates yet</h3>
                <p className="text-gray-500 mb-4">Start by adding your first recruitment candidate.</p>
                <Link
                  href="/hr/recruitment/new"
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl inline-block"
                >
                  Add First Candidate
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}