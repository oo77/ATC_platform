import { _ as __nuxt_component_0 } from './nuxt-link-DnWQlAEm.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderClass, ssrRenderStyle } from 'vue/server-renderer';
import { I as InstructorsHoursStats, a as InstructorsCourseHistory } from './CourseHistory-C2KH9Ed5.mjs';
import { u as useHead, e as useAuth } from './server.mjs';
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
import './Button-D9CRGwzT.mjs';
import './useAuthFetch-DSbqu-Nq.mjs';
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
    useHead({
      title: "Моя статистика | ATC Platform"
    });
    const { user, isAuthenticated, hasRole } = useAuth();
    const loading = ref(true);
    const activeTab = ref("hours");
    const instructorId = computed(() => user.value?.instructorId);
    const isInstructor = computed(
      () => !!instructorId.value && hasRole(["TEACHER", "ADMIN", "MANAGER"])
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Моя статистика </h2><nav><ol class="flex items-center gap-2"><li>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        class: "font-medium",
        to: "/"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Главная /`);
          } else {
            return [
              createTextVNode("Главная /")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="font-medium text-primary">Статистика</li></ol></nav></div>`);
      if (!unref(isAuthenticated)) {
        _push(`<div class="text-center py-20"><p>Пожалуйста, войдите в систему.</p></div>`);
      } else if (loading.value) {
        _push(`<div class="flex justify-center py-20"><div class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (!isInstructor.value) {
        _push(`<div class="text-center py-20"><div class="mx-auto mb-4 h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center"><svg class="h-8 w-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div><h3 class="text-xl font-bold text-black dark:text-white mb-2"> Нет доступа </h3><p class="text-gray-500">Ваш аккаунт не связан с профилем инструктора.</p></div>`);
      } else {
        _push(`<div><div class="mb-6 flex flex-wrap gap-5 border-b border-stroke dark:border-strokedark sm:gap-10"><button class="${ssrRenderClass([
          activeTab.value === "hours" ? "border-primary text-primary" : "border-transparent text-body-color dark:text-bodydark",
          "border-b-2 py-4 text-sm font-medium hover:text-primary md:text-base transition-colors"
        ])}"> Отчётность по часам </button><button class="${ssrRenderClass([
          activeTab.value === "history" ? "border-primary text-primary" : "border-transparent text-body-color dark:text-bodydark",
          "border-b-2 py-4 text-sm font-medium hover:text-primary md:text-base transition-colors"
        ])}"> История курсов </button></div><div style="${ssrRenderStyle(activeTab.value === "hours" ? null : { display: "none" })}">`);
        if (instructorId.value) {
          _push(ssrRenderComponent(InstructorsHoursStats, {
            "instructor-id": instructorId.value,
            "initial-load": true,
            ref: "hoursStatsRef"
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div style="${ssrRenderStyle(activeTab.value === "history" ? null : { display: "none" })}">`);
        if (instructorId.value) {
          _push(ssrRenderComponent(InstructorsCourseHistory, {
            "instructor-id": instructorId.value,
            "initial-load": true,
            ref: "courseHistoryRef"
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/instructor/stats/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BH30ZpBr.mjs.map
