// type-guards.ts - Runtime type validation for wizard answer values

import type { NumberRange, DateRange, AnswerForQuestion, QuestionType } from './types';

/**
 * Type guard for text answers
 */
export function isTextAnswer(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for boolean answers
 */
export function isBooleanAnswer(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard for number answers
 */
export function isNumberAnswer(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard for multiple choice answers (single or multiple selection)
 */
export function isMultipleChoiceAnswer(value: unknown): value is string | string[] {
  return typeof value === 'string' ||
    (Array.isArray(value) && value.every(v => typeof v === 'string'));
}

/**
 * Type guard for number range answers
 */
export function isNumberRangeAnswer(value: unknown): value is NumberRange {
  return typeof value === 'object' &&
    value !== null &&
    'min' in value &&
    'max' in value &&
    typeof (value as NumberRange).min === 'number' &&
    typeof (value as NumberRange).max === 'number' &&
    !isNaN((value as NumberRange).min) &&
    !isNaN((value as NumberRange).max);
}

/**
 * Type guard for date answers (ISO date string)
 */
export function isDateAnswer(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Type guard for date range answers
 */
export function isDateRangeAnswer(value: unknown): value is DateRange {
  if (typeof value !== 'object' || value === null) return false;

  const range = value as DateRange;
  return 'start' in range &&
    'end' in range &&
    typeof range.start === 'string' &&
    typeof range.end === 'string' &&
    !isNaN(new Date(range.start).getTime()) &&
    !isNaN(new Date(range.end).getTime());
}

/**
 * Generic type guard factory that returns the appropriate type guard for a question type.
 * This enables runtime validation with compile-time type safety.
 *
 * @example
 * const guard = createAnswerTypeGuard('number-range');
 * if (guard(value)) {
 *   // value is now typed as NumberRange
 *   console.log(value.min, value.max);
 * }
 */
export function createAnswerTypeGuard<T extends QuestionType>(
  type: T
): (value: unknown) => value is AnswerForQuestion<T> {
  const guards: Record<QuestionType, (value: unknown) => boolean> = {
    'text': isTextAnswer,
    'boolean': isBooleanAnswer,
    'number': isNumberAnswer,
    'multiple-choice': isMultipleChoiceAnswer,
    'number-range': isNumberRangeAnswer,
    'date': isDateAnswer,
    'date-range': isDateRangeAnswer,
  };

  return guards[type] as (value: unknown) => value is AnswerForQuestion<T>;
}

/**
 * Validates that a value matches the expected type for a question.
 * Returns a validation result with error message if invalid.
 *
 * @example
 * const result = validateAnswerType('number', '123');
 * if (!result.isValid) {
 *   console.error(result.errorMessage);
 * }
 */
export function validateAnswerType(
  questionType: QuestionType,
  value: unknown
): { isValid: boolean; errorMessage?: string } {
  const guard = createAnswerTypeGuard(questionType);

  if (guard(value)) {
    return { isValid: true };
  }

  const expectedTypes: Record<QuestionType, string> = {
    'text': 'a string',
    'boolean': 'a boolean',
    'number': 'a number',
    'multiple-choice': 'a string or array of strings',
    'number-range': 'an object with min and max numbers',
    'date': 'a valid ISO date string',
    'date-range': 'an object with start and end date strings',
  };

  return {
    isValid: false,
    errorMessage: `Expected ${expectedTypes[questionType]}, but received ${typeof value}`
  };
}
