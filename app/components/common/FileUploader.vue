<template>
  <div class="file-uploader">
    <file-pond
      ref="pond"
      :label-idle="labelIdle"
      :accepted-file-types="acceptedFileTypes"
      :max-file-size="maxFileSize"
      :allow-multiple="multiple"
      :initial-files="initialFilesFormatted"
      :server="serverConfig"
      :files="pondFiles"
      :item-insert-source-name="'file'"
      :item-insert-location="props.multiple ? 'after' : '-1'"
      :item-remove-element="null"
      @processfile="handleProcessFile"
      @removefile="handleRemoveFile"
      @error="handleError"
      @init="handleInit"
      @addfile="handleAddFile"
      @processfileprogress="handleProgress"
    />

    <!-- Upload Progress Overlay -->
    <div v-if="isUploading" class="upload-overlay">
      <div class="flex items-center gap-3">
        <div class="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
        <span class="text-sm font-medium">Загрузка... {{ uploadProgress }}%</span>
      </div>
    </div>

    <!-- Files Preview List -->
    <div v-if="showPreview && uploadedFiles.length > 0" class="mt-4 space-y-2">
      <h4 class="text-sm font-medium text-black dark:text-white">
        Загруженные файлы ({{ uploadedFiles.length }})
      </h4>
      <div
        v-for="file in uploadedFiles"
        :key="file.uuid"
        class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
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

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-black dark:text-white truncate">
            {{ file.filename }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatFileSize(file.sizeBytes) }}
          </p>
        </div>

        <button
          type="button"
          @click="handleDelete(file.uuid)"
          class="shrink-0 p-2 text-red-500 hover:bg-red-500 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Удалить"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { FileCategory, FileRecord } from '~/types/file';
import vueFilePond from 'vue-filepond';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

const FilePond = vueFilePond(
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize,
  FilePondPluginImagePreview
);

interface FileUploaderProps {
  category: FileCategory;
  folderId?: number | null;
  relatedId?: number;
  accept?: string;
  maxSizeMb?: number;
  multiple?: boolean;
  showPreview?: boolean;
  metadata?: Record<string, any>;
  initialFiles?: FileRecord[];
}

const props = withDefaults(defineProps<FileUploaderProps>(), {
  accept: '*/*',
  maxSizeMb: 50,
  multiple: false,
  showPreview: true,
});

const emit = defineEmits<{
  uploaded: [file: FileRecord];
  error: [message: string];
  deleted: [uuid: string];
}>();

const { uploadFile, deleteFile, formatFileSize, getFileUrl } = useFileManager();

const pond = ref<InstanceType<typeof FilePond> | null>(null);
const pondFiles = ref<any[]>([]);
const isUploading = ref(false);
const uploadedFiles = ref<FileRecord[]>(props.initialFiles || []);

const labelIdle = computed(() => `
  <div class="flex flex-col items-center justify-center gap-4 text-center p-6">
    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 transition-all">
      <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    </div>
    <div>
      <p class="text-lg font-medium text-black dark:text-white">Перетащите файл сюда</p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">или нажмите для выбора</p>
      <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">Максимальный размер: ${props.maxSizeMb} MB</p>
    </div>
  </div>
`);

const acceptedFileTypes = computed(() => {
  if (props.accept === '*/*') return null;
  return props.accept.split(',').map(t => t.trim());
});

const maxFileSize = computed(() => `${props.maxSizeMb}MB`);

const serverConfig = computed(() => ({
  url: '/api',
  process: {
    url: '/files/upload',
    method: 'POST',
    withCredentials: false,
    headers: {
      'X-Category': props.category,
      ...(props.folderId ? { 'X-Folder-Id': props.folderId.toString() } : {}),
      ...(props.relatedId ? { 'X-Related-Id': props.relatedId.toString() } : {}),
    },
    ondata: (formData: FormData) => {
      formData.append('category', props.category);
      if (props.folderId) formData.append('folderId', props.folderId.toString());
      if (props.relatedId) formData.append('relatedId', props.relatedId.toString());
      if (props.metadata) formData.append('metadata', JSON.stringify(props.metadata));
      return formData;
    },
    onload: (response: string) => {
      try {
        const data = JSON.parse(response);
        if (data.success && data.file) {
          return JSON.stringify(data.file);
        }
        return response;
      } catch {
        return response;
      }
    },
    onerror: (response: string) => {
      try {
        const data = JSON.parse(response);
        return data.message || 'Ошибка загрузки';
      } catch {
        return response;
      }
    },
  },
  revert: null,
  restore: null,
  load: '/api/files/',
}));

const initialFilesFormatted = computed(() => {
  if (!props.initialFiles?.length) return [];

  return props.initialFiles.map(file => ({
    source: file.uuid,
    options: {
      type: 'local',
      file: {
        name: file.filename,
        size: file.sizeBytes,
        type: file.mimeType,
      },
      metadata: {
        url: file.url,
      },
    },
  }));
});

watch(() => props.initialFiles, (newFiles) => {
  if (newFiles) {
    uploadedFiles.value = [...newFiles];
  }
}, { deep: true });

watch(() => props.folderId, () => {
  if (pond.value) {
    pond.value.refresh();
  }
});

const handleInit = () => {
  console.log('FilePond initialized');
};

const handleAddFile = (error: any, file: any) => {
  if (error) {
    console.error('Add file error:', error);
    emit('error', error.message || 'Ошибка добавления файла');
    return;
  }
};

const handleProgress = (file: any, progress: number) => {
  if (progress < 1) {
    isUploading.value = true;
  }
};

const handleProcessFile = async (error: any, file: any) => {
  isUploading.value = false;

  if (error) {
    console.error('Process file error:', error);
    emit('error', error.message || 'Ошибка загрузки файла');
    return;
  }

  try {
    let fileRecord: FileRecord | null = null;

    if (typeof file === 'string') {
      try {
        fileRecord = JSON.parse(file);
      } catch {
        fileRecord = { uuid: file } as FileRecord;
      }
    } else if (file?.uuid) {
      fileRecord = file;
    } else if (file?.serverId) {
      const fullRecord = await getFileRecord(file.serverId);
      if (fullRecord) {
        fileRecord = fullRecord;
      }
    }

    if (fileRecord && fileRecord.uuid) {
      const fullRecord = await getFileRecord(fileRecord.uuid);
      if (fullRecord) {
        if (props.showPreview && !uploadedFiles.value.find(f => f.uuid === fullRecord.uuid)) {
          uploadedFiles.value.push(fullRecord);
        }
        emit('uploaded', fullRecord);
      }
    }
  } catch (e) {
    console.error('Process file error:', e);
  }
};

const handleRemoveFile = async (error: any, file: any) => {
  if (error) {
    console.error('Remove file error:', error);
    return;
  }

  const source = file?.source;
  if (source && source !== 'undefined' && typeof source === 'string' && source.length > 10) {
    await handleDelete(source);
  }
};

const handleError = (error: any) => {
  const message = error.body || error.message || 'Ошибка загрузки файла';
  console.error('FilePond error:', message);
  emit('error', message);
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

const getFileRecord = async (uuid: string): Promise<FileRecord | null> => {
  try {
    const response = await $fetch<{ file: FileRecord }>(`/api/files/${uuid}`);
    return response.file;
  } catch {
    return null;
  }
};

const isImage = (mimeType: string): boolean => {
  return mimeType?.startsWith('image/') || false;
};
</script>

