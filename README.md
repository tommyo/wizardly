# Wizardly - Type-Safe Wizard Component for Vue 3

A flexible, type-safe wizard/questionnaire component for Vue 3 that handles various question types, conditional logic, validation, and navigation with full TypeScript support.

## Features

✅ **Multiple Question Types**
- Boolean (toggle switch)
- Multiple choice (single or multiple selection)
- Free-form text input
- Number input
- Number range
- Date picker
- Date range

✅ **Smart Features**
- Required/optional questions
- Conditional follow-up questions
- Rich validation rules (min/max, patterns, date constraints)
- Forward and backward navigation
- Progress tracking
- Reactive state management with optional Pinia support
- Type-safe answer handling

✅ **Developer Friendly**
- Full TypeScript support with generics
- JSON-based configuration
- Vue 3 Composition API
- Comprehensive validation
- Easy to extend
- Comprehensive test coverage

## Installation

```bash
npm install wizardly
# or
pnpm add wizardly
```

### Manual Installation

Copy the following files to your project:

```
src/
├── types.ts                    # Type definitions
├── wizard-engine.ts            # Core wizard logic
├── wizard-state.ts             # State management utilities
├── validators.ts               # Validation functions
├── type-guards.ts              # Runtime type checking
├── composables/
│   ├── useWizard.ts           # Main composable
│   └── useWizardStore.ts      # Pinia store integration
└── components/
    └── WizardComponent.vue    # Main component
```

## Quick Start

### 1. Create a JSON Configuration

```json
{
  "wizardId": "onboarding-wizard",
  "title": "Welcome Onboarding",
  "description": "Let's get you set up",
  "questions": [
    {
      "id": "name",
      "type": "text",
      "question": "What's your name?",
      "required": true,
      "validation": {
        "minLength": 2,
        "maxLength": 50
      }
    },
    {
      "id": "experience",
      "type": "number",
      "question": "Years of experience?",
      "required": true,
      "validation": {
        "min": 0,
        "max": 50
      }
    }
  ]
}
```

### 2. Use the Composable

```vue
<script setup lang="ts">
import { useWizard } from './composables/useWizard';
import type { Question } from './types';

const questions: Question[] = [
  {
    id: 'name',
    type: 'text',
    question: "What's your name?",
    required: true
  },
  {
    id: 'age',
    type: 'number',
    question: 'How old are you?',
    required: true,
    validation: { min: 18, max: 120 }
  }
];

const {
  currentQuestions,
  currentAnswers,
  progress,
  canGoNext,
  canGoPrevious,
  answerQuestions,
  goBack,
  complete,
  isComplete
} = useWizard(questions);

const handleSubmit = () => {
  const answers = [/* your answer values */];
  const results = answerQuestions(currentQuestions.value, answers);
  
  if (results.every(r => r.isValid)) {
    console.log('Valid answers submitted');
  }
};

const handleComplete = () => {
  const { answers, answersObject } = complete();
  console.log('Wizard completed:', answersObject);
};
</script>

<template>
  <div class="wizard">
    <div class="progress">
      {{ progress.current }} / {{ progress.total }} ({{ progress.percentage }}%)
    </div>
    
    <div v-for="question in currentQuestions" :key="question.id">
      <h3>{{ question.question }}</h3>
      <!-- Render appropriate input based on question.type -->
    </div>
    
    <div class="actions">
      <button @click="goBack" :disabled="!canGoPrevious">Back</button>
      <button @click="handleSubmit" :disabled="!canGoNext">Next</button>
      <button v-if="isComplete" @click="handleComplete">Complete</button>
    </div>
  </div>
</template>
```

### 3. Use with Pinia Store

```vue
<script setup lang="ts">
import { useWizardStore } from './composables/useWizardStore';
import type { Question } from './types';

const questions: Question[] = [/* ... */];
const store = useWizardStore();

// Initialize wizard
store.initialize(questions);

// Access state
const { currentQuestions, progress, canGoNext } = store;

// Submit answers
const handleSubmit = (answers: any[]) => {
  store.answerQuestions(answers);
};
</script>
```

## Question Types

### Boolean (Toggle Switch)

