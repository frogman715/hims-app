/**
 * HGF Forms List Component
 * Display all available HGF forms yang crew bisa submit
 */

'use client';

import React, { useEffect, useState } from 'react';
import { HGFForm } from '@prisma/client';
import { ArrowRight, Loader, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface HGFFormsListProps {
  onSelectForm?: (form: HGFForm) => void;
}

const FORM_TYPE_LABELS: Record<string, string> = {
  CHECKLIST: '📋 Checklist',
  APPLICATION: '📝 Application',
  VERIFICATION: '✅ Verification',
  TRAINING: '🎓 Training',
  DECLARATION: '📄 Declaration',
};

export function HGFFormsList({ onSelectForm }: HGFFormsListProps) {
  const [forms, setForms] = useState<HGFForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Fetch forms
  useEffect(() => {
    const fetchForms = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('isActive', 'true');

        const response = await fetch(`/api/hgf/forms?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch forms');
        }

        const data = (await response.json()) as { data: HGFForm[] };
        setForms(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchForms();
  }, []);

  const filteredForms =
    selectedType === 'ALL'
      ? forms
      : forms.filter((form) => form.formType === selectedType);

  const formTypes = Array.from(
    new Set(forms.map((form) => form.formType))
  ).sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-900">Error loading forms</p>
          <p className="text-red-800 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600 text-lg">No forms available</p>
        <p className="text-gray-500 text-sm mt-1">
          Please contact administrator for form setup
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">HGF Forms</h1>
        <p className="text-gray-600 text-lg mt-2">
          Select a form below to start a new submission
        </p>
      </div>

      {/* Form Type Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedType('ALL')}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            selectedType === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          All Forms
        </button>
        {formTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              selectedType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            {FORM_TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredForms.map((form) => (
          <FormCard key={form.id} form={form} onSelect={onSelectForm} />
        ))}
      </div>

      {filteredForms.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">No forms found for selected type</p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Form Card Component
 */
interface FormCardProps {
  form: HGFForm;
  onSelect?: (form: HGFForm) => void;
}

function FormCard({ form, onSelect }: FormCardProps) {
  const handleClick = () => {
    onSelect?.(form);
  };

  const getFormTypeColor = (type: string) => {
    const colors: Record<string, { bg: string; badge: string }> = {
      CHECKLIST: { bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800' },
      APPLICATION: { bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800' },
      VERIFICATION: { bg: 'bg-green-50', badge: 'bg-green-100 text-green-800' },
      TRAINING: { bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
      DECLARATION: { bg: 'bg-red-50', badge: 'bg-red-100 text-red-800' },
    };
    return colors[type] || colors.CHECKLIST;
  };

  const colors = getFormTypeColor(form.formType);

  // Count fields
  const fieldCount = Array.isArray(form.fieldsJson) ? form.fieldsJson.length : 0;

  return (
    <Link
      href={`/hgf/forms/${form.formCode}/new`}
      onClick={handleClick}
      className={`block p-6 rounded-lg border-2 border-transparent hover:border-blue-400 transition-all ${colors.bg} cursor-pointer group`}
    >
      {/* Type Badge */}
      <div className="flex items-start justify-between mb-4">
        <span
          className={`${colors.badge} text-xs font-semibold px-3 py-1 rounded-full`}
        >
          {FORM_TYPE_LABELS[form.formType] || form.formType}
        </span>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>

      {/* Form Info */}
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
        {form.name}
      </h3>

      {form.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {form.description}
        </p>
      )}

      {/* Form Code & Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
        <div>
          <p className="font-medium text-gray-900">{form.formCode}</p>
        </div>
        <div className="text-right">
          <p className="font-medium text-gray-900">{fieldCount}</p>
          <p className="text-xs">fields</p>
        </div>
      </div>
    </Link>
  );
}
