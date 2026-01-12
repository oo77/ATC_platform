import { defineComponent, ref, computed, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderStyle } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "Notification",
  __ssrInlineRender: true,
  props: {
    type: { default: "info" },
    title: {},
    message: {},
    duration: { default: 5e3 }
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const visible = ref(false);
    const progress = ref(100);
    const typeClasses = computed(() => {
      const classes = {
        success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
        error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
        warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
        info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
      };
      return classes[props.type];
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (visible.value) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: [
            "pointer-events-auto w-full min-w-[320px] max-w-md rounded-lg shadow-xl border",
            typeClasses.value
          ],
          role: "alert"
        }, _attrs))}><div class="flex items-start gap-3 p-4"><div class="shrink-0">`);
        if (__props.type === "success") {
          _push(`<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`);
        } else if (__props.type === "error") {
          _push(`<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>`);
        } else if (__props.type === "warning") {
          _push(`<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>`);
        } else {
          _push(`<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>`);
        }
        _push(`</div><div class="flex-1 min-w-0">`);
        if (__props.title) {
          _push(`<p class="text-sm font-semibold mb-1">${ssrInterpolate(__props.title)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<p class="text-sm">${ssrInterpolate(__props.message)}</p></div><button class="shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></button></div>`);
        if (__props.duration && __props.duration > 0) {
          _push(`<div class="h-1 bg-current opacity-30 rounded-b-lg overflow-hidden"><div class="h-full bg-current transition-all ease-linear" style="${ssrRenderStyle({ width: `${progress.value}%` })}"></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/Notification.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_4 = Object.assign(_sfc_main, { __name: "UiNotification" });

export { __nuxt_component_4 as _ };
//# sourceMappingURL=Notification-Bd1V2gNg.mjs.map
