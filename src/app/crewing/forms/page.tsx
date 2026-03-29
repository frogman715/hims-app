"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

interface FormTemplate {
  id: string;
  formName: string;
  formCategory: string;
  isRequired: boolean;
  displayOrder: number;
  description: string | null;
  principal: {
    id: string;
    name: string;
  };
}

interface PrepareJoiningForm {
  id: string;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  version: number;
  template: {
    id: string;
    formName: string;
    formCategory: string;
  };
  prepareJoining: {
    id: string;
    crew: {
      id: string;
      fullName: string;
      rank: string;
    };
    principal: {
      name: string;
    } | null;
  };
}

export default function FormManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [forms, setForms] = useState<PrepareJoiningForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "submissions">("submissions");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setError(null);
      const [templatesRes, formsRes] = await Promise.all([
        fetch("/api/form-templates"),
        fetch("/api/form-submissions"),
      ]);

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.data || []);
      } else {
        setTemplates([]);
      }

      if (formsRes.ok) {
        const formsData = await formsRes.json();
        setForms(formsData.data || []);
      } else {
        setError("Failed to fetch form submissions");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading form workspace...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="section-stack">
          <div className="surface-card rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Forms</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => fetchData()} variant="danger" size="sm">
              Try Again
            </Button>
          </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { text: string }> = {
      DRAFT: { text: "Draft" },
      SUBMITTED: { text: "Submitted" },
      UNDER_REVIEW: { text: "Under Review" },
      CHANGES_REQUESTED: { text: "Changes Requested" },
      APPROVED: { text: "Approved" },
      REJECTED: { text: "Declined" },
    };

    const item = config[status] || { text: status };
    return <StatusBadge status={status} label={item.text} className="px-3 py-2" />;
  };

  const getCategoryBadge = (category: string) => {
    const config: Record<string, { color: string; icon: string }> = {
      MEDICAL: { color: "bg-red-100 text-red-800", icon: "🏥" },
      TRAINING: { color: "bg-blue-100 text-blue-800", icon: "📚" },
      DECLARATION: { color: "bg-green-100 text-green-800", icon: "📝" },
      SAFETY: { color: "bg-yellow-100 text-yellow-800", icon: "⚠️" },
    };

    const item = config[category] || { color: "bg-gray-100 text-gray-800", icon: "📄" };
    return (
      <span className={`px-3 py-2 rounded-full text-xs font-semibold ${item.color}`}>
        {item.icon} {category}
      </span>
    );
  };

  // Group templates by principal
  const templatesByPrincipal = templates.reduce((acc, template) => {
    const principalName = template.principal.name;
    if (!acc[principalName]) {
      acc[principalName] = [];
    }
    acc[principalName].push(template);
    return acc;
  }, {} as Record<string, FormTemplate[]>);

  // Group forms by status
  const formsByStatus = forms.reduce((acc, form) => {
    if (!acc[form.status]) {
      acc[form.status] = [];
    }
    acc[form.status].push(form);
    return acc;
  }, {} as Record<string, PrepareJoiningForm[]>);

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Principal Forms"
        title="Principal forms and joining approval"
        subtitle="Review principal-specific form submissions linked to Prepare Joining and maintain the required template matrix used by office teams."
        helperLinks={[
          { href: '/crewing/prepare-joining', label: 'Prepare Joining' },
          { href: '/crewing/workflow', label: 'Workflow' },
        ]}
        highlights={[
          { label: 'Active Queue', value: forms.length, detail: 'Current form submissions still visible in the office review flow.' },
          { label: 'Template Matrix', value: templates.length, detail: 'Principal template rules available for operations and review.' },
        ]}
        actions={(
          <>
            <Link href="/crewing" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
              Crewing Menu
            </Link>
            <Link href="/crewing/prepare-joining" className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Open Prepare Joining
            </Link>
          </>
        )}
      />

      <section className="surface-card space-y-6 p-6">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-5 py-4">
            <p className="text-sm font-semibold text-purple-900">How to use this page</p>
            <p className="mt-1 text-sm text-slate-700">
              Operations reviews required principal forms here, then clears approved submissions before moving crew to ready or dispatched status in Prepare Joining.
            </p>
          </div>

          <div className="flex gap-3 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("submissions")}
              className={`rounded-t-xl px-5 py-3 text-sm font-semibold transition-all duration-200 ${
                activeTab === "submissions"
                  ? "border-b-2 border-cyan-700 text-cyan-800"
                  : "text-slate-600 hover:text-cyan-800"
              }`}
            >
              Active Form Queue ({forms.length})
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`rounded-t-xl px-5 py-3 text-sm font-semibold transition-all duration-200 ${
                activeTab === "templates"
                  ? "border-b-2 border-cyan-700 text-cyan-800"
                  : "text-slate-600 hover:text-cyan-800"
              }`}
            >
              Principal Template Matrix ({templates.length})
            </button>
          </div>

        {/* Content */}
        {activeTab === "submissions" ? (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-1 text-sm text-slate-600">Pending Review</div>
                <div className="text-3xl font-bold text-yellow-600">
                  {(formsByStatus["SUBMITTED"]?.length || 0) +
                    (formsByStatus["UNDER_REVIEW"]?.length || 0)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-1 text-sm text-slate-600">Approved</div>
                <div className="text-3xl font-bold text-green-600">
                  {formsByStatus["APPROVED"]?.length || 0}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-1 text-sm text-slate-600">Changes Requested</div>
                <div className="text-3xl font-bold text-orange-600">
                  {formsByStatus["CHANGES_REQUESTED"]?.length || 0}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-1 text-sm text-slate-600">Draft</div>
                <div className="text-3xl font-bold text-gray-700">
                  {formsByStatus["DRAFT"]?.length || 0}
                </div>
              </div>
              <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm md:col-span-4">
                <div className="mb-1 text-sm text-slate-700">Workflow note</div>
                <div className="text-sm text-slate-600">
                  Draft or requested-change forms should go back to Operational for completion. Approved forms clear principal-specific blockers inside Prepare Joining.
                </div>
              </div>
            </div>

            {/* Form List */}
            {forms.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  No active principal forms yet
                </h3>
                <p className="text-slate-600">
                  Forms will appear here after a crew member enters Prepare Joining and a principal template is required.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-cyan-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {form.template.formName}
                          </h3>
                          {getCategoryBadge(form.template.formCategory)}
                          {getStatusBadge(form.status)}
                        </div>
                        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                          <div>
                            <span className="text-slate-500">Crew:</span>{" "}
                            <span className="font-semibold">
                              {form.prepareJoining.crew.fullName}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Principal:</span>{" "}
                            <span className="font-semibold">
                              {form.prepareJoining.principal?.name || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Version:</span>{" "}
                            <span className="font-semibold">v{form.version}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href={`/crewing/prepare-joining`}
                            className="text-sm font-semibold text-teal-700 hover:text-teal-900"
                          >
                            Open Prepare Joining
                          </Link>
                          <span className="text-slate-300">•</span>
                          <Link
                            href={`/crewing/seafarers/${form.prepareJoining.crew.id}/biodata`}
                            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                          >
                            Open Crew Biodata
                          </Link>
                        </div>
                      </div>
                      <Link
                        href={`/crewing/forms/${form.id}`}
                        className="ml-4 inline-flex items-center rounded-lg bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800"
                      >
                        Review Form
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Templates by Principal */}
            {Object.keys(templatesByPrincipal).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  No principal templates yet
                </h3>
                <p className="mb-6 text-slate-600">
                  No principal template matrix has been defined yet.
                </p>
              </div>
            ) : (
              Object.entries(templatesByPrincipal).map(([principalName, principalTemplates]) => (
                <div
                  key={principalName}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-200 bg-slate-50 p-6">
                    <h2 className="text-2xl font-semibold text-slate-900">{principalName}</h2>
                    <p className="text-slate-600">
                      {principalTemplates.length} form template(s) linked to Prepare Joining
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {principalTemplates
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((template) => (
                          <div
                            key={template.id}
                            className="rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:border-cyan-300"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="mb-1 font-semibold text-slate-900">
                                  {template.formName}
                                </h3>
                                {template.description && (
                                  <p className="mb-2 text-sm text-slate-600">
                                    {template.description}
                                  </p>
                                )}
                              </div>
                              {template.isRequired && (
                                <span className="rounded-lg bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-800">
                                  Required
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              {getCategoryBadge(template.formCategory)}
                              <span className="text-sm text-slate-600">
                                Order: {template.displayOrder}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
