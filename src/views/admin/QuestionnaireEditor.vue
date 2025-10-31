<script setup lang="ts">
import { ref, computed } from 'vue';
import type { WizardConfig, Question, ConditionalQuestion } from '../../types';

// Props
const props = defineProps<{
  initialConfig?: WizardConfig;
}>();

// Emits
const emit = defineEmits<{
  save: [config: WizardConfig];
  cancel: [];
}>();

// State
const config = ref<WizardConfig>(props.initialConfig || {
  wizardId: generateId(),
  title: 'New Wizard',
  description: '',
  questions: [],
});

const selectedQuestionId = ref<string | null>(null);
const showPreview = ref(false);
const draggedQuestionIndex = ref<number | null>(null);

// Computed
const selectedQuestion = computed(() => {
  if (!selectedQuestionId.value) return null;
  return findQuestionById(config.value.questions, selectedQuestionId.value);
});

const questionTypes = [
  { value: 'boolean', label: 'Yes/No (Toggle)', icon: '🔘' },
  { value: 'multiple-choice', label: 'Multiple Choice', icon: '📋' },
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'number-range', label: 'Number Range', icon: '↔️' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'date-range', label: 'Date Range', icon: '📆' },
];

const conditionOperators = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'between', label: 'Between' },
];

// Utility Functions
function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function findQuestionById(questions: Question[], id: string): Question | null {
  for (const q of questions) {
    if (q.id === id) return q;
    if (q.conditionalQuestions) {
      for (const cq of q.conditionalQuestions) {
        const found = findQuestionById([cq.question], id);
        if (found) return found;
      }
    }
  }
  return null;
}

// Question Management
function addQuestion() {
  const newQuestion: Question = {
    id: generateId(),
    type: 'text',
    question: 'New Question',
    required: false,
  };
  config.value.questions.push(newQuestion);
  selectedQuestionId.value = newQuestion.id;
}

function duplicateQuestion(question: Question) {
  const duplicate = JSON.parse(JSON.stringify(question));
  duplicate.id = generateId();
  duplicate.question = `${duplicate.question} (Copy)`;

  const index = config.value.questions.findIndex(q => q.id === question.id);
  config.value.questions.splice(index + 1, 0, duplicate);
  selectedQuestionId.value = duplicate.id;
}

function deleteQuestion(questionId: string) {
  if (confirm('Are you sure you want to delete this question?')) {
    config.value.questions = config.value.questions.filter(q => q.id !== questionId);
    if (selectedQuestionId.value === questionId) {
      selectedQuestionId.value = null;
    }
  }
}

function moveQuestion(fromIndex: number, toIndex: number) {
  const questions = [...config.value.questions];
  const [removed] = questions.splice(fromIndex, 1);
  if (removed) {
    questions.splice(toIndex, 0, removed);
    config.value.questions = questions;
  }
}
// Options Management (for multiple-choice)
function addOption(question: Question) {
  if (!question.options) {
    question.options = [];
  }
  question.options.push({
    value: `option_${question.options.length + 1}`,
    label: `Option ${question.options.length + 1}`,
  });
}

function removeOption(question: Question, index: number) {
  if (question.options) {
    question.options.splice(index, 1);
  }
}

// Conditional Questions
function addConditionalQuestion(question: Question) {
  if (!question.conditionalQuestions) {
    question.conditionalQuestions = [];
  }

  const newConditional: ConditionalQuestion = {
    condition: {
      operator: 'equals',
      value: true,
    },
    question: {
      id: generateId(),
      type: 'text',
      question: 'Follow-up Question',
      required: false,
    },
  };

  question.conditionalQuestions.push(newConditional);
}

function removeConditionalQuestion(question: Question, index: number) {
  if (question.conditionalQuestions) {
    question.conditionalQuestions.splice(index, 1);
  }
}

// Validation
function ensureValidation(question: Question) {
  if (!question.validation) {
    question.validation = {};
  }
}

