<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок -->
    <div class="rounded-lg bg-gradient-to-r from-violet-50 to-fuchsia-50 p-6 dark:from-violet-900/20 dark:to-fuchsia-900/20">
      <div class="flex items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500 shadow-lg">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            Настройка импорта
          </h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Настройте шаблон ссылки на PDF и дополнительные опции
          </p>
        </div>
      </div>
    </div>

    <!-- Шаблон URL -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark">
      <h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        🔗 Шаблон ссылки на PDF-файл сертификата
      </h4>
      <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Укажите шаблон URL, по которому будут доступны PDF-файлы сертификатов
      </p>

      <div class="space-y-4">
        <div>
          <input
            v-model="localConfig.urlTemplate"
            type="url"
            placeholder="http://edu.uzairports.com/certificates/ATC25_{NUM}_{FIO}.pdf"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-mono text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <!-- Доступные переменные -->
        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Доступные переменные:
          </p>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div 
              v-for="variable in availableVariables"
              :key="variable.key"
              class="flex items-start gap-3"
            >
              <button
                @click="insertVariable(variable.key)"
                class="inline-flex items-center rounded bg-primary/10 px-2 py-1 font-mono text-xs text-primary transition-colors hover:bg-primary/20"
              >
                {{ variable.key }}
              </button>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ variable.description }}
              </span>
            </div>
          </div>
        </div>

        <!-- Предпросмотр URL -->
        <div v-if="localConfig.urlTemplate" class="space-y-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            📝 Пример результата:
          </p>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <p class="font-mono text-xs text-gray-600 break-all dark:text-gray-400">
              {{ previewUrl }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Дополнительные опции -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark">
      <h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        ⚙️ Дополнительные опции
      </h4>

      <div class="space-y-4">
        <!-- Создавать новых слушателей -->
        <label class="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary">
          <div class="relative flex items-center">
            <input
              type="checkbox"
              v-model="localConfig.createStudents"
              class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900 dark:text-white">
              Создавать новых слушателей, если ПИНФЛ не найден
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Слушатель будет создан с данными из Excel (ФИО, организация, должность)
            </p>
          </div>
        </label>

        <!-- Обновлять существующие -->
        <label class="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary">
          <div class="relative flex items-center">
            <input
              type="checkbox"
              v-model="localConfig.updateExisting"
              class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900 dark:text-white">
              Обновлять существующие сертификаты
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Если сертификат с таким номером уже существует — обновить его данные
            </p>
          </div>
        </label>

        <!-- Пропускать ошибки -->
        <label class="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary">
          <div class="relative flex items-center">
            <input
              type="checkbox"
              v-model="localConfig.skipErrors"
              class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900 dark:text-white">
              Пропускать строки с ошибками
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Продолжить импорт даже при ошибках в некоторых строках
            </p>
          </div>
        </label>
      </div>
    </div>

    <!-- Сводка настроек -->
    <div class="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
      <h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        📋 Сводка настроек
      </h4>
      <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt class="text-sm text-gray-500 dark:text-gray-400">Курс</dt>
          <dd class="font-medium text-gray-900 dark:text-white">
            {{ courseInfo?.name || 'Не указан' }}
            <span v-if="courseInfo?.code" class="text-gray-500">({{ courseInfo.code }})</span>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500 dark:text-gray-400">Срок действия</dt>
          <dd class="font-medium text-gray-900 dark:text-white">
            {{ courseConfig.validityType === 'unlimited' ? 'Бессрочный' : `${courseConfig.validityMonths} мес.` }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500 dark:text-gray-400">Создание слушателей</dt>
          <dd class="font-medium" :class="localConfig.createStudents ? 'text-green-600' : 'text-gray-500'">
            {{ localConfig.createStudents ? 'Да' : 'Нет' }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500 dark:text-gray-400">Обновление существующих</dt>
          <dd class="font-medium" :class="localConfig.updateExisting ? 'text-orange-600' : 'text-gray-500'">
            {{ localConfig.updateExisting ? 'Да' : 'Нет' }}
          </dd>
        </div>
      </dl>
    </div>

    <!-- Кнопки навигации -->
    <div class="flex items-center justify-between">
      <button
        @click="$emit('back')"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Назад
      </button>
      <button
        @click="handleAnalyze"
        :disabled="loading"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        {{ loading ? 'Анализ файла...' : 'Анализировать' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';

const emit = defineEmits(['back', 'analyze', 'update:config']);

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  courseConfig: {
    type: Object,
    required: true,
  },
  courseInfo: {
    type: Object,
    default: null,
  },
  config: {
    type: Object,
    default: () => ({
      urlTemplate: '',
      createStudents: true,
      updateExisting: false,
      skipErrors: true,
    }),
  },
});

// Локальное состояние конфигурации
const localConfig = reactive({
  urlTemplate: props.config.urlTemplate || '',
  createStudents: props.config.createStudents ?? true,
  updateExisting: props.config.updateExisting ?? false,
  skipErrors: props.config.skipErrors ?? true,
});

// Доступные переменные для шаблона URL
const availableVariables = [
  { key: '{NUM}', description: 'Серийный номер сертификата' },
  { key: '{FIO}', description: 'ФИО (подчёркивания вместо пробелов)' },
  { key: '{PINFL}', description: 'ПИНФЛ слушателя' },
  { key: '{DATE}', description: 'Дата выдачи (YYYYMMDD)' },
];

// Предпросмотр URL с примером данных
const previewUrl = computed(() => {
  return localConfig.urlTemplate
    .replace('{NUM}', 'ATC25-001')
    .replace('{FIO}', 'Иванов_Иван_Иванович')
    .replace('{PINFL}', '12345678901234')
    .replace('{DATE}', '20250315');
});

// Вставка переменной в шаблон
const insertVariable = (variable) => {
  localConfig.urlTemplate += variable;
};

// Синхронизация с родителем
watch(localConfig, (value) => {
  emit('update:config', { ...value });
}, { deep: true });

// Обработчик кнопки Анализировать
const handleAnalyze = () => {
  emit('analyze', { ...localConfig });
};
</script>
