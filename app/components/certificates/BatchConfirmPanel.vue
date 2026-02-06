<template>
  <div class="space-y-6">
    <!-- Summary Card -->
    <div
      class="bg-gradient-to-br from-primary/10 via-success/10 to-info/10 dark:from-primary/20 dark:via-success/20 dark:to-info/20 rounded-xl p-6 border-2 border-primary/30 dark:border-primary/40"
    >
      <div class="flex items-start justify-between mb-6">
        <div>
          <h3 class="text-xl font-bold text-black dark:text-white mb-2">
            Подтверждение импорта
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Проверьте сводку перед финальным сохранением
          </p>
        </div>
        <div
          class="h-14 w-14 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center"
        >
          <svg
            class="h-8 w-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          class="bg-white/60 dark:bg-boxdark/60 backdrop-blur-sm rounded-lg p-4 text-center"
        >
          <div class="text-3xl font-bold text-black dark:text-white mb-1">
            {{ stats.totalFiles }}
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Всего файлов
          </div>
        </div>

        <div
          class="bg-white/60 dark:bg-boxdark/60 backdrop-blur-sm rounded-lg p-4 text-center"
        >
          <div class="text-3xl font-bold text-success mb-1">
            {{ stats.readyFiles }}
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Готовы к импорту
          </div>
        </div>

        <div
          class="bg-white/60 dark:bg-boxdark/60 backdrop-blur-sm rounded-lg p-4 text-center"
        >
          <div class="text-3xl font-bold text-warning mb-1">
            {{ stats.totalFiles - stats.readyFiles }}
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Требуют внимания
          </div>
        </div>

        <div
          class="bg-white/60 dark:bg-boxdark/60 backdrop-blur-sm rounded-lg p-4 text-center"
        >
          <div class="text-3xl font-bold text-primary mb-1">
            ${{ stats.totalCost }}
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Стоимость AI
          </div>
        </div>
      </div>
    </div>

    <!-- Ready Items List -->
    <div
      v-if="readyItems.length > 0"
      class="bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark overflow-hidden"
    >
      <div class="px-6 py-4 border-b border-stroke dark:border-strokedark">
        <h4 class="text-sm font-semibold text-black dark:text-white">
          Сертификаты к импорту ({{ readyItems.length }})
        </h4>
      </div>

      <div
        class="divide-y divide-stroke dark:divide-strokedark max-h-96 overflow-y-auto"
      >
        <div
          v-for="item in readyItems"
          :key="item.file.fileId"
          class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div class="flex items-center gap-4">
            <!-- Checkmark Icon -->
            <div
              class="h-10 w-10 rounded-full bg-success/10 dark:bg-success/20 flex items-center justify-center flex-shrink-0"
            >
              <svg
                class="h-5 w-5 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h5
                  class="text-sm font-semibold text-black dark:text-white truncate"
                >
                  {{
                    item.analysisResult?.extractedData?.fullName || "Без имени"
                  }}
                </h5>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {{
                    item.analysisResult?.extractedData?.certificateNumber ||
                    "Без номера"
                  }}
                </span>
              </div>
              <div
                class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
              >
                <svg
                  class="h-3.5 w-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="truncate">{{
                  item.selectedStudent?.fullName
                }}</span>
              </div>
            </div>

            <!-- Match Score -->
            <div class="flex-shrink-0 text-right">
              <div class="text-lg font-bold text-success">
                {{ getMatchScore(item) }}%
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                совпадение
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Warnings for items needing attention -->
    <div
      v-if="itemsNeedingAttention.length > 0"
      class="bg-warning/10 dark:bg-warning/20 border-2 border-warning/30 dark:border-warning/40 rounded-xl p-6"
    >
      <div class="flex items-start gap-4">
        <div
          class="h-10 w-10 rounded-full bg-warning/20 dark:bg-warning/30 flex items-center justify-center flex-shrink-0"
        >
          <svg
            class="h-5 w-5 text-warning"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="flex-1">
          <h5 class="text-sm font-semibold text-warning mb-2">
            Требуют внимания ({{ itemsNeedingAttention.length }})
          </h5>
          <ul class="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li
              v-for="item in itemsNeedingAttention.slice(0, 3)"
              :key="item.file.fileId"
              class="flex items-center gap-2"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-warning"></span>
              <span class="truncate">{{ item.file.originalName }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                ({{ getItemIssue(item) }})
              </span>
            </li>
            <li
              v-if="itemsNeedingAttention.length > 3"
              class="text-xs text-gray-500 dark:text-gray-400 italic"
            >
              и ещё {{ itemsNeedingAttention.length - 3 }}...
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-3">
      <button
        @click="$emit('cancel')"
        :disabled="loading"
        class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        Отменить
      </button>

      <button
        @click="$emit('confirm')"
        :disabled="!canConfirm || loading"
        class="flex-1 sm:flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-success to-success-600 text-white rounded-lg text-sm font-semibold hover:from-success-600 hover:to-success-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-lg hover:shadow-xl"
      >
        <svg
          v-if="!loading"
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <div
          v-else
          class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
        ></div>
        <span v-if="loading">Импорт...</span>
        <span v-else>Импортировать {{ readyItems.length }} сертификатов</span>
      </button>
    </div>

    <!-- Progress Indicator -->
    <div
      v-if="loading"
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent"
        ></div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-black dark:text-white">
            Импорт в процессе...
          </p>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            Пожалуйста, не закрывайте страницу
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  stats: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["confirm", "cancel"]);

// Computed
const readyItems = computed(() => {
  return props.items.filter(
    (item) =>
      item.uiStatus === "ready" &&
      item.selectedStudent &&
      item.analysisResult?.extractedData,
  );
});

const itemsNeedingAttention = computed(() => {
  return props.items.filter(
    (item) =>
      item.uiStatus !== "ready" ||
      !item.selectedStudent ||
      !item.analysisResult?.extractedData,
  );
});

const canConfirm = computed(() => {
  return readyItems.value.length > 0 && !props.loading;
});

// Methods
const getMatchScore = (item) => {
  if (
    !item.selectedStudent ||
    !item.analysisResult?.matchResult?.topAlternatives
  ) {
    return 0;
  }

  // Ищем выбранного студента в topAlternatives
  const matchedAlternative =
    item.analysisResult.matchResult.topAlternatives.find(
      (alt) => alt.student.id === item.selectedStudent.id,
    );

  return matchedAlternative?.matchScore || 0;
};

const getItemIssue = (item) => {
  if (item.uiStatus === "error") return "ошибка анализа";
  if (!item.selectedStudent) return "не выбран студент";
  if (!item.analysisResult?.extractedData) return "нет данных";
  return "требует проверки";
};
</script>

<style scoped>
/* Анимация градиента для кнопки */
@keyframes gradient-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

button:not(:disabled):hover {
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}
</style>
