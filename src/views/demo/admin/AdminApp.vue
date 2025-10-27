<script setup lang="ts">
import { ref } from 'vue';
import QuestionnaireEditor from '../../admin/QuestionnaireEditor.vue';
import type { WizardConfig } from '../../../types';

// State
const showEditor = ref(false);
const savedQuestionnaires = ref<WizardConfig[]>([]);
const currentQuestionnaire = ref<WizardConfig | undefined>(undefined);

// Sample questionnaire for demonstration
const sampleQuestionnaire: WizardConfig = {
  wizardId: 'sample-questionnaire',
  title: 'Employee Onboarding Survey',
  description: 'Help us understand your needs and preferences',
  questions: [
    {
      id: 'q1',
      type: 'text',
      question: 'What is your full name?',
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: 'q2',
      type: 'multiple-choice',
      question: 'Which department will you be joining?',
      required: true,
      options: [
        { value: 'engineering', label: 'Engineering' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'sales', label: 'Sales' },
        { value: 'hr', label: 'Human Resources' }
      ]
    },
    {
      id: 'q3',
      type: 'boolean',
      question: 'Do you require any special accommodations?',
      required: true,
      conditionalQuestions: [
        {
          condition: {
            operator: 'equals',
            value: true
          },
          question: {
            id: 'q3a',
            type: 'text',
            question: 'Please describe the accommodations you need',
            required: true
          }
        }
      ]
    }
  ]
};

// Actions
function createNewQuestionnaire() {
  currentQuestionnaire.value = undefined;
  showEditor.value = true;
}

function editQuestionnaire(questionnaire: WizardConfig) {
  currentQuestionnaire.value = { ...questionnaire };
  showEditor.value = true;
}

function handleSave(config: WizardConfig) {
  console.log('Saving questionnaire:', config);

  // Placeholder for actual save logic
  // In a real app, this would call an API
  // await fetch('/api/questionnaires', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(config)
  // });

  // Update local state for demonstration
  const index = savedQuestionnaires.value.findIndex(q => q.wizardId === config.wizardId);
  if (index >= 0) {
    savedQuestionnaires.value[index] = config;
  } else {
    savedQuestionnaires.value.push(config);
  }

  showEditor.value = false;
  alert('Questionnaire saved successfully!');
}

function handleCancel() {
  if (confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
    showEditor.value = false;
  }
}

function deleteQuestionnaire(id: string) {
  if (confirm('Are you sure you want to delete this questionnaire?')) {
    savedQuestionnaires.value = savedQuestionnaires.value.filter(q => q.wizardId !== id);
  }
}

function loadSampleQuestionnaire() {
  currentQuestionnaire.value = { ...sampleQuestionnaire };
  showEditor.value = true;
}

// Placeholder functions for API integration
// async function loadQuestionnairesFromAPI() {
//   console.log('Loading questionnaires from API...');
//   // TODO: Implement API call
//   // const response = await fetch('/api/questionnaires');
//   // savedQuestionnaires.value = await response.json();
// }

// async function loadQuestionnaireById(id: string) {
//   console.log('Loading questionnaire:', id);
//   // TODO: Implement API call
//   // const response = await fetch(`/api/questionnaires/${id}`);
//   // return await response.json();
// }
</script>

<template>
  <div class="app">
    <!-- Editor Mode -->
    <QuestionnaireEditor v-if="showEditor" :initial-config="currentQuestionnaire" @save="handleSave"
      @cancel="handleCancel" />

    <!-- List Mode -->
    <div v-else class="list-view">
      <div class="list-header">
        <h1>Questionnaire Manager</h1>
        <div class="header-actions">
          <button @click="loadSampleQuestionnaire" class="btn btn-secondary">
            Load Sample
          </button>
          <button @click="createNewQuestionnaire" class="btn btn-primary">
            + New Questionnaire
          </button>
        </div>
      </div>

      <div class="list-content">
        <!-- Saved Questionnaires -->
        <div v-if="savedQuestionnaires.length > 0" class="questionnaires-grid">
          <div v-for="questionnaire in savedQuestionnaires" :key="questionnaire.wizardId" class="questionnaire-card">
            <div class="card-header">
              <h3>{{ questionnaire.title }}</h3>
              <div class="card-actions">
                <button @click="editQuestionnaire(questionnaire)" class="action-btn" title="Edit">
                  ✏️
                </button>
                <button @click="deleteQuestionnaire(questionnaire.wizardId)" class="action-btn" title="Delete">
                  🗑️
                </button>
              </div>
            </div>
            <p v-if="questionnaire.description" class="card-description">
              {{ questionnaire.description }}
            </p>
            <div class="card-meta">
              <span class="meta-item">
                📝 {{ questionnaire.questions.length }} questions
              </span>
              <span class="meta-item">
                ID: {{ questionnaire.wizardId }}
              </span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon">📋</div>
          <h2>No Questionnaires Yet</h2>
          <p>Create your first questionnaire to get started, or load a sample to see how it works.</p>
          <div class="empty-actions">
            <button @click="loadSampleQuestionnaire" class="btn btn-secondary">
              Load Sample
            </button>
            <button @click="createNewQuestionnaire" class="btn btn-primary">
              Create Questionnaire
            </button>
          </div>
        </div>

        <!-- API Integration Info -->
        <div class="info-box">
          <h3>🔌 API Integration</h3>
          <p>
            This demo includes placeholder functions for API integration. In a real application, you would implement:
          </p>
          <ul>
            <li><code>POST /api/questionnaires</code> - Create/update questionnaire</li>
            <li><code>GET /api/questionnaires</code> - List all questionnaires</li>
            <li><code>GET /api/questionnaires/:id</code> - Get specific questionnaire</li>
            <li><code>DELETE /api/questionnaires/:id</code> - Delete questionnaire</li>
          </ul>
          <p>
            Check the browser console to see when these functions would be called.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.list-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.list-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Questionnaires Grid */
.questionnaires-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.questionnaire-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  border: 2px solid transparent;
}

.questionnaire-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #3498db;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  flex: 1;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 1;
}

.card-description {
  color: #7f8c8d;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  font-size: 0.875rem;
  color: #7f8c8d;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #7f8c8d;
  font-size: 1rem;
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Info Box */
.info-box {
  background: #e3f2fd;
  border-left: 4px solid #3498db;
  border-radius: 4px;
  padding: 1.5rem;
}

.info-box h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 1rem;
}

.info-box p {
  color: #2c3e50;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.info-box ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #2c3e50;
  line-height: 1.8;
}

.info-box code {
  background: rgba(52, 152, 219, 0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
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

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .questionnaires-grid {
    grid-template-columns: 1fr;
  }
}
</style>
