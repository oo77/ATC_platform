/**
 * Composable для визуального редактора сертификатов
 * Управляет состоянием холста, элементами и историей изменений
 */

import { ref, computed, shallowRef, watch } from "vue";
import type {
  CertificateTemplateData,
  CertificatePage,
  TemplateElement,
  TextElement,
  VariableElement,
  ImageElement,
  QRElement,
  ShapeElement,
  TemplateLayout,
  TemplateBackground,
  VariableSource,
} from "~/types/certificate";
import { LAYOUT_DIMENSIONS } from "~/types/certificate";

// Доступные переменные для вставки
export const AVAILABLE_VARIABLES: {
  key: VariableSource;
  label: string;
  placeholder: string;
}[] = [
  // Студент
  {
    key: "student.fullName",
    label: "ФИО студента",
    placeholder: "Иванов Иван Иванович",
  },
  {
    key: "student.shortName",
    label: "ФИО сокращённо",
    placeholder: "Иванов И.И.",
  },
  {
    key: "student.firstLastName",
    label: "ФИ (IVANOV IVAN)",
    placeholder: "IVANOV IVAN",
  },
  { key: "student.lastName", label: "Фамилия", placeholder: "Иванов" },
  { key: "student.firstName", label: "Имя", placeholder: "Иван" },
  { key: "student.middleName", label: "Отчество", placeholder: "Иванович" },
  {
    key: "student.organization",
    label: "Организация",
    placeholder: 'ООО "Компания"',
  },
  {
    key: "student.organizationUz",
    label: "Организация (UZ)",
    placeholder: 'MChJ "Kompaniya"',
  },
  {
    key: "student.organizationEn",
    label: "Organization (EN)",
    placeholder: 'LLC "Company"',
  },
  {
    key: "student.organizationRu",
    label: "Организация (RU)",
    placeholder: 'ООО "Компания"',
  },
  { key: "student.position", label: "Должность", placeholder: "Инженер" },
  {
    key: "student.department",
    label: "Отдел",
    placeholder: "Отдел разработки",
  },
  { key: "student.pinfl", label: "ПИНФЛ", placeholder: "12345678901234" },
  {
    key: "student.averageScore",
    label: "Средний балл (числом)",
    placeholder: "86.5",
  },
  // Курс
  {
    key: "course.name",
    label: "Название курса",
    placeholder: "Охрана труда и техника безопасности",
  },
  {
    key: "course.shortName",
    label: "Краткое название курса",
    placeholder: "ОТиТБ",
  },
  { key: "course.code", label: "Код курса", placeholder: "OT-001" },
  { key: "course.totalHours", label: "Общее кол-во часов", placeholder: "72" },
  {
    key: "course.description",
    label: "Описание курса",
    placeholder: "Курс по охране труда...",
  },
  // Группа
  { key: "group.code", label: "Код группы", placeholder: "GR-2025-001" },
  {
    key: "group.startDate",
    label: "Дата начала обучения",
    placeholder: "01.12.2025",
  },
  {
    key: "group.endDate",
    label: "Дата окончания обучения",
    placeholder: "26.12.2025",
  },
  { key: "group.classroom", label: "Аудитория", placeholder: "Ауд. 101" },
  // Сертификат
  {
    key: "certificate.number",
    label: "Номер сертификата",
    placeholder: "CERT25-0001",
  },
  {
    key: "certificate.issueDate",
    label: "Дата выдачи",
    placeholder: "26.12.2025",
  },
  {
    key: "certificate.issueDateFormatted",
    label: "Дата выдачи (прописью)",
    placeholder: "26 декабря 2025 года",
  },
  {
    key: "certificate.issueDateEn",
    label: "Дата выдачи (англ.)",
    placeholder: "November 18, 2026",
  },
  {
    key: "certificate.theoryDate",
    label: "Дата теоретического обучения",
    placeholder: "10.11.2026",
  },
  {
    key: "certificate.practiceDate",
    label: "Дата проведения практического занятия",
    placeholder: "17.11.2026",
  },
  // Инструктор
  {
    key: "instructor.fullName",
    label: "ФИО инструктора",
    placeholder: "Петров Петр Петрович",
  },
  {
    key: "instructor.shortNameRu",
    label: "ФИО инструктора сокращённо (RU)",
    placeholder: "Петров П.П.",
  },
  {
    key: "instructor.shortNameUz",
    label: "ФИО инструктора сокращённо (UZ)",
    placeholder: "Petrov P.P.",
  },
  {
    key: "instructor.position",
    label: "Должность инструктора",
    placeholder: "Инструктор-методист",
  },
  // Аттестация
  {
    key: "attestation.examScore",
    label: "Балл аттестационного экзамена",
    placeholder: "85%",
  },
  {
    key: "attestation.examDate",
    label: "Дата решения комиссии",
    placeholder: "13.08.2026",
  },
  {
    key: "attestation.groupName",
    label: "Название группы аттестации",
    placeholder: "Сертификационный экзамен инструкторов ПАБ",
  },
  {
    key: "attestation.chairmanName",
    label: "Ф.И.О. председателя комиссии",
    placeholder: "О.М. Мусаев",
  },
  {
    key: "attestation.chairmanPosition",
    label: "Должность председателя комиссии",
    placeholder: "Директор ООО «Airports Training Center»",
  },
];

