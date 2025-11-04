<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useWizard } from '../composables/useWizard';
import type { Question, Answer, AnswerValue, NumberRange, DateRange } from '../types';

// Extended Question type with conditionalParent (added by engine)
type FlattenedQuestion = Question & { conditionalParent?: string };

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
  canGoBack,
  canGoNext,
} = wizard;

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
  // Don't auto-advance to allow conditional questions to be shown
  const results = wizard.answerQuestions(currentQuestions.value, answers.value, false);

  // Check if all validations passed
  return results.every(r => r.isValid);
};

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


const isRequired = computed(() => {
  return visibleQuestions.value.some(vq => vq.question.required);
});


const isRequiredAnswered = computed(() => {
  return visibleQuestions.value.some(vq => vq.question.required && answers.value[vq.index] !== undefined);
});

const next = () => {
  console.log(isComplete.value);
  // Save answers and check if validation passed
  const isValid = saveAnswers();

  if (!isValid) {
    // Don't proceed if validation failed
    return;
  }

  wizard.next();

  answers.value = [];

  if (isComplete) {
    const result = wizard.complete();
    emit('complete', result.answersObject, result.answers);
  }
};

</script>

<template>
  <div class="wizard-container">
    <pre>
      <template v-for="{ question, answer } in wizard.getAnsweredQuestions()" :key="question.id">{{ question.question }} = {{ `${answer}\n` }}</template>
      <template v-for="(a, i) in currentAnswers" :key="`a${i}`">{{ currentQuestions[i]?.question }} = {{ `${a}\n` }}</template>
    </pre>
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

      <!-- Render all visible questions -->
      <div v-for="{ question, index } in visibleQuestions" :key="question.id" class="question">
        <h2 class="question-text">
          {{ question.question }}
          <span v-if="question.required" class="required-indicator">*</span>
        </h2>

        <p v-if="question.helpText" class="help-text">
          {{ question.helpText }}
        </p>

        <!-- Boolean (Toggle Switch) -->
        <template v-if="question.type === 'boolean'">
          <div class="input-boolean">
            <label class="toggle-switch">
              <input type="checkbox" v-model="answers[index]" />
              <span class="toggle-slider"></span>
              <span class="toggle-label">
                {{ answers[index] ? 'Yes' : 'No' }}
              </span>
            </label>
          </div>
        </template>

        <!-- Multiple Choice -->
        <template v-else-if="question.type === 'multiple-choice'">
          <div class="input-multiple-choice">
            <!-- Single Select -->
            <div v-if="!question.allowMultiple" class="radio-group">
              <label v-for="option in question.options" :key="option.value" class="radio-option">
                <input type="radio" v-model="answers[index]" :value="option.value" />
                <span>{{ option.label }}</span>
              </label>
            </div>

            <!-- Multiple Select -->
            <div v-else class="checkbox-group">
              <label v-for="option in question.options" :key="option.value" class="checkbox-option">
                <input type="checkbox" v-model="answers[index]" :value="option.value" />
                <span>{{ option.label }}</span>
              </label>
            </div>
          </div>
        </template>

        <!-- Text Input -->
        <template v-else-if="question.type === 'text'">
          <div class="input-text">
            <textarea v-model="answers[index] as string"
                      :placeholder="question.helpText"
                      rows="4"
                      class="text-input"></textarea>
          </div>
        </template>

        <!-- Number Input -->
        <template v-else-if="question.type === 'number'">
          <div class="input-number">
            <input type="number"
                   v-model="answers[index]"
                   :min="question.validation?.min"
                   :max="question.validation?.max"
                   class="number-input" />
          </div>
        </template>

        <!-- Number Range -->
        <template v-else-if="question.type === 'number-range'">
          <div class="input-number-range">
            <div class="range-inputs">
              <div class="range-input-group">
                <label>Minimum</label>
                <input type="number"
                       v-model="(answers[index] as NumberRange).min"
                       :min="question.validation?.min"
                       :max="question.validation?.max"
                       class="number-input" />
              </div>
              <div class="range-separator">
                -
              </div>
              <div class="range-input-group">
                <label>Maximum</label>
                <input type="number"
                       v-model="(answers[index] as NumberRange).max"
                       :min="question.validation?.min"
                       :max="question.validation?.max"
                       class="number-input" />
              </div>
            </div>
          </div>
        </template>

        <!-- Date Input -->
        <template v-else-if="question.type === 'date'">
          <div class="input-date">
            <input type="date" v-model="answers[index]" class="date-input" />
          </div>
        </template>

        <!-- Date Range -->
        <template v-else-if="question.type === 'date-range'">
          <div class="input-date-range">
            <div class="range-inputs">
              <div class="range-input-group">
                <label>Start Date</label>
                <input type="date" v-model="(answers[index] as DateRange).start" class="date-input" />
              </div>
              <div class="range-separator">
                to
              </div>
              <div class="range-input-group">
                <label>End Date</label>
                <input type="date" v-model="(answers[index] as DateRange).end" class="date-input" />
              </div>
            </div>
          </div>
        </template>

        <!-- Validation Error Display -->
        <div v-if="wizard.getValidationError(question.id)" class="validation-error">
          {{ wizard.getValidationError(question.id) }}
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="wizard-navigation">
        <button @click="wizard.back()" :disabled="!canGoBack" class="prev">
          Back
        </button>

        <button v-if="!isRequired" @click="wizard.next()" class="next">
          Skip
        </button>

        <button v-else
                :disabled="isRequired && !isRequiredAnswered"
                @click="next()"
                class="next">
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

.question {
  margin-bottom: 1.5rem;
}

.question:last-of-type {
  margin-bottom: 0;
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
