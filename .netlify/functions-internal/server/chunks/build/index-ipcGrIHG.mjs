import { _ as __nuxt_component_0 } from './nuxt-link-lE24s-NV.mjs';
import { ref, mergeProps, withCtx, createTextVNode, toDisplayString, createBlock, openBlock, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderComponent, ssrRenderStyle } from 'vue/server-renderer';
import { u as useHead } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-pXCaAdz0.mjs';
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

const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Мои курсы | TailAdmin"
    });
    const loading = ref(true);
    const courses = ref([]);
    useAuthFetch();
    const formatDate = (dateStr) => {
      if (!dateStr) return "TBA";
      return new Date(dateStr).toLocaleDateString("ru-RU");
    };
    const getStatusLabel = (status) => {
      const map = {
        active: "Активен",
        completed: "Завершен",
        dropped: "Отчислен"
      };
      return map[status] || status;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Мои курсы </h2></div>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-20"><div class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (courses.value.length === 0) {
        _push(`<div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white px-5 pt-6 pb-2.5 shadow-md dark:bg-boxdark sm:px-7.5 xl:pb-1"><div class="flex flex-col items-center justify-center py-12"><div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"><svg class="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div><h3 class="text-xl font-medium text-gray-900 dark:text-white mb-2">Нет активных курсов</h3><p class="text-gray-500 dark:text-gray-400 text-center max-w-md"> Вы пока не записаны ни на один курс. Обратитесь к администратору для зачисления. </p></div></div>`);
      } else {
        _push(`<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"><!--[-->`);
        ssrRenderList(courses.value, (course) => {
          _push(`<div class="group relative flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md transition-all hover:shadow-lg dark:bg-boxdark"><div class="absolute top-4 right-4 z-10"><span class="${ssrRenderClass([
            "rounded-full px-3 py-1 text-xs font-medium",
            course.status === "active" ? "bg-success/10 text-success" : course.status === "completed" ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"
          ])}">${ssrInterpolate(getStatusLabel(course.status))}</span></div><div class="p-6 flex-1 flex flex-col"><div class="mb-4"><h3 class="text-xl font-bold text-black dark:text-white mb-1 group-hover:text-primary transition-colors">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/my-courses/${course.group_id}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(course.course_name)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(course.course_name), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</h3><p class="text-sm font-medium text-gray-500 dark:text-gray-400"> Группа: ${ssrInterpolate(course.group_name)}</p></div><div class="mb-6 space-y-3"><div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg><span>${ssrInterpolate(course.teacher_name || "Преподаватель не назначен")}</span></div><div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>${ssrInterpolate(formatDate(course.start_date))} — ${ssrInterpolate(formatDate(course.end_date))}</span></div></div><div class="mt-auto"><div class="mb-2 flex items-center justify-between"><span class="text-sm font-medium text-black dark:text-white">Прогресс</span><span class="text-sm font-medium text-primary">${ssrInterpolate(course.progress)}%</span></div><div class="relative h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700"><div class="absolute left-0 h-full rounded-full bg-primary transition-all duration-500" style="${ssrRenderStyle({ width: `${course.progress}%` })}"></div></div><div class="mt-2 text-xs text-gray-500 text-right"> Посещено: ${ssrInterpolate(course.attended_lessons)} / ${ssrInterpolate(course.total_lessons)} занятий </div></div></div>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/my-courses/${course.group_id}`,
            class: "flex items-center justify-center border-t border-gray-200 dark:border-gray-700 bg-gray-50 p-4 font-medium text-black transition hover:bg-gray-100 hover:text-primary dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Перейти к обучению <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"${_scopeId}></path></svg>`);
              } else {
                return [
                  createTextVNode(" Перейти к обучению "),
                  (openBlock(), createBlock("svg", {
                    class: "ml-2 h-4 w-4",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M14 5l7 7m0 0l-7 7m7-7H3"
                    })
                  ]))
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/my-courses/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-ipcGrIHG.mjs.map
