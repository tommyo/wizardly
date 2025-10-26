// wizard-engine.ts - Core logic for managing the wizard

import type {
  WizardConfig,
  Question,
  ConditionalQuestion,
  WizardState,
  ValidationResult,
  Answer,
  NumberRange,
  DateRange,
  Validation
} from './types';

export class WizardEngine {
  private config: WizardConfig;
  private state: WizardState;

  constructor(config: WizardConfig) {
    this.config = config;
    this.state = {
      currentQuestionIndex: 0,
      answers: new Map(),
      flattenedQuestions: [],
      visitedQuestions: [],
      isComplete: false
    };
    
    this.rebuildQuestionsList();
  }

  /**
   * Rebuilds the flattened questions list based on current answers
   * This handles conditional questions dynamically
   */
  private rebuildQuestionsList(): void {
    const questions: Question[] = [];
    
    const processQuestion = (q: Question) => {
      questions.push(q);
      
      // Check if this question has conditional follow-ups
      if (q.conditionalQuestions && this.state.answers.has(q.id)) {
        const answer = this.state.answers.get(q.id);
        
        for (const conditional of q.conditionalQuestions) {
          if (this.evaluateCondition(conditional.condition, answer)) {
            processQuestion(conditional.question);
          }
        }
      }
    };
    
    for (const question of this.config.questions) {
      processQuestion(question);
    }
    
    this.state.flattenedQuestions = questions;
  }

