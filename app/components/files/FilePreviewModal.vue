<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 flex items-center justify-center overflow-y-auto z-99999 p-4"
        @click.self="$emit('close')"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        ></div>

        <!-- Modal Content -->
        <div
          class="relative bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-4xl transition-all"
          role="dialog"
          aria-modal="true"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark">
            <h3 class="text-xl font-semibold text-black dark:text-white truncate">
              {{ file?.filename || 'Просмотр файла' }}
            </h3>
            <button
              type="button"
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6">
            <!-- Image Preview -->
            <div v-if="isImage" class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <img
                :src="file.url"
                :alt="file.filename"
                class="max-w-full max-h-[60vh] object-contain rounded"
              />
            </div>

            <!-- Video Preview -->
            <div v-else-if="isVideo" class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <video
                :src="file.url"
                controls
                class="max-w-full max-h-[60vh] rounded"
              >
                Ваш браузер не поддерживает видео.
              </video>
            </div>

            <!-- Audio Preview -->
            <div v-else-if="isAudio" class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
              <audio :src="file.url" controls class="w-full">
                Ваш браузер не поддерживает аудио.
              </audio>
            </div>

            <!-- Other Files - Info Only -->
            <div v-else class="text-center py-12">
              <FileTypeIcon :mime-type="file.mimeType" :extension="file.extension" size="xl" class="mx-auto mb-4" />
              <p class="text-lg font-medium text-black dark:text-white mb-2">
                {{ file.filename }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Предпросмотр недоступен для этого типа файлов
              </p>
            </div>

            <!-- File Info -->
            <div class="mt-6 grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Размер</p>
                <p class="text-sm font-medium text-black dark:text-white">
                  {{ formatFileSize(file.sizeBytes) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Тип</p>
                <p class="text-sm font-medium text-black dark:text-white">
                  {{ file.extension.toUpperCase() }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Категория</p>
                <p class="text-sm font-medium text-black dark:text-white">
                  {{ getCategoryLabel(file.category) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Дата загрузки</p>
                <p class="text-sm font-medium text-black dark:text-white">
                  {{ formatDate(file.createdAt) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-stroke dark:border-strokedark flex justify-end gap-3">
            <a
              :href="file.url"
              download
              class="inline-flex items-center gap-2 rounded-md bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Скачать
            </a>
            <a
              :href="file.url"
              target="_blank"
              class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 transition-colors"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Открыть в новой вкладке
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FileRecord, FileCategory } from '~/types/file';
import FileTypeIcon from '~/components/common/FileTypeIcon.vue';

interface FilePreviewModalProps {
  isOpen: boolean;
  file: FileRecord;
}

const props = defineProps<FilePreviewModalProps>();

defineEmits<{
  close: [];
}>();

const { formatFileSize } = useFileManager();

const isImage = computed(() => props.file.mimeType.startsWith('image/'));
const isVideo = computed(() => props.file.mimeType.startsWith('video/'));
const isAudio = computed(() => props.file.mimeType.startsWith('audio/'));

const getCategoryLabel = (category: FileCategory): string => {
  const labels: Record<FileCategory, string> = {
    profile: 'Профиль',
    certificate_template: 'Шаблон',
    certificate_generated: 'Сертификат',
    course_material: 'Материал',
    course_media: 'Медиа',
    course_cover: 'Обложка',
    group_gallery: 'Галерея',
    group_file: 'Файл',
    assignment: 'Задание',
    other: 'Другое',
  };
  return labels[category] || category;
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
