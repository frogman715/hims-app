"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

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
      const [templatesRes, formsRes] = await Promise.all([
        fetch("/api/form-templates"),
        fetch("/api/form-submissions"),
      ]);

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.data || []);
      }

      if (formsRes.ok) {
        const formsData = await formsRes.json();
        setForms(formsData.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      DRAFT: { color: "bg-gray-100 text-gray-800", text: "Draft" },
      SUBMITTED: { color: "bg-blue-100 text-blue-800", text: "Submitted" },
      UNDER_REVIEW: { color: "bg-yellow-100 text-yellow-800", text: "Under Review" },
      CHANGES_REQUESTED: { color: "bg-orange-100 text-orange-800", text: "Changes Requested" },
      APPROVED: { color: "bg-green-100 text-green-800", text: "Approved" },
      REJECTED: { color: "bg-red-100 text-red-800", text: "Rejected" },
    };

    const item = config[status] || { color: "bg-gray-100 text-gray-800", text: status };
    return (
      <span className={`px-3 py-2 rounded-full text-xs font-semibold ${item.color}`}>
        {item.text}
      </span>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Form Management & Approval
              </h1>
              <p className="text-gray-700">
                Manage principal-specific forms dengan approval workflow
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/crewing"
                className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:border-purple-500 hover:text-purple-600 transition-all duration-200 shadow-md hover:shadow-md"
              >
                ← Crewing Menu
              </Link>
              <Link
                href="/crewing/prepare-joining"
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                ✈️ Generate Letter Guarantee
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 border-b-2 border-gray-300">
            <button
              onClick={() => setActiveTab("submissions")}
              className={`px-6 py-3 font-semibold transition-all duration-200 ${
                activeTab === "submissions"
                  ? "text-purple-600 border-b-2 border-purple-600 -mb-0.5"
                  : "text-gray-700 hover:text-purple-600"
              }`}
            >
              📝 Form Submissions ({forms.length})
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-6 py-3 font-semibold transition-all duration-200 ${
                activeTab === "templates"
                  ? "text-purple-600 border-b-2 border-purple-600 -mb-0.5"
                  : "text-gray-700 hover:text-purple-600"
              }`}
            >
              📋 Form Templates ({templates.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "submissions" ? (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-4">
                <div className="text-sm text-gray-800 mb-1">Pending Review</div>
                <div className="text-3xl font-bold text-yellow-600">
                  {(formsByStatus["SUBMITTED"]?.length || 0) +
                    (formsByStatus["UNDER_REVIEW"]?.length || 0)}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-4">
                <div className="text-sm text-gray-800 mb-1">Approved</div>
                <div className="text-3xl font-bold text-green-600">
                  {formsByStatus["APPROVED"]?.length || 0}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-4">
                <div className="text-sm text-gray-800 mb-1">Changes Requested</div>
                <div className="text-3xl font-bold text-orange-600">
                  {formsByStatus["CHANGES_REQUESTED"]?.length || 0}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-4">
                <div className="text-sm text-gray-800 mb-1">Draft</div>
                <div className="text-3xl font-bold text-gray-700">
                  {formsByStatus["DRAFT"]?.length || 0}
                </div>
              </div>
            </div>

            {/* Form List */}
            {forms.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                  Tidak ada form submissions
                </h3>
                <p className="text-gray-700">
                  Form akan muncul ketika crew mulai prepare joining
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-6 hover:border-purple-300 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {form.template.formName}
                          </h3>
                          {getCategoryBadge(form.template.formCategory)}
                          {getStatusBadge(form.status)}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Crew:</span>{" "}
                            <span className="font-semibold">
                              {form.prepareJoining.crew.fullName}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Principal:</span>{" "}
                            <span className="font-semibold">
                              {form.prepareJoining.principal?.name || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Version:</span>{" "}
                            <span className="font-semibold">v{form.version}</span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/crewing/forms/${form.id}`}
                        className="ml-4 px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-all duration-200"
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
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                  Tidak ada form templates
                </h3>
                <p className="text-gray-700 mb-6">
                  Belum ada template yang didefinisikan untuk principal
                </p>
              </div>
            ) : (
              Object.entries(templatesByPrincipal).map(([principalName, principalTemplates]) => (
                <div
                  key={principalName}
                  className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b-2 border-gray-100">
                    <h2 className="text-2xl font-extrabold text-gray-900">{principalName}</h2>
                    <p className="text-gray-700">
                      {principalTemplates.length} form template(s)
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {principalTemplates
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((template) => (
                          <div
                            key={template.id}
                            className="border-2 border-gray-300 rounded-xl p-4 hover:border-purple-300 transition-all duration-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-1">
                                  {template.formName}
                                </h3>
                                {template.description && (
                                  <p className="text-sm text-gray-800 mb-2">
                                    {template.description}
                                  </p>
                                )}
                              </div>
                              {template.isRequired && (
                                <span className="px-4 py-2 bg-red-100 text-red-800 text-xs font-semibold rounded">
                                  Required
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              {getCategoryBadge(template.formCategory)}
                              <span className="text-sm text-gray-700">
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
      </div>
    </div>
  );
}
