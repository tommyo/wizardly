// wizard-engine.ts - Core logic for managing the wizard

import type {
  WizardConfig,
  Question,
  WizardState,
  ValidationResult,
  Answer,
  QuestionType,
  AnswerForQuestion,
  AnswerValue,
  Condition
} from './types';
import { validateAnswer } from './validators';

export class WizardEngine {
  protected config: WizardConfig;
  protected state: WizardState;

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

        // Only evaluate conditions if answer exists
        if (answer !== undefined) {
          for (const conditional of q.conditionalQuestions) {
            if (this.evaluateCondition(conditional.condition, answer)) {
              processQuestion(conditional.question);
            }
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
   * Evaluates a condition against an answer value.
   * Supports all condition operators with type-safe evaluation.
   */
  private evaluateCondition(condition: Condition, answer: AnswerValue): boolean {
    switch (condition.operator) {
      case 'equals':
        return answer === condition.value;

      case 'contains':
        if (Array.isArray(answer)) {
          return answer.includes(String(condition.value));
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
    return this.state.flattenedQuestions[this.state.currentQuestionIndex] ?? null;
  }

  /**
   * Get the current answer with type safety based on question type.
   * Returns undefined if no answer exists.
   *
   * @example
   * const question = engine.getCurrentQuestion();
   * if (question && question.type === 'number-range') {
   *   const answer = engine.getCurrentAnswer(question as Question<'number-range'>);
   *   if (answer) {
   *     console.log(answer.min, answer.max); // Type-safe!
   *   }
   * }
   */
  getCurrentAnswer<T extends QuestionType>(
    question: Question<T>
  ): AnswerForQuestion<T> | undefined {
    return this.state.answers.get(question.id) as AnswerForQuestion<T> | undefined;
  }


  /**
   * Answer the current question with type-safe validation.
   * Validates and stores the answer, then rebuilds the question list to handle conditionals.
   *
   * @example
   * const question = engine.getCurrentQuestion();
   * if (question && question.type === 'number') {
   *   const result = engine.answerCurrentQuestion(
   *     question as Question<'number'>,
   *     42
   *   );
   * }
   */
  answerCurrentQuestion<T extends QuestionType>(
    question: Question<T>,
    answer: AnswerForQuestion<T>
  ): ValidationResult {
    // Validate the answer
    const validationResult = validateAnswer(question, answer);
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
   * Get all answers as an array of Answer objects.
   * Each answer maintains its type-safe value.
   */
  getAnswers(): Answer[] {
    const answers: Answer[] = [];
    this.state.answers.forEach((value, questionId) => {
      answers.push({ questionId, value });
    });
    return answers;
  }

  /**
   * Get answers as a plain object mapping question IDs to their values.
   * Values maintain their runtime types (string, number, NumberRange, etc.)
   */
  getAnswersObject(): Record<string, AnswerValue> {
    const obj: Record<string, AnswerValue> = {};
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
