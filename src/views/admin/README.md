# Questionnaire Editor - Admin Interface

A powerful, user-friendly admin interface for creating and managing wizard questionnaires with drag-and-drop functionality, live preview, and comprehensive question editing.

## Features

### Core Functionality
- ✅ **Visual Question Builder** - Create questions with an intuitive form-based interface
- ✅ **Drag & Drop Reordering** - Easily reorder questions by dragging
- ✅ **Live Preview** - See how your questionnaire will look to users in real-time
- ✅ **Question Types** - Support for all 7 question types (boolean, multiple-choice, text, number, number-range, date, date-range)
- ✅ **Conditional Logic** - Add follow-up questions based on previous answers
- ✅ **Validation Rules** - Configure min/max, patterns, date constraints, and custom error messages
- ✅ **Import/Export** - Save and load questionnaires as JSON files
- ✅ **Duplicate Questions** - Clone existing questions to save time

### User Experience
- **Three-Panel Layout**: Questions list, editor, and optional preview
- **Question Management**: Add, edit, duplicate, delete, and reorder questions
- **Inline Editing**: Edit wizard title and description directly
- **Visual Feedback**: Active question highlighting, drag indicators, badges for required/conditional questions
- **Empty States**: Helpful prompts when no questions exist

## Usage

### Basic Setup

```vue
<script setup>
import QuestionnaireEditor from './QuestionnaireEditor.vue';

function handleSave(config) {
  console.log('Saving questionnaire:', config);
  // Save to your backend
  await fetch('/api/questionnaires', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
}

function handleCancel() {
  // Handle cancellation
  router.push('/questionnaires');
}
</script>

<template>
  <QuestionnaireEditor
    @save="handleSave"
    @cancel="handleCancel"
  />
</template>
```

### Editing Existing Questionnaire

```vue
<script setup>
import { ref, onMounted } from 'vue';
import QuestionnaireEditor from './QuestionnaireEditor.vue';

const questionnaire = ref(null);

onMounted(async () => {
  // Load existing questionnaire
  const response = await fetch('/api/questionnaires/123');
  questionnaire.value = await response.json();
});

function handleSave(config) {
  // Update existing questionnaire
  await fetch(`/api/questionnaires/${config.wizardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
}
</script>

<template>
  <QuestionnaireEditor
    v-if="questionnaire"
    :initial-config="questionnaire"
    @save="handleSave"
    @cancel="handleCancel"
  />
</template>
```

## Component API

### Props

```typescript
interface Props {
  initialConfig?: WizardConfig;  // Optional config to edit existing questionnaire
}
```

### Events

```typescript
interface Events {
  save: (config: WizardConfig) => void;    // Emitted when user clicks Save
  cancel: () => void;                       // Emitted when user clicks Cancel
}
```

## Editor Features

### Question Configuration

Each question can be configured with:

**Basic Settings:**
- Question type (dropdown with icons)
- Question text
- Help text (optional guidance for users)
- Required toggle

**Multiple Choice Options:**
- Add/remove options
- Configure option values and labels
- Allow single or multiple selections

**Validation Rules:**

*Text Questions:*
- Minimum length
- Maximum length
- Regex pattern
- Custom error message

*Number Questions:*
- Minimum value
- Maximum value
- Custom error message

*Date Questions:*
- Minimum date (accepts ISO format or "today")
- Maximum date
- Custom error message

### Conditional Logic

Add follow-up questions that appear based on answers:

1. Click "Add Follow-up Question"
2. Configure when it should appear:
   - **Equals** - Answer matches exact value
   - **Contains** - Answer includes value (for multi-select)
   - **Greater Than** - Numeric comparison
   - **Less Than** - Numeric comparison
   - **Between** - Value within range
3. Configure the follow-up question (type, text, validation)

### Preview Panel

Toggle the preview panel to see:
- How questions will appear to users
- Question numbers and order
- Required indicators
- Help text display
- Multiple choice options
- Conditional question indicators

## API Integration

### Placeholder Functions

The editor includes placeholder functions for API integration:

```typescript
// Load existing questionnaire
function loadQuestionnaire(id: string) {
  console.log('Load questionnaire:', id);
  // TODO: Implement API call
  // const response = await fetch(`/api/questionnaires/${id}`);
  // config.value = await response.json();
}

