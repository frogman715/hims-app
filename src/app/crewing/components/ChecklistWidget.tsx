'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export interface ChecklistItem {
  order: number;
  title: string;
  description?: string;
  checked: boolean;
  completedAt?: string;
}

interface ChecklistWidgetProps {
  checklistId: string;
  checklistCode: string;
  items?: ChecklistItem[];
  onUpdate?: (items: ChecklistItem[]) => void;
  readOnly?: boolean;
}

export default function ChecklistWidget({
  checklistId,
  checklistCode,
  items = [],
  onUpdate,
  readOnly = false,
}: ChecklistWidgetProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(items);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Calculate completion percentage
  const completionPercent = checklist.length
    ? Math.round((checklist.filter(i => i.checked).length / checklist.length) * 100)
    : 0;

  const handleToggle = async (order: number) => {
    if (readOnly) return;

    const updated = checklist.map(item =>
      item.order === order
        ? {
            ...item,
            checked: !item.checked,
            completedAt: !item.checked ? new Date().toISOString() : undefined,
          }
        : item
    );

    setChecklist(updated);
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/crewing/checklists/${checklistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemsJson: updated,
          completionPercent: Math.round(
            (updated.filter(i => i.checked).length / updated.length) * 100
          ),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save checklist');
      }

      onUpdate?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      // Revert on error
      setChecklist(items);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{checklistCode}</h3>
          <p className="text-xs text-gray-600">Procedure Checklist</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600">{completionPercent}%</div>
          <p className="text-xs text-gray-600">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-gray-300 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>{checklist.filter(i => i.checked).length} of {checklist.length} items</span>
          {completionPercent === 100 && <span className="text-green-600 font-medium">✓ Complete</span>}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklist.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">No items in this checklist</p>
        ) : (
          checklist.map(item => (
            <div
              key={item.order}
              className="bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="p-3 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(expanded === item.order ? null : item.order)}>
                {/* Checkbox */}
                <button
                  disabled={saving || readOnly}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(item.order);
                  }}
                  className="flex-shrink-0 mt-0.5 disabled:opacity-50"
                >
                  {item.checked ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${item.checked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {item.order}. {item.title}
                  </p>
                  {item.completedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      ✓ Completed {new Date(item.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Expand Icon */}
                {item.description && (
                  <div className="text-gray-400">
                    {expanded === item.order ? '▼' : '▶'}
                  </div>
                )}
              </div>

              {/* Expanded Description */}
              {expanded === item.order && item.description && (
                <div className="px-3 pb-3 pt-0 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-700">{item.description}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Status */}
      {saving && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
          Saving...
        </div>
      )}
    </div>
  );
}
