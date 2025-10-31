// useWizard.spec.ts - Tests for useWizard composable
import { describe, it, expect } from 'vitest';
import { useWizard } from '../composables/useWizard';
import type { Question, Answer } from '../types';

describe('useWizard Composable', () => {
  describe('Initialization', () => {
    it('should initialize with questions', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Name?', required: true },
        { id: 'q2', type: 'number', question: 'Age?', required: true },
      ];

      const wizard = useWizard(questions);

      expect(wizard.currentQuestions.value.length).toBe(1);
      expect(wizard.currentQuestions.value[0]!.id).toBe('q1');
      expect(wizard.isComplete.value).toBe(false);
      expect(wizard.progress.value.current).toBe(1);
      expect(wizard.progress.value.total).toBe(2);
    });

    it('should initialize with pre-existing answers', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Name?', required: true },
        { id: 'q2', type: 'number', question: 'Age?', required: true },
      ];

      const answers: Answer[] = [
        { questionId: 'q1', value: 'John' },
        { questionId: 'q2', value: 25 },
      ];

      const wizard = useWizard(questions, answers);

      const allAnswers = wizard.getAnswersObject();
      expect(allAnswers.q1).toBe('John');
      expect(allAnswers.q2).toBe(25);
    });

    it('should initialize with empty questions array', () => {
      const wizard = useWizard([]);

      expect(wizard.currentQuestions.value.length).toBe(0);
      expect(wizard.isComplete.value).toBe(false);
      expect(wizard.progress.value.total).toBe(0);
    });
  });

  describe('Reactive State', () => {
    it('should have reactive currentQuestions', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'boolean',
          question: 'Has pet?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: true },
              question: {
                id: 'pet_name',
                type: 'text',
                question: 'Pet name?',
                required: false,
              },
            },
          ],
        },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      // Initially shows parent and conditional (boolean behavior)
      expect(wizard.currentQuestions.value.length).toBe(2);

      // Answer both parent and child (false means child won't be used)
      wizard.answerQuestions(wizard.currentQuestions.value, [false, undefined]);

      // Should update reactively - now on q2 (single question)
      // But we're still on the same question set because we didn't provide valid child answer
      expect(wizard.currentQuestions.value.length).toBe(1);
      expect(wizard.currentQuestions.value[0]!.id).toBe('q2');
    });

    it('should have reactive isComplete', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Name?', required: true },
      ];

      const wizard = useWizard(questions);

      expect(wizard.isComplete.value).toBe(false);

      wizard.answerQuestions(wizard.currentQuestions.value, ['John']);

      expect(wizard.isComplete.value).toBe(true);
    });

    it('should have reactive progress', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];

      const wizard = useWizard(questions);

      expect(wizard.progress.value.percentage).toBe(33.33333333333333);

      wizard.answerQuestions(wizard.currentQuestions.value, ['answer']);

      expect(wizard.progress.value.percentage).toBe(66.66666666666666);
    });

    it('should have reactive canGoNext', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];

      const wizard = useWizard(questions);

      // At start, can go next
      expect(wizard.canGoNext.value).toBe(true);
      expect(wizard.isComplete.value).toBe(false);

      wizard.answerQuestions(wizard.currentQuestions.value, ['answer']);
      // At q2, can still go next
      expect(wizard.canGoNext.value).toBe(true);
      expect(wizard.isComplete.value).toBe(false);

      wizard.answerQuestions(wizard.currentQuestions.value, ['answer']);
      // At q3, can still go next (to complete)
      expect(wizard.canGoNext.value).toBe(true);
      expect(wizard.isComplete.value).toBe(false);

      wizard.answerQuestions(wizard.currentQuestions.value, ['answer']);
      // After completion, canGoNext depends on currentQuestions.length which is 0
      // canGoNext = currentQuestionIndex + count <= flattenedQuestions.length
      // = 3 + 0 <= 3 = true (edge case)
      expect(wizard.isComplete.value).toBe(true);
    });

    it('should have reactive canGoPrevious', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      expect(wizard.canGoPrevious.value).toBe(false);

      wizard.answerQuestions(wizard.currentQuestions.value, ['answer']);

      expect(wizard.canGoPrevious.value).toBe(true);
    });
  });

  describe('Answer Submission', () => {
    it('should submit valid answers and advance', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Name?', required: true },
        { id: 'q2', type: 'text', question: 'Email?', required: true },
      ];

      const wizard = useWizard(questions);

      const results = wizard.answerQuestions(wizard.currentQuestions.value, ['John']);

      expect(results.length).toBe(1);
      expect(results[0]!.isValid).toBe(true);
      expect(wizard.progress.value.current).toBe(2);
    });

    it('should reject invalid answers and not advance', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'text',
          question: 'Name?',
          required: true,
          validation: { minLength: 5 },
        },
      ];

      const wizard = useWizard(questions);

      const results = wizard.answerQuestions(wizard.currentQuestions.value, ['Jo']); // Too short

      expect(results.length).toBe(1);
      expect(results[0]!.isValid).toBe(false);
      expect(wizard.progress.value.current).toBe(1); // Should not advance
    });

    it('should handle multiple answers at once', () => {
      const questions: Question[] = [
        {
          id: 'parent',
          type: 'boolean',
          question: 'Parent?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: true },
              question: {
                id: 'child',
                type: 'text',
                question: 'Child?',
                required: true,
              },
            },
          ],
        },
      ];

      const wizard = useWizard(questions);

      const results = wizard.answerQuestions(wizard.currentQuestions.value, [true, 'answer']);

      expect(results.length).toBe(2);
      expect(results.every(r => r.isValid)).toBe(true);
    });
  });

  describe('Validation Error Tracking', () => {
    it('should track validation errors', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'text',
          question: 'Email?',
          required: true,
          validation: {
            pattern: '^[^@]+@[^@]+\\.[^@]+$',
            customMessage: 'Invalid email',
          },
        },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['invalid']);

      const error = wizard.getValidationError('q1');
      expect(error).toBe('Invalid email');
    });

    it('should clear validation errors on successful submission', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'text',
          question: 'Email?',
          required: true,
          validation: {
            pattern: '^[^@]+@[^@]+\\.[^@]+$',
          },
        },
      ];

      const wizard = useWizard(questions);

      // Submit invalid
      wizard.answerQuestions(wizard.currentQuestions.value, ['invalid']);
      expect(wizard.getValidationError('q1')).toBeDefined();

      // Submit valid
      wizard.answerQuestions(wizard.currentQuestions.value, ['user@example.com']);
      expect(wizard.getValidationError('q1')).toBeUndefined();
    });

    it('should allow manual clearing of validation errors', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'text',
          question: 'Name?',
          required: true,
          validation: { minLength: 5 },
        },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['Jo']);
      expect(wizard.getValidationError('q1')).toBeDefined();

      wizard.clearValidationErrors();
      expect(wizard.getValidationError('q1')).toBeUndefined();
    });

    it('should expose validationErrors as computed', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'text',
          question: 'Name?',
          required: true,
          validation: { minLength: 5 },
        },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['Jo']);

      expect(wizard.validationErrors.value.size).toBe(1);
      expect(wizard.validationErrors.value.has('q1')).toBe(true);
    });
  });

  describe('Navigation Methods', () => {
    it('should navigate forward with answerQuestions', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      expect(wizard.currentQuestions.value[0]!.id).toBe('q1');

      wizard.answerQuestions(wizard.currentQuestions.value, ['answer']);

      expect(wizard.currentQuestions.value[0]!.id).toBe('q2');
    });

    it('should navigate backward with goBack', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['answer']);
      expect(wizard.currentQuestions.value[0]!.id).toBe('q2');

      const result = wizard.goBack();

      expect(result).toBe(true);
      expect(wizard.currentQuestions.value[0]!.id).toBe('q1');
    });

    it('should not go back from first question', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];

      const wizard = useWizard(questions);

      const result = wizard.goBack();

      expect(result).toBe(false);
      expect(wizard.currentQuestions.value[0]!.id).toBe('q1');
    });

    it('should skip question with skipQuestion', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: false },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      const result = wizard.skipQuestion();

      expect(result).toBe(true);
      expect(wizard.currentQuestions.value[0]!.id).toBe('q2');
    });
  });

  describe('Answer Retrieval', () => {
    it('should get answers as array', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'number', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['John']);
      wizard.answerQuestions(wizard.currentQuestions.value, [25]);

      const answers = wizard.getAnswers();

      expect(answers.length).toBe(2);
      expect(answers).toContainEqual({ questionId: 'q1', value: 'John' });
      expect(answers).toContainEqual({ questionId: 'q2', value: 25 });
    });

    it('should get answers as object', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'number', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['John']);
      wizard.answerQuestions(wizard.currentQuestions.value, [25]);

      const obj = wizard.getAnswersObject();

      expect(obj).toEqual({
        q1: 'John',
        q2: 25,
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset wizard to initial state', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['answer']);
      expect(wizard.progress.value.current).toBe(2);

      wizard.reset();

      expect(wizard.progress.value.current).toBe(1);
      expect(wizard.getAnswers().length).toBe(0);
      expect(wizard.isComplete.value).toBe(false);
    });

    it('should reset with new answers', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['first']);

      const newAnswers: Answer[] = [
        { questionId: 'q1', value: 'second' },
        { questionId: 'q2', value: 'new' },
      ];

      wizard.reset(newAnswers);

      const obj = wizard.getAnswersObject();
      expect(obj.q1).toBe('second');
      expect(obj.q2).toBe('new');
    });

    it('should reset to original answers if no new answers provided', () => {
      const initialAnswers: Answer[] = [
        { questionId: 'q1', value: 'initial' },
      ];

      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];

      const wizard = useWizard(questions, initialAnswers);

      wizard.answerQuestions(wizard.currentQuestions.value, ['changed']);
      expect(wizard.getAnswersObject().q1).toBe('changed');

      wizard.reset();

      expect(wizard.getAnswersObject().q1).toBe('initial');
    });
  });

  describe('Complete Method', () => {
    it('should return both answer formats', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'number', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['John']);
      wizard.answerQuestions(wizard.currentQuestions.value, [25]);

      const result = wizard.complete();

      expect(result.answers.length).toBe(2);
      expect(result.answersObject).toEqual({
        q1: 'John',
        q2: 25,
      });
    });
  });

  describe('Validation Integration', () => {
    it('should validate required fields', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Name?', required: true },
      ];

      const wizard = useWizard(questions);

      const results = wizard.answerQuestions(wizard.currentQuestions.value, ['']);

      expect(results[0]!.isValid).toBe(false);
      expect(results[0]!.error?.message).toBe('This question is required');
      expect(wizard.getValidationError('q1')).toBe('This question is required');
    });

    it('should validate text patterns', () => {
      const questions: Question[] = [
        {
          id: 'email',
          type: 'text',
          question: 'Email?',
          required: true,
          validation: {
            pattern: '^[^@]+@[^@]+\\.[^@]+$',
            customMessage: 'Please enter a valid email',
          },
        },
      ];

      const wizard = useWizard(questions);

      const results = wizard.answerQuestions(wizard.currentQuestions.value, ['invalid-email']);

      expect(results[0]!.isValid).toBe(false);
      expect(wizard.getValidationError('email')).toBe('Please enter a valid email');
    });

    it('should validate number ranges', () => {
      const questions: Question[] = [
        {
          id: 'age',
          type: 'number',
          question: 'Age?',
          required: true,
          validation: {
            min: 18,
            max: 120,
          },
        },
      ];

      const wizard = useWizard(questions);

      const results = wizard.answerQuestions(wizard.currentQuestions.value, [15]);

      expect(results[0]!.isValid).toBe(false);
      expect(results[0]!.error?.message).toBe('Minimum value is 18');
    });

    it('should not advance when validation fails', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'text',
          question: 'Name?',
          required: true,
          validation: { minLength: 5 },
        },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['Jo']);

      // Should still be on q1
      expect(wizard.currentQuestions.value[0]!.id).toBe('q1');
      expect(wizard.progress.value.current).toBe(1);
    });

    it('should advance when validation passes', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'text',
          question: 'Name?',
          required: true,
          validation: { minLength: 5 },
        },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['John Doe']);

      // Should advance to q2
      expect(wizard.currentQuestions.value[0]!.id).toBe('q2');
      expect(wizard.progress.value.current).toBe(2);
    });
  });

  describe('Complete Wizard Flow', () => {
    it('should handle complete linear wizard flow', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Name?', required: true },
        { id: 'q2', type: 'number', question: 'Age?', required: true },
        { id: 'q3', type: 'boolean', question: 'Subscribe?', required: false },
      ];

      const wizard = useWizard(questions);

      // Start
      expect(wizard.isComplete.value).toBe(false);
      expect(wizard.canGoPrevious.value).toBe(false);

      // Answer Q1
      wizard.answerQuestions(wizard.currentQuestions.value, ['John']);
      expect(wizard.progress.value.current).toBe(2);
      expect(wizard.canGoPrevious.value).toBe(true);

      // Answer Q2
      wizard.answerQuestions(wizard.currentQuestions.value, [25]);
      expect(wizard.progress.value.current).toBe(3);

      // Answer Q3
      wizard.answerQuestions(wizard.currentQuestions.value, [true]);
      expect(wizard.isComplete.value).toBe(true);

      // Verify all answers
      const result = wizard.complete();
      expect(result.answersObject).toEqual({
        q1: 'John',
        q2: 25,
        q3: true,
      });
    });

    it('should handle wizard with conditionals', () => {
      const questions: Question[] = [
        {
          id: 'user_type',
          type: 'text',
          question: 'User type?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: 'student' },
              question: {
                id: 'school',
                type: 'text',
                question: 'School?',
                required: true,
              },
            },
          ],
        },
        { id: 'final', type: 'text', question: 'Final?', required: true },
      ];

      const wizard = useWizard(questions);

      // Answer as student
      wizard.answerQuestions(wizard.currentQuestions.value, ['student']);
      expect(wizard.currentQuestions.value[0]!.id).toBe('school');

      // Answer school
      wizard.answerQuestions(wizard.currentQuestions.value, ['MIT']);
      expect(wizard.currentQuestions.value[0]!.id).toBe('final');

      // Answer final
      wizard.answerQuestions(wizard.currentQuestions.value, ['done']);
      expect(wizard.isComplete.value).toBe(true);

      const result = wizard.complete();
      expect(result.answersObject).toEqual({
        user_type: 'student',
        school: 'MIT',
        final: 'done',
      });
    });

    it('should handle navigation back and forth', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['a1']);
      wizard.answerQuestions(wizard.currentQuestions.value, ['a2']);

      wizard.goBack();
      expect(wizard.currentQuestions.value[0]!.id).toBe('q2');

      wizard.goBack();
      expect(wizard.currentQuestions.value[0]!.id).toBe('q1');

      wizard.answerQuestions(wizard.currentQuestions.value, ['updated']);
      expect(wizard.currentQuestions.value[0]!.id).toBe('q2');

      // Verify answer was updated
      const obj = wizard.getAnswersObject();
      expect(obj.q1).toBe('updated');
      expect(obj.q2).toBe('a2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty answer submission', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: false },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];

      const wizard = useWizard(questions);

      let results = wizard.answerQuestions(wizard.currentQuestions.value, []);

      expect(results.length).toBe(1);
      // Should still be on q1 since no answers were submitted
      expect(wizard.currentQuestions.value.length).toBeGreaterThan(0);
      if (wizard.currentQuestions.value.length > 0) {
        expect(wizard.currentQuestions.value[0]!.id).toBe('q1');
      }

      // Advance to q2
      wizard.answerQuestions(wizard.currentQuestions.value, ['a1']);

      results = wizard.answerQuestions(wizard.currentQuestions.value, []);
      expect(results.length).toBe(1);
      // Should be on q3 since q2 is not required
      expect(wizard.currentQuestions.value.length).toBeGreaterThan(0);
      if (wizard.currentQuestions.value.length > 0) {
        expect(wizard.currentQuestions.value[0]!.id).toBe('q3');
      }
    });

    it('should handle special characters in answers', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, ['Test <>&"\' 你好 🎉']);

      const obj = wizard.getAnswersObject();
      expect(obj.q1).toBe('Test <>&"\' 你好 🎉');
    });

    it('should handle zero values', () => {
      const questions: Question[] = [
        { id: 'count', type: 'number', question: 'Count?', required: true },
        { id: 'range', type: 'number-range', question: 'Range?', required: true },
      ];

      const wizard = useWizard(questions);

      wizard.answerQuestions(wizard.currentQuestions.value, [0]);
      wizard.answerQuestions(wizard.currentQuestions.value, [{ min: 0, max: 0 }]);

      const obj = wizard.getAnswersObject();
      expect(obj.count).toBe(0);
      expect(obj.range).toEqual({ min: 0, max: 0 });
    });

    it('should handle rapid answer updates', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];

      const wizard = useWizard(questions);

      for (let i = 0; i < 10; i++) {
        wizard.answerQuestions(wizard.currentQuestions.value, [`Answer ${i}`]);
      }

      // Last answer should be stored (wizard completes after first valid answer)
      const obj = wizard.getAnswersObject();
      expect(obj.q1).toBe('Answer 0');
    });
  });

  describe('Computed Properties', () => {
    it('should compute progress correctly', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
        { id: 'q4', type: 'text', question: 'Q4', required: true },
      ];

      const wizard = useWizard(questions);

      expect(wizard.progress.value).toEqual({
        current: 1,
        total: 4,
        percentage: 25,
      });

      wizard.answerQuestions(wizard.currentQuestions.value, ['a']);

      expect(wizard.progress.value).toEqual({
        current: 2,
        total: 4,
        percentage: 50,
      });
    });

    it('should compute canGoNext correctly', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];

      const wizard = useWizard(questions);

      // At start, can go next
      expect(wizard.canGoNext.value).toBe(true);

      wizard.answerQuestions(wizard.currentQuestions.value, ['answer']);
      // At q2, can still go next
      expect(wizard.canGoNext.value).toBe(true);

      wizard.answerQuestions(wizard.currentQuestions.value, ['answer']);
      // At q3, can still go next (to complete)
      expect(wizard.canGoNext.value).toBe(true);

      wizard.answerQuestions(wizard.currentQuestions.value, ['answer']);
      // After completion
      expect(wizard.isComplete.value).toBe(true);
      // canGoNext with empty currentQuestions (length=0) returns true (edge case)
      // This is because: currentQuestionIndex(3) + 0 <= flattenedQuestions.length(3)
    });

    it('should compute canGoPrevious correctly', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];

      const wizard = useWizard(questions);

      expect(wizard.canGoPrevious.value).toBe(false);

      wizard.answerQuestions(wizard.currentQuestions.value, ['answer']);

      expect(wizard.canGoPrevious.value).toBe(true);
    });

    it('should handle currentQuestions with question sets', () => {
      const questions: Question[] = [
        {
          id: 'parent',
          type: 'boolean',
          question: 'Parent?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: true },
              question: {
                id: 'child1',
                type: 'text',
                question: 'Child 1?',
                required: true,
              },
            },
          ],
        },
      ];

      const wizard = useWizard(questions);

      // Boolean shows conditionals before answer
      expect(wizard.currentQuestions.value.length).toBe(2);
      expect(wizard.currentQuestions.value[0]!.id).toBe('parent');
      expect(wizard.currentQuestions.value[1]!.id).toBe('child1');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle validation with multiple rules', () => {
      const questions: Question[] = [
        {
          id: 'password',
          type: 'text',
          question: 'Password?',
          required: true,
          validation: {
            minLength: 8,
            maxLength: 50,
            pattern: '^(?=.*[A-Z])(?=.*[0-9])',
            customMessage: 'Password must be 8+ chars with uppercase and number',
          },
        },
      ];

      const wizard = useWizard(questions);

      // Too short
      let results = wizard.answerQuestions(wizard.currentQuestions.value, ['Pass1']);
      expect(results[0]!.isValid).toBe(false);

      // No uppercase
      results = wizard.answerQuestions(wizard.currentQuestions.value, ['password123']);
      expect(results[0]!.isValid).toBe(false);

      // Valid
      results = wizard.answerQuestions(wizard.currentQuestions.value, ['Password123']);
      expect(results[0]!.isValid).toBe(true);
      expect(wizard.isComplete.value).toBe(true);
    });

    it('should handle date validation with today keyword', () => {
      const questions: Question[] = [
        {
          id: 'event_date',
          type: 'date',
          question: 'Event date?',
          required: true,
          validation: {
            minDate: 'today',
          },
        },
      ];

      const wizard = useWizard(questions);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]!;

      const results = wizard.answerQuestions(wizard.currentQuestions.value, [yesterdayStr]);

      expect(results[0]!.isValid).toBe(false);
      expect(wizard.getValidationError('event_date')).toContain('today or later');
    });

    it('should handle number range validation', () => {
      const questions: Question[] = [
        {
          id: 'price_range',
          type: 'number-range',
          question: 'Price range?',
          required: true,
          validation: {
            min: 10,
            max: 1000,
          },
        },
      ];

      const wizard = useWizard(questions);

      // Invalid: min > max
      let results = wizard.answerQuestions(wizard.currentQuestions.value, [{ min: 100, max: 50 }]);
      expect(results[0]!.isValid).toBe(false);

      // Invalid: below minimum
      results = wizard.answerQuestions(wizard.currentQuestions.value, [{ min: 5, max: 20 }]);
      expect(results[0]!.isValid).toBe(false);

      // Valid
      results = wizard.answerQuestions(wizard.currentQuestions.value, [{ min: 50, max: 500 }]);
      expect(results[0]!.isValid).toBe(true);
    });

    it('should handle date range validation', () => {
      const questions: Question[] = [
        {
          id: 'event_dates',
          type: 'date-range',
          question: 'Event dates?',
          required: true,
        },
      ];

      const wizard = useWizard(questions);

      // Invalid: start > end
      let results = wizard.answerQuestions(wizard.currentQuestions.value, [
        { start: '2024-12-31', end: '2024-01-01' },
      ]);
      expect(results[0]!.isValid).toBe(false);

      // Valid
      results = wizard.answerQuestions(wizard.currentQuestions.value, [
        { start: '2024-01-01', end: '2024-12-31' },
      ]);
      expect(results[0]!.isValid).toBe(true);
    });
  });
});
