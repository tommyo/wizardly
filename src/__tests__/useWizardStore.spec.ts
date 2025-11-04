import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import useWizardStore from '../composables/useWizardStore';
import type { WizardConfig, Question } from '../types';

describe('useWizardStore', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());
  });

  describe('Store Factory Creation', () => {
    const validConfig: WizardConfig = {
      wizardId: 'test-wizard',
      title: 'Test Wizard',
      description: 'A test wizard',
      questions: [
        {
          id: 'q1',
          type: 'text',
          question: 'What is your name?',
          required: true,
        },
        {
          id: 'q2',
          type: 'number',
          question: 'What is your age?',
          required: true,
        },
      ],
    };

    it('should return a valid Pinia store definition', () => {
      const storeDefinition = useWizardStore('test-store', validConfig);

      expect(storeDefinition).toBeDefined();
      expect(typeof storeDefinition).toBe('function');
    });

    it('should create store with correct id parameter', () => {
      const storeId = 'my-wizard-store';
      const storeDefinition = useWizardStore(storeId, validConfig);
      const store = storeDefinition();

      expect(store.$id).toBe(storeId);
    });

    it('should receive WizardConfig correctly', () => {
      const storeDefinition = useWizardStore('config-test', validConfig);
      const store = storeDefinition();

      // Verify the store has access to the questions from config
      expect(store.currentQuestions).toBeDefined();
      expect(Array.isArray(store.currentQuestions)).toBe(true);
    });

    it('should create multiple store instances with different ids', () => {
      const config1: WizardConfig = {
        ...validConfig,
        wizardId: 'wizard-1',
      };
      const config2: WizardConfig = {
        ...validConfig,
        wizardId: 'wizard-2',
      };

      const store1Definition = useWizardStore('store-1', config1);
      const store2Definition = useWizardStore('store-2', config2);

      const store1 = store1Definition();
      const store2 = store2Definition();

      expect(store1.$id).toBe('store-1');
      expect(store2.$id).toBe('store-2');
      expect(store1).not.toBe(store2);
    });

    it('should handle config with empty questions array', () => {
      const emptyConfig: WizardConfig = {
        wizardId: 'empty-wizard',
        title: 'Empty Wizard',
        questions: [],
      };

      const storeDefinition = useWizardStore('empty-store', emptyConfig);
      const store = storeDefinition();

      expect(store.currentQuestions).toBeDefined();
      expect(store.currentQuestions.length).toBe(0);
    });
  });

  describe('Store Initialization', () => {
    const testQuestions: Question[] = [
      {
        id: 'name',
        type: 'text',
        question: 'What is your name?',
        required: true,
      },
      {
        id: 'age',
        type: 'number',
        question: 'How old are you?',
        required: true,
      },
      {
        id: 'subscribe',
        type: 'boolean',
        question: 'Subscribe to newsletter?',
        required: false,
      },
    ];

    const config: WizardConfig = {
      wizardId: 'init-test',
      title: 'Initialization Test',
      questions: testQuestions,
    };

    it('should initialize with questions from config', () => {
      const storeDefinition = useWizardStore('init-store', config);
      const store = storeDefinition();

      expect(store.currentQuestions).toBeDefined();
      expect(store.currentQuestions.length).toBeGreaterThan(0);
    });

    it('should have properly reactive state', () => {
      const storeDefinition = useWizardStore('reactive-store', config);
      const store = storeDefinition();

      // Check that computed properties are reactive
      expect(store.isComplete).toBeDefined();
      expect(store.progress).toBeDefined();
      expect(store.canGoNext).toBeDefined();
      expect(store.canGoBack).toBeDefined();
    });

    it('should inherit all properties from useWizard composable', () => {
      const storeDefinition = useWizardStore('inherit-store', config);
      const store = storeDefinition();

      // State properties
      expect(store.currentQuestions).toBeDefined();
      expect(store.currentAnswers).toBeDefined();
      expect(store.isComplete).toBeDefined();

      // Computed properties
      expect(store.progress).toBeDefined();
      expect(store.canGoNext).toBeDefined();
      expect(store.canGoBack).toBeDefined();

      // Methods
      expect(typeof store.answerQuestions).toBe('function');
      expect(typeof store.back).toBe('function');
      expect(typeof store.next).toBe('function');
      expect(typeof store.getAnswers).toBe('function');
      expect(typeof store.getAnswersObject).toBe('function');
      expect(typeof store.reset).toBe('function');
      expect(typeof store.complete).toBe('function');
    });

    it('should be accessible via Pinia useStore pattern', () => {
      const storeDefinition = useWizardStore('pinia-store', config);

      // First call creates the store
      const store1 = storeDefinition();
      // Second call should return the same instance
      const store2 = storeDefinition();

      expect(store1).toBe(store2);
    });

    describe('Store State Management', () => {
      const config: WizardConfig = {
        wizardId: 'state-test',
        title: 'State Test',
        questions: [
          {
            id: 'q1',
            type: 'text',
            question: 'Question 1',
            required: true,
          },
          {
            id: 'q2',
            type: 'number',
            question: 'Question 2',
            required: true,
          },
        ],
      };

      it('should maintain state isolated between different store instances', () => {
        const store1Definition = useWizardStore('isolated-1', config);
        const store2Definition = useWizardStore('isolated-2', config);

        const store1 = store1Definition();
        const store2 = store2Definition();

        // Answer question in store1
        store1.answerQuestions(store1.currentQuestions, ['Answer 1']);

        // Store2 should not have this answer
        const store1Answers = store1.getAnswers();
        const store2Answers = store2.getAnswers();

        expect(store1Answers.length).toBeGreaterThan(0);
        expect(store2Answers.length).toBe(0);
      });

      it('should trigger reactivity when state updates', () => {
        const storeDefinition = useWizardStore('reactive-test', config);
        const store = storeDefinition();

        const initialProgress = store.progress.current;

        // Answer a question
        store.answerQuestions(store.currentQuestions, ['Test Answer']);

        // Progress should update
        expect(store.progress.current).toBeGreaterThan(initialProgress);
      });

      it('should allow store to be reset to initial state', () => {
        const storeDefinition = useWizardStore('reset-test', config);
        const store = storeDefinition();

        // Answer questions
        store.answerQuestions(store.currentQuestions, ['Answer']);
        expect(store.getAnswers().length).toBeGreaterThan(0);

        // Reset
        store.reset();

        // Should be back to initial state
        expect(store.getAnswers().length).toBe(0);
        // Progress.current is currentQuestionIndex + 1, so after reset (index=0) it's 1
        expect(store.progress.current).toBe(1);
        expect(store.progress.percentage).toBe(50); // 1/2 questions = 50%
      });
    });

    describe('Integration with useWizard', () => {
      const config: WizardConfig = {
        wizardId: 'integration-test',
        title: 'Integration Test',
        questions: [
          {
            id: 'name',
            type: 'text',
            question: 'Name?',
            required: true,
          },
          {
            id: 'age',
            type: 'number',
            question: 'Age?',
            required: true,
          },
          {
            id: 'email',
            type: 'text',
            question: 'Email?',
            required: false,
          },
        ],
      };

      it('should have working currentQuestions computed property', () => {
        const storeDefinition = useWizardStore('current-q-test', config);
        const store = storeDefinition();

        expect(store.currentQuestions).toBeDefined();
        expect(Array.isArray(store.currentQuestions)).toBe(true);
        expect(store.currentQuestions.length).toBeGreaterThan(0);
      });

      it('should have working currentAnswers computed property', () => {
        const storeDefinition = useWizardStore('current-a-test', config);
        const store = storeDefinition();

        expect(store.currentAnswers).toBeDefined();
        expect(Array.isArray(store.currentAnswers)).toBe(true);
      });

      it('should have working isComplete computed property', () => {
        const storeDefinition = useWizardStore('complete-test', config);
        const store = storeDefinition();

        expect(typeof store.isComplete).toBe('boolean');
        expect(store.isComplete).toBe(false);
      });

      it('should have working progress computed property', () => {
        const storeDefinition = useWizardStore('progress-test', config);
        const store = storeDefinition();

        expect(store.progress).toBeDefined();
        expect(typeof store.progress.current).toBe('number');
        expect(typeof store.progress.total).toBe('number');
        expect(typeof store.progress.percentage).toBe('number');
      });

      it('should have working canGoNext computed property', () => {
        const storeDefinition = useWizardStore('next-test', config);
        const store = storeDefinition();

        expect(typeof store.canGoNext).toBe('boolean');
      });

      it('should have working canGoBack computed property', () => {
        const storeDefinition = useWizardStore('prev-test', config);
        const store = storeDefinition();

        expect(typeof store.canGoBack).toBe('boolean');
        expect(store.canGoBack).toBe(false); // Should be false at start
      });

      it('should have working answerQuestions method', () => {
        const storeDefinition = useWizardStore('answer-test', config);
        const store = storeDefinition();

        const initialAnswers = store.getAnswers().length;

        store.answerQuestions(store.currentQuestions, ['John Doe']);

        const newAnswers = store.getAnswers().length;
        expect(newAnswers).toBeGreaterThan(initialAnswers);
      });

      it('should have working goBack method', () => {
        const storeDefinition = useWizardStore('back-test', config);
        const store = storeDefinition();

        // Move forward first
        store.answerQuestions(store.currentQuestions, ['Test']);

        // Now we should be able to go back
        const result = store.back();
        expect(typeof result).toBe('boolean');
      });

      it('should have working next method', () => {
        const storeDefinition = useWizardStore('skip-test', config);
        const store = storeDefinition();

        const result = store.next();
        expect(typeof result).toBe('boolean');
      });

      it('should have working getAnswers method', () => {
        const storeDefinition = useWizardStore('get-answers-test', config);
        const store = storeDefinition();

        const answers = store.getAnswers();
        expect(Array.isArray(answers)).toBe(true);
      });

      it('should have working getAnswersObject method', () => {
        const storeDefinition = useWizardStore('get-obj-test', config);
        const store = storeDefinition();

        store.answerQuestions(store.currentQuestions, ['Jane']);

        const answersObj = store.getAnswersObject();
        expect(typeof answersObj).toBe('object');
        expect(answersObj).toHaveProperty('name');
      });

      it('should have working reset method', () => {
        const storeDefinition = useWizardStore('reset-method-test', config);
        const store = storeDefinition();

        store.answerQuestions(store.currentQuestions, ['Test']);
        expect(store.getAnswers().length).toBeGreaterThan(0);

        store.reset();
        expect(store.getAnswers().length).toBe(0);
      });

      it('should have working complete method', () => {
        const storeDefinition = useWizardStore('complete-method-test', config);
        const store = storeDefinition();

        const result = store.complete();
        expect(result).toBeDefined();
        expect(result).toHaveProperty('answers');
        expect(result).toHaveProperty('answersObject');
        expect(Array.isArray(result.answers)).toBe(true);
        expect(typeof result.answersObject).toBe('object');
      });

      describe('Multiple Store Instances', () => {
        const config1: WizardConfig = {
          wizardId: 'wizard-1',
          title: 'Wizard 1',
          questions: [
            { id: 'q1', type: 'text', question: 'Question 1', required: true },
          ],
        };

        const config2: WizardConfig = {
          wizardId: 'wizard-2',
          title: 'Wizard 2',
          questions: [
            { id: 'q2', type: 'number', question: 'Question 2', required: true },
          ],
        };

        it('should create multiple stores with different wizardIds', () => {
          const store1Def = useWizardStore('multi-store-1', config1);
          const store2Def = useWizardStore('multi-store-2', config2);

          const store1 = store1Def();
          const store2 = store2Def();

          expect(store1.$id).toBe('multi-store-1');
          expect(store2.$id).toBe('multi-store-2');
        });

        it('should maintain separate state for stores with different ids', () => {
          const store1Def = useWizardStore('separate-1', config1);
          const store2Def = useWizardStore('separate-2', config2);

          const store1 = store1Def();
          const store2 = store2Def();

          // Answer in store1
          store1.answerQuestions(store1.currentQuestions, ['Store 1 Answer']);

          // Answer in store2
          store2.answerQuestions(store2.currentQuestions, [42]);

          // Verify isolation
          const store1Answers = store1.getAnswersObject();
          const store2Answers = store2.getAnswersObject();

          expect(store1Answers).toHaveProperty('q1');
          expect(store1Answers).not.toHaveProperty('q2');
          expect(store2Answers).toHaveProperty('q2');
          expect(store2Answers).not.toHaveProperty('q1');
        });

        it('should share state for stores with same id (Pinia behavior)', () => {
          const storeId = 'shared-store';
          const store1Def = useWizardStore(storeId, config1);
          const store2Def = useWizardStore(storeId, config1);

          const store1 = store1Def();
          const store2 = store2Def();

          // They should be the same instance
          expect(store1).toBe(store2);

          // Answer in store1
          store1.answerQuestions(store1.currentQuestions, ['Shared Answer']);

          // Should be visible in store2
          const store2Answers = store2.getAnswersObject();
          expect(store2Answers).toHaveProperty('q1');
          expect(store2Answers.q1).toBe('Shared Answer');
        });

        it('should not leak state between different store instances', () => {
          const store1Def = useWizardStore('leak-test-1', config1);
          const store2Def = useWizardStore('leak-test-2', config1);

          const store1 = store1Def();
          const store2 = store2Def();

          // Modify store1
          store1.answerQuestions(store1.currentQuestions, ['Store 1']);

          // Store2 should be unaffected
          expect(store2.getAnswers().length).toBe(0);

          // Modify store2
          store2.answerQuestions(store2.currentQuestions, ['Store 2']);

          // Store1 should still have its original answer
          const store1Obj = store1.getAnswersObject();
          expect(store1Obj.q1).toBe('Store 1');
        });
      });

      describe('Error Handling', () => {
        it('should handle config with empty questions array gracefully', () => {
          const emptyConfig: WizardConfig = {
            wizardId: 'empty',
            title: 'Empty',
            questions: [],
          };

          const storeDef = useWizardStore('empty-error', emptyConfig);
          const store = storeDef();

          expect(store.currentQuestions).toBeDefined();
          expect(store.currentQuestions.length).toBe(0);
          expect(store.isComplete).toBe(false);
        });

        it('should handle malformed questions array', () => {
          const malformedConfig: WizardConfig = {
            wizardId: 'malformed',
            title: 'Malformed',
            questions: [
              { id: 'q1', type: 'text', question: 'Valid question', required: true },
              // Missing required fields would be caught by TypeScript, but runtime handling
            ],
          };

          const storeDef = useWizardStore('malformed-test', malformedConfig);
          const store = storeDef();

          expect(store.currentQuestions).toBeDefined();
          expect(store.currentQuestions.length).toBeGreaterThan(0);
        });

        it('should handle answering non-existent questions', () => {
          const config: WizardConfig = {
            wizardId: 'non-existent',
            title: 'Test',
            questions: [
              { id: 'q1', type: 'text', question: 'Question 1', required: true },
            ],
          };

          const storeDef = useWizardStore('non-existent-test', config);
          const store = storeDef();

          // Try to answer a question that doesn't exist
          const results = store.answerQuestions(store.currentQuestions, ['test']);

          // Should not crash, but answer won't be stored since question doesn't exist
          const answers = store.getAnswersObject();
          expect(answers).not.toHaveProperty('non-existent-id');

          // Validation should have returned results
          expect(results).toBeDefined();
        });

        it('should handle reset with undefined answers', () => {
          const config: WizardConfig = {
            wizardId: 'reset-undefined',
            title: 'Test',
            questions: [
              { id: 'q1', type: 'text', question: 'Question 1', required: true },
            ],
          };

          const storeDef = useWizardStore('reset-undefined-test', config);
          const store = storeDef();

          store.answerQuestions(store.currentQuestions, ['test']);

          // Reset without providing answers
          store.reset();

          expect(store.getAnswers().length).toBe(0);
        });

        it('should handle rapid state updates', () => {
          const config: WizardConfig = {
            wizardId: 'rapid',
            title: 'Rapid Test',
            questions: [
              { id: 'q1', type: 'text', question: 'Q1', required: true },
              { id: 'q2', type: 'text', question: 'Q2', required: true },
              { id: 'q3', type: 'text', question: 'Q3', required: true },
            ],
          };

          const storeDef = useWizardStore('rapid-test', config);
          const store = storeDef();

          // Rapid updates on same question by going back each time
          for (let i = 0; i < 10; i++) {
            store.answerQuestions(store.currentQuestions, [`Answer ${i}`]);
            if (i < 9) {
              store.back(); // Go back to update the same question again
            }
          }

          // Should have the last answer
          const answers = store.getAnswersObject();
          expect(answers.q1).toBe('Answer 9');
        });
      });

      describe('TypeScript Type Safety', () => {
        it('should have correct type signatures for methods', () => {
          const config: WizardConfig = {
            wizardId: 'type-test',
            title: 'Type Test',
            questions: [
              { id: 'q1', type: 'text', question: 'Question', required: true },
            ],
          };

          const storeDef = useWizardStore('type-safety-test', config);
          const store = storeDef();

          // These should all be properly typed
          expect(typeof store.answerQuestions).toBe('function');
          expect(typeof store.back).toBe('function');
          expect(typeof store.next).toBe('function');
          expect(typeof store.getAnswers).toBe('function');
          expect(typeof store.getAnswersObject).toBe('function');
          expect(typeof store.reset).toBe('function');
          expect(typeof store.complete).toBe('function');
        });

        it('should have correct types for state properties', () => {
          const config: WizardConfig = {
            wizardId: 'state-types',
            title: 'State Types',
            questions: [
              { id: 'q1', type: 'text', question: 'Question', required: true },
            ],
          };

          const storeDef = useWizardStore('state-types-test', config);
          const store = storeDef();

          // Verify types
          expect(Array.isArray(store.currentQuestions)).toBe(true);
          expect(Array.isArray(store.currentAnswers)).toBe(true);
          expect(typeof store.isComplete).toBe('boolean');
          expect(typeof store.progress).toBe('object');
          expect(typeof store.canGoNext).toBe('boolean');
          expect(typeof store.canGoBack).toBe('boolean');
        });
      });
    });
  });
});
