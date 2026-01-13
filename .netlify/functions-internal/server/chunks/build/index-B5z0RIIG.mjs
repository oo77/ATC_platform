import { _ as __nuxt_component_1$4 } from './Button-D9CRGwzT.mjs';
import { _ as __nuxt_component_0$3 } from './nuxt-link-lE24s-NV.mjs';
import { defineComponent, computed, ref, watch, watchEffect, mergeProps, unref, withCtx, createTextVNode, toDisplayString, createBlock, openBlock, createVNode, reactive, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderStyle, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderTeleport } from 'vue/server-renderer';
import { _ as __nuxt_component_2$1, a as __nuxt_component_3$2 } from './UserPasswordModal-DVgeWmms.mjs';
import { a as useAuth, U as UserRole } from './server.mjs';
import { _ as __nuxt_component_2$2 } from './InstructorFormModal-8D8lLyMB.mjs';
import { _ as __nuxt_component_0$2 } from './StudentManagementPanel-CiTVSVse.mjs';
import { u as useAuthFetch } from './useAuthFetch-pXCaAdz0.mjs';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
import { useRoute, useRouter } from 'vue-router';
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
import './Pagination-DWMrBbMe.mjs';
import './StudentCertificatesModal-BYeC1Vsm.mjs';
import './Modal-DQYphXo7.mjs';
import './ConfirmModal-D4ued3Bi.mjs';
import './Notification-CQvvdM2O.mjs';

