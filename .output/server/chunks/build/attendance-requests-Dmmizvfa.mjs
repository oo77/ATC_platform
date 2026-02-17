import { defineComponent, ref, watch, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { R as REQUEST_STATUS_COLORS, b as REQUEST_STATUS_LABELS } from './attendanceMarking-Sepqv3oc.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "attendance-requests",
  __ssrInlineRender: true,
  setup(__props) {
    const { authFetch } = useAuthFetch();
    const { error: showError } = useNotification();
    const loading = ref(true);
    const requests = ref([]);
    const statistics = ref(null);
    const activeFilter = ref("pending");
    const processingId = ref(null);
    async function loadData() {
      loading.value = true;
      try {
        const [requestsRes, overdueRes] = await Promise.all([
          authFetch("/api/attendance/marking/requests", {
            params: {
              onlyPending: activeFilter.value === "pending" ? "true" : void 0
            }
          }),
          authFetch("/api/attendance/marking/overdue")
        ]);
        if (requestsRes.success) {
          requests.value = requestsRes.requests;
        }
        if (overdueRes.success) {
          statistics.value = overdueRes.statistics;
        }
      } catch (error) {
        console.error("Error loading data:", error);
        showError("Ошибка загрузки данных");
      } finally {
        loading.value = false;
      }
    }
    function formatDate(dateStr) {
      if (!dateStr) return "—";
      const date = new Date(dateStr);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    function getRelativeTime(dateStr) {
      const date = new Date(dateStr);
      const now = /* @__PURE__ */ new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1e3 * 60 * 60));
      if (hours < 1) return "Только что";
      if (hours < 24) return `${hours}ч назад`;
      const days = Math.floor(hours / 24);
      if (days === 1) return "Вчера";
      if (days < 7) return `${days}д назад`;
      return formatDate(dateStr);
    }
    watch(activeFilter, () => {
      loadData();
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "container mx-auto px-4 py-6" }, _attrs))}><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6"><div><h1 class="text-2xl font-bold text-gray-900 dark:text-white"> Запросы на отметку посещаемости </h1><p class="text-gray-500 dark:text-gray-400 mt-1"> Одобрение просроченных отметок от инструкторов </p></div><button${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><svg class="${ssrRenderClass([{ "animate-spin": unref(loading) }, "w-4 h-4"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Обновить </button></div>`);
      if (unref(statistics)) {
        _push(`<div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6"><div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(statistics).pending)}</p><p class="text-sm text-gray-500 dark:text-gray-400">Ожидают отметки</p></div><div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-red-200 dark:border-red-800"><p class="text-2xl font-bold text-red-600">${ssrInterpolate(unref(statistics).overdue)}</p><p class="text-sm text-gray-500 dark:text-gray-400">Просрочено</p></div><div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-yellow-200 dark:border-yellow-800"><p class="text-2xl font-bold text-yellow-600">${ssrInterpolate(unref(statistics).late)}</p><p class="text-sm text-gray-500 dark:text-gray-400">С опозданием</p></div><div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-800"><p class="text-2xl font-bold text-green-600">${ssrInterpolate(unref(statistics).onTime)}</p><p class="text-sm text-gray-500 dark:text-gray-400">Вовремя</p></div><div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-purple-200 dark:border-purple-800"><p class="text-2xl font-bold text-purple-600">${ssrInterpolate(unref(statistics).pendingRequests)}</p><p class="text-sm text-gray-500 dark:text-gray-400">Ожидают одобрения</p></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex gap-2 mb-6"><button class="${ssrRenderClass([unref(activeFilter) === "pending" ? "bg-primary-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300", "px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 transition-colors"])}"> Ожидающие `);
      if (unref(statistics) && unref(statistics).pendingRequests > 0) {
        _push(`<span class="${ssrRenderClass([unref(activeFilter) === "pending" ? "bg-white/20" : "bg-red-100 text-red-600", "ml-1 px-1.5 py-0.5 text-xs rounded-full"])}">${ssrInterpolate(unref(statistics).pendingRequests)}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</button><button class="${ssrRenderClass([unref(activeFilter) === "all" ? "bg-primary-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300", "px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 transition-colors"])}"> Все запросы </button></div>`);
      if (unref(loading)) {
        _push(`<div class="flex justify-center py-12"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>`);
      } else if (unref(requests).length === 0) {
        _push(`<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center"><svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg><p class="text-lg font-medium text-gray-900 dark:text-white mb-2">${ssrInterpolate(unref(activeFilter) === "pending" ? "Нет ожидающих запросов" : "Запросов не найдено")}</p><p class="text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(activeFilter) === "pending" ? "Все запросы на отметку рассмотрены" : "Инструкторы ещё не отправляли запросов")}</p></div>`);
      } else {
        _push(`<div class="space-y-4"><!--[-->`);
        ssrRenderList(unref(requests), (request) => {
          _push(`<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"><div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"><div class="flex-1"><div class="flex items-start gap-4"><div class="shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"><svg class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div><div class="flex-1 min-w-0"><h3 class="text-lg font-semibold text-gray-900 dark:text-white">${ssrInterpolate(request.instructor?.fullName || "Инструктор")}</h3><p class="text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(getRelativeTime(request.createdAt))}</p><div class="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(request.event?.title || "Занятие")}</p><p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${ssrInterpolate(formatDate(request.event?.endTime ?? null))} `);
          if (request.event?.groupCode) {
            _push(`<span class="ml-2"> • ${ssrInterpolate(request.event.groupCode)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p></div><div class="mt-3"><p class="text-sm font-medium text-gray-700 dark:text-gray-300">Причина:</p><p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${ssrInterpolate(request.reason)}</p></div>`);
          if (request.status !== "pending") {
            _push(`<div class="${ssrRenderClass([request.status === "approved" ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20", "mt-3 p-3 rounded-lg"])}"><div class="flex items-center gap-2"><span class="${ssrRenderClass([unref(REQUEST_STATUS_COLORS)[request.status], "px-2 py-1 text-xs font-medium rounded-full"])}">${ssrInterpolate(unref(REQUEST_STATUS_LABELS)[request.status])}</span>`);
            if (request.reviewer) {
              _push(`<span class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(request.reviewer.fullName)} • ${ssrInterpolate(formatDate(request.reviewedAt))}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
            if (request.reviewComment) {
              _push(`<p class="text-sm text-gray-600 dark:text-gray-400 mt-2">${ssrInterpolate(request.reviewComment)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div>`);
          if (request.status === "pending") {
            _push(`<div class="flex gap-2 lg:flex-col"><button${ssrIncludeBooleanAttr(unref(processingId) === request.id) ? " disabled" : ""} class="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors">`);
            if (unref(processingId) === request.id) {
              _push(`<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`);
            } else {
              _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`);
            }
            _push(` Одобрить </button><button${ssrIncludeBooleanAttr(unref(processingId) === request.id) ? " disabled" : ""} class="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Отклонить </button></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/attendance-requests.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=attendance-requests-Dmmizvfa.mjs.map
