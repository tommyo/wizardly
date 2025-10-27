// useWizard.ts - Vue 3 Composable for wizard management

import { ref, computed } from 'vue';
import { WizardEngine } from '../wizard-engine';
import type { WizardConfig, Question, QuestionType, AnswerForQuestion, AnswerValue } from '../types';
import { validateAnswer } from '@/validators';

export function useWizard(config: WizardConfig) {
  // Create the wizard engine
  const engine = new WizardEngine(config);

  // Reactive state
  const currentQuestion = ref<Question | null>(null);
  const currentAnswer = ref<AnswerValue | undefined>();
  const validationError = ref<string | null>(null);
  const isComplete = ref(false);

  // Computed properties
  /**
   * Update the current question and answer from the engine
   */
  const updateCurrentState = () => {
    currentQuestion.value = engine.getCurrentQuestion();
    currentAnswer.value = currentQuestion.value
      ? engine.getCurrentAnswer(currentQuestion.value)
      : undefined;
    validationError.value = null;
    isComplete.value = engine.isComplete();
  };
  updateCurrentState();

  const progress = computed(() => {
    const _ = currentQuestion.value;
    return engine.getProgress();
  });
  const canGoNext = computed(() => {
    const _ = currentQuestion.value;
    return engine.canGoNext();
  });
  const canGoPrevious = computed(() => {
    const _ = currentQuestion.value;
    return engine.canGoPrevious();
  });

  /**
   * Update the current answer value.
   * Clears validation errors when the user starts typing/changing.
   *
   * @example
   * const question = currentQuestion.value;
   * if (question && question.type === 'number-range') {
   *   updateAnswer({ min: 10, max: 20 });
   * }
   */
  const updateAnswer = <T extends QuestionType>(
    value: AnswerForQuestion<T>
  ) => {
    currentAnswer.value = value;

    // Clear validation error when user starts typing/changing
    if (validationError.value) {
      validationError.value = null;
    }
  };

  /**
   * Validate current answer without submitting.
   * Uses type assertion based on the current question type.
   */
  const validateCurrentAnswer = (): boolean => {
    if (!currentQuestion.value || currentAnswer.value === undefined) return false;

    // Type assertion is safe here because currentAnswer is set based on question type
    const result = validateAnswer(
      currentQuestion.value,
      currentAnswer.value as AnswerForQuestion<QuestionType>,
    );
    validationError.value = result.errorMessage || null;
    return result.isValid;
  };

  /**
   * Submit the current answer and move to next question.
   * Uses type assertion based on the current question type.
   */
  const submitAnswer = (): boolean => {
    if (!currentQuestion.value || currentAnswer.value === undefined) return false;

    // Type assertion is safe here because currentAnswer is set based on question type
    const result = engine.answerCurrentQuestion(
      currentQuestion.value,
      currentAnswer.value as AnswerForQuestion<QuestionType>
    );

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
      answersObject: getAnswersObject(),
    };
  };

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
    complete,
  };
}
