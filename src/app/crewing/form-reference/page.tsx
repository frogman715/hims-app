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

interface Crew {
  id: string;
  fullName: string;
  rank: string;
  passportNumber?: string;
}

export default function FormReferencePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<FormCategory[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hgf-cr");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrewId, setSelectedCrewId] = useState<string>("");

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
      fetchCrews();
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

  const fetchCrews = async () => {
    try {
      const response = await fetch("/api/crew?limit=1000");
      if (!response.ok) {
        throw new Error("Failed to fetch crews");
      }
      const data = await response.json();
      setCrews(data.data || []);
      // Auto-select first crew if available
      if (data.data && data.data.length > 0) {
        setSelectedCrewId(data.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching crews:", error);
    }
  };

  const handleDownloadWithCrewData = async (categoryCode: string, filename: string) => {
    if (!selectedCrewId) {
      alert("Please select a crew member first");
      return;
    }

    try {
      const response = await fetch(
        `/api/crewing/form-reference/generate?category=${categoryCode}&filename=${filename}&crewId=${selectedCrewId}`
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Get filename from content-disposition header
      const contentDisposition = response.headers.get("content-disposition");
      const downloadFilename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : filename;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download form");
    }
  };

  const handleDownloadBlank = async (categoryCode: string, filename: string) => {
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Form References</h1>
            <p className="text-lg text-slate-600">Download official form templates - blank or pre-filled with crew data</p>
          </div>
          <a
            href="/crewing"
            className="px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors duration-200 flex items-center gap-2"
          >
            <span>←</span>
            Back
          </a>
        </div>

        {/* Crew Selector */}
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            📋 Select Crew Member (Optional - for pre-filled forms):
          </label>
          <select
            value={selectedCrewId}
            onChange={(e) => setSelectedCrewId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-medium bg-white"
          >
            <option value="">-- Download Blank Form (No Crew Data) --</option>
            {crews.map((crew) => (
              <option key={crew.id} value={crew.id}>
                {crew.fullName} ({crew.rank}) {crew.passportNumber ? `- ${crew.passportNumber}` : ""}
              </option>
            ))}
          </select>
          {selectedCrewId && (
            <p className="text-green-700 text-sm mt-2">
              ✅ Selected crew will auto-fill: Name, Rank, Passport, Email, Phone, Contact Info
            </p>
          )}
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6">
          <p className="text-amber-900 font-bold mb-1">⚠️ Download Options:</p>
          <p className="text-amber-800 text-sm">
            <strong>Without Crew Selection:</strong> Download blank form template<br />
            <strong>With Crew Selection:</strong> Form is pre-filled with selected crew's data (Name, Rank, Passport, Email, Phone, etc)
          </p>
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

        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-slate-600">
          <span>Form References</span>
          {activeCategory && (
            <>
              <span className="mx-2">/</span>
              <span className="font-bold text-slate-900">{activeCategory.category}</span>
            </>
          )}
        </div>

        {/* Category Selection */}
        <div className="mb-6">
          <div className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Select Category:</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.categoryCode}
                onClick={() => {
                  setActiveTab(cat.categoryCode);
                  setSearchTerm("");
                }}
                className={`text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  activeTab === cat.categoryCode
                    ? "bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300"
                    : "bg-white text-slate-900 border-slate-200 hover:border-blue-400 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-base">{cat.category}</div>
                    <div className={`text-xs mt-1 ${activeTab === cat.categoryCode ? "text-blue-100" : "text-slate-600"}`}>
                      {cat.description}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ml-3 ${
                    activeTab === cat.categoryCode
                      ? "bg-blue-400 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {cat.forms.length}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Search in {activeCategory?.category}:</label>
          <input
            type="text"
            placeholder="Type form name to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium"
          />
        </div>

        {/* Category Description */}
        {activeCategory && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-slate-900 text-lg mb-2">About {activeCategory.category}</h3>
            <p className="text-slate-700 leading-relaxed text-sm">{activeCategory.description}</p>
          </div>
        )}

        {/* Forms Table */}
        {filteredForms.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
              <p className="font-bold text-slate-900">Showing {filteredForms.length} of {activeCategory?.forms.length} forms</p>
            </div>
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 font-bold text-slate-900">Form Name</th>
                  <th className="text-left px-6 py-4 font-bold text-slate-900">File Type</th>
                  <th className="text-center px-6 py-4 font-bold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredForms.map((form, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-medium text-sm">{form.filename}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                        {form.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        {selectedCrewId && (
                          <button
                            onClick={() => handleDownloadWithCrewData(activeTab, form.filename)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs transition-colors duration-200"
                            title="Download with crew data pre-filled"
                          >
                            <span>��</span>
                            Pre-Fill
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadBlank(activeTab, form.filename)}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-xs transition-colors duration-200"
                          title="Download blank template"
                        >
                          <span>⬇️</span>
                          Blank
                        </button>
                      </div>
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

        {/* Instructions */}
        <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-700 text-center">
            💡 <strong>How to use:</strong> Select crew member → Select form category → Choose "Pre-Fill" (with data) or "Blank" (empty template) → Download
          </p>
        </div>
      </div>
    </div>
  );
}
