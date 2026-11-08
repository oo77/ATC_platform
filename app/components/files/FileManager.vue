<template>
  <div
    class="relative flex h-full flex-col outline-none"
    tabindex="0"
    @keydown="ui.handleKeydown"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <Toolbar
      :crumbs="ui.crumbs.value"
      :current-folder-id="ui.currentFolderId.value"
      :selected-count="ui.selectedCount.value"
      :selected-files-count="ui.selectedFiles.value.length"
      :is-syncing="ui.isSyncing.value"
      :is-loading="ui.isLoading.value"
      :can-sync="isAdmin"
      :view="ui.viewMode.value"
      :tree-open="ui.treeOpen.value"
      :search="ui.searchQuery.value"
      :sort-key="ui.sortKey.value"
      :sort-dir="ui.sortDir.value"
      :can-drop-on="ui.canDropOn"
      @navigate="ui.navigateToFolder"
      @up="ui.goUp"
      @refresh="ui.refresh"
      @clear-selection="ui.clearSelection"
      @delete-selected="ui.requestDelete()"
      @download-selected="ui.downloadSelected"
      @set-view="ui.viewMode.value = $event"
      @sync="ui.syncFiles"
      @create-folder="ui.showCreateFolderModal.value = true"
      @upload="ui.pickFiles"
      @toggle-tree="ui.treeOpen.value = !ui.treeOpen.value"
      @sort="ui.setSort"
      @update:search="ui.searchQuery.value = $event"
      @search-el="ui.searchInput.value = $event"
      @drop-on="ui.dropOnFolder"
    />

    <div class="relative flex min-h-0 flex-1">
      <!-- Дерево папок -->
      <aside v-if="ui.treeOpen.value" class="w-60 shrink-0 border-r border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-white/[0.02] max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-20 max-md:bg-white max-md:shadow-theme-lg dark:max-md:bg-gray-900">
        <FolderTree
          :current-folder-id="ui.currentFolderId.value"
          :tree-children="ui.treeChildren.value"
          :expanded="ui.treeExpanded.value"
          :loading="ui.treeLoading.value"
          :can-drop-on="ui.canDropOn"
          @navigate="(id) => { ui.navigateToFolder(id); closeTreeOnMobile(); }"
          @toggle="ui.toggleTree"
          @drop-on="ui.dropOnFolder"
          @contextmenu="(e, f) => ui.showContextMenu(e, { kind: 'folder', key: `d:${f.id}`, name: f.name, folder: f })"
        />
      </aside>

      <FileGrid
        :items="ui.items.value"
        :view="ui.viewMode.value"
        :is-loading="ui.isLoading.value"
        :load-error="ui.loadError.value"
        :search="ui.searchQuery.value"
        :selected-keys="selectedKeys"
        :focus-key="ui.focusKey.value"
        :dragging-keys="ui.draggingKeys.value"
        :sort-key="ui.sortKey.value"
        :sort-dir="ui.sortDir.value"
        :format-file-size="ui.formatFileSize"
        :can-drop-on="ui.canDropOn"
        @select="ui.selectItem"
        @toggle="ui.toggleItem"
        @open="ui.openItem"
        @clear-selection="ui.clearSelection"
        @clear-search="ui.searchQuery.value = ''"
        @select-all="(c) => (c ? ui.selectAll() : ui.clearSelection())"
        @contextmenu="ui.showContextMenu"
        @dragstart="ui.startDrag"
        @dragend="ui.endDrag"
        @drop-on="ui.dropOnFolder"
        @sort="ui.setSort"
        @refresh="ui.refresh"
        @upload="ui.pickFiles"
        @create-folder="ui.showCreateFolderModal.value = true"
        @columns="ui.gridColumns.value = $event"
      />

      <PreviewPanel
        :file="ui.previewFile.value"
        :format-file-size="ui.formatFileSize"
        @close="ui.closePreview"
        @download="ui.previewFile.value && ui.downloadFile(ui.previewFile.value)"
        @copy-link="ui.previewFile.value && ui.copyLink(ui.previewFile.value)"
        @rename="previewItem && ui.requestRename(previewItem)"
        @delete="previewItem && ui.requestDelete([previewItem])"
      />

      <UploadQueue :uploads="ui.uploads.value" @dismiss="ui.dismissUploads" />

      <!-- Оверлей при перетаскивании файлов с компьютера -->
      <Transition enter-active-class="transition duration-100" enter-from-class="opacity-0" leave-active-class="transition duration-100" leave-to-class="opacity-0">
        <div v-if="osDragging" class="pointer-events-none absolute inset-2 z-30 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary bg-primary-50/90 text-primary dark:bg-gray-900/90">
          <UploadCloud class="h-10 w-10" />
          <p class="text-sm font-semibold">Отпустите, чтобы загрузить в «{{ currentName }}»</p>
        </div>
      </Transition>
    </div>

    <!-- Скрытый input для кнопки «Загрузить» -->
    <input :ref="(el) => (ui.fileInput.value = el as HTMLInputElement | null)" type="file" multiple class="hidden" @change="ui.onFilesPicked" />

    <CreateFolderModal :is-open="ui.showCreateFolderModal.value" :on-submit="ui.createNewFolder" @close="ui.showCreateFolderModal.value = false" />
    <RenameModal
      :is-open="ui.showRenameModal.value"
      :current-name="ui.renameTarget.value?.name || ''"
      :title="ui.renameTarget.value?.kind === 'folder' ? 'Переименовать папку' : 'Переименовать файл'"
      :on-submit="ui.submitRename"
      @close="ui.showRenameModal.value = false"
    />
    <SetPasswordModal :is-open="ui.showSetPasswordModal.value" :folder-name="ui.passwordTarget.value?.name || ''" :on-submit="ui.handleSetPassword" @close="ui.showSetPasswordModal.value = false" />
    <UnlockFolderModal
      :is-open="ui.showUnlockModal.value"
      :folder-name="ui.unlockTarget.value?.name || ''"
      :loading="ui.unlockLoading.value"
      :error="ui.unlockError.value"
      @close="ui.showUnlockModal.value = false"
      @submit="ui.submitUnlock"
    />

    <UiConfirmModal
      :is-open="!!ui.confirmState.value"
      :title="confirmTitle"
      :message="confirmMessage"
      :item-name="confirmItemName"
      :warning="confirmWarning"
      confirm-text="Удалить"
      loading-text="Удаление…"
      variant="danger"
      :loading="ui.confirmLoading.value"
      @confirm="ui.confirmDelete"
      @cancel="ui.confirmState.value = null"
    />

    <ContextMenu :visible="ui.contextMenu.value.visible" :position="ui.contextMenu.value.position" :items="ui.contextMenu.value.items" @close="ui.closeContextMenu" />
  </div>
