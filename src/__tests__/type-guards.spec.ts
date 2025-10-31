// type-guards.spec.ts - Tests for runtime type validation
import { describe, it, expect } from 'vitest';
import {
  isTextAnswer,
  isBooleanAnswer,
  isNumberAnswer,
  isMultipleChoiceAnswer,
  isNumberRangeAnswer,
  isDateAnswer,
  isDateRangeAnswer,
  createAnswerTypeGuard,
  validateAnswerType,
} from '../type-guards';
import type { QuestionType } from '../types';

describe('Type Guards', () => {
  describe('isTextAnswer', () => {
    it('should return true for string values', () => {
      expect(isTextAnswer('hello')).toBe(true);
      expect(isTextAnswer('')).toBe(true);
      expect(isTextAnswer('123')).toBe(true);
      expect(isTextAnswer('special chars: !@#$%')).toBe(true);
    });

    it('should return false for non-string values', () => {
      expect(isTextAnswer(123)).toBe(false);
      expect(isTextAnswer(true)).toBe(false);
      expect(isTextAnswer(null)).toBe(false);
      expect(isTextAnswer(undefined)).toBe(false);
      expect(isTextAnswer({})).toBe(false);
      expect(isTextAnswer([])).toBe(false);
    });
  });

  describe('isBooleanAnswer', () => {
    it('should return true for boolean values', () => {
      expect(isBooleanAnswer(true)).toBe(true);
      expect(isBooleanAnswer(false)).toBe(true);
    });

    it('should return false for non-boolean values', () => {
      expect(isBooleanAnswer('true')).toBe(false);
      expect(isBooleanAnswer(1)).toBe(false);
      expect(isBooleanAnswer(0)).toBe(false);
      expect(isBooleanAnswer(null)).toBe(false);
      expect(isBooleanAnswer(undefined)).toBe(false);
      expect(isBooleanAnswer({})).toBe(false);
    });
  });

  describe('isNumberAnswer', () => {
    it('should return true for valid number values', () => {
      expect(isNumberAnswer(0)).toBe(true);
      expect(isNumberAnswer(123)).toBe(true);
      expect(isNumberAnswer(-456)).toBe(true);
      expect(isNumberAnswer(3.14)).toBe(true);
      expect(isNumberAnswer(Infinity)).toBe(true);
      expect(isNumberAnswer(-Infinity)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isNumberAnswer(NaN)).toBe(false);
    });

    it('should return false for non-number values', () => {
      expect(isNumberAnswer('123')).toBe(false);
      expect(isNumberAnswer(true)).toBe(false);
      expect(isNumberAnswer(null)).toBe(false);
      expect(isNumberAnswer(undefined)).toBe(false);
      expect(isNumberAnswer({})).toBe(false);
      expect(isNumberAnswer([])).toBe(false);
    });
  });

  describe('isMultipleChoiceAnswer', () => {
    it('should return true for string values', () => {
      expect(isMultipleChoiceAnswer('option1')).toBe(true);
      expect(isMultipleChoiceAnswer('')).toBe(true);
    });

    it('should return true for string arrays', () => {
      expect(isMultipleChoiceAnswer(['option1'])).toBe(true);
      expect(isMultipleChoiceAnswer(['option1', 'option2'])).toBe(true);
      expect(isMultipleChoiceAnswer([])).toBe(true);
    });

    it('should return false for arrays with non-string elements', () => {
      expect(isMultipleChoiceAnswer([1, 2, 3])).toBe(false);
      expect(isMultipleChoiceAnswer(['option1', 123])).toBe(false);
      expect(isMultipleChoiceAnswer([true, false])).toBe(false);
      expect(isMultipleChoiceAnswer([null])).toBe(false);
    });

    it('should return false for non-string, non-array values', () => {
      expect(isMultipleChoiceAnswer(123)).toBe(false);
      expect(isMultipleChoiceAnswer(true)).toBe(false);
      expect(isMultipleChoiceAnswer(null)).toBe(false);
      expect(isMultipleChoiceAnswer(undefined)).toBe(false);
      expect(isMultipleChoiceAnswer({})).toBe(false);
    });
  });

  describe('isNumberRangeAnswer', () => {
    it('should return true for valid number range objects', () => {
      expect(isNumberRangeAnswer({ min: 0, max: 10 })).toBe(true);
      expect(isNumberRangeAnswer({ min: -100, max: 100 })).toBe(true);
      expect(isNumberRangeAnswer({ min: 3.14, max: 6.28 })).toBe(true);
      expect(isNumberRangeAnswer({ min: 0, max: 0 })).toBe(true);
    });

    it('should return false for objects with NaN values', () => {
      expect(isNumberRangeAnswer({ min: NaN, max: 10 })).toBe(false);
      expect(isNumberRangeAnswer({ min: 0, max: NaN })).toBe(false);
      expect(isNumberRangeAnswer({ min: NaN, max: NaN })).toBe(false);
    });

    it('should return false for objects missing min or max', () => {
      expect(isNumberRangeAnswer({ min: 0 })).toBe(false);
      expect(isNumberRangeAnswer({ max: 10 })).toBe(false);
      expect(isNumberRangeAnswer({})).toBe(false);
    });

    it('should return false for objects with non-number min or max', () => {
      expect(isNumberRangeAnswer({ min: '0', max: 10 })).toBe(false);
      expect(isNumberRangeAnswer({ min: 0, max: '10' })).toBe(false);
      expect(isNumberRangeAnswer({ min: true, max: false })).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isNumberRangeAnswer(null)).toBe(false);
      expect(isNumberRangeAnswer(undefined)).toBe(false);
      expect(isNumberRangeAnswer('range')).toBe(false);
      expect(isNumberRangeAnswer(123)).toBe(false);
      expect(isNumberRangeAnswer([])).toBe(false);
    });
  });

  describe('isDateAnswer', () => {
    it('should return true for valid ISO date strings', () => {
      expect(isDateAnswer('2024-01-01')).toBe(true);
      expect(isDateAnswer('2024-12-31T23:59:59Z')).toBe(true);
      expect(isDateAnswer('2024-06-15T12:30:00.000Z')).toBe(true);
    });

    it('should return true for parseable date strings', () => {
      expect(isDateAnswer('January 1, 2024')).toBe(true);
      expect(isDateAnswer('01/01/2024')).toBe(true);
      expect(isDateAnswer('2024/01/01')).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isDateAnswer('not-a-date')).toBe(false);
      expect(isDateAnswer('2024-13-01')).toBe(false); // Invalid month
      expect(isDateAnswer('2024-02-30')).toBe(false); // Invalid day
      expect(isDateAnswer('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isDateAnswer(123)).toBe(false);
      expect(isDateAnswer(true)).toBe(false);
      expect(isDateAnswer(null)).toBe(false);
      expect(isDateAnswer(undefined)).toBe(false);
      expect(isDateAnswer(new Date())).toBe(false);
      expect(isDateAnswer({})).toBe(false);
    });
  });

  describe('isDateRangeAnswer', () => {
    it('should return true for valid date range objects', () => {
      expect(isDateRangeAnswer({
        start: '2024-01-01',
        end: '2024-12-31'
      })).toBe(true);

      expect(isDateRangeAnswer({
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-01T23:59:59Z'
      })).toBe(true);
    });

    it('should return false for objects with invalid date strings', () => {
      expect(isDateRangeAnswer({
        start: 'not-a-date',
        end: '2024-12-31'
      })).toBe(false);

      expect(isDateRangeAnswer({
        start: '2024-01-01',
        end: 'invalid'
      })).toBe(false);

      expect(isDateRangeAnswer({
        start: 'invalid',
        end: 'also-invalid'
      })).toBe(false);
    });

    it('should return false for objects missing start or end', () => {
      expect(isDateRangeAnswer({ start: '2024-01-01' })).toBe(false);
      expect(isDateRangeAnswer({ end: '2024-12-31' })).toBe(false);
      expect(isDateRangeAnswer({})).toBe(false);
    });

    it('should return false for objects with non-string start or end', () => {
      expect(isDateRangeAnswer({
        start: 123,
        end: '2024-12-31'
      })).toBe(false);

      expect(isDateRangeAnswer({
        start: '2024-01-01',
        end: new Date()
      })).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isDateRangeAnswer(null)).toBe(false);
      expect(isDateRangeAnswer(undefined)).toBe(false);
      expect(isDateRangeAnswer('date-range')).toBe(false);
      expect(isDateRangeAnswer(123)).toBe(false);
      expect(isDateRangeAnswer([])).toBe(false);
    });
  });

  describe('createAnswerTypeGuard', () => {
    it('should return correct type guard for text type', () => {
      const guard = createAnswerTypeGuard('text');
      expect(guard('hello')).toBe(true);
      expect(guard(123)).toBe(false);
    });

    it('should return correct type guard for boolean type', () => {
      const guard = createAnswerTypeGuard('boolean');
      expect(guard(true)).toBe(true);
      expect(guard(false)).toBe(true);
      expect(guard('true')).toBe(false);
    });

    it('should return correct type guard for number type', () => {
      const guard = createAnswerTypeGuard('number');
      expect(guard(123)).toBe(true);
      expect(guard('123')).toBe(false);
      expect(guard(NaN)).toBe(false);
    });

    it('should return correct type guard for multiple-choice type', () => {
      const guard = createAnswerTypeGuard('multiple-choice');
      expect(guard('option1')).toBe(true);
      expect(guard(['option1', 'option2'])).toBe(true);
      expect(guard(123)).toBe(false);
    });

    it('should return correct type guard for number-range type', () => {
      const guard = createAnswerTypeGuard('number-range');
      expect(guard({ min: 0, max: 10 })).toBe(true);
      expect(guard({ min: 0 })).toBe(false);
      expect(guard('range')).toBe(false);
    });

    it('should return correct type guard for date type', () => {
      const guard = createAnswerTypeGuard('date');
      expect(guard('2024-01-01')).toBe(true);
      expect(guard('not-a-date')).toBe(false);
      expect(guard(123)).toBe(false);
    });

    it('should return correct type guard for date-range type', () => {
      const guard = createAnswerTypeGuard('date-range');
      expect(guard({
        start: '2024-01-01',
        end: '2024-12-31'
      })).toBe(true);
      expect(guard({ start: '2024-01-01' })).toBe(false);
      expect(guard('range')).toBe(false);
    });

    it('should provide type narrowing in TypeScript', () => {
      const guard = createAnswerTypeGuard('number-range');
      const value: unknown = { min: 0, max: 10 };

      if (guard(value)) {
        // TypeScript should know value is NumberRange here
        expect(value.min).toBe(0);
        expect(value.max).toBe(10);
      }
    });
  });

  describe('validateAnswerType', () => {
    describe('text validation', () => {
      it('should validate string values', () => {
        const result = validateAnswerType('text', 'hello');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });

      it('should reject non-string values', () => {
        const result = validateAnswerType('text', 123);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Expected a string, but received number');
      });
    });

    describe('boolean validation', () => {
      it('should validate boolean values', () => {
        expect(validateAnswerType('boolean', true).isValid).toBe(true);
        expect(validateAnswerType('boolean', false).isValid).toBe(true);
      });

      it('should reject non-boolean values', () => {
        const result = validateAnswerType('boolean', 'true');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Expected a boolean, but received string');
      });
    });

    describe('number validation', () => {
      it('should validate number values', () => {
        expect(validateAnswerType('number', 123).isValid).toBe(true);
        expect(validateAnswerType('number', 0).isValid).toBe(true);
        expect(validateAnswerType('number', -456).isValid).toBe(true);
      });

      it('should reject NaN', () => {
        const result = validateAnswerType('number', NaN);
        expect(result.isValid).toBe(false);
      });

      it('should reject non-number values', () => {
        const result = validateAnswerType('number', '123');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Expected a number, but received string');
      });
    });

    describe('multiple-choice validation', () => {
      it('should validate string values', () => {
        const result = validateAnswerType('multiple-choice', 'option1');
        expect(result.isValid).toBe(true);
      });

      it('should validate string array values', () => {
        const result = validateAnswerType('multiple-choice', ['option1', 'option2']);
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid values', () => {
        const result = validateAnswerType('multiple-choice', 123);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Expected a string or array of strings, but received number');
      });
    });

    describe('number-range validation', () => {
      it('should validate number range objects', () => {
        const result = validateAnswerType('number-range', { min: 0, max: 10 });
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid objects', () => {
        const result = validateAnswerType('number-range', { min: 0 });
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Expected an object with min and max numbers, but received object');
      });

      it('should reject non-object values', () => {
        const result = validateAnswerType('number-range', 'range');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Expected an object with min and max numbers, but received string');
      });
    });

    describe('date validation', () => {
      it('should validate ISO date strings', () => {
        const result = validateAnswerType('date', '2024-01-01');
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid date strings', () => {
        const result = validateAnswerType('date', 'not-a-date');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Expected a valid ISO date string, but received string');
      });

      it('should reject non-string values', () => {
        const result = validateAnswerType('date', 123);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Expected a valid ISO date string, but received number');
      });
    });

    describe('date-range validation', () => {
      it('should validate date range objects', () => {
        const result = validateAnswerType('date-range', {
          start: '2024-01-01',
          end: '2024-12-31'
        });
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid date range objects', () => {
        const result = validateAnswerType('date-range', {
          start: 'invalid',
          end: '2024-12-31'
        });
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Expected an object with start and end date strings, but received object');
      });

      it('should reject non-object values', () => {
        const result = validateAnswerType('date-range', 'range');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Expected an object with start and end date strings, but received string');
      });
    });

    describe('edge cases', () => {
      it('should handle null values', () => {
        const result = validateAnswerType('text', null);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Expected a string, but received object');
      });

      it('should handle undefined values', () => {
        const result = validateAnswerType('number', undefined);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Expected a number, but received undefined');
      });

      it('should handle empty string for text', () => {
        const result = validateAnswerType('text', '');
        expect(result.isValid).toBe(true);
      });

      it('should handle empty array for multiple-choice', () => {
        const result = validateAnswerType('multiple-choice', []);
        expect(result.isValid).toBe(true);
      });
    });

    describe('all question types', () => {
      const questionTypes: QuestionType[] = [
        'text',
        'boolean',
        'number',
        'multiple-choice',
        'number-range',
        'date',
        'date-range'
      ];

      it('should have validation for all question types', () => {
        questionTypes.forEach(type => {
          // Should not throw error
          expect(() => createAnswerTypeGuard(type)).not.toThrow();
        });
      });
    });
  });
});
