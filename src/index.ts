// Main entry point for the Wizarding library

// Core types
export type {
  QuestionType,
  ConditionOperator,
  Option,
  Validation,
  NumberRange,
  DateRange,
  AnswerValueMap,
  AnswerValue,
  EqualsCondition,
  ContainsCondition,
  ComparisonCondition,
  BetweenCondition,
  Condition,
  Question,
  ConditionalQuestion,
  Answer,
  WizardConfig,
  WizardState,
  ValidationResult,
  ProgressReport,
} from './types';

// Core engine
export { WizardEngine } from './wizard-engine';

// State management utilities
export {
  getQuestionSet,
  getCurrentAnswers,
  getProgress,
  canGoNext,
  canGoPrevious,
  next,
  previous,
  getAnswers,
  getAnswersObject,
} from './wizard-state';

// Validators
export { validateAnswer } from './validators';

// Type guards
export {
  isTextAnswer,
  isNumberAnswer,
  isBooleanAnswer,
  isMultipleChoiceAnswer,
  isNumberRangeAnswer,
  isDateAnswer,
  isDateRangeAnswer,
  createAnswerTypeGuard,
  validateAnswerType,
} from './type-guards';

// Vue composables
export { useWizard } from './composables/useWizard';
export { default as createWizardStore } from './composables/useWizardStore';

// Vue components
export { default as WizardComponent } from './components/WizardComponent.vue';
