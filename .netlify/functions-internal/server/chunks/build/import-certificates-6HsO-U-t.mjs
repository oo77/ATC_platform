import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { ref, reactive, computed, mergeProps, withCtx, createBlock, createTextVNode, openBlock, createVNode, watch, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderStyle, ssrRenderTeleport, ssrIncludeBooleanAttr, ssrLooseEqual, ssrLooseContain, ssrRenderAttr } from 'vue/server-renderer';
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

const _sfc_main$6 = {
  __name: "DatabaseCertificateImportCourseSelect",
  __ssrInlineRender: true,
  props: {
    config: {
      type: Object,
      default: () => ({
        courseSource: "manual",
        courseId: "",
        courseName: "",
        courseCode: "",
        courseHours: null,
        validityType: "unlimited",
        validityMonths: 12
      })
    }
  },
  emits: ["next", "update:config"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const props = __props;
    const localConfig = reactive({
      courseSource: props.config.courseSource || "manual",
      courseId: props.config.courseId || "",
      courseName: props.config.courseName || "",
      courseCode: props.config.courseCode || "",
      courseHours: props.config.courseHours || null,
      validityType: props.config.validityType || "unlimited",
      validityMonths: props.config.validityMonths || 12
    });
    const courses = ref([]);
    const loadingCourses = ref(false);
    useAuthFetch();
    const isValid = computed(() => {
      if (localConfig.courseSource === "existing") {
        return !!localConfig.courseId;
      } else if (localConfig.courseSource === "manual") {
        return !!localConfig.courseName && localConfig.courseName.trim().length > 0;
      }
      return false;
    });
    watch(() => localConfig.courseSource, (newSource) => {
      if (newSource === "existing") {
        localConfig.courseName = "";
        localConfig.courseCode = "";
        localConfig.courseHours = null;
      } else {
        localConfig.courseId = "";
      }
    });
    watch(localConfig, (value) => {
      emit("update:config", { ...value });
    }, { deep: true });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-6 dark:from-indigo-900/20 dark:to-purple-900/20"><div class="flex items-start gap-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500 shadow-lg"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div><div class="flex-1"><h3 class="text-xl font-bold text-gray-900 dark:text-white"> Настройка курса </h3><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Укажите для какого курса импортируются сертификаты и их срок действия </p></div></div></div><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white"> 📚 Для какого курса импортируются сертификаты? </h4><div class="space-y-4"><label class="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(localConfig.courseSource, "existing")) ? " checked" : ""} value="existing" class="mt-1 h-5 w-5 text-primary focus:ring-primary"><div class="flex-1"><p class="font-medium text-gray-900 dark:text-white">Выбрать существующий курс</p><p class="mt-1 text-sm text-gray-500 dark:text-gray-400"> Данные курса будут взяты из базы данных </p>`);
      if (localConfig.courseSource === "existing") {
        _push(`<div class="mt-4"><select class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"${ssrIncludeBooleanAttr(loadingCourses.value) ? " disabled" : ""}><option value=""${ssrIncludeBooleanAttr(Array.isArray(localConfig.courseId) ? ssrLooseContain(localConfig.courseId, "") : ssrLooseEqual(localConfig.courseId, "")) ? " selected" : ""}>${ssrInterpolate(loadingCourses.value ? "Загрузка..." : "Выберите курс")}</option><!--[-->`);
        ssrRenderList(courses.value, (course) => {
          _push(`<option${ssrRenderAttr("value", course.id)}${ssrIncludeBooleanAttr(Array.isArray(localConfig.courseId) ? ssrLooseContain(localConfig.courseId, course.id) : ssrLooseEqual(localConfig.courseId, course.id)) ? " selected" : ""}>${ssrInterpolate(course.name)} ${ssrInterpolate(course.code ? `(${course.code})` : "")} ${ssrInterpolate(course.hours ? `— ${course.hours} ч.` : "")}</option>`);
        });
        _push(`<!--]--></select></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></label><label class="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(localConfig.courseSource, "manual")) ? " checked" : ""} value="manual" class="mt-1 h-5 w-5 text-primary focus:ring-primary"><div class="flex-1"><p class="font-medium text-gray-900 dark:text-white">Указать название курса вручную</p><p class="mt-1 text-sm text-gray-500 dark:text-gray-400"> Для импорта исторических сертификатов, когда курс не зарегистрирован в системе </p>`);
      if (localConfig.courseSource === "manual") {
        _push(`<div class="mt-4 space-y-4"><div><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Название курса <span class="text-red-500">*</span></label><input${ssrRenderAttr("value", localConfig.courseName)} type="text" placeholder="Например: Курс повышения квалификации" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Код курса (опционально) </label><input${ssrRenderAttr("value", localConfig.courseCode)} type="text" placeholder="Например: ATC25" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"></div><div><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Количество часов (опционально) </label><input${ssrRenderAttr("value", localConfig.courseHours)} type="number" min="1" placeholder="72" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></label></div></div><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white"> 📅 Срок действия сертификатов </h4><p class="mb-4 text-sm text-gray-500 dark:text-gray-400"> Применяется ко всем импортируемым сертификатам </p><div class="space-y-4"><label class="flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(localConfig.validityType, "unlimited")) ? " checked" : ""} value="unlimited" class="h-5 w-5 text-primary focus:ring-primary"><div><p class="font-medium text-gray-900 dark:text-white">Бессрочный</p><p class="text-sm text-gray-500 dark:text-gray-400"> Сертификаты не истекают </p></div></label><label class="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(localConfig.validityType, "months")) ? " checked" : ""} value="months" class="mt-1 h-5 w-5 text-primary focus:ring-primary"><div class="flex-1"><p class="font-medium text-gray-900 dark:text-white">Указать срок действия</p><p class="text-sm text-gray-500 dark:text-gray-400"> Дата истечения рассчитывается от даты выдачи </p>`);
      if (localConfig.validityType === "months") {
        _push(`<div class="mt-4"><div class="flex items-center gap-3"><span class="text-sm text-gray-600 dark:text-gray-400">Срок действия:</span><select class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"><option${ssrRenderAttr("value", 6)}${ssrIncludeBooleanAttr(Array.isArray(localConfig.validityMonths) ? ssrLooseContain(localConfig.validityMonths, 6) : ssrLooseEqual(localConfig.validityMonths, 6)) ? " selected" : ""}>6 месяцев</option><option${ssrRenderAttr("value", 12)}${ssrIncludeBooleanAttr(Array.isArray(localConfig.validityMonths) ? ssrLooseContain(localConfig.validityMonths, 12) : ssrLooseEqual(localConfig.validityMonths, 12)) ? " selected" : ""}>12 месяцев (1 год)</option><option${ssrRenderAttr("value", 18)}${ssrIncludeBooleanAttr(Array.isArray(localConfig.validityMonths) ? ssrLooseContain(localConfig.validityMonths, 18) : ssrLooseEqual(localConfig.validityMonths, 18)) ? " selected" : ""}>18 месяцев</option><option${ssrRenderAttr("value", 24)}${ssrIncludeBooleanAttr(Array.isArray(localConfig.validityMonths) ? ssrLooseContain(localConfig.validityMonths, 24) : ssrLooseEqual(localConfig.validityMonths, 24)) ? " selected" : ""}>24 месяца (2 года)</option><option${ssrRenderAttr("value", 36)}${ssrIncludeBooleanAttr(Array.isArray(localConfig.validityMonths) ? ssrLooseContain(localConfig.validityMonths, 36) : ssrLooseEqual(localConfig.validityMonths, 36)) ? " selected" : ""}>36 месяцев (3 года)</option><option${ssrRenderAttr("value", 60)}${ssrIncludeBooleanAttr(Array.isArray(localConfig.validityMonths) ? ssrLooseContain(localConfig.validityMonths, 60) : ssrLooseEqual(localConfig.validityMonths, 60)) ? " selected" : ""}>60 месяцев (5 лет)</option></select></div><p class="mt-2 text-xs text-gray-500 dark:text-gray-400"><svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Для каждого сертификата: expiry_date = issue_date + ${ssrInterpolate(localConfig.validityMonths)} месяцев </p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></label></div></div><div class="flex items-center justify-end"><button${ssrIncludeBooleanAttr(!isValid.value) ? " disabled" : ""} class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"> Далее <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></button></div></div>`);
    };
  }
};
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/CertificateImportCourseSelect.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const _sfc_main$5 = {
  __name: "DatabaseCertificateImportUploader",
  __ssrInlineRender: true,
  props: {
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ["back", "next", "file-selected"],
  setup(__props, { emit: __emit }) {
    ref(null);
    const isDragging = ref(false);
    const selectedFile = ref(null);
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 p-6 dark:from-teal-900/20 dark:to-cyan-900/20"><div class="flex items-start gap-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500 shadow-lg"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg></div><div class="flex-1"><h3 class="text-xl font-bold text-gray-900 dark:text-white"> Загрузка файла </h3><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Загрузите Excel-файл с данными сертификатов </p></div></div></div><div class="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20"><div class="flex items-start gap-4"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="flex-1"><h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100"> Требования к файлу </h3><ul class="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-200"><li class="flex items-start gap-2"><svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Формат файла: <strong>.xlsx</strong> или <strong>.xls</strong></span></li><li class="flex items-start gap-2"><svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Первая строка — заголовки: <strong>ПИНФЛ, ФИО, Организация, Должность, Серия/Номер, Дата выдачи</strong></span></li><li class="flex items-start gap-2"><svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>ПИНФЛ должен содержать <strong>14 цифр</strong></span></li><li class="flex items-start gap-2"><svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Формат даты: <strong>ДД.ММ.ГГГГ</strong> (например: 15.03.2025)</span></li></ul></div></div></div><div class="${ssrRenderClass([
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
      _push(`</div><div class="text-center"><p class="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">${ssrInterpolate(__props.loading ? "Обработка файла..." : isDragging.value ? "Отпустите файл" : "Перетащите файл сюда")}</p><p class="mb-4 text-sm text-gray-500 dark:text-gray-400"> или </p><button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Выбрать файл </button></div>`);
      if (selectedFileName.value) {
        _push(`<div class="mt-6 flex items-center gap-3 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20"><svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div class="flex-1"><p class="text-sm font-medium text-green-800 dark:text-green-200">${ssrInterpolate(selectedFileName.value)}</p><p class="text-xs text-green-600 dark:text-green-400">${ssrInterpolate(formatFileSize(selectedFileSize.value))}</p></div><button class="rounded p-1 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800/30"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="rounded-lg border border-gray-200 dark:border-gray-700"><div class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800"><h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200"> 📋 Пример структуры файла </h4></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-100 dark:bg-gray-800"><tr><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ПИНФЛ</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ФИО</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Организация</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Должность</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Серия/Номер</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Дата выдачи</th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"><tr><td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">12345678901234</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">Иванов Иван Иванович</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">ООО &quot;Авиакомпания&quot;</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">Инженер</td><td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">ATC25-001</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">15.03.2025</td></tr><tr><td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">98765432109876</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">Петрова Мария Сергеевна</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">АО &quot;Аэропорт&quot;</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">Менеджер</td><td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">ATC25-002</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">20.03.2025</td></tr></tbody></table></div></div><div class="flex items-center justify-between"><button class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Назад </button><button${ssrIncludeBooleanAttr(!selectedFile.value) ? " disabled" : ""} class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"> Далее <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></button></div></div>`);
    };
  }
};
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/CertificateImportUploader.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const _sfc_main$4 = {
  __name: "DatabaseCertificateImportSettings",
  __ssrInlineRender: true,
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    courseConfig: {
      type: Object,
      required: true
    },
    courseInfo: {
      type: Object,
      default: null
    },
    config: {
      type: Object,
      default: () => ({
        urlTemplate: "",
        createStudents: true,
        updateExisting: false,
        skipErrors: true
      })
    }
  },
  emits: ["back", "analyze", "update:config"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const props = __props;
    const localConfig = reactive({
      urlTemplate: props.config.urlTemplate || "",
      createStudents: props.config.createStudents ?? true,
      updateExisting: props.config.updateExisting ?? false,
      skipErrors: props.config.skipErrors ?? true
    });
    const availableVariables = [
      { key: "{NUM}", description: "Серийный номер сертификата" },
      { key: "{FIO}", description: "ФИО (подчёркивания вместо пробелов)" },
      { key: "{PINFL}", description: "ПИНФЛ слушателя" },
      { key: "{DATE}", description: "Дата выдачи (YYYYMMDD)" }
    ];
    const previewUrl = computed(() => {
      return localConfig.urlTemplate.replace("{NUM}", "ATC25-001").replace("{FIO}", "Иванов_Иван_Иванович").replace("{PINFL}", "12345678901234").replace("{DATE}", "20250315");
    });
    watch(localConfig, (value) => {
      emit("update:config", { ...value });
    }, { deep: true });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="rounded-lg bg-gradient-to-r from-violet-50 to-fuchsia-50 p-6 dark:from-violet-900/20 dark:to-fuchsia-900/20"><div class="flex items-start gap-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500 shadow-lg"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div><div class="flex-1"><h3 class="text-xl font-bold text-gray-900 dark:text-white"> Настройка импорта </h3><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Настройте шаблон ссылки на PDF и дополнительные опции </p></div></div></div><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white"> 🔗 Шаблон ссылки на PDF-файл сертификата </h4><p class="mb-4 text-sm text-gray-500 dark:text-gray-400"> Укажите шаблон URL, по которому будут доступны PDF-файлы сертификатов </p><div class="space-y-4"><div><input${ssrRenderAttr("value", localConfig.urlTemplate)} type="url" placeholder="http://edu.uzairports.com/certificates/ATC25_{NUM}_{FIO}.pdf" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-mono text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"></div><div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"><p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300"> Доступные переменные: </p><div class="grid grid-cols-1 gap-3 sm:grid-cols-2"><!--[-->`);
      ssrRenderList(availableVariables, (variable) => {
        _push(`<div class="flex items-start gap-3"><button class="inline-flex items-center rounded bg-primary/10 px-2 py-1 font-mono text-xs text-primary transition-colors hover:bg-primary/20">${ssrInterpolate(variable.key)}</button><span class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(variable.description)}</span></div>`);
      });
      _push(`<!--]--></div></div>`);
      if (localConfig.urlTemplate) {
        _push(`<div class="space-y-2"><p class="text-sm font-medium text-gray-700 dark:text-gray-300"> 📝 Пример результата: </p><div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"><p class="font-mono text-xs text-gray-600 break-all dark:text-gray-400">${ssrInterpolate(previewUrl.value)}</p></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white"> ⚙️ Дополнительные опции </h4><div class="space-y-4"><label class="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary"><div class="relative flex items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(localConfig.createStudents) ? ssrLooseContain(localConfig.createStudents, null) : localConfig.createStudents) ? " checked" : ""} class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"></div><div class="flex-1"><p class="font-medium text-gray-900 dark:text-white"> Создавать новых слушателей, если ПИНФЛ не найден </p><p class="mt-1 text-sm text-gray-500 dark:text-gray-400"> Слушатель будет создан с данными из Excel (ФИО, организация, должность) </p></div></label><label class="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary"><div class="relative flex items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(localConfig.updateExisting) ? ssrLooseContain(localConfig.updateExisting, null) : localConfig.updateExisting) ? " checked" : ""} class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"></div><div class="flex-1"><p class="font-medium text-gray-900 dark:text-white"> Обновлять существующие сертификаты </p><p class="mt-1 text-sm text-gray-500 dark:text-gray-400"> Если сертификат с таким номером уже существует — обновить его данные </p></div></label><label class="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary"><div class="relative flex items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(localConfig.skipErrors) ? ssrLooseContain(localConfig.skipErrors, null) : localConfig.skipErrors) ? " checked" : ""} class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"></div><div class="flex-1"><p class="font-medium text-gray-900 dark:text-white"> Пропускать строки с ошибками </p><p class="mt-1 text-sm text-gray-500 dark:text-gray-400"> Продолжить импорт даже при ошибках в некоторых строках </p></div></label></div></div><div class="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900"><h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white"> 📋 Сводка настроек </h4><dl class="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><dt class="text-sm text-gray-500 dark:text-gray-400">Курс</dt><dd class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(__props.courseInfo?.name || "Не указан")} `);
      if (__props.courseInfo?.code) {
        _push(`<span class="text-gray-500">(${ssrInterpolate(__props.courseInfo.code)})</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</dd></div><div><dt class="text-sm text-gray-500 dark:text-gray-400">Срок действия</dt><dd class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(__props.courseConfig.validityType === "unlimited" ? "Бессрочный" : `${__props.courseConfig.validityMonths} мес.`)}</dd></div><div><dt class="text-sm text-gray-500 dark:text-gray-400">Создание слушателей</dt><dd class="${ssrRenderClass([localConfig.createStudents ? "text-green-600" : "text-gray-500", "font-medium"])}">${ssrInterpolate(localConfig.createStudents ? "Да" : "Нет")}</dd></div><div><dt class="text-sm text-gray-500 dark:text-gray-400">Обновление существующих</dt><dd class="${ssrRenderClass([localConfig.updateExisting ? "text-orange-600" : "text-gray-500", "font-medium"])}">${ssrInterpolate(localConfig.updateExisting ? "Да" : "Нет")}</dd></div></dl></div><div class="flex items-center justify-between"><button class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Назад </button><button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">`);
      if (!__props.loading) {
        _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>`);
      } else {
        _push(`<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
      }
      _push(` ${ssrInterpolate(__props.loading ? "Анализ файла..." : "Анализировать")}</button></div></div>`);
    };
  }
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/CertificateImportSettings.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = {
  __name: "DatabaseCertificateImportAnalysis",
  __ssrInlineRender: true,
  props: {
    analysis: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ["back", "confirm"],
  setup(__props) {
    const formatDate = (dateString) => {
      if (!dateString) return "—";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      } catch {
        return dateString;
      }
    };
    const getStudentStatusClass = (status) => {
      switch (status) {
        case "exists":
          return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
        case "new":
          return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
        case "not_found":
          return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
        default:
          return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      }
    };
    const getStudentStatusText = (status) => {
      switch (status) {
        case "exists":
          return "Найден";
        case "new":
          return "Будет создан";
        case "not_found":
          return "Не найден";
        default:
          return status;
      }
    };
    const getCertificateStatusClass = (status) => {
      switch (status) {
        case "new":
          return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
        case "duplicate":
          return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
        default:
          return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      }
    };
    const getCertificateStatusText = (status) => {
      switch (status) {
        case "new":
          return "Новый";
        case "duplicate":
          return "Дубликат";
        default:
          return status;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 p-6 dark:from-emerald-900/20 dark:to-teal-900/20"><div class="flex items-start gap-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-lg"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg></div><div class="flex-1"><h3 class="text-xl font-bold text-gray-900 dark:text-white"> Анализ данных </h3><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Проверьте данные перед импортом сертификатов </p></div></div></div><div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"><div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Всего строк</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.analysis.totalRows)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Готово к импорту</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.analysis.validRows)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Ошибок</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.analysis.errorRows)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Дубликатов</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.analysis.duplicateCertificates)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></div></div></div></div><div class="grid grid-cols-1 gap-4 md:grid-cols-2"><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30"><svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg></div><div><p class="text-sm font-medium text-gray-600 dark:text-gray-400">Новых слушателей</p><p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(__props.analysis.newStudents)}</p><p class="text-xs text-gray-500 dark:text-gray-400">Будут созданы при импорте</p></div></div></div><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30"><svg class="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div><div><p class="text-sm font-medium text-gray-600 dark:text-gray-400">Существующих слушателей</p><p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(__props.analysis.existingStudents)}</p><p class="text-xs text-gray-500 dark:text-gray-400">Найдены в базе данных</p></div></div></div></div>`);
      if (__props.analysis.errorRows > 0) {
        _push(`<div class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"><div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h4 class="text-lg font-semibold text-red-900 dark:text-red-100"> Ошибки валидации </h4><p class="text-sm text-red-700 dark:text-red-300">${ssrInterpolate(__props.analysis.errorRows)} ${ssrInterpolate(__props.analysis.errorRows === 1 ? "строка содержит" : "строк содержат")} ошибки и будут пропущены </p></div></div></div><div class="max-h-60 overflow-y-auto p-6"><div class="space-y-3"><!--[-->`);
        ssrRenderList(__props.analysis.errors.slice(0, 10), (error) => {
          _push(`<div class="rounded-lg bg-white p-4 dark:bg-gray-800"><p class="mb-2 text-sm font-semibold text-gray-900 dark:text-white"> Строка ${ssrInterpolate(error.rowNumber)}</p><ul class="space-y-1"><!--[-->`);
          ssrRenderList(error.errors, (err, index) => {
            _push(`<li class="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"><svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> ${ssrInterpolate(err)}</li>`);
          });
          _push(`<!--]--></ul></div>`);
        });
        _push(`<!--]--></div>`);
        if (__props.analysis.errors.length > 10) {
          _push(`<p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400"> И ещё ${ssrInterpolate(__props.analysis.errors.length - 10)} ошибок... </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="rounded-xl border border-gray-200 dark:border-gray-700"><div class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800"><h4 class="text-lg font-semibold text-gray-900 dark:text-white"> 📋 Предпросмотр данных </h4><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Показаны первые ${ssrInterpolate(Math.min(__props.analysis.preview.length, 20))} записей </p></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-100 dark:bg-gray-800"><tr><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">№</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ПИНФЛ</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">ФИО</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Номер сертификата</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Дата выдачи</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Слушатель</th><th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Сертификат</th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
      ssrRenderList(__props.analysis.preview.slice(0, 20), (item, index) => {
        _push(`<tr class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"><td class="px-4 py-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(item.rowNumber)}</td><td class="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">${ssrInterpolate(item.pinfl)}</td><td class="px-4 py-3 text-gray-900 dark:text-white">${ssrInterpolate(item.fullName)}</td><td class="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">${ssrInterpolate(item.certificateNumber)}</td><td class="px-4 py-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(formatDate(item.issueDate))}</td><td class="px-4 py-3"><span class="${ssrRenderClass([
          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
          getStudentStatusClass(item.studentStatus)
        ])}">${ssrInterpolate(getStudentStatusText(item.studentStatus))}</span></td><td class="px-4 py-3"><span class="${ssrRenderClass([
          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
          getCertificateStatusClass(item.certificateStatus)
        ])}">${ssrInterpolate(getCertificateStatusText(item.certificateStatus))}</span></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div></div><div class="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900"><h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white"> 📚 Курс и настройки </h4><dl class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><dt class="text-sm text-gray-500 dark:text-gray-400">Курс</dt><dd class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(__props.analysis.courseInfo?.name || "Не указан")}</dd></div>`);
      if (__props.analysis.courseInfo?.code) {
        _push(`<div><dt class="text-sm text-gray-500 dark:text-gray-400">Код курса</dt><dd class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(__props.analysis.courseInfo.code)}</dd></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.analysis.courseInfo?.hours) {
        _push(`<div><dt class="text-sm text-gray-500 dark:text-gray-400">Часов</dt><dd class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(__props.analysis.courseInfo.hours)} ч.</dd></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div><dt class="text-sm text-gray-500 dark:text-gray-400">Срок действия</dt><dd class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(__props.analysis.config?.validityType === "unlimited" ? "Бессрочный" : `${__props.analysis.config?.validityMonths} мес.`)}</dd></div></dl></div><div class="flex items-center justify-between"><button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Назад </button><button${ssrIncludeBooleanAttr(__props.loading || __props.analysis.validRows === 0) ? " disabled" : ""} class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">`);
      if (!__props.loading) {
        _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>`);
      } else {
        _push(`<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
      }
      _push(` ${ssrInterpolate(__props.loading ? "Запуск импорта..." : `Импортировать ${__props.analysis.validRows} сертификатов`)}</button></div></div>`);
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/CertificateImportAnalysis.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = {
  __name: "DatabaseCertificateImportProgress",
  __ssrInlineRender: true,
  props: {
    progress: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const progressPercentage = computed(() => {
      if (props.progress.totalRecords === 0) return 0;
      return Math.round(props.progress.processedRecords / props.progress.totalRecords * 100);
    });
    const statusText = computed(() => {
      switch (props.progress.status) {
        case "processing":
          return "Импорт сертификатов";
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
          return "Все сертификаты успешно обработаны";
        case "failed":
          return "Произошла ошибка при импорте сертификатов";
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
      _push(`</div><h3 class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(statusText.value)}</h3><p class="mt-2 text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(statusDescription.value)}</p></div><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><div class="mb-4 flex items-center justify-between"><span class="text-sm font-medium text-gray-700 dark:text-gray-300"> Обработано сертификатов </span><span class="text-sm font-bold text-primary">${ssrInterpolate(__props.progress.processedRecords)} / ${ssrInterpolate(__props.progress.totalRecords)}</span></div><div class="relative h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"><div class="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out" style="${ssrRenderStyle({ width: `${progressPercentage.value}%` })}"><div class="h-full w-full animate-pulse bg-white/20"></div></div></div><div class="mt-2 text-center"><span class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(progressPercentage.value)}% </span></div></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><div class="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Создано слушателей</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.progress.createdStudents)}</p></div><div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Сертификатов</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.progress.createdCertificates)}</p></div><div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Пропущено</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.progress.skippedDuplicates || 0)}</p></div><div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-lg transform transition-transform hover:scale-105"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Ошибки</p><p class="mt-2 text-3xl font-bold">${ssrInterpolate(__props.progress.errors?.length || 0)}</p></div><div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div></div></div></div>`);
      if (__props.progress.errors && __props.progress.errors.length > 0) {
        _push(`<div class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"><div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h4 class="text-lg font-semibold text-red-900 dark:text-red-100"> Ошибки при импорте </h4><p class="text-sm text-red-700 dark:text-red-300">${ssrInterpolate(__props.progress.errors.length)} ${ssrInterpolate(__props.progress.errors.length === 1 ? "запись" : "записей")} не удалось импортировать </p></div></div></div><div class="max-h-60 overflow-y-auto p-6"><div class="space-y-3"><!--[-->`);
        ssrRenderList(__props.progress.errors.slice(0, 10), (error, index) => {
          _push(`<div class="rounded-lg bg-white p-4 dark:bg-gray-800"><div class="flex items-start justify-between gap-4"><div class="flex-1"><p class="mb-1 text-sm font-semibold text-gray-900 dark:text-white"> Строка ${ssrInterpolate(error.rowNumber)}</p><p class="text-sm text-red-600 dark:text-red-400">${ssrInterpolate(error.error)}</p></div></div></div>`);
        });
        _push(`<!--]--></div>`);
        if (__props.progress.errors.length > 10) {
          _push(`<p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400"> И ещё ${ssrInterpolate(__props.progress.errors.length - 10)} ошибок... </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.progress.status === "processing") {
        _push(`<div class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400"><div class="flex gap-1"><div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="${ssrRenderStyle({ "animation-delay": "0ms" })}"></div><div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="${ssrRenderStyle({ "animation-delay": "150ms" })}"></div><div class="h-2 w-2 animate-bounce rounded-full bg-primary" style="${ssrRenderStyle({ "animation-delay": "300ms" })}"></div></div><span>Импорт сертификатов в процессе...</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/CertificateImportProgress.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "DatabaseCertificateImportResults",
  __ssrInlineRender: true,
  props: {
    result: {
      type: Object,
      required: true
    }
  },
  emits: ["newImport", "goToCertificates"],
  setup(__props) {
    const props = __props;
    const isSuccess = computed(() => {
      return props.result.failed === 0 || props.result.createdCertificates > 0;
    });
    const resultDescription = computed(() => {
      if (props.result.failed === 0) {
        return `Все ${props.result.totalProcessed} сертификатов успешно импортированы`;
      }
      return `${props.result.createdCertificates} из ${props.result.totalProcessed} сертификатов импортированы успешно`;
    });
    const duration = computed(() => {
      if (!props.result.duration) return "—";
      const ms = props.result.duration;
      const seconds = Math.floor(ms / 1e3);
      const minutes = Math.floor(seconds / 60);
      if (minutes > 0) {
        return `${minutes} мин ${seconds % 60} сек`;
      }
      return `${seconds} сек`;
    });
    const successRate = computed(() => {
      if (props.result.totalProcessed === 0) return 0;
      return Math.round(props.result.createdCertificates / props.result.totalProcessed * 100);
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
      _push(`</div><h3 class="text-3xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(isSuccess.value ? "Импорт завершён успешно!" : "Импорт завершён с ошибками")}</h3><p class="mt-2 text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(resultDescription.value)}</p></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Всего обработано</p><p class="mt-2 text-4xl font-bold">${ssrInterpolate(__props.result.totalProcessed)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Новых слушателей</p><p class="mt-2 text-4xl font-bold">${ssrInterpolate(__props.result.createdStudents)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Сертификатов</p><p class="mt-2 text-4xl font-bold">${ssrInterpolate(__props.result.createdCertificates)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg></div></div></div><div class="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-lg"><div class="flex items-center justify-between"><div><p class="text-sm font-medium opacity-90">Ошибок</p><p class="mt-2 text-4xl font-bold">${ssrInterpolate(__props.result.failed)}</p></div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div></div></div></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30"><svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><p class="text-sm font-medium text-gray-600 dark:text-gray-400">Время выполнения</p><p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(duration.value)}</p></div></div></div><div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-boxdark"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30"><svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></div><div><p class="text-sm font-medium text-gray-600 dark:text-gray-400">Успешность</p><p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(successRate.value)}%</p></div></div></div></div>`);
      if (__props.result.skippedDuplicates > 0) {
        _push(`<div class="rounded-xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-900/20"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-200 dark:bg-orange-800"><svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></div><div><p class="font-medium text-orange-800 dark:text-orange-200"> Пропущено ${ssrInterpolate(__props.result.skippedDuplicates)} дубликатов </p><p class="text-sm text-orange-600 dark:text-orange-400"> Сертификаты с такими номерами уже существуют в системе </p></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.result.errors && __props.result.errors.length > 0) {
        _push(`<div class="rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"><div class="border-b border-red-200 bg-red-100 px-6 py-4 dark:border-red-800 dark:bg-red-900/30"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h4 class="text-lg font-semibold text-red-900 dark:text-red-100"> Детали ошибок </h4><p class="text-sm text-red-700 dark:text-red-300">${ssrInterpolate(__props.result.errors.length)} ${ssrInterpolate(__props.result.errors.length === 1 ? "запись" : "записей")} не удалось импортировать </p></div></div><button class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Скачать отчёт </button></div></div><div class="max-h-80 overflow-y-auto p-6"><div class="space-y-3"><!--[-->`);
        ssrRenderList(__props.result.errors, (error, index) => {
          _push(`<div class="rounded-lg bg-white p-4 dark:bg-gray-800"><div class="flex items-start justify-between gap-4"><div class="flex-1"><p class="mb-1 text-sm font-semibold text-gray-900 dark:text-white"> Строка ${ssrInterpolate(error.rowNumber)} `);
          if (error.certificateNumber) {
            _push(`<span class="text-gray-500"> • ${ssrInterpolate(error.certificateNumber)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p><p class="text-sm text-red-600 dark:text-red-400">${ssrInterpolate(error.error)}</p></div></div></div>`);
        });
        _push(`<!--]--></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center"><button class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Новый импорт </button><button class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg> Перейти к сертификатам </button></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/CertificateImportResults.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "import-certificates",
  __ssrInlineRender: true,
  setup(__props) {
    const steps = [
      { id: 1, label: "Курс" },
      { id: 2, label: "Файл" },
      { id: 3, label: "Настройки" },
      { id: 4, label: "Анализ" },
      { id: 5, label: "Импорт" }
    ];
    const currentStep = ref(1);
    const analyzing = ref(false);
    const importing = ref(false);
    const courseConfig = reactive({
      courseSource: "manual",
      courseId: "",
      courseName: "",
      courseCode: "",
      courseHours: null,
      validityType: "unlimited",
      validityMonths: 12
    });
    const courseInfo = computed(() => {
      return {
        name: courseConfig.courseName,
        code: courseConfig.courseCode,
        hours: courseConfig.courseHours
      };
    });
    const selectedFile = ref(null);
    const settingsConfig = reactive({
      urlTemplate: "",
      createStudents: true,
      updateExisting: false,
      skipErrors: true
    });
    const analysis = ref(null);
    const importProgress = ref(null);
    const importResult = ref(null);
    const jobId = ref(null);
    const notification = reactive({
      show: false,
      type: "info",
      message: ""
    });
    const { authFetch } = useAuthFetch();
    const showNotification = (type, message) => {
      notification.type = type;
      notification.message = message;
      notification.show = true;
      setTimeout(() => {
        notification.show = false;
      }, 5e3);
    };
    const handleCourseConfigUpdate = (config) => {
      Object.assign(courseConfig, config);
    };
    const handleCourseConfigComplete = (config) => {
      Object.assign(courseConfig, config);
      currentStep.value = 2;
    };
    const handleFileSelected = (file) => {
      selectedFile.value = file;
    };
    const handleFileComplete = (file) => {
      selectedFile.value = file;
      currentStep.value = 3;
    };
    const handleSettingsConfigUpdate = (config) => {
      Object.assign(settingsConfig, config);
    };
    const handleAnalyze = async (config) => {
      Object.assign(settingsConfig, config);
      if (!selectedFile.value) {
        showNotification("error", "Файл не выбран");
        return;
      }
      analyzing.value = true;
      try {
        const formData = new FormData();
        formData.append("file", selectedFile.value);
        const importConfig = {
          courseSource: courseConfig.courseSource,
          courseId: courseConfig.courseId,
          courseName: courseConfig.courseName,
          courseCode: courseConfig.courseCode,
          courseHours: courseConfig.courseHours,
          validityType: courseConfig.validityType,
          validityMonths: courseConfig.validityMonths,
          urlTemplate: settingsConfig.urlTemplate,
          createStudents: settingsConfig.createStudents,
          updateExisting: settingsConfig.updateExisting,
          skipErrors: settingsConfig.skipErrors
        };
        formData.append("config", JSON.stringify(importConfig));
        const response = await authFetch("/api/certificates/import/analyze", {
          method: "POST",
          body: formData
        });
        if (response.success && response.analysis) {
          analysis.value = {
            ...response.analysis,
            courseInfo: courseInfo.value,
            config: courseConfig
          };
          currentStep.value = 4;
          showNotification("success", "Анализ файла завершён");
        } else {
          showNotification("error", response.error || "Ошибка анализа файла");
        }
      } catch (error) {
        console.error("Ошибка анализа файла:", error);
        showNotification("error", "Ошибка анализа файла: " + (error.message || "Неизвестная ошибка"));
      } finally {
        analyzing.value = false;
      }
    };
    const handleConfirmImport = async () => {
      if (!analysis.value || analysis.value.validRows === 0) {
        showNotification("error", "Нет данных для импорта");
        return;
      }
      importing.value = true;
      currentStep.value = 5;
      importProgress.value = {
        status: "processing",
        totalRecords: analysis.value.validRows,
        processedRecords: 0,
        createdStudents: 0,
        createdCertificates: 0,
        errors: [],
        startedAt: /* @__PURE__ */ new Date()
      };
      try {
        const importData = {
          rows: analysis.value.preview.filter((row) => row.status !== "error"),
          config: {
            courseSource: courseConfig.courseSource,
            courseId: courseConfig.courseId,
            courseName: courseConfig.courseName,
            courseCode: courseConfig.courseCode,
            courseHours: courseConfig.courseHours,
            validityType: courseConfig.validityType,
            validityMonths: courseConfig.validityMonths,
            urlTemplate: settingsConfig.urlTemplate,
            createStudents: settingsConfig.createStudents,
            updateExisting: settingsConfig.updateExisting,
            skipErrors: settingsConfig.skipErrors
          },
          courseInfo: courseInfo.value
        };
        const response = await authFetch("/api/certificates/import/execute", {
          method: "POST",
          body: importData
        });
        if (response.success && response.jobId) {
          jobId.value = response.jobId;
          startProgressPolling();
        } else {
          importProgress.value.status = "failed";
          importResult.value = {
            totalProcessed: 0,
            createdStudents: 0,
            createdCertificates: 0,
            failed: analysis.value.validRows,
            skippedDuplicates: 0,
            errors: [{ rowNumber: 0, error: response.error || "Ошибка запуска импорта" }],
            duration: 0
          };
          showNotification("error", response.error || "Ошибка запуска импорта");
        }
      } catch (error) {
        console.error("Ошибка запуска импорта:", error);
        importProgress.value.status = "failed";
        importResult.value = {
          totalProcessed: 0,
          createdStudents: 0,
          createdCertificates: 0,
          failed: analysis.value?.validRows || 0,
          skippedDuplicates: 0,
          errors: [{ rowNumber: 0, error: error.message || "Ошибка запуска импорта" }],
          duration: 0
        };
        showNotification("error", "Ошибка запуска импорта");
      } finally {
        importing.value = false;
      }
    };
    const startProgressPolling = () => {
      setInterval();
    };
    const handleGoBack = () => {
      if (currentStep.value > 1) {
        currentStep.value--;
      }
    };
    const handleNewImport = () => {
      currentStep.value = 1;
      selectedFile.value = null;
      analysis.value = null;
      importProgress.value = null;
      importResult.value = null;
      jobId.value = null;
      Object.assign(courseConfig, {
        courseSource: "manual",
        courseId: "",
        courseName: "",
        courseCode: "",
        courseHours: null,
        validityType: "unlimited",
        validityMonths: 12
      });
      Object.assign(settingsConfig, {
        urlTemplate: "",
        createStudents: true,
        updateExisting: false,
        skipErrors: true
      });
    };
    const goToCertificates = () => {
      navigateTo("/database");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_DatabaseCertificateImportCourseSelect = _sfc_main$6;
      const _component_DatabaseCertificateImportUploader = _sfc_main$5;
      const _component_DatabaseCertificateImportSettings = _sfc_main$4;
      const _component_DatabaseCertificateImportAnalysis = _sfc_main$3;
      const _component_DatabaseCertificateImportProgress = _sfc_main$2;
      const _component_DatabaseCertificateImportResults = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Импорт сертификатов </h2><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Массовый импорт сертификатов из Excel файла </p></div>`);
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
        _push(`</div><p class="${ssrRenderClass([{ "text-primary font-semibold": currentStep.value === index + 1 }, "mt-2 text-xs sm:text-sm font-medium text-center text-gray-700 dark:text-gray-300"])}">${ssrInterpolate(step.label)}</p></div>`);
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
      _push(ssrRenderComponent(_component_DatabaseCertificateImportCourseSelect, {
        config: courseConfig,
        "onUpdate:config": handleCourseConfigUpdate,
        onNext: handleCourseConfigComplete
      }, null, _parent));
      _push(`</div><div class="p-6" style="${ssrRenderStyle(currentStep.value === 2 ? null : { display: "none" })}">`);
      _push(ssrRenderComponent(_component_DatabaseCertificateImportUploader, {
        loading: false,
        onBack: handleGoBack,
        onFileSelected: handleFileSelected,
        onNext: handleFileComplete
      }, null, _parent));
      _push(`</div><div class="p-6" style="${ssrRenderStyle(currentStep.value === 3 ? null : { display: "none" })}">`);
      _push(ssrRenderComponent(_component_DatabaseCertificateImportSettings, {
        loading: analyzing.value,
        "course-config": courseConfig,
        "course-info": courseInfo.value,
        config: settingsConfig,
        "onUpdate:config": handleSettingsConfigUpdate,
        onBack: handleGoBack,
        onAnalyze: handleAnalyze
      }, null, _parent));
      _push(`</div><div class="p-6" style="${ssrRenderStyle(currentStep.value === 4 ? null : { display: "none" })}">`);
      if (analysis.value) {
        _push(ssrRenderComponent(_component_DatabaseCertificateImportAnalysis, {
          analysis: analysis.value,
          loading: importing.value,
          onBack: handleGoBack,
          onConfirm: handleConfirmImport
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="p-6" style="${ssrRenderStyle(currentStep.value === 5 ? null : { display: "none" })}">`);
      if (importProgress.value && importProgress.value.status !== "completed" && importProgress.value.status !== "failed") {
        _push(ssrRenderComponent(_component_DatabaseCertificateImportProgress, { progress: importProgress.value }, null, _parent));
      } else if (importResult.value) {
        _push(ssrRenderComponent(_component_DatabaseCertificateImportResults, {
          result: importResult.value,
          onNewImport: handleNewImport,
          onGoToCertificates: goToCertificates
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (notification.show) {
          _push2(`<div class="${ssrRenderClass([[
            notification.type === "success" ? "bg-green-500 text-white" : notification.type === "error" ? "bg-red-500 text-white" : "bg-blue-500 text-white"
          ], "fixed bottom-6 right-6 z-50 rounded-lg px-6 py-4 shadow-lg transition-all duration-300"])}"><div class="flex items-center gap-3">`);
          if (notification.type === "success") {
            _push2(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
          } else if (notification.type === "error") {
            _push2(`<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`<span class="font-medium">${ssrInterpolate(notification.message)}</span><button class="ml-2 opacity-75 hover:opacity-100"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/database/import-certificates.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=import-certificates-6HsO-U-t.mjs.map
