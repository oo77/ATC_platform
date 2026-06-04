<template>
  <div class="folder-tree">
    <div class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      Папки
    </div>

    <div class="flex-1 overflow-y-auto">
      <!-- Root -->
      <button
        @click="emit('navigate', null)"
        :class="[
          'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
          currentFolderId === null ? 'bg-primary/10 text-primary' : 'text-gray-700 dark:text-gray-300'
        ]"
      >
        <svg class="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        <span class="truncate">Все файлы</span>
      </button>

      <!-- Folders -->
      <div v-for="folder in folders" :key="folder.id">
        <button
          @click="handleFolderClick(folder)"
          @contextmenu.prevent="emit('contextmenu', $event, folder)"
          :class="[
            'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group',
            currentFolderId === folder.id ? 'bg-primary/10 text-primary' : 'text-gray-700 dark:text-gray-300'
          ]"
        >
          <svg class="h-5 w-5 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span class="truncate flex-1 text-left">{{ folder.name }}</span>

          <!-- Lock icon -->
          <svg
            v-if="folder.passwordHash"
            class="h-4 w-4 text-warning shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Folder } from '~/types/file';

interface Props {
  folders: Folder[];
  currentFolderId: number | null;
}

defineProps<Props>();

const emit = defineEmits<{
  navigate: [folderId: number | null];
  contextmenu: [event: MouseEvent, folder: Folder];
}>();

const handleFolderClick = (folder: Folder) => {
  emit('navigate', folder.id);
};
</script>

<style scoped>
.folder-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-gray-50);
}

.folder-tree:deep(.dark) {
  background-color: var(--color-gray-900);
}
</style>