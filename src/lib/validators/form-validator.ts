/**
 * Form Validation Engine
 * Handles client-side and server-side validation for HGF forms
 */

import { PrismaClient } from '@prisma/client';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationRule {
  fieldName: string;
  ruleType: 'required' | 'pattern' | 'minLength' | 'maxLength' | 'email' | 'date' | 'custom';
  ruleValue?: string | number;
  errorMessage: string;
  dependsOnField?: string;
  dependsOnValue?: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file' | 'number';
  required: boolean;
  placeholder?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  options?: Array<{ label: string; value: string }>;
  helpText?: string;
  dependsOn?: string;
  dependsOnValue?: string;
}

export class FormValidator {
  private validationRules: ValidationRule[];
  private fields: FormField[];

  constructor(fields: FormField[], validationRules: ValidationRule[]) {
    this.fields = fields;
    this.validationRules = validationRules;
  }

  /**
   * Validate a single field
   */
  validateField(fieldName: string, value: unknown): ValidationError | null {
    const field = this.fields.find((f) => f.name === fieldName);
    if (!field) {
      return null;
    }

    // Get applicable rules
    const rules = this.validationRules.filter((r) => r.fieldName === fieldName);

    for (const rule of rules) {
      // Check dependencies
      if (rule.dependsOnField) {
        // Dependencies are checked in validateForm, not here
        continue;
      }

      const error = this.applyRule(fieldName, value, rule);
      if (error) {
        return error;
      }
    }

    return null;
  }

  /**
   * Validate entire form
   */
  validateForm(data: Record<string, unknown>): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const field of this.fields) {
      const value = data[field.name];

      // Check if field should be validated (based on dependencies)
      if (!this.shouldValidateField(field, data)) {
        continue;
      }

      // Check required
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.name,
          message: `${field.label} is required`,
          code: 'REQUIRED',
        });
        continue;
      }

      // Skip further validation if not required and empty
      if (!field.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Apply validation rules
      const rules = this.validationRules.filter((r) => r.fieldName === field.name);
      for (const rule of rules) {
        // Check dependencies again
        if (rule.dependsOnField && !this.checkDependency(rule, data)) {
          continue;
        }

        const error = this.applyRule(field.name, value, rule);
        if (error) {
          errors.push(error);
          break; // Stop at first error for this field
        }
      }
    }

    return errors;
  }

  /**
   * Validate a specific rule against a value
   */
  private applyRule(fieldName: string, value: unknown, rule: ValidationRule): ValidationError | null {
    if (rule.ruleType === 'required') {
      if (value === undefined || value === null || value === '') {
        return {
          field: fieldName,
          message: rule.errorMessage,
          code: 'REQUIRED',
        };
      }
      return null;
    }

    if (rule.ruleType === 'pattern') {
      if (rule.ruleValue) {
        const regex = new RegExp(String(rule.ruleValue));
        if (!regex.test(String(value))) {
          return {
            field: fieldName,
            message: rule.errorMessage,
            code: 'PATTERN',
          };
        }
      }
      return null;
    }

    if (rule.ruleType === 'minLength') {
      const minLength = Number(rule.ruleValue);
      if (String(value).length < minLength) {
        return {
          field: fieldName,
          message: rule.errorMessage,
          code: 'MIN_LENGTH',
        };
      }
      return null;
    }

    if (rule.ruleType === 'maxLength') {
      const maxLength = Number(rule.ruleValue);
      if (String(value).length > maxLength) {
        return {
          field: fieldName,
          message: rule.errorMessage,
          code: 'MAX_LENGTH',
        };
      }
      return null;
    }

    if (rule.ruleType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return {
          field: fieldName,
          message: rule.errorMessage,
          code: 'INVALID_EMAIL',
        };
      }
      return null;
    }

    if (rule.ruleType === 'date') {
      const date = new Date(String(value));
      if (isNaN(date.getTime())) {
        return {
          field: fieldName,
          message: rule.errorMessage,
          code: 'INVALID_DATE',
        };
      }
      return null;
    }

    return null;
  }

  /**
   * Check if a field should be validated based on dependencies
   */
  private shouldValidateField(field: FormField, data: Record<string, unknown>): boolean {
    if (field.dependsOn && field.dependsOnValue) {
      const dependsOnValue = data[field.dependsOn];
      return dependsOnValue === field.dependsOnValue;
    }
    return true;
  }

  /**
   * Check if a rule's dependencies are met
   */
  private checkDependency(rule: ValidationRule, data: Record<string, unknown>): boolean {
    if (rule.dependsOnField && rule.dependsOnValue) {
      const dependsOnValue = data[rule.dependsOnField];
      return dependsOnValue === rule.dependsOnValue;
    }
    return true;
  }

  /**
   * Get validation errors grouped by field
   */
  getErrorsByField(errors: ValidationError[]): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};
    for (const error of errors) {
      if (!grouped[error.field]) {
        grouped[error.field] = [];
      }
      grouped[error.field].push(error.message);
    }
    return grouped;
  }
}

/**
 * Validate a form submission on the server
 */
export async function validateFormSubmission(
  formId: string,
  submittedData: Record<string, unknown>,
  prisma: PrismaClient
): Promise<{ valid: boolean; errors: ValidationError[] }> {
  try {
    // Fetch form definition
    const form = await prisma.hGFForm.findUnique({
      where: { id: formId },
      include: {
        validationRules: true,
      },
    });

    if (!form) {
      return {
        valid: false,
        errors: [{ field: 'form', message: 'Form not found', code: 'NOT_FOUND' }],
      };
    }

    // Parse form fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields = form.fieldsJson as any as FormField[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rules = form.validationRules as any as ValidationRule[];

    // Create validator
    const validator = new FormValidator(fields, rules);

    // Validate
    const errors = validator.validateForm(submittedData);

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error('Error validating form submission:', error);
    return {
      valid: false,
      errors: [{ field: 'form', message: 'Validation error', code: 'ERROR' }],
    };
  }
}
