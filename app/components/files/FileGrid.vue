<template>
  <div
    ref="root"
    class="relative min-h-0 flex-1 overflow-y-auto"
    tabindex="-1"
    @click.self="emit('clearSelection')"
    @contextmenu.self.prevent="emit('contextmenu', $event, null)"
  >
    <!-- Загрузка: скелетон вместо спиннера, макет не прыгает -->
    <div v-if="isLoading && !items.length" class="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
      <div v-for="n in 12" :key="n" class="h-36 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.05]" />
    </div>

    <UiEmptyState v-else-if="loadError" title="Не удалось загрузить папку" description="Проверьте соединение и попробуйте ещё раз." :icon="AlertTriangle">
      <template #actions><UiButton variant="outline" @click="emit('refresh')">Повторить</UiButton></template>
    </UiEmptyState>

    <UiEmptyState
      v-else-if="!items.length"
      :title="search ? 'Ничего не найдено' : 'Папка пуста'"
      :description="search ? `По запросу «${search}» в этой папке ничего нет.` : 'Перетащите файлы сюда или воспользуйтесь кнопками.'"
      :icon="search ? SearchX : FolderOpen"
    >
      <template #actions>
        <UiButton v-if="search" variant="outline" @click="emit('clearSearch')">Сбросить поиск</UiButton>
        <template v-else>
          <UiButton :start-icon="Upload" @click="emit('upload')">Загрузить файлы</UiButton>
          <UiButton variant="outline" :start-icon="FolderPlus" @click="emit('createFolder')">Новая папка</UiButton>
        </template>
      </template>
    </UiEmptyState>

    <!-- Плитка -->
    <div v-else-if="view === 'grid'" ref="gridEl" class="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8" @click.self="emit('clearSelection')">
      <div
        v-for="item in items"
        :key="item.key"
        :data-fm-key="item.key"
        draggable="true"
        :aria-selected="isSelected(item.key)"
        :class="[
          'group relative flex cursor-pointer select-none flex-col rounded-xl border p-2 transition-colors',
          isSelected(item.key) ? 'border-primary bg-primary-50/70 dark:bg-primary-500/10' : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.05]',
          focusKey === item.key ? 'ring-2 ring-primary/40' : '',
          dropKey === item.key ? 'border-primary bg-primary-100 ring-2 ring-primary/40 dark:bg-primary-500/20' : '',
          draggingKeys.includes(item.key) ? 'opacity-40' : '',
        ]"
        @click="emit('select', item, $event)"
        @dblclick="emit('open', item)"
        @contextmenu.prevent="emit('contextmenu', $event, item)"
        @dragstart="emit('dragstart', item, $event)"
        @dragend="emit('dragend')"
        @dragover="(e) => over(e, item)"
        @dragleave="dropKey = ''"
        @drop="(e) => drop(e, item)"
      >
        <!-- Чекбокс: выделение без Ctrl -->
        <button
          type="button"
          :class="['absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border bg-white shadow-sm transition-opacity dark:bg-gray-800', isSelected(item.key) ? 'border-primary bg-primary text-white opacity-100 dark:bg-primary' : 'border-gray-300 opacity-0 group-hover:opacity-100']"
          :aria-label="isSelected(item.key) ? 'Снять выделение' : 'Выделить'"
          tabindex="-1"
          @click.stop="emit('toggle', item)"
        >
          <Check v-if="isSelected(item.key)" class="h-3.5 w-3.5" />
        </button>

        <div class="relative mb-2 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-white/[0.04]">
          <template v-if="item.kind === 'folder'">
            <Folder class="h-14 w-14 fill-amber-400/90 text-amber-500" />
            <span v-if="item.folder.passwordHash" class="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-warning-600 shadow dark:bg-gray-800"><Lock class="h-3.5 w-3.5" /></span>
          </template>
          <img v-else-if="isImage(item.file.mimeType)" :src="item.file.url" :alt="item.name" class="h-full w-full object-cover" loading="lazy" draggable="false" />
          <FileTypeIcon v-else :mime-type="item.file.mimeType" :extension="item.file.extension" size="xl" />
        </div>

        <p class="truncate text-center text-xs font-medium text-gray-800 dark:text-gray-100" :title="item.name">{{ item.name }}</p>
        <p class="mt-0.5 truncate text-center text-[11px] text-gray-400">
          <template v-if="item.kind === 'file'">{{ formatFileSize(item.file.sizeBytes) }}</template>
          <template v-else>{{ item.folder.isSystem ? 'Системная папка' : 'Папка' }}</template>
        </p>
      </div>
    </div>

    <!-- Список -->
    <table v-else class="w-full text-sm" @click.self="emit('clearSelection')">
      <thead class="sticky top-0 z-10 bg-white text-left text-xs uppercase tracking-wide text-gray-400 dark:bg-gray-900">
        <tr class="border-b border-gray-100 dark:border-gray-800">
          <th class="w-10 py-2 pl-4">
            <input type="checkbox" class="h-4 w-4 rounded border-gray-300" :checked="allSelected" :indeterminate.prop="someSelected && !allSelected" aria-label="Выделить всё" @change="emit('selectAll', ($event.target as HTMLInputElement).checked)" />
          </th>
          <th v-for="col in columns" :key="col.key" :class="['py-2 pr-4 font-medium', col.cls]">
            <button type="button" class="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200" @click="emit('sort', col.key)">
              {{ col.label }}
              <component :is="sortDir === 'asc' ? ChevronUp : ChevronDown" v-if="sortKey === col.key" class="h-3 w-3" />
            </button>
          </th>
          <th class="w-10" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.key"
          :data-fm-key="item.key"
          draggable="true"
          :aria-selected="isSelected(item.key)"
          :class="[
            'group cursor-pointer select-none border-b border-gray-50 transition-colors dark:border-gray-800/50',
            isSelected(item.key) ? 'bg-primary-50/70 dark:bg-primary-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]',
            focusKey === item.key ? 'outline outline-2 -outline-offset-2 outline-primary/40' : '',
            dropKey === item.key ? 'bg-primary-100 dark:bg-primary-500/20' : '',
            draggingKeys.includes(item.key) ? 'opacity-40' : '',
          ]"
          @click="emit('select', item, $event)"
          @dblclick="emit('open', item)"
          @contextmenu.prevent="emit('contextmenu', $event, item)"
          @dragstart="emit('dragstart', item, $event)"
          @dragend="emit('dragend')"
          @dragover="(e) => over(e, item)"
          @dragleave="dropKey = ''"
          @drop="(e) => drop(e, item)"
        >
          <td class="py-2 pl-4" @click.stop>
            <input type="checkbox" class="h-4 w-4 rounded border-gray-300" :checked="isSelected(item.key)" :aria-label="`Выделить ${item.name}`" @change="emit('toggle', item)" />
          </td>
          <td class="max-w-0 py-2 pr-4">
            <div class="flex items-center gap-3">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-50 dark:bg-white/[0.05]">
                <Folder v-if="item.kind === 'folder'" class="h-5 w-5 fill-amber-400/90 text-amber-500" />
                <img v-else-if="isImage(item.file.mimeType)" :src="item.file.url" alt="" class="h-full w-full object-cover" loading="lazy" draggable="false" />
                <FileTypeIcon v-else :mime-type="item.file.mimeType" :extension="item.file.extension" size="md" />
              </span>
              <span class="truncate font-medium text-gray-800 dark:text-gray-100" :title="item.name">{{ item.name }}</span>
              <Lock v-if="item.kind === 'folder' && item.folder.passwordHash" class="h-3.5 w-3.5 shrink-0 text-warning-500" />
            </div>
          </td>
          <td class="hidden whitespace-nowrap py-2 pr-4 text-gray-500 md:table-cell">{{ item.kind === 'file' ? formatDate(item.file.createdAt) : formatDate(item.folder.updatedAt) }}</td>
          <td class="hidden whitespace-nowrap py-2 pr-4 text-right text-gray-500 sm:table-cell">{{ item.kind === 'file' ? formatFileSize(item.file.sizeBytes) : '—' }}</td>
          <td class="hidden whitespace-nowrap py-2 pr-4 uppercase text-gray-400 lg:table-cell">{{ item.kind === 'file' ? item.file.extension?.replace('.', '') || '—' : 'папка' }}</td>
          <td class="py-2 pr-3">
            <button type="button" class="rounded p-1 text-gray-400 opacity-0 hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 dark:hover:bg-white/10" aria-label="Действия" @click.stop="emit('contextmenu', $event, item)">
              <MoreVertical class="h-4 w-4" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { Folder, Lock, Check, Upload, FolderPlus, FolderOpen, SearchX, AlertTriangle, ChevronUp, ChevronDown, MoreVertical } from 'lucide-vue-next';
