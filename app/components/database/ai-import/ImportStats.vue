<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Обработано -->
    <div
      class="bg-white dark:bg-boxdark p-6 rounded-xl shadow-sm border border-stroke dark:border-strokedark"
    >
      <div class="flex items-center">
        <div
          class="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg text-primary mr-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Всего обработано
          </p>
          <h3 class="text-2xl font-bold text-black dark:text-white">
            {{ stats.totalProcessed || 0 }}
          </h3>
        </div>
      </div>
      <div class="mt-4 flex items-center text-sm">
        <span class="text-success font-medium flex items-center mr-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          {{ successRate }}%
        </span>
        <span class="text-gray-400 dark:text-gray-500">успешно</span>
      </div>
    </div>

    <!-- Точность AI -->
    <div
      class="bg-white dark:bg-boxdark p-6 rounded-xl shadow-sm border border-stroke dark:border-strokedark"
    >
      <div class="flex items-center">
        <div
          class="bg-success/10 dark:bg-success/20 p-3 rounded-lg text-success mr-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Средняя уверенность AI
          </p>
          <h3 class="text-2xl font-bold text-black dark:text-white">
            {{ averageConfidence }}%
          </h3>
        </div>
      </div>
      <div class="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          class="bg-success h-1.5 rounded-full transition-all duration-300"
          :style="{ width: `${averageConfidence}%` }"
        ></div>
      </div>
    </div>

    <!-- Расходы -->
    <div
      class="bg-white dark:bg-boxdark p-6 rounded-xl shadow-sm border border-stroke dark:border-strokedark"
    >
      <div class="flex items-center">
        <div
          class="bg-warning/10 dark:bg-warning/20 p-3 rounded-lg text-warning mr-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Общие расходы
          </p>
          <h3 class="text-2xl font-bold text-black dark:text-white">
            ${{ totalCost }}
          </h3>
        </div>
      </div>
      <div class="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Средняя стоимость: ${{ averageCost }} / шт.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AIImportStats } from "~/../server/types/aiCertificateImport";

const props = defineProps<{
  stats: AIImportStats;
}>();

const successRate = computed(() => {
  return props.stats.successRate
    ? Math.round(props.stats.successRate * 100)
    : 0;
});

const averageConfidence = computed(() => {
  return props.stats.averageConfidence
    ? Math.round(props.stats.averageConfidence * 100)
    : 0;
});

const totalCost = computed(() => {
  return props.stats.totalCost ? props.stats.totalCost.toFixed(2) : "0.00";
});

const averageCost = computed(() => {
  return props.stats.averageCost ? props.stats.averageCost.toFixed(3) : "0.000";
});
</script>
