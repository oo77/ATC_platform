import { mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { P as PageBreadcrumb } from './PageBreadcrumb-WQHDLv0j.mjs';
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

const _sfc_main = {
  __name: "basic-tables",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Basic Tables | TailAdmin - Nuxt Tailwind CSS Dashboard"
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-7xl" }, _attrs))}>`);
      _push(ssrRenderComponent(PageBreadcrumb, { pageName: "Basic Tables" }, null, _parent));
      _push(`<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h2 class="mb-4 text-2xl font-semibold text-gray-900 dark:text-white"> Basic Tables </h2><p class="text-gray-600 dark:text-gray-400"> Basic tables page content will be here. </p></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/basic-tables.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=basic-tables-CA8PiYB8.mjs.map
