<!-- eslint-disable no-console -->
<script setup lang="ts">
import { ref } from 'vue';
import WizardComponent from '../../components/WizardComponent.vue';
import type { AnswerValue, WizardConfig } from '../../types';

const showWizard = ref(false);

const inlineConfig: WizardConfig = {
  wizardId: 'quick-survey',
  title: 'Quick Survey',
  description: 'This is a simple survey example',
  questions: [
    {
      id: 'name',
      type: 'text',
      question: 'What is your name?',
      required: true,
      validation: {
        minLength: 2,
        maxLength: 50,
      },
    },
    {
      id: 'age',
      type: 'number',
      question: 'How old are you?',
      required: true,
      validation: {
        min: 18,
        max: 120,
        customMessage: 'You must be at least 18 years old',
      },
    },
    {
      id: 'interests',
      type: 'text',
      question: 'What are you interested in doing?',
      required: false,
      options: [
        {
          label: 'going out to eat',
          value: 'dining',
          image: 'dining.png',
        },
        {
          label: 'going dancing',
          value: 'dancing',
          image: 'dancing.png',
        },
      ],
    },
    {
      id: 'newsletter',
      type: 'boolean',
      question: 'Would you like to receive our newsletter?',
      required: false,
      default: true,
      conditionalQuestions: [
        {
          condition: { operator: 'equals', value: true },
          question: {
            id: 'email',
            type: 'text',
            question: 'what email should we send it to?',
            required: true,
          },
        },
      ],
    },
  ],
};

// Handle wizard completion
const handleWizardComplete = (answers: Record<string, AnswerValue>) => {
  console.log('Wizard completed with answers:', answers);
  alert('Wizard completed! Check console for answers.');
};

// Handle wizard cancel
const handleWizardCancel = () => {
  console.log('Wizard cancelled');
  alert('Wizard cancelled');
};
</script>

<template>
  <div class="app">
    <h1>Wizard Component Examples</h1>

    <div class="examples">
      <button @click="showWizard = true" class="example-btn">
        Example: Inline Configuration
      </button>
    </div>

    <div v-if="showWizard" class="modal">
      <div class="modal-content">
        <button @click="showWizard = false" class="close-btn">×</button>
        <WizardComponent :questions="inlineConfig.questions"
                         @complete="handleWizardComplete"
                         @cancel="() => { showWizard = false; handleWizardCancel(); }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.examples {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.example-btn {
  padding: 1rem 2rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.example-btn:hover {
  background-color: #2980b9;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #7f8c8d;
  z-index: 10;
}

.close-btn:hover {
  color: #2c3e50;
}
</style>
