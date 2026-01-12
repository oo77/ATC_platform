<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок -->
    <div class="text-center">
      <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <svg
          v-if="progress.status === 'processing'"
          class="h-10 w-10 animate-spin text-primary"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <svg
          v-else-if="progress.status === 'completed'"
          class="h-10 w-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg
          v-else-if="progress.status === 'failed'"
          class="h-10 w-10 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ statusText }}
      </h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {{ statusDescription }}
      </p>
    </div>

    <!-- Прогресс-бар -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark">
      <div class="mb-4 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Обработано записей
        </span>
        <span class="text-sm font-bold text-primary">
          {{ progress.processedRows }} / {{ progress.totalRows }}
        </span>
      </div>
      
      <!-- Прогресс-бар с анимацией -->
      <div class="relative h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          class="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out"
          :style="{ width: `${progressPercentage}%` }"
        >
          <div class="h-full w-full animate-pulse bg-white/20" />
        </div>
      </div>
      
      <div class="mt-2 text-center">
        <span class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ progressPercentage }}%
        </span>
      </div>
    </div>

    <!-- Статистика в реальном времени -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CommonStatCard
        v-for="stat in progressStats"
        :key="stat.label"
        :label="stat.label"
        :value="stat.value"
        :variant="stat.variant"
        hover-effect
      >
        <template #icon>
          <component :is="stat.icon" />
        </template>
      </CommonStatCard>
    </div>

    <!-- Ошибки в реальном времени -->
    <div
      v-if="progress.errors && progress.errors.length > 0"
      class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
    >
      <div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-red-900 dark:text-red-100">
              Ошибки при импорте
            </h4>
            <p class="text-sm text-red-700 dark:text-red-300">
              {{ pluralizeRecords(progress.errors.length) }} не удалось импортировать
            </p>
          </div>
        </div>
      </div>
      <div class="max-h-60 overflow-y-auto p-6">
        <div class="space-y-3">
          <div
            v-for="(error, index) in displayedErrors"
            :key="index"
            class="rounded-lg bg-white p-4 dark:bg-gray-800"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <p class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                  Строка {{ error.rowNumber }} • ПИНФЛ: {{ error.pinfl }}
                </p>
                <p class="text-sm text-red-600 dark:text-red-400">
                  {{ error.error }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <p v-if="remainingErrors > 0" class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          И ещё {{ pluralizeErrors(remainingErrors) }}...
        </p>
      </div>
    </div>

    <!-- Индикатор активности -->
    <div v-if="progress.status === 'processing'" class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <div class="flex gap-1">
        <div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="animation-delay: 0ms" />
        <div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="animation-delay: 150ms" />
        <div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="animation-delay: 300ms" />
      </div>
      <span>Импорт в процессе...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { pluralizeRecords, pluralizeErrors } from '~/utils/pluralize';
import type { ImportProgress } from '~/types/import';

const props = defineProps<{
  progress: ImportProgress;
}>();

const MAX_DISPLAYED_ERRORS = 10;

const progressPercentage = computed(() => {
  if (props.progress.totalRows === 0) return 0;
  return Math.round((props.progress.processedRows / props.progress.totalRows) * 100);
});

const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    processing: 'Импорт данных',
    completed: 'Импорт завершён',
    failed: 'Импорт не удался',
  };
  return statusMap[props.progress.status] || 'Ожидание';
});

const statusDescription = computed(() => {
  const descriptionMap: Record<string, string> = {
    processing: 'Пожалуйста, подождите. Это может занять некоторое время...',
    completed: 'Все данные успешно обработаны',
    failed: 'Произошла ошибка при импорте данных',
  };
  return descriptionMap[props.progress.status] || 'Подготовка к импорту...';
});

// Статистические карточки прогресса
const progressStats = computed(() => [
  {
    label: 'Успешно',
    value: props.progress.successCount,
    variant: 'green' as const,
    icon: resolveComponent('CommonIconsIconCheck'),
  },
  {
    label: 'Создано',
    value: props.progress.createdCount,
    variant: 'blue' as const,
    icon: resolveComponent('CommonIconsIconPlus'),
  },
  {
    label: 'Обновлено',
    value: props.progress.updatedCount,
    variant: 'orange' as const,
    icon: resolveComponent('CommonIconsIconRefresh'),
  },
  {
    label: 'Ошибки',
    value: props.progress.errorCount,
    variant: 'red' as const,
    icon: resolveComponent('CommonIconsIconExclamationCircle'),
  },
]);

// Ошибки для отображения (первые N)
const displayedErrors = computed(() => {
  return (props.progress.errors || []).slice(0, MAX_DISPLAYED_ERRORS);
});

// Количество оставшихся ошибок
const remainingErrors = computed(() => {
  const total = props.progress.errors?.length || 0;
  return Math.max(0, total - MAX_DISPLAYED_ERRORS);
});
</script>
