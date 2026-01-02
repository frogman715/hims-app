/**
 * Form Renderer Component
 * Renders HGF form dynamically from database definition
 * Supports: text, email, date, select, number, checkbox, textarea, file
 */

'use client';

import React, { useState, useCallback } from 'react';
import { HGFForm } from '@prisma/client';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  helpText?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

interface FormRendererProps {
  form: HGFForm;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
}

interface FormValues {
  [key: string]: unknown;
}

interface FormErrors {
  [key: string]: string;
}

export function FormRenderer({
  form,
  onSubmit,
  onCancel,
  isLoading = false,
  submitButtonText = 'Submit',
}: FormRendererProps) {
  const [formValues, setFormValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fields = (form.fieldsJson as unknown as FormField[]) || [];

  // Handle field change
  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      setFormValues((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
      // Clear error for this field when user starts typing
      if (errors[fieldName]) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: '',
        }));
      }
    },
    [errors]
  );

  // Basic validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    fields.forEach((field) => {
      const value = formValues[field.name];

      if (field.required && !value) {
        newErrors[field.name] = `${field.label} is required`;
      }

      if (value && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          newErrors[field.name] = 'Please enter a valid email address';
        }
      }

      if (value && field.minLength && String(value).length < field.minLength) {
        newErrors[field.name] = `Minimum ${field.minLength} characters required`;
      }

      if (value && field.maxLength && String(value).length > field.maxLength) {
        newErrors[field.name] = `Maximum ${field.maxLength} characters allowed`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formValues);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to submit form',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Form Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{form.name}</h1>
        {form.description && (
          <p className="mt-2 text-gray-600 text-base">{form.description}</p>
        )}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{errors.submit}</p>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map((field) => (
          <FormField
            key={field.id}
            field={field}
            value={formValues[field.name]}
            error={errors[field.name]}
            onChange={(value) => handleFieldChange(field.name, value)}
          />
        ))}

        {/* Form Actions */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isSubmitting || isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Submitting...
              </span>
            ) : (
              submitButtonText
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/**
 * Individual Form Field Component
 */
interface FormFieldProps {
  field: FormField;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}

function FormField({ field, value, error, onChange }: FormFieldProps) {
  const baseInputClasses = `w-full px-4 py-2.5 border rounded-lg font-medium transition-colors ${
    error
      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500'
  } focus:outline-none focus:ring-2`;

  return (
    <div className="flex flex-col gap-2">
      {/* Label */}
      <label className="flex items-center gap-1 font-semibold text-gray-900">
        {field.label}
        {field.required && <span className="text-red-600">*</span>}
      </label>

      {/* Text Input */}
      {field.type === 'text' && (
        <input
          type="text"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className={baseInputClasses}
        />
      )}

      {/* Email Input */}
      {field.type === 'email' && (
        <input
          type="email"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseInputClasses}
        />
      )}

      {/* Phone Input */}
      {field.type === 'phone' && (
        <input
          type="tel"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseInputClasses}
        />
      )}

      {/* Number Input */}
      {field.type === 'number' && (
        <input
          type="number"
          value={value ? String(value) : ''}
          onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : '')}
          placeholder={field.placeholder}
          className={baseInputClasses}
        />
      )}

      {/* Date Input */}
      {field.type === 'date' && (
        <input
          type="date"
          value={value ? String(value).split('T')[0] : ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
        />
      )}

      {/* Select Input */}
      {field.type === 'select' && (
        <select
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
        >
          <option value="">Select {field.label}</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* Checkbox Input */}
      {field.type === 'checkbox' && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-5 h-5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-gray-700">{field.label}</span>
        </label>
      )}

      {/* Textarea Input */}
      {field.type === 'textarea' && (
        <textarea
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          rows={4}
          className={`${baseInputClasses} resize-none`}
        />
      )}

      {/* Error Message */}
      {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

      {/* Help Text */}
      {field.helpText && !error && (
        <p className="text-gray-500 text-sm">{field.helpText}</p>
      )}

      {/* Character Counter */}
      {field.maxLength && field.type === 'textarea' && (
        <p className="text-gray-500 text-xs">
          {String(value || '').length} / {field.maxLength} characters
        </p>
      )}
    </div>
  );
}
