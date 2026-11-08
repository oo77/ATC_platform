<template>
  <div class="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-transparent">
    <!-- Строка 1: путь -->
    <div class="flex items-center gap-1 px-3 py-2">
      <UiButton variant="ghost" size="sm" icon :title="treeOpen ? 'Скрыть дерево папок' : 'Показать дерево папок'" aria-label="Дерево папок" @click="emit('toggleTree')">
        <component :is="treeOpen ? PanelLeftClose : PanelLeftOpen" class="h-4 w-4" />
      </UiButton>
      <UiButton variant="ghost" size="sm" icon title="На уровень выше (Backspace)" aria-label="Наверх" :disabled="currentFolderId === null" @click="emit('up')">
        <ArrowUp class="h-4 w-4" />
      </UiButton>

      <nav class="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-sm" aria-label="Путь">
        <button
          type="button"
          :class="crumbClass(null)"
          @click="emit('navigate', null)"
          @dragover="(e) => over(e, null)"
          @dragleave="dropKey = ''"
          @drop="(e) => drop(e, null)"
        >
          <HardDrive class="h-4 w-4" />
          <span v-if="!crumbs.length" class="font-medium">Все файлы</span>
        </button>
        <template v-for="(c, i) in crumbs" :key="c.id">
          <ChevronRight class="h-4 w-4 shrink-0 text-gray-300" />
          <span v-if="i === crumbs.length - 1" class="max-w-[220px] truncate rounded-md px-2 py-1 font-medium text-gray-900 dark:text-white" :title="c.name">{{ c.name }}</span>
          <button
            v-else
            type="button"
            :class="crumbClass(c.id)"
            :title="c.name"
            @click="emit('navigate', c.id)"
            @dragover="(e) => over(e, c.id)"
            @dragleave="dropKey = ''"
            @drop="(e) => drop(e, c.id)"
          >
            <span class="max-w-[140px] truncate">{{ c.name }}</span>
          </button>
        </template>
      </nav>

      <UiButton variant="ghost" size="sm" icon title="Обновить (R)" aria-label="Обновить" :disabled="isLoading" @click="emit('refresh')">
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
      </UiButton>
    </div>

    <!-- Строка 2: действия -->
    <div class="flex flex-wrap items-center gap-2 border-t border-gray-100 px-3 py-2 dark:border-gray-800/70">
      <!-- Выделение заменяет обычные действия — всё под рукой -->
      <div v-if="selectedCount > 0" class="flex items-center gap-1 rounded-lg bg-primary-50 py-0.5 pl-3 pr-1 text-sm text-primary dark:bg-primary-500/15 dark:text-primary-300">
        <span class="mr-1 font-medium">Выбрано: {{ selectedCount }}</span>
        <UiButton v-if="selectedFilesCount" variant="ghost" size="xs" :start-icon="Download" @click="emit('downloadSelected')">Скачать</UiButton>
        <UiButton variant="danger-ghost" size="xs" :start-icon="Trash2" @click="emit('deleteSelected')">Удалить</UiButton>
        <UiButton variant="ghost" size="xs" icon title="Снять выбор (Esc)" aria-label="Снять выбор" @click="emit('clearSelection')">
          <X class="h-3.5 w-3.5" />
        </UiButton>
      </div>
      <template v-else>
        <UiButton variant="primary" :start-icon="Upload" title="Загрузить файлы (U) — или перетащите их в окно" @click="emit('upload')">Загрузить</UiButton>
        <UiButton variant="outline" :start-icon="FolderPlus" title="Новая папка (N)" @click="emit('createFolder')">Папка</UiButton>
      </template>

      <div class="ml-auto flex flex-wrap items-center gap-2">
        <div class="relative">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            :ref="(el) => emit('searchEl', el as HTMLInputElement | null)"
            :value="search"
            type="search"
            placeholder="Поиск в папке  (/)"
            aria-label="Поиск по файлам и папкам"
            class="h-9 w-48 rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100 sm:w-56"
            @input="emit('update:search', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <!-- Сортировка -->
        <div class="flex items-center">
          <select
            :value="sortKey"
            aria-label="Сортировка"
            class="h-9 rounded-l-lg border border-r-0 border-gray-300 bg-transparent pl-3 pr-7 text-sm text-gray-700 focus:border-primary focus:outline-none dark:border-gray-700 dark:text-gray-200"
            @change="emit('sort', ($event.target as HTMLSelectElement).value as SortKey)"
          >
            <option value="name">По имени</option>
            <option value="date">По дате</option>
            <option value="size">По размеру</option>
            <option value="type">По типу</option>
          </select>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-r-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
            :title="sortDir === 'asc' ? 'По возрастанию' : 'По убыванию'"
            aria-label="Направление сортировки"
            @click="emit('sort', sortKey)"
          >
            <component :is="sortDir === 'asc' ? ArrowUpNarrowWide : ArrowDownWideNarrow" class="h-4 w-4" />
          </button>
        </div>

        <div class="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/[0.06]" role="group" aria-label="Вид">
          <button
            v-for="v in views"
            :key="v.id"
            type="button"
            :title="v.title"
            :aria-label="v.title"
            :aria-pressed="view === v.id"
            :class="['flex h-8 w-8 items-center justify-center rounded-md transition-colors', view === v.id ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200']"
            @click="emit('setView', v.id)"
          >
            <component :is="v.icon" class="h-4 w-4" />
          </button>
        </div>

        <UiButton v-if="canSync" variant="ghost" icon title="Синхронизировать с диском" aria-label="Синхронизировать с диском" :disabled="isSyncing" @click="emit('sync')">
          <DatabaseZap class="h-4 w-4" :class="{ 'animate-pulse': isSyncing }" />
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PanelLeftClose, PanelLeftOpen, ArrowUp, HardDrive, ChevronRight, RefreshCw, Download, Trash2, X, Upload,
  FolderPlus, Search, ArrowUpNarrowWide, ArrowDownWideNarrow, LayoutGrid, List, DatabaseZap,
} from 'lucide-vue-next';
import type { Crumb, SortKey, ViewMode } from '~/composables/useFileManagerUI';

