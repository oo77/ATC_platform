import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { defineComponent, mergeProps, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { u as useHead } from './server.mjs';
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
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "support",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Поддержка | TailAdmin - Nuxt Tailwind CSS Dashboard"
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Поддержка </h2></div><div class="grid grid-cols-1 gap-6 lg:grid-cols-3"><div class="lg:col-span-2"><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="border-b border-stroke px-6 py-4 dark:border-strokedark"><h3 class="text-xl font-semibold text-gray-900 dark:text-white"> Обратиться в поддержку </h3><p class="mt-1 text-sm text-gray-500 dark:text-gray-400"> Опишите вашу проблему, и мы постараемся помочь вам как можно скорее </p></div><div class="p-6"><form class="space-y-5"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Тип обращения </label><select class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"><option value="">Выберите тип обращения</option><option value="technical">Техническая проблема</option><option value="question">Общий вопрос</option><option value="feature">Предложение по улучшению</option><option value="bug">Сообщить об ошибке</option><option value="other">Другое</option></select></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Приоритет </label><div class="flex gap-3"><label class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 transition-all hover:border-success focus-within:border-success dark:border-gray-600 dark:bg-gray-900"><input type="radio" name="priority" value="low" class="peer sr-only"><span class="text-sm font-medium text-gray-700 peer-checked:text-success dark:text-gray-300">Низкий</span></label><label class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 transition-all hover:border-warning focus-within:border-warning dark:border-gray-600 dark:bg-gray-900"><input type="radio" name="priority" value="medium" class="peer sr-only" checked><span class="text-sm font-medium text-gray-700 peer-checked:text-warning dark:text-gray-300">Средний</span></label><label class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 transition-all hover:border-danger focus-within:border-danger dark:border-gray-600 dark:bg-gray-900"><input type="radio" name="priority" value="high" class="peer sr-only"><span class="text-sm font-medium text-gray-700 peer-checked:text-danger dark:text-gray-300">Высокий</span></label></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Тема обращения </label><input type="text" placeholder="Кратко опишите проблему" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Подробное описание </label><textarea rows="6" placeholder="Опишите вашу проблему максимально подробно..." class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></textarea></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Прикрепить файл (необязательно) </label><div class="flex items-center justify-center w-full"><label class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-900 dark:border-gray-600"><div class="flex flex-col items-center justify-center pt-5 pb-6"><svg class="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg><p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Нажмите для загрузки</span> или перетащите файл </p><p class="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, PDF (MAX. 10MB)</p></div><input type="file" class="hidden"></label></div></div><div class="flex justify-end gap-3 pt-2">`);
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "outline",
        size: "md",
        type: "button"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Отмена `);
          } else {
            return [
              createTextVNode(" Отмена ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "primary",
        size: "md",
        type: "submit"
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
      _push(`</div></form></div></div></div><div class="space-y-6"><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="border-b border-stroke px-6 py-4 dark:border-strokedark"><h3 class="text-lg font-semibold text-gray-900 dark:text-white"> Контактная информация </h3></div><div class="p-6 space-y-4"><div class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div><div class="flex-1"><p class="text-sm font-medium text-gray-900 dark:text-white">Email</p><a href="mailto:support@example.com" class="text-sm text-primary hover:underline"> support@example.com </a></div></div><div class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><svg class="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg></div><div class="flex-1"><p class="text-sm font-medium text-gray-900 dark:text-white">Телефон</p><a href="tel:+998901234567" class="text-sm text-success hover:underline"> +998 (90) 123-45-67 </a></div></div><div class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><svg class="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="flex-1"><p class="text-sm font-medium text-gray-900 dark:text-white">Время работы</p><p class="text-sm text-gray-600 dark:text-gray-400"> Пн-Пт: 9:00 - 18:00 </p></div></div></div></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="border-b border-stroke px-6 py-4 dark:border-strokedark"><h3 class="text-lg font-semibold text-gray-900 dark:text-white"> Часто задаваемые вопросы </h3></div><div class="p-6 space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><h4 class="mb-1 text-sm font-medium text-gray-900 dark:text-white"> Как сбросить пароль? </h4><p class="text-xs text-gray-600 dark:text-gray-400"> Перейдите в раздел &quot;Настройки&quot; → &quot;Безопасность&quot; </p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><h4 class="mb-1 text-sm font-medium text-gray-900 dark:text-white"> Как импортировать данные? </h4><p class="text-xs text-gray-600 dark:text-gray-400"> Используйте раздел &quot;База данных&quot; → &quot;Импорт&quot; </p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><h4 class="mb-1 text-sm font-medium text-gray-900 dark:text-white"> Как добавить пользователя? </h4><p class="text-xs text-gray-600 dark:text-gray-400"> Перейдите в &quot;Управление пользователями&quot; </p></div><div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700"><a href="#" class="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"> Посмотреть все вопросы <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></a></div></div></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="border-b border-stroke px-6 py-4 dark:border-strokedark"><h3 class="text-lg font-semibold text-gray-900 dark:text-white"> Статус системы </h3></div><div class="p-6 space-y-3"><div class="flex items-center justify-between"><span class="text-sm text-gray-600 dark:text-gray-400">API</span><span class="flex items-center gap-2 text-sm font-medium text-success"><span class="h-2 w-2 rounded-full bg-success animate-pulse"></span> Работает </span></div><div class="flex items-center justify-between"><span class="text-sm text-gray-600 dark:text-gray-400">База данных</span><span class="flex items-center gap-2 text-sm font-medium text-success"><span class="h-2 w-2 rounded-full bg-success animate-pulse"></span> Работает </span></div><div class="flex items-center justify-between"><span class="text-sm text-gray-600 dark:text-gray-400">Email сервис</span><span class="flex items-center gap-2 text-sm font-medium text-success"><span class="h-2 w-2 rounded-full bg-success animate-pulse"></span> Работает </span></div></div></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/support.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=support-0OheoZMA.mjs.map
