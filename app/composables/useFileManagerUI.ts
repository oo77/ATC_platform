import { ref, computed } from 'vue';
import type { FileRecord, Folder } from '~/types/file';

export interface SelectedItem {
  type: 'folder' | 'file';
  id: number | string;
  name: string;
}

export function useFileManagerUI() {
  const { getFolderContents } = useFolderManager();
  const { deleteFile, formatFileSize } = useFileManager();
  const { authFetch } = useAuthFetch();
  const notification = useNotification();

  // State
  const folders = ref<Folder[]>([]);
  const files = ref<FileRecord[]>([]);
  const isLoading = ref(false);
  const isSyncing = ref(false);
  const currentFolderId = ref<number | null>(null);
  const currentPath = ref('/');

  // Selection
  const selectedItems = ref<SelectedItem[]>([]);
  const lastSelectedIndex = ref<number | null>(null);

  // Preview
  const previewFile = ref<FileRecord | null>(null);
  const showPreview = ref(false);

  // Modals
  const showCreateFolderModal = ref(false);
  const showUploadModal = ref(false);
  const showRenameModal = ref(false);
  const showSetPasswordModal = ref(false);
  const showUnlockModal = ref(false);

  const renameTarget = ref<SelectedItem | null>(null);
  const passwordTarget = ref<{ id: number; name: string } | null>(null);
  const unlockTarget = ref<{ id: number; name: string } | null>(null);

  // Context Menu
  const contextMenu = ref<{
    visible: boolean;
    position: { x: number; y: number };
    items: any[];
    target: Folder | FileRecord | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    items: [],
    target: null,
  });

  // Unlocked folders
  const unlockedFolders = ref<Set<number>>(new Set());

  // Computed
  const hasSelection = computed(() => selectedItems.value.length > 0);
  const selectedCount = computed(() => selectedItems.value.length);

  // Load folder contents
  const loadFolderContents = async (folderId: number | null = null) => {
    isLoading.value = true;
    try {
      const contents = await getFolderContents(folderId);
      folders.value = contents.folders;
      files.value = contents.files;
    } catch (error) {
      console.error('Error loading folder contents:', error);
      notification.error('Не удалось загрузить содержимое папки', 'Ошибка');
    } finally {
      isLoading.value = false;
    }
  };

  // Navigation
  const navigateToFolder = async (folderId: number | null) => {
    if (folderId !== null) {
      const folder = folders.value.find(f => f.id === folderId);

      if (folder?.passwordHash && !unlockedFolders.value.has(folderId)) {
        unlockTarget.value = { id: folder.id, name: folder.name };
        showUnlockModal.value = true;
        return;
      }
    }

    currentFolderId.value = folderId;
    clearSelection();

    if (folderId === null) {
      currentPath.value = '/';
    } else {
      const folder = folders.value.find(f => f.id === folderId);
      if (folder) {
        currentPath.value = folder.path;
      }
    }

    await loadFolderContents(folderId);
  };

  // Selection
  const selectItem = (item: SelectedItem, event?: MouseEvent) => {
    if (event?.ctrlKey || event?.metaKey) {
      // Toggle selection
      const index = selectedItems.value.findIndex(
        s => s.id === item.id && s.type === item.type
      );
      if (index > -1) {
        selectedItems.value.splice(index, 1);
      } else {
        selectedItems.value.push(item);
      }
    } else if (event?.shiftKey && lastSelectedIndex.value !== null) {
      // Range selection
      const allItems = [...folders.value.map(f => ({ type: 'folder' as const, id: f.id, name: f.name })),
                        ...files.value.map(f => ({ type: 'file' as const, id: f.uuid, name: f.filename }))];
      const start = lastSelectedIndex.value;
      const end = allItems.findIndex(i => i.id === item.id && i.type === item.type);
      if (start > -1 && end > -1) {
        const [min, max] = start < end ? [start, end] : [end, start];
        selectedItems.value = allItems.slice(min, max + 1);
      }
    } else {
      // Single selection
      selectedItems.value = [item];
    }
    lastSelectedIndex.value = allItemsIndex(item);
  };

  const allItemsIndex = (item: SelectedItem): number => {
    const allItems = [...folders.value.map(f => ({ type: 'folder' as const, id: f.id, name: f.name })),
                      ...files.value.map(f => ({ type: 'file' as const, id: f.uuid, name: f.filename }))];
    return allItems.findIndex(i => i.id === item.id && i.type === item.type);
  };

  const clearSelection = () => {
    selectedItems.value = [];
    lastSelectedIndex.value = null;
  };

  const isSelected = (id: number | string, type: 'folder' | 'file'): boolean => {
    return selectedItems.value.some(s => s.id === id && s.type === type);
  };

  // Actions
  const handleDelete = async (uuid: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот файл?')) return;

    try {
      await deleteFile(uuid);
      await loadFolderContents(currentFolderId.value);
      notification.success('Файл успешно удален', 'Успех');
    } catch (error) {
      notification.error('Не удалось удалить файл', 'Ошибка');
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Удалить ${selectedCount.value} выбранных элементов?`)) return;

    for (const item of selectedItems.value) {
      if (item.type === 'file') {
        try {
          await deleteFile(item.id as string);
        } catch (e) {
          console.error(`Error deleting ${item.name}:`, e);
        }
      }
    }

    clearSelection();
    await loadFolderContents(currentFolderId.value);
    notification.success('Выбранные элементы удалены', 'Успех');
  };

  const openPreview = (file: FileRecord) => {
    previewFile.value = file;
    showPreview.value = true;
  };

  const downloadFile = (file: FileRecord) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.filename;
    link.click();
  };

  // Rename
  const openRenameModal = (type: 'folder' | 'file', id: number | string, name: string) => {
    renameTarget.value = { type, id, name };
    showRenameModal.value = true;
  };

  const handleRename = async (newName: string) => {
    if (!renameTarget.value) return;

    try {
      const { type, id } = renameTarget.value;
      if (type === 'folder') {
        await authFetch(`/api/folders/${id}/rename`, {
          method: 'PUT',
          body: { newName },
        });
      } else {
        await authFetch(`/api/files/${id}/rename`, {
          method: 'PUT',
          body: { newName },
        });
      }

      showRenameModal.value = false;
      renameTarget.value = null;
      await loadFolderContents(currentFolderId.value);
      notification.success('Успешно переименовано', 'Успех');
    } catch (error) {
      notification.error('Ошибка переименования', 'Ошибка');
    }
  };

  // Password
  const openSetPasswordModal = (folder: Folder) => {
    passwordTarget.value = { id: folder.id, name: folder.name };
    showSetPasswordModal.value = true;
  };

  const handleSetPassword = async (password: string) => {
    if (!passwordTarget.value) return;

    try {
      await authFetch(`/api/folders/${passwordTarget.value.id}/set-password`, {
        method: 'POST',
        body: { password },
      });

      showSetPasswordModal.value = false;
      passwordTarget.value = null;
      await loadFolderContents(currentFolderId.value);
      notification.success('Пароль установлен', 'Успех');
    } catch (error) {
      notification.error('Ошибка установки пароля', 'Ошибка');
    }
  };

  const handleRemovePassword = async (folderId: number) => {
    try {
      await authFetch(`/api/folders/${folderId}/remove-password`, {
        method: 'DELETE',
      });
      await loadFolderContents(currentFolderId.value);
      notification.success('Пароль удален', 'Успех');
    } catch (error) {
      notification.error('Ошибка удаления пароля', 'Ошибка');
    }
  };

  const handleUnlockFolder = async (password: string) => {
    if (!unlockTarget.value) return;

    try {
      await authFetch(`/api/folders/${unlockTarget.value.id}/verify-password`, {
        method: 'POST',
        body: { password },
      });

      unlockedFolders.value.add(unlockTarget.value.id);
      sessionStorage.setItem('unlockedFolders', JSON.stringify(Array.from(unlockedFolders.value)));

      showUnlockModal.value = false;
      const folderId = unlockTarget.value.id;
      unlockTarget.value = null;

      await navigateToFolder(folderId);
    } catch (error) {
      throw new Error('Неверный пароль');
    }
  };

  // Context Menu
  const showFolderContextMenu = (event: MouseEvent, folder: Folder) => {
    contextMenu.value = {
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      target: folder,
      items: [
        { label: 'Открыть', action: () => navigateToFolder(folder.id) },
        { label: 'Переименовать', action: () => openRenameModal('folder', folder.id, folder.name), disabled: folder.isSystem },
        { label: 'Создать подпапку', action: () => { showCreateFolderModal.value = true; }, disabled: folder.isSystem },
        ...(!folder.isSystem ? [
          folder.passwordHash
            ? { label: 'Удалить пароль', action: () => handleRemovePassword(folder.id) }
            : { label: 'Установить пароль', action: () => openSetPasswordModal(folder) },
        ] : []),
      ],
    };
  };

  const showFileContextMenu = (event: MouseEvent, file: FileRecord) => {
    contextMenu.value = {
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      target: file,
      items: [
        { label: 'Открыть', action: () => openPreview(file) },
        { label: 'Скачать', action: () => downloadFile(file) },
        { label: 'Переименовать', action: () => openRenameModal('file', file.uuid, file.filename) },
        { label: 'Удалить', action: () => handleDelete(file.uuid) },
      ],
    };
  };

  const closeContextMenu = () => {
    contextMenu.value.visible = false;
  };

  // Sync
  const syncFiles = async () => {
    isSyncing.value = true;
    try {
      const response = await authFetch<{
        success: boolean;
        foldersImported: number;
        filesImported: number;
        message: string;
      }>('/api/files/sync', { method: 'POST' });

      if (response.success) {
        await loadFolderContents(currentFolderId.value);
        notification.success(response.message, 'Синхронизация');
      }
    } catch (error) {
      notification.error('Ошибка синхронизации', 'Ошибка');
    } finally {
      isSyncing.value = false;
    }
  };

  // File uploaded callback
  const handleFileUploaded = () => {
    showUploadModal.value = false;
    loadFolderContents(currentFolderId.value);
  };

  // Folder created callback
  const handleFolderCreated = () => {
    showCreateFolderModal.value = false;
    loadFolderContents(currentFolderId.value);
  };

  // Init
  const init = () => {
    try {
      const stored = sessionStorage.getItem('unlockedFolders');
      if (stored) {
        unlockedFolders.value = new Set(JSON.parse(stored) as number[]);
      }
    } catch (e) {
      console.error('Error loading unlocked folders:', e);
    }
    loadFolderContents();
  };

  // Keyboard shortcuts
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Delete' && hasSelection.value) {
      handleDeleteSelected();
    } else if (event.key === 'Escape') {
      clearSelection();
      closeContextMenu();
    }
  };

  return {
    // State
    folders,
    files,
    isLoading,
    isSyncing,
    currentFolderId,
    currentPath,

    // Selection
    selectedItems,
    hasSelection,
    selectedCount,

    // Preview
    previewFile,
    showPreview,

    // Modals
    showCreateFolderModal,
    showUploadModal,
    showRenameModal,
    showSetPasswordModal,
    showUnlockModal,
    renameTarget,
    passwordTarget,
    unlockTarget,

    // Context Menu
    contextMenu,

    // Methods
    loadFolderContents,
    navigateToFolder,
    selectItem,
    clearSelection,
    isSelected,
    handleDelete,
    handleDeleteSelected,
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
    closeContextMenu,
    syncFiles,
    handleFileUploaded,
    handleFolderCreated,
    init,
    handleKeydown,
    formatFileSize,
  };
}