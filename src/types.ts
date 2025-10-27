// types.ts - Type definitions for the wizard system

export type QuestionType =
  | 'multiple-choice'
  | 'boolean'
  | 'text'
  | 'number'
  | 'number-range'
  | 'date'
  | 'date-range';

export type ConditionOperator =
  | 'equals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan'
  | 'between';

export interface Option {
  value: string;
  label: string;
  image?: string;
}

export interface Validation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minDate?: string; // ISO format or 'today'
  maxDate?: string; // ISO format or 'today'
  customMessage?: string;
}

export interface NumberRange {
  min: number;
  max: number;
}

export interface DateRange {
  start: string; // ISO date string
  end: string;   // ISO date string
}

// ============================================================================
// Type-Safe Answer System (Conditional Types Approach)
// ============================================================================

/**
 * Maps each question type to its corresponding answer value type.
 * This provides compile-time type safety without runtime overhead.
 */
export type AnswerValueMap = {
  'text': string;
  'boolean': boolean;
  'number': number;
  'multiple-choice': string | string[];
  'number-range': NumberRange;
  'date': string;
  'date-range': DateRange;
};

/**
 * Extract the correct answer type for a given question type.
 * This is the core type that enables type-safe operations.
 */
export type AnswerForQuestion<T extends QuestionType> = AnswerValueMap[T];

/**
 * Union type of all possible answer values
 */
export type AnswerValue = AnswerValueMap[QuestionType];

// ============================================================================
// Type-Safe Condition System
// ============================================================================

/**
 * Operator-specific condition types for better type safety
 */
export type EqualsCondition<T = string | number | boolean> = {
  operator: 'equals';
  value: T;
};

export type ContainsCondition = {
  operator: 'contains';
  value: string | number;
};

export type ComparisonCondition = {
  operator: 'greaterThan' | 'lessThan';
  value: number;
};

export type BetweenCondition = {
  operator: 'between';
  value: [number, number];
};

/**
 * Union of all condition types - provides type safety for condition values
 */
export type Condition =
  | EqualsCondition
  | ContainsCondition
  | ComparisonCondition
  | BetweenCondition;

// ============================================================================
// Core Interfaces with Generic Support
// ============================================================================

/**
 * Generic Question interface with type parameter for type-safe operations.
 * The generic parameter defaults to QuestionType for flexibility.
 */
export interface Question<T extends QuestionType = QuestionType> {
  id: string;
  type: T;
  question: string;
  required?: boolean;
  helpText?: string;
  options?: T extends 'multiple-choice' ? Option[] : never;
  allowMultiple?: T extends 'multiple-choice' ? boolean : never;
  validation?: Validation;
  conditionalQuestions?: ConditionalQuestion<QuestionType>[];
}

/**
 * Generic ConditionalQuestion interface
 */
export interface ConditionalQuestion<T extends QuestionType = QuestionType> {
  condition: Condition;
  question: Question<T>;
}

/**
 * Generic Answer interface with type parameter.
 * Provides compile-time type safety for answer values.
 */
export interface Answer<T extends QuestionType = QuestionType> {
  questionId: string;
  value: AnswerForQuestion<T>;
}

export interface WizardConfig {
  wizardId: string;
  title: string;
  description?: string;
  questions: Question[];
}

/**
 * Internal wizard state with type-safe answer storage
 */
export interface WizardState {
  currentQuestionIndex: number;
  answers: Map<string, AnswerValue>;
  flattenedQuestions: Question[];
  visitedQuestions: string[];
  isComplete: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}
