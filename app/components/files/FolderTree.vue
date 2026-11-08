<template>
  <nav class="flex h-full flex-col" aria-label="Дерево папок">
    <div class="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Папки</div>

    <ul role="tree" class="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
      <li role="treeitem" :aria-selected="currentFolderId === null">
        <button
          type="button"
          :class="[
            'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
            currentFolderId === null
              ? 'bg-primary-50 font-medium text-primary dark:bg-primary-500/15 dark:text-primary-300'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]',
            rootDrop ? 'bg-primary-100 ring-2 ring-primary/40 dark:bg-primary-500/25' : '',
          ]"
          @click="emit('navigate', null)"
          @dragover="(e) => { if (canDropOn(null, e)) { e.preventDefault(); rootDrop = true; } }"
          @dragleave="rootDrop = false"
          @drop="(e) => { rootDrop = false; if (canDropOn(null, e)) emit('dropOn', null, e); }"
        >
          <HardDrive class="h-4 w-4 shrink-0 text-gray-500" />
          <span class="truncate">Все файлы</span>
        </button>
      </li>

      <div v-if="loadingRoot" class="space-y-1.5 px-2 pt-2">
        <div v-for="n in 4" :key="n" class="h-6 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
      </div>

      <FolderTreeNode
        v-for="folder in roots"
        :key="folder.id"
        :folder="folder"
        :depth="0"
        :current-folder-id="currentFolderId"
        :tree-children="treeChildren"
        :expanded-set="expanded"
        :loading-set="loading"
        :can-drop-on="canDropOn"
        @navigate="emit('navigate', $event)"
        @toggle="emit('toggle', $event)"
        @drop-on="(id, e) => emit('dropOn', id, e)"
        @contextmenu="(e, f) => emit('contextmenu', e, f)"
      />
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { HardDrive } from 'lucide-vue-next';
import FolderTreeNode from './FolderTreeNode.vue';
import type { Folder } from '~/types/file';

const props = defineProps<{
  currentFolderId: number | null;
  treeChildren: Record<string, Folder[]>;
  expanded: Set<number>;
  loading: Set<string>;
  canDropOn: (id: number | null, e?: DragEvent) => boolean;
}>();

const emit = defineEmits<{
  navigate: [id: number | null];
  toggle: [id: number];
  dropOn: [id: number | null, e: DragEvent];
  contextmenu: [e: MouseEvent, f: Folder];
}>();

const rootDrop = ref(false);
const roots = computed(() => props.treeChildren['root'] ?? []);
const loadingRoot = computed(() => !props.treeChildren['root']);
</script>
