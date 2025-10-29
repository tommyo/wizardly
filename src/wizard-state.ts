import type {
  Answer,
  AnswerForQuestion,
  AnswerValue,
  ProgressReport,
  Question,
  QuestionType,
  WizardState,
} from "./types";

/**
 * Get the current question
 */
export function getQuestionSet(state: WizardState, i = -1): Question[] {
  if (i === -1) {
    i = state.currentQuestionIndex;
  }
  if (i >= state.flattenedQuestions.length) {
    return [];
  }
  const out = [state.flattenedQuestions[i]!];

  while (true) {
    const next = state.flattenedQuestions[i];
    if (!next || next.conditionalParent !== out[0]!.id) {
      break;
    }
    out.push(next);
  }
  return out;
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
export function getCurrentAnswers(
  state: WizardState,
  questions: Question[],
): (AnswerForQuestion<QuestionType> | undefined)[] {
  return questions.map((q) => state.answers.get(q.id) as AnswerForQuestion<QuestionType> | undefined);
}

/**
 * Move to the next question
 */
export function next(state: WizardState): boolean {
  if (canGoNext(state)) {
    state.currentQuestionIndex++;

    // Check if wizard is complete
    if (state.currentQuestionIndex >= state.flattenedQuestions.length) {
      state.isComplete = true;
    }

    const isNow = state.flattenedQuestions[state.currentQuestionIndex];
    if (isNow && !state.visitedQuestions.includes(isNow.id)) {
      state.visitedQuestions.push(isNow.id);
    }

    return true;
  }
  return false;
}

/**
 * Move to the previous question
 */
export function previous(state: WizardState): boolean {
  if (canGoPrevious(state)) {
    state.currentQuestionIndex--;
    return true;
  }
  return false;
}

/**
 * Check if we can go to the next question
 */
export function canGoNext(state: WizardState): boolean {
  return state.currentQuestionIndex < state.flattenedQuestions.length;
}

/**
 * Check if we can go to the previous question
 */
export function canGoPrevious(state: WizardState): boolean {
  return state.currentQuestionIndex > 0;
}

/**
 * Get progress information
 */
export function getProgress(state: WizardState): ProgressReport {
  const total = state.flattenedQuestions.length;
  const current = Math.min(state.currentQuestionIndex + 1, total);
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return { current, total, percentage };
}

/**
 * Get all answers as an array of Answer objects.
 * Each answer maintains its type-safe value.
 */
export function getAnswers(state: WizardState): Answer[] {
  const answers: Answer[] = [];
  state.answers.forEach((value, questionId) => {
    answers.push({ questionId, value });
  });
  return answers;
}

/**
 * Get answers as a plain object mapping question IDs to their values.
 * Values maintain their runtime types (string, number, NumberRange, etc.)
 */
export function getAnswersObject(state: WizardState): Record<string, AnswerValue> {
  const obj: Record<string, AnswerValue> = {};
  state.answers.forEach((value, questionId) => {
    obj[questionId] = value;
  });
  return obj;
}