const _sfc_main$9 = /* @__PURE__ */ defineComponent({
  __name: "UserTable",
  __ssrInlineRender: true,
  props: {
    users: {},
    loading: { type: Boolean },
    role: {}
  },
  emits: ["edit", "reset-password", "delete"],
  setup(__props) {
    const props = __props;
    const showWorkplace = computed(() => {
      return ["ADMIN", "MANAGER", "TEACHER"].includes(props.role);
    });
    const showPosition = computed(() => {
      return ["ADMIN", "MANAGER", "TEACHER"].includes(props.role);
    });
    const columnCount = computed(() => {
      let count = 5;
      if (showWorkplace.value) count++;
      if (showPosition.value) count++;
      return count;
    });
    const getUserInitials = (name) => {
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
        month: "short",
        day: "numeric"
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$3;
      const _component_UiButton = __nuxt_component_1$4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "overflow-x-auto" }, _attrs))}><table class="w-full table-auto"><thead><tr class="bg-gray-2 text-left dark:bg-meta-4"><th class="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11"> Пользователь </th><th class="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white"> Email </th><th class="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white"> Телефон </th>`);
      if (showWorkplace.value) {
        _push(`<th class="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white"> Место работы </th>`);
      } else {
        _push(`<!---->`);
      }
      if (showPosition.value) {
        _push(`<th class="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white"> Должность </th>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<th class="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white"> Дата создания </th><th class="px-4 py-4 font-medium text-black dark:text-white"> Действия </th></tr></thead><tbody>`);
      if (__props.loading) {
        _push(`<tr><td${ssrRenderAttr("colspan", columnCount.value)} class="text-center py-12"><div class="flex justify-center items-center"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div><span class="ml-3 text-gray-600 dark:text-gray-400">Загрузка...</span></div></td></tr>`);
      } else if (__props.users.length === 0) {
        _push(`<tr><td${ssrRenderAttr("colspan", columnCount.value)} class="text-center py-12"><p class="text-gray-600 dark:text-gray-400">Пользователи не найдены</p></td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(__props.users, (user) => {
        _push(`<tr class="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"><td class="px-4 py-5 pl-9 xl:pl-11">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/users/${user.id}`,
          class: "flex items-center gap-3 group"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="shrink-0"${_scopeId}><div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20"${_scopeId}><span class="text-primary font-medium text-lg"${_scopeId}>${ssrInterpolate(getUserInitials(user.name))}</span></div></div><div${_scopeId}><h5 class="font-medium text-black dark:text-white group-hover:text-primary transition-colors"${_scopeId}>${ssrInterpolate(user.name)}</h5><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}> ID: ${ssrInterpolate(user.id.substring(0, 8))}... </p></div>`);
            } else {
              return [
                createVNode("div", { class: "shrink-0" }, [
                  createVNode("div", { class: "h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20" }, [
                    createVNode("span", { class: "text-primary font-medium text-lg" }, toDisplayString(getUserInitials(user.name)), 1)
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("h5", { class: "font-medium text-black dark:text-white group-hover:text-primary transition-colors" }, toDisplayString(user.name), 1),
                  createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, " ID: " + toDisplayString(user.id.substring(0, 8)) + "... ", 1)
                ])
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</td><td class="px-4 py-5"><p class="text-black dark:text-white">${ssrInterpolate(user.email)}</p></td><td class="px-4 py-5"><p class="text-black dark:text-white">${ssrInterpolate(user.phone || "—")}</p></td>`);
        if (showWorkplace.value) {
          _push(`<td class="px-4 py-5"><p class="text-black dark:text-white">${ssrInterpolate(user.workplace || "—")}</p></td>`);
        } else {
          _push(`<!---->`);
        }
        if (showPosition.value) {
          _push(`<td class="px-4 py-5"><p class="text-black dark:text-white">${ssrInterpolate(user.position || "—")}</p></td>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<td class="px-4 py-5"><p class="text-black dark:text-white">${ssrInterpolate(formatDate(user.created_at))}</p></td><td class="px-4 py-5"><div class="flex items-center gap-2">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/users/${user.id}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_UiButton, {
                variant: "outline",
                size: "sm",
                title: "Просмотр профиля"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId2}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"${_scopeId2}></path></svg>`);
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
                          d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        }),
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        })
                      ]))
                    ];
                  }
                }),
                _: 2
              }, _parent2, _scopeId));
            } else {
              return [
                createVNode(_component_UiButton, {
                  variant: "outline",
                  size: "sm",
                  title: "Просмотр профиля"
                }, {
                  default: withCtx(() => [
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
                        d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      }),
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      })
                    ]))
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          size: "sm",
          onClick: ($event) => _ctx.$emit("edit", user),
          title: "Редактировать"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId}></path></svg>`);
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
                ]))
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "warning",
          size: "sm",
          onClick: ($event) => _ctx.$emit("reset-password", user),
          title: "Сбросить пароль"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"${_scopeId}></path></svg>`);
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
                ]))
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "danger",
          size: "sm",
          onClick: ($event) => _ctx.$emit("delete", user.id),
          title: "Удалить"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"${_scopeId}></path></svg>`);
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
                    d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                  })
                ]))
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</div></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div>`);
    };
  }
});
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/users/UserTable.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const __nuxt_component_1$3 = Object.assign(_sfc_main$9, { __name: "UsersUserTable" });
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  __name: "UserManagementPanel",
  __ssrInlineRender: true,
  props: {
    role: {}
  },
  setup(__props) {
    const props = __props;
    const loading = ref(false);
    const users = ref([]);
    const searchQuery = ref("");
    const statusFilter = ref("all");
    const showModal = ref(false);
    const showPasswordModal = ref(false);
    const selectedUser = ref(null);
    const roleLabel = computed(() => {
      const labels = {
        ADMIN: "Администратор",
        MANAGER: "Модератор",
        TEACHER: "Учитель",
        STUDENT: "Студент"
      };
      return labels[props.role];
    });
    const filteredUsers = computed(() => {
      let result = users.value;
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(
          (user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
        );
      }
      return result;
    });
    const fetchUsers = async () => {
      loading.value = true;
      try {
        const { token } = useAuth();
        const response = await $fetch(
          `/api/users?role=${props.role}`,
          {
            headers: {
              Authorization: `Bearer ${token.value}`
            }
          }
        );
        if (response.success) {
          users.value = response.users;
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        loading.value = false;
      }
    };
    const openCreateModal = () => {
      selectedUser.value = null;
      showModal.value = true;
    };
    const openEditModal = (user) => {
      selectedUser.value = user;
      showModal.value = true;
    };
    const openPasswordModal = (user) => {
      selectedUser.value = user;
      showPasswordModal.value = true;
    };
    const closeModal = () => {
      showModal.value = false;
      selectedUser.value = null;
    };
    const closePasswordModal = () => {
      showPasswordModal.value = false;
      selectedUser.value = null;
    };
    const handleSave = async () => {
      await fetchUsers();
      closeModal();
    };
    const handlePasswordResetSuccess = () => {
      closePasswordModal();
    };
    const handleDelete = async (userId) => {
      if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) {
        return;
      }
      try {
        const { token } = useAuth();
        await $fetch(`/api/users/${userId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token.value}`
          }
        });
        await fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$4;
      const _component_UsersUserTable = __nuxt_component_1$3;
      const _component_UsersUserFormModal = __nuxt_component_2$1;
      const _component_UsersUserPasswordModal = __nuxt_component_3$2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="flex items-center justify-between"><div><h3 class="text-xl font-semibold text-black dark:text-white">${ssrInterpolate(roleLabel.value)}</h3><p class="text-sm text-gray-600 dark:text-gray-400 mt-1"> Управление пользователями с ролью &quot;${ssrInterpolate(roleLabel.value)}&quot; </p></div>`);
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "success",
        size: "md",
        onClick: openCreateModal
      }, {
        iconLeft: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg>`);
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
              ]))
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Добавить ${ssrInterpolate(roleLabel.value.toLowerCase())}а `);
          } else {
            return [
              createTextVNode(" Добавить " + toDisplayString(roleLabel.value.toLowerCase()) + "а ", 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex flex-col sm:flex-row gap-4"><div class="flex-1"><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="Поиск по имени, email..." class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"></div><div class="sm:w-48"><select class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "all") : ssrLooseEqual(statusFilter.value, "all")) ? " selected" : ""}>Все статусы</option><option value="active"${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "active") : ssrLooseEqual(statusFilter.value, "active")) ? " selected" : ""}>Активные</option><option value="inactive"${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "inactive") : ssrLooseEqual(statusFilter.value, "inactive")) ? " selected" : ""}>Неактивные</option></select></div></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">`);
      _push(ssrRenderComponent(_component_UsersUserTable, {
        users: filteredUsers.value,
        loading: loading.value,
        role: __props.role,
        onEdit: openEditModal,
        onResetPassword: openPasswordModal,
        onDelete: handleDelete
      }, null, _parent));
      _push(`</div>`);
      if (showModal.value) {
        _push(ssrRenderComponent(_component_UsersUserFormModal, {
          user: selectedUser.value,
          role: __props.role,
          onClose: closeModal,
          onSave: handleSave
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (showPasswordModal.value && selectedUser.value) {
        _push(ssrRenderComponent(_component_UsersUserPasswordModal, {
          "is-open": showPasswordModal.value,
          "user-id": selectedUser.value.id,
          "user-name": selectedUser.value.name,
          onClose: closePasswordModal,
          onSuccess: handlePasswordResetSuccess
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/users/UserManagementPanel.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const __nuxt_component_0$1 = Object.assign(_sfc_main$8, { __name: "UsersUserManagementPanel" });
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "InstructorTable",
  __ssrInlineRender: true,
  props: {
    instructors: { default: () => [] },
    loading: { type: Boolean, default: false }
  },
  setup(__props) {
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
        month: "short",
        day: "numeric"
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "overflow-x-auto" }, _attrs))}><table class="w-full table-auto"><thead><tr class="bg-gray-2 text-left dark:bg-meta-4"><th class="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11"> ФИО </th><th class="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white"> Email </th><th class="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white"> Телефон </th><th class="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white"> Прием на работу </th><th class="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white"> Макс. часы </th><th class="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white"> Статус </th></tr></thead><tbody>`);
      if (__props.loading) {
        _push(`<tr><td colspan="6" class="text-center py-12"><div class="flex justify-center items-center"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div><span class="ml-3 text-gray-600 dark:text-gray-400">Загрузка...</span></div></td></tr>`);
      } else if (__props.instructors.length === 0) {
        _push(`<tr><td colspan="6" class="text-center py-12"><p class="text-gray-600 dark:text-gray-400">Инструкторы не найдены</p></td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(__props.instructors, (instructor) => {
        _push(`<tr class="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"><td class="px-4 py-5 pl-9 xl:pl-11">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/instructors/${instructor.id}`,
          class: "flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="shrink-0"${_scopeId}><div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"${_scopeId}><span class="text-primary font-medium text-lg"${_scopeId}>${ssrInterpolate(getInitials(instructor.fullName))}</span></div></div><div${_scopeId}><h5 class="font-medium text-black dark:text-white hover:text-primary transition-colors"${_scopeId}>${ssrInterpolate(instructor.fullName)}</h5><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}> ID: ${ssrInterpolate(instructor.id.substring(0, 8))}... </p></div>`);
            } else {
              return [
                createVNode("div", { class: "shrink-0" }, [
                  createVNode("div", { class: "h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center" }, [
                    createVNode("span", { class: "text-primary font-medium text-lg" }, toDisplayString(getInitials(instructor.fullName)), 1)
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("h5", { class: "font-medium text-black dark:text-white hover:text-primary transition-colors" }, toDisplayString(instructor.fullName), 1),
                  createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, " ID: " + toDisplayString(instructor.id.substring(0, 8)) + "... ", 1)
                ])
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</td><td class="px-4 py-5"><p class="text-black dark:text-white">${ssrInterpolate(instructor.email || "—")}</p></td><td class="px-4 py-5"><p class="text-black dark:text-white">${ssrInterpolate(instructor.phone || "—")}</p></td><td class="px-4 py-5"><p class="text-black dark:text-white">${ssrInterpolate(instructor.hireDate ? formatDate(instructor.hireDate) : "—")}</p></td><td class="px-4 py-5"><p class="text-black dark:text-white font-medium">${ssrInterpolate(instructor.maxHours)}</p></td><td class="px-4 py-5"><span class="${ssrRenderClass([
          "inline-flex rounded-full px-3 py-1 text-sm font-medium",
          instructor.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        ])}">${ssrInterpolate(instructor.isActive ? "Активен" : "Неактивен")}</span></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/users/InstructorTable.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_1$2 = Object.assign(_sfc_main$7, { __name: "UsersInstructorTable" });
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "InstructorManagementPanel",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(false);
    const instructors = ref([]);
    const searchQuery = ref("");
    const statusFilter = ref("all");
    const showModal = ref(false);
    const selectedInstructor = ref(null);
    const filteredInstructors = computed(() => {
      let result = instructors.value;
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(
          (instructor) => instructor.fullName.toLowerCase().includes(query) || instructor.email?.toLowerCase().includes(query) || instructor.phone?.toLowerCase().includes(query)
        );
      }
      if (statusFilter.value !== "all") {
        const isActive = statusFilter.value === "active";
        result = result.filter((instructor) => instructor.isActive === isActive);
      }
      return result;
    });
    const fetchInstructors = async () => {
      loading.value = true;
      try {
        const { token } = useAuth();
        const response = await $fetch(
          "/api/instructors",
          {
            headers: {
              Authorization: `Bearer ${token.value}`
            }
          }
        );
        if (response.success) {
          instructors.value = response.instructors;
        }
      } catch (error) {
        console.error("Error fetching instructors:", error);
      } finally {
        loading.value = false;
      }
    };
    const openCreateModal = () => {
      selectedInstructor.value = null;
      showModal.value = true;
    };
    const closeModal = () => {
      showModal.value = false;
      selectedInstructor.value = null;
    };
    const handleSave = async () => {
      await fetchInstructors();
      closeModal();
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$4;
      const _component_UsersInstructorTable = __nuxt_component_1$2;
      const _component_UsersInstructorFormModal = __nuxt_component_2$2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="flex items-center justify-between"><div><h3 class="text-xl font-semibold text-black dark:text-white"> Инструкторы </h3><p class="text-sm text-gray-600 dark:text-gray-400 mt-1"> Управление инструкторами учебного центра </p></div>`);
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "success",
        size: "md",
        onClick: openCreateModal
      }, {
        iconLeft: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg>`);
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
              ]))
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Добавить инструктора `);
          } else {
            return [
              createTextVNode(" Добавить инструктора ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex flex-col sm:flex-row gap-4"><div class="flex-1"><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="Поиск по ФИО, email, телефону..." class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"></div><div class="sm:w-48"><select class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "all") : ssrLooseEqual(statusFilter.value, "all")) ? " selected" : ""}>Все статусы</option><option value="active"${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "active") : ssrLooseEqual(statusFilter.value, "active")) ? " selected" : ""}>Активные</option><option value="inactive"${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "inactive") : ssrLooseEqual(statusFilter.value, "inactive")) ? " selected" : ""}>Неактивные</option></select></div></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">`);
      _push(ssrRenderComponent(_component_UsersInstructorTable, {
        instructors: filteredInstructors.value,
        loading: loading.value
      }, null, _parent));
      _push(`</div>`);
      if (showModal.value) {
        _push(ssrRenderComponent(_component_UsersInstructorFormModal, {
          instructor: selectedInstructor.value,
          onClose: closeModal,
          onSaved: handleSave
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/users/InstructorManagementPanel.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_1$1 = Object.assign(_sfc_main$6, { __name: "UsersInstructorManagementPanel" });
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "RepresentativeTable",
  __ssrInlineRender: true,
  props: {
    representatives: {},
    loading: { type: Boolean }
  },
  emits: ["view", "approve", "block", "delete"],
  setup(__props) {
    const getStatusLabel = (status) => {
      const labels = {
        pending: "Ожидает",
        approved: "Одобрен",
        blocked: "Заблокирован"
      };
      return labels[status] || status;
    };
    const formatDate = (date) => {
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark" }, _attrs))}>`);
      if (__props.loading) {
        _push(`<div class="p-8 text-center"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div><p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Загрузка...</p></div>`);
      } else if (__props.representatives.length > 0) {
        _push(`<div class="overflow-x-auto"><table class="w-full table-auto"><thead><tr class="bg-gray-2 text-left dark:bg-meta-4"><th class="py-4 px-4 font-medium text-black dark:text-white">ФИО</th><th class="py-4 px-4 font-medium text-black dark:text-white">Организация</th><th class="py-4 px-4 font-medium text-black dark:text-white">Телефон</th><th class="py-4 px-4 font-medium text-black dark:text-white">Telegram</th><th class="py-4 px-4 font-medium text-black dark:text-white">Статус</th><th class="py-4 px-4 font-medium text-black dark:text-white">Дата заявки</th><th class="py-4 px-4 font-medium text-black dark:text-white text-center">Действия</th></tr></thead><tbody><!--[-->`);
        ssrRenderList(__props.representatives, (rep) => {
          _push(`<tr class="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"><td class="py-4 px-4"><p class="font-medium text-black dark:text-white">${ssrInterpolate(rep.fullName)}</p></td><td class="py-4 px-4"><p class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(rep.organizationName || "Не указана")}</p></td><td class="py-4 px-4"><p class="text-sm font-mono text-gray-600 dark:text-gray-400">${ssrInterpolate(rep.phone)}</p></td><td class="py-4 px-4">`);
          if (rep.telegramUsername) {
            _push(`<p class="text-sm text-gray-600 dark:text-gray-400"> @${ssrInterpolate(rep.telegramUsername)}</p>`);
          } else {
            _push(`<p class="text-sm text-gray-400 dark:text-gray-500 italic"> Не указан </p>`);
          }
          _push(`</td><td class="py-4 px-4"><span class="${ssrRenderClass([
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
            rep.status === "pending" && "bg-warning/10 text-warning",
            rep.status === "approved" && "bg-success/10 text-success",
            rep.status === "blocked" && "bg-danger/10 text-danger"
          ])}"><span class="${ssrRenderClass([
            "h-2 w-2 rounded-full",
            rep.status === "pending" && "bg-warning",
            rep.status === "approved" && "bg-success",
            rep.status === "blocked" && "bg-danger"
          ])}"></span> ${ssrInterpolate(getStatusLabel(rep.status))}</span></td><td class="py-4 px-4"><p class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(formatDate(rep.createdAt))}</p></td><td class="py-4 px-4"><div class="flex items-center justify-center gap-2">`);
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "outline",
            size: "sm",
            onClick: ($event) => _ctx.$emit("view", rep),
            title: "Просмотр"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"${_scopeId}></path></svg>`);
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
                      d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    }),
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    })
                  ]))
                ];
              }
            }),
            _: 2
          }, _parent));
          if (rep.status === "pending") {
            _push(ssrRenderComponent(_component_UiButton, {
              variant: "success",
              size: "sm",
              onClick: ($event) => _ctx.$emit("approve", rep),
              title: "Одобрить"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"${_scopeId}></path></svg>`);
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
                        d: "M5 13l4 4L19 7"
                      })
                    ]))
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          if (rep.status !== "blocked") {
            _push(ssrRenderComponent(_component_UiButton, {
              variant: "warning",
              size: "sm",
              onClick: ($event) => _ctx.$emit("block", rep),
              title: "Заблокировать"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"${_scopeId}></path></svg>`);
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
                        d: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      })
                    ]))
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "danger",
            size: "sm",
            onClick: ($event) => _ctx.$emit("delete", rep),
            title: "Удалить"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg>`);
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
                      d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    })
                  ]))
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      } else {
        _push(`<div class="p-8 text-center"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg><p class="mt-4 text-gray-500 dark:text-gray-400">Представители не найдены</p></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/representatives/RepresentativeTable.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main$5, { __name: "RepresentativesRepresentativeTable" });
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "RepresentativeDetailModal",
  __ssrInlineRender: true,
  props: {
    representative: {},
    isOpen: { type: Boolean }
  },
  emits: ["close", "approve", "block", "updated"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const isVisible = ref(false);
    const isSaving = ref(false);
    const showRequestHistory = ref(false);
    const loadingRequests = ref(false);
    const requestHistory = ref([]);
    const requestStats = ref(null);
    const localPermissions = ref({
      can_view_students: true,
      can_view_schedule: true,
      can_view_certificates: true,
      can_request_certificates: true
    });
    const permissionsChanged = computed(() => {
      const original = props.representative.permissions;
      const local = localPermissions.value;
      return original.can_view_students !== local.can_view_students || original.can_view_schedule !== local.can_view_schedule || original.can_view_certificates !== local.can_view_certificates || original.can_request_certificates !== local.can_request_certificates;
    });
    watch(() => localPermissions.value.can_view_certificates, (newValue) => {
      if (!newValue) {
        localPermissions.value.can_request_certificates = false;
      }
    });
    const handleClose = () => {
      isVisible.value = false;
      setTimeout(() => {
        emit("close");
      }, 300);
    };
    const savePermissions = async () => {
      isSaving.value = true;
      try {
        const { authFetch } = useAuthFetch();
        await authFetch(`/api/representatives/${props.representative.id}`, {
          method: "PATCH",
          body: {
            permissions: localPermissions.value
          }
        });
        const notification = useNotification();
        notification.success("Разрешения обновлены", "Успешно");
        emit("updated");
      } catch (error) {
        console.error("Ошибка сохранения разрешений:", error);
        const notification = useNotification();
        notification.error(
          error.message || "Не удалось сохранить разрешения",
          "Ошибка"
        );
      } finally {
        isSaving.value = false;
      }
    };
    const getStatusLabel = (status) => {
      const labels = {
        pending: "Ожидает одобрения",
        approved: "Одобрен",
        blocked: "Заблокирован"
      };
      return labels[status] || status;
    };
    const formatDate = (date) => {
      if (!date) return "Не указано";
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$4;
      ssrRenderTeleport(_push, (_push2) => {
        if (isVisible.value) {
          _push2(`<div class="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 px-4 py-5">`);
          if (isVisible.value) {
            _push2(`<div class="w-full max-w-3xl rounded-lg bg-white dark:bg-boxdark shadow-xl max-h-[90vh] overflow-y-auto"><div class="sticky top-0 z-10 border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between bg-white dark:bg-boxdark"><h3 class="text-xl font-semibold text-black dark:text-white"> Детали представителя </h3><button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><div class="p-6 space-y-6"><div class="flex items-center justify-between"><span class="${ssrRenderClass([
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
              __props.representative.status === "pending" && "bg-warning/10 text-warning",
              __props.representative.status === "approved" && "bg-success/10 text-success",
              __props.representative.status === "blocked" && "bg-danger/10 text-danger"
            ])}"><span class="${ssrRenderClass([
              "h-2.5 w-2.5 rounded-full",
              __props.representative.status === "pending" && "bg-warning",
              __props.representative.status === "approved" && "bg-success",
              __props.representative.status === "blocked" && "bg-danger"
            ])}"></span> ${ssrInterpolate(getStatusLabel(__props.representative.status))}</span><div class="flex gap-2">`);
            if (__props.representative.status === "pending") {
              _push2(ssrRenderComponent(_component_UiButton, {
                variant: "success",
                onClick: ($event) => _ctx.$emit("approve", __props.representative)
              }, {
                default: withCtx((_, _push3, _parent2, _scopeId) => {
                  if (_push3) {
                    _push3(` Одобрить `);
                  } else {
                    return [
                      createTextVNode(" Одобрить ")
                    ];
                  }
                }),
                _: 1
              }, _parent));
            } else {
              _push2(`<!---->`);
            }
            if (__props.representative.status !== "blocked") {
              _push2(ssrRenderComponent(_component_UiButton, {
                variant: "warning",
                onClick: ($event) => _ctx.$emit("block", __props.representative)
              }, {
                default: withCtx((_, _push3, _parent2, _scopeId) => {
                  if (_push3) {
                    _push3(` Заблокировать `);
                  } else {
                    return [
                      createTextVNode(" Заблокировать ")
                    ];
                  }
                }),
                _: 1
              }, _parent));
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="rounded-lg border border-stroke dark:border-strokedark p-4"><h4 class="font-medium text-black dark:text-white mb-4">Основная информация</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><p class="text-sm text-gray-600 dark:text-gray-400">ФИО</p><p class="font-medium text-black dark:text-white">${ssrInterpolate(__props.representative.fullName)}</p></div><div><p class="text-sm text-gray-600 dark:text-gray-400">Телефон</p><p class="font-medium text-black dark:text-white font-mono">${ssrInterpolate(__props.representative.phone)}</p></div><div class="md:col-span-2"><p class="text-sm text-gray-600 dark:text-gray-400">Организация</p><p class="font-medium text-black dark:text-white">${ssrInterpolate(__props.representative.organizationName || "Не указана")}</p></div></div></div><div class="rounded-lg border border-stroke dark:border-strokedark p-4"><h4 class="font-medium text-black dark:text-white mb-4">Telegram</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><p class="text-sm text-gray-600 dark:text-gray-400">Username</p><p class="font-medium text-black dark:text-white">${ssrInterpolate(__props.representative.telegramUsername ? `@${__props.representative.telegramUsername}` : "Не указан")}</p></div><div><p class="text-sm text-gray-600 dark:text-gray-400">Chat ID</p><p class="font-medium text-black dark:text-white font-mono">${ssrInterpolate(__props.representative.telegramChatId || "Не указан")}</p></div></div></div><div class="rounded-lg border border-stroke dark:border-strokedark p-4"><h4 class="font-medium text-black dark:text-white mb-4">Настройки доступа</h4><div class="space-y-3"><div><p class="text-sm text-gray-600 dark:text-gray-400">Доступ к группам</p><p class="font-medium text-black dark:text-white">${ssrInterpolate(__props.representative.accessGroups ? `${__props.representative.accessGroups.length} групп` : "Все группы организации")}</p></div><div><p class="text-sm text-gray-600 dark:text-gray-400">Уведомления</p><span class="${ssrRenderClass([
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              __props.representative.notificationsEnabled ? "bg-success/10 text-success" : "bg-gray-100 text-gray-600 dark:bg-meta-4 dark:text-gray-400"
            ])}">${ssrInterpolate(__props.representative.notificationsEnabled ? "Включены" : "Выключены")}</span></div></div></div><div class="rounded-lg border border-stroke dark:border-strokedark p-4"><div class="flex items-center justify-between mb-4"><h4 class="font-medium text-black dark:text-white">Разрешения Telegram-бота</h4>`);
            if (permissionsChanged.value) {
              _push2(ssrRenderComponent(_component_UiButton, {
                variant: "primary",
                size: "sm",
                onClick: savePermissions,
                disabled: isSaving.value
              }, {
                default: withCtx((_, _push3, _parent2, _scopeId) => {
                  if (_push3) {
                    _push3(`${ssrInterpolate(isSaving.value ? "Сохранение..." : "Сохранить")}`);
                  } else {
                    return [
                      createTextVNode(toDisplayString(isSaving.value ? "Сохранение..." : "Сохранить"), 1)
                    ];
                  }
                }),
                _: 1
              }, _parent));
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="space-y-3"><label class="flex items-center gap-3 cursor-pointer group"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(localPermissions.value.can_view_students) ? ssrLooseContain(localPermissions.value.can_view_students, null) : localPermissions.value.can_view_students) ? " checked" : ""} class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"><div class="flex-1"><p class="font-medium text-black dark:text-white group-hover:text-primary transition-colors"> Просмотр списка слушателей </p><p class="text-sm text-gray-600 dark:text-gray-400"> Команда /students - показывает список всех слушателей организации </p></div></label><label class="flex items-center gap-3 cursor-pointer group"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(localPermissions.value.can_view_schedule) ? ssrLooseContain(localPermissions.value.can_view_schedule, null) : localPermissions.value.can_view_schedule) ? " checked" : ""} class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"><div class="flex-1"><p class="font-medium text-black dark:text-white group-hover:text-primary transition-colors"> Просмотр расписания </p><p class="text-sm text-gray-600 dark:text-gray-400"> Команда /schedule - показывает расписание занятий на неделю </p></div></label><label class="flex items-center gap-3 cursor-pointer group"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(localPermissions.value.can_view_certificates) ? ssrLooseContain(localPermissions.value.can_view_certificates, null) : localPermissions.value.can_view_certificates) ? " checked" : ""} class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"><div class="flex-1"><p class="font-medium text-black dark:text-white group-hover:text-primary transition-colors"> Просмотр сертификатов </p><p class="text-sm text-gray-600 dark:text-gray-400"> Команда /certificates - показывает список выданных сертификатов </p></div></label><label class="flex items-center gap-3 cursor-pointer group"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(localPermissions.value.can_request_certificates) ? ssrLooseContain(localPermissions.value.can_request_certificates, null) : localPermissions.value.can_request_certificates) ? " checked" : ""}${ssrIncludeBooleanAttr(!localPermissions.value.can_view_certificates) ? " disabled" : ""} class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"><div class="flex-1"><p class="font-medium text-black dark:text-white group-hover:text-primary transition-colors"> Запрос файлов сертификатов </p><p class="text-sm text-gray-600 dark:text-gray-400"> Возможность скачивать PDF файлы сертификатов через бота </p>`);
            if (!localPermissions.value.can_view_certificates) {
              _push2(`<p class="text-xs text-warning mt-1"> ⚠️ Требуется разрешение на просмотр сертификатов </p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></label></div></div>`);
            if (__props.representative.status === "approved" && __props.representative.approvedBy) {
              _push2(`<div class="rounded-lg border border-stroke dark:border-strokedark p-4"><h4 class="font-medium text-black dark:text-white mb-4">Информация об одобрении</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><p class="text-sm text-gray-600 dark:text-gray-400">Одобрил</p><p class="font-medium text-black dark:text-white">${ssrInterpolate(__props.representative.approvedByName || "Неизвестно")}</p></div><div><p class="text-sm text-gray-600 dark:text-gray-400">Дата одобрения</p><p class="font-medium text-black dark:text-white">${ssrInterpolate(formatDate(__props.representative.approvedAt))}</p></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (__props.representative.status === "blocked" && __props.representative.blockedReason) {
              _push2(`<div class="rounded-lg border border-danger/20 bg-danger/5 p-4"><h4 class="font-medium text-danger mb-2">Причина блокировки</h4><p class="text-sm text-gray-700 dark:text-gray-300">${ssrInterpolate(__props.representative.blockedReason)}</p></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="rounded-lg border border-stroke dark:border-strokedark p-4"><h4 class="font-medium text-black dark:text-white mb-4">Активность</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><p class="text-sm text-gray-600 dark:text-gray-400">Дата регистрации</p><p class="font-medium text-black dark:text-white">${ssrInterpolate(formatDate(__props.representative.createdAt))}</p></div><div><p class="text-sm text-gray-600 dark:text-gray-400">Последняя активность</p><p class="font-medium text-black dark:text-white">${ssrInterpolate(__props.representative.lastActivityAt ? formatDate(__props.representative.lastActivityAt) : "Нет данных")}</p></div></div></div>`);
            if (__props.representative.status === "approved") {
              _push2(`<div class="rounded-lg border border-stroke dark:border-strokedark p-4"><div class="flex items-center justify-between mb-4"><h4 class="font-medium text-black dark:text-white">Журнал запросов к боту</h4>`);
              if (!showRequestHistory.value) {
                _push2(`<button class="text-sm text-primary hover:underline"> Показать историю </button>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
              if (requestStats.value) {
                _push2(`<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"><div class="rounded-lg bg-gray-50 dark:bg-meta-4 p-3"><p class="text-xs text-gray-600 dark:text-gray-400">Всего запросов</p><p class="text-lg font-bold text-black dark:text-white">${ssrInterpolate(requestStats.value.total)}</p></div><div class="rounded-lg bg-success/10 p-3"><p class="text-xs text-gray-600 dark:text-gray-400">Успешных</p><p class="text-lg font-bold text-success">${ssrInterpolate(requestStats.value.success)}</p></div><div class="rounded-lg bg-danger/10 p-3"><p class="text-xs text-gray-600 dark:text-gray-400">Ошибок</p><p class="text-lg font-bold text-danger">${ssrInterpolate(requestStats.value.error)}</p></div><div class="rounded-lg bg-warning/10 p-3"><p class="text-xs text-gray-600 dark:text-gray-400">Отказано</p><p class="text-lg font-bold text-warning">${ssrInterpolate(requestStats.value.denied)}</p></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (showRequestHistory.value) {
                _push2(`<div>`);
                if (loadingRequests.value) {
                  _push2(`<div class="text-center py-4"><p class="text-sm text-gray-500">Загрузка...</p></div>`);
                } else if (requestHistory.value.length === 0) {
                  _push2(`<div class="text-center py-4"><p class="text-sm text-gray-500">Нет запросов</p></div>`);
                } else {
                  _push2(`<div class="space-y-2 max-h-96 overflow-y-auto"><!--[-->`);
                  ssrRenderList(requestHistory.value, (request) => {
                    _push2(`<div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-meta-4"><div class="${ssrRenderClass([
                      "mt-1 h-2 w-2 rounded-full shrink-0",
                      request.status === "success" && "bg-success",
                      request.status === "error" && "bg-danger",
                      request.status === "denied" && "bg-warning"
                    ])}"></div><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><span class="font-medium text-black dark:text-white font-mono text-sm">${ssrInterpolate(request.command)}</span><span class="${ssrRenderClass([
                      "text-xs px-2 py-0.5 rounded-full",
                      request.requestType === "command" && "bg-primary/10 text-primary",
                      request.requestType === "callback" && "bg-info/10 text-info",
                      request.requestType === "message" && "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    ])}">${ssrInterpolate(request.requestType)}</span></div><p class="text-xs text-gray-600 dark:text-gray-400">${ssrInterpolate(formatDate(request.createdAt))} `);
                    if (request.responseTimeMs) {
                      _push2(`<span class="ml-2"> • ${ssrInterpolate(request.responseTimeMs)}ms </span>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</p>`);
                    if (request.errorMessage) {
                      _push2(`<p class="text-xs text-danger mt-1">${ssrInterpolate(request.errorMessage)}</p>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div></div>`);
                  });
                  _push2(`<!--]--></div>`);
                }
                if (requestHistory.value.length > 0) {
                  _push2(`<button class="mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"> Скрыть историю </button>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="sticky bottom-0 border-t border-stroke px-6 py-4 dark:border-strokedark bg-white dark:bg-boxdark"><div class="flex justify-end">`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "secondary",
              onClick: handleClose
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(` Закрыть `);
                } else {
                  return [
                    createTextVNode(" Закрыть ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push2(`</div></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/representatives/RepresentativeDetailModal.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$4, { __name: "RepresentativesRepresentativeDetailModal" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "ApproveRepresentativeModal",
  __ssrInlineRender: true,
  props: {
    representative: {},
    isOpen: { type: Boolean }
  },
  emits: ["close", "submit"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const isSubmitting = ref(false);
    const isVisible = ref(false);
    const accessType = ref("all");
    const selectedGroups = ref([]);
    const availableGroups = ref([]);
    const handleClose = () => {
      isVisible.value = false;
      setTimeout(() => {
        emit("close");
      }, 300);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$4;
      ssrRenderTeleport(_push, (_push2) => {
        if (isVisible.value) {
          _push2(`<div class="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 px-4 py-5">`);
          if (isVisible.value) {
            _push2(`<div class="w-full max-w-2xl rounded-lg bg-white dark:bg-boxdark shadow-xl"><div class="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between"><h3 class="text-xl font-semibold text-black dark:text-white"> Одобрение представителя </h3><button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><form class="p-6"><div class="mb-6 rounded-lg bg-gray-50 dark:bg-meta-4 p-4"><h4 class="font-medium text-black dark:text-white mb-3">Информация о представителе</h4><div class="grid grid-cols-2 gap-3 text-sm"><div><span class="text-gray-600 dark:text-gray-400">ФИО:</span><span class="ml-2 font-medium text-black dark:text-white">${ssrInterpolate(__props.representative.fullName)}</span></div><div><span class="text-gray-600 dark:text-gray-400">Телефон:</span><span class="ml-2 font-medium text-black dark:text-white">${ssrInterpolate(__props.representative.phone)}</span></div><div class="col-span-2"><span class="text-gray-600 dark:text-gray-400">Организация:</span><span class="ml-2 font-medium text-black dark:text-white">${ssrInterpolate(__props.representative.organizationName)}</span></div>`);
            if (__props.representative.telegramUsername) {
              _push2(`<div><span class="text-gray-600 dark:text-gray-400">Telegram:</span><span class="ml-2 font-medium text-black dark:text-white">@${ssrInterpolate(__props.representative.telegramUsername)}</span></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="mb-6"><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Доступ к группам </label><div class="space-y-3"><label class="flex items-center gap-3 cursor-pointer"><input${ssrIncludeBooleanAttr(ssrLooseEqual(accessType.value, "all")) ? " checked" : ""} type="radio" value="all" class="h-4 w-4 text-primary focus:ring-primary"><div><div class="font-medium text-black dark:text-white">Все группы организации</div><div class="text-sm text-gray-500 dark:text-gray-400"> Представитель сможет видеть всех слушателей и расписание всех групп своей организации </div></div></label><label class="flex items-center gap-3 cursor-pointer"><input${ssrIncludeBooleanAttr(ssrLooseEqual(accessType.value, "specific")) ? " checked" : ""} type="radio" value="specific" class="h-4 w-4 text-primary focus:ring-primary"><div><div class="font-medium text-black dark:text-white">Выбранные группы</div><div class="text-sm text-gray-500 dark:text-gray-400"> Ограничить доступ только к определённым группам </div></div></label></div>`);
            if (accessType.value === "specific") {
              _push2(`<div class="mt-4 p-4 rounded-lg border border-stroke dark:border-strokedark"><p class="text-sm text-gray-600 dark:text-gray-400 mb-3"> Выберите группы для доступа: </p><div class="max-h-48 overflow-y-auto space-y-2"><!--[-->`);
              ssrRenderList(availableGroups.value, (group) => {
                _push2(`<label class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-meta-4 p-2 rounded"><input${ssrIncludeBooleanAttr(Array.isArray(selectedGroups.value) ? ssrLooseContain(selectedGroups.value, group.id) : selectedGroups.value) ? " checked" : ""} type="checkbox"${ssrRenderAttr("value", group.id)} class="h-4 w-4 text-primary focus:ring-primary"><span class="text-sm text-black dark:text-white">${ssrInterpolate(group.code)} - ${ssrInterpolate(group.courseName)}</span></label>`);
              });
              _push2(`<!--]--></div>`);
              if (availableGroups.value.length === 0) {
                _push2(`<p class="text-sm text-gray-500 dark:text-gray-400 italic"> Нет доступных групп для этой организации </p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="flex justify-end gap-4">`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "danger",
              onClick: handleClose,
              disabled: isSubmitting.value
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(` Отмена `);
                } else {
                  return [
                    createTextVNode(" Отмена ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "success",
              type: "submit",
              loading: isSubmitting.value
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(` Одобрить `);
                } else {
                  return [
                    createTextVNode(" Одобрить ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push2(`</div></form></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/representatives/ApproveRepresentativeModal.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$3, { __name: "RepresentativesApproveRepresentativeModal" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "BlockRepresentativeModal",
  __ssrInlineRender: true,
  props: {
    representative: {},
    isOpen: { type: Boolean }
  },
  emits: ["close", "submit"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const isSubmitting = ref(false);
    const isVisible = ref(false);
    const reason = ref("");
    const error = ref("");
    const handleClose = () => {
      isVisible.value = false;
      setTimeout(() => {
        emit("close");
      }, 300);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$4;
      ssrRenderTeleport(_push, (_push2) => {
        if (isVisible.value) {
          _push2(`<div class="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 px-4 py-5">`);
          if (isVisible.value) {
            _push2(`<div class="w-full max-w-lg rounded-lg bg-white dark:bg-boxdark shadow-xl"><div class="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between"><h3 class="text-xl font-semibold text-black dark:text-white"> Блокировка представителя </h3><button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><form class="p-6"><div class="mb-6 rounded-lg bg-gray-50 dark:bg-meta-4 p-4"><div class="text-sm"><span class="text-gray-600 dark:text-gray-400">Представитель:</span><span class="ml-2 font-medium text-black dark:text-white">${ssrInterpolate(__props.representative.fullName)}</span></div><div class="text-sm mt-2"><span class="text-gray-600 dark:text-gray-400">Организация:</span><span class="ml-2 font-medium text-black dark:text-white">${ssrInterpolate(__props.representative.organizationName)}</span></div></div><div class="mb-6"><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Причина блокировки <span class="text-danger">*</span></label><textarea rows="4" placeholder="Укажите причину блокировки..." class="${ssrRenderClass([{ "border-danger": error.value }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary resize-none"])}" required>${ssrInterpolate(reason.value)}</textarea>`);
            if (error.value) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(error.value)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<p class="mt-1 text-xs text-gray-500 dark:text-gray-400"> Причина будет отправлена представителю в Telegram </p></div><div class="mb-6 rounded-lg bg-warning/10 border border-warning/20 p-4"><div class="flex gap-3"><svg class="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><div class="text-sm text-gray-700 dark:text-gray-300"><p class="font-medium mb-1">Внимание!</p><p>После блокировки представитель потеряет доступ к информации через Telegram-бота.</p></div></div></div><div class="flex justify-end gap-4">`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "secondary",
              onClick: handleClose,
              disabled: isSubmitting.value
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(` Отмена `);
                } else {
                  return [
                    createTextVNode(" Отмена ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "danger",
              type: "submit",
              loading: isSubmitting.value
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(` Заблокировать `);
                } else {
                  return [
                    createTextVNode(" Заблокировать ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push2(`</div></form></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/representatives/BlockRepresentativeModal.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_3$1 = Object.assign(_sfc_main$2, { __name: "RepresentativesBlockRepresentativeModal" });
const limit = 20;
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "RepresentativeManagementPanel",
  __ssrInlineRender: true,
  setup(__props) {
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const loading = ref(false);
    const representatives = ref([]);
    const organizations = ref([]);
    const stats = ref(null);
    const filters = reactive({
      search: "",
      status: "",
      organizationId: ""
    });
    const currentPage = ref(1);
    const totalPages = ref(1);
    const showDetailModal = ref(false);
    const selectedRepresentative = ref(null);
    const showApproveModal = ref(false);
    const representativeToApprove = ref(null);
    const showBlockModal = ref(false);
    const representativeToBlock = ref(null);
    const loadRepresentatives = async () => {
      loading.value = true;
      try {
        const params = new URLSearchParams({
          page: currentPage.value.toString(),
          limit: limit.toString()
        });
        if (filters.search) params.append("search", filters.search);
        if (filters.status) params.append("status", filters.status);
        if (filters.organizationId) params.append("organizationId", filters.organizationId);
        const response = await authFetch(`/api/representatives?${params.toString()}`, { method: "GET" });
        if (response.success) {
          representatives.value = response.data;
          totalPages.value = response.totalPages;
        }
      } catch (error) {
        console.error("Error loading representatives:", error);
        notification.error("Ошибка при загрузке представителей");
      } finally {
        loading.value = false;
      }
    };
    const loadStats = async () => {
      try {
        const response = await authFetch("/api/representatives/stats", { method: "GET" });
        if (response.success) {
          stats.value = response.data;
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };
    const handleView = (representative) => {
      selectedRepresentative.value = representative;
      showDetailModal.value = true;
    };
    const closeDetailModal = () => {
      showDetailModal.value = false;
      selectedRepresentative.value = null;
    };
    const handleApprove = (representative) => {
      representativeToApprove.value = representative;
      showApproveModal.value = true;
      closeDetailModal();
    };
    const closeApproveModal = () => {
      showApproveModal.value = false;
      representativeToApprove.value = null;
    };
    const submitApproval = async (data) => {
      if (!representativeToApprove.value) return;
      try {
        const response = await authFetch(
          `/api/representatives/${representativeToApprove.value.id}/approve`,
          {
            method: "POST",
            body: data
          }
        );
        if (response.success) {
          notification.success("Представитель успешно одобрен");
          closeApproveModal();
          await Promise.all([loadRepresentatives(), loadStats()]);
        }
      } catch (error) {
        notification.error(error.data?.message || "Ошибка при одобрении");
      }
    };
    const handleBlock = (representative) => {
      representativeToBlock.value = representative;
      showBlockModal.value = true;
      closeDetailModal();
    };
    const closeBlockModal = () => {
      showBlockModal.value = false;
      representativeToBlock.value = null;
    };
    const submitBlock = async (data) => {
      if (!representativeToBlock.value) return;
      try {
        const response = await authFetch(
          `/api/representatives/${representativeToBlock.value.id}/block`,
          {
            method: "POST",
            body: data
          }
        );
        if (response.success) {
          notification.success("Представитель заблокирован");
          closeBlockModal();
          await Promise.all([loadRepresentatives(), loadStats()]);
        }
      } catch (error) {
        notification.error(error.data?.message || "Ошибка при блокировке");
      }
    };
    const handleDelete = async (representative) => {
      if (!confirm(`Удалить представителя ${representative.fullName}?`)) return;
      try {
        const response = await authFetch(`/api/representatives/${representative.id}`, {
          method: "DELETE"
        });
        if (response.success) {
          notification.success("Представитель удалён");
          await Promise.all([loadRepresentatives(), loadStats()]);
        }
      } catch (error) {
        notification.error(error.data?.message || "Ошибка при удалении");
      }
    };
    const handleRepresentativeUpdated = async () => {
      await loadRepresentatives();
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_RepresentativesRepresentativeTable = __nuxt_component_0;
      const _component_RepresentativesRepresentativeDetailModal = __nuxt_component_1;
      const _component_RepresentativesApproveRepresentativeModal = __nuxt_component_2;
      const _component_RepresentativesBlockRepresentativeModal = __nuxt_component_3$1;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 class="text-xl font-semibold text-black dark:text-white"> Представители организаций </h3><p class="text-sm text-gray-500 dark:text-gray-400 mt-1"> Управление заявками и доступом представителей </p></div>`);
      if (stats.value) {
        _push(`<div class="flex gap-3"><div class="rounded-lg bg-primary/10 px-4 py-2"><div class="text-xs text-gray-600 dark:text-gray-400">Всего</div><div class="text-lg font-bold text-primary">${ssrInterpolate(stats.value.total)}</div></div><div class="rounded-lg bg-warning/10 px-4 py-2"><div class="text-xs text-gray-600 dark:text-gray-400">Ожидают</div><div class="text-lg font-bold text-warning">${ssrInterpolate(stats.value.pending)}</div></div><div class="rounded-lg bg-success/10 px-4 py-2"><div class="text-xs text-gray-600 dark:text-gray-400">Одобрено</div><div class="text-lg font-bold text-success">${ssrInterpolate(stats.value.approved)}</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="mb-6 rounded-lg bg-white dark:bg-boxdark p-4 shadow-sm"><div class="grid grid-cols-1 gap-4 sm:grid-cols-3"><div><label class="mb-2 block text-sm font-medium text-black dark:text-white"> Поиск </label><input${ssrRenderAttr("value", filters.search)} type="text" placeholder="ФИО, телефон, организация..." class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"></div><div><label class="mb-2 block text-sm font-medium text-black dark:text-white"> Статус </label><select class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "") : ssrLooseEqual(filters.status, "")) ? " selected" : ""}>Все статусы</option><option value="pending"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "pending") : ssrLooseEqual(filters.status, "pending")) ? " selected" : ""}>Ожидают одобрения</option><option value="approved"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "approved") : ssrLooseEqual(filters.status, "approved")) ? " selected" : ""}>Одобрены</option><option value="blocked"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "blocked") : ssrLooseEqual(filters.status, "blocked")) ? " selected" : ""}>Заблокированы</option></select></div><div><label class="mb-2 block text-sm font-medium text-black dark:text-white"> Организация </label><select class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.organizationId) ? ssrLooseContain(filters.organizationId, "") : ssrLooseEqual(filters.organizationId, "")) ? " selected" : ""}>Все организации</option><!--[-->`);
      ssrRenderList(organizations.value, (org) => {
        _push(`<option${ssrRenderAttr("value", org.id)}${ssrIncludeBooleanAttr(Array.isArray(filters.organizationId) ? ssrLooseContain(filters.organizationId, org.id) : ssrLooseEqual(filters.organizationId, org.id)) ? " selected" : ""}>${ssrInterpolate(org.name)}</option>`);
      });
      _push(`<!--]--></select></div></div></div>`);
      _push(ssrRenderComponent(_component_RepresentativesRepresentativeTable, {
        representatives: representatives.value,
        loading: loading.value,
        onView: handleView,
        onApprove: handleApprove,
        onBlock: handleBlock,
        onDelete: handleDelete
      }, null, _parent));
      if (totalPages.value > 1) {
        _push(`<div class="mt-6 flex justify-center"><nav class="flex gap-2"><!--[-->`);
        ssrRenderList(totalPages.value, (page) => {
          _push(`<button class="${ssrRenderClass([
            "px-4 py-2 rounded-lg font-medium transition-colors",
            currentPage.value === page ? "bg-primary text-white" : "bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4"
          ])}">${ssrInterpolate(page)}</button>`);
        });
        _push(`<!--]--></nav></div>`);
      } else {
        _push(`<!---->`);
      }
      if (selectedRepresentative.value) {
        _push(ssrRenderComponent(_component_RepresentativesRepresentativeDetailModal, {
          representative: selectedRepresentative.value,
          "is-open": showDetailModal.value,
          onClose: closeDetailModal,
          onApprove: handleApprove,
          onBlock: handleBlock,
          onUpdated: handleRepresentativeUpdated
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (representativeToApprove.value) {
        _push(ssrRenderComponent(_component_RepresentativesApproveRepresentativeModal, {
          representative: representativeToApprove.value,
          "is-open": showApproveModal.value,
          onClose: closeApproveModal,
          onSubmit: submitApproval
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (representativeToBlock.value) {
        _push(ssrRenderComponent(_component_RepresentativesBlockRepresentativeModal, {
          representative: representativeToBlock.value,
          "is-open": showBlockModal.value,
          onClose: closeBlockModal,
          onSubmit: submitBlock
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/representatives/RepresentativeManagementPanel.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$1, { __name: "RepresentativesRepresentativeManagementPanel" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    useRouter();
    const { user } = useAuth();
    const isAdmin = computed(() => user.value?.role === "ADMIN");
    computed(() => user.value?.role === "MANAGER");
    const allTabs = [
      {
        id: "admin",
        label: "Администраторы",
        roles: ["ADMIN"]
        // Видна только админам
      },
      {
        id: "manager",
        label: "Модераторы",
        roles: ["ADMIN"]
        // Видна только админам
      },
      {
        id: "instructors",
        label: "Инструкторы",
        roles: ["ADMIN", "MANAGER"]
        // Видна админам и модераторам
      },
      {
        id: "students",
        label: "Студенты",
        roles: ["ADMIN", "MANAGER"]
        // Видна админам и модераторам
      },
      {
        id: "representatives",
        label: "Представители",
        roles: ["ADMIN"]
        // Видна только админам
      }
    ];
    const visibleTabs = computed(() => {
      const userRole = user.value?.role || "";
      return allTabs.filter((tab) => tab.roles.includes(userRole));
    });
    const activeTab = ref("");
    const syncTabWithUrl = () => {
      const tab = route.query.tab;
      if (tab && visibleTabs.value.some((t) => t.id === tab)) {
        activeTab.value = tab;
      } else if (visibleTabs.value.length > 0 && !activeTab.value) {
        activeTab.value = visibleTabs.value[0].id;
      }
    };
    watch(() => route.query.tab, () => {
      syncTabWithUrl();
    });
    watchEffect(() => {
      if (visibleTabs.value.length > 0) {
        syncTabWithUrl();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UsersUserManagementPanel = __nuxt_component_0$1;
      const _component_UsersInstructorManagementPanel = __nuxt_component_1$1;
      const _component_DatabaseStudentManagementPanel = __nuxt_component_0$2;
      const _component_RepresentativesRepresentativeManagementPanel = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Управление пользователями </h2><p class="text-sm text-gray-600 dark:text-gray-400 mt-1"> Создание и управление учётными записями </p></div></div><div class="flex flex-col gap-6"><div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800"><nav class="flex gap-1" aria-label="Tabs"><!--[-->`);
      ssrRenderList(visibleTabs.value, (tab) => {
        _push(`<button class="${ssrRenderClass([
          "flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 relative",
          activeTab.value === tab.id ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        ])}"><span class="flex items-center justify-center gap-2">${ssrInterpolate(tab.label)}</span></button>`);
      });
      _push(`<!--]--></nav></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">`);
      if (isAdmin.value) {
        _push(`<div class="p-6" style="${ssrRenderStyle(activeTab.value === "admin" ? null : { display: "none" })}">`);
        _push(ssrRenderComponent(_component_UsersUserManagementPanel, {
          role: unref(UserRole).ADMIN
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (isAdmin.value) {
        _push(`<div class="p-6" style="${ssrRenderStyle(activeTab.value === "manager" ? null : { display: "none" })}">`);
        _push(ssrRenderComponent(_component_UsersUserManagementPanel, {
          role: unref(UserRole).MANAGER
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="p-6" style="${ssrRenderStyle(activeTab.value === "instructors" ? null : { display: "none" })}">`);
      _push(ssrRenderComponent(_component_UsersInstructorManagementPanel, null, null, _parent));
      _push(`</div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "students" ? null : { display: "none" })}">`);
      _push(ssrRenderComponent(_component_DatabaseStudentManagementPanel, null, null, _parent));
      _push(`</div>`);
      if (isAdmin.value) {
        _push(`<div class="p-6" style="${ssrRenderStyle(activeTab.value === "representatives" ? null : { display: "none" })}">`);
        _push(ssrRenderComponent(_component_RepresentativesRepresentativeManagementPanel, null, null, _parent));
        _push(`</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/users/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-B5z0RIIG.mjs.map
