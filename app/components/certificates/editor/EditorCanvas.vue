<template>
  <div
    class="canvas-wrapper"
    :style="{
      width: `${templateData.width * zoom}px`,
      height: `${templateData.height * zoom}px`,
    }"
    @mousedown="handleCanvasMouseDown"
  >
    <div
      class="canvas-content"
      :style="{
        width: `${templateData.width}px`,
        height: `${templateData.height}px`,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }"
    >
      <!-- Фон — отдельным слоем, чтобы перемещение элементов не перерисовывало его -->
      <div class="background-layer" :style="{ background: backgroundStyle }" />

      <!-- Ручки изменения размера холста -->
      <template v-if="!isDragging && !isSelecting && selectedElementIds.size === 0">
        <div class="canvas-resize-handle right" @mousedown.stop="handleCanvasResizeStart($event, 'right')"></div>
        <div class="canvas-resize-handle bottom" @mousedown.stop="handleCanvasResizeStart($event, 'bottom')"></div>
        <div class="canvas-resize-handle bottom-right" @mousedown.stop="handleCanvasResizeStart($event, 'bottom-right')"></div>
      </template>

      <!-- Сетка -->
      <div v-if="showGrid" class="grid-layer" :style="gridStyle" />

      <!-- Поля печати и центральные оси -->
      <template v-if="showMargins">
        <div
          class="margin-frame"
          :style="{
            left: `${marginPx}px`,
            top: `${marginPx}px`,
            right: `${marginPx}px`,
            bottom: `${marginPx}px`,
            borderWidth: `${1 / zoom}px`,
          }"
        />
        <div class="center-axis vertical" :style="{ width: `${1 / zoom}px` }" />
        <div class="center-axis horizontal" :style="{ height: `${1 / zoom}px` }" />
      </template>

      <!-- Направляющие линии -->
      <div
        v-if="guides.vertical.length > 0 || guides.horizontal.length > 0"
        class="guides-layer"
      >
        <div
          v-for="(guide, index) in guides.vertical"
          :key="`v-${index}`"
          class="guide guide-vertical"
          :style="{ left: `${guide.position}px` }"
        >
          <span class="guide-label">{{ Math.round(guide.position) }}</span>
        </div>
        <div
          v-for="(guide, index) in guides.horizontal"
          :key="`h-${index}`"
          class="guide guide-horizontal"
          :style="{ top: `${guide.position}px` }"
        >
          <span class="guide-label">{{ Math.round(guide.position) }}</span>
        </div>
        <!-- Метки расстояний -->
        <div
          v-for="(distance, index) in guides.distances"
          :key="`d-${index}`"
          class="distance-label"
          :style="{
            left: `${distance.x}px`,
            top: `${distance.y}px`,
          }"
        >
          {{ Math.round(distance.value) }}px
        </div>
      </div>

      <!-- Рамки выделенных групп -->
      <div
        v-for="box in selectedGroupBoxes"
        :key="box.groupId"
        class="group-box"
        :style="{
          left: `${box.left}px`,
          top: `${box.top}px`,
          width: `${box.right - box.left}px`,
          height: `${box.bottom - box.top}px`,
          borderWidth: `${1.5 / zoom}px`,
        }"
      >
        <span class="group-label" :style="{ fontSize: `${11 / zoom}px` }">
          Группа · {{ box.count }}
        </span>
      </div>

      <!-- Рамка выделения -->
      <div
        v-if="selectionBox"
        class="selection-box"
        :style="{
          left: `${selectionBox.x}px`,
          top: `${selectionBox.y}px`,
          width: `${selectionBox.width}px`,
          height: `${selectionBox.height}px`,
        }"
      />

      <!-- Элементы сортируются по zIndex -->
      <div
        v-for="element in sortedElements"
        :key="element.id"
        class="canvas-element"
        :class="{
          selected: selectedElementIds.has(element.id),
          locked: element.locked,
        }"
        :style="getElementStyle(element)"
        @mousedown.stop="handleMouseDown($event, element)"
        @dblclick.stop="handleDoubleClick(element)"
      >
        <!-- Текстовый элемент -->
        <template v-if="element.type === 'text'">
          <div
            class="text-content"
            :style="getTextStyle(element as TextElement)"
            :data-text-id="element.id"
          >
            <!-- Редактор: отдельный узел без дочерних vnode — его содержимым
                 управляет только браузер (текст задаётся при входе в режим).
                 plaintext-only: Enter = новая строка, вставка — только текст. -->
            <div
              v-if="editingId === element.id"
              class="text-body text-editor"
              contenteditable="plaintext-only"
              spellcheck="false"
              @input="handleTextInput(element as TextElement)"
              @paste="handleTextPaste"
              @keydown="handleTextKeydown"
              @blur="handleTextBlur(element as TextElement)"
            ></div>
            <!-- Список -->
            <div
              v-else-if="isList(element as TextElement)"
              class="text-body text-list"
            ><div
                v-for="(item, idx) in getListItems(element as TextElement)"
                :key="idx"
                class="list-item"
              ><span
                  class="list-marker"
                  :style="{ width: getListIndent(element as TextElement) }"
                >{{ item.marker }}</span><span class="list-text">{{ item.text || " " }}</span></div></div>
            <div v-else class="text-body">{{ (element as TextElement).content }}</div>
          </div>
        </template>

        <!-- Переменная -->
        <template v-else-if="element.type === 'variable'">
          <div
            class="variable-content"
            :style="getTextStyle(element as VariableElement)"
          >
            <span class="variable-badge">{{
              getVariableLabel((element as VariableElement).variableKey)
            }}</span>
            {{ (element as VariableElement).placeholder }}
          </div>
        </template>

        <!-- Изображение -->
        <template v-else-if="element.type === 'image'">
          <img
            :src="(element as ImageElement).src"
            :style="{
              width: '100%',
              height: '100%',
              objectFit: (element as ImageElement).objectFit,
              opacity: (element as ImageElement).opacity,
            }"
            draggable="false"
          />
        </template>

        <!-- QR-код -->
        <template v-else-if="element.type === 'qr'">
          <div
            class="qr-placeholder"
            :style="{ background: (element as QRElement).backgroundColor }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="80%"
              height="80%"
              viewBox="0 0 24 24"
              fill="none"
              :stroke="(element as QRElement).color"
              stroke-width="1.5"
            >
              <rect width="5" height="5" x="3" y="3" rx="1" />
              <rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" />
              <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
              <path d="M21 21v.01" />
              <path d="M12 7v3a2 2 0 0 1-2 2H7" />
              <path d="M3 12h.01" />
              <path d="M12 3h.01" />
              <path d="M12 16v.01" />
              <path d="M16 12h1" />
              <path d="M21 12v.01" />
              <path d="M12 21v-1" />
            </svg>
            <span class="qr-label">QR</span>
          </div>
        </template>

        <!-- Фигура -->
        <template v-else-if="element.type === 'shape'">
          <svg
            class="shape-svg"
            :width="element.width"
            :height="element.height"
          >
            <rect
              v-if="(element as ShapeElement).shapeType === 'rectangle'"
              x="0"
              y="0"
              :width="element.width"
              :height="element.height"
              :fill="(element as ShapeElement).fillColor"
              :stroke="(element as ShapeElement).strokeColor"
              :stroke-width="(element as ShapeElement).strokeWidth"
            />
            <ellipse
              v-else-if="(element as ShapeElement).shapeType === 'circle'"
              :cx="element.width / 2"
              :cy="element.height / 2"
              :rx="
                element.width / 2 - (element as ShapeElement).strokeWidth / 2
              "
              :ry="
                element.height / 2 - (element as ShapeElement).strokeWidth / 2
              "
              :fill="(element as ShapeElement).fillColor"
              :stroke="(element as ShapeElement).strokeColor"
              :stroke-width="(element as ShapeElement).strokeWidth"
            />
            <line
              v-else-if="(element as ShapeElement).shapeType === 'line'"
              x1="0"
              y1="0"
              :x2="element.width"
              :y2="element.height"
              :stroke="(element as ShapeElement).strokeColor"
              :stroke-width="(element as ShapeElement).strokeWidth"
            />
          </svg>
        </template>

        <!-- Ручки изменения размера (только для одиночного выбранного элемента) -->
        <template
          v-if="
            selectedElementIds.has(element.id) &&
            selectedElementIds.size === 1 &&
            !element.locked
          "
        >
          <div
            class="resize-handle nw"
            @mousedown.stop="handleResizeStart($event, element, 'nw')"
          ></div>
          <div
            class="resize-handle ne"
            @mousedown.stop="handleResizeStart($event, element, 'ne')"
          ></div>
          <div
            class="resize-handle sw"
            @mousedown.stop="handleResizeStart($event, element, 'sw')"
          ></div>
          <div
            class="resize-handle se"
            @mousedown.stop="handleResizeStart($event, element, 'se')"
          ></div>
          <div
            class="resize-handle n"
            @mousedown.stop="handleResizeStart($event, element, 'n')"
          ></div>
          <div
            class="resize-handle s"
            @mousedown.stop="handleResizeStart($event, element, 's')"
          ></div>
          <div
            class="resize-handle e"
            @mousedown.stop="handleResizeStart($event, element, 'e')"
          ></div>
          <div
            class="resize-handle w"
            @mousedown.stop="handleResizeStart($event, element, 'w')"
          ></div>
        </template>

        <!-- Иконка блокировки -->
        <div v-if="element.locked" class="lock-indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <!-- Индикатор множественного выбора -->
        <div
          v-if="
            selectedElementIds.has(element.id) && selectedElementIds.size > 1
          "
          class="multi-select-indicator"
        >
          {{ Array.from(selectedElementIds).indexOf(element.id) + 1 }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onBeforeUnmount } from "vue";
