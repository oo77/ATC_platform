<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Файловый менеджер
      </h2>
      <div class="flex gap-2">
        <button
          @click="handleSync"
          :disabled="isSyncing"
          class="inline-flex items-center gap-2 rounded-md border border-meta-3 bg-transparent px-4 py-2.5 text-sm font-medium text-meta-3 hover:bg-meta-3 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Синхронизировать файлы и папки из storage/uploads"
        >
          <svg 
            class="h-5 w-5" 
            :class="{ 'animate-spin': isSyncing }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ isSyncing ? 'Синхронизация...' : 'Синхронизировать' }}
        </button>
        <button
          @click="showCreateFolderModal = true"
          class="inline-flex items-center gap-2 rounded-md border border-primary bg-transparent px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-all duration-200"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Создать папку
        </button>
        <button
          @click="showUploadModal = true"
          class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 transition-all duration-200"
        >
          <PlusIcon class="h-5 w-5" />
          Загрузить файлы
        </button>
      </div>
    </div>

    <!-- Breadcrumbs -->
    <Breadcrumbs
      :path="currentPath"
      :current-folder-id="currentFolderId"
      @navigate="navigateToFolder"
    />

    <!-- Содержимое -->
    <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div class="p-4 md:p-6">
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>

        <div v-else-if="folders.length === 0 && files.length === 0" class="py-12 text-center">
          <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <p class="text-gray-500 dark:text-gray-400">
            Папка пуста. Создайте подпапку или загрузите файлы.
          </p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <!-- Папки -->
          <div
            v-for="folder in folders"
            :key="'folder-' + folder.id"
            @dblclick="navigateToFolder(folder.id)"
            @contextmenu.prevent="showFolderContextMenu($event, folder)"
            class="group relative rounded-lg border border-stroke dark:border-strokedark p-4 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div class="flex flex-col items-center gap-3">
              <!-- Иконка папки -->
              <div class="relative text-yellow-500">
                <svg class="h-16 w-16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <!-- Иконка замка для защищенных папок -->
                <svg 
                  v-if="folder.passwordHash" 
                  class="absolute -bottom-1 -right-1 h-6 w-6 text-warning bg-white dark:bg-boxdark rounded-full p-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  title="Защищена паролем"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <!-- Название -->
              <p class="text-sm font-medium text-black dark:text-white text-center truncate w-full" :title="folder.name">
                {{ folder.name }}
              </p>

              <!-- System badge -->
              <span v-if="folder.isSystem" class="text-xs text-gray-500 dark:text-gray-400">
                Системная
              </span>
            </div>
          </div>

          <!-- Файлы -->
          <div
            v-for="file in files"
            :key="'file-' + file.uuid"
            @dblclick="openPreview(file)"
            @contextmenu.prevent="showFileContextMenu($event, file)"
            class="group relative rounded-lg border border-stroke dark:border-strokedark p-4 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <!-- Preview/Icon -->
            <div class="aspect-square mb-3 rounded overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
              <img
                v-if="isImage(file.mimeType)"
                :src="file.url"
                :alt="file.filename"
                class="w-full h-full object-cover"
              />
              <FileTypeIcon v-else :mime-type="file.mimeType" :extension="file.extension" size="xl" />
            </div>

            <!-- File Info -->
            <div>
              <p class="text-sm font-medium text-black dark:text-white truncate mb-1" :title="file.filename">
                {{ file.filename }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatFileSize(file.sizeBytes) }}
              </p>
            </div>

            <!-- Actions -->
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                @click.stop="handleDelete(file.uuid)"
                class="p-1.5 rounded bg-white dark:bg-gray-800 text-red-500 hover:bg-red-500 hover:text-white shadow transition-colors"
                title="Удалить"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
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
        @error="handleUploadError"
      />
    </Modal>

    <!-- Preview Modal -->
    <FilePreviewModal
      v-if="previewFile"
      :is-open="showPreviewModal"
      :file="previewFile"
      @close="showPreviewModal = false"
    />

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
import { ref, onMounted } from 'vue';
import type { FileRecord, Folder } from '~/types/file';
import PlusIcon from '~/components/icons/PlusIcon.vue';
import TrashIcon from '~/components/icons/TrashIcon.vue';
import Modal from '~/components/ui/Modal.vue';
import FileUploader from '~/components/common/FileUploader.vue';
import FileTypeIcon from '~/components/common/FileTypeIcon.vue';
import FilePreviewModal from '~/components/files/FilePreviewModal.vue';
import Breadcrumbs from '~/components/files/Breadcrumbs.vue';
import CreateFolderModal from '~/components/files/CreateFolderModal.vue';
import RenameModal from '~/components/files/RenameModal.vue';
import SetPasswordModal from '~/components/files/SetPasswordModal.vue';
import UnlockFolderModal from '~/components/files/UnlockFolderModal.vue';
import ContextMenu, { type ContextMenuItem } from '~/components/files/ContextMenu.vue';

