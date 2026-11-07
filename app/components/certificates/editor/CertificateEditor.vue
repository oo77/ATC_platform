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

        <button
          class="toolbar-btn"
          @click="zoomOutCentered"
          :disabled="zoom <= minZoom"
          title="Уменьшить (Ctrl+−)"
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

        <!-- Масштаб: клик открывает список пресетов -->
        <div class="dropdown" ref="zoomMenuRef">
          <button
            class="zoom-label-btn"
            :class="{ active: openMenu === 'zoom' }"
            @click="toggleMenu('zoom')"
            title="Выбрать масштаб"
          >
            {{ Math.round(zoom * 100) }}%
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div v-if="openMenu === 'zoom'" class="dropdown-menu zoom-menu">
            <button class="menu-item" @click="fitToScreen(); closeMenu()">
              <span>По размеру экрана</span>
              <kbd>Ctrl+0</kbd>
            </button>
            <button class="menu-item" @click="fitToWidth(); closeMenu()">
              <span>По ширине</span>
            </button>
            <div class="menu-divider"></div>
            <button
              v-for="preset in zoomMenuPresets"
              :key="preset"
              class="menu-item"
              :class="{ current: Math.abs(zoom - preset) < 0.001 }"
              @click="zoomToCenter(preset); closeMenu()"
            >
              <span>{{ Math.round(preset * 100) }}%</span>
              <kbd v-if="preset === 1">Ctrl+1</kbd>
            </button>
          </div>
        </div>

        <button
          class="toolbar-btn"
          @click="zoomInCentered"
          :disabled="zoom >= maxZoom"
          title="Увеличить (Ctrl++)"
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
        <button class="toolbar-btn" @click="fitToScreen" title="По размеру экрана (Ctrl+0)">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>

        <div class="toolbar-divider"></div>

        <!-- Быстрые переключатели вида -->
        <button
          class="toolbar-btn"
          :class="{ toggled: view.showGrid }"
          @click="view.showGrid = !view.showGrid"
          title="Сетка (Ctrl+')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" />
          </svg>
        </button>
        <button
          class="toolbar-btn"
          :class="{ toggled: view.snapToGrid }"
          @click="view.snapToGrid = !view.snapToGrid"
          title="Привязка к сетке (Ctrl+Shift+')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15" />
            <path d="m5 8 4 4" /><path d="m12 15 4 4" />
          </svg>
        </button>

        <div class="dropdown" ref="viewMenuRef">
          <button
            class="toolbar-btn wide"
            :class="{ active: openMenu === 'view' }"
            @click="toggleMenu('view')"
            title="Настройки вида"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div v-if="openMenu === 'view'" class="dropdown-menu view-menu">
            <label class="menu-check">
              <input type="checkbox" v-model="view.showRulers" />
              <span>Линейки</span>
              <kbd>Shift+R</kbd>
            </label>
            <label class="menu-check">
              <input type="checkbox" v-model="view.showGrid" />
              <span>Сетка</span>
              <kbd>Ctrl+'</kbd>
            </label>
            <label class="menu-check">
              <input type="checkbox" v-model="view.snapToGrid" />
              <span>Привязка к сетке</span>
              <kbd>Ctrl+Shift+'</kbd>
            </label>
            <label class="menu-field">
              <span>Шаг сетки</span>
              <select v-model.number="view.gridSize">
                <option v-for="size in GRID_SIZES" :key="size.px" :value="size.px">
                  {{ size.label }}
                </option>
              </select>
            </label>
            <div class="menu-divider"></div>
            <label class="menu-check">
              <input type="checkbox" v-model="view.showMargins" />
              <span>Поля печати и центр</span>
              <kbd>Shift+M</kbd>
            </label>
            <label class="menu-field">
              <span>Поля, мм</span>
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                v-model.number="view.marginMm"
              />
            </label>
            <p class="menu-note">
              Безопасная зона: важный текст лучше держать внутри пунктирной рамки,
              чтобы его не срезало при печати.
            </p>
          </div>
        </div>

        <button
          class="toolbar-btn"
          @click="showShortcuts = true"
          title="Горячие клавиши (?)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="M6 8h.01" /><path d="M10 8h.01" /><path d="M14 8h.01" /><path d="M18 8h.01" />
            <path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /><path d="M7 16h10" />
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

      <div class="canvas-column">
        <!-- Область холста с линейками -->
        <div class="canvas-area" :class="{ 'with-rulers': view.showRulers }">
          <template v-if="view.showRulers">
            <div class="ruler-corner" title="px шаблона">px</div>
            <EditorRuler
              orientation="horizontal"
              :zoom="zoom"
              :origin="canvasOrigin.x"
              :canvas-size="templateData.width"
              :cursor="cursorPos ? cursorPos.x : null"
              :highlight="selectionBounds ? { start: selectionBounds.x, end: selectionBounds.x + selectionBounds.width } : null"
            />
            <EditorRuler
              orientation="vertical"
              :zoom="zoom"
              :origin="canvasOrigin.y"
              :canvas-size="templateData.height"
              :cursor="cursorPos ? cursorPos.y : null"
              :highlight="selectionBounds ? { start: selectionBounds.y, end: selectionBounds.y + selectionBounds.height } : null"
            />
          </template>

          <div
            class="canvas-container"
            ref="canvasContainerRef"
            :class="{ 'is-panning': isPanning, 'pan-ready': spaceHeld && !isPanning }"
            @mousedown.capture="handleViewportMouseDown"
            @auxclick.prevent
            @mousemove="handleViewportMouseMove"
            @mouseleave="cursorPos = null"
            @scroll="scheduleViewportUpdate"
          >
            <div class="canvas-stage">
              <div class="canvas-frame" ref="canvasFrameRef">
                <EditorCanvas
                  ref="canvasRef"
                  v-if="activePage"
                  :template-data="templateData"
                  :active-page="activePage"
                  :selected-element-ids="selectedElementIds"
                  :zoom="zoom"
                  :show-grid="view.showGrid"
                  :grid-size="view.gridSize"
                  :snap-to-grid="view.snapToGrid"
                  :show-margins="view.showMargins"
                  :margin-px="marginPx"
                  @select="selectElement"
                  @select-multiple="selectMultipleElements"
                  @update-element="updateElement"
                  @delete-element="deleteElement"
                  @set-custom-dimensions="setCustomDimensions"
                  @transform-start="beginHistoryBatch"
                  @transform-end="endHistoryBatch"
                />
              </div>
            </div>
          </div>

          <!-- Подсказка по навигации -->
          <div v-if="view.showNavHint" class="nav-hint">
            <span><b>Колесо</b> — прокрутка</span>
            <span><b>Shift+колесо</b> — по горизонтали</span>
            <span><b>Ctrl+колесо</b> — масштаб</span>
            <span><b>Зажать колесо</b> или <b>Пробел</b> — перемещать лист</span>
            <button class="nav-hint-close" @click="view.showNavHint = false" title="Скрыть подсказку">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        </div>

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

          <div class="status-info">
            <span class="status-item" title="Размер листа">
              {{ templateData.width }}×{{ templateData.height }} px
              <small>({{ pxToMm(templateData.width) }}×{{ pxToMm(templateData.height) }} мм)</small>
            </span>
            <span v-if="selectionBounds" class="status-item" title="Выделение: позиция и размер">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3a2 2 0 0 0-2 2" /><path d="M19 3a2 2 0 0 1 2 2" /><path d="M21 19a2 2 0 0 1-2 2" /><path d="M5 21a2 2 0 0 1-2-2" /><path d="M9 3h1" /><path d="M9 21h1" /><path d="M14 3h1" /><path d="M14 21h1" /><path d="M3 9v1" /><path d="M21 9v1" /><path d="M3 14v1" /><path d="M21 14v1" /></svg>
              {{ Math.round(selectionBounds.x) }}, {{ Math.round(selectionBounds.y) }}
              · {{ Math.round(selectionBounds.width) }}×{{ Math.round(selectionBounds.height) }}
            </span>
            <span class="status-item cursor-pos" title="Координаты курсора">
              <template v-if="cursorPos">
                X {{ Math.round(cursorPos.x) }} · Y {{ Math.round(cursorPos.y) }}
              </template>
              <template v-else>X — · Y —</template>
            </span>
            <span class="status-item">Стр. {{ activePageIndex + 1 }} / {{ pagesCount }}</span>
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
        @update-many="handleUpdateMany"
        @select-ids="handleSelectIds"
        @select-same-type="handleSelectSameType"
        :group-state="selectionGroupState"
        @group="handleGroup"
        @ungroup="handleUngroup"
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

      <!-- Справка по горячим клавишам -->
      <div
        v-if="showShortcuts"
        class="preset-confirm-overlay"
        @click.self="showShortcuts = false"
      >
        <div class="shortcuts-modal">
          <div class="shortcuts-header">
            <h3>Управление и горячие клавиши</h3>
            <button class="toolbar-btn" @click="showShortcuts = false" title="Закрыть">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
          <div class="shortcuts-grid">
            <section v-for="group in SHORTCUT_GROUPS" :key="group.title">
              <h4>{{ group.title }}</h4>
              <div v-for="item in group.items" :key="item.label" class="shortcut-row">
                <span>{{ item.label }}</span>
                <span class="keys">
                  <kbd v-for="key in item.keys" :key="key">{{ key }}</kbd>
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
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
import EditorRuler from "./EditorRuler.vue";

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
const canvasFrameRef = ref<HTMLElement | null>(null);

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
  beginHistoryBatch,
  endHistoryBatch,
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
  deleteElements,
  nudgeElements,
  bringToFront,
  sendToBack,
  toggleLock,
  selectElement,
  selectMultipleElements,
  addToSelection,
  clearSelection,
  alignElement,
  alignMultipleElements,
  alignSelectionToCanvas,
  groupElements,
  ungroupElements,
  selectionGroupState,
  distributeElements,
  setZoom,
  ZOOM_PRESETS,
} = useCertificateEditor();

