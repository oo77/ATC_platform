import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { defineComponent, ref, reactive, computed, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderTeleport, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderComponent, ssrRenderDynamicModel } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
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
      const _component_UiButton = __nuxt_component_1;
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
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/users/UserFormModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$1, { __name: "UsersUserFormModal" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "UserPasswordModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    userId: {},
    userName: {}
  },
  emits: ["close", "success"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    useAuthFetch();
    const loading = ref(false);
    const password = ref("");
    const showPassword = ref(false);
    const close = () => {
      password.value = "";
      showPassword.value = false;
      emit("close");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      ssrRenderTeleport(_push, (_push2) => {
        if (__props.isOpen) {
          _push2(`<div class="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 px-4 py-5">`);
          if (__props.isOpen) {
            _push2(`<div class="w-full max-w-md rounded-lg bg-white dark:bg-boxdark shadow-xl"><div class="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between"><h3 class="text-xl font-semibold text-black dark:text-white"> Сброс пароля </h3><button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"${ssrIncludeBooleanAttr(loading.value) ? " disabled" : ""}><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><form class="p-6"><div class="mb-4"><p class="mb-4 text-sm text-gray-600 dark:text-gray-400"> Установите новый пароль для пользователя <span class="font-medium text-black dark:text-white">${ssrInterpolate(__props.userName)}</span>. </p><div class="mb-4"><label class="mb-2.5 block font-medium text-black dark:text-white"> Новый пароль </label><div class="relative"><input${ssrRenderDynamicModel(showPassword.value ? "text" : "password", password.value, null)}${ssrRenderAttr("type", showPassword.value ? "text" : "password")} placeholder="Введите новый пароль" class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-6 pr-10 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary" required minlength="6"><span class="absolute right-4 top-3 cursor-pointer p-0.5 z-10">`);
            if (!showPassword.value) {
              _push2(`<svg class="h-5 w-5 text-gray-500 hover:text-primary transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`);
            } else {
              _push2(`<svg class="h-5 w-5 text-gray-500 hover:text-primary transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>`);
            }
            _push2(`</span></div></div><div class="mb-4"><div class="flex flex-wrap gap-2"><button type="button" class="text-xs text-primary hover:underline"> Сгенерировать случайный пароль </button>`);
            if (password.value) {
              _push2(`<button type="button" class="text-xs text-primary hover:underline ml-auto"> Скопировать </button>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div></div><div class="flex justify-end gap-4 mt-6">`);
            _push2(ssrRenderComponent(_component_UiButton, {
              type: "button",
              variant: "danger",
              onClick: close,
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
              type: "submit",
              variant: "success",
              loading: loading.value,
              disabled: loading.value || !password.value || password.value.length < 6
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(` Сохранить `);
                } else {
                  return [
                    createTextVNode(" Сохранить ")
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
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/users/UserPasswordModal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main, { __name: "UsersUserPasswordModal" });

export { __nuxt_component_2 as _, __nuxt_component_3 as a };
//# sourceMappingURL=UserPasswordModal-DU7z1tfn.mjs.map
