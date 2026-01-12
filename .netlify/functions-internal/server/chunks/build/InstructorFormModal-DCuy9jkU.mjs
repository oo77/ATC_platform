import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { defineComponent, ref, reactive, computed, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderTeleport, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrRenderComponent } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "InstructorFormModal",
  __ssrInlineRender: true,
  props: {
    instructor: {}
  },
  emits: ["close", "save"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const loading = ref(false);
    const isVisible = ref(false);
    const errors = reactive({});
    const formData = reactive({
      fullName: "",
      email: "",
      phone: "",
      hireDate: "",
      contractInfo: "",
      maxHours: 0,
      isActive: true,
      // Поля для создания учётной записи (новый инструктор)
      createAccount: true,
      accountPassword: "",
      // Поля для смены пароля (редактирование инструктора с аккаунтом)
      changePassword: false,
      newPassword: "",
      confirmNewPassword: "",
      // Создание аккаунта для существующего инструктора
      createAccountForExisting: false
    });
    const isEditMode = computed(() => !!props.instructor);
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
            _push2(`<div class="w-full max-w-3xl rounded-lg bg-white dark:bg-boxdark shadow-xl"><div class="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between"><h3 class="text-xl font-semibold text-black dark:text-white">${ssrInterpolate(isEditMode.value ? "Редактировать" : "Добавить")} инструктора </h3><button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><form class="p-6"><div class="grid grid-cols-1 gap-6 sm:grid-cols-2"><div class="sm:col-span-2"><label class="mb-3 block text-sm font-medium text-black dark:text-white"> ФИО <span class="text-danger">*</span></label><input${ssrRenderAttr("value", formData.fullName)} type="text" placeholder="Введите полное имя" class="${ssrRenderClass([{ "border-danger": errors.fullName }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" required>`);
            if (errors.fullName) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.fullName[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Email `);
            if (!isEditMode.value && formData.createAccount) {
              _push2(`<span class="text-danger">*</span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</label><input${ssrRenderAttr("value", formData.email)} type="email" placeholder="email@example.com" class="${ssrRenderClass([{ "border-danger": errors.email }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}">`);
            if (errors.email) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.email[0])}</p>`);
            } else if (!isEditMode.value && formData.createAccount) {
              _push2(`<p class="mt-1 text-xs text-gray-500 dark:text-gray-400"> Будет использоваться для входа в систему </p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Номер телефона </label><input${ssrRenderAttr("value", formData.phone)} type="tel" placeholder="+998901234567" class="${ssrRenderClass([{ "border-danger": errors.phone }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}">`);
            if (errors.phone) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.phone[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<p class="mt-1 text-xs text-gray-500 dark:text-gray-400"> Формат: +998XXXXXXXXX </p></div><div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Прием на работу </label><input${ssrRenderAttr("value", formData.hireDate)} type="date" class="${ssrRenderClass([{ "border-danger": errors.hireDate }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}">`);
            if (errors.hireDate) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.hireDate[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Максимальные часы </label><input${ssrRenderAttr("value", formData.maxHours)} type="number" min="0" placeholder="0" class="${ssrRenderClass([{ "border-danger": errors.maxHours }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}">`);
            if (errors.maxHours) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.maxHours[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<p class="mt-1 text-xs text-gray-500 dark:text-gray-400"> Для отчетности о количестве часов обучения </p></div><div class="sm:col-span-2"><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Данные о трудовом договоре </label><textarea rows="4" placeholder="Номер договора, дата заключения, условия и прочая информация" class="${ssrRenderClass([{ "border-danger": errors.contractInfo }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary resize-none"])}">${ssrInterpolate(formData.contractInfo)}</textarea>`);
            if (errors.contractInfo) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.contractInfo[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="sm:col-span-2"><label class="flex items-center gap-3 cursor-pointer"><input${ssrIncludeBooleanAttr(Array.isArray(formData.isActive) ? ssrLooseContain(formData.isActive, null) : formData.isActive) ? " checked" : ""} type="checkbox" class="sr-only"><div class="${ssrRenderClass([
              "relative h-6 w-11 rounded-full transition-colors",
              formData.isActive ? "bg-success" : "bg-gray-300 dark:bg-gray-600"
            ])}"><div class="${ssrRenderClass([
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
              formData.isActive ? "translate-x-5" : "translate-x-0.5"
            ])}"></div></div><span class="text-sm font-medium text-black dark:text-white"> Активен </span></label></div>`);
            if (!isEditMode.value) {
              _push2(`<div class="sm:col-span-2 mt-4 pt-4 border-t border-stroke dark:border-strokedark"><label class="flex items-center gap-3 cursor-pointer"><input${ssrIncludeBooleanAttr(Array.isArray(formData.createAccount) ? ssrLooseContain(formData.createAccount, null) : formData.createAccount) ? " checked" : ""} type="checkbox" class="sr-only"><div class="${ssrRenderClass([
                "relative h-6 w-11 rounded-full transition-colors",
                formData.createAccount ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
              ])}"><div class="${ssrRenderClass([
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                formData.createAccount ? "translate-x-5" : "translate-x-0.5"
              ])}"></div></div><span class="text-sm font-medium text-black dark:text-white"> Создать учётную запись для входа </span></label>`);
              if (formData.createAccount) {
                _push2(`<div class="mt-4"><label class="mb-2 block text-sm font-medium text-black dark:text-white"> Пароль <span class="text-danger">*</span></label><input${ssrRenderAttr("value", formData.accountPassword)} type="password" placeholder="Минимум 8 символов" class="${ssrRenderClass([{ "border-danger": errors.accountPassword }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}">`);
                if (errors.accountPassword) {
                  _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.accountPassword[0])}</p>`);
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
            if (isEditMode.value && props.instructor?.userId) {
              _push2(`<div class="sm:col-span-2 mt-4 pt-4 border-t border-stroke dark:border-strokedark"><label class="flex items-center gap-3 cursor-pointer"><input${ssrIncludeBooleanAttr(Array.isArray(formData.changePassword) ? ssrLooseContain(formData.changePassword, null) : formData.changePassword) ? " checked" : ""} type="checkbox" class="sr-only"><div class="${ssrRenderClass([
                "relative h-6 w-11 rounded-full transition-colors",
                formData.changePassword ? "bg-warning" : "bg-gray-300 dark:bg-gray-600"
              ])}"><div class="${ssrRenderClass([
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                formData.changePassword ? "translate-x-5" : "translate-x-0.5"
              ])}"></div></div><span class="text-sm font-medium text-black dark:text-white"> Изменить пароль </span></label>`);
              if (formData.changePassword) {
                _push2(`<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4"><div><label class="mb-2 block text-sm font-medium text-black dark:text-white"> Новый пароль <span class="text-danger">*</span></label><input${ssrRenderAttr("value", formData.newPassword)} type="password" placeholder="Минимум 8 символов" class="${ssrRenderClass([{ "border-danger": errors.newPassword }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}">`);
                if (errors.newPassword) {
                  _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.newPassword[0])}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div><label class="mb-2 block text-sm font-medium text-black dark:text-white"> Подтвердите пароль <span class="text-danger">*</span></label><input${ssrRenderAttr("value", formData.confirmNewPassword)} type="password" placeholder="Повторите пароль" class="${ssrRenderClass([{ "border-danger": errors.confirmNewPassword }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}">`);
                if (errors.confirmNewPassword) {
                  _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.confirmNewPassword[0])}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (isEditMode.value && !props.instructor?.userId) {
              _push2(`<div class="sm:col-span-2 mt-4 pt-4 border-t border-stroke dark:border-strokedark"><div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"><p class="text-gray-600 dark:text-gray-400 mb-3 text-center"> У инструктора нет учётной записи </p>`);
              if (!formData.createAccountForExisting) {
                _push2(ssrRenderComponent(_component_UiButton, {
                  variant: "primary",
                  size: "sm",
                  onClick: ($event) => formData.createAccountForExisting = true,
                  class: "w-full"
                }, {
                  default: withCtx((_, _push3, _parent2, _scopeId) => {
                    if (_push3) {
                      _push3(` Создать учётную запись `);
                    } else {
                      return [
                        createTextVNode(" Создать учётную запись ")
                      ];
                    }
                  }),
                  _: 1
                }, _parent));
              } else {
                _push2(`<!---->`);
              }
              if (formData.createAccountForExisting) {
                _push2(`<div class="mt-4"><label class="mb-2 block text-sm font-medium text-black dark:text-white"> Пароль <span class="text-danger">*</span></label><input${ssrRenderAttr("value", formData.accountPassword)} type="password" placeholder="Минимум 8 символов" class="${ssrRenderClass([{ "border-danger": errors.accountPassword }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}">`);
                if (errors.accountPassword) {
                  _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.accountPassword[0])}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<p class="mt-1 text-xs text-gray-500 dark:text-gray-400"> Email инструктора будет использоваться для входа </p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="mt-6 flex justify-end gap-4">`);
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
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/users/InstructorFormModal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main, { __name: "UsersInstructorFormModal" });

export { __nuxt_component_2 as _ };
//# sourceMappingURL=InstructorFormModal-DCuy9jkU.mjs.map
