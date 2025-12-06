import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      className,
      wrapperClassName,
      id,
      disabled,
      required,
      showCharCount,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    const textareaId = id; // Parents should provide ID for accessibility
    const hasError = !!error;
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn('w-full', wrapperClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-semibold text-gray-700 mb-2',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          className={cn(
            // Base styles
            'w-full rounded-lg border-2 transition-all duration-200',
            'px-4 py-3 text-base font-normal',
            'placeholder:text-gray-400 resize-vertical',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            
            // Normal state
            'border-gray-300 bg-white text-gray-900',
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
        />

        {/* Footer: Helper text / error / char count */}
        <div className="mt-2 flex items-center justify-between">
          {(helperText || error) && (
            <p
              className={cn(
                'text-sm',
                hasError ? 'text-red-600' : 'text-gray-500'
              )}
            >
              {error || helperText}
            </p>
          )}

          {showCharCount && maxLength && (
            <span
              className={cn(
                'text-sm',
                charCount > maxLength * 0.9 ? 'text-orange-600' : 'text-gray-500'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
