'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RecruitmentFormData {
  candidateName: string;
  position: string;
  appliedDate: string;
  interviewDate: string;
  interviewer: string;
  result: string;
  status: string;
  notes: string;
}

export default function NewRecruitmentPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<RecruitmentFormData>({
    candidateName: '',
    position: '',
    appliedDate: '',
    interviewDate: '',
    interviewer: '',
    result: '',
    status: 'APPLIED',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/recruitments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          appliedDate: formData.appliedDate ? new Date(formData.appliedDate).toISOString() : new Date().toISOString(),
          interviewDate: formData.interviewDate ? new Date(formData.interviewDate).toISOString() : null,
        }),
      });

      if (response.ok) {
        router.push('/hr/recruitment');
      } else {
        const error = await response.json();
        alert(`Failed to create recruitment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating recruitment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Add New Candidate
              </h1>
              <p className="text-lg text-gray-600 mt-2 font-medium">
                Register new recruitment candidate (AD-06)
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/hr/recruitment"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ← Back to Recruitment
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Candidate Name */}
              <div>
                <label htmlFor="candidateName" className="block text-sm font-semibold text-gray-900 mb-2">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  id="candidateName"
                  name="candidateName"
                  required
                  value={formData.candidateName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Enter candidate full name"
                />
              </div>

              {/* Position */}
              <div>
                <label htmlFor="position" className="block text-sm font-semibold text-gray-900 mb-2">
                  Position Applied For *
                </label>
                <select
                  id="position"
                  name="position"
                  required
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="">Select Position</option>
                  <option value="Captain">Captain</option>
                  <option value="Chief Officer">Chief Officer</option>
                  <option value="Chief Engineer">Chief Engineer</option>
                  <option value="Second Engineer">Second Engineer</option>
                  <option value="Third Engineer">Third Engineer</option>
                  <option value="Electrical Officer">Electrical Officer</option>
                  <option value="Bosun">Bosun</option>
                  <option value="Able Seaman">Able Seaman</option>
                  <option value="Ordinary Seaman">Ordinary Seaman</option>
                  <option value="Chief Cook">Chief Cook</option>
                  <option value="Cook">Cook</option>
                  <option value="Messman">Messman</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="HR Officer">HR Officer</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Administration Officer">Administration Officer</option>
                  <option value="IT Support">IT Support</option>
                  <option value="Quality Manager">Quality Manager</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Applied Date */}
              <div>
                <label htmlFor="appliedDate" className="block text-sm font-semibold text-gray-900 mb-2">
                  Applied Date
                </label>
                <input
                  type="date"
                  id="appliedDate"
                  name="appliedDate"
                  value={formData.appliedDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
                <p className="text-sm text-gray-600 mt-1">Leave empty to use today&apos;s date</p>
              </div>

              {/* Interview Date */}
              <div>
                <label htmlFor="interviewDate" className="block text-sm font-semibold text-gray-900 mb-2">
                  Interview Date
                </label>
                <input
                  type="date"
                  id="interviewDate"
                  name="interviewDate"
                  value={formData.interviewDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>

              {/* Interviewer */}
              <div>
                <label htmlFor="interviewer" className="block text-sm font-semibold text-gray-900 mb-2">
                  Interviewer
                </label>
                <input
                  type="text"
                  id="interviewer"
                  name="interviewer"
                  value={formData.interviewer}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Name of interviewer"
                />
              </div>

              {/* Result */}
              <div>
                <label htmlFor="result" className="block text-sm font-semibold text-gray-900 mb-2">
                  Interview Result
                </label>
                <select
                  id="result"
                  name="result"
                  value={formData.result}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="">Select Result</option>
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="EXCELLENT">EXCELLENT</option>
                  <option value="GOOD">GOOD</option>
                  <option value="AVERAGE">AVERAGE</option>
                  <option value="POOR">POOR</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-900 mb-2">
                  Application Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="APPLIED">APPLIED</option>
                  <option value="INTERVIEWED">INTERVIEWED</option>
                  <option value="HIRED">HIRED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Additional notes, comments, or observations"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Candidate'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}