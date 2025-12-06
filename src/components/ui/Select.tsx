import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
  wrapperClassName?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      className,
      wrapperClassName,
      id,
      disabled,
      required,
      placeholder,
      ...props
    },
    ref
  ) => {
    const selectId = id; // Parents should provide ID for accessibility
    const hasError = !!error;

    return (
      <div className={cn('w-full', wrapperClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'block text-sm font-semibold text-gray-700 mb-2',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Select dropdown */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            className={cn(
              // Base styles
              'w-full rounded-lg border-2 transition-all duration-200',
              'px-4 py-3 text-base font-normal appearance-none',
              'bg-white text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              
              // Normal state
              'border-gray-300',
              'hover:border-gray-400',
              'focus:border-blue-500 focus:ring-blue-500',
              
              // Error state
              hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              
              // Disabled state
              disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
              
              // Custom className
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown arrow icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Helper text atau error message */}
        {(helperText || error) && (
          <p
            className={cn(
              'mt-2 text-sm',
              hasError ? 'text-red-600' : 'text-gray-500'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