</template>

<script setup lang="ts">
import { UploadCloud } from 'lucide-vue-next';
import FolderTree from './FolderTree.vue';
import Toolbar from './Toolbar.vue';
import FileGrid from './FileGrid.vue';
import PreviewPanel from './PreviewPanel.vue';
import UploadQueue from './UploadQueue.vue';
import CreateFolderModal from './CreateFolderModal.vue';
import RenameModal from './RenameModal.vue';
import SetPasswordModal from './SetPasswordModal.vue';
import UnlockFolderModal from './UnlockFolderModal.vue';
import ContextMenu from './ContextMenu.vue';
import type { FMItem } from '~/composables/useFileManagerUI';

const ui = useFileManagerUI();
const { isAdmin } = useAuth();

// Set из ref — передаём как есть: реактивность через .value
const selectedKeys = computed(() => new Set(ui.selectedItems.value.map((i) => i.key)));

const currentName = computed(() => ui.crumbs.value.at(-1)?.name ?? 'Все файлы');

const previewItem = computed<FMItem | null>(() => {
  const f = ui.previewFile.value;
  return f ? { kind: 'file', key: `f:${f.uuid}`, name: f.filename, file: f } : null;
});

const closeTreeOnMobile = () => {
  if (window.innerWidth < 768) ui.treeOpen.value = false;
};

/* Удаление: понятное подтверждение */
const confirmItems = computed(() => ui.confirmState.value?.items ?? []);
const confirmTitle = computed(() => (confirmItems.value.length > 1 ? 'Удалить выбранное?' : confirmItems.value[0]?.kind === 'folder' ? 'Удалить папку?' : 'Удалить файл?'));
const confirmMessage = computed(() => (confirmItems.value.length > 1 ? `Будет удалено элементов: ${confirmItems.value.length}.` : 'Вы собираетесь удалить:'));
const confirmItemName = computed(() => (confirmItems.value.length === 1 ? confirmItems.value[0].name : ''));
const confirmWarning = computed(() => (confirmItems.value.some((i) => i.kind === 'folder') ? 'Вместе с папкой удалится всё её содержимое.' : ''));

/* Перетаскивание файлов с компьютера в окно */
const osDragging = ref(false);
let dragDepth = 0;
const onDragEnter = (e: DragEvent) => {
  if (!ui.isOsFileDrag(e)) return;
  dragDepth++;
  osDragging.value = true;
};
const onDragOver = (e: DragEvent) => {
  if (ui.isOsFileDrag(e)) e.preventDefault();
};
const onDragLeave = (e: DragEvent) => {
  if (!ui.isOsFileDrag(e)) return;
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth) osDragging.value = false;
};
const onDrop = (e: DragEvent) => {
  if (!ui.isOsFileDrag(e)) return;
  e.preventDefault();
  dragDepth = 0;
  osDragging.value = false;
  // Бросок на карточку папки/дерево обрабатывается ими (stopPropagation) — сюда доходит только «в текущую»
  const list = Array.from(e.dataTransfer?.files ?? []);
  if (list.length) ui.upload(list);
};

onMounted(() => ui.init());
</script>
