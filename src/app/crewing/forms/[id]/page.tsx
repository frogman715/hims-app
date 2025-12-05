"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Modal from "@/components/Modal";

interface FormSubmission {
  id: string;
  status: string;
  version: number;
  formData: any;
  submittedBy: string | null;
  submittedAt: Date | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
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
  const [form, setForm] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestedChanges, setRequestedChanges] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);

  useEffect(() => {
    fetchFormDetails();
  }, [params.id]);

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
    <p>Jalan Raya Baru No. 123, Jakarta Pusat 10110, Indonesia</p>
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

  const fetchFormDetails = async () => {
    try {
      const res = await fetch(`/api/form-submissions/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setForm(data);
        setFormData(data.formData || {});
      }
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/form-submissions/${params.id}`, {
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
      const res = await fetch(`/api/form-submissions/${params.id}`, {
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
      const res = await fetch(`/api/form-submissions/${params.id}/approve`, {
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
      alert("Please provide a rejection reason");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/form-submissions/${params.id}/reject`, {
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
      alert("Please provide change requests");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/form-submissions/${params.id}/request-changes`,
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
  const canReview =
    (session?.user?.role === "CDMO" || session?.user?.role === "DIRECTOR") &&
    (form?.status === "SUBMITTED" || form?.status === "UNDER_REVIEW");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading form...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Form not found</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "CHANGES_REQUESTED":
        return "bg-orange-100 text-orange-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{form.template.formName}</h1>
            <div className="flex gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                  form.status
                )}`}
              >
                {form.status.replace("_", " ")}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(
                  form.template.formCategory
                )}`}
              >
                {form.template.formCategory}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                v{form.version}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {canEdit && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Form
              </button>
            )}

            {editMode && (
              <>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setFormData(form.formData);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save"}
                </button>
              </>
            )}

            {form.status === "DRAFT" && !editMode && (
              <button
                onClick={handleSubmitForReview}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                disabled={actionLoading}
              >
                {actionLoading ? "Submitting..." : "Submit for Review"}
              </button>
            )}

            {canReview && (
              <>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={() => setShowChangesModal(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
              </>
            )}

            {/* Download button - available for any status */}
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 flex items-center gap-2"
            >
              📥 Download / Print
            </button>

            {form.status === "APPROVED" && form.finalPdfPath && (
              <button
                onClick={() => window.open(form.finalPdfPath!, "_blank")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📄 Official PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Crew Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Crew Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <div className="text-lg font-semibold">
              {form.prepareJoining.crew.fullName}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rank
            </label>
            <div className="text-lg font-semibold">
              {form.prepareJoining.crew.rank}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <div className="text-lg">
              {new Date(form.prepareJoining.crew.dateOfBirth).toLocaleDateString()}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passport Number
            </label>
            <div className="text-lg">
              {form.prepareJoining.crew.passportNumber || "N/A"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seaman Book Number
            </label>
            <div className="text-lg">
              {form.prepareJoining.crew.seamanBookNumber || "N/A"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Principal
            </label>
            <div className="text-lg font-semibold">
              {form.prepareJoining.principal.name}
            </div>
          </div>
          {form.prepareJoining.assignment && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vessel
                </label>
                <div className="text-lg font-semibold">
                  {form.prepareJoining.assignment.vessel.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Join Date
                </label>
                <div className="text-lg">
                  {new Date(
                    form.prepareJoining.assignment.joinDate
                  ).toLocaleDateString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <div className="text-lg">
                  {form.prepareJoining.assignment.port || "N/A"}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Form Data */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Form Data</h2>
        <div className="space-y-4">
          {Object.entries(formData).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) =>
                    setFormData({ ...formData, [key]: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-lg">{value as string}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Approval Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Approval Timeline</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-24 text-sm text-gray-500">Created</div>
            <div className="flex-1">
              <div className="font-semibold">
                {new Date(form.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          {form.submittedAt && (
            <div className="flex items-start gap-4">
              <div className="w-24 text-sm text-gray-500">Submitted</div>
              <div className="flex-1">
                <div className="font-semibold">
                  {new Date(form.submittedAt).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">by {form.submittedBy}</div>
              </div>
            </div>
          )}

          {form.reviewedAt && (
            <div className="flex items-start gap-4">
              <div className="w-24 text-sm text-gray-500">Reviewed</div>
              <div className="flex-1">
                <div className="font-semibold">
                  {new Date(form.reviewedAt).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">by {form.reviewedBy}</div>
              </div>
            </div>
          )}

          {form.approvedAt && (
            <div className="flex items-start gap-4">
              <div className="w-24 text-sm text-gray-500">Approved</div>
              <div className="flex-1">
                <div className="font-semibold">
                  {new Date(form.approvedAt).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">by {form.approvedBy}</div>
              </div>
            </div>
          )}

          {form.rejectionReason && (
            <div className="flex items-start gap-4">
              <div className="w-24 text-sm text-gray-500">Rejected</div>
              <div className="flex-1">
                <div className="font-semibold text-red-600">{form.rejectionReason}</div>
              </div>
            </div>
          )}

          {formData.requestedChanges && (
            <div className="flex items-start gap-4">
              <div className="w-24 text-sm text-gray-500">Changes</div>
              <div className="flex-1">
                <div className="font-semibold text-orange-600">
                  {formData.requestedChanges}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Form"
        subtitle="Provide reason for rejection"
        size="md"
      >
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Provide reason for rejection..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
          rows={4}
        />
        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
          <button
            onClick={() => setShowRejectModal(false)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 order-1 sm:order-2"
            disabled={actionLoading}
          >
            {actionLoading ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </Modal>

      {/* Request Changes Modal */}
      <Modal
        isOpen={showChangesModal}
        onClose={() => setShowChangesModal(false)}
        title="Request Changes"
        subtitle="Describe what changes are needed"
        size="md"
      >
        <textarea
          value={requestedChanges}
          onChange={(e) => setRequestedChanges(e.target.value)}
          placeholder="Describe what changes are needed..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
          rows={4}
        />
        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
          <button
            onClick={() => setShowChangesModal(false)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleRequestChanges}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 order-1 sm:order-2"
            disabled={actionLoading}
          >
            {actionLoading ? "Requesting..." : "Request Changes"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