import { AVAILABLE_VARIABLES } from "~/composables/useCertificateEditor";
import type {
  CertificateTemplateData,
  CertificatePage,
  TemplateElement,
  TextElement,
  VariableElement,
  ImageElement,
  QRElement,
  ShapeElement,
  VariableSource,
} from "~/types/certificate";

const props = defineProps<{
  templateData: CertificateTemplateData;
  activePage: CertificatePage;
  selectedElementIds: Set<string>;
  zoom: number;
  showGrid?: boolean;
  gridSize?: number;
  snapToGrid?: boolean;
  showMargins?: boolean;
  marginPx?: number;
}>();

const emit = defineEmits<{
  /** ignoreGroup — Alt+клик: выбрать один элемент внутри группы */
  (e: "select", id: string | null, multiSelect: boolean, ignoreGroup?: boolean): void;
  (e: "select-multiple", ids: string[]): void;
  (e: "update-element", id: string, updates: Partial<TemplateElement>): void;
  (
    e: "update-multiple",
    ids: string[],
    updates: Partial<TemplateElement>,
  ): void;
  (e: "delete-element", id: string): void;
  (e: "set-custom-dimensions", width: number, height: number, saveHistory: boolean): void;
  // Начало/конец перетаскивания или ресайза — всё между ними один шаг Undo
  (e: "transform-start"): void;
  (e: "transform-end"): void;
}>();

