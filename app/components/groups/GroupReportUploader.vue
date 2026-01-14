<template>
  <div class="flex flex-col gap-6">
    <!-- Инструкции -->
    <div class="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
      <div class="flex items-start gap-4">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500"
        >
          <svg
            class="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Требования к файлам
          </h3>
          <ul class="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li class="flex items-start gap-2">
              <svg
                class="w-5 h-5 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Формат файла: <strong>только .pdf</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <svg
                class="w-5 h-5 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Максимальный размер файла: <strong>10 МБ</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <svg
                class="w-5 h-5 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                >Можно загрузить
                <strong>несколько файлов</strong> одновременно</span
              >
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Зона загрузки файлов -->
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
        accept=".pdf"
        multiple
        @change="handleFileChange"
        class="hidden"
      />

      <div class="flex flex-col items-center justify-center p-12">
        <!-- Иконка -->
        <div
          :class="[
            'mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300',
            isDragging
              ? 'bg-primary scale-110'
              : 'bg-gray-100 dark:bg-gray-800',
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
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        <!-- Текст -->
        <div class="text-center">
          <p
            class="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200"
          >
            {{
              loading
                ? "Загрузка файлов..."
                : isDragging
                ? "Отпустите файлы"
                : "Перетащите файлы сюда"
            }}
          </p>
          <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">или</p>
          <button
            @click="openFileDialog"
            :disabled="loading"
            class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Выбрать файлы
          </button>
        </div>

        <!-- Список выбранных файлов -->
        <div
          v-if="selectedFiles.length > 0"
          class="mt-6 w-full max-w-2xl space-y-2"
        >
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Выбрано файлов: {{ selectedFiles.length }}
          </p>
          <div
            v-for="(file, index) in selectedFiles"
            :key="index"
            class="flex items-center justify-between gap-3 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <svg
                class="w-6 h-6 text-danger shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div class="flex-1 min-w-0">
                <p
                  class="text-sm font-medium text-green-800 dark:text-green-200 truncate"
                >
                  {{ file.name }}
                </p>
                <p class="text-xs text-green-600 dark:text-green-400">
                  {{ formatFileSize(file.size) }}
                </p>
              </div>
            </div>
            <button
              @click="removeFile(index)"
              :disabled="loading"
              class="text-gray-500 hover:text-danger transition-colors disabled:opacity-50"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  filesSelected: [files: File[]];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const selectedFiles = ref<File[]>([]);

const openFileDialog = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    processFiles(Array.from(files));
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    processFiles(Array.from(files));
  }
};

const processFiles = (files: File[]) => {
  const validFiles: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    // Проверка типа файла
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      errors.push(`${file.name}: неверный формат (требуется PDF)`);
      continue;
    }

    // Проверка размера файла (10MB)
    if (file.size > 10 * 1024 * 1024) {
      errors.push(`${file.name}: размер превышает 10 МБ`);
      continue;
    }

    validFiles.push(file);
  }

  if (errors.length > 0) {
    alert("Ошибки при выборе файлов:\n" + errors.join("\n"));
  }

  if (validFiles.length > 0) {
    selectedFiles.value = [...selectedFiles.value, ...validFiles];
    emit("filesSelected", selectedFiles.value);
  }
};

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
  emit("filesSelected", selectedFiles.value);

  // Сброс input для возможности повторного выбора тех же файлов
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Метод для очистки выбранных файлов (может быть вызван извне)
const clearFiles = () => {
  selectedFiles.value = [];
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

// Экспортируем метод для использования родительским компонентом
defineExpose({
  clearFiles,
});
</script>
