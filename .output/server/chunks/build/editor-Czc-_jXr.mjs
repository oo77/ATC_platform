import { defineComponent, computed, ref, mergeProps, nextTick, withCtx, createBlock, createTextVNode, openBlock, createVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderTeleport, ssrRenderStyle, ssrRenderAttr, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderList, ssrLooseContain } from 'vue/server-renderer';
import { useRoute, useRouter } from 'vue-router';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DnWQlAEm.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import './server.mjs';
import '../_/nitro.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';

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

const LAYOUT_DIMENSIONS = {
  A4_portrait: { width: 794, height: 1123 },
  A4_landscape: { width: 1123, height: 794 },
  letter_portrait: { width: 816, height: 1056 },
  letter_landscape: { width: 1056, height: 816 }
};
const AVAILABLE_VARIABLES = [
  // Студент
  {
    key: "student.fullName",
    label: "ФИО студента",
    placeholder: "Иванов Иван Иванович"
  },
  {
    key: "student.shortName",
    label: "ФИО сокращённо",
    placeholder: "Иванов И.И."
  },
  {
    key: "student.firstLastName",
    label: "ФИ (IVANOV IVAN)",
    placeholder: "IVANOV IVAN"
  },
  { key: "student.lastName", label: "Фамилия", placeholder: "Иванов" },
  { key: "student.firstName", label: "Имя", placeholder: "Иван" },
  { key: "student.middleName", label: "Отчество", placeholder: "Иванович" },
  {
    key: "student.organization",
    label: "Организация",
    placeholder: 'ООО "Компания"'
  },
  {
    key: "student.organizationUz",
    label: "Организация (UZ)",
    placeholder: 'MChJ "Kompaniya"'
  },
  {
    key: "student.organizationEn",
    label: "Organization (EN)",
    placeholder: 'LLC "Company"'
  },
  {
    key: "student.organizationRu",
    label: "Организация (RU)",
    placeholder: 'ООО "Компания"'
  },
  { key: "student.position", label: "Должность", placeholder: "Инженер" },
  {
    key: "student.department",
    label: "Отдел",
    placeholder: "Отдел разработки"
  },
  { key: "student.pinfl", label: "ПИНФЛ", placeholder: "12345678901234" },
  // Курс
  {
    key: "course.name",
    label: "Название курса",
    placeholder: "Охрана труда и техника безопасности"
  },
  {
    key: "course.shortName",
    label: "Краткое название курса",
    placeholder: "ОТиТБ"
  },
  { key: "course.code", label: "Код курса", placeholder: "OT-001" },
  { key: "course.totalHours", label: "Общее кол-во часов", placeholder: "72" },
  {
    key: "course.description",
    label: "Описание курса",
    placeholder: "Курс по охране труда..."
  },
  // Группа
  { key: "group.code", label: "Код группы", placeholder: "GR-2025-001" },
  {
    key: "group.startDate",
    label: "Дата начала обучения",
    placeholder: "01.12.2025"
  },
  {
    key: "group.endDate",
    label: "Дата окончания обучения",
    placeholder: "26.12.2025"
  },
  { key: "group.classroom", label: "Аудитория", placeholder: "Ауд. 101" },
  // Сертификат
  {
    key: "certificate.number",
    label: "Номер сертификата",
    placeholder: "CERT25-0001"
  },
  {
    key: "certificate.issueDate",
    label: "Дата выдачи",
    placeholder: "26.12.2025"
  },
  {
    key: "certificate.issueDateFormatted",
    label: "Дата выдачи (прописью)",
    placeholder: "26 декабря 2025 года"
  },
  // Инструктор
  {
    key: "instructor.fullName",
    label: "ФИО инструктора",
    placeholder: "Петров Петр Петрович"
  },
  {
    key: "instructor.shortName",
    label: "ФИО инструктора (сокращённо)",
    placeholder: "Петров П.П."
  },
  {
    key: "instructor.position",
    label: "Должность инструктора",
    placeholder: "Инструктор-методист"
  }
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
  const selectedElementIds = ref(/* @__PURE__ */ new Set());
  const history = ref([]);
  const historyIndex = ref(-1);
  const maxHistoryLength = 50;
  const isDirty = ref(false);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const zoom = ref(1);
  const minZoom = 0.25;
  const maxZoom = 2;
  const selectedElements = computed(() => {
    if (selectedElementIds.value.size === 0) return [];
    return templateData.value.elements.filter(
      (el) => selectedElementIds.value.has(el.id)
    );
  });
  const selectedElementId = computed(() => {
    const ids = Array.from(selectedElementIds.value);
    return ids.length > 0 ? ids[0] : null;
  });
  const selectedElement = computed(() => {
    if (!selectedElementId.value) return null;
    return templateData.value.elements.find(
      (el) => el.id === selectedElementId.value
    ) ?? null;
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
    templateData.value = JSON.parse(
      JSON.stringify(history.value[historyIndex.value])
    );
    isDirty.value = true;
  }
  function redo() {
    if (!canRedo.value) return;
    historyIndex.value++;
    templateData.value = JSON.parse(
      JSON.stringify(history.value[historyIndex.value])
    );
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
    selectedElementIds.value.clear();
    isDirty.value = false;
  }
  function setLayout(layout, customWidth, customHeight) {
    saveToHistory();
    if (layout === "custom") {
      templateData.value.layout = layout;
      if (customWidth !== void 0 && customHeight !== void 0) {
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
  function setCustomDimensions(width, height) {
    saveToHistory();
    templateData.value.width = Math.max(200, Math.min(5e3, width));
    templateData.value.height = Math.max(200, Math.min(5e3, height));
    if (templateData.value.layout !== "custom") {
      templateData.value.layout = "custom";
    }
  }
  function setBackground(background) {
    saveToHistory();
    templateData.value.background = background;
  }
  function addElement(element) {
    saveToHistory();
    const maxZIndex = Math.max(
      0,
      ...templateData.value.elements.map((el) => el.zIndex)
    );
    element.zIndex = maxZIndex + 1;
    templateData.value.elements.push(element);
    selectedElementIds.value.clear();
    selectedElementIds.value.add(element.id);
  }
  function updateElement(id, updates) {
    const index = templateData.value.elements.findIndex(
      (el) => el.id === id
    );
    if (index === -1) return;
    saveToHistory();
    templateData.value.elements[index] = {
      ...templateData.value.elements[index],
      ...updates
    };
  }
  function deleteElement(id) {
    saveToHistory();
    templateData.value.elements = templateData.value.elements.filter(
      (el) => el.id !== id
    );
    if (selectedElementIds.value.has(id)) {
      selectedElementIds.value.delete(id);
    }
  }
  function deleteSelectedElement() {
    if (selectedElementId.value) {
      deleteElement(selectedElementId.value);
    }
  }
  function duplicateElement(id) {
    const element = templateData.value.elements.find(
      (el) => el.id === id
    );
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
    const maxZIndex = Math.max(
      ...templateData.value.elements.map((el) => el.zIndex)
    );
    updateElement(id, { zIndex: maxZIndex + 1 });
  }
  function sendToBack(id) {
    const minZIndex = Math.min(
      ...templateData.value.elements.map((el) => el.zIndex)
    );
    updateElement(id, { zIndex: minZIndex - 1 });
  }
  function toggleLock(id) {
    const element = templateData.value.elements.find(
      (el) => el.id === id
    );
    if (element) {
      updateElement(id, { locked: !element.locked });
    }
  }
  function selectElement(id, multiSelect = false) {
    if (id === null) {
      selectedElementIds.value.clear();
      return;
    }
    if (multiSelect) {
      if (selectedElementIds.value.has(id)) {
        selectedElementIds.value.delete(id);
      } else {
        selectedElementIds.value.add(id);
      }
    } else {
      selectedElementIds.value.clear();
      selectedElementIds.value.add(id);
    }
  }
  function selectMultipleElements(ids) {
    selectedElementIds.value.clear();
    ids.forEach((id) => selectedElementIds.value.add(id));
  }
  function addToSelection(ids) {
    ids.forEach((id) => selectedElementIds.value.add(id));
  }
  function clearSelection() {
    selectedElementIds.value.clear();
  }
  function updateMultipleElements(ids, updates) {
    saveToHistory();
    ids.forEach((id) => {
      const index = templateData.value.elements.findIndex(
        (el) => el.id === id
      );
      if (index !== -1 && !templateData.value.elements[index].locked) {
        templateData.value.elements[index] = {
          ...templateData.value.elements[index],
          ...updates
        };
      }
    });
  }
  function alignMultipleElements(ids, direction) {
    if (ids.length < 2) return;
    const elements = templateData.value.elements.filter(
      (el) => ids.includes(el.id) && !el.locked
    );
    if (elements.length < 2) return;
    saveToHistory();
    let referenceValue;
    switch (direction) {
      case "left":
        referenceValue = Math.min(...elements.map((el) => el.x));
        elements.forEach((el) => {
          updateElement(el.id, { x: referenceValue });
        });
        break;
      case "center-h":
        const avgCenterX = elements.reduce((sum, el) => sum + el.x + el.width / 2, 0) / elements.length;
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
        const avgCenterY = elements.reduce((sum, el) => sum + el.y + el.height / 2, 0) / elements.length;
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
  function distributeElements(ids, direction) {
    if (ids.length < 3) return;
    const elements = templateData.value.elements.filter((el) => ids.includes(el.id) && !el.locked).sort((a, b) => direction === "horizontal" ? a.x - b.x : a.y - b.y);
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
  function alignElement(id, direction) {
    const element = templateData.value.elements.find(
      (el) => el.id === id
    );
    if (!element || element.locked) return;
    const canvasWidth = templateData.value.width;
    const canvasHeight = templateData.value.height;
    let updates = {};
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
  function exportData() {
    return JSON.parse(JSON.stringify(templateData.value));
  }
  async function uploadBackgroundImage(file, templateId) {
    const formData = new FormData();
    formData.append("background", file);
    const { authFetch } = useAuthFetch();
    const response = await authFetch(`/api/certificates/templates/${templateId}/upload-background`, {
      method: "POST",
      body: formData
    });
    if (!response.success) {
      throw new Error(response.message || "Ошибка загрузки изображения");
    }
    return response.url;
  }
  async function uploadElementImage(file, templateId) {
    const formData = new FormData();
    formData.append("image", file);
    const { authFetch } = useAuthFetch();
    const response = await authFetch(`/api/certificates/templates/${templateId}/upload-image`, {
      method: "POST",
      body: formData
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
    maxZoom
  };
}
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "EditorToolbar",
  __ssrInlineRender: true,
  props: {
    currentLayout: {},
    templateId: {}
  },
  emits: ["add-text", "add-variable", "add-image", "add-qr", "add-shape", "set-layout", "set-background", "apply-preset"],
  setup(__props, { emit: __emit }) {
    useAuthFetch();
    const showVariableMenu = ref(false);
    const showShapeMenu = ref(false);
    ref(null);
    ref(null);
    ref(false);
    ref(false);
    const useCustomSize = ref(false);
    const customWidth = ref(794);
    const customHeight = ref(1123);
    const isCustomSizeValid = ref(false);
    const variableGroups = computed(() => [
      {
        name: "Студент",
        variables: AVAILABLE_VARIABLES.filter((v) => v.key.startsWith("student."))
      },
      {
        name: "Курс",
        variables: AVAILABLE_VARIABLES.filter((v) => v.key.startsWith("course."))
      },
      {
        name: "Группа",
        variables: AVAILABLE_VARIABLES.filter((v) => v.key.startsWith("group."))
      },
      {
        name: "Сертификат",
        variables: AVAILABLE_VARIABLES.filter(
          (v) => v.key.startsWith("certificate.")
        )
      },
      {
        name: "Инструктор",
        variables: AVAILABLE_VARIABLES.filter(
          (v) => v.key.startsWith("instructor.")
        )
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "editor-toolbar" }, _attrs))} data-v-9aa973d3><div class="toolbar-section" data-v-9aa973d3><h3 class="section-title" data-v-9aa973d3>Элементы</h3><button class="tool-btn" title="Добавить текст" data-v-9aa973d3><div class="tool-icon" data-v-9aa973d3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-9aa973d3><polyline points="4,7 4,4 20,4 20,7" data-v-9aa973d3></polyline><line x1="9" y1="20" x2="15" y2="20" data-v-9aa973d3></line><line x1="12" y1="4" x2="12" y2="20" data-v-9aa973d3></line></svg></div><span class="tool-label" data-v-9aa973d3>Текст</span></button><div class="tool-dropdown" data-v-9aa973d3><button class="tool-btn" title="Добавить переменную" data-v-9aa973d3><div class="tool-icon variable-icon" data-v-9aa973d3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-9aa973d3><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" data-v-9aa973d3></path><path d="M8 10h8" data-v-9aa973d3></path><path d="M8 14h4" data-v-9aa973d3></path></svg></div><span class="tool-label" data-v-9aa973d3>Переменная</span><svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9aa973d3><path d="m6 9 6 6 6-6" data-v-9aa973d3></path></svg></button>`);
      if (showVariableMenu.value) {
        _push(`<div class="dropdown-menu" data-v-9aa973d3><div class="dropdown-header" data-v-9aa973d3>Выберите переменную</div><!--[-->`);
        ssrRenderList(variableGroups.value, (group) => {
          _push(`<div class="dropdown-group" data-v-9aa973d3><div class="group-title" data-v-9aa973d3>${ssrInterpolate(group.name)}</div><!--[-->`);
          ssrRenderList(group.variables, (variable) => {
            _push(`<button class="dropdown-item" data-v-9aa973d3><span class="var-label" data-v-9aa973d3>${ssrInterpolate(variable.label)}</span><span class="var-placeholder" data-v-9aa973d3>${ssrInterpolate(variable.placeholder)}</span></button>`);
          });
          _push(`<!--]--></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><button class="tool-btn" title="Добавить изображение" data-v-9aa973d3><div class="tool-icon" data-v-9aa973d3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-9aa973d3><rect width="18" height="18" x="3" y="3" rx="2" ry="2" data-v-9aa973d3></rect><circle cx="9" cy="9" r="2" data-v-9aa973d3></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" data-v-9aa973d3></path></svg></div><span class="tool-label" data-v-9aa973d3>Изображение</span></button><input type="file" accept="image/*" class="hidden-input" data-v-9aa973d3><button class="tool-btn" title="Добавить QR-код" data-v-9aa973d3><div class="tool-icon" data-v-9aa973d3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-9aa973d3><rect width="5" height="5" x="3" y="3" rx="1" data-v-9aa973d3></rect><rect width="5" height="5" x="16" y="3" rx="1" data-v-9aa973d3></rect><rect width="5" height="5" x="3" y="16" rx="1" data-v-9aa973d3></rect><path d="M21 16h-3a2 2 0 0 0-2 2v3" data-v-9aa973d3></path><path d="M21 21v.01" data-v-9aa973d3></path><path d="M12 7v3a2 2 0 0 1-2 2H7" data-v-9aa973d3></path><path d="M3 12h.01" data-v-9aa973d3></path><path d="M12 3h.01" data-v-9aa973d3></path><path d="M12 16v.01" data-v-9aa973d3></path><path d="M16 12h1" data-v-9aa973d3></path><path d="M21 12v.01" data-v-9aa973d3></path><path d="M12 21v-1" data-v-9aa973d3></path></svg></div><span class="tool-label" data-v-9aa973d3>QR-код</span></button><div class="tool-dropdown" data-v-9aa973d3><button class="tool-btn" title="Добавить фигуру" data-v-9aa973d3><div class="tool-icon" data-v-9aa973d3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-9aa973d3><rect width="14" height="14" x="5" y="5" rx="2" data-v-9aa973d3></rect></svg></div><span class="tool-label" data-v-9aa973d3>Фигуры</span><svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9aa973d3><path d="m6 9 6 6 6-6" data-v-9aa973d3></path></svg></button>`);
      if (showShapeMenu.value) {
        _push(`<div class="dropdown-menu shapes-menu" data-v-9aa973d3><button class="dropdown-item shape-item" data-v-9aa973d3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9aa973d3><rect width="18" height="14" x="3" y="5" rx="2" data-v-9aa973d3></rect></svg><span data-v-9aa973d3>Прямоугольник</span></button><button class="dropdown-item shape-item" data-v-9aa973d3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9aa973d3><circle cx="12" cy="12" r="9" data-v-9aa973d3></circle></svg><span data-v-9aa973d3>Круг</span></button><button class="dropdown-item shape-item" data-v-9aa973d3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9aa973d3><path d="M5 19L19 5" data-v-9aa973d3></path></svg><span data-v-9aa973d3>Линия</span></button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="toolbar-section" data-v-9aa973d3><h3 class="section-title" data-v-9aa973d3>Макет</h3><div class="layout-options" data-v-9aa973d3><button class="${ssrRenderClass([{ active: __props.currentLayout === "A4_landscape" }, "layout-btn"])}" title="A4 альбомная" data-v-9aa973d3><div class="layout-preview landscape" data-v-9aa973d3></div><span data-v-9aa973d3>Альбомная</span></button><button class="${ssrRenderClass([{ active: __props.currentLayout === "A4_portrait" }, "layout-btn"])}" title="A4 книжная" data-v-9aa973d3><div class="layout-preview portrait" data-v-9aa973d3></div><span data-v-9aa973d3>Книжная</span></button></div><div class="custom-size-section" data-v-9aa973d3><label class="custom-checkbox" data-v-9aa973d3><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(useCustomSize.value) ? ssrLooseContain(useCustomSize.value, null) : useCustomSize.value) ? " checked" : ""} data-v-9aa973d3><span data-v-9aa973d3>Своя</span></label>`);
      if (useCustomSize.value) {
        _push(`<div class="custom-size-panel" data-v-9aa973d3><div class="custom-size-inputs" data-v-9aa973d3><div class="size-input-group" data-v-9aa973d3><label data-v-9aa973d3>Ширина (px)</label><input type="number"${ssrRenderAttr("value", customWidth.value)} min="200" max="5000" placeholder="794" data-v-9aa973d3></div><div class="size-input-group" data-v-9aa973d3><label data-v-9aa973d3>Высота (px)</label><input type="number"${ssrRenderAttr("value", customHeight.value)} min="200" max="5000" placeholder="1123" data-v-9aa973d3></div></div><button class="apply-custom-btn"${ssrIncludeBooleanAttr(!isCustomSizeValid.value) ? " disabled" : ""} data-v-9aa973d3> Сохранить размер </button><p class="size-hint" data-v-9aa973d3>Мин: 200px, Макс: 5000px</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="toolbar-section" data-v-9aa973d3><h3 class="section-title" data-v-9aa973d3>Фон</h3><div class="background-options" data-v-9aa973d3><button class="bg-btn" title="Белый фон" data-v-9aa973d3><div class="color-swatch" style="${ssrRenderStyle({ "background": "#ffffff", "border": "1px solid #e5e7eb" })}" data-v-9aa973d3></div></button><button class="bg-btn" title="Кремовый фон" data-v-9aa973d3><div class="color-swatch" style="${ssrRenderStyle({ "background": "#fff8e7" })}" data-v-9aa973d3></div></button><button class="bg-btn" title="Голубоватый фон" data-v-9aa973d3><div class="color-swatch" style="${ssrRenderStyle({ "background": "#f0f9ff" })}" data-v-9aa973d3></div></button><button class="bg-btn" title="Зеленоватый фон" data-v-9aa973d3><div class="color-swatch" style="${ssrRenderStyle({ "background": "#f0fdf4" })}" data-v-9aa973d3></div></button><button class="bg-btn upload-bg" title="Загрузить фон" data-v-9aa973d3><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9aa973d3><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" data-v-9aa973d3></path><polyline points="17 8 12 3 7 8" data-v-9aa973d3></polyline><line x1="12" y1="3" x2="12" y2="15" data-v-9aa973d3></line></svg></button></div><input type="file" accept="image/*" class="hidden-input" data-v-9aa973d3></div><div class="toolbar-section presets-section" data-v-9aa973d3><h3 class="section-title" data-v-9aa973d3>Шаблоны</h3><button class="preset-btn" title="Классический" data-v-9aa973d3><div class="preset-preview classic" data-v-9aa973d3><div class="pp-line" data-v-9aa973d3></div><div class="pp-line short" data-v-9aa973d3></div><div class="pp-line" data-v-9aa973d3></div></div><span data-v-9aa973d3>Классический</span></button><button class="preset-btn" title="Современный" data-v-9aa973d3><div class="preset-preview modern" data-v-9aa973d3><div class="pp-line" data-v-9aa973d3></div><div class="pp-line short" data-v-9aa973d3></div><div class="pp-line" data-v-9aa973d3></div></div><span data-v-9aa973d3>Современный</span></button><button class="preset-btn" title="Минималистичный" data-v-9aa973d3><div class="preset-preview minimal" data-v-9aa973d3><div class="pp-line" data-v-9aa973d3></div><div class="pp-line short" data-v-9aa973d3></div></div><span data-v-9aa973d3>Минимальный</span></button></div></div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/editor/EditorToolbar.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const EditorToolbar = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$4, [["__scopeId", "data-v-9aa973d3"]]), { __name: "CertificatesEditorToolbar" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "EditorCanvas",
  __ssrInlineRender: true,
  props: {
    templateData: {},
    selectedElementIds: {},
    zoom: {}
  },
  emits: ["select", "select-multiple", "update-element", "update-multiple", "delete-element"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const editingId = ref(null);
    ref(null);
    ref(false);
    ref(0);
    ref(0);
    ref(
      /* @__PURE__ */ new Map()
    );
    ref(false);
    ref("");
    ref(0);
    ref(0);
    ref(0);
    ref(0);
    ref(0);
    ref(0);
    ref(null);
    ref(false);
    const selectionBox = ref(null);
    ref(0);
    ref(0);
    const guides = ref({
      vertical: [],
      horizontal: [],
      distances: []
    });
    const sortedElements = computed(() => {
      return [...props.templateData.elements].sort((a, b) => a.zIndex - b.zIndex);
    });
    const backgroundStyle = computed(() => {
      const bg = props.templateData.background;
      if (bg.type === "color") {
        return bg.value;
      } else if (bg.type === "image") {
        return `url(${bg.value}) center/cover no-repeat`;
      }
      return "#FFFFFF";
    });
    function getElementStyle(element) {
      return {
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : void 0
      };
    }
    function getTextStyle(element) {
      const justifyMap = {
        left: "flex-start",
        center: "center",
        right: "flex-end"
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
        backgroundColor: element.backgroundColor || "transparent"
      };
    }
    function getVariableLabel(key) {
      const variable = AVAILABLE_VARIABLES.find((v) => v.key === key);
      if (!variable) return key;
      const parts = key.split(".");
      const firstPart = parts[0];
      return firstPart ? firstPart.charAt(0).toUpperCase() : "V";
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "canvas-wrapper",
        style: {
          width: `${__props.templateData.width * __props.zoom}px`,
          height: `${__props.templateData.height * __props.zoom}px`
        }
      }, _attrs))} data-v-5d693d22><div class="canvas-content" style="${ssrRenderStyle({
        width: `${__props.templateData.width}px`,
        height: `${__props.templateData.height}px`,
        transform: `scale(${__props.zoom})`,
        transformOrigin: "top left",
        background: backgroundStyle.value
      })}" data-v-5d693d22>`);
      if (guides.value.vertical.length > 0 || guides.value.horizontal.length > 0) {
        _push(`<div class="guides-layer" data-v-5d693d22><!--[-->`);
        ssrRenderList(guides.value.vertical, (guide, index) => {
          _push(`<div class="guide guide-vertical" style="${ssrRenderStyle({ left: `${guide.position}px` })}" data-v-5d693d22><span class="guide-label" data-v-5d693d22>${ssrInterpolate(Math.round(guide.position))}</span></div>`);
        });
        _push(`<!--]--><!--[-->`);
        ssrRenderList(guides.value.horizontal, (guide, index) => {
          _push(`<div class="guide guide-horizontal" style="${ssrRenderStyle({ top: `${guide.position}px` })}" data-v-5d693d22><span class="guide-label" data-v-5d693d22>${ssrInterpolate(Math.round(guide.position))}</span></div>`);
        });
        _push(`<!--]--><!--[-->`);
        ssrRenderList(guides.value.distances, (distance, index) => {
          _push(`<div class="distance-label" style="${ssrRenderStyle({
            left: `${distance.x}px`,
            top: `${distance.y}px`
          })}" data-v-5d693d22>${ssrInterpolate(Math.round(distance.value))}px </div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      if (selectionBox.value) {
        _push(`<div class="selection-box" style="${ssrRenderStyle({
          left: `${selectionBox.value.x}px`,
          top: `${selectionBox.value.y}px`,
          width: `${selectionBox.value.width}px`,
          height: `${selectionBox.value.height}px`
        })}" data-v-5d693d22></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(sortedElements.value, (element) => {
        _push(`<div class="${ssrRenderClass([{
          selected: __props.selectedElementIds.has(element.id),
          locked: element.locked
        }, "canvas-element"])}" style="${ssrRenderStyle(getElementStyle(element))}" data-v-5d693d22>`);
        if (element.type === "text") {
          _push(`<div class="text-content" style="${ssrRenderStyle(getTextStyle(element))}"${ssrRenderAttr("contenteditable", editingId.value === element.id)} data-v-5d693d22>${ssrInterpolate(element.content)}</div>`);
        } else if (element.type === "variable") {
          _push(`<div class="variable-content" style="${ssrRenderStyle(getTextStyle(element))}" data-v-5d693d22><span class="variable-badge" data-v-5d693d22>${ssrInterpolate(getVariableLabel(element.variableKey))}</span> ${ssrInterpolate(element.placeholder)}</div>`);
        } else if (element.type === "image") {
          _push(`<img${ssrRenderAttr("src", element.src)} style="${ssrRenderStyle({
            width: "100%",
            height: "100%",
            objectFit: element.objectFit,
            opacity: element.opacity
          })}" draggable="false" data-v-5d693d22>`);
        } else if (element.type === "qr") {
          _push(`<div class="qr-placeholder" style="${ssrRenderStyle({ background: element.backgroundColor })}" data-v-5d693d22><svg xmlns="http://www.w3.org/2000/svg" width="80%" height="80%" viewBox="0 0 24 24" fill="none"${ssrRenderAttr("stroke", element.color)} stroke-width="1.5" data-v-5d693d22><rect width="5" height="5" x="3" y="3" rx="1" data-v-5d693d22></rect><rect width="5" height="5" x="16" y="3" rx="1" data-v-5d693d22></rect><rect width="5" height="5" x="3" y="16" rx="1" data-v-5d693d22></rect><path d="M21 16h-3a2 2 0 0 0-2 2v3" data-v-5d693d22></path><path d="M21 21v.01" data-v-5d693d22></path><path d="M12 7v3a2 2 0 0 1-2 2H7" data-v-5d693d22></path><path d="M3 12h.01" data-v-5d693d22></path><path d="M12 3h.01" data-v-5d693d22></path><path d="M12 16v.01" data-v-5d693d22></path><path d="M16 12h1" data-v-5d693d22></path><path d="M21 12v.01" data-v-5d693d22></path><path d="M12 21v-1" data-v-5d693d22></path></svg><span class="qr-label" data-v-5d693d22>QR</span></div>`);
        } else if (element.type === "shape") {
          _push(`<svg class="shape-svg"${ssrRenderAttr("width", element.width)}${ssrRenderAttr("height", element.height)} data-v-5d693d22>`);
          if (element.shapeType === "rectangle") {
            _push(`<rect x="0" y="0"${ssrRenderAttr("width", element.width)}${ssrRenderAttr("height", element.height)}${ssrRenderAttr("fill", element.fillColor)}${ssrRenderAttr("stroke", element.strokeColor)}${ssrRenderAttr("stroke-width", element.strokeWidth)} data-v-5d693d22></rect>`);
          } else if (element.shapeType === "circle") {
            _push(`<ellipse${ssrRenderAttr("cx", element.width / 2)}${ssrRenderAttr("cy", element.height / 2)}${ssrRenderAttr(
              "rx",
              element.width / 2 - element.strokeWidth / 2
            )}${ssrRenderAttr(
              "ry",
              element.height / 2 - element.strokeWidth / 2
            )}${ssrRenderAttr("fill", element.fillColor)}${ssrRenderAttr("stroke", element.strokeColor)}${ssrRenderAttr("stroke-width", element.strokeWidth)} data-v-5d693d22></ellipse>`);
          } else if (element.shapeType === "line") {
            _push(`<line x1="0" y1="0"${ssrRenderAttr("x2", element.width)}${ssrRenderAttr("y2", element.height)}${ssrRenderAttr("stroke", element.strokeColor)}${ssrRenderAttr("stroke-width", element.strokeWidth)} data-v-5d693d22></line>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</svg>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.selectedElementIds.has(element.id) && __props.selectedElementIds.size === 1 && !element.locked) {
          _push(`<!--[--><div class="resize-handle nw" data-v-5d693d22></div><div class="resize-handle ne" data-v-5d693d22></div><div class="resize-handle sw" data-v-5d693d22></div><div class="resize-handle se" data-v-5d693d22></div><div class="resize-handle n" data-v-5d693d22></div><div class="resize-handle s" data-v-5d693d22></div><div class="resize-handle e" data-v-5d693d22></div><div class="resize-handle w" data-v-5d693d22></div><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        if (element.locked) {
          _push(`<div class="lock-indicator" data-v-5d693d22><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-5d693d22><rect width="18" height="11" x="3" y="11" rx="2" ry="2" data-v-5d693d22></rect><path d="M7 11V7a5 5 0 0 1 10 0v4" data-v-5d693d22></path></svg></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.selectedElementIds.has(element.id) && __props.selectedElementIds.size > 1) {
          _push(`<div class="multi-select-indicator" data-v-5d693d22>${ssrInterpolate(Array.from(__props.selectedElementIds).indexOf(element.id) + 1)}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div></div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/editor/EditorCanvas.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const EditorCanvas = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$3, [["__scopeId", "data-v-5d693d22"]]), { __name: "CertificatesEditorCanvas" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "EditorSidebar",
  __ssrInlineRender: true,
  props: {
    selectedElement: {},
    selectedElements: {},
    templateId: {}
  },
  emits: ["update", "delete", "delete-multiple", "duplicate", "duplicate-multiple", "bring-to-front", "send-to-back", "toggle-lock", "align", "align-group", "distribute"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    useAuthFetch();
    ref(null);
    ref(false);
    const variableGroups = computed(() => [
      {
        name: "Студент",
        variables: AVAILABLE_VARIABLES.filter((v) => v.key.startsWith("student."))
      },
      {
        name: "Курс",
        variables: AVAILABLE_VARIABLES.filter((v) => v.key.startsWith("course."))
      },
      {
        name: "Группа",
        variables: AVAILABLE_VARIABLES.filter((v) => v.key.startsWith("group."))
      },
      {
        name: "Сертификат",
        variables: AVAILABLE_VARIABLES.filter(
          (v) => v.key.startsWith("certificate.")
        )
      }
    ]);
    function getElementTypeLabel(type) {
      const labels = {
        text: "Текст",
        variable: "Переменная",
        image: "Изображение",
        qr: "QR-код",
        shape: "Фигура"
      };
      return labels[type] || type;
    }
    function getTextProp(prop) {
      if (!props.selectedElement) return "";
      return props.selectedElement[prop];
    }
    function getBackgroundColor() {
      if (!props.selectedElement) return "#ffffff";
      const bg = props.selectedElement.backgroundColor;
      return !bg || bg === "transparent" ? "#ffffff" : bg;
    }
    function isTransparentBackground() {
      if (!props.selectedElement) return true;
      const bg = props.selectedElement.backgroundColor;
      return !bg || bg === "transparent";
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "editor-sidebar" }, _attrs))} data-v-9e24b3c1>`);
      if (__props.selectedElements.length === 0) {
        _push(`<div class="empty-state" data-v-9e24b3c1><div class="empty-icon" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-9e24b3c1><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" data-v-9e24b3c1></path></svg></div><p class="empty-title" data-v-9e24b3c1>Выберите элемент</p><p class="empty-text" data-v-9e24b3c1> Кликните на элемент на холсте, чтобы редактировать его свойства </p></div>`);
      } else if (__props.selectedElements.length > 1) {
        _push(`<!--[--><div class="sidebar-header" data-v-9e24b3c1><span class="element-type-badge multi" data-v-9e24b3c1> Выбрано: ${ssrInterpolate(__props.selectedElements.length)}</span><div class="header-actions" data-v-9e24b3c1><button class="action-btn delete" title="Удалить все" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><path d="M3 6h18" data-v-9e24b3c1></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" data-v-9e24b3c1></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" data-v-9e24b3c1></path></svg></button></div></div><div class="sidebar-section" data-v-9e24b3c1><h4 class="section-title" data-v-9e24b3c1>Выравнивание</h4><div class="align-section" data-v-9e24b3c1><p class="align-label" data-v-9e24b3c1>Относительно холста</p><div class="align-buttons" data-v-9e24b3c1><button class="align-btn" title="По левому краю" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="3" y1="3" x2="3" y2="21" data-v-9e24b3c1></line><rect x="7" y="6" width="14" height="5" rx="1" data-v-9e24b3c1></rect><rect x="7" y="13" width="10" height="5" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn" title="По центру горизонтально" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="12" y1="3" x2="12" y2="21" data-v-9e24b3c1></line><rect x="5" y="6" width="14" height="5" rx="1" data-v-9e24b3c1></rect><rect x="7" y="13" width="10" height="5" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn" title="По правому краю" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="21" y1="3" x2="21" y2="21" data-v-9e24b3c1></line><rect x="3" y="6" width="14" height="5" rx="1" data-v-9e24b3c1></rect><rect x="7" y="13" width="10" height="5" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn" title="По верхнему краю" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="3" y1="3" x2="21" y2="3" data-v-9e24b3c1></line><rect x="6" y="7" width="5" height="14" rx="1" data-v-9e24b3c1></rect><rect x="13" y="7" width="5" height="10" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn" title="По центру вертикально" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="3" y1="12" x2="21" y2="12" data-v-9e24b3c1></line><rect x="6" y="5" width="5" height="14" rx="1" data-v-9e24b3c1></rect><rect x="13" y="7" width="5" height="10" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn" title="По нижнему краю" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="3" y1="21" x2="21" y2="21" data-v-9e24b3c1></line><rect x="6" y="3" width="5" height="14" rx="1" data-v-9e24b3c1></rect><rect x="13" y="7" width="5" height="10" rx="1" data-v-9e24b3c1></rect></svg></button></div><p class="align-label mt-3" data-v-9e24b3c1>Относительно друг друга</p><div class="align-buttons" data-v-9e24b3c1><button class="align-btn" title="Выровнять левые края" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect x="3" y="5" width="8" height="4" rx="1" data-v-9e24b3c1></rect><rect x="3" y="11" width="12" height="4" rx="1" data-v-9e24b3c1></rect><rect x="3" y="17" width="6" height="4" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn" title="Выровнять центры" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect x="8" y="5" width="8" height="4" rx="1" data-v-9e24b3c1></rect><rect x="6" y="11" width="12" height="4" rx="1" data-v-9e24b3c1></rect><rect x="9" y="17" width="6" height="4" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn" title="Выровнять правые края" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect x="13" y="5" width="8" height="4" rx="1" data-v-9e24b3c1></rect><rect x="9" y="11" width="12" height="4" rx="1" data-v-9e24b3c1></rect><rect x="15" y="17" width="6" height="4" rx="1" data-v-9e24b3c1></rect></svg></button></div>`);
        if (__props.selectedElements.length >= 3) {
          _push(`<p class="align-label mt-3" data-v-9e24b3c1> Распределение </p>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.selectedElements.length >= 3) {
          _push(`<div class="align-buttons" data-v-9e24b3c1><button class="align-btn" title="Распределить по горизонтали" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect x="2" y="8" width="4" height="8" rx="1" data-v-9e24b3c1></rect><rect x="10" y="8" width="4" height="8" rx="1" data-v-9e24b3c1></rect><rect x="18" y="8" width="4" height="8" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn" title="Распределить по вертикали" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect x="8" y="2" width="8" height="4" rx="1" data-v-9e24b3c1></rect><rect x="8" y="10" width="8" height="4" rx="1" data-v-9e24b3c1></rect><rect x="8" y="18" width="8" height="4" rx="1" data-v-9e24b3c1></rect></svg></button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="sidebar-section actions-section" data-v-9e24b3c1><h4 class="section-title" data-v-9e24b3c1>Действия</h4><div class="action-buttons" data-v-9e24b3c1><button class="action-button" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect width="14" height="14" x="8" y="8" rx="2" ry="2" data-v-9e24b3c1></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" data-v-9e24b3c1></path></svg> Дублировать все </button><button class="action-button" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect width="8" height="8" x="8" y="8" rx="1" data-v-9e24b3c1></rect><path d="M4 16V6a2 2 0 0 1 2-2h10" data-v-9e24b3c1></path><path d="M14 22h4a2 2 0 0 0 2-2v-4" data-v-9e24b3c1></path></svg> На передний план </button><button class="action-button" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect width="8" height="8" x="8" y="8" rx="1" data-v-9e24b3c1></rect><path d="M4 8V6a2 2 0 0 1 2-2h2" data-v-9e24b3c1></path><path d="M20 16v2a2 2 0 0 1-2 2h-2" data-v-9e24b3c1></path></svg> На задний план </button></div></div><!--]-->`);
      } else {
        _push(`<!--[--><div class="sidebar-header" data-v-9e24b3c1><span class="${ssrRenderClass([__props.selectedElement.type, "element-type-badge"])}" data-v-9e24b3c1>${ssrInterpolate(getElementTypeLabel(__props.selectedElement.type))}</span><div class="header-actions" data-v-9e24b3c1><button class="${ssrRenderClass([{ active: __props.selectedElement.locked }, "action-btn"])}"${ssrRenderAttr("title", __props.selectedElement.locked ? "Разблокировать" : "Заблокировать")} data-v-9e24b3c1>`);
        if (__props.selectedElement.locked) {
          _push(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect width="18" height="11" x="3" y="11" rx="2" ry="2" data-v-9e24b3c1></rect><path d="M7 11V7a5 5 0 0 1 10 0v4" data-v-9e24b3c1></path></svg>`);
        } else {
          _push(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect width="18" height="11" x="3" y="11" rx="2" ry="2" data-v-9e24b3c1></rect><path d="M7 11V7a5 5 0 0 1 9.9-1" data-v-9e24b3c1></path></svg>`);
        }
        _push(`</button><button class="action-btn delete" title="Удалить" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><path d="M3 6h18" data-v-9e24b3c1></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" data-v-9e24b3c1></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" data-v-9e24b3c1></path></svg></button></div></div><div class="sidebar-section" data-v-9e24b3c1><h4 class="section-title" data-v-9e24b3c1>Позиция и размер</h4><div class="input-grid compact" data-v-9e24b3c1><div class="input-group" data-v-9e24b3c1><label data-v-9e24b3c1>X</label><input type="number"${ssrRenderAttr("value", Math.round(__props.selectedElement.x))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1></div><div class="input-group" data-v-9e24b3c1><label data-v-9e24b3c1>Y</label><input type="number"${ssrRenderAttr("value", Math.round(__props.selectedElement.y))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1></div><div class="input-group" data-v-9e24b3c1><label data-v-9e24b3c1>Ш</label><input type="number"${ssrRenderAttr("value", Math.round(__props.selectedElement.width))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="20" data-v-9e24b3c1></div><div class="input-group" data-v-9e24b3c1><label data-v-9e24b3c1>В</label><input type="number"${ssrRenderAttr("value", Math.round(__props.selectedElement.height))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="20" data-v-9e24b3c1></div></div><div class="input-group full" data-v-9e24b3c1><label data-v-9e24b3c1>Поворот (°)</label><input type="range"${ssrRenderAttr("value", __props.selectedElement.rotation)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="0" max="360" data-v-9e24b3c1><span class="range-value" data-v-9e24b3c1>${ssrInterpolate(__props.selectedElement.rotation)}°</span></div></div><div class="sidebar-section" data-v-9e24b3c1><h4 class="section-title" data-v-9e24b3c1>Выравнивание</h4><div class="align-section" data-v-9e24b3c1><p class="align-label" data-v-9e24b3c1>Относительно холста</p><div class="align-buttons" data-v-9e24b3c1><button class="align-btn"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="По левому краю" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="3" y1="3" x2="3" y2="21" data-v-9e24b3c1></line><rect x="7" y="6" width="14" height="5" rx="1" data-v-9e24b3c1></rect><rect x="7" y="13" width="10" height="5" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="По центру горизонтально" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="12" y1="3" x2="12" y2="21" data-v-9e24b3c1></line><rect x="5" y="6" width="14" height="5" rx="1" data-v-9e24b3c1></rect><rect x="7" y="13" width="10" height="5" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="По правому краю" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="21" y1="3" x2="21" y2="21" data-v-9e24b3c1></line><rect x="3" y="6" width="14" height="5" rx="1" data-v-9e24b3c1></rect><rect x="7" y="13" width="10" height="5" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="По верхнему краю" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="3" y1="3" x2="21" y2="3" data-v-9e24b3c1></line><rect x="6" y="7" width="5" height="14" rx="1" data-v-9e24b3c1></rect><rect x="13" y="7" width="5" height="10" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="По центру вертикально" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="3" y1="12" x2="21" y2="12" data-v-9e24b3c1></line><rect x="6" y="5" width="5" height="14" rx="1" data-v-9e24b3c1></rect><rect x="13" y="7" width="5" height="10" rx="1" data-v-9e24b3c1></rect></svg></button><button class="align-btn"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="По нижнему краю" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="3" y1="21" x2="21" y2="21" data-v-9e24b3c1></line><rect x="6" y="3" width="5" height="14" rx="1" data-v-9e24b3c1></rect><rect x="13" y="7" width="5" height="10" rx="1" data-v-9e24b3c1></rect></svg></button></div></div></div>`);
        if (__props.selectedElement.type === "text" || __props.selectedElement.type === "variable") {
          _push(`<div class="sidebar-section" data-v-9e24b3c1><h4 class="section-title" data-v-9e24b3c1>Текст</h4>`);
          if (__props.selectedElement.type === "text") {
            _push(`<div class="input-group full" data-v-9e24b3c1><label data-v-9e24b3c1>Содержимое</label><textarea${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} rows="2" data-v-9e24b3c1>${ssrInterpolate(__props.selectedElement.content)}</textarea></div>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.selectedElement.type === "variable") {
            _push(`<div class="input-group full" data-v-9e24b3c1><label data-v-9e24b3c1>Переменная</label><select${ssrRenderAttr("value", __props.selectedElement.variableKey)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1><!--[-->`);
            ssrRenderList(variableGroups.value, (group) => {
              _push(`<optgroup${ssrRenderAttr("label", group.name)} data-v-9e24b3c1><!--[-->`);
              ssrRenderList(group.variables, (v) => {
                _push(`<option${ssrRenderAttr("value", v.key)} data-v-9e24b3c1>${ssrInterpolate(v.label)}</option>`);
              });
              _push(`<!--]--></optgroup>`);
            });
            _push(`<!--]--></select></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="input-group full" data-v-9e24b3c1><label data-v-9e24b3c1>Шрифт</label><select${ssrRenderAttr("value", getTextProp("fontFamily"))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1><!--[-->`);
          ssrRenderList(unref(AVAILABLE_FONTS), (font) => {
            _push(`<option${ssrRenderAttr("value", font)} data-v-9e24b3c1>${ssrInterpolate(font)}</option>`);
          });
          _push(`<!--]--></select></div><div class="input-grid" data-v-9e24b3c1><div class="input-group" data-v-9e24b3c1><label data-v-9e24b3c1>Размер</label><input type="number"${ssrRenderAttr("value", getTextProp("fontSize"))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="8" max="200" data-v-9e24b3c1></div><div class="input-group" data-v-9e24b3c1><label data-v-9e24b3c1>Межстрочный</label><input type="number"${ssrRenderAttr("value", getTextProp("lineHeight"))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="0.5" max="3" step="0.1" data-v-9e24b3c1></div></div><div class="button-group" data-v-9e24b3c1><button class="${ssrRenderClass([{ active: getTextProp("fontWeight") === "bold" }, "style-btn"])}"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="Жирный" data-v-9e24b3c1><strong data-v-9e24b3c1>B</strong></button><button class="${ssrRenderClass([{ active: getTextProp("fontStyle") === "italic" }, "style-btn"])}"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="Курсив" data-v-9e24b3c1><em data-v-9e24b3c1>I</em></button><div class="separator" data-v-9e24b3c1></div><button class="${ssrRenderClass([{ active: getTextProp("textAlign") === "left" }, "style-btn"])}"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="По левому краю" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="21" y1="6" x2="3" y2="6" data-v-9e24b3c1></line><line x1="15" y1="12" x2="3" y2="12" data-v-9e24b3c1></line><line x1="17" y1="18" x2="3" y2="18" data-v-9e24b3c1></line></svg></button><button class="${ssrRenderClass([{ active: getTextProp("textAlign") === "center" }, "style-btn"])}"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="По центру" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="21" y1="6" x2="3" y2="6" data-v-9e24b3c1></line><line x1="17" y1="12" x2="7" y2="12" data-v-9e24b3c1></line><line x1="19" y1="18" x2="5" y2="18" data-v-9e24b3c1></line></svg></button><button class="${ssrRenderClass([{ active: getTextProp("textAlign") === "right" }, "style-btn"])}"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="По правому краю" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><line x1="21" y1="6" x2="3" y2="6" data-v-9e24b3c1></line><line x1="21" y1="12" x2="9" y2="12" data-v-9e24b3c1></line><line x1="21" y1="18" x2="7" y2="18" data-v-9e24b3c1></line></svg></button></div><div class="input-group full" data-v-9e24b3c1><label data-v-9e24b3c1>Цвет</label><div class="color-picker" data-v-9e24b3c1><input type="color"${ssrRenderAttr("value", getTextProp("color"))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1><input type="text"${ssrRenderAttr("value", getTextProp("color"))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} class="color-text" data-v-9e24b3c1></div></div><div class="input-group full" data-v-9e24b3c1><label data-v-9e24b3c1>Заливка фона</label><div class="color-picker" data-v-9e24b3c1><input type="color"${ssrRenderAttr("value", getBackgroundColor())}${ssrIncludeBooleanAttr(__props.selectedElement.locked || isTransparentBackground()) ? " disabled" : ""} data-v-9e24b3c1><input type="text"${ssrRenderAttr("value", getBackgroundColor())}${ssrIncludeBooleanAttr(__props.selectedElement.locked || isTransparentBackground()) ? " disabled" : ""} class="color-text" data-v-9e24b3c1></div><div class="checkbox-group mt-1" data-v-9e24b3c1><label data-v-9e24b3c1><input type="checkbox"${ssrIncludeBooleanAttr(isTransparentBackground()) ? " checked" : ""}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1> Без заливки </label></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.selectedElement.type === "image") {
          _push(`<div class="sidebar-section" data-v-9e24b3c1><h4 class="section-title" data-v-9e24b3c1>Изображение</h4><div class="input-group full" data-v-9e24b3c1><label data-v-9e24b3c1>Подгонка</label><select${ssrRenderAttr("value", __props.selectedElement.objectFit)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1><option value="contain" data-v-9e24b3c1>Вместить</option><option value="cover" data-v-9e24b3c1>Заполнить</option><option value="fill" data-v-9e24b3c1>Растянуть</option></select></div><div class="input-group full" data-v-9e24b3c1><label data-v-9e24b3c1>Прозрачность</label><input type="range"${ssrRenderAttr("value", __props.selectedElement.opacity)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="0" max="1" step="0.05" data-v-9e24b3c1><span class="range-value" data-v-9e24b3c1>${ssrInterpolate(Math.round(__props.selectedElement.opacity * 100))}%</span></div><button class="change-image-btn"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" data-v-9e24b3c1></path><polyline points="17 8 12 3 7 8" data-v-9e24b3c1></polyline><line x1="12" y1="3" x2="12" y2="15" data-v-9e24b3c1></line></svg> Заменить изображение </button><input type="file" accept="image/*" class="hidden-input" data-v-9e24b3c1></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.selectedElement.type === "qr") {
          _push(`<div class="sidebar-section" data-v-9e24b3c1><h4 class="section-title" data-v-9e24b3c1>QR-код</h4><div class="input-group full" data-v-9e24b3c1><label data-v-9e24b3c1>Источник данных</label><select${ssrRenderAttr("value", __props.selectedElement.dataSource)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1><option value="certificate_url" data-v-9e24b3c1>URL сертификата</option><option value="certificate_number" data-v-9e24b3c1>Номер сертификата</option><option value="custom" data-v-9e24b3c1>Кастомный текст</option><option value="custom_url" data-v-9e24b3c1>Кастомный URL</option></select></div>`);
          if (["custom", "custom_url"].includes(
            __props.selectedElement.dataSource
          )) {
            _push(`<div class="input-group full" data-v-9e24b3c1><label data-v-9e24b3c1>${ssrInterpolate(__props.selectedElement.dataSource === "custom_url" ? "Базовый URL" : "Данные")}</label><input type="text"${ssrRenderAttr("value", __props.selectedElement.customData)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""}${ssrRenderAttr(
              "placeholder",
              __props.selectedElement.dataSource === "custom_url" ? "https://example.com" : "Введите данные для QR"
            )} data-v-9e24b3c1>`);
            if (__props.selectedElement.dataSource === "custom_url") {
              _push(`<p class="help-text mt-1 text-xs text-gray-500" data-v-9e24b3c1> Пример: https://domain.com/verify/${ssrInterpolate("{NUMBER}")}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="input-grid" data-v-9e24b3c1><div class="input-group" data-v-9e24b3c1><label data-v-9e24b3c1>Цвет</label><input type="color"${ssrRenderAttr("value", __props.selectedElement.color)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1></div><div class="input-group" data-v-9e24b3c1><label data-v-9e24b3c1>Фон</label><input type="color"${ssrRenderAttr("value", __props.selectedElement.backgroundColor)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.selectedElement.type === "shape") {
          _push(`<div class="sidebar-section" data-v-9e24b3c1><h4 class="section-title" data-v-9e24b3c1>Фигура</h4><div class="input-group full" data-v-9e24b3c1><label data-v-9e24b3c1>Тип</label><select${ssrRenderAttr("value", __props.selectedElement.shapeType)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1><option value="rectangle" data-v-9e24b3c1>Прямоугольник</option><option value="circle" data-v-9e24b3c1>Круг</option><option value="line" data-v-9e24b3c1>Линия</option></select></div><div class="input-grid" data-v-9e24b3c1><div class="input-group" data-v-9e24b3c1><label data-v-9e24b3c1>Заливка</label><input type="color"${ssrRenderAttr(
            "value",
            __props.selectedElement.fillColor === "transparent" ? "#ffffff" : __props.selectedElement.fillColor
          )}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1></div><div class="input-group" data-v-9e24b3c1><label data-v-9e24b3c1>Обводка</label><input type="color"${ssrRenderAttr("value", __props.selectedElement.strokeColor)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1></div></div><div class="input-group full" data-v-9e24b3c1><label data-v-9e24b3c1>Толщина обводки</label><input type="range"${ssrRenderAttr("value", __props.selectedElement.strokeWidth)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="0" max="20" data-v-9e24b3c1><span class="range-value" data-v-9e24b3c1>${ssrInterpolate(__props.selectedElement.strokeWidth)}px</span></div><div class="checkbox-group" data-v-9e24b3c1><label data-v-9e24b3c1><input type="checkbox"${ssrIncludeBooleanAttr(
            __props.selectedElement.fillColor === "transparent"
          ) ? " checked" : ""}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1> Без заливки </label></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="sidebar-section actions-section" data-v-9e24b3c1><h4 class="section-title" data-v-9e24b3c1>Действия</h4><div class="action-buttons" data-v-9e24b3c1><button class="action-button"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect width="14" height="14" x="8" y="8" rx="2" ry="2" data-v-9e24b3c1></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" data-v-9e24b3c1></path></svg> Дублировать </button><button class="action-button" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect width="8" height="8" x="8" y="8" rx="1" data-v-9e24b3c1></rect><path d="M4 16V6a2 2 0 0 1 2-2h10" data-v-9e24b3c1></path><path d="M14 22h4a2 2 0 0 0 2-2v-4" data-v-9e24b3c1></path></svg> На передний план </button><button class="action-button" data-v-9e24b3c1><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-9e24b3c1><rect width="8" height="8" x="8" y="8" rx="1" data-v-9e24b3c1></rect><path d="M4 10v10a2 2 0 0 0 2 2h10" data-v-9e24b3c1></path><path d="M10 4H6a2 2 0 0 0-2 2v4" data-v-9e24b3c1></path></svg> На задний план </button></div></div><!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/editor/EditorSidebar.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const EditorSidebar = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$2, [["__scopeId", "data-v-9e24b3c1"]]), { __name: "CertificatesEditorSidebar" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "CertificateEditor",
  __ssrInlineRender: true,
  props: {
    templateId: {},
    templateName: {},
    initialData: {}
  },
  emits: ["save", "preview"],
  setup(__props, { emit: __emit }) {
    ref(null);
    const {
      templateData,
      selectedElementId,
      selectedElement,
      selectedElementIds,
      selectedElements,
      zoom,
      isDirty,
      isSaving,
      canUndo,
      canRedo,
      minZoom,
      maxZoom,
      initTemplate,
      setLayout,
      setBackground,
      addElement,
      updateElement,
      deleteElement,
      deleteSelectedElement,
      duplicateElement,
      bringToFront,
      sendToBack,
      toggleLock,
      selectElement,
      selectMultipleElements,
      clearSelection,
      alignElement,
      alignMultipleElements,
      distributeElements
    } = useCertificateEditor();
    const showPresetConfirm = ref(false);
    const pendingPresetData = ref(null);
    ref(null);
    function handleAddText() {
      const element = createTextElement({
        x: templateData.value.width / 2 - 150,
        y: templateData.value.height / 2 - 25
      });
      addElement(element);
    }
    function handleAddVariable(variableKey) {
      const element = createVariableElement(variableKey, {
        x: templateData.value.width / 2 - 175,
        y: templateData.value.height / 2 - 20
      });
      addElement(element);
    }
    function handleAddImage(src) {
      const element = createImageElement(src, {
        x: 50,
        y: 50
      });
      addElement(element);
    }
    function handleAddQR() {
      const element = createQRElement({
        x: templateData.value.width - 150,
        y: templateData.value.height - 150
      });
      addElement(element);
    }
    function handleAddShape(shapeType) {
      const element = createShapeElement(shapeType, {
        x: templateData.value.width / 2 - 100,
        y: templateData.value.height / 2 - 50
      });
      addElement(element);
    }
    function handleElementUpdate(id, updates) {
      updateElement(id, updates);
    }
    function handleToggleLock() {
      if (selectedElementId.value) {
        toggleLock(selectedElementId.value);
      }
    }
    function handleAlign(direction) {
      if (selectedElementId.value) {
        alignElement(selectedElementId.value, direction);
      }
    }
    function handleApplyPreset(presetData) {
      if (templateData.value.elements.length > 0) {
        pendingPresetData.value = presetData;
        showPresetConfirm.value = true;
        return;
      }
      initTemplate(presetData);
    }
    function handleDeleteMultiple() {
      const ids = Array.from(selectedElementIds.value);
      ids.forEach((id) => deleteElement(id));
      clearSelection();
    }
    function handleDuplicateMultiple() {
      const ids = Array.from(selectedElementIds.value);
      ids.forEach((id) => duplicateElement(id));
    }
    function handleAlignGroup(direction) {
      const ids = Array.from(selectedElementIds.value);
      alignMultipleElements(ids, direction);
    }
    function handleDistribute(direction) {
      const ids = Array.from(selectedElementIds.value);
      distributeElements(ids, direction);
    }
    function handleDuplicate() {
      if (selectedElementId.value) {
        duplicateElement(selectedElementId.value);
      }
    }
    function handleBringToFront() {
      const ids = selectedElementIds.value.size > 0 ? Array.from(selectedElementIds.value) : selectedElementId.value ? [selectedElementId.value] : [];
      ids.forEach((id) => bringToFront(id));
    }
    function handleSendToBack() {
      const ids = selectedElementIds.value.size > 0 ? Array.from(selectedElementIds.value) : selectedElementId.value ? [selectedElementId.value] : [];
      ids.forEach((id) => sendToBack(id));
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "certificate-editor" }, _attrs))} data-v-680ea3fe><div class="editor-header" data-v-680ea3fe><div class="header-left" data-v-680ea3fe>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: `/certificates/templates/${__props.templateId}`,
        class: "back-button"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-680ea3fe${_scopeId}><path d="m15 18-6-6 6-6" data-v-680ea3fe${_scopeId}></path></svg> Назад `);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2",
                "stroke-linecap": "round",
                "stroke-linejoin": "round"
              }, [
                createVNode("path", { d: "m15 18-6-6 6-6" })
              ])),
              createTextVNode(" Назад ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h1 class="editor-title" data-v-680ea3fe>${ssrInterpolate(__props.templateName || "Редактор шаблона")}</h1></div><div class="header-center" data-v-680ea3fe><button class="toolbar-btn"${ssrIncludeBooleanAttr(!unref(canUndo)) ? " disabled" : ""} title="Отменить (Ctrl+Z)" data-v-680ea3fe><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-680ea3fe><path d="M3 7v6h6" data-v-680ea3fe></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" data-v-680ea3fe></path></svg></button><button class="toolbar-btn"${ssrIncludeBooleanAttr(!unref(canRedo)) ? " disabled" : ""} title="Повторить (Ctrl+Y)" data-v-680ea3fe><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-680ea3fe><path d="M21 7v6h-6" data-v-680ea3fe></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" data-v-680ea3fe></path></svg></button><div class="toolbar-divider" data-v-680ea3fe></div><span class="zoom-label" data-v-680ea3fe>${ssrInterpolate(Math.round(unref(zoom) * 100))}%</span><button class="toolbar-btn"${ssrIncludeBooleanAttr(unref(zoom) <= unref(minZoom)) ? " disabled" : ""} title="Уменьшить" data-v-680ea3fe><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-680ea3fe><circle cx="11" cy="11" r="8" data-v-680ea3fe></circle><path d="m21 21-4.3-4.3" data-v-680ea3fe></path><path d="M8 11h6" data-v-680ea3fe></path></svg></button><button class="toolbar-btn"${ssrIncludeBooleanAttr(unref(zoom) >= unref(maxZoom)) ? " disabled" : ""} title="Увеличить" data-v-680ea3fe><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-680ea3fe><circle cx="11" cy="11" r="8" data-v-680ea3fe></circle><path d="m21 21-4.3-4.3" data-v-680ea3fe></path><path d="M11 8v6" data-v-680ea3fe></path><path d="M8 11h6" data-v-680ea3fe></path></svg></button><button class="toolbar-btn" title="Сбросить масштаб" data-v-680ea3fe><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-680ea3fe><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24" data-v-680ea3fe></path><path d="M21 3v6h-6" data-v-680ea3fe></path></svg></button></div><div class="header-right" data-v-680ea3fe><button class="btn-preview" data-v-680ea3fe><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-680ea3fe><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" data-v-680ea3fe></path><circle cx="12" cy="12" r="3" data-v-680ea3fe></circle></svg> Предпросмотр </button><button class="btn-save"${ssrIncludeBooleanAttr(unref(isSaving) || !unref(isDirty)) ? " disabled" : ""} data-v-680ea3fe>`);
      if (!unref(isSaving)) {
        _push(`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-680ea3fe><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" data-v-680ea3fe></path><polyline points="17,21 17,13 7,13 7,21" data-v-680ea3fe></polyline><polyline points="7,3 7,8 15,8" data-v-680ea3fe></polyline></svg>`);
      } else {
        _push(`<svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-680ea3fe><path d="M21 12a9 9 0 1 1-6.219-8.56" data-v-680ea3fe></path></svg>`);
      }
      _push(` ${ssrInterpolate(unref(isSaving) ? "Сохранение..." : "Сохранить")}</button></div></div><div class="editor-main" data-v-680ea3fe>`);
      _push(ssrRenderComponent(EditorToolbar, {
        onAddText: handleAddText,
        onAddVariable: handleAddVariable,
        onAddImage: handleAddImage,
        onAddQr: handleAddQR,
        onAddShape: handleAddShape,
        onSetLayout: unref(setLayout),
        onSetBackground: unref(setBackground),
        onApplyPreset: handleApplyPreset,
        "current-layout": unref(templateData).layout,
        "template-id": __props.templateId
      }, null, _parent));
      _push(`<div class="canvas-container" data-v-680ea3fe>`);
      _push(ssrRenderComponent(EditorCanvas, {
        "template-data": unref(templateData),
        "selected-element-ids": unref(selectedElementIds),
        zoom: unref(zoom),
        onSelect: unref(selectElement),
        onSelectMultiple: unref(selectMultipleElements),
        onUpdateElement: unref(updateElement),
        onDeleteElement: unref(deleteElement)
      }, null, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(EditorSidebar, {
        "selected-element": unref(selectedElement),
        "selected-elements": unref(selectedElements),
        "template-id": __props.templateId,
        onUpdate: handleElementUpdate,
        onDelete: unref(deleteSelectedElement),
        onDeleteMultiple: handleDeleteMultiple,
        onDuplicate: handleDuplicate,
        onDuplicateMultiple: handleDuplicateMultiple,
        onBringToFront: handleBringToFront,
        onSendToBack: handleSendToBack,
        onToggleLock: handleToggleLock,
        onAlign: handleAlign,
        onAlignGroup: handleAlignGroup,
        onDistribute: handleDistribute
      }, null, _parent));
      _push(`</div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (showPresetConfirm.value) {
          _push2(`<div class="preset-confirm-overlay" data-v-680ea3fe><div class="preset-confirm-modal" data-v-680ea3fe><div class="modal-icon" data-v-680ea3fe><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-680ea3fe><path d="M12 9v4" data-v-680ea3fe></path><path d="M12 17h.01" data-v-680ea3fe></path><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" data-v-680ea3fe></path></svg></div><h3 data-v-680ea3fe>Применить шаблон?</h3><p data-v-680ea3fe> Все текущие элементы будут заменены на элементы выбранного шаблона. Это действие нельзя отменить. </p><div class="modal-actions" data-v-680ea3fe><button class="btn-cancel" data-v-680ea3fe>Отмена</button><button class="btn-confirm" data-v-680ea3fe> Применить </button></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/editor/CertificateEditor.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const CertificateEditor = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["__scopeId", "data-v-680ea3fe"]]), { __name: "CertificatesEditorCertificateEditor" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "editor",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    useRouter();
    const { authFetch } = useAuthFetch();
    const templateId = computed(() => route.params.id);
    const template = ref(null);
    const isLoading = ref(true);
    const isSaving = ref(false);
    const error = ref(null);
    const notification = ref(
      null
    );
    const showPreview = ref(false);
    const previewLoading = ref(false);
    const previewError = ref(null);
    const previewHtml = ref(null);
    const previewData = ref(null);
    const previewScale = ref(0.75);
    ref(null);
    async function handleSave(data) {
      isSaving.value = true;
      try {
        const hasBase64Images = checkForBase64Images(data);
        if (hasBase64Images) {
          console.warn(
            "[CertificateEditor] ⚠️  Обнаружены base64-изображения в templateData"
          );
          console.warn(
            "   Рекомендуется заменить их на загруженные файлы для уменьшения размера данных"
          );
          showNotification(
            "error",
            "Обнаружены встроенные изображения. Замените их через кнопку 'Загрузить фон' или 'Изображение' для оптимизации."
          );
          isSaving.value = false;
          return;
        }
        const response = await authFetch(`/api/certificates/templates/${templateId.value}`, {
          method: "PUT",
          body: {
            templateData: data,
            layout: data.layout
          }
        });
        if (response.success) {
          template.value = response.template;
          localStorage.removeItem(`certificate_template_draft_${templateId.value}`);
          showNotification("success", "Шаблон успешно сохранён");
          console.log("[CertificateEditor] Шаблон сохранён, localStorage очищен");
        } else {
          throw new Error("Ошибка сохранения");
        }
      } catch (e) {
        console.error("[CertificateEditor] Ошибка сохранения:", e);
        showNotification("error", "Ошибка сохранения шаблона");
      } finally {
        isSaving.value = false;
      }
    }
    function checkForBase64Images(data) {
      if (data.background?.type === "image" && data.background.value?.startsWith("data:image/")) {
        return true;
      }
      for (const element of data.elements) {
        if (element.type === "image" && element.src?.startsWith("data:image/")) {
          return true;
        }
      }
      return false;
    }
    async function handlePreview() {
      showPreview.value = true;
      await nextTick();
      await loadPreview();
    }
    async function loadPreview() {
      previewLoading.value = true;
      previewError.value = null;
      try {
        const response = await authFetch(`/api/certificates/templates/${templateId.value}/preview`);
        if (response.success && response.hasTemplate && response.preview) {
          previewHtml.value = response.preview.html;
          previewData.value = {
            width: response.preview.width,
            height: response.preview.height,
            elementsCount: response.preview.elementsCount
          };
        } else {
          previewError.value = response.message || "Шаблон не настроен";
        }
      } catch (e) {
        console.error("[CertificateEditor] Ошибка загрузки preview:", e);
        previewError.value = "Ошибка генерации предпросмотра";
      } finally {
        previewLoading.value = false;
      }
    }
    function showNotification(type, message) {
      notification.value = { type, message };
      setTimeout(() => {
        notification.value = null;
      }, 3e3);
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "editor-page" }, _attrs))} data-v-b11c673c>`);
      if (template.value) {
        _push(ssrRenderComponent(CertificateEditor, {
          "template-id": templateId.value,
          "template-name": template.value.name,
          "initial-data": template.value.templateData || void 0,
          onSave: handleSave,
          onPreview: handlePreview
        }, null, _parent));
      } else if (isLoading.value) {
        _push(`<div class="loading-state" data-v-b11c673c><div class="loading-spinner" data-v-b11c673c></div><p data-v-b11c673c>Загрузка шаблона...</p></div>`);
      } else if (error.value) {
        _push(`<div class="error-state" data-v-b11c673c><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-b11c673c><circle cx="12" cy="12" r="10" data-v-b11c673c></circle><path d="m15 9-6 6" data-v-b11c673c></path><path d="m9 9 6 6" data-v-b11c673c></path></svg><h2 data-v-b11c673c>Ошибка загрузки</h2><p data-v-b11c673c>${ssrInterpolate(error.value)}</p><button data-v-b11c673c>Повторить</button></div>`);
      } else {
        _push(`<!---->`);
      }
      ssrRenderTeleport(_push, (_push2) => {
        if (showPreview.value) {
          _push2(`<div class="preview-modal" data-v-b11c673c><div class="preview-content" data-v-b11c673c><div class="preview-header" data-v-b11c673c><h3 data-v-b11c673c>Предпросмотр сертификата</h3>`);
          if (previewData.value) {
            _push2(`<div class="preview-info" data-v-b11c673c><span class="info-badge" data-v-b11c673c>${ssrInterpolate(previewData.value.width)}×${ssrInterpolate(previewData.value.height)}px</span><span class="info-badge" data-v-b11c673c>${ssrInterpolate(previewData.value.elementsCount)} элементов</span></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`<button class="close-btn" data-v-b11c673c><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-b11c673c><path d="M18 6 6 18" data-v-b11c673c></path><path d="m6 6 12 12" data-v-b11c673c></path></svg></button></div><div class="preview-body" data-v-b11c673c>`);
          if (previewLoading.value) {
            _push2(`<div class="preview-loading" data-v-b11c673c><div class="loading-spinner" data-v-b11c673c></div><p data-v-b11c673c>Генерация предпросмотра...</p></div>`);
          } else if (previewError.value) {
            _push2(`<div class="preview-error" data-v-b11c673c><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-b11c673c><circle cx="12" cy="12" r="10" data-v-b11c673c></circle><path d="M12 8v4" data-v-b11c673c></path><path d="M12 16h.01" data-v-b11c673c></path></svg><p data-v-b11c673c>${ssrInterpolate(previewError.value)}</p></div>`);
          } else if (previewHtml.value) {
            _push2(`<div class="preview-certificate" style="${ssrRenderStyle({
              width: `${(previewData.value?.width || 1123) * previewScale.value}px`,
              height: `${(previewData.value?.height || 794) * previewScale.value}px`
            })}" data-v-b11c673c><iframe${ssrRenderAttr("srcdoc", previewHtml.value)} class="preview-iframe" sandbox="allow-same-origin" data-v-b11c673c></iframe></div>`);
          } else {
            _push2(`<div class="preview-empty" data-v-b11c673c><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-b11c673c><rect width="18" height="18" x="3" y="3" rx="2" ry="2" data-v-b11c673c></rect><circle cx="9" cy="9" r="2" data-v-b11c673c></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" data-v-b11c673c></path></svg><p data-v-b11c673c>Нажмите &quot;Обновить&quot; для генерации предпросмотра</p></div>`);
          }
          _push2(`</div><div class="preview-footer" data-v-b11c673c><div class="footer-left" data-v-b11c673c><span class="scale-label" data-v-b11c673c>Масштаб:</span><button class="${ssrRenderClass([{ active: previewScale.value === 0.5 }, "scale-btn"])}" data-v-b11c673c> 50% </button><button class="${ssrRenderClass([{ active: previewScale.value === 0.75 }, "scale-btn"])}" data-v-b11c673c> 75% </button><button class="${ssrRenderClass([{ active: previewScale.value === 1 }, "scale-btn"])}" data-v-b11c673c> 100% </button></div><div class="footer-right" data-v-b11c673c><button class="btn-refresh"${ssrIncludeBooleanAttr(previewLoading.value) ? " disabled" : ""} data-v-b11c673c><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-b11c673c><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24" data-v-b11c673c></path><path d="M21 3v6h-6" data-v-b11c673c></path></svg> Обновить </button><button class="btn-secondary" data-v-b11c673c> Закрыть </button></div></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      ssrRenderTeleport(_push, (_push2) => {
        if (notification.value) {
          _push2(`<div class="${ssrRenderClass([notification.value.type, "notification"])}" data-v-b11c673c>`);
          if (notification.value.type === "success") {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-b11c673c><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" data-v-b11c673c></path><path d="m9 11 3 3L22 4" data-v-b11c673c></path></svg>`);
          } else {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-b11c673c><circle cx="12" cy="12" r="10" data-v-b11c673c></circle><path d="M12 8v4" data-v-b11c673c></path><path d="M12 16h.01" data-v-b11c673c></path></svg>`);
          }
          _push2(`<span data-v-b11c673c>${ssrInterpolate(notification.value.message)}</span></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/certificates/templates/[id]/editor.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const editor = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-b11c673c"]]);

export { editor as default };
//# sourceMappingURL=editor-Czc-_jXr.mjs.map
