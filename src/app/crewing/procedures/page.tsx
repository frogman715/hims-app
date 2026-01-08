'use client';

import { useEffect, useState } from 'react';
import ProcedureDisplay from '@/app/crewing/components/ProcedureDisplay';
import { Search, Filter, X } from 'lucide-react';

interface Procedure {
  id: string;
  code: string;
  title: string;
  description: string;
  phase: string;
  steps: Array<{
    order: number;
    title: string;
    description: string;
    required: boolean;
  }>;
  responsibilities: string[];
  timeline: string;
}

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);

  // Fetch procedures on component mount
  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        setError(null);
        const url = new URL('/api/crewing/procedures', window.location.origin);
        if (selectedPhase) url.searchParams.append('phase', selectedPhase);
        if (searchTerm) url.searchParams.append('search', searchTerm);

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setProcedures(data.data);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load procedures');
      } finally {
        setLoading(false);
      }
    };

    fetchProcedures();
  }, [selectedPhase, searchTerm]);

  const uniquePhases = [...new Set(procedures.map(p => p.phase))].sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Procedures</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">HGQS Procedures</h1>
          <p className="text-gray-600 mt-2">Digital procedures and checklists for crew management</p>
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search procedures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Phase Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Phases</option>
              {uniquePhases.map(phase => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Procedures List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 rounded-t-lg">
                <h2 className="font-bold text-lg">Procedures ({procedures.length})</h2>
              </div>

              <div className="divide-y max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-600">Loading...</div>
                ) : procedures.length === 0 ? (
                  <div className="p-4 text-center text-gray-600">No procedures found</div>
                ) : (
                  procedures.map(procedure => (
                    <button
                      key={procedure.id}
                      onClick={() => setSelectedProcedure(procedure)}
                      className={`w-full text-left p-4 hover:bg-indigo-50 transition-colors border-l-4 ${
                        selectedProcedure?.id === procedure.id
                          ? 'border-l-indigo-600 bg-indigo-50'
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 text-sm">{procedure.code}</div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{procedure.title}</p>
                      <div className="mt-2 flex gap-1">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {procedure.steps.length} steps
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Procedure Details */}
          <div className="lg:col-span-2">
            {selectedProcedure ? (
              <>
                <button
                  onClick={() => setSelectedProcedure(null)}
                  className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
                <ProcedureDisplay procedure={selectedProcedure} />
              </>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-600">Select a procedure to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