import FileTypeIcon from '~/components/common/FileTypeIcon.vue';
import type { FMItem, SortKey, ViewMode } from '~/composables/useFileManagerUI';

const props = defineProps<{
  items: FMItem[];
  view: ViewMode;
  isLoading: boolean;
  loadError: boolean;
  search: string;
  selectedKeys: Set<string>;
  focusKey: string | null;
  draggingKeys: string[];
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  formatFileSize: (b: number) => string;
  canDropOn: (id: number | null, e?: DragEvent) => boolean;
}>();

const emit = defineEmits<{
  select: [item: FMItem, e: MouseEvent];
  toggle: [item: FMItem];
  open: [item: FMItem];
  clearSelection: [];
  clearSearch: [];
  selectAll: [checked: boolean];
  contextmenu: [e: MouseEvent, item: FMItem | null];
  dragstart: [item: FMItem, e: DragEvent];
  dragend: [];
  dropOn: [id: number | null, e: DragEvent];
  sort: [k: SortKey];
  refresh: [];
  upload: [];
  createFolder: [];
  columns: [n: number];
}>();

const isSelected = (key: string) => props.selectedKeys.has(key);
const isImage = (m?: string) => !!m?.startsWith('image/');
const allSelected = computed(() => props.items.length > 0 && props.items.every((i) => props.selectedKeys.has(i.key)));
const someSelected = computed(() => props.selectedKeys.size > 0);

