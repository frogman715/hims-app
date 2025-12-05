'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Principal {
  id: number;
  name: string;
  address: string;
}

interface Vessel {
  id: number;
  name: string;
  principal?: Principal;
  _count?: {
    assignments: number;
  };
}

export default function VesselsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    principalId: '',
    imoNumber: '',
    mmsi: '',
    type: '',
    flag: '',
    grossTonnage: '',
    deadweight: '',
    length: '',
    beam: '',
    yearBuilt: '',
    classification: '',
    notes: ''
  });
  const router = useRouter();

  // Fetch vessels and principals
  const fetchData = async () => {
    try {
      const [vesselsResponse, principalsResponse] = await Promise.all([
        fetch('/api/vessels'),
        fetch('/api/principals')
      ]);

      if (vesselsResponse.ok) {
        const vesselsData = await vesselsResponse.json();
        setVessels(vesselsData);
      }

      if (principalsResponse.ok) {
        const principalsData = await principalsResponse.json();
        setPrincipals(principalsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/vessels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          principalId: parseInt(formData.principalId),
          imoNumber: formData.imoNumber || null,
          mmsi: formData.mmsi || null,
          type: formData.type || null,
          flag: formData.flag || null,
          grossTonnage: formData.grossTonnage ? parseFloat(formData.grossTonnage) : null,
          deadweight: formData.deadweight ? parseFloat(formData.deadweight) : null,
          length: formData.length ? parseFloat(formData.length) : null,
          beam: formData.beam ? parseFloat(formData.beam) : null,
          yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
          classification: formData.classification || null,
          notes: formData.notes || null
        }),
      });

      if (response.ok) {
        setFormData({
          name: '',
          principalId: '',
          imoNumber: '',
          mmsi: '',
          type: '',
          flag: '',
          grossTonnage: '',
          deadweight: '',
          length: '',
          beam: '',
          yearBuilt: '',
          classification: '',
          notes: ''
        });
        setShowForm(false);
        fetchData();
      } else {
        alert('Error creating vessel');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating vessel');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/crewing')}
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vessel Management</h1>
              <p className="mt-2 text-gray-700">Manage fleet vessels</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            {showForm ? 'Cancel' : '+ Add Vessel'}
          </button>
        </div>
      </div>

      {/* Add Vessel Form */}
      {showForm && (
        <div className="bg-gradient-to-r from-white to-blue-50 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-300 p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">🚢 Add New Vessel</h2>
            <p className="text-gray-700">Register vessel information and specifications</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-sm font-bold">🚢</span>
                </div>
                Vessel Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vessel Name (as registered) *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Official vessel name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    IMO Number (International Maritime Organization)
                  </label>
                  <input
                    type="text"
                    name="imoNumber"
                    value={formData.imoNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="7-digit IMO number (e.g., 1234567)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    MMSI Number (Maritime Mobile Service Identity)
                  </label>
                  <input
                    type="text"
                    name="mmsi"
                    value={formData.mmsi}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="9-digit MMSI (e.g., 525123456)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vessel Type/Category
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select Vessel Type</option>
                    <option value="Container Ship">Container Ship</option>
                    <option value="Bulk Carrier">Bulk Carrier (Dry Bulk)</option>
                    <option value="Tanker">Oil/Chemical Tanker</option>
                    <option value="LNG Carrier">LNG Carrier</option>
                    <option value="LPG Carrier">LPG Carrier</option>
                    <option value="Chemical Tanker">Chemical Tanker</option>
                    <option value="Ro-Ro Ship">Ro-Ro Ship (Roll-on/Roll-off)</option>
                    <option value="Passenger Ship">Passenger Ship/Ferry</option>
                    <option value="Fishing Vessel">Fishing Vessel</option>
                    <option value="Offshore Support">Offshore Support Vessel</option>
                    <option value="Tug Boat">Tug Boat</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Flag State/Country
                  </label>
                  <input
                    type="text"
                    name="flag"
                    value={formData.flag}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Flag state (e.g., Indonesia, Panama)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Shipping Company/Principal *
                  </label>
                  <select
                    name="principalId"
                    value={formData.principalId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select Principal Company</option>
                    {principals.map((principal: Principal) => (
                      <option key={principal.id} value={principal.id}>
                        {principal.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Technical Specifications Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-purple-600 text-sm font-bold">⚙️</span>
                </div>
                Technical Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gross Tonnage (GT)
                  </label>
                  <input
                    type="number"
                    name="grossTonnage"
                    value={formData.grossTonnage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Total vessel capacity (e.g., 50000)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deadweight Tonnage (DWT)
                  </label>
                  <input
                    type="number"
                    name="deadweight"
                    value={formData.deadweight}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Maximum cargo weight (e.g., 80000)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Length Overall (LOA) in meters
                  </label>
                  <input
                    type="number"
                    name="length"
                    value={formData.length}
                    onChange={handleInputChange}
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Total length including bowsprit (e.g., 225.5)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maximum Beam/Breadth in meters
                  </label>
                  <input
                    type="number"
                    name="beam"
                    value={formData.beam}
                    onChange={handleInputChange}
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Maximum width (e.g., 32.2)"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm font-bold">📋</span>
                </div>
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Year of Build/Construction
                  </label>
                  <input
                    type="number"
                    name="yearBuilt"
                    value={formData.yearBuilt}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Year vessel was built (e.g., 2020)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Classification Society
                  </label>
                  <select
                    name="classification"
                    value={formData.classification}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select Classification Society</option>
                    <option value="ABS">American Bureau of Shipping (ABS)</option>
                    <option value="BV">Bureau Veritas (BV)</option>
                    <option value="DNV">Det Norske Veritas (DNV)</option>
                    <option value="GL">Germanischer Lloyd (GL)</option>
                    <option value="LR">Lloyd&apos;s Register (LR)</option>
                    <option value="NK">Nippon Kaiji Kyokai (NK)</option>
                    <option value="RINA">Registro Italiano Navale (RINA)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Notes/Special Features
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Any special equipment, modifications, or additional vessel information"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-300">
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Save Vessel
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vessels List */}
      <div className="bg-gradient-to-r from-white to-gray-50 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-300 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-300">
          <h2 className="text-xl font-extrabold text-gray-900">All Vessels</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading vessels...</p>
          </div>
        ) : vessels.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-700">No vessels found. Add your first vessel above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vessel Name</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Principal</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Crew On Board</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vessels.map((vessel: Vessel) => (
                  <tr key={vessel.id} className="hover:bg-gray-100">
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{vessel.name}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">{vessel.principal?.name}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {vessel._count?.assignments || 0} crew
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}