// Save questionnaire
function saveQuestionnaire() {
  console.log('Save questionnaire:', config.value);
  // TODO: Implement API call
  // await fetch('/api/questionnaires', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(config.value)
  // });
  handleSave();
}
```

### Recommended API Endpoints

```
POST   /api/questionnaires        Create new questionnaire
GET    /api/questionnaires        List all questionnaires
GET    /api/questionnaires/:id    Get specific questionnaire
PUT    /api/questionnaires/:id    Update questionnaire
DELETE /api/questionnaires/:id    Delete questionnaire
```

### Example API Response

```json
{
  "wizardId": "employee-onboarding",
  "title": "Employee Onboarding Survey",
  "description": "Help us understand your needs",
  "questions": [
    {
      "id": "q1",
      "type": "text",
      "question": "What is your full name?",
      "required": true,
      "validation": {
        "minLength": 2,
        "maxLength": 100
      }
    }
  ]
}
```

## Advanced Usage

### Custom Question Types

To add support for additional question types:

1. Add the type to `questionTypes` array:
```typescript
const questionTypes = [
  // ... existing types
  { value: 'custom-type', label: 'Custom Type', icon: '🎨' }
];
```

2. Add validation logic in the editor if needed
3. Update the main wizard component to render the new type

### Validation Extensions

Add custom validation rules:

```typescript
function ensureValidation(question: Question) {
  if (!question.validation) {
    question.validation = {};
  }
  // Add custom validation properties
  if (!question.validation.customRule) {
    question.validation.customRule = '';
  }
}
```

### Styling Customization

The editor uses scoped styles that can be customized via CSS variables:

```css
.admin-container {
  --primary-color: #3498db;
  --secondary-color: #ecf0f1;
  --danger-color: #e74c3c;
  --text-color: #2c3e50;
  --border-color: #e1e4e8;
}
```

## Keyboard Shortcuts

The editor is fully keyboard accessible:

- **Tab** - Navigate between fields
- **Enter** - Confirm actions
- **Escape** - Close modals/cancel actions
- **Ctrl/Cmd + S** - Save (can be implemented)

## Accessibility Features

- Semantic HTML structure
- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Best Practices

### Question Design
1. Keep questions clear and concise
2. Use help text for additional context
3. Mark required questions appropriately
4. Group related questions together
5. Use conditional logic to reduce form length

### Validation
1. Set reasonable min/max constraints
2. Provide clear custom error messages
3. Test validation rules with edge cases
4. Use pattern validation for structured data (emails, phone numbers)

### Organization
1. Order questions logically (basic info first)
2. Use descriptive question IDs for debugging
3. Group conditional questions with their parent
4. Test the user flow in preview mode

## Troubleshooting

**Questions not saving:**
- Check that `@save` event handler is properly connected
- Verify API endpoint is correct
- Check browser console for errors

**Conditional questions not showing:**
- Ensure condition operator matches question type
- Verify condition value format
- Check that parent question has an answer

**Drag and drop not working:**
- Ensure questions have unique IDs
- Check that `draggable="true"` attribute is present
- Verify drag event handlers are connected

## Examples

See `AdminApp.vue` for a complete example including:
- Questionnaire listing
- Create/edit/delete operations
- Import/export functionality
- API integration placeholders
- Empty states and loading states

## Future Enhancements

Potential features for future versions:
- [ ] Question templates/library
- [ ] Version history and rollback
- [ ] Collaborative editing
- [ ] Question bank and reuse
- [ ] Analytics integration
- [ ] A/B testing support
- [ ] Localization/translations
- [ ] Advanced branching logic (skip to question X)
- [ ] Question groups/sections
- [ ] Custom themes

## License

MIT
