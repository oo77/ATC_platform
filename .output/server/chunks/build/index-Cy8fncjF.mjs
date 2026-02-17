import { _ as __nuxt_component_1 } from './Pagination-BWEvmW2R.mjs';
import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrInterpolate, ssrRenderClass, ssrRenderComponent } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
import './server.mjs';
import '../_/nitro.mjs';
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
import 'node:url';
import 'jsonwebtoken';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';
import './Notification-CQvvdM2O.mjs';

function useActivityLogs() {
  const { authFetch } = useAuthFetch();
  const toast = useNotification();
  const logs = ref([]);
  const loading = ref(false);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalPages = ref(0);
  const fetchActivityLogs = async (filters = {}) => {
    loading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.actionType) params.append("actionType", filters.actionType);
      if (filters.entityType) params.append("entityType", filters.entityType);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("page", String(filters.page || currentPage.value));
      params.append("limit", String(filters.limit || pageSize.value));
      const response = await authFetch(
        `/api/activity-logs?${params.toString()}`
      );
      if (response.success) {
        logs.value = response.data;
        total.value = response.total;
        currentPage.value = response.page;
        pageSize.value = response.limit;
        totalPages.value = response.totalPages;
      } else {
        throw new Error("Не удалось загрузить журнал действий");
      }
    } catch (error) {
      console.error("Ошибка загрузки журнала действий:", error);
      toast.error(error.message || "Не удалось загрузить журнал действий");
    } finally {
      loading.value = false;
    }
  };
  const changePage = async (page, filters = {}) => {
    currentPage.value = page;
    await fetchActivityLogs({ ...filters, page });
  };
  const changePageSize = async (size, filters = {}) => {
    pageSize.value = size;
    currentPage.value = 1;
    await fetchActivityLogs({ ...filters, limit: size, page: 1 });
  };
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  };
  const getActionTypeLabel = (actionType) => {
    const labels = {
      CREATE: "Создание",
      UPDATE: "Обновление",
      DELETE: "Удаление",
      VIEW: "Просмотр",
      LOGIN: "Вход",
      LOGOUT: "Выход",
      IMPORT: "Импорт",
      EXPORT: "Экспорт",
      APPROVE: "Одобрение",
      REJECT: "Отклонение",
      BLOCK: "Блокировка",
      UNBLOCK: "Разблокировка",
      REVOKE: "Отзыв",
      ISSUE: "Выдача",
      RESET_PASSWORD: "Сброс пароля",
      ASSIGN: "Назначение",
      UNASSIGN: "Снятие назначения"
    };
    return labels[actionType] || actionType;
  };
  const getEntityTypeLabel = (entityType) => {
    const labels = {
      USER: "Пользователь",
      STUDENT: "Студент",
      CERTIFICATE: "Сертификат",
      CERTIFICATE_TEMPLATE: "Шаблон сертификата",
      ISSUED_CERTIFICATE: "Выданный сертификат",
      COURSE: "Курс",
      DISCIPLINE: "Дисциплина",
      INSTRUCTOR: "Инструктор",
      FILE: "Файл",
      FOLDER: "Папка",
      SCHEDULE: "Занятие",
      GROUP: "Группа",
      CLASSROOM: "Аудитория",
      ORGANIZATION: "Организация",
      REPRESENTATIVE: "Представитель",
      ATTENDANCE: "Посещаемость",
      GRADE: "Оценка",
      SYSTEM: "Система"
    };
    return labels[entityType] || entityType;
  };
  const getActionTypeColor = (actionType) => {
    const colors = {
      CREATE: "text-green-600 dark:text-green-400",
      UPDATE: "text-blue-600 dark:text-blue-400",
      DELETE: "text-red-600 dark:text-red-400",
      VIEW: "text-gray-600 dark:text-gray-400",
      LOGIN: "text-purple-600 dark:text-purple-400",
      LOGOUT: "text-gray-600 dark:text-gray-400",
      IMPORT: "text-indigo-600 dark:text-indigo-400",
      EXPORT: "text-indigo-600 dark:text-indigo-400",
      APPROVE: "text-green-600 dark:text-green-400",
      REJECT: "text-red-600 dark:text-red-400",
      BLOCK: "text-red-600 dark:text-red-400",
      UNBLOCK: "text-green-600 dark:text-green-400",
      REVOKE: "text-orange-600 dark:text-orange-400",
      ISSUE: "text-green-600 dark:text-green-400",
      RESET_PASSWORD: "text-yellow-600 dark:text-yellow-400",
      ASSIGN: "text-blue-600 dark:text-blue-400",
      UNASSIGN: "text-gray-600 dark:text-gray-400"
    };
    return colors[actionType] || "text-gray-600 dark:text-gray-400";
  };
  return {
    logs,
    loading,
    total,
    currentPage,
    pageSize,
    totalPages,
    fetchActivityLogs,
    changePage,
    changePageSize,
    formatDateTime,
    getActionTypeLabel,
    getEntityTypeLabel,
    getActionTypeColor
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const {
      logs,
      loading,
      total,
      currentPage,
      pageSize,
      totalPages,
      changePage: changePageFn,
      changePageSize: changePageSizeFn,
      formatDateTime,
      getActionTypeLabel,
      getEntityTypeLabel,
      getActionTypeColor
    } = useActivityLogs();
    const filters = ref({
      actionType: "",
      entityType: "",
      startDate: "",
      endDate: ""
    });
    const hasActiveFilters = computed(() => {
      return filters.value.actionType !== "" || filters.value.entityType !== "" || filters.value.startDate !== "" || filters.value.endDate !== "";
    });
    const handlePageChange = async (page) => {
      await changePageFn(page, {
        actionType: filters.value.actionType || void 0,
        entityType: filters.value.entityType || void 0,
        startDate: filters.value.startDate || void 0,
        endDate: filters.value.endDate || void 0
      });
    };
    const handleLimitChange = async (limit) => {
      await changePageSizeFn(limit, {
        actionType: filters.value.actionType || void 0,
        entityType: filters.value.entityType || void 0,
        startDate: filters.value.startDate || void 0,
        endDate: filters.value.endDate || void 0
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiPagination = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Журнал действий </h2><p class="text-sm text-gray-600 dark:text-gray-400 mt-1"> История всех действий пользователей в системе </p></div></div><div class="flex flex-col gap-6"><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><div class="flex items-center gap-3 mb-4"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg></div><h3 class="text-lg font-semibold text-black dark:text-white"> Фильтры </h3>`);
      if (hasActiveFilters.value) {
        _push(`<button class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Сбросить фильтры </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><div><label class="mb-2 block text-sm font-medium text-black dark:text-white"> Дата начала </label><input${ssrRenderAttr("value", filters.value.startDate)} type="date" class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"></div><div><label class="mb-2 block text-sm font-medium text-black dark:text-white"> Дата окончания </label><input${ssrRenderAttr("value", filters.value.endDate)} type="date" class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"></div><div><label class="mb-2 block text-sm font-medium text-black dark:text-white"> Тип действия </label><select class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "") : ssrLooseEqual(filters.value.actionType, "")) ? " selected" : ""}>Все действия</option><option value="CREATE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "CREATE") : ssrLooseEqual(filters.value.actionType, "CREATE")) ? " selected" : ""}>Создание</option><option value="UPDATE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "UPDATE") : ssrLooseEqual(filters.value.actionType, "UPDATE")) ? " selected" : ""}>Обновление</option><option value="DELETE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "DELETE") : ssrLooseEqual(filters.value.actionType, "DELETE")) ? " selected" : ""}>Удаление</option><option value="VIEW"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "VIEW") : ssrLooseEqual(filters.value.actionType, "VIEW")) ? " selected" : ""}>Просмотр</option><option value="LOGIN"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "LOGIN") : ssrLooseEqual(filters.value.actionType, "LOGIN")) ? " selected" : ""}>Вход</option><option value="LOGOUT"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "LOGOUT") : ssrLooseEqual(filters.value.actionType, "LOGOUT")) ? " selected" : ""}>Выход</option><option value="IMPORT"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "IMPORT") : ssrLooseEqual(filters.value.actionType, "IMPORT")) ? " selected" : ""}>Импорт</option><option value="EXPORT"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "EXPORT") : ssrLooseEqual(filters.value.actionType, "EXPORT")) ? " selected" : ""}>Экспорт</option><option value="APPROVE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "APPROVE") : ssrLooseEqual(filters.value.actionType, "APPROVE")) ? " selected" : ""}>Одобрение</option><option value="REJECT"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "REJECT") : ssrLooseEqual(filters.value.actionType, "REJECT")) ? " selected" : ""}>Отклонение</option><option value="BLOCK"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "BLOCK") : ssrLooseEqual(filters.value.actionType, "BLOCK")) ? " selected" : ""}>Блокировка</option><option value="UNBLOCK"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "UNBLOCK") : ssrLooseEqual(filters.value.actionType, "UNBLOCK")) ? " selected" : ""}>Разблокировка</option><option value="REVOKE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "REVOKE") : ssrLooseEqual(filters.value.actionType, "REVOKE")) ? " selected" : ""}>Отзыв</option><option value="ISSUE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "ISSUE") : ssrLooseEqual(filters.value.actionType, "ISSUE")) ? " selected" : ""}>Выдача</option><option value="RESET_PASSWORD"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "RESET_PASSWORD") : ssrLooseEqual(filters.value.actionType, "RESET_PASSWORD")) ? " selected" : ""}>Сброс пароля</option><option value="ASSIGN"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "ASSIGN") : ssrLooseEqual(filters.value.actionType, "ASSIGN")) ? " selected" : ""}>Назначение</option><option value="UNASSIGN"${ssrIncludeBooleanAttr(Array.isArray(filters.value.actionType) ? ssrLooseContain(filters.value.actionType, "UNASSIGN") : ssrLooseEqual(filters.value.actionType, "UNASSIGN")) ? " selected" : ""}>Снятие назначения</option></select></div><div><label class="mb-2 block text-sm font-medium text-black dark:text-white"> Тип сущности </label><select class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "") : ssrLooseEqual(filters.value.entityType, "")) ? " selected" : ""}>Все сущности</option><option value="USER"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "USER") : ssrLooseEqual(filters.value.entityType, "USER")) ? " selected" : ""}>Пользователь</option><option value="STUDENT"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "STUDENT") : ssrLooseEqual(filters.value.entityType, "STUDENT")) ? " selected" : ""}>Студент</option><option value="CERTIFICATE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "CERTIFICATE") : ssrLooseEqual(filters.value.entityType, "CERTIFICATE")) ? " selected" : ""}>Сертификат</option><option value="CERTIFICATE_TEMPLATE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "CERTIFICATE_TEMPLATE") : ssrLooseEqual(filters.value.entityType, "CERTIFICATE_TEMPLATE")) ? " selected" : ""}>Шаблон сертификата</option><option value="ISSUED_CERTIFICATE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "ISSUED_CERTIFICATE") : ssrLooseEqual(filters.value.entityType, "ISSUED_CERTIFICATE")) ? " selected" : ""}>Выданный сертификат</option><option value="COURSE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "COURSE") : ssrLooseEqual(filters.value.entityType, "COURSE")) ? " selected" : ""}>Курс</option><option value="DISCIPLINE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "DISCIPLINE") : ssrLooseEqual(filters.value.entityType, "DISCIPLINE")) ? " selected" : ""}>Дисциплина</option><option value="INSTRUCTOR"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "INSTRUCTOR") : ssrLooseEqual(filters.value.entityType, "INSTRUCTOR")) ? " selected" : ""}>Инструктор</option><option value="FILE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "FILE") : ssrLooseEqual(filters.value.entityType, "FILE")) ? " selected" : ""}>Файл</option><option value="FOLDER"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "FOLDER") : ssrLooseEqual(filters.value.entityType, "FOLDER")) ? " selected" : ""}>Папка</option><option value="SCHEDULE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "SCHEDULE") : ssrLooseEqual(filters.value.entityType, "SCHEDULE")) ? " selected" : ""}>Занятие</option><option value="GROUP"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "GROUP") : ssrLooseEqual(filters.value.entityType, "GROUP")) ? " selected" : ""}>Группа</option><option value="CLASSROOM"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "CLASSROOM") : ssrLooseEqual(filters.value.entityType, "CLASSROOM")) ? " selected" : ""}>Аудитория</option><option value="ORGANIZATION"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "ORGANIZATION") : ssrLooseEqual(filters.value.entityType, "ORGANIZATION")) ? " selected" : ""}>Организация</option><option value="REPRESENTATIVE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "REPRESENTATIVE") : ssrLooseEqual(filters.value.entityType, "REPRESENTATIVE")) ? " selected" : ""}>Представитель</option><option value="ATTENDANCE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "ATTENDANCE") : ssrLooseEqual(filters.value.entityType, "ATTENDANCE")) ? " selected" : ""}>Посещаемость</option><option value="GRADE"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "GRADE") : ssrLooseEqual(filters.value.entityType, "GRADE")) ? " selected" : ""}>Оценка</option><option value="SYSTEM"${ssrIncludeBooleanAttr(Array.isArray(filters.value.entityType) ? ssrLooseContain(filters.value.entityType, "SYSTEM") : ssrLooseEqual(filters.value.entityType, "SYSTEM")) ? " selected" : ""}>Система</option></select></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md overflow-hidden"><div class="overflow-x-auto"><table class="w-full table-auto"><thead><tr class="bg-gray-2 text-left dark:bg-meta-4"><th class="py-4 px-4 font-medium text-black dark:text-white pl-6"> Дата и время </th><th class="py-4 px-4 font-medium text-black dark:text-white"> Пользователь </th><th class="py-4 px-4 font-medium text-black dark:text-white"> Действие </th><th class="py-4 px-4 font-medium text-black dark:text-white"> Сущность </th><th class="py-4 px-4 font-medium text-black dark:text-white"> Название </th><th class="py-4 px-4 font-medium text-black dark:text-white"> IP адрес </th></tr></thead><tbody>`);
      if (unref(loading)) {
        _push(`<tr><td colspan="6" class="text-center py-12"><div class="flex justify-center items-center"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div><span class="ml-3 text-gray-600 dark:text-gray-400">Загрузка...</span></div></td></tr>`);
      } else if (unref(logs).length === 0) {
        _push(`<tr><td colspan="6" class="text-center py-12"><p class="text-gray-600 dark:text-gray-400"> Нет записей для отображения </p></td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(unref(logs), (log) => {
        _push(`<tr class="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition"><td class="py-4 px-4 text-sm pl-6"><span class="text-black dark:text-white">${ssrInterpolate(unref(formatDateTime)(log.createdAt))}</span></td><td class="py-4 px-4"><div class="flex flex-col"><span class="text-sm font-medium text-black dark:text-white">${ssrInterpolate(log.userName || "Неизвестно")}</span><span class="text-xs text-gray-600 dark:text-gray-400">${ssrInterpolate(log.userEmail || log.userId)}</span></div></td><td class="py-4 px-4"><span class="${ssrRenderClass([
          "inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium",
          unref(getActionTypeColor)(log.actionType)
        ])}">${ssrInterpolate(unref(getActionTypeLabel)(log.actionType))}</span></td><td class="py-4 px-4 text-sm text-black dark:text-white">${ssrInterpolate(unref(getEntityTypeLabel)(log.entityType))}</td><td class="py-4 px-4 text-sm text-black dark:text-white">${ssrInterpolate(log.entityName || "—")}</td><td class="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(log.ipAddress || "—")}</td></tr>`);
      });
      _push(`<!--]--></tbody></table></div>`);
      if (unref(totalPages) > 0) {
        _push(ssrRenderComponent(_component_UiPagination, {
          "current-page": unref(currentPage),
          "total-pages": unref(totalPages),
          total: unref(total),
          limit: unref(pageSize),
          loading: unref(loading),
          "limit-options": [10, 50, 100],
          "onUpdate:page": handlePageChange,
          "onUpdate:limit": handleLimitChange
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/activity-logs/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-Cy8fncjF.mjs.map
