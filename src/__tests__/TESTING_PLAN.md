# Wizard Component Testing Plan

This document outlines the comprehensive testing strategy for the Wizard Component, covering both unit/integration tests (Vitest) and end-to-end tests (Playwright).

## Testing Goals

1. Ensure wizard configuration validation works correctly
2. Verify question flow and conditional logic
3. Test all question types and their validation rules
4. Validate state management and persistence
5. Ensure proper error handling and user feedback
6. Test accessibility and user interactions

---

## Vitest Testing Plan (Unit & Integration Tests)

### 1. Type System & Validation Tests

#### [`type-guards.ts`](../type-guards.ts)
- [x] Test `isTextAnswer()` with valid and invalid values
- [x] Test `isBooleanAnswer()` with valid and invalid values
- [x] Test `isNumberAnswer()` with valid and invalid values (including NaN)
- [x] Test `isMultipleChoiceAnswer()` with strings and arrays
- [x] Test `isNumberRangeAnswer()` with valid and invalid objects
- [x] Test `isDateAnswer()` with valid and invalid date strings
- [x] Test `isDateRangeAnswer()` with valid and invalid date ranges
- [x] Test `createAnswerTypeGuard()` for all question types
- [x] Test `validateAnswerType()` for all question types
- [x] Test type narrowing functionality

#### [`validators.ts`](../validators.ts)
- [x] Test text validation (minLength, maxLength, pattern)
- [x] Test number validation (min, max)
- [x] Test number range validation (min/max constraints, structural validation)
- [x] Test date validation (minDate, maxDate, 'today' keyword, invalid dates)
- [x] Test date range validation (start/end validation, structural validation)
- [x] Test email validation patterns
- [x] Test custom validation messages
- [x] Test required field validation
- [x] Test validation with empty/null/undefined values
- [x] Test validation with zero values
- [x] Test validation without validation rules

### 2. Wizard Engine Tests

#### [`wizard-engine.ts`](../wizard-engine.ts)
- [x] Test wizard initialization with valid config
- [x] Test wizard initialization with empty questions array
- [x] Test wizard initialization with pre-existing answers
- [x] Test answer storage and validation integration
- [x] Test conditional question evaluation:
  - [x] `equals` operator
  - [x] `greaterThan` operator
  - [x] `lessThan` operator
  - [x] `contains` operator (for arrays)
  - [x] `between` operator
- [x] Test nested conditional questions (conditionals within conditionals)
- [x] Test deep nesting (3+ levels)
- [x] Test multiple conditional branches from same question
- [x] Test boolean question special handling (shows conditionals before answer)
- [x] Test boolean question special handling with deep nesting (3+ levels)
- [x] Test answer storage and retrieval
- [x] Test wizard reset functionality
- [x] Test adding questions dynamically
- [x] Test finding questions by ID (including nested)
- [x] Test validation rejection (invalid answers not stored)
- [x] Test required field validation
- [x] Test updating existing answers
- [x] Test preserving other answers when updating one

### 3. Wizard State Tests

#### [`wizard-state.ts`](../wizard-state.ts)
- [x] Test `getQuestionSet()` with various scenarios
  - [x] Empty questions array
  - [x] Out of bounds index
  - [x] Single question
  - [x] Question set with conditional children
  - [x] Question set with deeply nested conditional children (3+ deep)
  - [x] Question set with special boolean conditions handling
  - [x] Question set with deeply nested special boolean conditions handling (3+ deep)
  - [x] Custom startIndex parameter
  - [x] Nested conditional parents
- [x] Test `getCurrentAnswers()` for answered and unanswered questions
- [x] Test `next()` navigation
  - [x] Moving to next question
  - [x] Tracking visited questions
  - [x] Completion detection
  - [x] Boundary conditions
- [x] Test `previous()` navigation
  - [x] Moving to previous question
  - [x] Boundary conditions at start
  - [x] Navigation from completed state