// Состояние модального окна пресетов
const showPresetConfirm = ref(false);
const pendingPresetData = ref<CertificateTemplateData | null>(null);

// Буфер обмена для копирования элементов
const clipboard = ref<TemplateElement[]>([]);

// ── Настройки вида (запоминаются в браузере) ─────────────────
const VIEW_STORAGE_KEY = "certificate_editor_view";
// Шаблон рисуется в px при 96 DPI
const PX_PER_MM = 96 / 25.4;
const GRID_SIZES = [
  { px: 10, label: "10 px" },
  { px: 19, label: "5 мм (19 px)" },
  { px: 20, label: "20 px" },
  { px: 25, label: "25 px" },
  { px: 38, label: "10 мм (38 px)" },
  { px: 50, label: "50 px" },
];

const view = reactive({
  showRulers: true,
  showGrid: false,
  snapToGrid: false,
  gridSize: 20,
  showMargins: false,
  marginMm: 10,
  showNavHint: true,
});

try {
  const saved = localStorage.getItem(VIEW_STORAGE_KEY);
  if (saved) Object.assign(view, JSON.parse(saved));
} catch {
  // Нет доступа к localStorage — работаем с настройками по умолчанию
}

watch(
  view,
  () => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(view));
    } catch {
      // ignore
    }
  },
  { deep: true },
);

