<template>
  <div class="certificate-editor">
    <!-- Заголовок редактора -->
    <div class="editor-header">
      <div class="header-left">
        <NuxtLink
          :to="`/certificates/templates/${templateId}`"
          class="back-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Назад
        </NuxtLink>
        <h1 class="editor-title">{{ templateName || "Редактор шаблона" }}</h1>
      </div>

      <div class="header-center">
        <button
          class="toolbar-btn"
          :disabled="!canUndo"
          @click="undo"
          title="Отменить (Ctrl+Z)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>
        <button
          class="toolbar-btn"
          :disabled="!canRedo"
          @click="redo"
          title="Повторить (Ctrl+Y)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
          </svg>
        </button>

        <div class="toolbar-divider"></div>

        <span class="zoom-label">{{ Math.round(zoom * 100) }}%</span>
        <button
          class="toolbar-btn"
          @click="zoomOut"
          :disabled="zoom <= minZoom"
          title="Уменьшить"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
            <path d="M8 11h6" />
          </svg>
        </button>
        <button
          class="toolbar-btn"
          @click="zoomIn"
          :disabled="zoom >= maxZoom"
          title="Увеличить"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
            <path d="M11 8v6" />
            <path d="M8 11h6" />
          </svg>
        </button>
        <button class="toolbar-btn" @click="resetZoom" title="Сбросить масштаб">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24" />
            <path d="M21 3v6h-6" />
          </svg>
        </button>
      </div>

      <div class="header-right">
        <button class="btn-preview" @click="$emit('preview')">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Предпросмотр
        </button>
        <button
          class="btn-save"
          :disabled="isSaving || !isDirty"
          @click="$emit('save', exportData())"
        >
          <svg
            v-if="!isSaving"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
            />
            <polyline points="17,21 17,13 7,13 7,21" />
            <polyline points="7,3 7,8 15,8" />
          </svg>
          <svg
            v-else
            class="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {{ isSaving ? "Сохранение..." : "Сохранить" }}
        </button>
      </div>
    </div>

    <!-- Основная область -->
    <div class="editor-main">
      <!-- Панель инструментов слева -->
      <EditorToolbar
        @add-text="handleAddText"
        @add-variable="handleAddVariable"
        @add-image="handleAddImage"
        @add-qr="handleAddQR"
        @add-shape="handleAddShape"
        @set-layout="setLayout"
        @set-background="setBackground"
        @apply-preset="handleApplyPreset"
        :current-layout="templateData.layout"
        :template-width="templateData.width"
        :template-height="templateData.height"
        :template-id="templateId"
      />

      <!-- Холст -->
      <div class="canvas-container" ref="canvasContainerRef">
        <EditorCanvas
          v-if="activePage"
          :template-data="templateData"
          :active-page="activePage"
          :selected-element-ids="selectedElementIds"
          :zoom="zoom"
          @select="selectElement"
          @select-multiple="selectMultipleElements"
          @update-element="updateElement"
          @delete-element="deleteElement"
          @set-custom-dimensions="setCustomDimensions"
        />

        <!-- Панель навигации страниц -->
        <div class="pages-panel">
          <div class="pages-list">
            <div
              v-for="(page, idx) in templateData.pages"
              :key="page.id"
              class="page-thumb"
              :class="{ active: idx === activePageIndex }"
              :draggable="true"
              @click="setActivePage(idx)"
              @dragstart="handlePageDragStart(idx)"
              @dragover.prevent="handlePageDragOver(idx)"
              @drop="handlePageDrop(idx)"
              @dragend="handlePageDragEnd"
              :title="`Страница ${idx + 1}`"
            >
              <!-- Миниатюра -->
              <div
                class="page-preview"
                :style="getPagePreviewStyle(page)"
              >
                <span class="page-number">{{ idx + 1 }}</span>
              </div>

              <!-- Контекстное меню -->
              <div class="page-actions">
                <button
                  class="page-action-btn"
                  @click.stop="duplicatePage(idx)"
                  title="Дублировать"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </button>
                <button
                  class="page-action-btn danger"
                  @click.stop="removePage(idx)"
                  :disabled="pagesCount <= 1"
                  title="Удалить"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Кнопка добавить страницу -->
            <button class="add-page-btn" @click="addPage" title="Добавить страницу">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span>Добавить страницу</span>
            </button>
          </div>

          <div class="pages-info">
            <span>Стр. {{ activePageIndex + 1 }} / {{ pagesCount }}</span>
          </div>
        </div>
      </div>

      <!-- Панель свойств справа -->
      <EditorSidebar
        :selected-element="selectedElement"
        :selected-elements="selectedElements"
        :template-id="templateId"
        @update="handleElementUpdate"
        @delete="deleteSelectedElement"
        @delete-multiple="handleDeleteMultiple"
        @duplicate="handleDuplicate"
        @duplicate-multiple="handleDuplicateMultiple"
        @bring-to-front="handleBringToFront"
        @send-to-back="handleSendToBack"
        @toggle-lock="handleToggleLock"
        @align="handleAlign"
        @align-group="handleAlignGroup"
        @distribute="handleDistribute"
      />
    </div>

    <!-- Модальное окно подтверждения применения пресета -->
    <Teleport to="body">
      <div
        v-if="showPresetConfirm"
        class="preset-confirm-overlay"
        @click.self="cancelPreset"
      >
        <div class="preset-confirm-modal">
          <div class="modal-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path
                d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
            </svg>
          </div>
          <h3>Применить шаблон?</h3>
          <p>
            Все текущие элементы будут заменены на элементы выбранного шаблона.
            Это действие нельзя отменить.
          </p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="cancelPreset">Отмена</button>
            <button class="btn-confirm" @click="confirmPreset">
              Применить
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
  useCertificateEditor,
  createTextElement,
  createVariableElement,
  createImageElement,
  createQRElement,
  createShapeElement,
} from "~/composables/useCertificateEditor";
import { preloadAllFonts } from "~/composables/useGoogleFonts";
import type {
  CertificateTemplateData,
  CertificatePage,
  TemplateElement,
  VariableSource,
  TemplateLayout,
  TemplateBackground,
  ShapeType,
} from "~/types/certificate";
import EditorToolbar from "./EditorToolbar.vue";
import EditorCanvas from "./EditorCanvas.vue";
import EditorSidebar from "./EditorSidebar.vue";

