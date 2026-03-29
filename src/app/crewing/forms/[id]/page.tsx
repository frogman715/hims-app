"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Modal from "@/components/Modal";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { WorkspaceLoadingState, WorkspaceState } from "@/components/layout/WorkspaceState";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { pushAppNotice } from "@/lib/app-notice";
import type { AppRole } from "@/lib/roles";

type FormFieldMap = Record<string, string>;

interface FormSubmission {
  id: string;
  status: string;
  version: number;
  formData: Record<string, unknown>;
  submittedBy: string | null;
  submittedAt: Date | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  finalPdfPath: string | null;
  createdAt: Date;
  template: {
    id: string;
    formName: string;
    formCategory: string;
    principal: {
      id: string;
      name: string;
      companyCode: string;
    };
  };
  prepareJoining: {
    id: string;
    crew: {
      id: string;
      fullName: string;
      rank: string;
      dateOfBirth: Date;
      passportNumber: string | null;
      seamanBookNumber: string | null;
      phone: string | null;
      email: string | null;
    };
    principal: {
      id: string;
      name: string;
    };
    assignment: {
      id: string;
      vessel: {
        id: string;
        name: string;
        imoNumber: string | null;
      };
      joinDate: Date;
      port: string | null;
    } | null;
  };
}

export default function FormReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const formId = params.id as string;
  const [form, setForm] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<FormFieldMap>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestedChanges, setRequestedChanges] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);

  const sessionRoles = Array.isArray(session?.user?.roles)
    ? (session.user.roles as AppRole[])
    : [];

  const fetchFormDetails = useCallback(async () => {
    if (!formId) {
      return;
    }
    try {
      const res = await fetch(`/api/form-submissions/${formId}`);
      if (res.ok) {
        const data = await res.json();
        setForm(data);
        setFormData(sanitizeFormData(data.formData));
      }
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    fetchFormDetails();
  }, [fetchFormDetails]);

  const handleDownload = () => {
    // Create HTML content for download
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${form?.template.formName} - ${form?.prepareJoining.crew.fullName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #1e40af; font-size: 24px; }
    .header p { margin: 5px 0; color: #666; }
    .section { margin: 30px 0; }
    .section h2 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-item { margin: 10px 0; }
    .info-label { font-weight: bold; color: #374151; margin-bottom: 5px; }
    .info-value { color: #111827; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    table, th, td { border: 1px solid #d1d5db; }
    th, td { padding: 12px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-submitted { background: #dbeafe; color: #1e3a8a; }
    .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PT HANMARINE INTERNATIONAL MARITIME SERVICE</h1>
    <p>Jalan Raya New No. 123, Jakarta Pusat 10110, Indonesia</p>
    <p>Phone: +62 21 1234 5678 | Email: office@hanmarine.com</p>
  </div>

  <div class="section">
    <h2>${form?.template.formName}</h2>
    <p><strong>Principal:</strong> ${form?.template.principal.name}</p>
    <p><strong>Category:</strong> ${form?.template.formCategory}</p>
    <p><strong>Status:</strong> <span class="status status-${form?.status.toLowerCase()}">${form?.status}</span></p>
    <p><strong>Version:</strong> ${form?.version}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  </div>

  <div class="section">
    <h2>Crew Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Full Name</div>
        <div class="info-value">${form?.prepareJoining.crew.fullName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Rank</div>
        <div class="info-value">${form?.prepareJoining.crew.rank}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Date of Birth</div>
        <div class="info-value">${new Date(form?.prepareJoining.crew.dateOfBirth || "").toLocaleDateString()}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Passport Number</div>
        <div class="info-value">${form?.prepareJoining.crew.passportNumber || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Seaman Book Number</div>
        <div class="info-value">${form?.prepareJoining.crew.seamanBookNumber || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Principal</div>
        <div class="info-value">${form?.prepareJoining.principal.name}</div>
      </div>
      ${form?.prepareJoining.assignment ? `
      <div class="info-item">
        <div class="info-label">Vessel</div>
        <div class="info-value">${form?.prepareJoining.assignment.vessel.name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Join Date</div>
        <div class="info-value">${new Date(form?.prepareJoining.assignment.joinDate).toLocaleDateString()}</div>
      </div>
      ` : ''}
    </div>
  </div>

  <div class="section">
    <h2>Form Data</h2>
    <table>
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(formData).map(([key, value]) => `
          <tr>
            <td>${key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}</td>
            <td>${value}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>

  ${form?.approvedBy ? `
  <div class="section">
    <h2>Approval Information</h2>
    <p><strong>Approved By:</strong> ${form?.approvedBy}</p>
    <p><strong>Approved At:</strong> ${new Date(form?.approvedAt || "").toLocaleString()}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by HANMARINE HIMS - Maritime Crew Management System</p>
    <p>This is an official document. Any alterations after printing are not valid.</p>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 10px;">
    <button onclick="window.print()" style="padding: 12px 24px; background: #1e40af; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">
      🖨️ Print / Save as PDF
    </button>
  </div>
</body>
</html>
    `;

    // Open in new window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const sanitizeFormData = (raw: unknown): FormFieldMap => {
    if (!raw || typeof raw !== "object") {
      return {};
    }

    return Object.entries(raw as Record<string, unknown>).reduce(
      (acc, [key, value]) => {
        acc[key] = value === null || value === undefined ? "" : String(value);
        return acc;
      },
      {} as FormFieldMap
    );
  };

  const handleSave = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/form-submissions/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });

      if (res.ok) {
        setEditMode(false);
        fetchFormDetails();
      }
    } catch (error) {
      console.error("Error saving form:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/form-submissions/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SUBMITTED", formData }),
      });

      if (res.ok) {
        fetchFormDetails();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/form-submissions/${formId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "" }),
      });

      if (res.ok) {
        fetchFormDetails();
      }
    } catch (error) {
      console.error("Error approving form:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      pushAppNotice({
        tone: "warning",
        title: "Rejection reason required",
        message: "Provide a rejection reason before returning the form.",
      });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/form-submissions/${formId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (res.ok) {
        setShowRejectModal(false);
        setRejectionReason("");
        fetchFormDetails();
      }
    } catch (error) {
      console.error("Error rejecting form:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!requestedChanges.trim()) {
      pushAppNotice({
        tone: "warning",
        title: "Change request required",
        message: "Provide the requested changes before returning the form.",
      });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/form-submissions/${formId}/request-changes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ changes: requestedChanges }),
        }
      );

      if (res.ok) {
        setShowChangesModal(false);
        setRequestedChanges("");
        fetchFormDetails();
      }
    } catch (error) {
      console.error("Error requesting changes:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const canEdit = form?.status === "DRAFT" || form?.status === "CHANGES_REQUESTED";
  const canReviewRole = sessionRoles.some((role) => role === "OPERATIONAL" || role === "DIRECTOR");
  const canReview =
    canReviewRole &&
    (form?.status === "SUBMITTED" || form?.status === "UNDER_REVIEW");

  if (loading) {
    return <WorkspaceLoadingState label="Loading form review..." />;
  }

  if (!form) {
    return (
      <WorkspaceState
        eyebrow="Form Review"
        title="Form record not available"
        description="The requested principal form could not be found in the active review queue. Return to the form desk or reopen the related Prepare Joining case."
        tone="danger"
        action={(
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/crewing/forms" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
              Return to Form Queue
            </Link>
            <Link href="/crewing/prepare-joining" className="inline-flex items-center rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800">
              Open Prepare Joining Desk
            </Link>
          </div>
        )}
      />
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "MEDICAL":
        return "bg-red-100 text-red-800";
      case "TRAINING":
        return "bg-blue-100 text-blue-800";
      case "DECLARATION":
        return "bg-green-100 text-green-800";
      case "SAFETY":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDeskAction = () => {
    switch (form.status) {
      case "DRAFT":
        return {
          label: "Complete draft",
          helper: "Finish the principal form data, then submit it into the review queue.",
          status: "DRAFT",
        };
      case "SUBMITTED":
        return canReviewRole
          ? {
              label: "Review submission",
              helper: "Operational review can approve, reject, or request changes from this page.",
              status: "SUBMITTED",
            }
          : {
              label: "Waiting reviewer",
              helper: "This submission is already in the review queue. Monitor status only from this page.",
              status: "SUBMITTED",
            };
      case "UNDER_REVIEW":
        return canReviewRole
          ? {
              label: "Finalize review",
              helper: "Use approval, rejection, or change request to clear the principal-form blocker.",
              status: "UNDER_REVIEW",
            }
          : {
              label: "Review in progress",
              helper: "Another reviewer is handling this submission. Follow up only if the queue stalls.",
              status: "UNDER_REVIEW",
            };
      case "CHANGES_REQUESTED":
        return {
          label: "Revise and resubmit",
          helper: "Requested changes are outstanding. Update the form data and send it back to review.",
          status: "CHANGES_REQUESTED",
        };
      case "APPROVED":
        return {
          label: "Form cleared",
          helper: "This approval should no longer block the Prepare Joining principal-form gate.",
          status: "APPROVED",
        };
      case "REJECTED":
        return {
          label: "Restart if needed",
          helper: "Use the rejection note for traceability before generating a replacement form.",
          status: "REJECTED",
        };
      default:
        return {
          label: "Review record",
          helper: "Confirm the current workflow state before taking office action.",
          status: "CLOSED",
        };
    }
  };

  const deskAction = getDeskAction();
  const formStatusLabel = form.status.replaceAll("_", " ");

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Form Review"
        title={form.template.formName}
        subtitle={`Principal-specific form inside the joining workflow for ${form.prepareJoining.crew.fullName}. Use this page to clear only the form blocker that belongs to the active Prepare Joining case.`}
        helperLinks={[
          { href: "/crewing/forms", label: "Form Queue" },
          { href: "/crewing/prepare-joining", label: "Prepare Joining" },
        ]}
        highlights={[
          {
            label: "Status",
            value: formStatusLabel,
            detail: deskAction.helper,
          },
          {
            label: "Category",
            value: form.template.formCategory,
            detail: `Principal: ${form.template.principal.name}`,
          },
          {
            label: "Version",
            value: `v${form.version}`,
            detail: "Version control keeps the office working from the current principal template.",
          },
          {
            label: "Crew Record",
            value: form.prepareJoining.crew.fullName,
            detail: `Rank: ${form.prepareJoining.crew.rank}`,
          },
        ]}
        actions={(
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => router.back()}>
              Back
            </Button>
            <Link href="/crewing/forms" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
              Form Queue
            </Link>
            <Link href="/crewing/prepare-joining" className="inline-flex items-center rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800">
              Prepare Joining
            </Link>
          </>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge status={form.status} className="rounded-lg px-3 py-2 text-sm" />
              <span
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${getCategoryColor(
                  form.template.formCategory
                )}`}
              >
                {form.template.formCategory}
              </span>
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                v{form.version}
              </span>
            </div>
            <p className="max-w-3xl text-sm text-slate-600">
              Principal: {form.template.principal.name} ({form.template.principal.companyCode}) — approval here clears the principal-form blocker in Prepare Joining.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && !editMode && (
              <Button type="button" size="sm" onClick={() => setEditMode(true)}>
                Edit Form
              </Button>
            )}

            {editMode && (
              <>
                <Button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setFormData(sanitizeFormData(form.formData));
                  }}
                  variant="secondary"
                  size="sm"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  size="sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save"}
                </Button>
              </>
            )}

            {form.status === "DRAFT" && !editMode && (
              <Button
                type="button"
                onClick={handleSubmitForReview}
                size="sm"
                disabled={actionLoading}
              >
                {actionLoading ? "Submitting..." : "Submit for Review"}
              </Button>
            )}

            {canReview && (
              <>
                <Button
                  type="button"
                  onClick={handleApprove}
                  size="sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Approving..." : "Approve"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowChangesModal(true)}
                  size="sm"
                >
                  Request Changes
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  variant="danger"
                  size="sm"
                >
                  Reject
                </Button>
              </>
            )}

            <Button
              type="button"
              onClick={handleDownload}
              size="sm"
            >
              Download / Print
            </Button>

            {form.status === "APPROVED" && form.finalPdfPath && (
              <Button
                type="button"
                onClick={() => window.open(form.finalPdfPath!, "_blank")}
                size="sm"
              >
                Official PDF
              </Button>
            )}
          </div>
        </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Crew</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{form.prepareJoining.crew.fullName}</p>
          <p className="text-sm text-slate-600">{form.prepareJoining.crew.rank}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Principal</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{form.prepareJoining.principal.name}</p>
          <p className="text-sm text-slate-600">{form.template.formCategory}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Joining Workflow</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{form.status.replaceAll("_", " ")}</p>
          <p className="text-sm text-slate-600">
            Approval here clears principal-form blockers in Prepare Joining.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Form Desk Action</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-emerald-950">{deskAction.label}</p>
              <p className="mt-1 max-w-2xl text-sm text-emerald-900">{deskAction.helper}</p>
            </div>
            <StatusBadge status={deskAction.status} label={form.status.replaceAll("_", " ")} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Related Desks</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href={`/crewing/prepare-joining`}
              className="inline-flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
            >
              Open Prepare Joining queue
              <span>→</span>
            </Link>
            <Link
              href={`/crewing/seafarers/${form.prepareJoining.crew.id}/documents`}
              className="inline-flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
            >
              Review crew documents
              <span>→</span>
            </Link>
            <Link
              href={`/crewing/seafarers/${form.prepareJoining.crew.id}/biodata`}
              className="inline-flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
            >
              Open crew biodata
              <span>→</span>
            </Link>
          </div>
        </section>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Crew Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name
            </label>
            <div className="text-base font-semibold text-slate-900">
              {form.prepareJoining.crew.fullName}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Rank
            </label>
            <div className="text-base font-semibold text-slate-900">
              {form.prepareJoining.crew.rank}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Date of Birth
            </label>
            <div className="text-base text-slate-700">
              {new Date(form.prepareJoining.crew.dateOfBirth).toLocaleDateString()}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Passport Number
            </label>
            <div className="text-base text-slate-700">
              {form.prepareJoining.crew.passportNumber || "N/A"}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Seaman Book Number
            </label>
            <div className="text-base text-slate-700">
              {form.prepareJoining.crew.seamanBookNumber || "N/A"}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Principal
            </label>
            <div className="text-base font-semibold text-slate-900">
              {form.prepareJoining.principal.name}
            </div>
          </div>
          {form.prepareJoining.assignment && (
            <>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Vessel
                </label>
                <div className="text-base font-semibold text-slate-900">
                  {form.prepareJoining.assignment.vessel.name}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Join Date
                </label>
                <div className="text-base text-slate-700">
                  {new Date(
                    form.prepareJoining.assignment.joinDate
                  ).toLocaleDateString()}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Port
                </label>
                <div className="text-base text-slate-700">
                  {form.prepareJoining.assignment.port || "N/A"}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/crewing/prepare-joining" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50">
            Back to Prepare Joining Queue
          </Link>
          <Link href={`/crewing/seafarers/${form.prepareJoining.crew.id}/biodata`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50">
            Open Crew Biodata
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Form Data</h2>
        <div className="space-y-6">
          {Object.entries(formData).map(([key, value]) => (
            <div key={key}>
              {(() => {
                const label = key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase());
                return editMode ? (
                  <Input
                    id={key}
                    label={label}
                    value={value as string}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  />
                ) : (
                  <>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
                    <div className="text-base text-slate-700">{value as string}</div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Approval Timeline</h2>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-24 text-sm text-slate-500">Created</div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">
                {new Date(form.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          {form.submittedAt && (
            <div className="flex items-start gap-4">
              <div className="w-24 text-sm text-slate-500">Submitted</div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">
                  {new Date(form.submittedAt).toLocaleString()}
                </div>
                <div className="text-sm text-slate-600">by {form.submittedBy}</div>
              </div>
            </div>
          )}

          {form.reviewedAt && (
            <div className="flex items-start gap-4">
              <div className="w-24 text-sm text-slate-500">Reviewed</div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">
                  {new Date(form.reviewedAt).toLocaleString()}
                </div>
                <div className="text-sm text-slate-600">by {form.reviewedBy}</div>
              </div>
            </div>
          )}

          {form.approvedAt && (
            <div className="flex items-start gap-4">
              <div className="w-24 text-sm text-slate-500">Approved</div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">
                  {new Date(form.approvedAt).toLocaleString()}
                </div>
                <div className="text-sm text-slate-600">by {form.approvedBy}</div>
              </div>
            </div>
          )}

          {form.rejectionReason && (
            <div className="flex items-start gap-4">
              <div className="w-24 text-sm text-slate-500">Rejected</div>
              <div className="flex-1">
                <div className="font-semibold text-red-600">{form.rejectionReason}</div>
              </div>
            </div>
          )}

          {formData.requestedChanges && (
            <div className="flex items-start gap-4">
              <div className="w-24 text-sm text-slate-500">Changes</div>
              <div className="flex-1">
                <div className="font-semibold text-orange-600">
                  {formData.requestedChanges}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Form"
        subtitle="Provide reason for rejection"
        size="md"
      >
        <Textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Provide reason for rejection..."
          className="mb-4"
          rows={4}
        />
        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
          <Button type="button" onClick={() => setShowRejectModal(false)} variant="secondary" size="sm" className="order-2 sm:order-1">
            Cancel
          </Button>
          <Button type="button" onClick={handleReject} variant="danger" size="sm" className="order-1 sm:order-2" disabled={actionLoading}>
            {actionLoading ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showChangesModal}
        onClose={() => setShowChangesModal(false)}
        title="Request Changes"
        subtitle="Describe what changes are needed"
        size="md"
      >
        <Textarea
          value={requestedChanges}
          onChange={(e) => setRequestedChanges(e.target.value)}
          placeholder="Describe what changes are needed..."
          className="mb-4"
          rows={4}
        />
        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
          <Button type="button" onClick={() => setShowChangesModal(false)} variant="secondary" size="sm" className="order-2 sm:order-1">
            Cancel
          </Button>
          <Button type="button" onClick={handleRequestChanges} size="sm" className="order-1 sm:order-2" disabled={actionLoading}>
            {actionLoading ? "Requesting..." : "Request Changes"}
          </Button>
        </div>
      </Modal>
      </section>
    </div>
  );
}
