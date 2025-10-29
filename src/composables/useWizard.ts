// useWizard.ts - Vue 3 Composable for wizard management

import { computed, reactive } from 'vue';
import { WizardEngine } from '../wizard-engine';
import * as wizard from '../wizard-state';
import type { QuestionType, WizardConfig, Answer } from '../types';
export function useWizard(config: WizardConfig) {

  const engine = new WizardEngine(config);

  // Create the wizard state
  const state = reactive(engine.initState());

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
    return wizard.canGoNext(state);
  });
  const canGoPrevious = computed(() => {
    return wizard.canGoPrevious(state);
  });

  /**
   * Submit the current answer and move to next question.
   */
  const answerQuestions = (answer: Answer<QuestionType>[]): void => {
    // Type assertion is safe here because currentAnswer is set based on question type
    engine.answerQuestions(state, answer);
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
   * Reset the wizard
   */
  const reset = () => {
    engine.reset(config, state);
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

  return {
    // State
    currentQuestions,
    currentAnswers,
    isComplete,

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
  };
}
