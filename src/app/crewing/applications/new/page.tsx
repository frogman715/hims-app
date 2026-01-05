'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ApplicationFormData {
  crewId: string;
  position: string;
  vesselType: string;
  principalId: string;
  vesselId?: string;
  applicationDate: string;
}

interface Crew {
  id: string;
  fullName: string;
}

interface Principal {
  id: string;
  name: string;
}

interface Vessel {
  id: string;
  name: string;
  principalId: string;
  type?: string;
  imoNumber?: string;
  flag?: string;
  status?: string;
}

const VESSEL_TYPES = [
  'General Cargo',
  'Container Ship',
  'Bulk Carrier',
  'Tanker',
  'RoRo',
  'Refrigerated Cargo',
  'Multi-Purpose',
  'Yacht',
  'Fishing Vessel',
  'Other',
];

const POSITIONS = [
  'Master/Captain',
  'Chief Officer',
  'Second Officer',
  'Third Officer',
  'Deck Cadet',
  'Chief Engineer',
  'Second Engineer',
  'Third Engineer',
  'Fourth Engineer',
  'Engine Cadet',
  'Chief Steward',
  'Bosun',
  'Carpenter',
  'Able Seaman',
  'Ordinary Seaman',
  'Galley Boy',
];

export default function NewApplicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ApplicationFormData>({
    crewId: '',
    position: '',
    vesselType: '',
    principalId: '',
    applicationDate: new Date().toISOString().split('T')[0],
  });
  const [crew, setCrew] = useState<Crew[]>([]);
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [crewRes, principalsRes] = await Promise.all([
          fetch('/api/seafarers'),
          fetch('/api/principals'),
        ]);

        if (crewRes.ok) {
          const crewData = await crewRes.json();
          setCrew(crewData);
        }

        if (principalsRes.ok) {
          const principalsData = await principalsRes.json();
          setPrincipals(principalsData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load form data');
      }
    };

    fetchData();
  }, []);

  // Fetch vessels when principal changes
  useEffect(() => {
    const fetchVessels = async () => {
      if (!formData.principalId) {
        setVessels([]);
        // Reset vessel type when principal is cleared
        setFormData(prev => ({
          ...prev,
          vesselId: undefined,
          vesselType: '',
        }));
        return;
      }

      try {
        const response = await fetch(`/api/principals/${formData.principalId}/vessels`);
        if (response.ok) {
          const data = await response.json();
          setVessels(data);
          // Reset vessel selection and type when principal changes
          setFormData(prev => ({
            ...prev,
            vesselId: undefined,
            vesselType: '',
          }));
        }
      } catch (err) {
        console.error('Error fetching vessels:', err);
      }
    };

    fetchVessels();
  }, [formData.principalId]);

  // Auto-populate vessel type when vessel is selected
  useEffect(() => {
    if (!formData.vesselId || vessels.length === 0) {
      return;
    }

    const selectedVessel = vessels.find(v => v.id === formData.vesselId);
    if (selectedVessel && selectedVessel.type) {
      console.log('Auto-populating vessel type:', selectedVessel.type, 'for vessel:', selectedVessel.name);
      setFormData(prev => ({
        ...prev,
        vesselType: selectedVessel.type || '',
      }));
    } else {
      console.log('Selected vessel:', selectedVessel);
      console.log('Available vessels:', vessels);
    }
  }, [formData.vesselId, vessels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crewId: formData.crewId,
          position: formData.position,
          vesselType: formData.vesselType || null,
          principalId: formData.principalId || null,
          applicationDate: formData.applicationDate,
        }),
      });

      if (response.ok) {
        const applicationData = await response.json();
        const applicationId = applicationData.id;

        // Auto-create checklists for relevant procedures
        try {
          const proceduresRes = await fetch('/api/crewing/procedures?phase=Pre-Deployment');
          if (proceduresRes.ok) {
            const proceduresData = await proceduresRes.json();
            
            // Create a checklist for each procedure
            for (const procedure of proceduresData.data || []) {
              await fetch('/api/crewing/checklists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  applicationId,
                  procedureId: procedure.id,
                  checklistCode: procedure.code,
                  itemsJson: procedure.steps.map((step: Record<string, unknown>) => ({
                    order: step.order,
                    title: step.title,
                    description: step.description,
                    checked: false,
                  })) || [],
                }),
              });
            }
          }
        } catch (checklistErr) {
          console.warn('Failed to create checklists:', checklistErr);
          // Don't fail the application creation if checklists fail
        }

        router.push('/crewing/applications');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create application');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error creating application');
    } finally {
      setLoading(false);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Application</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seafarer Selection */}
            <div>
              <label htmlFor="crewId" className="block text-sm font-semibold text-gray-900 mb-2">
                Seafarer *
              </label>
              <select
                id="crewId"
                name="crewId"
                required
                value={formData.crewId}
                onChange={handleChange}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a seafarer</option>
                {crew.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label htmlFor="position" className="block text-sm font-semibold text-gray-900 mb-2">
                Applied Position/Rank *
              </label>
              <select
                id="position"
                name="position"
                required
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select position</option>
                {POSITIONS.map(pos => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            {/* Principal/Company */}
            <div>
              <label htmlFor="principalId" className="block text-sm font-semibold text-gray-900 mb-2">
                Target Principal/Ship Owner *
              </label>
              <select
                id="principalId"
                name="principalId"
                required
                value={formData.principalId}
                onChange={handleChange}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select company/principal</option>
                {principals.map(principal => (
                  <option key={principal.id} value={principal.id}>
                    {principal.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vessel Selection (conditional) */}
            {formData.principalId && (
              <div>
                <label htmlFor="vesselId" className="block text-sm font-semibold text-gray-900 mb-2">
                  Target Vessel (from selected principal)
                </label>
                <select
                  id="vesselId"
                  name="vesselId"
                  value={formData.vesselId || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select vessel (optional)</option>
                  {vessels.map(vessel => (
                    <option key={vessel.id} value={vessel.id}>
                      {vessel.name}
                    </option>
                  ))}
                </select>
                {vessels.length === 0 && formData.principalId && (
                  <p className="text-sm text-gray-500 mt-2">No vessels found for this principal</p>
                )}
              </div>
            )}

            {/* Vessel Type */}
            <div>
              <label htmlFor="vesselType" className="block text-sm font-semibold text-gray-900 mb-2">
                Preferred Vessel Type
                {formData.vesselId && formData.vesselType && (
                  <span className="text-xs font-normal text-gray-500 ml-2">(auto-populated from vessel)</span>
                )}
              </label>
              <select
                id="vesselType"
                name="vesselType"
                value={formData.vesselType}
                onChange={handleChange}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select vessel type (optional)</option>
                {VESSEL_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Application Date */}
            <div>
              <label htmlFor="applicationDate" className="block text-sm font-semibold text-gray-900 mb-2">
                Application Date *
              </label>
              <input
                type="date"
                id="applicationDate"
                name="applicationDate"
                required
                value={formData.applicationDate}
                onChange={handleChange}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-300 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              >
                {loading ? 'Creating...' : 'Create Application'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}