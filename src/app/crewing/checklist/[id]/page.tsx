"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ChecklistItem {
  id: number;
  seafarerId?: number;
  month: string;
  year: number;
  seafarerName: string;
  vessel: string;
  rank: string;
  signOnDate?: string;
  signOffDate?: string;
  status: 'ON' | 'OFF' | 'CONTRACT_EXPIRING';
  documentsComplete: boolean;
  medicalCheck: boolean;
  trainingComplete: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  replacements?: CrewReplacement[];
  externalCompliance?: ExternalCompliance[];
}

interface ExternalCompliance {
  id: number;
  systemType: 'KOSMA_CERTIFICATE' | 'DEPHUB_CERTIFICATE' | 'SCHENGEN_VISA_NL';
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
  expiryDate?: string;
  verificationUrl?: string;
}

interface CrewReplacement {
  id: number;
  candidateType: 'NEW_APPLICANT' | 'EX_CREW';
  seafarer?: {
    id: number;
    fullName: string;
    nationality: string;
  };
  application?: {
    seafarer: {
      id: number;
      fullName: string;
      nationality: string;
    };
  };
  replacementDate: string;
  reason: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  prepareJoining?: PrepareJoining;
}

interface PrepareJoining {
  id: number;
  vesselType: string;
  visaRequired: boolean;
  visaStatus?: string;
  flagCertStatus?: string;
  medicalStatus?: string;
  cocStatus?: string;
  copStatus?: string;
  bstStatus?: string;
  gocStatus?: string;
  koreaLicense: boolean;
  koreaLicStatus?: string;
  kmlCertificate: boolean;
  kmlStatus?: string;
  ticketReady: boolean;
  overallStatus: string;
}

