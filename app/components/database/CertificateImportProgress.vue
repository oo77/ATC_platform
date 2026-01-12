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
          Обработано сертификатов
        </span>
        <span class="text-sm font-bold text-primary">
          {{ progress.processedRecords }} / {{ progress.totalRecords }}
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
      <!-- Создано слушателей -->
      <div class="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Создано слушателей</p>
            <p class="mt-2 text-3xl font-bold">{{ progress.createdStudents }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Создано сертификатов -->
      <div class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Сертификатов</p>
            <p class="mt-2 text-3xl font-bold">{{ progress.createdCertificates }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Пропущено дубликатов -->
      <div class="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Пропущено</p>
            <p class="mt-2 text-3xl font-bold">{{ progress.skippedDuplicates || 0 }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Ошибки -->
      <div class="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Ошибки</p>
            <p class="mt-2 text-3xl font-bold">{{ progress.errors?.length || 0 }}</p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
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
              {{ progress.errors.length }} {{ progress.errors.length === 1 ? 'запись' : 'записей' }} не удалось импортировать
            </p>
          </div>
        </div>
      </div>
      <div class="max-h-60 overflow-y-auto p-6">
        <div class="space-y-3">
          <div
            v-for="(error, index) in progress.errors.slice(0, 10)"
            :key="index"
            class="rounded-lg bg-white p-4 dark:bg-gray-800"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <p class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                  Строка {{ error.rowNumber }}
                </p>
                <p class="text-sm text-red-600 dark:text-red-400">
                  {{ error.error }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <p v-if="progress.errors.length > 10" class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          И ещё {{ progress.errors.length - 10 }} ошибок...
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
      <span>Импорт сертификатов в процессе...</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  progress: {
    type: Object,
    required: true,
  },
});

const progressPercentage = computed(() => {
  if (props.progress.totalRecords === 0) return 0;
  return Math.round((props.progress.processedRecords / props.progress.totalRecords) * 100);
});

const statusText = computed(() => {
  switch (props.progress.status) {
    case 'processing':
      return 'Импорт сертификатов';
    case 'completed':
      return 'Импорт завершён';
    case 'failed':
      return 'Импорт не удался';
    default:
      return 'Ожидание';
  }
});

const statusDescription = computed(() => {
  switch (props.progress.status) {
    case 'processing':
      return 'Пожалуйста, подождите. Это может занять некоторое время...';
    case 'completed':
      return 'Все сертификаты успешно обработаны';
    case 'failed':
      return 'Произошла ошибка при импорте сертификатов';
    default:
      return 'Подготовка к импорту...';
  }
});
</script>
