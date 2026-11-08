<template>
  <li role="treeitem" :aria-expanded="hasChildren ? expanded : undefined" :aria-selected="currentFolderId === folder.id">
    <div
      :class="[
        'group flex items-center gap-1 rounded-lg pr-2 text-sm transition-colors',
        currentFolderId === folder.id
          ? 'bg-primary-50 text-primary dark:bg-primary-500/15 dark:text-primary-300'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]',
        isDropTarget ? 'bg-primary-100 ring-2 ring-primary/40 dark:bg-primary-500/25' : '',
      ]"
      :style="{ paddingLeft: depth * 12 + 4 + 'px' }"
      @dragover="onDragOver"
      @dragleave="isDropTarget = false"
      @drop="onDrop"
      @contextmenu.prevent="emit('contextmenu', $event, folder)"
    >
      <button
        type="button"
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        :aria-label="expanded ? 'Свернуть' : 'Развернуть'"
        tabindex="-1"
        @click.stop="emit('toggle', folder.id)"
      >
        <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" />
        <ChevronRight v-else class="h-4 w-4 transition-transform" :class="{ 'rotate-90': expanded }" />
      </button>
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
        :title="folder.name"
        @click="emit('navigate', folder.id)"
      >
        <FolderOpen v-if="expanded || currentFolderId === folder.id" class="h-4 w-4 shrink-0 text-amber-500" />
        <FolderIcon v-else class="h-4 w-4 shrink-0 text-amber-500" />
        <span class="truncate">{{ folder.name }}</span>
        <Lock v-if="folder.passwordHash" class="h-3 w-3 shrink-0 text-warning-500" />
      </button>
    </div>

    <ul v-if="expanded && children.length" role="group">
      <FolderTreeNode
        v-for="child in children"
        :key="child.id"
        :folder="child"
        :depth="depth + 1"
        :current-folder-id="currentFolderId"
        :tree-children="treeChildren"
        :expanded-set="expandedSet"
        :loading-set="loadingSet"
        :can-drop-on="canDropOn"
        @navigate="emit('navigate', $event)"
        @toggle="emit('toggle', $event)"
        @drop-on="(id, e) => emit('dropOn', id, e)"
        @contextmenu="(e, f) => emit('contextmenu', e, f)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { ChevronRight, Folder as FolderIcon, FolderOpen, Lock, Loader2 } from 'lucide-vue-next';
import type { Folder } from '~/types/file';

const props = defineProps<{
  folder: Folder;
  depth: number;
  currentFolderId: number | null;
  treeChildren: Record<string, Folder[]>;
  expandedSet: Set<number>;
  loadingSet: Set<string>;
  canDropOn: (id: number | null, e?: DragEvent) => boolean;
}>();

const emit = defineEmits<{
  navigate: [id: number];
  toggle: [id: number];
  dropOn: [id: number, e: DragEvent];
  contextmenu: [e: MouseEvent, f: Folder];
}>();

const expanded = computed(() => props.expandedSet.has(props.folder.id));
const children = computed(() => props.treeChildren[String(props.folder.id)] ?? []);
const loading = computed(() => props.loadingSet.has(String(props.folder.id)));
const hasChildren = true; // потомки неизвестны, пока не раскрыли — стрелка показывается всегда
const isDropTarget = ref(false);

const onDragOver = (e: DragEvent) => {
  if (!props.canDropOn(props.folder.id, e)) return;
  e.preventDefault();
  isDropTarget.value = true;
  // Автораскрытие папки при задержке над ней
  if (!expanded.value) {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => emit('toggle', props.folder.id), 700);
  }
};
let hoverTimer: ReturnType<typeof setTimeout>;
watch(isDropTarget, (v) => { if (!v) clearTimeout(hoverTimer); });

const onDrop = (e: DragEvent) => {
  isDropTarget.value = false;
  clearTimeout(hoverTimer);
  if (!props.canDropOn(props.folder.id, e)) return;
  emit('dropOn', props.folder.id, e);
};
</script>