```typescript
{
  id: 'agree',
  type: 'boolean',
  question: 'Do you agree to the terms?',
  required: true
}
```

**Answer type:** `boolean`

### Multiple Choice (Single Selection)

```typescript
{
  id: 'color',
  type: 'multiple-choice',
  question: "What's your favorite color?",
  required: true,
  options: [
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' }
  ]
}
```

**Answer type:** `string`

### Multiple Choice (Multiple Selection)

```typescript
{
  id: 'interests',
  type: 'multiple-choice',
  question: 'Select your interests',
  allowMultiple: true,
  options: [
    { value: 'sports', label: 'Sports' },
    { value: 'music', label: 'Music' },
    { value: 'reading', label: 'Reading' }
  ]
}
```

**Answer type:** `string[]`

### Text Input

```typescript
{
  id: 'bio',
  type: 'text',
  question: 'Tell us about yourself',
  required: true,
  helpText: 'Share your background and interests',
  validation: {
    minLength: 50,
    maxLength: 500,
    pattern: '^[a-zA-Z0-9\\s]+$',
    customMessage: 'Only letters, numbers, and spaces allowed'
  }
}
```

**Answer type:** `string`

### Number Input

```typescript
{
  id: 'age',
  type: 'number',
  question: 'How old are you?',
  required: true,
  validation: {
    min: 18,
    max: 120,
    customMessage: 'Age must be between 18 and 120'
  }
}
```

**Answer type:** `number`

### Number Range

```typescript
{
  id: 'salary',
  type: 'number-range',
  question: 'Desired salary range (in thousands)',
  required: true,
  validation: {
    min: 0,
    max: 500
  }
}
```

**Answer type:** `{ min: number, max: number }`

### Date Input

```typescript
{
  id: 'startDate',
  type: 'date',
  question: 'When can you start?',
  required: true,
  validation: {
    minDate: 'today',
    maxDate: '2025-12-31'
  }
}
```

**Answer type:** `string` (ISO date format)

### Date Range

```typescript
{
  id: 'availability',
  type: 'date-range',
  question: 'Your availability window',
  required: true,
  validation: {
    minDate: 'today',
    maxDate: '2025-12-31'
  }
}
```

**Answer type:** `{ start: string, end: string }` (ISO date format)

## Conditional Questions

Add follow-up questions based on previous answers:

```typescript
{
  id: 'employed',
  type: 'boolean',
  question: 'Are you currently employed?',
  required: true,
  conditionalQuestions: [
    {
      condition: {
        operator: 'equals',
        value: true
      },
      question: {
        id: 'employer',
        type: 'text',
        question: 'Who is your employer?',
        required: true
      }
    }
  ]
}
```

### Condition Operators

- **`equals`**: Exact match
  ```typescript
  { operator: 'equals', value: true }
  ```

- **`contains`**: For arrays (multiple choice with allowMultiple)
  ```typescript
  { operator: 'contains', value: 'option1' }
  ```

- **`greaterThan`**: Numeric comparison
  ```typescript
  { operator: 'greaterThan', value: 5 }
  ```

- **`lessThan`**: Numeric comparison
  ```typescript
  { operator: 'lessThan', value: 10 }
  ```

- **`between`**: Numeric range
  ```typescript
  { operator: 'between', value: [5, 10] }
  ```

## Validation

### Built-in Validators

The library includes comprehensive validation for all question types:

```typescript
import { validateAnswer } from './validators';

const question: Question = {
  id: 'email',
  type: 'text',
  question: 'Your email',
  required: true,
  validation: {
    pattern: '^[^@]+@[^@]+\\.[^@]+$',
    customMessage: 'Please enter a valid email'
  }
};

const result = validateAnswer(question, 'user@example.com');
if (!result.isValid) {
  console.error(result.error?.message);
}
```

### Validation Rules by Type

**Text:**
```typescript
{
  validation: {
    minLength: 10,
    maxLength: 500,
    pattern: '^[a-zA-Z0-9]+$',
    customMessage: 'Only alphanumeric characters allowed'
  }
}
```

**Number:**
```typescript
{
  validation: {
    min: 0,
    max: 100,
    customMessage: 'Must be between 0 and 100'
  }
}
```

