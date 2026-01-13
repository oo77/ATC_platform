import { defineComponent, resolveComponent, mergeProps, withCtx, createTextVNode, createBlock, openBlock, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PageBreadcrumb",
  __ssrInlineRender: true,
  props: {
    pageTitle: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_router_link = resolveComponent("router-link");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-wrap items-center justify-between gap-3 mb-6" }, _attrs))}><h2 class="text-xl font-semibold text-gray-800 dark:text-white/90" x-text="pageTitle">${ssrInterpolate(__props.pageTitle)}</h2><nav><ol class="flex items-center gap-1.5"><li>`);
      _push(ssrRenderComponent(_component_router_link, {
        class: "inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400",
        to: "/"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Home <svg class="stroke-current" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg"${_scopeId}><path d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366" stroke="" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"${_scopeId}></path></svg>`);
          } else {
            return [
              createTextVNode(" Home "),
              (openBlock(), createBlock("svg", {
                class: "stroke-current",
                width: "17",
                height: "16",
                viewBox: "0 0 17 16",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg"
              }, [
                createVNode("path", {
                  d: "M6.0765 12.667L10.2432 8.50033L6.0765 4.33366",
                  stroke: "",
                  "stroke-width": "1.2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                })
              ]))
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="text-sm text-gray-800 dark:text-white/90">${ssrInterpolate(__props.pageTitle)}</li></ol></nav></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/PageBreadcrumb.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const PageBreadcrumb = Object.assign(_sfc_main, { __name: "CommonPageBreadcrumb" });

export { PageBreadcrumb as P };
//# sourceMappingURL=PageBreadcrumb-WQHDLv0j.mjs.map
