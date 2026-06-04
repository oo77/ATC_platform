<template>
  <div
    class="file-grid"
    @click.self="emit('clearSelection')"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    :class="{ 'ring-2 ring-primary ring-offset-2': isDragging }"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="folders.length === 0 && files.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400">
      <svg class="h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      <p class="text-sm">Папка пуста</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 p-2">
      <!-- Folders -->
      <div
        v-for="(folder, index) in folders"
        :key="'folder-' + folder.id"
        @click="emit('select', { type: 'folder', id: folder.id, name: folder.name }, $event)"
        @dblclick="emit('navigate', folder.id)"
        @contextmenu.prevent="emit('contextmenu', $event, folder)"
        @dragstart="handleDragStart($event, folder, 'folder')"
        draggable="true"
        :class="[
          'group relative flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all duration-150',
          isSelected(folder.id, 'folder')
            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
            : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
        ]"
      >
        <div class="relative mb-2">
          <svg class="h-12 w-12 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <svg
            v-if="folder.passwordHash"
            class="absolute -bottom-1 -right-1 h-5 w-5 text-warning bg-white dark:bg-boxdark rounded-full p-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 002-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p class="text-xs font-medium text-center truncate w-full max-w-full" :title="folder.name">
          {{ folder.name }}
        </p>
        <span v-if="folder.isSystem" class="text-[10px] text-gray-400 mt-1">Системная</span>
      </div>

      <!-- Files -->
      <div
        v-for="(file, index) in files"
        :key="'file-' + file.uuid"
        @click="emit('select', { type: 'file', id: file.uuid, name: file.filename }, $event)"
        @dblclick="emit('preview', file)"
        @contextmenu.prevent="emit('contextmenu', $event, file)"
        @dragstart="handleDragStart($event, file, 'file')"
        draggable="true"
        :class="[
          'group relative flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all duration-150',
          isSelected(file.uuid, 'file')
            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
            : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
        ]"
      >
        <!-- Preview -->
        <div class="aspect-square w-full mb-2 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <img
            v-if="isImage(file.mimeType)"
            :src="file.url"
            :alt="file.filename"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <FileTypeIcon v-else :mime-type="file.mimeType" :extension="file.extension" size="xl" />
        </div>

        <p class="text-xs font-medium text-center truncate w-full max-w-full" :title="file.filename">
          {{ file.filename }}
        </p>
        <p class="text-[10px] text-gray-400 mt-0.5">
          {{ formatFileSize(file.sizeBytes) }}
        </p>

        <!-- Hover actions -->
        <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            @click.stop="emit('delete', file.uuid)"
            class="p-1 rounded bg-white dark:bg-gray-800 text-red-500 hover:bg-red-500 hover:text-white shadow-sm"
            title="Удалить"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FileRecord, Folder } from '~/types/file';
import FileTypeIcon from '~/components/common/FileTypeIcon.vue';

interface Props {
  folders: Folder[];
  files: FileRecord[];
  isLoading: boolean;
  isSelected: (id: number | string, type: 'folder' | 'file') => boolean;
  formatFileSize: (bytes: number) => string;
}

defineProps<Props>();

const emit = defineEmits<{
  navigate: [folderId: number];
  select: [item: { type: 'folder' | 'file'; id: number | string; name: string }, event: MouseEvent];
  clearSelection: [];
  preview: [file: FileRecord];
  delete: [uuid: string];
  contextmenu: [event: MouseEvent, item: Folder | FileRecord];
  drop: [event: DragEvent];
}>();

const isDragging = ref(false);

const isImage = (mimeType: string) => mimeType?.startsWith('image/') || false;

const handleDragStart = (event: DragEvent, item: Folder | FileRecord, type: 'folder' | 'file') => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify({ type, id: type === 'folder' ? (item as Folder).id : (item as FileRecord).uuid, name: item.name }));
    event.dataTransfer.effectAllowed = 'move';
  }
};
</script>

<style scoped>
.file-grid {
  @apply flex-1 overflow-y-auto transition-all duration-200;
}
</style>