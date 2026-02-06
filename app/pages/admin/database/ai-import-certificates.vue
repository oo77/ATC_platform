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
          Пакетный AI Импорт Сертификатов
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Массовое распознавание и импорт сертификатов с помощью искусственного
          интеллекта
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
          Шаг {{ batchCurrentStep }} из {{ batchSteps.length }}
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
              width: `${((batchCurrentStep - 1) / (batchSteps.length - 1)) * 100}%`,
            }"
          ></div>
        </div>

        <!-- Steps -->
        <div class="relative flex justify-between">
          <div
            v-for="step in batchSteps"
            :key="step.number"
            class="flex flex-col items-center z-10"
            :style="{ width: `${100 / batchSteps.length}%` }"
          >
            <!-- Step Circle -->
            <div
              class="relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 bg-white dark:bg-boxdark"
              :class="[
                batchCurrentStep === step.number
                  ? 'border-primary text-primary shadow-lg shadow-primary/30 scale-110'
                  : batchCurrentStep > step.number
                    ? 'border-success bg-success text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-400',
              ]"
            >
              <svg
                v-if="batchCurrentStep > step.number"
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
            <div class="mt-2 text-center w-full">
              <p
                class="text-xs font-medium transition-colors truncate px-1"
                :class="[
                  batchCurrentStep >= step.number
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
          <div :key="'batch-' + batchCurrentStep">
            <!-- Batch Step 1: Upload -->
            <div v-if="batchCurrentStep === 1" class="space-y-6">
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
                    Пакетная загрузка
                  </h2>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Загрузите до 20 файлов сертификатов (PDF, JPG, PNG)
                  </p>
                </div>
              </div>
              <BatchFileUploader
                :loading="isProcessing"
                @upload="handleBatchUpload"
              />
            </div>

            <!-- Batch Step 2: Analysis -->
            <div v-else-if="batchCurrentStep === 2" class="space-y-6">
              <div class="flex items-center gap-3 mb-6">
                <div
                  class="h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0"
                  :class="{ 'animate-pulse': isProcessing }"
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
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-black dark:text-white">
                    Анализ файлов
                  </h2>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Идёт пакетная обработка и распознавание сертификатов
                  </p>
                </div>
              </div>
              <div v-if="isProcessing" class="text-center py-12">
                <div
                  class="h-16 w-16 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent"
                ></div>
                <h3 class="text-lg font-medium text-black dark:text-white">
                  Обработка...
                </h3>
                <p class="text-gray-500">
                  Пожалуйста, подождите, это может занять некоторое время.
                </p>
              </div>
              <div v-else class="text-center py-8">
                <!-- Fallback if analysis finishes but step doesn't change automatically (should typically not happen) -->
                <button
                  @click="analyzeBatch"
                  class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Запустить анализ
                </button>
              </div>
            </div>

            <!-- Batch Step 3: Select & Review -->
            <div v-else-if="batchCurrentStep === 3" class="space-y-6">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-black dark:text-white">
                    Проверка и выбор
                  </h2>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Проверьте результаты и выберите слушателей для каждого файла
                  </p>
                </div>
              </div>
              <BatchAnalysisResults
                :items="batchItems"
                :stats="batchStats"
                @toggle-item="toggleItemExpanded"
                @select-student="selectStudentForFile"
                @update-field="handleFieldUpdate"
              />
            </div>

            <!-- Batch Step 4: Confirm -->
            <div v-else-if="batchCurrentStep === 4" class="space-y-6">
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
                    Пакетное подтверждение
                  </h2>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Финальная проверка перед сохранением в базу
                  </p>
                </div>
              </div>
              <BatchConfirmPanel
                :items="batchItems"
                :stats="batchStats"
                :loading="isProcessing"
                @confirm="handleBatchConfirm"
                @cancel="batchCurrentStep = 3"
              />
            </div>

            <!-- Batch Step 5: Done (Summary) -->
            <div v-else-if="batchCurrentStep === 5" class="py-12 text-center">
              <div
                class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10"
              >
                <svg
                  class="h-10 w-10 text-success"
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
              <h3 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                Импорт завершен!
              </h3>
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Все готовые сертификаты были успешно добавлены в базу данных.
              </p>
              <div class="mt-8 flex justify-center gap-4">
                <button
                  @click="
                    resetBatch();
                    loadStats();
                  "
                  class="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                >
                  Загрузить ещё
                </button>
                <NuxtLink
                  to="/database?tab=certificates"
                  class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Перейти в базу
                </NuxtLink>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Actions Footer -->
      <div
        class="flex flex-col sm:flex-row justify-between items-center gap-3 px-6 lg:px-8 py-4 bg-gray-50 dark:bg-meta-4 border-t border-stroke dark:border-strokedark"
      >
        <button
          v-if="batchCurrentStep > 1 && batchCurrentStep < 5"
          @click="prevBatchStep"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          :disabled="isProcessing"
        >
          ← Назад
        </button>
        <div v-else></div>

        <button
          v-if="batchCurrentStep === 3"
          @click="nextBatchStep"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!canConfirmBatch"
        >
          Далее к подтверждению
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
      </div>
    </div>

    <!-- Processing Logs -->
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
import ImportStats from "~/components/database/ai-import/ImportStats.vue";
import ProcessingLogs from "~/components/database/ai-import/ProcessingLogs.vue";

// Batch Components
import BatchFileUploader from "~/components/certificates/BatchFileUploader.vue";
import BatchAnalysisResults from "~/components/certificates/BatchAnalysisResults.vue";
import BatchConfirmPanel from "~/components/certificates/BatchConfirmPanel.vue";

definePageMeta({
  layout: "default",
});

const {
  // Batch Mode
  batchItems,
  batchCurrentStep,
  batchStats,
  batchProgress,
  canConfirmBatch,
  isProcessing,

  // Actions
  reset,
  resetBatch,
  uploadBatch,
  analyzeBatch,
  selectStudentForFile,
  toggleItemExpanded,
  confirmBatchImport,

  // Stats
  getStats,
  getLogs,
} = useAICertificateImport();

// Steps definitions
const batchSteps = [
  { number: 1, name: "Загрузка" },
  { number: 2, name: "Анализ" },
  { number: 3, name: "Выбор" },
  { number: 4, name: "Подтверждение" },
  { number: 5, name: "Финиш" },
];

const stats = ref<AIImportStats | null>(null);
const logs = ref<AIProcessingLog[]>([]);
const logsPage = ref(1);
const totalPages = ref(1);

// --- Batch Mode Handlers ---
const handleBatchUpload = async (files: File[]) => {
  try {
    await uploadBatch(files);
    // Auto start analysis
    await analyzeBatch();
  } catch (e) {
    console.error(e);
  }
};

const nextBatchStep = () => {
  if (batchCurrentStep.value < 5) {
    batchCurrentStep.value++;
  }
};

const prevBatchStep = () => {
  if (batchCurrentStep.value > 1) {
    batchCurrentStep.value--;
  }
};

const handleBatchConfirm = async () => {
  try {
    await confirmBatchImport();
    // Refresh stats after confirm
    loadStats();
    loadLogs();
  } catch (e) {
    console.error(e);
  }
};

const handleFieldUpdate = ({
  fileId,
  field,
  value,
}: {
  fileId: string;
  field: string;
  value: any;
}) => {
  // Обновляем поле в batchItems
  const item = batchItems.value.find((i) => i.file.fileId === fileId);
  if (item?.analysisResult?.extractedData) {
    // Используем type assertion для динамического доступа к полям
    (item.analysisResult.extractedData as any)[field] = value;
  }
};

// --- Shared Data Loading ---
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