const props = defineProps<{
  templateId: string;
  templateName?: string;
  initialData?: CertificateTemplateData;
  isSaving?: boolean;
}>();

const emit = defineEmits<{
  (e: "save", data: CertificateTemplateData): void;
  (e: "preview"): void;
}>();

const canvasContainerRef = ref<HTMLElement | null>(null);

const {
  templateData,
  selectedElementId,
  selectedElement,
  selectedElementIds,
  selectedElements,
  zoom,
  isDirty,
  activePageIndex,
  activePage,
  pagesCount,
  canUndo,
  canRedo,
  minZoom,
  maxZoom,
  initTemplate,
  exportData,
  undo,
  redo,
  setLayout,
  setCustomDimensions,
  setBackground,
  addPage,
  removePage,
  duplicatePage,
  setActivePage,
  reorderPages,
  addElement,
  updateElement,
  updateMultipleElements,
  deleteElement,
  deleteSelectedElement,
  duplicateElement,
  bringToFront,
  sendToBack,
  toggleLock,
  selectElement,
  selectMultipleElements,
  addToSelection,
  clearSelection,
  alignElement,
  alignMultipleElements,
  distributeElements,
  zoomIn,
  zoomOut,
  resetZoom,
} = useCertificateEditor();

// Состояние модального окна пресетов
const showPresetConfirm = ref(false);
const pendingPresetData = ref<CertificateTemplateData | null>(null);

// Буфер обмена для копирования элементов
const clipboard = ref<TemplateElement | null>(null);

// Ключ для localStorage
const getStorageKey = () => `certificate_template_draft_${props.templateId}`;

// Автосохранение в localStorage
function autoSave() {
  if (isDirty.value) {
    try {
      const data = exportData();
      localStorage.setItem(getStorageKey(), JSON.stringify(data));
      console.log("✅ Автосохранение выполнено");
    } catch (error) {
      console.error("Ошибка автосохранения:", error);
    }
  }
}

// Загрузка из localStorage
function loadFromStorage() {
  try {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      const data = JSON.parse(saved);
      return data;
    }
  } catch (error) {
    console.error("Ошибка загрузки из localStorage:", error);
  }
  return null;
}

