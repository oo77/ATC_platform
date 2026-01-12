import { defineComponent, computed, ref, mergeProps, nextTick, withCtx, createBlock, createTextVNode, openBlock, createVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderTeleport, ssrRenderStyle, ssrRenderAttr, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderList } from 'vue/server-renderer';
import { useRoute, useRouter } from 'vue-router';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { u as useCertificateEditor, c as createShapeElement, a as createQRElement, b as createImageElement, d as createVariableElement, e as createTextElement, A as AVAILABLE_VARIABLES, f as AVAILABLE_FONTS } from './useCertificateEditor-CXYGNl0s.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import './server.mjs';
import '../nitro/nitro.mjs';
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
import 'jsonwebtoken';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';

const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "EditorToolbar",
  __ssrInlineRender: true,
  props: {
    currentLayout: {}
  },
  emits: ["add-text", "add-variable", "add-image", "add-qr", "add-shape", "set-layout", "set-background", "apply-preset"],
  setup(__props, { emit: __emit }) {
    const showVariableMenu = ref(false);
    const showShapeMenu = ref(false);
    ref(null);
    ref(null);
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
        variables: AVAILABLE_VARIABLES.filter((v) => v.key.startsWith("certificate."))
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "editor-toolbar" }, _attrs))} data-v-44da344a><div class="toolbar-section" data-v-44da344a><h3 class="section-title" data-v-44da344a>Элементы</h3><button class="tool-btn" title="Добавить текст" data-v-44da344a><div class="tool-icon" data-v-44da344a><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-44da344a><polyline points="4,7 4,4 20,4 20,7" data-v-44da344a></polyline><line x1="9" y1="20" x2="15" y2="20" data-v-44da344a></line><line x1="12" y1="4" x2="12" y2="20" data-v-44da344a></line></svg></div><span class="tool-label" data-v-44da344a>Текст</span></button><div class="tool-dropdown" data-v-44da344a><button class="tool-btn" title="Добавить переменную" data-v-44da344a><div class="tool-icon variable-icon" data-v-44da344a><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-44da344a><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" data-v-44da344a></path><path d="M8 10h8" data-v-44da344a></path><path d="M8 14h4" data-v-44da344a></path></svg></div><span class="tool-label" data-v-44da344a>Переменная</span><svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-44da344a><path d="m6 9 6 6 6-6" data-v-44da344a></path></svg></button>`);
      if (showVariableMenu.value) {
        _push(`<div class="dropdown-menu" data-v-44da344a><div class="dropdown-header" data-v-44da344a>Выберите переменную</div><!--[-->`);
        ssrRenderList(variableGroups.value, (group) => {
          _push(`<div class="dropdown-group" data-v-44da344a><div class="group-title" data-v-44da344a>${ssrInterpolate(group.name)}</div><!--[-->`);
          ssrRenderList(group.variables, (variable) => {
            _push(`<button class="dropdown-item" data-v-44da344a><span class="var-label" data-v-44da344a>${ssrInterpolate(variable.label)}</span><span class="var-placeholder" data-v-44da344a>${ssrInterpolate(variable.placeholder)}</span></button>`);
          });
          _push(`<!--]--></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><button class="tool-btn" title="Добавить изображение" data-v-44da344a><div class="tool-icon" data-v-44da344a><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-44da344a><rect width="18" height="18" x="3" y="3" rx="2" ry="2" data-v-44da344a></rect><circle cx="9" cy="9" r="2" data-v-44da344a></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" data-v-44da344a></path></svg></div><span class="tool-label" data-v-44da344a>Изображение</span></button><input type="file" accept="image/*" class="hidden-input" data-v-44da344a><button class="tool-btn" title="Добавить QR-код" data-v-44da344a><div class="tool-icon" data-v-44da344a><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-44da344a><rect width="5" height="5" x="3" y="3" rx="1" data-v-44da344a></rect><rect width="5" height="5" x="16" y="3" rx="1" data-v-44da344a></rect><rect width="5" height="5" x="3" y="16" rx="1" data-v-44da344a></rect><path d="M21 16h-3a2 2 0 0 0-2 2v3" data-v-44da344a></path><path d="M21 21v.01" data-v-44da344a></path><path d="M12 7v3a2 2 0 0 1-2 2H7" data-v-44da344a></path><path d="M3 12h.01" data-v-44da344a></path><path d="M12 3h.01" data-v-44da344a></path><path d="M12 16v.01" data-v-44da344a></path><path d="M16 12h1" data-v-44da344a></path><path d="M21 12v.01" data-v-44da344a></path><path d="M12 21v-1" data-v-44da344a></path></svg></div><span class="tool-label" data-v-44da344a>QR-код</span></button><div class="tool-dropdown" data-v-44da344a><button class="tool-btn" title="Добавить фигуру" data-v-44da344a><div class="tool-icon" data-v-44da344a><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-44da344a><rect width="14" height="14" x="5" y="5" rx="2" data-v-44da344a></rect></svg></div><span class="tool-label" data-v-44da344a>Фигуры</span><svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-44da344a><path d="m6 9 6 6 6-6" data-v-44da344a></path></svg></button>`);
      if (showShapeMenu.value) {
        _push(`<div class="dropdown-menu shapes-menu" data-v-44da344a><button class="dropdown-item shape-item" data-v-44da344a><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-44da344a><rect width="18" height="14" x="3" y="5" rx="2" data-v-44da344a></rect></svg><span data-v-44da344a>Прямоугольник</span></button><button class="dropdown-item shape-item" data-v-44da344a><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-44da344a><circle cx="12" cy="12" r="9" data-v-44da344a></circle></svg><span data-v-44da344a>Круг</span></button><button class="dropdown-item shape-item" data-v-44da344a><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-44da344a><path d="M5 19L19 5" data-v-44da344a></path></svg><span data-v-44da344a>Линия</span></button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="toolbar-section" data-v-44da344a><h3 class="section-title" data-v-44da344a>Макет</h3><div class="layout-options" data-v-44da344a><button class="${ssrRenderClass([{ active: __props.currentLayout === "A4_landscape" }, "layout-btn"])}" title="A4 альбомная" data-v-44da344a><div class="layout-preview landscape" data-v-44da344a></div><span data-v-44da344a>Альбомная</span></button><button class="${ssrRenderClass([{ active: __props.currentLayout === "A4_portrait" }, "layout-btn"])}" title="A4 книжная" data-v-44da344a><div class="layout-preview portrait" data-v-44da344a></div><span data-v-44da344a>Книжная</span></button></div></div><div class="toolbar-section" data-v-44da344a><h3 class="section-title" data-v-44da344a>Фон</h3><div class="background-options" data-v-44da344a><button class="bg-btn" title="Белый фон" data-v-44da344a><div class="color-swatch" style="${ssrRenderStyle({ "background": "#FFFFFF", "border": "1px solid #E5E7EB" })}" data-v-44da344a></div></button><button class="bg-btn" title="Кремовый фон" data-v-44da344a><div class="color-swatch" style="${ssrRenderStyle({ "background": "#FFF8E7" })}" data-v-44da344a></div></button><button class="bg-btn" title="Голубоватый фон" data-v-44da344a><div class="color-swatch" style="${ssrRenderStyle({ "background": "#F0F9FF" })}" data-v-44da344a></div></button><button class="bg-btn" title="Зеленоватый фон" data-v-44da344a><div class="color-swatch" style="${ssrRenderStyle({ "background": "#F0FDF4" })}" data-v-44da344a></div></button><button class="bg-btn upload-bg" title="Загрузить фон" data-v-44da344a><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-44da344a><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" data-v-44da344a></path><polyline points="17 8 12 3 7 8" data-v-44da344a></polyline><line x1="12" y1="3" x2="12" y2="15" data-v-44da344a></line></svg></button></div><input type="file" accept="image/*" class="hidden-input" data-v-44da344a></div><div class="toolbar-section presets-section" data-v-44da344a><h3 class="section-title" data-v-44da344a>Шаблоны</h3><button class="preset-btn" title="Классический" data-v-44da344a><div class="preset-preview classic" data-v-44da344a><div class="pp-line" data-v-44da344a></div><div class="pp-line short" data-v-44da344a></div><div class="pp-line" data-v-44da344a></div></div><span data-v-44da344a>Классический</span></button><button class="preset-btn" title="Современный" data-v-44da344a><div class="preset-preview modern" data-v-44da344a><div class="pp-line" data-v-44da344a></div><div class="pp-line short" data-v-44da344a></div><div class="pp-line" data-v-44da344a></div></div><span data-v-44da344a>Современный</span></button><button class="preset-btn" title="Минималистичный" data-v-44da344a><div class="preset-preview minimal" data-v-44da344a><div class="pp-line" data-v-44da344a></div><div class="pp-line short" data-v-44da344a></div></div><span data-v-44da344a>Минимальный</span></button></div></div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/editor/EditorToolbar.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const EditorToolbar = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$4, [["__scopeId", "data-v-44da344a"]]), { __name: "CertificatesEditorToolbar" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "EditorCanvas",
  __ssrInlineRender: true,
  props: {
    templateData: {},
    selectedElementId: {},
    zoom: {}
  },
  emits: ["select", "update-element", "delete-element"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const editingId = ref(null);
    ref(null);
    ref(false);
    ref(0);
    ref(0);
    ref(0);
    ref(0);
    ref(null);
    ref(false);
    ref("");
    ref(0);
    ref(0);
    ref(0);
    ref(0);
    ref(0);
    ref(0);
    ref(null);
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
      }, _attrs))} data-v-3537738d><div class="canvas-content" style="${ssrRenderStyle({
        width: `${__props.templateData.width}px`,
        height: `${__props.templateData.height}px`,
        transform: `scale(${__props.zoom})`,
        transformOrigin: "top left",
        background: backgroundStyle.value
      })}" data-v-3537738d><!--[-->`);
      ssrRenderList(sortedElements.value, (element) => {
        _push(`<div class="${ssrRenderClass([{
          selected: element.id === __props.selectedElementId,
          locked: element.locked
        }, "canvas-element"])}" style="${ssrRenderStyle(getElementStyle(element))}" data-v-3537738d>`);
        if (element.type === "text") {
          _push(`<div class="text-content" style="${ssrRenderStyle(getTextStyle(element))}"${ssrRenderAttr("contenteditable", editingId.value === element.id)} data-v-3537738d>${ssrInterpolate(element.content)}</div>`);
        } else if (element.type === "variable") {
          _push(`<div class="variable-content" style="${ssrRenderStyle(getTextStyle(element))}" data-v-3537738d><span class="variable-badge" data-v-3537738d>${ssrInterpolate(getVariableLabel(element.variableKey))}</span> ${ssrInterpolate(element.placeholder)}</div>`);
        } else if (element.type === "image") {
          _push(`<img${ssrRenderAttr("src", element.src)} style="${ssrRenderStyle({
            width: "100%",
            height: "100%",
            objectFit: element.objectFit,
            opacity: element.opacity
          })}" draggable="false" data-v-3537738d>`);
        } else if (element.type === "qr") {
          _push(`<div class="qr-placeholder" style="${ssrRenderStyle({ background: element.backgroundColor })}" data-v-3537738d><svg xmlns="http://www.w3.org/2000/svg" width="80%" height="80%" viewBox="0 0 24 24" fill="none"${ssrRenderAttr("stroke", element.color)} stroke-width="1.5" data-v-3537738d><rect width="5" height="5" x="3" y="3" rx="1" data-v-3537738d></rect><rect width="5" height="5" x="16" y="3" rx="1" data-v-3537738d></rect><rect width="5" height="5" x="3" y="16" rx="1" data-v-3537738d></rect><path d="M21 16h-3a2 2 0 0 0-2 2v3" data-v-3537738d></path><path d="M21 21v.01" data-v-3537738d></path><path d="M12 7v3a2 2 0 0 1-2 2H7" data-v-3537738d></path><path d="M3 12h.01" data-v-3537738d></path><path d="M12 3h.01" data-v-3537738d></path><path d="M12 16v.01" data-v-3537738d></path><path d="M16 12h1" data-v-3537738d></path><path d="M21 12v.01" data-v-3537738d></path><path d="M12 21v-1" data-v-3537738d></path></svg><span class="qr-label" data-v-3537738d>QR</span></div>`);
        } else if (element.type === "shape") {
          _push(`<svg class="shape-svg"${ssrRenderAttr("width", element.width)}${ssrRenderAttr("height", element.height)} data-v-3537738d>`);
          if (element.shapeType === "rectangle") {
            _push(`<rect x="0" y="0"${ssrRenderAttr("width", element.width)}${ssrRenderAttr("height", element.height)}${ssrRenderAttr("fill", element.fillColor)}${ssrRenderAttr("stroke", element.strokeColor)}${ssrRenderAttr("stroke-width", element.strokeWidth)} data-v-3537738d></rect>`);
          } else if (element.shapeType === "circle") {
            _push(`<ellipse${ssrRenderAttr("cx", element.width / 2)}${ssrRenderAttr("cy", element.height / 2)}${ssrRenderAttr("rx", element.width / 2 - element.strokeWidth / 2)}${ssrRenderAttr("ry", element.height / 2 - element.strokeWidth / 2)}${ssrRenderAttr("fill", element.fillColor)}${ssrRenderAttr("stroke", element.strokeColor)}${ssrRenderAttr("stroke-width", element.strokeWidth)} data-v-3537738d></ellipse>`);
          } else if (element.shapeType === "line") {
            _push(`<line x1="0" y1="0"${ssrRenderAttr("x2", element.width)}${ssrRenderAttr("y2", element.height)}${ssrRenderAttr("stroke", element.strokeColor)}${ssrRenderAttr("stroke-width", element.strokeWidth)} data-v-3537738d></line>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</svg>`);
        } else {
          _push(`<!---->`);
        }
        if (element.id === __props.selectedElementId && !element.locked) {
          _push(`<!--[--><div class="resize-handle nw" data-v-3537738d></div><div class="resize-handle ne" data-v-3537738d></div><div class="resize-handle sw" data-v-3537738d></div><div class="resize-handle se" data-v-3537738d></div><div class="resize-handle n" data-v-3537738d></div><div class="resize-handle s" data-v-3537738d></div><div class="resize-handle e" data-v-3537738d></div><div class="resize-handle w" data-v-3537738d></div><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        if (element.locked) {
          _push(`<div class="lock-indicator" data-v-3537738d><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-3537738d><rect width="18" height="11" x="3" y="11" rx="2" ry="2" data-v-3537738d></rect><path d="M7 11V7a5 5 0 0 1 10 0v4" data-v-3537738d></path></svg></div>`);
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
const EditorCanvas = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$3, [["__scopeId", "data-v-3537738d"]]), { __name: "CertificatesEditorCanvas" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "EditorSidebar",
  __ssrInlineRender: true,
  props: {
    selectedElement: {}
  },
  emits: ["update", "delete", "duplicate", "bring-to-front", "send-to-back", "toggle-lock"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    ref(null);
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
        variables: AVAILABLE_VARIABLES.filter((v) => v.key.startsWith("certificate."))
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "editor-sidebar" }, _attrs))} data-v-586d9b9e>`);
      if (!__props.selectedElement) {
        _push(`<div class="empty-state" data-v-586d9b9e><div class="empty-icon" data-v-586d9b9e><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-586d9b9e><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" data-v-586d9b9e></path></svg></div><p class="empty-title" data-v-586d9b9e>Выберите элемент</p><p class="empty-text" data-v-586d9b9e>Кликните на элемент на холсте, чтобы редактировать его свойства</p></div>`);
      } else {
        _push(`<!--[--><div class="sidebar-header" data-v-586d9b9e><span class="${ssrRenderClass([__props.selectedElement.type, "element-type-badge"])}" data-v-586d9b9e>${ssrInterpolate(getElementTypeLabel(__props.selectedElement.type))}</span><div class="header-actions" data-v-586d9b9e><button class="${ssrRenderClass([{ active: __props.selectedElement.locked }, "action-btn"])}"${ssrRenderAttr("title", __props.selectedElement.locked ? "Разблокировать" : "Заблокировать")} data-v-586d9b9e>`);
        if (__props.selectedElement.locked) {
          _push(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-586d9b9e><rect width="18" height="11" x="3" y="11" rx="2" ry="2" data-v-586d9b9e></rect><path d="M7 11V7a5 5 0 0 1 10 0v4" data-v-586d9b9e></path></svg>`);
        } else {
          _push(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-586d9b9e><rect width="18" height="11" x="3" y="11" rx="2" ry="2" data-v-586d9b9e></rect><path d="M7 11V7a5 5 0 0 1 9.9-1" data-v-586d9b9e></path></svg>`);
        }
        _push(`</button><button class="action-btn delete" title="Удалить" data-v-586d9b9e><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-586d9b9e><path d="M3 6h18" data-v-586d9b9e></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" data-v-586d9b9e></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" data-v-586d9b9e></path></svg></button></div></div><div class="sidebar-section" data-v-586d9b9e><h4 class="section-title" data-v-586d9b9e>Позиция и размер</h4><div class="input-grid" data-v-586d9b9e><div class="input-group" data-v-586d9b9e><label data-v-586d9b9e>X</label><input type="number"${ssrRenderAttr("value", Math.round(__props.selectedElement.x))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e></div><div class="input-group" data-v-586d9b9e><label data-v-586d9b9e>Y</label><input type="number"${ssrRenderAttr("value", Math.round(__props.selectedElement.y))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e></div><div class="input-group" data-v-586d9b9e><label data-v-586d9b9e>Ширина</label><input type="number"${ssrRenderAttr("value", Math.round(__props.selectedElement.width))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="20" data-v-586d9b9e></div><div class="input-group" data-v-586d9b9e><label data-v-586d9b9e>Высота</label><input type="number"${ssrRenderAttr("value", Math.round(__props.selectedElement.height))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="20" data-v-586d9b9e></div></div><div class="input-group full" data-v-586d9b9e><label data-v-586d9b9e>Поворот (°)</label><input type="range"${ssrRenderAttr("value", __props.selectedElement.rotation)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="0" max="360" data-v-586d9b9e><span class="range-value" data-v-586d9b9e>${ssrInterpolate(__props.selectedElement.rotation)}°</span></div></div>`);
        if (__props.selectedElement.type === "text" || __props.selectedElement.type === "variable") {
          _push(`<div class="sidebar-section" data-v-586d9b9e><h4 class="section-title" data-v-586d9b9e>Текст</h4>`);
          if (__props.selectedElement.type === "text") {
            _push(`<div class="input-group full" data-v-586d9b9e><label data-v-586d9b9e>Содержимое</label><textarea${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} rows="2" data-v-586d9b9e>${ssrInterpolate(__props.selectedElement.content)}</textarea></div>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.selectedElement.type === "variable") {
            _push(`<div class="input-group full" data-v-586d9b9e><label data-v-586d9b9e>Переменная</label><select${ssrRenderAttr("value", __props.selectedElement.variableKey)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e><!--[-->`);
            ssrRenderList(variableGroups.value, (group) => {
              _push(`<optgroup${ssrRenderAttr("label", group.name)} data-v-586d9b9e><!--[-->`);
              ssrRenderList(group.variables, (v) => {
                _push(`<option${ssrRenderAttr("value", v.key)} data-v-586d9b9e>${ssrInterpolate(v.label)}</option>`);
              });
              _push(`<!--]--></optgroup>`);
            });
            _push(`<!--]--></select></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="input-group full" data-v-586d9b9e><label data-v-586d9b9e>Шрифт</label><select${ssrRenderAttr("value", getTextProp("fontFamily"))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e><!--[-->`);
          ssrRenderList(unref(AVAILABLE_FONTS), (font) => {
            _push(`<option${ssrRenderAttr("value", font)} data-v-586d9b9e>${ssrInterpolate(font)}</option>`);
          });
          _push(`<!--]--></select></div><div class="input-grid" data-v-586d9b9e><div class="input-group" data-v-586d9b9e><label data-v-586d9b9e>Размер</label><input type="number"${ssrRenderAttr("value", getTextProp("fontSize"))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="8" max="200" data-v-586d9b9e></div><div class="input-group" data-v-586d9b9e><label data-v-586d9b9e>Межстрочный</label><input type="number"${ssrRenderAttr("value", getTextProp("lineHeight"))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="0.5" max="3" step="0.1" data-v-586d9b9e></div></div><div class="button-group" data-v-586d9b9e><button class="${ssrRenderClass([{ active: getTextProp("fontWeight") === "bold" }, "style-btn"])}"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="Жирный" data-v-586d9b9e><strong data-v-586d9b9e>B</strong></button><button class="${ssrRenderClass([{ active: getTextProp("fontStyle") === "italic" }, "style-btn"])}"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="Курсив" data-v-586d9b9e><em data-v-586d9b9e>I</em></button><div class="separator" data-v-586d9b9e></div><button class="${ssrRenderClass([{ active: getTextProp("textAlign") === "left" }, "style-btn"])}"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="По левому краю" data-v-586d9b9e><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-586d9b9e><line x1="21" y1="6" x2="3" y2="6" data-v-586d9b9e></line><line x1="15" y1="12" x2="3" y2="12" data-v-586d9b9e></line><line x1="17" y1="18" x2="3" y2="18" data-v-586d9b9e></line></svg></button><button class="${ssrRenderClass([{ active: getTextProp("textAlign") === "center" }, "style-btn"])}"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="По центру" data-v-586d9b9e><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-586d9b9e><line x1="21" y1="6" x2="3" y2="6" data-v-586d9b9e></line><line x1="17" y1="12" x2="7" y2="12" data-v-586d9b9e></line><line x1="19" y1="18" x2="5" y2="18" data-v-586d9b9e></line></svg></button><button class="${ssrRenderClass([{ active: getTextProp("textAlign") === "right" }, "style-btn"])}"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} title="По правому краю" data-v-586d9b9e><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-586d9b9e><line x1="21" y1="6" x2="3" y2="6" data-v-586d9b9e></line><line x1="21" y1="12" x2="9" y2="12" data-v-586d9b9e></line><line x1="21" y1="18" x2="7" y2="18" data-v-586d9b9e></line></svg></button></div><div class="input-group full" data-v-586d9b9e><label data-v-586d9b9e>Цвет</label><div class="color-picker" data-v-586d9b9e><input type="color"${ssrRenderAttr("value", getTextProp("color"))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e><input type="text"${ssrRenderAttr("value", getTextProp("color"))}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} class="color-text" data-v-586d9b9e></div></div><div class="input-group full" data-v-586d9b9e><label data-v-586d9b9e>Заливка фона</label><div class="color-picker" data-v-586d9b9e><input type="color"${ssrRenderAttr("value", getBackgroundColor())}${ssrIncludeBooleanAttr(__props.selectedElement.locked || isTransparentBackground()) ? " disabled" : ""} data-v-586d9b9e><input type="text"${ssrRenderAttr("value", getBackgroundColor())}${ssrIncludeBooleanAttr(__props.selectedElement.locked || isTransparentBackground()) ? " disabled" : ""} class="color-text" data-v-586d9b9e></div><div class="checkbox-group mt-1" data-v-586d9b9e><label data-v-586d9b9e><input type="checkbox"${ssrIncludeBooleanAttr(isTransparentBackground()) ? " checked" : ""}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e> Без заливки </label></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.selectedElement.type === "image") {
          _push(`<div class="sidebar-section" data-v-586d9b9e><h4 class="section-title" data-v-586d9b9e>Изображение</h4><div class="input-group full" data-v-586d9b9e><label data-v-586d9b9e>Подгонка</label><select${ssrRenderAttr("value", __props.selectedElement.objectFit)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e><option value="contain" data-v-586d9b9e>Вместить</option><option value="cover" data-v-586d9b9e>Заполнить</option><option value="fill" data-v-586d9b9e>Растянуть</option></select></div><div class="input-group full" data-v-586d9b9e><label data-v-586d9b9e>Прозрачность</label><input type="range"${ssrRenderAttr("value", __props.selectedElement.opacity)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="0" max="1" step="0.05" data-v-586d9b9e><span class="range-value" data-v-586d9b9e>${ssrInterpolate(Math.round(__props.selectedElement.opacity * 100))}%</span></div><button class="change-image-btn"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-586d9b9e><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" data-v-586d9b9e></path><polyline points="17 8 12 3 7 8" data-v-586d9b9e></polyline><line x1="12" y1="3" x2="12" y2="15" data-v-586d9b9e></line></svg> Заменить изображение </button><input type="file" accept="image/*" class="hidden-input" data-v-586d9b9e></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.selectedElement.type === "qr") {
          _push(`<div class="sidebar-section" data-v-586d9b9e><h4 class="section-title" data-v-586d9b9e>QR-код</h4><div class="input-group full" data-v-586d9b9e><label data-v-586d9b9e>Источник данных</label><select${ssrRenderAttr("value", __props.selectedElement.dataSource)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e><option value="certificate_url" data-v-586d9b9e>URL сертификата</option><option value="certificate_number" data-v-586d9b9e>Номер сертификата</option><option value="custom" data-v-586d9b9e>Кастомный</option></select></div>`);
          if (__props.selectedElement.dataSource === "custom") {
            _push(`<div class="input-group full" data-v-586d9b9e><label data-v-586d9b9e>Данные</label><input type="text"${ssrRenderAttr("value", __props.selectedElement.customData)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} placeholder="Введите данные для QR" data-v-586d9b9e></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="input-grid" data-v-586d9b9e><div class="input-group" data-v-586d9b9e><label data-v-586d9b9e>Цвет</label><input type="color"${ssrRenderAttr("value", __props.selectedElement.color)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e></div><div class="input-group" data-v-586d9b9e><label data-v-586d9b9e>Фон</label><input type="color"${ssrRenderAttr("value", __props.selectedElement.backgroundColor)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.selectedElement.type === "shape") {
          _push(`<div class="sidebar-section" data-v-586d9b9e><h4 class="section-title" data-v-586d9b9e>Фигура</h4><div class="input-group full" data-v-586d9b9e><label data-v-586d9b9e>Тип</label><select${ssrRenderAttr("value", __props.selectedElement.shapeType)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e><option value="rectangle" data-v-586d9b9e>Прямоугольник</option><option value="circle" data-v-586d9b9e>Круг</option><option value="line" data-v-586d9b9e>Линия</option></select></div><div class="input-grid" data-v-586d9b9e><div class="input-group" data-v-586d9b9e><label data-v-586d9b9e>Заливка</label><input type="color"${ssrRenderAttr("value", __props.selectedElement.fillColor === "transparent" ? "#ffffff" : __props.selectedElement.fillColor)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e></div><div class="input-group" data-v-586d9b9e><label data-v-586d9b9e>Обводка</label><input type="color"${ssrRenderAttr("value", __props.selectedElement.strokeColor)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e></div></div><div class="input-group full" data-v-586d9b9e><label data-v-586d9b9e>Толщина обводки</label><input type="range"${ssrRenderAttr("value", __props.selectedElement.strokeWidth)}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} min="0" max="20" data-v-586d9b9e><span class="range-value" data-v-586d9b9e>${ssrInterpolate(__props.selectedElement.strokeWidth)}px</span></div><div class="checkbox-group" data-v-586d9b9e><label data-v-586d9b9e><input type="checkbox"${ssrIncludeBooleanAttr(__props.selectedElement.fillColor === "transparent") ? " checked" : ""}${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e> Без заливки </label></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="sidebar-section actions-section" data-v-586d9b9e><h4 class="section-title" data-v-586d9b9e>Действия</h4><div class="action-buttons" data-v-586d9b9e><button class="action-button"${ssrIncludeBooleanAttr(__props.selectedElement.locked) ? " disabled" : ""} data-v-586d9b9e><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-586d9b9e><rect width="14" height="14" x="8" y="8" rx="2" ry="2" data-v-586d9b9e></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" data-v-586d9b9e></path></svg> Дублировать </button><button class="action-button" data-v-586d9b9e><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-586d9b9e><rect width="8" height="8" x="8" y="8" rx="1" data-v-586d9b9e></rect><path d="M4 16V6a2 2 0 0 1 2-2h10" data-v-586d9b9e></path><path d="M14 22h4a2 2 0 0 0 2-2v-4" data-v-586d9b9e></path></svg> На передний план </button><button class="action-button" data-v-586d9b9e><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-586d9b9e><rect width="8" height="8" x="8" y="8" rx="1" data-v-586d9b9e></rect><path d="M4 10v10a2 2 0 0 0 2 2h10" data-v-586d9b9e></path><path d="M10 4H6a2 2 0 0 0-2 2v4" data-v-586d9b9e></path></svg> На задний план </button></div></div><!--]-->`);
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
const EditorSidebar = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$2, [["__scopeId", "data-v-586d9b9e"]]), { __name: "CertificatesEditorSidebar" });
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
      selectElement
    } = useCertificateEditor();
    const showPresetConfirm = ref(false);
    const pendingPresetData = ref(null);
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
    function handleDuplicate() {
      if (selectedElementId.value) {
        duplicateElement(selectedElementId.value);
      }
    }
    function handleBringToFront() {
      if (selectedElementId.value) {
        bringToFront(selectedElementId.value);
      }
    }
    function handleSendToBack() {
      if (selectedElementId.value) {
        sendToBack(selectedElementId.value);
      }
    }
    function handleToggleLock() {
      if (selectedElementId.value) {
        toggleLock(selectedElementId.value);
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
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "certificate-editor" }, _attrs))} data-v-e8977d03><div class="editor-header" data-v-e8977d03><div class="header-left" data-v-e8977d03>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: `/certificates/templates/${__props.templateId}`,
        class: "back-button"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-e8977d03${_scopeId}><path d="m15 18-6-6 6-6" data-v-e8977d03${_scopeId}></path></svg> Назад `);
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
      _push(`<h1 class="editor-title" data-v-e8977d03>${ssrInterpolate(__props.templateName || "Редактор шаблона")}</h1></div><div class="header-center" data-v-e8977d03><button class="toolbar-btn"${ssrIncludeBooleanAttr(!unref(canUndo)) ? " disabled" : ""} title="Отменить (Ctrl+Z)" data-v-e8977d03><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-e8977d03><path d="M3 7v6h6" data-v-e8977d03></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" data-v-e8977d03></path></svg></button><button class="toolbar-btn"${ssrIncludeBooleanAttr(!unref(canRedo)) ? " disabled" : ""} title="Повторить (Ctrl+Y)" data-v-e8977d03><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-e8977d03><path d="M21 7v6h-6" data-v-e8977d03></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" data-v-e8977d03></path></svg></button><div class="toolbar-divider" data-v-e8977d03></div><span class="zoom-label" data-v-e8977d03>${ssrInterpolate(Math.round(unref(zoom) * 100))}%</span><button class="toolbar-btn"${ssrIncludeBooleanAttr(unref(zoom) <= unref(minZoom)) ? " disabled" : ""} title="Уменьшить" data-v-e8977d03><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-e8977d03><circle cx="11" cy="11" r="8" data-v-e8977d03></circle><path d="m21 21-4.3-4.3" data-v-e8977d03></path><path d="M8 11h6" data-v-e8977d03></path></svg></button><button class="toolbar-btn"${ssrIncludeBooleanAttr(unref(zoom) >= unref(maxZoom)) ? " disabled" : ""} title="Увеличить" data-v-e8977d03><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-e8977d03><circle cx="11" cy="11" r="8" data-v-e8977d03></circle><path d="m21 21-4.3-4.3" data-v-e8977d03></path><path d="M11 8v6" data-v-e8977d03></path><path d="M8 11h6" data-v-e8977d03></path></svg></button><button class="toolbar-btn" title="Сбросить масштаб" data-v-e8977d03><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-e8977d03><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24" data-v-e8977d03></path><path d="M21 3v6h-6" data-v-e8977d03></path></svg></button></div><div class="header-right" data-v-e8977d03><button class="btn-preview" data-v-e8977d03><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-e8977d03><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" data-v-e8977d03></path><circle cx="12" cy="12" r="3" data-v-e8977d03></circle></svg> Предпросмотр </button><button class="btn-save"${ssrIncludeBooleanAttr(unref(isSaving) || !unref(isDirty)) ? " disabled" : ""} data-v-e8977d03>`);
      if (!unref(isSaving)) {
        _push(`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-e8977d03><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" data-v-e8977d03></path><polyline points="17,21 17,13 7,13 7,21" data-v-e8977d03></polyline><polyline points="7,3 7,8 15,8" data-v-e8977d03></polyline></svg>`);
      } else {
        _push(`<svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-e8977d03><path d="M21 12a9 9 0 1 1-6.219-8.56" data-v-e8977d03></path></svg>`);
      }
      _push(` ${ssrInterpolate(unref(isSaving) ? "Сохранение..." : "Сохранить")}</button></div></div><div class="editor-main" data-v-e8977d03>`);
      _push(ssrRenderComponent(EditorToolbar, {
        onAddText: handleAddText,
        onAddVariable: handleAddVariable,
        onAddImage: handleAddImage,
        onAddQr: handleAddQR,
        onAddShape: handleAddShape,
        onSetLayout: unref(setLayout),
        onSetBackground: unref(setBackground),
        onApplyPreset: handleApplyPreset,
        "current-layout": unref(templateData).layout
      }, null, _parent));
      _push(`<div class="canvas-container" data-v-e8977d03>`);
      _push(ssrRenderComponent(EditorCanvas, {
        "template-data": unref(templateData),
        "selected-element-id": unref(selectedElementId),
        zoom: unref(zoom),
        onSelect: unref(selectElement),
        onUpdateElement: unref(updateElement),
        onDeleteElement: unref(deleteElement)
      }, null, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(EditorSidebar, {
        "selected-element": unref(selectedElement),
        onUpdate: handleElementUpdate,
        onDelete: unref(deleteSelectedElement),
        onDuplicate: handleDuplicate,
        onBringToFront: handleBringToFront,
        onSendToBack: handleSendToBack,
        onToggleLock: handleToggleLock
      }, null, _parent));
      _push(`</div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (showPresetConfirm.value) {
          _push2(`<div class="preset-confirm-overlay" data-v-e8977d03><div class="preset-confirm-modal" data-v-e8977d03><div class="modal-icon" data-v-e8977d03><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-e8977d03><path d="M12 9v4" data-v-e8977d03></path><path d="M12 17h.01" data-v-e8977d03></path><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" data-v-e8977d03></path></svg></div><h3 data-v-e8977d03>Применить шаблон?</h3><p data-v-e8977d03>Все текущие элементы будут заменены на элементы выбранного шаблона. Это действие нельзя отменить.</p><div class="modal-actions" data-v-e8977d03><button class="btn-cancel" data-v-e8977d03>Отмена</button><button class="btn-confirm" data-v-e8977d03>Применить</button></div></div></div>`);
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
const CertificateEditor = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["__scopeId", "data-v-e8977d03"]]), { __name: "CertificatesEditorCertificateEditor" });
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
    const notification = ref(null);
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
        const response = await authFetch(`/api/certificates/templates/${templateId.value}`, {
          method: "PUT",
          body: {
            templateData: data,
            layout: data.layout
          }
        });
        if (response.success) {
          template.value = response.template;
          showNotification("success", "Шаблон успешно сохранён");
          console.log("[CertificateEditor] Шаблон сохранён");
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "editor-page" }, _attrs))} data-v-25563f1f>`);
      if (template.value) {
        _push(ssrRenderComponent(CertificateEditor, {
          "template-id": templateId.value,
          "template-name": template.value.name,
          "initial-data": template.value.templateData || void 0,
          onSave: handleSave,
          onPreview: handlePreview
        }, null, _parent));
      } else if (isLoading.value) {
        _push(`<div class="loading-state" data-v-25563f1f><div class="loading-spinner" data-v-25563f1f></div><p data-v-25563f1f>Загрузка шаблона...</p></div>`);
      } else if (error.value) {
        _push(`<div class="error-state" data-v-25563f1f><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-25563f1f><circle cx="12" cy="12" r="10" data-v-25563f1f></circle><path d="m15 9-6 6" data-v-25563f1f></path><path d="m9 9 6 6" data-v-25563f1f></path></svg><h2 data-v-25563f1f>Ошибка загрузки</h2><p data-v-25563f1f>${ssrInterpolate(error.value)}</p><button data-v-25563f1f>Повторить</button></div>`);
      } else {
        _push(`<!---->`);
      }
      ssrRenderTeleport(_push, (_push2) => {
        if (showPreview.value) {
          _push2(`<div class="preview-modal" data-v-25563f1f><div class="preview-content" data-v-25563f1f><div class="preview-header" data-v-25563f1f><h3 data-v-25563f1f>Предпросмотр сертификата</h3>`);
          if (previewData.value) {
            _push2(`<div class="preview-info" data-v-25563f1f><span class="info-badge" data-v-25563f1f>${ssrInterpolate(previewData.value.width)}×${ssrInterpolate(previewData.value.height)}px</span><span class="info-badge" data-v-25563f1f>${ssrInterpolate(previewData.value.elementsCount)} элементов</span></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`<button class="close-btn" data-v-25563f1f><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-25563f1f><path d="M18 6 6 18" data-v-25563f1f></path><path d="m6 6 12 12" data-v-25563f1f></path></svg></button></div><div class="preview-body" data-v-25563f1f>`);
          if (previewLoading.value) {
            _push2(`<div class="preview-loading" data-v-25563f1f><div class="loading-spinner" data-v-25563f1f></div><p data-v-25563f1f>Генерация предпросмотра...</p></div>`);
          } else if (previewError.value) {
            _push2(`<div class="preview-error" data-v-25563f1f><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-25563f1f><circle cx="12" cy="12" r="10" data-v-25563f1f></circle><path d="M12 8v4" data-v-25563f1f></path><path d="M12 16h.01" data-v-25563f1f></path></svg><p data-v-25563f1f>${ssrInterpolate(previewError.value)}</p></div>`);
          } else if (previewHtml.value) {
            _push2(`<div class="preview-certificate" style="${ssrRenderStyle({
              width: `${(previewData.value?.width || 1123) * previewScale.value}px`,
              height: `${(previewData.value?.height || 794) * previewScale.value}px`
            })}" data-v-25563f1f><iframe${ssrRenderAttr("srcdoc", previewHtml.value)} class="preview-iframe" sandbox="allow-same-origin" data-v-25563f1f></iframe></div>`);
          } else {
            _push2(`<div class="preview-empty" data-v-25563f1f><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-25563f1f><rect width="18" height="18" x="3" y="3" rx="2" ry="2" data-v-25563f1f></rect><circle cx="9" cy="9" r="2" data-v-25563f1f></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" data-v-25563f1f></path></svg><p data-v-25563f1f>Нажмите &quot;Обновить&quot; для генерации предпросмотра</p></div>`);
          }
          _push2(`</div><div class="preview-footer" data-v-25563f1f><div class="footer-left" data-v-25563f1f><span class="scale-label" data-v-25563f1f>Масштаб:</span><button class="${ssrRenderClass([{ active: previewScale.value === 0.5 }, "scale-btn"])}" data-v-25563f1f>50%</button><button class="${ssrRenderClass([{ active: previewScale.value === 0.75 }, "scale-btn"])}" data-v-25563f1f>75%</button><button class="${ssrRenderClass([{ active: previewScale.value === 1 }, "scale-btn"])}" data-v-25563f1f>100%</button></div><div class="footer-right" data-v-25563f1f><button class="btn-refresh"${ssrIncludeBooleanAttr(previewLoading.value) ? " disabled" : ""} data-v-25563f1f><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-25563f1f><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24" data-v-25563f1f></path><path d="M21 3v6h-6" data-v-25563f1f></path></svg> Обновить </button><button class="btn-secondary" data-v-25563f1f>Закрыть</button></div></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      ssrRenderTeleport(_push, (_push2) => {
        if (notification.value) {
          _push2(`<div class="${ssrRenderClass([notification.value.type, "notification"])}" data-v-25563f1f>`);
          if (notification.value.type === "success") {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-25563f1f><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" data-v-25563f1f></path><path d="m9 11 3 3L22 4" data-v-25563f1f></path></svg>`);
          } else {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-25563f1f><circle cx="12" cy="12" r="10" data-v-25563f1f></circle><path d="M12 8v4" data-v-25563f1f></path><path d="M12 16h.01" data-v-25563f1f></path></svg>`);
          }
          _push2(`<span data-v-25563f1f>${ssrInterpolate(notification.value.message)}</span></div>`);
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
const editor = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-25563f1f"]]);

export { editor as default };
//# sourceMappingURL=editor-Thgc-66I.mjs.map
