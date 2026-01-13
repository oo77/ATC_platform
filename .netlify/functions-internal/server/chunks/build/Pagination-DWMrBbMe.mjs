import { defineComponent, computed, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderList, ssrRenderAttr } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "Pagination",
  __ssrInlineRender: true,
  props: {
    currentPage: {},
    totalPages: {},
    total: {},
    limit: {},
    loading: { type: Boolean, default: false },
    limitOptions: { default: () => [10, 25, 50, 100] }
  },
  emits: ["update:page", "update:limit"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const from = computed(() => {
      if (props.total === 0) return 0;
      return (props.currentPage - 1) * props.limit + 1;
    });
    const to = computed(() => {
      return Math.min(props.currentPage * props.limit, props.total);
    });
    const visiblePages = computed(() => {
      const pages = [];
      const total = props.totalPages;
      const current = props.currentPage;
      const delta = 2;
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        if (current > delta + 2) {
          pages.push("...");
        }
        for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
          pages.push(i);
        }
        if (current < total - delta - 1) {
          pages.push("...");
        }
        pages.push(total);
      }
      return pages;
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-stroke dark:border-strokedark" }, _attrs))}><div class="text-sm text-gray-600 dark:text-gray-400"> Показано <span class="font-medium text-black dark:text-white">${ssrInterpolate(from.value)}</span> — <span class="font-medium text-black dark:text-white">${ssrInterpolate(to.value)}</span> из <span class="font-medium text-black dark:text-white">${ssrInterpolate(__props.total)}</span> записей </div><div class="flex items-center gap-2"><button${ssrIncludeBooleanAttr(__props.currentPage === 1 || __props.loading) ? " disabled" : ""} class="${ssrRenderClass([[
        __props.currentPage === 1 ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4"
      ], "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"])}" title="Первая страница"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg></button><button${ssrIncludeBooleanAttr(__props.currentPage === 1 || __props.loading) ? " disabled" : ""} class="${ssrRenderClass([[
        __props.currentPage === 1 ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4"
      ], "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"])}" title="Предыдущая страница"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button><div class="flex items-center gap-1"><!--[-->`);
      ssrRenderList(visiblePages.value, (page) => {
        _push(`<!--[-->`);
        if (page !== "...") {
          _push(`<button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="${ssrRenderClass([[
            __props.currentPage === page ? "bg-primary text-white shadow-md" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4"
          ], "min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200"])}">${ssrInterpolate(page)}</button>`);
        } else {
          _push(`<span class="min-w-[40px] h-10 px-3 flex items-center justify-center text-gray-400 dark:text-gray-600"> ⋯ </span>`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--></div><button${ssrIncludeBooleanAttr(__props.currentPage === __props.totalPages || __props.loading) ? " disabled" : ""} class="${ssrRenderClass([[
        __props.currentPage === __props.totalPages ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4"
      ], "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"])}" title="Следующая страница"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button><button${ssrIncludeBooleanAttr(__props.currentPage === __props.totalPages || __props.loading) ? " disabled" : ""} class="${ssrRenderClass([[
        __props.currentPage === __props.totalPages ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4"
      ], "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"])}" title="Последняя страница"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg></button></div><div class="flex items-center gap-2"><label class="text-sm text-gray-600 dark:text-gray-400"> На странице: </label><select${ssrRenderAttr("value", __props.limit)}${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="rounded-lg border border-stroke bg-transparent py-2 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><!--[-->`);
      ssrRenderList(__props.limitOptions, (option) => {
        _push(`<option${ssrRenderAttr("value", option)}>${ssrInterpolate(option)}</option>`);
      });
      _push(`<!--]--></select></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/Pagination.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main, { __name: "UiPagination" });

export { __nuxt_component_0 as _ };
//# sourceMappingURL=Pagination-DWMrBbMe.mjs.map
