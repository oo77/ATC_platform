import { defineComponent, watch, useSSRContext } from 'vue';
import { ssrRenderTeleport, ssrRenderClass, ssrRenderSlot, ssrInterpolate } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "Modal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    title: {},
    size: { default: "md" },
    closeOnBackdrop: { type: Boolean, default: false }
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const sizeClasses = {
      sm: "max-w-md",
      md: "max-w-2xl",
      lg: "max-w-4xl",
      xl: "max-w-6xl",
      full: "max-w-full mx-4"
    };
    watch(
      () => props.isOpen,
      (isOpen) => {
        if (isOpen) {
          (void 0).body.style.overflow = "hidden";
        } else {
          (void 0).body.style.overflow = "";
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderTeleport(_push, (_push2) => {
        if (__props.isOpen) {
          _push2(`<div class="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto p-4"><div class="fixed inset-0 bg-black/50 backdrop-blur" aria-hidden="true"></div>`);
          if (__props.isOpen) {
            _push2(`<div class="${ssrRenderClass([
              "relative bg-white dark:bg-boxdark rounded-lg shadow-xl w-full",
              sizeClasses[__props.size]
            ])}" role="dialog" aria-modal="true">`);
            if (__props.title || _ctx.$slots.header) {
              _push2(`<div class="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark">`);
              ssrRenderSlot(_ctx.$slots, "header", {}, () => {
                _push2(`<h3 class="text-xl font-semibold text-black dark:text-white">${ssrInterpolate(__props.title)}</h3>`);
              }, _push2, _parent);
              _push2(`<button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="px-6 py-6">`);
            ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent);
            _push2(`</div>`);
            if (_ctx.$slots.footer) {
              _push2(`<div class="px-6 py-4 border-t border-stroke dark:border-strokedark">`);
              ssrRenderSlot(_ctx.$slots, "footer", {}, null, _push2, _parent);
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/Modal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main, { __name: "UiModal" });

export { __nuxt_component_0 as _ };
//# sourceMappingURL=Modal-DQYphXo7.mjs.map
