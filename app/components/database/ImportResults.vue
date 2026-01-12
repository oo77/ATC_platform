<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок с иконкой успеха/ошибки -->
    <div class="text-center">
      <div
        :class="[
          'mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full',
          isSuccess ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
        ]"
      >
        <svg
          v-if="isSuccess"
          class="h-12 w-12 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg
          v-else
          class="h-12 w-12 text-red-600 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-3xl font-bold text-gray-900 dark:text-white">
        {{ isSuccess ? 'Импорт завершён успешно!' : 'Импорт завершён с ошибками' }}
      </h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {{ resultDescription }}
      </p>
    </div>

    <!-- Итоговая статистика -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CommonStatCard
        v-for="stat in resultStats"
        :key="stat.label"
        :label="stat.label"
        :value="stat.value"
        :variant="stat.variant"
        large
      >
        <template #icon>
          <component :is="stat.icon" />
        </template>
      </CommonStatCard>
    </div>

    <!-- Дополнительная информация -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <!-- Время выполнения -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Время выполнения</p>
            <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ duration }}</p>
          </div>
        </div>
      </div>

      <!-- Успешность -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Успешность</p>
            <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ successRate }}%</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Детали ошибок -->
    <div
      v-if="result.errors && result.errors.length > 0"
      class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
    >
      <div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 class="text-lg font-semibold text-red-900 dark:text-red-100">
                Детали ошибок
              </h4>
              <p class="text-sm text-red-700 dark:text-red-300">
                {{ pluralizeRecords(result.errors.length) }} не удалось импортировать
              </p>
            </div>
          </div>
          <button
            @click="downloadErrorReport"
            class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Скачать отчёт
          </button>
        </div>
      </div>
      <div class="max-h-80 overflow-y-auto p-6">
        <div class="space-y-3">
          <div
            v-for="(error, index) in result.errors"
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
      </div>
    </div>

    <!-- Кнопки действий -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
      <button
        @click="$emit('newImport')"
        class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Новый импорт
      </button>
      <button
        @click="$emit('goToDatabase')"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
        Перейти к базе данных
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { pluralizeRecords } from '~/utils/pluralize';
import type { ImportProgress } from '~/types/import';

interface ImportError {
  rowNumber: number;
  pinfl: string;
  error: string;
}

const props = defineProps<{
  result: ImportProgress;
}>();

defineEmits<{
  newImport: [];
  goToDatabase: [];
}>();

// Успешность определяется отсутствием ошибок или наличием хотя бы одного успеха
const isSuccess = computed(() => {
  return (props.result.errorCount ?? 0) === 0;
});

const resultDescription = computed(() => {
  const processed = props.result.processedRows ?? 0;
  const errors = props.result.errorCount ?? 0;
  const success = props.result.successCount ?? 0;
  
  if (errors === 0) {
    return `Все ${processed} записей успешно импортированы`;
  }
  return `${success} из ${processed} записей импортированы успешно`;
});

const duration = computed(() => {
  if (!props.result.completedAt) return '—';
  const ms = new Date(props.result.completedAt).getTime() - new Date(props.result.startedAt).getTime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes} мин ${seconds % 60} сек`;
  }
  return `${seconds} сек`;
});

const successRate = computed(() => {
  const processed = props.result.processedRows ?? 0;
  const success = props.result.successCount ?? 0;
  
  if (processed === 0) return 0;
  return Math.round((success / processed) * 100);
});

// Статистические карточки результатов
// Используем nullish coalescing для защиты от undefined значений с сервера
const resultStats = computed(() => [
  {
    label: 'Всего обработано',
    value: props.result.processedRows ?? 0,
    variant: 'blue' as const,
    icon: resolveComponent('CommonIconsIconDocument'),
  },
  {
    label: 'Создано новых',
    value: props.result.createdCount ?? 0,
    variant: 'green' as const,
    icon: resolveComponent('CommonIconsIconUserAdd'),
  },
  {
    label: 'Обновлено',
    value: props.result.updatedCount ?? 0,
    variant: 'orange' as const,
    icon: resolveComponent('CommonIconsIconRefresh'),
  },
  {
    label: 'Ошибки',
    value: props.result.errorCount ?? 0,
    variant: 'red' as const,
    icon: resolveComponent('CommonIconsIconExclamationCircle'),
  },
]);

/**
 * Экранирование значения для CSV
 */
const escapeCsvValue = (value: string | number): string => {
  const strValue = String(value);
  // Если значение содержит запятую, кавычки или перенос строки - оборачиваем в кавычки
  if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
    return `"${strValue.replace(/"/g, '""')}"`;
  }
  return strValue;
};

/**
 * Скачивание отчёта об ошибках в CSV
 */
const downloadErrorReport = () => {
  const headers = ['Строка', 'ПИНФЛ', 'Ошибка'];
  const rows = (props.result.errors || []).map((error: ImportError) => [
    error.rowNumber,
    error.pinfl,
    error.error,
  ]);

  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map(row => row.map(escapeCsvValue).join(',')),
  ].join('\n');

  // Создаём blob с BOM для корректного отображения кириллицы в Excel
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  
  link.href = URL.createObjectURL(blob);
  link.download = `import-errors-${timestamp}.csv`;
  link.click();
  
  // Освобождаем ресурсы
  URL.revokeObjectURL(link.href);
};
</script>