// Доступные шрифты (реэкспорт из useGoogleFonts)
import { ALL_FONTS } from "./useGoogleFonts";
export const AVAILABLE_FONTS = ALL_FONTS;

// Цвета по умолчанию для палитры
export const DEFAULT_COLORS = [
  "#000000",
  "#333333",
  "#666666",
  "#999999",
  "#CCCCCC",
  "#FFFFFF",
  "#1E3A5F",
  "#2563EB",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#0D9488",
  "#0891B2",
  "#4F46E5",
  "#C026D3",
  "#E11D48",
  "#EA580C",
];

/**
 * Генерация уникального ID
 */
function generateId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Генерация ID страницы
 */
function generatePageId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Создание пустой страницы
 */
export function createEmptyPage(): CertificatePage {
  return {
    id: generatePageId(),
    background: {
      type: "color",
      value: "#FFFFFF",
    },
    elements: [],
  };
}

/**
 * Создание пустого шаблона
 */
export function createEmptyTemplate(
  layout: TemplateLayout = "A4_landscape",
): CertificateTemplateData {
  const dimensions = layout === "custom" 
    ? LAYOUT_DIMENSIONS.A4_landscape 
    : LAYOUT_DIMENSIONS[layout];
  return {
    version: "2.0",
    layout,
    width: dimensions.width,
    height: dimensions.height,
    pages: [createEmptyPage()],
  };
}

/**
 * Миграция старых шаблонов v1 → v2
 */
export function migrateLegacyData(
  data: any,
): CertificateTemplateData {
  // Уже v2 — проверяем, что страницы валидны
  if (Array.isArray(data.pages) && data.pages.length > 0) {
    return data as CertificateTemplateData;
  }
  // v1 — переносим legacy background + elements в pages[0]
  const legacyPage: CertificatePage = {
    id: generatePageId(),
    background: data.background ?? { type: "color", value: "#FFFFFF" },
    elements: Array.isArray(data.elements) ? data.elements : [],
  };
  return {
    version: "2.0",
    layout: data.layout ?? "A4_landscape",
    width: data.width ?? 1123,
    height: data.height ?? 794,
    pages: [legacyPage],
  };
}

/**
 * Создание текстового элемента
 */
export function createTextElement(
  options: Partial<TextElement> = {},
): TextElement {
  return {
    id: generateId(),
    type: "text",
    x: options.x ?? 100,
    y: options.y ?? 100,
    width: options.width ?? 300,
    height: options.height ?? 50,
    rotation: options.rotation ?? 0,
    zIndex: options.zIndex ?? 1,
    locked: options.locked ?? false,
    content: options.content ?? "Новый текст",
    fontFamily: options.fontFamily ?? "Inter",
    fontSize: options.fontSize ?? 24,
    fontWeight: options.fontWeight ?? "normal",
    fontStyle: options.fontStyle ?? "normal",
    textAlign: options.textAlign ?? "center",
    color: options.color ?? "#000000",
    lineHeight: options.lineHeight ?? 1.2,
    backgroundColor: options.backgroundColor ?? "transparent",
  };
}

