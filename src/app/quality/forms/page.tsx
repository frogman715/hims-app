'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";

interface HGQSForm {
  id: string;
  category: 'AC' | 'AD' | 'CR' | 'PRINCIPAL';
  principal?: string; // For principal-specific forms
  name: string;
  description: string;
  version: string;
  lastUpdated: string;
}

interface Crew {
  id: string;
  fullName: string;
  rank: string;
  status: string;
}

export default function HGQSFormsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [forms, setForms] = useState<HGQSForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'AC' | 'AD' | 'CR' | 'PRINCIPAL' | 'ALL'>('ALL');
  const [crews, setCrews] = useState<Crew[]>([]);
  const [showCrewSelector, setShowCrewSelector] = useState(false);
  const [selectedForm, setSelectedForm] = useState<HGQSForm | null>(null);
  const [showOnlineForm, setShowOnlineForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [currentFormId, setCurrentFormId] = useState<string>('');

  const loadForms = useCallback(async () => {
    // Mock data untuk demonstrasi - nanti bisa diganti dengan API call
    const mockForms: HGQSForm[] = [
      // AC FORMS - Accounting & Finance
      {
        id: 'ac-01',
        category: 'AC',
        name: 'HGF-AC-01 Crew Wage Payment Record',
        description: 'Record of crew salary payments and wage components',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'ac-02',
        category: 'AC',
        name: 'HGF-AC-02 Appointments & Official Order',
        description: 'Official appointment letters and orders',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'ac-03',
        category: 'AC',
        name: 'HGF-AC-03 Petty Cash Voucher',
        description: 'Petty cash expenses and reimbursements',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'ac-04',
        category: 'AC',
        name: 'HGF-AC-04 Allotment Form',
        description: 'Crew allotment and family allowance forms',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'ac-05',
        category: 'AC',
        name: 'HGF-AC-05 Statement of Account',
        description: 'Monthly account statements and balances',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'ac-06',
        category: 'AC',
        name: 'HGF-AC-06 Monthly Cash Receipt & Disbursement',
        description: 'Monthly cash flow and transaction records',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'ac-07',
        category: 'AC',
        name: 'HGF-AC-07 Monthly Debit Note',
        description: 'Debit notes and account adjustments',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },

      // AD FORMS - Administrative Documents
      {
        id: 'ad-01',
        category: 'AD',
        name: 'HGF-AD-01 Departmental Meeting',
        description: 'Department meeting minutes and records',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'ad-07',
        category: 'AD',
        name: 'HGF-AD-07 Internal Audit Guide',
        description: 'Guidelines for conducting internal audits',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'ad-08',
        category: 'AD',
        name: 'HGF-AD-08 Internal Audit Plan',
        description: 'Annual internal audit planning document',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'ad-09',
        category: 'AD',
        name: 'HGF-AD-09 Internal Audit Report',
        description: 'Internal audit findings and recommendations',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'ad-10',
        category: 'AD',
        name: 'HGF-AD-10 Corrective & Preventive Action Request',
        description: 'CAPA request and tracking form',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'ad-12',
        category: 'AD',
        name: 'HGF-AD-12 Purchase Order',
        description: 'Purchase order and procurement forms',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'ad-14',
        category: 'AD',
        name: 'HGF-AD-14 Orientation for New Employee',
        description: 'New employee orientation checklist',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },

      // CR FORMS - Crew Related
      {
        id: 'cr-02',
        category: 'CR',
        name: 'HGF-CR-02 Application for Employment',
        description: 'Job application and recruitment forms',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'cr-03',
        category: 'CR',
        name: 'HGF-CR-03 Checklist for Departing Crew',
        description: 'Crew disembarkation and handover checklist',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'cr-08',
        category: 'CR',
        name: 'HGF-CR-08 Crew Evaluation Report',
        description: 'Crew performance evaluation forms',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'cr-10',
        category: 'CR',
        name: 'HGF-CR-10 Contract of Employment',
        description: 'Employment contracts and agreements',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'cr-13',
        category: 'CR',
        name: 'HGF-CR-13 Disembarkation Application',
        description: 'Crew sign-off and disembarkation requests',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },

      // PRINCIPAL FORMS - Lundqvist Rederierna (Crude Oil Owner)
      {
        id: 'lr-01',
        category: 'PRINCIPAL',
        principal: 'lundqvist_rederierna',
        name: 'Application for Lundqvist Rederierna',
        description: 'Job application form for Lundqvist Rederierna positions',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'lr-02',
        category: 'PRINCIPAL',
        principal: 'lundqvist_rederierna',
        name: 'Confirmation for Understanding Owner SMS',
        description: 'Confirmation of understanding company safety management system',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'lr-03',
        category: 'PRINCIPAL',
        principal: 'lundqvist_rederierna',
        name: 'Medical History Checking List',
        description: 'Comprehensive medical history checklist for seafarers',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'lr-04',
        category: 'PRINCIPAL',
        principal: 'lundqvist_rederierna',
        name: 'Next of Kin Declaration',
        description: 'Emergency contact and next of kin information form',
        version: '1.0',
        lastUpdated: '2025-11-28'
      },
      {
        id: 'lr-05',
        category: 'PRINCIPAL',
        principal: 'lundqvist_rederierna',
        name: 'Seafarer Employment Contract',
        description: 'Employment contract specific to Lundqvist Rederierna',
        version: '1.0',
        lastUpdated: '2025-11-28'
      }
    ];

    setForms(mockForms);

    // Load crew data for auto-population
    try {
      const crewResponse = await fetch('/api/crew');
      if (crewResponse.ok) {
        const crewData = await crewResponse.json();
        setCrews(crewData.map((crew: { id: number; fullName: string; rank: string; status: string }) => ({
          id: crew.id,
          fullName: crew.fullName,
          rank: crew.rank,
          status: crew.status
        })));
      }
    } catch (error) {
      console.error('Failed to load crew data:', error);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    const run = async () => {
      await loadForms();
    };

    void run();
  }, [session, status, router, loadForms]);

  const generateForm = async (formId: string, formName: string) => {
    // Check if form needs crew data (AC and CR forms typically do)
    const needsCrewData = formId.startsWith('ac-') || formId.startsWith('cr-') || formId.startsWith('lr-');

    if (needsCrewData && crews.length > 0) {
      // Show crew selector
      const category = (formId.startsWith('ac-') ? 'AC' : formId.startsWith('cr-') ? 'CR' : 'PRINCIPAL') as 'AC' | 'CR' | 'PRINCIPAL';
      setSelectedForm({ id: formId, category, name: formName, description: '', version: '', lastUpdated: '' });
      setShowCrewSelector(true);
    } else {
      // Generate form without crew data
      await generateFormWithData(formId, formName, null);
    }
  };

  const generateFormWithData = async (formId: string, formName: string, crewId: string | null) => {
    try {
      const response = await fetch("/api/quality/forms/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formId,
          formName,
          crewId,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const filename = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || `${formName}.pdf`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Failed to generate form");
      }
    } catch (error) {
      console.error("Error generating form:", error);
    }
  };

  const openOnlineForm = (formId: string) => {
    setCurrentFormId(formId);
    setFormData({});
    setShowOnlineForm(true);
  };

  const closeOnlineForm = () => {
    setShowOnlineForm(false);
    setCurrentFormId('');
    setFormData({});
  };

  const getFormName = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    return form?.name || 'Form';
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/quality/forms/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formId: currentFormId,
          formName: getFormName(currentFormId),
          formData,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const filename = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || `${getFormName(currentFormId)}.pdf`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        closeOnlineForm();
      } else {
        console.error("Failed to generate form");
      }
    } catch (error) {
      console.error("Error generating form:", error);
    }
  };

  const handleCrewSelect = async (crew: Crew) => {
    if (selectedForm) {
      await generateFormWithData(selectedForm.id, selectedForm.name, crew.id);
      setShowCrewSelector(false);
      setSelectedForm(null);
    }
  };

  const filteredForms = selectedCategory === 'ALL'
    ? forms
    : forms.filter(form => form.category === selectedCategory);

  const renderFormFields = (formId: string) => {
    const updateFormData = (field: string, value: string | number | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

    switch (formId) {
      case 'lr-01': // Application for Lundqvist Rederierna
        return (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-800 mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Family Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.familyName || ''}
                    onChange={(e) => updateFormData('familyName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Given Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.givenName || ''}
                    onChange={(e) => updateFormData('givenName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Middle Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.middleName || ''}
                    onChange={(e) => updateFormData('middleName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Birth Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.birthDate || ''}
                    onChange={(e) => updateFormData('birthDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Position Applied For</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.position || ''}
                    onChange={(e) => updateFormData('position', e.target.value)}
                    required
                  >
                    <option value="">Select position</option>
                    <option value="Master">Master</option>
                    <option value="Chief Officer">Chief Officer</option>
                    <option value="Second Officer">Second Officer</option>
                    <option value="Third Officer">Third Officer</option>
                    <option value="Chief Engineer">Chief Engineer</option>
                    <option value="Second Engineer">Second Engineer</option>
                    <option value="Third Engineer">Third Engineer</option>
                    <option value="Fourth Engineer">Fourth Engineer</option>
                    <option value="Able Seaman">Able Seaman</option>
                    <option value="Ordinary Seaman">Ordinary Seaman</option>
                    <option value="Bosun">Bosun</option>
                    <option value="Pumpman">Pumpman</option>
                    <option value="Fitter">Fitter</option>
                    <option value="Oiler">Oiler</option>
                    <option value="Wiper">Wiper</option>
                    <option value="Cook">Cook</option>
                    <option value="Steward">Steward</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">P/M (Permanent/Manning)</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.pm || ''}
                    onChange={(e) => updateFormData('pm', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="P">Permanent</option>
                    <option value="M">Manning</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-800 mb-3">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Last School</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.lastSchool || ''}
                    onChange={(e) => updateFormData('lastSchool', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Course</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.course || ''}
                    onChange={(e) => updateFormData('course', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Duration</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.duration || ''}
                    onChange={(e) => updateFormData('duration', e.target.value)}
                    placeholder="e.g., 4 years"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Height/Weight</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.heightWeight || ''}
                    onChange={(e) => updateFormData('heightWeight', e.target.value)}
                    placeholder="e.g., 175cm/70kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Telephone No.</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.telephone || ''}
                    onChange={(e) => updateFormData('telephone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Civil Status</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.civilStatus || ''}
                    onChange={(e) => updateFormData('civilStatus', e.target.value)}
                  >
                    <option value="">Select status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ship Experience Section - Dynamic */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-800 mb-3">Ship Experience</h4>
              <div className="space-y-3">
                {(formData.shipExperiences as unknown[] || []).map((experience: unknown, index: number) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-sm text-gray-700">Experience {index + 1}</h5>
                      <button
                        type="button"
                        onClick={() => {
                          const experiences = formData.shipExperiences || [];
                          experiences.splice(index, 1);
                          updateFormData('shipExperiences', [...experiences]);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Vessel Name</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={experience.vesselName || ''}
                          onChange={(e) => {
                            const experiences = formData.shipExperiences || [];
                            experiences[index] = { ...experiences[index], vesselName: e.target.value };
                            updateFormData('shipExperiences', [...experiences]);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Rank/Position</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={experience.rank || ''}
                          onChange={(e) => {
                            const experiences = formData.shipExperiences || [];
                            experiences[index] = { ...experiences[index], rank: e.target.value };
                            updateFormData('shipExperiences', [...experiences]);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Sign On Date</label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={experience.signOn || ''}
                          onChange={(e) => {
                            const experiences = formData.shipExperiences || [];
                            experiences[index] = { ...experiences[index], signOn: e.target.value };
                            updateFormData('shipExperiences', [...experiences]);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Sign Off Date</label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={experience.signOff || ''}
                          onChange={(e) => {
                            const experiences = formData.shipExperiences || [];
                            experiences[index] = { ...experiences[index], signOff: e.target.value };
                            updateFormData('shipExperiences', [...experiences]);
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Vessel Type</label>
                        <select
                          className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={experience.vesselType || ''}
                          onChange={(e) => {
                            const experiences = formData.shipExperiences || [];
                            experiences[index] = { ...experiences[index], vesselType: e.target.value };
                            updateFormData('shipExperiences', [...experiences]);
                          }}
                        >
                          <option value="">Select type</option>
                          <option value="Container">Container</option>
                          <option value="Bulk Carrier">Bulk Carrier</option>
                          <option value="Tanker">Tanker</option>
                          <option value="Crude Oil Tanker">Crude Oil Tanker</option>
                          <option value="Product Tanker">Product Tanker</option>
                          <option value="Chemical Tanker">Chemical Tanker</option>
                          <option value="LNG Carrier">LNG Carrier</option>
                          <option value="LPG Carrier">LPG Carrier</option>
                          <option value="Passenger Ship">Passenger Ship</option>
                          <option value="Ro-Ro">Ro-Ro</option>
                          <option value="General Cargo">General Cargo</option>
                          <option value="Reefer">Reefer</option>
                          <option value="Tug Boat">Tug Boat</option>
                          <option value="Barge">Barge</option>
                          <option value="Offshore">Offshore</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">GRT</label>
                        <input
                          type="number"
                          className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={experience.grt || ''}
                          onChange={(e) => {
                            const experiences = formData.shipExperiences || [];
                            experiences[index] = { ...experiences[index], grt: e.target.value };
                            updateFormData('shipExperiences', [...experiences]);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Principal/Agency</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={experience.principal || ''}
                          onChange={(e) => {
                            const experiences = formData.shipExperiences || [];
                            experiences[index] = { ...experiences[index], principal: e.target.value };
                            updateFormData('shipExperiences', [...experiences]);
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Reason for Leaving</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        value={experience.reasonLeaving || ''}
                        onChange={(e) => {
                          const experiences = formData.shipExperiences || [];
                          experiences[index] = { ...experiences[index], reasonLeaving: e.target.value };
                          updateFormData('shipExperiences', [...experiences]);
                        }}
                        placeholder="e.g., Contract completed, Better opportunity, etc."
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const experiences = formData.shipExperiences || [];
                    experiences.push({
                      vesselName: '',
                      rank: '',
                      signOn: '',
                      signOff: '',
                      vesselType: '',
                      grt: '',
                      principal: '',
                      reasonLeaving: ''
                    });
                    updateFormData('shipExperiences', [...experiences]);
                  }}
                  className="w-full py-2 px-4 border border-dashed border-gray-400 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                >
                  + Add Ship Experience
                </button>
              </div>
            </div>

            {/* Personal Qualification */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-800 mb-3">Personal Qualification</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Job Thinking (Satisfaction, Planning)</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.jobThinking || ''}
                    onChange={(e) => updateFormData('jobThinking', e.target.value)}
                  >
                    <option value="">Select evaluation</option>
                    <option value="A">A (10 points)</option>
                    <option value="B">B (8 points)</option>
                    <option value="C">C (6 points)</option>
                    <option value="D">D (4 points)</option>
                    <option value="E">E (2 points)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Adaptation (Responsibility, Patience)</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.adaptation || ''}
                    onChange={(e) => updateFormData('adaptation', e.target.value)}
                  >
                    <option value="">Select evaluation</option>
                    <option value="A">A (10 points)</option>
                    <option value="B">B (8 points)</option>
                    <option value="C">C (6 points)</option>
                    <option value="D">D (4 points)</option>
                    <option value="E">E (2 points)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Carrier (Shifting co., Service Length)</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.carrier || ''}
                    onChange={(e) => updateFormData('carrier', e.target.value)}
                  >
                    <option value="">Select evaluation</option>
                    <option value="A">A (10 points)</option>
                    <option value="B">B (8 points)</option>
                    <option value="C">C (6 points)</option>
                    <option value="D">D (4 points)</option>
                    <option value="E">E (2 points)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">English (Hearing, Speaking, Reading, Writing)</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.english || ''}
                    onChange={(e) => updateFormData('english', e.target.value)}
                  >
                    <option value="">Select evaluation</option>
                    <option value="A">A (10 points)</option>
                    <option value="B">B (8 points)</option>
                    <option value="C">C (6 points)</option>
                    <option value="D">D (4 points)</option>
                    <option value="E">E (2 points)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Personal Particulars */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-800 mb-3">Personal Particulars</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Appearance (Posture, Expression)</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.appearance || ''}
                    onChange={(e) => updateFormData('appearance', e.target.value)}
                  >
                    <option value="">Select evaluation</option>
                    <option value="A">A (10 points)</option>
                    <option value="B">B (8 points)</option>
                    <option value="C">C (6 points)</option>
                    <option value="D">D (4 points)</option>
                    <option value="E">E (2 points)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Family Life (Status, Growing Process)</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.familyLife || ''}
                    onChange={(e) => updateFormData('familyLife', e.target.value)}
                  >
                    <option value="">Select evaluation</option>
                    <option value="A">A (10 points)</option>
                    <option value="B">B (8 points)</option>
                    <option value="C">C (6 points)</option>
                    <option value="D">D (4 points)</option>
                    <option value="E">E (2 points)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Social Life (Social Activity & Carrier)</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.socialLife || ''}
                    onChange={(e) => updateFormData('socialLife', e.target.value)}
                  >
                    <option value="">Select evaluation</option>
                    <option value="A">A (10 points)</option>
                    <option value="B">B (8 points)</option>
                    <option value="C">C (6 points)</option>
                    <option value="D">D (4 points)</option>
                    <option value="E">E (2 points)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Ambition (Positiveness, Confidence)</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.ambition || ''}
                    onChange={(e) => updateFormData('ambition', e.target.value)}
                  >
                    <option value="">Select evaluation</option>
                    <option value="A">A (10 points)</option>
                    <option value="B">B (8 points)</option>
                    <option value="C">C (6 points)</option>
                    <option value="D">D (4 points)</option>
                    <option value="E">E (2 points)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Knowledge (Technical, Skill, Carrier)</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.knowledge || ''}
                    onChange={(e) => updateFormData('knowledge', e.target.value)}
                  >
                    <option value="">Select evaluation</option>
                    <option value="A">A (10 points)</option>
                    <option value="B">B (8 points)</option>
                    <option value="C">C (6 points)</option>
                    <option value="D">D (4 points)</option>
                    <option value="E">E (2 points)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Sociality (Courtesy, Self-control)</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.sociality || ''}
                    onChange={(e) => updateFormData('sociality', e.target.value)}
                  >
                    <option value="">Select evaluation</option>
                    <option value="A">A (10 points)</option>
                    <option value="B">B (8 points)</option>
                    <option value="C">C (6 points)</option>
                    <option value="D">D (4 points)</option>
                    <option value="E">E (2 points)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Identification of Carrier */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-800 mb-3">Identification of Carrier</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Last Company</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.lastCompany || ''}
                    onChange={(e) => updateFormData('lastCompany', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Last Rank</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.lastRank || ''}
                    onChange={(e) => updateFormData('lastRank', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Total Carrier (YY-MM-DD)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.totalCarrier || ''}
                    onChange={(e) => updateFormData('totalCarrier', e.target.value)}
                    placeholder="e.g., 05-06-15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Last Carrier (YY-MM-DD)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.lastCarrier || ''}
                    onChange={(e) => updateFormData('lastCarrier', e.target.value)}
                    placeholder="e.g., 02-03-10"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Own Disembark</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.ownDisembark || ''}
                  onChange={(e) => updateFormData('ownDisembark', e.target.value)}
                  placeholder="Reason for leaving last employment"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Reward/Punish</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.rewardPunish || ''}
                  onChange={(e) => updateFormData('rewardPunish', e.target.value)}
                  placeholder="Any rewards or disciplinary actions"
                />
              </div>
            </div>

            {/* Recommender */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-800 mb-3">Recommender</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Section</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.recommenderSection || ''}
                    onChange={(e) => updateFormData('recommenderSection', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Rank/Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.recommenderRankName || ''}
                    onChange={(e) => updateFormData('recommenderRankName', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Familiarization of Owner&apos;s Manual */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-800 mb-3">Familiarization of Owner&apos;s Manual</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Date of Education</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.educationDate || ''}
                    onChange={(e) => updateFormData('educationDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Kind of Manuals</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.manualType || ''}
                    onChange={(e) => updateFormData('manualType', e.target.value)}
                  >
                    <option value="">Select manual type</option>
                    <option value="ISM Shipboard manual">ISM Shipboard manual</option>
                    <option value="ISM Safety manual">ISM Safety manual</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actual Onboard Time */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-800 mb-3">Actual Onboard Time</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Actual Onboard Time (YY-MM-DD)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.actualOnboardTime || ''}
                    onChange={(e) => updateFormData('actualOnboardTime', e.target.value)}
                    placeholder="e.g., 08-11-25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Actual Onboard Time in Rank (YY-MM-DD)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.onboardTimeInRank || ''}
                    onChange={(e) => updateFormData('onboardTimeInRank', e.target.value)}
                    placeholder="e.g., 03-08-15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Actual Onboard Time in Crude Tankers (YY-MM-DD)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.onboardTimeCrude || ''}
                    onChange={(e) => updateFormData('onboardTimeCrude', e.target.value)}
                    placeholder="e.g., 05-02-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Actual Onboard Time in Any Tankers (YY-MM-DD)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.onboardTimeAnyTankers || ''}
                    onChange={(e) => updateFormData('onboardTimeAnyTankers', e.target.value)}
                    placeholder="e.g., 06-05-20"
                  />
                </div>
              </div>
            </div>

            {/* Documents Checklist */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-800 mb-3">Documents Checklist</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'National Seaman Book',
                  'National License',
                  'Flag State Seaman Book (I.D Book)',
                  'Flag State License',
                  'Flag State Special Qualification for Tanker Vessel Service',
                  'National Medical Exam. Certificate',
                  'Flag State Medical Exam. Certificate',
                  'Passport',
                  'Ratings as Able Seafarer Deck',
                  'Flag State Special Qualification for Ratings (STCW95 Endorsement)',
                  'National GMDSS-GOC',
                  'Flag State GMDSS-GOC',
                  'Radar Training Course',
                  'ARPA Training Course',
                  'Safety Course, Basic',
                  'Safety Course, Survival Craft',
                  'Safety Course, Fire Fighting',
                  'Safety Course, First Aid',
                  'Safety Course, Rescue Boat',
                  'Tanker Course, Familiarization',
                  'Tanker Course, Advanced Oil',
                  'Tanker Course, Advanced Chemical',
                  'Vaccination - Y. Fever',
                  'Vaccination - Cholera',
                  'Drug and Alcohol Test',
                  'Schengen Visa',
                  'Packed Dangerous Cargo',
                  'Pollution Prevention Course',
                  'Medical Care Course',
                  'Senior Officer\'s Refresher Course',
                  'Ship Handling Simulation',
                  'ERM Course',
                  'Bridge Team/Resource Management',
                  'ECDIS',
                  'SDSD',
                  'ISPS / SSO Course',
                  'Personal Employment Contract',
                  'Authentication for Licenses and Certificates'
                ].map((doc, index) => (
                  <label key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData[`doc_${index}`] || false}
                      onChange={(e) => updateFormData(`doc_${index}`, e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">{doc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Interview Evaluation */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-800 mb-3">Interview Evaluation</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Result (Items 1-3)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.result13 || ''}
                    onChange={(e) => updateFormData('result13', e.target.value)}
                    placeholder="Points out of 100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Final Result</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.finalResult || ''}
                    onChange={(e) => updateFormData('finalResult', e.target.value)}
                    placeholder="Points out of 100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Judgement</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.judgement || ''}
                    onChange={(e) => updateFormData('judgement', e.target.value)}
                  >
                    <option value="">Select judgement</option>
                    <option value="FIT">FIT</option>
                    <option value="NOT FIT">NOT FIT</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Interviewer Information</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Main Interviewer Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={formData.mainInterviewerName || ''}
                      onChange={(e) => updateFormData('mainInterviewerName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Main Interviewer Rank</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={formData.mainInterviewerRank || ''}
                      onChange={(e) => updateFormData('mainInterviewerRank', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Sub Interviewer Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={formData.subInterviewerName || ''}
                      onChange={(e) => updateFormData('subInterviewerName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Sub Interviewer Rank</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={formData.subInterviewerRank || ''}
                      onChange={(e) => updateFormData('subInterviewerRank', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Declaration */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-800 mb-3">Legal Declaration</h4>
              <div className="space-y-3">
                <div>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      className="mr-2 mt-1"
                      checked={formData.certifyInformation || false}
                      onChange={(e) => updateFormData('certifyInformation', e.target.checked)}
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I HEREBY CERTIFY THAT ALL INFORMATIONS WHICH I HAVE PROVIDED HEREIN ARE TRUE AND CORRECT. ANY MISREPRESENTATION THEREOF SHALL BE A GROUND FOR MY DISMISSAL IN WHICH CASE THE JOINING AND REPATRIATION COSTS SHALL BE ON ACCOUNT OF THE UNDERSIGNED.
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Who recommended you to this company?</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.recommendedBy || ''}
                    onChange={(e) => updateFormData('recommendedBy', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Have you ever been sued in court or before any Administrative body?</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.suedInCourt || ''}
                    onChange={(e) => updateFormData('suedInCourt', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                {formData.suedInCourt === 'yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">If &quot;yes&quot;, give particulars</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.suedParticulars || ''}
                      onChange={(e) => updateFormData('suedParticulars', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'lr-02': // Confirmation for Understanding Owner SMS
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.fullName || ''}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Position</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.position || ''}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Date of Confirmation</label>
              <input
                type="date"
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.confirmationDate || ''}
                onChange={(e) => updateFormData('confirmationDate', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.understandSMS || false}
                  onChange={(e) => updateFormData('understandSMS', e.target.checked)}
                  required
                />
                <span className="text-sm text-gray-700">I confirm that I have read and understood the Lundqvist Rederierna Safety Management System</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.agreeToComply || false}
                  onChange={(e) => updateFormData('agreeToComply', e.target.checked)}
                  required
                />
                <span className="text-sm text-gray-700">I agree to comply with all safety procedures and regulations</span>
              </label>
            </div>
          </div>
        );

      case 'lr-03': // Medical History Checking List
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.fullName || ''}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Date of Birth</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Medical History</h4>
              {[
                'Heart disease or cardiovascular problems',
                'Diabetes or blood sugar issues',
                'Asthma or respiratory problems',
                'Epilepsy or seizures',
                'Mental health conditions',
                'Allergies (specify)',
                'Previous surgeries',
                'Current medications'
              ].map((condition, index) => (
                <div key={index}>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData[`condition_${index}`] || false}
                      onChange={(e) => updateFormData(`condition_${index}`, e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">{condition}</span>
                  </label>
                  {condition.includes('specify') && formData[`condition_${index}`] && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      className="ml-6 mt-1 w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={formData[`condition_${index}_details`] || ''}
                      onChange={(e) => updateFormData(`condition_${index}_details`, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'lr-04': // Next of Kin Declaration
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Employee Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.employeeName || ''}
                  onChange={(e) => updateFormData('employeeName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Relationship</label>
                <select
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.relationship || ''}
                  onChange={(e) => updateFormData('relationship', e.target.value)}
                  required
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Next of Kin Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.nextOfKinName || ''}
                  onChange={(e) => updateFormData('nextOfKinName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Contact Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.contactNumber || ''}
                  onChange={(e) => updateFormData('contactNumber', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Address</label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.address || ''}
                onChange={(e) => updateFormData('address', e.target.value)}
                required
              />
            </div>
          </div>
        );

      case 'lr-05': // Seafarer Employment Contract
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Employee Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.employeeName || ''}
                  onChange={(e) => updateFormData('employeeName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Position</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.position || ''}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Monthly Salary (USD)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.salary || ''}
                  onChange={(e) => updateFormData('salary', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Contract Duration (months)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.contractDuration || ''}
                  onChange={(e) => updateFormData('contractDuration', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Start Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.startDate || ''}
                  onChange={(e) => updateFormData('startDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">End Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.endDate || ''}
                  onChange={(e) => updateFormData('endDate', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.agreeToTerms || false}
                  onChange={(e) => updateFormData('agreeToTerms', e.target.checked)}
                  required
                />
                <span className="text-sm text-gray-700">I agree to the terms and conditions of this employment contract</span>
              </label>
            </div>
          </div>
        );

      case 'cr-02': // Application for Employment
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.fullName || ''}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Date of Birth</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Position Applied For</label>
                <select
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.position || ''}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  required
                >
                  <option value="">Select position</option>
                  <option value="Master">Master</option>
                  <option value="Chief Officer">Chief Officer</option>
                  <option value="Second Officer">Second Officer</option>
                  <option value="Third Officer">Third Officer</option>
                  <option value="Chief Engineer">Chief Engineer</option>
                  <option value="Second Engineer">Second Engineer</option>
                  <option value="Third Engineer">Third Engineer</option>
                  <option value="Fourth Engineer">Fourth Engineer</option>
                  <option value="Able Seaman">Able Seaman</option>
                  <option value="Ordinary Seaman">Ordinary Seaman</option>
                  <option value="Bosun">Bosun</option>
                  <option value="Pumpman">Pumpman</option>
                  <option value="Fitter">Fitter</option>
                  <option value="Oiler">Oiler</option>
                  <option value="Wiper">Wiper</option>
                  <option value="Cook">Cook</option>
                  <option value="Steward">Steward</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Contact Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.contactNumber || ''}
                  onChange={(e) => updateFormData('contactNumber', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Email Address</label>
              <input
                type="email"
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.email || ''}
                onChange={(e) => updateFormData('email', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Address</label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.address || ''}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="Complete address"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Nationality</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.nationality || ''}
                  onChange={(e) => updateFormData('nationality', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Marital Status</label>
                <select
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.maritalStatus || ''}
                  onChange={(e) => updateFormData('maritalStatus', e.target.value)}
                >
                  <option value="">Select status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Previous Experience</label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.experience || ''}
                onChange={(e) => updateFormData('experience', e.target.value)}
                placeholder="Describe your previous maritime experience..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Expected Salary (USD)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.expectedSalary || ''}
                  onChange={(e) => updateFormData('expectedSalary', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Available Start Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.availableDate || ''}
                  onChange={(e) => updateFormData('availableDate', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.agreeToTerms || false}
                  onChange={(e) => updateFormData('agreeToTerms', e.target.checked)}
                  required
                />
                <span className="text-sm text-gray-700">I certify that all information provided is true and correct</span>
              </label>
            </div>
          </div>
        );

      case 'cr-03': // Checklist for Departing Crew
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Crew Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.crewName || ''}
                  onChange={(e) => updateFormData('crewName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Position/Rank</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.position || ''}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Vessel Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.vesselName || ''}
                  onChange={(e) => updateFormData('vesselName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Departure Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.departureDate || ''}
                  onChange={(e) => updateFormData('departureDate', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Handover Checklist</h4>
              <div className="space-y-3">
                {[
                  'Cabin keys returned',
                  'Company property returned (uniforms, equipment)',
                  'Personal belongings collected',
                  'Final wages received',
                  'Medical records updated',
                  'Training certificates collected',
                  'Seafarer book updated',
                  'Travel documents arranged',
                  'Final medical check completed',
                  'Exit interview conducted',
                  'Reference letter provided',
                  'Repatriation arrangements confirmed'
                ].map((item, index) => (
                  <label key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData[`checklist_${index}`] || false}
                      onChange={(e) => updateFormData(`checklist_${index}`, e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Final Comments</h4>
              <textarea
                rows={4}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.finalComments || ''}
                onChange={(e) => updateFormData('finalComments', e.target.value)}
                placeholder="Any final comments or feedback..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Checked By (Name)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.checkedBy || ''}
                  onChange={(e) => updateFormData('checkedBy', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Checked By (Position)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.checkedByPosition || ''}
                  onChange={(e) => updateFormData('checkedByPosition', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'cr-08': // Crew Evaluation Report
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Crew Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.crewName || ''}
                  onChange={(e) => updateFormData('crewName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Position/Rank</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.position || ''}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Vessel Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.vesselName || ''}
                  onChange={(e) => updateFormData('vesselName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Evaluation Period</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.evaluationPeriod || ''}
                  onChange={(e) => updateFormData('evaluationPeriod', e.target.value)}
                  placeholder="e.g., Jan 2025 - Mar 2025"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Performance Evaluation</h4>
              <div className="space-y-6">
                {[
                  { label: 'Technical Skills', key: 'technicalSkills' },
                  { label: 'Work Attitude', key: 'workAttitude' },
                  { label: 'Safety Awareness', key: 'safetyAwareness' },
                  { label: 'Teamwork', key: 'teamwork' },
                  { label: 'Communication', key: 'communication' },
                  { label: 'Leadership (if applicable)', key: 'leadership' },
                  { label: 'Reliability', key: 'reliability' },
                  { label: 'Professionalism', key: 'professionalism' }
                ].map((item) => (
                  <div key={item.key} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">{item.label}</label>
                      <select
                        className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData[item.key] || ''}
                        onChange={(e) => updateFormData(item.key, e.target.value)}
                      >
                        <option value="">Select rating</option>
                        <option value="5">Excellent (5)</option>
                        <option value="4">Very Good (4)</option>
                        <option value="3">Good (3)</option>
                        <option value="2">Satisfactory (2)</option>
                        <option value="1">Needs Improvement (1)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Comments</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData[`${item.key}Comments`] || ''}
                        onChange={(e) => updateFormData(`${item.key}Comments`, e.target.value)}
                        placeholder="Additional comments..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Overall Assessment</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Overall Rating</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.overallRating || ''}
                    onChange={(e) => updateFormData('overallRating', e.target.value)}
                  >
                    <option value="">Select overall rating</option>
                    <option value="5">Excellent (5)</option>
                    <option value="4">Very Good (4)</option>
                    <option value="3">Good (3)</option>
                    <option value="2">Satisfactory (2)</option>
                    <option value="1">Needs Improvement (1)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Strengths</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.strengths || ''}
                    onChange={(e) => updateFormData('strengths', e.target.value)}
                    placeholder="Key strengths and positive aspects..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Areas for Improvement</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.improvements || ''}
                    onChange={(e) => updateFormData('improvements', e.target.value)}
                    placeholder="Areas that need development..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Recommendations</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.recommendations || ''}
                    onChange={(e) => updateFormData('recommendations', e.target.value)}
                    placeholder="Recommendations for future assignments..."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Evaluated By (Name)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.evaluatedBy || ''}
                  onChange={(e) => updateFormData('evaluatedBy', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Evaluated By (Position)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.evaluatedByPosition || ''}
                  onChange={(e) => updateFormData('evaluatedByPosition', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Evaluation Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.evaluationDate || ''}
                  onChange={(e) => updateFormData('evaluationDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'cr-10': // Contract of Employment
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Employee Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.employeeName || ''}
                  onChange={(e) => updateFormData('employeeName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Position</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.position || ''}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Monthly Salary (USD)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.salary || ''}
                  onChange={(e) => updateFormData('salary', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Contract Duration (months)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.contractDuration || ''}
                  onChange={(e) => updateFormData('contractDuration', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Start Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.startDate || ''}
                  onChange={(e) => updateFormData('startDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">End Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.endDate || ''}
                  onChange={(e) => updateFormData('endDate', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Work Location/Vessel</label>
              <input
                type="text"
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.workLocation || ''}
                onChange={(e) => updateFormData('workLocation', e.target.value)}
              />
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Contract Terms</h4>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.agreeToTerms || false}
                      onChange={(e) => updateFormData('agreeToTerms', e.target.checked)}
                      required
                    />
                    <span className="text-sm text-gray-700">I agree to the terms and conditions of this employment contract</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.understandDuties || false}
                      onChange={(e) => updateFormData('understandDuties', e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">I understand my duties and responsibilities</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.agreeToSafety || false}
                      onChange={(e) => updateFormData('agreeToSafety', e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">I agree to comply with all safety regulations and procedures</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Employee Signature</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.employeeSignature || ''}
                  onChange={(e) => updateFormData('employeeSignature', e.target.value)}
                  placeholder="Type full name as signature"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.contractDate || ''}
                  onChange={(e) => updateFormData('contractDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'ac-01': // Crew Wage Payment Record
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Crew Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.crewName || ''}
                  onChange={(e) => updateFormData('crewName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Position/Rank</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.position || ''}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Vessel Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.vesselName || ''}
                  onChange={(e) => updateFormData('vesselName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Payment Period</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.paymentPeriod || ''}
                  onChange={(e) => updateFormData('paymentPeriod', e.target.value)}
                  placeholder="e.g., January 2025"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Salary Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Basic Salary (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.basicSalary || ''}
                    onChange={(e) => updateFormData('basicSalary', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Overtime (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.overtime || ''}
                    onChange={(e) => updateFormData('overtime', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Allowances (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.allowances || ''}
                    onChange={(e) => updateFormData('allowances', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Deductions (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.deductions || ''}
                    onChange={(e) => updateFormData('deductions', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Net Salary (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.netSalary || ''}
                    onChange={(e) => updateFormData('netSalary', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Payment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Payment Method</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.paymentMethod || ''}
                    onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                  >
                    <option value="">Select method</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Payment Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.paymentDate || ''}
                    onChange={(e) => updateFormData('paymentDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Bank Account Details (if applicable)</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.bankDetails || ''}
                  onChange={(e) => updateFormData('bankDetails', e.target.value)}
                  placeholder="Bank name, account number, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Prepared By</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.preparedBy || ''}
                  onChange={(e) => updateFormData('preparedBy', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Approved By</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.approvedBy || ''}
                  onChange={(e) => updateFormData('approvedBy', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'ac-04': // Allotment Form
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Crew Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.crewName || ''}
                  onChange={(e) => updateFormData('crewName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Position/Rank</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.position || ''}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Vessel Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.vesselName || ''}
                  onChange={(e) => updateFormData('vesselName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Allotment Period</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.allotmentPeriod || ''}
                  onChange={(e) => updateFormData('allotmentPeriod', e.target.value)}
                  placeholder="e.g., Monthly"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Allotment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Allotment Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.allotmentAmount || ''}
                    onChange={(e) => updateFormData('allotmentAmount', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Allotment Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    max="100"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.allotmentPercentage || ''}
                    onChange={(e) => updateFormData('allotmentPercentage', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Beneficiary Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Beneficiary Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.beneficiaryName || ''}
                    onChange={(e) => updateFormData('beneficiaryName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Relationship</label>
                  <select
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.relationship || ''}
                    onChange={(e) => updateFormData('relationship', e.target.value)}
                  >
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Beneficiary Address</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.beneficiaryAddress || ''}
                  onChange={(e) => updateFormData('beneficiaryAddress', e.target.value)}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Bank Transfer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Bank Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.bankName || ''}
                    onChange={(e) => updateFormData('bankName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Account Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.accountNumber || ''}
                    onChange={(e) => updateFormData('accountNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">SWIFT/BIC Code</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.swiftCode || ''}
                    onChange={(e) => updateFormData('swiftCode', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Bank Address</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.bankAddress || ''}
                    onChange={(e) => updateFormData('bankAddress', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Crew Signature</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.crewSignature || ''}
                  onChange={(e) => updateFormData('crewSignature', e.target.value)}
                  placeholder="Type full name as signature"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.allotmentDate || ''}
                  onChange={(e) => updateFormData('allotmentDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Online form for this document is not yet available.</p>
            <p className="text-sm text-gray-700 mt-2">Please use the Download PDF option.</p>
          </div>
        );
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading HGQS Forms...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/quality"
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">HGQS Quality Forms</h1>
                <p className="text-slate-600 mt-1">Download standardized quality management forms</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                ISO 9001:2015
              </span>
              <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                MLC 2006
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* HGQS Overview */}
          <div className="bg-white backdrop-blur-md rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4">HGQS Quality Management System Forms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-2xl">💰</span>
                </div>
                <h3 className="font-semibold text-slate-800">AC Forms</h3>
                <p className="text-sm text-slate-600">Accounting & Finance</p>
                <p className="text-xs text-slate-500 mt-1">Wage, Petty Cash, Allotments</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 text-2xl">📄</span>
                </div>
                <h3 className="font-semibold text-slate-800">AD Forms</h3>
                <p className="text-sm text-slate-600">Administrative Documents</p>
                <p className="text-xs text-slate-500 mt-1">Meetings, Audits, Procurement</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-600 text-2xl">👥</span>
                </div>
                <h3 className="font-semibold text-slate-800">CR Forms</h3>
                <p className="text-sm text-slate-600">Crew Related</p>
                <p className="text-xs text-slate-500 mt-1">Employment, Evaluation, Contracts</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 text-2xl">🏢</span>
                </div>
                <h3 className="font-semibold text-slate-800">Principal Forms</h3>
                <p className="text-sm text-slate-600">Company-Specific</p>
                <p className="text-xs text-slate-500 mt-1">Lundqvist Rederierna, etc.</p>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="bg-white backdrop-blur-md rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Filter by Category</h3>
              <div className="flex space-x-2">
                {(
                  [
                    { key: 'ALL' as const, label: 'All Forms', color: 'slate' },
                    { key: 'AC' as const, label: 'AC Forms', color: 'blue' },
                    { key: 'AD' as const, label: 'AD Forms', color: 'green' },
                    { key: 'CR' as const, label: 'CR Forms', color: 'orange' },
                    { key: 'PRINCIPAL' as const, label: 'Principal Forms', color: 'purple' }
                  ]
                ).map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === key
                        ? `bg-${color}-600 text-white`
                        : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Forms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((form) => (
              <div key={form.id} className="bg-white backdrop-blur-md rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    form.category === 'AC' ? 'bg-blue-100' :
                    form.category === 'AD' ? 'bg-green-100' :
                    form.category === 'CR' ? 'bg-orange-100' :
                    'bg-purple-100'
                  }`}>
                    <span className={`text-xl font-extrabold ${
                      form.category === 'AC' ? 'text-blue-600' :
                      form.category === 'AD' ? 'text-green-600' :
                      form.category === 'CR' ? 'text-orange-600' :
                      'text-purple-600'
                    }`}>
                      {form.category === 'PRINCIPAL' ? '🏢' : form.category}
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-medium ${
                    form.category === 'AC' ? 'bg-blue-100 text-blue-800' :
                    form.category === 'AD' ? 'bg-green-100 text-green-800' :
                    form.category === 'CR' ? 'bg-orange-100 text-orange-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    v{form.version}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-800 mb-2">{form.name}</h3>
                {form.principal && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {form.principal.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                )}
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{form.description}</p>

                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <span>Last updated: {form.lastUpdated}</span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openOnlineForm(form.id)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                      form.category === 'AC'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : form.category === 'AD'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : form.category === 'CR'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    📝 Fill Online
                  </button>

                  <button
                    onClick={() => generateForm(form.id, form.name)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                      form.category === 'AC'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : form.category === 'AD'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : form.category === 'CR'
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    📄 Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredForms.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-400 text-2xl">📄</span>
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No forms found</h3>
              <p className="text-slate-500">Try selecting a different category.</p>
            </div>
          )}
        </div>
      </main>

      {/* Crew Selector Modal */}
      <Modal
        isOpen={showCrewSelector}
        onClose={() => setShowCrewSelector(false)}
        title="Select Crew Member"
        subtitle="Choose a crew member to auto-populate the form with their data"
        size="md"
      >
        <div className="space-y-3">
              {crews.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-700 text-2xl">👥</span>
                  </div>
                  <p className="text-slate-600">No crew members found</p>
                  <p className="text-sm text-slate-500 mt-1">Please add crew members first</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {crews.map((crew) => (
                    <button
                      key={crew.id}
                      onClick={() => handleCrewSelect(crew)}
                      className="w-full p-4 border border-gray-300 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-800">{crew.fullName}</div>
                          <div className="text-sm text-slate-600">{crew.rank}</div>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-xs font-medium ${
                          crew.status === 'ONBOARD' ? 'bg-green-100 text-green-800' :
                          crew.status === 'STANDBY' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {crew.status}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-300 bg-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
          <button
            onClick={() => {
              if (selectedForm) {
                generateFormWithData(selectedForm.id, selectedForm.name, null);
                setShowCrewSelector(false);
                setSelectedForm(null);
              }
            }}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Generate Blank Form
          </button>
        </div>
      </Modal>

      {/* Online Form Modal */}
      <Modal
        isOpen={showOnlineForm}
        onClose={closeOnlineForm}
        title="Fill Form Online"
        subtitle="Fill out the form below and download as PDF"
        size="xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {renderFormFields(currentFormId)}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={closeOnlineForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors order-1 sm:order-2"
            >
              Generate PDF
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}