const props = defineProps<{
  crumbs: Crumb[];
  currentFolderId: number | null;
  selectedCount: number;
  selectedFilesCount: number;
  isSyncing: boolean;
  isLoading: boolean;
  canSync: boolean;
  view: ViewMode;
  treeOpen: boolean;
  search: string;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  canDropOn: (id: number | null, e?: DragEvent) => boolean;
}>();

const emit = defineEmits<{
  navigate: [id: number | null];
  up: [];
  refresh: [];
  clearSelection: [];
  deleteSelected: [];
  downloadSelected: [];
  setView: [v: ViewMode];
  sync: [];
  createFolder: [];
  upload: [];
  toggleTree: [];
  sort: [k: SortKey];
  'update:search': [v: string];
  searchEl: [el: HTMLInputElement | null];
  dropOn: [id: number | null, e: DragEvent];
}>();

const views = [
  { id: 'grid' as const, title: 'Плитка', icon: LayoutGrid },
  { id: 'list' as const, title: 'Список', icon: List },
];

// Подсветка крошки как цели перетаскивания
const dropKey = ref('');
const crumbClass = (id: number | null) => [
  'flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary dark:text-gray-400 dark:hover:bg-white/[0.06]',
  dropKey.value === String(id) ? 'bg-primary-100 ring-2 ring-primary/40' : '',
];
const over = (e: DragEvent, id: number | null) => {
  if (!props.canDropOn(id, e)) return;
  e.preventDefault();
  dropKey.value = String(id);
};
const drop = (e: DragEvent, id: number | null) => {
  dropKey.value = '';
  if (props.canDropOn(id, e)) emit('dropOn', id, e);
};
</script>
