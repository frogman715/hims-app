"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface ChecklistItem {
  id: string;
  crewId: string | null;
  month: string;
  year: number;
  crewName: string | null;
  vessel: string;
  rank: string | null;
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
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
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
      const checklistResponse = await fetch(`/api/checklist?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
      if (checklistResponse.ok) {
        const checklistData = await checklistResponse.json();
        const item = checklistData.find((entry: ChecklistItem) => entry.id === (params.id as string));
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
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm font-medium text-slate-600">Loading checklist entry...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!checklistItem) {
    return (
      <section className="surface-card p-8 text-center">
        <h3 className="mt-2 text-sm font-medium text-slate-900">Checklist item not found</h3>
        <p className="mt-1 text-sm text-slate-600">The checklist entry you&apos;re looking for doesn&apos;t exist.</p>
        <div className="mt-6">
          <Button type="button" variant="secondary" onClick={() => router.push("/crewing/checklist")}>
            Back to checklist
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">Movement Compliance</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Checklist entry detail</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">ON/OFF signer compliance tracking summary.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => router.push("/crewing/checklist")}>
              Back to checklist
            </Button>
            <Link
              href={checklistItem.crewId ? `/crewing/seafarers/${checklistItem.crewId}/biodata` : "/crewing/seafarers"}
              className="action-pill text-sm"
            >
              View seafarer biodata
            </Link>
            <Link href={`/crewing/checklist/${checklistItem.id}/edit`} className="action-pill text-sm">
              Edit entry
            </Link>
          </div>
        </div>
      </section>

      <section className="surface-card border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900 shadow-sm">
          Reference view only. This checklist entry summarizes live movement and compliance data. Final status changes should still be completed in the underlying assignment, document, and Prepare Joining workflows.
      </section>

      <section className="surface-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <StatusBadge
                  status={checklistItem.status === 'ON' ? 'ONBOARD' : checklistItem.status === 'OFF' ? 'OFF_SIGNED' : 'PENDING_REVIEW'}
                  label={checklistItem.status === 'ON' ? 'Sign-On' : checklistItem.status === 'OFF' ? 'Sign-Off' : 'Contract Expiring'}
                  className="px-3 py-2 text-sm"
                />
                <span className="text-sm text-gray-800">
                  {checklistItem.month} {checklistItem.year}
                </span>
                <span className="text-sm text-gray-800">
                  Updated: {new Date(checklistItem.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="surface-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Seafarer Details</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Seafarer Name</label>
                <div className="text-lg font-medium text-gray-900">{checklistItem.crewName || 'Crew not recorded'}</div>
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
          <div className="surface-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Compliance Status</h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Documents Complete</span>
                <StatusBadge
                  status={checklistItem.documentsComplete ? 'APPROVED' : 'PENDING'}
                  label={checklistItem.documentsComplete ? 'Complete' : 'Pending Review'}
                  className="px-4 py-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Medical Check</span>
                <StatusBadge
                  status={checklistItem.medicalCheck ? 'APPROVED' : 'REJECTED'}
                  label={checklistItem.medicalCheck ? 'Passed' : 'Declined'}
                  className="px-4 py-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Training Complete</span>
                <StatusBadge
                  status={checklistItem.trainingComplete ? 'APPROVED' : 'PENDING'}
                  label={checklistItem.trainingComplete ? 'Complete' : 'Pending Review'}
                  className="px-4 py-2"
                />
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
                          <StatusBadge status={compliance.status} className="px-4 py-2" />
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
                  <StatusBadge
                    status={
                      checklistItem.documentsComplete &&
                      checklistItem.medicalCheck &&
                      checklistItem.trainingComplete &&
                      (!checklistItem.externalCompliance || checklistItem.externalCompliance.every(c => c.status === 'VERIFIED'))
                        ? 'APPROVED'
                        : 'PENDING_REVIEW'
                    }
                    label={
                      checklistItem.documentsComplete &&
                      checklistItem.medicalCheck &&
                      checklistItem.trainingComplete &&
                      (!checklistItem.externalCompliance || checklistItem.externalCompliance.every(c => c.status === 'VERIFIED'))
                        ? 'Fully Compliant'
                        : 'Needs Attention'
                    }
                    className="px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Crew Replacements */}
      {checklistItem.replacements && checklistItem.replacements.length > 0 && (
          <section className="surface-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Crew Replacement Candidates</h2>
            <div className="space-y-6">
              {checklistItem.replacements.map((replacement) => (
                <div key={replacement.id} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <StatusBadge
                        status={replacement.candidateType === 'EX_CREW' ? 'UNDER_REVIEW' : 'APPROVED'}
                        label={replacement.candidateType === 'EX_CREW' ? 'Ex-Crew' : 'New Applicant'}
                        className="px-4 py-2"
                      />
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
          </section>
      )}

      {checklistItem.notes && (
          <section className="surface-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
            <div className="text-sm text-gray-900 bg-gray-100 p-4 rounded-lg">
              {checklistItem.notes}
            </div>
          </section>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="secondary" onClick={() => router.push(`/crewing/checklist/${checklistItem.id}/edit`)}>
          Edit checklist entry
        </Button>
        <button
          type="button"
          disabled
          className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
        >
          Completion update not live yet
        </button>
      </div>
    </div>
  );
}