definePageMeta({
  layout: 'default',
});

// Composables
const { getFolderContents } = useFolderManager();
const { deleteFile, formatFileSize } = useFileManager();
const { authFetch } = useAuthFetch();
const notification = useNotification();

// State
const folders = ref<Folder[]>([]);
const files = ref<FileRecord[]>([]);
const isLoading = ref(false);
const isSyncing = ref(false);
const showCreateFolderModal = ref(false);
const showUploadModal = ref(false);
const showPreviewModal = ref(false);
const showRenameModal = ref(false);
const showSetPasswordModal = ref(false);
const showUnlockModal = ref(false);
const previewFile = ref<FileRecord | null>(null);
const renameTarget = ref<{ type: 'folder' | 'file'; id: number | string; name: string } | null>(null);
const passwordTarget = ref<{ id: number; name: string } | null>(null);
const unlockTarget = ref<{ id: number; name: string } | null>(null);
const unlockModalRef = ref<InstanceType<typeof UnlockFolderModal> | null>(null);

// Хранилище разблокированных папок (в sessionStorage)
const unlockedFolders = ref<Set<number>>(new Set());

// Context Menu
const contextMenu = ref<{
  visible: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  target: Folder | FileRecord | null;
}>({
  visible: false,
  position: { x: 0, y: 0 },
  items: [],
  target: null,
});

// Navigation
const currentFolderId = ref<number | null>(null);
const currentPath = ref('/');

// Methods
const loadFolderContents = async () => {
  isLoading.value = true;

  try {
    const contents = await getFolderContents(currentFolderId.value);
    folders.value = contents.folders;
    files.value = contents.files;
  } catch (error) {
    console.error('Ошибка загрузки содержимого папки:', error);
    alert('Не удалось загрузить содержимое папки');
  } finally {
    isLoading.value = false;
  }
};

// Синхронизация
const handleSync = async () => {
  isSyncing.value = true;

  try {
    const response = await authFetch<{
      success: boolean;
      foldersImported: number;
      filesImported: number;
      errors?: string[];
      message: string;
    }>('/api/files/sync', {
      method: 'POST',
    });

    if (response.success) {
      notification.success(response.message, 'Синхронизация завершена');
      
      if (response.errors && response.errors.length > 0) {
        console.warn('Ошибки синхронизации:', response.errors);
      }
      
      // Обновляем список файлов и папок
      loadFolderContents();
    }
  } catch (error: any) {
    console.error('Ошибка синхронизации:', error);
    const errorMessage = error?.data?.message || error?.message || 'Произошла ошибка при синхронизации';
    notification.error(errorMessage, 'Ошибка');
  } finally {
    isSyncing.value = false;
  }
};

const navigateToFolder = async (folderId: number | null) => {
  // Если открываем папку (не корень)
  if (folderId !== null) {
    const folder = folders.value.find(f => f.id === folderId);
    
    // Проверка пароля для защищенных папок
    if (folder?.passwordHash && !unlockedFolders.value.has(folderId)) {
      // Папка защищена и не разблокирована - показываем модальное окно
      unlockTarget.value = { id: folder.id, name: folder.name };
      showUnlockModal.value = true;
      return; // Не продолжаем навигацию
    }
  }

  currentFolderId.value = folderId;

  // Обновление пути
  if (folderId === null) {
    currentPath.value = '/';
  } else {
    // Получаем путь из API
    try {
      const response = await authFetch<{ success: boolean; currentFolder?: { path: string } }>(
        `/api/folders/${folderId}/path`
      );
      
      if (response.success && response.currentFolder?.path) {
        currentPath.value = response.currentFolder.path;
      } else {
        // Fallback: ищем в текущем списке папок
        const folder = folders.value.find(f => f.id === folderId);
        if (folder) {
          currentPath.value = folder.path;
        }
      }
    } catch (error) {
      console.error('Ошибка получения пути папки:', error);
      // Fallback: ищем в текущем списке папок
      const folder = folders.value.find(f => f.id === folderId);
      if (folder) {
        currentPath.value = folder.path;
      }
    }
  }

  loadFolderContents();
};

const handleFolderCreated = (folderId: number) => {
  console.log('Папка создана:', folderId);
  loadFolderContents(); // Обновить список
};