const marginPx = computed(() => Math.max(0, view.marginMm || 0) * PX_PER_MM);

function pxToMm(px: number) {
  return Math.round(px / PX_PER_MM);
}

// ── Меню в шапке ─────────────────────────────────────────────
const openMenu = ref<"zoom" | "view" | null>(null);
const zoomMenuRef = ref<HTMLElement | null>(null);
const viewMenuRef = ref<HTMLElement | null>(null);
const showShortcuts = ref(false);

const zoomMenuPresets = computed(() =>
  ZOOM_PRESETS.filter((z) => z >= 0.25),
);

function toggleMenu(name: "zoom" | "view") {
  openMenu.value = openMenu.value === name ? null : name;
}

function closeMenu() {
  openMenu.value = null;
}

function handleDocumentMouseDown(e: MouseEvent) {
  if (!openMenu.value) return;
  const target = e.target as Node;
  if (zoomMenuRef.value?.contains(target) || viewMenuRef.value?.contains(target)) {
    return;
  }
  closeMenu();
}

// ── Вьюпорт: положение холста, курсор, линейки ──────────────
const canvasOrigin = reactive({ x: 0, y: 0 });
const cursorPos = ref<{ x: number; y: number } | null>(null);
let viewportFrame = 0;
let viewportObserver: ResizeObserver | null = null;

function getCanvasEl(): HTMLElement | null {
  return (canvasFrameRef.value?.firstElementChild as HTMLElement) ?? null;
}

function updateViewport() {
  viewportFrame = 0;
  const container = canvasContainerRef.value;
  const canvasEl = getCanvasEl();
  if (!container || !canvasEl) return;
  const c = container.getBoundingClientRect();
  const r = canvasEl.getBoundingClientRect();
  canvasOrigin.x = r.left - c.left;
  canvasOrigin.y = r.top - c.top;
}

function scheduleViewportUpdate() {
  if (viewportFrame) return;
  viewportFrame = requestAnimationFrame(updateViewport);
}

watch(
  () => [zoom.value, templateData.value.width, templateData.value.height, view.showRulers, activePageIndex.value],
  () => nextTick(scheduleViewportUpdate),
);

function handleViewportMouseMove(e: MouseEvent) {
  const canvasEl = getCanvasEl();
  if (!canvasEl) return;
  const r = canvasEl.getBoundingClientRect();
  cursorPos.value = {
    x: (e.clientX - r.left) / zoom.value,
    y: (e.clientY - r.top) / zoom.value,
  };
}