const isTransforming = ref(false);

function startTransform() {
  if (isTransforming.value) return;
  isTransforming.value = true;
  emit("transform-start");
}

function endTransform() {
  if (!isTransforming.value) return;
  isTransforming.value = false;
  emit("transform-end");
}

const gridStep = computed(() => Math.max(2, props.gridSize ?? 20));

const gridStyle = computed(() => {
  const step = gridStep.value;
  // Толщина линии компенсирует масштаб, чтобы сетка не пропадала при уменьшении
  const line = `${1 / props.zoom}px`;
  const major = step * 5;
  return {
    backgroundImage: [
      `linear-gradient(to right, rgba(59,130,246,0.28) ${line}, transparent ${line})`,
      `linear-gradient(to bottom, rgba(59,130,246,0.28) ${line}, transparent ${line})`,
      `linear-gradient(to right, rgba(59,130,246,0.12) ${line}, transparent ${line})`,
      `linear-gradient(to bottom, rgba(59,130,246,0.12) ${line}, transparent ${line})`,
    ].join(","),
    backgroundSize: `${major}px ${major}px, ${major}px ${major}px, ${step}px ${step}px, ${step}px ${step}px`,
  };
});

function snapValue(value: number): number {
  const step = gridStep.value;
  return Math.round(value / step) * step;
}

const editingId = ref<string | null>(null);

/** Рамки групп, у которых выделен хотя бы один участник */
const selectedGroupBoxes = computed(() => {
  const groups = new Map<string, TemplateElement[]>();
  for (const el of props.activePage.elements) {
    if (!el.groupId) continue;
    if (!groups.has(el.groupId)) groups.set(el.groupId, []);
    groups.get(el.groupId)!.push(el);
  }
  const pad = 4;
  const boxes: {
    groupId: string;
    left: number;
    top: number;
    right: number;
    bottom: number;
    count: number;
  }[] = [];
  groups.forEach((members, groupId) => {
    if (members.length < 2) return;
    if (!members.some((el) => props.selectedElementIds.has(el.id))) return;
    boxes.push({
      groupId,
      left: Math.min(...members.map((el) => el.x)) - pad,
      top: Math.min(...members.map((el) => el.y)) - pad,
      right: Math.max(...members.map((el) => el.x + el.width)) + pad,
      bottom: Math.max(...members.map((el) => el.y + el.height)) + pad,
      count: members.length,
    });
  });
  return boxes;
});

// Редактируемый элемент исчез без blur (удалён, смена страницы, Undo) —
// выходим из режима и закрываем шаг истории, иначе Undo «зависнет».
function abortTextEditing() {
  if (editingId.value === null) return;
  editingId.value = null;
  emit("transform-end");
}

watch(
  () =>
    editingId.value !== null &&
    !props.activePage.elements.some((el) => el.id === editingId.value),
  (gone) => {
    if (gone) abortTextEditing();
  },
);

onBeforeUnmount(abortTextEditing);

// Состояние для drag & drop
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragInitialPositions = ref<Map<string, { x: number; y: number }>>(
  new Map(),
);

// Состояние для resize
const isResizing = ref(false);
const resizeHandle = ref<string>("");
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const resizeStartWidth = ref(0);
const resizeStartHeight = ref(0);
const resizeStartElX = ref(0);
const resizeStartElY = ref(0);
const resizeElement = ref<TemplateElement | null>(null);

// Состояние для изменения размера холста
const isCanvasResizing = ref(false);
const canvasResizeHandle = ref("");
const canvasResizeStartX = ref(0);
const canvasResizeStartY = ref(0);
const canvasResizeStartWidth = ref(0);
const canvasResizeStartHeight = ref(0);

// Состояние для рамки выделения
const isSelecting = ref(false);
const selectionBox = ref<{
  x: number;
  y: number;
  width: number;
  height: number;
} | null>(null);
const selectionStartX = ref(0);
const selectionStartY = ref(0);

// Направляющие линии
interface Guide {
  position: number;
  type: "edge" | "center";
}

interface Distance {
  x: number;
  y: number;
  value: number;
}

const guides = ref<{
  vertical: Guide[];
  horizontal: Guide[];
  distances: Distance[];
}>({
  vertical: [],
  horizontal: [],
  distances: [],
});

const SNAP_THRESHOLD = 8; // Порог привязки в пикселях

// Сортировка элементов по zIndex (из активной страницы)
const sortedElements = computed(() => {
  return [...props.activePage.elements].sort((a, b) => a.zIndex - b.zIndex);
});

