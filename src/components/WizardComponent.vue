<script setup lang="ts">
import { computed, ref } from 'vue';
import { useWizard } from '../composables/useWizard';
import type { Question, Answer, AnswerValue, NumberRange } from '../types';

// Props
const { questions } = defineProps<{
  // configUrl: string;
  questions: Question[];
}>();

// Emits
const emit = defineEmits<{
  complete: [answers: Record<string, AnswerValue>, answersList: Answer[]];
  cancel: [];
}>();

// State
// const wizardConfig = ref<WizardConfig | null>(null);
// const isLoading = ref(true);
// const loadError = ref<string | null>(null);

// Load wizard configuration
// const loadConfig = async () => {
//   try {
//     isLoading.value = true;

//     if (props.config) {
//       wizardConfig.value = props.config;
//     } else if (props.configUrl) {
//       const response = await fetch(props.configUrl);
//       if (!response.ok) {
//         throw new Error(`Failed to load wizard config: ${response.statusText}`);
//       }
//       wizardConfig.value = await response.json();
//     } else {
//       throw new Error('Either config or configUrl must be provided');
//     }
//   } catch (error) {
//     loadError.value = error instanceof Error ? error.message : 'Failed to load wizard configuration';
//   } finally {
//     isLoading.value = false;
//   }
// };

// onMounted(loadConfig);

// Initialize wizard when config is loaded
const wizard = useWizard(questions);

const {
  currentQuestions,
  currentAnswers,
  progress,
  isComplete,
  canGoPrevious,
  canGoNext,
} = wizard;

const i = ref(0);
const firstQuestion = computed(() => currentQuestions.value[0]!);
const firstAnswer = computed(() => currentAnswers.value[0]);
const currentQuestion = computed(() => currentQuestions.value[i.value]);
const currentAnswer = computed(() => currentAnswers.value[i.value]);

const answers = ref<AnswerValue[]>([]);
const saveAnswers = () => {
  const all = currentQuestions.value
    .map((q, i) => ({ questionId: q.id, value: answers.value[i] } as Answer))
    .filter((a) => a.value !== undefined && a.value !== null);
  wizard.answerQuestions(all);
};

const next = () => {
  if (i.value < currentQuestions.value.length - 1) {
    // we actually only want to show more if we answered the parent question positively
    if (firstQuestion.value.type === 'boolean' && firstAnswer.value === true) {
      i.value++;
      return;
    }
  }
  i.value = 0;
  saveAnswers();
  answers.value = [];
};

// const boolPersist = ref<Question[]>([]);

// // Handle next button click
// const handleNext = () => {
//   wizard.submitAnswer();
// };

// // Handle back button click
// const handleBack = () => {
//   wizard.goBack();
// };

// Handle wizard completion
const handleComplete = () => {
  const result = wizard.complete();
  // Emit both the object format and the array format for flexibility
  emit('complete', result.answersObject, result.answers);
};

// Handle cancel
// const handleCancel = () => {
//   emit('cancel');
// };
</script>

