"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FormCategory {
  id: string;
  name: string;
  description: string;
  forms: FormItem[];
}

interface FormItem {
  id: string;
  filename: string;
  category: string;
  type: "xlsx" | "docx" | "doc" | "xls" | "pdf";
  uploadedAt?: string;
  lastModified?: string;
}

const FORM_CATEGORIES: FormCategory[] = [
  {
    id: "hgf-cr",
    name: "HGF-CR (Crew Management)",
    description: "Hanmarine Global Forms - Crew Related",
    forms: [],
  },
  {
    id: "hgf-ad",
    name: "HGF-AD (Administration)",
    description: "Hanmarine Global Forms - Administration",
    forms: [],
  },
  {
    id: "hgf-ac",
    name: "HGF-AC (Accounting)",
    description: "Hanmarine Global Forms - Accounting",
    forms: [],
  },
  {
    id: "intergis",
    name: "INTERGIS CO.,LTD",
    description: "INTERGIS Company Forms",
    forms: [],
  },
  {
    id: "lundqvist",
    name: "LUNDQVIST REDERIERNA",
    description: "LUNDQVIST REDERIERNA Forms",
    forms: [],
  },
];

export default function FormReferencePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<FormCategory[]>(FORM_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("hgf-cr");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // Check if user can access forms (admin/staff)
    const userRoles = session.user?.roles || [];
    const hasAccess =
      userRoles.includes("DIRECTOR") ||
      userRoles.includes("HR") ||
      userRoles.includes("HR_ADMIN") ||
      session.user?.isSystemAdmin;

    if (!hasAccess) {
      router.push("/dashboard");
      return;
    }

    fetchForms();
  }, [session, status, router]);

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/form-reference", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (category: string, filename: string) => {
    try {
      const response = await fetch(
        `/api/form-reference/download?category=${encodeURIComponent(
          category
        )}&filename=${encodeURIComponent(filename)}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file");
    }
  };

  const activeCategory = categories.find((c) => c.id === activeTab);
  const filteredForms = activeCategory?.forms.filter((form) =>
    form.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600">Loading form references...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                Form References
              </h1>
              <p className="text-slate-600 mt-2">
                Download and manage form templates
              </p>
            </div>
            <Link
              href="/crewing/forms"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Submit Forms
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === category.id
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-slate-700 border border-slate-300 hover:border-indigo-300"
                }`}
              >
                {category.name}
                <span className="ml-2 text-sm opacity-75">
                  ({category.forms.length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Forms Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredForms && filteredForms.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Form Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Type
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredForms.map((form, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {form.filename}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium uppercase">
                          {form.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            handleDownload(activeCategory!.id, form.filename)
                          }
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition font-medium text-sm"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-600 mb-4">
                {searchQuery
                  ? "No forms match your search"
                  : "No forms available in this category"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">About Form References</h3>
          <p className="text-blue-800 text-sm">
            These are the official form templates used by Hanmarine and our partner companies.
            Download and use them as references when submitting crew documents and compliance forms.
          </p>
        </div>
      </div>
    </div>
  );
}