// Стиль фона (из активной страницы)
const backgroundStyle = computed(() => {
  const bg = props.activePage.background;
  if (!bg) return "#FFFFFF";
  if (bg.type === "color") return bg.value;
  if (bg.type === "image") return `url(${bg.value}) center/cover no-repeat`;
  return "#FFFFFF";
});

// Получение стиля элемента
function getElementStyle(element: TemplateElement) {
  return {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
  };
}

// Получение стиля текста
function getTextStyle(element: TextElement | VariableElement) {
  const justifyMap: Record<string, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
    justify: "flex-start",
  };

  return {
    fontFamily: element.fontFamily,
    fontSize: `${element.fontSize}px`,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textAlign: element.textAlign,
    justifyContent: justifyMap[element.textAlign] || "flex-start",
    color: element.color,
    lineHeight: element.lineHeight,
    backgroundColor: element.backgroundColor || "transparent",
  };
}

// ── Списки в текстовом элементе: каждая непустая строка — пункт ──
function isList(element: TextElement) {
  return !!element.listStyle && element.listStyle !== "none";
}

function getListItems(element: TextElement) {
  let n = 0;
  return (element.content || "").split("\n").map((line) => {
    if (!line.trim()) return { marker: "", text: "" };
    n++;
    return { marker: element.listStyle === "number" ? `${n}.` : "•", text: line };
  });
}

// Отступ под маркер (те же значения использует генератор PDF/HTML)
function getListIndent(element: TextElement) {
  return element.listStyle === "number" ? "1.6em" : "1.1em";
}

// Получение метки переменной
function getVariableLabel(key: VariableSource): string {
  const variable = AVAILABLE_VARIABLES.find((v) => v.key === key);
  if (!variable) return key;

  const parts = key.split(".");
  const firstPart = parts[0];
  return firstPart ? firstPart.charAt(0).toUpperCase() : "V";
}

// Вычисление направляющих линий
function calculateGuides(
  movingElements: TemplateElement[],
  newX: number,
  newY: number,
) {
  guides.value = { vertical: [], horizontal: [], distances: [] };

  if (movingElements.length === 0) return;

  const movingElement = movingElements[0];
  if (!movingElement) return;

  const movingRight = newX + movingElement.width;
  const movingBottom = newY + movingElement.height;
  const movingCenterX = newX + movingElement.width / 2;
  const movingCenterY = newY + movingElement.height / 2;

  // Направляющие относительно других элементов
  props.activePage.elements.forEach((el) => {
    if (movingElements.some((me) => me.id === el.id)) return;

    const elRight = el.x + el.width;
    const elBottom = el.y + el.height;
    const elCenterX = el.x + el.width / 2;
    const elCenterY = el.y + el.height / 2;

    // Вертикальные направляющие
    if (Math.abs(newX - el.x) < SNAP_THRESHOLD) {
      guides.value.vertical.push({ position: el.x, type: "edge" });
    }
    if (Math.abs(movingRight - elRight) < SNAP_THRESHOLD) {
      guides.value.vertical.push({ position: elRight, type: "edge" });
    }
    if (Math.abs(movingCenterX - elCenterX) < SNAP_THRESHOLD) {
      guides.value.vertical.push({ position: elCenterX, type: "center" });
    }

    // Горизонтальные направляющие
    if (Math.abs(newY - el.y) < SNAP_THRESHOLD) {
      guides.value.horizontal.push({ position: el.y, type: "edge" });
    }
    if (Math.abs(movingBottom - elBottom) < SNAP_THRESHOLD) {
      guides.value.horizontal.push({ position: elBottom, type: "edge" });
    }
    if (Math.abs(movingCenterY - elCenterY) < SNAP_THRESHOLD) {
      guides.value.horizontal.push({ position: elCenterY, type: "center" });
    }

    // Расстояния между элементами
    if (Math.abs(newY - elBottom) < 100 && Math.abs(newX - el.x) < 50) {
      const distance = Math.abs(newY - elBottom);
      guides.value.distances.push({
        x: el.x + el.width / 2,
        y: (newY + elBottom) / 2,
        value: distance,
      });
    }
  });

  // Направляющие относительно холста
  if (Math.abs(newX) < SNAP_THRESHOLD) {
    guides.value.vertical.push({ position: 0, type: "edge" });
  }
  if (Math.abs(newY) < SNAP_THRESHOLD) {
    guides.value.horizontal.push({ position: 0, type: "edge" });
  }
  if (Math.abs(movingRight - props.templateData.width) < SNAP_THRESHOLD) {
    guides.value.vertical.push({
      position: props.templateData.width,
      type: "edge",
    });
  }
  if (Math.abs(movingBottom - props.templateData.height) < SNAP_THRESHOLD) {
    guides.value.horizontal.push({
      position: props.templateData.height,
      type: "edge",
    });
  }
}

