<template>
  <div class="space-y-6">
    <!-- Header with Progress -->
    <div
      class="bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-700/50 shadow-xs"
    >
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart class="w-5 h-5 text-indigo-500" />
            Результаты распознавания
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {{ stats.analyzedFiles }} из {{ stats.totalFiles }} обработано
          </p>
        </div>
        <div class="text-right">
          <div class="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            {{ Math.round((stats.analyzedFiles / stats.totalFiles) * 100) }}%
          </div>
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">прогресс</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div
        class="relative h-2.5 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden ring-1 ring-inset ring-slate-900/5 dark:ring-white/5"
      >
        <div
          class="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-500 ease-out"
          :style="{
            width: `${(stats.analyzedFiles / stats.totalFiles) * 100}%`,
          }"
        ></div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <div class="text-center bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-center gap-1">
            <CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" /> Готово
          </div>
          <div class="text-2xl font-black text-slate-900 dark:text-white">{{ stats.readyFiles }}</div>
        </div>
        <div class="text-center bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-center gap-1">
            <AlertCircle class="h-3.5 w-3.5 text-red-500" /> Ошибки
          </div>
          <div class="text-2xl font-black text-slate-900 dark:text-white">{{ stats.errorFiles }}</div>
        </div>
        <div class="text-center bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-center gap-1">
            <Banknote class="h-3.5 w-3.5 text-amber-500" /> Стоимость
          </div>
          <div class="text-2xl font-black text-slate-900 dark:text-white">${{ stats.totalCost }}</div>
        </div>
      </div>
    </div>

    <!-- Items List -->
    <div class="space-y-3">
      <div
        v-for="item in items"
        :key="item.file.fileId"
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
      >
        <!-- Accordion Header -->
        <button
          @click="toggleItem(item.file.fileId)"
          class="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors bg-white dark:bg-slate-900"
        >
          <!-- Thumbnail -->
          <div
            class="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 relative"
          >
            <img
              v-if="item.file.previewUrl"
              :src="item.file.previewUrl"
              :alt="item.file.originalName"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-slate-400"
            >
              <Image class="h-6 w-6" />
            </div>
            
            <div v-if="item.uiStatus === 'error'" class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></div>
            <div v-else-if="item.uiStatus === 'ready'" class="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
          </div>

          <!-- Info -->
          <div class="flex-1 text-left min-w-0">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white truncate">
              {{ item.file.originalName }}
            </h4>
            <div class="flex items-center gap-2 mt-1.5 flex-wrap">
              <!-- Status Badge -->
              <span
                :class="[
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold',
                  getStatusClasses(item.uiStatus),
                ]"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="getStatusDotClasses(item.uiStatus)"
                ></span>
                {{ getStatusText(item.uiStatus) }}
              </span>

              <!-- Student Name if ready -->
              <span
                v-if="item.selectedStudent"
                class="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1"
              >
                <ArrowRight class="w-3 h-3 text-slate-300 dark:text-slate-600" />
                <span class="font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {{ item.selectedStudent.fullName }}
                </span>
              </span>
            </div>
          </div>

          <!-- Expand Icon -->
          <div class="shrink-0 h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <ChevronDown
              class="h-4 w-4 text-slate-400 transition-transform duration-300"
              :class="{ 'rotate-180': item.isExpanded }"
            />
          </div>
        </button>

        <!-- Accordion Content -->
        <transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-[2000px] opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="max-h-[2000px] opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <div
            v-if="item.isExpanded"
            class="border-t border-slate-100 dark:border-slate-800"
          >
            <div class="p-6 space-y-6">
              <!-- Error State -->
              <div
                v-if="item.uiStatus === 'error' && item.analysisResult?.error"
                class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
              >
                <div class="flex items-start gap-3">
                  <svg
                    class="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div class="flex-1">
                    <h5
                      class="text-sm font-semibold text-red-900 dark:text-red-200"
                    >
                      Ошибка обработки
                    </h5>
                    <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                      {{ item.analysisResult.error }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Extracted Data -->
              <div v-if="item.analysisResult?.extractedData" class="space-y-4">
                <div class="flex items-center justify-between mb-2">
                  <h5 class="text-sm font-bold text-slate-800 dark:text-white">
                    Извлечённые данные
                  </h5>
                  <span class="text-xs text-slate-400 dark:text-slate-500">
                    Все поля редактируемы
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- ФИО -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      ФИО <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="item.analysisResult.extractedData.fullName"
                      @input="handleFieldChange(item.file.fileId, 'fullName', $event.target.value)"
                      type="text"
                      required
                      class="w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600"
                      :class="{
                        'border-red-400 dark:border-red-500': !item.analysisResult.extractedData.fullName,
                      }"
                      placeholder="Введите ФИО"
                    />
                    <span
                      v-if="!item.analysisResult.extractedData.fullName"
                      class="text-xs text-red-500"
                    >
                      Обязательное поле
                    </span>
                  </div>

                  <!-- Номер сертификата -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-600 dark:text-slate-400">Номер сертификата</label>
                    <input
                      v-model="item.analysisResult.extractedData.certificateNumber"
                      @input="handleFieldChange(item.file.fileId, 'certificateNumber', $event.target.value)"
                      type="text"
                      class="w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600"
                      placeholder="Введите номер сертификата"
                    />
                  </div>

                  <!-- Дата выдачи -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-600 dark:text-slate-400">Дата выдачи</label>
                    <input
                      v-model="item.analysisResult.extractedData.issueDate"
                      @input="handleFieldChange(item.file.fileId, 'issueDate', $event.target.value)"
                      type="date"
                      class="w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600"
                    />
                  </div>

                  <!-- Название курса -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-600 dark:text-slate-400">Название курса</label>
                    <input
                      v-model="item.analysisResult.extractedData.courseName"
                      @input="handleFieldChange(item.file.fileId, 'courseName', $event.target.value)"
                      type="text"
                      class="w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600"
                      placeholder="Введите название курса"
                    />
                  </div>

                  <!-- Организация -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-600 dark:text-slate-400">Организация</label>
                    <input
                      v-model="item.analysisResult.extractedData.organization"
                      @input="handleFieldChange(item.file.fileId, 'organization', $event.target.value)"
                      type="text"
                      class="w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600"
                      placeholder="Введите организацию"
                    />
                  </div>

                  <!-- Длительность -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-600 dark:text-slate-400">Длительность</label>
                    <input
                      v-model="item.analysisResult.extractedData.duration"
                      @input="handleFieldChange(item.file.fileId, 'duration', $event.target.value)"
                      type="text"
                      class="w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600"
                      placeholder="Например: 72 часа"
                    />
                  </div>
                </div>
              </div>

              <!-- Student Match Section -->
              <div v-if="item.analysisResult?.matchResult">
                <StudentMatchAccordion
                  :file-id="item.file.fileId"
                  :match-result="item.analysisResult.matchResult"
                  :selected-student="item.selectedStudent"
                  @select="
                    (student) =>
                      $emit('select-student', item.file.fileId, student)
                  "
                />
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { BarChart, CheckCircle2, AlertCircle, Banknote, Image, ArrowRight, ChevronDown } from "lucide-vue-next";
import StudentMatchAccordion from "./StudentMatchAccordion.vue";

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  stats: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["toggle-item", "select-student", "update-field"]);

