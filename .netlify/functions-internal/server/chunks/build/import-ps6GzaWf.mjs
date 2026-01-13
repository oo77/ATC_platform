import { defineComponent, reactive, ref, mergeProps, unref, computed, withCtx, createVNode, resolveDynamicComponent, createBlock, openBlock, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderStyle, ssrRenderComponent, ssrIncludeBooleanAttr, ssrRenderVNode, ssrRenderSlot } from 'vue/server-renderer';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import { u as useImportStore } from './useImportStore-C7uKAALi.mjs';
import { n as navigateTo } from './server.mjs';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
import './useAuthFetch-pXCaAdz0.mjs';
import './interval-CUTXZwGJ.mjs';
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
import 'jsonwebtoken';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';
import './Notification-CQvvdM2O.mjs';

const _sfc_main$c = /* @__PURE__ */ defineComponent({
  __name: "ImportUploader",
  __ssrInlineRender: true,
  props: {
    loading: { type: Boolean }
  },
  emits: ["fileSelected"],
  setup(__props, { emit: __emit }) {
    ref(null);
    const isDragging = ref(false);
    const selectedFileName = ref("");
    const selectedFileSize = ref(0);
    const formatFileSize = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20"><div class="flex items-start gap-4"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="flex-1"><h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100"> Требования к файлу </h3><ul class="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-200"><li class="flex items-start gap-2"><svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Формат файла: <strong>.xlsx</strong> или <strong>.xls</strong></span></li><li class="flex items-start gap-2"><svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Первая строка должна содержать заголовки: <strong>ПИНФЛ, ФИО, Организация, Служба/Отдел, Должность</strong></span></li><li class="flex items-start gap-2"><svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>ПИНФЛ должен содержать ровно <strong>14 цифр</strong></span></li><li class="flex items-start gap-2"><svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>При совпадении ПИНФЛ данные студента будут <strong>обновлены</strong></span></li></ul></div></div></div><div class="${ssrRenderClass([
        "relative rounded-xl border-2 border-dashed transition-all duration-300",
        isDragging.value ? "border-primary bg-primary/5 scale-[1.02]" : "border-gray-300 dark:border-gray-600",
        __props.loading ? "pointer-events-none opacity-60" : ""
      ])}"><input type="file" accept=".xlsx,.xls" class="hidden"><div class="flex flex-col items-center justify-center p-12"><div class="${ssrRenderClass([
        "mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300",
        isDragging.value ? "bg-primary scale-110" : "bg-gray-100 dark:bg-gray-800"
      ])}">`);
      if (!__props.loading) {
        _push(`<svg class="${ssrRenderClass([
          "w-10 h-10 transition-colors duration-300",
          isDragging.value ? "text-white" : "text-gray-400 dark:text-gray-500"
        ])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>`);
      } else {
        _push(`<svg class="w-10 h-10 text-primary animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
      }
      _push(`</div><div class="text-center"><p class="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">${ssrInterpolate(__props.loading ? "Анализ файла..." : isDragging.value ? "Отпустите файл" : "Перетащите файл сюда")}</p><p class="mb-4 text-sm text-gray-500 dark:text-gray-400"> или </p><button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Выбрать файл </button></div>`);
      if (selectedFileName.value) {
        _push(`<div class="mt-6 flex items-center gap-3 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20"><svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div class="flex-1"><p class="text-sm font-medium text-green-800 dark:text-green-200">${ssrInterpolate(selectedFileName.value)}</p><p class="text-xs text-green-600 dark:text-green-400">${ssrInterpolate(formatFileSize(selectedFileSize.value))}</p></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="rounded-lg border border-gray-200 dark:border-gray-700"><div class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800"><h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200"> Пример структуры файла </h4></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-100 dark:bg-gray-800"><tr><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ПИНФЛ</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ФИО</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Организация</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Служба/Отдел</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Должность</th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"><tr><td class="px-4 py-3 text-gray-600 dark:text-gray-400">12345678901234</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">Иванов Иван Иванович</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">ООО &quot;Пример&quot;</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">IT отдел</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">Разработчик</td></tr><tr><td class="px-4 py-3 text-gray-600 dark:text-gray-400">98765432109876</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">Петрова Мария Сергеевна</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">АО &quot;Технологии&quot;</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">HR отдел</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">Менеджер</td></tr></tbody></table></div></div></div>`);
    };
  }
});
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/ImportUploader.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const __nuxt_component_0$2 = Object.assign(_sfc_main$c, { __name: "DatabaseImportUploader" });
const _sfc_main$b = {};
function _sfc_ssrRender$6(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    class: "w-full h-full",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, _attrs))}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`);
}
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/icons/IconDocument.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const __nuxt_component_0$1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$b, [["ssrRender", _sfc_ssrRender$6]]), { __name: "CommonIconsIconDocument" });
const _sfc_main$a = {};
function _sfc_ssrRender$5(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    class: "w-full h-full",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, _attrs))}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
}
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/icons/IconCheckCircle.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const __nuxt_component_1$3 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$a, [["ssrRender", _sfc_ssrRender$5]]), { __name: "CommonIconsIconCheckCircle" });
const _sfc_main$9 = {};
function _sfc_ssrRender$4(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    class: "w-full h-full",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, _attrs))}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>`);
}
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/icons/IconUserAdd.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const __nuxt_component_1$2 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$9, [["ssrRender", _sfc_ssrRender$4]]), { __name: "CommonIconsIconUserAdd" });
const _sfc_main$8 = {};
function _sfc_ssrRender$3(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    class: "w-full h-full",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, _attrs))}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`);
}
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/icons/IconRefresh.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const __nuxt_component_2$1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$8, [["ssrRender", _sfc_ssrRender$3]]), { __name: "CommonIconsIconRefresh" });
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "StatCard",
  __ssrInlineRender: true,
  props: {
    label: {},
    value: {},
    variant: { default: "blue" },
    icon: {},
    large: { type: Boolean, default: false },
    hoverEffect: { type: Boolean, default: false }
  },
  setup(__props) {
    const props = __props;
    const gradientMap = {
      blue: "bg-gradient-to-br from-blue-500 to-blue-600",
      green: "bg-gradient-to-br from-green-500 to-green-600",
      purple: "bg-gradient-to-br from-purple-500 to-purple-600",
      orange: "bg-gradient-to-br from-orange-500 to-orange-600",
      red: "bg-gradient-to-br from-red-500 to-red-600",
      indigo: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      gray: "bg-gradient-to-br from-gray-500 to-gray-600"
    };
    const gradientClass = computed(() => gradientMap[props.variant]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: [
          "rounded-xl p-6 text-white shadow-lg",
          __props.hoverEffect ? "transform transition-transform hover:scale-105" : "",
          unref(gradientClass)
        ]
      }, _attrs))}><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">${ssrInterpolate(__props.label)}</p><p class="${ssrRenderClass(["mt-2 font-bold", __props.large ? "text-4xl" : "text-3xl"])}">${ssrInterpolate(__props.value)}</p></div><div class="${ssrRenderClass(["flex items-center justify-center rounded-full bg-white/20", __props.large ? "h-14 w-14" : "h-12 w-12"])}">`);
      ssrRenderSlot(_ctx.$slots, "icon", {}, () => {
        if (__props.icon) {
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(__props.icon), {
            class: __props.large ? "w-8 h-8" : "w-6 h-6"
          }, null), _parent);
        } else {
          _push(`<!---->`);
        }
      }, _push, _parent);
      _push(`</div></div></div>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/StatCard.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_4 = Object.assign(_sfc_main$7, { __name: "CommonStatCard" });
const pluralize = (count, one, few, many) => {
  const absCount = Math.abs(count);
  const mod10 = absCount % 10;
  const mod100 = absCount % 100;
  if (mod100 >= 11 && mod100 <= 19) {
    return many;
  }
  if (mod10 === 1) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }
  return many;
};
const pluralizeWithCount = (count, one, few, many) => {
  return `${count} ${pluralize(count, one, few, many)}`;
};
const pluralizeRecords = (count) => pluralizeWithCount(count, "запись", "записи", "записей");
const pluralizeRows = (count) => pluralizeWithCount(count, "строка", "строки", "строк");
const pluralizeErrors = (count) => pluralizeWithCount(count, "ошибка", "ошибки", "ошибок");
const MAX_DISPLAYED_ERRORS$1 = 10;
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "ImportAnalysis",
  __ssrInlineRender: true,
  props: {
    analysis: {},
    loading: { type: Boolean }
  },
  emits: ["confirm", "cancel"],
  setup(__props) {
    const props = __props;
    const existingPinflsSet = computed(() => new Set(props.analysis.existingPinfls || []));
    const isExistingStudent = (pinfl) => {
      return existingPinflsSet.value.has(pinfl);
    };
    const summaryStats = computed(() => [
      {
        label: "Всего строк",
        value: props.analysis.totalRows,
        variant: "blue",
        icon: __nuxt_component_0$1
      },
      {
        label: "Валидные",
        value: props.analysis.validRows,
        variant: "green",
        icon: __nuxt_component_1$3
      },
      {
        label: "Будут созданы",
        value: props.analysis.newStudents,
        variant: "purple",
        icon: __nuxt_component_1$2
      },
      {
        label: "Будут обновлены",
        value: props.analysis.existingStudents,
        variant: "orange",
        icon: __nuxt_component_2$1
      }
    ]);
    const displayedErrors = computed(() => {
      return (props.analysis.errors || []).slice(0, MAX_DISPLAYED_ERRORS$1);
    });
    const remainingErrors = computed(() => {
      const total = props.analysis.errors?.length || 0;
      return Math.max(0, total - MAX_DISPLAYED_ERRORS$1);
    });
    const previewCount = computed(() => {
      return Math.min(props.analysis.preview?.length || 0, 20);
    });
    const getStatusBadgeClasses = (pinfl) => {
      const base = "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium";
      if (isExistingStudent(pinfl)) {
        return `${base} bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400`;
      }
      return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_CommonStatCard = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"><!--[-->`);
      ssrRenderList(unref(summaryStats), (stat) => {
        _push(ssrRenderComponent(_component_CommonStatCard, {
          key: stat.label,
          label: stat.label,
          value: stat.value,
          variant: stat.variant
        }, {
          icon: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(stat.icon), null, null), _parent2, _scopeId);
            } else {
              return [
                (openBlock(), createBlock(resolveDynamicComponent(stat.icon)))
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></div>`);
      if (__props.analysis.invalidRows > 0) {
        _push(`<div class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"><div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h4 class="text-lg font-semibold text-red-900 dark:text-red-100"> Обнаружены ошибки валидации </h4><p class="text-sm text-red-700 dark:text-red-300">${ssrInterpolate(unref(pluralizeRows)(__props.analysis.invalidRows))} ${ssrInterpolate(unref(pluralize)(__props.analysis.invalidRows, "содержит", "содержат", "содержат"))} ошибки и ${ssrInterpolate(unref(pluralize)(__props.analysis.invalidRows, "будет пропущена", "будут пропущены", "будут пропущены"))}</p></div></div></div><div class="max-h-60 overflow-y-auto p-6"><div class="space-y-3"><!--[-->`);
        ssrRenderList(unref(displayedErrors), (error) => {
          _push(`<div class="rounded-lg bg-white p-4 dark:bg-gray-800"><p class="mb-2 text-sm font-semibold text-gray-900 dark:text-white"> Строка ${ssrInterpolate(error.rowNumber)}</p><ul class="space-y-1"><!--[-->`);
          ssrRenderList(error.errors, (err, index) => {
            _push(`<li class="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"><svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> ${ssrInterpolate(err)}</li>`);
          });
          _push(`<!--]--></ul></div>`);
        });
        _push(`<!--]--></div>`);
        if (unref(remainingErrors) > 0) {
          _push(`<p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400"> И ещё ${ssrInterpolate(unref(pluralizeErrors)(unref(remainingErrors)))}... </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="rounded-xl border border-gray-200 dark:border-gray-700"><div class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800"><h4 class="text-lg font-semibold text-gray-900 dark:text-white"> Предпросмотр данных </h4><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Показаны первые ${ssrInterpolate(unref(previewCount))} ${ssrInterpolate(unref(pluralize)(unref(previewCount), "валидная запись", "валидные записи", "валидных записей"))}</p></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-100 dark:bg-gray-800"><tr><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">№</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ПИНФЛ</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ФИО</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Организация</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Служба/Отдел</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Должность</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Статус</th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
      ssrRenderList(__props.analysis.preview || [], (item, index) => {
        _push(`<tr class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"><td class="px-4 py-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(item.rowNumber)}</td><td class="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">${ssrInterpolate(item.pinfl)}</td><td class="px-4 py-3 text-gray-900 dark:text-white">${ssrInterpolate(item.fullName)}</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(item.organization)}</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(item.department || "—")}</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(item.position)}</td><td class="px-4 py-3"><span class="${ssrRenderClass(getStatusBadgeClasses(item.pinfl))}">${ssrInterpolate(isExistingStudent(item.pinfl) ? "Обновление" : "Новый")}</span></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div></div><div class="flex items-center justify-end gap-4"><button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"> Отмена </button><button${ssrIncludeBooleanAttr(__props.loading || __props.analysis.validRows === 0) ? " disabled" : ""} class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">`);
      if (!__props.loading) {
        _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>`);
      } else {
        _push(`<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
      }
      _push(` ${ssrInterpolate(__props.loading ? "Запуск импорта..." : `Импортировать ${unref(pluralizeRecords)(__props.analysis.validRows)}`)}</button></div></div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/ImportAnalysis.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_1$1 = Object.assign(_sfc_main$6, { __name: "DatabaseImportAnalysis" });
const _sfc_main$5 = {};
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    class: "w-full h-full",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, _attrs))}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`);
}
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/icons/IconCheck.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$5, [["ssrRender", _sfc_ssrRender$2]]), { __name: "CommonIconsIconCheck" });
const _sfc_main$4 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    class: "w-full h-full",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, _attrs))}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>`);
}
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/icons/IconPlus.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$4, [["ssrRender", _sfc_ssrRender$1]]), { __name: "CommonIconsIconPlus" });
const _sfc_main$3 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    class: "w-full h-full",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, _attrs))}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
}
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/icons/IconExclamationCircle.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_3$1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$3, [["ssrRender", _sfc_ssrRender]]), { __name: "CommonIconsIconExclamationCircle" });
const MAX_DISPLAYED_ERRORS = 10;
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "ImportProgress",
  __ssrInlineRender: true,
  props: {
    progress: {}
  },
  setup(__props) {
    const props = __props;
    const progressPercentage = computed(() => {
      if (props.progress.totalRows === 0) return 0;
      return Math.round(props.progress.processedRows / props.progress.totalRows * 100);
    });
    const statusText = computed(() => {
      const statusMap = {
        processing: "Импорт данных",
        completed: "Импорт завершён",
        failed: "Импорт не удался"
      };
      return statusMap[props.progress.status] || "Ожидание";
    });
    const statusDescription = computed(() => {
      const descriptionMap = {
        processing: "Пожалуйста, подождите. Это может занять некоторое время...",
        completed: "Все данные успешно обработаны",
        failed: "Произошла ошибка при импорте данных"
      };
      return descriptionMap[props.progress.status] || "Подготовка к импорту...";
    });
    const progressStats = computed(() => [
      {
        label: "Успешно",
        value: props.progress.successCount,
        variant: "green",
        icon: __nuxt_component_0
      },
      {
        label: "Создано",
        value: props.progress.createdCount,
        variant: "blue",
        icon: __nuxt_component_1
      },
      {
        label: "Обновлено",
        value: props.progress.updatedCount,
        variant: "orange",
        icon: __nuxt_component_2$1
      },
      {
        label: "Ошибки",
        value: props.progress.errorCount,
        variant: "red",
        icon: __nuxt_component_3$1
      }
    ]);
    const displayedErrors = computed(() => {
      return (props.progress.errors || []).slice(0, MAX_DISPLAYED_ERRORS);
    });
    const remainingErrors = computed(() => {
      const total = props.progress.errors?.length || 0;
      return Math.max(0, total - MAX_DISPLAYED_ERRORS);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_CommonStatCard = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="text-center"><div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">`);
      if (__props.progress.status === "processing") {
        _push(`<svg class="h-10 w-10 animate-spin text-primary" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
      } else if (__props.progress.status === "completed") {
        _push(`<svg class="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
      } else if (__props.progress.status === "failed") {
        _push(`<svg class="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><h3 class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(statusText))}</h3><p class="mt-2 text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(unref(statusDescription))}</p></div><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><div class="mb-4 flex items-center justify-between"><span class="text-sm font-medium text-gray-700 dark:text-gray-300"> Обработано записей </span><span class="text-sm font-bold text-primary">${ssrInterpolate(__props.progress.processedRows)} / ${ssrInterpolate(__props.progress.totalRows)}</span></div><div class="relative h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"><div class="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out" style="${ssrRenderStyle({ width: `${unref(progressPercentage)}%` })}"><div class="h-full w-full animate-pulse bg-white/20"></div></div></div><div class="mt-2 text-center"><span class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(progressPercentage))}% </span></div></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><!--[-->`);
      ssrRenderList(unref(progressStats), (stat) => {
        _push(ssrRenderComponent(_component_CommonStatCard, {
          key: stat.label,
          label: stat.label,
          value: stat.value,
          variant: stat.variant,
          "hover-effect": ""
        }, {
          icon: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(stat.icon), null, null), _parent2, _scopeId);
            } else {
              return [
                (openBlock(), createBlock(resolveDynamicComponent(stat.icon)))
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></div>`);
      if (__props.progress.errors && __props.progress.errors.length > 0) {
        _push(`<div class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"><div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h4 class="text-lg font-semibold text-red-900 dark:text-red-100"> Ошибки при импорте </h4><p class="text-sm text-red-700 dark:text-red-300">${ssrInterpolate(unref(pluralizeRecords)(__props.progress.errors.length))} не удалось импортировать </p></div></div></div><div class="max-h-60 overflow-y-auto p-6"><div class="space-y-3"><!--[-->`);
        ssrRenderList(unref(displayedErrors), (error, index) => {
          _push(`<div class="rounded-lg bg-white p-4 dark:bg-gray-800"><div class="flex items-start justify-between gap-4"><div class="flex-1"><p class="mb-1 text-sm font-semibold text-gray-900 dark:text-white"> Строка ${ssrInterpolate(error.rowNumber)} • ПИНФЛ: ${ssrInterpolate(error.pinfl)}</p><p class="text-sm text-red-600 dark:text-red-400">${ssrInterpolate(error.error)}</p></div></div></div>`);
        });
        _push(`<!--]--></div>`);
        if (unref(remainingErrors) > 0) {
          _push(`<p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400"> И ещё ${ssrInterpolate(unref(pluralizeErrors)(unref(remainingErrors)))}... </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.progress.status === "processing") {
        _push(`<div class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400"><div class="flex gap-1"><div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="${ssrRenderStyle({ "animation-delay": "0ms" })}"></div><div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="${ssrRenderStyle({ "animation-delay": "150ms" })}"></div><div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="${ssrRenderStyle({ "animation-delay": "300ms" })}"></div></div><span>Импорт в процессе...</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/ImportProgress.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$2, { __name: "DatabaseImportProgress" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ImportResults",
  __ssrInlineRender: true,
  props: {
    result: {}
  },
  emits: ["newImport", "goToDatabase"],
  setup(__props) {
    const props = __props;
    const isSuccess = computed(() => {
      return (props.result.errorCount ?? 0) === 0;
    });
    const resultDescription = computed(() => {
      const processed = props.result.processedRows ?? 0;
      const errors = props.result.errorCount ?? 0;
      const success = props.result.successCount ?? 0;
      if (errors === 0) {
        return `Все ${processed} записей успешно импортированы`;
      }
      return `${success} из ${processed} записей импортированы успешно`;
    });
    const duration = computed(() => {
      if (!props.result.completedAt) return "—";
      const ms = new Date(props.result.completedAt).getTime() - new Date(props.result.startedAt).getTime();
      const seconds = Math.floor(ms / 1e3);
      const minutes = Math.floor(seconds / 60);
      if (minutes > 0) {
        return `${minutes} мин ${seconds % 60} сек`;
      }
      return `${seconds} сек`;
    });
    const successRate = computed(() => {
      const processed = props.result.processedRows ?? 0;
      const success = props.result.successCount ?? 0;
      if (processed === 0) return 0;
      return Math.round(success / processed * 100);
    });
    const resultStats = computed(() => [
      {
        label: "Всего обработано",
        value: props.result.processedRows ?? 0,
        variant: "blue",
        icon: __nuxt_component_0$1
      },
      {
        label: "Создано новых",
        value: props.result.createdCount ?? 0,
        variant: "green",
        icon: __nuxt_component_1$2
      },
      {
        label: "Обновлено",
        value: props.result.updatedCount ?? 0,
        variant: "orange",
        icon: __nuxt_component_2$1
      },
      {
        label: "Ошибки",
        value: props.result.errorCount ?? 0,
        variant: "red",
        icon: __nuxt_component_3$1
      }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_CommonStatCard = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="text-center"><div class="${ssrRenderClass([
        "mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full",
        unref(isSuccess) ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
      ])}">`);
      if (unref(isSuccess)) {
        _push(`<svg class="h-12 w-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
      } else {
        _push(`<svg class="h-12 w-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
      }
      _push(`</div><h3 class="text-3xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(isSuccess) ? "Импорт завершён успешно!" : "Импорт завершён с ошибками")}</h3><p class="mt-2 text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(unref(resultDescription))}</p></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><!--[-->`);
      ssrRenderList(unref(resultStats), (stat) => {
        _push(ssrRenderComponent(_component_CommonStatCard, {
          key: stat.label,
          label: stat.label,
          value: stat.value,
          variant: stat.variant,
          large: ""
        }, {
          icon: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(stat.icon), null, null), _parent2, _scopeId);
            } else {
              return [
                (openBlock(), createBlock(resolveDynamicComponent(stat.icon)))
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30"><svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><p class="text-sm font-medium text-gray-600 dark:text-gray-400">Время выполнения</p><p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(duration))}</p></div></div></div><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30"><svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></div><div><p class="text-sm font-medium text-gray-600 dark:text-gray-400">Успешность</p><p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(successRate))}%</p></div></div></div></div>`);
      if (__props.result.errors && __props.result.errors.length > 0) {
        _push(`<div class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"><div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h4 class="text-lg font-semibold text-red-900 dark:text-red-100"> Детали ошибок </h4><p class="text-sm text-red-700 dark:text-red-300">${ssrInterpolate(unref(pluralizeRecords)(__props.result.errors.length))} не удалось импортировать </p></div></div><button class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Скачать отчёт </button></div></div><div class="max-h-80 overflow-y-auto p-6"><div class="space-y-3"><!--[-->`);
        ssrRenderList(__props.result.errors, (error, index) => {
          _push(`<div class="rounded-lg bg-white p-4 dark:bg-gray-800"><div class="flex items-start justify-between gap-4"><div class="flex-1"><p class="mb-1 text-sm font-semibold text-gray-900 dark:text-white"> Строка ${ssrInterpolate(error.rowNumber)} • ПИНФЛ: ${ssrInterpolate(error.pinfl)}</p><p class="text-sm text-red-600 dark:text-red-400">${ssrInterpolate(error.error)}</p></div></div></div>`);
        });
        _push(`<!--]--></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center"><button class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Новый импорт </button><button class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg> Перейти к базе данных </button></div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/ImportResults.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$1, { __name: "DatabaseImportResults" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "import",
  __ssrInlineRender: true,
  setup(__props) {
    const steps = [
      { id: 1, label: "Загрузка файла" },
      { id: 2, label: "Предпросмотр" },
      { id: 3, label: "Импорт" },
      { id: 4, label: "Результаты" }
    ];
    const store = reactive(useImportStore());
    const selectedFile = ref(null);
    const { error: showError } = useNotification();
    const getStepClasses = (stepId) => {
      if (stepId < store.currentStep) {
        return ["border-primary", "bg-primary", "text-white"];
      }
      if (stepId === store.currentStep) {
        return ["border-primary", "text-primary"];
      }
      return ["border-gray-300", "text-gray-400", "dark:border-gray-600"];
    };
    const handleFileSelected = (file) => {
      selectedFile.value = file;
      store.analyzeStudentImport(file);
    };
    const handleConfirmImport = async () => {
      if (selectedFile.value) {
        store.executeStudentImport(selectedFile.value);
      } else if (store.analysis) {
        showError("Файл был потерян при обновлении страницы. Пожалуйста, выберите файл заново.");
        store.currentStep = 1;
      }
    };
    const handleCancelImport = () => {
      store.cancelImport();
      selectedFile.value = null;
    };
    const handleNewImport = () => {
      handleCancelImport();
    };
    const goToDatabase = () => {
      store.reset();
      navigateTo("/database");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_DatabaseImportUploader = __nuxt_component_0$2;
      const _component_DatabaseImportAnalysis = __nuxt_component_1$1;
      const _component_DatabaseImportProgress = __nuxt_component_2;
      const _component_DatabaseImportResults = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-7xl" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Импорт студентов </h2></div><div class="mb-8 rounded-lg border border-stroke bg-white px-8 py-6 shadow-default dark:border-strokedark dark:bg-boxdark"><div class="flex items-center justify-between"><!--[-->`);
      ssrRenderList(steps, (step) => {
        _push(`<div class="relative flex flex-col items-center flex-1"><div class="${ssrRenderClass([getStepClasses(step.id), "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300"])}">`);
        if (step.id < unref(store).currentStep) {
          _push(`<span class="text-xl">✓</span>`);
        } else {
          _push(`<span class="text-sm font-bold">${ssrInterpolate(step.id)}</span>`);
        }
        _push(`</div><span class="${ssrRenderClass([step.id <= unref(store).currentStep ? "text-primary" : "text-gray-500 dark:text-gray-400", "mt-2 text-xs font-medium text-center"])}">${ssrInterpolate(step.label)}</span>`);
        if (step.id !== steps.length) {
          _push(`<div class="absolute top-5 left-[50%] w-full h-[2px] -z-10"><div class="${ssrRenderClass([step.id < unref(store).currentStep ? "bg-primary" : "bg-gray-200 dark:bg-gray-700", "h-full transition-all duration-300"])}"></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div></div>`);
      if (unref(store).error) {
        _push(`<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"><div class="flex items-center gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="flex-1"><h4 class="font-semibold text-red-900 dark:text-red-100">Ошибка</h4><p class="text-sm text-red-700 dark:text-red-300">${ssrInterpolate(unref(store).error)}</p></div><button class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="p-6" style="${ssrRenderStyle(unref(store).currentStep === 1 ? null : { display: "none" })}">`);
      _push(ssrRenderComponent(_component_DatabaseImportUploader, {
        loading: unref(store).isAnalyzing,
        onFileSelected: handleFileSelected
      }, null, _parent));
      _push(`</div><div class="p-6" style="${ssrRenderStyle(unref(store).currentStep === 2 ? null : { display: "none" })}">`);
      if (unref(store).analysis) {
        _push(ssrRenderComponent(_component_DatabaseImportAnalysis, {
          analysis: unref(store).analysis,
          loading: unref(store).isImporting,
          onConfirm: handleConfirmImport,
          onCancel: handleCancelImport
        }, null, _parent));
      } else if (!unref(selectedFile) && !unref(store).analysis) {
        _push(`<div class="text-center py-10"><p class="text-gray-500">Файл не выбран или данные анализа потеряны. Пожалуйста, начните заново.</p><button class="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"> Вернуться к загрузке </button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="p-6" style="${ssrRenderStyle(unref(store).currentStep === 3 ? null : { display: "none" })}">`);
      if (unref(store).progress) {
        _push(ssrRenderComponent(_component_DatabaseImportProgress, {
          progress: unref(store).progress
        }, null, _parent));
      } else {
        _push(`<div class="flex flex-col items-center justify-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div><p class="text-gray-500">Инициализация импорта...</p></div>`);
      }
      _push(`</div><div class="p-6" style="${ssrRenderStyle(unref(store).currentStep === 4 ? null : { display: "none" })}">`);
      if (unref(store).progress) {
        _push(ssrRenderComponent(_component_DatabaseImportResults, {
          result: unref(store).progress,
          onNewImport: handleNewImport,
          onGoToDatabase: goToDatabase
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/database/import.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=import-ps6GzaWf.mjs.map
