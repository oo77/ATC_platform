import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { ref, reactive, mergeProps, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderComponent, ssrRenderList } from 'vue/server-renderer';
import { u as useHead } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-pXCaAdz0.mjs';
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
import 'jsonwebtoken';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main = {
  __name: "support",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Поддержка | TailAdmin - Nuxt Tailwind CSS Dashboard"
    });
    const loading = ref(false);
    const ticketsLoading = ref(false);
    const tickets = ref([]);
    const ticket = reactive({
      ticket_type: "",
      priority: "medium",
      subject: "",
      description: ""
    });
    useAuthFetch();
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const getStatusLabel = (status) => {
      const map = {
        new: "Новое",
        in_progress: "В работе",
        resolved: "Решено",
        closed: "Закрыто"
      };
      return map[status] || status;
    };
    const getTypeLabel = (type) => {
      const map = {
        technical: "Техническая",
        question: "Вопрос",
        feature: "Предложение",
        bug: "Ошибка",
        other: "Другое"
      };
      return map[type] || type;
    };
    const getPriorityLabel = (priority) => {
      const map = {
        low: "Низкий",
        medium: "Средний",
        high: "Высокий"
      };
      return map[priority] || priority;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Поддержка </h2></div><div class="grid grid-cols-1 gap-6 lg:grid-cols-3"><div class="lg:col-span-2 space-y-6"><div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark"><div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4"><h3 class="text-xl font-semibold text-gray-900 dark:text-white"> Обратиться в поддержку </h3><p class="mt-1 text-sm text-gray-500 dark:text-gray-400"> Опишите вашу проблему, и мы постараемся помочь вам как можно скорее </p></div><div class="p-6"><form class="space-y-5"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Тип обращения <span class="text-danger">*</span></label><select required class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"><option value="" disabled${ssrIncludeBooleanAttr(Array.isArray(ticket.ticket_type) ? ssrLooseContain(ticket.ticket_type, "") : ssrLooseEqual(ticket.ticket_type, "")) ? " selected" : ""}>Выберите тип обращения</option><option value="technical"${ssrIncludeBooleanAttr(Array.isArray(ticket.ticket_type) ? ssrLooseContain(ticket.ticket_type, "technical") : ssrLooseEqual(ticket.ticket_type, "technical")) ? " selected" : ""}>Техническая проблема</option><option value="question"${ssrIncludeBooleanAttr(Array.isArray(ticket.ticket_type) ? ssrLooseContain(ticket.ticket_type, "question") : ssrLooseEqual(ticket.ticket_type, "question")) ? " selected" : ""}>Общий вопрос</option><option value="feature"${ssrIncludeBooleanAttr(Array.isArray(ticket.ticket_type) ? ssrLooseContain(ticket.ticket_type, "feature") : ssrLooseEqual(ticket.ticket_type, "feature")) ? " selected" : ""}>Предложение по улучшению</option><option value="bug"${ssrIncludeBooleanAttr(Array.isArray(ticket.ticket_type) ? ssrLooseContain(ticket.ticket_type, "bug") : ssrLooseEqual(ticket.ticket_type, "bug")) ? " selected" : ""}>Сообщить об ошибке</option><option value="other"${ssrIncludeBooleanAttr(Array.isArray(ticket.ticket_type) ? ssrLooseContain(ticket.ticket_type, "other") : ssrLooseEqual(ticket.ticket_type, "other")) ? " selected" : ""}>Другое</option></select></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Приоритет </label><div class="flex gap-3"><label class="${ssrRenderClass([ticket.priority === "low" ? "border-success ring-1 ring-success" : "border-gray-300 dark:border-gray-600", "flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-2.5 transition-all hover:border-success focus-within:border-success dark:bg-gray-900"])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(ticket.priority, "low")) ? " checked" : ""} value="low" class="peer sr-only"><span class="text-sm font-medium text-gray-700 peer-checked:text-success dark:text-gray-300">Низкий</span></label><label class="${ssrRenderClass([ticket.priority === "medium" ? "border-warning ring-1 ring-warning" : "border-gray-300 dark:border-gray-600", "flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-2.5 transition-all hover:border-warning focus-within:border-warning dark:bg-gray-900"])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(ticket.priority, "medium")) ? " checked" : ""} value="medium" class="peer sr-only"><span class="text-sm font-medium text-gray-700 peer-checked:text-warning dark:text-gray-300">Средний</span></label><label class="${ssrRenderClass([ticket.priority === "high" ? "border-danger ring-1 ring-danger" : "border-gray-300 dark:border-gray-600", "flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-2.5 transition-all hover:border-danger focus-within:border-danger dark:bg-gray-900"])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(ticket.priority, "high")) ? " checked" : ""} value="high" class="peer sr-only"><span class="text-sm font-medium text-gray-700 peer-checked:text-danger dark:text-gray-300">Высокий</span></label></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Тема обращения <span class="text-danger">*</span></label><input type="text"${ssrRenderAttr("value", ticket.subject)} required placeholder="Кратко опишите проблему" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Подробное описание <span class="text-danger">*</span></label><textarea required rows="6" placeholder="Опишите вашу проблему максимально подробно..." class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">${ssrInterpolate(ticket.description)}</textarea></div><div class="flex justify-end gap-3 pt-2">`);
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "primary",
        size: "md",
        type: "submit",
        loading: loading.value
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Отправить обращение `);
          } else {
            return [
              createTextVNode(" Отправить обращение ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></form></div></div><div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark"><div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center"><h3 class="text-xl font-semibold text-gray-900 dark:text-white"> Мои обращения </h3><button class="text-sm text-primary hover:underline"> Обновить </button></div><div class="p-6">`);
      if (ticketsLoading.value) {
        _push(`<div class="flex justify-center p-4"><div class="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (tickets.value.length === 0) {
        _push(`<div class="text-center text-gray-500 py-4"> У вас пока нет обращений </div>`);
      } else {
        _push(`<div class="space-y-4"><!--[-->`);
        ssrRenderList(tickets.value, (t) => {
          _push(`<div class="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"><div class="flex justify-between items-start"><div><h4 class="font-bold text-gray-900 dark:text-white">${ssrInterpolate(t.subject)}</h4><p class="text-sm text-gray-500">${ssrInterpolate(formatDate(t.created_at))}</p></div><span class="${ssrRenderClass([{
            "bg-blue-100 text-blue-800": t.status === "new",
            "bg-yellow-100 text-yellow-800": t.status === "in_progress",
            "bg-green-100 text-green-800": t.status === "resolved",
            "bg-gray-100 text-gray-800": t.status === "closed"
          }, "px-2.5 py-0.5 rounded-full text-xs font-medium"])}">${ssrInterpolate(getStatusLabel(t.status))}</span></div><p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">${ssrInterpolate(t.description)}</p><div class="flex gap-2 text-xs mt-2"><span class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">${ssrInterpolate(getTypeLabel(t.ticket_type))}</span><span class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize"> Приоритет: ${ssrInterpolate(getPriorityLabel(t.priority))}</span></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div></div><div class="space-y-6"><div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark"><div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4"><h3 class="text-lg font-semibold text-gray-900 dark:text-white"> Контактная информация </h3></div><div class="p-6 space-y-4"><div class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div><div class="flex-1"><p class="text-sm font-medium text-gray-900 dark:text-white">Email</p><a href="mailto:support@atc.uz" class="text-sm text-primary hover:underline"> support@atc.uz </a></div></div><div class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><svg class="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg></div><div class="flex-1"><p class="text-sm font-medium text-gray-900 dark:text-white">Телефон</p><a href="tel:+998901234567" class="text-sm text-success hover:underline"> +998 (90) 123-45-67 </a></div></div><div class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><svg class="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="flex-1"><p class="text-sm font-medium text-gray-900 dark:text-white">Время работы</p><p class="text-sm text-gray-600 dark:text-gray-400"> Пн-Пт: 9:00 - 18:00 </p></div></div></div></div><div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark"><div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4"><h3 class="text-lg font-semibold text-gray-900 dark:text-white"> Часто задаваемые вопросы </h3></div><div class="p-6 space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><h4 class="mb-1 text-sm font-medium text-gray-900 dark:text-white"> Как сбросить пароль? </h4><p class="text-xs text-gray-600 dark:text-gray-400"> Обратитесь к администратору системы. </p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><h4 class="mb-1 text-sm font-medium text-gray-900 dark:text-white"> Где мои результаты тестов? </h4><p class="text-xs text-gray-600 dark:text-gray-400"> В разделе &quot;Мои тесты&quot; в личном кабинете. </p></div></div></div></div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/support.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=support-Chn3G-7A.mjs.map
