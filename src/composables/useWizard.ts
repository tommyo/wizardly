// useWizard.ts - Vue 3 Composable for wizard management

import { computed, reactive, ref } from 'vue';
import { WizardEngine } from '../wizard-engine';
import * as wizard from '../wizard-state';
import type { Question, Answer, ValidationResult, AnswerValue } from '../types';
import { validateAnswer } from '@/validators';
export function useWizard(questions: Question[], answers?: Answer[]) {

  const engine = new WizardEngine(questions);

  // Create the wizard state
  const state = reactive(engine.initState(answers));

  // Track validation errors
  const validationErrors = ref<Map<string, string>>(new Map());

  const currentQuestions = computed(() => wizard.getQuestionSet(state));

  const currentAnswers = computed(() => {
    if (currentQuestions.value) {
      return wizard.getCurrentAnswers(state, currentQuestions.value);
    }
    return [];
  });

  const isComplete = computed(() => state.isComplete);

  const progress = computed(() => {
    return wizard.getProgress(state);
  });
  const canGoNext = computed(() => {
    return wizard.canGoNext(state, currentQuestions.value.length);
  });
  const canGoPrevious = computed(() => {
    return wizard.canGoPrevious(state);
  });

  /**
   * Submit the current answers and move on.
   * Returns validation results for each answer.
   */
  const answerQuestions = (questions: Question[], answers: (AnswerValue | undefined)[]): ValidationResult[] => {
    // Clear previous errors
    validationErrors.value.clear();

    const toSubmit: Answer[] = [];
    const validationResults: ValidationResult[] = [];

    let allValid = true;
    questions.forEach((q, i) => {
      const a = answers[i];
      validationResults[i] = validateAnswer(q, a);
      if (!validationResults[i].isValid) {
        allValid = false;
        if (validationResults[i].error) {
          validationErrors.value.set(q.id, validationResults[i].error.message);
        }
        return;
      }
      if (a !== undefined) {
        toSubmit.push({ questionId: q.id, value: a });
      }
    });

    if (allValid) {
      engine.answerQuestions(state, toSubmit, false);
      wizard.next(state);
    }

    return validationResults;
  };

  /**
   * Go to the previous question
   */
  const goBack = (): boolean => {
    return wizard.previous(state);
  };

  /**
   * Skip the current question (only if not required)
   */
  const skipQuestion = (): boolean => {
    return wizard.next(state);
  };

  /**
   * Get all answers
   */
  const getAnswers = () => wizard.getAnswers(state);

  /**
   * Get answers as object
   */
  const getAnswersObject = () => wizard.getAnswersObject(state);

  /**
   * Reset the wizard. Can also be used to load answers from a previous session
   */
  const reset = (newAnswers?: Answer[]) => {
    engine.reset(state, newAnswers ?? answers);
  };

  /**
   * Complete the wizard (call this when user confirms final submission)
   */
  const complete = () => {
    return {
      answers: getAnswers(),
      answersObject: getAnswersObject(),
    };
  };

  /**
   * Get validation error for a specific question
   */
  const getValidationError = (questionId: string): string | undefined => {
    return validationErrors.value.get(questionId);
  };

  /**
   * Clear validation errors
   */
  const clearValidationErrors = (): void => {
    validationErrors.value.clear();
  };

  return {
    // State
    currentQuestions,
    currentAnswers,
    isComplete,
    validationErrors: computed(() => validationErrors.value),

    // Computed
    progress,
    canGoNext,
    canGoPrevious,

    // Methods
    answerQuestions,
    goBack,
    skipQuestion,
    getAnswers,
    getAnswersObject,
    reset,
    complete,
    getValidationError,
    clearValidationErrors,
  };
}
