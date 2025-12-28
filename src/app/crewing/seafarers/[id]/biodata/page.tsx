"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import PhotoUpload from "../PhotoUpload";

interface Seafarer {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  nationality: string | null;
  createdAt: string;
  updatedAt: string;
  placeOfBirth: string | null;
  rank: string | null;
  phone: string | null;
  email: string | null;
  photoUrl?: string | null;
  heightCm: number | null;
  weightKg: number | null;
  coverallSize: string | null;
  shoeSize: string | null;
  waistSize: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  assignments: Array<{
    id: string;
    rank: string;
    signOnDate: string;
    signOffPlan: string;
    signOffDate?: string;
    status: string;
    vessel: {
      id: string;
      name: string;
    };
    principal: {
      id: string;
      name: string;
    };
  }>;
  applications: Array<{
    id: string;
    position: string | null;
    applicationDate: string;
    status: string;
  }>;
  documents: Array<{
    id: string;
    docType: string;
    docNumber: string;
    issueDate: string;
    expiryDate: string;
    remarks?: string;
    fileUrl?: string;
  }>;
}

function calculateAge(isoDate: string | null): number | null {
  if (!isoDate) {
    return null;
  }

  const birthDate = new Date(isoDate);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export default function SeafarerBiodataPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const seafarerId = params.id as string;

  const [seafarer, setSeafarer] = useState<Seafarer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!isActionMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!actionMenuRef.current) {
        return;
      }
      if (!actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsActionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActionMenuOpen]);

  const fetchSeafarerBiodata = useCallback(async () => {
    try {
      const response = await fetch(`/api/seafarers/${seafarerId}/biodata`);
      if (response.ok) {
        const data = await response.json();
        setSeafarer(data);
      } else {
        console.error("Failed to fetch seafarer biodata");
      }
    } catch (error) {
      console.error("Error fetching seafarer biodata:", error);
    } finally {
      setLoading(false);
    }
  }, [seafarerId]);

  useEffect(() => {
    if (session && seafarerId) {
      fetchSeafarerBiodata();
    }
  }, [session, seafarerId, fetchSeafarerBiodata]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'onboard': return 'bg-green-100 text-green-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading seafarer biodata...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!seafarer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link
              href="/crewing/seafarers"
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              ← Back to Seafarers
            </Link>
          </div>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.98-5.5-2.5M12 4.5C7.305 4.5 3.5 8.305 3.5 13S7.305 21.5 12 21.5 20.5 17.695 20.5 13 16.695 4.5 12 4.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Seafarer not found</h3>
            <p className="mt-1 text-sm text-gray-700">The requested seafarer could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/crewing/seafarers"
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl inline-flex items-center"
          >
            ← Back to Seafarers
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Left side - Photo and name */}
            <div className="flex items-start space-x-6 flex-1">
              {/* Photo Upload Component */}
              <div className="flex-shrink-0">
                <PhotoUpload
                  seafarerId={seafarer.id}
                  currentPhotoUrl={seafarer.photoUrl || undefined}
                  onPhotoUpdated={(photoUrl) => {
                    setSeafarer({ ...seafarer, photoUrl });
                  }}
                />
              </div>

              {/* Name and description */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{seafarer.fullName}</h1>
                <p className="text-gray-800">Complete seafarer biodata and service history</p>
              </div>
            </div>

            {/* Action menu */}
            <div className="relative flex flex-wrap gap-2" ref={actionMenuRef}>
              <button
                type="button"
                onClick={() => setIsActionMenuOpen((previous) => !previous)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-haspopup="menu"
                aria-expanded={isActionMenuOpen}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Kelola Data Kru
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isActionMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                >
                  <Link
                    href={`/crewing/seafarers/${seafarer.id}`}
                    onClick={() => setIsActionMenuOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50"
                    role="menuitem"
                  >
                    <span className="mt-0.5 text-indigo-500">📝</span>
                    <span>Edit biodata & kontak kru</span>
                  </Link>
                  <Link
                    href={`/crewing/seafarers/${seafarer.id}/documents`}
                    onClick={() => setIsActionMenuOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50"
                    role="menuitem"
                  >
                    <span className="mt-0.5 text-indigo-500">📄</span>
                    <span>Manage documents & certificates</span>
                  </Link>
                  <Link
                    href={`/crewing/assignments/new?seafarerId=${seafarer.id}`}
                    onClick={() => setIsActionMenuOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50"
                    role="menuitem"
                  >
                    <span className="mt-0.5 text-indigo-500">🚢</span>
                    <span>Tambah assignment atau penugasan baru</span>
                  </Link>
                  <a
                    href="#assignment-history"
                    onClick={() => setIsActionMenuOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50"
                    role="menuitem"
                  >
                    <span className="mt-0.5 text-indigo-500">📜</span>
                    <span>Lihat riwayat assignment kru</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Full Name</p>
                  <p className="text-lg font-bold text-gray-900">{seafarer.fullName}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎂</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Date of Birth</p>
                  {seafarer.dateOfBirth ? (
                    <>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(seafarer.dateOfBirth).toLocaleDateString()}
                      </p>
                      {(() => {
                        const age = calculateAge(seafarer.dateOfBirth);
                        return age !== null ? (
                          <p className="text-sm text-gray-700">{age} years old</p>
                        ) : null;
                      })()}
                    </>
                  ) : (
                    <p className="text-lg font-bold text-gray-900">Not specified</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🌍</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Nationality</p>
                  <p className="text-lg font-bold text-gray-900">{seafarer.nationality || 'Not specified'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Member Since</p>
                  <p className="text-lg font-bold text-gray-900">{new Date(seafarer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
            Profile & Contact Details
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Place of Birth</p>
              <p className="text-base font-semibold text-gray-900">{seafarer.placeOfBirth || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Rank / Position</p>
              <p className="text-base font-semibold text-gray-900">{seafarer.rank || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Mobile Phone</p>
              <p className="text-base font-semibold text-gray-900">{seafarer.phone || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Email Address</p>
              <p className="text-base font-semibold text-gray-900">{seafarer.email || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Height</p>
              <p className="text-base font-semibold text-gray-900">
                {seafarer.heightCm ? `${seafarer.heightCm} cm` : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Weight</p>
              <p className="text-base font-semibold text-gray-900">
                {seafarer.weightKg ? `${seafarer.weightKg} kg` : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Coverall Size</p>
              <p className="text-base font-semibold text-gray-900">{seafarer.coverallSize || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Safety Shoe Size</p>
              <p className="text-base font-semibold text-gray-900">{seafarer.shoeSize || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Waist Size</p>
              <p className="text-base font-semibold text-gray-900">{seafarer.waistSize || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Emergency Contact</p>
              <p className="text-base font-semibold text-gray-900">{seafarer.emergencyContactName || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Relationship</p>
              <p className="text-base font-semibold text-gray-900">{seafarer.emergencyContactRelation || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Emergency Phone</p>
              <p className="text-base font-semibold text-gray-900">{seafarer.emergencyContactPhone || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Assignment */}
          <div id="assignment-history" className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
              Current Assignment
            </h2>
            {seafarer.assignments.filter(a => a.status === 'ONBOARD' || a.status === 'PLANNED').length > 0 ? (
              <div className="space-y-6">
                {seafarer.assignments
                  .filter(a => a.status === 'ONBOARD' || a.status === 'PLANNED')
                  .slice(0, 1)
                  .map((assignment) => (
                  <div key={assignment.id} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.rank}</h3>
                      <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                        {getStatusText(assignment.status)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Vessel:</span>
                        <span className="text-sm text-gray-900">{assignment.vessel.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Principal:</span>
                        <span className="text-sm text-gray-900">{assignment.principal.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Sign-On:</span>
                        <span className="text-sm text-gray-900">{new Date(assignment.signOnDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Sign-Off Plan:</span>
                        <span className="text-sm text-gray-900">{new Date(assignment.signOffPlan).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.98-5.5-2.5M12 4.5C7.305 4.5 3.5 8.305 3.5 13S7.305 21.5 12 21.5 20.5 17.695 20.5 13 16.695 4.5 12 4.5z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No current assignment</h3>
                <p className="mt-1 text-sm text-gray-700">This seafarer is not currently assigned to any vessel.</p>
              </div>
            )}
          </div>

          {/* Applications History */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
              Applications History
            </h2>
            {seafarer.applications.length > 0 ? (
              <div className="space-y-3">
                {seafarer.applications.slice(0, 5).map((application) => {
                  const appliedFor = application.position ?? "Not specified";
                  const appliedOn = application.applicationDate
                    ? new Date(application.applicationDate).toLocaleDateString()
                    : "Not specified";

                  return (
                    <div key={application.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Applied for: {appliedFor}</p>
                        <p className="text-xs text-gray-700">Applied on: {appliedOn}</p>
                      </div>
                      <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {getStatusText(application.status)}
                      </span>
                    </div>
                  );
                })}
                {seafarer.applications.length > 5 && (
                  <p className="text-sm text-gray-800 text-center pt-2">
                    And {seafarer.applications.length - 5} more applications...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
                <p className="mt-1 text-sm text-gray-700">This seafarer has not submitted any applications yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
            Documents
          </h2>
          {seafarer.documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
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
                  {(() => {
                    const now = new Date();
                    const fourteenMonthsFromNow = new Date(now.getTime());
                    fourteenMonthsFromNow.setMonth(fourteenMonthsFromNow.getMonth() + 14);

                    return seafarer.documents.map((document) => {
                      const expiryDate = document.expiryDate ? new Date(document.expiryDate) : null;
                    const isExpired = expiryDate ? expiryDate < now : false;
                    const isExpiringSoon = expiryDate ? !isExpired && expiryDate <= fourteenMonthsFromNow : false;

                    return (
                      <tr key={document.id} className="hover:bg-gray-100">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {document.docType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {document.docNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(document.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {expiryDate ? expiryDate.toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                            isExpired
                              ? 'bg-red-100 text-red-800'
                              : isExpiringSoon
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Valid'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            {document.fileUrl && (
                              <a
                                href={document.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                title="View document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </a>
                            )}
                            <button
                              onClick={() => {
                                alert('Edit functionality coming soon');
                              }}
                              className="inline-flex items-center px-3 py-2 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition"
                              title="Edit document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {document.fileUrl && (
                              <a
                                href={document.fileUrl}
                                download
                                className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                                title="Download document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </a>
                            )}
                            <button
                              onClick={async () => {
                                if (confirm(`Delete ${document.docType}?`)) {
                                  try {
                                    const response = await fetch(`/api/documents/${document.id}`, {
                                      method: 'DELETE',
                                    });
                                    if (response.ok) {
                                      alert('Document deleted successfully');
                                      // Reload page to reflect changes
                                      window.location.reload();
                                    } else {
                                      alert('Failed to delete document');
                                    }
                                  } catch (error) {
                                    console.error('Error deleting document:', error);
                                    alert('Error deleting document');
                                  }
                                }
                              }}
                              className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                              title="Delete document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
              <p className="mt-1 text-sm text-gray-700">No documents have been uploaded for this seafarer yet.</p>
            </div>
          )}
        </div>

        {/* Assignment History */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
            Assignment History
          </h2>
          {seafarer.assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vessel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sign-On Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sign-Off Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {seafarer.assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignment.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignment.vessel.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(assignment.signOnDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignment.signOffDate
                          ? new Date(assignment.signOffDate).toLocaleDateString()
                          : new Date(assignment.signOffPlan).toLocaleDateString()
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                          {getStatusText(assignment.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.98-5.5-2.5M12 4.5C7.305 4.5 3.5 8.305 3.5 13S7.305 21.5 12 21.5 20.5 17.695 20.5 13 16.695 4.5 12 4.5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assignment history</h3>
              <p className="mt-1 text-sm text-gray-700">This seafarer has not been assigned to any vessels yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}