// Инициализация при монтировании
onMounted(() => {
  // Пытаемся загрузить сохраненную версию
  const savedData = loadFromStorage();
  if (savedData) {
    console.log("📂 Загружена сохраненная версия из localStorage");
    initTemplate(savedData);
  } else {
    initTemplate(props.initialData);
  }

  // Предзагружаем все Google Fonts
  preloadAllFonts();

  // Клавиатурные сочетания
  window.addEventListener("keydown", handleKeydown);

  // Автосохранение каждые 5 секунд
  const autoSaveInterval = setInterval(autoSave, 5000);

  // Очистка при размонтировании
  onUnmounted(() => {
    clearInterval(autoSaveInterval);
  });
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

// Обработка клавиатурных сочетаний
function handleKeydown(e: KeyboardEvent) {
  // Ctrl+Z - Undo
  if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
    e.preventDefault();
    undo();
  }
  // Ctrl+Y или Ctrl+Shift+Z - Redo
  if (
    (e.ctrlKey && e.key === "y") ||
    (e.ctrlKey && e.shiftKey && e.key === "z")
  ) {
    e.preventDefault();
    redo();
  }
  // Delete - удалить выбранный элемент
  if (e.key === "Delete" && selectedElementId.value) {
    e.preventDefault();
    deleteSelectedElement();
  }
  // Ctrl+D - дублировать
  if (e.ctrlKey && e.key === "d" && selectedElementId.value) {
    e.preventDefault();
    duplicateElement(selectedElementId.value);
  }
  // Ctrl+C - копировать
  if (e.ctrlKey && e.key === "c" && selectedElementId.value) {
    e.preventDefault();
    const element = activePage.value?.elements.find(
      (el: TemplateElement) => el.id === selectedElementId.value,
    );
    if (element) {
      clipboard.value = JSON.parse(JSON.stringify(element));
      console.log("📋 Элемент скопирован в буфер обмена");
    }
  }
  // Ctrl+V - вставить
  if (e.ctrlKey && e.key === "v" && clipboard.value) {
    e.preventDefault();
    const newElement = {
      ...JSON.parse(JSON.stringify(clipboard.value)),
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: clipboard.value.x + 20,
      y: clipboard.value.y + 20,
    };
    addElement(newElement);
    console.log("📌 Элемент вставлен из буфера обмена");
  }
  // Escape - снять выделение
  if (e.key === "Escape") {
    selectElement(null);
  }
  // Ctrl+S - сохранить
  if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
    e.preventDefault();
    e.stopPropagation();
    if (isDirty.value) {
      // Сохраняем в localStorage
      autoSave();
      // Отправляем на сервер
      emit("save", exportData());
    }
  }
}

// Обработчики добавления элементов
function handleAddText() {
  const element = createTextElement({
    x: templateData.value.width / 2 - 150,
    y: templateData.value.height / 2 - 25,
  });
  addElement(element);
}

function handleAddVariable(variableKey: VariableSource) {
  const element = createVariableElement(variableKey, {
    x: templateData.value.width / 2 - 175,
    y: templateData.value.height / 2 - 20,
  });
  addElement(element);
}

function handleAddImage(src: string) {
  const element = createImageElement(src, {
    x: 50,
    y: 50,
  });
  addElement(element);
}

function handleAddQR() {
  const element = createQRElement({
    x: templateData.value.width - 150,
    y: templateData.value.height - 150,
  });
  addElement(element);
}

function handleAddShape(shapeType: ShapeType) {
  const element = createShapeElement(shapeType, {
    x: templateData.value.width / 2 - 100,
    y: templateData.value.height / 2 - 50,
  });
  addElement(element);
}

function handleElementUpdate(id: string, updates: Partial<TemplateElement>) {
  updateElement(id, updates);
}

function handleToggleLock() {
  if (selectedElementId.value) {
    toggleLock(selectedElementId.value);
  }
}

function handleAlign(
  direction: "left" | "center-h" | "right" | "top" | "center-v" | "bottom",
) {
  if (selectedElementId.value) {
    alignElement(selectedElementId.value, direction);
  }
}

function handleApplyPreset(presetData: CertificateTemplateData) {
  // Если есть элементы — показываем модалку подтверждения
  if (templateData.value.pages.some(p => p.elements.length > 0)) {
    pendingPresetData.value = presetData;
    showPresetConfirm.value = true;
    return;
  }

  // Применяем пресет через initTemplate
  initTemplate(presetData);
}