// Рамка вокруг выделенных элементов (для линеек и строки состояния)
const selectionBounds = computed(() => {
  const els = selectedElements.value;
  if (els.length === 0) return null;
  const left = Math.min(...els.map((el) => el.x));
  const top = Math.min(...els.map((el) => el.y));
  const right = Math.max(...els.map((el) => el.x + el.width));
  const bottom = Math.max(...els.map((el) => el.y + el.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
});

// ── Масштаб ──────────────────────────────────────────────────
// Точка листа под курсором остаётся на месте при изменении масштаба
let pendingZoomAnchor: {
  contentX: number;
  contentY: number;
  clientX: number;
  clientY: number;
} | null = null;

function zoomAt(value: number, clientX: number, clientY: number) {
  const container = canvasContainerRef.value;
  const canvasEl = getCanvasEl();
  if (!container || !canvasEl) {
    setZoom(value);
    return;
  }
  if (pendingZoomAnchor) {
    // Несколько событий колеса до перерисовки: якорь на листе тот же
    pendingZoomAnchor.clientX = clientX;
    pendingZoomAnchor.clientY = clientY;
    setZoom(value);
    return;
  }
  const r = canvasEl.getBoundingClientRect();
  pendingZoomAnchor = {
    contentX: (clientX - r.left) / zoom.value,
    contentY: (clientY - r.top) / zoom.value,
    clientX,
    clientY,
  };
  // nextTick вызываем ПОСЛЕ изменения масштаба, чтобы он сработал после перерисовки
  setZoom(value);
  nextTick(() => {
    const anchor = pendingZoomAnchor;
    pendingZoomAnchor = null;
    if (!anchor) return;
    const after = canvasEl.getBoundingClientRect();
    container.scrollLeft += after.left + anchor.contentX * zoom.value - anchor.clientX;
    container.scrollTop += after.top + anchor.contentY * zoom.value - anchor.clientY;
    scheduleViewportUpdate();
  });
}

function containerCenter() {
  const r = canvasContainerRef.value?.getBoundingClientRect();
  if (!r) return { x: 0, y: 0 };
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function zoomToCenter(value: number) {
  const c = containerCenter();
  zoomAt(value, c.x, c.y);
}

// Кнопки +/- переходят к следующему «круглому» значению масштаба
function zoomInCentered() {
  const next = ZOOM_PRESETS.find((z) => z > zoom.value + 0.001);
  zoomToCenter(next ?? maxZoom);
}

function zoomOutCentered() {
  const prev = [...ZOOM_PRESETS].reverse().find((z) => z < zoom.value - 0.001);
  zoomToCenter(prev ?? minZoom);
}

// Отступ вокруг листа внутри области прокрутки (совпадает с padding .canvas-stage)
const STAGE_PADDING = 48;

function centerCanvas() {
  nextTick(() => {
    const container = canvasContainerRef.value;
    if (!container) return;
    container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
    container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
    scheduleViewportUpdate();
  });
}

function fitZoomValue(widthOnly = false) {
  const container = canvasContainerRef.value;
  if (!container) return zoom.value;
  const availW = container.clientWidth - STAGE_PADDING * 2;
  const availH = container.clientHeight - STAGE_PADDING * 2;
  const byWidth = availW / templateData.value.width;
  const byHeight = availH / templateData.value.height;
  return widthOnly ? byWidth : Math.min(byWidth, byHeight);
}

function fitToScreen() {
  setZoom(fitZoomValue());
  centerCanvas();
}

function fitToWidth() {
  setZoom(fitZoomValue(true));
  nextTick(() => {
    const container = canvasContainerRef.value;
    if (!container) return;
    container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
    container.scrollTop = 0;
    scheduleViewportUpdate();
  });
}

function handleWheel(e: WheelEvent) {
  // Ctrl+колесо (и щипок на тачпаде) — масштаб к курсору; обычное колесо — прокрутка
  if (!e.ctrlKey && !e.metaKey) return;
  e.preventDefault();
  const unit = e.deltaMode === 1 ? 0.05 : 0.0015;
  const factor = Math.exp(-e.deltaY * unit);
  zoomAt(zoom.value * factor, e.clientX, e.clientY);
}

// ── Панорамирование: зажатое колесо или Пробел + левая кнопка ─
const isPanning = ref(false);
const spaceHeld = ref(false);
let panStart = { x: 0, y: 0, left: 0, top: 0 };

function handleViewportMouseDown(e: MouseEvent) {
  const isMiddle = e.button === 1;
  const isSpaceDrag = e.button === 0 && spaceHeld.value;
  if (!isMiddle && !isSpaceDrag) return;
  const container = canvasContainerRef.value;
  if (!container) return;
  // Не даём событию дойти до элементов и отключаем автопрокрутку браузера
  e.preventDefault();
  e.stopPropagation();
  isPanning.value = true;
  panStart = {
    x: e.clientX,
    y: e.clientY,
    left: container.scrollLeft,
    top: container.scrollTop,
  };
  document.addEventListener("mousemove", handlePanMove);
  document.addEventListener("mouseup", handlePanEnd);
}

function handlePanMove(e: MouseEvent) {
  const container = canvasContainerRef.value;
  if (!isPanning.value || !container) return;
  container.scrollLeft = panStart.left - (e.clientX - panStart.x);
  container.scrollTop = panStart.top - (e.clientY - panStart.y);
}

function handlePanEnd() {
  isPanning.value = false;
  document.removeEventListener("mousemove", handlePanMove);
  document.removeEventListener("mouseup", handlePanEnd);
}

function isEditableTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.isContentEditable ||
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT"
  );
}

function handleKeyup(e: KeyboardEvent) {
  if (e.code === "Space") spaceHeld.value = false;
}

function handleWindowBlur() {
  spaceHeld.value = false;
  handlePanEnd();
}

// Ключ для localStorage
const getStorageKey = () => `certificate_template_draft_${props.templateId}`;

// Автосохранение в localStorage
function autoSave() {
  if (isDirty.value) {
    try {
      const data = exportData();
      localStorage.setItem(getStorageKey(), JSON.stringify(data));
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

let autoSaveInterval: ReturnType<typeof setInterval> | undefined;

// Инициализация при монтировании
onMounted(() => {
  // Пытаемся загрузить сохраненную версию
  const savedData = loadFromStorage();
  if (savedData) {
    initTemplate(savedData);
  } else {
    initTemplate(props.initialData);
  }

  // Предзагружаем все Google Fonts
  preloadAllFonts();

  // Клавиатурные сочетания
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("keyup", handleKeyup);
  window.addEventListener("blur", handleWindowBlur);
  document.addEventListener("mousedown", handleDocumentMouseDown);

  // Колесо слушаем не-пассивно, чтобы Ctrl+колесо не масштабировало всю страницу
  canvasContainerRef.value?.addEventListener("wheel", handleWheel, { passive: false });
  if (canvasContainerRef.value && typeof ResizeObserver !== "undefined") {
    viewportObserver = new ResizeObserver(scheduleViewportUpdate);
    viewportObserver.observe(canvasContainerRef.value);
  }

  // Стартовый вид: лист целиком, но не крупнее 100%
  nextTick(() => {
    setZoom(Math.min(1, fitZoomValue()));
    centerCanvas();
  });

  // Автосохранение каждые 5 секунд
  autoSaveInterval = setInterval(autoSave, 5000);
});

onUnmounted(() => {
  clearInterval(autoSaveInterval);
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("keyup", handleKeyup);
  window.removeEventListener("blur", handleWindowBlur);
  document.removeEventListener("mousedown", handleDocumentMouseDown);
  canvasContainerRef.value?.removeEventListener("wheel", handleWheel);
  viewportObserver?.disconnect();
  if (viewportFrame) cancelAnimationFrame(viewportFrame);
  handlePanEnd();
});

// ── Операции с выделением ────────────────────────────────────
function newElementId() {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** Вставить копии элементов со смещением; всё — один шаг Undo */
function insertCopies(elements: TemplateElement[], offset: number) {
  if (elements.length === 0) return;
  const { width, height } = templateData.value;
  const newIds: string[] = [];
  // Копии группы образуют свою новую группу, а не вливаются в исходную
  const groupMap = new Map<string, string>();
  const copyGroupId = (old: string) => {
    if (!groupMap.has(old)) {
      groupMap.set(old, `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    }
    return groupMap.get(old)!;
  };
  beginHistoryBatch();
  // Сохраняем исходный порядок слоёв
  [...elements]
    .sort((a, b) => a.zIndex - b.zIndex)
    .forEach((source) => {
      const copy = JSON.parse(JSON.stringify(source)) as TemplateElement;
      copy.id = newElementId();
      copy.locked = false;
      if (copy.groupId) copy.groupId = copyGroupId(copy.groupId);
      copy.x = Math.max(0, Math.min(width - copy.width, source.x + offset));
      copy.y = Math.max(0, Math.min(height - copy.height, source.y + offset));
      addElement(copy);
      newIds.push(copy.id);
    });
  endHistoryBatch();
  selectMultipleElements(newIds);
}

function duplicateSelected() {
  insertCopies(selectedElements.value, 20);
}

function deleteSelected() {
  const ids = selectedElements.value
    .filter((el) => !el.locked)
    .map((el) => el.id);
  deleteElements(ids);
}

const SHORTCUT_GROUPS = [
  {
    title: "Навигация",
    items: [
      { label: "Прокрутка листа", keys: ["Колесо"] },
      { label: "Прокрутка по горизонтали", keys: ["Shift", "Колесо"] },
      { label: "Масштаб к курсору", keys: ["Ctrl", "Колесо"] },
      { label: "Перемещать лист", keys: ["Зажать колесо"] },
      { label: "Перемещать лист", keys: ["Пробел", "Перетащить"] },
      { label: "Увеличить / уменьшить", keys: ["Ctrl", "+ / −"] },
      { label: "По размеру экрана", keys: ["Ctrl", "0"] },
      { label: "Масштаб 100%", keys: ["Ctrl", "1"] },
    ],
  },
  {
    title: "Элементы",
    items: [
      { label: "Выделить все", keys: ["Ctrl", "A"] },
      { label: "Добавить к выделению", keys: ["Ctrl", "Клик"] },
      { label: "Сдвиг на 1 px", keys: ["Стрелки"] },
      { label: "Сдвиг на 10 px", keys: ["Shift", "Стрелки"] },
      { label: "Копировать / вставить", keys: ["Ctrl", "C / V"] },
      { label: "Дублировать", keys: ["Ctrl", "D"] },
      { label: "Сгруппировать", keys: ["Ctrl", "G"] },
      { label: "Разгруппировать", keys: ["Ctrl", "Shift", "G"] },
      { label: "Элемент внутри группы", keys: ["Alt", "Клик"] },
      { label: "Удалить", keys: ["Delete"] },
      { label: "Снять выделение", keys: ["Esc"] },
      { label: "Редактировать текст", keys: ["Двойной клик"] },
    ],
  },
  {
    title: "Общее",
    items: [
      { label: "Отменить", keys: ["Ctrl", "Z"] },
      { label: "Повторить", keys: ["Ctrl", "Y"] },
      { label: "Сохранить", keys: ["Ctrl", "S"] },
      { label: "Сетка", keys: ["Ctrl", "'"] },
      { label: "Привязка к сетке", keys: ["Ctrl", "Shift", "'"] },
      { label: "Линейки", keys: ["Shift", "R"] },
      { label: "Поля печати", keys: ["Shift", "M"] },
      { label: "Эта справка", keys: ["?"] },
    ],
  },
];

// Обработка клавиатурных сочетаний.
// Используем e.code, чтобы сочетания работали и в русской раскладке.
function handleKeydown(e: KeyboardEvent) {
  const ctrl = e.ctrlKey || e.metaKey;

  // Ctrl+S - сохранить (работает везде, в том числе в полях ввода)
  if (ctrl && e.code === "KeyS") {
    e.preventDefault();
    e.stopPropagation();
    if (isDirty.value) {
      autoSave();
      emit("save", exportData());
    }
    return;
  }

  // В полях ввода и при редактировании текста остальные сочетания не перехватываем
  if (isEditableTarget(e.target)) return;

  if (e.code === "Space") {
    e.preventDefault();
    if (!e.repeat) spaceHeld.value = true;
    return;
  }

  if (e.key === "Escape") {
    if (showShortcuts.value) showShortcuts.value = false;
    else if (openMenu.value) closeMenu();
    else selectElement(null);
    return;
  }

  if (e.key === "?") {
    e.preventDefault();
    showShortcuts.value = !showShortcuts.value;
    return;
  }

  if (ctrl) {
    switch (e.code) {
      case "KeyZ":
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      case "KeyY":
        e.preventDefault();
        redo();
        return;
      case "KeyD":
        e.preventDefault();
        duplicateSelected();
        return;
      case "KeyG":
        // Ctrl+G — сгруппировать, Ctrl+Shift+G — разгруппировать
        e.preventDefault();
        if (e.shiftKey) handleUngroup();
        else handleGroup();
        return;
      case "KeyC":
        if (selectedElements.value.length > 0) {
          e.preventDefault();
          clipboard.value = JSON.parse(JSON.stringify(selectedElements.value));
        }
        return;
      case "KeyX":
        if (selectedElements.value.length > 0) {
          e.preventDefault();
          clipboard.value = JSON.parse(JSON.stringify(selectedElements.value));
          deleteSelected();
        }
        return;
      case "KeyV":
        if (clipboard.value.length > 0) {
          e.preventDefault();
          insertCopies(clipboard.value, 20);
          // Следующая вставка сместится ещё на 20 px
          clipboard.value = clipboard.value.map((el) => ({
            ...el,
            x: el.x + 20,
            y: el.y + 20,
          }));
        }
        return;
      case "KeyA":
        e.preventDefault();
        selectMultipleElements(
          (activePage.value?.elements ?? []).map((el: TemplateElement) => el.id),
        );
        return;
      case "Equal":
      case "NumpadAdd":
        e.preventDefault();
        zoomInCentered();
        return;
      case "Minus":
      case "NumpadSubtract":
        e.preventDefault();
        zoomOutCentered();
        return;
      case "Digit0":
      case "Numpad0":
        e.preventDefault();
        fitToScreen();
        return;
      case "Digit1":
      case "Numpad1":
        e.preventDefault();
        zoomToCenter(1);
        return;
      case "Quote":
        e.preventDefault();
        if (e.shiftKey) view.snapToGrid = !view.snapToGrid;
        else view.showGrid = !view.showGrid;
        return;
    }
    return;
  }

  if (e.shiftKey && e.code === "KeyR") {
    view.showRulers = !view.showRulers;
    return;
  }
  if (e.shiftKey && e.code === "KeyM") {
    view.showMargins = !view.showMargins;
    return;
  }

  // Delete / Backspace - удалить выбранные элементы
  if (e.key === "Delete" || e.key === "Backspace") {
    if (selectedElements.value.length > 0) {
      e.preventDefault();
      deleteSelected();
    }
    return;
  }

  // Стрелки - сдвиг выбранных элементов
  const arrows: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  const dir = arrows[e.key];
  if (dir && selectedElementIds.value.size > 0) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    nudgeElements(Array.from(selectedElementIds.value), dir[0] * step, dir[1] * step);
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

const canvasRef = ref<InstanceType<typeof EditorCanvas> | null>(null);

// Свойства, от которых зависит высота текста
const TEXT_LAYOUT_PROPS = [
  "content",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "listStyle",
  "width",
];

function handleElementUpdate(id: string, updates: Partial<TemplateElement>) {
  const affectsTextLayout = Object.keys(updates).some((k) =>
    TEXT_LAYOUT_PROPS.includes(k),
  );
  if (!affectsTextLayout) {
    updateElement(id, updates);
    return;
  }
  // Изменение + авто-высота текстового блока — один шаг Undo
  beginHistoryBatch();
  updateElement(id, updates);
  nextTick(() => {
    try {
      canvasRef.value?.fitTextHeight(id);
    } finally {
      endHistoryBatch();
    }
  });
}

function handleToggleLock() {
  if (selectedElementId.value) {
    toggleLock(selectedElementId.value);
  }
}

function handleAlign(
  direction: "left" | "center-h" | "right" | "top" | "center-v" | "bottom",
) {
  // Несколько выбранных — двигаем всё выделение целиком (раньше двигался
  // только первый элемент)
  if (selectedElementIds.value.size > 1) {
    alignSelectionToCanvas(Array.from(selectedElementIds.value), direction);
  } else if (selectedElementId.value) {
    alignElement(selectedElementId.value, direction);
  }
}

// Изменения нескольких элементов из панели — один шаг Undo
function handleUpdateMany(
  changes: { id: string; updates: Partial<TemplateElement> }[],
) {
  if (changes.length === 0) return;
  const textIds = changes
    .filter((c) => Object.keys(c.updates).some((k) => TEXT_LAYOUT_PROPS.includes(k)))
    .map((c) => c.id);
  beginHistoryBatch();
  changes.forEach((c) => updateElement(c.id, c.updates));
  if (textIds.length === 0) {
    endHistoryBatch();
    return;
  }
  // Текст стал крупнее/длиннее — подгоняем высоту блоков
  nextTick(() => {
    try {
      textIds.forEach((id) => canvasRef.value?.fitTextHeight(id));
    } finally {
      endHistoryBatch();
    }
  });
}

// Выбор по типу — без расширения до групп, иначе в выделение попадут другие типы
function handleSelectIds(ids: string[]) {
  selectMultipleElements(ids, false);
}

// Выделить все элементы того же типа на текущей странице
function handleSelectSameType(type: TemplateElement["type"]) {
  const ids = (activePage.value?.elements ?? [])
    .filter((el) => el.type === type)
    .map((el) => el.id);
  if (ids.length) selectMultipleElements(ids, false);
}

// ── Группы ──
function handleGroup() {
  if (!selectionGroupState.value.canGroup) return;
  groupElements(Array.from(selectedElementIds.value));
}

function handleUngroup() {
  if (!selectionGroupState.value.canUngroup) return;
  ungroupElements(Array.from(selectedElementIds.value));
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
  deleteElements(Array.from(selectedElementIds.value));
  clearSelection();
}

function handleDuplicateMultiple() {
  duplicateSelected();
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
  duplicateSelected();
}

function handleBringToFront() {
  const ids =
    selectedElementIds.value.size > 0
      ? Array.from(selectedElementIds.value)
      : selectedElementId.value
        ? [selectedElementId.value]
        : [];

  beginHistoryBatch();
  ids.forEach((id) => bringToFront(id));
  endHistoryBatch();
}

function handleSendToBack() {
  const ids =
    selectedElementIds.value.size > 0
      ? Array.from(selectedElementIds.value)
      : selectedElementId.value
        ? [selectedElementId.value]
        : [];

  beginHistoryBatch();
  ids.forEach((id) => sendToBack(id));
  endHistoryBatch();
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

.canvas-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.canvas-area {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.canvas-container {
  position: absolute;
  inset: 0;
  overflow: auto;
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

.canvas-area.with-rulers .canvas-container {
  top: 20px;
  left: 20px;
}

.canvas-container.pan-ready,
.canvas-container.pan-ready :deep(*) {
  cursor: grab !important;
}

.canvas-container.is-panning,
.canvas-container.is-panning :deep(*) {
  cursor: grabbing !important;
  user-select: none;
}

/* Сцена: лист по центру, а если он больше окна — прокручивается целиком
   (margin: auto вместо justify-content, чтобы не обрезался левый/верхний край) */
.canvas-stage {
  display: flex;
  box-sizing: border-box;
  min-width: 100%;
  min-height: 100%;
  width: max-content;
  padding: 48px;
}

.canvas-frame {
  margin: auto;
  flex-shrink: 0;
}

.ruler-corner {
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: var(--color-gray-400);
  background: var(--color-gray-50);
  border-right: 1px solid var(--color-gray-300);
  border-bottom: 1px solid var(--color-gray-300);
  box-sizing: border-box;
}

:root.dark .ruler-corner {
  background: var(--color-gray-800);
  border-color: var(--color-gray-600);
}

/* Подсказка по навигации */
.nav-hint {
  position: absolute;
  left: 32px;
  bottom: 12px;
  z-index: 6;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.875rem;
  max-width: calc(100% - 64px);
  padding: 0.375rem 0.5rem 0.375rem 0.75rem;
  font-size: 0.75rem;
  color: var(--color-gray-600);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--color-gray-200);
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.nav-hint b {
  font-weight: 600;
  color: var(--color-gray-800);
}

:root.dark .nav-hint {
  color: var(--color-gray-300);
  background: rgba(31, 41, 55, 0.92);
  border-color: var(--color-gray-700);
}

:root.dark .nav-hint b {
  color: white;
}

.nav-hint-close {
  display: flex;
  padding: 0.25rem;
  border: none;
  background: transparent;
  color: var(--color-gray-400);
  border-radius: 0.25rem;
  cursor: pointer;
}

.nav-hint-close:hover {
  color: var(--color-gray-700);
  background: var(--color-gray-100);
}

/* Панель страниц */
.pages-panel {
  flex-shrink: 0;
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

.status-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-gray-500);
  font-weight: 500;
  padding-left: 1rem;
  border-left: 1px solid var(--color-gray-200);
  white-space: nowrap;
}

:root.dark .status-info {
  border-color: var(--color-gray-700);
}

.status-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-variant-numeric: tabular-nums;
}

.status-item small {
  font-size: 0.75rem;
  color: var(--color-gray-400);
}

.status-item.cursor-pos {
  min-width: 7.5rem;
}

/* Выпадающие меню в шапке */
.dropdown {
  position: relative;
}

.zoom-label-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 64px;
  height: 32px;
  padding: 0 0.5rem;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-gray-700);
  background: var(--color-gray-100);
  border: 1px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
}

.zoom-label-btn:hover,
.zoom-label-btn.active {
  border-color: var(--color-gray-300);
}

:root.dark .zoom-label-btn {
  color: var(--color-gray-200);
  background: var(--color-gray-700);
}

.toolbar-btn.wide {
  width: auto;
  padding: 0 0.5rem;
  gap: 0.125rem;
}

.toolbar-btn.toggled,
.toolbar-btn.active {
  background: #dbeafe;
  color: #2563eb;
}

:root.dark .toolbar-btn.toggled,
:root.dark .toolbar-btn.active {
  background: rgba(59, 130, 246, 0.25);
  color: #93c5fd;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  min-width: 200px;
  padding: 0.375rem;
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.625rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
}

:root.dark .dropdown-menu {
  background: var(--color-gray-800);
  border-color: var(--color-gray-700);
}

.view-menu {
  min-width: 260px;
}

.menu-item,
.menu-check,
.menu-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.4375rem 0.625rem;
  font-size: 0.8125rem;
  color: var(--color-gray-700);
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  text-align: left;
  cursor: pointer;
}

.menu-item span,
.menu-check span,
.menu-field span {
  flex: 1;
}

.menu-item:hover,
.menu-check:hover {
  background: var(--color-gray-100);
}

.menu-item.current {
  color: #2563eb;
  font-weight: 600;
}

:root.dark .menu-item,
:root.dark .menu-check,
:root.dark .menu-field {
  color: var(--color-gray-200);
}

:root.dark .menu-item:hover,
:root.dark .menu-check:hover {
  background: var(--color-gray-700);
}

.menu-check input {
  accent-color: #3b82f6;
}

.menu-field {
  cursor: default;
}

.menu-field select,
.menu-field input {
  width: 120px;
  padding: 0.25rem 0.375rem;
  font-size: 0.8125rem;
  color: inherit;
  background: white;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.375rem;
}

.menu-field input {
  width: 64px;
}

:root.dark .menu-field select,
:root.dark .menu-field input {
  background: var(--color-gray-900);
  border-color: var(--color-gray-600);
}

.menu-divider {
  height: 1px;
  margin: 0.375rem 0;
  background: var(--color-gray-200);
}

:root.dark .menu-divider {
  background: var(--color-gray-700);
}

.menu-note {
  margin: 0.25rem 0.625rem 0.25rem;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-gray-500);
}

kbd {
  display: inline-block;
  padding: 0.0625rem 0.375rem;
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-gray-600);
  background: var(--color-gray-100);
  border: 1px solid var(--color-gray-300);
  border-bottom-width: 2px;
  border-radius: 0.25rem;
  white-space: nowrap;
}

:root.dark kbd {
  color: var(--color-gray-300);
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
}

/* Справка по горячим клавишам */
.shortcuts-modal {
  width: min(880px, 94vw);
  max-height: 86vh;
  overflow: auto;
  padding: 1.25rem 1.5rem 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  animation: modalSlideIn 0.2s ease;
}

:root.dark .shortcuts-modal {
  background: var(--color-gray-800);
}

.shortcuts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.shortcuts-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-900);
}

:root.dark .shortcuts-header h3 {
  color: white;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.shortcuts-grid h4 {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-gray-500);
}

.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.3125rem 0;
  font-size: 0.8125rem;
  color: var(--color-gray-700);
  border-bottom: 1px solid var(--color-gray-100);
}

:root.dark .shortcut-row {
  color: var(--color-gray-300);
  border-color: var(--color-gray-700);
}

.shortcut-row .keys {
  display: inline-flex;
  gap: 0.25rem;
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
