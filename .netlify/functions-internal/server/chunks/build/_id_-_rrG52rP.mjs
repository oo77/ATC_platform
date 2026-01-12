import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_2 } from './InstructorFormModal-DCuy9jkU.mjs';
import { _ as __nuxt_component_3 } from './ConfirmModal-GQ4JU241.mjs';
import { defineComponent, ref, mergeProps, withCtx, createTextVNode, unref, createVNode, resolveDynamicComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderStyle, ssrRenderList, ssrRenderVNode } from 'vue/server-renderer';
import { AlertCircle, GraduationCap, Edit, Trash2, BookOpen, Users, Clock, CheckCircle, CalendarClock, FileText } from 'lucide-vue-next';
import { c as useRoute, d as useRouter, u as useHead } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
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
import './Modal-DQYphXo7.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const router = useRouter();
    const id = route.params.id;
    const { authFetch } = useAuthFetch();
    const instructor = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const showEditModal = ref(false);
    const isDeleteModalOpen = ref(false);
    const isDeleting = ref(false);
    const hoursStats = ref(null);
    const hoursLoading = ref(false);
    const hoursError = ref(null);
    useHead({
      title: "Профиль инструктора - АТЦ Платформа"
    });
    const loadInstructor = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await authFetch(
          `/api/instructors/${id}`,
          {
            method: "GET"
          }
        );
        instructor.value = response.instructor;
      } catch (err) {
        console.error("Error loading instructor:", err);
        error.value = err.data?.message || "Не удалось загрузить данные инструктора";
      } finally {
        loading.value = false;
      }
    };
    const editInstructor = () => {
      showEditModal.value = true;
    };
    const closeEditModal = () => {
      showEditModal.value = false;
    };
    const handleInstructorSaved = () => {
      showEditModal.value = false;
      loadInstructor();
    };
    const handleDelete = () => {
      isDeleteModalOpen.value = true;
    };
    const closeDeleteModal = () => {
      if (!isDeleting.value) {
        isDeleteModalOpen.value = false;
      }
    };
    const confirmDelete = async () => {
      isDeleting.value = true;
      try {
        await authFetch(
          `/api/instructors/${id}`,
          {
            method: "DELETE"
          }
        );
        router.push("/users?tab=instructors");
      } catch (err) {
        console.error("Error deleting instructor:", err);
      } finally {
        isDeleting.value = false;
        isDeleteModalOpen.value = false;
      }
    };
    const getInitials = (name) => {
      const parts = name.split(" ").filter((p) => p.length > 0);
      if (parts.length >= 2 && parts[0] && parts[1] && parts[0].length > 0 && parts[1].length > 0) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      if (name.length >= 2) {
        return name.substring(0, 2).toUpperCase();
      }
      return name.toUpperCase();
    };
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };
    const getUsageColorClass = (percentage) => {
      if (percentage >= 100) return "text-danger";
      if (percentage >= 80) return "text-warning";
      if (percentage >= 50) return "text-primary";
      return "text-success";
    };
    const getProgressBarColorClass = (percentage) => {
      if (percentage >= 100) return "bg-danger";
      if (percentage >= 80) return "bg-warning";
      if (percentage >= 50) return "bg-primary";
      return "bg-success";
    };
    const courseHistory = ref(null);
    const historyLoading = ref(false);
    const historyError = ref(null);
    const getEventTypeColor = (eventType) => {
      switch (eventType) {
        case "theory":
          return "bg-primary/10 text-primary";
        case "practice":
          return "bg-success/10 text-success";
        case "assessment":
          return "bg-warning/10 text-warning";
        default:
          return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
      }
    };
    const getEventTypeIcon = (eventType) => {
      switch (eventType) {
        case "theory":
          return BookOpen;
        case "practice":
          return Users;
        case "assessment":
          return CheckCircle;
        default:
          return FileText;
      }
    };
    const getCompletionColor = (percent) => {
      if (percent === 100) return "text-success";
      if (percent >= 50) return "text-warning";
      return "text-danger";
    };
    const formatEventDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    };
    const formatTime = (dateTimeStr) => {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_UsersInstructorFormModal = __nuxt_component_2;
      const _component_UiConfirmModal = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Профиль инструктора </h2><nav><ol class="flex items-center gap-2"><li>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/users",
        class: "hover:text-primary"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Управление пользователями`);
          } else {
            return [
              createTextVNode("Управление пользователями")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li class="text-primary">/</li><li class="text-primary">Профиль инструктора</li></ol></nav></div>`);
      if (unref(loading)) {
        _push(`<div class="flex justify-center items-center py-20"><div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (unref(error)) {
        _push(`<div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-8"><div class="text-center"><div class="mx-auto mb-4 h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center">`);
        _push(ssrRenderComponent(unref(AlertCircle), { class: "w-8 h-8 text-danger" }, null, _parent));
        _push(`</div><h3 class="mb-2 text-xl font-semibold text-black dark:text-white">Ошибка загрузки</h3><p class="text-gray-600 dark:text-gray-400 mb-4">${ssrInterpolate(unref(error))}</p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          onClick: loadInstructor
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Попробовать снова `);
            } else {
              return [
                createTextVNode(" Попробовать снова ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
      } else if (unref(instructor)) {
        _push(`<div><div class="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="relative h-48 overflow-hidden rounded-t-sm bg-linear-to-r from-primary to-primary-600"><div class="absolute inset-0 bg-black/10"></div></div><div class="px-6 pb-6"><div class="relative -mt-16 mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end"><div class="relative"><div class="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg dark:border-gray-900"><div class="h-full w-full flex items-center justify-center bg-primary/10"><span class="text-primary font-bold text-4xl">${ssrInterpolate(getInitials(unref(instructor).fullName))}</span></div></div></div><div class="flex-1 text-center sm:text-left"><h3 class="mb-1 text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(instructor).fullName)}</h3><p class="mb-2 text-gray-600 dark:text-gray-400">${ssrInterpolate(unref(instructor).email || "Email не указан")}</p><div class="flex flex-wrap items-center justify-center gap-3 sm:justify-start"><span class="${ssrRenderClass([
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
          unref(instructor).isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        ])}"><span class="${ssrRenderClass(["h-2 w-2 rounded-full", unref(instructor).isActive ? "bg-success" : "bg-danger"])}"></span> ${ssrInterpolate(unref(instructor).isActive ? "Активен" : "Неактивен")}</span><span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">`);
        _push(ssrRenderComponent(unref(GraduationCap), { class: "h-4 w-4" }, null, _parent));
        _push(` Инструктор </span></div></div><div class="flex gap-3">`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "outline",
          size: "md",
          onClick: editInstructor
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(unref(Edit), { class: "h-4 w-4" }, null, _parent2, _scopeId));
              _push2(` Редактировать `);
            } else {
              return [
                createVNode(unref(Edit), { class: "h-4 w-4" }),
                createTextVNode(" Редактировать ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "danger",
          size: "md",
          onClick: handleDelete
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(unref(Trash2), { class: "h-4 w-4" }, null, _parent2, _scopeId));
              _push2(` Удалить `);
            } else {
              return [
                createVNode(unref(Trash2), { class: "h-4 w-4" }),
                createTextVNode(" Удалить ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">`);
        _push(ssrRenderComponent(unref(BookOpen), { class: "h-6 w-6 text-primary" }, null, _parent));
        _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400">Активных курсов</p><p class="text-2xl font-bold text-gray-900 dark:text-white">0</p></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-success/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">`);
        _push(ssrRenderComponent(unref(Users), { class: "h-6 w-6 text-success" }, null, _parent));
        _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400">Всего студентов</p><p class="text-2xl font-bold text-gray-900 dark:text-white">0</p></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-warning/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">`);
        _push(ssrRenderComponent(unref(Clock), { class: "h-6 w-6 text-warning" }, null, _parent));
        _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400">Макс. часов</p><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(instructor).maxHours)}</p></div></div></div></div></div></div><div class="grid grid-cols-1 gap-6 lg:grid-cols-2"><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Личная информация </h3><div class="space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Полное имя</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(unref(instructor).fullName)}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Email</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(unref(instructor).email || "—")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Телефон</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(unref(instructor).phone || "—")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">ID</p><p class="font-medium text-gray-900 dark:text-white font-mono text-sm">${ssrInterpolate(unref(instructor).id)}</p></div></div></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Рабочая информация </h3><div class="space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Дата приема на работу</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(unref(instructor).hireDate ? formatDate(unref(instructor).hireDate) : "—")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Максимальное количество часов</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(unref(instructor).maxHours)} часов</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Информация о контракте</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(unref(instructor).contractInfo || "—")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Статус</p><span class="${ssrRenderClass([
          "inline-flex rounded-full px-3 py-1 text-sm font-medium",
          unref(instructor).isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        ])}">${ssrInterpolate(unref(instructor).isActive ? "Активен" : "Неактивен")}</span></div></div></div></div><div class="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><div class="flex items-center justify-between mb-4"><h3 class="text-xl font-semibold text-gray-900 dark:text-white"> Отчётность по часам </h3>`);
        if (!unref(hoursStats) && !unref(hoursLoading)) {
          _push(`<button class="text-sm text-primary hover:underline"> Загрузить статистику </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(hoursLoading)) {
          _push(`<div class="flex justify-center items-center py-8"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
        } else if (unref(hoursError)) {
          _push(`<div class="text-center py-6"><div class="mx-auto mb-4 h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center">`);
          _push(ssrRenderComponent(unref(AlertCircle), { class: "w-6 h-6 text-danger" }, null, _parent));
          _push(`</div><p class="text-danger mb-3">${ssrInterpolate(unref(hoursError))}</p><button class="text-sm text-primary hover:underline"> Попробовать снова </button></div>`);
        } else if (unref(hoursStats)) {
          _push(`<div><div class="mb-6"><div class="flex justify-between items-center mb-2"><span class="text-sm text-gray-600 dark:text-gray-400">Использование лимита часов</span><span class="${ssrRenderClass([getUsageColorClass(unref(hoursStats).usagePercentage), "text-sm font-medium"])}">${ssrInterpolate(unref(hoursStats).usagePercentage)}% </span></div><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden"><div class="${ssrRenderClass([getProgressBarColorClass(unref(hoursStats).usagePercentage), "h-3 rounded-full transition-all duration-500"])}" style="${ssrRenderStyle({ width: `${Math.min(100, unref(hoursStats).usagePercentage)}%` })}"></div></div><div class="flex justify-between mt-1"><span class="text-xs text-gray-500 dark:text-gray-400">0 ч.</span><span class="text-xs text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(hoursStats).maxHours)} ч. (макс.)</span></div></div><div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6"><div class="rounded-lg border border-success/30 bg-success/10 p-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">`);
          _push(ssrRenderComponent(unref(CheckCircle), { class: "h-5 w-5 text-success" }, null, _parent));
          _push(`</div><div><p class="text-xs text-gray-600 dark:text-gray-400">Отработано</p><p class="text-lg font-bold text-success">${ssrInterpolate(unref(hoursStats).totalUsedHours)} ч.</p></div></div></div><div class="rounded-lg border border-primary/30 bg-primary/10 p-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">`);
          _push(ssrRenderComponent(unref(CalendarClock), { class: "h-5 w-5 text-primary" }, null, _parent));
          _push(`</div><div><p class="text-xs text-gray-600 dark:text-gray-400">Запланировано</p><p class="text-lg font-bold text-primary">${ssrInterpolate(unref(hoursStats).totalScheduledHours)} ч.</p></div></div></div><div class="rounded-lg border border-warning/30 bg-warning/10 p-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">`);
          _push(ssrRenderComponent(unref(Clock), { class: "h-5 w-5 text-warning" }, null, _parent));
          _push(`</div><div><p class="text-xs text-gray-600 dark:text-gray-400">Осталось</p><p class="text-lg font-bold text-warning">${ssrInterpolate(unref(hoursStats).remainingHours)} ч.</p></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">`);
          _push(ssrRenderComponent(unref(FileText), { class: "h-5 w-5 text-gray-600 dark:text-gray-400" }, null, _parent));
          _push(`</div><div><p class="text-xs text-gray-600 dark:text-gray-400">По договору</p><p class="text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(hoursStats).maxHours)} ч.</p></div></div></div></div>`);
          if (unref(hoursStats).byMonth.length > 0) {
            _push(`<div><h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Разбивка по месяцам</h4><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-gray-200 dark:border-gray-700"><th class="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400">Месяц</th><th class="py-2 px-3 text-right font-medium text-gray-600 dark:text-gray-400">Отработано</th><th class="py-2 px-3 text-right font-medium text-gray-600 dark:text-gray-400">Запланировано</th><th class="py-2 px-3 text-right font-medium text-gray-600 dark:text-gray-400">Всего занятий</th></tr></thead><tbody><!--[-->`);
            ssrRenderList(unref(hoursStats).byMonth, (month) => {
              _push(`<tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"><td class="py-2 px-3 font-medium text-gray-900 dark:text-white">${ssrInterpolate(month.monthName)} ${ssrInterpolate(month.year)}</td><td class="py-2 px-3 text-right"><span class="text-success font-medium">${ssrInterpolate(month.usedHours)} ч.</span></td><td class="py-2 px-3 text-right"><span class="text-primary font-medium">${ssrInterpolate(month.scheduledHours)} ч.</span></td><td class="py-2 px-3 text-right text-gray-600 dark:text-gray-400">${ssrInterpolate(month.eventCount)}</td></tr>`);
            });
            _push(`<!--]--></tbody></table></div></div>`);
          } else {
            _push(`<div class="text-center py-4"><p class="text-sm text-gray-500 dark:text-gray-400">Нет данных о занятиях</p></div>`);
          }
          _push(`</div>`);
        } else {
          _push(`<div class="text-center py-8"><div class="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center">`);
          _push(ssrRenderComponent(unref(Clock), { class: "w-8 h-8 text-gray-400" }, null, _parent));
          _push(`</div><p class="text-gray-600 dark:text-gray-400 mb-3"> Нажмите кнопку выше, чтобы загрузить статистику часов </p><p class="text-sm text-gray-500 dark:text-gray-500"> Максимум по договору: <span class="font-medium">${ssrInterpolate(unref(instructor).maxHours)} ч.</span></p></div>`);
        }
        _push(`</div><div class="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><div class="flex items-center justify-between mb-4"><h3 class="text-xl font-semibold text-gray-900 dark:text-white"> История курсов </h3>`);
        if (!unref(courseHistory) && !unref(historyLoading)) {
          _push(`<button class="text-sm text-primary hover:underline"> Загрузить историю </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(historyLoading)) {
          _push(`<div class="flex justify-center items-center py-8"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
        } else if (unref(historyError)) {
          _push(`<div class="text-center py-6"><div class="mx-auto mb-4 h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center">`);
          _push(ssrRenderComponent(unref(AlertCircle), { class: "w-6 h-6 text-danger" }, null, _parent));
          _push(`</div><p class="text-danger mb-3">${ssrInterpolate(unref(historyError))}</p><button class="text-sm text-primary hover:underline"> Попробовать снова </button></div>`);
        } else if (unref(courseHistory)) {
          _push(`<div><div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6"><div class="rounded-lg border border-primary/30 bg-primary/10 p-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">`);
          _push(ssrRenderComponent(unref(BookOpen), { class: "h-5 w-5 text-primary" }, null, _parent));
          _push(`</div><div><p class="text-xs text-gray-600 dark:text-gray-400">Всего занятий</p><p class="text-lg font-bold text-primary">${ssrInterpolate(unref(courseHistory).summary.totalEvents)}</p></div></div></div><div class="rounded-lg border border-success/30 bg-success/10 p-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">`);
          _push(ssrRenderComponent(unref(Clock), { class: "h-5 w-5 text-success" }, null, _parent));
          _push(`</div><div><p class="text-xs text-gray-600 dark:text-gray-400">Всего часов</p><p class="text-lg font-bold text-success">${ssrInterpolate(unref(courseHistory).summary.totalHours)}</p></div></div></div><div class="rounded-lg border border-warning/30 bg-warning/10 p-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">`);
          _push(ssrRenderComponent(unref(FileText), { class: "h-5 w-5 text-warning" }, null, _parent));
          _push(`</div><div><p class="text-xs text-gray-600 dark:text-gray-400">Теория</p><p class="text-lg font-bold text-warning">${ssrInterpolate(unref(courseHistory).summary.theoryEvents)}</p></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">`);
          _push(ssrRenderComponent(unref(CheckCircle), { class: "h-5 w-5 text-gray-600 dark:text-gray-400" }, null, _parent));
          _push(`</div><div><p class="text-xs text-gray-600 dark:text-gray-400">Проверка знаний</p><p class="text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(courseHistory).summary.assessmentEvents)}</p></div></div></div></div>`);
          if (unref(courseHistory).history.length > 0) {
            _push(`<div class="space-y-3"><!--[-->`);
            ssrRenderList(unref(courseHistory).history, (event) => {
              _push(`<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-start justify-between gap-4"><div class="flex-1"><div class="flex items-start gap-3 mb-2"><div class="${ssrRenderClass([
                "flex h-10 w-10 items-center justify-center rounded-lg",
                getEventTypeColor(event.eventType)
              ])}">`);
              ssrRenderVNode(_push, createVNode(resolveDynamicComponent(getEventTypeIcon(event.eventType)), { class: "h-5 w-5" }, null), _parent);
              _push(`</div><div class="flex-1"><h4 class="font-semibold text-gray-900 dark:text-white">${ssrInterpolate(event.title)}</h4><div class="flex flex-wrap items-center gap-2 mt-1"><span class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(formatEventDate(event.date))}</span><span class="text-gray-400">•</span><span class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(formatTime(event.startTime))} - ${ssrInterpolate(formatTime(event.endTime))}</span><span class="text-gray-400">•</span><span class="text-sm font-medium text-primary">${ssrInterpolate(event.academicHours)} ак.ч. </span></div></div></div><div class="flex flex-wrap items-center gap-2 mb-3"><span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">`);
              _push(ssrRenderComponent(unref(Users), { class: "h-3 w-3" }, null, _parent));
              _push(` ${ssrInterpolate(event.group.code)}</span><span class="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">${ssrInterpolate(event.group.courseName)}</span><span class="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">${ssrInterpolate(event.discipline.name)}</span></div><div class="grid grid-cols-2 sm:grid-cols-4 gap-3"><div class="text-center p-2 rounded bg-white dark:bg-gray-900"><p class="text-xs text-gray-500 dark:text-gray-400">Студентов</p><p class="text-sm font-semibold text-gray-900 dark:text-white">${ssrInterpolate(event.statistics.totalStudents)}</p></div><div class="text-center p-2 rounded bg-white dark:bg-gray-900"><p class="text-xs text-gray-500 dark:text-gray-400">Отмечено</p><p class="${ssrRenderClass([getCompletionColor(event.statistics.completionPercent), "text-sm font-semibold"])}">${ssrInterpolate(event.statistics.studentsMarked)} (${ssrInterpolate(event.statistics.completionPercent)}%) </p></div>`);
              if (event.eventType === "assessment") {
                _push(`<div class="text-center p-2 rounded bg-white dark:bg-gray-900"><p class="text-xs text-gray-500 dark:text-gray-400">Оценено</p><p class="${ssrRenderClass([getCompletionColor(event.statistics.completionPercent), "text-sm font-semibold"])}">${ssrInterpolate(event.statistics.studentsGraded)} (${ssrInterpolate(event.statistics.completionPercent)}%) </p></div>`);
              } else {
                _push(`<!---->`);
              }
              if (event.eventType === "assessment" && event.statistics.avgGrade) {
                _push(`<div class="text-center p-2 rounded bg-white dark:bg-gray-900"><p class="text-xs text-gray-500 dark:text-gray-400">Средняя оценка</p><p class="text-sm font-semibold text-success">${ssrInterpolate(event.statistics.avgGrade)}</p></div>`);
              } else {
                _push(`<div class="text-center p-2 rounded bg-white dark:bg-gray-900"><p class="text-xs text-gray-500 dark:text-gray-400">Ср. посещ.</p><p class="text-sm font-semibold text-primary">${ssrInterpolate(event.statistics.avgAttendanceHours)} ч. </p></div>`);
              }
              _push(`</div></div><div class="flex-shrink-0"><div class="${ssrRenderClass([
                "rounded-full px-3 py-1 text-xs font-medium",
                event.statistics.completionPercent === 100 ? "bg-success/10 text-success" : event.statistics.completionPercent > 0 ? "bg-warning/10 text-warning" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              ])}">${ssrInterpolate(event.statistics.completionPercent === 100 ? "Завершено" : "Частично")}</div></div></div></div>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<div class="text-center py-8"><div class="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center">`);
            _push(ssrRenderComponent(unref(BookOpen), { class: "w-8 h-8 text-gray-400" }, null, _parent));
            _push(`</div><p class="text-gray-600 dark:text-gray-400"> Нет завершенных занятий </p></div>`);
          }
          _push(`</div>`);
        } else {
          _push(`<div class="text-center py-8"><div class="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center">`);
          _push(ssrRenderComponent(unref(BookOpen), { class: "w-8 h-8 text-gray-400" }, null, _parent));
          _push(`</div><p class="text-gray-600 dark:text-gray-400 mb-3"> Нажмите кнопку выше, чтобы загрузить историю курсов </p></div>`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(showEditModal) && unref(instructor)) {
        _push(ssrRenderComponent(_component_UsersInstructorFormModal, {
          instructor: unref(instructor),
          onClose: closeEditModal,
          onSaved: handleInstructorSaved
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": unref(isDeleteModalOpen),
        title: "Удаление инструктора",
        message: "Вы уверены, что хотите удалить этого инструктора?",
        "item-name": unref(instructor)?.fullName,
        warning: "Это действие нельзя отменить. Все данные инструктора будут удалены.",
        loading: unref(isDeleting),
        onConfirm: confirmDelete,
        onCancel: closeDeleteModal
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/instructors/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-_rrG52rP.mjs.map
