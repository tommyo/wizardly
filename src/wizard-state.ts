import type {
  Answer,
  AnsweredQuestion,
  AnswerValue,
  ProgressReport,
  Question,
  WizardState,
} from './types';

export function findPrevIndex(state: WizardState) {
  if (state.currentQuestionIndex < 1) {
    return null;
  }
  let i = state.currentQuestionIndex;
  while (i > 0) {
    i--;
    if (!state.flattenedQuestions[i]?.conditionalParent) {
      return i;
    }
  }
  return null;
}

export function findNextIndex(state: WizardState) {
  const last = state.flattenedQuestions.length - 1;
  if (state.currentQuestionIndex >= last) {
    return null;
  }
  let i = state.currentQuestionIndex;
  while (i < last) {
    i++;
    if (!state.flattenedQuestions[i]?.conditionalParent) {
      return i;
    }
  }
  return null;
}

/**
 * Get the current question
 */
export function getQuestionSet(state: WizardState, startIndex = -1): Question[] {
  let i = startIndex === -1 ? state.currentQuestionIndex : startIndex;

  if (i >= state.flattenedQuestions.length) {
    return [];
  }

  const firstQuestion = state.flattenedQuestions[i];
  if (!firstQuestion) {
    return [];
  }

  const out: Question[] = [firstQuestion];
  i++; // Move to next question
  const parentIds: string[] = [firstQuestion.id];
  while (i < state.flattenedQuestions.length) {
    const next = state.flattenedQuestions[i];
    if (!next || !next.conditionalParent || !parentIds.includes(next.conditionalParent)) {
      break;
    }
    out.push(next);
    parentIds.push(next.id);
    i++;
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
): (AnswerValue | undefined)[] {
  return questions.map((q) => state.answers.get(q.id));
}

/**
 * Move to the next question
 */
export function next(state: WizardState): boolean {
  const newIndex = findNextIndex(state);
  if (newIndex === null) {
    // No more questions - mark as complete
    state.isComplete = true;
    state.currentQuestionIndex = state.flattenedQuestions.length;
    return false;
  }

  const isNow = state.flattenedQuestions[newIndex];
  if (isNow && !state.visitedQuestions.includes(isNow.id)) {
    state.visitedQuestions.push(isNow.id);
  }

  state.currentQuestionIndex = newIndex;
  return true;
}

/**
 * Move to the previous question
 */
export function back(state: WizardState): boolean {
  const newIndex = findPrevIndex(state);
  if (newIndex === null) {
    return false;
  }
  state.currentQuestionIndex = newIndex;
  return true;
}

/**
 * Check if we can go to the next question
 */
export function canGoNext(state: WizardState): boolean {
  const next = findNextIndex(state);
  return next !== null;
}

/**
 * Check if we can go to the previous question
 */
export function canGoBack(state: WizardState): boolean {
  const prev = findPrevIndex(state);
  return prev !== null;
}

/**
 * Get progress information
 */
export function getProgress(state: WizardState): ProgressReport {
  const total = state.flattenedQuestions.length;
  const current = Math.min(state.currentQuestionIndex + 1, total);
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return { current, total, percentage };
};

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

export function getAnsweredQuestions(state: WizardState): AnsweredQuestion[] {
  const res: AnsweredQuestion[] = [];
  const answers = getAnswersObject(state);
  state.flattenedQuestions.forEach((question) => {
    const answer = answers[question.id];
    if (answer !== undefined) {
      res.push({ question, answer });
    }
  });
  return res;
}