  /**
   * Evaluates a condition against an answer
   */
  private evaluateCondition(condition: any, answer: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return answer === condition.value;
      
      case 'contains':
        if (Array.isArray(answer)) {
          return answer.includes(condition.value);
        }
        return answer === condition.value;
      
      case 'greaterThan':
        return Number(answer) > Number(condition.value);
      
      case 'lessThan':
        return Number(answer) < Number(condition.value);
      
      case 'between':
        const num = Number(answer);
        return num >= condition.value[0] && num <= condition.value[1];
      
      default:
        return false;
    }
  }

  /**
   * Get the current question
   */
  getCurrentQuestion(): Question | null {
    if (this.state.currentQuestionIndex >= this.state.flattenedQuestions.length) {
      return null;
    }
    return this.state.flattenedQuestions[this.state.currentQuestionIndex];
  }

  /**
   * Get the current answer for the current question (if it exists)
   */
  getCurrentAnswer(): any {
    const question = this.getCurrentQuestion();
    if (!question) return null;
    return this.state.answers.get(question.id);
  }

  /**
   * Validate an answer for a given question
   */
  validateAnswer(question: Question, answer: any): ValidationResult {
    // Check if required
    if (question.required && (answer === null || answer === undefined || answer === '')) {
      return {
        isValid: false,
        errorMessage: 'This question is required'
      };
    }

    // If not required and empty, it's valid
    if (!question.required && (answer === null || answer === undefined || answer === '')) {
      return { isValid: true };
    }

    // Type-specific validation
    const validation = question.validation;
    if (!validation) {
      return { isValid: true };
    }

    switch (question.type) {
      case 'text':
        return this.validateText(answer, validation);
      
      case 'number':
        return this.validateNumber(answer, validation);
      
      case 'number-range':
        return this.validateNumberRange(answer, validation);
      
      case 'date':
        return this.validateDate(answer, validation);
      
      case 'date-range':
        return this.validateDateRange(answer, validation);
      
      default:
        return { isValid: true };
    }
  }

  private validateText(value: string, validation: Validation): ValidationResult {
    if (validation.minLength && value.length < validation.minLength) {
      return {
        isValid: false,
        errorMessage: validation.customMessage || `Minimum length is ${validation.minLength} characters`
      };
    }

    if (validation.maxLength && value.length > validation.maxLength) {
      return {
        isValid: false,
        errorMessage: validation.customMessage || `Maximum length is ${validation.maxLength} characters`
      };
    }

    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return {
          isValid: false,
          errorMessage: validation.customMessage || 'Invalid format'
        };
      }
    }

    return { isValid: true };
  }

  private validateNumber(value: number, validation: Validation): ValidationResult {
    if (validation.min !== undefined && value < validation.min) {
      return {
        isValid: false,
        errorMessage: validation.customMessage || `Minimum value is ${validation.min}`
      };
    }

    if (validation.max !== undefined && value > validation.max) {
      return {
        isValid: false,
        errorMessage: validation.customMessage || `Maximum value is ${validation.max}`
      };
    }

    return { isValid: true };
  }

  private validateNumberRange(value: NumberRange, validation: Validation): ValidationResult {
    if (!value.min || !value.max) {
      return {
        isValid: false,
        errorMessage: 'Both minimum and maximum values are required'
      };
    }

    if (value.min > value.max) {
      return {
        isValid: false,
        errorMessage: 'Minimum value cannot be greater than maximum value'
      };
    }

    if (validation.min !== undefined && (value.min < validation.min || value.max < validation.min)) {
      return {
        isValid: false,
        errorMessage: validation.customMessage || `Values must be at least ${validation.min}`
      };
    }

    if (validation.max !== undefined && (value.min > validation.max || value.max > validation.max)) {
      return {
        isValid: false,
        errorMessage: validation.customMessage || `Values must be at most ${validation.max}`
      };
    }

    return { isValid: true };
  }

  private validateDate(value: string, validation: Validation): ValidationResult {
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        errorMessage: 'Invalid date'
      };
    }

    if (validation.minDate) {
      const minDate = validation.minDate === 'today' ? new Date() : new Date(validation.minDate);
      minDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      if (checkDate < minDate) {
        return {
          isValid: false,
          errorMessage: validation.customMessage || `Date must be ${validation.minDate === 'today' ? 'today or later' : 'after ' + validation.minDate}`
        };
      }
    }

    if (validation.maxDate) {
      const maxDate = validation.maxDate === 'today' ? new Date() : new Date(validation.maxDate);
      maxDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      if (checkDate > maxDate) {
        return {
          isValid: false,
          errorMessage: validation.customMessage || `Date must be ${validation.maxDate === 'today' ? 'today or earlier' : 'before ' + validation.maxDate}`
        };
      }
    }

    return { isValid: true };
  }

  private validateDateRange(value: DateRange, validation: Validation): ValidationResult {
    if (!value.start || !value.end) {
      return {
        isValid: false,
        errorMessage: 'Both start and end dates are required'
      };
    }

    const startDate = new Date(value.start);
    const endDate = new Date(value.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        isValid: false,
        errorMessage: 'Invalid date format'
      };
    }

    if (startDate > endDate) {
      return {
        isValid: false,
        errorMessage: 'Start date cannot be after end date'
      };
    }

    // Validate start date
    const startValidation = this.validateDate(value.start, validation);
    if (!startValidation.isValid) {
      return {
        isValid: false,
        errorMessage: `Start date: ${startValidation.errorMessage}`
      };
    }

    // Validate end date
    const endValidation = this.validateDate(value.end, validation);
    if (!endValidation.isValid) {
      return {
        isValid: false,
        errorMessage: `End date: ${endValidation.errorMessage}`
      };
    }

    return { isValid: true };
  }

  /**
   * Answer the current question and move forward
   */
  answerCurrentQuestion(answer: any): ValidationResult {
    const question = this.getCurrentQuestion();
    if (!question) {
      return {
        isValid: false,
        errorMessage: 'No current question'
      };
    }

    // Validate the answer
    const validationResult = this.validateAnswer(question, answer);
    if (!validationResult.isValid) {
      return validationResult;
    }

    // Store the answer
    this.state.answers.set(question.id, answer);
    
    // Track visited questions
    if (!this.state.visitedQuestions.includes(question.id)) {
      this.state.visitedQuestions.push(question.id);
    }

    // Rebuild questions list (handles conditional logic)
    this.rebuildQuestionsList();

    return { isValid: true };
  }

  /**
   * Move to the next question
   */
  next(): boolean {
    if (this.canGoNext()) {
      this.state.currentQuestionIndex++;
      
      // Check if wizard is complete
      if (this.state.currentQuestionIndex >= this.state.flattenedQuestions.length) {
        this.state.isComplete = true;
      }
      
      return true;
    }
    return false;
  }

  /**
   * Move to the previous question
   */
  previous(): boolean {
    if (this.canGoPrevious()) {
      this.state.currentQuestionIndex--;
      return true;
    }
    return false;
  }

  /**
   * Check if we can go to the next question
   */
  canGoNext(): boolean {
    return this.state.currentQuestionIndex < this.state.flattenedQuestions.length;
  }

  /**
   * Check if we can go to the previous question
   */
  canGoPrevious(): boolean {
    return this.state.currentQuestionIndex > 0;
  }

  /**
   * Get progress information
   */
  getProgress(): { current: number; total: number; percentage: number } {
    const total = this.state.flattenedQuestions.length;
    const current = Math.min(this.state.currentQuestionIndex + 1, total);
    const percentage = total > 0 ? (current / total) * 100 : 0;
    
    return { current, total, percentage };
  }

  /**
   * Check if the wizard is complete
   */
  isComplete(): boolean {
    return this.state.isComplete;
  }

  /**
   * Get all answers
   */
  getAnswers(): Answer[] {
    const answers: Answer[] = [];
    this.state.answers.forEach((value, questionId) => {
      answers.push({ questionId, value });
    });
    return answers;
  }

  /**
   * Get answers as a plain object
   */
  getAnswersObject(): Record<string, any> {
    const obj: Record<string, any> = {};
    this.state.answers.forEach((value, questionId) => {
      obj[questionId] = value;
    });
    return obj;
  }

  /**
   * Reset the wizard
   */
  reset(): void {
    this.state = {
      currentQuestionIndex: 0,
      answers: new Map(),
      flattenedQuestions: [],
      visitedQuestions: [],
      isComplete: false
    };
    this.rebuildQuestionsList();
  }

  /**
   * Get the current state (useful for debugging or persistence)
   */
  getState(): WizardState {
    return { ...this.state };
  }
}
