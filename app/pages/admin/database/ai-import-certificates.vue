<template>
  <div class="flex flex-col gap-6 max-w-7xl mx-auto w-full">
    <!-- Breadcrumbs & Header -->
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <NuxtLink
            to="/database/import-certificates"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
          >
            <Database class="w-4 h-4" />
            База сертификатов
          </NuxtLink>
          <ChevronRight class="w-4 h-4 text-slate-300 dark:text-slate-600" />
          <span class="text-slate-900 dark:text-white flex items-center gap-1.5 flex-nowrap">
            <Bot class="w-4 h-4 text-purple-500" />
            AI Импорт
          </span>
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            AI Импорт Сертификатов
          </h1>
          <p class="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Пакетное распознавание и импорт с помощью искусственного интеллекта
          </p>
        </div>
      </div>
    </div>

    <!-- Stats Card -->
    <ImportStats v-if="stats" :stats="stats" />

    <!-- Main Bento Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      
      <!-- LEFT SIDEBAR: Wizard Progress (Bento Block) -->
      <div class="xl:col-span-4 flex flex-col gap-6">
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
          <div class="flex items-center gap-3 mb-6">
            <div class="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Route class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white leading-tight">Прогресс</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Шаг {{ batchCurrentStep }} из {{ batchSteps.length }}</p>
            </div>
          </div>

          <div class="relative pl-3 mt-4">
            <!-- Vertical Line -->
            <div class="absolute top-4 bottom-4 left-5 w-0.5 bg-slate-100 dark:bg-slate-800/80"></div>
            <!-- Active Line -->
            <div
              class="absolute top-4 left-5 w-0.5 rounded-full bg-blue-500 transition-all duration-500 origin-top"
              :style="{ height: `${((batchCurrentStep - 1) / (batchSteps.length - 1)) * 100}%` }"
            ></div>

            <div class="flex flex-col gap-6 relative">
              <div v-for="step in batchSteps" :key="step.number" class="flex items-start gap-4">
                <div
                  class="relative shrink-0 flex h-5 w-5 rounded-full border-2 transition-all duration-300 z-10 bg-white dark:bg-slate-900 mt-0.5"
                  :class="[
                    batchCurrentStep === step.number
                      ? 'border-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/20 shadow-sm shadow-blue-500/20'
                      : batchCurrentStep > step.number
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-200 dark:border-slate-700'
                  ]"
                >
                  <div v-if="batchCurrentStep > step.number" class="absolute inset-0 flex items-center justify-center">
                    <Check class="w-3 h-3 text-white" stroke-width="3" />
                  </div>
                  <div v-if="batchCurrentStep === step.number" class="absolute inset-0 flex items-center justify-center">
                    <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                </div>
                <div>
                  <h4
                    class="text-sm font-semibold transition-colors"
                    :class="[
                      batchCurrentStep >= step.number
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-slate-500'
                    ]"
                  >
                    {{ step.name }}
                  </h4>
                  <p v-if="step.description" class="text-xs mt-0.5" :class="[batchCurrentStep >= step.number ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400/60 dark:text-slate-600']">
                    {{ step.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ProcessingLogs
          :logs="logs"
          :current-page="logsPage"
          :total-pages="totalPages"
          @page-change="handlePageChange"
          @refresh="loadLogs"
        />
      </div>

      <!-- RIGHT SIDE: Main Work Area (Bento Block) -->
      <div class="xl:col-span-8 flex flex-col">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden flex flex-col flex-1 min-h-[500px]">
          
          <!-- Content Area -->
          <div class="p-6 md:p-8 flex-1">
            <transition name="fade-slide" mode="out-in">
              <div :key="'batch-' + batchCurrentStep" class="h-full">
                
                <!-- Batch Step 1: Upload -->
                <div v-if="batchCurrentStep === 1" class="space-y-6 h-full flex flex-col">
                  <div class="flex items-start gap-4">
                    <div class="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/30">
                      <FileUp class="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-slate-900 dark:text-white">Пакетная загрузка</h2>
                      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Загрузите до 20 файлов сертификатов (PDF, JPG, PNG)</p>
                    </div>
                  </div>

                  <!-- Фильтр по организации -->
                  <div class="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/20 p-5 mt-6">
                    <div class="flex items-start gap-4">
                      <div class="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800/30">
                        <Building2 class="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div class="flex-1">
                        <label class="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
                          Сузить радиус поиска
                        </label>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
                          Укажите организацию для ускорения матчинга слушателей. Опционально.
                        </p>
                        <div class="relative group">
                          <select
                            id="organization-select"
                            v-model="selectedOrgId"
                            class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer outline-none hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50"
                            :disabled="orgsLoading"
                          >
                            <option value="">
                              {{ orgsLoading ? 'Загрузка...' : '— Искать по всей базе слушателей' }}
                            </option>
                            <option v-for="org in organizations" :key="org.id" :value="org.id">
                              {{ org.name }}
                              <template v-if="org.studentsCount > 0"> ({{ org.studentsCount }} сл.)</template>
                            </option>
                          </select>
                          <div class="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                            <ChevronDown class="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                          </div>
                        </div>
                        <div v-if="selectedOrgId" class="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800/30 w-fit">
                          <Target class="h-3.5 w-3.5" />
                          <span>Поиск сужен до {{ selectedOrg?.studentsCount ?? '?' }} слушателей</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex-1">
                    <BatchFileUploader :loading="isProcessing" @upload="handleBatchUpload" />
                  </div>
                </div>

                <!-- Batch Step 2: Analysis -->
                <div v-else-if="batchCurrentStep === 2" class="space-y-6 h-full flex flex-col justify-center items-center text-center py-12">
                  <div class="relative w-24 h-24 flex items-center justify-center mb-6">
                    <div class="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                    <div v-if="isProcessing" class="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-full h-16 w-16 w-full h-full flex items-center justify-center relative z-10 m-3">
                      <BrainCircuit class="h-8 w-8 text-purple-600 dark:text-purple-400" :class="{ 'animate-pulse': isProcessing }" />
                    </div>
                  </div>
                  
                  <div class="max-w-md">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Анализ файлов</h2>
                    <p class="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                      {{ isProcessing ? 'Искусственный интеллект считывает данные из сертификатов и ищет совпадения в базе слушателей...' : 'Файлы успешно загружены. Запустите процесс интеллектуального распознавания.' }}
                    </p>
                    <button
                      v-if="!isProcessing"
                      @click="() => analyzeBatch(selectedOrgId || null)"
                      class="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold transition-all shadow-sm active:scale-[0.98]"
                    >
                      <Sparkles class="w-5 h-5" />
                      Запустить распознавание
                    </button>
                  </div>
                </div>

                <!-- Batch Step 3: Select & Review -->
                <div v-else-if="batchCurrentStep === 3" class="space-y-6">
                  <div class="flex items-start gap-4">
                    <div class="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/30">
                      <UserCheck class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-slate-900 dark:text-white">Проверка и выбор</h2>
                      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Подтвердите данные или выберите слушателей вручную</p>
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
                  <div class="flex items-start gap-4">
                    <div class="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/30">
                      <ShieldCheck class="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-slate-900 dark:text-white">Подтверждение</h2>
                      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Финальная проверка перед сохранением в базу</p>
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

                <!-- Batch Step 5: Done -->
                <div v-else-if="batchCurrentStep === 5" class="py-20 text-center flex flex-col items-center">
                  <div class="h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 ring-8 ring-emerald-50 dark:ring-emerald-900/10">
                    <CheckCircle2 class="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Импорт завершен!</h3>
                  <p class="mt-3 text-lg text-slate-500 dark:text-slate-400 max-w-md">
                    Все готовые сертификаты были успешно обработаны и добавлены в базу данных.
                  </p>
                  <div class="mt-10 flex flex-col sm:flex-row justify-center gap-4 w-full max-w-sm">
                    <button
                      @click="resetBatch(); loadStats();"
                      class="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98]"
                    >
                      <Plus class="w-4 h-4" />
                      Новый импорт
                    </button>
                    <NuxtLink
                      to="/database/certificates"
                      class="flex-1 inline-flex justify-center items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                    >
                      <Database class="w-4 h-4" />
                      В базу
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <!-- Actions Footer (only for interactive steps) -->
          <div
            v-if="batchCurrentStep > 1 && batchCurrentStep < 5"
            class="px-6 md:px-8 py-5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-4 mt-auto"
          >
            <button
              @click="prevBatchStep"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98]"
              :disabled="isProcessing"
            >
              <ArrowLeft class="w-4 h-4" />
              Назад
            </button>

            <button
              v-if="batchCurrentStep === 3"
              @click="nextBatchStep"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
              :disabled="!canConfirmBatch"
            >
              Подтверждение
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
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

// Lucide Icons
import {
  ChevronRight,
  Database,
  Bot,
  Route,
  Check,
  FileUp,
  Building2,
  ChevronDown,
  Target,
  BrainCircuit,
  Sparkles,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Plus,
  ArrowLeft,
  ArrowRight
} from "lucide-vue-next";

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
  { number: 1, name: "Пакетная загрузка", description: "Файлы сертификатов" },
  { number: 2, name: "Распознавание", description: "Извлечение AI" },
  { number: 3, name: "Сопоставление", description: "Матчинг слушателей" },
  { number: 4, name: "Подтверждение", description: "Финальная проверка" },
  { number: 5, name: "Завершение", description: "Сохранение в базу" },
];

