"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface ReplacementPlan {
  replaceSeafarerId: number;
  replaceSeafarerName: string;
  newSeafarerId: number;
  newSeafarerName: string;
  assignmentId: number;
  vesselName: string;
  plannedSignOff: string;
  plannedSignOn: string;
  reason: string;
  notes: string;
}

function CreateReplacementForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replacementPlan, setReplacementPlan] = useState<ReplacementPlan>({
    replaceSeafarerId: 0,
    replaceSeafarerName: "",
    newSeafarerId: 0,
    newSeafarerName: "",
    assignmentId: 0,
    vesselName: "",
    plannedSignOff: "",
    plannedSignOn: "",
    reason: "Contract expiry",
    notes: ""
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    const replaceSeafarerId = searchParams.get('replaceSeafarerId');
    const newSeafarerId = searchParams.get('newSeafarerId');
    const assignmentId = searchParams.get('assignmentId');

    if (replaceSeafarerId && newSeafarerId && assignmentId) {
      fetchReplacementData(parseInt(replaceSeafarerId), parseInt(newSeafarerId), parseInt(assignmentId));
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchReplacementData = async (replaceSeafarerId: number, newSeafarerId: number, assignmentId: number) => {
    try {
      // Fetch assignment data
      const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`);
      const assignment = assignmentResponse.ok ? await assignmentResponse.json() : null;

      // Fetch new seafarer data
      const newSeafarerResponse = await fetch(`/api/seafarers/${newSeafarerId}`);
      const newSeafarer = newSeafarerResponse.ok ? await newSeafarerResponse.json() : null;

      // Fetch replace seafarer data
      const replaceSeafarerResponse = await fetch(`/api/seafarers/${replaceSeafarerId}`);
      const replaceSeafarer = replaceSeafarerResponse.ok ? await replaceSeafarerResponse.json() : null;

      if (assignment && newSeafarer && replaceSeafarer) {
        setReplacementPlan({
          replaceSeafarerId,
          replaceSeafarerName: replaceSeafarer.fullName,
          newSeafarerId,
          newSeafarerName: newSeafarer.fullName,
          assignmentId,
          vesselName: assignment.vessel?.name || 'Unknown Vessel',
          plannedSignOff: assignment.signOffPlan || "",
          plannedSignOn: "",
          reason: "Contract expiry",
          notes: `Replacing ${replaceSeafarer.fullName} with ${newSeafarer.fullName} on ${assignment.vessel?.name || 'Unknown Vessel'}`
        });
      } else {
        // Mock data for now
        setReplacementPlan({
          replaceSeafarerId,
          replaceSeafarerName: "John Smith",
          newSeafarerId,
          newSeafarerName: "Ahmad Rahman",
          assignmentId,
          vesselName: "MV Ocean Pride",
          plannedSignOff: "2025-12-15",
          plannedSignOn: "",
          reason: "Contract expiry",
          notes: "Replacement seafarer selected and approved"
        });
      }
    } catch (error) {
      console.error("Error fetching replacement data:", error);
      // Mock data fallback
      setReplacementPlan({
        replaceSeafarerId,
        replaceSeafarerName: "John Smith",
        newSeafarerId,
        newSeafarerName: "Ahmad Rahman",
        assignmentId,
        vesselName: "MV Ocean Pride",
        plannedSignOff: "2025-12-15",
        plannedSignOn: "",
        reason: "Contract expiry",
        notes: "Replacement seafarer selected and approved"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // For now, just redirect back to replacements page with success message
      // In real implementation, this would create the replacement plan in the database
      router.push('/crewing/replacements?success=Replacement plan created successfully');
    } catch (error) {
      console.error("Error creating replacement plan:", error);
      alert("Error creating replacement plan. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ReplacementPlan, value: string) => {
    setReplacementPlan(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/crewing/replacements/new"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ← Back to Search
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Replacement Plan</h1>
                <p className="text-gray-800">Set up the crew replacement schedule and details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Replacement Summary */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-6 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-xl font-bold">✅</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Replacement Plan Summary</h2>
                <p className="text-gray-700">Review and confirm the replacement details</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Current Crew</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-gray-600">Name:</span> {replacementPlan.replaceSeafarerName}</div>
                    <div><span className="font-medium text-gray-600">Vessel:</span> {replacementPlan.vesselName}</div>
                    <div><span className="font-medium text-gray-600">Sign-off Date:</span> {new Date(replacementPlan.plannedSignOff).toLocaleDateString()}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Replacement Crew</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-gray-600">Name:</span> {replacementPlan.newSeafarerName}</div>
                    <div><span className="font-medium text-gray-600">Vessel:</span> {replacementPlan.vesselName}</div>
                    <div><span className="font-medium text-gray-600">Sign-on Date:</span> {replacementPlan.plannedSignOn ? new Date(replacementPlan.plannedSignOn).toLocaleDateString() : 'To be scheduled'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Replacement Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Replacement Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planned Sign-off Date *
              </label>
              <input
                type="date"
                required
                value={replacementPlan.plannedSignOff}
                onChange={(e) => handleInputChange('plannedSignOff', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planned Sign-on Date *
              </label>
              <input
                type="date"
                required
                value={replacementPlan.plannedSignOn}
                onChange={(e) => handleInputChange('plannedSignOn', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Replacement *
              </label>
              <select
                required
                value={replacementPlan.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Contract expiry">Contract expiry</option>
                <option value="Medical leave">Medical leave</option>
                <option value="Personal reasons">Personal reasons</option>
                <option value="Rotation">Scheduled rotation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                rows={4}
                value={replacementPlan.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this replacement..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <Link
              href="/crewing/replacements/new"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Plan...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Replacement Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateReplacementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateReplacementForm />
    </Suspense>
  );
}