- [x] Test `canGoNext()` with count parameter
- [x] Test `canGoPrevious()` boundary conditions
- [x] Test `getProgress()` calculation
  - [x] At start, middle, and end
  - [x] Empty questions
  - [x] Single question
  - [x] Index past end
- [x] Test `getAnswers()` as Answer array
- [x] Test `getAnswersObject()` as plain object
- [x] Test state updates (currentQuestionIndex, answers, isComplete)
- [x] Test visited questions tracking (no duplicates)
- [x] Test edge cases (special characters, zero values, empty strings)
- [x] Test complete wizard flow integration

### 4. Composable Tests

#### [`useWizard.ts`](../composables/useWizard.ts)
- [x] Test composable initialization
  - [x] With questions
  - [x] With pre-existing answers
  - [x] With empty questions array
- [x] Test reactive state updates
  - [x] currentQuestions reactivity
  - [x] isComplete reactivity
  - [x] progress reactivity
  - [x] canGoNext reactivity
  - [x] canGoPrevious reactivity
- [x] Test answer submission
  - [x] Valid answers advance
  - [x] Invalid answers don't advance
  - [x] Multiple answers at once
- [x] Test navigation methods
  - [x] answerQuestions navigation
  - [x] goBack navigation
  - [x] skipQuestion navigation
  - [x] Boundary conditions
- [x] Test validation integration
  - [x] Required field validation
  - [x] Pattern validation
  - [x] Number range validation
  - [x] Validation error tracking
  - [x] Validation error clearing
  - [x] validationErrors computed property
- [x] Test answer retrieval (array and object formats)
- [x] Test reset functionality
- [x] Test complete method
- [x] Test complete wizard flows (linear and conditional)
- [x] Test edge cases (empty submissions, special characters, zero values, rapid updates)
- [x] Test complex scenarios (multiple validation rules, date validation, range validation)

#### [`useWizardStore.ts`](../composables/useWizardStore.ts)
- [x] **Store Factory Creation**
  - [x] Test store factory returns a valid Pinia store definition
  - [x] Test store is created with correct id parameter
  - [x] Test store receives WizardConfig correctly
  - [x] Test multiple store instances can be created with different ids
  - [x] Test store factory throws error with invalid config

- [x] **Store Initialization**
  - [x] Test store initializes with questions from config
  - [x] Test store state is properly reactive
  - [x] Test store inherits all properties from useWizard composable
  - [x] Test store can be accessed via Pinia's useStore pattern
  - [x] Test store initialization with empty questions array

- [x] **Store State Management**
  - [ ] Test store state persists across component unmounts
  - [x] Test store state is isolated between different store instances
  - [x] Test store state updates trigger reactivity in components
  - [x] Test store can be reset to initial state
  - [ ] Test store state survives hot module replacement (HMR)

- [x] **Integration with useWizard**
  - [x] Test all useWizard methods are available on store
  - [x] Test currentQuestions computed property works in store context
  - [x] Test currentAnswers computed property works in store context
  - [x] Test isComplete computed property works in store context
  - [x] Test progress computed property works in store context
  - [x] Test canGoNext computed property works in store context
  - [x] Test canGoPrevious computed property works in store context
  - [x] Test answerQuestions method works in store context
  - [x] Test goBack method works in store context
  - [x] Test skipQuestion method works in store context
  - [x] Test getAnswers method works in store context
  - [x] Test getAnswersObject method works in store context
  - [x] Test reset method works in store context
  - [x] Test complete method works in store context

- [x] **Multiple Store Instances**
  - [x] Test creating multiple stores with different wizardIds
  - [x] Test stores with different ids maintain separate state
  - [x] Test stores with same id share state (Pinia behavior)
  - [ ] Test store cleanup when no longer referenced
  - [x] Test store state doesn't leak between instances

