<template>
  <div v-if="file" class="preview-panel">
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-4" :title="file.filename">
        {{ file.filename }}
      </h3>
      <button
        @click="emit('close')"
        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
      >
        <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="p-4 overflow-y-auto flex-1">
      <!-- Image Preview -->
      <div v-if="isImage" class="mb-4">
        <img
          :src="file.url"
          :alt="file.filename"
          class="max-w-full max-h-64 mx-auto rounded-lg object-contain"
        />
      </div>

      <!-- Video Preview -->
      <div v-else-if="isVideo" class="mb-4">
        <video
          :src="file.url"
          controls
          class="max-w-full mx-auto rounded-lg"
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <!-- Audio Preview -->
      <div v-else-if="isAudio" class="mb-4">
        <audio
          :src="file.url"
          controls
          class="w-full"
        >
          Your browser does not support the audio tag.
        </audio>
      </div>

      <!-- PDF Preview -->
      <div v-else-if="isPdf" class="mb-4">
        <iframe
          :src="file.url"
          class="w-full h-64 rounded-lg border border-gray-200 dark:border-gray-700"
        />
      </div>

      <!-- Default Icon -->
      <div v-else class="mb-4 flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <FileTypeIcon :mime-type="file.mimeType" :extension="file.extension" size="2xl" />
      </div>

      <!-- File Info -->
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">Размер:</span>
          <span class="text-gray-900 dark:text-white">{{ formatFileSize(file.sizeBytes) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Тип:</span>
          <span class="text-gray-900 dark:text-white">{{ file.mimeType || 'Неизвестно' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Дата:</span>
          <span class="text-gray-900 dark:text-white">{{ formatDate(file.createdAt) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-4 flex gap-2">
        <button
          @click="emit('download')"
          class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Скачать
        </button>
        <button
          @click="emit('delete')"
          class="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FileRecord } from '~/types/file';
import FileTypeIcon from '~/components/common/FileTypeIcon.vue';

interface Props {
  file: FileRecord | null;
  formatFileSize: (bytes: number) => string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  download: [];
  delete: [];
}>();

const isImage = computed(() => props.file?.mimeType?.startsWith('image/') || false);
const isVideo = computed(() => props.file?.mimeType?.startsWith('video/') || false);
const isAudio = computed(() => props.file?.mimeType?.startsWith('audio/') || false);
const isPdf = computed(() => props.file?.mimeType === 'application/pdf');

const formatDate = (date: string | Date | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
</script>

<style scoped>
.preview-panel {
  width: 20rem;
  border-left: 1px solid var(--color-gray-200);
  background-color: var(--color-white);
  display: flex;
  flex-direction: column;
}

.preview-panel:deep(.dark) {
  background-color: var(--color-boxdark);
  border-color: var(--color-gray-700);
}
</style>