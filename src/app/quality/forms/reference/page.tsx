"use client";

import { useState } from "react";
import Link from "next/link";

export default function FormsReferencePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const formCategories = [
    { code: "AD", name: "Administration", icon: "📋", color: "blue" },
    { code: "CR", name: "Crewing", icon: "⚓", color: "cyan" },
    { code: "AC", name: "Accounting", icon: "💰", color: "green" }
  ];

  const forms = [
    // AD Forms
    { code: "HGF-AD-01", title: "Departmental Meeting", category: "AD", file: "HGF-AD-01_DEPARTMENTAL_MEETING.docx" },
    { code: "HGF-AD-02", title: "Management Meeting", category: "AD", file: "HGF-AD-02_MANAGEMENT_MEETING.docx" },
    { code: "HGF-AD-03", title: "Evaluation of Supplier", category: "AD", file: "HGF-AD-03_EVALUATION_OF_SUPPLIER.docx" },
    { code: "HGF-AD-04", title: "Re-Evaluation of Supplier", category: "AD", file: "HGF-AD-04_RE-EVALUATION_OF_SUPPLIER.docx" },
    { code: "HGF-AD-05", title: "Evaluation of Customers", category: "AD", file: "HGF-AD-05_EVALUATION_OF_CUSTOMERS.docx" },
    { code: "HGF-AD-06", title: "Evaluation of Employee", category: "AD", file: "HGF-AD-06_EVALUATION_OF_EMPLOYEE.docx" },
    { code: "HGF-AD-07", title: "Internal Audit Guide", category: "AD", file: "HGF-AD-07_INTERNAL_AUDIT_GUIDE.docx" },
    { code: "HGF-AD-08", title: "Internal Audit Plan", category: "AD", file: "HGF-AD-08_INTERNAL_AUDIT_PLAN.docx" },
    { code: "HGF-AD-09", title: "Internal Audit Report", category: "AD", file: "HGF-AD-09_INTERNAL_AUDIT_REPORT.docx" },
    { code: "HGF-AD-10", title: "Corrective & Preventive Action Request", category: "AD", file: "HGF-AD-10_CORRECTIVE_AND_PREVENTIVE_ACTION_REQUEST.docx" },
    { code: "HGF-AD-11", title: "Corrective & Preventive Action Report", category: "AD", file: "HGF-AD-11_CORRECTIVE_AND_PREVENTIVE_ACTION_REPORT.docx" },
    { code: "HGF-AD-12", title: "Purchase Order", category: "AD", file: "HGF-AD-12_Purchase_Order.xlsx" },
    { code: "HGF-AD-13", title: "Release and Quitclaim", category: "AD", file: "HGF-AD-13_RELEASE_AND_QUITCLAIM.docx" },
    { code: "HGF-AD-14", title: "Orientation for New Employee", category: "AD", file: "HGF-AD-14_ORIENTATION_FOR_NEW_EMPLOYEE.docx" },
    { code: "HGF-AD-15", title: "Report of Non-conformity", category: "AD", file: "HGF-AD-15_Report_of_Non-conformity.docx" },
    { code: "HGF-AD-16", title: "Index", category: "AD", file: "HGF-AD-16_INDEX.docx" },
    { code: "HGF-AD-17", title: "List of Documents for Dispatching", category: "AD", file: "HGF-AD-17_LIST_OF_DOCUMENTS_FOR_DISPATCHING.docx" },
    { code: "HGF-AD-19", title: "List of Record for Control", category: "AD", file: "HGF-AD-19_LIST_OF_RECORD_FOR_CONTROL.docx" },
    { code: "HGF-AD-20", title: "Improvement Plan of the Process", category: "AD", file: "HGF-AD-20_Improvement_Plan_of_the_Process.docx" },
    { code: "HGF-AD-21", title: "Management Plan of the Process", category: "AD", file: "HGF-AD-21_Management_Plan_of_the_Process.docx" },
    { code: "HGF-AD-22", title: "Management Review Result Report", category: "AD", file: "HGF-AD-22_Management_Review_Result_Report.docx" },
    { code: "HGF-AD-23", title: "Management Review Record", category: "AD", file: "HGF-AD-23_Management_Review_Record.docx" },
    { code: "HGF-AD-24", title: "Management Review Report", category: "AD", file: "HGF-AD-24_Management_Review_Report.docx" },
    { code: "HGF-AD-25", title: "Manpower Requisition Form", category: "AD", file: "HGF-AD-25_Manpower_Requisition_Form.docx" },

    // CR Forms
    { code: "HGF-CR-01", title: "Document Check List", category: "CR", file: "HGF-CR-01_DOCUMENT_CHECK_LIST.xlsx" },
    { code: "HGF-CR-02", title: "Application for Employment", category: "CR", file: "HGF-CR-02_APPLICATION_FOR_EMPLOYMENT.xlsx" },
    { code: "HGF-CR-03", title: "Checklist for Departing Crew", category: "CR", file: "HGF-CR-03_CHECKLIST_FOR_DEPARTING_CREW.docx" },
    { code: "HGF-CR-04", title: "De-briefing Form", category: "CR", file: "HGF-CR-04_DE-BRIEFING_FORM.xlsx" },
    { code: "HGF-CR-05", title: "Affidavit of Undertaking", category: "CR", file: "HGF-CR-05_AFFIDAVIT_OF_UNDERTAKING.docx" },
    { code: "HGF-CR-06", title: "Written Oath about Alcohol/Drug", category: "CR", file: "HGF-CR-06_Written_oath_about_alcohol_drug.docx" },
    { code: "HGF-CR-07", title: "Crew Vacation Plan", category: "CR", file: "HGF-CR-07_CREW_VACATION_PLAN.docx" },
    { code: "HGF-CR-08", title: "Crew Evaluation Report", category: "CR", file: "HGF-CR-08_CREW_EVALUATION_REPORT.docx" },
    { code: "HGF-CR-09", title: "Interview List", category: "CR", file: "HGF-CR-09_INTERVIEW_LIST.xlsx" },
    { code: "HGF-CR-10", title: "Contract of Employment", category: "CR", file: "HGF-CR-10_CONTRACT_OF_EMPLOYMENT.docx" },
    { code: "HGF-CR-11", title: "Report of On-board Complaint", category: "CR", file: "HGF-CR-11_Report_of_on_board_Complaint.docx" },
    { code: "HGF-CR-12", title: "Crew Education Training Plan Result", category: "CR", file: "HGF-CR-12_Crew_Education_Training_Plan_Result_Report.docx" },
    { code: "HGF-CR-13", title: "Disembarkation Application", category: "CR", file: "HGF-CR-13_Disembarkation_Application.docx" },
    { code: "HGF-CR-14", title: "Management List of Seafarer Documents", category: "CR", file: "HGF-CR-14_MANAGEMENT_LIST_OF_SEAFARER_DOCUMENTS.xlsx" },
    { code: "HGF-CR-15", title: "Result of Medical Advice", category: "CR", file: "HGF-CR-15_Result_of_Medical_Advice.docx" },
    { code: "HGF-CR-16", title: "Medical Treatment Request", category: "CR", file: "HGF-CR-16_Medical_Treatment_Request.docx" },
    { code: "HGF-CR-17", title: "Notice of Crew On/Off Signing", category: "CR", file: "HGF-CR-17_NOTICE_OF_CREW_ON_OFF_SIGNING.xlsx" },
    { code: "HGF-CR-18", title: "Monthly Checklist of Crew Replacement", category: "CR", file: "HGF-CR-18_Monthly_Check_Lis_of_Crew_Replacement_ON_OFF.xlsx" },

    // AC Forms
    { code: "HGF-AC-01", title: "Crew Wage Payment Record", category: "AC", file: "HGF-AC-01_CREW_WAGE_PAMENT_RECORD.xlsx" },
    { code: "HGF-AC-02", title: "Appointments Official Order", category: "AC", file: "HGF-AC-02_APPOINTMENTS_OFFICIAL_ORDER.xlsx" },
    { code: "HGF-AC-03", title: "Petty Cash Voucher", category: "AC", file: "HGF-AC-03_Petty_Cash_Voucher.xlsx" },
    { code: "HGF-AC-04", title: "Allotment", category: "AC", file: "HGF-AC-04_Allotment.xlsx" },
    { code: "HGF-AC-05", title: "Statement of Account", category: "AC", file: "HGF-AC-05_STATEMENT_OF_ACCOUNT.docx" },
    { code: "HGF-AC-06", title: "Monthly Cash Receipt Disbursement", category: "AC", file: "HGF-AC-06_MONTHLY_CASH_RECEIPT_DISBURSEMENT.xlsx" },
    { code: "HGF-AC-07", title: "Monthly Debit Note", category: "AC", file: "HGF-AC-07_MONTHLY_DEBIT_NOTE.docx" }
  ];

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || form.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1">
            <li><Link href="/dashboard" className="text-gray-700 hover:text-blue-700">Dashboard</Link></li>
            <li><Link href="/quality" className="text-gray-700 hover:text-blue-700 ml-1">Quality</Link></li>
            <li><span className="ml-1 text-gray-500">Forms Reference</span></li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HGQS Forms Library</h1>
          <p className="text-gray-700 mt-1">ISO 9001:2015 Quality Management System Forms</p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search forms by code or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCategoryFilter("ALL")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  categoryFilter === "ALL"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Forms ({forms.length})
              </button>
            </div>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {formCategories.map((cat) => {
            const count = forms.filter(f => f.category === cat.code).length;
            return (
              <button
                key={cat.code}
                onClick={() => setCategoryFilter(cat.code)}
                className={`p-6 rounded-xl text-left transition-all ${
                  categoryFilter === cat.code
                    ? `bg-${cat.color}-600 text-white shadow-lg`
                    : "bg-white border-2 border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="text-xl font-extrabold mb-2">{cat.name}</h3>
                <p className={`text-sm ${categoryFilter === cat.code ? `text-${cat.color}-100` : "text-gray-700"}`}>
                  {count} forms available
                </p>
              </button>
            );
          })}
        </div>

        {/* Forms Grid */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
            {categoryFilter === "ALL" ? "All Forms" : `${formCategories.find(c => c.code === categoryFilter)?.name} Forms`}
            <span className="text-gray-500 text-lg ml-2">({filteredForms.length})</span>
          </h2>

          {filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No forms found</h3>
              <p className="text-gray-700">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredForms.map((form) => {
                const category = formCategories.find(c => c.code === form.category);
                return (
                  <div
                    key={form.code}
                    className="border-2 border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{category?.icon}</div>
                      <span className={`px-4 py-2 text-xs font-semibold rounded bg-${category?.color}-100 text-${category?.color}-800`}>
                        {form.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{form.code}</h3>
                    <p className="text-sm text-gray-800 mb-4">{form.title}</p>
                    <a
                      href={`/form_reference/${form.category}/${form.file}`}
                      download
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium w-full justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 bg-gradient-to-r from-blue-900 to-cyan-900 rounded-xl shadow-2xl p-8 text-white">
          <h2 className="text-2xl font-extrabold mb-4">Form Usage Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">📋 Administration Forms (AD)</h3>
              <p className="text-blue-100">
                Internal audits, management meetings, supplier evaluations, employee assessments, and quality system documentation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⚓ Crewing Forms (CR)</h3>
              <p className="text-cyan-100">
                Crew recruitment, employment contracts, medical records, on-boarding/off-boarding procedures, and training documentation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">💰 Accounting Forms (AC)</h3>
              <p className="text-blue-100">
                Wage payments, allotments, cash vouchers, financial statements, and crew payment records.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">✅ Form Requirements</h3>
              <p className="text-cyan-100">
                All forms must be completed accurately, signed by authorized personnel, and filed according to HGQS document control procedures.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>HGQS Procedures Manual | ISO 9001:2015 Quality Management System Forms Library</p>
        </div>
      </div>
    </div>
  );
}
