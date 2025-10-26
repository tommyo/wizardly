# AI-Like Wizard Component for Vue 3

A flexible, type-safe wizard component for Vue 3 that handles various question types, conditional logic, validation, and navigation.

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
- Reactive state management

✅ **Developer Friendly**
- Full TypeScript support
- JSON-based configuration
- Vue 3 Composition API
- Comprehensive validation
- Easy to extend

## Installation

Copy the following files to your project:

```
types.ts              # Type definitions
wizard-engine.ts      # Core wizard logic
useWizard.ts         # Vue composable
WizardComponent.vue  # Main component
```

## Quick Start

### 1. Create a JSON Configuration

```json
{
  "wizardId": "my-wizard",
  "title": "My Wizard",
  "description": "A helpful wizard",
  "questions": [
    {
      "id": "q1",
      "type": "boolean",
      "question": "Do you agree?",
      "required": true
    },
    {
      "id": "q2",
      "type": "text",
      "question": "Tell us more",
      "required": false,
      "validation": {
        "minLength": 10,
        "maxLength": 500
      }
    }
  ]
}
```

### 2. Use the Component

```vue
<template>
  <WizardComponent
    config-url="/path/to/config.json"
    @complete="handleComplete"
    @cancel="handleCancel"
  />
</template>

<script setup>
import WizardComponent from './WizardComponent.vue';

const handleComplete = (answers) => {
  console.log('Answers:', answers);
  // Submit to API, etc.
};

const handleCancel = () => {
  console.log('Wizard cancelled');
};
</script>
```

## Question Types

### Boolean (Toggle Switch)

```json
{
  "id": "agree",
  "type": "boolean",
  "question": "Do you agree to the terms?",
  "required": true
}
```

### Multiple Choice (Single Selection)

```json
{
  "id": "color",
  "type": "multiple-choice",
  "question": "What's your favorite color?",
  "required": true,
  "options": [
    { "value": "red", "label": "Red" },
    { "value": "blue", "label": "Blue" },
    { "value": "green", "label": "Green" }
  ]
}
```

### Multiple Choice (Multiple Selection)

```json
{
  "id": "interests",
  "type": "multiple-choice",
  "question": "Select your interests",
  "allowMultiple": true,
  "options": [
    { "value": "sports", "label": "Sports" },
    { "value": "music", "label": "Music" },
    { "value": "reading", "label": "Reading" }
  ]
}
```

### Text Input

```json
{
  "id": "bio",
  "type": "text",
  "question": "Tell us about yourself",
  "required": true,
  "helpText": "Share your background and interests",
  "validation": {
    "minLength": 50,
    "maxLength": 500
  }
}
```

### Number Input

```json
{
  "id": "age",
  "type": "number",
  "question": "How old are you?",
  "required": true,
  "validation": {
    "min": 18,
    "max": 120,
    "customMessage": "Age must be between 18 and 120"
  }
}
```

### Number Range

```json
{
  "id": "salary",
  "type": "number-range",
  "question": "Desired salary range (in thousands)",
  "required": true,
  "validation": {
    "min": 0,
    "max": 500
  }
}
```

**Answer format:** `{ min: 50, max: 100 }`

### Date Input

```json
{
  "id": "startDate",
  "type": "date",
  "question": "When can you start?",
  "required": true,
  "validation": {
    "minDate": "today"
  }
}
```

### Date Range

```json
{
  "id": "availability",
  "type": "date-range",
  "question": "Your availability window",
  "required": true,
  "validation": {
    "minDate": "today",
    "maxDate": "2025-12-31"
  }
}
```

**Answer format:** `{ start: "2025-01-01", end: "2025-12-31" }`

## Conditional Questions

Add follow-up questions based on previous answers:

```json
{
  "id": "employed",
  "type": "boolean",
  "question": "Are you currently employed?",
  "required": true,
  "conditionalQuestions": [
    {
      "condition": {
        "operator": "equals",
        "value": true
      },
      "question": {
        "id": "employer",
        "type": "text",
        "question": "Who is your employer?",
        "required": true
      }
    }
  ]
}
```

### Condition Operators

