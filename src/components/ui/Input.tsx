import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      wrapperClassName,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id; // Parents should provide ID for accessibility
    const hasError = !!error;

    return (
      <div className={cn('w-full', wrapperClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-semibold text-gray-700 mb-2',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input wrapper dengan icons */}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={cn(
              // Base styles
              'w-full rounded-lg border-2 transition-all duration-200',
              'px-4 py-3 text-base font-normal',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              
              // Normal state
              'border-gray-300 bg-white text-gray-900',
              'hover:border-gray-400',
              'focus:border-blue-500 focus:ring-blue-500',
              
              // Error state
              hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              
              // Disabled state
              disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
              
              // Icon padding adjustments
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              
              // Custom className
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';
