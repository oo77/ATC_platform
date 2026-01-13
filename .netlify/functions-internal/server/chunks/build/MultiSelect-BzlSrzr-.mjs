import { defineComponent, ref, computed, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "MultiSelect",
  __ssrInlineRender: true,
  props: {
    modelValue: {},
    options: {},
    label: {},
    placeholder: { default: "Выберите элементы..." },
    hint: {},
    searchable: { type: Boolean, default: true },
    required: { type: Boolean, default: false }
  },
  emits: ["update:modelValue"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const containerRef = ref(null);
    const isOpen = ref(false);
    const searchQuery = ref("");
    const selectedItems = computed(() => {
      const value = props.modelValue || [];
      return props.options.filter((option) => value.includes(option.id));
    });
    const filteredOptions = computed(() => {
      if (!searchQuery.value) {
        return props.options;
      }
      const query = searchQuery.value.toLowerCase();
      return props.options.filter(
        (option) => option.label.toLowerCase().includes(query) || option.description?.toLowerCase().includes(query)
      );
    });
    const isSelected = (id) => {
      return (props.modelValue || []).includes(id);
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "relative",
        ref_key: "containerRef",
        ref: containerRef
      }, _attrs))}>`);
      if (__props.label) {
        _push(`<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${ssrInterpolate(__props.label)} `);
        if (__props.required) {
          _push(`<span class="text-danger">*</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</label>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="${ssrRenderClass([{ "border-primary": isOpen.value }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary cursor-pointer transition-colors"])}"><div class="flex items-center justify-between"><div class="flex-1 min-w-0">`);
      if (selectedItems.value.length === 0) {
        _push(`<div class="text-gray-400">${ssrInterpolate(__props.placeholder)}</div>`);
      } else {
        _push(`<div class="flex flex-wrap gap-2"><!--[-->`);
        ssrRenderList(selectedItems.value, (item) => {
          _push(`<span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">${ssrInterpolate(item.label)} <button class="hover:text-primary/80 transition-colors" type="button"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></span>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><svg class="${ssrRenderClass([{ "rotate-180": isOpen.value }, "w-5 h-5 text-gray-400 transition-transform ml-2 shrink-0"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div>`);
      if (isOpen.value) {
        _push(`<div class="absolute z-50 mt-2 w-full rounded-lg border border-stroke bg-white dark:bg-boxdark dark:border-strokedark shadow-lg max-h-60 overflow-auto">`);
        if (__props.searchable) {
          _push(`<div class="p-3 border-b border-stroke dark:border-strokedark sticky top-0 bg-white dark:bg-boxdark"><div class="relative"><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="Поиск..." class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="py-2">`);
        if (filteredOptions.value.length === 0) {
          _push(`<div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"> Ничего не найдено </div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(filteredOptions.value, (option) => {
          _push(`<label class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-meta-4 cursor-pointer transition-colors"><input type="checkbox"${ssrIncludeBooleanAttr(isSelected(option.id)) ? " checked" : ""} class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"><span class="text-sm text-gray-900 dark:text-white flex-1">${ssrInterpolate(option.label)}</span>`);
          if (option.description) {
            _push(`<span class="text-xs text-gray-500 dark:text-gray-400">${ssrInterpolate(option.description)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</label>`);
        });
        _push(`<!--]--></div>`);
        if (selectedItems.value.length > 0) {
          _push(`<div class="border-t border-stroke dark:border-strokedark p-3 bg-gray-50 dark:bg-meta-4"><div class="flex items-center justify-between text-sm"><span class="text-gray-600 dark:text-gray-400"> Выбрано: ${ssrInterpolate(selectedItems.value.length)}</span><button type="button" class="text-danger hover:text-danger/80 transition-colors font-medium"> Очистить все </button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.hint) {
        _push(`<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">${ssrInterpolate(__props.hint)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/MultiSelect.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main, { __name: "UiMultiSelect" });

export { __nuxt_component_1 as _ };
//# sourceMappingURL=MultiSelect-BzlSrzr-.mjs.map