- [ ] **Store Composition**
  - [ ] Test store can be composed with other Pinia stores
  - [ ] Test store actions can call other store actions
  - [ ] Test store getters can access other store state
  - [ ] Test circular dependencies are handled correctly

- [x] **Error Handling**
  - [x] Test store handles invalid WizardConfig gracefully
  - [ ] Test store handles missing required config properties
  - [x] Test store handles malformed questions array
  - [ ] Test store error states are properly exposed
  - [ ] Test store recovers from error states

- [x] **TypeScript Type Safety**
  - [x] Test store type inference works correctly
  - [x] Test store methods have correct type signatures
  - [x] Test store state properties have correct types
  - [ ] Test generic type parameters work as expected
  - [ ] Test type errors are caught at compile time

- [x] **Performance**
  - [ ] Test store initialization performance with large question sets
  - [ ] Test store doesn't cause unnecessary re-renders
  - [ ] Test store computed properties are properly memoized
  - [x] Test store handles rapid state updates efficiently
  - [ ] Test memory usage with multiple store instances

- [ ] **Pinia Integration**
  - [ ] Test store works with Pinia devtools
  - [ ] Test store state is visible in Vue devtools
  - [ ] Test store actions are logged in devtools
  - [ ] Test store can be hydrated from persisted state
  - [ ] Test store works with Pinia plugins

### 5. Component Tests

#### [`WizardComponent.vue`](../components/WizardComponent.vue)
- [ ] Test component mounting with valid props
- [ ] Test component mounting with invalid props
- [ ] Test question rendering for each type:
  - [ ] Text input
  - [ ] Number input
  - [ ] Boolean (checkbox/toggle)
  - [ ] Select/dropdown
  - [ ] Radio buttons
  - [ ] Multi-select
- [ ] Test navigation button states (disabled/enabled)
- [ ] Test progress indicator
- [ ] Test error message display
- [ ] Test completion event emission
- [ ] Test cancel event emission

---

## Wizard Configuration Test Scenarios

### Scenario 1: Simple Linear Wizard
```typescript
{
  wizardId: 'simple-linear',
  questions: [
    { id: 'q1', type: 'text', question: 'Name?', required: true },
    { id: 'q2', type: 'number', question: 'Age?', required: true },
    { id: 'q3', type: 'boolean', question: 'Subscribe?', required: false }
  ]
}
```
**Tests:**
- [ ] All questions appear in order
- [ ] Navigation works forward and backward
- [ ] Validation prevents skipping required fields
- [ ] Completion triggers with all answers

### Scenario 2: Conditional Branching Wizard
```typescript
{
  wizardId: 'conditional-branch',
  questions: [
    {
      id: 'user_type',
      type: 'text',
      question: 'Are you a student or professional?',
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Professional', value: 'professional' }
      ],
      conditionalQuestions: [
        {
          condition: { operator: 'equals', value: 'student' },
          question: {
            id: 'school',
            type: 'text',
            question: 'What school do you attend?',
            required: true
          }
        },
        {
          condition: { operator: 'equals', value: 'professional' },
          question: {
            id: 'company',
            type: 'text',
            question: 'What company do you work for?',
            required: true
          }
        }
      ]
    }
  ]
}
```
**Tests:**
- [ ] Only relevant conditional questions appear
- [ ] Switching answers updates conditional questions
- [ ] Previous conditional answers are cleared when condition changes
- [ ] Navigation skips irrelevant questions