**Date:**
```typescript
{
  validation: {
    minDate: 'today',
    maxDate: '2025-12-31',
    customMessage: 'Date must be in 2025'
  }
}
```

## API Reference

### useWizard Composable

```typescript
const {
  // Reactive state
  currentQuestions,      // Question[] - Current question set
  currentAnswers,        // AnswerValue[] - Current answers
  isComplete,           // boolean - Wizard completion status
  validationErrors,     // Map<string, string> - Validation errors
  
  // Computed
  progress,             // { current, total, percentage }
  canGoNext,           // boolean - Can navigate forward
  canGoPrevious,       // boolean - Can navigate backward
  
  // Methods
  answerQuestions,     // (questions, answers) => ValidationResult[]
  goBack,              // () => boolean
  skipQuestion,        // () => boolean
  getAnswers,          // () => Answer[]
  getAnswersObject,    // () => Record<string, AnswerValue>
  reset,               // (answers?) => void
  complete,            // () => { answers, answersObject }
  getValidationError,  // (questionId) => string | undefined
  clearValidationErrors // () => void
} = useWizard(questions, initialAnswers?);
```

### WizardEngine Class

```typescript
import { WizardEngine } from './wizard-engine';

const engine = new WizardEngine(questions);

// Initialize state
const state = engine.initState(previousAnswers?);

// Answer questions
const results = engine.answerQuestions(state, answers, validate?);

// Add questions dynamically
engine.addQuestions(state, newQuestions);

// Reset
engine.reset(state, answers?);
```

### Type Definitions

```typescript
import type {
  Question,
  Answer,
  AnswerValue,
  WizardConfig,
  ValidationResult,
  QuestionType,
  Condition
} from './types';

// Type-safe question creation
const textQuestion: Question<'text'> = {
  id: 'name',
  type: 'text',
  question: 'Your name?',
  required: true
};

// Type-safe answer
const answer: Answer<'text'> = {
  questionId: 'name',
  value: 'John Doe'
};
```

## Advanced Usage

### Dynamic Question Addition

```typescript
const { currentQuestions } = useWizard(initialQuestions);

// Add questions based on user input
const addFollowUpQuestions = (newQuestions: Question[]) => {
  engine.addQuestions(state, newQuestions);
};
```

### Answer Persistence

```typescript
import { useWizard } from './composables/useWizard';

// Save answers to localStorage
const saveProgress = () => {
  const answers = getAnswers();
  localStorage.setItem('wizard-progress', JSON.stringify(answers));
};

// Restore answers
const savedAnswers = JSON.parse(
  localStorage.getItem('wizard-progress') || '[]'
);
const wizard = useWizard(questions, savedAnswers);
```

### Custom Validation

```typescript
import { validateAnswer } from './validators';

const customValidate = (question: Question, value: AnswerValue) => {
  const baseResult = validateAnswer(question, value);
  
  if (!baseResult.isValid) {
    return baseResult;
  }
  
  // Add custom validation logic
  if (question.id === 'email' && !value.includes('@company.com')) {
    return {
      isValid: false,
      error: new Error('Must use company email')
    };
  }
  
  return { isValid: true };
};
```

### Type Guards

```typescript
import { isTextQuestion, isNumberQuestion } from './type-guards';

const question: Question = getCurrentQuestion();

if (isTextQuestion(question)) {
  // TypeScript knows question.type === 'text'
  console.log(question.validation?.pattern);
}

if (isNumberQuestion(question)) {
  // TypeScript knows question.type === 'number'
  console.log(question.validation?.min);
}
```

## Examples

### Complete Wizard Implementation

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useWizard } from './composables/useWizard';
import type { Question, AnswerValue } from './types';

const questions: Question[] = [
  {
    id: 'name',
    type: 'text',
    question: "What's your name?",
    required: true,
    validation: { minLength: 2 }
  },
  {
    id: 'hasExperience',
    type: 'boolean',
    question: 'Do you have prior experience?',
    required: true,
    conditionalQuestions: [
      {
        condition: { operator: 'equals', value: true },
        question: {
          id: 'years',
          type: 'number',
          question: 'How many years?',
          required: true,
          validation: { min: 0, max: 50 }
        }
      }
    ]
  }
];