export default function ChecklistDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [checklistItem, setChecklistItem] = useState<ChecklistItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const fetchChecklistItem = useCallback(async () => {
    try {
      // First try to get from checklist API
      const checklistResponse = await fetch(`/api/checklist?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
      if (checklistResponse.ok) {
        const checklistData = await checklistResponse.json();
        const item = checklistData.find((item: ChecklistItem) => item.id === parseInt(params.id as string));
        if (item) {
          // Get replacement data for this assignment
          const replacementResponse = await fetch(`/api/crew-replacements?assignmentId=${item.id}`);
          if (replacementResponse.ok) {
            const replacements = await replacementResponse.json();
            item.replacements = replacements;
          }
          setChecklistItem(item);
          setLoading(false);
          return;
        }
      }

      // Fallback: get from assignments API
      const assignmentResponse = await fetch(`/api/assignments`);
      if (!assignmentResponse.ok) throw new Error('Failed to fetch assignment');

      const assignments = await assignmentResponse.json();
      const assignment = assignments.find((a: { id: number }) => a.id === parseInt(params.id as string));

      if (assignment) {
        const item: ChecklistItem = {
          id: assignment.id,
          seafarerId: assignment.seafarerId,
          month: new Date().toLocaleString('default', { month: 'long' }),
          year: new Date().getFullYear(),
          seafarerName: assignment.seafarer?.fullName || 'Unknown',
          vessel: assignment.vessel?.name || 'Unknown',
          rank: assignment.rank,
          signOnDate: assignment.signOnDate ? new Date(assignment.signOnDate).toISOString().split('T')[0] : undefined,
          signOffDate: assignment.signOffDate ? new Date(assignment.signOffDate).toISOString().split('T')[0] :
                      assignment.signOffPlan ? new Date(assignment.signOffPlan).toISOString().split('T')[0] : undefined,
          status: assignment.status === 'ONBOARD' ? 'ON' : 'OFF',
          documentsComplete: Math.random() > 0.3, // Mock
          medicalCheck: Math.random() > 0.2, // Mock
          trainingComplete: Math.random() > 0.4, // Mock
          createdAt: assignment.createdAt || new Date().toISOString(),
          updatedAt: assignment.updatedAt || new Date().toISOString(),
          replacements: []
        };

        // Get replacement data for this assignment
        const replacementResponse = await fetch(`/api/crew-replacements?assignmentId=${item.id}`);
        if (replacementResponse.ok) {
          const replacements = await replacementResponse.json();
          item.replacements = replacements;
        }

        // Get external compliance data for this seafarer
        if (item.seafarerId) {
          const complianceResponse = await fetch(`/api/external-compliance?crewId=${item.seafarerId}`);
          if (complianceResponse.ok) {
            const complianceData = await complianceResponse.json();
            item.externalCompliance = complianceData;
          }
        }

        setChecklistItem(item);
      }
    } catch (error) {
      console.error("Error fetching checklist item:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (session && params.id) {
      fetchChecklistItem();
    }
  }, [session, params.id, fetchChecklistItem]);

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  if (!checklistItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Checklist item not found</h3>
            <p className="mt-1 text-sm text-gray-700">The checklist entry you&apos;re looking for doesn&apos;t exist.</p>
            <div className="mt-6">
              <Link
                href="/crewing/checklist"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-md text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Checklist
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/crewing/checklist"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                ← Back to Checklist
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Checklist Entry Details</h1>
                <p className="text-gray-800">ON/OFF signers compliance tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/crewing/seafarers/${checklistItem.seafarerId}/biodata`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg"
              >
                View Seafarer Biodata
              </Link>
              <Link
                href={`/crewing/assignments/${checklistItem.id}`}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Assignment
              </Link>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${
                  checklistItem.status === 'ON' ? 'bg-green-100 text-green-800' :
                  checklistItem.status === 'OFF' ? 'bg-blue-100 text-blue-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {checklistItem.status === 'ON' ? 'Sign-On' :
                   checklistItem.status === 'OFF' ? 'Sign-Off' :
                   'Contract Expiring'}
                </span>
                <span className="text-sm text-gray-800">
                  {checklistItem.month} {checklistItem.year}
                </span>
                <span className="text-sm text-gray-800">
                  Updated: {new Date(checklistItem.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seafarer Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Seafarer Details</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Seafarer Name</label>
                <div className="text-lg font-medium text-gray-900">{checklistItem.seafarerName}</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Rank</label>
                <div className="text-sm text-gray-900">{checklistItem.rank}</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Vessel</label>
                <div className="text-sm text-gray-900">{checklistItem.vessel}</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Sign-On Date</label>
                <div className="text-sm text-gray-900">
                  {checklistItem.signOnDate ? new Date(checklistItem.signOnDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Sign-Off Date</label>
                <div className="text-sm text-gray-900">
                  {checklistItem.signOffDate ? new Date(checklistItem.signOffDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Compliance Status</h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Documents Complete</span>
                <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                  checklistItem.documentsComplete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {checklistItem.documentsComplete ? 'Complete' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Medical Check</span>
                <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                  checklistItem.medicalCheck ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {checklistItem.medicalCheck ? 'Pass' : 'Fail'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Training Complete</span>
                <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                  checklistItem.trainingComplete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {checklistItem.trainingComplete ? 'Complete' : 'Pending'}
                </span>
              </div>

              {/* External Compliance Checks */}
              <div className="pt-4 border-t border-gray-300">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">External Compliance</h4>
                <div className="space-y-2">
                  {checklistItem.externalCompliance && checklistItem.externalCompliance.length > 0 ? (
                    checklistItem.externalCompliance.map((compliance) => (
                      <div key={compliance.id} className="flex items-center justify-between">
                        <span className="text-xs text-gray-700">
                          {compliance.systemType === 'KOSMA_CERTIFICATE' ? 'KOSMA Certificate' :
                           compliance.systemType === 'DEPHUB_CERTIFICATE' ? 'Dephub Certificate' :
                           'Schengen Visa NL'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                            compliance.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                            compliance.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            compliance.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {compliance.status}
                          </span>
                          {compliance.verificationUrl && (
                            <a
                              href={compliance.verificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Verify
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-700 italic">
                      No external compliance records found
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Overall Status</span>
                  <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${
                    checklistItem.documentsComplete && checklistItem.medicalCheck && checklistItem.trainingComplete &&
                    (!checklistItem.externalCompliance || checklistItem.externalCompliance.every(c => c.status === 'VERIFIED'))
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {checklistItem.documentsComplete && checklistItem.medicalCheck && checklistItem.trainingComplete &&
                     (!checklistItem.externalCompliance || checklistItem.externalCompliance.every(c => c.status === 'VERIFIED'))
                      ? 'Fully Compliant'
                      : 'Needs Attention'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Crew Replacements */}
        {checklistItem.replacements && checklistItem.replacements.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Crew Replacement Candidates</h2>
            <div className="space-y-6">
              {checklistItem.replacements.map((replacement) => (
                <div key={replacement.id} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                        replacement.candidateType === 'EX_CREW' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {replacement.candidateType === 'EX_CREW' ? 'Ex-Crew' : 'New Applicant'}
                      </span>
                      <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                        replacement.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        replacement.status === 'PROPOSED' ? 'bg-yellow-100 text-yellow-800' :
                        replacement.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {replacement.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-800">
                      Replacement Date: {new Date(replacement.replacementDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">Candidate Name</label>
                      <div className="text-sm font-medium text-gray-900">
                        {replacement.candidateType === 'EX_CREW'
                          ? replacement.seafarer?.fullName
                          : replacement.application?.seafarer?.fullName
                        }
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">Reason</label>
                      <div className="text-sm text-gray-900">{replacement.reason}</div>
                    </div>
                  </div>

                  {replacement.status === 'APPROVED' && replacement.prepareJoining && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">Prepare Joining Checklist</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className={`p-2 rounded ${replacement.prepareJoining.visaStatus === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          Visa: {replacement.prepareJoining.visaStatus || 'Pending'}
                        </div>
                        <div className={`p-2 rounded ${replacement.prepareJoining.flagCertStatus === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          Flag Cert: {replacement.prepareJoining.flagCertStatus || 'Pending'}
                        </div>
                        <div className={`p-2 rounded ${replacement.prepareJoining.medicalStatus === 'PASSED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          Medical: {replacement.prepareJoining.medicalStatus || 'Pending'}
                        </div>
                        <div className={`p-2 rounded ${replacement.prepareJoining.ticketReady ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          Ticket: {replacement.prepareJoining.ticketReady ? 'Ready' : 'Pending'}
                        </div>
                      </div>
                      <div className="mt-2 text-sm font-medium">
                        Overall Status: <span className={`font-semibold ${
                          replacement.prepareJoining.overallStatus === 'READY_TO_JOIN' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {replacement.prepareJoining.overallStatus === 'READY_TO_JOIN' ? 'Ready to Join' : 'In Preparation'}
                        </span>
                      </div>
                    </div>
                  )}

                  {replacement.notes && (
                    <div className="mt-3 text-sm text-gray-700 bg-gray-100 p-2 rounded">
                      {replacement.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {checklistItem.notes && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
            <div className="text-sm text-gray-900 bg-gray-100 p-4 rounded-lg">
              {checklistItem.notes}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={() => router.push(`/crewing/assignments/${checklistItem.id}`)}
            className="inline-flex items-center px-4 py-2 border border-gray-400 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit Assignment
          </button>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Mark as Complete
          </button>
        </div>
      </div>
    </div>
  );
}