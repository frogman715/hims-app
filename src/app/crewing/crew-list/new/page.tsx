"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface CrewMemberFormData {
  seafarerName: string;
  rank: string;
  vesselId: string;
  signOnDate: string;
  signOffDate: string;
  nationality: string;
  dateOfBirth: string;
  experience: string;
  contractDuration: string;
  emergencyContact: string;
  medicalInfo: string;
  status: 'ONBOARD' | 'DEPARTED' | 'PLANNED';
}

interface Vessel {
  id: number;
  name: string;
}

export default function NewCrewMemberPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CrewMemberFormData>({
    seafarerName: '',
    rank: '',
    vesselId: '',
    signOnDate: '',
    signOffDate: '',
    nationality: '',
    dateOfBirth: '',
    experience: '',
    contractDuration: '',
    emergencyContact: '',
    medicalInfo: '',
    status: 'ONBOARD',
  });

  // Pre-populate form from URL search params
  useEffect(() => {
    const seafarerName = searchParams.get('seafarerName') || searchParams.get('fullName');
    const rank = searchParams.get('rank');
    const nationality = searchParams.get('nationality');
    const dateOfBirth = searchParams.get('dateOfBirth');
    const emergencyContact = searchParams.get('emergencyContact') || searchParams.get('emergencyContactName');
    const vesselId = searchParams.get('vesselId');
    const status = searchParams.get('status') as 'ONBOARD' | 'DEPARTED' | 'PLANNED' | null;

    if (seafarerName || rank || nationality || dateOfBirth) {
      setFormData(prev => ({
        ...prev,
        seafarerName: seafarerName || prev.seafarerName,
        rank: rank || prev.rank,
        nationality: nationality || prev.nationality,
        dateOfBirth: dateOfBirth || prev.dateOfBirth,
        emergencyContact: emergencyContact || prev.emergencyContact,
        vesselId: vesselId || prev.vesselId,
        status: status || prev.status,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchVessels();
    }
  }, [session]);

  const fetchVessels = async () => {
    try {
      // For now, using mock data since we don't have the API yet
      const mockVessels: Vessel[] = [
        { id: 1, name: "MV Ocean Pride" },
        { id: 2, name: "MV Pacific Star" },
        { id: 3, name: "MV Sea Explorer" },
      ];
      setVessels(mockVessels);
    } catch (error) {
      console.error("Error fetching vessels:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, we need to create or find a seafarer
      // For now, we'll assume the seafarer exists or create a basic one
      // In a full implementation, this would be a seafarer selection/create flow

      // Create the assignment (which represents the crew member on a vessel)
      const assignmentData = {
        seafarerId: 1, // This should come from seafarer selection
        vesselId: parseInt(formData.vesselId),
        principalId: 1, // This should come from vessel's principal
        rank: formData.rank,
        signOnDate: formData.signOnDate,
        signOffPlan: formData.signOffDate || null,
        status: formData.status === 'ONBOARD' ? 'ONBOARD' : 'PLANNED'
      };

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      });

      if (response.ok) {
        router.push('/crewing/crew-list');
      } else {
        const errorData = await response.json();
        alert(`Failed to create crew member: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating crew member:", error);
      alert("Error creating crew member");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const rankOptions = [
    'Captain',
    'Chief Officer',
    'Second Officer',
    'Third Officer',
    'Chief Engineer',
    'Second Engineer',
    'Third Engineer',
    'Fourth Engineer',
    'Electrical Officer',
    'Bosun',
    'Able Seaman',
    'Ordinary Seaman',
    'Chief Cook',
    'Cook',
    'Steward',
    'Cadet',
  ];

  const nationalityOptions = [
    'American',
    'British',
    'Canadian',
    'Australian',
    'Filipino',
    'Indian',
    'Chinese',
    'Russian',
    'Ukrainian',
    'Polish',
    'Croatian',
    'Romanian',
    'Bulgarian',
    'Spanish',
    'Portuguese',
    'Italian',
    'Greek',
    'Turkish',
    'Egyptian',
    'Indonesian',
    'Vietnamese',
    'Myanmar',
    'Bangladeshi',
    'Sri Lankan',
    'Other',
  ];

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/crewing/crew-list"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                ← Back to Crew List
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Crew Member</h1>
                <p className="text-gray-800">Create a new crew member record with complete details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="seafarerName" className="block text-sm font-semibold text-gray-900 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="seafarerName"
                    name="seafarerName"
                    required
                    value={formData.seafarerName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="rank" className="block text-sm font-semibold text-gray-900 mb-2">
                    Rank/Position *
                  </label>
                  <select
                    id="rank"
                    name="rank"
                    required
                    value={formData.rank}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  >
                    <option value="">Select rank</option>
                    {rankOptions.map(rank => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="nationality" className="block text-sm font-semibold text-gray-900 mb-2">
                    Nationality
                  </label>
                  <select
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  >
                    <option value="">Select nationality</option>
                    {nationalityOptions.map(nationality => (
                      <option key={nationality} value={nationality}>{nationality}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-900 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-semibold text-gray-900 mb-2">
                    Experience
                  </label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g., 5 years, 10+ years"
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  >
                    <option value="ONBOARD">Onboard</option>
                    <option value="DEPARTED">Departed</option>
                    <option value="PLANNED">Planned</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Assignment Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
                Assignment Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="vesselId" className="block text-sm font-semibold text-gray-900 mb-2">
                    Vessel *
                  </label>
                  <select
                    id="vesselId"
                    name="vesselId"
                    required
                    value={formData.vesselId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  >
                    <option value="">Select vessel</option>
                    {vessels.map(vessel => (
                      <option key={vessel.id} value={vessel.id}>{vessel.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="contractDuration" className="block text-sm font-semibold text-gray-900 mb-2">
                    Contract Duration
                  </label>
                  <input
                    type="text"
                    id="contractDuration"
                    name="contractDuration"
                    value={formData.contractDuration}
                    onChange={handleChange}
                    placeholder="e.g., 6 months, 1 year"
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="signOnDate" className="block text-sm font-semibold text-gray-900 mb-2">
                    Sign-On Date *
                  </label>
                  <input
                    type="date"
                    id="signOnDate"
                    name="signOnDate"
                    required
                    value={formData.signOnDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="signOffDate" className="block text-sm font-semibold text-gray-900 mb-2">
                    Sign-Off Date
                  </label>
                  <input
                    type="date"
                    id="signOffDate"
                    name="signOffDate"
                    value={formData.signOffDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Emergency & Medical Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-300">
                Emergency & Medical Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="emergencyContact" className="block text-sm font-semibold text-gray-900 mb-2">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    placeholder="Name and contact information"
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="medicalInfo" className="block text-sm font-semibold text-gray-900 mb-2">
                    Medical Information
                  </label>
                  <textarea
                    id="medicalInfo"
                    name="medicalInfo"
                    rows={3}
                    value={formData.medicalInfo}
                    onChange={handleChange}
                    placeholder="Allergies, medications, medical conditions, etc."
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-300">
              <Link
                href="/crewing/crew-list"
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Crew Member
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}