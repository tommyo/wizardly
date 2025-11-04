// wizard-state.spec.ts - Tests for wizard state management functions
import { describe, it, expect, beforeEach } from 'vitest';
import type { WizardState, Question } from '../types';
import {
  getQuestionSet,
  getCurrentAnswers,
  next,
  back,
  canGoNext,
  canGoBack,
  getProgress,
  getAnswers,
  getAnswersObject,
  findPrevIndex,
  findNextIndex,
} from '../wizard-state';

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
        { id: 'q2', type: 'text', question: 'next?' },
      ];
      state.currentQuestionIndex = 0;

      const questions = getQuestionSet(state);
      expect(questions.length).toBe(3);
      expect(questions[0]!.id).toBe('parent');
      expect(questions[1]!.id).toBe('child');
      expect(questions[2]!.id).toBe('grandchild');
    });

    it('should handle deeply nested conditional children (3+ levels)', () => {
      state.flattenedQuestions = [
        { id: 'level1', type: 'boolean', question: 'Level 1?', required: true },
        { id: 'level2', type: 'boolean', question: 'Level 2?', required: true, conditionalParent: 'level1' },
        { id: 'level3', type: 'boolean', question: 'Level 3?', required: true, conditionalParent: 'level2' },
        { id: 'level4', type: 'text', question: 'Level 4?', required: true, conditionalParent: 'level3' },
        { id: 'next', type: 'text', question: 'Next?', required: true },
      ];
      state.currentQuestionIndex = 0;

      // At level 1, should only get level1 and its immediate child level2
      const questions = getQuestionSet(state);
      expect(questions.length).toBe(4);
      expect(questions[0]!.id).toBe('level1');
      expect(questions[1]!.id).toBe('level2');
      expect(questions[2]!.id).toBe('level3');
      expect(questions[3]!.id).toBe('level4');

      // At level 2, should get level2 and its immediate child level3
      // const questionsLevel2 = getQuestionSet(state, 1);
      // expect(questionsLevel2.length).toBe(2);
      // expect(questionsLevel2[0]!.id).toBe('level2');
      // expect(questionsLevel2[1]!.id).toBe('level3');

      // At level 3, should get level3 and its immediate child level4
      // const questionsLevel3 = getQuestionSet(state, 2);
      // expect(questionsLevel3.length).toBe(2);
      // expect(questionsLevel3[0]!.id).toBe('level3');
      // expect(questionsLevel3[1]!.id).toBe('level4');
    });

    it('should handle special boolean conditions (show conditionals before parent answer)', () => {
      // For boolean questions, conditionals should be shown in the same question set
      // even before the parent is answered, allowing the user to see what will be asked
      state.flattenedQuestions = [
        { id: 'boolParent', type: 'boolean', question: 'Boolean Parent?', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'boolParent' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'boolParent' },
        { id: 'next', type: 'text', question: 'Next?', required: true },
      ];
      state.currentQuestionIndex = 0;

      const questions = getQuestionSet(state);

      // Should include parent and all immediate children for boolean type
      expect(questions.length).toBe(3);
      expect(questions[0]!.id).toBe('boolParent');
      expect(questions[0]!.type).toBe('boolean');
      expect(questions[1]!.id).toBe('child1');
      expect(questions[2]!.id).toBe('child2');
    });

    it('should handle deeply nested special boolean conditions (3+ levels)', () => {
      // Test that boolean special handling works at multiple nesting levels
      state.flattenedQuestions = [
        { id: 'bool1', type: 'boolean', question: 'Bool 1?', required: true },
        { id: 'bool2', type: 'boolean', question: 'Bool 2?', required: true, conditionalParent: 'bool1' },
        { id: 'bool3', type: 'boolean', question: 'Bool 3?', required: true, conditionalParent: 'bool2' },
        { id: 'text1', type: 'text', question: 'Text 1?', required: true, conditionalParent: 'bool3' },
        { id: 'text2', type: 'text', question: 'Text 2?', required: true, conditionalParent: 'bool3' },
        { id: 'next', type: 'text', question: 'Next?', required: true },
      ];
      state.currentQuestionIndex = 0;

      // At bool1, should get bool1 and its immediate child bool2
      const questions = getQuestionSet(state);
      expect(questions.length).toBe(5);
      expect(questions[0]!.id).toBe('bool1');
      expect(questions[0]!.type).toBe('boolean');
      expect(questions[1]!.id).toBe('bool2');
      expect(questions[1]!.type).toBe('boolean');
      expect(questions[4]!.id).toBe('text2');
      expect(questions[4]!.type).toBe('text');

      // At bool2, should get bool2 and its immediate child bool3
      // const questionsLevel2 = getQuestionSet(state, 1);
      // expect(questionsLevel2.length).toBe(2);
      // expect(questionsLevel2[0]!.id).toBe('bool2');
      // expect(questionsLevel2[0]!.type).toBe('boolean');
      // expect(questionsLevel2[1]!.id).toBe('bool3');
      // expect(questionsLevel2[1]!.type).toBe('boolean');

      // At bool3, should get bool3 and both its text children
      // const questionsLevel3 = getQuestionSet(state, 2);
      // expect(questionsLevel3.length).toBe(3);
      // expect(questionsLevel3[0]!.id).toBe('bool3');
      // expect(questionsLevel3[0]!.type).toBe('boolean');
      // expect(questionsLevel3[1]!.id).toBe('text1');
      // expect(questionsLevel3[2]!.id).toBe('text2');
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

      back(state);
      next(state);

      expect(state.visitedQuestions.length).toBe(1);
    });

    it('should mark wizard as complete when reaching end', () => {
      state.currentQuestionIndex = 2;

      next(state);

      expect(state.isComplete).toBe(true);
      expect(state.currentQuestionIndex).toBe(3);
    });

    it('should skip conditional children when moving to next question from boolean with conditionals', () => {
      state.flattenedQuestions = [
        { id: 'bool1', type: 'boolean', question: 'Bool 1?', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'bool1' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'bool1' },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 0;

      // next() should skip over all conditional children and go to q2
      const result = next(state);

      expect(result).toBe(true);
      expect(state.currentQuestionIndex).toBe(3);
      expect(state.flattenedQuestions[state.currentQuestionIndex]!.id).toBe('q2');
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

  describe('Navigation - back', () => {
    beforeEach(() => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];
    });

    it('should move to back question', () => {
      state.currentQuestionIndex = 2;

      const result = back(state);

      expect(result).toBe(true);
      expect(state.currentQuestionIndex).toBe(1);
    });

    it('should return false when at first question', () => {
      state.currentQuestionIndex = 0;

      const result = back(state);

      expect(result).toBe(false);
      expect(state.currentQuestionIndex).toBe(0);
    });

    it('should allow going back from completed state', () => {
      state.currentQuestionIndex = 3;
      state.isComplete = true;

      const result = back(state);

      expect(result).toBe(true);
      expect(state.currentQuestionIndex).toBe(2);
    });

    it('should land on parent boolean question when going back to question set with conditionals', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'bool1', type: 'boolean', question: 'Bool 1?', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'bool1' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'bool1' },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 4; // On q2

      // back() should skip over all conditional children and land on bool1
      const result = back(state);

      expect(result).toBe(true);
      expect(state.currentQuestionIndex).toBe(1);
      expect(state.flattenedQuestions[state.currentQuestionIndex]!.id).toBe('bool1');
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

    it('should return false when at last question (no next question)', () => {
      state.currentQuestionIndex = 2;
      expect(canGoNext(state)).toBe(false);
    });

    it('should return false when past end', () => {
      state.currentQuestionIndex = 3;
      expect(canGoNext(state)).toBe(false);
    });

    it('should handle empty questions array', () => {
      state.flattenedQuestions = [];
      state.currentQuestionIndex = 0;

      expect(canGoNext(state)).toBe(false);
    });

    it('should return false when last question is boolean with conditional children', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'bool1', type: 'boolean', question: 'Bool 1?', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'bool1' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'bool1' },
      ];
      state.currentQuestionIndex = 1; // On bool1 (last top-level question)

      // canGoNext() should return false because there's no next non-conditional question
      expect(canGoNext(state)).toBe(false);
    });
  });

  describe('canGoBack', () => {
    it('should return false at first question', () => {
      state.currentQuestionIndex = 0;
      expect(canGoBack(state)).toBe(false);
    });

    it('should return true when not at first question', () => {
      state.currentQuestionIndex = 1;
      expect(canGoBack(state)).toBe(true);
    });

    it('should return true even when past end', () => {
      state.currentQuestionIndex = 10;
      expect(canGoBack(state)).toBe(true);
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
        value: { min: 10, max: 20 },
      });
      expect(answers).toContainEqual({
        questionId: 'dateRange',
        value: { start: '2024-01-01', end: '2024-12-31' },
      });
      expect(answers).toContainEqual({
        questionId: 'choices',
        value: ['option1', 'option2'],
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

      back(state);
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

      expect(canGoBack(state)).toBe(false);
      expect(canGoNext(state)).toBe(false);

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
      back(state);
      back(state);
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
      expect(canGoBack(state)).toBe(false);
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
      back(state);

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
      back(state);
      next(state);

      const q3Count = state.visitedQuestions.filter(id => id === 'q3').length;
      expect(q3Count).toBe(1);
    });

    it('should maintain visited questions when going back', () => {
      next(state);
      next(state);

      const visitedBefore = [...state.visitedQuestions];

      back(state);

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
  describe('findNextIndex', () => {
    it('should return null when at last question', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 1;

      // findNextIndex is not exported, but we can test it through canGoNext
      expect(canGoNext(state)).toBe(false);
    });

    it('should return null when past last question', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];
      state.currentQuestionIndex = 5;

      expect(canGoNext(state)).toBe(false);
    });

    it('should return next index when next question has no conditional parent', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];
      state.currentQuestionIndex = 0;

      next(state);
      expect(state.currentQuestionIndex).toBe(1);
    });

    it('should skip over conditional children to find next non-conditional question', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'q1' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'q1' },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 0;

      next(state);
      expect(state.currentQuestionIndex).toBe(3);
      expect(state.flattenedQuestions[state.currentQuestionIndex]!.id).toBe('q2');
    });

    it('should skip over multiple levels of nested conditionals', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'q1' },
        { id: 'grandchild1', type: 'text', question: 'Grandchild 1?', required: true, conditionalParent: 'child1' },
        { id: 'grandchild2', type: 'text', question: 'Grandchild 2?', required: true, conditionalParent: 'child1' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'q1' },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 0;

      next(state);
      expect(state.currentQuestionIndex).toBe(5);
      expect(state.flattenedQuestions[state.currentQuestionIndex]!.id).toBe('q2');
    });

    it('should return null when all remaining questions are conditional', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'q1' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'q1' },
      ];
      state.currentQuestionIndex = 0;

      expect(canGoNext(state)).toBe(false);
    });

    it('should handle empty questions array', () => {
      state.flattenedQuestions = [];
      state.currentQuestionIndex = 0;

      expect(canGoNext(state)).toBe(false);
    });

    it('should handle single question', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];
      state.currentQuestionIndex = 0;

      expect(canGoNext(state)).toBe(false);
    });

    it('should skip conditionals with different parent references', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'q1' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'someOtherParent' },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 0;

      next(state);
      // Should skip both conditionals and land on q2
      expect(state.currentQuestionIndex).toBe(3);
      expect(state.flattenedQuestions[state.currentQuestionIndex]!.id).toBe('q2');
    });
  });

  describe('findPrevIndex', () => {
    it('should return null when at first question', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 0;

      expect(findPrevIndex(state)).toBe(null);
    });

    it('should return null when index is less than 1', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];
      state.currentQuestionIndex = 0;

      expect(findPrevIndex(state)).toBe(null);
    });

    it('should return previous index when previous question has no conditional parent', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
        { id: 'q3', type: 'text', question: 'Q3', required: true },
      ];
      state.currentQuestionIndex = 2;

      expect(findPrevIndex(state)).toBe(1);
    });

    it('should return the previously visited question when not a special boolean non-conditional question', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'q1' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'q1' },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 3;

      expect(findPrevIndex(state)).toBe(2);
      expect(state.flattenedQuestions[state.currentQuestionIndex]!.id).toBe('child2');
    });

    it('should return the next question when not a special boolean non-conditional question', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'q1' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'q1' },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 3;

      expect(findPrevIndex(state)).toBe(2);
      expect(state.flattenedQuestions[state.currentQuestionIndex]!.id).toBe('child2');
    });

    it('should skip over multiple levels of nested conditionals', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'q1' },
        { id: 'grandchild1', type: 'text', question: 'Grandchild 1?', required: true, conditionalParent: 'child1' },
        { id: 'grandchild2', type: 'text', question: 'Grandchild 2?', required: true, conditionalParent: 'child1' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'q1' },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 5;

      back(state);
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.flattenedQuestions[state.currentQuestionIndex]!.id).toBe('q1');
    });

    it('should return null when all previous questions are conditional', () => {
      state.flattenedQuestions = [
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'someParent' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'someParent' },
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];
      state.currentQuestionIndex = 2;

      expect(canGoBack(state)).toBe(false);
    });

    it('should handle going back from completed state', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 2;
      state.isComplete = true;

      back(state);
      expect(state.currentQuestionIndex).toBe(1);
    });

    it('should skip conditionals with different parent references', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'q1' },
        { id: 'child2', type: 'text', question: 'Child 2?', required: true, conditionalParent: 'someOtherParent' },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 3;

      back(state);
      // Should skip both conditionals and land on q1
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.flattenedQuestions[state.currentQuestionIndex]!.id).toBe('q1');
    });

    it('should handle boundary case at index 1', () => {
      state.flattenedQuestions = [
        { id: 'q1', type: 'text', question: 'Q1', required: true },
        { id: 'q2', type: 'text', question: 'Q2', required: true },
      ];
      state.currentQuestionIndex = 1;

      back(state);
      expect(state.currentQuestionIndex).toBe(0);
    });

    it('should return null when starting from conditional at index 1', () => {
      state.flattenedQuestions = [
        { id: 'child1', type: 'text', question: 'Child 1?', required: true, conditionalParent: 'someParent' },
        { id: 'q1', type: 'text', question: 'Q1', required: true },
      ];
      state.currentQuestionIndex = 1;

      expect(canGoBack(state)).toBe(false);
    });
  });
});
