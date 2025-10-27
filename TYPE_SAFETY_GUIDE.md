# Type Safety Guide

This guide explains how to use the new type-safe APIs introduced in the wizard system refactoring.

## Overview

The wizard system now provides **two sets of APIs**:

1. **Legacy APIs** - Original methods with `any` types (deprecated but functional)
2. **Type-Safe APIs** - New methods with full TypeScript type safety

This approach ensures **zero breaking changes** while providing a gradual migration path to better type safety.

## Key Improvements

### Before (Legacy API)
```typescript
const answer = engine.getCurrentAnswer(); // Returns: any
engine.answerCurrentQuestion(answer); // Accepts: any
```

### After (Type-Safe API)
```typescript
const question = engine.getCurrentQuestion();
if (question && question.type === 'number-range') {
  const typedQuestion = question as Question<'number-range'>;
  const answer = engine.getCurrentAnswerTyped(typedQuestion);
  // answer is typed as: NumberRange | undefined
  
  if (answer) {
    console.log(answer.min, answer.max); // ✅ Type-safe!
  }
}
```

## Type Infrastructure

### AnswerValueMap

Maps each question type to its corresponding answer type:

```typescript
type AnswerValueMap = {
  'text': string;
  'boolean': boolean;
  'number': number;
  'multiple-choice': string | string[];
  'number-range': NumberRange;
  'date': string;
  'date-range': DateRange;
};
```

### AnswerForQuestion<T>

Extracts the correct answer type for a given question type:

```typescript
type TextAnswer = AnswerForQuestion<'text'>; // string
type RangeAnswer = AnswerForQuestion<'number-range'>; // NumberRange
```

### Generic Interfaces

Interfaces now support generic type parameters:

```typescript
interface Question<T extends QuestionType = QuestionType> {
  id: string;
  type: T;
  // ... other properties
}

interface Answer<T extends QuestionType = QuestionType> {
  questionId: string;
  value: AnswerForQuestion<T>;
}
```

## WizardEngine Type-Safe Methods

### getCurrentAnswerTyped<T>()

Get the current answer with proper typing:

```typescript
const question = engine.getCurrentQuestion();

if (question && question.type === 'number') {
  const typedQuestion = question as Question<'number'>;
  const answer = engine.getCurrentAnswerTyped(typedQuestion);
  // answer: number | undefined
  
  if (answer !== undefined) {
    const doubled = answer * 2; // ✅ Type-safe math!
  }
}
```

### validateAnswerTyped<T>()

Validate answers with type safety:

```typescript
const question: Question<'text'> = {
  id: 'name',
  type: 'text',
  question: 'What is your name?',
  validation: { minLength: 2 }
};

const answer: string = 'John';
const result = engine.validateAnswerTyped(question, answer);
// ✅ TypeScript ensures answer is a string
```

### answerCurrentQuestionTyped<T>()

Submit answers with type checking:

```typescript
const question = engine.getCurrentQuestion();

if (question && question.type === 'boolean') {
  const typedQuestion = question as Question<'boolean'>;
  const result = engine.answerCurrentQuestionTyped(typedQuestion, true);
  // ✅ TypeScript ensures answer is a boolean
}
```

### evaluateConditionTyped<T>()

Evaluate conditions with type safety:

```typescript
const condition: TypedCondition = {
  operator: 'greaterThan',
  value: 10
};

const answer = 15;
const result = engine.evaluateConditionTyped(condition, answer);
// ✅ Type-safe condition evaluation
```

## useWizard Composable Type-Safe Methods

### updateAnswerTyped<T>()

Update answers with type checking:

```typescript
const { currentQuestion, updateAnswerTyped } = useWizard(config);

if (currentQuestion.value && currentQuestion.value.type === 'number-range') {
  const typedQuestion = currentQuestion.value as Question<'number-range'>;
  updateAnswerTyped(typedQuestion, { min: 10, max: 20 });
  // ✅ TypeScript ensures correct structure
}
```

### getCurrentAnswerTyped<T>()

Get current answer with proper typing:

```typescript
const { currentQuestion, getCurrentAnswerTyped } = useWizard(config);

if (currentQuestion.value && currentQuestion.value.type === 'date-range') {
  const typedQuestion = currentQuestion.value as Question<'date-range'>;
  const answer = getCurrentAnswerTyped(typedQuestion);
  // answer: DateRange | undefined
  
  if (answer) {
    console.log(answer.start, answer.end); // ✅ Type-safe!
  }
}
```

### submitAnswerTyped<T>()

Submit answers with type safety:

```typescript
const { currentQuestion, submitAnswerTyped } = useWizard(config);

if (currentQuestion.value && currentQuestion.value.type === 'multiple-choice') {
  const typedQuestion = currentQuestion.value as Question<'multiple-choice'>;
  const success = submitAnswerTyped(typedQuestion, ['option1', 'option2']);
  // ✅ TypeScript ensures correct answer format
}
```

## Type Guards

Runtime type validation functions are available in `src/type-guards.ts`:

```typescript
import { isNumberRangeAnswer, isDateAnswer, createAnswerTypeGuard } from './type-guards';

// Direct type guards
if (isNumberRangeAnswer(value)) {
  console.log(value.min, value.max); // ✅ Type narrowed to NumberRange
}

// Generic type guard factory
const guard = createAnswerTypeGuard('date');
if (guard(value)) {
  const date = new Date(value); // ✅ Type narrowed to string
}

// Validation with error messages
import { validateAnswerType } from './type-guards';

const result = validateAnswerType('number', '123');
if (!result.isValid) {
  console.error(result.errorMessage);
}
```

## Typed Conditions

The condition system now has type-safe variants:

```typescript
// Equals condition
const equalsCondition: EqualsCondition<number> = {
  operator: 'equals',
  value: 42
};

// Comparison condition
const comparisonCondition: ComparisonCondition = {
  operator: 'greaterThan',
  value: 10
};

// Between condition
const betweenCondition: BetweenCondition = {
  operator: 'between',
  value: [10, 20]
};

// Union type for all conditions
const condition: TypedCondition = equalsCondition;
```

## Migration Strategy

### Step 1: Identify Usage

Find all places using legacy APIs:
- `getCurrentAnswer()`
- `validateAnswer()`
- `answerCurrentQuestion()`
- `updateAnswer()`

### Step 2: Add Type Assertions

When you know the question type, add type assertions:

```typescript
// Before
const answer = engine.getCurrentAnswer();

// After
const question = engine.getCurrentQuestion();
if (question && question.type === 'number') {
  const typedQuestion = question as Question<'number'>;
  const answer = engine.getCurrentAnswerTyped(typedQuestion);
}
```

### Step 3: Use Type Guards

For runtime validation:

```typescript
import { isNumberAnswer } from './type-guards';

const answer = engine.getCurrentAnswer();
if (isNumberAnswer(answer)) {
  // answer is now typed as number
  const doubled = answer * 2;
}
```

### Step 4: Gradual Migration

Migrate code incrementally:
1. Start with new features
2. Update critical paths
3. Gradually migrate existing code
4. Eventually remove deprecated methods (major version bump)

## Benefits

### 1. Compile-Time Safety
```typescript
// ❌ This won't compile:
const question: Question<'number'> = { type: 'number', ... };
engine.answerCurrentQuestionTyped(question, "not a number");
// Error: Argument of type 'string' is not assignable to parameter of type 'number'
```

### 2. Better IDE Support
- Autocomplete knows exact types
- Refactoring is safer
- Documentation appears inline

### 3. Self-Documenting Code
```typescript
// The type signature tells you exactly what's expected:
function processAnswer<T extends QuestionType>(
  question: Question<T>,
  answer: AnswerForQuestion<T>
): void {
  // Clear contract: answer must match question type
}
```

### 4. Reduced Runtime Errors
```typescript
// Type guards catch errors early:
if (!isNumberRangeAnswer(value)) {
  throw new Error('Invalid answer format');
}
// Now safe to use value.min and value.max
```

## Best Practices

### 1. Use Type Assertions Carefully
```typescript
// ✅ Good: Check type first
if (question.type === 'number') {
  const typedQuestion = question as Question<'number'>;
  // Safe to use typed methods
}

// ❌ Bad: Blind assertion
const typedQuestion = question as Question<'number'>; // Might be wrong!
```

### 2. Combine with Type Guards
```typescript
const answer = engine.getCurrentAnswer();

// ✅ Good: Runtime validation + type narrowing
if (isNumberRangeAnswer(answer)) {
  // TypeScript knows answer is NumberRange
  console.log(answer.min, answer.max);
}
```

### 3. Leverage Generic Functions
```typescript
// ✅ Good: Generic function handles all types
function processQuestion<T extends QuestionType>(
  question: Question<T>,
  answer: AnswerForQuestion<T>
): void {
  // Type-safe for any question type
}
```

### 4. Document Type Expectations
```typescript
/**
 * Processes a number range answer
 * @param question - Must be a 'number-range' question
 * @param answer - Must be a NumberRange object
 */
function processRange(
  question: Question<'number-range'>,
  answer: NumberRange
): void {
  // Clear expectations in documentation
}
```

## Examples

### Complete Example: Type-Safe Form Handler

```typescript
import { WizardEngine } from './wizard-engine';
import type { Question, QuestionType, AnswerForQuestion } from './types';
import { createAnswerTypeGuard } from './type-guards';

function handleQuestionAnswer<T extends QuestionType>(
  engine: WizardEngine,
  question: Question<T>,
  rawAnswer: unknown
): boolean {
  // Runtime validation
  const guard = createAnswerTypeGuard(question.type);
  if (!guard(rawAnswer)) {
    console.error('Invalid answer type');
    return false;
  }

  // Now type-safe!
  const answer = rawAnswer as AnswerForQuestion<T>;
  
  // Validate
  const validation = engine.validateAnswerTyped(question, answer);
  if (!validation.isValid) {
    console.error(validation.errorMessage);
    return false;
  }

  // Submit
  const result = engine.answerCurrentQuestionTyped(question, answer);
  return result.isValid;
}
```

## Troubleshooting

### Issue: "Type 'any' is not assignable to..."

**Solution:** You're mixing legacy and type-safe APIs. Use type-safe methods consistently:

```typescript
// ❌ Problem
const answer = engine.getCurrentAnswer(); // Returns any
engine.answerCurrentQuestionTyped(question, answer); // Type error!

// ✅ Solution
const answer = engine.getCurrentAnswerTyped(question);
if (answer !== undefined) {
  engine.answerCurrentQuestionTyped(question, answer);
}
```

### Issue: "Property does not exist on type..."

**Solution:** Use type guards or assertions:

```typescript
// ❌ Problem
const answer = engine.getCurrentAnswer();
console.log(answer.min); // Error: Property 'min' does not exist

// ✅ Solution
if (isNumberRangeAnswer(answer)) {
  console.log(answer.min); // ✅ Type narrowed
}
```

## Conclusion

The type-safe refactoring provides:
- ✅ **Zero breaking changes** - Legacy code continues to work
- ✅ **Gradual migration** - Adopt at your own pace
- ✅ **Better type safety** - Catch errors at compile time
- ✅ **Improved DX** - Better IDE support and documentation
- ✅ **Zero runtime overhead** - Pure compile-time feature

Start using type-safe methods in new code, and gradually migrate existing code over time!