### Scenario 3: Complex Nested Conditionals
```typescript
{
  wizardId: 'nested-conditionals',
  questions: [
    {
      id: 'has_pet',
      type: 'boolean',
      question: 'Do you have a pet?',
      conditionalQuestions: [
        {
          condition: { operator: 'equals', value: true },
          question: {
            id: 'pet_type',
            type: 'text',
            question: 'What type of pet?',
            options: [
              { label: 'Dog', value: 'dog' },
              { label: 'Cat', value: 'cat' },
              { label: 'Other', value: 'other' }
            ],
            conditionalQuestions: [
              {
                condition: { operator: 'equals', value: 'dog' },
                question: {
                  id: 'dog_breed',
                  type: 'text',
                  question: 'What breed?',
                  required: false
                }
              },
              {
                condition: { operator: 'equals', value: 'other' },
                question: {
                  id: 'pet_description',
                  type: 'text',
                  question: 'Please describe your pet',
                  required: true
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```
**Tests:**
- [ ] Nested conditionals appear correctly
- [ ] Deep nesting (3+ levels) works
- [ ] State management handles complex trees
- [ ] Navigation through nested branches works

### Scenario 4: Multiple Operators
```typescript
{
  wizardId: 'multiple-operators',
  questions: [
    {
      id: 'age',
      type: 'number',
      question: 'How old are you?',
      required: true,
      conditionalQuestions: [
        {
          condition: { operator: 'lessThan', value: 18 },
          question: {
            id: 'guardian',
            type: 'text',
            question: 'Guardian name?',
            required: true
          }
        },
        {
          condition: { operator: 'greaterThan', value: 65 },
          question: {
            id: 'senior_discount',
            type: 'boolean',
            question: 'Apply senior discount?',
            default: true
          }
        }
      ]
    },
    {
      id: 'interests',
      type: 'text',
      question: 'Select interests',
      options: [
        { label: 'Sports', value: 'sports' },
        { label: 'Music', value: 'music' },
        { label: 'Art', value: 'art' }
      ],
      conditionalQuestions: [
        {
          condition: { operator: 'in', value: ['sports', 'music'] },
          question: {
            id: 'activity_level',
            type: 'text',
            question: 'Activity level?',
            required: false
          }
        }
      ]
    }
  ]
}
```
**Tests:**
- [ ] `lessThan` operator works correctly
- [ ] `greaterThan` operator works correctly
- [ ] `in` operator with arrays works
- [ ] `contains` operator for string matching
- [ ] `notEquals` operator works

### Scenario 5: Validation Rules
```typescript
{
  wizardId: 'validation-test',
  questions: [
    {
      id: 'email',
      type: 'text',
      question: 'Email address?',
      required: true,
      validation: {
        pattern: '^[^@]+@[^@]+\\.[^@]+$',
        customMessage: 'Please enter a valid email'
      }
    },
    {
      id: 'password',
      type: 'text',
      question: 'Password?',
      required: true,
      validation: {
        minLength: 8,
        maxLength: 50,
        pattern: '^(?=.*[A-Z])(?=.*[0-9])',
        customMessage: 'Password must be 8+ chars with uppercase and number'
      }
    },
    {
      id: 'age',
      type: 'number',
      question: 'Age?',
      required: true,
      validation: {
        min: 13,
        max: 120,
        customMessage: 'Age must be between 13 and 120'
      }
    }
  ]
}
```
**Tests:**
- [ ] Email pattern validation
- [ ] Password complexity validation
- [ ] Min/max length validation
- [ ] Min/max number validation
- [ ] Custom error messages display
- [ ] Multiple validation rules on same field

### Scenario 6: Options and Defaults
```typescript
{
  wizardId: 'options-defaults',
  questions: [
    {
      id: 'country',
      type: 'text',
      question: 'Select country',
      required: true,
      options: [
        { label: 'USA', value: 'us' },
        { label: 'Canada', value: 'ca' },
        { label: 'UK', value: 'uk' }
      ],
      default: 'us'
    },
    {
      id: 'notifications',
      type: 'boolean',
      question: 'Enable notifications?',
      default: true
    }
  ]
}
```
**Tests:**
- [ ] Default values are pre-selected
- [ ] Options render correctly
- [ ] Option images display (if provided)
- [ ] Changing from default works
- [ ] Default values included in final answers

