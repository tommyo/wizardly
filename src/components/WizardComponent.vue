<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useWizard } from '../composables/useWizard';
import type { Question, Answer, AnswerValue, NumberRange, DateRange } from '../types';

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
const firstQuestion = computed(() => currentQuestions.value[0]);
const currentQuestion = computed(() => currentQuestions.value[i.value]);

const answers = ref<(AnswerValue | undefined)[]>([]);
watchEffect(() => {
  answers.value = currentQuestions.value.map((q, i) => {
    let a = currentAnswers.value[i];
    if (a === undefined) {
      a = q.default;
    }
    return a;
  });
});

const saveAnswers = () => {
  const results = wizard.answerQuestions(currentQuestions.value, answers.value);

  // Check if all validations passed
  return results.every(r => r.isValid);
};

const isRequired = computed(() => currentQuestion.value?.required);
const isAnswered = computed(() => answers.value[i.value] !== undefined);

const hasFollowups = computed(() => currentQuestions.value.length > 1);
const toggleFollowups = (e: InputEvent) => {
  answers.value[0] = (e.target as HTMLInputElement).checked;
  if (answers.value[0] === true) {
    i.value++;
  } else {
    i.value = 0;
  }
}


const next = () => {
  if (i.value < currentQuestions.value.length - 1) {
    // we actually only want to show more if we answered the parent question positively
    if (answers.value[0] === true) {
      i.value++;
      return;
    }
  }

  // Save answers and check if validation passed
  const isValid = saveAnswers();

  if (!isValid) {
    // Don't proceed if validation failed
    return;
  }

  i.value = 0;
  answers.value = [];

  if (isComplete) {
    const result = wizard.complete();
    emit('complete', result.answersObject, result.answers);
  }
};

</script>

<template>
  <div class="wizard-container">
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
      <div class="question">
        <!--
        If the first question is a boolean, then toggling it on activates the child questions.
        It should persist so it can be toggled off, unlike in other situations.
        example:
          "Is sports important to you? (boolean)"
          "What are your favorite sports? (multiple-choice)"
        -->
        <template v-if="firstQuestion && hasFollowups">
          <h2 class="question-text">
            {{ firstQuestion.question }}
            <span v-if="firstQuestion.required" class="required-indicator">*</span>
          </h2>

          <p v-if="firstQuestion.helpText" class="help-text">
            {{ firstQuestion.helpText }}
          </p>

          <!-- Boolean (Toggle Switch) -->
          <div class="input-boolean">
            <label class="toggle-switch">
              <input type="checkbox" :value="answers[0]" @input="toggleFollowups" />
              <span class="toggle-slider"></span>
              <span class="toggle-label">
                {{ answers[0] ? 'Yes' : 'No' }}
              </span>
            </label>
          </div>
        </template>
        <template v-if="currentQuestion">
          <template v-if="!hasFollowups || i > 0">

            <h2 class="question-text">
              {{ currentQuestion.question }}
              <span v-if="currentQuestion.required" class="required-indicator">*</span>
            </h2>

            <p v-if="currentQuestion.helpText" class="help-text">
              {{ currentQuestion.helpText }}
            </p>
          </template>

          <!-- Boolean - but only if it's a follow-up -->
          <template v-if="currentQuestion.type == 'boolean' && (!hasFollowups || i > 0)">
            <!-- Boolean (Toggle Switch) -->
            <div class="input-boolean">
              <label class="toggle-switch">
                <input type="checkbox" v-model="answers[i]" />
                <span class="toggle-slider"></span>
                <span class="toggle-label">
                  {{ answers[i] ? 'Yes' : 'No' }}
                </span>
              </label>
            </div>
          </template>

          <!-- Multiple Choice -->
          <template v-else-if="currentQuestion.type === 'multiple-choice'">
            <div class="input-multiple-choice">
              <!-- Single Select -->
              <div v-if="!currentQuestion.allowMultiple" class="radio-group">
                <label v-for="option in currentQuestion.options" :key="option.value" class="radio-option">
                  <input type="radio" v-model="answers[i]" />
                  <span>{{ option.label }}</span>
                </label>
              </div>

              <!-- Multiple Select -->
              <div v-else class="checkbox-group">
                <label v-for="option in currentQuestion.options" :key="option.value" class="checkbox-option">
                  <input type="checkbox" v-model="answers[i]" />
                  <span>{{ option.label }}</span>
                </label>
              </div>
            </div>
          </template>

          <!-- Text Input -->
          <template v-else-if="currentQuestion.type === 'text'">
            <div class="input-text">
              <textarea v-model="answers[i] as string" :placeholder="currentQuestion.helpText" rows="4"
                class="text-input"></textarea>
            </div>
          </template>

          <!-- Number Input -->
          <template v-else-if="currentQuestion.type === 'number'">
            <div class="input-number">
              <input type="number" v-model="answers[i]" :min="currentQuestion.validation?.min"
                :max="currentQuestion.validation?.max" class="number-input" />
            </div>
          </template>

          <!-- Number Range -->
          <template v-else-if="currentQuestion.type === 'number-range'">
            <div class="input-number-range">
              <div class="range-inputs">
                <div class="range-input-group">
                  <label>Minimum</label>
                  <input type="number" v-model="(answers[i] as NumberRange).min" :min="currentQuestion.validation?.min"
                    :max="currentQuestion.validation?.max" class="number-input" />
                </div>
                <div class="range-separator">-</div>
                <div class="range-input-group">
                  <label>Maximum</label>
                  <input type="number" v-model="(answers[i] as NumberRange).min" :min="currentQuestion.validation?.min"
                    :max="currentQuestion.validation?.max" class="number-input" />
                </div>
              </div>
            </div>
          </template>

          <!-- Date Input -->
          <template v-else-if="currentQuestion.type === 'date'">
            <div class="input-date">
              <input type="date" v-model="answers[i]" class="date-input" />
            </div>
          </template>

          <!-- Date Range -->
          <template v-else-if="currentQuestion.type === 'date-range'">
            <div class="input-date-range">
              <div class="range-inputs">
                <div class="range-input-group">
                  <label>Start Date</label>
                  <input type="date" v-model="(answers[i] as DateRange).start" class="date-input" />
                </div>
                <div class="range-separator">to</div>
                <div class="range-input-group">
                  <label>End Date</label>
                  <input type="date" v-model="(answers[i] as DateRange).end" class="date-input" />
                </div>
              </div>
            </div>
          </template>

          <!-- Validation Error Display -->
          <div v-if="wizard.getValidationError(currentQuestion.id)" class="validation-error">
            {{ wizard.getValidationError(currentQuestion.id) }}
          </div>
        </template>
      </div>


      <!-- Navigation Buttons -->
      <div class="wizard-navigation">
        <button @click="wizard.goBack()" :disabled="!canGoPrevious" class="prev">
          Back
        </button>

        <button v-if="!isRequired && !isAnswered" @click="wizard.skipQuestion()" class="next">
          Skip
        </button>

        <button v-else :disabled="isRequired && !isAnswered" @click="next()" class="next">
          {{ canGoNext ? 'Next' : 'Finish' }}
        </button>
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

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &.next {
    background-color: #3498db;
    color: white;

    &:hover:not(:disabled) {
      background-color: #2980b9;
    }
  }

  &.prev {
    background-color: #ecf0f1;
    color: #2c3e50;

    &:hover:not(:disabled) {
      background-color: #d5dbdb;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
