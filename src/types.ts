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

export interface Condition {
  operator: ConditionOperator;
  value: any;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  required?: boolean;
  helpText?: string;
  options?: Option[];
  allowMultiple?: boolean;
  validation?: Validation;
  conditionalQuestions?: ConditionalQuestion[];
}

export interface ConditionalQuestion {
  condition: Condition;
  question: Question;
}

export interface WizardConfig {
  wizardId: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface Answer {
  questionId: string;
  value: any; // string, boolean, number, string[], { min: number, max: number }, { start: string, end: string }
}

export interface WizardState {
  currentQuestionIndex: number;
  answers: Map<string, any>;
  flattenedQuestions: Question[];
  visitedQuestions: string[];
  isComplete: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface NumberRange {
  min: number;
  max: number;
}

export interface DateRange {
  start: string; // ISO date string
  end: string;   // ISO date string
}