const handleFileUploaded = (file: FileRecord) => {
  console.log('Файл загружен:', file.filename);
  showUploadModal.value = false;
  loadFolderContents();
};

const handleUploadError = (message: string) => {
  console.error('Ошибка загрузки:', message);
};

const openPreview = (file: FileRecord) => {
  previewFile.value = file;
  showPreviewModal.value = true;
};

const handleDelete = async (uuid: string) => {
  if (!confirm('Вы уверены, что хотите удалить этот файл?')) {
    return;
  }

  try {
    await deleteFile(uuid);
    loadFolderContents();
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    alert('Не удалось удалить файл');
  }
};

const isImage = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

const downloadFile = (file: FileRecord) => {
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.filename;
  link.click();
};

// Переименование
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
      notification.success('Папка успешно переименована', 'Успех');
    } else {
      await authFetch(`/api/files/${id}/rename`, {
        method: 'PUT',
        body: { newName },
      });
      notification.success('Файл успешно переименован', 'Успех');
    }

    showRenameModal.value = false;
    renameTarget.value = null;
    loadFolderContents();
  } catch (error: any) {
    console.error('Ошибка переименования:', error);
    const errorMessage = error?.data?.message || error?.message || 'Произошла ошибка при переименовании';
    notification.error(errorMessage, 'Ошибка');
  }
};

// Работа с паролями
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

    notification.success('Пароль успешно установлен', 'Успех');
    showSetPasswordModal.value = false;
    passwordTarget.value = null;
    loadFolderContents();
  } catch (error: any) {
    console.error('Ошибка установки пароля:', error);
    const errorMessage = error?.data?.message || error?.message || 'Произошла ошибка при установке пароля';
    notification.error(errorMessage, 'Ошибка');
  }
};

const handleRemovePassword = async (folderId: number) => {
  try {
    await authFetch(`/api/folders/${folderId}/remove-password`, {
      method: 'DELETE',
    });

    notification.success('Пароль успешно удален', 'Успех');
    loadFolderContents();
  } catch (error: any) {
    console.error('Ошибка удаления пароля:', error);
    const errorMessage = error?.data?.message || error?.message || 'Произошла ошибка при удалении пароля';
    notification.error(errorMessage, 'Ошибка');
  }
};

const handleUnlockFolder = async (password: string) => {
  if (!unlockTarget.value) return;

  try {
    await authFetch(`/api/folders/${unlockTarget.value.id}/verify-password`, {
      method: 'POST',
      body: { password },
    });

    // Добавляем папку в список разблокированных
    unlockedFolders.value.add(unlockTarget.value.id);
    
    // Сохраняем в sessionStorage
    sessionStorage.setItem('unlockedFolders', JSON.stringify(Array.from(unlockedFolders.value)));

    showUnlockModal.value = false;
    const folderId = unlockTarget.value.id;
    unlockTarget.value = null;
    
    // Открываем папку
    navigateToFolder(folderId);
  } catch (error: any) {
    console.error('Ошибка проверки пароля:', error);
    const errorMessage = error?.data?.message || error?.message || 'Неверный пароль';
    
    // Показываем ошибку в модальном окне
    if (unlockModalRef.value) {
      unlockModalRef.value.setError(errorMessage);
    }
  }
};

const showFolderContextMenu = (event: MouseEvent, folder: Folder) => {
  const menuItems: ContextMenuItem[] = [
    { label: 'Открыть', action: () => navigateToFolder(folder.id) },
    { label: 'Переименовать', action: () => openRenameModal('folder', folder.id, folder.name), disabled: folder.isSystem },
    { label: 'Создать подпапку', action: () => { showCreateFolderModal.value = true; }, disabled: folder.isSystem },
  ];

  // Добавляем опции для паролей
  if (!folder.isSystem) {
    if (folder.passwordHash) {
      menuItems.push({ label: 'Удалить пароль', action: () => handleRemovePassword(folder.id) });
    } else {
      menuItems.push({ label: 'Установить пароль', action: () => openSetPasswordModal(folder) });
    }
  }

  contextMenu.value = {
    visible: true,
    position: { x: event.clientX, y: event.clientY },
    target: folder,
    items: menuItems,
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


// Lifecycle
onMounted(() => {
  // Загрузка разблокированных папок из sessionStorage
  try {
    const stored = sessionStorage.getItem('unlockedFolders');
    if (stored) {
      const ids = JSON.parse(stored) as number[];
      unlockedFolders.value = new Set(ids);
    }
  } catch (error) {
    console.error('Ошибка загрузки разблокированных папок:', error);
  }

  loadFolderContents();
});
</script>
