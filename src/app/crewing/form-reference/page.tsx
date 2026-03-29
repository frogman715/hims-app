"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { pushAppNotice } from "@/lib/app-notice";

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
      pushAppNotice({
        tone: "warning",
        title: "Crew selection required",
        message: "Select a crew member before downloading a pre-filled form.",
      });
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
      pushAppNotice({
        tone: "error",
        title: "Download failed",
        message: "The form could not be downloaded.",
      });
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
      pushAppNotice({
        tone: "error",
        title: "Download failed",
        message: "The form could not be downloaded.",
      });
    }
  };

  const activeCategory = categories.find((c) => c.categoryCode === activeTab);
  const filteredForms = activeCategory?.forms.filter((form) =>
    form.filename.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm font-semibold text-slate-600">Loading form library...</div>
      </div>
    );
  }

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Reference Library</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Form references</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Download official office templates either as blank forms or pre-filled with crew data.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => router.push("/crewing")}>
            Back to crewing
          </Button>
        </div>
      </section>

      <section className="surface-card p-5">
        <Select
          value={selectedCrewId}
          onChange={(e) => setSelectedCrewId(e.target.value)}
          label="Select crew member for pre-filled forms"
          options={[
            { value: "", label: "Download blank form only" },
            ...crews.map((crew) => ({
              value: crew.id,
              label: `${crew.fullName} (${crew.rank})${crew.passportNumber ? ` - ${crew.passportNumber}` : ""}`,
            })),
          ]}
          helperText={
            selectedCrewId
              ? "Selected crew will auto-fill name, rank, passport, email, phone, and contact details."
              : "Leave blank to download empty templates without crew data."
          }
        />
      </section>

      <section className="surface-card border-amber-200 bg-amber-50 p-4">
          <p className="text-amber-900 font-bold mb-1">⚠️ Download Options:</p>
          <p className="text-amber-800 text-sm">
            <strong>Without Crew Selection:</strong> Download blank form template<br />
            <strong>With Crew Selection:</strong> Form is pre-filled with selected crew&apos;s data (Name, Rank, Passport, Email, Phone, etc)
          </p>
      </section>

      <section className="surface-card p-4">
          <p className="text-slate-900 font-bold mb-1">Reference only</p>
          <p className="text-slate-700 text-sm">
            This page is a document library. It does not replace Prepare Joining, contract approval, or live checklist completion.
          </p>
      </section>

      <section className="surface-card border-sky-200 bg-sky-50 p-4">
          <p className="text-blue-900 font-semibold">
            📋 Total Forms: {categories.reduce((sum, cat) => sum + cat.forms.length, 0)}
          </p>
          <p className="text-blue-800 text-sm mt-1">
            Select a category and download the forms you need
          </p>
      </section>

      <div className="text-sm text-slate-600">
          <span>Form References</span>
          {activeCategory && (
            <>
              <span className="mx-2">/</span>
              <span className="font-bold text-slate-900">{activeCategory.category}</span>
            </>
          )}
        </div>

      <section className="surface-card p-5">
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
      </section>

      <section className="surface-card p-5">
          <Input
            type="text"
            label={`Search in ${activeCategory?.category ?? "selected category"}`}
            placeholder="Type form name to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            helperText="Search by file name within the active category."
          />
      </section>

      {activeCategory && (
          <section className="surface-card border-sky-200 bg-sky-50 p-4">
            <h3 className="font-bold text-slate-900 text-lg mb-2">About {activeCategory.category}</h3>
            <p className="text-slate-700 leading-relaxed text-sm">{activeCategory.description}</p>
          </section>
      )}

      {filteredForms.length > 0 ? (
          <section className="surface-card overflow-hidden">
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
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-emerald-700"
                            title="Download with crew data pre-filled"
                          >
                            <span>✓</span>
                            Pre-Fill
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadBlank(activeTab, form.filename)}
                          className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-sky-700"
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
          </section>
      ) : (
          <section className="surface-card p-8 text-center">
            <p className="text-slate-600 text-lg">
              {searchTerm ? "No forms matching your search" : "No forms available"}
            </p>
          </section>
      )}

      <section className="surface-card p-4">
          <p className="text-sm text-slate-700 text-center">
            💡 <strong>How to use:</strong> Select crew member → Select form category → Choose &quot;Pre-Fill&quot; (with data) or &quot;Blank&quot; (empty template) → Download
          </p>
      </section>
    </div>
  );
}
