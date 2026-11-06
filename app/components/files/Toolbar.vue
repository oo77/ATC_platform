<template>
  <!-- Панель инструментов файлового менеджера: слева путь, справа поиск / вид / действия. Главное действие — «Загрузить» -->
  <div class="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-transparent">
    <!-- Хлебные крошки пути -->
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <UiButton variant="ghost" size="sm" icon title="Все файлы" aria-label="Все файлы" @click="handleNavigate(null)">
        <Home class="h-4 w-4" />
      </UiButton>

      <span class="text-gray-400">/</span>

      <nav class="flex min-w-0 items-center gap-1 text-sm">
        <template v-for="(part, index) in pathParts" :key="index">
          <button
            v-if="index < pathParts.length - 1"
            type="button"
            class="max-w-[120px] truncate text-gray-600 transition-colors hover:text-primary dark:text-gray-400"
            @click="handleNavigate(folderIds[index])"
          >
            {{ part }}
          </button>
          <span v-else class="max-w-[200px] truncate font-medium text-gray-900 dark:text-white" :title="part">
            {{ part }}
          </span>
          <span v-if="index < pathParts.length - 1" class="text-gray-400">/</span>
        </template>
      </nav>
    </div>

    <!-- Правая часть: выбор, поиск, вид, действия -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Выбранные элементы: «Выбрано N · Удалить · Снять» -->
      <div v-if="selectedCount > 0" class="flex items-center gap-1 rounded-lg bg-primary-50 py-0.5 pl-3 pr-1 text-sm text-primary dark:bg-primary-500/15 dark:text-primary-300">
        <span class="mr-1 font-medium">Выбрано: {{ selectedCount }}</span>
        <UiButton variant="danger-ghost" size="xs" :start-icon="Trash2" @click="handleDeleteSelected">Удалить</UiButton>
        <UiButton variant="ghost" size="xs" icon title="Снять выбор" aria-label="Снять выбор" @click="handleClearSelection">
          <X class="h-3.5 w-3.5" />
        </UiButton>
      </div>

      <!-- Поиск: теперь действительно фильтрует список (эмитит update:search) -->
      <div class="relative">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Поиск…"
          aria-label="Поиск по файлам и папкам"
          class="h-9 w-44 rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
        />
      </div>

      <!-- Переключатель вида (плитка / список) -->
      <div class="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/[0.06]" role="group" aria-label="Вид">
        <button
          type="button"
          title="Плитка"
          aria-label="Плитка"
          :class="['flex h-8 w-8 items-center justify-center rounded-md transition-colors', view === 'grid' ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200']"
          @click="handleSetView('grid')"
        >
          <LayoutGrid class="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Список"
          aria-label="Список"
          :class="['flex h-8 w-8 items-center justify-center rounded-md transition-colors', view === 'list' ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200']"
          @click="handleSetView('list')"
        >
          <List class="h-4 w-4" />
        </button>
      </div>

      <!-- Синхронизация -->
      <UiButton variant="ghost" icon title="Синхронизировать" aria-label="Синхронизировать" :disabled="isSyncing" @click="handleSync">
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isSyncing }" />
      </UiButton>

      <!-- Новая папка — вторичное действие -->
      <UiButton variant="outline" :start-icon="FolderPlus" @click="handleCreateFolder">Папка</UiButton>

      <!-- Загрузка — главное действие -->
      <UiButton variant="primary" :start-icon="Upload" @click="handleUpload">Загрузить</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
// Иконки lucide вместо россыпи inline-SVG: единый стиль и меньше разметки
import { Home, Trash2, X, Search, LayoutGrid, List, RefreshCw, FolderPlus, Upload } from 'lucide-vue-next';

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
  // Исправление бага: поиск был «мёртвым» — локальный searchQuery никуда не передавался. Теперь значение уходит родителю
  'update:search': [value: string];
}>();

const searchQuery = ref('');

// Каждое изменение строки поиска сообщаем родителю (FileManager фильтрует по нему папки и файлы)
watch(searchQuery, (value) => {
  emit('update:search', value);
});

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
