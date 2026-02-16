/**
 * Composable для визуального редактора сертификатов
 * Управляет состоянием холста, элементами и историей изменений
 */

import { ref, computed, shallowRef, watch } from "vue";
import type {
  CertificateTemplateData,
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
  // Инструктор
  {
    key: "instructor.fullName",
    label: "ФИО инструктора",
    placeholder: "Петров Петр Петрович",
  },
  {
    key: "instructor.shortName",
    label: "ФИО инструктора (сокращённо)",
    placeholder: "Петров П.П.",
  },
  {
    key: "instructor.position",
    label: "Должность инструктора",
    placeholder: "Инструктор-методист",
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
 * Создание пустого шаблона
 */
export function createEmptyTemplate(
  layout: TemplateLayout = "A4_landscape",
): CertificateTemplateData {
  const dimensions = LAYOUT_DIMENSIONS[layout];
  return {
    version: "1.0",
    layout,
    width: dimensions.width,
    height: dimensions.height,
    background: {
      type: "color",
      value: "#FFFFFF",
    },
    elements: [],
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

  // Множественный выбор элементов
  const selectedElementIds = ref<Set<string>>(new Set());

  // История изменений для Undo/Redo
  const history = ref<CertificateTemplateData[]>([]);
  const historyIndex = ref<number>(-1);
  const maxHistoryLength = 50;

  // Флаги состояния
  const isDirty = ref(false);
  const isLoading = ref(false);
  const isSaving = ref(false);

  // Масштаб холста
  const zoom = ref(1);
  const minZoom = 0.25;
  const maxZoom = 2;

  // Вычисляемые свойства
  const selectedElements = computed(() => {
    if (selectedElementIds.value.size === 0) return [];
    return templateData.value.elements.filter((el: TemplateElement) =>
      selectedElementIds.value.has(el.id),
    );
  });

  // Для обратной совместимости - первый выбранный элемент
  const selectedElementId = computed(() => {
    const ids = Array.from(selectedElementIds.value);
    return ids.length > 0 ? ids[0] : null;
  });

  const selectedElement = computed(() => {
    if (!selectedElementId.value) return null;
    return (
      templateData.value.elements.find(
        (el: TemplateElement) => el.id === selectedElementId.value,
      ) ?? null
    );
  });

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  const elementsCount = computed(() => templateData.value.elements.length);

  // Сохранение состояния в историю
  function saveToHistory() {
    // Удаляем все состояния после текущего (при новом действии после undo)
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }

    // Добавляем текущее состояние
    history.value.push(JSON.parse(JSON.stringify(templateData.value)));

    // Ограничиваем длину истории
    if (history.value.length > maxHistoryLength) {
      history.value.shift();
    } else {
      historyIndex.value++;
    }

    isDirty.value = true;
  }

  // Отмена действия
  function undo() {
    if (!canUndo.value) return;
    historyIndex.value--;
    templateData.value = JSON.parse(
      JSON.stringify(history.value[historyIndex.value]),
    );
    isDirty.value = true;
  }

  // Повтор действия
  function redo() {
    if (!canRedo.value) return;
    historyIndex.value++;
    templateData.value = JSON.parse(
      JSON.stringify(history.value[historyIndex.value]),
    );
    isDirty.value = true;
  }

  // Инициализация шаблона
  function initTemplate(data?: CertificateTemplateData) {
    if (data) {
      templateData.value = JSON.parse(JSON.stringify(data));
    } else {
      templateData.value = createEmptyTemplate();
    }

    // Сбрасываем историю
    history.value = [JSON.parse(JSON.stringify(templateData.value))];
    historyIndex.value = 0;
    selectedElementIds.value.clear();
    isDirty.value = false;
  }

  // Изменение макета
  function setLayout(
    layout: TemplateLayout,
    customWidth?: number,
    customHeight?: number,
  ) {
    saveToHistory();

    if (layout === "custom") {
      // Для кастомного макета используем переданные размеры или текущие
      templateData.value.layout = layout;
      if (customWidth !== undefined && customHeight !== undefined) {
        templateData.value.width = customWidth;
        templateData.value.height = customHeight;
      }
    } else {
      // Для стандартных макетов используем предопределенные размеры
      const dimensions = LAYOUT_DIMENSIONS[layout];
      templateData.value.layout = layout;
      templateData.value.width = dimensions.width;
      templateData.value.height = dimensions.height;
    }
  }

  // Изменение кастомных размеров
  function setCustomDimensions(width: number, height: number) {
    saveToHistory();
    templateData.value.width = Math.max(200, Math.min(5000, width));
    templateData.value.height = Math.max(200, Math.min(5000, height));
    if (templateData.value.layout !== "custom") {
      templateData.value.layout = "custom";
    }
  }

  // Изменение фона
  function setBackground(background: TemplateBackground) {
    saveToHistory();
    templateData.value.background = background;
  }

  // Добавление элемента
  function addElement(element: TemplateElement) {
    saveToHistory();
    // Устанавливаем zIndex выше всех текущих
    const maxZIndex = Math.max(
      0,
      ...templateData.value.elements.map((el: TemplateElement) => el.zIndex),
    );
    element.zIndex = maxZIndex + 1;
    templateData.value.elements.push(element);
    // Выбираем новый элемент
    selectedElementIds.value.clear();
    selectedElementIds.value.add(element.id);
  }

  // Обновление элемента
  function updateElement(id: string, updates: Partial<TemplateElement>) {
    const index = templateData.value.elements.findIndex(
      (el: TemplateElement) => el.id === id,
    );
    if (index === -1) return;

    saveToHistory();
    templateData.value.elements[index] = {
      ...templateData.value.elements[index],
      ...updates,
    } as TemplateElement;
  }

  // Удаление элемента
  function deleteElement(id: string) {
    saveToHistory();
    templateData.value.elements = templateData.value.elements.filter(
      (el: TemplateElement) => el.id !== id,
    );
    // Убираем из выбора, если был выбран
    if (selectedElementIds.value.has(id)) {
      selectedElementIds.value.delete(id);
    }
  }

  // Удаление выбранного элемента
  function deleteSelectedElement() {
    if (selectedElementId.value) {
      deleteElement(selectedElementId.value);
    }
  }

  // Дублирование элемента
  function duplicateElement(id: string) {
    const element = templateData.value.elements.find(
      (el: TemplateElement) => el.id === id,
    );
    if (!element) return;

    const newElement = {
      ...JSON.parse(JSON.stringify(element)),
      id: generateId(),
      x: element.x + 20,
      y: element.y + 20,
    };

    addElement(newElement);
  }

  // Перемещение элемента на передний план
  function bringToFront(id: string) {
    const maxZIndex = Math.max(
      ...templateData.value.elements.map((el: TemplateElement) => el.zIndex),
    );
    updateElement(id, { zIndex: maxZIndex + 1 });
  }

  // Перемещение элемента на задний план
  function sendToBack(id: string) {
    const minZIndex = Math.min(
      ...templateData.value.elements.map((el: TemplateElement) => el.zIndex),
    );
    updateElement(id, { zIndex: minZIndex - 1 });
  }

  // Блокировка/разблокировка элемента
  function toggleLock(id: string) {
    const element = templateData.value.elements.find(
      (el: TemplateElement) => el.id === id,
    );
    if (element) {
      updateElement(id, { locked: !element.locked });
    }
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

  // Обновление нескольких элементов одновременно
  function updateMultipleElements(
    ids: string[],
    updates: Partial<TemplateElement>,
  ) {
    saveToHistory();
    ids.forEach((id) => {
      const index = templateData.value.elements.findIndex(
        (el: TemplateElement) => el.id === id,
      );
      if (index !== -1 && !templateData.value.elements[index].locked) {
        templateData.value.elements[index] = {
          ...templateData.value.elements[index],
          ...updates,
        } as TemplateElement;
      }
    });
  }

  // Выравнивание нескольких элементов относительно друг друга
  function alignMultipleElements(
    ids: string[],
    direction: "left" | "center-h" | "right" | "top" | "center-v" | "bottom",
  ) {
    if (ids.length < 2) return;

    const elements = templateData.value.elements.filter(
      (el: TemplateElement) => ids.includes(el.id) && !el.locked,
    );
    if (elements.length < 2) return;

    saveToHistory();

    // Находим опорную точку (первый элемент или крайний)
    let referenceValue: number;

    switch (direction) {
      case "left":
        referenceValue = Math.min(...elements.map((el) => el.x));
        elements.forEach((el) => {
          updateElement(el.id, { x: referenceValue });
        });
        break;
      case "center-h":
        const avgCenterX =
          elements.reduce((sum, el) => sum + el.x + el.width / 2, 0) /
          elements.length;
        elements.forEach((el) => {
          updateElement(el.id, { x: avgCenterX - el.width / 2 });
        });
        break;
      case "right":
        referenceValue = Math.max(...elements.map((el) => el.x + el.width));
        elements.forEach((el) => {
          updateElement(el.id, { x: referenceValue - el.width });
        });
        break;
      case "top":
        referenceValue = Math.min(...elements.map((el) => el.y));
        elements.forEach((el) => {
          updateElement(el.id, { y: referenceValue });
        });
        break;
      case "center-v":
        const avgCenterY =
          elements.reduce((sum, el) => sum + el.y + el.height / 2, 0) /
          elements.length;
        elements.forEach((el) => {
          updateElement(el.id, { y: avgCenterY - el.height / 2 });
        });
        break;
      case "bottom":
        referenceValue = Math.max(...elements.map((el) => el.y + el.height));
        elements.forEach((el) => {
          updateElement(el.id, { y: referenceValue - el.height });
        });
        break;
    }
  }

  // Распределение элементов с равными интервалами
  function distributeElements(
    ids: string[],
    direction: "horizontal" | "vertical",
  ) {
    if (ids.length < 3) return;

    const elements = templateData.value.elements
      .filter((el: TemplateElement) => ids.includes(el.id) && !el.locked)
      .sort((a, b) => (direction === "horizontal" ? a.x - b.x : a.y - b.y));

    if (elements.length < 3) return;

    saveToHistory();

    if (direction === "horizontal") {
      const first = elements[0];
      const last = elements[elements.length - 1];
      const totalSpace = last.x - (first.x + first.width);
      const gap = totalSpace / (elements.length - 1);

      let currentX = first.x + first.width + gap;
      for (let i = 1; i < elements.length - 1; i++) {
        updateElement(elements[i].id, { x: currentX });
        currentX += elements[i].width + gap;
      }
    } else {
      const first = elements[0];
      const last = elements[elements.length - 1];
      const totalSpace = last.y - (first.y + first.height);
      const gap = totalSpace / (elements.length - 1);

      let currentY = first.y + first.height + gap;
      for (let i = 1; i < elements.length - 1; i++) {
        updateElement(elements[i].id, { y: currentY });
        currentY += elements[i].height + gap;
      }
    }
  }

  // Изменение масштаба
  function setZoom(value: number) {
    zoom.value = Math.min(maxZoom, Math.max(minZoom, value));
  }

  function zoomIn() {
    setZoom(zoom.value + 0.1);
  }

  function zoomOut() {
    setZoom(zoom.value - 0.1);
  }

  function resetZoom() {
    zoom.value = 1;
  }

  // Выравнивание элемента относительно холста
  function alignElement(
    id: string,
    direction: "left" | "center-h" | "right" | "top" | "center-v" | "bottom",
  ) {
    const element = templateData.value.elements.find(
      (el: TemplateElement) => el.id === id,
    );
    if (!element || element.locked) return;

    const canvasWidth = templateData.value.width;
    const canvasHeight = templateData.value.height;

    let updates: Partial<TemplateElement> = {};

    switch (direction) {
      case "left":
        updates.x = 0;
        break;
      case "center-h":
        updates.x = (canvasWidth - element.width) / 2;
        break;
      case "right":
        updates.x = canvasWidth - element.width;
        break;
      case "top":
        updates.y = 0;
        break;
      case "center-v":
        updates.y = (canvasHeight - element.height) / 2;
        break;
      case "bottom":
        updates.y = canvasHeight - element.height;
        break;
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

    // Методы макета и фона
    setLayout,
    setCustomDimensions,
    setBackground,

    // Методы элементов
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
  };
}
