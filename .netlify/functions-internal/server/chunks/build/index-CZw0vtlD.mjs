import { defineComponent, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs } from 'vue/server-renderer';
import { u as useHead } from './server.mjs';
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
    useHead({
      title: "Панель управления"
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "grid grid-cols-12 gap-4 md:gap-6" }, _attrs))}><div class="col-span-12"><div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"><h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-4"> Панель управления </h1><p class="text-gray-600 dark:text-gray-400"> Welcome to TailAdmin Nuxt 4 Dashboard! This is the main dashboard page. </p></div></div><div class="col-span-12 lg:col-span-6"><div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"><h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-2"> Monthly Revenue </h2><p class="text-3xl font-bold text-brand-500">$24,780</p></div></div><div class="col-span-12 lg:col-span-6"><div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"><h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-2"> Total Orders </h2><p class="text-3xl font-bold text-success-500">1,234</p></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-CZw0vtlD.mjs.map
