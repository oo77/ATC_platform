import { ref, computed, watch } from 'vue';
import type { FileRecord, Folder } from '~/types/file';

export type FMItem =
  | { kind: 'folder'; key: string; name: string; folder: Folder }
  | { kind: 'file'; key: string; name: string; file: FileRecord };

export type SortKey = 'name' | 'date' | 'size' | 'type';
export type ViewMode = 'grid' | 'list';

export interface Crumb {
  id: number | null;
  name: string;
}

export interface UploadTask {
  id: number;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export const MAX_UPLOAD_MB = 50;

const folderKey = (id: number) => `d:${id}`;
const fileKey = (uuid: string) => `f:${uuid}`;

const safeStorage = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* приватный режим */ }
  },
};

export function useFileManagerUI() {
  const { getFolderContents, getFolders, createFolder } = useFolderManager();
  const { deleteFile, uploadFile, formatFileSize } = useFileManager();
  const { authFetch } = useAuthFetch();
  const notification = useNotification();
  const route = useRoute();
  const router = useRouter();

  /* ───────────── Состояние ───────────── */
  const folders = ref<Folder[]>([]);
  const files = ref<FileRecord[]>([]);
  const isLoading = ref(false);
  const loadError = ref(false);
  const currentFolderId = ref<number | null>(null);
  const crumbs = ref<Crumb[]>([]);

  const searchQuery = ref('');
  const sortKey = ref<SortKey>('name');
  const sortDir = ref<'asc' | 'desc'>('asc');
  const viewMode = ref<ViewMode>('grid');
  const treeOpen = ref(true);

  // Все когда-либо загруженные папки: чтобы переходить по id из дерева/крошек
  const folderIndex = new Map<number, Folder>();
  const remember = (list: Folder[]) => list.forEach((f) => folderIndex.set(f.id, f));

  /* ───────────── Дерево папок (ленивая загрузка) ───────────── */
  const treeChildren = ref<Record<string, Folder[]>>({});
  const treeExpanded = ref<Set<number>>(new Set());
  const treeLoading = ref<Set<string>>(new Set());
  const treeKey = (id: number | null) => (id === null ? 'root' : String(id));

  const loadTreeChildren = async (id: number | null, force = false) => {
    const k = treeKey(id);
    if (!force && treeChildren.value[k]) return;
    treeLoading.value.add(k);
    try {
      const list = await getFolders(id);
      remember(list);
      treeChildren.value = { ...treeChildren.value, [k]: list };
    } catch (e) {
      console.error('Не удалось загрузить дерево папок', e);
    } finally {
      treeLoading.value.delete(k);
    }
  };

  const toggleTree = async (id: number) => {
    const next = new Set(treeExpanded.value);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      await loadTreeChildren(id);
    }
    treeExpanded.value = next;
  };

  const refreshTree = async (ids: (number | null)[] = [currentFolderId.value]) => {
    const targets = new Set<number | null>([null, ...ids]);
    await Promise.all([...targets].map((id) => loadTreeChildren(id, true)));
  };

  /* ───────────── Выбор ───────────── */
  const selectedKeys = ref<Set<string>>(new Set());
  const anchorKey = ref<string | null>(null);
  const focusKey = ref<string | null>(null);
  const gridColumns = ref(1);

  const items = computed<FMItem[]>(() => {
    const q = searchQuery.value.trim().toLowerCase();
    const dir = sortDir.value === 'asc' ? 1 : -1;
    const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

    const fl = folders.value
      .filter((f) => !q || f.name.toLowerCase().includes(q))
      .sort((a, b) => {
        // Системные папки всегда выше; остальные по выбранной сортировке (дата/имя)
        if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
        if (sortKey.value === 'date') return (+new Date(a.updatedAt) - +new Date(b.updatedAt)) * dir;
        return collator.compare(a.name, b.name) * (sortKey.value === 'name' ? dir : 1);
      })
      .map<FMItem>((folder) => ({ kind: 'folder', key: folderKey(folder.id), name: folder.name, folder }));

    const fi = files.value
      .filter((f) => !q || f.filename.toLowerCase().includes(q))
      .sort((a, b) => {
        switch (sortKey.value) {
          case 'date': return (+new Date(a.createdAt) - +new Date(b.createdAt)) * dir;
          case 'size': return (a.sizeBytes - b.sizeBytes) * dir;
          case 'type': return (collator.compare(a.extension || '', b.extension || '') || collator.compare(a.filename, b.filename)) * dir;
          default: return collator.compare(a.filename, b.filename) * dir;
        }
      })
      .map<FMItem>((file) => ({ kind: 'file', key: fileKey(file.uuid), name: file.filename, file }));

    return [...fl, ...fi];
  });

  const selectedItems = computed(() => items.value.filter((i) => selectedKeys.value.has(i.key)));
  const selectedCount = computed(() => selectedKeys.value.size);
  const selectedFiles = computed(() => selectedItems.value.filter((i) => i.kind === 'file').map((i) => (i as Extract<FMItem, { kind: 'file' }>).file));
  const isSelected = (key: string) => selectedKeys.value.has(key);

  const clearSelection = () => {
    selectedKeys.value = new Set();
    anchorKey.value = null;
  };

  const selectAll = () => {
    selectedKeys.value = new Set(items.value.map((i) => i.key));
  };

  /** Клик: обычный — один; Ctrl/Cmd — переключить; Shift — диапазон */
  const selectItem = (item: FMItem, event?: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }) => {
    focusKey.value = item.key;
    if (event?.ctrlKey || event?.metaKey) {
      const next = new Set(selectedKeys.value);
      next.has(item.key) ? next.delete(item.key) : next.add(item.key);
      selectedKeys.value = next;
      anchorKey.value = item.key;
    } else if (event?.shiftKey && anchorKey.value) {
      const list = items.value;
      const a = list.findIndex((i) => i.key === anchorKey.value);
      const b = list.findIndex((i) => i.key === item.key);
      if (a > -1 && b > -1) {
        const [min, max] = a < b ? [a, b] : [b, a];
        selectedKeys.value = new Set(list.slice(min, max + 1).map((i) => i.key));
      }
    } else {
      selectedKeys.value = new Set([item.key]);
      anchorKey.value = item.key;
    }
  };

  /** Чекбокс на карточке: всегда переключает, не сбрасывая остальных */
  const toggleItem = (item: FMItem) => selectItem(item, { ctrlKey: true });

  /* ───────────── Загрузка содержимого / навигация ───────────── */
  let loadToken = 0;

  const loadFolderContents = async (folderId: number | null = currentFolderId.value) => {
    const token = ++loadToken;
    isLoading.value = true;
    loadError.value = false;
    try {
      const contents = await getFolderContents(folderId);
      if (token !== loadToken) return; // пришёл устаревший ответ
      folders.value = contents.folders;
      files.value = contents.files;
      remember(contents.folders);
      // Сохраняем только то, что ещё существует
      const alive = new Set(items.value.map((i) => i.key));
      selectedKeys.value = new Set([...selectedKeys.value].filter((k) => alive.has(k)));
    } catch (error) {
      if (token !== loadToken) return;
      console.error('Error loading folder contents:', error);
      loadError.value = true;
      notification.error('Не удалось загрузить содержимое папки', 'Ошибка');
    } finally {
      if (token === loadToken) isLoading.value = false;
    }
  };

  const loadCrumbs = async (folderId: number | null) => {
    if (folderId === null) {
      crumbs.value = [];
      return;
    }
    try {
      const res = await authFetch<{ success: boolean; path: { id: number; name: string }[] }>(`/api/folders/${folderId}/path`);
      if (folderId !== currentFolderId.value) return;
      crumbs.value = res.success ? res.path : [];
      // Раскрываем предков в дереве
      const next = new Set(treeExpanded.value);
      for (const c of res.path.slice(0, -1)) {
        next.add(c.id);
        loadTreeChildren(c.id);
      }
      treeExpanded.value = next;
    } catch {
      crumbs.value = [{ id: folderId, name: folderIndex.get(folderId)?.name ?? 'Папка' }];
    }
  };

  /* ───────────── Пароли на папках ───────────── */
  const unlockedFolders = ref<Set<number>>(new Set());
  const showUnlockModal = ref(false);
  const unlockTarget = ref<{ id: number; name: string } | null>(null);
  const unlockError = ref('');
  const unlockLoading = ref(false);

  const isLocked = (id: number) => {
    const f = folderIndex.get(id);
    return !!f?.passwordHash && !unlockedFolders.value.has(id);
  };

  const navigateToFolder = async (folderId: number | null, opts: { silent?: boolean } = {}) => {
    if (folderId !== null && isLocked(folderId)) {
      unlockTarget.value = { id: folderId, name: folderIndex.get(folderId)?.name ?? 'Папка' };
      unlockError.value = '';
      showUnlockModal.value = true;
      return;
    }

    currentFolderId.value = folderId;
    searchQuery.value = '';
    clearSelection();
    focusKey.value = null;
    previewFile.value = null;

    if (!opts.silent) {
      router.replace({ query: { ...route.query, folder: folderId === null ? undefined : String(folderId) } });
    }

    await Promise.all([loadFolderContents(folderId), loadCrumbs(folderId)]);
  };

  const goUp = () => {
    if (currentFolderId.value === null) return;
    const parent = crumbs.value.length >= 2 ? crumbs.value[crumbs.value.length - 2] : null;
    return navigateToFolder(parent ? parent.id : null);
  };

  const submitUnlock = async (password: string) => {
    if (!unlockTarget.value) return;
    unlockLoading.value = true;
    unlockError.value = '';
    try {
      const { id } = unlockTarget.value;
      await authFetch(`/api/folders/${id}/verify-password`, { method: 'POST', body: { password } });
      unlockedFolders.value = new Set(unlockedFolders.value).add(id);
      try { sessionStorage.setItem('unlockedFolders', JSON.stringify([...unlockedFolders.value])); } catch { /* ignore */ }
      showUnlockModal.value = false;
      unlockTarget.value = null;
      await navigateToFolder(id);
    } catch {
      unlockError.value = 'Неверный пароль';
    } finally {
      unlockLoading.value = false;
    }
  };

  /* ───────────── Предпросмотр ───────────── */
  const previewFile = ref<FileRecord | null>(null);
  const openPreview = (file: FileRecord) => { previewFile.value = file; };
  const closePreview = () => { previewFile.value = null; };

  /** Предпросмотр следует за единственным выделенным файлом (удобно листать стрелками) */
  watch(selectedItems, (list) => {
    if (previewFile.value && list.length === 1 && list[0].kind === 'file') {
      previewFile.value = list[0].file;
    }
  });

  /* ───────────── Модальные окна ───────────── */
  const showCreateFolderModal = ref(false);
  const showRenameModal = ref(false);
  const showSetPasswordModal = ref(false);
  const renameTarget = ref<{ kind: 'folder' | 'file'; id: number | string; name: string } | null>(null);
  const passwordTarget = ref<{ id: number; name: string } | null>(null);

  const confirmState = ref<{ items: FMItem[] } | null>(null);
  const confirmLoading = ref(false);

  /* ───────────── Действия ───────────── */
  const openItem = (item: FMItem) => {
    if (item.kind === 'folder') navigateToFolder(item.folder.id);
    else openPreview(item.file);
  };

  const downloadFile = (file: FileRecord) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadSelected = () => {
    selectedFiles.value.forEach((f, i) => setTimeout(() => downloadFile(f), i * 250));
  };

  const copyLink = async (file: FileRecord) => {
    try {
      await navigator.clipboard.writeText(new URL(file.url, window.location.origin).toString());
      notification.success('Ссылка скопирована', 'Готово');
    } catch {
      notification.error('Не удалось скопировать ссылку', 'Ошибка');
    }
  };

  const createNewFolder = async (name: string) => {
    const folder = await createFolder(name, currentFolderId.value);
    showCreateFolderModal.value = false;
    await Promise.all([loadFolderContents(), refreshTree()]);
    // Новая папка сразу выделена — можно продолжать работать клавиатурой
    selectedKeys.value = new Set([folderKey(folder.id)]);
    focusKey.value = folderKey(folder.id);
    notification.success(`Папка «${folder.name}» создана`, 'Готово');
  };

  const requestRename = (item: FMItem) => {
    if (item.kind === 'folder' && item.folder.isSystem) return;
    renameTarget.value = item.kind === 'folder'
      ? { kind: 'folder', id: item.folder.id, name: item.folder.name }
      : { kind: 'file', id: item.file.uuid, name: item.file.filename };
    showRenameModal.value = true;
  };

  const submitRename = async (newName: string) => {
    const target = renameTarget.value;
    if (!target) return;
    await authFetch(`/api/${target.kind === 'folder' ? 'folders' : 'files'}/${target.id}/rename`, {
      method: 'PUT',
      body: { newName },
    });
    showRenameModal.value = false;
    renameTarget.value = null;
    await Promise.all([loadFolderContents(), refreshTree(), target.kind === 'folder' ? loadCrumbs(currentFolderId.value) : null]);
    if (previewFile.value) {
      previewFile.value = files.value.find((f) => f.uuid === previewFile.value!.uuid) ?? null;
    }
    notification.success('Переименовано', 'Готово');
  };

  const requestDelete = (list: FMItem[] = selectedItems.value) => {
    const deletable = list.filter((i) => !(i.kind === 'folder' && i.folder.isSystem));
    if (!deletable.length) {
      if (list.length) notification.warning('Системные папки удалять нельзя', 'Недоступно');
      return;
    }
    confirmState.value = { items: deletable };
  };

  const confirmDelete = async () => {
    if (!confirmState.value) return;
    confirmLoading.value = true;
    let failed = 0;
    for (const item of confirmState.value.items) {
      try {
        if (item.kind === 'file') await deleteFile(item.file.uuid);
        else await authFetch(`/api/folders/${item.folder.id}`, { method: 'DELETE' });
      } catch (e) {
        failed++;
        console.error(`Не удалось удалить ${item.name}`, e);
      }
    }
    const total = confirmState.value.items.length;
    confirmState.value = null;
    confirmLoading.value = false;
    clearSelection();
    if (previewFile.value && !files.value.some((f) => f.uuid === previewFile.value!.uuid)) previewFile.value = null;
    await Promise.all([loadFolderContents(), refreshTree()]);
    if (previewFile.value && !files.value.some((f) => f.uuid === previewFile.value!.uuid)) previewFile.value = null;
    failed
      ? notification.error(`Не удалось удалить: ${failed} из ${total}`, 'Ошибка')
      : notification.success(total === 1 ? 'Удалено' : `Удалено: ${total}`, 'Готово');
  };

  /* Пароли */
  const openSetPasswordModal = (folder: Folder) => {
    passwordTarget.value = { id: folder.id, name: folder.name };
    showSetPasswordModal.value = true;
  };

  const handleSetPassword = async (password: string) => {
    if (!passwordTarget.value) return;
    // Ошибки пробрасываем в модалку — она показывает их и разблокирует кнопку
    await authFetch(`/api/folders/${passwordTarget.value.id}/set-password`, { method: 'POST', body: { password } });
    unlockedFolders.value = new Set(unlockedFolders.value).add(passwordTarget.value.id);
    showSetPasswordModal.value = false;
    passwordTarget.value = null;
    await Promise.all([loadFolderContents(), refreshTree()]);
    notification.success('Пароль установлен', 'Готово');
  };

  const handleRemovePassword = async (folderId: number) => {
    try {
      await authFetch(`/api/folders/${folderId}/remove-password`, { method: 'DELETE' });
      await Promise.all([loadFolderContents(), refreshTree()]);
      notification.success('Пароль удалён', 'Готово');
    } catch {
      notification.error('Ошибка удаления пароля', 'Ошибка');
    }
  };

  /* ───────────── Перемещение (drag & drop) ───────────── */
  const draggingKeys = ref<string[]>([]);
  const dropTargetKey = ref<string | null>(null);

  const startDrag = (item: FMItem, event: DragEvent) => {
    if (item.kind === 'folder' && item.folder.isSystem) {
      event.preventDefault();
      return;
    }
    if (!selectedKeys.value.has(item.key)) selectItem(item);
    draggingKeys.value = selectedItems.value
      .filter((i) => !(i.kind === 'folder' && i.folder.isSystem))
      .map((i) => i.key);
    event.dataTransfer?.setData('text/plain', draggingKeys.value.join(','));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  };

  const endDrag = () => {
    draggingKeys.value = [];
    dropTargetKey.value = null;
  };

  const isOsFileDrag = (event: DragEvent) => !!event.dataTransfer?.types?.includes('Files');

  /** Можно ли бросить перетаскиваемое в эту папку (null = корень) */
  const canDropOn = (targetId: number | null, event?: DragEvent) => {
    if (event && isOsFileDrag(event)) return true;
    if (!draggingKeys.value.length) return false;
    if (targetId !== null && draggingKeys.value.includes(folderKey(targetId))) return false;
    // Нельзя положить папку в её же потомка
    if (targetId !== null) {
      const target = folderIndex.get(targetId);
      for (const key of draggingKeys.value) {
        if (!key.startsWith('d:')) continue;
        const dragged = folderIndex.get(Number(key.slice(2)));
        if (dragged && target && target.path.startsWith(dragged.path + '/')) return false;
      }
    }
    return true;
  };

  const moveItems = async (keys: string[], targetId: number | null) => {
    let moved = 0;
    let failed = 0;
    for (const key of keys) {
      try {
        if (key.startsWith('f:')) {
          await authFetch(`/api/files/${key.slice(2)}/move`, { method: 'PUT', body: { folderId: targetId } });
        } else {
          const id = Number(key.slice(2));
          if (id === targetId) continue;
          await authFetch(`/api/folders/${id}/move`, { method: 'PUT', body: { newParentId: targetId } });
        }
        moved++;
      } catch (e) {
        failed++;
        console.error('Ошибка перемещения', e);
      }
    }
    clearSelection();
    await Promise.all([loadFolderContents(), refreshTree([currentFolderId.value, targetId])]);
    if (failed) notification.error(`Не удалось переместить: ${failed}`, 'Ошибка');
    else if (moved) notification.success(`Перемещено: ${moved}`, 'Готово');
  };

  const dropOnFolder = async (targetId: number | null, event: DragEvent) => {
    event.preventDefault();
    const osFiles = event.dataTransfer?.files;
    if (osFiles?.length && isOsFileDrag(event)) {
      endDrag();
      await upload(Array.from(osFiles), targetId);
      return;
    }
    const keys = draggingKeys.value.slice();
    endDrag();
    if (!keys.length || !canDropOn(targetId)) return;
    // Файлы, уже лежащие в этой папке, перемещать некуда
    const effective = targetId === currentFolderId.value ? [] : keys;
    if (effective.length) await moveItems(effective, targetId);
  };

  /* ───────────── Загрузка ───────────── */
  const uploads = ref<UploadTask[]>([]);
  let uploadSeq = 0;

  const upload = async (list: File[], folderId: number | null = currentFolderId.value) => {
    const tasks: { task: UploadTask; file: File }[] = [];
    for (const file of list) {
      const task: UploadTask = reactiveTask({ id: ++uploadSeq, name: file.name, size: file.size, status: 'pending' });
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        task.status = 'error';
        task.error = `Больше ${MAX_UPLOAD_MB} МБ`;
      } else if (file.size === 0) {
        task.status = 'error';
        task.error = 'Пустой файл';
      }
      uploads.value = [...uploads.value, task];
      if (task.status === 'pending') tasks.push({ task, file });
    }
    if (!tasks.length) return;

    // Три параллельных потока: быстрее, но без перегрузки сервера
    const queue = tasks.slice();
    const worker = async () => {
      while (queue.length) {
        const { task, file } = queue.shift()!;
        const live = uploads.value.find((u) => u.id === task.id)!;
        live.status = 'uploading';
        try {
          await uploadFile(file, 'other', folderId);
          live.status = 'done';
        } catch (e: any) {
          live.status = 'error';
          live.error = e?.data?.message || e?.message || 'Ошибка загрузки';
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, queue.length) }, worker));

    if (folderId === currentFolderId.value) await loadFolderContents();
    const ok = tasks.filter((t) => uploads.value.find((u) => u.id === t.task.id)?.status === 'done').length;
    if (ok) notification.success(`Загружено файлов: ${ok}`, 'Готово');
    // Успешные записи убираем через пару секунд, ошибки остаются до закрытия
    setTimeout(() => {
      uploads.value = uploads.value.filter((u) => u.status !== 'done');
    }, 2500);
  };

  const reactiveTask = (t: UploadTask) => t;
  const dismissUploads = () => { uploads.value = uploads.value.filter((u) => u.status === 'uploading' || u.status === 'pending'); };

  /* ───────────── Синхронизация с диском ───────────── */
  const isSyncing = ref(false);
  const syncFiles = async () => {
    isSyncing.value = true;
    try {
      const res = await authFetch<{ success: boolean; message: string }>('/api/files/sync', { method: 'POST' });
      if (res.success) {
        await Promise.all([loadFolderContents(), refreshTree()]);
        notification.success(res.message, 'Синхронизация');
      }
    } catch {
      notification.error('Ошибка синхронизации', 'Ошибка');
    } finally {
      isSyncing.value = false;
    }
  };

  const refresh = async () => {
    await Promise.all([loadFolderContents(), refreshTree()]);
  };

  /* ───────────── Контекстное меню ───────────── */
  interface MenuItem {
    label?: string;
    action?: () => void;
    icon?: any;
    danger?: boolean;
    disabled?: boolean;
    separator?: boolean;
    hint?: string;
  }
  const contextMenu = ref<{ visible: boolean; position: { x: number; y: number }; items: MenuItem[] }>({
    visible: false,
    position: { x: 0, y: 0 },
    items: [],
  });
  const closeContextMenu = () => { contextMenu.value.visible = false; };

  const showContextMenu = (event: MouseEvent, item: FMItem | null) => {
    // ПКМ по невыделенному элементу выделяет его; по выделенному — действует на всё выделение
    if (item && !selectedKeys.value.has(item.key)) selectItem(item);
    const multi = selectedCount.value > 1 && item && selectedKeys.value.has(item.key);
    const menu: MenuItem[] = [];

    if (!item) {
      menu.push(
        { label: 'Загрузить файлы', action: () => pickFiles(), hint: 'U' },
        { label: 'Новая папка', action: () => { showCreateFolderModal.value = true; }, hint: 'N' },
        { separator: true },
        { label: 'Обновить', action: () => refresh(), hint: 'R' },
        { label: 'Выделить всё', action: () => selectAll(), hint: 'Ctrl+A' },
      );
    } else if (multi) {
      menu.push(
        { label: `Скачать файлы (${selectedFiles.value.length})`, action: downloadSelected, disabled: !selectedFiles.value.length },
        { separator: true },
        { label: `Удалить (${selectedCount.value})`, action: () => requestDelete(), danger: true, hint: 'Del' },
      );
    } else if (item.kind === 'folder') {
      const f = item.folder;
      menu.push(
        { label: 'Открыть', action: () => navigateToFolder(f.id), hint: 'Enter' },
        { label: 'Переименовать', action: () => requestRename(item), disabled: f.isSystem, hint: 'F2' },
        { separator: true },
      );
      if (!f.isSystem) {
        menu.push(f.passwordHash
          ? { label: 'Убрать пароль', action: () => handleRemovePassword(f.id) }
          : { label: 'Защитить паролем', action: () => openSetPasswordModal(f) });
        menu.push({ separator: true }, { label: 'Удалить', action: () => requestDelete([item]), danger: true, hint: 'Del' });
      }
    } else {
      const f = item.file;
      menu.push(
        { label: 'Открыть', action: () => openPreview(f), hint: 'Enter' },
        { label: 'Скачать', action: () => downloadFile(f) },
        { label: 'Копировать ссылку', action: () => copyLink(f) },
        { label: 'Переименовать', action: () => requestRename(item), hint: 'F2' },
        { separator: true },
        { label: 'Удалить', action: () => requestDelete([item]), danger: true, hint: 'Del' },
      );
    }

    contextMenu.value = { visible: true, position: { x: event.clientX, y: event.clientY }, items: menu };
  };

  /* ───────────── Выбор файлов с диска ───────────── */
  const fileInput = ref<HTMLInputElement | null>(null);
  const pickFiles = () => fileInput.value?.click();
  const onFilesPicked = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) upload(Array.from(input.files));
    input.value = '';
  };

  /* ───────────── Горячие клавиши ───────────── */
  const searchInput = ref<HTMLInputElement | null>(null);

  const handleKeydown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const typing = target.matches?.('input, textarea, select, [contenteditable="true"]');
    const mod = event.ctrlKey || event.metaKey;

    if (event.key === 'Escape') {
      if (typing) { target.blur(); return; }
      if (contextMenu.value.visible) closeContextMenu();
      else if (selectedCount.value) clearSelection();
      else if (previewFile.value) closePreview();
      return;
    }
    if (typing) return;

    if (mod && event.key.toLowerCase() === 'a') { event.preventDefault(); selectAll(); return; }
    if (mod && event.key.toLowerCase() === 'f') { event.preventDefault(); searchInput.value?.focus(); return; }

    switch (event.key) {
      case '/': event.preventDefault(); searchInput.value?.focus(); break;
      case 'Delete':
      case 'Backspace':
        if (event.key === 'Backspace' && !selectedCount.value) { event.preventDefault(); goUp(); }
        else if (selectedCount.value) { event.preventDefault(); requestDelete(); }
        break;
      case 'F2':
        if (selectedItems.value.length === 1) { event.preventDefault(); requestRename(selectedItems.value[0]); }
        break;
      case 'Enter':
        if (selectedItems.value.length === 1) { event.preventDefault(); openItem(selectedItems.value[0]); }
        break;
      case 'n':
      case 'N':
        if (!mod) { event.preventDefault(); showCreateFolderModal.value = true; }
        break;
      case 'u':
      case 'U':
        if (!mod) { event.preventDefault(); pickFiles(); }
        break;
      case 'r':
      case 'R':
        if (!mod) { event.preventDefault(); refresh(); }
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown': {
        event.preventDefault();
        const list = items.value;
        if (!list.length) return;
        if (event.altKey && event.key === 'ArrowUp') { goUp(); return; }
        const cols = viewMode.value === 'grid' ? gridColumns.value : 1;
        const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' ? -cols : cols;
        const cur = list.findIndex((i) => i.key === focusKey.value);
        const next = Math.min(list.length - 1, Math.max(0, cur === -1 ? 0 : cur + step));
        selectItem(list[next], { shiftKey: event.shiftKey });
        document.querySelector(`[data-fm-key="${list[next].key}"]`)?.scrollIntoView({ block: 'nearest' });
        break;
      }
    }
  };

  /* ───────────── Настройки вида ───────────── */
  watch(viewMode, (v) => safeStorage.set('fm:view', v));
  watch([sortKey, sortDir], () => safeStorage.set('fm:sort', `${sortKey.value}:${sortDir.value}`));
  watch(treeOpen, (v) => safeStorage.set('fm:tree', v ? '1' : '0'));

  const setSort = (key: SortKey) => {
    if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
    else { sortKey.value = key; sortDir.value = key === 'date' ? 'desc' : 'asc'; }
  };

  /* ───────────── Инициализация ───────────── */
  const init = async () => {
    const view = safeStorage.get('fm:view');
    if (view === 'grid' || view === 'list') viewMode.value = view;
    const sort = safeStorage.get('fm:sort')?.split(':');
    if (sort && ['name', 'date', 'size', 'type'].includes(sort[0])) {
      sortKey.value = sort[0] as SortKey;
      sortDir.value = sort[1] === 'desc' ? 'desc' : 'asc';
    }
    const tree = safeStorage.get('fm:tree');
    treeOpen.value = tree !== null ? tree === '1' : window.innerWidth >= 1024;

    try {
      const stored = sessionStorage.getItem('unlockedFolders');
      if (stored) unlockedFolders.value = new Set(JSON.parse(stored) as number[]);
    } catch { /* ignore */ }

    await loadTreeChildren(null);

    // Глубокая ссылка ?folder=ID — открываем сразу нужную папку
    const wanted = Number(route.query.folder);
    if (wanted > 0) {
      try {
        const res = await authFetch<{ success: boolean; path: { id: number; name: string }[] }>(`/api/folders/${wanted}/path`);
        // Подгружаем детей всех предков: так мы узнаем о папке (пароль, системность)
        await Promise.all((res.path ?? []).slice(0, -1).map((c) => loadTreeChildren(c.id)));
      } catch { /* папка могла быть удалена */ }
      await navigateToFolder(wanted);
      if (currentFolderId.value === wanted || showUnlockModal.value) return;
    }
    await navigateToFolder(null, { silent: true });
  };

  return {
    // данные
    folders, files, items, isLoading, loadError, currentFolderId, crumbs,
    searchQuery, sortKey, sortDir, viewMode, treeOpen, setSort,
    // дерево
    treeChildren, treeExpanded, treeLoading, toggleTree, treeKey,
    // выбор
    selectedItems, selectedCount, selectedFiles, isSelected, selectItem, toggleItem, clearSelection, selectAll, focusKey, gridColumns,
    // навигация
    navigateToFolder, goUp, openItem, refresh,
    // предпросмотр
    previewFile, openPreview, closePreview,
    // модалки
    showCreateFolderModal, showRenameModal, showSetPasswordModal, renameTarget, passwordTarget,
    showUnlockModal, unlockTarget, unlockError, unlockLoading, submitUnlock,
    confirmState, confirmLoading,
    // действия
    createNewFolder, requestRename, submitRename, requestDelete, confirmDelete,
    downloadFile, downloadSelected, copyLink, handleSetPassword, handleRemovePassword, openSetPasswordModal,
    // dnd
    draggingKeys, dropTargetKey, startDrag, endDrag, canDropOn, dropOnFolder, isOsFileDrag,
    // загрузка
    uploads, upload, dismissUploads, fileInput, pickFiles, onFilesPicked,
    // прочее
    isSyncing, syncFiles, contextMenu, closeContextMenu, showContextMenu,
    handleKeydown, searchInput, init, formatFileSize,
  };
}
