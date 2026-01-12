import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { mergeProps, withCtx, createTextVNode, useSSRContext } from 'vue';
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
  __name: "error-404",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "404 Error | TailAdmin - Nuxt Tailwind CSS Dashboard"
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-7xl" }, _attrs))}>`);
      _push(ssrRenderComponent(PageBreadcrumb, { pageName: "404 Error" }, null, _parent));
      _push(`<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div class="text-center"><h1 class="mb-4 text-9xl font-bold text-brand-500">404</h1><h2 class="mb-4 text-2xl font-semibold text-gray-900 dark:text-white"> Page Not Found </h2><p class="mb-8 text-gray-600 dark:text-gray-400"> The page you are looking for doesn&#39;t exist or has been moved. </p>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 text-white transition-colors hover:bg-brand-600"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Go Back Home `);
          } else {
            return [
              createTextVNode(" Go Back Home ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/error-404.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=error-404-BbPtM7GT.mjs.map
