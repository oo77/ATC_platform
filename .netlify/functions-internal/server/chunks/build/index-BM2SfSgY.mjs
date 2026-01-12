import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { n as navigateTo } from './server.mjs';
import { defineComponent, ref, computed, mergeProps, unref, withCtx, createBlock, createTextVNode, openBlock, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { u as usePermissions } from './usePermissions-C-v7fTov.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useAuthFetch();
    const { canCreateCourses } = usePermissions();
    const loading = ref(false);
    const courses = ref([]);
    const pagination = ref({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });
    const filters = ref({
      search: "",
      isActive: void 0
    });
    const stats = computed(() => {
      return {
        totalCourses: pagination.value.total,
        activeCourses: courses.value.filter((c) => c.isActive).length,
        totalHours: courses.value.reduce((sum, c) => sum + c.totalHours, 0)
      };
    });
    const hasActiveFilters = computed(() => {
      return filters.value.search !== "" || filters.value.isActive !== void 0;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Учебные программы </h2>`);
      if (unref(canCreateCourses)) {
        _push(ssrRenderComponent(_component_UiButton, {
          onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/programs/create"),
          class: "flex items-center gap-2"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Создать учебную программу `);
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
                    d: "M12 4v16m8-8H4"
                  })
                ])),
                createTextVNode(" Создать учебную программу ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6"><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Всего программ</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.totalCourses)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"><svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Активных программ</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.activeCourses)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10"><svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Всего часов</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.totalHours)}</p></div></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6"><div class="flex items-center gap-3 mb-4"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg></div><h4 class="text-lg font-semibold text-black dark:text-white">Фильтры</h4>`);
      if (hasActiveFilters.value) {
        _push(`<button class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Сбросить фильтры </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Поиск </label><div class="relative"><input${ssrRenderAttr("value", filters.value.search)} type="text" placeholder="Название, код курса..." class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Статус </label><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"><option${ssrRenderAttr("value", void 0)}${ssrIncludeBooleanAttr(Array.isArray(filters.value.isActive) ? ssrLooseContain(filters.value.isActive, void 0) : ssrLooseEqual(filters.value.isActive, void 0)) ? " selected" : ""}>Все</option><option${ssrRenderAttr("value", true)}${ssrIncludeBooleanAttr(Array.isArray(filters.value.isActive) ? ssrLooseContain(filters.value.isActive, true) : ssrLooseEqual(filters.value.isActive, true)) ? " selected" : ""}>Активные</option><option${ssrRenderAttr("value", false)}${ssrIncludeBooleanAttr(Array.isArray(filters.value.isActive) ? ssrLooseContain(filters.value.isActive, false) : ssrLooseEqual(filters.value.isActive, false)) ? " selected" : ""}>Неактивные</option></select><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">`);
      if (loading.value) {
        _push(`<div class="p-12 text-center"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div><p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка учебных программ...</p></div>`);
      } else if (courses.value.length === 0) {
        _push(`<div class="p-12 text-center text-gray-500 dark:text-gray-400"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg><p class="mt-4 text-lg font-medium">Учебные программы не найдены</p><p class="mt-2">Создайте первую учебную программу, нажав кнопку &quot;Создать учебную программу&quot;</p></div>`);
      } else {
        _push(`<div class="overflow-x-auto"><table class="w-full"><thead><tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"><th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Учебная программа </th><th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Код </th><th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Дисциплины </th><th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Часы </th><th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Статус </th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
        ssrRenderList(courses.value, (course) => {
          _push(`<tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"><td class="px-6 py-4"><div><div class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(course.name)}</div><div class="text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(course.shortName)}</div></div></td><td class="px-6 py-4"><span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">${ssrInterpolate(course.code)}</span></td><td class="px-6 py-4 text-sm text-gray-900 dark:text-white">${ssrInterpolate(course.disciplineCount || 0)}</td><td class="px-6 py-4 text-sm text-gray-900 dark:text-white">${ssrInterpolate(course.totalHours)}</td><td class="px-6 py-4"><span class="${ssrRenderClass([
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            course.isActive ? "bg-success/10 text-success" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          ])}">${ssrInterpolate(course.isActive ? "Активна" : "Неактивна")}</span></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      }
      if (pagination.value.totalPages > 1) {
        _push(`<div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4"><div class="flex items-center justify-between"><div class="text-sm text-gray-700 dark:text-gray-300"> Показано <span class="font-medium">${ssrInterpolate((pagination.value.page - 1) * pagination.value.limit + 1)}</span> - <span class="font-medium">${ssrInterpolate(Math.min(pagination.value.page * pagination.value.limit, pagination.value.total))}</span> из <span class="font-medium">${ssrInterpolate(pagination.value.total)}</span> программ </div><div class="flex gap-2"><button${ssrIncludeBooleanAttr(pagination.value.page === 1) ? " disabled" : ""} class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"> Назад </button><button${ssrIncludeBooleanAttr(pagination.value.page >= pagination.value.totalPages) ? " disabled" : ""} class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"> Вперёд </button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/programs/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BM2SfSgY.mjs.map