// Применение привязки к направляющим
function applySnapping(
  x: number,
  y: number,
  element: TemplateElement,
): { x: number; y: number } {
  let snappedX = x;
  let snappedY = y;

  const right = x + element.width;
  const bottom = y + element.height;
  const centerX = x + element.width / 2;
  const centerY = y + element.height / 2;

  // Привязка по вертикали
  for (const guide of guides.value.vertical) {
    if (Math.abs(x - guide.position) < SNAP_THRESHOLD) {
      snappedX = guide.position;
      break;
    }
    if (Math.abs(right - guide.position) < SNAP_THRESHOLD) {
      snappedX = guide.position - element.width;
      break;
    }
    if (Math.abs(centerX - guide.position) < SNAP_THRESHOLD) {
      snappedX = guide.position - element.width / 2;
      break;
    }
  }

  // Привязка по горизонтали
  for (const guide of guides.value.horizontal) {
    if (Math.abs(y - guide.position) < SNAP_THRESHOLD) {
      snappedY = guide.position;
      break;
    }
    if (Math.abs(bottom - guide.position) < SNAP_THRESHOLD) {
      snappedY = guide.position - element.height;
      break;
    }
    if (Math.abs(centerY - guide.position) < SNAP_THRESHOLD) {
      snappedY = guide.position - element.height / 2;
      break;
    }
  }

  return { x: snappedX, y: snappedY };
}

// Обработка клика на холсте
function handleCanvasMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  if (
    e.target === e.currentTarget ||
    (e.target as HTMLElement).classList.contains("canvas-content")
  ) {
    // Начало выделения рамкой
    isSelecting.value = true;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    selectionStartX.value = (e.clientX - rect.left) / props.zoom;
    selectionStartY.value = (e.clientY - rect.top) / props.zoom;

    if (!e.ctrlKey && !e.metaKey) {
      emit("select", null, false);
    }

    document.addEventListener("mousemove", handleSelectionMove);
    document.addEventListener("mouseup", handleSelectionEnd);
  }
}

// Обработка движения при выделении рамкой
function handleSelectionMove(e: MouseEvent) {
  if (!isSelecting.value) return;

  const canvas = document.querySelector(".canvas-wrapper") as HTMLElement;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const currentX = (e.clientX - rect.left) / props.zoom;
  const currentY = (e.clientY - rect.top) / props.zoom;

  const x = Math.min(selectionStartX.value, currentX);
  const y = Math.min(selectionStartY.value, currentY);
  const width = Math.abs(currentX - selectionStartX.value);
  const height = Math.abs(currentY - selectionStartY.value);

  selectionBox.value = { x, y, width, height };
}

// Завершение выделения рамкой
function handleSelectionEnd() {
  if (isSelecting.value && selectionBox.value) {
    const box = selectionBox.value;
    const selectedIds: string[] = [];

    props.activePage.elements.forEach((el) => {
      const elRight = el.x + el.width;
      const elBottom = el.y + el.height;
      const boxRight = box.x + box.width;
      const boxBottom = box.y + box.height;

      // Проверка пересечения
      if (
        el.x < boxRight &&
        elRight > box.x &&
        el.y < boxBottom &&
        elBottom > box.y
      ) {
        selectedIds.push(el.id);
      }
    });

    if (selectedIds.length > 0) {
      emit("select-multiple", selectedIds);
    }
  }

  isSelecting.value = false;
  selectionBox.value = null;
  document.removeEventListener("mousemove", handleSelectionMove);
  document.removeEventListener("mouseup", handleSelectionEnd);
}

