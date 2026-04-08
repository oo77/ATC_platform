<template>
  <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/60 dark:border-slate-800/60 overflow-hidden flex flex-col h-full">
    <!-- Collapsible Header -->
    <button
      @click="toggleExpanded"
      class="w-full px-6 py-5 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
    >
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700/50">
          <History class="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </div>
        <div class="text-left">
          <h3 class="text-base font-bold text-slate-900 dark:text-white leading-tight">История импортов</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Журнал обработки сертификатов</p>
        </div>
        <span
          v-if="logs.length > 0"
          class="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          {{ logs.length }}
        </span>
      </div>
      <div class="flex items-center gap-1.5">
        <!-- Refresh Button -->
        <button
          @click.stop="$emit('refresh')"
          class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Обновить"
        >
          <RefreshCw class="h-4 w-4" />
        </button>
        <ChevronDown
          class="h-5 w-5 text-slate-400 transition-transform duration-300"
          :class="{ 'rotate-180': isExpanded }"
        />
      </div>
    </button>

    <!-- Collapsible Content -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[2000px] opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="max-h-[2000px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-if="isExpanded" class="overflow-hidden border-t border-slate-100 dark:border-slate-800 flex-1 flex flex-col">
        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead class="bg-slate-50/80 dark:bg-slate-800/30">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Дата</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Файл</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Слушатель</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Модель</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Статус</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Стоимость</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="log in logs"
                :key="log.id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <!-- Date -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                  {{ formatDate(log.processingStartedAt) }}
                </td>

                <!-- File -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs" :title="log.originalFilename">
                    {{ log.originalFilename }}
                  </div>
                  <div class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {{ formatBytes(log.fileSizeBytes) }}
                  </div>
                </td>

                <!-- Student / Match -->
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div v-if="log.extractedData" class="text-slate-800 dark:text-slate-200 font-medium">
                    {{ log.extractedData.fullName }}
                  </div>
                  <div v-else class="text-slate-400 italic text-xs">Нет данных</div>
                  <div v-if="log.matchMethod" class="flex items-center gap-1 mt-1">
                    <span v-if="log.matchMethod === 'exact_pinfl'" class="font-mono text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">ПИНФЛ</span>
                    <span v-else-if="log.matchMethod === 'exact_name'" class="font-mono text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">ФИО</span>
                    <span v-else-if="log.matchMethod === 'fuzzy_ai'" class="font-mono text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">AI</span>
                    <span v-else class="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Ручной</span>
                    <span v-if="log.matchConfidence" class="text-xs text-slate-400">({{ Math.round(log.matchConfidence * 100) }}%)</span>
                  </div>
                </td>

                <!-- Model -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {{ log.aiModel }}
                  </span>
                  <div class="text-xs text-slate-400 mt-1">{{ log.aiTokensUsed }} токенов</div>
                </td>

                <!-- Status -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2.5 py-1 text-xs font-semibold rounded-full"
                    :class="{
                      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400': log.status === 'success',
                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400': log.status === 'failed',
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400': log.status === 'partial',
                    }"
                  >
                    {{ getStatusLabel(log.status) }}
                  </span>
                  <div v-if="log.errorMessage" class="text-xs text-red-500 mt-1 max-w-xs truncate" :title="log.errorMessage">
                    {{ log.errorMessage }}
                  </div>
                </td>

                <!-- Cost -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-slate-500 dark:text-slate-400">
                  ${{ log.aiCostUsd?.toFixed(4) || "0.00" }}
                </td>
              </tr>
              <tr v-if="logs.length === 0">
                <td colspan="6" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span class="text-sm">Истории обработок пока нет</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/30"
        >
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Страница <span class="font-semibold text-slate-700 dark:text-slate-200">{{ currentPage }}</span> из
            <span class="font-semibold text-slate-700 dark:text-slate-200">{{ totalPages }}</span>
          </p>
          <nav class="flex items-center gap-1">
            <button
              @click="$emit('page-change', currentPage - 1)"
              :disabled="currentPage <= 1"
              class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              @click="$emit('page-change', currentPage + 1)"
              :disabled="currentPage >= totalPages"
              class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { AIProcessingLog } from "~/../server/types/aiCertificateImport";
import { History, RefreshCw, ChevronDown } from "lucide-vue-next";

const props = defineProps<{
  logs: AIProcessingLog[];
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  (e: "page-change", page: number): void;
  (e: "refresh"): void;
}>();

const isExpanded = ref(false);

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleString("ru-RU");
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "success":
      return "Успешно";
    case "failed":
      return "Ошибка";
    case "partial":
      return "Частично";
    default:
      return status;
  }
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