- **`equals`**: Exact match
  ```json
  { "operator": "equals", "value": true }
  ```

- **`contains`**: For arrays (multiple choice with allowMultiple)
  ```json
  { "operator": "contains", "value": "option1" }
  ```

- **`greaterThan`**: Numeric comparison
  ```json
  { "operator": "greaterThan", "value": 5 }
  ```

- **`lessThan`**: Numeric comparison
  ```json
  { "operator": "lessThan", "value": 10 }
  ```

- **`between`**: Numeric range
  ```json
  { "operator": "between", "value": [5, 10] }
  ```

## Validation Rules

### Text Validation

```json
{
  "validation": {
    "minLength": 10,
    "maxLength": 500,
    "pattern": "^[a-zA-Z0-9]+$",
    "customMessage": "Only alphanumeric characters allowed"
  }
}
```

### Number Validation

```json
{
  "validation": {
    "min": 0,
    "max": 100,
    "customMessage": "Must be between 0 and 100"
  }
}
```

### Date Validation

```json
{
  "validation": {
    "minDate": "today",
    "maxDate": "2025-12-31",
    "customMessage": "Date must be in 2025"
  }
}
```

Special date values:
- `"today"` - Current date
- `"2025-12-31"` - Specific date (ISO format)

## API Reference

### Component Props

```typescript
interface Props {
  config?: WizardConfig;      // Inline configuration
  configUrl?: string;          // URL to load JSON config
}
```

### Component Events

```typescript
interface Events {
  complete: (answers: Record<string, any>) => void;  // Wizard completed
  cancel: () => void;                                 // Wizard cancelled
}
```

### useWizard Composable

```typescript
const {
  // Reactive state
  currentQuestion,
  currentAnswer,
  validationError,
  isComplete,
  
  // Computed
  progress,
  canGoNext,
  canGoPrevious,
  
  // Methods
  updateAnswer,
  validateCurrentAnswer,
  submitAnswer,
  goBack,
  skipQuestion,
  getAnswers,
  getAnswersObject,
  reset,
  complete
} = useWizard(config);
```

### WizardEngine Class

```typescript
const engine = new WizardEngine(config);

// Navigation
engine.getCurrentQuestion();
engine.answerCurrentQuestion(answer);
engine.next();
engine.previous();
engine.canGoNext();
engine.canGoPrevious();

// Validation
engine.validateAnswer(question, answer);

// Progress
engine.getProgress();
engine.isComplete();

// Results
engine.getAnswers();
engine.getAnswersObject();

// Control
engine.reset();
```

## Advanced Usage

### Custom Styling

The component uses scoped CSS with semantic class names. Override styles:

```css
.wizard-container {
  /* Container styles */
}

.wizard-header {
  /* Header styles */
}

.wizard-question {
  /* Question card styles */
}

.btn-primary {
  /* Primary button styles */
}
```

### Programmatic Control

```vue
<script setup>
import { ref } from 'vue';
import { useWizard } from './useWizard';

const config = ref({ /* ... */ });
const wizard = useWizard(config.value);

// Manually control the wizard
const skipToEnd = () => {
  while (wizard.canGoNext.value) {
    wizard.submitAnswer(/* default answer */);
    wizard.next();
  }
};
</script>
```

### Answer Persistence

```typescript
// Save answers to localStorage
const handleComplete = (answers: Record<string, any>) => {
  localStorage.setItem('wizard-answers', JSON.stringify(answers));
};

// Restore answers (implement custom logic)
const savedAnswers = JSON.parse(localStorage.getItem('wizard-answers') || '{}');
```

## TypeScript Support

Full TypeScript support with comprehensive types:

```typescript
import type { 
  WizardConfig, 
  Question, 
  Answer, 
  ValidationResult 
} from './types';

const config: WizardConfig = {
  wizardId: 'my-wizard',
  title: 'My Wizard',
  questions: [/* ... */]
};
```

## Examples

See `ExampleApp.vue` for complete working examples including:
- Loading configuration from JSON URL
- Using inline configuration
- Handling completion and cancellation
- Modal integration

## Browser Support

- Vue 3.0+
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ support required

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
