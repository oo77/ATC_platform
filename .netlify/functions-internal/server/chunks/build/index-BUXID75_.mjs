import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_0$1 } from './Modal-DQYphXo7.mjs';
import { _ as __nuxt_component_3 } from './ConfirmModal-GQ4JU241.mjs';
import { _ as __nuxt_component_4 } from './Notification-Bd1V2gNg.mjs';
import { ref, computed, mergeProps, withCtx, createTextVNode, unref, createBlock, openBlock, createVNode, toDisplayString, withModifiers, withDirectives, createCommentVNode, vModelText, Fragment, renderList, vModelSelect, vModelCheckbox, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { u as usePermissions } from './usePermissions-C-v7fTov.mjs';
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
import './server.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const { authFetch } = useAuthFetch();
    const { canManageTestTemplates } = usePermissions();
    const canManageTemplates = canManageTestTemplates;
    const loading = ref(false);
    const saving = ref(false);
    const deleting = ref(false);
    const templates = ref([]);
    const banks = ref([]);
    const pagination = ref({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });
    const filters = ref({
      search: "",
      bankId: "",
      isActive: void 0
    });
    const stats = computed(() => ({
      active: templates.value.filter((t) => t.is_active).length,
      withTimeLimit: templates.value.filter((t) => t.time_limit_minutes > 0).length
    }));
    const hasActiveFilters = computed(() => {
      return filters.value.search !== "" || filters.value.bankId !== "" || filters.value.isActive !== void 0;
    });
    const modalOpen = ref(false);
    const deleteModalOpen = ref(false);
    const editingTemplate = ref(null);
    const deletingTemplate = ref(null);
    const availableLanguages = [
      { value: "ru", label: "Русский", flag: "🇷🇺" },
      { value: "uz", label: "O'zbek", flag: "🇺🇿" },
      { value: "en", label: "English", flag: "🇬🇧" }
    ];
    const languageLabels = {
      ru: "Русский",
      uz: "O'zbek",
      en: "English"
    };
    const languageFlags = {
      ru: "🇷🇺",
      uz: "🇺🇿",
      en: "🇬🇧"
    };
    const languageBadgeClasses = {
      ru: "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30",
      uz: "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-green-100 dark:bg-green-900/30",
      en: "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30"
    };
    const languageValidationLoading = ref(false);
    const languageValidation = ref([]);
    const hasInvalidLanguages = computed(() => {
      return languageValidation.value.some((v) => !v.isValid);
    });
    const getDefaultForm = () => ({
      name: "",
      code: "",
      bank_id: "",
      description: "",
      questions_mode: "all",
      questions_count: 20,
      time_limit_minutes: 30,
      passing_score: 60,
      max_attempts: 1,
      shuffle_questions: true,
      shuffle_options: true,
      questions_per_page: 1,
      show_results: "immediately",
      allow_back: true,
      proctoring_enabled: false,
      proctoring_settings: {
        blockTabSwitch: true,
        blockCopyPaste: false,
        blockRightClick: false
      },
      allowed_languages: ["ru"],
      is_active: true
    });
    const form = ref(getDefaultForm());
    const formErrors = ref({
      name: "",
      code: "",
      bank_id: "",
      allowed_languages: ""
    });
    const notification = ref({
      show: false,
      type: "success",
      title: "",
      message: ""
    });
    const getQuestionsLabel = (template) => {
      if (template.questions_mode === "all") {
        return `Все (${template.questions_total || "?"})`;
      }
      return `${template.questions_count || "?"} случ.`;
    };
    const loadTemplates = async () => {
      loading.value = true;
      try {
        const params = new URLSearchParams({
          page: pagination.value.page.toString(),
          limit: pagination.value.limit.toString()
        });
        if (filters.value.search) {
          params.append("search", filters.value.search);
        }
        if (filters.value.bankId) {
          params.append("bank_id", filters.value.bankId);
        }
        if (filters.value.isActive !== void 0) {
          params.append("is_active", filters.value.isActive.toString());
        }
        const response = await authFetch(`/api/test-bank/templates?${params.toString()}`);
        if (response.success) {
          templates.value = response.templates;
          pagination.value.total = response.total;
          pagination.value.totalPages = response.totalPages;
        }
      } catch (error) {
        console.error("Ошибка загрузки шаблонов:", error);
        showNotification("error", "Ошибка", "Не удалось загрузить шаблоны");
      } finally {
        loading.value = false;
      }
    };
    const openCreateModal = () => {
      editingTemplate.value = null;
      form.value = getDefaultForm();
      formErrors.value = { name: "", code: "", bank_id: "", allowed_languages: "" };
      languageValidation.value = [];
      modalOpen.value = true;
    };
    const closeModal = () => {
      modalOpen.value = false;
      editingTemplate.value = null;
    };
    const validateLanguages = async () => {
      if (!form.value.bank_id || form.value.allowed_languages.length === 0) {
        languageValidation.value = [];
        return;
      }
      languageValidationLoading.value = true;
      try {
        const minCount = form.value.questions_mode === "random" ? form.value.questions_count : 1;
        const languages = form.value.allowed_languages.join(",");
        const response = await authFetch(
          `/api/test-bank/banks/${form.value.bank_id}/validate-languages?min_count=${minCount}&languages=${languages}`
        );
        if (response.success) {
          languageValidation.value = response.validation;
        }
      } catch (error) {
        console.error("Ошибка валидации языков:", error);
      } finally {
        languageValidationLoading.value = false;
      }
    };
    const onLanguageChange = () => {
      if (form.value.bank_id && form.value.questions_mode === "random") {
        validateLanguages();
      }
    };
    const validateForm = () => {
      formErrors.value = { name: "", code: "", bank_id: "", allowed_languages: "" };
      let isValid = true;
      if (!form.value.name.trim()) {
        formErrors.value.name = "Название обязательно";
        isValid = false;
      }
      if (!form.value.code.trim()) {
        formErrors.value.code = "Код обязателен";
        isValid = false;
      }
      if (!form.value.bank_id) {
        formErrors.value.bank_id = "Выберите банк вопросов";
        isValid = false;
      }
      if (form.value.allowed_languages.length === 0) {
        formErrors.value.allowed_languages = "Выберите хотя бы один язык";
        isValid = false;
      }
      if (form.value.questions_mode === "random" && hasInvalidLanguages.value) {
        formErrors.value.allowed_languages = "Недостаточно вопросов на выбранных языках";
        isValid = false;
      }
      return isValid;
    };
    const saveTemplate = async () => {
      if (!validateForm()) return;
      saving.value = true;
      try {
        const payload = {
          ...form.value,
          code: form.value.code.trim().toUpperCase(),
          time_limit_minutes: form.value.time_limit_minutes || null,
          proctoring_settings: form.value.proctoring_enabled ? form.value.proctoring_settings : null,
          allowed_languages: form.value.allowed_languages
        };
        let response;
        if (editingTemplate.value) {
          response = await authFetch(`/api/test-bank/templates/${editingTemplate.value.id}`, {
            method: "PUT",
            body: payload
          });
        } else {
          response = await authFetch("/api/test-bank/templates", {
            method: "POST",
            body: payload
          });
        }
        if (response.success) {
          showNotification("success", "Успешно", editingTemplate.value ? "Шаблон обновлён" : "Шаблон создан");
          closeModal();
          loadTemplates();
        } else {
          showNotification("error", "Ошибка", response.message || "Не удалось сохранить");
        }
      } catch (error) {
        console.error("Ошибка сохранения:", error);
        showNotification("error", "Ошибка", "Произошла ошибка при сохранении");
      } finally {
        saving.value = false;
      }
    };
    const deleteTemplate = async () => {
      if (!deletingTemplate.value) return;
      deleting.value = true;
      try {
        const response = await authFetch(`/api/test-bank/templates/${deletingTemplate.value.id}`, {
          method: "DELETE"
        });
        if (response.success) {
          showNotification("success", "Успешно", "Шаблон удалён");
          deleteModalOpen.value = false;
          deletingTemplate.value = null;
          loadTemplates();
        } else {
          showNotification("error", "Ошибка", response.message || "Не удалось удалить");
        }
      } catch (error) {
        console.error("Ошибка удаления:", error);
        showNotification("error", "Ошибка", "Произошла ошибка при удалении");
      } finally {
        deleting.value = false;
      }
    };
    const showNotification = (type, title, message) => {
      notification.value = { show: true, type, title, message };
      setTimeout(() => {
        notification.value.show = false;
      }, 5e3);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiConfirmModal = __nuxt_component_3;
      const _component_UiNotification = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><nav class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/test-bank",
        class: "hover:text-primary transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Банк тестов `);
          } else {
            return [
              createTextVNode(" Банк тестов ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg><span class="text-black dark:text-white">Шаблоны тестов</span></nav><h2 class="text-title-md2 font-bold text-black dark:text-white"> Шаблоны тестов </h2><p class="text-sm text-gray-600 dark:text-gray-400 mt-1"> Готовые конфигурации тестов для использования в учебном процессе </p></div>`);
      if (unref(canManageTemplates)) {
        _push(ssrRenderComponent(_component_UiButton, {
          onClick: openCreateModal,
          class: "flex items-center gap-2"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Создать шаблон `);
            } else {
              return [
                (openBlock(), createBlock("svg", {
                  class: "w-5 h-5",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M12 4v16m8-8H4"
                  })
                ])),
                createTextVNode(" Создать шаблон ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6"><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Всего шаблонов</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(pagination.value.total)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"><svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Активных</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.active)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10"><svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">С лимитом времени</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.withTimeLimit)}</p></div></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6"><div class="flex items-center gap-3 mb-4"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg></div><h4 class="text-lg font-semibold text-black dark:text-white">Фильтры</h4>`);
      if (hasActiveFilters.value) {
        _push(`<button class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Сбросить </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Поиск </label><div class="relative"><input${ssrRenderAttr("value", filters.value.search)} type="text" placeholder="Название, код..." class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Банк вопросов </label><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.value.bankId) ? ssrLooseContain(filters.value.bankId, "") : ssrLooseEqual(filters.value.bankId, "")) ? " selected" : ""}>Все банки</option><!--[-->`);
      ssrRenderList(banks.value, (bank) => {
        _push(`<option${ssrRenderAttr("value", bank.id)}${ssrIncludeBooleanAttr(Array.isArray(filters.value.bankId) ? ssrLooseContain(filters.value.bankId, bank.id) : ssrLooseEqual(filters.value.bankId, bank.id)) ? " selected" : ""}>${ssrInterpolate(bank.name)}</option>`);
      });
      _push(`<!--]--></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Статус </label><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"><option${ssrRenderAttr("value", void 0)}${ssrIncludeBooleanAttr(Array.isArray(filters.value.isActive) ? ssrLooseContain(filters.value.isActive, void 0) : ssrLooseEqual(filters.value.isActive, void 0)) ? " selected" : ""}>Все</option><option${ssrRenderAttr("value", true)}${ssrIncludeBooleanAttr(Array.isArray(filters.value.isActive) ? ssrLooseContain(filters.value.isActive, true) : ssrLooseEqual(filters.value.isActive, true)) ? " selected" : ""}>Активные</option><option${ssrRenderAttr("value", false)}${ssrIncludeBooleanAttr(Array.isArray(filters.value.isActive) ? ssrLooseContain(filters.value.isActive, false) : ssrLooseEqual(filters.value.isActive, false)) ? " selected" : ""}>Неактивные</option></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">`);
      if (loading.value) {
        _push(`<div class="p-12 text-center"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div><p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка шаблонов...</p></div>`);
      } else if (templates.value.length === 0) {
        _push(`<div class="p-12 text-center text-gray-500 dark:text-gray-400"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><p class="mt-4 text-lg font-medium">Шаблоны не найдены</p><p class="mt-2">Создайте первый шаблон теста</p></div>`);
      } else {
        _push(`<div class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
        ssrRenderList(templates.value, (template) => {
          _push(`<div class="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><div class="flex flex-col md:flex-row md:items-center gap-4"><div class="flex items-start gap-4 flex-grow"><div class="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div class="flex-grow min-w-0"><div class="flex items-center gap-3 flex-wrap"><h3 class="font-semibold text-gray-900 dark:text-white">${ssrInterpolate(template.name)}</h3><span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">${ssrInterpolate(template.code)}</span><span class="${ssrRenderClass([
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            template.is_active ? "bg-success/10 text-success" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          ])}">${ssrInterpolate(template.is_active ? "Активен" : "Неактивен")}</span></div>`);
          if (template.description) {
            _push(`<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-1">${ssrInterpolate(template.description)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="flex flex-wrap items-center gap-2 mt-2"><span class="text-sm text-gray-500 dark:text-gray-400"> Банк: `);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/test-bank/${template.bank_id}`,
            class: "text-primary hover:underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(template.bank_name)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(template.bank_name), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</span>`);
          if (template.allowed_languages && template.allowed_languages.length > 0) {
            _push(`<div class="flex items-center gap-1 ml-2"><!--[-->`);
            ssrRenderList(template.allowed_languages, (lang) => {
              _push(`<span class="${ssrRenderClass(languageBadgeClasses[lang])}"${ssrRenderAttr("title", languageLabels[lang])}>${ssrInterpolate(languageFlags[lang])}</span>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400" title="Все языки доступны"> 🌐 Все </span>`);
          }
          _push(`</div></div></div><div class="flex flex-wrap items-center gap-3 md:gap-4"><div class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>${ssrInterpolate(getQuestionsLabel(template))}</span></div><div class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>${ssrInterpolate(template.time_limit_minutes ? `${template.time_limit_minutes} мин` : "Без лимита")}</span></div><div class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>${ssrInterpolate(template.passing_score)}%</span></div><div class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg><span>${ssrInterpolate(template.max_attempts === 1 ? "1 попытка" : `${template.max_attempts} попыток`)}</span></div><div class="flex items-center gap-1 ml-auto md:ml-0"><button class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Настроить"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></button>`);
          if (unref(canManageTemplates)) {
            _push(`<button class="p-2 text-gray-500 hover:text-warning hover:bg-warning/10 rounded-lg transition-colors" title="Редактировать"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(canManageTemplates)) {
            _push(`<button class="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Удалить"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      if (pagination.value.totalPages > 1) {
        _push(`<div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4"><div class="flex items-center justify-between"><div class="text-sm text-gray-700 dark:text-gray-300"> Показано <span class="font-medium">${ssrInterpolate((pagination.value.page - 1) * pagination.value.limit + 1)}</span> - <span class="font-medium">${ssrInterpolate(Math.min(pagination.value.page * pagination.value.limit, pagination.value.total))}</span> из <span class="font-medium">${ssrInterpolate(pagination.value.total)}</span> шаблонов </div><div class="flex gap-2"><button${ssrIncludeBooleanAttr(pagination.value.page === 1) ? " disabled" : ""} class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"> Назад </button><button${ssrIncludeBooleanAttr(pagination.value.page >= pagination.value.totalPages) ? " disabled" : ""} class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"> Вперёд </button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": modalOpen.value,
        title: editingTemplate.value ? "Редактировать шаблон" : "Создать шаблон теста",
        size: "lg",
        onClose: closeModal
      }, {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: closeModal
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Отмена `);
                } else {
                  return [
                    createTextVNode(" Отмена ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UiButton, {
              loading: saving.value,
              onClick: saveTemplate
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`${ssrInterpolate(editingTemplate.value ? "Сохранить" : "Создать")}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(editingTemplate.value ? "Сохранить" : "Создать"), 1)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-end gap-3" }, [
                createVNode(_component_UiButton, {
                  variant: "outline",
                  onClick: closeModal
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Отмена ")
                  ]),
                  _: 1
                }),
                createVNode(_component_UiButton, {
                  loading: saving.value,
                  onClick: saveTemplate
                }, {
                  default: withCtx(() => [
                    createTextVNode(toDisplayString(editingTemplate.value ? "Сохранить" : "Создать"), 1)
                  ]),
                  _: 1
                }, 8, ["loading"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-5"${_scopeId}><div class="grid grid-cols-1 md:grid-cols-2 gap-4"${_scopeId}><div class="md:col-span-2"${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Название <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", form.value.name)} type="text" placeholder="Например: Тест по охране труда (базовый)" class="${ssrRenderClass([{ "border-danger": formErrors.value.name }, "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"])}"${_scopeId}>`);
            if (formErrors.value.name) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(formErrors.value.name)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Код <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", form.value.code)} type="text" placeholder="OT-TEST-BASE" class="${ssrRenderClass([{ "border-danger": formErrors.value.code }, "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary uppercase"])}"${_scopeId}>`);
            if (formErrors.value.code) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(formErrors.value.code)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Банк вопросов <span class="text-danger"${_scopeId}>*</span></label><div class="relative"${_scopeId}><select class="${ssrRenderClass([{ "border-danger": formErrors.value.bank_id }, "w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"])}"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(form.value.bank_id) ? ssrLooseContain(form.value.bank_id, "") : ssrLooseEqual(form.value.bank_id, "")) ? " selected" : ""}${_scopeId}>Выберите банк</option><!--[-->`);
            ssrRenderList(banks.value, (bank) => {
              _push2(`<option${ssrRenderAttr("value", bank.id)}${ssrIncludeBooleanAttr(Array.isArray(form.value.bank_id) ? ssrLooseContain(form.value.bank_id, bank.id) : ssrLooseEqual(form.value.bank_id, bank.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(bank.name)} (${ssrInterpolate(bank.questions_count)} вопросов) </option>`);
            });
            _push2(`<!--]--></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div>`);
            if (formErrors.value.bank_id) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(formErrors.value.bank_id)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Описание </label><textarea rows="2" placeholder="Краткое описание теста..." class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"${_scopeId}>${ssrInterpolate(form.value.description)}</textarea></div><div class="border-t border-gray-200 dark:border-gray-700 pt-5"${_scopeId}><h4 class="font-medium text-gray-900 dark:text-white mb-4"${_scopeId}>Настройки вопросов</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Режим выбора вопросов </label><div class="relative"${_scopeId}><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"${_scopeId}><option value="all"${ssrIncludeBooleanAttr(Array.isArray(form.value.questions_mode) ? ssrLooseContain(form.value.questions_mode, "all") : ssrLooseEqual(form.value.questions_mode, "all")) ? " selected" : ""}${_scopeId}>Все вопросы из банка</option><option value="random"${ssrIncludeBooleanAttr(Array.isArray(form.value.questions_mode) ? ssrLooseContain(form.value.questions_mode, "random") : ssrLooseEqual(form.value.questions_mode, "random")) ? " selected" : ""}${_scopeId}>Случайные N вопросов</option></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div>`);
            if (form.value.questions_mode === "random") {
              _push2(`<div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Количество вопросов </label><input${ssrRenderAttr("value", form.value.questions_count)} type="number" min="1" max="100" class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="grid grid-cols-2 gap-4 mt-4"${_scopeId}><label class="flex items-center gap-3 cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(form.value.shuffle_questions) ? ssrLooseContain(form.value.shuffle_questions, null) : form.value.shuffle_questions) ? " checked" : ""} type="checkbox" class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"${_scopeId}><span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}>Перемешивать вопросы</span></label><label class="flex items-center gap-3 cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(form.value.shuffle_options) ? ssrLooseContain(form.value.shuffle_options, null) : form.value.shuffle_options) ? " checked" : ""} type="checkbox" class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"${_scopeId}><span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}>Перемешивать варианты</span></label></div></div><div class="border-t border-gray-200 dark:border-gray-700 pt-5"${_scopeId}><h4 class="font-medium text-gray-900 dark:text-white mb-4"${_scopeId}>Языки тестирования</h4><div class="mb-4"${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Доступные языки <span class="text-danger"${_scopeId}>*</span></label><div class="flex flex-wrap gap-3"${_scopeId}><!--[-->`);
            ssrRenderList(availableLanguages, (lang) => {
              _push2(`<label class="${ssrRenderClass([[
                form.value.allowed_languages.includes(lang.value) ? "border-primary bg-primary/5" : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
              ], "flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-all"])}"${_scopeId}><input type="checkbox"${ssrRenderAttr("value", lang.value)}${ssrIncludeBooleanAttr(Array.isArray(form.value.allowed_languages) ? ssrLooseContain(form.value.allowed_languages, lang.value) : form.value.allowed_languages) ? " checked" : ""} class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"${_scopeId}><span class="text-lg"${_scopeId}>${ssrInterpolate(lang.flag)}</span><span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(lang.label)}</span></label>`);
            });
            _push2(`<!--]--></div>`);
            if (formErrors.value.allowed_languages) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(formErrors.value.allowed_languages)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (form.value.bank_id && form.value.allowed_languages.length > 0 && form.value.questions_mode === "random") {
              _push2(`<div class="space-y-2"${_scopeId}><p class="text-sm text-gray-600 dark:text-gray-400 mb-2"${_scopeId}>Достаточность вопросов (минимум ${ssrInterpolate(form.value.questions_count)} на каждом языке):</p>`);
              if (languageValidationLoading.value) {
                _push2(`<div class="flex items-center gap-2 text-sm text-gray-500"${_scopeId}><div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"${_scopeId}></div> Проверка... </div>`);
              } else {
                _push2(`<div class="space-y-2"${_scopeId}><!--[-->`);
                ssrRenderList(languageValidation.value, (validation) => {
                  _push2(`<div class="${ssrRenderClass([validation.isValid ? "bg-success/10" : "bg-danger/10", "flex items-center justify-between p-2 rounded-lg"])}"${_scopeId}><div class="flex items-center gap-2"${_scopeId}><span${_scopeId}>${ssrInterpolate(validation.flag)}</span><span class="${ssrRenderClass([validation.isValid ? "text-success" : "text-danger", "text-sm font-medium"])}"${_scopeId}>${ssrInterpolate(validation.label)}</span></div><div class="flex items-center gap-2"${_scopeId}><span class="${ssrRenderClass([validation.isValid ? "text-success" : "text-danger", "text-sm"])}"${_scopeId}>${ssrInterpolate(validation.available)} / ${ssrInterpolate(validation.required)}</span>`);
                  if (validation.isValid) {
                    _push2(`<svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg>`);
                  }
                  _push2(`</div></div>`);
                });
                _push2(`<!--]--></div>`);
              }
              if (hasInvalidLanguages.value) {
                _push2(`<p class="text-sm text-danger mt-2"${_scopeId}> ⚠️ Недостаточно вопросов на некоторых языках. Добавьте вопросы или уменьшите количество. </p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="border-t border-gray-200 dark:border-gray-700 pt-5"${_scopeId}><h4 class="font-medium text-gray-900 dark:text-white mb-4"${_scopeId}>Настройки прохождения</h4><div class="grid grid-cols-1 md:grid-cols-3 gap-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Лимит времени (мин) </label><input${ssrRenderAttr("value", form.value.time_limit_minutes)} type="number" min="0" max="300" placeholder="Без лимита" class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}><p class="mt-1 text-xs text-gray-500"${_scopeId}>0 = без лимита</p></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Проходной балл (%) </label><input${ssrRenderAttr("value", form.value.passing_score)} type="number" min="1" max="100" class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Макс. попыток </label><input${ssrRenderAttr("value", form.value.max_attempts)} type="number" min="1" max="10" class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Показ результатов </label><div class="relative"${_scopeId}><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"${_scopeId}><option value="immediately"${ssrIncludeBooleanAttr(Array.isArray(form.value.show_results) ? ssrLooseContain(form.value.show_results, "immediately") : ssrLooseEqual(form.value.show_results, "immediately")) ? " selected" : ""}${_scopeId}>Сразу после завершения</option><option value="after_deadline"${ssrIncludeBooleanAttr(Array.isArray(form.value.show_results) ? ssrLooseContain(form.value.show_results, "after_deadline") : ssrLooseEqual(form.value.show_results, "after_deadline")) ? " selected" : ""}${_scopeId}>После дедлайна</option><option value="manual"${ssrIncludeBooleanAttr(Array.isArray(form.value.show_results) ? ssrLooseContain(form.value.show_results, "manual") : ssrLooseEqual(form.value.show_results, "manual")) ? " selected" : ""}${_scopeId}>Вручную преподавателем</option><option value="never"${ssrIncludeBooleanAttr(Array.isArray(form.value.show_results) ? ssrLooseContain(form.value.show_results, "never") : ssrLooseEqual(form.value.show_results, "never")) ? " selected" : ""}${_scopeId}>Не показывать</option></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Вопросов на странице </label><div class="relative"${_scopeId}><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"${_scopeId}><option${ssrRenderAttr("value", 1)}${ssrIncludeBooleanAttr(Array.isArray(form.value.questions_per_page) ? ssrLooseContain(form.value.questions_per_page, 1) : ssrLooseEqual(form.value.questions_per_page, 1)) ? " selected" : ""}${_scopeId}>По одному</option><option${ssrRenderAttr("value", 5)}${ssrIncludeBooleanAttr(Array.isArray(form.value.questions_per_page) ? ssrLooseContain(form.value.questions_per_page, 5) : ssrLooseEqual(form.value.questions_per_page, 5)) ? " selected" : ""}${_scopeId}>5 вопросов</option><option${ssrRenderAttr("value", 10)}${ssrIncludeBooleanAttr(Array.isArray(form.value.questions_per_page) ? ssrLooseContain(form.value.questions_per_page, 10) : ssrLooseEqual(form.value.questions_per_page, 10)) ? " selected" : ""}${_scopeId}>10 вопросов</option><option${ssrRenderAttr("value", 0)}${ssrIncludeBooleanAttr(Array.isArray(form.value.questions_per_page) ? ssrLooseContain(form.value.questions_per_page, 0) : ssrLooseEqual(form.value.questions_per_page, 0)) ? " selected" : ""}${_scopeId}>Все сразу</option></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div></div><div class="mt-4"${_scopeId}><label class="flex items-center gap-3 cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(form.value.allow_back) ? ssrLooseContain(form.value.allow_back, null) : form.value.allow_back) ? " checked" : ""} type="checkbox" class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"${_scopeId}><span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}>Разрешить возврат к предыдущим вопросам</span></label></div></div><div class="border-t border-gray-200 dark:border-gray-700 pt-5"${_scopeId}><div class="flex items-center justify-between mb-4"${_scopeId}><h4 class="font-medium text-gray-900 dark:text-white"${_scopeId}>Антипрокторинг</h4><label class="relative inline-flex items-center cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(form.value.proctoring_enabled) ? ssrLooseContain(form.value.proctoring_enabled, null) : form.value.proctoring_enabled) ? " checked" : ""} type="checkbox" class="sr-only peer"${_scopeId}><div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[&#39;&#39;] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"${_scopeId}></div></label></div>`);
            if (form.value.proctoring_enabled) {
              _push2(`<div class="grid grid-cols-2 gap-4"${_scopeId}><label class="flex items-center gap-3 cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(form.value.proctoring_settings.blockTabSwitch) ? ssrLooseContain(form.value.proctoring_settings.blockTabSwitch, null) : form.value.proctoring_settings.blockTabSwitch) ? " checked" : ""} type="checkbox" class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"${_scopeId}><span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}>Блокировать переключение вкладок</span></label><label class="flex items-center gap-3 cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(form.value.proctoring_settings.blockCopyPaste) ? ssrLooseContain(form.value.proctoring_settings.blockCopyPaste, null) : form.value.proctoring_settings.blockCopyPaste) ? " checked" : ""} type="checkbox" class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"${_scopeId}><span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}>Блокировать копирование</span></label><label class="flex items-center gap-3 cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(form.value.proctoring_settings.blockRightClick) ? ssrLooseContain(form.value.proctoring_settings.blockRightClick, null) : form.value.proctoring_settings.blockRightClick) ? " checked" : ""} type="checkbox" class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"${_scopeId}><span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}>Блокировать правый клик</span></label></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="border-t border-gray-200 dark:border-gray-700 pt-5"${_scopeId}><label class="flex items-center gap-3 cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(form.value.is_active) ? ssrLooseContain(form.value.is_active, null) : form.value.is_active) ? " checked" : ""} type="checkbox" class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"${_scopeId}><span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}>Шаблон активен</span></label></div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(saveTemplate, ["prevent"]),
                class: "space-y-5"
              }, [
                createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                  createVNode("div", { class: "md:col-span-2" }, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                      createTextVNode(" Название "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => form.value.name = $event,
                      type: "text",
                      placeholder: "Например: Тест по охране труда (базовый)",
                      class: ["w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary", { "border-danger": formErrors.value.name }]
                    }, null, 10, ["onUpdate:modelValue"]), [
                      [vModelText, form.value.name]
                    ]),
                    formErrors.value.name ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-danger"
                    }, toDisplayString(formErrors.value.name), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                      createTextVNode(" Код "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => form.value.code = $event,
                      type: "text",
                      placeholder: "OT-TEST-BASE",
                      class: ["w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary uppercase", { "border-danger": formErrors.value.code }]
                    }, null, 10, ["onUpdate:modelValue"]), [
                      [vModelText, form.value.code]
                    ]),
                    formErrors.value.code ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-danger"
                    }, toDisplayString(formErrors.value.code), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                      createTextVNode(" Банк вопросов "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    createVNode("div", { class: "relative" }, [
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => form.value.bank_id = $event,
                        class: ["w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none", { "border-danger": formErrors.value.bank_id }]
                      }, [
                        createVNode("option", { value: "" }, "Выберите банк"),
                        (openBlock(true), createBlock(Fragment, null, renderList(banks.value, (bank) => {
                          return openBlock(), createBlock("option", {
                            key: bank.id,
                            value: bank.id
                          }, toDisplayString(bank.name) + " (" + toDisplayString(bank.questions_count) + " вопросов) ", 9, ["value"]);
                        }), 128))
                      ], 10, ["onUpdate:modelValue"]), [
                        [vModelSelect, form.value.bank_id]
                      ]),
                      (openBlock(), createBlock("svg", {
                        class: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M19 9l-7 7-7-7"
                        })
                      ]))
                    ]),
                    formErrors.value.bank_id ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-danger"
                    }, toDisplayString(formErrors.value.bank_id), 1)) : createCommentVNode("", true)
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Описание "),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => form.value.description = $event,
                    rows: "2",
                    placeholder: "Краткое описание теста...",
                    class: "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, form.value.description]
                  ])
                ]),
                createVNode("div", { class: "border-t border-gray-200 dark:border-gray-700 pt-5" }, [
                  createVNode("h4", { class: "font-medium text-gray-900 dark:text-white mb-4" }, "Настройки вопросов"),
                  createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                    createVNode("div", null, [
                      createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Режим выбора вопросов "),
                      createVNode("div", { class: "relative" }, [
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => form.value.questions_mode = $event,
                          class: "w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                        }, [
                          createVNode("option", { value: "all" }, "Все вопросы из банка"),
                          createVNode("option", { value: "random" }, "Случайные N вопросов")
                        ], 8, ["onUpdate:modelValue"]), [
                          [vModelSelect, form.value.questions_mode]
                        ]),
                        (openBlock(), createBlock("svg", {
                          class: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M19 9l-7 7-7-7"
                          })
                        ]))
                      ])
                    ]),
                    form.value.questions_mode === "random" ? (openBlock(), createBlock("div", { key: 0 }, [
                      createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Количество вопросов "),
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => form.value.questions_count = $event,
                        type: "number",
                        min: "1",
                        max: "100",
                        class: "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [
                          vModelText,
                          form.value.questions_count,
                          void 0,
                          { number: true }
                        ]
                      ])
                    ])) : createCommentVNode("", true)
                  ]),
                  createVNode("div", { class: "grid grid-cols-2 gap-4 mt-4" }, [
                    createVNode("label", { class: "flex items-center gap-3 cursor-pointer" }, [
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => form.value.shuffle_questions = $event,
                        type: "checkbox",
                        class: "w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelCheckbox, form.value.shuffle_questions]
                      ]),
                      createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, "Перемешивать вопросы")
                    ]),
                    createVNode("label", { class: "flex items-center gap-3 cursor-pointer" }, [
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => form.value.shuffle_options = $event,
                        type: "checkbox",
                        class: "w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelCheckbox, form.value.shuffle_options]
                      ]),
                      createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, "Перемешивать варианты")
                    ])
                  ])
                ]),
                createVNode("div", { class: "border-t border-gray-200 dark:border-gray-700 pt-5" }, [
                  createVNode("h4", { class: "font-medium text-gray-900 dark:text-white mb-4" }, "Языки тестирования"),
                  createVNode("div", { class: "mb-4" }, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                      createTextVNode(" Доступные языки "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    createVNode("div", { class: "flex flex-wrap gap-3" }, [
                      (openBlock(), createBlock(Fragment, null, renderList(availableLanguages, (lang) => {
                        return createVNode("label", {
                          key: lang.value,
                          class: ["flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-all", [
                            form.value.allowed_languages.includes(lang.value) ? "border-primary bg-primary/5" : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                          ]]
                        }, [
                          withDirectives(createVNode("input", {
                            type: "checkbox",
                            value: lang.value,
                            "onUpdate:modelValue": ($event) => form.value.allowed_languages = $event,
                            class: "w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary",
                            onChange: onLanguageChange
                          }, null, 40, ["value", "onUpdate:modelValue"]), [
                            [vModelCheckbox, form.value.allowed_languages]
                          ]),
                          createVNode("span", { class: "text-lg" }, toDisplayString(lang.flag), 1),
                          createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, toDisplayString(lang.label), 1)
                        ], 2);
                      }), 64))
                    ]),
                    formErrors.value.allowed_languages ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-danger"
                    }, toDisplayString(formErrors.value.allowed_languages), 1)) : createCommentVNode("", true)
                  ]),
                  form.value.bank_id && form.value.allowed_languages.length > 0 && form.value.questions_mode === "random" ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "space-y-2"
                  }, [
                    createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400 mb-2" }, "Достаточность вопросов (минимум " + toDisplayString(form.value.questions_count) + " на каждом языке):", 1),
                    languageValidationLoading.value ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "flex items-center gap-2 text-sm text-gray-500"
                    }, [
                      createVNode("div", { class: "w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" }),
                      createTextVNode(" Проверка... ")
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "space-y-2"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(languageValidation.value, (validation) => {
                        return openBlock(), createBlock("div", {
                          key: validation.language,
                          class: ["flex items-center justify-between p-2 rounded-lg", validation.isValid ? "bg-success/10" : "bg-danger/10"]
                        }, [
                          createVNode("div", { class: "flex items-center gap-2" }, [
                            createVNode("span", null, toDisplayString(validation.flag), 1),
                            createVNode("span", {
                              class: ["text-sm font-medium", validation.isValid ? "text-success" : "text-danger"]
                            }, toDisplayString(validation.label), 3)
                          ]),
                          createVNode("div", { class: "flex items-center gap-2" }, [
                            createVNode("span", {
                              class: ["text-sm", validation.isValid ? "text-success" : "text-danger"]
                            }, toDisplayString(validation.available) + " / " + toDisplayString(validation.required), 3),
                            validation.isValid ? (openBlock(), createBlock("svg", {
                              key: 0,
                              class: "w-5 h-5 text-success",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M5 13l4 4L19 7"
                              })
                            ])) : (openBlock(), createBlock("svg", {
                              key: 1,
                              class: "w-5 h-5 text-danger",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M6 18L18 6M6 6l12 12"
                              })
                            ]))
                          ])
                        ], 2);
                      }), 128))
                    ])),
                    hasInvalidLanguages.value ? (openBlock(), createBlock("p", {
                      key: 2,
                      class: "text-sm text-danger mt-2"
                    }, " ⚠️ Недостаточно вопросов на некоторых языках. Добавьте вопросы или уменьшите количество. ")) : createCommentVNode("", true)
                  ])) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "border-t border-gray-200 dark:border-gray-700 pt-5" }, [
                  createVNode("h4", { class: "font-medium text-gray-900 dark:text-white mb-4" }, "Настройки прохождения"),
                  createVNode("div", { class: "grid grid-cols-1 md:grid-cols-3 gap-4" }, [
                    createVNode("div", null, [
                      createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Лимит времени (мин) "),
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => form.value.time_limit_minutes = $event,
                        type: "number",
                        min: "0",
                        max: "300",
                        placeholder: "Без лимита",
                        class: "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [
                          vModelText,
                          form.value.time_limit_minutes,
                          void 0,
                          { number: true }
                        ]
                      ]),
                      createVNode("p", { class: "mt-1 text-xs text-gray-500" }, "0 = без лимита")
                    ]),
                    createVNode("div", null, [
                      createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Проходной балл (%) "),
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => form.value.passing_score = $event,
                        type: "number",
                        min: "1",
                        max: "100",
                        class: "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [
                          vModelText,
                          form.value.passing_score,
                          void 0,
                          { number: true }
                        ]
                      ])
                    ]),
                    createVNode("div", null, [
                      createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Макс. попыток "),
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => form.value.max_attempts = $event,
                        type: "number",
                        min: "1",
                        max: "10",
                        class: "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [
                          vModelText,
                          form.value.max_attempts,
                          void 0,
                          { number: true }
                        ]
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" }, [
                    createVNode("div", null, [
                      createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Показ результатов "),
                      createVNode("div", { class: "relative" }, [
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => form.value.show_results = $event,
                          class: "w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                        }, [
                          createVNode("option", { value: "immediately" }, "Сразу после завершения"),
                          createVNode("option", { value: "after_deadline" }, "После дедлайна"),
                          createVNode("option", { value: "manual" }, "Вручную преподавателем"),
                          createVNode("option", { value: "never" }, "Не показывать")
                        ], 8, ["onUpdate:modelValue"]), [
                          [vModelSelect, form.value.show_results]
                        ]),
                        (openBlock(), createBlock("svg", {
                          class: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M19 9l-7 7-7-7"
                          })
                        ]))
                      ])
                    ]),
                    createVNode("div", null, [
                      createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Вопросов на странице "),
                      createVNode("div", { class: "relative" }, [
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => form.value.questions_per_page = $event,
                          class: "w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                        }, [
                          createVNode("option", { value: 1 }, "По одному"),
                          createVNode("option", { value: 5 }, "5 вопросов"),
                          createVNode("option", { value: 10 }, "10 вопросов"),
                          createVNode("option", { value: 0 }, "Все сразу")
                        ], 8, ["onUpdate:modelValue"]), [
                          [
                            vModelSelect,
                            form.value.questions_per_page,
                            void 0,
                            { number: true }
                          ]
                        ]),
                        (openBlock(), createBlock("svg", {
                          class: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M19 9l-7 7-7-7"
                          })
                        ]))
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "mt-4" }, [
                    createVNode("label", { class: "flex items-center gap-3 cursor-pointer" }, [
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => form.value.allow_back = $event,
                        type: "checkbox",
                        class: "w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelCheckbox, form.value.allow_back]
                      ]),
                      createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, "Разрешить возврат к предыдущим вопросам")
                    ])
                  ])
                ]),
                createVNode("div", { class: "border-t border-gray-200 dark:border-gray-700 pt-5" }, [
                  createVNode("div", { class: "flex items-center justify-between mb-4" }, [
                    createVNode("h4", { class: "font-medium text-gray-900 dark:text-white" }, "Антипрокторинг"),
                    createVNode("label", { class: "relative inline-flex items-center cursor-pointer" }, [
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => form.value.proctoring_enabled = $event,
                        type: "checkbox",
                        class: "sr-only peer"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelCheckbox, form.value.proctoring_enabled]
                      ]),
                      createVNode("div", { class: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" })
                    ])
                  ]),
                  form.value.proctoring_enabled ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "grid grid-cols-2 gap-4"
                  }, [
                    createVNode("label", { class: "flex items-center gap-3 cursor-pointer" }, [
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => form.value.proctoring_settings.blockTabSwitch = $event,
                        type: "checkbox",
                        class: "w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelCheckbox, form.value.proctoring_settings.blockTabSwitch]
                      ]),
                      createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, "Блокировать переключение вкладок")
                    ]),
                    createVNode("label", { class: "flex items-center gap-3 cursor-pointer" }, [
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => form.value.proctoring_settings.blockCopyPaste = $event,
                        type: "checkbox",
                        class: "w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelCheckbox, form.value.proctoring_settings.blockCopyPaste]
                      ]),
                      createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, "Блокировать копирование")
                    ]),
                    createVNode("label", { class: "flex items-center gap-3 cursor-pointer" }, [
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => form.value.proctoring_settings.blockRightClick = $event,
                        type: "checkbox",
                        class: "w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelCheckbox, form.value.proctoring_settings.blockRightClick]
                      ]),
                      createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, "Блокировать правый клик")
                    ])
                  ])) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "border-t border-gray-200 dark:border-gray-700 pt-5" }, [
                  createVNode("label", { class: "flex items-center gap-3 cursor-pointer" }, [
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => form.value.is_active = $event,
                      type: "checkbox",
                      class: "w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelCheckbox, form.value.is_active]
                    ]),
                    createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, "Шаблон активен")
                  ])
                ])
              ], 32)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": deleteModalOpen.value,
        title: "Удалить шаблон теста?",
        message: `Вы уверены, что хотите удалить шаблон '${deletingTemplate.value?.name}'? Это действие нельзя отменить.`,
        "confirm-text": "Удалить",
        "cancel-text": "Отмена",
        variant: "danger",
        loading: deleting.value,
        onConfirm: deleteTemplate,
        onCancel: ($event) => deleteModalOpen.value = false
      }, null, _parent));
      if (notification.value.show) {
        _push(ssrRenderComponent(_component_UiNotification, {
          type: notification.value.type,
          title: notification.value.title,
          message: notification.value.message,
          onClose: ($event) => notification.value.show = false
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/test-bank/templates/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BUXID75_.mjs.map
