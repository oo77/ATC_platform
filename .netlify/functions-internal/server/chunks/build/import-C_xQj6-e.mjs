import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { defineComponent, ref, mergeProps, withCtx, createBlock, createTextVNode, openBlock, createVNode, computed, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderStyle, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { s as setInterval } from './interval-D515B_eS.mjs';
import { n as navigateTo } from './server.mjs';
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
import 'vue-router';

const _sfc_main$4 = /* @__PURE__ */ defineComponent({
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
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/ImportUploader.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$4, { __name: "DatabaseImportUploader" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
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
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"><div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Всего строк</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.analysis.totalRows)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Валидные</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.analysis.validRows)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Будут созданы</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.analysis.newStudents)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Будут обновлены</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.analysis.existingStudents)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></div></div></div></div>`);
      if (__props.analysis.invalidRows > 0) {
        _push(`<div class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"><div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h4 class="text-lg font-semibold text-red-900 dark:text-red-100"> Обнаружены ошибки валидации </h4><p class="text-sm text-red-700 dark:text-red-300">${ssrInterpolate(__props.analysis.invalidRows)} ${ssrInterpolate(__props.analysis.invalidRows === 1 ? "строка содержит" : "строк содержат")} ошибки и будут пропущены </p></div></div></div><div class="max-h-60 overflow-y-auto p-6"><div class="space-y-3"><!--[-->`);
        ssrRenderList(__props.analysis.errors.slice(0, 10), (error) => {
          _push(`<div class="rounded-lg bg-white p-4 dark:bg-gray-800"><p class="mb-2 text-sm font-semibold text-gray-900 dark:text-white"> Строка ${ssrInterpolate(error.rowNumber)}</p><ul class="space-y-1"><!--[-->`);
          ssrRenderList(error.errors, (err, index) => {
            _push(`<li class="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"><svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> ${ssrInterpolate(err)}</li>`);
          });
          _push(`<!--]--></ul></div>`);
        });
        _push(`<!--]--></div>`);
        if (__props.analysis.errors.length > 10) {
          _push(`<p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400"> И ещё ${ssrInterpolate(__props.analysis.errors.length - 10)} ${ssrInterpolate(__props.analysis.errors.length - 10 === 1 ? "ошибка" : "ошибок")}... </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="rounded-xl border border-gray-200 dark:border-gray-700"><div class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800"><h4 class="text-lg font-semibold text-gray-900 dark:text-white"> Предпросмотр данных </h4><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Показаны первые ${ssrInterpolate(Math.min(__props.analysis.preview.length, 20))} валидных записей </p></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-100 dark:bg-gray-800"><tr><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">№</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ПИНФЛ</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ФИО</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Организация</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Служба/Отдел</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Должность</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Статус</th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
      ssrRenderList(__props.analysis.preview, (item, index) => {
        _push(`<tr class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"><td class="px-4 py-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(item.rowNumber)}</td><td class="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">${ssrInterpolate(item.pinfl)}</td><td class="px-4 py-3 text-gray-900 dark:text-white">${ssrInterpolate(item.fullName)}</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(item.organization)}</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(item.department || "—")}</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(item.position)}</td><td class="px-4 py-3"><span class="${ssrRenderClass([
          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
          isExistingStudent(item.pinfl) ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        ])}">${ssrInterpolate(isExistingStudent(item.pinfl) ? "Обновление" : "Новый")}</span></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div></div><div class="flex items-center justify-end gap-4"><button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"> Отмена </button><button${ssrIncludeBooleanAttr(__props.loading || __props.analysis.validRows === 0) ? " disabled" : ""} class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">`);
      if (!__props.loading) {
        _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>`);
      } else {
        _push(`<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
      }
      _push(` ${ssrInterpolate(__props.loading ? "Запуск импорта..." : `Импортировать ${__props.analysis.validRows} записей`)}</button></div></div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/ImportAnalysis.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$3, { __name: "DatabaseImportAnalysis" });
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
      switch (props.progress.status) {
        case "processing":
          return "Импорт данных";
        case "completed":
          return "Импорт завершён";
        case "failed":
          return "Импорт не удался";
        default:
          return "Ожидание";
      }
    });
    const statusDescription = computed(() => {
      switch (props.progress.status) {
        case "processing":
          return "Пожалуйста, подождите. Это может занять некоторое время...";
        case "completed":
          return "Все данные успешно обработаны";
        case "failed":
          return "Произошла ошибка при импорте данных";
        default:
          return "Подготовка к импорту...";
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
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
      _push(`</div><h3 class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(statusText.value)}</h3><p class="mt-2 text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(statusDescription.value)}</p></div><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><div class="mb-4 flex items-center justify-between"><span class="text-sm font-medium text-gray-700 dark:text-gray-300"> Обработано записей </span><span class="text-sm font-bold text-primary">${ssrInterpolate(__props.progress.processedRows)} / ${ssrInterpolate(__props.progress.totalRows)}</span></div><div class="relative h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"><div class="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out" style="${ssrRenderStyle({ width: `${progressPercentage.value}%` })}"><div class="h-full w-full animate-pulse bg-white/20"></div></div></div><div class="mt-2 text-center"><span class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(progressPercentage.value)}% </span></div></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><div class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Успешно</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.progress.successCount)}</p></div><div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Создано</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.progress.createdCount)}</p></div><div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Обновлено</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.progress.updatedCount)}</p></div><div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Ошибки</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.progress.errorCount)}</p></div><div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div></div></div></div>`);
      if (__props.progress.errors.length > 0) {
        _push(`<div class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"><div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h4 class="text-lg font-semibold text-red-900 dark:text-red-100"> Ошибки при импорте </h4><p class="text-sm text-red-700 dark:text-red-300">${ssrInterpolate(__props.progress.errors.length)} ${ssrInterpolate(__props.progress.errors.length === 1 ? "запись" : "записей")} не удалось импортировать </p></div></div></div><div class="max-h-60 overflow-y-auto p-6"><div class="space-y-3"><!--[-->`);
        ssrRenderList(__props.progress.errors.slice(0, 10), (error, index) => {
          _push(`<div class="rounded-lg bg-white p-4 dark:bg-gray-800"><div class="flex items-start justify-between gap-4"><div class="flex-1"><p class="mb-1 text-sm font-semibold text-gray-900 dark:text-white"> Строка ${ssrInterpolate(error.rowNumber)} • ПИНФЛ: ${ssrInterpolate(error.pinfl)}</p><p class="text-sm text-red-600 dark:text-red-400">${ssrInterpolate(error.error)}</p></div></div></div>`);
        });
        _push(`<!--]--></div>`);
        if (__props.progress.errors.length > 10) {
          _push(`<p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400"> И ещё ${ssrInterpolate(__props.progress.errors.length - 10)} ${ssrInterpolate(__props.progress.errors.length - 10 === 1 ? "ошибка" : "ошибок")}... </p>`);
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
const __nuxt_component_3 = Object.assign(_sfc_main$2, { __name: "DatabaseImportProgress" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ImportResults",
  __ssrInlineRender: true,
  props: {
    result: {}
  },
  emits: ["newImport", "goToDatabase"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const isSuccess = computed(() => {
      return props.result.errorCount === 0 || props.result.successCount > 0;
    });
    const resultDescription = computed(() => {
      if (props.result.errorCount === 0) {
        return `Все ${props.result.processedRows} записей успешно импортированы`;
      }
      return `${props.result.successCount} из ${props.result.processedRows} записей импортированы успешно`;
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
      if (props.result.processedRows === 0) return 0;
      return Math.round(props.result.successCount / props.result.processedRows * 100);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="text-center"><div class="${ssrRenderClass([
        "mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full",
        isSuccess.value ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
      ])}">`);
      if (isSuccess.value) {
        _push(`<svg class="h-12 w-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
      } else {
        _push(`<svg class="h-12 w-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
      }
      _push(`</div><h3 class="text-3xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(isSuccess.value ? "Импорт завершён успешно!" : "Импорт завершён с ошибками")}</h3><p class="mt-2 text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(resultDescription.value)}</p></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Всего обработано</p><p class="mt-2 text-4xl font-bold">${ssrInterpolate(__props.result.processedRows)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Создано новых</p><p class="mt-2 text-4xl font-bold">${ssrInterpolate(__props.result.createdCount)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Обновлено</p><p class="mt-2 text-4xl font-bold">${ssrInterpolate(__props.result.updatedCount)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Ошибки</p><p class="mt-2 text-4xl font-bold">${ssrInterpolate(__props.result.errorCount)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div></div></div></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30"><svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><p class="text-sm font-medium text-gray-600 dark:text-gray-400">Время выполнения</p><p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(duration.value)}</p></div></div></div><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30"><svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></div><div><p class="text-sm font-medium text-gray-600 dark:text-gray-400">Успешность</p><p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(successRate.value)}%</p></div></div></div></div>`);
      if (__props.result.errors.length > 0) {
        _push(`<div class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"><div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h4 class="text-lg font-semibold text-red-900 dark:text-red-100"> Детали ошибок </h4><p class="text-sm text-red-700 dark:text-red-300">${ssrInterpolate(__props.result.errors.length)} ${ssrInterpolate(__props.result.errors.length === 1 ? "запись" : "записей")} не удалось импортировать </p></div></div><button class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Скачать отчёт </button></div></div><div class="max-h-80 overflow-y-auto p-6"><div class="space-y-3"><!--[-->`);
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
const __nuxt_component_4 = Object.assign(_sfc_main$1, { __name: "DatabaseImportResults" });
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
    const currentStep = ref(1);
    const analyzing = ref(false);
    const importing = ref(false);
    const selectedFile = ref(null);
    const analysis = ref(null);
    const importProgress = ref(null);
    const jobId = ref(null);
    const { authFetch } = useAuthFetch();
    const handleFileSelected = async (file) => {
      selectedFile.value = file;
      analyzing.value = true;
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await authFetch(
          "/api/students/import/analyze",
          {
            method: "POST",
            body: formData
          }
        );
        if (response.success && response.analysis) {
          analysis.value = response.analysis;
          currentStep.value = 2;
        } else {
          alert(response.error || "Ошибка анализа файла");
        }
      } catch (error) {
        console.error("Ошибка анализа файла:", error);
        alert("Ошибка анализа файла");
      } finally {
        analyzing.value = false;
      }
    };
    const handleConfirmImport = async () => {
      if (!selectedFile.value) return;
      importing.value = true;
      currentStep.value = 3;
      try {
        const formData = new FormData();
        formData.append("file", selectedFile.value);
        const response = await authFetch(
          "/api/students/import/execute",
          {
            method: "POST",
            body: formData
          }
        );
        if (response.success && response.jobId) {
          jobId.value = response.jobId;
          startProgressPolling();
        } else {
          alert(response.error || "Ошибка запуска импорта");
          currentStep.value = 2;
        }
      } catch (error) {
        console.error("Ошибка запуска импорта:", error);
        alert("Ошибка запуска импорта");
        currentStep.value = 2;
      } finally {
        importing.value = false;
      }
    };
    const startProgressPolling = () => {
      setInterval();
    };
    const handleCancelImport = () => {
      currentStep.value = 1;
      selectedFile.value = null;
      analysis.value = null;
    };
    const handleNewImport = () => {
      currentStep.value = 1;
      selectedFile.value = null;
      analysis.value = null;
      importProgress.value = null;
      jobId.value = null;
    };
    const goToDatabase = () => {
      navigateTo("/database");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_DatabaseImportUploader = __nuxt_component_1;
      const _component_DatabaseImportAnalysis = __nuxt_component_2;
      const _component_DatabaseImportProgress = __nuxt_component_3;
      const _component_DatabaseImportResults = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Импорт студентов </h2><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Массовый импорт студентов из Excel файла </p></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/database",
        class: "inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"${_scopeId}></path></svg> Назад к базе данных `);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                class: "w-5 h-5",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": "2",
                  d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                })
              ])),
              createTextVNode(" Назад к базе данных ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="mb-8"><div class="flex items-center justify-between"><!--[-->`);
      ssrRenderList(steps, (step, index) => {
        _push(`<div class="flex flex-1 items-center"><div class="flex flex-col items-center flex-1"><div class="${ssrRenderClass([
          "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
          currentStep.value >= index + 1 ? "border-primary bg-primary text-white" : "border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800"
        ])}">`);
        if (currentStep.value > index + 1) {
          _push(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`);
        } else {
          _push(`<span class="text-lg font-semibold">${ssrInterpolate(index + 1)}</span>`);
        }
        _push(`</div><p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">${ssrInterpolate(step.label)}</p></div>`);
        if (index < steps.length - 1) {
          _push(`<div class="${ssrRenderClass([
            "h-1 flex-1 transition-all duration-300",
            currentStep.value > index + 1 ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
          ])}"></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="p-6" style="${ssrRenderStyle(currentStep.value === 1 ? null : { display: "none" })}">`);
      _push(ssrRenderComponent(_component_DatabaseImportUploader, {
        onFileSelected: handleFileSelected,
        loading: analyzing.value
      }, null, _parent));
      _push(`</div><div class="p-6" style="${ssrRenderStyle(currentStep.value === 2 ? null : { display: "none" })}">`);
      if (analysis.value) {
        _push(ssrRenderComponent(_component_DatabaseImportAnalysis, {
          analysis: analysis.value,
          onConfirm: handleConfirmImport,
          onCancel: handleCancelImport,
          loading: importing.value
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="p-6" style="${ssrRenderStyle(currentStep.value === 3 ? null : { display: "none" })}">`);
      if (importProgress.value) {
        _push(ssrRenderComponent(_component_DatabaseImportProgress, { progress: importProgress.value }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="p-6" style="${ssrRenderStyle(currentStep.value === 4 ? null : { display: "none" })}">`);
      if (importProgress.value) {
        _push(ssrRenderComponent(_component_DatabaseImportResults, {
          result: importProgress.value,
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
//# sourceMappingURL=import-C_xQj6-e.mjs.map
