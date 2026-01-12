import { defineComponent, mergeProps, createVNode, resolveDynamicComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderVNode, ssrRenderSlot } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "Button",
  __ssrInlineRender: true,
  props: {
    size: { default: "md" },
    variant: { default: "primary" },
    startIcon: {},
    endIcon: {},
    onClick: {},
    className: { default: "" },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    type: { default: "button" }
  },
  emits: ["click"],
  setup(__props, { emit: __emit }) {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-3.5 text-sm",
      lg: "px-6 py-3 text-base"
    };
    const variantClasses = {
      primary: "bg-primary text-white hover:bg-opacity-90 focus:ring-primary",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
      success: "bg-success text-white hover:bg-opacity-90 focus:ring-success",
      danger: "bg-danger text-white hover:bg-opacity-90 focus:ring-danger",
      warning: "bg-warning text-white hover:bg-opacity-90 focus:ring-warning",
      outline: "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<button${ssrRenderAttrs(mergeProps({
        type: __props.type,
        disabled: __props.disabled || __props.loading,
        class: [
          "inline-flex items-center justify-center font-medium gap-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
          sizeClasses[__props.size],
          variantClasses[__props.variant],
          __props.className,
          { "cursor-not-allowed opacity-50": __props.disabled || __props.loading }
        ]
      }, _attrs))}>`);
      if (__props.loading) {
        _push(`<span class="flex items-center"><div class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent"></div></span>`);
      } else {
        _push(`<!---->`);
      }
      if ((__props.startIcon || _ctx.$slots.iconLeft) && !__props.loading) {
        _push(`<span class="flex items-center">`);
        if (__props.startIcon) {
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(__props.startIcon), null, null), _parent);
        } else {
          ssrRenderSlot(_ctx.$slots, "iconLeft", {}, null, _push, _parent);
        }
        _push(`</span>`);
      } else {
        _push(`<!---->`);
      }
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      if ((__props.endIcon || _ctx.$slots.iconRight) && !__props.loading) {
        _push(`<span class="flex items-center">`);
        if (__props.endIcon) {
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(__props.endIcon), null, null), _parent);
        } else {
          ssrRenderSlot(_ctx.$slots, "iconRight", {}, null, _push, _parent);
        }
        _push(`</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</button>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/Button.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main, { __name: "UiButton" });

export { __nuxt_component_1 as _ };
//# sourceMappingURL=Button-DE8MjHjS.mjs.map