### Scenario 7: Edge Cases
```typescript
{
  wizardId: 'edge-cases',
  questions: [
    {
      id: 'empty_options',
      type: 'text',
      question: 'Question with no options',
      options: []
    },
    {
      id: 'long_text',
      type: 'text',
      question: 'Very long question text that should wrap properly and not break the layout even on small screens',
      validation: {
        maxLength: 1000
      }
    },
    {
      id: 'special_chars',
      type: 'text',
      question: 'Test special chars: <>&"\'',
      required: false
    }
  ]
}
```
**Tests:**
- [ ] Empty options array handled gracefully
- [ ] Long text wraps properly
- [ ] Special characters don't break rendering
- [ ] Unicode characters supported
- [ ] Very large numbers handled
- [ ] Empty string answers vs null/undefined

---

## Playwright Testing Plan (E2E Tests)

### Test Suite 1: Basic Wizard Flow
- [ ] **Test:** Complete simple wizard from start to finish
  - Launch wizard
  - Fill in all required fields
  - Navigate forward through all questions
  - Submit wizard
  - Verify completion event/callback

- [ ] **Test:** Cancel wizard mid-flow
  - Start wizard
  - Fill some fields
  - Click cancel
  - Verify cancel event/callback
  - Verify state is cleared

- [ ] **Test:** Navigate backward and forward
  - Fill in questions
  - Go back to previous questions
  - Verify answers are preserved
  - Change answers
  - Continue forward
  - Verify updated answers persist

### Test Suite 2: Validation & Error Handling
- [ ] **Test:** Required field validation
  - Try to proceed without filling required field
  - Verify error message appears
  - Verify cannot proceed
  - Fill field
  - Verify error clears
  - Verify can proceed

- [ ] **Test:** Pattern validation (email)
  - Enter invalid email format
  - Try to proceed
  - Verify error message
  - Enter valid email
  - Verify error clears

- [ ] **Test:** Number range validation
  - Enter number below minimum
  - Verify error
  - Enter number above maximum
  - Verify error
  - Enter valid number
  - Verify success

### Test Suite 3: Conditional Questions
- [ ] **Test:** Simple conditional appears/disappears
  - Answer question that triggers conditional
  - Verify conditional question appears
  - Change answer to not trigger conditional
  - Verify conditional question disappears

- [ ] **Test:** Nested conditionals
  - Navigate through nested conditional tree
  - Verify correct questions appear at each level
  - Go back and change parent answer
  - Verify child conditionals update correctly

- [ ] **Test:** Multiple conditionals from same question
  - Answer question with multiple conditional branches
  - Verify only relevant branch appears
  - Change answer to trigger different branch
  - Verify branches switch correctly

### Test Suite 4: Question Types
- [ ] **Test:** Text input
  - Enter text
  - Verify character count (if shown)
  - Test max length enforcement
  - Test special characters

- [ ] **Test:** Number input
  - Enter valid number
  - Try entering non-numeric characters
  - Test increment/decrement buttons (if present)
  - Test decimal numbers

- [ ] **Test:** Boolean (checkbox/toggle)
  - Click to toggle on
  - Click to toggle off
  - Verify state changes
  - Test default values

- [ ] **Test:** Select/dropdown
  - Open dropdown
  - Select option
  - Verify selection displays
  - Change selection

- [ ] **Test:** Radio buttons
  - Select first option
  - Select different option
  - Verify only one selected
  - Verify cannot deselect all (if required)

- [ ] **Test:** Options with images
  - Verify images load
  - Click on image to select
  - Verify selection works

### Test Suite 5: Progress & Navigation
- [ ] **Test:** Progress indicator
  - Verify progress shows current step
  - Verify progress updates as user advances
  - Verify progress accurate with conditional questions

- [ ] **Test:** Navigation buttons
  - Verify "Next" button state (enabled/disabled)
  - Verify "Previous" button state
  - Verify "Submit" button appears on last question
  - Test keyboard navigation (Enter, Tab)

