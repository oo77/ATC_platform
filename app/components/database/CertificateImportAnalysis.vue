<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок -->
    <div class="rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 p-6 dark:from-emerald-900/20 dark:to-teal-900/20">
      <div class="flex items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-lg">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            Анализ данных
          </h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Проверьте данные перед импортом сертификатов
          </p>
        </div>
      </div>
    </div>

    <!-- Сводка анализа -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- Всего строк -->
      <div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Всего строк</p>
            <p class="mt-2 text-3xl font-bold">{{ analysis.totalRows }}</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Валидные строки -->
      <div class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Готово к импорту</p>
            <p class="mt-2 text-3xl font-bold">{{ analysis.validRows }}</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Ошибки -->
      <div class="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Ошибок</p>
            <p class="mt-2 text-3xl font-bold">{{ analysis.errorRows }}</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Дубликаты -->
      <div class="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium opacity-90">Дубликатов</p>
            <p class="mt-2 text-3xl font-bold">{{ analysis.duplicateCertificates }}</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Статистика по слушателям -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Новых слушателей</p>
            <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ analysis.newStudents }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Будут созданы при импорте</p>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30">
            <svg class="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Существующих слушателей</p>
            <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ analysis.existingStudents }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Найдены в базе данных</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Ошибки валидации -->
    <div v-if="analysis.errorRows > 0" class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-red-900 dark:text-red-100">
              Ошибки валидации
            </h4>
            <p class="text-sm text-red-700 dark:text-red-300">
              {{ analysis.errorRows }} {{ analysis.errorRows === 1 ? 'строка содержит' : 'строк содержат' }} ошибки и будут пропущены
            </p>
          </div>
        </div>
      </div>
      <div class="max-h-60 overflow-y-auto p-6">
        <div class="space-y-3">
          <div
            v-for="error in analysis.errors.slice(0, 10)"
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
        <p v-if="analysis.errors.length > 10" class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          И ещё {{ analysis.errors.length - 10 }} ошибок...
        </p>
      </div>
    </div>

    <!-- Предпросмотр данных -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
          📋 Предпросмотр данных
        </h4>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Показаны первые {{ Math.min(analysis.preview.length, 20) }} записей
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">№</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ПИНФЛ</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ФИО</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Номер сертификата</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Дата выдачи</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Слушатель</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Сертификат</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="(item, index) in analysis.preview.slice(0, 20)"
              :key="index"
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ item.rowNumber }}</td>
              <td class="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{{ item.pinfl }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-white">{{ item.fullName }}</td>
              <td class="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{{ item.certificateNumber }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ formatDate(item.issueDate) }}</td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                    getStudentStatusClass(item.studentStatus),
                  ]"
                >
                  {{ getStudentStatusText(item.studentStatus) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                    getCertificateStatusClass(item.certificateStatus),
                  ]"
                >
                  {{ getCertificateStatusText(item.certificateStatus) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Информация о курсе -->
    <div class="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
      <h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        📚 Курс и настройки
      </h4>
      <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt class="text-sm text-gray-500 dark:text-gray-400">Курс</dt>
          <dd class="font-medium text-gray-900 dark:text-white">
            {{ analysis.courseInfo?.name || 'Не указан' }}
          </dd>
        </div>
        <div v-if="analysis.courseInfo?.code">
          <dt class="text-sm text-gray-500 dark:text-gray-400">Код курса</dt>
          <dd class="font-medium text-gray-900 dark:text-white">{{ analysis.courseInfo.code }}</dd>
        </div>
        <div v-if="analysis.courseInfo?.hours">
          <dt class="text-sm text-gray-500 dark:text-gray-400">Часов</dt>
          <dd class="font-medium text-gray-900 dark:text-white">{{ analysis.courseInfo.hours }} ч.</dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500 dark:text-gray-400">Срок действия</dt>
          <dd class="font-medium text-gray-900 dark:text-white">
            {{ analysis.config?.validityType === 'unlimited' ? 'Бессрочный' : `${analysis.config?.validityMonths} мес.` }}
          </dd>
        </div>
      </dl>
    </div>

    <!-- Кнопки действий -->
    <div class="flex items-center justify-between">
      <button
        @click="$emit('back')"
        :disabled="loading"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Назад
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
        {{ loading ? 'Запуск импорта...' : `Импортировать ${analysis.validRows} сертификатов` }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  analysis: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['back', 'confirm']);

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

// Статус слушателя
const getStudentStatusClass = (status) => {
  switch (status) {
    case 'exists':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'new':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'not_found':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getStudentStatusText = (status) => {
  switch (status) {
    case 'exists':
      return 'Найден';
    case 'new':
      return 'Будет создан';
    case 'not_found':
      return 'Не найден';
    default:
      return status;
  }
};

// Статус сертификата
const getCertificateStatusClass = (status) => {
  switch (status) {
    case 'new':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'duplicate':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getCertificateStatusText = (status) => {
  switch (status) {
    case 'new':
      return 'Новый';
    case 'duplicate':
      return 'Дубликат';
    default:
      return status;
  }
};
</script>