// Обработка начала перетаскивания
function handleMouseDown(e: MouseEvent, element: TemplateElement) {
  if (e.button !== 0) return;
  // Во время редактирования текста клики внутри него ставят курсор, а не тащат блок
  if (editingId.value === element.id) return;
  if (element.locked) {
    emit("select", element.id, e.ctrlKey || e.metaKey, e.altKey);
    return;
  }

  const isMultiSelect = e.ctrlKey || e.metaKey;

  // Alt+клик по участнику группы — выбрать только его (даже если группа выделена)
  if (e.altKey && element.groupId && !isMultiSelect) {
    emit("select", element.id, false, true);
  } else if (!props.selectedElementIds.has(element.id)) {
    // Если элемент не выбран, выбираем его (вместе с группой)
    emit("select", element.id, isMultiSelect, e.altKey);
  }

  isDragging.value = true;
  startTransform();
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;

  // Сохраняем начальные позиции всех выбранных элементов
  dragInitialPositions.value.clear();
  props.activePage.elements.forEach((el) => {
    if (props.selectedElementIds.has(el.id) && !el.locked) {
      dragInitialPositions.value.set(el.id, { x: el.x, y: el.y });
    }
  });

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

// Обработка перетаскивания
function handleMouseMove(e: MouseEvent) {
  if (isDragging.value && dragInitialPositions.value.size > 0) {
    const deltaX = (e.clientX - dragStartX.value) / props.zoom;
    const deltaY = (e.clientY - dragStartY.value) / props.zoom;

    // Находим первый выбранный элемент для расчета направляющих
    const firstSelectedId = Array.from(props.selectedElementIds)[0];
    const firstElement = props.activePage.elements.find(
      (el) => el.id === firstSelectedId,
    );

    if (firstElement) {
      const initialPos = dragInitialPositions.value.get(firstElement.id);
      if (initialPos) {
        let newX = initialPos.x + deltaX;
        let newY = initialPos.y + deltaY;

        // Вычисляем направляющие
        calculateGuides([firstElement], newX, newY);

        // Применяем привязку: к сетке (если включена) или к направляющим
        const snapped = props.snapToGrid
          ? { x: snapValue(newX), y: snapValue(newY) }
          : applySnapping(newX, newY, firstElement);
        const snapDeltaX = snapped.x - newX;
        const snapDeltaY = snapped.y - newY;

        // Перемещаем все выбранные элементы
        dragInitialPositions.value.forEach((initialPos, id) => {
          const element = props.activePage.elements.find((el) => el.id === id);
          if (!element) return;

          let finalX = initialPos.x + deltaX + snapDeltaX;
          let finalY = initialPos.y + deltaY + snapDeltaY;

          // Ограничиваем перемещение границами холста
          finalX = Math.max(
            0,
            Math.min(props.templateData.width - element.width, finalX),
          );
          finalY = Math.max(
            0,
            Math.min(props.templateData.height - element.height, finalY),
          );

          emit("update-element", id, { x: finalX, y: finalY });
        });
      }
    }
  }

  if (isResizing.value && resizeElement.value) {
    handleResize(e);
  }
}

// Завершение перетаскивания
function handleMouseUp() {
  isDragging.value = false;
  dragInitialPositions.value.clear();
  isResizing.value = false;
  resizeElement.value = null;
  guides.value = { vertical: [], horizontal: [], distances: [] };
  endTransform();

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
}

// Начало изменения размера холста
function handleCanvasResizeStart(e: MouseEvent, handle: string) {
  if (e.button !== 0) return;
  isCanvasResizing.value = true;
  startTransform();
  canvasResizeHandle.value = handle;
  canvasResizeStartX.value = e.clientX;
  canvasResizeStartY.value = e.clientY;
  canvasResizeStartWidth.value = props.templateData.width;
  canvasResizeStartHeight.value = props.templateData.height;

  document.addEventListener("mousemove", handleCanvasMouseMove);
  document.addEventListener("mouseup", handleCanvasMouseUp);
}

// Изменение размера холста
function handleCanvasMouseMove(e: MouseEvent) {
  if (!isCanvasResizing.value) return;

  const deltaX = (e.clientX - canvasResizeStartX.value) / props.zoom;
  const deltaY = (e.clientY - canvasResizeStartY.value) / props.zoom;

  let newWidth = canvasResizeStartWidth.value;
  let newHeight = canvasResizeStartHeight.value;

  if (canvasResizeHandle.value.includes("right")) {
    newWidth = canvasResizeStartWidth.value + deltaX;
    if (props.snapToGrid) newWidth = snapValue(newWidth);
    newWidth = Math.max(200, Math.min(5000, newWidth));
  }
  if (canvasResizeHandle.value.includes("bottom")) {
    newHeight = canvasResizeStartHeight.value + deltaY;
    if (props.snapToGrid) newHeight = snapValue(newHeight);
    newHeight = Math.max(200, Math.min(5000, newHeight));
  }

  // Обновляем размер без сохранения в историю
  emit("set-custom-dimensions", newWidth, newHeight, false);
}

// Окончание изменения размера холста
function handleCanvasMouseUp() {
  isCanvasResizing.value = false;
  endTransform();
  document.removeEventListener("mousemove", handleCanvasMouseMove);
  document.removeEventListener("mouseup", handleCanvasMouseUp);
}

// Начало изменения размера
function handleResizeStart(
  e: MouseEvent,
  element: TemplateElement,
  handle: string,
) {
  if (e.button !== 0) return;
  isResizing.value = true;
  startTransform();
  resizeHandle.value = handle;
  resizeStartX.value = e.clientX;
  resizeStartY.value = e.clientY;
  resizeStartWidth.value = element.width;
  resizeStartHeight.value = element.height;
  resizeStartElX.value = element.x;
  resizeStartElY.value = element.y;
  resizeElement.value = element;

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

// Логика изменения размера
function handleResize(e: MouseEvent) {
  if (!resizeElement.value) return;

  const deltaX = (e.clientX - resizeStartX.value) / props.zoom;
  const deltaY = (e.clientY - resizeStartY.value) / props.zoom;

  let newWidth = resizeStartWidth.value;
  let newHeight = resizeStartHeight.value;
  let newX = resizeStartElX.value;
  let newY = resizeStartElY.value;

  const minSize = 20;

  switch (resizeHandle.value) {
    case "se":
      newWidth = Math.max(minSize, resizeStartWidth.value + deltaX);
      newHeight = Math.max(minSize, resizeStartHeight.value + deltaY);
      break;
    case "sw":
      newWidth = Math.max(minSize, resizeStartWidth.value - deltaX);
      newHeight = Math.max(minSize, resizeStartHeight.value + deltaY);
      newX = resizeStartElX.value + (resizeStartWidth.value - newWidth);
      break;
    case "ne":
      newWidth = Math.max(minSize, resizeStartWidth.value + deltaX);
      newHeight = Math.max(minSize, resizeStartHeight.value - deltaY);
      newY = resizeStartElY.value + (resizeStartHeight.value - newHeight);
      break;
    case "nw":
      newWidth = Math.max(minSize, resizeStartWidth.value - deltaX);
      newHeight = Math.max(minSize, resizeStartHeight.value - deltaY);
      newX = resizeStartElX.value + (resizeStartWidth.value - newWidth);
      newY = resizeStartElY.value + (resizeStartHeight.value - newHeight);
      break;
    case "n":
      newHeight = Math.max(minSize, resizeStartHeight.value - deltaY);
      newY = resizeStartElY.value + (resizeStartHeight.value - newHeight);
      break;
    case "s":
      newHeight = Math.max(minSize, resizeStartHeight.value + deltaY);
      break;
    case "e":
      newWidth = Math.max(minSize, resizeStartWidth.value + deltaX);
      break;
    case "w":
      newWidth = Math.max(minSize, resizeStartWidth.value - deltaX);
      newX = resizeStartElX.value + (resizeStartWidth.value - newWidth);
      break;
  }

  // Привязка перемещаемых краёв к сетке
  if (props.snapToGrid) {
    const handle = resizeHandle.value;
    if (handle.includes("e")) {
      newWidth = Math.max(minSize, snapValue(newX + newWidth) - newX);
    }
    if (handle.includes("w")) {
      const right = newX + newWidth;
      newX = Math.min(snapValue(newX), right - minSize);
      newWidth = right - newX;
    }
    if (handle.includes("s")) {
      newHeight = Math.max(minSize, snapValue(newY + newHeight) - newY);
    }
    if (handle.includes("n")) {
      const bottom = newY + newHeight;
      newY = Math.min(snapValue(newY), bottom - minSize);
      newHeight = bottom - newY;
    }
  }

  // Показываем направляющие с размерами
  guides.value.distances = [
    {
      x: newX + newWidth / 2,
      y: newY - 20,
      value: newWidth,
    },
    {
      x: newX - 40,
      y: newY + newHeight / 2,
      value: newHeight,
    },
  ];

  emit("update-element", resizeElement.value.id, {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  });
}

// ── Редактирование текста прямо на холсте ─────────────────────
// Высота блока на момент входа в редактирование: при удалении строк
// блок сжимается не ниже неё, при добавлении — растёт по содержимому.
let editStartHeight = 0;

function getTextContainer(id: string): HTMLElement | null {
  return document.querySelector(
    `.text-content[data-text-id="${CSS.escape(id)}"]`,
  ) as HTMLElement | null;
}

function getEditor(id: string): HTMLElement | null {
  return getTextContainer(id)?.querySelector(".text-editor") as HTMLElement | null;
}

/** Высота, нужная тексту элемента (в px шаблона, без учёта зума) */
function measureTextHeight(id: string): number | null {
  const container = getTextContainer(id);
  const body = container?.querySelector(".text-body") as HTMLElement | null;
  if (!container || !body) return null;
  const cs = getComputedStyle(container);
  const padding = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  // offsetHeight не зависит от transform: scale(zoom) холста
  return Math.ceil(body.offsetHeight + padding);
}

/**
 * Подогнать высоту текстового блока под содержимое.
 * minHeight — нижняя граница (по умолчанию: только рост, без сжатия).
 */
function fitTextHeight(id: string, minHeight?: number) {
  const element = props.activePage.elements.find((el) => el.id === id);
  if (!element || element.type !== "text" || element.locked) return;
  const needed = measureTextHeight(id);
  if (!needed) return;
  const target = Math.max(needed, minHeight ?? element.height);
  if (Math.abs(target - element.height) >= 1) {
    emit("update-element", id, { height: target });
  }
}

defineExpose({ fitTextHeight });

/** Текст редактора: innerText сохраняет переносы строк (br / \n) */
function readEditorText(editor: HTMLElement): string {
  return editor.innerText
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    // браузер добавляет служебный перенос в конце после Enter
    .replace(/\n$/, "");
}

// Двойной клик для редактирования текста
function handleDoubleClick(element: TemplateElement) {
  if (element.type !== "text" || element.locked) return;
  // Двойной клик внутри уже открытого редактора — выделение слова, а не перезапуск
  if (editingId.value === element.id) return;
  // Всё редактирование (текст + авто-высота) — один шаг Undo
  emit("transform-start");
  editStartHeight = element.height;
  editingId.value = element.id;
  nextTick(() => {
    const editor = getEditor(element.id);
    if (!editor) return;
    // Текст задаём вручную: Vue не управляет содержимым редактора
    editor.textContent = (element as TextElement).content || "";
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
}

// Ввод: блок растёт вместе с текстом, сжимается не ниже исходной высоты
function handleTextInput(element: TextElement) {
  fitTextHeight(element.id, editStartHeight);
}

// Вставка из буфера — только простой текст, с сохранением переносов строк
function handleTextPaste(e: ClipboardEvent) {
  e.preventDefault();
  const text = (e.clipboardData?.getData("text/plain") || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, " ");
  if (!text) return;
  // insertText сохраняет нативную историю Ctrl+Z браузера и вызывает input
  if (!document.execCommand("insertText", false, text)) {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    (e.target as HTMLElement).dispatchEvent(new Event("input", { bubbles: true }));
  }
}

// Enter — новая строка (по умолчанию браузера); Esc или Ctrl+Enter — завершить
function handleTextKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) {
    e.preventDefault();
    (e.target as HTMLElement).blur();
  }
}

// Завершение редактирования: сохраняем текст и подгоняем высоту
function handleTextBlur(element: TextElement) {
  if (editingId.value !== element.id) return;
  const editor = getEditor(element.id);
  const newContent = editor ? readEditorText(editor) : element.content;
  if (newContent !== element.content) {
    emit("update-element", element.id, { content: newContent });
  }
  fitTextHeight(element.id, editStartHeight);
  editingId.value = null;
  emit("transform-end");
}
</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.canvas-content {
  position: relative;
  background: white;
}

/*
 * Фон на собственном слое композиции: браузер растеризует его один раз на масштаб.
 * Иначе каждое перемещение элемента перерисовывает фон, и с большой картинкой
 * (фон 7280×10292 px) перетаскивание падало до ~3 кадров в секунду.
 */
.background-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: transform;
}

/* Сетка и поля печати поверх элементов, но не перехватывают мышь */
.grid-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 9990;
}

