// wizard-engine.spec.ts - Tests for WizardEngine class
import { describe, it, expect } from 'vitest';
import type { Question, Answer } from '../types';
import { WizardEngine } from '../wizard-engine';

describe('WizardEngine', () => {
  describe('Initialization', () => {
    it('should initialize with valid questions', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Name?', required: true },
        { id: 'q2', type: 'number', question: 'Age?', required: true },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      expect(state.currentQuestionIndex).toBe(0);
      expect(state.answers.size).toBe(0);
      expect(state.flattenedQuestions.length).toBe(2);
      expect(state.visitedQuestions.length).toBe(0);
      expect(state.isComplete).toBe(false);
    });

    it('should initialize with empty questions array', () => {
      const engine = new WizardEngine([]);
      const state = engine.initState();

      expect(state.flattenedQuestions.length).toBe(0);
      expect(state.isComplete).toBe(false);
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

      const engine = new WizardEngine(questions);
      const state = engine.initState(answers);

      expect(state.answers.size).toBe(2);
      expect(state.answers.get('q1')).toBe('John');
      expect(state.answers.get('q2')).toBe(25);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset wizard state', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Name?', required: true },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      // Add some state
      engine.answerQuestions(state, [{ questionId: 'q1', value: 'John' }]);
      state.currentQuestionIndex = 1;
      state.visitedQuestions = ['q1'];

      // Reset
      engine.reset(state);

      expect(state.currentQuestionIndex).toBe(0);
      expect(state.answers.size).toBe(0);
      expect(state.visitedQuestions.length).toBe(0);
      expect(state.isComplete).toBe(false);
    });

    it('should reset with new answers', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Name?', required: true },
        { id: 'q2', type: 'number', question: 'Age?', required: true },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      const newAnswers: Answer[] = [
        { questionId: 'q1', value: 'Jane' },
      ];

      engine.reset(state, newAnswers);

      expect(state.answers.size).toBe(1);
      expect(state.answers.get('q1')).toBe('Jane');
      expect(state.currentQuestionIndex).toBe(0);
    });
  });

  describe('Answer Storage and Validation', () => {
    it('should store valid answers', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Name?', required: true },
        { id: 'q2', type: 'number', question: 'Age?', required: true },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      const results = engine.answerQuestions(state, [
        { questionId: 'q1', value: 'John' },
        { questionId: 'q2', value: 25 },
      ]);

      expect(results.length).toBe(2);
      expect(results[0]!.isValid).toBe(true);
      expect(results[1]!.isValid).toBe(true);
      expect(state.answers.get('q1')).toBe('John');
      expect(state.answers.get('q2')).toBe(25);
    });

    it('should reject invalid answers', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'text',
          question: 'Name?',
          required: true,
          validation: { minLength: 5 },
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      const results = engine.answerQuestions(state, [
        { questionId: 'q1', value: 'Jo' }, // Too short
      ]);

      expect(results.length).toBe(1);
      expect(results[0]!.isValid).toBe(false);
      expect(results[0]!.error).toBeDefined();
      expect(state.answers.has('q1')).toBe(false); // Invalid answer not stored
    });

    it('should handle required field validation', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Name?', required: true },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      const results = engine.answerQuestions(state, [
        { questionId: 'q1', value: '' },
      ]);

      expect(results[0]!.isValid).toBe(false);
      expect(results[0]!.error?.message).toBe('This question is required');
    });

    it('should not store answers for non-existent questions', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Name?', required: true },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      const results = engine.answerQuestions(state, [
        { questionId: 'nonexistent', value: 'test' },
      ]);

      expect(results.length).toBe(0);
      expect(state.answers.has('nonexistent')).toBe(false);
    });
  });

  describe('Conditional Questions - equals operator', () => {
    it('should show conditional question when condition is met', () => {
      const questions: Question[] = [
        {
          id: 'user_type',
          type: 'text',
          question: 'Are you a student?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: 'student' },
              question: {
                id: 'school',
                type: 'text',
                question: 'What school?',
                required: true,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      // Initially, only parent question
      expect(state.flattenedQuestions.length).toBe(1);

      // Answer with 'student'
      engine.answerQuestions(state, [
        { questionId: 'user_type', value: 'student' },
      ]);

      // Now conditional question should appear
      expect(state.flattenedQuestions.length).toBe(2);
      expect(state.flattenedQuestions[1]!.id).toBe('school');
    });

    it('should hide conditional question when condition is not met', () => {
      const questions: Question[] = [
        {
          id: 'user_type',
          type: 'text',
          question: 'Are you a student?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: 'student' },
              question: {
                id: 'school',
                type: 'text',
                question: 'What school?',
                required: true,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      // Answer with 'professional'
      engine.answerQuestions(state, [
        { questionId: 'user_type', value: 'professional' },
      ]);

      // Conditional question should not appear
      expect(state.flattenedQuestions.length).toBe(1);
    });
  });

  describe('Conditional Questions - greaterThan operator', () => {
    it('should show conditional when value is greater than threshold', () => {
      const questions: Question[] = [
        {
          id: 'age',
          type: 'number',
          question: 'Age?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'greaterThan', value: 65 },
              question: {
                id: 'senior',
                type: 'boolean',
                question: 'Senior discount?',
                required: false,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      engine.answerQuestions(state, [{ questionId: 'age', value: 70 }]);

      expect(state.flattenedQuestions.length).toBe(2);
      expect(state.flattenedQuestions[1]!.id).toBe('senior');
    });

    it('should hide conditional when value is not greater than threshold', () => {
      const questions: Question[] = [
        {
          id: 'age',
          type: 'number',
          question: 'Age?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'greaterThan', value: 65 },
              question: {
                id: 'senior',
                type: 'boolean',
                question: 'Senior discount?',
                required: false,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      engine.answerQuestions(state, [{ questionId: 'age', value: 30 }]);

      expect(state.flattenedQuestions.length).toBe(1);
    });
  });

  describe('Conditional Questions - lessThan operator', () => {
    it('should show conditional when value is less than threshold', () => {
      const questions: Question[] = [
        {
          id: 'age',
          type: 'number',
          question: 'Age?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'lessThan', value: 18 },
              question: {
                id: 'guardian',
                type: 'text',
                question: 'Guardian name?',
                required: true,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      engine.answerQuestions(state, [{ questionId: 'age', value: 15 }]);

      expect(state.flattenedQuestions.length).toBe(2);
      expect(state.flattenedQuestions[1]!.id).toBe('guardian');
    });

    it('should hide conditional when value is not less than threshold', () => {
      const questions: Question[] = [
        {
          id: 'age',
          type: 'number',
          question: 'Age?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'lessThan', value: 18 },
              question: {
                id: 'guardian',
                type: 'text',
                question: 'Guardian name?',
                required: true,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      engine.answerQuestions(state, [{ questionId: 'age', value: 25 }]);

      expect(state.flattenedQuestions.length).toBe(1);
    });
  });

  describe('Conditional Questions - contains operator', () => {
    it('should show conditional when array contains value', () => {
      const questions: Question[] = [
        {
          id: 'interests',
          type: 'multiple-choice',
          question: 'Interests?',
          required: true,
          allowMultiple: true,
          options: [
            { label: 'Sports', value: 'sports' },
            { label: 'Music', value: 'music' },
          ],
          conditionalQuestions: [
            {
              condition: { operator: 'contains', value: 'sports' },
              question: {
                id: 'favorite_sport',
                type: 'text',
                question: 'Favorite sport?',
                required: false,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      engine.answerQuestions(state, [
        { questionId: 'interests', value: ['sports', 'music'] },
      ]);

      expect(state.flattenedQuestions.length).toBe(2);
      expect(state.flattenedQuestions[1]!.id).toBe('favorite_sport');
    });

    it('should hide conditional when array does not contain value', () => {
      const questions: Question[] = [
        {
          id: 'interests',
          type: 'multiple-choice',
          question: 'Interests?',
          required: true,
          allowMultiple: true,
          options: [
            { label: 'Sports', value: 'sports' },
            { label: 'Music', value: 'music' },
          ],
          conditionalQuestions: [
            {
              condition: { operator: 'contains', value: 'sports' },
              question: {
                id: 'favorite_sport',
                type: 'text',
                question: 'Favorite sport?',
                required: false,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      engine.answerQuestions(state, [
        { questionId: 'interests', value: ['music'] },
      ]);

      expect(state.flattenedQuestions.length).toBe(1);
    });
  });

  describe('Conditional Questions - between operator', () => {
    it('should show conditional when value is between range', () => {
      const questions: Question[] = [
        {
          id: 'age',
          type: 'number',
          question: 'Age?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'between', value: [18, 65] },
              question: {
                id: 'employment',
                type: 'text',
                question: 'Employment status?',
                required: false,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      engine.answerQuestions(state, [{ questionId: 'age', value: 30 }]);

      expect(state.flattenedQuestions.length).toBe(2);
      expect(state.flattenedQuestions[1]!.id).toBe('employment');
    });

    it('should hide conditional when value is outside range', () => {
      const questions: Question[] = [
        {
          id: 'age',
          type: 'number',
          question: 'Age?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'between', value: [18, 65] },
              question: {
                id: 'employment',
                type: 'text',
                question: 'Employment status?',
                required: false,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      engine.answerQuestions(state, [{ questionId: 'age', value: 70 }]);

      expect(state.flattenedQuestions.length).toBe(1);
    });
  });

  describe('Nested Conditional Questions', () => {
    it('should handle nested conditionals correctly', () => {
      const questions: Question[] = [
        {
          id: 'has_pet',
          type: 'boolean',
          question: 'Do you have a pet?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: true },
              question: {
                id: 'pet_type',
                type: 'text',
                question: 'What type?',
                required: true,
                conditionalQuestions: [
                  {
                    condition: { operator: 'equals', value: 'dog' },
                    question: {
                      id: 'dog_breed',
                      type: 'text',
                      question: 'What breed?',
                      required: false,
                    },
                  },
                ],
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      // Answer yes to having a pet
      engine.answerQuestions(state, [{ questionId: 'has_pet', value: true }]);
      expect(state.flattenedQuestions.length).toBe(2);

      // Answer dog for pet type
      engine.answerQuestions(state, [{ questionId: 'pet_type', value: 'dog' }]);
      expect(state.flattenedQuestions.length).toBe(3);
      expect(state.flattenedQuestions[2]!.id).toBe('dog_breed');
    });

    it('should handle deep nesting (3+ levels)', () => {
      const questions: Question[] = [
        {
          id: 'level1',
          type: 'boolean',
          question: 'Level 1?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: true },
              question: {
                id: 'level2',
                type: 'boolean',
                question: 'Level 2?',
                required: true,
                conditionalQuestions: [
                  {
                    condition: { operator: 'equals', value: true },
                    question: {
                      id: 'level3',
                      type: 'boolean',
                      question: 'Level 3?',
                      required: true,
                      conditionalQuestions: [
                        {
                          condition: { operator: 'equals', value: true },
                          question: {
                            id: 'level4',
                            type: 'text',
                            question: 'Level 4?',
                            required: false,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      // Boolean questions show their conditionals before being answered
      // So initially we see all 4 levels
      expect(state.flattenedQuestions.length).toBe(4);

      // Answer level1 = true (keeps all levels visible)
      engine.answerQuestions(state, [{ questionId: 'level1', value: true }]);
      expect(state.flattenedQuestions.length).toBe(4);

      // Answer level2 = true (keeps all levels visible)
      engine.answerQuestions(state, [{ questionId: 'level2', value: true }]);
      expect(state.flattenedQuestions.length).toBe(4);

      // Answer level3 = true (keeps all levels visible)
      engine.answerQuestions(state, [{ questionId: 'level3', value: true }]);
      expect(state.flattenedQuestions.length).toBe(4);
      expect(state.flattenedQuestions[3]!.id).toBe('level4');

      // Answer level1 = false (should hide all nested levels)
      engine.answerQuestions(state, [{ questionId: 'level1', value: false }]);
      expect(state.flattenedQuestions.length).toBe(1);
    });

    it('should remove nested conditionals when parent condition changes', () => {
      const questions: Question[] = [
        {
          id: 'has_pet',
          type: 'boolean',
          question: 'Do you have a pet?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: true },
              question: {
                id: 'pet_type',
                type: 'text',
                question: 'What type?',
                required: true,
                conditionalQuestions: [
                  {
                    condition: { operator: 'equals', value: 'dog' },
                    question: {
                      id: 'dog_breed',
                      type: 'text',
                      question: 'What breed?',
                      required: false,
                    },
                  },
                ],
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      // Build up nested conditionals
      engine.answerQuestions(state, [{ questionId: 'has_pet', value: true }]);
      engine.answerQuestions(state, [{ questionId: 'pet_type', value: 'dog' }]);
      expect(state.flattenedQuestions.length).toBe(3);

      // Change parent answer
      engine.answerQuestions(state, [{ questionId: 'has_pet', value: false }]);
      expect(state.flattenedQuestions.length).toBe(1);
    });
  });

  describe('Multiple Conditional Branches', () => {
    it('should handle multiple conditional branches from same question', () => {
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
            {
              condition: { operator: 'equals', value: 'professional' },
              question: {
                id: 'company',
                type: 'text',
                question: 'Company?',
                required: true,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      // Answer student
      engine.answerQuestions(state, [
        { questionId: 'user_type', value: 'student' },
      ]);
      expect(state.flattenedQuestions.length).toBe(2);
      expect(state.flattenedQuestions[1]!.id).toBe('school');

      // Change to professional
      engine.answerQuestions(state, [
        { questionId: 'user_type', value: 'professional' },
      ]);
      expect(state.flattenedQuestions.length).toBe(2);
      expect(state.flattenedQuestions[1]!.id).toBe('company');
    });
  });

  describe('Boolean Question Special Handling', () => {
    it('should show boolean conditional questions before answer', () => {
      const questions: Question[] = [
        {
          id: 'has_pet',
          type: 'boolean',
          question: 'Do you have a pet?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: true },
              question: {
                id: 'pet_name',
                type: 'text',
                question: 'Pet name?',
                required: true,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      // Before answering, boolean conditionals should be visible
      expect(state.flattenedQuestions.length).toBe(2);
      expect(state.flattenedQuestions[1]!.id).toBe('pet_name');
    });
  });

  describe('Boolean Question Special Handling with Deep Nesting', () => {
    it('should show deeply nested boolean conditional questions before answers', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          type: 'boolean',
          question: 'Is religion important to you?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: true },
              question: {
                id: 'q1a',
                type: 'boolean',
                question: 'Is it important that religion is important to your match?',
                required: true,
                conditionalQuestions: [
                  {
                    condition: { operator: 'equals', value: true },
                    question: {
                      id: 'q1a1',
                      type: 'text',
                      question: 'What religion?',
                      required: true,
                    },
                  },
                ],
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      // Before answering any questions, all boolean children should be visible
      // q1 (boolean) -> q1a (boolean) -> q1a1 (text)
      expect(state.flattenedQuestions.length).toBe(3);
      expect(state.flattenedQuestions[0]!.id).toBe('q1');
      expect(state.flattenedQuestions[1]!.id).toBe('q1a');
      expect(state.flattenedQuestions[2]!.id).toBe('q1a1');

      // Answer q1 = true (should keep all children visible)
      engine.answerQuestions(state, [{ questionId: 'q1', value: true }]);
      expect(state.flattenedQuestions.length).toBe(3);

      // Answer q1a = true (should keep text question visible)
      engine.answerQuestions(state, [{ questionId: 'q1a', value: true }]);
      expect(state.flattenedQuestions.length).toBe(3);
      expect(state.flattenedQuestions[2]!.id).toBe('q1a1');

      // Answer q1a = false (should hide text question)
      engine.answerQuestions(state, [{ questionId: 'q1a', value: false }]);
      expect(state.flattenedQuestions.length).toBe(2);
      expect(state.flattenedQuestions[0]!.id).toBe('q1');
      expect(state.flattenedQuestions[1]!.id).toBe('q1a');

      // Answer q1 = false (should hide all nested questions)
      engine.answerQuestions(state, [{ questionId: 'q1', value: false }]);
      expect(state.flattenedQuestions.length).toBe(1);
      expect(state.flattenedQuestions[0]!.id).toBe('q1');
    });

    it('should handle mixed boolean and non-boolean nested questions', () => {
      const questions: Question[] = [
        {
          id: 'has_pet',
          type: 'boolean',
          question: 'Do you have a pet?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: true },
              question: {
                id: 'pet_type',
                type: 'text',
                question: 'What type of pet?',
                required: true,
                conditionalQuestions: [
                  {
                    condition: { operator: 'equals', value: 'dog' },
                    question: {
                      id: 'has_training',
                      type: 'boolean',
                      question: 'Is your dog trained?',
                      required: true,
                      conditionalQuestions: [
                        {
                          condition: { operator: 'equals', value: true },
                          question: {
                            id: 'training_type',
                            type: 'text',
                            question: 'What type of training?',
                            required: false,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      // Initially, only has_pet and pet_type should be visible (boolean shows children)
      expect(state.flattenedQuestions.length).toBe(2);
      expect(state.flattenedQuestions[0]!.id).toBe('has_pet');
      expect(state.flattenedQuestions[1]!.id).toBe('pet_type');

      // Answer has_pet = true (keeps pet_type visible)
      engine.answerQuestions(state, [{ questionId: 'has_pet', value: true }]);
      expect(state.flattenedQuestions.length).toBe(2);

      // Answer pet_type = 'dog' (should show has_training and training_type)
      engine.answerQuestions(state, [{ questionId: 'pet_type', value: 'dog' }]);
      expect(state.flattenedQuestions.length).toBe(4);
      expect(state.flattenedQuestions[2]!.id).toBe('has_training');
      expect(state.flattenedQuestions[3]!.id).toBe('training_type');

      // Answer has_training = true (keeps training_type visible)
      engine.answerQuestions(state, [{ questionId: 'has_training', value: true }]);
      expect(state.flattenedQuestions.length).toBe(4);

      // Answer has_training = false (hides training_type)
      engine.answerQuestions(state, [{ questionId: 'has_training', value: false }]);
      expect(state.flattenedQuestions.length).toBe(3);
      expect(state.flattenedQuestions[2]!.id).toBe('has_training');

      // Change pet_type to 'cat' (should hide has_training branch)
      engine.answerQuestions(state, [{ questionId: 'pet_type', value: 'cat' }]);
      expect(state.flattenedQuestions.length).toBe(2);
      expect(state.flattenedQuestions[0]!.id).toBe('has_pet');
      expect(state.flattenedQuestions[1]!.id).toBe('pet_type');
    });

    it('should handle 4+ levels of nested boolean questions', () => {
      const questions: Question[] = [
        {
          id: 'level1',
          type: 'boolean',
          question: 'Level 1?',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: true },
              question: {
                id: 'level2',
                type: 'boolean',
                question: 'Level 2?',
                required: true,
                conditionalQuestions: [
                  {
                    condition: { operator: 'equals', value: true },
                    question: {
                      id: 'level3',
                      type: 'boolean',
                      question: 'Level 3?',
                      required: true,
                      conditionalQuestions: [
                        {
                          condition: { operator: 'equals', value: true },
                          question: {
                            id: 'level4',
                            type: 'boolean',
                            question: 'Level 4?',
                            required: true,
                            conditionalQuestions: [
                              {
                                condition: { operator: 'equals', value: true },
                                question: {
                                  id: 'level5',
                                  type: 'text',
                                  question: 'Level 5 text',
                                  required: false,
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      // All 5 levels should be visible initially (boolean special handling)
      expect(state.flattenedQuestions.length).toBe(5);
      expect(state.flattenedQuestions[0]!.id).toBe('level1');
      expect(state.flattenedQuestions[1]!.id).toBe('level2');
      expect(state.flattenedQuestions[2]!.id).toBe('level3');
      expect(state.flattenedQuestions[3]!.id).toBe('level4');
      expect(state.flattenedQuestions[4]!.id).toBe('level5');

      // Toggle level3 to false (should hide level4 and level5)
      engine.answerQuestions(state, [{ questionId: 'level3', value: false }]);
      expect(state.flattenedQuestions.length).toBe(3);
      expect(state.flattenedQuestions[2]!.id).toBe('level3');

      // Toggle level3 back to true (should show level4 and level5 again)
      engine.answerQuestions(state, [{ questionId: 'level3', value: true }]);
      expect(state.flattenedQuestions.length).toBe(5);

      // Toggle level1 to false (should hide all nested levels)
      engine.answerQuestions(state, [{ questionId: 'level1', value: false }]);
      expect(state.flattenedQuestions.length).toBe(1);
      expect(state.flattenedQuestions[0]!.id).toBe('level1');

      // Toggle level1 back to true (should restore all levels)
      engine.answerQuestions(state, [{ questionId: 'level1', value: true }]);
      expect(state.flattenedQuestions.length).toBe(5);
    });
  });

  describe('Add Questions', () => {
    it('should add new questions to existing wizard', () => {
      const initialQuestions: Question[] = [
        { id: 'q1', type: 'text', question: 'Question 1', required: true },
      ];

      const engine = new WizardEngine(initialQuestions);
      const state = engine.initState();

      expect(state.flattenedQuestions.length).toBe(1);

      const newQuestions: Question[] = [
        { id: 'q2', type: 'text', question: 'Question 2', required: true },
        { id: 'q3', type: 'text', question: 'Question 3', required: true },
      ];

      engine.addQuestions(state, newQuestions);

      expect(state.flattenedQuestions.length).toBe(3);
    });

    it('should rebuild questions list after adding', () => {
      const initialQuestions: Question[] = [
        {
          id: 'q1',
          type: 'boolean',
          question: 'Question 1',
          required: true,
          conditionalQuestions: [
            {
              condition: { operator: 'equals', value: true },
              question: {
                id: 'q1_conditional',
                type: 'text',
                question: 'Conditional',
                required: false,
              },
            },
          ],
        },
      ];

      const engine = new WizardEngine(initialQuestions);
      const state = engine.initState();

      engine.answerQuestions(state, [{ questionId: 'q1', value: true }]);
      expect(state.flattenedQuestions.length).toBe(2);

      const newQuestions: Question[] = [
        { id: 'q2', type: 'text', question: 'Question 2', required: true },
      ];

      engine.addQuestions(state, newQuestions);

      // Should still have conditionals plus new question
      expect(state.flattenedQuestions.length).toBe(3);
    });
  });

  describe('Find Question By ID', () => {
    it('should find top-level questions', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Question 1', required: true },
        { id: 'q2', type: 'text', question: 'Question 2', required: true },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      const results = engine.answerQuestions(state, [
        { questionId: 'q1', value: 'test' },
      ]);

      expect(results.length).toBe(1);
      expect(results[0]!.isValid).toBe(true);
    });

    it('should find nested conditional questions', () => {
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

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      engine.answerQuestions(state, [{ questionId: 'parent', value: true }]);

      const results = engine.answerQuestions(state, [
        { questionId: 'child', value: 'test' },
      ]);

      expect(results.length).toBe(1);
      expect(results[0]!.isValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty answer array', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Question 1', required: true },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      const results = engine.answerQuestions(state, []);

      expect(results.length).toBe(0);
      expect(state.answers.size).toBe(0);
    });

    it('should handle updating existing answers', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Question 1', required: true },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      engine.answerQuestions(state, [{ questionId: 'q1', value: 'first' }]);
      expect(state.answers.get('q1')).toBe('first');

      engine.answerQuestions(state, [{ questionId: 'q1', value: 'second' }]);
      expect(state.answers.get('q1')).toBe('second');
    });

    it('should preserve other answers when updating one', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', question: 'Question 1', required: true },
        { id: 'q2', type: 'text', question: 'Question 2', required: true },
      ];

      const engine = new WizardEngine(questions);
      const state = engine.initState();

      engine.answerQuestions(state, [
        { questionId: 'q1', value: 'answer1' },
        { questionId: 'q2', value: 'answer2' },
      ]);

      engine.answerQuestions(state, [{ questionId: 'q1', value: 'updated' }]);

      expect(state.answers.get('q1')).toBe('updated');
      expect(state.answers.get('q2')).toBe('answer2');
    });
  });
});