/**
 * Создание элемента переменной
 */
export function createVariableElement(
  variableKey: VariableSource,
  options: Partial<VariableElement> = {},
): VariableElement {
  const variable = AVAILABLE_VARIABLES.find((v) => v.key === variableKey);
  return {
    id: generateId(),
    type: "variable",
    x: options.x ?? 100,
    y: options.y ?? 100,
    width: options.width ?? 350,
    height: options.height ?? 40,
    rotation: options.rotation ?? 0,
    zIndex: options.zIndex ?? 1,
    locked: options.locked ?? false,
    variableKey,
    placeholder: variable?.placeholder ?? "[Переменная]",
    fontFamily: options.fontFamily ?? "Inter",
    fontSize: options.fontSize ?? 20,
    fontWeight: options.fontWeight ?? "bold",
    fontStyle: options.fontStyle ?? "normal",
    textAlign: options.textAlign ?? "center",
    color: options.color ?? "#1E3A5F",
    lineHeight: options.lineHeight ?? 1.2,
    backgroundColor: options.backgroundColor ?? "transparent",
  };
}

/**
 * Создание элемента изображения
 */
export function createImageElement(
  src: string,
  options: Partial<ImageElement> = {},
): ImageElement {
  return {
    id: generateId(),
    type: "image",
    x: options.x ?? 50,
    y: options.y ?? 50,
    width: options.width ?? 150,
    height: options.height ?? 150,
    rotation: options.rotation ?? 0,
    zIndex: options.zIndex ?? 0,
    locked: options.locked ?? false,
    src,
    objectFit: options.objectFit ?? "contain",
    opacity: options.opacity ?? 1,
  };
}

/**
 * Создание элемента QR-кода
 */
export function createQRElement(options: Partial<QRElement> = {}): QRElement {
  return {
    id: generateId(),
    type: "qr",
    x: options.x ?? 50,
    y: options.y ?? 50,
    width: options.width ?? 100,
    height: options.height ?? 100,
    rotation: options.rotation ?? 0,
    zIndex: options.zIndex ?? 1,
    locked: options.locked ?? false,
    dataSource: options.dataSource ?? "certificate_url",
    customData: options.customData,
    size: options.size ?? 100,
    color: options.color ?? "#000000",
    backgroundColor: options.backgroundColor ?? "#FFFFFF",
  };
}

/**
 * Создание элемента фигуры
 */
export function createShapeElement(
  shapeType: "rectangle" | "circle" | "line",
  options: Partial<ShapeElement> = {},
): ShapeElement {
  return {
    id: generateId(),
    type: "shape",
    x: options.x ?? 100,
    y: options.y ?? 100,
    width: options.width ?? 200,
    height: options.height ?? 100,
    rotation: options.rotation ?? 0,
    zIndex: options.zIndex ?? 0,
    locked: options.locked ?? false,
    shapeType,
    fillColor: options.fillColor ?? "transparent",
    strokeColor: options.strokeColor ?? "#000000",
    strokeWidth: options.strokeWidth ?? 2,
  };
}

/**
 * Основной composable редактора
 */
