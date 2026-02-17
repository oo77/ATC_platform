import { _ as __nuxt_component_1 } from './Pagination-BWEvmW2R.mjs';
import { defineComponent, ref, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrInterpolate, ssrRenderList, ssrRenderStyle, ssrRenderComponent } from 'vue/server-renderer';
import { useRouter } from 'vue-router';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
import './Notification-CQvvdM2O.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useRouter();
    const toast = useNotification();
    const loading = ref(false);
    const books = ref([]);
    const searchQuery = ref("");
    const selectedLanguage = ref("");
    const pagination = ref({
      page: 1,
      limit: 12,
      total: 0
    });
    const fetchBooks = async () => {
      loading.value = true;
      try {
        const params = new URLSearchParams({
          page: pagination.value.page.toString(),
          limit: pagination.value.limit.toString(),
          ...searchQuery.value && { search: searchQuery.value },
          ...selectedLanguage.value && { language: selectedLanguage.value }
        });
        const response = await $fetch(
          `/api/library/catalog?${params}`
        );
        books.value = response.books;
        pagination.value.total = response.total;
      } catch (error) {
        toast.error(error.data?.message || "Ошибка загрузки каталога");
      } finally {
        loading.value = false;
      }
    };
    const handlePageChange = (page) => {
      pagination.value.page = page;
      fetchBooks();
      (void 0).scrollTo({ top: 0, behavior: "smooth" });
    };
    const getLanguageLabel = (lang) => {
      if (!lang) return "—";
      const labels = {
        ru: "🇷🇺 RU",
        uz: "🇺🇿 UZ",
        en: "🇬🇧 EN",
        kk: "🇰🇿 KK"
      };
      return labels[lang] || lang.toUpperCase();
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiPagination = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Библиотека </h2><p class="text-sm text-gray-600 dark:text-gray-400 mt-1"> Доступные вам книги для чтения </p></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="relative"><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="Поиск по названию или автору..." class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-12 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"><option value=""${ssrIncludeBooleanAttr(Array.isArray(selectedLanguage.value) ? ssrLooseContain(selectedLanguage.value, "") : ssrLooseEqual(selectedLanguage.value, "")) ? " selected" : ""}>Все языки</option><option value="ru"${ssrIncludeBooleanAttr(Array.isArray(selectedLanguage.value) ? ssrLooseContain(selectedLanguage.value, "ru") : ssrLooseEqual(selectedLanguage.value, "ru")) ? " selected" : ""}>🇷🇺 Русский</option><option value="uz"${ssrIncludeBooleanAttr(Array.isArray(selectedLanguage.value) ? ssrLooseContain(selectedLanguage.value, "uz") : ssrLooseEqual(selectedLanguage.value, "uz")) ? " selected" : ""}>🇺🇿 O&#39;zbekcha</option><option value="en"${ssrIncludeBooleanAttr(Array.isArray(selectedLanguage.value) ? ssrLooseContain(selectedLanguage.value, "en") : ssrLooseEqual(selectedLanguage.value, "en")) ? " selected" : ""}>🇬🇧 English</option><option value="kk"${ssrIncludeBooleanAttr(Array.isArray(selectedLanguage.value) ? ssrLooseContain(selectedLanguage.value, "kk") : ssrLooseEqual(selectedLanguage.value, "kk")) ? " selected" : ""}>🇰🇿 Қазақша</option></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div></div>`);
      if (loading.value) {
        _push(`<div class="flex justify-center items-center py-20"><div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div></div>`);
      } else if (books.value.length === 0) {
        _push(`<div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-12 text-center"><svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg><h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2"> Нет доступных книг </h3><p class="text-gray-600 dark:text-gray-400">${ssrInterpolate(searchQuery.value || selectedLanguage.value ? "Попробуйте изменить параметры поиска" : "У вас пока нет доступа к книгам")}</p></div>`);
      } else {
        _push(`<div class="bg-white dark:bg-boxdark rounded-xl shadow-md overflow-hidden"><div class="overflow-x-auto"><table class="w-full"><thead class="bg-gray-50 dark:bg-meta-4"><tr class="border-b border-stroke dark:border-strokedark"><th class="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Обложка </th><th class="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Название / Автор </th><th class="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Язык </th><th class="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Страницы </th><th class="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Прогресс </th></tr></thead><tbody class="divide-y divide-stroke dark:divide-strokedark"><!--[-->`);
        ssrRenderList(books.value, (book) => {
          _push(`<tr class="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors cursor-pointer"><td class="px-4 py-3"><div class="h-16 w-12 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">`);
          if (book.cover_url) {
            _push(`<img${ssrRenderAttr("src", book.cover_url)}${ssrRenderAttr("alt", book.title)} class="h-full w-full object-cover">`);
          } else {
            _push(`<div class="h-full w-full flex items-center justify-center bg-primary/10"><svg class="w-6 h-6 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg></div>`);
          }
          _push(`</div></td><td class="px-4 py-3"><div class="max-w-md"><p class="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors">${ssrInterpolate(book.title)}</p><p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${ssrInterpolate(book.author || "Автор не указан")}</p></div></td><td class="px-4 py-3"><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">${ssrInterpolate(getLanguageLabel(book.language))}</span></td><td class="px-4 py-3 text-center"><div class="flex items-center justify-center gap-1"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg><span class="text-sm text-gray-900 dark:text-white">${ssrInterpolate(book.total_pages)}</span></div></td><td class="px-4 py-3">`);
          if (book.progress && book.progress.current_page > 0) {
            _push(`<div><div class="flex items-center gap-2 mb-1"><svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path></svg><span class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(book.progress.current_page)} / ${ssrInterpolate(book.total_pages)}</span></div><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div class="bg-primary rounded-full h-2 transition-all duration-300" style="${ssrRenderStyle({
              width: `${book.progress.current_page / book.total_pages * 100}%`
            })}"></div></div></div>`);
          } else {
            _push(`<span class="text-sm text-gray-500 dark:text-gray-400"> Не начата </span>`);
          }
          _push(`</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div></div>`);
      }
      if (pagination.value.total > pagination.value.limit) {
        _push(`<div class="mt-8 flex justify-center">`);
        _push(ssrRenderComponent(_component_UiPagination, {
          "current-page": pagination.value.page,
          "total-pages": Math.ceil(pagination.value.total / pagination.value.limit),
          total: pagination.value.total,
          limit: pagination.value.limit,
          "onUpdate:page": handlePageChange,
          "onUpdate:limit": (l) => {
            pagination.value.limit = l;
            fetchBooks();
          }
        }, null, _parent));
        _push(`</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/library/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-D_Gi6TvA.mjs.map
