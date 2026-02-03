<template>
  <div class="flex flex-col gap-6">
    <!-- Хлебные крошки и заголовок -->
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <div
          class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2"
        >
          <NuxtLink
            to="/database/import-certificates"
            class="hover:text-primary transition-colors"
          >
            База сертификатов
          </NuxtLink>
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
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span class="text-black dark:text-white font-medium">AI Импорт</span>
        </div>
        <h1 class="text-2xl font-semibold text-black dark:text-white">
          AI Импорт Сертификатов
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Автоматическое распознавание и импорт сертификатов с помощью
          искусственного интеллекта
        </p>
      </div>
    </div>

    <!-- Stats Card - Три счетчика в один ряд -->
    <ImportStats v-if="stats" :stats="stats" />

    <!-- Wizard Progress Bar -->
    <div
      class="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark p-6"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Прогресс импорта
        </h3>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          Шаг {{ currentStep }} из {{ steps.length }}
        </span>
      </div>

      <!-- Progress Steps -->
      <div class="relative">
        <!-- Progress Line -->
        <div
          class="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700"
        >
          <div
            class="h-full bg-linear-to-r from-primary to-success transition-all duration-500"
            :style="{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }"
          ></div>
        </div>

        <!-- Steps -->
        <div class="relative flex justify-between">
          <div
            v-for="step in steps"
            :key="step.number"
            class="flex flex-col items-center"
          >
            <!-- Step Circle -->
            <div
              class="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300"
              :class="[
                currentStep === step.number
                  ? 'border-primary bg-primary text-white shadow-lg shadow-primary/30'
                  : currentStep > step.number
                    ? 'border-success bg-success text-white'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark text-gray-400',
              ]"
            >
              <svg
                v-if="currentStep > step.number"
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span v-else class="text-sm font-semibold">{{
                step.number
              }}</span>
            </div>

            <!-- Step Label -->
            <div class="mt-2 text-center">
              <p
                class="text-xs font-medium transition-colors"
                :class="[
                  currentStep >= step.number
                    ? 'text-black dark:text-white'
                    : 'text-gray-500 dark:text-gray-400',
                ]"
              >
                {{ step.name }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Work Area -->
    <div
      class="bg-white dark:bg-boxdark rounded-xl shadow-md border border-stroke dark:border-strokedark overflow-hidden"
    >
      <!-- Step Content -->
      <div class="p-6 lg:p-8">
        <transition name="fade" mode="out-in">
          <!-- Step 1: Upload -->
          <div v-if="currentStep === 1" key="step-1" class="space-y-6">
            <div class="flex items-center gap-3 mb-6">
              <div
                class="h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0"
              >
                <svg
                  class="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-black dark:text-white">
                  Загрузка сертификата
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Загрузите PDF или изображение сертификата для анализа
                </p>
              </div>
            </div>
            <FileUploader :loading="isProcessing" @upload="handleUpload" />
          </div>

          <!-- Step 2: Analysis -->
          <div v-else-if="currentStep === 2" key="step-2" class="space-y-6">
            <div class="flex items-center gap-3 mb-6">
              <div
                class="h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0"
                :class="{
                  'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400':
                    error,
                }"
              >
                <svg
                  v-if="error"
                  class="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-else
                  class="h-6 w-6 text-primary animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-black dark:text-white">
                  {{ error ? "Ошибка анализа" : "Анализ сертификата" }}
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{
                    error
                      ? "Произошла ошибка при обработке файла"
                      : "AI обрабатывает и извлекает данные из документа"
                  }}
                </p>
              </div>
            </div>

            <!-- Error State -->
            <div
              v-if="error"
              class="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20"
            >
              <div class="mb-4 flex flex-col items-center justify-center">
                <div
                  class="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50"
                >
                  <svg
                    class="h-8 w-8 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-red-900 dark:text-red-200">
                  Не удалось проанализировать файл
                </h3>
                <p class="mt-2 max-w-md text-sm text-red-700 dark:text-red-300">
                  {{ error }}
                </p>
              </div>
              <div class="flex justify-center gap-4">
                <button
                  @click="reset"
                  class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Начать заново
                </button>
                <button
                  @click="
                    error = null;
                    isProcessing = true;
                    analyzeFile();
                  "
                  class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                >
                  Повторить попытку
                </button>
              </div>
            </div>

            <AIAnalysisProgress v-else :loading="isProcessing" />
          </div>

          <!-- Step 3: Review -->
          <div
            v-else-if="currentStep === 3 && editedData"
            key="step-3"
            class="space-y-6"
          >
            <div class="flex items-center gap-3 mb-6">
              <div
                class="h-12 w-12 rounded-lg bg-warning/10 dark:bg-warning/20 flex items-center justify-center shrink-0"
              >
                <svg
                  class="h-6 w-6 text-warning"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-black dark:text-white">
                  Проверка данных
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Проверьте и при необходимости исправьте извлеченные данные
                </p>
              </div>
            </div>
            <ExtractedDataReview
              v-model="editedData"
              @validation="handleValidation"
            />
          </div>

          <!-- Step 4: Match -->
          <div v-else-if="currentStep === 4" key="step-4" class="space-y-6">
            <div class="flex items-center gap-3 mb-6">
              <div
                class="h-12 w-12 rounded-lg bg-info/10 dark:bg-info/20 flex items-center justify-center shrink-0"
              >
                <svg
                  class="h-6 w-6 text-info"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-black dark:text-white">
                  Выбор слушателя
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Подтвердите или выберите слушателя из базы данных
                </p>
              </div>
            </div>
            <StudentMatcher
              v-model="selectedStudent"
              :match-result="matchResult"
            />
          </div>

          <!-- Step 5: Confirm -->
          <div
            v-else-if="currentStep === 5 && selectedStudent && editedData"
            key="step-5"
            class="space-y-6"
          >
            <div class="flex items-center gap-3 mb-6">
              <div
                class="h-12 w-12 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center shrink-0"
              >
                <svg
                  class="h-6 w-6 text-success"
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
              <div>
                <h2 class="text-lg font-semibold text-black dark:text-white">
                  Подтверждение импорта
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Проверьте финальные данные перед сохранением
                </p>
              </div>
            </div>
            <FinalConfirmation :data="editedData" :student="selectedStudent" />
          </div>
        </transition>
      </div>

      <!-- Actions Footer -->
      <div
        class="flex flex-col sm:flex-row justify-between items-center gap-3 px-6 lg:px-8 py-4 bg-gray-50 dark:bg-meta-4 border-t border-stroke dark:border-strokedark"
      >
        <button
          v-if="currentStep > 1 && currentStep < 5"
          @click="prevStep"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Назад
        </button>
        <div v-else></div>

        <button
          v-if="currentStep === 3"
          @click="nextStep"
          :disabled="!isValid"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Данные верны, далее
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <button
          v-if="currentStep === 4"
          @click="nextStep"
          :disabled="!selectedStudent"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Слушатель выбран, далее
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <button
          v-if="currentStep === 5"
          @click="finishImport"
          :disabled="isProcessing"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-success hover:bg-success-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <svg
            v-if="!isProcessing"
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
            class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          ></div>
          <span v-if="isProcessing">Сохранение...</span>
          <span v-else>Подтвердить и сохранить</span>
        </button>
      </div>
    </div>

    <!-- Recent Logs -->
    <ProcessingLogs
      :logs="logs"
      :current-page="logsPage"
      :total-pages="totalPages"
      @page-change="handlePageChange"
      @refresh="loadLogs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAICertificateImport } from "~/composables/useAICertificateImport";