// Drag and Drop
function handleDragStart(index: number) {
  draggedQuestionIndex.value = index;
}

function handleDragOver(event: DragEvent, index: number) {
  event.preventDefault();
  if (draggedQuestionIndex.value !== null && draggedQuestionIndex.value !== index) {
    moveQuestion(draggedQuestionIndex.value, index);
    draggedQuestionIndex.value = index;
  }
}

function handleDragEnd() {
  draggedQuestionIndex.value = null;
}

// Actions
function handleSave() {
  emit('save', config.value);
}

function handleCancel() {
  emit('cancel');
}

function handleExport() {
  const json = JSON.stringify(config.value, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.value.wizardId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleImport(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target?.result as string);
      config.value = imported;
      selectedQuestionId.value = null;
    } catch {
      alert('Invalid JSON file');
    }
  };
  reader.readAsText(file);
}

// Placeholder functions for loading/saving
// function loadQuestionnaire(id: string) {
//   console.log('Load questionnaire:', id);
//   // TODO: Implement API call to load questionnaire
//   // const response = await fetch(`/api/questionnaires/${id}`);
//   // config.value = await response.json();
// }

function saveQuestionnaire() {
  // console.log('Save questionnaire:', config.value)
  // TODO: Implement API call to save questionnaire
  // await fetch('/api/questionnaires', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(config.value)
  // });
  handleSave();
}
</script>

