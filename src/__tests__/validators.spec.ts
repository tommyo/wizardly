// validators.spec.ts - Tests for answer validation
import { describe, it, expect } from 'vitest';
import type { Question, NumberRange, DateRange } from '../types';
import { validateAnswer } from '../validators';

describe('Validators', () => {
  describe('validateAnswer - Required Field Validation', () => {
    it('should reject null for required text question', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
        required: true,
      };

      const result = validateAnswer(question, null);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('This question is required');
    });

    it('should reject undefined for required question', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
        required: true,
      };

      const result = validateAnswer(question, undefined);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('This question is required');
    });

    it('should reject empty string for required question', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
        required: true,
      };

      const result = validateAnswer(question, '');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('This question is required');
    });

    it('should accept null for non-required question', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
        required: false,
      };

      const result = validateAnswer(question, null);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept empty string for non-required question', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
        required: false,
      };

      const result = validateAnswer(question, '');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateAnswer - Text Validation', () => {
    it('should validate text with no validation rules', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
      };

      const result = validateAnswer(question, 'John Doe');
      expect(result.isValid).toBe(true);
    });

    it('should enforce minLength', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
        validation: {
          minLength: 5,
        },
      };

      const result = validateAnswer(question, 'John');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Minimum length is 5 characters');
    });

    it('should accept text meeting minLength', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
        validation: {
          minLength: 5,
        },
      };

      const result = validateAnswer(question, 'John Doe');
      expect(result.isValid).toBe(true);
    });

    it('should enforce maxLength', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
        validation: {
          maxLength: 10,
        },
      };

      const result = validateAnswer(question, 'John Doe Smith');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Maximum length is 10 characters');
    });

    it('should accept text meeting maxLength', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
        validation: {
          maxLength: 10,
        },
      };

      const result = validateAnswer(question, 'John Doe');
      expect(result.isValid).toBe(true);
    });

    it('should enforce pattern validation', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Email?',
        validation: {
          pattern: '^[^@]+@[^@]+\\.[^@]+$',
        },
      };

      const result = validateAnswer(question, 'invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Invalid format');
    });

    it('should accept text matching pattern', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Email?',
        validation: {
          pattern: '^[^@]+@[^@]+\\.[^@]+$',
        },
      };

      const result = validateAnswer(question, 'user@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should use custom error message', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Email?',
        validation: {
          pattern: '^[^@]+@[^@]+\\.[^@]+$',
          customMessage: 'Please enter a valid email address',
        },
      };

      const result = validateAnswer(question, 'invalid');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Please enter a valid email address');
    });

    it('should validate multiple rules together', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Password?',
        validation: {
          minLength: 8,
          maxLength: 50,
          pattern: '^(?=.*[A-Z])(?=.*[0-9])',
        },
      };

      // Too short
      expect(validateAnswer(question, 'Pass1').isValid).toBe(false);

      // No uppercase
      expect(validateAnswer(question, 'password123').isValid).toBe(false);

      // No number
      expect(validateAnswer(question, 'Password').isValid).toBe(false);

      // Valid
      expect(validateAnswer(question, 'Password123').isValid).toBe(true);
    });
  });

  describe('validateAnswer - Number Validation', () => {
    it('should validate number with no validation rules', () => {
      const question: Question<'number'> = {
        id: 'q1',
        type: 'number',
        question: 'Age?',
      };

      const result = validateAnswer(question, 25);
      expect(result.isValid).toBe(true);
    });

    it('should enforce min value', () => {
      const question: Question<'number'> = {
        id: 'q1',
        type: 'number',
        question: 'Age?',
        validation: {
          min: 18,
        },
      };

      const result = validateAnswer(question, 16);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Minimum value is 18');
    });

    it('should accept number meeting min value', () => {
      const question: Question<'number'> = {
        id: 'q1',
        type: 'number',
        question: 'Age?',
        validation: {
          min: 18,
        },
      };

      expect(validateAnswer(question, 18).isValid).toBe(true);
      expect(validateAnswer(question, 25).isValid).toBe(true);
    });

    it('should enforce max value', () => {
      const question: Question<'number'> = {
        id: 'q1',
        type: 'number',
        question: 'Age?',
        validation: {
          max: 120,
        },
      };

      const result = validateAnswer(question, 150);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Maximum value is 120');
    });

    it('should accept number meeting max value', () => {
      const question: Question<'number'> = {
        id: 'q1',
        type: 'number',
        question: 'Age?',
        validation: {
          max: 120,
        },
      };

      expect(validateAnswer(question, 120).isValid).toBe(true);
      expect(validateAnswer(question, 100).isValid).toBe(true);
    });

    it('should validate number within range', () => {
      const question: Question<'number'> = {
        id: 'q1',
        type: 'number',
        question: 'Age?',
        validation: {
          min: 13,
          max: 120,
        },
      };

      expect(validateAnswer(question, 12).isValid).toBe(false);
      expect(validateAnswer(question, 13).isValid).toBe(true);
      expect(validateAnswer(question, 50).isValid).toBe(true);
      expect(validateAnswer(question, 120).isValid).toBe(true);
      expect(validateAnswer(question, 121).isValid).toBe(false);
    });

    it('should use custom error message for number validation', () => {
      const question: Question<'number'> = {
        id: 'q1',
        type: 'number',
        question: 'Age?',
        validation: {
          min: 13,
          max: 120,
          customMessage: 'Age must be between 13 and 120',
        },
      };

      const result = validateAnswer(question, 10);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Age must be between 13 and 120');
    });

    it('should handle zero as valid number', () => {
      const question: Question<'number'> = {
        id: 'q1',
        type: 'number',
        question: 'Count?',
        validation: {
          min: 0,
        },
      };

      expect(validateAnswer(question, 0).isValid).toBe(true);
    });

    it('should handle negative numbers', () => {
      const question: Question<'number'> = {
        id: 'q1',
        type: 'number',
        question: 'Temperature?',
        validation: {
          min: -100,
          max: 100,
        },
      };

      expect(validateAnswer(question, -50).isValid).toBe(true);
      expect(validateAnswer(question, -101).isValid).toBe(false);
    });
  });

  describe('validateAnswer - Number Range Validation', () => {
    it('should validate number range with no validation rules', () => {
      const question: Question<'number-range'> = {
        id: 'q1',
        type: 'number-range',
        question: 'Price range?',
      };

      const answer: NumberRange = { min: 10, max: 100 };
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(true);
    });

    it('should reject range with missing min', () => {
      const question: Question<'number-range'> = {
        id: 'q1',
        type: 'number-range',
        question: 'Price range?',
      };

      const answer = { max: 100 } as NumberRange;
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Both minimum and maximum values are required');
    });

    it('should reject range with missing max', () => {
      const question: Question<'number-range'> = {
        id: 'q1',
        type: 'number-range',
        question: 'Price range?',
      };

      const answer = { min: 10 } as NumberRange;
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Both minimum and maximum values are required');
    });

    it('should reject range where min > max', () => {
      const question: Question<'number-range'> = {
        id: 'q1',
        type: 'number-range',
        question: 'Price range?',
      };

      const answer: NumberRange = { min: 100, max: 10 };
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Minimum value cannot be greater than maximum value');
    });

    it('should accept range where min equals max', () => {
      const question: Question<'number-range'> = {
        id: 'q1',
        type: 'number-range',
        question: 'Price range?',
      };

      const answer: NumberRange = { min: 50, max: 50 };
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(true);
    });

    it('should enforce min constraint on both values', () => {
      const question: Question<'number-range'> = {
        id: 'q1',
        type: 'number-range',
        question: 'Price range?',
        validation: {
          min: 10,
        },
      };

      // Both below min
      expect(validateAnswer(question, { min: 5, max: 8 }).isValid).toBe(false);

      // Min below constraint
      expect(validateAnswer(question, { min: 5, max: 20 }).isValid).toBe(false);

      // Max below constraint
      expect(validateAnswer(question, { min: 15, max: 8 }).isValid).toBe(false);

      // Both at or above min
      expect(validateAnswer(question, { min: 10, max: 20 }).isValid).toBe(true);
    });

    it('should enforce max constraint on both values', () => {
      const question: Question<'number-range'> = {
        id: 'q1',
        type: 'number-range',
        question: 'Price range?',
        validation: {
          max: 100,
        },
      };

      // Both above max
      expect(validateAnswer(question, { min: 110, max: 120 }).isValid).toBe(false);

      // Min above constraint
      expect(validateAnswer(question, { min: 110, max: 90 }).isValid).toBe(false);

      // Max above constraint
      expect(validateAnswer(question, { min: 50, max: 110 }).isValid).toBe(false);

      // Both at or below max
      expect(validateAnswer(question, { min: 50, max: 100 }).isValid).toBe(true);
    });

    it('should use custom error message for range validation', () => {
      const question: Question<'number-range'> = {
        id: 'q1',
        type: 'number-range',
        question: 'Price range?',
        validation: {
          min: 10,
          customMessage: 'Price must be at least $10',
        },
      };

      const result = validateAnswer(question, { min: 5, max: 20 });
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Price must be at least $10');
    });
  });

  describe('validateAnswer - Date Validation', () => {
    it('should validate date with no validation rules', () => {
      const question: Question<'date'> = {
        id: 'q1',
        type: 'date',
        question: 'Birth date?',
      };

      const result = validateAnswer(question, '2024-01-01');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid date string', () => {
      const question: Question<'date'> = {
        id: 'q1',
        type: 'date',
        question: 'Birth date?',
      };

      const result = validateAnswer(question, 'not-a-date');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Invalid date');
    });

    it('should enforce minDate with specific date', () => {
      const question: Question<'date'> = {
        id: 'q1',
        type: 'date',
        question: 'Event date?',
        validation: {
          minDate: '2024-01-01',
        },
      };

      expect(validateAnswer(question, '2023-12-31').isValid).toBe(false);
      expect(validateAnswer(question, '2024-01-01').isValid).toBe(true);
      expect(validateAnswer(question, '2024-01-02').isValid).toBe(true);
    });

    it('should enforce maxDate with specific date', () => {
      const question: Question<'date'> = {
        id: 'q1',
        type: 'date',
        question: 'Event date?',
        validation: {
          maxDate: '2024-12-31',
        },
      };

      expect(validateAnswer(question, '2025-01-01').isValid).toBe(false);
      expect(validateAnswer(question, '2024-12-31').isValid).toBe(true);
      expect(validateAnswer(question, '2024-12-30').isValid).toBe(true);
    });

    it('should enforce minDate with "today"', () => {
      const question: Question<'date'> = {
        id: 'q1',
        type: 'date',
        question: 'Event date?',
        validation: {
          minDate: 'today',
        },
      };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]!;

      const today = new Date().toISOString().split('T')[0]!;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0]!;

      expect(validateAnswer(question, yesterdayStr).isValid).toBe(false);
      expect(validateAnswer(question, today).isValid).toBe(true);
      expect(validateAnswer(question, tomorrowStr).isValid).toBe(true);
    });

    it('should enforce maxDate with "today"', () => {
      const question: Question<'date'> = {
        id: 'q1',
        type: 'date',
        question: 'Birth date?',
        validation: {
          maxDate: 'today',
        },
      };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]!;

      const today = new Date().toISOString().split('T')[0]!;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0]!;

      expect(validateAnswer(question, tomorrowStr).isValid).toBe(false);
      expect(validateAnswer(question, today).isValid).toBe(true);
      expect(validateAnswer(question, yesterdayStr).isValid).toBe(true);
    });

    it('should use custom error message for date validation', () => {
      const question: Question<'date'> = {
        id: 'q1',
        type: 'date',
        question: 'Event date?',
        validation: {
          minDate: 'today',
          customMessage: 'Event must be in the future',
        },
      };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]!;

      const result = validateAnswer(question, yesterdayStr);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Event must be in the future');
    });

    it('should handle time components in date strings', () => {
      const question: Question<'date'> = {
        id: 'q1',
        type: 'date',
        question: 'Event date?',
        validation: {
          minDate: '2024-01-01',
        },
      };

      // Same date but with time should be valid
      expect(validateAnswer(question, '2024-01-01T12:00:00Z').isValid).toBe(true);
      expect(validateAnswer(question, '2024-01-01T23:59:59Z').isValid).toBe(true);
    });
  });

  describe('validateAnswer - Date Range Validation', () => {
    it('should validate date range with no validation rules', () => {
      const question: Question<'date-range'> = {
        id: 'q1',
        type: 'date-range',
        question: 'Event dates?',
      };

      const answer: DateRange = {
        start: '2024-01-01',
        end: '2024-12-31',
      };
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(true);
    });

    it('should reject range with missing start', () => {
      const question: Question<'date-range'> = {
        id: 'q1',
        type: 'date-range',
        question: 'Event dates?',
      };

      const answer = { end: '2024-12-31' } as DateRange;
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Both start and end dates are required');
    });

    it('should reject range with missing end', () => {
      const question: Question<'date-range'> = {
        id: 'q1',
        type: 'date-range',
        question: 'Event dates?',
      };

      const answer = { start: '2024-01-01' } as DateRange;
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Both start and end dates are required');
    });

    it('should reject range with invalid start date', () => {
      const question: Question<'date-range'> = {
        id: 'q1',
        type: 'date-range',
        question: 'Event dates?',
      };

      const answer: DateRange = {
        start: 'invalid',
        end: '2024-12-31',
      };
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Invalid date format');
    });

    it('should reject range with invalid end date', () => {
      const question: Question<'date-range'> = {
        id: 'q1',
        type: 'date-range',
        question: 'Event dates?',
      };

      const answer: DateRange = {
        start: '2024-01-01',
        end: 'invalid',
      };
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Invalid date format');
    });

    it('should reject range where start > end', () => {
      const question: Question<'date-range'> = {
        id: 'q1',
        type: 'date-range',
        question: 'Event dates?',
      };

      const answer: DateRange = {
        start: '2024-12-31',
        end: '2024-01-01',
      };
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('Start date cannot be after end date');
    });

    it('should accept range where start equals end', () => {
      const question: Question<'date-range'> = {
        id: 'q1',
        type: 'date-range',
        question: 'Event dates?',
      };

      const answer: DateRange = {
        start: '2024-06-15',
        end: '2024-06-15',
      };
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(true);
    });

    it('should validate start date against minDate', () => {
      const question: Question<'date-range'> = {
        id: 'q1',
        type: 'date-range',
        question: 'Event dates?',
        validation: {
          minDate: '2024-01-01',
        },
      };

      const answer: DateRange = {
        start: '2023-12-31',
        end: '2024-06-30',
      };
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain('Start date:');
    });

    it('should validate end date against maxDate', () => {
      const question: Question<'date-range'> = {
        id: 'q1',
        type: 'date-range',
        question: 'Event dates?',
        validation: {
          maxDate: '2024-12-31',
        },
      };

      const answer: DateRange = {
        start: '2024-01-01',
        end: '2025-01-01',
      };
      const result = validateAnswer(question, answer);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain('End date:');
    });

    it('should validate both dates within constraints', () => {
      const question: Question<'date-range'> = {
        id: 'q1',
        type: 'date-range',
        question: 'Event dates?',
        validation: {
          minDate: '2024-01-01',
          maxDate: '2024-12-31',
        },
      };

      const validAnswer: DateRange = {
        start: '2024-06-01',
        end: '2024-06-30',
      };
      expect(validateAnswer(question, validAnswer).isValid).toBe(true);

      const invalidStart: DateRange = {
        start: '2023-12-31',
        end: '2024-06-30',
      };
      expect(validateAnswer(question, invalidStart).isValid).toBe(false);

      const invalidEnd: DateRange = {
        start: '2024-06-01',
        end: '2025-01-01',
      };
      expect(validateAnswer(question, invalidEnd).isValid).toBe(false);
    });
  });

  describe('validateAnswer - Boolean and Multiple Choice', () => {
    it('should validate boolean answers without validation', () => {
      const question: Question<'boolean'> = {
        id: 'q1',
        type: 'boolean',
        question: 'Subscribe?',
      };

      expect(validateAnswer(question, true).isValid).toBe(true);
      expect(validateAnswer(question, false).isValid).toBe(true);
    });

    it('should validate multiple-choice answers without validation', () => {
      const question: Question<'multiple-choice'> = {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Choose option',
        options: [
          { label: 'Option 1', value: 'opt1' },
          { label: 'Option 2', value: 'opt2' },
        ],
      };

      expect(validateAnswer(question, 'opt1').isValid).toBe(true);
      expect(validateAnswer(question, ['opt1', 'opt2']).isValid).toBe(true);
    });
  });

  describe('validateAnswer - Edge Cases', () => {
    it('should handle questions without validation property', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
      };

      const result = validateAnswer(question, 'John');
      expect(result.isValid).toBe(true);
    });

    it('should handle empty validation object', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
        validation: {},
      };

      const result = validateAnswer(question, 'John');
      expect(result.isValid).toBe(true);
    });

    it('should prioritize required check before type-specific validation', () => {
      const question: Question<'text'> = {
        id: 'q1',
        type: 'text',
        question: 'Name?',
        required: true,
        validation: {
          minLength: 5,
        },
      };

      const result = validateAnswer(question, '');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('This question is required');
    });

    it('should handle validation with zero values', () => {
      const question: Question<'number'> = {
        id: 'q1',
        type: 'number',
        question: 'Count?',
        validation: {
          min: 0,
          max: 10,
        },
      };

      expect(validateAnswer(question, 0).isValid).toBe(true);
    });
  });
});
