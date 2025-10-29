// wizard-engine.ts - Core logic for managing the wizard

import type {
  WizardConfig,
  Question,
  WizardState,
  QuestionType,
  AnswerForQuestion,
  AnswerValue,
  Condition,
  Answer,
} from './types';

// export interface WizardConfig {
//   wizardId: string;
//   title: string;
//   description?: string;
//   questions: Question[];
// }

export class WizardEngine {
  config: WizardConfig;

  constructor(config: WizardConfig) {
    this.config = config;
  }

  initState(): WizardState {
    const state: WizardState = {
      currentQuestionIndex: 0,
      answers: new Map(),
      flattenedQuestions: [],
      // these two aren't affected by the engine, but they should be?
      visitedQuestions: [],
      isComplete: false,
    };

    this.rebuildQuestionsList(state);
    return state;
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
      if (q.conditionalQuestions && state.answers.has(q.id)) {
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

    for (const question of this.config.questions) {
      processQuestion(question);
    }

    state.flattenedQuestions = questions;
  }

  addQuestions(state: WizardState, questions: Question[]) {
    this.config.questions = [...this.config.questions, ...questions];
    this.rebuildQuestionsList(state);
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
  answerQuestions(
    state: WizardState,
    answers: Answer<QuestionType>[],
  ): void {
    const added: [string, AnswerForQuestion<QuestionType>][] = [];

    answers.forEach((v: Answer<QuestionType>) => {
      added.push([v.questionId, v.value]);
    });
    // // Track visited questions
    // if (!state.visitedQuestions.includes(question.id)) {
    //   state.visitedQuestions.push(question.id);
    // }
    // Store the answer
    state.answers = new Map([
      ...state.answers,
      ...added,
    ]);

    // Rebuild questions list (handles conditional logic)
    this.rebuildQuestionsList(state);
  }

  /**
 * Reset the wizard
 */
  reset(config: WizardConfig, state: WizardState): void {
    state.currentQuestionIndex = 0;
    state.answers = new Map();
    state.flattenedQuestions = [];
    state.visitedQuestions = [];
    state.isComplete = false;
    this.rebuildQuestionsList(state);
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

    case 'between':
      const num = Number(answer);
      return num >= condition.value[0] && num <= condition.value[1];

    default:
      return false;
  }
}