<template>
  <div class="admin-container">
    <!-- Header -->
    <div class="admin-header">
      <div class="header-left">
        <h1>Questionnaire Editor</h1>
        <input v-model="config.title"
               type="text"
               class="title-input"
               placeholder="Wizard Title" />
      </div>
      <div class="header-actions">
        <button @click="showPreview = !showPreview" class="btn btn-secondary">
          {{ showPreview ? 'Hide' : 'Show' }} Preview
        </button>
        <label class="btn btn-secondary">
          Import
          <input type="file"
                 accept=".json"
                 @change="handleImport"
                 style="display: none" />
        </label>
        <button @click="handleExport" class="btn btn-secondary">
          Export
        </button>
        <button @click="saveQuestionnaire" class="btn btn-primary">
          Save
        </button>
        <button @click="handleCancel" class="btn btn-text">
          Cancel
        </button>
      </div>
    </div>

    <!-- Description -->
    <div class="description-section">
      <textarea v-model="config.description"
                class="description-input"
                placeholder="Wizard Description (optional)"
                rows="2"></textarea>
    </div>

    <div class="admin-body">
      <!-- Questions List -->
      <div class="questions-panel">
        <div class="panel-header">
          <h2>Questions ({{ config.questions.length }})</h2>
          <button @click="addQuestion" class="btn btn-small btn-primary">
            + Add Question
          </button>
        </div>

        <div class="questions-list">
          <div v-for="(question, index) in config.questions"
               :key="question.id"
               class="question-item"
               :class="{ 'active': selectedQuestionId === question.id }"
               draggable="true"
               @dragstart="handleDragStart(index)"
               @dragover="handleDragOver($event, index)"
               @dragend="handleDragEnd"
               @click="selectedQuestionId = question.id">
            <div class="question-handle">☰</div>
            <div class="question-info">
              <div class="question-number">Q{{ index + 1 }}</div>
              <div class="question-text">{{ question.question }}</div>
              <div class="question-meta">
                <span class="question-type">{{ question.type }}</span>
                <span v-if="question.required" class="question-badge">Required</span>
                <span v-if="question.conditionalQuestions?.length" class="question-badge">
                  Has Follow-ups
                </span>
              </div>
            </div>
            <div class="question-actions">
              <button @click.stop="duplicateQuestion(question)" class="action-btn" title="Duplicate">
                📋
              </button>
              <button @click.stop="deleteQuestion(question.id)" class="action-btn" title="Delete">
                🗑️
              </button>
            </div>
          </div>

          <div v-if="config.questions.length === 0" class="empty-state">
            <p>No questions yet</p>
            <button @click="addQuestion" class="btn btn-primary">
              Add Your First Question
            </button>
          </div>
        </div>
      </div>

      <!-- Question Editor -->
      <div class="editor-panel">
        <div v-if="selectedQuestion" class="editor-content">
          <h2>Edit Question</h2>

          <!-- Basic Settings -->
          <div class="form-section">
            <h3>Basic Settings</h3>

            <div class="form-group">
              <label>Question Type</label>
              <select v-model="selectedQuestion.type" class="form-control">
                <option v-for="type in questionTypes" :key="type.value" :value="type.value">
                  {{ type.icon }} {{ type.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Question Text *</label>
              <input v-model="selectedQuestion.question"
                     type="text"
                     class="form-control"
                     placeholder="Enter your question" />
            </div>

            <div class="form-group">
              <label>Help Text</label>
              <input v-model="selectedQuestion.helpText"
                     type="text"
                     class="form-control"
                     placeholder="Optional help text to guide the user" />
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="selectedQuestion.required" />
                <span>Required Question</span>
              </label>
            </div>
          </div>

          <!-- Multiple Choice Options -->
          <div v-if="selectedQuestion.type === 'multiple-choice'" class="form-section">
            <h3>Options</h3>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="selectedQuestion.allowMultiple" />
                <span>Allow Multiple Selections</span>
              </label>
            </div>

            <div class="options-list">
              <div v-for="(option, index) in selectedQuestion.options" :key="index" class="option-item">
                <span class="option-number">{{ index + 1 }}</span>
                <input v-model="option.value"
                       type="text"
                       class="form-control option-value"
                       placeholder="Value" />
                <input v-model="option.label"
                       type="text"
                       class="form-control option-label"
                       placeholder="Label" />
                <button @click="removeOption(selectedQuestion, index)" class="btn btn-small btn-danger">
                  Remove
                </button>
              </div>
            </div>

            <button @click="addOption(selectedQuestion)" class="btn btn-secondary">
              + Add Option
            </button>
          </div>

          <!-- Validation -->
          <div class="form-section">
            <h3>Validation</h3>

            <!-- Text Validation -->
            <div v-if="selectedQuestion.type === 'text'">
              <div class="form-group">
                <label>Minimum Length</label>
                <input v-model.number="selectedQuestion.validation!.minLength"
                       type="number"
                       class="form-control"
                       placeholder="Minimum characters"
                       @focus="ensureValidation(selectedQuestion)" />
              </div>
              <div class="form-group">
                <label>Maximum Length</label>
                <input v-model.number="selectedQuestion.validation!.maxLength"
                       type="number"
                       class="form-control"
                       placeholder="Maximum characters"
                       @focus="ensureValidation(selectedQuestion)" />
              </div>
              <div class="form-group">
                <label>Pattern (Regex)</label>
                <input v-model="selectedQuestion.validation!.pattern"
                       type="text"
                       class="form-control"
                       placeholder="e.g., ^[A-Za-z]+$"
                       @focus="ensureValidation(selectedQuestion)" />
              </div>
            </div>

            <!-- Number Validation -->
            <div v-if="selectedQuestion.type === 'number' || selectedQuestion.type === 'number-range'">
              <div class="form-group">
                <label>Minimum Value</label>
                <input v-model.number="selectedQuestion.validation!.min"
                       type="number"
                       class="form-control"
                       @focus="ensureValidation(selectedQuestion)" />
              </div>
              <div class="form-group">
                <label>Maximum Value</label>
                <input v-model.number="selectedQuestion.validation!.max"
                       type="number"
                       class="form-control"
                       @focus="ensureValidation(selectedQuestion)" />
              </div>
            </div>

            <!-- Date Validation -->
            <div v-if="selectedQuestion.type === 'date' || selectedQuestion.type === 'date-range'">
              <div class="form-group">
                <label>Minimum Date</label>
                <input v-model="selectedQuestion.validation!.minDate"
                       type="text"
                       class="form-control"
                       placeholder="YYYY-MM-DD or 'today'"
                       @focus="ensureValidation(selectedQuestion)" />
              </div>
              <div class="form-group">
                <label>Maximum Date</label>
                <input v-model="selectedQuestion.validation!.maxDate"
                       type="text"
                       class="form-control"
                       placeholder="YYYY-MM-DD or 'today'"
                       @focus="ensureValidation(selectedQuestion)" />
              </div>
            </div>

            <!-- Custom Message -->
            <div class="form-group">
              <label>Custom Error Message</label>
              <input v-model="selectedQuestion.validation!.customMessage"
                     type="text"
                     class="form-control"
                     placeholder="Custom validation error message"
                     @focus="ensureValidation(selectedQuestion)" />
            </div>
          </div>

          <!-- Conditional Questions -->
          <div class="form-section">
            <h3>Follow-up Questions</h3>
            <p class="section-description">
              Add questions that appear based on the answer to this question
            </p>

            <div v-for="(conditional, index) in selectedQuestion.conditionalQuestions"
                 :key="index"
                 class="conditional-item">
              <div class="conditional-header">
                <h4>Follow-up {{ index + 1 }}</h4>
                <button @click="removeConditionalQuestion(selectedQuestion, index)" class="btn btn-small btn-danger">
                  Remove
                </button>
              </div>

              <div class="form-group">
                <label>Show When</label>
                <div class="condition-builder">
                  <select v-model="conditional.condition.operator" class="form-control">
                    <option v-for="op in conditionOperators" :key="op.value" :value="op.value">
                      {{ op.label }}
                    </option>
                  </select>
                  <input v-model="conditional.condition.value"
                         type="text"
                         class="form-control"
                         placeholder="Value to match" />
                </div>
              </div>

              <div class="form-group">
                <label>Follow-up Question</label>
                <input v-model="conditional.question.question"
                       type="text"
                       class="form-control"
                       placeholder="Question text" />
              </div>

              <div class="form-group">
                <label>Type</label>
                <select v-model="conditional.question.type" class="form-control">
                  <option v-for="type in questionTypes" :key="type.value" :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
              </div>
            </div>

            <button @click="addConditionalQuestion(selectedQuestion)" class="btn btn-secondary">
              + Add Follow-up Question
            </button>
          </div>
        </div>

        <div v-else class="empty-editor">
          <div class="empty-icon">📝</div>
          <h3>No Question Selected</h3>
          <p>Select a question from the list to edit it, or add a new question to get started.</p>
        </div>
      </div>

      <!-- Preview Panel -->
      <div v-if="showPreview" class="preview-panel">
        <div class="panel-header">
          <h2>Preview</h2>
          <button @click="showPreview = false" class="btn btn-text">✕</button>
        </div>
        <div class="preview-content">
          <div class="preview-wizard">
            <h3>{{ config.title }}</h3>
            <p v-if="config.description">{{ config.description }}</p>

            <div class="preview-questions">
              <div v-for="(question, index) in config.questions" :key="question.id" class="preview-question">
                <div class="preview-question-header">
                  <span class="preview-number">{{ index + 1 }}</span>
                  <span class="preview-text">{{ question.question }}</span>
                  <span v-if="question.required" class="preview-required">*</span>
                </div>
                <p v-if="question.helpText" class="preview-help">{{ question.helpText }}</p>
                <div class="preview-type">Type: {{ question.type }}</div>

                <!-- Show options for multiple choice -->
                <div v-if="question.options" class="preview-options">
                  <div v-for="option in question.options" :key="option.value" class="preview-option">
                    ○ {{ option.label }}
                  </div>
                </div>

                <!-- Show conditional questions -->
                <div v-if="question.conditionalQuestions?.length" class="preview-conditionals">
                  <div class="preview-conditional-note">
                    ↳ {{ question.conditionalQuestions.length }} follow-up question(s)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.admin-header {
  background: white;
  border-bottom: 1px solid #e1e4e8;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-left h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.title-input {
  font-size: 1.25rem;
  font-weight: 600;
  border: 2px solid transparent;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.title-input:hover {
  border-color: #e1e4e8;
}

.title-input:focus {
  outline: none;
  border-color: #3498db;
  background-color: #f8f9fa;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.description-section {
  background: white;
  border-bottom: 1px solid #e1e4e8;
  padding: 0 2rem 1rem;
}

.description-input {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #e1e4e8;
  border-radius: 4px;
  font-size: 0.9rem;
  resize: vertical;
}

.description-input:focus {
  outline: none;
  border-color: #3498db;
}

.admin-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Questions Panel */
.questions-panel {
  width: 350px;
  background: white;
  border-right: 1px solid #e1e4e8;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #e1e4e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.questions-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.question-item {
  background: #f8f9fa;
  border: 2px solid #e1e4e8;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  display: flex;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.question-item:hover {
  border-color: #3498db;
  background: #fff;
}

.question-item.active {
  border-color: #3498db;
  background: #e3f2fd;
}

.question-handle {
  cursor: grab;
  color: #7f8c8d;
  user-select: none;
}

.question-handle:active {
  cursor: grabbing;
}

.question-info {
  flex: 1;
  min-width: 0;
}

.question-number {
  font-size: 0.75rem;
  font-weight: 700;
  color: #3498db;
  margin-bottom: 0.25rem;
}

.question-text {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.question-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.question-type {
  font-size: 0.75rem;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
}

.question-badge {
  font-size: 0.75rem;
  color: #3498db;
  background: #e3f2fd;
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
}

.question-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 1;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #7f8c8d;
}

/* Editor Panel */
.editor-panel {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.editor-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.form-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e1e4e8;
}

.form-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
  margin-top: 0;
}

.section-description {
  font-size: 0.875rem;
  color: #7f8c8d;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #e1e4e8;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

/* Options */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.option-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.option-number {
  font-size: 0.875rem;
  font-weight: 600;
  color: #7f8c8d;
  min-width: 1.5rem;
}

.option-value {
  flex: 1;
}

.option-label {
  flex: 2;
}

/* Conditional Questions */
.conditional-item {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e1e4e8;
}

.conditional-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.conditional-header h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.condition-builder {
  display: flex;
  gap: 0.5rem;
}

.condition-builder select {
  flex: 1;
}

.condition-builder input {
  flex: 2;
}

/* Empty Editor */
.empty-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #7f8c8d;
  text-align: center;
  padding: 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-editor h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* Preview Panel */
.preview-panel {
  width: 400px;
  background: white;
  border-left: 1px solid #e1e4e8;
  display: flex;
  flex-direction: column;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.preview-wizard h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.preview-wizard>p {
  color: #7f8c8d;
  margin-bottom: 1.5rem;
}

.preview-questions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-question {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid #e1e4e8;
}

.preview-question-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.preview-number {
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  background: #3498db;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-text {
  flex: 1;
  font-weight: 500;
  color: #2c3e50;
}

.preview-required {
  color: #e74c3c;
  font-weight: bold;
}

.preview-help {
  font-size: 0.875rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
}

.preview-type {
  font-size: 0.75rem;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  display: inline-block;
}

.preview-options {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.preview-option {
  font-size: 0.875rem;
  color: #2c3e50;
}

.preview-conditionals {
  margin-top: 0.5rem;
}

.preview-conditional-note {
  font-size: 0.75rem;
  color: #3498db;
  font-style: italic;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover {
  background-color: #d5dbdb;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.btn-text {
  background: none;
  color: #7f8c8d;
}

.btn-text:hover {
  color: #2c3e50;
}

.btn-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
</style>
