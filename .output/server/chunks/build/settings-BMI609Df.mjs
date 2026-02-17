import { _ as __nuxt_component_1$1 } from './Button-D9CRGwzT.mjs';
import { ref, computed, watch, mergeProps, unref, createVNode, resolveDynamicComponent, withCtx, createTextVNode, defineComponent, toDisplayString, withModifiers, createBlock, createCommentVNode, withDirectives, vModelText, openBlock, vModelCheckbox, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrRenderVNode, ssrInterpolate, ssrRenderStyle, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderComponent, ssrRenderAttr, ssrRenderTeleport } from 'vue/server-renderer';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
import { u as useScheduleSettings } from './useScheduleSettings-CjNTeZG0.mjs';
import { _ as __nuxt_component_0 } from './Modal-DQYphXo7.mjs';
import { Settings, Calendar, DoorOpen, Bell, Palette, Bot, Plus, Users, Pencil, Ban, Check, Trash2, Cpu, DollarSign, Clock, AlertTriangle, Loader2, Zap, Edit3, Star, X, Server, Cloud } from 'lucide-vue-next';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
import { u as useHead, e as useAuth, P as Permission, f as roleHasPermission, k as useState } from './server.mjs';
import './Notification-CQvvdM2O.mjs';
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

const _sfc_main$3 = /* @__PURE__ */ defineComponent({
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
      academic_hour_minutes: "40",
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
        academic_hour_minutes: settings.value.academic_hour_minutes || "40",
        short_break_minutes: settings.value.short_break_minutes || "10"
      };
    };
    const saveSettings = async () => {
      saving.value = true;
      try {
        const periodsSuccess = await updatePeriods(localPeriods.value);
        const settingsData = [
          {
            key: "snap_to_periods",
            value: localSettings.value.snap_to_periods ? "true" : "false"
          },
          {
            key: "show_period_numbers",
            value: localSettings.value.show_period_numbers ? "true" : "false"
          },
          {
            key: "period_duration_minutes",
            value: localSettings.value.period_duration_minutes
          },
          {
            key: "academic_hour_minutes",
            value: localSettings.value.academic_hour_minutes
          },
          {
            key: "short_break_minutes",
            value: localSettings.value.short_break_minutes
          }
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
        _push(`<div class="space-y-6"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><h4 class="mb-4 font-medium text-gray-900 dark:text-white"> Общие настройки </h4><div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900"><div><h5 class="text-sm font-medium text-gray-900 dark:text-white"> Привязка к парам </h5><p class="text-xs text-gray-500 dark:text-gray-400"> Привязывать события к академическим часам </p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(localSettings).snap_to_periods) ? ssrLooseContain(unref(localSettings).snap_to_periods, null) : unref(localSettings).snap_to_periods) ? " checked" : ""} class="peer sr-only"><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900"><div><h5 class="text-sm font-medium text-gray-900 dark:text-white"> Показывать номера пар </h5><p class="text-xs text-gray-500 dark:text-gray-400"> Отображать номера пар в календаре </p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(localSettings).show_period_numbers) ? ssrLooseContain(unref(localSettings).show_period_numbers, null) : unref(localSettings).show_period_numbers) ? " checked" : ""} class="peer sr-only"><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div><div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900"><label class="block text-sm font-medium text-gray-900 dark:text-white mb-2"> Длительность ак. часа (мин) </label><input type="number"${ssrRenderAttr("value", unref(localSettings).period_duration_minutes)} min="30" max="60" class="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"><p class="mt-1 text-xs text-gray-500 dark:text-gray-400"> Для отображения в расписании </p></div><div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900"><label class="block text-sm font-medium text-gray-900 dark:text-white mb-2"> Академический час для расчета (мин) </label><input type="number"${ssrRenderAttr("value", unref(localSettings).academic_hour_minutes)} min="30" max="60" class="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"><p class="mt-1 text-xs text-gray-500 dark:text-gray-400"> Для расчета учебных часов </p></div><div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900"><label class="block text-sm font-medium text-gray-900 dark:text-white mb-2"> Перерыв между парами (мин) </label><input type="number"${ssrRenderAttr("value", unref(localSettings).short_break_minutes)} min="5" max="30" class="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center justify-between mb-4"><h4 class="font-medium text-gray-900 dark:text-white"> Академические пары </h4><span class="text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(localPeriods).length)} пар </span></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-gray-200 dark:border-gray-600"><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"> № </th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"> Начало </th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"> Окончание </th><th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"> После перерыва </th></tr></thead><tbody><!--[-->`);
        ssrRenderList(unref(localPeriods), (period) => {
          _push(`<tr class="${ssrRenderClass([{
            "bg-yellow-50 dark:bg-yellow-900/20": period.isAfterBreak
          }, "border-b border-gray-100 dark:border-gray-700"])}"><td class="px-3 py-2"><span class="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded font-medium text-xs">${ssrInterpolate(period.periodNumber)}</span></td><td class="px-3 py-2"><input type="time"${ssrRenderAttr("value", period.startTime)} class="rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"></td><td class="px-3 py-2"><input type="time"${ssrRenderAttr("value", period.endTime)} class="rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"></td><td class="px-3 py-2 text-center"><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(period.isAfterBreak) ? ssrLooseContain(period.isAfterBreak, null) : period.isAfterBreak) ? " checked" : ""} class="peer sr-only"><div class="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-warning peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-warning/20 dark:border-gray-600 dark:bg-gray-700"></div></label></td></tr>`);
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
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/settings/ScheduleSettings.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$3, { __name: "SettingsScheduleSettings" });
const _sfc_main$2 = {
  __name: "SettingsClassroomSettings",
  __ssrInlineRender: true,
  setup(__props) {
    const notification = useNotification();
    const { authFetch } = useAuthFetch();
    const loading = ref(false);
    const saving = ref(false);
    const classrooms = ref([]);
    const isModalOpen = ref(false);
    const editingClassroom = ref(null);
    const form = ref({
      name: "",
      capacity: 0,
      description: "",
      isActive: true
    });
    const loadClassrooms = async () => {
      loading.value = true;
      try {
        const response = await authFetch("/api/classrooms?activeOnly=false");
        if (response.success) {
          classrooms.value = response.classrooms;
        }
      } catch (error) {
        console.error("Error loading classrooms:", error);
        notification.show({
          type: "error",
          title: "Ошибка",
          message: "Не удалось загрузить список аудиторий"
        });
      } finally {
        loading.value = false;
      }
    };
    const openCreateModal = () => {
      editingClassroom.value = null;
      form.value = {
        name: "",
        capacity: 0,
        description: "",
        isActive: true
      };
      isModalOpen.value = true;
    };
    const closeModal = () => {
      isModalOpen.value = false;
      editingClassroom.value = null;
    };
    const saveClassroom = async () => {
      saving.value = true;
      try {
        if (editingClassroom.value) {
          const response = await authFetch(`/api/classrooms/${editingClassroom.value.id}`, {
            method: "PUT",
            body: form.value
          });
          if (response.success) {
            notification.show({
              type: "success",
              title: "Успешно",
              message: "Аудитория обновлена"
            });
            await loadClassrooms();
            closeModal();
          }
        } else {
          const response = await authFetch("/api/classrooms", {
            method: "POST",
            body: form.value
          });
          if (response.success) {
            notification.show({
              type: "success",
              title: "Успешно",
              message: "Аудитория создана"
            });
            await loadClassrooms();
            closeModal();
          }
        }
      } catch (error) {
        console.error("Error saving classroom:", error);
        notification.show({
          type: "error",
          title: "Ошибка",
          message: editingClassroom.value ? "Не удалось обновить аудиторию" : "Не удалось создать аудиторию"
        });
      } finally {
        saving.value = false;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$1;
      const _component_UiModal = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div><div class="mb-4 flex items-center justify-between"><div><h3 class="text-xl font-semibold text-gray-900 dark:text-white"> Управление аудиториями </h3><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Настройте список доступных аудиторий для проведения занятий </p></div>`);
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "primary",
        size: "md",
        onClick: openCreateModal
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(Plus), { class: "mr-2 h-4 w-4" }, null, _parent2, _scopeId));
            _push2(` Добавить аудиторию `);
          } else {
            return [
              createVNode(unref(Plus), { class: "mr-2 h-4 w-4" }),
              createTextVNode(" Добавить аудиторию ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (loading.value) {
        _push(`<div class="flex items-center justify-center py-12"><div class="flex items-center gap-3"><div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div><span class="text-gray-600 dark:text-gray-400">Загрузка аудиторий...</span></div></div>`);
      } else if (classrooms.value.length > 0) {
        _push(`<div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-boxdark"><div class="overflow-x-auto"><table class="w-full"><thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"><tr><th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"> Название </th><th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"> Вместимость </th><th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"> Описание </th><th class="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"> Статус </th><th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"> Действия </th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
        ssrRenderList(classrooms.value, (classroom) => {
          _push(`<tr class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"><td class="px-4 py-3"><div class="flex items-center gap-2">`);
          _push(ssrRenderComponent(unref(DoorOpen), { class: "h-4 w-4 text-gray-400" }, null, _parent));
          _push(`<span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(classroom.name)}</span></div></td><td class="px-4 py-3"><div class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">`);
          _push(ssrRenderComponent(unref(Users), { class: "h-4 w-4" }, null, _parent));
          _push(`<span>${ssrInterpolate(classroom.capacity || 0)} мест</span></div></td><td class="px-4 py-3"><span class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(classroom.description || "—")}</span></td><td class="px-4 py-3 text-center"><span class="${ssrRenderClass([
            "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
            classroom.isActive ? "bg-success/10 text-success" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
          ])}">${ssrInterpolate(classroom.isActive ? "Активна" : "Неактивна")}</span></td><td class="px-4 py-3"><div class="flex items-center justify-end gap-2"><button class="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-700" title="Редактировать">`);
          _push(ssrRenderComponent(unref(Pencil), { class: "h-4 w-4" }, null, _parent));
          _push(`</button><button class="${ssrRenderClass([
            classroom.isActive ? "text-gray-600 hover:bg-gray-100 hover:text-warning dark:text-gray-400 dark:hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100 hover:text-success dark:text-gray-400 dark:hover:bg-gray-700",
            "rounded p-1.5 transition-colors"
          ])}"${ssrRenderAttr("title", classroom.isActive ? "Деактивировать" : "Активировать")}>`);
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(classroom.isActive ? unref(Ban) : unref(Check)), { class: "h-4 w-4" }, null), _parent);
          _push(`</button><button class="rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-danger dark:text-gray-400 dark:hover:bg-gray-700" title="Удалить">`);
          _push(ssrRenderComponent(unref(Trash2), { class: "h-4 w-4" }, null, _parent));
          _push(`</button></div></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div></div>`);
      } else {
        _push(`<div class="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">`);
        _push(ssrRenderComponent(unref(DoorOpen), { class: "mx-auto h-12 w-12 text-gray-400" }, null, _parent));
        _push(`<h4 class="mt-4 text-lg font-medium text-gray-900 dark:text-white"> Нет аудиторий </h4><p class="mt-2 text-sm text-gray-600 dark:text-gray-400"> Добавьте первую аудиторию для проведения занятий </p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          size: "md",
          class: "mt-4",
          onClick: openCreateModal
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(unref(Plus), { class: "mr-2 h-4 w-4" }, null, _parent2, _scopeId));
              _push2(` Добавить аудиторию `);
            } else {
              return [
                createVNode(unref(Plus), { class: "mr-2 h-4 w-4" }),
                createTextVNode(" Добавить аудиторию ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": isModalOpen.value,
        title: editingClassroom.value ? "Редактирование аудитории" : "Новая аудитория",
        onClose: closeModal
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-4"${_scopeId}><div${_scopeId}><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}> Название аудитории <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", form.value.name)} type="text" required placeholder="Например: Аудитория 101" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"${_scopeId}></div><div${_scopeId}><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}> Вместимость (количество мест) </label><input${ssrRenderAttr("value", form.value.capacity)} type="number" min="0" placeholder="0" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"${_scopeId}></div><div${_scopeId}><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}> Описание </label><textarea rows="3" placeholder="Дополнительная информация об аудитории" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(form.value.description)}</textarea></div>`);
            if (editingClassroom.value) {
              _push2(`<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800/50"${_scopeId}><div${_scopeId}><h5 class="text-sm font-medium text-gray-900 dark:text-white"${_scopeId}>Активная аудитория</h5><p class="text-xs text-gray-500 dark:text-gray-400"${_scopeId}>Доступна для использования в расписании</p></div><label class="relative inline-flex cursor-pointer items-center"${_scopeId}><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(form.value.isActive) ? ssrLooseContain(form.value.isActive, null) : form.value.isActive) ? " checked" : ""} class="peer sr-only"${_scopeId}><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"${_scopeId}></div></label></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="flex justify-end gap-3 pt-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              size: "md",
              type: "button",
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
              variant: "primary",
              size: "md",
              type: "submit",
              loading: saving.value
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`${ssrInterpolate(editingClassroom.value ? "Сохранить" : "Создать")}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(editingClassroom.value ? "Сохранить" : "Создать"), 1)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(saveClassroom, ["prevent"]),
                class: "space-y-4"
              }, [
                createVNode("div", null, [
                  createVNode("label", { class: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300" }, [
                    createTextVNode(" Название аудитории "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => form.value.name = $event,
                    type: "text",
                    required: "",
                    placeholder: "Например: Аудитория 101",
                    class: "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, form.value.name]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300" }, " Вместимость (количество мест) "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => form.value.capacity = $event,
                    type: "number",
                    min: "0",
                    placeholder: "0",
                    class: "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [
                      vModelText,
                      form.value.capacity,
                      void 0,
                      { number: true }
                    ]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300" }, " Описание "),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => form.value.description = $event,
                    rows: "3",
                    placeholder: "Дополнительная информация об аудитории",
                    class: "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, form.value.description]
                  ])
                ]),
                editingClassroom.value ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800/50"
                }, [
                  createVNode("div", null, [
                    createVNode("h5", { class: "text-sm font-medium text-gray-900 dark:text-white" }, "Активная аудитория"),
                    createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, "Доступна для использования в расписании")
                  ]),
                  createVNode("label", { class: "relative inline-flex cursor-pointer items-center" }, [
                    withDirectives(createVNode("input", {
                      type: "checkbox",
                      "onUpdate:modelValue": ($event) => form.value.isActive = $event,
                      class: "peer sr-only"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelCheckbox, form.value.isActive]
                    ]),
                    createVNode("div", { class: "peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700" })
                  ])
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "flex justify-end gap-3 pt-4" }, [
                  createVNode(_component_UiButton, {
                    variant: "outline",
                    size: "md",
                    type: "button",
                    onClick: closeModal
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }),
                  createVNode(_component_UiButton, {
                    variant: "primary",
                    size: "md",
                    type: "submit",
                    loading: saving.value
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(editingClassroom.value ? "Сохранить" : "Создать"), 1)
                    ]),
                    _: 1
                  }, 8, ["loading"])
                ])
              ], 32)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/settings/ClassroomSettings.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "AISettings",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(true);
    const saving = ref(false);
    const testingId = ref(null);
    const settings = ref([]);
    const stats = ref(null);
    const showAddModal = ref(false);
    const editingSettings = ref(null);
    const errorMessage = ref(null);
    const form = ref({
      provider: "openrouter",
      apiKeyName: "",
      apiKey: "",
      baseUrl: "",
      visionModel: "openai/gpt-4o",
      textModel: "openai/gpt-3.5-turbo",
      maxTokens: 1500,
      temperature: 0.1,
      dailyBudgetUsd: null,
      monthlyBudgetUsd: null,
      isActive: true,
      isDefault: false
    });
    const isModalOpen = computed(
      () => showAddModal.value || !!editingSettings.value
    );
    const maxTokensUsage = computed(() => {
      if (!stats.value?.usageByModel?.length) return 1;
      return Math.max(...stats.value.usageByModel.map((m) => m.totalTokens));
    });
    const formatNumber = (num) => {
      if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
      if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
      return num.toString();
    };
    const formatDate = (date) => {
      return new Date(date).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const getProviderIcon = (provider) => {
      switch (provider) {
        case "openai":
          return Bot;
        case "openrouter":
          return Cloud;
        case "anthropic":
          return Cpu;
        default:
          return Server;
      }
    };
    const getProviderColor = (provider) => {
      switch (provider) {
        case "openai":
          return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
        case "openrouter":
          return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
        case "anthropic":
          return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400";
        default:
          return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
      }
    };
    const getErrorTypeLabel = (type) => {
      const labels = {
        rate_limit: "Превышен лимит запросов",
        insufficient_credits: "Недостаточно кредитов",
        invalid_key: "Неверный API ключ",
        model_error: "Ошибка модели",
        network: "Сетевая ошибка",
        other: "Другая ошибка"
      };
      return labels[type] || type;
    };
    const closeModal = () => {
      showAddModal.value = false;
      editingSettings.value = null;
      errorMessage.value = null;
      resetForm();
    };
    const resetForm = () => {
      form.value = {
        provider: "openrouter",
        apiKeyName: "",
        apiKey: "",
        baseUrl: "",
        visionModel: "openai/gpt-4o",
        textModel: "openai/gpt-3.5-turbo",
        maxTokens: 1500,
        temperature: 0.1,
        dailyBudgetUsd: null,
        monthlyBudgetUsd: null,
        isActive: true,
        isDefault: false
      };
    };
    watch(isModalOpen, (isOpen) => {
      if (isOpen) {
        (void 0).body.style.overflow = "hidden";
        (void 0).addEventListener("keydown", handleEscape);
      } else {
        (void 0).body.style.overflow = "";
        (void 0).removeEventListener("keydown", handleEscape);
      }
    });
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Настройки AI </h3><p class="mb-6 text-sm text-gray-600 dark:text-gray-400"> Управление API ключами, провайдерами и лимитами использования искусственного интеллекта для обработки сертификатов. </p>`);
      if (loading.value) {
        _push(`<div class="flex items-center justify-center p-8"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div><span class="ml-3 text-gray-600 dark:text-gray-400">Загрузка настроек...</span></div>`);
      } else {
        _push(`<div class="space-y-6"><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><div class="rounded-lg border border-gray-200 bg-linear-to-br from-primary/5 to-primary/10 p-4 dark:border-gray-700 dark:from-primary/10 dark:to-primary/20"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">`);
        _push(ssrRenderComponent(unref(Cpu), { class: "h-5 w-5 text-primary" }, null, _parent));
        _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400"> Всего токенов </p><p class="text-xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(formatNumber(stats.value?.totalTokensUsed || 0))}</p></div></div></div><div class="rounded-lg border border-gray-200 bg-linear-to-br from-success/5 to-success/10 p-4 dark:border-gray-700 dark:from-success/10 dark:to-success/20"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">`);
        _push(ssrRenderComponent(unref(DollarSign), { class: "h-5 w-5 text-success" }, null, _parent));
        _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400"> Общая стоимость </p><p class="text-xl font-bold text-gray-900 dark:text-white"> $${ssrInterpolate((stats.value?.totalCostUsd || 0).toFixed(4))}</p></div></div></div><div class="rounded-lg border border-gray-200 bg-linear-to-br from-warning/5 to-warning/10 p-4 dark:border-gray-700 dark:from-warning/10 dark:to-warning/20"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">`);
        _push(ssrRenderComponent(unref(Clock), { class: "h-5 w-5 text-warning" }, null, _parent));
        _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400">Сегодня</p><p class="text-xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(formatNumber(stats.value?.tokensUsedToday || 0))}</p></div></div></div><div class="rounded-lg border border-gray-200 bg-linear-to-br from-danger/5 to-danger/10 p-4 dark:border-gray-700 dark:from-danger/10 dark:to-danger/20"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/20">`);
        _push(ssrRenderComponent(unref(AlertTriangle), { class: "h-5 w-5 text-danger" }, null, _parent));
        _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400"> Ошибок (24ч) </p><p class="text-xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(stats.value?.errorCount24h || 0)}</p></div></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center justify-between mb-4"><h4 class="font-medium text-gray-900 dark:text-white"> Конфигурации AI провайдеров </h4><button class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90">`);
        _push(ssrRenderComponent(unref(Plus), { class: "h-4 w-4" }, null, _parent));
        _push(` Добавить </button></div>`);
        if (settings.value.length > 0) {
          _push(`<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-gray-200 dark:border-gray-600"><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"> Имя / Провайдер </th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"> API Ключ </th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"> Модели </th><th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"> Токены </th><th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"> Статус </th><th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"> Действия </th></tr></thead><tbody><!--[-->`);
          ssrRenderList(settings.value, (setting) => {
            _push(`<tr class="${ssrRenderClass([{
              "bg-primary/5 dark:bg-primary/10": setting.isDefault
            }, "border-b border-gray-100 dark:border-gray-700"])}"><td class="px-3 py-3"><div class="flex items-center gap-2"><div class="${ssrRenderClass([getProviderColor(setting.provider), "flex h-8 w-8 items-center justify-center rounded-lg"])}">`);
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(getProviderIcon(setting.provider)), { class: "h-4 w-4" }, null), _parent);
            _push(`</div><div><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(setting.apiKeyName || setting.provider)} `);
            if (setting.isDefault) {
              _push(`<span class="ml-2 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary"> По умолчанию </span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><p class="text-xs text-gray-500 dark:text-gray-400 capitalize">${ssrInterpolate(setting.provider)}</p></div></div></td><td class="px-3 py-3"><code class="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">${ssrInterpolate(setting.apiKeyMasked)}</code></td><td class="px-3 py-3"><div class="text-xs"><p><span class="text-gray-500">Vision:</span> ${ssrInterpolate(setting.visionModel)}</p><p><span class="text-gray-500">Text:</span> ${ssrInterpolate(setting.textModel)}</p></div></td><td class="px-3 py-3 text-center"><div class="text-xs"><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(formatNumber(setting.totalTokensUsed))}</p><p class="text-gray-500"> $${ssrInterpolate(setting.totalCostUsd.toFixed(4))}</p></div></td><td class="px-3 py-3 text-center"><span class="${ssrRenderClass([
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              setting.isActive ? "bg-success/20 text-success" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            ])}">${ssrInterpolate(setting.isActive ? "Активен" : "Отключен")}</span>`);
            if (setting.lastErrorAt) {
              _push(`<p class="mt-1 text-xs text-danger"> Последняя ошибка: ${ssrInterpolate(formatDate(setting.lastErrorAt))}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</td><td class="px-3 py-3 text-center"><div class="flex items-center justify-center gap-1"><button${ssrIncludeBooleanAttr(testingId.value === setting.id) ? " disabled" : ""} class="rounded p-1.5 text-primary hover:bg-primary/10 transition" title="Тестировать подключение">`);
            if (testingId.value === setting.id) {
              _push(ssrRenderComponent(unref(Loader2), { class: "h-4 w-4 animate-spin" }, null, _parent));
            } else {
              _push(ssrRenderComponent(unref(Zap), { class: "h-4 w-4" }, null, _parent));
            }
            _push(`</button><button class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Редактировать">`);
            _push(ssrRenderComponent(unref(Edit3), { class: "h-4 w-4" }, null, _parent));
            _push(`</button>`);
            if (!setting.isDefault) {
              _push(`<button class="rounded p-1.5 text-warning hover:bg-warning/10 transition" title="Сделать по умолчанию">`);
              _push(ssrRenderComponent(unref(Star), { class: "h-4 w-4" }, null, _parent));
              _push(`</button>`);
            } else {
              _push(`<!---->`);
            }
            if (settings.value.length > 1) {
              _push(`<button class="rounded p-1.5 text-danger hover:bg-danger/10 transition" title="Удалить">`);
              _push(ssrRenderComponent(unref(Trash2), { class: "h-4 w-4" }, null, _parent));
              _push(`</button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></td></tr>`);
          });
          _push(`<!--]--></tbody></table></div>`);
        } else {
          _push(`<div class="flex flex-col items-center justify-center py-12 text-center"><div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-4">`);
          _push(ssrRenderComponent(unref(Settings), { class: "h-8 w-8 text-gray-400" }, null, _parent));
          _push(`</div><h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2"> Нет настроек AI </h4><p class="text-sm text-gray-500 dark:text-gray-400 mb-4"> Добавьте API ключ для начала работы с AI функциями </p><button class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90">`);
          _push(ssrRenderComponent(unref(Plus), { class: "h-4 w-4" }, null, _parent));
          _push(` Добавить настройку </button></div>`);
        }
        _push(`</div>`);
        if (stats.value?.recentErrors && stats.value.recentErrors.length > 0) {
          _push(`<div class="rounded-lg border border-danger/30 bg-danger/5 p-4 dark:border-danger/30"><h4 class="flex items-center gap-2 font-medium text-danger mb-3">`);
          _push(ssrRenderComponent(unref(AlertTriangle), { class: "h-5 w-5" }, null, _parent));
          _push(` Недавние ошибки API </h4><div class="space-y-2"><!--[-->`);
          ssrRenderList(stats.value.recentErrors.slice(0, 5), (error) => {
            _push(`<div class="rounded-lg bg-white p-3 dark:bg-gray-800 border border-danger/20"><div class="flex items-start justify-between"><div><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(getErrorTypeLabel(error.errorType))} <span class="text-xs text-gray-500 ml-2">${ssrInterpolate(error.errorCode)}</span></p><p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${ssrInterpolate(error.errorMessage)}</p></div><span class="text-xs text-gray-500">${ssrInterpolate(formatDate(error.createdAt))}</span></div></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (stats.value?.usageByModel && stats.value.usageByModel.length > 0) {
          _push(`<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><h4 class="font-medium text-gray-900 dark:text-white mb-4"> Использование по моделям (30 дней) </h4><div class="space-y-3"><!--[-->`);
          ssrRenderList(stats.value.usageByModel, (model) => {
            _push(`<div class="relative"><div class="flex items-center justify-between mb-1"><span class="text-sm font-medium text-gray-700 dark:text-gray-300">${ssrInterpolate(model.model)}</span><span class="text-xs text-gray-500">${ssrInterpolate(formatNumber(model.totalTokens))} токенов · $${ssrInterpolate(model.totalCost.toFixed(4))}</span></div><div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700"><div class="h-2 rounded-full bg-primary transition-all" style="${ssrRenderStyle({
              width: `${model.totalTokens / maxTokensUsage.value * 100}%`
            })}"></div></div></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (isModalOpen.value) {
          _push2(`<div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"><div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-boxdark mx-auto max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between mb-6"><h3 class="text-xl font-semibold text-gray-900 dark:text-white">${ssrInterpolate(editingSettings.value ? "Редактировать настройку AI" : "Добавить настройку AI")}</h3><button class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700">`);
          _push2(ssrRenderComponent(unref(X), { class: "h-5 w-5" }, null, _parent));
          _push2(`</button></div>`);
          if (errorMessage.value) {
            _push2(`<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800"><div class="flex items-center gap-2">`);
            _push2(ssrRenderComponent(unref(AlertTriangle), { class: "h-4 w-4 shrink-0" }, null, _parent));
            _push2(`<span>${ssrInterpolate(errorMessage.value)}</span></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`<form class="space-y-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Провайдер * </label><select required class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"><option value="openrouter"${ssrIncludeBooleanAttr(Array.isArray(form.value.provider) ? ssrLooseContain(form.value.provider, "openrouter") : ssrLooseEqual(form.value.provider, "openrouter")) ? " selected" : ""}>OpenRouter</option><option value="openai"${ssrIncludeBooleanAttr(Array.isArray(form.value.provider) ? ssrLooseContain(form.value.provider, "openai") : ssrLooseEqual(form.value.provider, "openai")) ? " selected" : ""}>OpenAI</option><option value="anthropic"${ssrIncludeBooleanAttr(Array.isArray(form.value.provider) ? ssrLooseContain(form.value.provider, "anthropic") : ssrLooseEqual(form.value.provider, "anthropic")) ? " selected" : ""}>Anthropic</option><option value="custom"${ssrIncludeBooleanAttr(Array.isArray(form.value.provider) ? ssrLooseContain(form.value.provider, "custom") : ssrLooseEqual(form.value.provider, "custom")) ? " selected" : ""}>Custom</option></select></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Название (опционально) </label><input${ssrRenderAttr("value", form.value.apiKeyName)} type="text" placeholder="Например: Production Key" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> API Ключ ${ssrInterpolate(editingSettings.value ? "(оставьте пустым, чтобы не менять)" : "*")}</label><input${ssrRenderAttr("value", form.value.apiKey)} type="text"${ssrRenderAttr("placeholder", editingSettings.value ? "(Ключ сохранен)" : "sk-...")}${ssrIncludeBooleanAttr(!editingSettings.value) ? " required" : ""} class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div>`);
          if (form.value.provider === "custom") {
            _push2(`<div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Base URL * </label><input${ssrRenderAttr("value", form.value.baseUrl)} type="url" placeholder="https://api.example.com/v1" required class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`<div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Vision Model </label><input${ssrRenderAttr("value", form.value.visionModel)} type="text" placeholder="openai/gpt-4o" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Text Model </label><input${ssrRenderAttr("value", form.value.textModel)} type="text" placeholder="openai/gpt-3.5-turbo" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div></div><div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Max Tokens </label><input${ssrRenderAttr("value", form.value.maxTokens)} type="number" min="100" max="16000" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Temperature </label><input${ssrRenderAttr("value", form.value.temperature)} type="number" min="0" max="2" step="0.1" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div></div><div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Дневной лимит ($) </label><input${ssrRenderAttr("value", form.value.dailyBudgetUsd)} type="number" min="0" step="0.01" placeholder="Без лимита" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Месячный лимит ($) </label><input${ssrRenderAttr("value", form.value.monthlyBudgetUsd)} type="number" min="0" step="0.01" placeholder="Без лимита" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div></div><div class="flex items-center gap-6"><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(form.value.isActive) ? ssrLooseContain(form.value.isActive, null) : form.value.isActive) ? " checked" : ""} class="peer sr-only"><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div><span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Активен</span></label><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(form.value.isDefault) ? ssrLooseContain(form.value.isDefault, null) : form.value.isDefault) ? " checked" : ""} class="peer sr-only"><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-warning peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-warning/20 dark:border-gray-600 dark:bg-gray-700"></div><span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">По умолчанию</span></label></div><div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"><button type="button" class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"> Отмена </button><button type="submit"${ssrIncludeBooleanAttr(saving.value) ? " disabled" : ""} class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50">`);
          if (saving.value) {
            _push2(ssrRenderComponent(unref(Loader2), { class: "h-4 w-4 animate-spin" }, null, _parent));
          } else {
            _push2(`<!---->`);
          }
          _push2(` ${ssrInterpolate(editingSettings.value ? "Сохранить" : "Создать")}</button></div></form></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/settings/AISettings.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$1, { __name: "SettingsAISettings" });
const useUserSettings = () => {
  const settings = useState("user-settings", () => null);
  const loading = useState("user-settings-loading", () => false);
  const { authFetch } = useAuthFetch();
  const fetchSettings = async () => {
    loading.value = true;
    try {
      const data = await authFetch("/api/profile/settings");
      if (data) {
        settings.value = data;
        applySettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      useNotification().error("Не удалось загрузить настройки");
    } finally {
      loading.value = false;
    }
  };
  const updateSettings = async (newSettings) => {
    loading.value = true;
    try {
      const data = await authFetch("/api/profile/settings", {
        method: "PUT",
        body: newSettings
      });
      if (data) {
        settings.value = data;
        applySettings(data);
        useNotification().success("Настройки сохранены");
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      useNotification().error("Ошибка при сохранении настроек");
    } finally {
      loading.value = false;
    }
  };
  const applySettings = (s) => {
    return;
  };
  return {
    settings,
    loading,
    fetchSettings,
    updateSettings
  };
};
const _sfc_main = {
  __name: "settings",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Настройки | TailAdmin - Nuxt Tailwind CSS Dashboard"
    });
    const { settings, loading, updateSettings } = useUserSettings();
    const form = ref({
      theme: "light",
      language: "ru",
      notifications_email: true,
      notifications_push: true,
      notifications_sms: false,
      compact_mode: false,
      font_size: "medium",
      sidebar_color: "default"
    });
    const activeTab = ref("general");
    const { user } = useAuth();
    const tabs = computed(() => {
      const allTabs = [
        {
          id: "general",
          label: "Общие",
          icon: Settings
        },
        {
          id: "schedule",
          label: "Расписание",
          icon: Calendar,
          permission: Permission.SETTINGS_MANAGE
        },
        {
          id: "classrooms",
          label: "Аудитории",
          icon: DoorOpen,
          permission: Permission.SETTINGS_MANAGE
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
        },
        {
          id: "ai",
          label: "AI Настройки",
          icon: Bot,
          permission: Permission.SETTINGS_MANAGE
        }
      ];
      return allTabs.filter((tab) => {
        if (tab.permission) {
          return user.value && roleHasPermission(user.value.role, tab.permission);
        }
        return true;
      });
    });
    watch(
      settings,
      (newSettings) => {
        if (newSettings) {
          form.value = { ...newSettings };
        }
      },
      { immediate: true }
    );
    const saveSettings = async () => {
      await updateSettings(form.value);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$1;
      const _component_SettingsScheduleSettings = __nuxt_component_1;
      const _component_SettingsClassroomSettings = _sfc_main$2;
      const _component_SettingsAISettings = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Настройки </h2></div>`);
      if (unref(loading) && !form.value) {
        _push(`<div class="flex justify-center p-8"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else {
        _push(`<div class="flex flex-col gap-6"><div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800"><nav class="flex gap-1" aria-label="Tabs"><!--[-->`);
        ssrRenderList(unref(tabs), (tab) => {
          _push(`<button class="${ssrRenderClass([
            "flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200",
            activeTab.value === tab.id ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          ])}"><span class="flex items-center justify-center gap-2">`);
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(tab.icon), { class: "h-5 w-5" }, null), _parent);
          _push(` ${ssrInterpolate(tab.label)}</span></button>`);
        });
        _push(`<!--]--></nav></div><div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark"><div class="p-6" style="${ssrRenderStyle(activeTab.value === "general" ? null : { display: "none" })}"><div class="space-y-6"><div><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Общие настройки </h3><div class="space-y-4"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Язык интерфейса </label><select class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"><option value="ru"${ssrIncludeBooleanAttr(Array.isArray(form.value.language) ? ssrLooseContain(form.value.language, "ru") : ssrLooseEqual(form.value.language, "ru")) ? " selected" : ""}>Русский</option><option value="en"${ssrIncludeBooleanAttr(Array.isArray(form.value.language) ? ssrLooseContain(form.value.language, "en") : ssrLooseEqual(form.value.language, "en")) ? " selected" : ""}>English</option><option value="uz"${ssrIncludeBooleanAttr(Array.isArray(form.value.language) ? ssrLooseContain(form.value.language, "uz") : ssrLooseEqual(form.value.language, "uz")) ? " selected" : ""}>O&#39;zbek</option></select></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50 opacity-50 cursor-not-allowed"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Часовой пояс (недоступно) </label><select disabled class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all dark:border-gray-600 dark:bg-gray-900 dark:text-white"><option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option></select></div></div></div><div class="flex justify-end gap-3 pt-4">`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          size: "md",
          loading: unref(loading),
          onClick: saveSettings
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
        _push(`</div></div></div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "notifications" ? null : { display: "none" })}"><div class="space-y-6"><div><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Настройки уведомлений </h3><div class="space-y-4"><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div><h4 class="font-medium text-gray-900 dark:text-white"> Email уведомления </h4><p class="text-sm text-gray-500 dark:text-gray-400"> Получать уведомления на email </p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(form.value.notifications_email) ? ssrLooseContain(form.value.notifications_email, null) : form.value.notifications_email) ? " checked" : ""} class="peer sr-only"><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div><h4 class="font-medium text-gray-900 dark:text-white"> Push уведомления </h4><p class="text-sm text-gray-500 dark:text-gray-400"> Получать push-уведомления в браузере </p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(form.value.notifications_push) ? ssrLooseContain(form.value.notifications_push, null) : form.value.notifications_push) ? " checked" : ""} class="peer sr-only"><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div><h4 class="font-medium text-gray-900 dark:text-white"> SMS уведомления </h4><p class="text-sm text-gray-500 dark:text-gray-400"> Получать SMS на мобильный телефон </p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(form.value.notifications_sms) ? ssrLooseContain(form.value.notifications_sms, null) : form.value.notifications_sms) ? " checked" : ""} class="peer sr-only"><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div></div></div><div class="flex justify-end gap-3 pt-4">`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          size: "md",
          loading: unref(loading),
          onClick: saveSettings
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
        _push(`</div></div></div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "appearance" ? null : { display: "none" })}"><div class="space-y-6"><div><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Настройки внешнего вида </h3><div class="space-y-4"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300"> Тема оформления </label><div class="grid grid-cols-3 gap-3"><label class="${ssrRenderClass([
          form.value.theme === "light" ? "border-primary ring-2 ring-primary/20" : "border-gray-300 dark:border-gray-600",
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 bg-white p-4 transition-all hover:border-primary focus-within:border-primary dark:bg-gray-900"
        ])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(form.value.theme, "light")) ? " checked" : ""} value="light" class="peer sr-only"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-gray-200"><svg class="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div><span class="text-sm font-medium text-gray-700 dark:text-gray-300">Светлая</span></label><label class="${ssrRenderClass([
          form.value.theme === "dark" ? "border-primary ring-2 ring-primary/20" : "border-gray-300 dark:border-gray-600",
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 bg-white p-4 transition-all hover:border-primary focus-within:border-primary dark:bg-gray-900"
        ])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(form.value.theme, "dark")) ? " checked" : ""} value="dark" class="peer sr-only"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 shadow-md ring-1 ring-gray-600"><svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg></div><span class="text-sm font-medium text-gray-700 dark:text-gray-300">Темная</span></label><label class="${ssrRenderClass([
          form.value.theme === "auto" ? "border-primary ring-2 ring-primary/20" : "border-gray-300 dark:border-gray-600",
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 bg-white p-4 transition-all hover:border-primary focus-within:border-primary dark:bg-gray-900"
        ])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(form.value.theme, "auto")) ? " checked" : ""} value="auto" class="peer sr-only"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-white to-gray-900 shadow-md ring-1 ring-gray-400"><svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div><span class="text-sm font-medium text-gray-700 dark:text-gray-300">Авто</span></label></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300"> Размер шрифта </label><div class="flex gap-3"><label class="${ssrRenderClass([
          form.value.font_size === "small" ? "border-primary ring-2 ring-primary/20" : "border-gray-300 dark:border-gray-600",
          "flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-3 transition-all hover:border-primary focus-within:border-primary dark:bg-gray-900"
        ])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(form.value.font_size, "small")) ? " checked" : ""} value="small" class="peer sr-only"><span class="text-xs font-medium text-gray-700 dark:text-gray-300">Маленький</span></label><label class="${ssrRenderClass([
          form.value.font_size === "medium" ? "border-primary ring-2 ring-primary/20" : "border-gray-300 dark:border-gray-600",
          "flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-3 transition-all hover:border-primary focus-within:border-primary dark:bg-gray-900"
        ])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(form.value.font_size, "medium")) ? " checked" : ""} value="medium" class="peer sr-only"><span class="text-sm font-medium text-gray-700 dark:text-gray-300">Средний</span></label><label class="${ssrRenderClass([
          form.value.font_size === "large" ? "border-primary ring-2 ring-primary/20" : "border-gray-300 dark:border-gray-600",
          "flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-3 transition-all hover:border-primary focus-within:border-primary dark:bg-gray-900"
        ])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(form.value.font_size, "large")) ? " checked" : ""} value="large" class="peer sr-only"><span class="text-base font-medium text-gray-700 dark:text-gray-300">Большой</span></label></div></div><div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div><h4 class="font-medium text-gray-900 dark:text-white"> Компактный режим </h4><p class="text-sm text-gray-500 dark:text-gray-400"> Уменьшить отступы и размеры элементов </p></div><label class="relative inline-flex cursor-pointer items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(form.value.compact_mode) ? ssrLooseContain(form.value.compact_mode, null) : form.value.compact_mode) ? " checked" : ""} class="peer sr-only"><div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div></label></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300"> Цвет боковой панели </label><div class="flex gap-3"><label class="${ssrRenderClass([
          form.value.sidebar_color === "default" ? "border-primary ring-2 ring-primary/20" : "border-gray-300",
          "flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 bg-white transition-all hover:border-primary focus-within:border-primary"
        ])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(form.value.sidebar_color, "default")) ? " checked" : ""} value="default" class="peer sr-only"><div class="h-8 w-8 rounded-md bg-gray-900 ring-2 ring-gray-300 peer-checked:ring-primary"></div></label><label class="${ssrRenderClass([
          form.value.sidebar_color === "primary" ? "border-primary ring-2 ring-primary/20" : "border-gray-300",
          "flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 bg-white transition-all hover:border-primary focus-within:border-primary"
        ])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(form.value.sidebar_color, "primary")) ? " checked" : ""} value="primary" class="peer sr-only"><div class="h-8 w-8 rounded-md bg-primary ring-2 ring-gray-300 peer-checked:ring-primary"></div></label><label class="${ssrRenderClass([
          form.value.sidebar_color === "success" ? "border-primary ring-2 ring-primary/20" : "border-gray-300",
          "flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 bg-white transition-all hover:border-primary focus-within:border-primary"
        ])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(form.value.sidebar_color, "success")) ? " checked" : ""} value="success" class="peer sr-only"><div class="h-8 w-8 rounded-md bg-success ring-2 ring-gray-300 peer-checked:ring-primary"></div></label><label class="${ssrRenderClass([
          form.value.sidebar_color === "purple" ? "border-primary ring-2 ring-primary/20" : "border-gray-300",
          "flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 bg-white transition-all hover:border-primary focus-within:border-primary"
        ])}"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(form.value.sidebar_color, "purple")) ? " checked" : ""} value="purple" class="peer sr-only"><div class="h-8 w-8 rounded-md bg-purple-600 ring-2 ring-gray-300 peer-checked:ring-primary"></div></label></div></div></div></div><div class="flex justify-end gap-3 pt-4">`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          size: "md",
          loading: unref(loading),
          onClick: saveSettings
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
        _push(`</div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "classrooms" ? null : { display: "none" })}">`);
        _push(ssrRenderComponent(_component_SettingsClassroomSettings, null, null, _parent));
        _push(`</div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "ai" ? null : { display: "none" })}">`);
        _push(ssrRenderComponent(_component_SettingsAISettings, null, null, _parent));
        _push(`</div></div></div>`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/settings.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=settings-BMI609Df.mjs.map