const stats = ref<AIImportStats | null>(null);
const logs = ref<AIProcessingLog[]>([]);
const logsPage = ref(1);
const totalPages = ref(1);

// Организация для сужения радиуса поиска
const selectedOrgId = ref<string>("");
const organizations = ref<Array<{ id: string; name: string; studentsCount: number }>>([]);
const orgsLoading = ref(false);

const selectedOrg = computed(() =>
  organizations.value.find((o) => o.id === selectedOrgId.value) ?? null
);

const loadOrganizations = async () => {
  orgsLoading.value = true;
  try {
    const result: any = await ($fetch as any)("/api/organizations?limit=200&isActive=true");
    organizations.value = (result.data || []).map((o: any) => ({
      id: o.id,
      name: o.name,
      studentsCount: o.studentsCount ?? 0,
    }));
  } catch (e) {
    console.error("Ошибка загрузки организаций:", e);
  } finally {
    orgsLoading.value = false;
  }
};

// --- Batch Mode Handlers ---
const handleBatchUpload = async (files: File[]) => {
  try {
    await uploadBatch(files);
    // Auto start analysis — передаём ID выбранной организации
    await analyzeBatch(selectedOrgId.value || null);
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
  loadOrganizations();
});
</script>

<style scoped>
/* Fade + slide transition for step changes */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

