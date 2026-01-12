import { _ as __nuxt_component_1$1 } from './Button-DE8MjHjS.mjs';
import { defineComponent, ref, mergeProps, createVNode, resolveDynamicComponent, withCtx, createTextVNode, unref, createBlock, openBlock, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrRenderVNode, ssrInterpolate, ssrRenderStyle, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain } from 'vue/server-renderer';
import { u as useNotification } from './useNotification-C2RwAN1X.mjs';
import { u as useScheduleSettings } from './useScheduleSettings-CNJlVtwC.mjs';
import { Settings, Calendar, Bell, Palette } from 'lucide-vue-next';
import { u as useHead } from './server.mjs';
import './Notification-Bd1V2gNg.mjs';
import './useAuthFetch-CmGEBSSi.mjs';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ScheduleSettings",
  __ssrInlineRender: true,
  setup(__props) {
    const notification = useNotification();
    const {
      periods,
      settings,
      loading,
      updatePeriods,
      updateSettings,
      resetCache
    } = useScheduleSettings();
    const saving = ref(false);
    const localPeriods = ref([]);
    const localSettings = ref({
      snap_to_periods: true,
      show_period_numbers: true,
      period_duration_minutes: "40",
      short_break_minutes: "10"
    });
    const initLocalValues = () => {
      localPeriods.value = periods.value.map((p) => ({
        periodNumber: p.periodNumber,
        startTime: p.startTime,
        endTime: p.endTime,
        isAfterBreak: p.isAfterBreak
      }));
      localSettings.value = {
        snap_to_periods: settings.value.snap_to_periods === "true",
        show_period_numbers: settings.value.show_period_numbers === "true",
        period_duration_minutes: settings.value.period_duration_minutes || "40",
        short_break_minutes: settings.value.short_break_minutes || "10"
      };
    };
    const saveSettings = async () => {
      saving.value = true;
      try {
        const periodsSuccess = await updatePeriods(localPeriods.value);
        const settingsData = [
          { key: "snap_to_periods", value: localSettings.value.snap_to_periods ? "true" : "false" },
          { key: "show_period_numbers", value: localSettings.value.show_period_numbers ? "true" : "false" },
          { key: "period_duration_minutes", value: localSettings.value.period_duration_minutes },
          { key: "short_break_minutes", value: localSettings.value.short_break_minutes }
        ];
        const settingsSuccess = await updateSettings(settingsData);
        if (periodsSuccess && settingsSuccess) {
          notification.show({
            type: "success",
            title: "Сохранено",
            message: "Настройки расписания успешно сохранены"
          });
        } else {
          throw new Error("Не все настройки удалось сохранить");
        }
      } catch (error) {
        console.error("Ошибка сохранения:", error);
        notification.show({
          type: "error",
          title: "Ошибка",
          message: error.message || "Не удалось сохранить настройки"
        });
      } finally {
        saving.value = false;
      }
    };
    const resetToDefaults = () => {
      resetCache();
      initLocalValues();
      notification.show({
        type: "info",
        title: "Сброшено",
        message: "Настройки сброшены к значениям по умолчанию. Не забудьте сохранить."
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Настройки расписания </h3><p class="mb-6 text-sm text-gray-600 dark:text-gray-400"> Настройте академические часы и перерывы для учебного расписания </p>`);
      if (unref(loading)) {
        _push(`<div class="flex items-center justify-center py-12"><div class="flex items-center gap-3"><div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div><span class="text-gray-600 dark:text-gray-400">Загрузка настроек...</span></div></div>`);
      } else {
        _push(`<div class="space-y-6"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><h4 class="mb-4 font-medium text-gray-900 dark:text-white">Общие настройки</h4><div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900"><div><h5 class="text-sm font-medium text-gray-900 dark:text-white">Привязка к парам</h5><p class="text-xs text-gray-500 dark:text-gray-400">Привязывать события к академическим часам</p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(localSettings).snap_to_periods) ? ssrLooseContain(unref(localSettings).snap_to_periods, null) : unref(localSettings).snap_to_periods) ? " checked" : ""} class="peer sr-only"><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900"><div><h5 class="text-sm font-medium text-gray-900 dark:text-white">Показывать номера пар</h5><p class="text-xs text-gray-500 dark:text-gray-400">Отображать номера пар в календаре</p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(localSettings).show_period_numbers) ? ssrLooseContain(unref(localSettings).show_period_numbers, null) : unref(localSettings).show_period_numbers) ? " checked" : ""} class="peer sr-only"><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div><div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900"><label class="block text-sm font-medium text-gray-900 dark:text-white mb-2"> Длительность ак. часа (мин) </label><input type="number"${ssrRenderAttr("value", unref(localSettings).period_duration_minutes)} min="30" max="60" class="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"></div><div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900"><label class="block text-sm font-medium text-gray-900 dark:text-white mb-2"> Перерыв между парами (мин) </label><input type="number"${ssrRenderAttr("value", unref(localSettings).short_break_minutes)} min="5" max="30" class="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center justify-between mb-4"><h4 class="font-medium text-gray-900 dark:text-white">Академические пары</h4><span class="text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(localPeriods).length)} пар </span></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-gray-200 dark:border-gray-600"><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">№</th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Начало</th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Окончание</th><th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">После перерыва</th></tr></thead><tbody><!--[-->`);
        ssrRenderList(unref(localPeriods), (period) => {
          _push(`<tr class="${ssrRenderClass([{ "bg-yellow-50 dark:bg-yellow-900/20": period.isAfterBreak }, "border-b border-gray-100 dark:border-gray-700"])}"><td class="px-3 py-2"><span class="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded font-medium text-xs">${ssrInterpolate(period.periodNumber)}</span></td><td class="px-3 py-2"><input type="time"${ssrRenderAttr("value", period.startTime)} class="rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"></td><td class="px-3 py-2"><input type="time"${ssrRenderAttr("value", period.endTime)} class="rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"></td><td class="px-3 py-2 text-center"><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(period.isAfterBreak) ? ssrLooseContain(period.isAfterBreak, null) : period.isAfterBreak) ? " checked" : ""} class="peer sr-only"><div class="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-warning peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-warning/20 dark:border-gray-600 dark:bg-gray-700"></div></label></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div><div class="mt-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><svg class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><p class="text-sm text-blue-700 dark:text-blue-300"> Отметьте &quot;После перерыва&quot; для пар, которые начинаются после большого перерыва (обеда). Это добавит визуальное разделение в календаре. </p></div></div></div>`);
      }
      _push(`</div><div class="flex justify-end gap-3 pt-4">`);
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "outline",
        size: "md",
        onClick: resetToDefaults,
        disabled: unref(saving)
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Сбросить `);
          } else {
            return [
              createTextVNode(" Сбросить ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "primary",
        size: "md",
        onClick: saveSettings,
        disabled: unref(saving)
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(saving)) {
              _push2(`<span class="flex items-center gap-2"${_scopeId}><div class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"${_scopeId}></div> Сохранение... </span>`);
            } else {
              _push2(`<span${_scopeId}>Сохранить изменения</span>`);
            }
          } else {
            return [
              unref(saving) ? (openBlock(), createBlock("span", {
                key: 0,
                class: "flex items-center gap-2"
              }, [
                createVNode("div", { class: "inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" }),
                createTextVNode(" Сохранение... ")
              ])) : (openBlock(), createBlock("span", { key: 1 }, "Сохранить изменения"))
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/settings/ScheduleSettings.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$1, { __name: "SettingsScheduleSettings" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "settings",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Настройки | TailAdmin - Nuxt Tailwind CSS Dashboard"
    });
    const activeTab = ref("general");
    const tabs = [
      {
        id: "general",
        label: "Общие",
        icon: Settings
      },
      {
        id: "schedule",
        label: "Расписание",
        icon: Calendar
      },
      {
        id: "notifications",
        label: "Уведомления",
        icon: Bell
      },
      {
        id: "appearance",
        label: "Внешний вид",
        icon: Palette
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$1;
      const _component_SettingsScheduleSettings = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Настройки </h2></div><div class="flex flex-col gap-6"><div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800"><nav class="flex gap-1" aria-label="Tabs"><!--[-->`);
      ssrRenderList(tabs, (tab) => {
        _push(`<button class="${ssrRenderClass([
          "flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200",
          activeTab.value === tab.id ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        ])}"><span class="flex items-center justify-center gap-2">`);
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(tab.icon), { class: "h-5 w-5" }, null), _parent);
        _push(` ${ssrInterpolate(tab.label)}</span></button>`);
      });
      _push(`<!--]--></nav></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="p-6" style="${ssrRenderStyle(activeTab.value === "general" ? null : { display: "none" })}"><div class="space-y-6"><div><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Общие настройки </h3><div class="space-y-4"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Язык интерфейса </label><select class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"><option value="ru">Русский</option><option value="en">English</option><option value="uz">O&#39;zbek</option></select></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Часовой пояс </label><select class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"><option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option><option value="Asia/Almaty">Asia/Almaty (UTC+6)</option><option value="Europe/Moscow">Europe/Moscow (UTC+3)</option></select></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Формат даты </label><select class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"><option value="DD.MM.YYYY">ДД.ММ.ГГГГ</option><option value="MM/DD/YYYY">ММ/ДД/ГГГГ</option><option value="YYYY-MM-DD">ГГГГ-ММ-ДД</option></select></div></div></div><div class="flex justify-end gap-3 pt-4">`);
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "outline",
        size: "md"
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
        size: "md"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Сохранить изменения `);
          } else {
            return [
              createTextVNode(" Сохранить изменения ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "notifications" ? null : { display: "none" })}"><div class="space-y-6"><div><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Настройки уведомлений </h3><div class="space-y-4"><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div><h4 class="font-medium text-gray-900 dark:text-white">Email уведомления</h4><p class="text-sm text-gray-500 dark:text-gray-400">Получать уведомления на email</p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox" class="peer sr-only" checked><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div><h4 class="font-medium text-gray-900 dark:text-white">Push уведомления</h4><p class="text-sm text-gray-500 dark:text-gray-400">Получать push-уведомления в браузере</p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox" class="peer sr-only"><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div><h4 class="font-medium text-gray-900 dark:text-white">SMS уведомления</h4><p class="text-sm text-gray-500 dark:text-gray-400">Получать SMS на мобильный телефон</p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox" class="peer sr-only" checked><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div></div></div><div class="flex justify-end gap-3 pt-4">`);
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "outline",
        size: "md"
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
        size: "md"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Сохранить изменения `);
          } else {
            return [
              createTextVNode(" Сохранить изменения ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "appearance" ? null : { display: "none" })}"><div class="space-y-6"><div><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Настройки внешнего вида </h3><div class="space-y-4"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300"> Тема оформления </label><div class="grid grid-cols-3 gap-3"><label class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-gray-300 bg-white p-4 transition-all hover:border-primary focus-within:border-primary dark:border-gray-600 dark:bg-gray-900"><input type="radio" name="theme" value="light" class="peer sr-only" checked><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-md ring-2 ring-gray-200 peer-checked:ring-primary"><svg class="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div><span class="text-sm font-medium text-gray-700 peer-checked:text-primary dark:text-gray-300">Светлая</span></label><label class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-gray-300 bg-white p-4 transition-all hover:border-primary focus-within:border-primary dark:border-gray-600 dark:bg-gray-900"><input type="radio" name="theme" value="dark" class="peer sr-only"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 shadow-md ring-2 ring-gray-200 peer-checked:ring-primary"><svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg></div><span class="text-sm font-medium text-gray-700 peer-checked:text-primary dark:text-gray-300">Темная</span></label><label class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-gray-300 bg-white p-4 transition-all hover:border-primary focus-within:border-primary dark:border-gray-600 dark:bg-gray-900"><input type="radio" name="theme" value="auto" class="peer sr-only"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-white to-gray-900 shadow-md ring-2 ring-gray-200 peer-checked:ring-primary"><svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div><span class="text-sm font-medium text-gray-700 peer-checked:text-primary dark:text-gray-300">Авто</span></label></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300"> Размер шрифта </label><div class="flex gap-3"><label class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-4 py-3 transition-all hover:border-primary focus-within:border-primary dark:border-gray-600 dark:bg-gray-900"><input type="radio" name="fontSize" value="small" class="peer sr-only"><span class="text-xs font-medium text-gray-700 peer-checked:text-primary dark:text-gray-300">Маленький</span></label><label class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-4 py-3 transition-all hover:border-primary focus-within:border-primary dark:border-gray-600 dark:bg-gray-900"><input type="radio" name="fontSize" value="medium" class="peer sr-only" checked><span class="text-sm font-medium text-gray-700 peer-checked:text-primary dark:text-gray-300">Средний</span></label><label class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-4 py-3 transition-all hover:border-primary focus-within:border-primary dark:border-gray-600 dark:bg-gray-900"><input type="radio" name="fontSize" value="large" class="peer sr-only"><span class="text-base font-medium text-gray-700 peer-checked:text-primary dark:text-gray-300">Большой</span></label></div></div><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div><h4 class="font-medium text-gray-900 dark:text-white">Компактный режим</h4><p class="text-sm text-gray-500 dark:text-gray-400">Уменьшить отступы и размеры элементов</p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox" class="peer sr-only"><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div><h4 class="font-medium text-gray-900 dark:text-white">Анимации интерфейса</h4><p class="text-sm text-gray-500 dark:text-gray-400">Включить плавные переходы и анимации</p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox" class="peer sr-only" checked><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300"> Цвет боковой панели </label><div class="flex gap-3"><label class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 border-gray-300 bg-white transition-all hover:border-primary focus-within:border-primary"><input type="radio" name="sidebarColor" value="default" class="peer sr-only" checked><div class="h-8 w-8 rounded-md bg-gray-900 ring-2 ring-gray-300 peer-checked:ring-primary"></div></label><label class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 border-gray-300 bg-white transition-all hover:border-primary focus-within:border-primary"><input type="radio" name="sidebarColor" value="primary" class="peer sr-only"><div class="h-8 w-8 rounded-md bg-primary ring-2 ring-gray-300 peer-checked:ring-primary"></div></label><label class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 border-gray-300 bg-white transition-all hover:border-primary focus-within:border-primary"><input type="radio" name="sidebarColor" value="success" class="peer sr-only"><div class="h-8 w-8 rounded-md bg-success ring-2 ring-gray-300 peer-checked:ring-primary"></div></label><label class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 border-gray-300 bg-white transition-all hover:border-primary focus-within:border-primary"><input type="radio" name="sidebarColor" value="purple" class="peer sr-only"><div class="h-8 w-8 rounded-md bg-purple-600 ring-2 ring-gray-300 peer-checked:ring-primary"></div></label></div></div></div></div><div class="flex justify-end gap-3 pt-4">`);
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "outline",
        size: "md"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Сбросить `);
          } else {
            return [
              createTextVNode(" Сбросить ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "primary",
        size: "md"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Применить изменения `);
          } else {
            return [
              createTextVNode(" Применить изменения ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "schedule" ? null : { display: "none" })}">`);
      _push(ssrRenderComponent(_component_SettingsScheduleSettings, null, null, _parent));
      _push(`</div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/settings.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=settings-HLqfDWQK.mjs.map
