<template>
  <div class="w-full">
    <div
      class="border-2 border-dashed rounded-xl p-8 lg:p-12 text-center transition-all duration-200 ease-in-out cursor-pointer"
      :class="[
        isDragging
          ? 'border-primary bg-primary/5 dark:bg-primary/10'
          : 'border-stroke dark:border-strokedark hover:border-primary hover:bg-gray-50 dark:hover:bg-meta-4',
        error ? 'border-danger bg-danger/5 dark:bg-danger/10' : '',
      ]"
      @dragenter.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @dragover.prevent
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept="application/pdf,image/jpeg,image/png"
        @change="handleFileSelect"
      />

      <div v-if="!file" class="flex flex-col items-center space-y-4">
        <div
          class="p-4 bg-primary/10 dark:bg-primary/20 rounded-full text-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div>
          <p class="text-lg font-medium text-black dark:text-white">
            Перетащите файл сюда или кликните для выбора
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Поддерживаются: PDF, JPG, PNG (макс. 10 МБ)
          </p>
        </div>
      </div>

      <div
        v-else
        class="flex items-center justify-between p-4 bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark"
      >
        <div class="flex items-center space-x-4">
          <div
            class="shrink-0 h-12 w-12 rounded-lg bg-gray-100 dark:bg-meta-4 flex items-center justify-center"
          >
            <svg
              v-if="file.type === 'application/pdf'"
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-info"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div class="text-left flex-1 min-w-0">
            <p class="text-sm font-medium text-black dark:text-white truncate">
              {{ file.name }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formattedSize }}
            </p>
          </div>
        </div>
        <button
          @click.stop="removeFile"
          class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 dark:text-gray-500 hover:text-danger transition-colors shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>

    <div
      v-if="error"
      class="mt-3 text-sm text-danger dark:text-danger flex items-center gap-2 p-3 bg-danger/5 dark:bg-danger/10 rounded-lg border border-danger/20"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Actions -->
    <div class="mt-6 flex justify-end">
      <button
        v-if="file && !error"
        @click="$emit('upload', file)"
        :disabled="loading"
        class="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <svg
          v-if="loading"
          class="animate-spin h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
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
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>{{
          loading ? "Загрузка..." : "Загрузить и проанализировать"
        }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { validateImportFile } from "~/utils/ai-import/validators";
import { formatFileSize } from "~/utils/ai-import/formatters";

const props = defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "upload", file: File): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const file = ref<File | null>(null);
const isDragging = ref(false);
const error = ref<string | null>(null);

const formattedSize = computed(() => {
  return file.value ? formatFileSize(file.value.size) : "";
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFile = (selectedFile: File) => {
  const { valid, error: validationError } = validateImportFile(selectedFile);

  if (!valid) {
    error.value = validationError || "Ошибка валидации файла";
    return;
  }

  file.value = selectedFile;
  error.value = null;
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file) handleFile(file);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];
    if (file) handleFile(file);
  }
};

const removeFile = () => {
  file.value = null;
  error.value = null;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};
</script>