import type {
  AIImportStats,
  AIProcessingLog,
} from "~/../server/types/aiCertificateImport";
import FileUploader from "~/components/database/ai-import/FileUploader.vue";
import AIAnalysisProgress from "~/components/database/ai-import/AIAnalysisProgress.vue";
import ExtractedDataReview from "~/components/database/ai-import/ExtractedDataReview.vue";
import StudentMatcher from "~/components/database/ai-import/StudentMatcher.vue";
import FinalConfirmation from "~/components/database/ai-import/FinalConfirmation.vue";
import ImportStats from "~/components/database/ai-import/ImportStats.vue";
import ProcessingLogs from "~/components/database/ai-import/ProcessingLogs.vue";

definePageMeta({
  layout: "default",
});

const {
  currentStep,
  isProcessing,
  error,
  uploadedFile,
  analysisResult,
  editedData,
  selectedStudent,
  matchResult,
  importConfirmation,

  uploadFile,
  analyzeFile,
  confirmImport,
  getStats,
  getLogs,
  reset,
} = useAICertificateImport();

const steps = [
  { number: 1, name: "Загрузка" },
  { number: 2, name: "Анализ" },
  { number: 3, name: "Проверка" },
  { number: 4, name: "Слушатель" },
  { number: 5, name: "Финиш" },
];

const isValid = ref(true);
const stats = ref<AIImportStats | null>(null);
const logs = ref<AIProcessingLog[]>([]);
const logsPage = ref(1);
const totalPages = ref(1);

const handleUpload = async (file: File) => {
  try {
    await uploadFile(file);
    // Auto start analysis
    await analyzeFile();
  } catch (e) {
    console.error(e);
  }
};

const handleValidation = (valid: boolean) => {
  isValid.value = valid;
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const nextStep = () => {
  if (currentStep.value < 5) {
    currentStep.value++;
  }
};

const finishImport = async () => {
  try {
    await confirmImport();
    // Reset after success
    setTimeout(() => {
      reset();
      loadStats();
      loadLogs();
    }, 2000);
  } catch (e) {
    console.error(e);
  }
};

const loadStats = async () => {
  try {
    stats.value = await getStats();
  } catch (e) {
    console.error(e);
  }
};

const loadLogs = async (page = 1) => {
  try {
    const result = await getLogs({ page, limit: 5 });
    logs.value = result.logs;
    logsPage.value = result.page;
    totalPages.value = result.totalPages;
  } catch (e) {
    console.error(e);
  }
};

const handlePageChange = (page: number) => {
  loadLogs(page);
};

onMounted(() => {
  loadStats();
  loadLogs();
});
</script>

<style scoped>
/* Fade transition for step changes */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
