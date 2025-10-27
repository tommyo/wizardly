import type { AnswerForQuestion, DateRange, NumberRange, Question, QuestionType, Validation, ValidationResult } from "./types";

/**
 * Validate an answer for a given question with type safety.
 * Ensures the answer matches the expected type and meets validation rules.
 *
 * @example
 * const question: Question<'number-range'> = { ... };
 * const answer: NumberRange = { min: 10, max: 20 };
 * const result = engine.validateAnswer(question, answer);
 */
export function validateAnswer<T extends QuestionType>(
  question: Question<T>,
  answer: AnswerForQuestion<T>
): ValidationResult {
  // Check if required
  if (question.required && (answer === null || answer === undefined || answer === '')) {
    return {
      isValid: false,
      errorMessage: 'This question is required'
    };
  }

  // If not required and empty, it's valid
  if (!question.required && (answer === null || answer === undefined || answer === '')) {
    return { isValid: true };
  }

  // Type-specific validation
  const validation = question.validation;
  if (!validation) {
    return { isValid: true };
  }

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
      errorMessage: validation.customMessage || `Minimum length is ${validation.minLength} characters`
    };
  }

  if (validation.maxLength && value.length > validation.maxLength) {
    return {
      isValid: false,
      errorMessage: validation.customMessage || `Maximum length is ${validation.maxLength} characters`
    };
  }

  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return {
        isValid: false,
        errorMessage: validation.customMessage || 'Invalid format'
      };
    }
  }

  return { isValid: true };
}

function validateNumber(value: number, validation: Validation): ValidationResult {
  if (validation.min !== undefined && value < validation.min) {
    return {
      isValid: false,
      errorMessage: validation.customMessage || `Minimum value is ${validation.min}`
    };
  }

  if (validation.max !== undefined && value > validation.max) {
    return {
      isValid: false,
      errorMessage: validation.customMessage || `Maximum value is ${validation.max}`
    };
  }

  return { isValid: true };
}

function validateNumberRange(value: NumberRange, validation: Validation): ValidationResult {
  if (!value.min || !value.max) {
    return {
      isValid: false,
      errorMessage: 'Both minimum and maximum values are required'
    };
  }

  if (value.min > value.max) {
    return {
      isValid: false,
      errorMessage: 'Minimum value cannot be greater than maximum value'
    };
  }

  if (validation.min !== undefined && (value.min < validation.min || value.max < validation.min)) {
    return {
      isValid: false,
      errorMessage: validation.customMessage || `Values must be at least ${validation.min}`
    };
  }

  if (validation.max !== undefined && (value.min > validation.max || value.max > validation.max)) {
    return {
      isValid: false,
      errorMessage: validation.customMessage || `Values must be at most ${validation.max}`
    };
  }

  return { isValid: true };
}

function validateDate(value: string, validation: Validation): ValidationResult {
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      errorMessage: 'Invalid date'
    };
  }

  if (validation.minDate) {
    const minDate = validation.minDate === 'today' ? new Date() : new Date(validation.minDate);
    minDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < minDate) {
      return {
        isValid: false,
        errorMessage: validation.customMessage || `Date must be ${validation.minDate === 'today' ? 'today or later' : 'after ' + validation.minDate}`
      };
    }
  }

  if (validation.maxDate) {
    const maxDate = validation.maxDate === 'today' ? new Date() : new Date(validation.maxDate);
    maxDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate > maxDate) {
      return {
        isValid: false,
        errorMessage: validation.customMessage || `Date must be ${validation.maxDate === 'today' ? 'today or earlier' : 'before ' + validation.maxDate}`
      };
    }
  }

  return { isValid: true };
}

function validateDateRange(value: DateRange, validation: Validation): ValidationResult {
  if (!value.start || !value.end) {
    return {
      isValid: false,
      errorMessage: 'Both start and end dates are required'
    };
  }

  const startDate = new Date(value.start);
  const endDate = new Date(value.end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return {
      isValid: false,
      errorMessage: 'Invalid date format'
    };
  }

  if (startDate > endDate) {
    return {
      isValid: false,
      errorMessage: 'Start date cannot be after end date'
    };
  }

  // Validate start date
  const startValidation = validateDate(value.start, validation);
  if (!startValidation.isValid) {
    return {
      isValid: false,
      errorMessage: `Start date: ${startValidation.errorMessage}`
    };
  }

  // Validate end date
  const endValidation = validateDate(value.end, validation);
  if (!endValidation.isValid) {
    return {
      isValid: false,
      errorMessage: `End date: ${endValidation.errorMessage}`
    };
  }

  return { isValid: true };
}
