"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";

interface Interview {
  id: string;
  applicationId: string;
  scheduledDate: string | null;
  conductedDate: string | null;
  status: string;
  interviewerName: string | null;
  technicalScore: number | null;
  attitudeScore: number | null;
  englishScore: number | null;
  recommendation: string | null;
  notes: string | null;
  application: {
    id: string;
    position: string;
    crew: {
      id: string;
      fullName: string;
      rank: string;
      nationality: string | null;
      phone: string | null;
    };
    principal: {
      id: string;
      name: string;
    } | null;
  };
}

function InterviewsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedStatus = searchParams.get("status") || "ALL";

  const fetchInterviews = useCallback(async () => {
    if (status === "loading") {
      return;
    }
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    setLoading(true);
    try {
      const url =
        selectedStatus === "ALL"
          ? "/api/interviews"
          : `/api/interviews?status=${selectedStatus}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setInterviews(data.data || data);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  }, [router, selectedStatus, session, status]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statusOptions = [
    { value: "ALL", label: "All Status", icon: "📋", color: "gray" },
    { value: "SCHEDULED", label: "Scheduled", icon: "📅", color: "blue" },
    { value: "CONDUCTED", label: "Conducted", icon: "✅", color: "green" },
    { value: "PASSED", label: "Passed", icon: "🎉", color: "teal" },
    { value: "FAILED", label: "Failed", icon: "❌", color: "red" },
    { value: "CANCELLED", label: "Cancelled", icon: "🚫", color: "gray" },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      SCHEDULED: { color: "bg-blue-100 text-blue-800", text: "Scheduled" },
      CONDUCTED: { color: "bg-green-100 text-green-800", text: "Conducted" },
      PASSED: { color: "bg-teal-100 text-teal-800", text: "Passed" },
      FAILED: { color: "bg-red-100 text-red-800", text: "Failed" },
      CANCELLED: { color: "bg-gray-100 text-gray-800", text: "Cancelled" },
    };

    const item = config[status] || { color: "bg-gray-100 text-gray-800", text: status };
    return (
      <span className={`px-3 py-2 rounded-full text-xs font-semibold ${item.color}`}>
        {item.text}
      </span>
    );
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-700";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Seafarer Interviews
              </h1>
              <p className="text-gray-700">
                Schedule dan hasil interview untuk crew candidates
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/crewing/workflow"
                className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:border-indigo-500 hover:text-indigo-600 transition-all duration-200 shadow-md hover:shadow-md"
              >
                ← Workflow
              </Link>
              <Link
                href="/crewing/interviews/new"
                className="px-6 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
              >
                + Schedule Interview
              </Link>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {statusOptions.map((option) => {
              const isActive = selectedStatus === option.value;
              return (
                <Link
                  key={option.value}
                  href={`/crewing/interviews${option.value === "ALL" ? "" : `?status=${option.value}`}`}
                  className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-500 text-white shadow-lg"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-500"
                  }`}
                >
                  {option.icon} {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Interview List */}
        {interviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
            <div className="text-6xl mb-4">🎤</div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
              Tidak ada interview
            </h3>
            <p className="text-gray-700 mb-6">
              No interview yang dijadwalkan
            </p>
            <Link
              href="/crewing/interviews/new"
              className="inline-block px-6 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              + Schedule Interview
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {interviews.map((interview) => (
              <div
                key={interview.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:border-indigo-300 transition-all duration-200"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b-2 border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                          {interview.application.crew.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-extrabold text-gray-900">
                            {interview.application.crew.fullName}
                          </h3>
                          <p className="text-gray-700">
                            {interview.application.crew.rank} • {interview.application.position}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-700 mb-1">Principal</div>
                          <div className="font-semibold text-gray-900">
                            {interview.application.principal?.name || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-700 mb-1">Scheduled</div>
                          <div className="font-semibold text-gray-900">
                            {interview.scheduledDate
                              ? new Date(interview.scheduledDate).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "TBD"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-700 mb-1">Status</div>
                          {getStatusBadge(interview.status)}
                        </div>
                        <div>
                          <div className="text-sm text-gray-700 mb-1">Interviewer</div>
                          <div className="font-semibold text-gray-900">
                            {interview.interviewerName || "TBD"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/crewing/interviews/${interview.id}`}
                      className="ml-4 px-6 py-3 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition-all duration-200"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Scores (if conducted) */}
                {interview.status === "CONDUCTED" || interview.status === "PASSED" || interview.status === "FAILED" ? (
                  <div className="p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">
                      Interview Scores
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-100 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-800 mb-2">Technical</div>
                        <div className={`text-3xl font-bold ${getScoreColor(interview.technicalScore)}`}>
                          {interview.technicalScore || "-"}/100
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-800 mb-2">Attitude</div>
                        <div className={`text-3xl font-bold ${getScoreColor(interview.attitudeScore)}`}>
                          {interview.attitudeScore || "-"}/100
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-800 mb-2">English</div>
                        <div className={`text-3xl font-bold ${getScoreColor(interview.englishScore)}`}>
                          {interview.englishScore || "-"}/100
                        </div>
                      </div>
                    </div>

                    {interview.recommendation && (
                      <div className="bg-gray-100 rounded-xl p-4">
                        <div className="text-sm font-semibold text-gray-700 mb-2">
                          Recommendation
                        </div>
                        <div className="text-gray-900">{interview.recommendation}</div>
                      </div>
                    )}

                    {interview.notes && (
                      <div className="mt-4 bg-yellow-50 rounded-xl p-4">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Notes</div>
                        <div className="text-gray-700">{interview.notes}</div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <InterviewsContent />
    </Suspense>
  );
}