const {
  currentQuestions,
  currentAnswers,
  progress,
  canGoNext,
  canGoPrevious,
  isComplete,
  answerQuestions,
  goBack,
  complete,
  getValidationError
} = useWizard(questions);

const answers = ref<(AnswerValue | undefined)[]>([]);

const handleNext = () => {
  const results = answerQuestions(
    currentQuestions.value,
    answers.value
  );
  
  if (results.every(r => r.isValid)) {
    answers.value = [];
  }
};

const handleComplete = () => {
  const { answersObject } = complete();
  console.log('Completed:', answersObject);
  // Submit to API, navigate away, etc.
};
</script>

<template>
  <div class="wizard-container">
    <div class="progress-bar">
      <div 
        class="progress-fill" 
        :style="{ width: `${progress.percentage}%` }"
      />
    </div>
    
    <div class="questions">
      <div 
        v-for="(question, index) in currentQuestions" 
        :key="question.id"
        class="question"
      >
        <label>{{ question.question }}</label>
        <span v-if="question.required" class="required">*</span>
        
        <input
          v-if="question.type === 'text'"
          v-model="answers[index]"
          type="text"
        />
        
        <input
          v-else-if="question.type === 'number'"
          v-model.number="answers[index]"
          type="number"
        />
        
        <input
          v-else-if="question.type === 'boolean'"
          v-model="answers[index]"
          type="checkbox"
        />
        
        <div v-if="getValidationError(question.id)" class="error">
          {{ getValidationError(question.id) }}
        </div>
      </div>
    </div>
    
    <div class="actions">
      <button 
        @click="goBack" 
        :disabled="!canGoPrevious"
      >
        Back
      </button>
      
      <button 
        v-if="!isComplete"
        @click="handleNext"
        :disabled="!canGoNext"
      >
        Next
      </button>
      
      <button 
        v-else
        @click="handleComplete"
        class="complete"
      >
        Complete
      </button>
    </div>
  </div>
</template>
```

### Loading from JSON

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useWizard } from './composables/useWizard';
import type { WizardConfig } from './types';

const config = ref<WizardConfig | null>(null);

onMounted(async () => {
  const response = await fetch('/api/wizard-config.json');
  config.value = await response.json();
});

const wizard = computed(() => 
  config.value ? useWizard(config.value.questions) : null
);
</script>
```

## Testing

The library includes comprehensive test coverage:

```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:unit -- --coverage

# Run specific test file
npm run test:unit src/__tests__/wizard-engine.spec.ts
```

Test files:
- [`wizard-engine.spec.ts`](src/__tests__/wizard-engine.spec.ts) - Core engine tests
- [`wizard-state.spec.ts`](src/__tests__/wizard-state.spec.ts) - State management tests
- [`useWizard.spec.ts`](src/__tests__/useWizard.spec.ts) - Composable tests
- [`validators.spec.ts`](src/__tests__/validators.spec.ts) - Validation tests
- [`type-guards.spec.ts`](src/__tests__/type-guards.spec.ts) - Type guard tests

## Project Structure

```
src/
├── types.ts                    # TypeScript type definitions
├── wizard-engine.ts            # Core wizard logic
├── wizard-state.ts             # State management utilities
├── validators.ts               # Validation functions
├── type-guards.ts              # Runtime type checking
├── composables/
│   ├── useWizard.ts           # Main Vue composable
│   └── useWizardStore.ts      # Pinia store integration
├── components/
│   └── WizardComponent.vue    # Main wizard component
└── __tests__/
    ├── wizard-engine.spec.ts
    ├── wizard-state.spec.ts
    ├── useWizard.spec.ts
    ├── validators.spec.ts
    └── type-guards.spec.ts
```

## Browser Support

- Vue 3.0+
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ support required

## TypeScript

Full TypeScript support with:
- Generic type parameters for type-safe question/answer handling
- Discriminated unions for question types
- Conditional types for answer values
- Comprehensive type guards
- Full IntelliSense support

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT

## Links

- [GitHub Repository](https://github.com/tommyo/wizardly)
- [Issue Tracker](https://github.com/tommyo/wizardly/issues)
- [Documentation](https://github.com/tommyo/wizardly/blob/main/README.md)