<template>
  <div class="wizard-container">
    <!-- Loading State -->
    <!--
      <div v-if="wizard.isLoading" class="wizard-loading">
        <div class="spinner"></div>
        <p>Loading wizard...</p>
      </div>
    -->

    <!-- Error State -->
    <!--
      <div v-else-if="loadError" class="wizard-error">
        <p class="error-message">{{ loadError }}</p>
        <button @click="loadConfig" class="btn btn-primary">Retry</button>
      </div>
    -->

    <!-- Wizard Content -->
    <div class="wizard-content">
      <!-- Progress Bar -->
      <div class="wizard-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress.percentage}%` }"></div>
        </div>
        <p class="progress-text">
          Question {{ progress.current }} of {{ progress.total }}
        </p>
      </div>

      <!-- Completion Screen -->
      <div v-if="isComplete" class="wizard-complete">
        <div class="complete-icon">✓</div>
        <h2>Complete!</h2>
        <p>Thank you for completing the wizard.</p>
        <div class="complete-actions">
          <button @click="handleComplete" class="btn btn-primary">
            Submit
          </button>
          <button @click="wizard.reset()" class="btn btn-secondary">
            Start Over
          </button>
        </div>
      </div>

      <!-- Question -->
      <div v-else-if="currentQuestion" class="wizard-question">
        <div class="question-container">

          <h2 class="question-text">
            {{ currentQuestion.question }}
            <span v-if="currentQuestion.required" class="required-indicator">*</span>
          </h2>

          <p v-if="currentQuestion.helpText" class="help-text">
            {{ currentQuestion.helpText }}
          </p>

          <!-- Boolean (Toggle Switch) -->
          <template v-if="currentQuestion.type === 'boolean'">
            <slot name="boolean" :question="currentQuestion" :answer="currentAnswer">
              <div class="input-boolean">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="currentAnswer" />
                  <span class="toggle-slider"></span>
                  <span class="toggle-label">
                    {{ currentAnswer ? 'Yes' : 'No' }}
                  </span>
                </label>
              </div>
            </slot>
          </template>

          <!-- Multiple Choice -->
          <template v-else-if="currentQuestion.type === 'multiple-choice'">
            <slot name="multiple-choice" :question="currentQuestion" :answer="currentAnswer">
              <div class="input-multiple-choice">
                <!-- Single Select -->
                <div v-if="!currentQuestion.allowMultiple" class="radio-group">
                  <label v-for="option in currentQuestion.options" :key="option.value" class="radio-option">
                    <input type="radio" v-model="currentAnswer" />
                    <span>{{ option.label }}</span>
                  </label>
                </div>

                <!-- Multiple Select -->
                <div v-else class="checkbox-group">
                  <label v-for="option in currentQuestion.options" :key="option.value" class="checkbox-option">
                    <input type="checkbox" v-model="currentAnswer" />
                    <span>{{ option.label }}</span>
                  </label>
                </div>
              </div>
            </slot>
          </template>

          <!-- Text Input -->
          <template v-else-if="currentQuestion.type === 'text'">
            <slot name="text" :question="currentQuestion" :answer="currentAnswer">
              <div class="input-text">
                <textarea v-model="currentAnswer as string" :placeholder="currentQuestion.helpText" rows="4"
                  class="text-input"></textarea>
              </div>
            </slot>
          </template>

          <!-- Number Input -->
          <template v-else-if="currentQuestion.type === 'number'">
            <slot name="number" :question="currentQuestion" :answer="currentAnswer">
              <div class="input-number">
                <input type="number" v-model="currentAnswer" :min="currentQuestion.validation?.min"
                  :max="currentQuestion.validation?.max" class="number-input" />
              </div>
            </slot>
          </template>

          <!-- Number Range -->
          <template v-else-if="currentQuestion.type === 'number-range'">
            <slot name="number-range" :question="currentQuestion" :answer="currentAnswer">
              <div class="input-number-range">
                <div class="range-inputs">
                  <div class="range-input-group">
                    <label>Minimum</label>
                    <input type="number" v-model="(currentAnswer as Partial<NumberRange>).min"
                      :min="currentQuestion.validation?.min" :max="currentQuestion.validation?.max"
                      class="number-input" />
                  </div>
                  <div class="range-separator">-</div>
                  <div class="range-input-group">
                    <label>Maximum</label>
                    <input type="number" v-model="(currentAnswer as Partial<NumberRange>).min"
                      :min="currentQuestion.validation?.min" :max="currentQuestion.validation?.max"
                      class="number-input" />
                  </div>
                </div>
              </div>
            </slot>
          </template>

          <!-- Date Input -->
          <template v-else-if="currentQuestion.type === 'date'">
            <slot name="date" :question="currentQuestion" :answer="currentAnswer">
              <div class="input-date">
                <input type="date" v-model="currentAnswer" class="date-input" />
              </div>
            </slot>
          </template>

          <!-- Date Range -->
          <template v-else-if="currentQuestion.type === 'date-range'">
            <slot name="date-range" :question="currentQuestion" :answer="currentAnswer">
              <div class="input-date-range">
                <div class="range-inputs">
                  <div class="range-input-group">
                    <label>Start Date</label>
                    <input type="date" v-model="currentAnswer" class="date-input" />
                  </div>
                  <div class="range-separator">to</div>
                  <div class="range-input-group">
                    <label>End Date</label>
                    <input type="date" v-model="currentAnswer" class="date-input" />
                  </div>
                </div>
              </div>
            </slot>
          </template>

          <!-- Validation Error -->
          <!--
      <p v-if="wizard.validationError.value" class="validation-error">
        {{ wizard.validationError.value }}
      </p>
    -->
        </div>


        <!-- Navigation Buttons -->
        <div class="wizard-navigation">
          <button @click="wizard.goBack()" :disabled="!canGoPrevious" class="btn btn-secondary">
            Back
          </button>

          <button v-if="!currentQuestion.required" @click="wizard.skipQuestion()" class="btn btn-text">
            Skip
          </button>

          <button @click="next()" class="btn btn-primary">
            {{ canGoNext ? 'Next' : 'Finish' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizard-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.wizard-loading,
.wizard-error {
  text-align: center;
  padding: 3rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #e74c3c;
  margin-bottom: 1rem;
}

.wizard-header {
  margin-bottom: 2rem;
}

.wizard-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.wizard-description {
  color: #7f8c8d;
  font-size: 1rem;
}

.wizard-progress {
  margin-bottom: 2rem;
}

.progress-bar {
  height: 8px;
  background-color: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #7f8c8d;
  font-size: 0.875rem;
}

.wizard-question {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.question-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.required-indicator {
  color: #e74c3c;
}

.help-text {
  color: #7f8c8d;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

/* Input Styles */
.toggle-switch {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 1rem;
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 50px;
  height: 26px;
  background-color: #ccc;
  border-radius: 26px;
  transition: background-color 0.3s;
}

.toggle-switch input:checked+.toggle-slider {
  background-color: #3498db;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 3px;
  top: 3px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle-switch input:checked+.toggle-slider::before {
  transform: translateX(24px);
}

.toggle-label {
  font-weight: 600;
  color: #2c3e50;
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-option,
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover,
.checkbox-option:hover {
  border-color: #3498db;
  background-color: #f8f9fa;
}

.radio-option input,
.checkbox-option input {
  cursor: pointer;
}

.text-input,
.number-input,
.date-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.text-input:focus,
.number-input:focus,
.date-input:focus {
  outline: none;
  border-color: #3498db;
}

.range-inputs {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
}

.range-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.range-input-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #7f8c8d;
}

.range-separator {
  padding-bottom: 0.75rem;
  font-weight: 600;
  color: #7f8c8d;
}

.validation-error {
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.wizard-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #d5dbdb;
}

.btn-text {
  background: none;
  color: #7f8c8d;
}

.btn-text:hover {
  color: #2c3e50;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.wizard-complete {
  text-align: center;
  padding: 3rem;
}

.complete-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  background-color: #2ecc71;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
}

.complete-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}
</style>
