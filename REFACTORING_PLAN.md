# Type Safety Refactoring Plan for Wizard System

## Executive Summary
The wizard system currently uses `any` types in several critical areas, particularly around answer values, condition evaluation, and state management. This document presents two approaches for eliminating `any` usage: a **Discriminated Union approach** (original proposal) and a **Conditional Types approach** (recommended). After analysis, the **Conditional Types approach is strongly recommended** as it provides superior type safety with zero breaking changes.

## ⚠️ Critical Analysis

**Status:** The original discriminated union approach has significant issues and is **NOT RECOMMENDED** for implementation. See [Approach Comparison](#approach-comparison) below for details.

## Current `any` Usage Analysis

### 1. **Answer Values** (Primary Issue)
- **Location**: [`src/types.ts:66`](src/types.ts:66) - `Answer.value: any`
- **Location**: [`src/types.ts:71`](src/types.ts:71) - `WizardState.answers: Map<string, any>`
- **Location**: [`src/wizard-engine.ts:103`](src/wizard-engine.ts:103) - `getCurrentAnswer(): any`
- **Location**: [`src/wizard-engine.ts:112`](src/wizard-engine.ts:112) - `validateAnswer(question, answer: any)`
- **Location**: [`src/wizard-engine.ts:321`](src/wizard-engine.ts:321) - `answerCurrentQuestion(answer: any)`
- **Location**: [`src/composables/useWizard.ts:13`](src/composables/useWizard.ts:13) - `currentAnswer: ref<any>`
- **Location**: [`src/composables/useWizard.ts:35`](src/composables/useWizard.ts:35) - `updateAnswer(value: any)`
- **Location**: [`src/components/WizardComponent.vue:14`](src/components/WizardComponent.vue:14) - `complete: [answers: Record<string, any>]`

**Problem**: Different question types produce different answer shapes:
- `text` → `string`
- `boolean` → `boolean`
- `number` → `number`
- `multiple-choice` → `string` or `string[]`
- `number-range` → `{ min: number; max: number }`
- `date` → `string` (ISO date)
- `date-range` → `{ start: string; end: string }`

### 2. **Condition Evaluation**
- **Location**: [`src/types.ts:37`](src/types.ts:37) - `Condition.value: any`
- **Location**: [`src/wizard-engine.ts:64`](src/wizard-engine.ts:64) - `evaluateCondition(condition: any, answer: any)`

**Problem**: Condition values vary by operator type:
- `equals` → any value type
- `contains` → string or number
- `greaterThan`/`lessThan` → number
- `between` → `[number, number]`

### 3. **Return Types**
- **Location**: [`src/wizard-engine.ts:424`](src/wizard-engine.ts:424) - `getAnswersObject(): Record<string, any>`
- **Location**: [`src/components/WizardComponent.vue:70`](src/components/WizardComponent.vue:70) - `emit('complete', result.answersObject)`

## Refactoring Strategy

### Phase 1: Define Discriminated Union Types

Create a discriminated union for answer values based on `QuestionType`:

```typescript
// Answer value types - one per question type
type TextAnswer = string;
type BooleanAnswer = boolean;
type NumberAnswer = number;
type MultipleChoiceAnswer = string | string[];
type NumberRangeAnswer = NumberRange;
type DateAnswer = string; // ISO date
type DateRangeAnswer = DateRange;

// Discriminated union of all possible answers
type AnswerValue = 
  | { type: 'text'; value: TextAnswer }
  | { type: 'boolean'; value: BooleanAnswer }
  | { type: 'number'; value: NumberAnswer }
  | { type: 'multiple-choice'; value: MultipleChoiceAnswer }
  | { type: 'number-range'; value: NumberRangeAnswer }
  | { type: 'date'; value: DateAnswer }
  | { type: 'date-range'; value: DateRangeAnswer };
```

### Phase 2: Type-Safe Condition System

Create discriminated unions for conditions:

```typescript
type ConditionValue = 
  | { operator: 'equals'; value: string | number | boolean }
  | { operator: 'contains'; value: string | number }
  | { operator: 'greaterThan'; value: number }
  | { operator: 'lessThan'; value: number }
  | { operator: 'between'; value: [number, number] };
```

### Phase 3: Type Guards and Validators

Create type guard functions:

```typescript
function isTextAnswer(value: unknown): value is TextAnswer { ... }
function isBooleanAnswer(value: unknown): value is BooleanAnswer { ... }
function isNumberRangeAnswer(value: unknown): value is NumberRangeAnswer { ... }
// etc.
```

### Phase 4: Update Core Interfaces

Refactor key interfaces:

```typescript
interface Answer {
  questionId: string;
  value: AnswerValue;
}

interface WizardState {
  currentQuestionIndex: number;
  answers: Map<string, AnswerValue>;
  flattenedQuestions: Question[];
  visitedQuestions: string[];
  isComplete: boolean;
}
```

### Phase 5: Update Engine Methods

Refactor methods to use discriminated unions:

```typescript
// Before
getCurrentAnswer(): any { ... }

// After
getCurrentAnswer(): AnswerValue | undefined { ... }

// Before
validateAnswer(question: Question, answer: any): ValidationResult { ... }

// After
validateAnswer(question: Question, answer: AnswerValue): ValidationResult { ... }

// Before
evaluateCondition(condition: any, answer: any): boolean { ... }

// After
evaluateCondition(condition: ConditionValue, answer: AnswerValue): boolean { ... }
```

### Phase 6: Update Composable and Components

Update Vue integration:

```typescript
// Before
const currentAnswer = ref<any>(engine.getCurrentAnswer());

// After
const currentAnswer = ref<AnswerValue | undefined>(engine.getCurrentAnswer());

// Before
const emit = defineEmits<{
  complete: [answers: Record<string, any>];
}>();

// After
const emit = defineEmits<{
  complete: [answers: Record<string, AnswerValue>];
}>();
```

## Benefits

1. **Type Safety**: Compiler catches invalid answer/condition combinations
2. **IDE Support**: Better autocomplete and refactoring support
3. **Runtime Safety**: Type guards enable safe runtime validation
4. **Self-Documenting**: Code clearly shows what values are valid for each question type
5. **Maintainability**: Easier to add new question types with proper typing
6. **Reduced Bugs**: Eliminates entire class of type-related runtime errors

## Implementation Order

1. Add new types to [`src/types.ts`](src/types.ts)
2. Add type guards to a new [`src/type-guards.ts`](src/type-guards.ts)
3. Update [`src/wizard-engine.ts`](src/wizard-engine.ts) method signatures
4. Update [`src/composables/useWizard.ts`](src/composables/useWizard.ts)
5. Update [`src/components/WizardComponent.vue`](src/components/WizardComponent.vue)
6. Update tests and examples

## Backward Compatibility

The refactoring maintains the same external API behavior while improving internal type safety. JSON schemas and configuration files remain unchanged.

## Testing Strategy

---

## Approach Comparison

### Approach A: Discriminated Unions (Original Proposal)

**Concept:** Wrap all answer values in objects with `type` and `value` properties.

```typescript
type AnswerValue = 
  | { type: 'text'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'number'; value: number }
  // etc.
```

#### ❌ Critical Issues

1. **Breaking Changes Everywhere**
   - All existing code that accesses `answer.value` must change to `answer.value.value`
   - JSON structure changes, breaking serialization/deserialization
   - External APIs and integrations break
   - Migration requires rewriting significant portions of codebase

2. **Redundant Type Information**
   - The `Question` type already has a `type` field
   - Wrapping adds duplicate type information at runtime
   - Increases memory footprint and processing overhead

3. **Poor Developer Experience**
   - Confusing nested `.value.value` access patterns
   - More verbose code throughout
   - Harder to understand and maintain

4. **False Backward Compatibility Claim**
   - Plan claims "maintains the same external API behavior"
   - Reality: Fundamentally changes data structure
   - Requires migration of all consuming code

5. **Incomplete Type Safety**
   - Still allows invalid combinations at compile time
   - Condition system still needs additional work
   - Type guards add complexity without solving root issues

#### Pros
- ✅ Textbook discriminated union pattern
- ✅ Explicit type information at runtime

#### Cons
- ❌ Major breaking changes
- ❌ Redundant type information
- ❌ Poor developer experience
- ❌ Higher runtime overhead
- ❌ More complex codebase
- ❌ Difficult migration path

**Verdict:** ⛔ **NOT RECOMMENDED** - The costs far outweigh the benefits.

---

### Approach B: Conditional Types (Recommended)

**Concept:** Use TypeScript's conditional types to create a type-safe mapping without runtime changes.

```typescript
// Map question types to their answer types
type AnswerValueMap = {
  'text': string;
  'boolean': boolean;
  'number': number;
  'multiple-choice': string | string[];
  'number-range': NumberRange;
  'date': string;
  'date-range': DateRange;
};

// Extract correct answer type based on question type
type AnswerForQuestion<T extends QuestionType> = AnswerValueMap[T];

// Type-safe interfaces with generics
interface Answer<T extends QuestionType = QuestionType> {
  questionId: string;
  value: AnswerForQuestion<T>;
}

interface Question<T extends QuestionType = QuestionType> {
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
```

#### ✅ Advantages

1. **Zero Breaking Changes**
   - No runtime changes to data structures
   - Existing code continues to work
   - JSON serialization unchanged
   - Gradual migration possible

2. **Superior Type Safety**
   - TypeScript enforces correct value types at compile time
   - Type inference works automatically
   - IDE autocomplete knows exact types
   - Catches errors before runtime

3. **Excellent Developer Experience**
   - Clean, intuitive API
   - No confusing nested access
   - Better IDE support
   - Self-documenting code

4. **Zero Runtime Overhead**
   - Pure compile-time feature
   - No additional memory usage
   - No performance impact
   - Same runtime behavior

5. **Gradual Migration Path**
   - Add generic overloads alongside existing methods
   - Migrate code incrementally
   - Deprecate `any` versions over time
   - No "big bang" rewrite required

#### Implementation Example

```typescript
// wizard-engine.ts
class WizardEngine {
  // Keep existing method for compatibility
  getCurrentAnswer(): any {
    const question = this.getCurrentQuestion();
    if (!question) return null;
    return this.state.answers.get(question.id);
  }
  
  // Add type-safe overload
  getCurrentAnswerTyped<T extends QuestionType>(
    question: Question<T>
  ): AnswerForQuestion<T> | undefined {
    return this.state.answers.get(question.id) as AnswerForQuestion<T> | undefined;
  }
  
  // Type-safe validation
  validateAnswer<T extends QuestionType>(
    question: Question<T>,
    answer: AnswerForQuestion<T>
  ): ValidationResult {
    // Implementation remains the same
    // But now type-safe!
  }
}
```

#### Usage Example

```typescript
// Type inference works automatically
const question = engine.getCurrentQuestion(); // Question<QuestionType>

if (question.type === 'number-range') {
  // TypeScript narrows the type
  const typedQuestion = question as Question<'number-range'>;
  const answer = engine.getCurrentAnswerTyped(typedQuestion);
  // answer is NumberRange | undefined
  
  if (answer) {
    console.log(answer.min, answer.max); // Type-safe!
  }
}
```

#### Pros
- ✅ Zero breaking changes
- ✅ Complete type safety
- ✅ Excellent IDE support
- ✅ Zero runtime overhead
- ✅ Clean, intuitive API
- ✅ Gradual migration path
- ✅ Better developer experience

#### Cons
- ⚠️ Requires TypeScript 4.1+ (already met)
- ⚠️ Slightly more complex type definitions (one-time cost)

**Verdict:** ✅ **STRONGLY RECOMMENDED** - Provides all benefits with none of the drawbacks.

---

## Recommended Implementation Plan

### Phase 1: Add Type Infrastructure (Non-Breaking)

**File:** [`src/types.ts`](src/types.ts)

```typescript
// Add type mapping
export type AnswerValueMap = {
  'text': string;
  'boolean': boolean;
  'number': number;
  'multiple-choice': string | string[];
  'number-range': NumberRange;
  'date': string;
  'date-range': DateRange;
};

// Add helper type
export type AnswerForQuestion<T extends QuestionType> = AnswerValueMap[T];

// Add generic parameter to existing interfaces (backward compatible)
export interface Answer<T extends QuestionType = QuestionType> {
  questionId: string;
  value: T extends QuestionType ? AnswerForQuestion<T> : any;
}

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
```

**Impact:** Zero breaking changes - existing code continues to work.

### Phase 2: Add Type-Safe Method Overloads (Non-Breaking)

**File:** [`src/wizard-engine.ts`](src/wizard-engine.ts)

```typescript
export class WizardEngine {
  // Keep existing methods (deprecated but functional)
  /** @deprecated Use getCurrentAnswerTyped for type safety */
  getCurrentAnswer(): any {
    const question = this.getCurrentQuestion();
    if (!question) return null;
    return this.state.answers.get(question.id);
  }
  
  // Add new type-safe methods
  getCurrentAnswerTyped<T extends QuestionType>(
    question: Question<T>
  ): AnswerForQuestion<T> | undefined {
    return this.state.answers.get(question.id) as AnswerForQuestion<T> | undefined;
  }
  
  validateAnswerTyped<T extends QuestionType>(
    question: Question<T>,
    answer: AnswerForQuestion<T>
  ): ValidationResult {
    return this.validateAnswer(question, answer);
  }
  
  answerCurrentQuestionTyped<T extends QuestionType>(
    question: Question<T>,
    answer: AnswerForQuestion<T>
  ): ValidationResult {
    return this.answerCurrentQuestion(answer);
  }
}
```

**Impact:** Zero breaking changes - adds new methods alongside existing ones.

### Phase 3: Update Composable (Non-Breaking)

**File:** [`src/composables/useWizard.ts`](src/composables/useWizard.ts)

```typescript
export function useWizard(config: WizardConfig) {
  const engine = new WizardEngine(config);
  
  // Add type-safe reactive state
  const currentQuestion = ref<Question | null>(engine.getCurrentQuestion());
  const currentAnswer = ref<any>(engine.getCurrentAnswer());
  
  // Add type-safe helper
  const getCurrentAnswerTyped = <T extends QuestionType>(
    question: Question<T>
  ): AnswerForQuestion<T> | undefined => {
    return engine.getCurrentAnswerTyped(question);
  };
  
  return {
    // Existing exports
    currentQuestion,
    currentAnswer,
    // ... other exports
    
    // New type-safe exports
    getCurrentAnswerTyped,
  };
}
```

**Impact:** Zero breaking changes - adds new functionality.

### Phase 4: Add Type Guards (Optional Enhancement)

**File:** [`src/type-guards.ts`](src/type-guards.ts) (new file)

```typescript
import type { NumberRange, DateRange, AnswerForQuestion, QuestionType } from './types';

export function isTextAnswer(value: unknown): value is string {
  return typeof value === 'string';
}

export function isBooleanAnswer(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isNumberAnswer(value: unknown): value is number {
  return typeof value === 'number';
}

export function isMultipleChoiceAnswer(value: unknown): value is string | string[] {
  return typeof value === 'string' || 
         (Array.isArray(value) && value.every(v => typeof v === 'string'));
}

export function isNumberRangeAnswer(value: unknown): value is NumberRange {
  return typeof value === 'object' && 
         value !== null && 
         'min' in value && 
         'max' in value &&
         typeof (value as NumberRange).min === 'number' &&
         typeof (value as NumberRange).max === 'number';
}

export function isDateAnswer(value: unknown): value is string {
  return typeof value === 'string' && !isNaN(Date.parse(value));
}

export function isDateRangeAnswer(value: unknown): value is DateRange {
  return typeof value === 'object' && 
         value !== null && 
         'start' in value && 
         'end' in value &&
         typeof (value as DateRange).start === 'string' &&
         typeof (value as DateRange).end === 'string';
}

// Generic type guard factory
export function createAnswerTypeGuard<T extends QuestionType>(
  type: T
): (value: unknown) => value is AnswerForQuestion<T> {
  const guards: Record<QuestionType, (value: unknown) => boolean> = {
    'text': isTextAnswer,
    'boolean': isBooleanAnswer,
    'number': isNumberAnswer,
    'multiple-choice': isMultipleChoiceAnswer,
    'number-range': isNumberRangeAnswer,
    'date': isDateAnswer,
    'date-range': isDateRangeAnswer,
  };
  
  return guards[type] as (value: unknown) => value is AnswerForQuestion<T>;
}
```

**Impact:** Adds runtime validation capabilities without breaking changes.

### Phase 5: Gradual Migration

1. **Update new code** to use type-safe methods
2. **Migrate existing code** incrementally
3. **Add ESLint rules** to encourage type-safe patterns
4. **Update documentation** with type-safe examples
5. **Eventually remove** deprecated `any` methods (major version bump)

---

## Condition System Type Safety

The condition system also needs improvement. Here's the recommended approach:

```typescript
// Operator-specific condition types
type EqualsCondition<T = string | number | boolean> = {
  operator: 'equals';
  value: T;
};

type ContainsCondition = {
  operator: 'contains';
  value: string | number;
};

type ComparisonCondition = {
  operator: 'greaterThan' | 'lessThan';
  value: number;
};

type BetweenCondition = {
  operator: 'between';
  value: [number, number];
};

// Union of all condition types
export type Condition = 
  | EqualsCondition
  | ContainsCondition
  | ComparisonCondition
  | BetweenCondition;

// Type-safe condition evaluation
function evaluateCondition<T extends QuestionType>(
  condition: Condition,
  answer: AnswerForQuestion<T>
): boolean {
  switch (condition.operator) {
    case 'equals':
      return answer === condition.value;
    case 'contains':
      if (Array.isArray(answer)) {
        return answer.includes(condition.value as any);
      }
      return answer === condition.value;
    case 'greaterThan':
      return Number(answer) > condition.value;
    case 'lessThan':
      return Number(answer) < condition.value;
    case 'between':
      const num = Number(answer);
      return num >= condition.value[0] && num <= condition.value[1];
    default:
      return false;
  }
}
```

---

## Migration Timeline

### Week 1: Foundation
- [ ] Add type infrastructure to [`src/types.ts`](src/types.ts)
- [ ] Create [`src/type-guards.ts`](src/type-guards.ts)
- [ ] Add unit tests for type guards

### Week 2: Engine Updates
- [ ] Add type-safe method overloads to [`src/wizard-engine.ts`](src/wizard-engine.ts)
- [ ] Update condition evaluation
- [ ] Add integration tests

### Week 3: Composable & Components
- [ ] Update [`src/composables/useWizard.ts`](src/composables/useWizard.ts)
- [ ] Update [`src/components/WizardComponent.vue`](src/components/WizardComponent.vue)
- [ ] Add component tests

### Week 4: Documentation & Migration
- [ ] Update documentation with type-safe examples
- [ ] Create migration guide
- [ ] Add ESLint rules for type safety
- [ ] Begin gradual migration of existing code

---

## Benefits Summary

### Conditional Types Approach Benefits

1. **Type Safety** ✅
   - Compile-time type checking
   - Prevents invalid value assignments
   - Catches errors before runtime

2. **Zero Breaking Changes** ✅
   - Existing code continues to work
   - Gradual migration possible
   - No "big bang" rewrite

3. **Developer Experience** ✅
   - Better IDE autocomplete
   - Clear error messages
   - Self-documenting code

4. **Performance** ✅
   - Zero runtime overhead
   - No additional memory usage
   - Same execution speed

5. **Maintainability** ✅
   - Easier to add new question types
   - Clear type relationships
   - Reduced cognitive load

6. **Future-Proof** ✅
   - Leverages TypeScript's type system
   - Compatible with future TS versions
   - Industry best practices

---

## Conclusion

**The Conditional Types approach (Approach B) is strongly recommended** over the Discriminated Union approach (Approach A).

### Key Reasons:

1. ✅ **Zero breaking changes** vs ❌ Major breaking changes
2. ✅ **Better type safety** vs ⚠️ Partial type safety
3. ✅ **Zero runtime overhead** vs ❌ Additional overhead
4. ✅ **Excellent DX** vs ❌ Poor DX
5. ✅ **Gradual migration** vs ❌ Big bang rewrite

The Conditional Types approach provides **all the benefits of type safety without any of the costs** associated with the Discriminated Union approach. It's a clear win in every dimension that matters for this project.

### Next Steps:

1. Review and approve this updated plan
2. Begin Phase 1 implementation (type infrastructure)
3. Proceed with gradual, non-breaking migration
4. Monitor and iterate based on developer feedback


- Unit tests for type guards
- Integration tests for condition evaluation
- Component tests for Vue integration
- E2E tests to verify wizard flow still works correctly
