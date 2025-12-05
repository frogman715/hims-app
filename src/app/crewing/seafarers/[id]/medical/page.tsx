'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface MedicalRecord {
  id: number;
  type: string;
  date: string | null;
  result: string | null;
  remarks: string | null;
  approvedBy: string | null;
}

interface Seafarer {
  id: number;
  fullName: string;
}

export default function SeafarerMedicalPage() {
  const router = useRouter();
  const params = useParams();
  const seafarerId = params.id as string;

  const [seafarer, setSeafarer] = useState<Seafarer | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSeafarer = useCallback(async () => {
    try {
      const response = await fetch(`/api/seafarers/${seafarerId}`);
      if (response.ok) {
        const data = await response.json();
        setSeafarer(data);
      }
    } catch (error) {
      console.error('Error fetching seafarer:', error);
    }
  }, [seafarerId]);

  const fetchMedicalRecords = useCallback(async () => {
    try {
      const response = await fetch(`/api/seafarers/${seafarerId}/medical`);
      if (response.ok) {
        const data = await response.json();
        setMedicalRecords(data);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
    } finally {
      setLoading(false);
    }
  }, [seafarerId]);

  useEffect(() => {
    if (seafarerId) {
      fetchSeafarer();
      fetchMedicalRecords();
    }
  }, [seafarerId, fetchSeafarer, fetchMedicalRecords]);

  const handleAddMedicalRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/medical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seafarerId: parseInt(seafarerId),
          type: formData.get('type'),
          date: formData.get('date') ? new Date(formData.get('date') as string).toISOString() : null,
          result: formData.get('result'),
          remarks: formData.get('remarks'),
          approvedBy: formData.get('approvedBy'),
        }),
      });

      if (response.ok) {
        fetchMedicalRecords(); // Refresh the list
        e.currentTarget.reset(); // Clear the form
      } else {
        alert('Failed to add medical record');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding medical record');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!seafarer) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Seafarer not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Seafarer
        </button>
        <h1 className="text-2xl font-bold">Medical Records for {seafarer.fullName}</h1>
      </div>

      {/* Add Medical Record Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Medical Record</h2>
        <form onSubmit={handleAddMedicalRecord} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Record Type *
              </label>
              <select
                id="type"
                name="type"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select record type</option>
                <option value="Medical Advice">Medical Advice</option>
                <option value="Treatment Request">Treatment Request</option>
                <option value="PEME (Pre-Employment Medical Examination)">PEME (Pre-Employment Medical Examination)</option>
                <option value="Annual Medical Check">Annual Medical Check</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Injury Report">Injury Report</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="result" className="block text-sm font-medium text-gray-700 mb-1">
                Result/Status
              </label>
              <select
                id="result"
                name="result"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select result</option>
                <option value="Fit for Duty">Fit for Duty</option>
                <option value="Unfit for Duty">Unfit for Duty</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Under Treatment">Under Treatment</option>
                <option value="Recovered">Recovered</option>
              </select>
            </div>

            <div>
              <label htmlFor="approvedBy" className="block text-sm font-medium text-gray-700 mb-1">
                Approved By
              </label>
              <input
                type="text"
                id="approvedBy"
                name="approvedBy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Doctor's name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
              Details/Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the medical condition, treatment, or advice given..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Medical Record'}
          </button>
        </form>
      </div>

      {/* Medical Records List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Medical History</h2>
        {medicalRecords.length === 0 ? (
          <p className="text-gray-500">No medical records found.</p>
        ) : (
          <div className="space-y-4">
            {medicalRecords.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{record.type}</h3>
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                      {record.date && (
                        <span>Date: {new Date(record.date).toLocaleDateString()}</span>
                      )}
                      {record.result && (
                        <span className={`font-medium ${
                          record.result === 'Fit for Duty' || record.result === 'Approved' || record.result === 'Recovered'
                            ? 'text-green-600' :
                          record.result === 'Unfit for Duty' || record.result === 'Rejected'
                            ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          Status: {record.result}
                        </span>
                      )}
                    </div>
                    {record.approvedBy && (
                      <p className="text-sm text-gray-600 mt-1">Approved by: {record.approvedBy}</p>
                    )}
                    {record.remarks && (
                      <p className="text-sm text-gray-600 mt-2">{record.remarks}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}