export function useCertificateEditor() {
  // Данные шаблона
  const templateData = ref<CertificateTemplateData>(createEmptyTemplate());

  // Индекс активной страницы
  const activePageIndex = ref<number>(0);

  // Множественный выбор элементов
  const selectedElementIds = ref<Set<string>>(new Set());

  // История изменений для Undo/Redo: снимки состояний ДО изменения
  const undoStack = ref<string[]>([]);
  const redoStack = ref<string[]>([]);
  const maxHistoryLength = 50;
  // Пока идёт пакетная операция (перетаскивание, ресайз, выравнивание группы),
  // промежуточные изменения не пишутся в историю — только один снимок в начале
  let historyBatchDepth = 0;
  let historyBatchSnapshot: string | null = null;

  // Флаги состояния
  const isDirty = ref(false);
  const isLoading = ref(false);
  const isSaving = ref(false);

  // Масштаб холста
  const zoom = ref(1);
  const minZoom = 0.1;
  const maxZoom = 4;
  const ZOOM_PRESETS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4];

  // ── Вычисляемые свойства страниц ────────────────────────────

  /** Активная страница */
  const activePage = computed(() => {
    const pages = templateData.value.pages;
    const idx = Math.min(activePageIndex.value, pages.length - 1);
    return pages[idx] ?? pages[0];
  });

  /** Элементы активной страницы */
  const activePageElements = computed(() => activePage.value?.elements ?? []);

  /** Фон активной страницы */
  const activePageBackground = computed(
    () => activePage.value?.background ?? { type: "color", value: "#FFFFFF" },
  );

  /** Количество страниц */
  const pagesCount = computed(() => templateData.value.pages.length);

  // ── Вычисляемые свойства элементов (из активной страницы) ───

  const selectedElements = computed(() => {
    if (selectedElementIds.value.size === 0) return [];
    return activePageElements.value.filter((el: TemplateElement) =>
      selectedElementIds.value.has(el.id),
    );
  });

  const selectedElementId = computed(() => {
    const ids = Array.from(selectedElementIds.value);
    return ids.length > 0 ? ids[0] : null;
  });

  const selectedElement = computed(() => {
    if (!selectedElementId.value) return null;
    return (
      activePageElements.value.find(
        (el: TemplateElement) => el.id === selectedElementId.value,
      ) ?? null
    );
  });

  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);
  const elementsCount = computed(() => activePageElements.value.length);

  // ── История ─────────────────────────────────────────────────

  function snapshot(): string {
    return JSON.stringify(templateData.value);
  }

  function pushUndo(state: string) {
    undoStack.value.push(state);
    if (undoStack.value.length > maxHistoryLength) {
      undoStack.value.shift();
    }
    redoStack.value = [];
  }

  /** Вызывается ПЕРЕД изменением данных */
  function saveToHistory() {
    isDirty.value = true;
    if (historyBatchDepth > 0) return;
    pushUndo(snapshot());
  }

  /** Начать пакетную операцию: все изменения до endHistoryBatch — один шаг Undo */
  function beginHistoryBatch() {
    if (historyBatchDepth === 0) {
      historyBatchSnapshot = snapshot();
    }
    historyBatchDepth++;
  }

  function endHistoryBatch() {
    if (historyBatchDepth === 0) return;
    historyBatchDepth--;
    if (historyBatchDepth > 0) return;
    const before = historyBatchSnapshot;
    historyBatchSnapshot = null;
    // Клик без перемещения не должен создавать пустой шаг истории
    if (before !== null && before !== snapshot()) {
      pushUndo(before);
      isDirty.value = true;
    }
  }

  function restoreSnapshot(state: string) {
    templateData.value = JSON.parse(state);
    if (activePageIndex.value >= templateData.value.pages.length) {
      activePageIndex.value = templateData.value.pages.length - 1;
    }
    // Удаляем из выделения элементы, которых больше нет
    const ids = new Set(getActivePageElements().map((el) => el.id));
    selectedElementIds.value.forEach((id) => {
      if (!ids.has(id)) selectedElementIds.value.delete(id);
    });
    isDirty.value = true;
  }

  function undo() {
    const prev = undoStack.value.pop();
    if (prev === undefined) return;
    redoStack.value.push(snapshot());
    restoreSnapshot(prev);
  }

  function redo() {
    const next = redoStack.value.pop();
    if (next === undefined) return;
    undoStack.value.push(snapshot());
    restoreSnapshot(next);
  }

  // ── Инициализация ────────────────────────────────────────────

  function initTemplate(data?: CertificateTemplateData | any) {
    // Автоматическая миграция v1 → v2
    const migrated = data ? migrateLegacyData(data) : createEmptyTemplate();
    templateData.value = JSON.parse(JSON.stringify(migrated));

    undoStack.value = [];
    redoStack.value = [];
    historyBatchDepth = 0;
    historyBatchSnapshot = null;
    activePageIndex.value = 0;
    selectedElementIds.value.clear();
    isDirty.value = false;
  }

  // ── Макет и размеры ──────────────────────────────────────────

  function setLayout(
    layout: TemplateLayout,
    customWidth?: number,
    customHeight?: number,
  ) {
    saveToHistory();
    if (layout === "custom") {
      templateData.value.layout = layout;
      if (customWidth !== undefined && customHeight !== undefined) {
        templateData.value.width = customWidth;
        templateData.value.height = customHeight;
      }
    } else {
      const dimensions = LAYOUT_DIMENSIONS[layout];
      templateData.value.layout = layout;
      templateData.value.width = dimensions.width;
      templateData.value.height = dimensions.height;
    }
  }

  function setCustomDimensions(width: number, height: number, saveHistory: boolean = true) {
    if (saveHistory) saveToHistory();
    templateData.value.width = Math.max(200, Math.min(5000, width));
    templateData.value.height = Math.max(200, Math.min(5000, height));
    if (templateData.value.layout !== "custom") {
      templateData.value.layout = "custom";
    }
  }

  // ── Фон активной страницы ────────────────────────────────────

  function setBackground(background: TemplateBackground) {
    saveToHistory();
    const idx = Math.min(activePageIndex.value, templateData.value.pages.length - 1);
    const page = templateData.value.pages[idx];
    if (page) {
      page.background = background;
    }
  }

  // ── Управление страницами ────────────────────────────────────

  /** Добавить пустую страницу после текущей */
  function addPage() {
    saveToHistory();
    const newPage = createEmptyPage();
    templateData.value.pages.push(newPage);
    activePageIndex.value = templateData.value.pages.length - 1;
    selectedElementIds.value.clear();
  }

  /** Удалить страницу по индексу (нельзя удалить последнюю) */
  function removePage(index: number) {
    if (templateData.value.pages.length <= 1) return;
    saveToHistory();
    templateData.value.pages.splice(index, 1);
    // Корректируем активный индекс
    if (activePageIndex.value >= templateData.value.pages.length) {
      activePageIndex.value = templateData.value.pages.length - 1;
    }
    selectedElementIds.value.clear();
  }

  /** Дублировать страницу */
  function duplicatePage(index: number) {
    saveToHistory();
    const source = templateData.value.pages[index];
    if (!source) return;
    const copy: CertificatePage = {
      ...JSON.parse(JSON.stringify(source)),
      id: generatePageId(),
    };
    // Генерируем новые ID для всех элементов копии
    copy.elements = copy.elements.map((el: TemplateElement) => ({
      ...el,
      id: generateId(),
    }));
    templateData.value.pages.splice(index + 1, 0, copy);
    activePageIndex.value = index + 1;
    selectedElementIds.value.clear();
  }

  /** Переключить активную страницу */
  function setActivePage(index: number) {
    if (index < 0 || index >= templateData.value.pages.length) return;
    activePageIndex.value = index;
    selectedElementIds.value.clear();
  }

  function reorderPages(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    saveToHistory();
    const pages = templateData.value.pages;
    const [moved] = pages.splice(fromIndex, 1);
    if (moved) {
      pages.splice(toIndex, 0, moved);
    }
    activePageIndex.value = toIndex;
  }

  // ── Утилита ─────────────────────────────────────────────────

  /** Геттер элементов активной страницы (мутабельно) */
  function getActivePageElements(): TemplateElement[] {
    const idx = Math.min(activePageIndex.value, templateData.value.pages.length - 1);
    return templateData.value.pages[idx]?.elements ?? [];
  }

  // ── Операции с элементами ───────────────────────────────────

  function addElement(element: TemplateElement) {
    saveToHistory();
    const els = getActivePageElements();
    const maxZIndex = Math.max(0, ...els.map((el: TemplateElement) => el.zIndex));
    element.zIndex = maxZIndex + 1;
    els.push(element);
    selectedElementIds.value.clear();
    selectedElementIds.value.add(element.id);
  }

  function updateElement(id: string, updates: Partial<TemplateElement>) {
    const els = getActivePageElements();
    const index = els.findIndex((el: TemplateElement) => el.id === id);
    if (index === -1) return;
    saveToHistory();
    els[index] = { ...els[index], ...updates } as TemplateElement;
  }

  function deleteElement(id: string) {
    saveToHistory();
    const idx = Math.min(activePageIndex.value, templateData.value.pages.length - 1);
    const page = templateData.value.pages[idx];
    if (page) {
      page.elements = page.elements.filter(
        (el: TemplateElement) => el.id !== id,
      );
    }
    if (selectedElementIds.value.has(id)) {
      selectedElementIds.value.delete(id);
    }
  }

  /** Удалить несколько элементов одним шагом истории */
  function deleteElements(ids: string[]) {
    if (ids.length === 0) return;
    saveToHistory();
    const idx = Math.min(activePageIndex.value, templateData.value.pages.length - 1);
    const page = templateData.value.pages[idx];
    if (page) {
      const toDelete = new Set(ids);
      page.elements = page.elements.filter(
        (el: TemplateElement) => !toDelete.has(el.id),
      );
    }
    ids.forEach((id) => selectedElementIds.value.delete(id));
  }

  /** Сдвинуть элементы на dx/dy (стрелки клавиатуры), не выходя за холст */
  function nudgeElements(ids: string[], dx: number, dy: number) {
    const els = getActivePageElements();
    const targets = els.filter(
      (el: TemplateElement) => ids.includes(el.id) && !el.locked,
    );
    if (targets.length === 0) return;
    saveToHistory();
    const { width, height } = templateData.value;
    targets.forEach((el) => {
      const index = els.indexOf(el);
      els[index] = {
        ...el,
        x: Math.max(0, Math.min(width - el.width, el.x + dx)),
        y: Math.max(0, Math.min(height - el.height, el.y + dy)),
      } as TemplateElement;
    });
  }

  function deleteSelectedElement() {
    if (selectedElementId.value) deleteElement(selectedElementId.value);
  }

  function duplicateElement(id: string) {
    const element = getActivePageElements().find((el: TemplateElement) => el.id === id);
    if (!element) return;
    const newElement = {
      ...JSON.parse(JSON.stringify(element)),
      id: generateId(),
      x: element.x + 20,
      y: element.y + 20,
    };
    addElement(newElement);
  }

  function bringToFront(id: string) {
    const els = getActivePageElements();
    const maxZIndex = Math.max(...els.map((el: TemplateElement) => el.zIndex));
    updateElement(id, { zIndex: maxZIndex + 1 });
  }

  function sendToBack(id: string) {
    const els = getActivePageElements();
    const minZIndex = Math.min(...els.map((el: TemplateElement) => el.zIndex));
    updateElement(id, { zIndex: minZIndex - 1 });
  }

  function toggleLock(id: string) {
    const element = getActivePageElements().find((el: TemplateElement) => el.id === id);
    if (element) updateElement(id, { locked: !element.locked });
  }

  // Выбор элемента/элементов
  function selectElement(id: string | null, multiSelect: boolean = false) {
    if (id === null) {
      selectedElementIds.value.clear();
      return;
    }

    if (multiSelect) {
      // Множественный выбор с Ctrl/Cmd
      if (selectedElementIds.value.has(id)) {
        selectedElementIds.value.delete(id);
      } else {
        selectedElementIds.value.add(id);
      }
    } else {
      // Одиночный выбор
      selectedElementIds.value.clear();
      selectedElementIds.value.add(id);
    }
  }

  // Выбор нескольких элементов (например, при выделении рамкой)
  function selectMultipleElements(ids: string[]) {
    selectedElementIds.value.clear();
    ids.forEach((id) => selectedElementIds.value.add(id));
  }

  // Добавить элементы к текущему выбору
  function addToSelection(ids: string[]) {
    ids.forEach((id) => selectedElementIds.value.add(id));
  }

  // Снять выделение со всех элементов
  function clearSelection() {
    selectedElementIds.value.clear();
  }

  function updateMultipleElements(
    ids: string[],
    updates: Partial<TemplateElement>,
  ) {
    saveToHistory();
    const els = getActivePageElements();
    ids.forEach((id) => {
      const index = els.findIndex((el: TemplateElement) => el.id === id);
      const el = els[index];
      if (el && !el.locked) {
        els[index] = { ...el, ...updates } as TemplateElement;
      }
    });
  }

  function alignMultipleElements(
    ids: string[],
    direction: "left" | "center-h" | "right" | "top" | "center-v" | "bottom",
  ) {
    if (ids.length < 2) return;
    const elements = getActivePageElements().filter(
      (el: TemplateElement) => ids.includes(el.id) && !el.locked,
    );
    if (elements.length < 2) return;
    beginHistoryBatch();
    let referenceValue: number;
    switch (direction) {
      case "left":
        referenceValue = Math.min(...elements.map((el) => el.x));
        elements.forEach((el) => updateElement(el.id, { x: referenceValue }));
        break;
      case "center-h":
        const avgCenterX =
          elements.reduce((sum, el) => sum + el.x + el.width / 2, 0) / elements.length;
        elements.forEach((el) => updateElement(el.id, { x: avgCenterX - el.width / 2 }));
        break;
      case "right":
        referenceValue = Math.max(...elements.map((el) => el.x + el.width));
        elements.forEach((el) => updateElement(el.id, { x: referenceValue - el.width }));
        break;
      case "top":
        referenceValue = Math.min(...elements.map((el) => el.y));
        elements.forEach((el) => updateElement(el.id, { y: referenceValue }));
        break;
      case "center-v":
        const avgCenterY =
          elements.reduce((sum, el) => sum + el.y + el.height / 2, 0) / elements.length;
        elements.forEach((el) => updateElement(el.id, { y: avgCenterY - el.height / 2 }));
        break;
      case "bottom":
        referenceValue = Math.max(...elements.map((el) => el.y + el.height));
        elements.forEach((el) => updateElement(el.id, { y: referenceValue - el.height }));
        break;
    }
    endHistoryBatch();
  }

  function distributeElements(
    ids: string[],
    direction: "horizontal" | "vertical",
  ) {
    if (ids.length < 3) return;
    const elements = getActivePageElements()
      .filter((el: TemplateElement) => ids.includes(el.id) && !el.locked)
      .sort((a, b) => (direction === "horizontal" ? a.x - b.x : a.y - b.y));
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (elements.length < 3 || !first || !last) return;
    beginHistoryBatch();
    if (direction === "horizontal") {
      const totalSpace = last.x - (first.x + first.width);
      const gap = totalSpace / (elements.length - 1);
      let currentX = first.x + first.width + gap;
      for (let i = 1; i < elements.length - 1; i++) {
        const el = elements[i];
        if (el) {
          updateElement(el.id, { x: currentX });
          currentX += el.width + gap;
        }
      }
    } else {
      const totalSpace = last.y - (first.y + first.height);
      const gap = totalSpace / (elements.length - 1);
      let currentY = first.y + first.height + gap;
      for (let i = 1; i < elements.length - 1; i++) {
        const el = elements[i];
        if (el) {
          updateElement(el.id, { y: currentY });
          currentY += el.height + gap;
        }
      }
    }
    endHistoryBatch();
  }

  // Изменение масштаба
  function setZoom(value: number) {
    zoom.value = Math.min(maxZoom, Math.max(minZoom, value));
  }

  // Кнопки +/- переходят к следующему «круглому» значению масштаба
  function zoomIn() {
    const next = ZOOM_PRESETS.find((z) => z > zoom.value + 0.001);
    setZoom(next ?? maxZoom);
  }

  function zoomOut() {
    const prev = [...ZOOM_PRESETS].reverse().find((z) => z < zoom.value - 0.001);
    setZoom(prev ?? minZoom);
  }

  function resetZoom() {
    zoom.value = 1;
  }

  function alignElement(
    id: string,
    direction: "left" | "center-h" | "right" | "top" | "center-v" | "bottom",
  ) {
    const element = getActivePageElements().find(
      (el: TemplateElement) => el.id === id,
    );
    if (!element || element.locked) return;
    const canvasWidth = templateData.value.width;
    const canvasHeight = templateData.value.height;
    let updates: Partial<TemplateElement> = {};
    switch (direction) {
      case "left": updates.x = 0; break;
      // Блок шире холста (например, 800 px при холсте 794) не уходит в минус: X = 0, а не -3
      case "center-h": updates.x = Math.max(0, (canvasWidth - element.width) / 2); break;
      case "right": updates.x = canvasWidth - element.width; break;
      case "top": updates.y = 0; break;
      case "center-v": updates.y = Math.max(0, (canvasHeight - element.height) / 2); break;
      case "bottom": updates.y = canvasHeight - element.height; break;
    }
    updateElement(id, updates);
  }

  // Экспорт данных для сохранения
  function exportData(): CertificateTemplateData {
    return JSON.parse(JSON.stringify(templateData.value));
  }

  /**
   * Загрузить фоновое изображение
   * @param file - Файл изображения
   * @param templateId - ID шаблона
   * @returns URL загруженного изображения
   */
  async function uploadBackgroundImage(
    file: File,
    templateId: string,
  ): Promise<string> {
    const formData = new FormData();
    formData.append("background", file);

    const { authFetch } = useAuthFetch();
    const response = await authFetch<{
      success: boolean;
      url: string;
      message: string;
    }>(`/api/certificates/templates/${templateId}/upload-background`, {
      method: "POST",
      body: formData,
    });

    if (!response.success) {
      throw new Error(response.message || "Ошибка загрузки изображения");
    }

    return response.url;
  }

  /**
   * Загрузить изображение элемента (логотип, печать и т.д.)
   * @param file - Файл изображения
   * @param templateId - ID шаблона
   * @returns URL загруженного изображения
   */
  async function uploadElementImage(
    file: File,
    templateId: string,
  ): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);

    const { authFetch } = useAuthFetch();
    const response = await authFetch<{
      success: boolean;
      url: string;
      message: string;
    }>(`/api/certificates/templates/${templateId}/upload-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.success) {
      throw new Error(response.message || "Ошибка загрузки изображения");
    }

    return response.url;
  }

  return {
    // Состояние
    templateData,
    selectedElementId,
    selectedElement,
    selectedElementIds,
    selectedElements,
    zoom,
    isDirty,
    isLoading,
    isSaving,

    // Страницы
    activePageIndex,
    activePage,
    activePageElements,
    activePageBackground,
    pagesCount,

    // Вычисляемые
    canUndo,
    canRedo,
    elementsCount,

    // Методы инициализации
    initTemplate,
    exportData,

    // Методы истории
    undo,
    redo,
    saveToHistory,
    beginHistoryBatch,
    endHistoryBatch,

    // Методы макета и фона
    setLayout,
    setCustomDimensions,
    setBackground,

    // Методы страниц
    addPage,
    removePage,
    duplicatePage,
    setActivePage,
    reorderPages,

    // Методы элементов
    addElement,
    updateElement,
    updateMultipleElements,
    deleteElement,
    deleteSelectedElement,
    deleteElements,
    nudgeElements,
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

    // Методы масштаба
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,

    // Методы загрузки изображений
    uploadBackgroundImage,
    uploadElementImage,

    // Константы
    minZoom,
    maxZoom,
    ZOOM_PRESETS,
  };
}
