"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface Application {
  id: string;
  position: string;
  applicationDate: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  remarks: string | null;
  crew: {
    id: string;
    fullName: string;
    nationality: string | null;
    rank: string;
    phone: string | null;
    email: string | null;
  };
  principal: {
    id: string;
    name: string;
  } | null;
}

function ApplicationsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'ALL');

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchApplications();
  }, [session, status, selectedStatus, router]);

  const fetchApplications = async () => {
    try {
      const url = selectedStatus === 'ALL' 
        ? '/api/applications'
        : `/api/applications?status=${selectedStatus}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.data || data);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchApplications();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statusOptions = [
    { value: 'ALL', label: 'Semua Status', color: 'gray', icon: '📋' },
    { value: 'RECEIVED', label: 'Baru Masuk', color: 'blue', icon: '📝' },
    { value: 'REVIEWING', label: 'Di-Review', color: 'yellow', icon: '🔍' },
    { value: 'INTERVIEW', label: 'Interview', color: 'purple', icon: '🎤' },
    { value: 'PASSED', label: 'Lulus', color: 'green', icon: '✅' },
    { value: 'OFFERED', label: 'Ditawarkan', color: 'indigo', icon: '💼' },
    { value: 'ACCEPTED', label: 'Diterima', color: 'teal', icon: '🤝' },
    { value: 'REJECTED', label: 'Ditolak', color: 'red', icon: '❌' },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      RECEIVED: { color: 'bg-blue-100 text-blue-800', text: 'Baru Masuk' },
      REVIEWING: { color: 'bg-yellow-100 text-yellow-800', text: 'Di-Review' },
      INTERVIEW: { color: 'bg-purple-100 text-purple-800', text: 'Interview' },
      PASSED: { color: 'bg-green-100 text-green-800', text: 'Lulus' },
      OFFERED: { color: 'bg-indigo-100 text-indigo-800', text: 'Ditawarkan' },
      ACCEPTED: { color: 'bg-teal-100 text-teal-800', text: 'Diterima' },
      REJECTED: { color: 'bg-red-100 text-red-800', text: 'Ditolak' },
      CANCELLED: { color: 'bg-gray-100 text-gray-800', text: 'Dibatalkan' },
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Applications
              </h1>
              <p className="text-gray-600">
                Manage seafarer employment applications (Form CR-02)
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/crewing/workflow"
                className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                ← Workflow
              </Link>
              <Link
                href="/crewing/applications/new"
                className="px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
              >
                + New Application
              </Link>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {statusOptions.map((option) => {
              const isActive = selectedStatus === option.value;
              const baseClasses = "px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-200";
              const activeClasses = isActive 
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-500";
              
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={`${baseClasses} ${activeClasses}`}
                >
                  {option.icon} {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Tidak ada aplikasi
            </h3>
            <p className="text-gray-600 mb-6">
              Belum ada aplikasi dengan status {selectedStatus}
            </p>
            <Link
              href="/crewing/applications/new"
              className="inline-block px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              + Tambah Aplikasi Baru
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Crew Info */}
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg mr-4">
                        {application.crew.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {application.crew.fullName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {application.crew.nationality || 'N/A'} • Current: {application.crew.rank}
                        </p>
                      </div>
                    </div>

                    {/* Application Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Applied Position</div>
                        <div className="font-semibold text-gray-900">{application.position}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Principal</div>
                        <div className="font-semibold text-gray-900">
                          {application.principal?.name || 'Any'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Application Date</div>
                        <div className="font-semibold text-gray-900">
                          {new Date(application.applicationDate).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        {getStatusBadge(application.status)}
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex gap-4 text-sm text-gray-600">
                      {application.crew.phone && (
                        <div className="flex items-center gap-1">
                          📱 {application.crew.phone}
                        </div>
                      )}
                      {application.crew.email && (
                        <div className="flex items-center gap-1">
                          ✉️ {application.crew.email}
                        </div>
                      )}
                    </div>

                    {/* Remarks */}
                    {application.remarks && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Remarks</div>
                        <div className="text-sm text-gray-700">{application.remarks}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col gap-2">
                    <Link
                      href={`/crewing/applications/${application.id}`}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all duration-200 text-center"
                    >
                      View Details
                    </Link>
                    
                    <a
                      href={`/api/forms/cr-02/${application.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600 transition-all duration-200 text-center"
                    >
                      📄 Download CR-02
                    </a>
                    
                    {application.status === 'RECEIVED' && (
                      <button
                        onClick={() => handleStatusChange(application.id, 'REVIEWING')}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-all duration-200"
                      >
                        Start Review
                      </button>
                    )}
                    
                    {application.status === 'REVIEWING' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(application.id, 'INTERVIEW')}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600 transition-all duration-200"
                        >
                          Schedule Interview
                        </button>
                        <button
                          onClick={() => handleStatusChange(application.id, 'REJECTED')}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all duration-200"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {application.status === 'INTERVIEW' && (
                      <Link
                        href={`/crewing/interviews/new?applicationId=${application.id}`}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-all duration-200 text-center"
                      >
                        Conduct Interview
                      </Link>
                    )}

                    {application.status === 'PASSED' && (
                      <button
                        onClick={() => handleStatusChange(application.id, 'OFFERED')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all duration-200"
                      >
                        Offer Position
                      </button>
                    )}

                    {application.status === 'OFFERED' && (
                      <button
                        onClick={() => handleStatusChange(application.id, 'ACCEPTED')}
                        className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition-all duration-200"
                      >
                        Mark Accepted
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Applications() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ApplicationsContent />
    </Suspense>
  );
}
