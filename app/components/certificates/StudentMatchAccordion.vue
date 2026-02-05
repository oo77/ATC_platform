<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h5 class="text-sm font-semibold text-black dark:text-white">
        Выбор слушателя
      </h5>
      <span v-if="selectedStudent" class="text-xs text-success font-medium">
        ✓ Выбран
      </span>
    </div>

    <!-- Top Matches -->
    <div
      v-if="
        matchResult?.topAlternatives && matchResult.topAlternatives.length > 0
      "
      class="space-y-2"
    >
      <div
        v-for="(alternative, index) in matchResult.topAlternatives"
        :key="alternative.student.id"
        @click="selectStudent(alternative.student)"
        :class="[
          'relative rounded-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden',
          isSelected(alternative.student.id)
            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md'
            : 'border-stroke dark:border-strokedark hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-sm',
        ]"
      >
        <div class="p-4">
          <div class="flex items-start gap-4">
            <!-- Radio Button -->
            <div class="flex-shrink-0 pt-1">
              <div
                :class="[
                  'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
                  isSelected(alternative.student.id)
                    ? 'border-primary bg-primary'
                    : 'border-gray-300 dark:border-gray-600',
                ]"
              >
                <div
                  v-if="isSelected(alternative.student.id)"
                  class="h-2 w-2 rounded-full bg-white"
                ></div>
              </div>
            </div>

            <!-- Student Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <!-- Name with Rank Badge -->
                  <div class="flex items-center gap-2 mb-2">
                    <span
                      :class="[
                        'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold',
                        index === 0
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : index === 1
                            ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                      ]"
                    >
                      {{ index + 1 }}
                    </span>
                    <h6
                      class="text-sm font-semibold text-black dark:text-white truncate"
                    >
                      {{ alternative.student.fullName }}
                    </h6>
                  </div>

                  <!-- Additional Info -->
                  <div class="space-y-1">
                    <div
                      v-if="alternative.student.pinfl"
                      class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                    >
                      <svg
                        class="h-3.5 w-3.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <span class="truncate"
                        >ПИНФЛ: {{ alternative.student.pinfl }}</span
                      >
                    </div>

                    <div
                      v-if="alternative.student.department"
                      class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                    >
                      <svg
                        class="h-3.5 w-3.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <span class="truncate">{{
                        alternative.student.department
                      }}</span>
                    </div>

                    <div
                      v-if="alternative.student.email"
                      class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                    >
                      <svg
                        class="h-3.5 w-3.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                        />
                        <path
                          d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
                        />
                      </svg>
                      <span class="truncate">{{
                        alternative.student.email
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Match Score -->
                <div class="flex-shrink-0 text-right">
                  <div
                    :class="[
                      'text-2xl font-bold',
                      getScoreColor(alternative.matchScore),
                    ]"
                  >
                    {{ alternative.matchScore }}%
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    совпадение
                  </div>
                </div>
              </div>

              <!-- Match Score Progress Bar -->
              <div class="mt-3">
                <div
                  class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                >
                  <div
                    :class="[
                      'h-full transition-all duration-500 ease-out rounded-full',
                      getScoreBarColor(alternative.matchScore),
                    ]"
                    :style="{ width: `${alternative.matchScore}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Indicator -->
        <div
          v-if="isSelected(alternative.student.id)"
          class="absolute top-0 right-0 bg-primary text-white px-3 py-1 rounded-bl-lg text-xs font-semibold"
        >
          Выбран
        </div>
      </div>
    </div>

    <!-- No Matches Found -->
    <div
      v-else-if="
        matchResult &&
        (!matchResult.topAlternatives ||
          matchResult.topAlternatives.length === 0)
      "
      class="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 text-center"
    >
      <div class="flex flex-col items-center">
        <div
          class="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3"
        >
          <svg
            class="h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h6 class="text-sm font-semibold text-black dark:text-white mb-1">
          Совпадений не найдено
        </h6>
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-4">
          В базе данных нет подходящих слушателей
        </p>
        <button
          @click="$emit('create-new')"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Создать нового слушателя
        </button>
      </div>
    </div>

    <!-- Create New Student Option -->
    <div
      v-if="
        matchResult?.topAlternatives && matchResult.topAlternatives.length > 0
      "
      class="pt-2 border-t border-stroke dark:border-strokedark"
    >
      <button
        @click="$emit('create-new')"
        class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Создать нового слушателя
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  fileId: {
    type: String,
    required: true,
  },
  matchResult: {
    type: Object,
    default: null,
  },
  selectedStudent: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["select", "create-new"]);

// Methods
const isSelected = (studentId) => {
  return props.selectedStudent?.id === studentId;
};

const selectStudent = (student) => {
  emit("select", student);
};

const getScoreColor = (score) => {
  if (score >= 90) return "text-success";
  if (score >= 70) return "text-primary";
  if (score >= 50) return "text-warning";
  return "text-danger";
};

const getScoreBarColor = (score) => {
  if (score >= 90) return "bg-success";
  if (score >= 70) return "bg-primary";
  if (score >= 50) return "bg-warning";
  return "bg-danger";
};
</script>

<style scoped>
/* Анимация для выбранного элемента */
@keyframes pulse-border {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0);
  }
}

.border-primary {
  animation: pulse-border 2s infinite;
}
</style>
