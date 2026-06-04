<template>
  <div
    class="file-manager"
    @keydown="handleKeydown"
    tabindex="0"
  >
    <!-- Split View Layout -->
    <div class="flex h-full">
      <!-- Sidebar: Folder Tree -->
      <aside class="w-56 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto shrink-0">
        <FolderTree
          :folders="folders"
          :current-folder-id="currentFolderId"
          @navigate="navigateToFolder"
          @contextmenu="showFolderContextMenu"
        />
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Toolbar -->
        <Toolbar
          :path="currentPath"
          :current-folder-id="currentFolderId"
          :selected-count="selectedCount"
          :is-syncing="isSyncing"
          :view="viewMode"
          @navigate="navigateToFolder"
          @clear-selection="clearSelection"
          @delete-selected="handleDeleteSelected"
          @set-view="setViewMode"
          @sync="syncFiles"
          @create-folder="showCreateFolderModal = true"
          @upload="showUploadModal = true"
        />

        <!-- File Grid -->
        <FileGrid
          :folders="filteredFolders"
          :files="filteredFiles"
          :is-loading="isLoading"
          :is-selected="isSelected"
          :format-file-size="formatFileSize"
          @navigate="navigateToFolder"
          @select="selectItem"
          @clear-selection="clearSelection"
          @preview="openPreview"
          @delete="handleDelete"
          @contextmenu="handleContextMenu"
        />
      </div>

      <!-- Preview Panel (right side) -->
      <PreviewPanel
        v-if="previewFile"
        :file="previewFile"
        :format-file-size="formatFileSize"
        @close="previewFile = null; showPreview = false"
        @download="downloadFile(previewFile!)"
        @delete="previewFile && handleDelete(previewFile.uuid)"
      />
    </div>

    <!-- Create Folder Modal -->
    <CreateFolderModal
      :is-open="showCreateFolderModal"
      :parent-id="currentFolderId"
      @close="showCreateFolderModal = false"
      @created="handleFolderCreated"
    />

    <!-- Upload Modal -->
    <Modal
      :is-open="showUploadModal"
      title="Загрузить файлы"
      size="lg"
      @close="showUploadModal = false"
    >
      <FileUploader
        category="other"
        :folder-id="currentFolderId"
        accept="*/*"
        :max-size-mb="50"
        :multiple="true"
        @uploaded="handleFileUploaded"
        @error="(msg) => notification.error(msg, 'Ошибка загрузки')"
      />
    </Modal>

    <!-- Rename Modal -->
    <RenameModal
      :is-open="showRenameModal"
      :current-name="renameTarget?.name || ''"
      :title="renameTarget?.type === 'folder' ? 'Переименовать папку' : 'Переименовать файл'"
      @close="showRenameModal = false"
      @submit="handleRename"
    />

    <!-- Set Password Modal -->
    <SetPasswordModal
      v-if="passwordTarget"
      :is-open="showSetPasswordModal"
      :folder-id="passwordTarget.id"
      @close="showSetPasswordModal = false"
      @submit="handleSetPassword"
    />

    <!-- Unlock Folder Modal -->
    <UnlockFolderModal
      v-if="unlockTarget"
      ref="unlockModalRef"
      :is-open="showUnlockModal"
      :folder-id="unlockTarget.id"
      @close="showUnlockModal = false"
      @submit="handleUnlockFolder"
    />

    <!-- Context Menu -->
    <ContextMenu
      :visible="contextMenu.visible"
      :position="contextMenu.position"
      :items="contextMenu.items"
      @close="contextMenu.visible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Modal from '~/components/ui/Modal.vue';
import FileUploader from '~/components/common/FileUploader.vue';
import FolderTree from './FolderTree.vue';
import Toolbar from './Toolbar.vue';
import FileGrid from './FileGrid.vue';
import PreviewPanel from './PreviewPanel.vue';
import CreateFolderModal from './CreateFolderModal.vue';
import RenameModal from './RenameModal.vue';
import SetPasswordModal from './SetPasswordModal.vue';
import UnlockFolderModal from './UnlockFolderModal.vue';
import ContextMenu, { type ContextMenuItem } from './ContextMenu.vue';
import type { FileRecord, Folder } from '~/types/file';

const {
  folders,
  files,
  isLoading,
  isSyncing,
  currentFolderId,
  currentPath,
  selectedItems,
  selectedCount,
  previewFile,
  showPreview,
  showCreateFolderModal,
  showUploadModal,
  showRenameModal,
  showSetPasswordModal,
  showUnlockModal,
  renameTarget,
  passwordTarget,
  unlockTarget,
  contextMenu,
  navigateToFolder,
  selectItem,
  clearSelection,
  isSelected,
  handleDelete,
  openPreview,
  downloadFile,
  openRenameModal,
  handleRename,
  openSetPasswordModal,
  handleSetPassword,
  handleRemovePassword,
  handleUnlockFolder,
  showFolderContextMenu,
  showFileContextMenu,
  syncFiles,
  handleFileUploaded,
  handleFolderCreated,
  init,
  handleKeydown,
  formatFileSize,
} = useFileManagerUI();

const unlockModalRef = ref<InstanceType<typeof UnlockFolderModal> | null>(null);
const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');

const setViewMode = (view: 'grid' | 'list') => {
  viewMode.value = view;
};

// Filtered items
const filteredFolders = computed(() => {
  if (!searchQuery.value) return folders.value;
  const q = searchQuery.value.toLowerCase();
  return folders.value.filter(f => f.name.toLowerCase().includes(q));
});

const filteredFiles = computed(() => {
  if (!searchQuery.value) return files.value;
  const q = searchQuery.value.toLowerCase();
  return files.value.filter(f => f.filename.toLowerCase().includes(q));
});

// Context menu handler
const handleContextMenu = (event: MouseEvent, item: Folder | FileRecord) => {
  if ('uuid' in item) {
    showFileContextMenu(event, item);
  } else {
    showFolderContextMenu(event, item);
  }
};

const handleDeleteSelected = async () => {
  for (const item of selectedItems.value) {
    if (item.type === 'file') {
      try {
        await handleDelete(item.id as string);
      } catch (e) {
        // Already handled in handleDelete
      }
    }
  }
  clearSelection();
};

onMounted(() => {
  init();
});
</script>

<style scoped>
.file-manager {
   height: 100%;
   display: flex;
   flex-direction: column;
   background-color: var(--color-white);
   outline: none;
}

.file-manager:deep(.dark) {
   background-color: var(--color-boxdark);
}
</style>