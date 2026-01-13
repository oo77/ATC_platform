import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-lE24s-NV.mjs';
import { _ as __nuxt_component_2, a as __nuxt_component_3 } from './UserPasswordModal-DVgeWmms.mjs';
import { defineComponent, ref, computed, mergeProps, unref, withCtx, createTextVNode, createVNode, createBlock, openBlock, resolveDynamicComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrRenderList, ssrRenderVNode, ssrRenderStyle } from 'vue/server-renderer';
import { User, AlertCircle, ArrowLeft, ShieldCheck, Calendar } from 'lucide-vue-next';
import { d as useRoute, a as useAuth, u as useHead } from './server.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const { user: currentUser } = useAuth();
    const { authFetch } = useAuthFetch();
    const isLoading = ref(true);
    const error = ref(null);
    const userData = ref(null);
    const activeTab = ref("info");
    const isEditModalOpen = ref(false);
    const isPasswordModalOpen = ref(false);
    const userId = computed(() => route.params.id);
    const avatarUrl = computed(() => {
      if (!userData.value?.name) return "";
      const name = encodeURIComponent(userData.value.name);
      return `https://ui-avatars.com/api/?name=${name}&size=128&background=465fff&color=fff&bold=true`;
    });
    const availableTabs = computed(() => {
      return [
        { id: "info", label: "Информация", icon: User }
      ];
    });
    const canEdit = computed(() => {
      if (!currentUser.value || !userData.value) return false;
      if (currentUser.value.role === "ADMIN") return true;
      if (currentUser.value.role === "MANAGER" && userData.value.role !== "ADMIN") return true;
      return currentUser.value.id === userData.value.id;
    });
    const canResetPassword = computed(() => {
      if (!currentUser.value || !userData.value) return false;
      if (currentUser.value.role === "ADMIN") return true;
      if (currentUser.value.role === "MANAGER" && userData.value.role !== "ADMIN") return true;
      return false;
    });
    const getRoleLabel = (role) => {
      const labels = {
        ADMIN: "Администратор",
        MANAGER: "Модератор",
        TEACHER: "Инструктор",
        STUDENT: "Студент"
      };
      return labels[role || ""] || role || "";
    };
    const getRoleBadgeClass = (role) => {
      const classes = {
        ADMIN: "bg-danger/10 text-danger",
        MANAGER: "bg-warning/10 text-warning",
        TEACHER: "bg-primary/10 text-primary",
        STUDENT: "bg-success/10 text-success"
      };
      return classes[role || ""] || "bg-gray-100 text-gray-600";
    };
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    };
    const loadUser = async () => {
      isLoading.value = true;
      error.value = null;
      try {
        const response = await authFetch(
          `/api/users/${userId.value}`
        );
        if (response.success && response.user) {
          userData.value = response.user;
        } else {
          error.value = response.message || "Не удалось загрузить данные пользователя";
        }
      } catch (err) {
        console.error("Error loading user:", err);
        error.value = err?.data?.message || err?.message || "Ошибка загрузки пользователя";
      } finally {
        isLoading.value = false;
      }
    };
    const openEditModal = () => {
      isEditModalOpen.value = true;
    };
    const closeEditModal = () => {
      isEditModalOpen.value = false;
    };
    const handleUserSaved = async () => {
      await loadUser();
      closeEditModal();
    };
    const openPasswordModal = () => {
      isPasswordModalOpen.value = true;
    };
    const closePasswordModal = () => {
      isPasswordModalOpen.value = false;
    };
    const handlePasswordResetSuccess = () => {
      closePasswordModal();
    };
    useHead({
      title: computed(
        () => userData.value?.name ? `${userData.value.name} | Профиль пользователя` : "Профиль пользователя"
      )
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UsersUserFormModal = __nuxt_component_2;
      const _component_UsersUserPasswordModal = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}>`);
      if (isLoading.value) {
        _push(`<div class="flex items-center justify-center py-20"><div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>`);
      } else if (error.value) {
        _push(`<div class="rounded-lg border border-danger/30 bg-danger/5 p-8 text-center">`);
        _push(ssrRenderComponent(unref(AlertCircle), { class: "mx-auto h-12 w-12 text-danger" }, null, _parent));
        _push(`<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"> Ошибка загрузки </h3><p class="mt-2 text-gray-600 dark:text-gray-400">${ssrInterpolate(error.value)}</p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          class: "mt-4",
          onClick: loadUser
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
        _push(`</div>`);
      } else if (userData.value) {
        _push(`<!--[--><div class="mb-6">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/users",
          class: "inline-flex items-center gap-2 text-primary hover:underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(unref(ArrowLeft), { class: "h-4 w-4" }, null, _parent2, _scopeId));
              _push2(` Назад к списку пользователей `);
            } else {
              return [
                createVNode(unref(ArrowLeft), { class: "h-4 w-4" }),
                createTextVNode(" Назад к списку пользователей ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div><div class="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="relative h-48 overflow-hidden rounded-t-sm bg-linear-to-r from-primary to-primary-600"><div class="absolute inset-0 bg-black/10"></div></div><div class="px-6 pb-6"><div class="relative -mt-16 mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end"><div class="relative"><div class="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg dark:border-gray-900"><img${ssrRenderAttr("src", avatarUrl.value)}${ssrRenderAttr("alt", userData.value.name)} class="h-full w-full object-cover"></div></div><div class="flex-1 text-center sm:text-left"><h3 class="mb-1 text-2xl font-bold text-white dark:text-gray-900">${ssrInterpolate(userData.value.name)}</h3><p class="mb-2 text-gray-600 dark:text-gray-400">${ssrInterpolate(userData.value.email)}</p><div class="flex flex-wrap items-center justify-center gap-3 sm:justify-start"><span class="${ssrRenderClass([getRoleBadgeClass(userData.value.role), "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"])}">`);
        _push(ssrRenderComponent(unref(ShieldCheck), { class: "h-4 w-4" }, null, _parent));
        _push(` ${ssrInterpolate(getRoleLabel(userData.value.role))}</span></div></div><div class="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">`);
        if (canEdit.value) {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "primary",
            class: "flex items-center gap-2",
            onClick: openEditModal
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId}></path></svg> Редактировать `);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "w-4 h-4",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    })
                  ])),
                  createTextVNode(" Редактировать ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (canResetPassword.value) {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "warning",
            class: "flex items-center gap-2",
            onClick: openPasswordModal
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"${_scopeId}></path></svg> Сбросить пароль `);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "w-4 h-4",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    })
                  ])),
                  createTextVNode(" Сбросить пароль ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">`);
        _push(ssrRenderComponent(unref(Calendar), { class: "h-6 w-6 text-primary" }, null, _parent));
        _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400">Дата регистрации</p><p class="text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(formatDate(userData.value.created_at))}</p></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-success/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">`);
        _push(ssrRenderComponent(unref(ShieldCheck), { class: "h-6 w-6 text-success" }, null, _parent));
        _push(`</div><div><p class="text-sm text-gray-600 dark:text-gray-400">Роль</p><p class="text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(getRoleLabel(userData.value.role))}</p></div></div></div></div></div></div><div class="flex flex-col gap-6"><div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800"><nav class="flex gap-1" aria-label="Tabs"><!--[-->`);
        ssrRenderList(availableTabs.value, (tab) => {
          _push(`<button class="${ssrRenderClass([
            "flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200",
            activeTab.value === tab.id ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          ])}"><span class="flex items-center justify-center gap-2">`);
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(tab.icon), { class: "h-5 w-5" }, null), _parent);
          _push(` ${ssrInterpolate(tab.label)}</span></button>`);
        });
        _push(`<!--]--></nav></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="p-6" style="${ssrRenderStyle(activeTab.value === "info" ? null : { display: "none" })}"><div class="grid grid-cols-1 gap-6 lg:grid-cols-2"><div><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Личная информация </h3><div class="space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Полное имя</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(userData.value.name)}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Email</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(userData.value.email)}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Телефон</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(userData.value.phone || "—")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">ПИНФЛ</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(userData.value.pinfl || "—")}</p></div></div></div><div><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Рабочая информация </h3><div class="space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Роль в системе</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(getRoleLabel(userData.value.role))}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Место работы</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(userData.value.workplace || "—")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Должность</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(userData.value.position || "—")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Обновлено</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(formatDate(userData.value.updated_at))}</p></div></div></div></div></div></div></div>`);
        if (isEditModalOpen.value && userData.value) {
          _push(ssrRenderComponent(_component_UsersUserFormModal, {
            user: userData.value,
            role: userData.value.role,
            onClose: closeEditModal,
            onSave: handleUserSaved
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        if (isPasswordModalOpen.value && userData.value) {
          _push(ssrRenderComponent(_component_UsersUserPasswordModal, {
            "is-open": isPasswordModalOpen.value,
            "user-id": userData.value.id,
            "user-name": userData.value.name,
            onClose: closePasswordModal,
            onSuccess: handlePasswordResetSuccess
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/users/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-CDhcH9Io.mjs.map
