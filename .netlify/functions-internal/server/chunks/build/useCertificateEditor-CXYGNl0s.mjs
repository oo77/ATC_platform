import { ref, computed } from 'vue';

const LAYOUT_DIMENSIONS = {
  A4_portrait: { width: 794, height: 1123 },
  A4_landscape: { width: 1123, height: 794 },
  letter_portrait: { width: 816, height: 1056 },
  letter_landscape: { width: 1056, height: 816 }
};
const GOOGLE_FONTS = [
  { name: "Inter", weights: [400, 500, 600, 700] },
  { name: "Roboto", weights: [400, 500, 700] },
  { name: "Open Sans", weights: [400, 600, 700] },
  { name: "Montserrat", weights: [400, 500, 600, 700] },
  { name: "Lato", weights: [400, 700] },
  { name: "Poppins", weights: [400, 500, 600, 700] },
  { name: "Playfair Display", weights: [400, 500, 600, 700] },
  { name: "Lora", weights: [400, 500, 600, 700] },
  { name: "Merriweather", weights: [400, 700] },
  { name: "PT Sans", weights: [400, 700] },
  { name: "PT Serif", weights: [400, 700] },
  { name: "Noto Sans", weights: [400, 500, 600, 700] },
  { name: "Raleway", weights: [400, 500, 600, 700] },
  { name: "Nunito", weights: [400, 600, 700] },
  { name: "Oswald", weights: [400, 500, 600, 700] },
  { name: "Source Sans Pro", weights: [400, 600, 700] },
  { name: "Ubuntu", weights: [400, 500, 700] },
  { name: "Rubik", weights: [400, 500, 600, 700] },
  { name: "Work Sans", weights: [400, 500, 600, 700] },
  { name: "Fira Sans", weights: [400, 500, 600, 700] }
];
const SYSTEM_FONTS = [
  "Arial",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Helvetica",
  "Courier New"
];
const ALL_FONTS = [
  ...GOOGLE_FONTS.map((f) => f.name),
  ...SYSTEM_FONTS
];
const AVAILABLE_VARIABLES = [
  // Студент
  { key: "student.fullName", label: "ФИО студента", placeholder: "Иванов Иван Иванович" },
  { key: "student.shortName", label: "ФИО сокращённо", placeholder: "Иванов И.И." },
  { key: "student.lastName", label: "Фамилия", placeholder: "Иванов" },
  { key: "student.firstName", label: "Имя", placeholder: "Иван" },
  { key: "student.middleName", label: "Отчество", placeholder: "Иванович" },
  { key: "student.organization", label: "Организация", placeholder: 'ООО "Компания"' },
  { key: "student.position", label: "Должность", placeholder: "Инженер" },
  { key: "student.department", label: "Отдел", placeholder: "Отдел разработки" },
  { key: "student.pinfl", label: "ПИНФЛ", placeholder: "12345678901234" },
  // Курс
  { key: "course.name", label: "Название курса", placeholder: "Охрана труда и техника безопасности" },
  { key: "course.shortName", label: "Краткое название курса", placeholder: "ОТиТБ" },
  { key: "course.code", label: "Код курса", placeholder: "OT-001" },
  { key: "course.totalHours", label: "Общее кол-во часов", placeholder: "72" },
  { key: "course.description", label: "Описание курса", placeholder: "Курс по охране труда..." },
  // Группа
  { key: "group.code", label: "Код группы", placeholder: "GR-2025-001" },
  { key: "group.startDate", label: "Дата начала обучения", placeholder: "01.12.2025" },
  { key: "group.endDate", label: "Дата окончания обучения", placeholder: "26.12.2025" },
  { key: "group.classroom", label: "Аудитория", placeholder: "Ауд. 101" },
  // Сертификат
  { key: "certificate.number", label: "Номер сертификата", placeholder: "CERT25-0001" },
  { key: "certificate.issueDate", label: "Дата выдачи", placeholder: "26.12.2025" },
  { key: "certificate.issueDateFormatted", label: "Дата выдачи (прописью)", placeholder: "26 декабря 2025 года" }
];
const AVAILABLE_FONTS = ALL_FONTS;
function generateId() {
  return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function createEmptyTemplate(layout = "A4_landscape") {
  const dimensions = LAYOUT_DIMENSIONS[layout];
  return {
    version: "1.0",
    layout,
    width: dimensions.width,
    height: dimensions.height,
    background: {
      type: "color",
      value: "#FFFFFF"
    },
    elements: []
  };
}
function createTextElement(options = {}) {
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
    backgroundColor: options.backgroundColor ?? "transparent"
  };
}
function createVariableElement(variableKey, options = {}) {
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
    backgroundColor: options.backgroundColor ?? "transparent"
  };
}
function createImageElement(src, options = {}) {
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
    opacity: options.opacity ?? 1
  };
}
function createQRElement(options = {}) {
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
    backgroundColor: options.backgroundColor ?? "#FFFFFF"
  };
}
function createShapeElement(shapeType, options = {}) {
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
    strokeWidth: options.strokeWidth ?? 2
  };
}
function useCertificateEditor() {
  const templateData = ref(createEmptyTemplate());
  const selectedElementId = ref(null);
  const history = ref([]);
  const historyIndex = ref(-1);
  const maxHistoryLength = 50;
  const isDirty = ref(false);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const zoom = ref(1);
  const minZoom = 0.25;
  const maxZoom = 2;
  const selectedElement = computed(() => {
    if (!selectedElementId.value) return null;
    return templateData.value.elements.find((el) => el.id === selectedElementId.value) ?? null;
  });
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);
  const elementsCount = computed(() => templateData.value.elements.length);
  function saveToHistory() {
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }
    history.value.push(JSON.parse(JSON.stringify(templateData.value)));
    if (history.value.length > maxHistoryLength) {
      history.value.shift();
    } else {
      historyIndex.value++;
    }
    isDirty.value = true;
  }
  function undo() {
    if (!canUndo.value) return;
    historyIndex.value--;
    templateData.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
    isDirty.value = true;
  }
  function redo() {
    if (!canRedo.value) return;
    historyIndex.value++;
    templateData.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
    isDirty.value = true;
  }
  function initTemplate(data) {
    if (data) {
      templateData.value = JSON.parse(JSON.stringify(data));
    } else {
      templateData.value = createEmptyTemplate();
    }
    history.value = [JSON.parse(JSON.stringify(templateData.value))];
    historyIndex.value = 0;
    selectedElementId.value = null;
    isDirty.value = false;
  }
  function setLayout(layout) {
    saveToHistory();
    const dimensions = LAYOUT_DIMENSIONS[layout];
    templateData.value.layout = layout;
    templateData.value.width = dimensions.width;
    templateData.value.height = dimensions.height;
  }
  function setBackground(background) {
    saveToHistory();
    templateData.value.background = background;
  }
  function addElement(element) {
    saveToHistory();
    const maxZIndex = Math.max(0, ...templateData.value.elements.map((el) => el.zIndex));
    element.zIndex = maxZIndex + 1;
    templateData.value.elements.push(element);
    selectedElementId.value = element.id;
  }
  function updateElement(id, updates) {
    const index = templateData.value.elements.findIndex((el) => el.id === id);
    if (index === -1) return;
    saveToHistory();
    templateData.value.elements[index] = {
      ...templateData.value.elements[index],
      ...updates
    };
  }
  function deleteElement(id) {
    saveToHistory();
    templateData.value.elements = templateData.value.elements.filter((el) => el.id !== id);
    if (selectedElementId.value === id) {
      selectedElementId.value = null;
    }
  }
  function deleteSelectedElement() {
    if (selectedElementId.value) {
      deleteElement(selectedElementId.value);
    }
  }
  function duplicateElement(id) {
    const element = templateData.value.elements.find((el) => el.id === id);
    if (!element) return;
    const newElement = {
      ...JSON.parse(JSON.stringify(element)),
      id: generateId(),
      x: element.x + 20,
      y: element.y + 20
    };
    addElement(newElement);
  }
  function bringToFront(id) {
    const maxZIndex = Math.max(...templateData.value.elements.map((el) => el.zIndex));
    updateElement(id, { zIndex: maxZIndex + 1 });
  }
  function sendToBack(id) {
    const minZIndex = Math.min(...templateData.value.elements.map((el) => el.zIndex));
    updateElement(id, { zIndex: minZIndex - 1 });
  }
  function toggleLock(id) {
    const element = templateData.value.elements.find((el) => el.id === id);
    if (element) {
      updateElement(id, { locked: !element.locked });
    }
  }
  function selectElement(id) {
    selectedElementId.value = id;
  }
  function setZoom(value) {
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
  function exportData() {
    return JSON.parse(JSON.stringify(templateData.value));
  }
  return {
    // Состояние
    templateData,
    selectedElementId,
    selectedElement,
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
    setBackground,
    // Методы элементов
    addElement,
    updateElement,
    deleteElement,
    deleteSelectedElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    toggleLock,
    selectElement,
    // Методы масштаба
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    // Константы
    minZoom,
    maxZoom
  };
}

export { AVAILABLE_VARIABLES as A, createQRElement as a, createImageElement as b, createShapeElement as c, createVariableElement as d, createTextElement as e, AVAILABLE_FONTS as f, useCertificateEditor as u };
//# sourceMappingURL=useCertificateEditor-CXYGNl0s.mjs.map
