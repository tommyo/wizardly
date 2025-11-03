# Nested Boolean Questions Feature

## Overview

The wizard now supports **nested boolean questions with children** at any depth. When a boolean question has conditional children, toggling it will immediately show/hide those children without requiring a "Next" button click.

## How It Works

### User Experience

When a user encounters a boolean question with children:

1. **Toggle to Yes** → Child questions appear immediately below the parent
2. **Toggle to No** → Child questions disappear
3. **Parent stays visible** → The boolean toggle remains on screen while children are shown
4. **Nested booleans** → Each boolean with children behaves the same way, regardless of depth
5. **Answer all together** → Click "Next" to save all visible answers at once

### Example Structure

```json
{
  "id": "q1",
  "type": "boolean",
  "question": "Is religion important to you?",
  "conditionalQuestions": [
    {
      "condition": { "operator": "equals", "value": true },
      "question": {
        "id": "q1a",
        "type": "boolean",
        "question": "Is it important that religion is important to your match?",
        "conditionalQuestions": [
          {
            "condition": { "operator": "equals", "value": true },
            "question": {
              "id": "q1a1",
              "type": "text",
              "question": "What religion?"
            }
          }
        ]
      }
    }
  ]
}
```

### User Flow

1. User sees: "Is religion important to you?" with a toggle (q1)
2. User toggles q1 to **Yes**
3. **q1 stays visible** and "Is it important that religion is important to your match?" appears below (q1a)
4. User toggles q1a to **Yes**
5. **Both q1 and q1a stay visible** and "What religion?" text input appears below (q1a1)
6. User can see all three questions at once: q1 (toggle), q1a (toggle), q1a1 (text)
7. User can toggle any boolean off to hide its children
8. Click "Next" to save all visible answers and move to the next top-level question

## Implementation Details

### Engine (`wizard-engine.ts`)

The engine includes unanswered boolean questions with children in the flattened questions list:

```typescript
if (answer !== undefined) {
  if (evaluateCondition(conditional.condition, answer)) {
    processQuestion(conditional.question, q.id);
  }
} else if (q.type === 'boolean') {
  // Include children even when unanswered
  processQuestion(conditional.question, q.id);
}
```

This allows the component to show/hide children dynamically based on the toggle state.

### Component (`WizardComponent.vue`)

The component renders **all visible questions simultaneously** based on boolean toggle states:

```typescript
// Get visible questions based on boolean toggle states
const visibleQuestions = computed(() => {
  const visible: Array<{ question: Question; index: number }> = [];
  
  currentQuestions.value.forEach((q, index) => {
    const fq = q as FlattenedQuestion;
    
    // Always show questions without a parent
    if (!fq.conditionalParent) {
      visible.push({ question: q, index });
      return;
    }
    
    // For questions with a parent, check if parent is answered true
    const parentIndex = currentQuestions.value.findIndex(pq => pq.id === fq.conditionalParent);
    if (parentIndex >= 0 && answers.value[parentIndex] === true) {
      visible.push({ question: q, index });
    }
  });
  
  return visible;
});
```

The template renders all visible questions:
```vue
<div v-for="{ question, index } in visibleQuestions" :key="question.id">
  <!-- Render question based on type -->
</div>
```

When a boolean is toggled:
- **Yes** → Children become visible (added to `visibleQuestions`)
- **No** → Children become hidden (removed from `visibleQuestions`)
- **Parent stays visible** → Boolean toggle remains on screen

### Navigation Logic

The "Next" button saves all visible answers and proceeds:

```typescript
const next = () => {
  // Save answers and check if validation passed
  const isValid = saveAnswers();

  if (!isValid) {
    return; // Don't proceed if validation failed
  }

  answers.value = [];

  if (isComplete) {
    const result = wizard.complete();
    emit('complete', result.answersObject, result.answers);
  }
};
```

**Key Points:**
- All visible questions are saved together
- Validation applies to all visible questions
- No need to navigate between siblings - they're all visible

## Benefits

### 1. **Intuitive UX**
- Users see the impact of their boolean choices immediately
- Parent questions stay visible for easy toggling
- All related questions visible together

### 2. **Flexible Nesting**
Supports any depth of boolean nesting:
- Boolean → Boolean → Boolean → Text
- Boolean → Text
- Boolean → Multiple Choice → Text

### 3. **Consistent Behavior**
All boolean questions with children behave the same way, regardless of nesting level

### 4. **Efficient Data Entry**
- Users can toggle booleans on/off to explore different paths
- See all related questions at once
- Answer everything before clicking "Next"

### 5. **Visual Hierarchy**
Questions are stacked vertically showing the parent-child relationship clearly

## Edge Cases Handled

### 1. **Boolean Without Children**
Regular toggle behavior - answer is saved when "Next" is clicked

### 2. **Non-Boolean Conditional Questions**
Standard behavior - must answer and click "Next" to see children

### 3. **Mixed Question Types**
Boolean with children can have any question type as children (text, multiple-choice, etc.)

### 4. **Validation**
All answers (including boolean toggles) are validated when "Next" is clicked

## Testing

All existing tests pass (282 tests), confirming:
- ✅ Engine correctly flattens nested boolean questions
- ✅ Component correctly detects boolean-with-children
- ✅ Navigation works correctly through nested structures
- ✅ Validation applies to all question types
- ✅ State management handles nested answers

## Migration Notes

### From Previous Version

If you were using the old behavior where only top-level booleans had special handling:

**No changes needed!** The new implementation is backward compatible. Top-level booleans work exactly as before, and nested booleans now have the same intuitive behavior.

### JSON Structure

Ensure your `conditionalQuestions` array is placed **inside the question object**, not at the `ConditionalQuestion` level:

**✅ Correct:**
```json
{
  "question": {
    "id": "q1a",
    "type": "boolean",
    "conditionalQuestions": [...]  // Inside question
  }
}
```

**❌ Incorrect:**
```json
{
  "question": {
    "id": "q1a",
    "type": "boolean"
  },
  "conditionalQuestions": [...]  // Outside question - WRONG!
}
```

## Future Enhancements

Potential improvements:
1. **Visual indicators** - Show which boolean questions have children
2. **Collapse/expand** - Allow users to collapse answered boolean sections
3. **Progress tracking** - Show progress through nested question trees
4. **Keyboard navigation** - Tab through boolean toggles and children

## Related Files

- [`src/wizard-engine.ts`](src/wizard-engine.ts) - Engine logic for flattening questions
- [`src/components/WizardComponent.vue`](src/components/WizardComponent.vue) - Component UI logic
- [`example.json`](example.json) - Example with nested booleans
- [`src/types.ts`](src/types.ts) - Type definitions