const columns: { key: SortKey; label: string; cls: string }[] = [
  { key: 'name', label: 'Имя', cls: '' },
  { key: 'date', label: 'Изменён', cls: 'hidden md:table-cell' },
  { key: 'size', label: 'Размер', cls: 'hidden text-right sm:table-cell' },
  { key: 'type', label: 'Тип', cls: 'hidden lg:table-cell' },
];

const formatDate = (d: string | Date) =>
  d ? new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Цель перетаскивания — только папки
const dropKey = ref('');
const over = (e: DragEvent, item: FMItem) => {
  if (item.kind !== 'folder' || !props.canDropOn(item.folder.id, e)) return;
  e.preventDefault();
  e.stopPropagation();
  dropKey.value = item.key;
};
const drop = (e: DragEvent, item: FMItem) => {
  dropKey.value = '';
  if (item.kind !== 'folder' || !props.canDropOn(item.folder.id, e)) return;
  e.stopPropagation();
  emit('dropOn', item.folder.id, e);
};
// Число колонок плитки — для навигации стрелками вверх/вниз
const gridEl = ref<HTMLElement | null>(null);
const root = ref<HTMLElement | null>(null);
let ro: ResizeObserver | undefined;
const measure = () => {
  if (!gridEl.value) return;
  emit('columns', getComputedStyle(gridEl.value).gridTemplateColumns.split(' ').length);
};
onMounted(() => {
  ro = new ResizeObserver(measure);
  if (root.value) ro.observe(root.value);
  measure();
});
watch(() => [props.view, props.items.length], () => nextTick(measure));
onBeforeUnmount(() => ro?.disconnect());
</script>
