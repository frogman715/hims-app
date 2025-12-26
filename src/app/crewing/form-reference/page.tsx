"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Form {
  filename: string;
  type: string;
}

interface FormCategory {
  category: string;
  categoryCode: string;
  description: string;
  forms: Form[];
}

export default function FormReferencePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<FormCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hgf-cr");
  const [searchTerm, setSearchTerm] = useState("");

  // Check permissions
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      const userRoles = session?.user?.roles || [];
      const hasAccess =
        userRoles.includes("DIRECTOR") ||
        userRoles.includes("HR") ||
        userRoles.includes("HR_ADMIN") ||
        session?.user?.isSystemAdmin;

      if (!hasAccess) {
        router.push("/dashboard");
        return;
      }

      fetchForms();
    }
  }, [status, session, router]);

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/crewing/form-reference");
      if (!response.ok) {
        throw new Error("Failed to fetch forms");
      }
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (categoryCode: string, filename: string) => {
    try {
      const response = await fetch(
        `/api/crewing/form-reference/download?category=${categoryCode}&filename=${filename}`
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
      console.error("Download error:", error);
      alert("Failed to download form");
    }
  };

  const activeCategory = categories.find((c) => c.categoryCode === activeTab);
  const filteredForms = activeCategory?.forms.filter((form) =>
    form.filename.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-slate-700">Loading forms...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Form References</h1>
          <p className="text-lg text-slate-600">Download and manage company form templates</p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <p className="text-blue-900 font-semibold">
            📋 Total Forms: {categories.reduce((sum, cat) => sum + cat.forms.length, 0)}
          </p>
          <p className="text-blue-800 text-sm mt-1">
            Select a category and download the forms you need
          </p>
        </div>

        {/* Tabs with descriptions */}
        <div className="space-y-4 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.categoryCode}
              onClick={() => {
                setActiveTab(cat.categoryCode);
                setSearchTerm("");
              }}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                activeTab === cat.categoryCode
                  ? "bg-blue-600 text-white border-blue-700 shadow-md"
                  : "bg-white text-slate-900 border-slate-200 hover:border-blue-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-lg">{cat.category}</div>
                  <div className={`text-sm mt-1 ${activeTab === cat.categoryCode ? "text-blue-100" : "text-slate-600"}`}>
                    {cat.description}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  activeTab === cat.categoryCode
                    ? "bg-blue-400 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}>
                  {cat.forms.length} forms
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search forms in this category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Category Description */}
        {activeCategory && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-slate-900 mb-2">{activeCategory.category}</h3>
            <p className="text-slate-700">{activeCategory.description}</p>
          </div>
        )}

        {/* Forms Table */}
        {filteredForms.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 font-bold text-slate-900">Form Name</th>
                  <th className="text-left px-6 py-4 font-bold text-slate-900">File Type</th>
                  <th className="text-center px-6 py-4 font-bold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredForms.map((form, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-medium">{form.filename}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                        {form.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDownload(activeTab, form.filename)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors duration-200"
                      >
                        <span>⬇️</span>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-slate-600 text-lg">
              {searchTerm ? "No forms matching your search" : "No forms available"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
