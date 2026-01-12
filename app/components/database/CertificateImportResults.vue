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
      <!-- Всего обработано -->
      <div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Всего обработано</p>
            <p class="mt-2 text-4xl font-bold">{{ result.totalProcessed }}</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Создано слушателей -->
      <div class="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Новых слушателей</p>
            <p class="mt-2 text-4xl font-bold">{{ result.createdStudents }}</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Создано сертификатов -->
      <div class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Сертификатов</p>
            <p class="mt-2 text-4xl font-bold">{{ result.createdCertificates }}</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Ошибки -->
      <div class="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Ошибок</p>
            <p class="mt-2 text-4xl font-bold">{{ result.failed }}</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
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

    <!-- Пропущенные дубликаты -->
    <div v-if="result.skippedDuplicates > 0" class="rounded-xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-900/20">
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-200 dark:bg-orange-800">
          <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-orange-800 dark:text-orange-200">
            Пропущено {{ result.skippedDuplicates }} дубликатов
          </p>
          <p class="text-sm text-orange-600 dark:text-orange-400">
            Сертификаты с такими номерами уже существуют в системе
          </p>
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
                {{ result.errors.length }} {{ result.errors.length === 1 ? 'запись' : 'записей' }} не удалось импортировать
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
                  Строка {{ error.rowNumber }}
                  <span v-if="error.certificateNumber" class="text-gray-500">
                    • {{ error.certificateNumber }}
                  </span>
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
        @click="$emit('goToCertificates')"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        Перейти к сертификатам
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
});

defineEmits(['newImport', 'goToCertificates']);

const isSuccess = computed(() => {
  return props.result.failed === 0 || props.result.createdCertificates > 0;
});

const resultDescription = computed(() => {
  if (props.result.failed === 0) {
    return `Все ${props.result.totalProcessed} сертификатов успешно импортированы`;
  }
  return `${props.result.createdCertificates} из ${props.result.totalProcessed} сертификатов импортированы успешно`;
});

const duration = computed(() => {
  if (!props.result.duration) return '—';
  const ms = props.result.duration;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes} мин ${seconds % 60} сек`;
  }
  return `${seconds} сек`;
});

const successRate = computed(() => {
  if (props.result.totalProcessed === 0) return 0;
  return Math.round((props.result.createdCertificates / props.result.totalProcessed) * 100);
});

const downloadErrorReport = () => {
  // Формируем CSV отчёт
  const headers = ['Строка', 'Номер сертификата', 'Ошибка'];
  const rows = props.result.errors.map((error) => [
    error.rowNumber,
    error.certificateNumber || '',
    error.error,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // Создаём blob и скачиваем
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `certificate-import-errors-${Date.now()}.csv`;
  link.click();
};
</script>
