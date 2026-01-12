<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок -->
    <div class="rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 p-6 dark:from-teal-900/20 dark:to-cyan-900/20">
      <div class="flex items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500 shadow-lg">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            Загрузка файла
          </h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Загрузите Excel-файл с данными сертификатов
          </p>
        </div>
      </div>
    </div>

    <!-- Инструкции -->
    <div class="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
      <div class="flex items-start gap-4">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Требования к файлу
          </h3>
          <ul class="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Формат файла: <strong>.xlsx</strong> или <strong>.xls</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Первая строка — заголовки: <strong>ПИНФЛ, ФИО, Организация, Должность, Серия/Номер, Дата выдачи</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>ПИНФЛ должен содержать <strong>14 цифр</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Формат даты: <strong>ДД.ММ.ГГГГ</strong> (например: 15.03.2025)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Зона загрузки файла -->
    <div
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      :class="[
        'relative rounded-xl border-2 border-dashed transition-all duration-300',
        isDragging
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : 'border-gray-300 dark:border-gray-600',
        loading ? 'pointer-events-none opacity-60' : '',
      ]"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".xlsx,.xls"
        @change="handleFileChange"
        class="hidden"
      />

      <div class="flex flex-col items-center justify-center p-12">
        <!-- Иконка -->
        <div
          :class="[
            'mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300',
            isDragging ? 'bg-primary scale-110' : 'bg-gray-100 dark:bg-gray-800',
          ]"
        >
          <svg
            v-if="!loading"
            :class="[
              'w-10 h-10 transition-colors duration-300',
              isDragging ? 'text-white' : 'text-gray-400 dark:text-gray-500',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <svg
            v-else
            class="w-10 h-10 text-primary animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>

        <!-- Текст -->
        <div class="text-center">
          <p class="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
            {{ loading ? 'Обработка файла...' : isDragging ? 'Отпустите файл' : 'Перетащите файл сюда' }}
          </p>
          <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
            или
          </p>
          <button
            @click="openFileDialog"
            :disabled="loading"
            class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Выбрать файл
          </button>
        </div>

        <!-- Информация о выбранном файле -->
        <div
          v-if="selectedFileName"
          class="mt-6 flex items-center gap-3 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20"
        >
          <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-green-800 dark:text-green-200">
              {{ selectedFileName }}
            </p>
            <p class="text-xs text-green-600 dark:text-green-400">
              {{ formatFileSize(selectedFileSize) }}
            </p>
          </div>
          <button
            @click.stop="clearFile"
            class="rounded p-1 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800/30"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Пример структуры файла -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          📋 Пример структуры файла
        </h4>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ПИНФЛ</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ФИО</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Организация</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Должность</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Серия/Номер</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Дата выдачи</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">12345678901234</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">Иванов Иван Иванович</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">ООО "Авиакомпания"</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">Инженер</td>
              <td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">ATC25-001</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">15.03.2025</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">98765432109876</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">Петрова Мария Сергеевна</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">АО "Аэропорт"</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">Менеджер</td>
              <td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">ATC25-002</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">20.03.2025</td>
            </tr>
          </tbody>
        </table>
      </div>
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
        @click="handleNext"
        :disabled="!selectedFile"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Далее
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['back', 'next', 'file-selected']);

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

const fileInput = ref(null);
const isDragging = ref(false);
const selectedFile = ref(null);
const selectedFileName = ref('');
const selectedFileSize = ref(0);

const openFileDialog = () => {
  fileInput.value?.click();
};

const handleFileChange = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    processFile(file);
  }
};

const handleDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    processFile(file);
  }
};

const processFile = (file) => {
  // Проверка типа файла
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    alert('Пожалуйста, выберите файл Excel (.xlsx или .xls)');
    return;
  }

  selectedFile.value = file;
  selectedFileName.value = file.name;
  selectedFileSize.value = file.size;
  emit('file-selected', file);
};

const clearFile = () => {
  selectedFile.value = null;
  selectedFileName.value = '';
  selectedFileSize.value = 0;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const handleNext = () => {
  if (selectedFile.value) {
    emit('next', selectedFile.value);
  }
};
</script>
