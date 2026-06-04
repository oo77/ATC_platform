<template>
  <div class="toolbar">
    <!-- Left side: Breadcrumbs -->
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <button
        @click="handleNavigate(null)"
        class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        title="Все файлы"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
      </button>

      <span class="text-gray-400">/</span>

      <nav class="flex items-center gap-1 text-sm min-w-0">
        <template v-for="(part, index) in pathParts" :key="index">
          <button
            v-if="index < pathParts.length - 1"
            @click="handleNavigate(folderIds[index])"
            class="hover:text-primary truncate max-w-[120px]"
          >
            {{ part }}
          </button>
          <span v-else class="text-gray-900 dark:text-white font-medium truncate max-w-[200px]" :title="part">
            {{ part }}
          </span>
          <span v-if="index < pathParts.length - 1" class="text-gray-400">/</span>
        </template>
      </nav>
    </div>

    <!-- Right side: Actions -->
    <div class="flex items-center gap-2">
      <!-- Selection info -->
      <div v-if="selectedCount > 0" class="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
        <span>{{ selectedCount }} выбрано</span>
        <button
          @click="handleClearSelection"
          class="hover:bg-primary/20 rounded-full p-0.5"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <button
          v-if="selectedCount > 0"
          @click="handleDeleteSelected"
          class="hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-full p-0.5"
          title="Удалить выбранные"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>

      <!-- Search -->
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск..."
          class="w-40 pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-primary"
        />
        <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <!-- View toggle -->
      <div class="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          @click="handleSetView('grid')"
          :class="view === 'grid' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
          class="p-1.5"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>
        <button
          @click="handleSetView('list')"
          :class="view === 'list' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
          class="p-1.5"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Sync -->
      <button
        @click="handleSync"
        :disabled="isSyncing"
        class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
        title="Синхронизировать"
      >
        <svg
          class="h-4 w-4"
          :class="{ 'animate-spin': isSyncing }"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          viewBox="0 0 24 24"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </button>

      <!-- New Folder -->
      <button
        @click="handleCreateFolder"
        class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        title="Новая папка"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      </button>

      <!-- Upload -->
      <button
        @click="handleUpload"
        class="p-1.5 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
        title="Загрузить файлы"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  path: string;
  currentFolderId: number | null;
  selectedCount: number;
  isSyncing: boolean;
  view: 'grid' | 'list';
}

const props = defineProps<Props>();

const emit = defineEmits<{
  navigate: [folderId: number | null];
  clearSelection: [];
  deleteSelected: [];
  setView: [view: 'grid' | 'list'];
  sync: [];
  createFolder: [];
  upload: [];
}>();

const searchQuery = ref('');

const handleNavigate = (folderId: number | null) => {
  emit('navigate', folderId);
};

const handleClearSelection = () => {
  emit('clearSelection');
};

const handleDeleteSelected = () => {
  emit('deleteSelected');
};

const handleSetView = (view: 'grid' | 'list') => {
  emit('setView', view);
};

const handleSync = () => {
  emit('sync');
};

const handleCreateFolder = () => {
  emit('createFolder');
};

const handleUpload = () => {
  emit('upload');
};

const pathParts = computed(() => {
  return props.path.split('/').filter(Boolean);
});

const folderIds = ref<(number | null)[]>([]);
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--color-gray-200);
  background-color: var(--color-white);
}

.toolbar:deep(.dark) {
  background-color: var(--color-boxdark);
  border-color: var(--color-gray-700);
}
</style>