### Test Suite 6: State Persistence
- [ ] **Test:** Browser refresh preserves state
  - Fill in some questions
  - Refresh page
  - Verify answers are preserved
  - Verify current question position preserved

- [ ] **Test:** Multiple wizard instances
  - Open two different wizards
  - Fill in both
  - Verify states don't interfere
  - Verify each completes independently

### Test Suite 7: Accessibility
- [ ] **Test:** Keyboard navigation
  - Tab through all form elements
  - Use Enter to submit
  - Use Escape to cancel (if supported)
  - Verify focus indicators visible

- [ ] **Test:** Screen reader support
  - Verify labels associated with inputs
  - Verify error messages announced
  - Verify progress announced
  - Test with actual screen reader (if possible)

- [ ] **Test:** ARIA attributes
  - Verify proper ARIA labels
  - Verify ARIA-required on required fields
  - Verify ARIA-invalid on validation errors
  - Verify ARIA-describedby for help text

### Test Suite 8: Responsive Design
- [ ] **Test:** Mobile viewport
  - Test on 375px width (iPhone SE)
  - Verify layout doesn't break
  - Verify buttons accessible
  - Verify text readable

- [ ] **Test:** Tablet viewport
  - Test on 768px width (iPad)
  - Verify optimal layout
  - Test touch interactions

- [ ] **Test:** Desktop viewport
  - Test on 1920px width
  - Verify layout scales appropriately
  - Test mouse interactions

### Test Suite 9: Performance
- [ ] **Test:** Large wizard (50+ questions)
  - Create wizard with many questions
  - Verify smooth navigation
  - Verify no lag in rendering
  - Verify memory usage reasonable

- [ ] **Test:** Complex conditionals
  - Create deeply nested conditionals
  - Verify evaluation performance
  - Verify no UI freezing

### Test Suite 10: Error Scenarios
- [ ] **Test:** Invalid configuration
  - Pass malformed config
  - Verify graceful error handling
  - Verify user-friendly error message

- [ ] **Test:** Network errors (if applicable)
  - Simulate network failure during submission
  - Verify error handling
  - Verify retry mechanism (if exists)

- [ ] **Test:** Browser compatibility
  - Test in Chrome
  - Test in Firefox
  - Test in Safari
  - Test in Edge

---

## Test Data Fixtures

Create reusable test fixtures in `src/__tests__/fixtures/`:

### `simple-wizard.json`
Basic linear wizard for quick tests

### `conditional-wizard.json`
Wizard with various conditional scenarios

### `validation-wizard.json`
Wizard with all validation types

### `complex-wizard.json`
Large wizard with nested conditionals and all question types

### `edge-cases-wizard.json`
Wizard testing edge cases and error conditions

---

## Coverage Goals

- **Unit Tests:** 90%+ code coverage
- **Integration Tests:** All component interactions
- **E2E Tests:** All critical user paths
- **Accessibility:** WCAG 2.1 AA compliance

---

## Test Execution Strategy

### Development
```bash
# Run unit tests in watch mode
npm run test:unit -- --watch

# Run specific test file
npm run test:unit wizard-engine.spec.ts

# Run with coverage
npm run test:unit -- --coverage
```

### CI/CD Pipeline
```bash
# Run all unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run E2E tests in CI mode
npm run test:e2e:ci
```

### Pre-commit
- Run unit tests for changed files
- Run linting
- Run type checking

### Pre-push
- Run full unit test suite
- Run critical E2E tests

---

## Maintenance

- Review and update tests when adding new features
- Keep test data fixtures up to date
- Monitor test execution time and optimize slow tests
- Regularly review coverage reports
- Update accessibility tests as standards evolve

---

## Notes

- All tests should be independent and not rely on execution order
- Use meaningful test descriptions that explain what is being tested
- Mock external dependencies appropriately
- Clean up state between tests
- Use data-testid attributes for E2E test selectors
- Document any test-specific configuration or setup