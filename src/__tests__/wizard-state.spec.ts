// wizard-state.spec.ts - Tests for wizard state management functions
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getQuestionSet,
  getCurrentAnswers,
  next,
  previous,
  canGoNext,
  canGoPrevious,
  getProgress,
  getAnswers,
  getAnswersObject,
} from '../wizard-state';
import type { WizardState, Question } from '../types';

describe('Wizard State', () => {
  let state: WizardState;

  beforeEach(() => {
    // Create a fresh state for each test
    state = {
      currentQuestionIndex: 0,
      answers: new Map(),
      flattenedQuestions: [],
      visitedQuestions: [],
      isComplete: false,
    };
  });

  describe('getQuestionSet', () => {
    it('should return empty array when no questions exist', () => {
      const questions = getQuestionSet(state);
      expect(questions).toEqual([]);
    });

    it('should return empty array when index is out of bounds', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];
      state.currentQuestionIndex = 5;

      const questions = getQuestionSet(state);
      expect(questions).toEqual([]);
    });

    it('should return single question when no conditionals', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 0;

      const questions = getQuestionSet(state);
      expect(questions.length).toBe(1);
      expect(questions[0]!.id).toBe('q1');
    });

    it('should return question set with conditional children', () => {
      state.flattenedQuestions = [
        { id: 'parent', type: 'boolean', question: 'Parent?', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'parent' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'parent' },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 0;

      const questions = getQuestionSet(state);
      expect(questions.length).toBe(3);
      expect(questions[0]!.id).toBe('parent');
      expect(questions[1]!.id).toBe('child1');
      expect(questions[2]!.id).toBe('child2');
    });

    it('should stop at next non-conditional question', () => {
      state.flattenedQuestions = [
        { id: 'parent', type: 'boolean', question: 'Parent?', required: true },
        { id: 'child', type: 'text', question: 'Child?', required: true, conditionalParent: 'parent' },
        { id: 'next', type: 'text', question: 'Next?', required: true },
      ];
      state.currentQuestionIndex = 0;

      const questions = getQuestionSet(state);
      expect(questions.length).toBe(2);
      expect(questions[0]!.id).toBe('parent');
      expect(questions[1]!.id).toBe('child');
    });

    it('should use custom startIndex when provided', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];
      state.currentQuestionIndex = 0;

      const questions = getQuestionSet(state, 1);
      expect(questions.length).toBe(1);
      expect(questions[0]!.id).toBe('q2');
    });

    it('should handle nested conditional parents correctly', () => {
      state.flattenedQuestions = [
        { id: 'parent', type: 'boolean', question: 'Parent?', required: true },
        { id: 'child', type: 'boolean', question: 'Child?', required: true, conditionalParent: 'parent' },
        { id: 'grandchild', type: 'text', question: 'Grandchild?', required: true, conditionalParent: 'child' },
      ];
      state.currentQuestionIndex = 0;

      const questions = getQuestionSet(state);
      expect(questions.length).toBe(2);
      expect(questions[0]!.id).toBe('parent');
      expect(questions[1]!.id).toBe('child');
    });
  });

  describe('getCurrentAnswers', () => {
    it('should return empty array for questions with no answers', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];

      const answers = getCurrentAnswers(state, questions);
      expect(answers).toEqual([undefined, undefined]);
    });

    it('should return answers for questions that have been answered', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'number', question: 'Q2', required: true },
      ];

      state.answers.set('q1', 'John');
      state.answers.set('q2', 25);

      const answers = getCurrentAnswers(state, questions);
      expect(answers).toEqual(['John', 25]);
    });

    it('should return undefined for unanswered questions in mixed set', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];

      state.answers.set('q1', 'John');
      state.answers.set('q3', 'Doe');

      const answers = getCurrentAnswers(state, questions);
      expect(answers).toEqual(['John', undefined, 'Doe']);
    });

    it('should handle empty questions array', () => {
      const answers = getCurrentAnswers(state, []);
      expect(answers).toEqual([]);
    });
  });

  describe('Navigation - next', () => {
    beforeEach(() => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];
    });

    it('should move to next question', () => {
      expect(state.currentQuestionIndex).toBe(0);

      const result = next(state);

      expect(result).toBe(true);
      expect(state.currentQuestionIndex).toBe(1);
    });

    it('should track visited questions', () => {
      expect(state.visitedQuestions).toEqual([]);

      next(state);

      expect(state.visitedQuestions).toContain('q2');
    });

    it('should not add duplicate visited questions', () => {
      next(state);
      expect(state.visitedQuestions.length).toBe(1);

      previous(state);
      next(state);

      expect(state.visitedQuestions.length).toBe(1);
    });

    it('should mark wizard as complete when reaching end', () => {
      state.currentQuestionIndex = 2;

      next(state);

      expect(state.isComplete).toBe(true);
      expect(state.currentQuestionIndex).toBe(3);
    });

    it('should return false when cannot go next', () => {
      state.currentQuestionIndex = 3;

      const result = next(state);

      expect(result).toBe(false);
      expect(state.currentQuestionIndex).toBe(3);
    });

    it('should handle empty questions array', () => {
      state.flattenedQuestions = [];
      state.currentQuestionIndex = 0;

      const result = next(state);

      expect(result).toBe(false);
    });
  });

  describe('Navigation - previous', () => {
    beforeEach(() => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];
    });

    it('should move to previous question', () => {
      state.currentQuestionIndex = 2;

      const result = previous(state);

      expect(result).toBe(true);
      expect(state.currentQuestionIndex).toBe(1);
    });

    it('should return false when at first question', () => {
      state.currentQuestionIndex = 0;

      const result = previous(state);

      expect(result).toBe(false);
      expect(state.currentQuestionIndex).toBe(0);
    });

    it('should allow going back from completed state', () => {
      state.currentQuestionIndex = 3;
      state.isComplete = true;

      const result = previous(state);

      expect(result).toBe(true);
      expect(state.currentQuestionIndex).toBe(2);
    });
  });

  describe('canGoNext', () => {
    beforeEach(() => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];
    });

    it('should return true when not at end', () => {
      state.currentQuestionIndex = 0;
      expect(canGoNext(state)).toBe(true);
    });

    it('should return true when at last question (can complete)', () => {
      state.currentQuestionIndex = 2;
      expect(canGoNext(state)).toBe(true);
    });

    it('should return false when past end', () => {
      state.currentQuestionIndex = 3;
      expect(canGoNext(state)).toBe(false);
    });

    it('should handle count parameter for question sets', () => {
      state.currentQuestionIndex = 0;

      // Can advance by 3 (to end)
      expect(canGoNext(state, 3)).toBe(true);

      // Cannot advance by 4 (past end)
      expect(canGoNext(state, 4)).toBe(false);
    });

    it('should handle empty questions array', () => {
      state.flattenedQuestions = [];
      state.currentQuestionIndex = 0;

      expect(canGoNext(state)).toBe(false);
    });
  });

  describe('canGoPrevious', () => {
    it('should return false at first question', () => {
      state.currentQuestionIndex = 0;
      expect(canGoPrevious(state)).toBe(false);
    });

    it('should return true when not at first question', () => {
      state.currentQuestionIndex = 1;
      expect(canGoPrevious(state)).toBe(true);
    });

    it('should return true even when past end', () => {
      state.currentQuestionIndex = 10;
      expect(canGoPrevious(state)).toBe(true);
    });
  });

  describe('getProgress', () => {
    it('should calculate progress correctly', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
        { id: 'q4', type: 'text', question: 'Q4', required: true },
      ];
      state.currentQuestionIndex = 0;

      const progress = getProgress(state);

      expect(progress.current).toBe(1);
      expect(progress.total).toBe(4);
      expect(progress.percentage).toBe(25);
    });

    it('should handle progress at middle of wizard', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
        { id: 'q4', type: 'text', question: 'Q4', required: true },
      ];
      state.currentQuestionIndex = 2;

      const progress = getProgress(state);

      expect(progress.current).toBe(3);
      expect(progress.total).toBe(4);
      expect(progress.percentage).toBe(75);
    });

    it('should handle progress at end of wizard', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 1;

      const progress = getProgress(state);

      expect(progress.current).toBe(2);
      expect(progress.total).toBe(2);
      expect(progress.percentage).toBe(100);
    });

    it('should handle empty questions array', () => {
      state.flattenedQuestions = [];
      state.currentQuestionIndex = 0;

      const progress = getProgress(state);

      expect(progress.current).toBe(0);
      expect(progress.total).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('should cap current at total when index is past end', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 5;

      const progress = getProgress(state);

      expect(progress.current).toBe(2);
      expect(progress.total).toBe(2);
      expect(progress.percentage).toBe(100);
    });

    it('should calculate percentage correctly for single question', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];
      state.currentQuestionIndex = 0;

      const progress = getProgress(state);

      expect(progress.current).toBe(1);
      expect(progress.total).toBe(1);
      expect(progress.percentage).toBe(100);
    });
  });

  describe('getAnswers', () => {
    it('should return empty array when no answers', () => {
      const answers = getAnswers(state);
      expect(answers).toEqual([]);
    });

    it('should return all answers as Answer objects', () => {
      state.answers.set('q1', 'John');
      state.answers.set('q2', 25);
      state.answers.set('q3', true);

      const answers = getAnswers(state);

      expect(answers.length).toBe(3);
      expect(answers).toContainEqual({ questionId: 'q1', value: 'John' });
      expect(answers).toContainEqual({ questionId: 'q2', value: 25 });
      expect(answers).toContainEqual({ questionId: 'q3', value: true });
    });

    it('should handle complex answer types', () => {
      state.answers.set('range', { min: 10, max: 20 });
      state.answers.set('dateRange', { start: '2024-01-01', end: '2024-12-31' });
      state.answers.set('choices', ['option1', 'option2']);

      const answers = getAnswers(state);

      expect(answers.length).toBe(3);
      expect(answers).toContainEqual({
        questionId: 'range',
        value: { min: 10, max: 20 }
      });
      expect(answers).toContainEqual({
        questionId: 'dateRange',
        value: { start: '2024-01-01', end: '2024-12-31' }
      });
      expect(answers).toContainEqual({
        questionId: 'choices',
        value: ['option1', 'option2']
      });
    });
  });

  describe('getAnswersObject', () => {
    it('should return empty object when no answers', () => {
      const obj = getAnswersObject(state);
      expect(obj).toEqual({});
    });

    it('should return answers as plain object', () => {
      state.answers.set('q1', 'John');
      state.answers.set('q2', 25);
      state.answers.set('q3', true);

      const obj = getAnswersObject(state);

      expect(obj).toEqual({
        q1: 'John',
        q2: 25,
        q3: true,
      });
    });

    it('should handle complex answer types in object', () => {
      state.answers.set('range', { min: 10, max: 20 });
      state.answers.set('dateRange', { start: '2024-01-01', end: '2024-12-31' });

      const obj = getAnswersObject(state);

      expect(obj.range).toEqual({ min: 10, max: 20 });
      expect(obj.dateRange).toEqual({ start: '2024-01-01', end: '2024-12-31' });
    });

    it('should preserve answer value types', () => {
      state.answers.set('text', 'string');
      state.answers.set('number', 42);
      state.answers.set('boolean', false);
      state.answers.set('array', ['a', 'b']);

      const obj = getAnswersObject(state);

      expect(typeof obj.text).toBe('string');
      expect(typeof obj.number).toBe('number');
      expect(typeof obj.boolean).toBe('boolean');
      expect(Array.isArray(obj.array)).toBe(true);
    });
  });

  describe('State Updates', () => {
    it('should update currentQuestionIndex correctly', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];

      expect(state.currentQuestionIndex).toBe(0);

      next(state);
      expect(state.currentQuestionIndex).toBe(1);

      next(state);
      expect(state.currentQuestionIndex).toBe(2);

      previous(state);
      expect(state.currentQuestionIndex).toBe(1);
    });

    it('should update answers map correctly', () => {
      state.answers.set('q1', 'initial');
      expect(state.answers.get('q1')).toBe('initial');

      state.answers.set('q1', 'updated');
      expect(state.answers.get('q1')).toBe('updated');

      state.answers.set('q2', 'new');
      expect(state.answers.size).toBe(2);
    });

    it('should update isComplete flag', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];
      state.currentQuestionIndex = 0;

      expect(state.isComplete).toBe(false);

      next(state);

      expect(state.isComplete).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle navigation with single question', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];

      expect(canGoPrevious(state)).toBe(false);
      expect(canGoNext(state)).toBe(true);

      next(state);

      expect(state.isComplete).toBe(true);
      expect(canGoNext(state)).toBe(false);
    });

    it('should handle rapid navigation changes', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];

      next(state);
      next(state);
      previous(state);
      previous(state);
      next(state);

      expect(state.currentQuestionIndex).toBe(1);
    });

    it('should handle answers with special characters', () => {
      state.answers.set('q1', 'Test <>&"\'');
      state.answers.set('q2', 'Unicode: 你好 🎉');

      const obj = getAnswersObject(state);

      expect(obj.q1).toBe('Test <>&"\'');
      expect(obj.q2).toBe('Unicode: 你好 🎉');
    });

    it('should handle zero values correctly', () => {
      state.answers.set('number', 0);
      state.answers.set('range', { min: 0, max: 0 });

      const obj = getAnswersObject(state);

      expect(obj.number).toBe(0);
      expect(obj.range).toEqual({ min: 0, max: 0 });
    });

    it('should handle empty string answers', () => {
      state.answers.set('q1', '');

      const answers = getAnswers(state);

      expect(answers).toContainEqual({ questionId: 'q1', value: '' });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete wizard flow', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'number', question: 'Q2', required: true },
        { id: 'q3', type: 'boolean', question: 'Q3', required: false },
      ];

      // Start at beginning
      expect(state.currentQuestionIndex).toBe(0);
      expect(canGoPrevious(state)).toBe(false);
      expect(canGoNext(state)).toBe(true);

      // Answer and move forward
      state.answers.set('q1', 'John');
      next(state);
      expect(state.currentQuestionIndex).toBe(1);

      state.answers.set('q2', 25);
      next(state);
      expect(state.currentQuestionIndex).toBe(2);

      state.answers.set('q3', true);
      next(state);

      // Should be complete
      expect(state.isComplete).toBe(true);
      expect(state.currentQuestionIndex).toBe(3);

      // Verify all answers stored
      const answers = getAnswersObject(state);
      expect(answers).toEqual({
        q1: 'John',
        q2: 25,
        q3: true,
      });
    });

    it('should handle navigation back and forth with answers preserved', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];

      state.answers.set('q1', 'answer1');
      next(state);

      state.answers.set('q2', 'answer2');
      previous(state);

      // Answers should be preserved
      expect(state.answers.get('q1')).toBe('answer1');
      expect(state.answers.get('q2')).toBe('answer2');

      next(state);
      expect(state.currentQuestionIndex).toBe(1);
    });

    it('should handle question set with conditionals', () => {
      state.flattenedQuestions = [
        { id: 'parent', type: 'boolean', question: 'Parent?', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'parent' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'parent' },
        { id: 'next', type: 'text', question: 'Next?', required: true },
      ];

      const questionSet = getQuestionSet(state);
      expect(questionSet.length).toBe(3); // parent + 2 children

      // Answer the set
      state.answers.set('parent', true);
      state.answers.set('child1', 'answer1');
      state.answers.set('child2', 'answer2');

      const answers = getCurrentAnswers(state, questionSet);
      expect(answers).toEqual([true, 'answer1', 'answer2']);
    });
  });

  describe('Visited Questions Tracking', () => {
    beforeEach(() => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];
    });

    it('should track visited questions as user progresses', () => {
      expect(state.visitedQuestions).toEqual([]);

      next(state);
      expect(state.visitedQuestions).toContain('q2');

      next(state);
      expect(state.visitedQuestions).toContain('q3');
    });

    it('should not duplicate visited questions', () => {
      next(state);
      next(state);
      previous(state);
      next(state);

      const q3Count = state.visitedQuestions.filter(id => id === 'q3').length;
      expect(q3Count).toBe(1);
    });

    it('should maintain visited questions when going back', () => {
      next(state);
      next(state);

      const visitedBefore = [...state.visitedQuestions];

      previous(state);

      expect(state.visitedQuestions).toEqual(visitedBefore);
    });
  });

  describe('Completion Detection', () => {
    it('should not be complete at start', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];

      expect(state.isComplete).toBe(false);
    });

    it('should be complete after last question', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];

      next(state);

      expect(state.isComplete).toBe(true);
    });

    it('should handle completion with multiple questions', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];

      next(state);
      expect(state.isComplete).toBe(false);

      next(state);
      expect(state.isComplete).toBe(false);

      next(state);
      expect(state.isComplete).toBe(true);
    });
  });
});
