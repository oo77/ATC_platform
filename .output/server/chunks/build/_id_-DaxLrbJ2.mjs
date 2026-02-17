import { defineComponent, ref, watch, computed, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrInterpolate, ssrRenderAttr, ssrRenderStyle, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { useRoute, useRouter } from 'vue-router';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    useRouter();
    const loading = ref(true);
    const error = ref("");
    const book = ref(null);
    const currentPage = ref(1);
    const pageInput = ref(1);
    const currentPageImage = ref("");
    ref(null);
    const isFullscreen = ref(false);
    const showControls = ref(true);
    ref(null);
    const scale = ref(1);
    const rotation = ref(0);
    const position = ref({ x: 0, y: 0 });
    const isPanning = ref(false);
    ref({ x: 0, y: 0 });
    let saveProgressTimeout;
    const resetZoom = () => {
      scale.value = 1;
      rotation.value = 0;
      position.value = { x: 0, y: 0 };
    };
    watch(currentPage, () => {
      resetZoom();
    });
    const progressPercentage = computed(() => {
      if (!book.value) return 0;
      return Math.round(currentPage.value / book.value.total_pages * 100);
    });
    const loadPage = async (page) => {
      if (!book.value || page < 1 || page > book.value.total_pages) return;
      loading.value = true;
      error.value = "";
      try {
        const response = await fetch(
          `/api/library/reading/${route.params.id}/page/${page}`,
          {
            headers: {
              Accept: "image/png"
            }
          }
        );
        if (!response.ok) {
          throw new Error("Ошибка загрузки страницы");
        }
        const blob = await response.blob();
        currentPageImage.value = URL.createObjectURL(blob);
        saveProgress(page);
        prefetchPage(page + 1);
      } catch (err) {
        error.value = err.message || "Не удалось загрузить страницу";
        currentPageImage.value = "";
      } finally {
        loading.value = false;
      }
    };
    const prefetchPage = (page) => {
      if (!book.value || page > book.value.total_pages) return;
      const img = new Image();
      img.src = `/api/library/reading/${route.params.id}/page/${page}`;
    };
    const saveProgress = (page) => {
      clearTimeout(saveProgressTimeout);
      saveProgressTimeout = setTimeout(async () => {
        try {
          await $fetch(`/api/library/reading/${route.params.id}/progress`, {
            method: "POST",
            body: {
              lastPageRead: page
            }
          });
        } catch (error2) {
          console.error("Ошибка сохранения прогресса:", error2);
        }
      }, 1e3);
    };
    watch(currentPage, (newPage) => {
      loadPage(newPage);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 bg-gray-900 flex flex-col" }, _attrs))} data-v-87c2531d><div class="${ssrRenderClass([{ "opacity-0 pointer-events-none": isFullscreen.value }, "flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 z-10"])}" data-v-87c2531d><div class="flex items-center gap-4" data-v-87c2531d><button class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" title="Назад к каталогу" data-v-87c2531d><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87c2531d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" data-v-87c2531d></path></svg></button><div class="min-w-0" data-v-87c2531d><h1 class="text-white font-semibold truncate" data-v-87c2531d>${ssrInterpolate(book.value?.title)}</h1><p class="text-sm text-gray-400 truncate" data-v-87c2531d>${ssrInterpolate(book.value?.author)}</p></div></div><div class="flex items-center gap-2" data-v-87c2531d><button class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"${ssrRenderAttr(
        "title",
        isFullscreen.value ? "Выйти из полноэкранного режима" : "Полноэкранный режим"
      )} data-v-87c2531d>`);
      if (!isFullscreen.value) {
        _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87c2531d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" data-v-87c2531d></path></svg>`);
      } else {
        _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87c2531d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-87c2531d></path></svg>`);
      }
      _push(`</button></div></div><div class="flex-1 flex items-center justify-center overflow-hidden relative bg-gray-900" data-v-87c2531d>`);
      if (loading.value) {
        _push(`<div class="absolute inset-0 flex items-center justify-center z-20" data-v-87c2531d><div class="text-center bg-gray-800/80 p-6 rounded-xl backdrop-blur-sm" data-v-87c2531d><div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4" data-v-87c2531d></div><p class="text-gray-400" data-v-87c2531d>Загрузка страницы...</p></div></div>`);
      } else if (currentPageImage.value) {
        _push(`<div class="relative flex items-center justify-center transition-transform duration-100 ease-out origin-center" style="${ssrRenderStyle({
          transform: `scale(${scale.value}) translate(${position.value.x}px, ${position.value.y}px) rotate(${rotation.value}deg)`,
          cursor: isPanning.value ? "grabbing" : scale.value > 1 ? "grab" : "default"
        })}" data-v-87c2531d><img${ssrRenderAttr("src", currentPageImage.value)} draggable="false"${ssrRenderAttr("alt", `Страница ${currentPage.value}`)} class="${ssrRenderClass([{ "max-h-screen": isFullscreen.value }, "max-w-full max-h-[85vh] object-contain shadow-2xl select-none"])}" data-v-87c2531d></div>`);
      } else if (error.value) {
        _push(`<div class="absolute inset-0 flex items-center justify-center bg-gray-900 z-20" data-v-87c2531d><div class="text-center max-w-md px-4" data-v-87c2531d><svg class="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87c2531d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-87c2531d></path></svg><h3 class="text-xl font-semibold text-white mb-2" data-v-87c2531d>Ошибка загрузки</h3><p class="text-gray-400 mb-4" data-v-87c2531d>${ssrInterpolate(error.value)}</p><button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors" data-v-87c2531d> Повторить попытку </button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!loading.value && currentPageImage.value) {
        _push(`<div class="absolute bottom-6 right-6 flex flex-col gap-2 z-10" data-v-87c2531d><button class="p-2 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-colors" title="Повернуть влево" data-v-87c2531d><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87c2531d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" data-v-87c2531d></path></svg></button><button class="p-2 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-colors" title="Повернуть вправо" data-v-87c2531d><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87c2531d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" data-v-87c2531d></path></svg></button><div class="h-px bg-gray-600 my-1" data-v-87c2531d></div><button class="p-2 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-colors" title="Увеличить" data-v-87c2531d><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87c2531d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" data-v-87c2531d></path></svg></button><button class="p-2 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-colors text-sm font-bold w-10 h-10 flex items-center justify-center" title="Сбросить масштаб" data-v-87c2531d>${ssrInterpolate(Math.round(scale.value * 100))}% </button><button class="p-2 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-colors" title="Уменьшить" data-v-87c2531d><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87c2531d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" data-v-87c2531d></path></svg></button></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!loading.value && currentPageImage.value) {
        _push(`<div class="${ssrRenderClass([{ "opacity-0": !showControls.value && !isFullscreen.value }, "absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-4 pointer-events-none z-10"])}" data-v-87c2531d><button${ssrIncludeBooleanAttr(currentPage.value <= 1) ? " disabled" : ""} class="p-3 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all pointer-events-auto backdrop-blur-sm shadow-lg" title="Предыдущая страница" data-v-87c2531d><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87c2531d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-v-87c2531d></path></svg></button><button${ssrIncludeBooleanAttr(currentPage.value >= (book.value?.total_pages || 0)) ? " disabled" : ""} class="p-3 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all pointer-events-auto backdrop-blur-sm shadow-lg" title="Следующая страница" data-v-87c2531d><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87c2531d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-87c2531d></path></svg></button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (!loading.value && book.value) {
        _push(`<div class="${ssrRenderClass([{
          "opacity-0 pointer-events-none": isFullscreen.value && !showControls.value
        }, "px-4 py-3 bg-gray-800 border-t border-gray-700 z-10"])}" data-v-87c2531d><div class="mb-3" data-v-87c2531d><div class="flex items-center justify-between text-sm text-gray-400 mb-2" data-v-87c2531d><span data-v-87c2531d>Страница ${ssrInterpolate(currentPage.value)} из ${ssrInterpolate(book.value.total_pages)}</span><span data-v-87c2531d>${ssrInterpolate(progressPercentage.value)}%</span></div><div class="relative" data-v-87c2531d><input type="range"${ssrRenderAttr("min", 1)}${ssrRenderAttr("max", book.value.total_pages)}${ssrRenderAttr("value", currentPage.value)} class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider" data-v-87c2531d></div></div><div class="flex items-center justify-center gap-2" data-v-87c2531d><button${ssrIncludeBooleanAttr(currentPage.value <= 1) ? " disabled" : ""} class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2" data-v-87c2531d><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87c2531d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-v-87c2531d></path></svg> Назад </button><div class="flex items-center gap-2 px-4" data-v-87c2531d><input type="number"${ssrRenderAttr("min", 1)}${ssrRenderAttr("max", book.value.total_pages)}${ssrRenderAttr("value", pageInput.value)} class="w-20 px-3 py-2 bg-gray-700 text-white text-center rounded-lg border border-gray-600 focus:border-primary outline-none" data-v-87c2531d><button class="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors" data-v-87c2531d> Перейти </button></div><button${ssrIncludeBooleanAttr(currentPage.value >= book.value.total_pages) ? " disabled" : ""} class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2" data-v-87c2531d> Вперед <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87c2531d><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-87c2531d></path></svg></button></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/library/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _id_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-87c2531d"]]);

export { _id_ as default };
//# sourceMappingURL=_id_-DaxLrbJ2.mjs.map
