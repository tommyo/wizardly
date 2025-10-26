// useWizard.ts - Vue 3 Composable for wizard management

import { ref, computed, watch } from 'vue';
import { WizardEngine } from '../wizard-engine';
import type { WizardConfig, Question, ValidationResult } from './types';

export function useWizard(config: WizardConfig) {
  // Create the wizard engine
  const engine = new WizardEngine(config);

  // Reactive state
  const currentQuestion = ref<Question | null>(engine.getCurrentQuestion());
  const currentAnswer = ref<any>(engine.getCurrentAnswer());
  const validationError = ref<string | null>(null);
  const isComplete = ref(false);

  // Computed properties
  const progress = computed(() => engine.getProgress());
  const canGoNext = computed(() => engine.canGoNext());
  const canGoPrevious = computed(() => engine.canGoPrevious());

  /**
   * Update the current question and answer from the engine
   */
  const updateCurrentState = () => {
    currentQuestion.value = engine.getCurrentQuestion();
    currentAnswer.value = engine.getCurrentAnswer();
    isComplete.value = engine.isComplete();
    validationError.value = null;
  };

  /**
   * Handle answer change (for reactive validation as user types)
   */
  const updateAnswer = (value: any) => {
    currentAnswer.value = value;

    // Clear validation error when user starts typing/changing
    if (validationError.value) {
      validationError.value = null;
    }
  };

  /**
   * Validate current answer without submitting
   */
  const validateCurrentAnswer = (): boolean => {
    if (!currentQuestion.value) return false;

    const result = engine.validateAnswer(currentQuestion.value, currentAnswer.value);
    validationError.value = result.errorMessage || null;
    return result.isValid;
  };

  /**
   * Submit the current answer and move to next question
   */
  const submitAnswer = (): boolean => {
    if (!currentQuestion.value) return false;

    const result = engine.answerCurrentQuestion(currentAnswer.value);

    if (!result.isValid) {
      validationError.value = result.errorMessage || 'Invalid answer';
      return false;
    }

    // Move to next question
    engine.next();
    updateCurrentState();
    return true;
  };

  /**
   * Go to the previous question
   */
  const goBack = (): boolean => {
    const success = engine.previous();
    if (success) {
      updateCurrentState();
    }
    return success;
  };

  /**
   * Skip the current question (only if not required)
   */
  const skipQuestion = (): boolean => {
    if (!currentQuestion.value || currentQuestion.value.required) {
      return false;
    }

    // Submit with null/undefined answer
    return submitAnswer();
  };

  /**
   * Get all answers
   */
  const getAnswers = () => engine.getAnswers();

  /**
   * Get answers as object
   */
  const getAnswersObject = () => engine.getAnswersObject();

  /**
   * Reset the wizard
   */
  const reset = () => {
    engine.reset();
    updateCurrentState();
  };

  /**
   * Complete the wizard (call this when user confirms final submission)
   */
  const complete = () => {
    return {
      answers: getAnswers(),
      answersObject: getAnswersObject()
    };
  };

  // Initialize
  updateCurrentState();

  return {
    // State
    currentQuestion,
    currentAnswer,
    validationError,
    isComplete,

    // Computed
    progress,
    canGoNext,
    canGoPrevious,

    // Methods
    updateAnswer,
    validateCurrentAnswer,
    submitAnswer,
    goBack,
    skipQuestion,
    getAnswers,
    getAnswersObject,
    reset,
    complete
  };
}
