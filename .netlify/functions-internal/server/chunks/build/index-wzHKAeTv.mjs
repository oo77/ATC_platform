import { _ as __nuxt_component_1$3 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_0$2 } from './nuxt-link-BHRIAP0y.mjs';
import { defineComponent, computed, ref, watchEffect, mergeProps, unref, withCtx, createTextVNode, toDisplayString, createBlock, openBlock, createVNode, reactive, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderStyle, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderTeleport } from 'vue/server-renderer';
import { a as useAuth, U as UserRole } from './server.mjs';
import { _ as __nuxt_component_2$1 } from './InstructorFormModal-DCuy9jkU.mjs';
import { _ as __nuxt_component_0$1 } from './StudentManagementPanel-BjWLUTcU.mjs';
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
import './StudentCertificatesModal-B7TOFcV4.mjs';
import './useAuthFetch-CmGEBSSi.mjs';
import './useNotification-C2RwAN1X.mjs';
import './Notification-Bd1V2gNg.mjs';
import './Modal-DQYphXo7.mjs';
import './ConfirmModal-GQ4JU241.mjs';

const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "UserTable",
  __ssrInlineRender: true,
  props: {
    users: {},
    loading: { type: Boolean },
    role: {}
  },
  emits: ["edit", "delete"],
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
      const _component_NuxtLink = __nuxt_component_0$2;
      const _component_UiButton = __nuxt_component_1$3;
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
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/users/UserTable.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_1$2 = Object.assign(_sfc_main$5, { __name: "UsersUserTable" });
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "UserFormModal",
  __ssrInlineRender: true,
  props: {
    user: {},
    role: {}
  },
  emits: ["close", "save"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const loading = ref(false);
    const isVisible = ref(false);
    const errors = reactive({});
    const formData = reactive({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      workplace: "",
      position: "",
      pinfl: ""
    });
    const isEditMode = computed(() => !!props.user);
    const roleLabel = computed(() => {
      const labels = {
        ADMIN: "Администратор",
        MANAGER: "Модератор",
        TEACHER: "Учитель",
        STUDENT: "Студент"
      };
      return labels[props.role];
    });
    const handleClose = () => {
      isVisible.value = false;
      setTimeout(() => {
        emit("close");
      }, 300);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$3;
      ssrRenderTeleport(_push, (_push2) => {
        if (isVisible.value) {
          _push2(`<div class="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 px-4 py-5">`);
          if (isVisible.value) {
            _push2(`<div class="w-full max-w-3xl rounded-lg bg-white dark:bg-boxdark shadow-xl"><div class="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between"><h3 class="text-xl font-semibold text-black dark:text-white">${ssrInterpolate(isEditMode.value ? "Редактировать" : "Добавить")} ${ssrInterpolate(roleLabel.value.toLowerCase())}а </h3><button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><form class="p-6"><div class="grid grid-cols-1 gap-6 sm:grid-cols-2"><div class="sm:col-span-2"><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Полное имя <span class="text-danger">*</span></label><input${ssrRenderAttr("value", formData.name)} type="text" placeholder="Введите полное имя" class="${ssrRenderClass([{ "border-danger": errors.name }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" required>`);
            if (errors.name) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.name[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Email <span class="text-danger">*</span></label><input${ssrRenderAttr("value", formData.email)} type="email" placeholder="email@example.com" class="${ssrRenderClass([{ "border-danger": errors.email }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}"${ssrIncludeBooleanAttr(isEditMode.value) ? " disabled" : ""} required>`);
            if (errors.email) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.email[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Телефон </label><input${ssrRenderAttr("value", formData.phone)} type="tel" placeholder="+998901234567" class="${ssrRenderClass([{ "border-danger": errors.phone }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}">`);
            if (errors.phone) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.phone[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<p class="mt-1 text-xs text-gray-500 dark:text-gray-400"> Формат: +998XXXXXXXXX </p></div>`);
            if (!isEditMode.value) {
              _push2(`<div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Пароль <span class="text-danger">*</span></label><input${ssrRenderAttr("value", formData.password)} type="password" placeholder="Минимум 6 символов" class="${ssrRenderClass([{ "border-danger": errors.password }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}"${ssrIncludeBooleanAttr(!isEditMode.value) ? " required" : ""}>`);
              if (errors.password) {
                _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.password[0])}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<p class="mt-1 text-xs text-gray-500 dark:text-gray-400"> Должен содержать заглавную букву, строчную букву и цифру </p></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (!isEditMode.value) {
              _push2(`<div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Подтвердите пароль <span class="text-danger">*</span></label><input${ssrRenderAttr("value", formData.confirmPassword)} type="password" placeholder="Повторите пароль" class="${ssrRenderClass([{ "border-danger": errors.confirmPassword }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}"${ssrIncludeBooleanAttr(!isEditMode.value) ? " required" : ""}>`);
              if (errors.confirmPassword) {
                _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.confirmPassword[0])}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Место работы </label><input${ssrRenderAttr("value", formData.workplace)} type="text" placeholder="Название организации" class="${ssrRenderClass([{ "border-danger": errors.workplace }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}">`);
            if (errors.workplace) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.workplace[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Должность </label><input${ssrRenderAttr("value", formData.position)} type="text" placeholder="Должность" class="${ssrRenderClass([{ "border-danger": errors.position }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}">`);
            if (errors.position) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.position[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="sm:col-span-2"><label class="mb-3 block text-sm font-medium text-black dark:text-white"> ПИНФЛ </label><input${ssrRenderAttr("value", formData.pinfl)} type="text" placeholder="14 цифр" maxlength="14" class="${ssrRenderClass([{ "border-danger": errors.pinfl }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}">`);
            if (errors.pinfl) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.pinfl[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<p class="mt-1 text-xs text-gray-500 dark:text-gray-400"> Персональный идентификационный номер физического лица (14 цифр) </p></div></div><div class="mt-6 flex justify-end gap-4">`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "danger",
              onClick: handleClose,
              disabled: loading.value
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
              loading: loading.value
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(`${ssrInterpolate(isEditMode.value ? "Сохранить" : "Создать")}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(isEditMode.value ? "Сохранить" : "Создать"), 1)
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
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/users/UserFormModal.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$4, { __name: "UsersUserFormModal" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
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
    const closeModal = () => {
      showModal.value = false;
      selectedUser.value = null;
    };
    const handleSave = async () => {
      await fetchUsers();
      closeModal();
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
      const _component_UiButton = __nuxt_component_1$3;
      const _component_UsersUserTable = __nuxt_component_1$2;
      const _component_UsersUserFormModal = __nuxt_component_2;
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
      _push(`</div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/users/UserManagementPanel.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main$3, { __name: "UsersUserManagementPanel" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
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
      const _component_NuxtLink = __nuxt_component_0$2;
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
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/users/InstructorTable.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_1$1 = Object.assign(_sfc_main$2, { __name: "UsersInstructorTable" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
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
      const _component_UiButton = __nuxt_component_1$3;
      const _component_UsersInstructorTable = __nuxt_component_1$1;
      const _component_UsersInstructorFormModal = __nuxt_component_2$1;
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
          onSave: handleSave
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/users/InstructorManagementPanel.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$1, { __name: "UsersInstructorManagementPanel" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
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
      }
    ];
    const visibleTabs = computed(() => {
      const userRole = user.value?.role || "";
      return allTabs.filter((tab) => tab.roles.includes(userRole));
    });
    const activeTab = ref("");
    watchEffect(() => {
      if (visibleTabs.value.length > 0 && !activeTab.value) {
        activeTab.value = visibleTabs.value[0].id;
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UsersUserManagementPanel = __nuxt_component_0;
      const _component_UsersInstructorManagementPanel = __nuxt_component_1;
      const _component_DatabaseStudentManagementPanel = __nuxt_component_0$1;
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
      _push(`</div></div></div></div>`);
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
//# sourceMappingURL=index-wzHKAeTv.mjs.map
