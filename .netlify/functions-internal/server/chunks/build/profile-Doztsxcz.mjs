import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { ref, computed, mergeProps, unref, withCtx, createTextVNode, createVNode, resolveDynamicComponent, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrRenderVNode, ssrRenderStyle } from 'vue/server-renderer';
import { User, Edit, Lock, Activity, AlertCircle, ShieldCheck, Users, GraduationCap, BookOpen, FileText, Trash2, UserPlus } from 'lucide-vue-next';
import { u as useHead, a as useAuth } from './server.mjs';
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
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main = {
  __name: "profile",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Профиль пользователя | TailAdmin"
    });
    useAuth();
    const { authFetch } = useAuthFetch();
    const loading = ref(true);
    const error = ref(null);
    const profile = ref(null);
    const stats = ref(null);
    const activities = ref([]);
    const loadingActivity = ref(false);
    const updatingProfile = ref(false);
    const changingPassword = ref(false);
    const activeTab = ref("overview");
    const editForm = ref({
      name: "",
      phone: "",
      workplace: "",
      position: "",
      pinfl: ""
    });
    const passwordForm = ref({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    const isAdmin = computed(() => profile.value?.role === "ADMIN");
    const visibleTabs = computed(() => {
      const baseTabs = [
        {
          id: "overview",
          label: "Обзор",
          icon: User
        },
        {
          id: "edit",
          label: "Редактировать",
          icon: Edit
        },
        {
          id: "security",
          label: "Безопасность",
          icon: Lock
        }
      ];
      if (isAdmin.value) {
        baseTabs.push({
          id: "activity",
          label: "Системная активность",
          icon: Activity
        });
      }
      return baseTabs;
    });
    const getRoleLabel = (role) => {
      const labels = {
        ADMIN: "Администратор",
        MANAGER: "Менеджер",
        TEACHER: "Инструктор",
        STUDENT: "Студент"
      };
      return labels[role] || role;
    };
    const formatDate = (date) => {
      if (!date) return "Не указано";
      return new Date(date).toLocaleString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const getActivityIcon = (actionType) => {
      const icons = {
        CREATE: UserPlus,
        UPDATE: Edit,
        DELETE: Trash2,
        VIEW: FileText
      };
      return icons[actionType] || Activity;
    };
    const getActivityLabel = (activity) => {
      const actionLabels = {
        CREATE: "Создание",
        UPDATE: "Обновление",
        DELETE: "Удаление",
        VIEW: "Просмотр",
        LOGIN: "Вход в систему",
        LOGOUT: "Выход из системы",
        IMPORT: "Импорт",
        EXPORT: "Экспорт"
      };
      const entityLabels = {
        USER: "пользователя",
        STUDENT: "студента",
        INSTRUCTOR: "инструктора",
        COURSE: "курса",
        GROUP: "группы",
        CERTIFICATE: "сертификата",
        ORGANIZATION: "организации",
        SCHEDULE: "расписания",
        ATTENDANCE: "посещаемости",
        GRADE: "оценки"
      };
      const action = actionLabels[activity.action_type] || activity.action_type;
      const entity = entityLabels[activity.entity_type] || activity.entity_type;
      return `${action} ${entity}`;
    };
    const loadProfile = async () => {
      try {
        loading.value = true;
        error.value = null;
        const profileData = await authFetch("/api/profile");
        if (profileData?.success) {
          profile.value = profileData.user;
          editForm.value = {
            name: profile.value.name,
            phone: profile.value.phone || "",
            workplace: profile.value.workplace || "",
            position: profile.value.position || "",
            pinfl: profile.value.pinfl || ""
          };
        }
        if (profile.value?.role === "ADMIN") {
          const statsData = await authFetch("/api/profile/stats/admin");
          if (statsData?.success) {
            stats.value = statsData.stats;
          }
        }
        loadActivity();
      } catch (err) {
        console.error("Error loading profile:", err);
        error.value = err.message || "Ошибка при загрузке профиля";
      } finally {
        loading.value = false;
      }
    };
    const loadActivity = async () => {
      try {
        loadingActivity.value = true;
        const data = await authFetch("/api/profile/activity?limit=10");
        if (data?.success) {
          activities.value = data.activities;
        }
      } catch (err) {
        console.error("Error loading activity:", err);
      } finally {
        loadingActivity.value = false;
      }
    };
    const cancelEdit = () => {
      editForm.value = {
        name: profile.value.name,
        phone: profile.value.phone || "",
        workplace: profile.value.workplace || "",
        position: profile.value.position || "",
        pinfl: profile.value.pinfl || ""
      };
      activeTab.value = "overview";
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Профиль пользователя </h2></div>`);
      if (loading.value) {
        _push(`<div class="flex justify-center items-center py-20"><div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (error.value) {
        _push(`<div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-8"><div class="text-center">`);
        _push(ssrRenderComponent(unref(AlertCircle), { class: "h-16 w-16 text-danger mx-auto mb-4" }, null, _parent));
        _push(`<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ошибка загрузки</h3><p class="text-gray-600 dark:text-gray-400 mb-4">${ssrInterpolate(error.value)}</p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          onClick: loadProfile
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
      } else if (profile.value) {
        _push(`<div><div class="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="relative h-48 overflow-hidden rounded-t-sm bg-linear-to-r from-primary to-primary-600"><div class="absolute inset-0 bg-black/10"></div></div><div class="px-6 pb-6"><div class="relative -mt-16 mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end"><div class="relative"><div class="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg dark:border-gray-900"><img${ssrRenderAttr("src", `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.value.name)}&size=128&background=465fff&color=fff&bold=true`)}${ssrRenderAttr("alt", profile.value.name)} class="h-full w-full object-cover"></div></div><div class="flex-1 text-center sm:text-left"><h3 class="mb-1 text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(profile.value.name)}</h3><p class="mb-2 text-gray-600 dark:text-gray-400">${ssrInterpolate(profile.value.email)}</p><div class="flex flex-wrap items-center justify-center gap-3 sm:justify-start"><span class="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success"><span class="h-2 w-2 rounded-full bg-success"></span> Активен </span><span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">`);
        _push(ssrRenderComponent(unref(ShieldCheck), { class: "h-4 w-4" }, null, _parent));
        _push(` ${ssrInterpolate(getRoleLabel(profile.value.role))}</span></div></div></div>`);
        if (isAdmin.value && stats.value) {
          _push(`<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">`);
          _push(ssrRenderComponent(unref(Users), { class: "h-6 w-6 text-primary" }, null, _parent));
          _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400">Всего пользователей</p><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(stats.value.totalUsers)}</p></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-success/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">`);
          _push(ssrRenderComponent(unref(GraduationCap), { class: "h-6 w-6 text-success" }, null, _parent));
          _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400">Всего студентов</p><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(stats.value.totalStudents)}</p></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-warning/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">`);
          _push(ssrRenderComponent(unref(BookOpen), { class: "h-6 w-6 text-warning" }, null, _parent));
          _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400">Активных групп</p><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(stats.value.activeGroups)}</p></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-info/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">`);
          _push(ssrRenderComponent(unref(Activity), { class: "h-6 w-6 text-info" }, null, _parent));
          _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400">Активность сегодня</p><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(stats.value.todayActivities)}</p></div></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="flex flex-col gap-6"><div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800"><nav class="flex gap-1" aria-label="Tabs"><!--[-->`);
        ssrRenderList(visibleTabs.value, (tab) => {
          _push(`<button class="${ssrRenderClass([
            "flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200",
            activeTab.value === tab.id ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          ])}"><span class="flex items-center justify-center gap-2">`);
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(tab.icon), { class: "h-5 w-5" }, null), _parent);
          _push(` ${ssrInterpolate(tab.label)}</span></button>`);
        });
        _push(`<!--]--></nav></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="p-6" style="${ssrRenderStyle(activeTab.value === "overview" ? null : { display: "none" })}"><div class="grid grid-cols-1 gap-6 lg:grid-cols-2"><div><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Личная информация </h3><div class="space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Полное имя</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(profile.value.name)}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Email</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(profile.value.email)}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Телефон</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(profile.value.phone || "Не указан")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Роль</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(getRoleLabel(profile.value.role))}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Дата регистрации</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(formatDate(profile.value.created_at))}</p></div></div></div><div><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Последняя активность </h3>`);
        if (loadingActivity.value) {
          _push(`<div class="flex justify-center py-8"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
        } else if (activities.value.length > 0) {
          _push(`<div class="space-y-3"><!--[-->`);
          ssrRenderList(activities.value.slice(0, 5), (activity) => {
            _push(`<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-start gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">`);
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(getActivityIcon(activity.action_type)), { class: "h-5 w-5 text-primary" }, null), _parent);
            _push(`</div><div class="flex-1"><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(activity.entity_name || getActivityLabel(activity))}</p><p class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(formatDate(activity.created_at))}</p></div></div></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="text-center py-8 text-gray-600 dark:text-gray-400"> Нет записей об активности </div>`);
        }
        _push(`</div></div></div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "edit" ? null : { display: "none" })}"><h3 class="mb-6 text-xl font-semibold text-gray-900 dark:text-white"> Редактировать профиль </h3><form class="space-y-5"><div class="grid grid-cols-1 gap-5"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Полное имя * </label><input${ssrRenderAttr("value", editForm.value.name)} type="text" required class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Телефон </label><input${ssrRenderAttr("value", editForm.value.phone)} type="tel" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Место работы </label><input${ssrRenderAttr("value", editForm.value.workplace)} type="text" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Должность </label><input${ssrRenderAttr("value", editForm.value.position)} type="text" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> ПИНФЛ </label><input${ssrRenderAttr("value", editForm.value.pinfl)} type="text" maxlength="14" pattern="[0-9]{14}" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div></div><div class="flex justify-end gap-3 pt-4">`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "outline",
          size: "md",
          type: "button",
          onClick: cancelEdit
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
          type: "submit",
          disabled: updatingProfile.value
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(updatingProfile.value ? "Сохранение..." : "Сохранить изменения")}`);
            } else {
              return [
                createTextVNode(toDisplayString(updatingProfile.value ? "Сохранение..." : "Сохранить изменения"), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></form></div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "security" ? null : { display: "none" })}"><h3 class="mb-6 text-xl font-semibold text-gray-900 dark:text-white"> Настройки безопасности </h3><div class="space-y-6"><div class="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50"><h4 class="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">`);
        _push(ssrRenderComponent(unref(Lock), { class: "h-5 w-5" }, null, _parent));
        _push(` Изменить пароль </h4><form class="space-y-4"><div><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Текущий пароль * </label><input${ssrRenderAttr("value", passwordForm.value.currentPassword)} type="password" required autocomplete="current-password" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Новый пароль * </label><input${ssrRenderAttr("value", passwordForm.value.newPassword)} type="password" required minlength="6" autocomplete="new-password" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div><label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"> Подтвердите новый пароль * </label><input${ssrRenderAttr("value", passwordForm.value.confirmPassword)} type="password" required autocomplete="new-password" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"></div><div class="flex justify-end pt-2">`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          size: "md",
          type: "submit",
          disabled: changingPassword.value
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(changingPassword.value ? "Обновление..." : "Обновить пароль")}`);
            } else {
              return [
                createTextVNode(toDisplayString(changingPassword.value ? "Обновление..." : "Обновить пароль"), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></form></div></div></div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "activity" && isAdmin.value ? null : { display: "none" })}"><h3 class="mb-6 text-xl font-semibold text-gray-900 dark:text-white"> Системная активность </h3>`);
        if (loadingActivity.value) {
          _push(`<div class="flex justify-center py-8"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
        } else if (activities.value.length > 0) {
          _push(`<div class="space-y-3"><!--[-->`);
          ssrRenderList(activities.value, (activity) => {
            _push(`<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-start gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">`);
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(getActivityIcon(activity.action_type)), { class: "h-5 w-5 text-primary" }, null), _parent);
            _push(`</div><div class="flex-1"><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(activity.entity_name || getActivityLabel(activity))}</p><p class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(activity.entity_type)} • ${ssrInterpolate(formatDate(activity.created_at))}</p></div></div></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="text-center py-8 text-gray-600 dark:text-gray-400"> Нет записей об активности </div>`);
        }
        _push(`</div></div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/profile.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=profile-Doztsxcz.mjs.map