function confirmPreset() {
  if (pendingPresetData.value) {
    initTemplate(pendingPresetData.value);
  }
  showPresetConfirm.value = false;
  pendingPresetData.value = null;
}

function cancelPreset() {
  showPresetConfirm.value = false;
  pendingPresetData.value = null;
}

// Drag & Drop страниц
const draggedPageIndex = ref<number | null>(null);

function handlePageDragStart(index: number) {
  draggedPageIndex.value = index;
}

function handlePageDragOver(index: number) {
  // Просто разрешаем drop
}

function handlePageDrop(index: number) {
  if (draggedPageIndex.value !== null && draggedPageIndex.value !== index) {
    reorderPages(draggedPageIndex.value, index);
  }
  draggedPageIndex.value = null;
}

function handlePageDragEnd() {
  draggedPageIndex.value = null;
}

// Превью страницы
function getPagePreviewStyle(page: CertificatePage) {
  const bg = page.background;
  const ratio = templateData.value.width / templateData.value.height;
  const width = 56;
  const height = width / ratio;
  
  const baseStyle = {
    width: `${width}px`,
    height: `${height}px`,
  };

  if (bg.type === "color") {
    return { ...baseStyle, backgroundColor: bg.value };
  } else if (bg.type === "image") {
    return { ...baseStyle, backgroundImage: `url(${bg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return { ...baseStyle, backgroundColor: "#FFFFFF" };
}

// Обработчики для группового редактирования
function handleDeleteMultiple() {
  const ids = Array.from(selectedElementIds.value);
  ids.forEach((id) => deleteElement(id));
  clearSelection();
}

function handleDuplicateMultiple() {
  const ids = Array.from(selectedElementIds.value);
  ids.forEach((id) => duplicateElement(id));
}

function handleAlignGroup(
  direction: "left" | "center-h" | "right" | "top" | "center-v" | "bottom",
) {
  const ids = Array.from(selectedElementIds.value);
  alignMultipleElements(ids, direction);
}

function handleDistribute(direction: "horizontal" | "vertical") {
  const ids = Array.from(selectedElementIds.value);
  distributeElements(ids, direction);
}

function handleDuplicate() {
  if (selectedElementId.value) {
    duplicateElement(selectedElementId.value);
  }
}

function handleBringToFront() {
  const ids =
    selectedElementIds.value.size > 0
      ? Array.from(selectedElementIds.value)
      : selectedElementId.value
        ? [selectedElementId.value]
        : [];

  ids.forEach((id) => bringToFront(id));
}

function handleSendToBack() {
  const ids =
    selectedElementIds.value.size > 0
      ? Array.from(selectedElementIds.value)
      : selectedElementId.value
        ? [selectedElementId.value]
        : [];

  ids.forEach((id) => sendToBack(id));
}
</script>

<style scoped>
.certificate-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-gray-100);
}

:root.dark .certificate-editor {
  background-color: var(--color-gray-900);
}

/* Заголовок */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: white;
  border-bottom: 1px solid var(--color-gray-200);
  gap: 1rem;
}

:root.dark .editor-header {
  background: var(--color-gray-800);
  border-color: var(--color-gray-700);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  color: var(--color-gray-600);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.back-button:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-900);
}

:root.dark .back-button {
  color: var(--color-gray-400);
}

:root.dark .back-button:hover {
  background: var(--color-gray-700);
  color: white;
}

.editor-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0;
}

:root.dark .editor-title {
  color: white;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-gray-600);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--color-gray-100);
  color: var(--color-gray-900);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

:root.dark .toolbar-btn {
  color: var(--color-gray-400);
}

:root.dark .toolbar-btn:hover:not(:disabled) {
  background: var(--color-gray-700);
  color: white;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--color-gray-300);
  margin: 0 0.5rem;
}

:root.dark .toolbar-divider {
  background: var(--color-gray-600);
}

.zoom-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-gray-500);
  min-width: 40px;
  text-align: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  background: white;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preview:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-400);
}

:root.dark .btn-preview {
  color: var(--color-gray-300);
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
}

:root.dark .btn-preview:hover {
  background: var(--color-gray-600);
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.4);
  transform: translateY(-1px);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Основная область */
.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas-container {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background:
    linear-gradient(45deg, var(--color-gray-200) 25%, transparent 25%),
    linear-gradient(-45deg, var(--color-gray-200) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--color-gray-200) 75%),
    linear-gradient(-45deg, transparent 75%, var(--color-gray-200) 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0px;
  background-color: var(--color-gray-100);
}

:root.dark .canvas-container {
  background-color: var(--color-gray-900);
  background-image:
    linear-gradient(45deg, var(--color-gray-800) 25%, transparent 25%),
    linear-gradient(-45deg, var(--color-gray-800) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--color-gray-800) 75%),
    linear-gradient(-45deg, transparent 75%, var(--color-gray-800) 75%);
}

/* Панель страниц */
.canvas-container {
  display: flex;
  flex-direction: column;
  position: relative;
}

.pages-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 88px;
  background: white;
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  z-index: 10;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
}

:root.dark .pages-panel {
  background: var(--color-gray-800);
  border-color: var(--color-gray-700);
}

.pages-list {
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow-x: auto;
  padding: 0.5rem 0;
  flex: 1;
}

.pages-list::-webkit-scrollbar {
  height: 4px;
}
.pages-list::-webkit-scrollbar-thumb {
  background-color: var(--color-gray-300);
  border-radius: 4px;
}

.page-thumb {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.5rem;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-gray-50);
}

:root.dark .page-thumb {
  background: var(--color-gray-900);
}

.page-thumb:hover {
  background: var(--color-gray-100);
}

:root.dark .page-thumb:hover {
  background: var(--color-gray-700);
}

.page-thumb.active {
  border-color: var(--color-primary-500, #3b82f6);
  background: var(--color-primary-50, #eff6ff);
}

:root.dark .page-thumb.active {
  background: rgba(59, 130, 246, 0.1);
}

.page-preview {
  position: relative;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.25rem;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

:root.dark .page-preview {
  border-color: var(--color-gray-600);
}

.page-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  font-weight: 700;
  color: rgba(0,0,0,0.1);
  pointer-events: none;
}

.page-actions {
  position: absolute;
  top: -8px;
  right: -8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}

.page-thumb:hover .page-actions {
  opacity: 1;
}

.page-action-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: white;
  color: var(--color-gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-action-btn:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-900);
}

.page-action-btn.danger:hover:not(:disabled) {
  color: #ef4444;
}

.page-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-page-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px dashed var(--color-gray-300);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-gray-500);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  height: 48px;
  margin-left: 0.5rem;
}

.add-page-btn:hover {
  border-color: var(--color-gray-400);
  color: var(--color-gray-700);
  background: var(--color-gray-50);
}

:root.dark .add-page-btn {
  border-color: var(--color-gray-600);
  color: var(--color-gray-400);
}

:root.dark .add-page-btn:hover {
  border-color: var(--color-gray-500);
  color: var(--color-gray-200);
  background: var(--color-gray-700);
}

.pages-info {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  font-weight: 500;
  padding-left: 1rem;
  border-left: 1px solid var(--color-gray-200);
  white-space: nowrap;
}

:root.dark .pages-info {
  border-color: var(--color-gray-700);
}

/* Анимация спиннера */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Модалка подтверждения пресета */
.preset-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.preset-confirm-modal {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  animation: modalSlideIn 0.2s ease;
}

:root.dark .preset-confirm-modal {
  background: var(--color-gray-800);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.preset-confirm-modal .modal-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: #fef3c7;
  border-radius: 50%;
  color: #d97706;
  margin-bottom: 1rem;
}

:root.dark .preset-confirm-modal .modal-icon {
  background: rgba(217, 119, 6, 0.2);
}

.preset-confirm-modal h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem 0;
}

:root.dark .preset-confirm-modal h3 {
  color: white;
}

.preset-confirm-modal p {
  font-size: 0.875rem;
  color: var(--color-gray-600);
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

:root.dark .preset-confirm-modal p {
  color: var(--color-gray-400);
}

.preset-confirm-modal .modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.preset-confirm-modal .btn-cancel {
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  color: var(--color-gray-700);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.preset-confirm-modal .btn-cancel:hover {
  background: var(--color-gray-50);
}

:root.dark .preset-confirm-modal .btn-cancel {
  border-color: var(--color-gray-600);
  color: var(--color-gray-300);
}

.preset-confirm-modal .btn-confirm {
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.preset-confirm-modal .btn-confirm:hover {
  background: #2563eb;
}
</style>
