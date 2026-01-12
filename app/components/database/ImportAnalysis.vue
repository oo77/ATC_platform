<template>
  <div class="flex flex-col gap-6">
    <!-- Сводка анализа -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <CommonStatCard
        v-for="stat in summaryStats"
        :key="stat.label"
        :label="stat.label"
        :value="stat.value"
        :variant="stat.variant"
      >
        <template #icon>
          <component :is="stat.icon" />
        </template>
      </CommonStatCard>
    </div>

    <!-- Ошибки валидации -->
    <div 
      v-if="analysis.invalidRows > 0" 
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
              Обнаружены ошибки валидации
            </h4>
            <p class="text-sm text-red-700 dark:text-red-300">
              {{ pluralizeRows(analysis.invalidRows) }} {{ pluralize(analysis.invalidRows, 'содержит', 'содержат', 'содержат') }} ошибки и {{ pluralize(analysis.invalidRows, 'будет пропущена', 'будут пропущены', 'будут пропущены') }}
            </p>
          </div>
        </div>
      </div>
      <div class="max-h-60 overflow-y-auto p-6">
        <div class="space-y-3">
          <div
            v-for="error in displayedErrors"
            :key="error.rowNumber"
            class="rounded-lg bg-white p-4 dark:bg-gray-800"
          >
            <p class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              Строка {{ error.rowNumber }}
            </p>
            <ul class="space-y-1">
              <li
                v-for="(err, index) in error.errors"
                :key="index"
                class="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
              >
                <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {{ err }}
              </li>
            </ul>
          </div>
        </div>
        <p v-if="remainingErrors > 0" class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          И ещё {{ pluralizeErrors(remainingErrors) }}...
        </p>
      </div>
    </div>

    <!-- Предпросмотр данных -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
          Предпросмотр данных
        </h4>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Показаны первые {{ previewCount }} {{ pluralize(previewCount, 'валидная запись', 'валидные записи', 'валидных записей') }}
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">№</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ПИНФЛ</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ФИО</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Организация</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Служба/Отдел</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Должность</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Статус</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="(item, index) in (analysis.preview || [])"
              :key="index"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ item.rowNumber }}</td>
              <td class="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{{ item.pinfl }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-white">{{ item.fullName }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ item.organization }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ item.department || '—' }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ item.position }}</td>
              <td class="px-4 py-3">
                <span :class="getStatusBadgeClasses(item.pinfl)">
                  {{ isExistingStudent(item.pinfl) ? 'Обновление' : 'Новый' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Кнопки действий -->
    <div class="flex items-center justify-end gap-4">
      <button
        @click="$emit('cancel')"
        :disabled="loading"
        class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        Отмена
      </button>
      <button
        @click="$emit('confirm')"
        :disabled="loading || analysis.validRows === 0"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        {{ loading ? 'Запуск импорта...' : `Импортировать ${pluralizeRecords(analysis.validRows)}` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { pluralize, pluralizeRows, pluralizeErrors, pluralizeRecords } from '~/utils/pluralize';
import type { ImportAnalysis } from '~/types/import';

const props = defineProps<{
  analysis: ImportAnalysis;
  loading?: boolean;
}>();

defineEmits<{
  confirm: [];
  cancel: [];
}>();

const MAX_DISPLAYED_ERRORS = 10;

// Создаём Set для быстрой проверки существующих ПИНФЛ
const existingPinflsSet = computed(() => new Set(props.analysis.existingPinfls || []));

// Проверка, существует ли студент
const isExistingStudent = (pinfl: string): boolean => {
  return existingPinflsSet.value.has(pinfl);
};

// Статистические карточки
const summaryStats = computed(() => [
  {
    label: 'Всего строк',
    value: props.analysis.totalRows,
    variant: 'blue' as const,
    icon: resolveComponent('CommonIconsIconDocument'),
  },
  {
    label: 'Валидные',
    value: props.analysis.validRows,
    variant: 'green' as const,
    icon: resolveComponent('CommonIconsIconCheckCircle'),
  },
  {
    label: 'Будут созданы',
    value: props.analysis.newStudents,
    variant: 'purple' as const,
    icon: resolveComponent('CommonIconsIconUserAdd'),
  },
  {
    label: 'Будут обновлены',
    value: props.analysis.existingStudents,
    variant: 'orange' as const,
    icon: resolveComponent('CommonIconsIconRefresh'),
  },
]);

// Ошибки для отображения (первые N)
const displayedErrors = computed(() => {
  return (props.analysis.errors || []).slice(0, MAX_DISPLAYED_ERRORS);
});

// Количество оставшихся ошибок
const remainingErrors = computed(() => {
  const total = props.analysis.errors?.length || 0;
  return Math.max(0, total - MAX_DISPLAYED_ERRORS);
});

// Количество записей в предпросмотре
const previewCount = computed(() => {
  return Math.min(props.analysis.preview?.length || 0, 20);
});

// Классы для бейджа статуса
const getStatusBadgeClasses = (pinfl: string): string => {
  const base = 'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium';
  if (isExistingStudent(pinfl)) {
    return `${base} bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400`;
  }
  return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
};
</script>
