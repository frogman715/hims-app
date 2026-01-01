'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Clock, Users } from 'lucide-react';

interface Step {
  order: number;
  title: string;
  description: string;
  required: boolean;
  documents?: string[];
}

interface Procedure {
  id: string;
  code: string;
  title: string;
  description: string;
  phase: string;
  steps: Step[];
  responsibilities: string[];
  timeline: string;
  formCode?: string;
}

interface ProcedureDisplayProps {
  procedureId?: string;
  procedure?: Procedure;
  compact?: boolean;
}

export default function ProcedureDisplay({
  procedureId,
  procedure: initialProcedure,
  compact = false,
}: ProcedureDisplayProps) {
  const [procedure, setProcedure] = useState<Procedure | null>(initialProcedure || null);
  const [loading, setLoading] = useState(!initialProcedure && !!procedureId);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!procedureId || initialProcedure) return;

    const fetchProcedure = async () => {
      try {
        const res = await fetch(`/api/crewing/procedures/${procedureId}`);
        if (!res.ok) throw new Error('Failed to fetch procedure');
        const data = await res.json();
        setProcedure(data.data);
      } catch (error) {
        console.error('Failed to fetch procedure:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProcedure();
  }, [procedureId, initialProcedure]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center">
        <div className="inline-block animate-spin">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
        <p className="text-gray-600 mt-2">Loading procedure...</p>
      </div>
    );
  }

  if (!procedure) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center text-gray-600">
        Procedure not found
      </div>
    );
  }

  const toggleStep = (stepOrder: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepOrder)) {
      newExpanded.delete(stepOrder);
    } else {
      newExpanded.add(stepOrder);
    }
    setExpandedSteps(newExpanded);
  };

  if (compact) {
    return (
      <div className="bg-white rounded border p-3 space-y-2">
        <h4 className="font-semibold text-sm text-gray-900">{procedure.code}</h4>
        <p className="text-xs text-gray-600">{procedure.title}</p>
        <div className="flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {procedure.timeline}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {procedure.steps.length} steps
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex gap-4 items-start mb-3">
          <div className="bg-indigo-100 rounded-lg p-3">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{procedure.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{procedure.code}</p>
          </div>
          {procedure.formCode && (
            <div className="bg-amber-50 rounded px-3 py-2 text-right">
              <p className="text-xs text-amber-700 font-medium">Form Reference</p>
              <p className="text-sm font-bold text-amber-900">{procedure.formCode}</p>
            </div>
          )}
        </div>
        <p className="text-gray-700">{procedure.description}</p>
      </div>

      {/* Metadata */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Phase</p>
          <p className="text-lg font-bold text-blue-900">{procedure.phase}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-xs text-green-600 font-semibold uppercase">Timeline</p>
              <p className="text-lg font-bold text-green-900">{procedure.timeline}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-xs text-purple-600 font-semibold uppercase">Responsibilities</p>
              <p className="text-lg font-bold text-purple-900">{procedure.responsibilities.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Responsibilities */}
      {procedure.responsibilities.length > 0 && (
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            Responsible Parties
          </h3>
          <div className="grid md:grid-cols-2 gap-2">
            {procedure.responsibilities.map((role, idx) => (
              <div
                key={idx}
                className="bg-white rounded p-3 border border-purple-200 text-sm font-medium text-gray-700"
              >
                • {role}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      <div>
        <h3 className="font-bold text-lg text-gray-900 mb-4">Procedure Steps ({procedure.steps.length})</h3>
        <div className="space-y-2">
          {procedure.steps.map(step => (
            <div
              key={step.order}
              className="bg-white rounded-lg border border-gray-300 hover:border-indigo-400 hover:shadow-md transition-all"
            >
              <button
                onClick={() => toggleStep(step.order)}
                className="w-full p-4 flex gap-3 items-start hover:bg-gray-50 transition-colors"
              >
                {/* Step Number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                  {step.order}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">{step.title}</div>
                  {step.required && (
                    <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                      Required
                    </span>
                  )}
                </div>

                {/* Toggle Icon */}
                <div className="text-gray-400">
                  {expandedSteps.has(step.order) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {expandedSteps.has(step.order) && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-200 bg-gray-50 space-y-3">
                  <div>
                    <p className="text-sm text-gray-700 font-medium mb-1">Description</p>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>

                  {step.documents && step.documents.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-700 font-medium mb-2">Required Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {step.documents.map((doc, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full"
                          >
                            <FileText className="w-3 h-3" />
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
