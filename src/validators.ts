import type { AnswerValueMap, DateRange, NumberRange, Question, QuestionType, Validation, ValidationResult } from './types';

/**
 * Validate an answer for a given question with type safety.
 * Ensures the answer matches the expected type and meets validation rules.
 *
 * @example
 * const question: Question<'number-range'> = { ... };
 * const answer: NumberRange = { min: 10, max: 20 };
 * const result = validateAnswer(question, answer);
 */
export function validateAnswer<T extends QuestionType>(
  question: Question<T>,
  answer: AnswerValueMap[T] | null | undefined,
): ValidationResult {
  // Check if required
  if (question.required && (answer === null || answer === undefined || answer === '')) {
    return {
      isValid: false,
      error: new Error('This question is required'),
    };
  }

  // If not required and empty, it's valid
  if (!question.required && (answer === null || answer === undefined || answer === '')) {
    return { isValid: true };
  }

  // Type-specific validation
  const validation = question.validation || {};

  switch (question.type) {
    case 'text':
      return validateText(answer as string, validation);

    case 'number':
      return validateNumber(answer as number, validation);

    case 'number-range':
      return validateNumberRange(answer as NumberRange, validation);

    case 'date':
      return validateDate(answer as string, validation);

    case 'date-range':
      return validateDateRange(answer as DateRange, validation);

    default:
      return { isValid: true };
  }
}

function validateText(value: string, validation: Validation): ValidationResult {
  if (validation.minLength && value.length < validation.minLength) {
    return {
      isValid: false,
      error: new Error(validation.customMessage || `Minimum length is ${validation.minLength} characters`),
    };
  }

  if (validation.maxLength && value.length > validation.maxLength) {
    return {
      isValid: false,
      error: new Error(validation.customMessage || `Maximum length is ${validation.maxLength} characters`),
    };
  }

  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return {
        isValid: false,
        error: new Error(validation.customMessage || 'Invalid format'),
      };
    }
  }

  return { isValid: true };
}

function validateNumber(value: number, validation: Validation): ValidationResult {
  if (validation.min !== undefined && value < validation.min) {
    return {
      isValid: false,
      error: new Error(validation.customMessage || `Minimum value is ${validation.min}`),
    };
  }

  if (validation.max !== undefined && value > validation.max) {
    return {
      isValid: false,
      error: new Error(validation.customMessage || `Maximum value is ${validation.max}`),
    };
  }

  return { isValid: true };
}

/**
 * Helper function to validate a number range structure
 * Used by both validators and type guards
 */
export function isValidNumberRange(value: NumberRange): boolean {
  if (value.min === null || value.min === undefined || value.max === null || value.max === undefined) {
    return false;
  }
  if (typeof value.min !== 'number' || typeof value.max !== 'number') {
    return false;
  }
  if (isNaN(value.min) || isNaN(value.max)) {
    return false;
  }
  return true;
}

function validateNumberRange(value: NumberRange, validation: Validation): ValidationResult {
  if (!isValidNumberRange(value)) {
    return {
      isValid: false,
      error: new Error('Both minimum and maximum values are required'),
    };
  }
  if (value.min > value.max) {
    return {
      isValid: false,
      error: new Error('Minimum value cannot be greater than maximum value'),
    };
  }

  if (validation.min !== undefined && (value.min < validation.min || value.max < validation.min)) {
    return {
      isValid: false,
      error: new Error(validation.customMessage || `Values must be at least ${validation.min}`),
    };
  }

  if (validation.max !== undefined && (value.min > validation.max || value.max > validation.max)) {
    return {
      isValid: false,
      error: new Error(validation.customMessage || `Values must be at most ${validation.max}`),
    };
  }

  return { isValid: true };
}

/**
 * Helper function to validate a date string format
 * Used by both validators and type guards
 */
export function isValidDateString(value: string): boolean {
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return false;
  }

  // For ISO format dates, verify the date wasn't adjusted (e.g., Feb 30 -> Mar 2)
  if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
    const datePart = value.split('T')[0];
    if (!datePart) return false;

    const parts = datePart.split('-');
    if (parts.length !== 3) return false;

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10);
    const day = parseInt(parts[2]!, 10);
    /* eslint-enable @typescript-eslint/no-non-null-assertion */

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }

    // Verify the date wasn't adjusted (e.g., Feb 30 -> Mar 2)
    if (date.getUTCFullYear() !== year ||
      date.getUTCMonth() + 1 !== month ||
      date.getUTCDate() !== day) {
      return false;
    }
  }

  return true;
}

function validateDate(value: string, validation: Validation): ValidationResult {
  if (!isValidDateString(value)) {
    return {
      isValid: false,
      error: new Error('Invalid date'),
    };
  }
  const date = new Date(value);

  if (validation.minDate) {
    // Normalize both dates to UTC midnight for comparison
    let minDate: number;
    if (validation.minDate === 'today') {
      const today = new Date();
      minDate = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    } else {
      const minDateObj = new Date(validation.minDate);
      minDate = Date.UTC(minDateObj.getUTCFullYear(), minDateObj.getUTCMonth(), minDateObj.getUTCDate());
    }

    const checkYear = date.getUTCFullYear();
    const checkMonth = date.getUTCMonth();
    const checkDay = date.getUTCDate();
    const checkDate = Date.UTC(checkYear, checkMonth, checkDay);

    if (checkDate < minDate) {
      return {
        isValid: false,
        error: new Error(validation.customMessage || `Date must be ${validation.minDate === 'today' ? 'today or later' : 'after ' + validation.minDate}`),
      };
    }
  }

  if (validation.maxDate) {
    // Normalize both dates to UTC midnight for comparison
    let maxDate: number;
    if (validation.maxDate === 'today') {
      const today = new Date();
      maxDate = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    } else {
      const maxDateObj = new Date(validation.maxDate);
      maxDate = Date.UTC(maxDateObj.getUTCFullYear(), maxDateObj.getUTCMonth(), maxDateObj.getUTCDate());
    }

    const checkYear = date.getUTCFullYear();
    const checkMonth = date.getUTCMonth();
    const checkDay = date.getUTCDate();
    const checkDate = Date.UTC(checkYear, checkMonth, checkDay);

    if (checkDate > maxDate) {
      return {
        isValid: false,
        error: new Error(validation.customMessage || `Date must be ${validation.maxDate === 'today' ? 'today or earlier' : 'before ' + validation.maxDate}`),
      };
    }
  }

  return { isValid: true };
}

function validateDateRange(value: DateRange, validation: Validation): ValidationResult {
  if (!value.start || !value.end || value.start === '' || value.end === '') {
    return {
      isValid: false,
      error: new Error('Both start and end dates are required'),
    };
  }

  const startDate = new Date(value.start);
  const endDate = new Date(value.end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return {
      isValid: false,
      error: new Error('Invalid date format'),
    };
  }

  if (startDate > endDate) {
    return {
      isValid: false,
      error: new Error('Start date cannot be after end date'),
    };
  }

  // Validate start date
  const startValidation = validateDate(value.start, validation);
  if (!startValidation.isValid) {
    return {
      isValid: false,
      error: new Error(`Start date: ${startValidation.error}`),
    };
  }

  // Validate end date
  const endValidation = validateDate(value.end, validation);
  if (!endValidation.isValid) {
    return {
      isValid: false,
      error: new Error(`End date: ${endValidation.error}`),
    };
  }

  return { isValid: true };
}
