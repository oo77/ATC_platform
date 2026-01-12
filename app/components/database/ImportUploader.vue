<template>
  <div class="flex flex-col gap-6">
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
              <span>Первая строка должна содержать заголовки: <strong>ПИНФЛ, ФИО, Организация, Служба/Отдел, Должность</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>ПИНФЛ должен содержать ровно <strong>14 цифр</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>При совпадении ПИНФЛ данные студента будут <strong>обновлены</strong></span>
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
            {{ loading ? 'Анализ файла...' : isDragging ? 'Отпустите файл' : 'Перетащите файл сюда' }}
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
        </div>
      </div>
    </div>

    <!-- Пример структуры файла -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Пример структуры файла
        </h4>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ПИНФЛ</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ФИО</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Организация</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Служба/Отдел</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Должность</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">12345678901234</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">Иванов Иван Иванович</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">ООО "Пример"</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">IT отдел</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">Разработчик</td>
            </tr>
            <tr>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">98765432109876</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">Петрова Мария Сергеевна</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">АО "Технологии"</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">HR отдел</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">Менеджер</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  fileSelected: [file: File];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const selectedFileName = ref('');
const selectedFileSize = ref(0);

const openFileDialog = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processFile(file);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    processFile(file);
  }
};

const processFile = (file: File) => {
  // Проверка типа файла
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    alert('Пожалуйста, выберите файл Excel (.xlsx или .xls)');
    return;
  }

  selectedFileName.value = file.name;
  selectedFileSize.value = file.size;
  emit('fileSelected', file);
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
</script>
