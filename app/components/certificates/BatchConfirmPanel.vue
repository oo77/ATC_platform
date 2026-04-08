<template>
  <div class="space-y-6">
    <!-- Summary Card -->
    <div
      class="bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-700/50 shadow-xs"
    >
      <div class="flex items-start justify-between mb-8">
        <div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            Подтверждение импорта
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Проверьте сводку результатов перед финальным сохранением
          </p>
        </div>
        <div
          class="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/50 shadow-sm"
        >
          <FileCheck class="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm">
          <div class="text-3xl font-black text-slate-900 dark:text-white mb-1">{{ stats.totalFiles }}</div>
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Всего файлов</div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm">
          <div class="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{{ stats.readyFiles }}</div>
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Готовы к импорту</div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm">
          <div class="text-3xl font-black text-amber-600 dark:text-amber-400 mb-1">{{ stats.totalFiles - stats.readyFiles }}</div>
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Требуют внимания</div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm">
          <div class="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">${{ stats.totalCost }}</div>
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Стоимость AI</div>
        </div>
      </div>
    </div>

    <!-- Ready Items List -->
    <div
      v-if="readyItems.length > 0"
      class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-xs"
    >
      <div class="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h4 class="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          Сертификаты к импорту
          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{{ readyItems.length }}</span>
        </h4>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
        <div
          v-for="item in readyItems"
          :key="item.file.fileId"
          class="px-6 md:px-8 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        >
          <div class="flex items-center gap-4">
            <!-- Checkmark Icon -->
            <div class="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center shrink-0">
              <Check class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                <h5 class="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {{ item.analysisResult?.extractedData?.fullName || "Без имени" }}
                </h5>
                <span class="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-blue-700 dark:text-blue-400 font-semibold">
                  {{ item.analysisResult?.extractedData?.certificateNumber || "Без номера" }}
                </span>
              </div>
              <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <User class="h-3.5 w-3.5 shrink-0" />
                <span class="truncate">{{ item.selectedStudent?.fullName }}</span>
              </div>
            </div>

            <!-- Match Score -->
            <div class="shrink-0 text-right">
              <div class="text-lg font-black text-emerald-600 dark:text-emerald-400">{{ getMatchScore(item) }}%</div>
              <div class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">совпадение</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Warnings for items needing attention -->
    <div
      v-if="itemsNeedingAttention.length > 0"
      class="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/50 rounded-3xl p-6 shadow-sm shadow-amber-500/5"
    >
      <div class="flex items-start gap-4">
        <div class="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/50">
          <AlertTriangle class="h-5 w-5 text-amber-600 dark:text-amber-500" />
        </div>
        <div class="flex-1">
          <h5 class="text-sm font-bold text-amber-900 dark:text-amber-300 mb-2.5">
            Требуют внимания ({{ itemsNeedingAttention.length }})
          </h5>
          <ul class="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            <li v-for="item in itemsNeedingAttention.slice(0, 3)" :key="item.file.fileId" class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"></span>
              <span class="truncate">{{ item.file.originalName }}</span>
              <span class="text-xs text-slate-400 dark:text-slate-500 ml-1">({{ getItemIssue(item) }})</span>
            </li>
            <li v-if="itemsNeedingAttention.length > 3" class="text-xs text-slate-400 italic pt-1">
              и ещё {{ itemsNeedingAttention.length - 3 }}...
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-3 pt-4">
      <button
        @click="$emit('cancel')"
        :disabled="loading"
        class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-slate-200/80 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
      >
        <X class="h-5 w-5" />
        Отменить
      </button>

      <button
        @click="$emit('confirm')"
        :disabled="!canConfirm || loading"
        class="flex-1 sm:flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400 transition-all shadow-sm shadow-emerald-500/20 hover:shadow-md"
      >
        <Check v-if="!loading" class="h-5 w-5" />
        <div v-else class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        <span v-if="loading">Импорт...</span>
        <span v-else>Импортировать {{ readyItems.length }} сертификатов</span>
      </button>
    </div>

    <!-- Progress Indicator -->
    <div
      v-if="loading"
      class="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/60 dark:border-blue-800/50 rounded-3xl p-5 shadow-sm shadow-blue-500/5"
    >
      <div class="flex items-center gap-4">
        <div class="h-8 w-8 shrink-0 animate-spin rounded-full border-3 border-blue-500 border-t-transparent"></div>
        <div class="flex-1">
          <p class="text-sm font-bold text-slate-900 dark:text-white">Импорт в процессе...</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Пожалуйста, не закрывайте страницу</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { FileCheck, Check, User, AlertTriangle, X } from "lucide-vue-next";

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