.margin-frame {
  position: absolute;
  border-style: dashed;
  border-color: rgba(236, 72, 153, 0.7);
  pointer-events: none;
  z-index: 9991;
}

.center-axis {
  position: absolute;
  pointer-events: none;
  z-index: 9991;
  background: rgba(236, 72, 153, 0.45);
}

.center-axis.vertical {
  top: 0;
  bottom: 0;
  left: 50%;
}

.center-axis.horizontal {
  left: 0;
  right: 0;
  top: 50%;
}

/* Направляющие линии */
.guides-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.guide {
  position: absolute;
  background: #3b82f6;
  pointer-events: none;
}

.guide-vertical {
  width: 1px;
  height: 100%;
  top: 0;
}

.guide-horizontal {
  height: 1px;
  width: 100%;
  left: 0;
}

.guide-label {
  position: absolute;
  background: #3b82f6;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 2px;
  white-space: nowrap;
}

.guide-vertical .guide-label {
  top: 4px;
  left: 4px;
}

.guide-horizontal .guide-label {
  left: 4px;
  top: 4px;
}

.distance-label {
  position: absolute;
  background: #10b981;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Рамка выделения */
.selection-box {
  position: absolute;
  border: 2px dashed #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  pointer-events: none;
  z-index: 9998;
}

.canvas-element {
  position: absolute;
  cursor: move;
  user-select: none;
  border: 2px solid transparent;
  transition: border-color 0.15s;
}

.canvas-element:hover:not(.locked) {
  border-color: rgba(59, 130, 246, 0.3);
}

.canvas-element.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.canvas-element.locked {
  cursor: default;
  opacity: 0.8;
}

.canvas-element.locked.selected {
  border-color: #9ca3af;
  border-style: dashed;
}

/* Текст */
.text-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Рамка группы */
.group-box {
  position: absolute;
  border: 1.5px dashed #8b5cf6;
  border-radius: 2px;
  pointer-events: none;
  z-index: 9998;
}

.group-label {
  position: absolute;
  left: 0;
  bottom: 100%;
  padding: 0 0.35em;
  line-height: 1.5;
  white-space: nowrap;
  color: #fff;
  background: #8b5cf6;
  border-radius: 2px 2px 0 0;
}

/* Тело текста — единственный flex-потомок: блоки внутри идут строками,
   а не колонками, выравнивание задаёт text-align */
.text-body {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 1em;
}

.text-editor {
  outline: none;
  cursor: text;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2px;
}

.list-item {
  display: flex;
}

.list-marker {
  flex-shrink: 0;
  text-align: left;
}

.list-text {
  flex: 1;
  min-width: 0;
}


/* Переменная */
.variable-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  border-radius: 4px;
  position: relative;
}

