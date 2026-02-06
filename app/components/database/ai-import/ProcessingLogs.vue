<template>
  <div
    class="bg-white dark:bg-boxdark shadow-sm rounded-lg border border-stroke dark:border-strokedark overflow-hidden"
  >
    <!-- Collapsible Header -->
    <button
      @click="toggleExpanded"
      class="w-full px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-meta-4 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          История импортов
        </h3>
        <span
          v-if="logs.length > 0"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
        >
          {{ logs.length }}
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <!-- Refresh Button -->
        <button
          @click.stop="$emit('refresh')"
          class="p-2 text-gray-500 dark:text-gray-400 hover:text-primary rounded-full hover:bg-white dark:hover:bg-boxdark transition-colors"
          title="Обновить"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <!-- Expand/Collapse Icon -->
        <svg
          class="h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
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
      <div v-if="isExpanded" class="overflow-hidden">
        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Дата
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Файл
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Студент
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  AI Модель
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Статус
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Стоимость
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="log in logs"
                :key="log.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <!-- Date -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(log.processingStartedAt) }}
                </td>

                <!-- File -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div
                    class="text-sm font-medium text-gray-900 truncate max-w-xs"
                    :title="log.originalFilename"
                  >
                    {{ log.originalFilename }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ formatBytes(log.fileSizeBytes) }}
                  </div>
                </td>

                <!-- Student / Match -->
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div v-if="log.extractedData" class="text-gray-900">
                    {{ log.extractedData.fullName }}
                  </div>
                  <div v-else class="text-gray-400 italic">Нет данных</div>

                  <div
                    v-if="log.matchMethod"
                    class="text-xs text-gray-500 mt-0.5 flex items-center"
                  >
                    <span
                      v-if="log.matchMethod === 'exact_pinfl'"
                      class="text-green-600 bg-green-50 px-1.5 rounded"
                      >ПИНФЛ</span
                    >
                    <span
                      v-else-if="log.matchMethod === 'exact_name'"
                      class="text-blue-600 bg-blue-50 px-1.5 rounded"
                      >ФИО</span
                    >
                    <span
                      v-else-if="log.matchMethod === 'fuzzy_ai'"
                      class="text-purple-600 bg-purple-50 px-1.5 rounded"
                      >AI</span
                    >
                    <span v-else class="text-gray-400 bg-gray-50 px-1.5 rounded"
                      >Ручной</span
                    >

                    <span v-if="log.matchConfidence" class="ml-1 text-gray-400">
                      ({{ Math.round(log.matchConfidence * 100) }}%)
                    </span>
                  </div>
                </td>

                <!-- Model -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {{ log.aiModel }}
                  </span>
                  <div class="text-xs text-gray-400 mt-1">
                    {{ log.aiTokensUsed }} токенов
                  </div>
                </td>

                <!-- Status -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="{
                      'bg-green-100 text-green-800': log.status === 'success',
                      'bg-red-100 text-red-800': log.status === 'failed',
                      'bg-yellow-100 text-yellow-800': log.status === 'partial',
                    }"
                  >
                    {{ getStatusLabel(log.status) }}
                  </span>
                  <div
                    v-if="log.errorMessage"
                    class="text-xs text-red-500 mt-1 max-w-xs truncate"
                    :title="log.errorMessage"
                  >
                    {{ log.errorMessage }}
                  </div>
                </td>

                <!-- Cost -->
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 font-mono"
                >
                  ${{ log.aiCostUsd?.toFixed(4) || "0.00" }}
                </td>
              </tr>
              <tr v-if="logs.length === 0">
                <td
                  colspan="6"
                  class="px-6 py-8 text-center text-gray-500 text-sm"
                >
                  Истории обработок пока нет
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination (Simplified) -->
        <div
          v-if="totalPages > 1"
          class="bg-white dark:bg-boxdark px-4 py-3 border-t border-gray-200 dark:border-strokedark flex items-center justify-between sm:px-6"
        >
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="$emit('page-change', currentPage - 1)"
              :disabled="currentPage <= 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Previous
            </button>
            <button
              @click="$emit('page-change', currentPage + 1)"
              :disabled="currentPage >= totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
          <div
            class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"
          >
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Страница <span class="font-medium">{{ currentPage }}</span> из
                <span class="font-medium">{{ totalPages }}</span>
              </p>
            </div>
            <div>
              <nav
                class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  @click="$emit('page-change', currentPage - 1)"
                  :disabled="currentPage <= 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span class="sr-only">Previous</span>
                  <!-- Heroicon name: solid/chevron-left -->
                  <svg
                    class="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L8.414 10l4.293 4.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  @click="$emit('page-change', currentPage + 1)"
                  :disabled="currentPage >= totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span class="sr-only">Next</span>
                  <!-- Heroicon name: solid/chevron-right -->
                  <svg
                    class="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L11.586 10 7.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { AIProcessingLog } from "~/../server/types/aiCertificateImport";

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
