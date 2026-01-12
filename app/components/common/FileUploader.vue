<template>
  <div class="file-uploader">
    <!-- Drag & Drop Zone -->
    <div
      :class="[
        'relative rounded-lg border-2 border-dashed p-8 transition-all duration-200',
        isDragging
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : 'border-stroke dark:border-strokedark hover:border-primary/50',
        'cursor-pointer'
      ]"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        class="hidden"
        @change="handleFileInput"
      />

      <div class="flex flex-col items-center justify-center gap-4 text-center">
        <!-- Icon -->
        <div
          :class="[
            'flex h-16 w-16 items-center justify-center rounded-full transition-all',
            isDragging
              ? 'bg-primary text-white scale-110'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          ]"
        >
          <svg
            class="h-8 w-8"
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
        </div>

        <!-- Text -->
        <div>
          <p class="text-lg font-medium text-black dark:text-white">
            {{ isDragging ? 'Отпустите файл' : 'Перетащите файл сюда' }}
          </p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            или нажмите для выбора
          </p>
          <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Максимальный размер: {{ maxSizeMb }} MB
          </p>
        </div>

        <!-- Upload Progress -->
        <div v-if="isUploading" class="w-full max-w-md">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">Загрузка...</span>
            <span class="text-sm font-medium text-primary">{{ uploadProgress }}%</span>
          </div>
          <div class="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-linear-to-r from-primary to-secondary transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Files Preview -->
    <div v-if="showPreview && uploadedFiles.length > 0" class="mt-4">
      <h4 class="text-sm font-medium text-black dark:text-white mb-3">
        Загруженные файлы ({{ uploadedFiles.length }})
      </h4>
      <div class="space-y-2">
        <div
          v-for="file in uploadedFiles"
          :key="file.uuid"
          class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <!-- File Icon/Thumbnail -->
          <div class="shrink-0 h-10 w-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
            <img
              v-if="isImage(file.mimeType)"
              :src="file.url"
              :alt="file.filename"
              class="h-full w-full object-cover"
            />
            <div v-else class="h-full w-full flex items-center justify-center">
              <svg class="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>

          <!-- File Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-black dark:text-white truncate">
              {{ file.filename }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatFileSize(file.sizeBytes) }}
            </p>
          </div>

          <!-- Delete Button -->
          <button
            type="button"
            @click="handleDelete(file.uuid)"
            class="shrink-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Удалить"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { FileCategory, FileRecord } from '~/types/file';

// Props
interface FileUploaderProps {
  category: FileCategory;
  folderId?: number | null;
  relatedId?: number;
  accept?: string;
  maxSizeMb?: number;
  multiple?: boolean;
  showPreview?: boolean;
  metadata?: Record<string, any>;
}

const props = withDefaults(defineProps<FileUploaderProps>(), {
  accept: '*/*',
  maxSizeMb: 50,
  multiple: false,
  showPreview: true,
});

// Emits
const emit = defineEmits<{
  uploaded: [file: FileRecord];
  error: [message: string];
  deleted: [uuid: string];
}>();

// Composables
const { uploadFile, deleteFile, formatFileSize } = useFileManager();

// State
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadedFiles = ref<FileRecord[]>([]);

// Methods
const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click();
  }
};

const validateFile = (file: File): boolean => {
  const maxSizeBytes = props.maxSizeMb * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    const message = `Файл слишком большой. Максимальный размер: ${props.maxSizeMb}MB`;
    emit('error', message);
    alert(message);
    return false;
  }

  // Проверка типа файла по accept
  if (props.accept !== '*/*') {
    const acceptedTypes = props.accept.split(',').map(t => t.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;

    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return type.toLowerCase() === fileExtension;
      }
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return mimeType.startsWith(baseType + '/');
      }
      return type === mimeType;
    });

    if (!isAccepted) {
      const message = `Неподдерживаемый тип файла: ${file.name}`;
      emit('error', message);
      alert(message);
      return false;
    }
  }

  return true;
};

const uploadFileToServer = async (file: File) => {
  if (!validateFile(file)) {
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 0;

  // Симуляция прогресса (в реальности нужен XMLHttpRequest для отслеживания)
  const progressInterval = setInterval(() => {
    if (uploadProgress.value < 90) {
      uploadProgress.value += 10;
    }
  }, 100);

  try {
    const uploadedFile = await uploadFile(file, props.category, props.folderId, props.relatedId, props.metadata);

    uploadProgress.value = 100;

    // Добавляем в список загруженных
    if (props.showPreview) {
      uploadedFiles.value.push(uploadedFile);
    }

    emit('uploaded', uploadedFile);

    // Показываем успешное уведомление
    // В будущем заменить на toast notification
    console.log('Файл успешно загружен:', uploadedFile.filename);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка загрузки файла';
    emit('error', message);
    alert(message);
  } finally {
    clearInterval(progressInterval);
    isUploading.value = false;
    uploadProgress.value = 0;
  }
};

const handleFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (files && files.length > 0) {
    if (props.multiple) {
      Array.from(files).forEach(uploadFileToServer);
    } else {
      const file = files[0];
      if (file) {
        uploadFileToServer(file);
      }
    }
  }

  // Сбрасываем input для возможности повторной загрузки того же файла
  target.value = '';
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    if (props.multiple) {
      Array.from(files).forEach(uploadFileToServer);
    } else {
      const file = files[0];
      if (file) {
        uploadFileToServer(file);
      }
    }
  }
};

const handleDelete = async (uuid: string) => {
  if (!confirm('Вы уверены, что хотите удалить этот файл?')) {
    return;
  }

  try {
    await deleteFile(uuid);
    uploadedFiles.value = uploadedFiles.value.filter(f => f.uuid !== uuid);
    emit('deleted', uuid);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка удаления файла';
    emit('error', message);
    alert(message);
  }
};

const isImage = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};
</script>

<style scoped>
/* Стили компонента FileUploader */
</style>