.variable-badge {
  position: absolute;
  top: -8px;
  left: 4px;
  background: #4f46e5;
  color: white;
  font-size: 8px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  text-transform: uppercase;
}

/* QR-код */
.qr-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #9ca3af;
  border-radius: 4px;
}

.qr-label {
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  margin-top: 4px;
}

/* Фигуры */
.shape-svg {
  display: block;
}

/* Ручки изменения размера */
.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 2px;
  z-index: 10;
}

.resize-handle.nw {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}
.resize-handle.ne {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}
.resize-handle.sw {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}
.resize-handle.se {
  bottom: -5px;
  right: -5px;
  cursor: nwse-resize;
}
.resize-handle.n {
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.resize-handle.s {
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.resize-handle.e {
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ew-resize;
}
.resize-handle.w {
  left: -5px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ew-resize;
}

/* Индикатор блокировки */
.lock-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #6b7280;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Индикатор множественного выбора */
.multi-select-indicator {
  position: absolute;
  top: -10px;
  left: -10px;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Ручки изменения размера холста */
.canvas-resize-handle {
  position: absolute;
  background-color: white;
  border: 2px solid #3b82f6;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: background-color 0.15s, transform 0.1s;
}
.canvas-resize-handle:hover {
  background-color: #3b82f6;
}
.canvas-resize-handle:active {
  transform: scale(1.1);
  background-color: #2563eb;
}
.canvas-resize-handle.right {
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 32px;
  border-radius: 6px;
  cursor: ew-resize;
}
.canvas-resize-handle.right:active {
  transform: translateY(-50%) scale(1.1);
}
.canvas-resize-handle.bottom {
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 14px;
  border-radius: 6px;
  cursor: ns-resize;
}
.canvas-resize-handle.bottom:active {
  transform: translateX(-50%) scale(1.1);
}
.canvas-resize-handle.bottom-right {
  right: -8px;
  bottom: -8px;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
  border-radius: 50%;
}
</style>
