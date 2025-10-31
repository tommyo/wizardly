// wizard-engine.ts - Core logic for managing the wizard

import type {
  Question,
  WizardState,
  AnswerValue,
  Condition,
  Answer,
  ValidationResult,
} from './types';
import { validateAnswer } from './validators';

export class WizardEngine {
  private questions: Question[];

  constructor(questions: Question[]) {
    this.questions = questions;
  }

  initState(answers?: Answer[]): WizardState {
    return this.reset({}, answers);
  }

  /**
 * Reset the wizard state
 */
  reset(state: Partial<WizardState>, answers?: Answer[]): WizardState {
    state.currentQuestionIndex = 0;
    state.answers = new Map();
    state.flattenedQuestions = [];
    state.visitedQuestions = [];
    state.isComplete = false;

    if (answers) {
      const mapped = new Map(answers.map((a) => [a.questionId, a.value]));
      this.questions.forEach((q) => {
        if (mapped.has(q.id)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          state.answers?.set(q.id, mapped.get(q.id)!);
        }
      });
    }

    this.rebuildQuestionsList(state as WizardState);
    return state as WizardState;
  }

  /**
   * Rebuilds the flattened questions list based on current answers
   * This handles conditional questions dynamically
   */
  private rebuildQuestionsList(state: WizardState): void {
    const questions: (Question & { conditionalParent?: string })[] = [];

    const processQuestion = (q: Question, conditionalParent?: string) => {
      questions.push({ ...q, conditionalParent });

      // Check if this question has conditional follow-ups
      if (q.conditionalQuestions) {
        const answer = state.answers.get(q.id);

        // Only evaluate conditions if answer exists
        for (const conditional of q.conditionalQuestions) {
          if (answer !== undefined) {
            if (evaluateCondition(conditional.condition, answer)) {
              processQuestion(conditional.question, q.id);
            }
          } else if (q.type === 'boolean') {
            // unless it's an unanswered boolean then let the client address
            // so that they can be submitted together
            processQuestion(conditional.question, q.id);
          }
        }
      }
    };

    for (const question of this.questions) {
      processQuestion(question);
    }

    state.flattenedQuestions = questions;
  }

  addQuestions(state: WizardState, questions: Question[]) {
    this.questions = [...this.questions, ...questions];
    this.rebuildQuestionsList(state);
  }

  /**
 * Answer the current question with type-safe validation.
 * stores the answer, then rebuilds the question list to handle conditionals.
 * optionally validates too, useful for loading in stored answers.
 */
  answerQuestions(
    state: WizardState,
    answers: Answer[],
    validate = true,
  ): ValidationResult[] {
    const added: [string, AnswerValue][] = [];
    const validationResults: ValidationResult[] = [];

    // Validate each answer before storing
    answers.forEach((answer) => {
      const question = this.findQuestionById(answer.questionId);
      let isValid = !validate;
      if (question) {
        if (validate) {

          const result = validateAnswer(question, answer.value);
          validationResults.push(result);
          isValid = result.isValid;
        }

        // Only store valid answers
        if (isValid) {
          added.push([answer.questionId, answer.value]);
        }
      }
    });

    // Store the answers - create new Map from existing entries plus new ones
    const existingEntries = Array.from(state.answers.entries());
    state.answers = new Map([...existingEntries, ...added]);

    // Rebuild questions list (handles conditional logic)
    this.rebuildQuestionsList(state);

    return validationResults;
  }

  /**
   * Find a question by its ID in the original questions list
   */
  private findQuestionById(id: string): Question | undefined {
    const findInQuestions = (questions: Question[]): Question | undefined => {
      for (const q of questions) {
        if (q.id === id) return q;
        if (q.conditionalQuestions) {
          for (const cq of q.conditionalQuestions) {
            const found = findInQuestions([cq.question]);
            if (found) return found;
          }
        }
      }
      return undefined;
    };
    return findInQuestions(this.questions);
  }
}

/**
 * Evaluates a condition against an answer value.
 * Supports all condition operators with type-safe evaluation.
 */
function evaluateCondition(condition: Condition, answer: AnswerValue): boolean {
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

    case 'between': {
      const num = Number(answer);
      return num >= condition.value[0] && num <= condition.value[1];
    }

    default:
      return false;
  }
}