// Methods
const toggleItem = (fileId) => {
  emit("toggle-item", fileId);
};

const handleFieldChange = (fileId, field, value) => {
  // Эмитим изменение поля наверх для сохранения в состоянии
  emit("update-field", { fileId, field, value });
};

const getStatusClasses = (status) => {
  const classes = {
    uploaded:  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    analyzing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    analyzed:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    ready:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    error:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };
  return classes[status] || classes.uploaded;
};

const getStatusDotClasses = (status) => {
  const classes = {
    uploaded: "bg-gray-500",
    analyzing: "bg-blue-500 animate-pulse",
    analyzed: "bg-purple-500",
    ready: "bg-success",
    error: "bg-danger",
    confirmed: "bg-success",
  };
  return classes[status] || classes.uploaded;
};

const getStatusText = (status) => {
  const texts = {
    uploaded: "Загружен",
    analyzing: "Анализ...",
    analyzed: "Проанализирован",
    ready: "Готов",
    error: "Ошибка",
    confirmed: "Подтверждён",
  };
  return texts[status] || "Неизвестно";
};
</script>

<style scoped>
/* Плавная анимация для accordion */
.max-h-0 {
  max-height: 0;
  overflow: hidden;
}

.max-h-\[2000px\] {
  max-height: 2000px;
  overflow: hidden;
}
</style>
