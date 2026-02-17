import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { defineComponent, computed, ref, reactive, withCtx, createTextVNode, createBlock, openBlock, createVNode, toDisplayString, mergeProps, createCommentVNode, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderTeleport, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrRenderList, ssrRenderComponent } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
import { e as useAuth } from './server.mjs';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
import { _ as __nuxt_component_0 } from './Modal-DQYphXo7.mjs';
import { _ as _sfc_main$2 } from './CertificateManualFormModal-DS6NpHYJ.mjs';
import { _ as __nuxt_component_3$1 } from './ConfirmModal-D4ued3Bi.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "StudentFormModal",
  __ssrInlineRender: true,
  props: {
    student: {},
    isOpen: { type: Boolean }
  },
  emits: ["close", "submit"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const { user } = useAuth();
    const canManagePassword = computed(() => {
      return user.value && ["ADMIN", "MANAGER"].includes(user.value.role);
    });
    const isSubmitting = ref(false);
    const isVisible = ref(false);
    const isResettingPassword = ref(false);
    const showChangePasswordModal = ref(false);
    const errors = reactive({});
    const notification = useNotification();
    const isLoadingOrganizations = ref(false);
    const showOrganizationDropdown = ref(false);
    const organizationSuggestions = ref([]);
    const formData = reactive({
      fullName: "",
      pinfl: "",
      organization: "",
      department: "",
      position: "",
      accountPassword: ""
    });
    const handleResetPassword = async () => {
      if (!props.student) return;
      isResettingPassword.value = true;
      try {
        const response = await authFetch(
          `/api/students/${props.student.id}/reset-password`,
          {
            method: "POST",
            body: { resetToPinfl: true }
          }
        );
        if (response.success) {
          notification.success(response.message || "Пароль сброшен на ПИНФЛ", "Успешно");
        } else {
          notification.error(response.message || "Ошибка сброса пароля", "Ошибка");
        }
      } catch (error) {
        notification.error(error.message || "Ошибка сброса пароля", "Ошибка");
      } finally {
        isResettingPassword.value = false;
      }
    };
    const modalTitle = computed(() => {
      return props.student ? "Редактировать студента" : "Добавить студента";
    });
    const submitButtonText = computed(() => {
      return props.student ? "Сохранить" : "Создать";
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
            _push2(`<div class="w-full max-w-3xl rounded-lg bg-white dark:bg-boxdark shadow-xl"><div class="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between"><h3 class="text-xl font-semibold text-black dark:text-white">${ssrInterpolate(modalTitle.value)}</h3><button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><form class="p-6"><div class="grid grid-cols-1 gap-6 sm:grid-cols-2"><div class="sm:col-span-2"><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Ф.И.О <span class="text-danger">*</span></label><input${ssrRenderAttr("value", formData.fullName)} type="text" placeholder="Введите полное имя" class="${ssrRenderClass([{ "border-danger": errors.fullName }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" required>`);
            if (errors.fullName) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.fullName[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> ПИНФЛ <span class="text-danger">*</span></label><input${ssrRenderAttr("value", formData.pinfl)} type="text" placeholder="14-значный ПИНФЛ" maxlength="14" pattern="[0-9]{14}" class="${ssrRenderClass([{ "border-danger": errors.pinfl }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary font-mono"])}" required>`);
            if (errors.pinfl) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.pinfl[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<p class="mt-1 text-xs text-gray-500 dark:text-gray-400"> 14 цифр без пробелов </p></div><div class="relative"><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Организация <span class="text-danger">*</span></label><div class="relative"><input${ssrRenderAttr("value", formData.organization)} type="text" placeholder="Введите название организации" class="${ssrRenderClass([{ "border-danger": errors.organization }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" required autocomplete="off">`);
            if (isLoadingOrganizations.value) {
              _push2(`<div class="absolute right-3 top-1/2 -translate-y-1/2"><svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (showOrganizationDropdown.value && organizationSuggestions.value.length > 0) {
              _push2(`<div class="absolute z-50 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg max-h-60 overflow-y-auto"><!--[-->`);
              ssrRenderList(organizationSuggestions.value, (org) => {
                _push2(`<button type="button" class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors border-b border-stroke dark:border-strokedark last:border-b-0"><div class="font-medium text-black dark:text-white">${ssrInterpolate(org.name)}</div>`);
                if (org.shortName) {
                  _push2(`<div class="text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(org.shortName)}</div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="text-xs text-gray-400 dark:text-gray-500 mt-1">${ssrInterpolate(org.studentsCount)} слушателей </div></button>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (showOrganizationDropdown.value && formData.organization.trim() && organizationSuggestions.value.length === 0 && !isLoadingOrganizations.value) {
              _push2(`<div class="absolute z-50 w-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg"><div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400"><span class="flex items-center gap-2"><svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Будет создана новая организация: <span class="font-medium text-black dark:text-white">${ssrInterpolate(formData.organization.trim())}</span></span></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (errors.organization) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.organization[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Служба/Отдел </label><input${ssrRenderAttr("value", formData.department)} type="text" placeholder="Введите название службы или отдела" class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"></div><div><label class="mb-3 block text-sm font-medium text-black dark:text-white"> Должность <span class="text-danger">*</span></label><input${ssrRenderAttr("value", formData.position)} type="text" placeholder="Введите должность" class="${ssrRenderClass([{ "border-danger": errors.position }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" required>`);
            if (errors.position) {
              _push2(`<p class="mt-1 text-sm text-danger">${ssrInterpolate(errors.position[0])}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="sm:col-span-2 mt-4 pt-4 border-t border-stroke dark:border-strokedark">`);
            if (!props.student) {
              _push2(`<div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg"><div class="flex items-center gap-2 text-blue-700 dark:text-blue-300"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="font-medium">Учётная запись создаётся автоматически</span></div><p class="mt-2 text-sm text-blue-600 dark:text-blue-400"> Логин: <span class="font-mono">${ssrInterpolate(formData.pinfl || "ПИНФЛ")}@student.local</span><br> Пароль: <span class="font-mono">${ssrInterpolate(formData.pinfl || "ПИНФЛ")}</span></p></div>`);
            } else if (canManagePassword.value) {
              _push2(`<!--[--><h4 class="font-medium text-black dark:text-white mb-3"> Управление учётной записью </h4><p class="text-sm text-gray-600 dark:text-gray-400 mb-4"> Email для входа: <span class="font-mono">${ssrInterpolate(props.student.pinfl)}@student.local</span></p><div class="flex flex-wrap gap-3">`);
              _push2(ssrRenderComponent(_component_UiButton, {
                type: "button",
                variant: "secondary",
                size: "sm",
                onClick: handleResetPassword,
                disabled: isResettingPassword.value
              }, {
                icon: withCtx((_, _push3, _parent2, _scopeId) => {
                  if (_push3) {
                    if (isResettingPassword.value) {
                      _push3(`<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"${_scopeId}></path></svg>`);
                    } else {
                      _push3(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"${_scopeId}></path></svg>`);
                    }
                  } else {
                    return [
                      isResettingPassword.value ? (openBlock(), createBlock("svg", {
                        key: 0,
                        class: "animate-spin w-4 h-4",
                        fill: "none",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("circle", {
                          class: "opacity-25",
                          cx: "12",
                          cy: "12",
                          r: "10",
                          stroke: "currentColor",
                          "stroke-width": "4"
                        }),
                        createVNode("path", {
                          class: "opacity-75",
                          fill: "currentColor",
                          d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        })
                      ])) : (openBlock(), createBlock("svg", {
                        key: 1,
                        class: "w-4 h-4",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        })
                      ]))
                    ];
                  }
                }),
                default: withCtx((_, _push3, _parent2, _scopeId) => {
                  if (_push3) {
                    _push3(` Сбросить пароль на ПИНФЛ `);
                  } else {
                    return [
                      createTextVNode(" Сбросить пароль на ПИНФЛ ")
                    ];
                  }
                }),
                _: 1
              }, _parent));
              _push2(ssrRenderComponent(_component_UiButton, {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: ($event) => showChangePasswordModal.value = true
              }, {
                icon: withCtx((_, _push3, _parent2, _scopeId) => {
                  if (_push3) {
                    _push3(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"${_scopeId}></path></svg>`);
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
                default: withCtx((_, _push3, _parent2, _scopeId) => {
                  if (_push3) {
                    _push3(` Изменить пароль `);
                  } else {
                    return [
                      createTextVNode(" Изменить пароль ")
                    ];
                  }
                }),
                _: 1
              }, _parent));
              _push2(`</div><!--]-->`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="mt-6 flex justify-end gap-4">`);
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
                  _push3(`${ssrInterpolate(submitButtonText.value)}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(submitButtonText.value), 1)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/StudentFormModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$1, { __name: "DatabaseStudentFormModal" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "StudentCertificatesModal",
  __ssrInlineRender: true,
  props: {
    student: {},
    isOpen: { type: Boolean }
  },
  emits: ["close", "refresh"],
  setup(__props, { emit: __emit }) {
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const props = __props;
    const emit = __emit;
    const isAddCertificateOpen = ref(false);
    const isDeleteConfirmOpen = ref(false);
    const isDeleting = ref(false);
    const certificateToDelete = ref(null);
    const openAddCertificateForm = () => {
      isAddCertificateOpen.value = true;
    };
    const closeAddCertificateForm = () => {
      isAddCertificateOpen.value = false;
    };
    const handleCertificateCreated = () => {
      closeAddCertificateForm();
      emit("refresh");
    };
    const handleDeleteCertificate = (certificateId) => {
      const certificate = props.student?.certificates.find((c) => c.id === certificateId);
      if (certificate) {
        certificateToDelete.value = certificate;
        isDeleteConfirmOpen.value = true;
      }
    };
    const confirmDeleteCertificate = async () => {
      if (!certificateToDelete.value) return;
      isDeleting.value = true;
      try {
        const response = await authFetch(
          `/api/certificates/${certificateToDelete.value.id}`,
          {
            method: "DELETE"
          }
        );
        if (response.success) {
          emit("refresh");
          notification.success("Сертификат успешно удален", "Успех");
          cancelDeleteCertificate();
        } else {
          notification.error(response.message || "Не удалось удалить сертификат", "Ошибка");
        }
      } catch (error) {
        console.error("Ошибка удаления сертификата:", error);
        const errorMessage = error?.data?.message || error?.message || "Произошла ошибка при удалении сертификата";
        notification.error(errorMessage, "Ошибка");
      } finally {
        isDeleting.value = false;
      }
    };
    const cancelDeleteCertificate = () => {
      isDeleteConfirmOpen.value = false;
      certificateToDelete.value = null;
      isDeleting.value = false;
    };
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };
    const isExpired = (expiryDate) => {
      return new Date(expiryDate) < /* @__PURE__ */ new Date();
    };
    const getCertificateFileName = (certificate) => {
      const certNumber = certificate.certificateNumber.replace(/[^a-zA-Z0-9]/g, "_");
      return `Сертификат_${certNumber}.pdf`;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_DatabaseCertificateManualFormModal = _sfc_main$2;
      const _component_UiConfirmModal = __nuxt_component_3$1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        onClose: ($event) => _ctx.$emit("close"),
        title: `Сертификаты - ${__props.student?.fullName || ""}`,
        size: "lg"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}><div class="flex justify-end"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "primary",
              onClick: openAddCertificateForm,
              class: "flex items-center gap-2"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId2}></path></svg> Добавить сертификат `);
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
                    ])),
                    createTextVNode(" Добавить сертификат ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
            if (__props.student && __props.student.certificates.length > 0) {
              _push2(`<div class="space-y-4"${_scopeId}><!--[-->`);
              ssrRenderList(__props.student.certificates, (certificate) => {
                _push2(`<div class="rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark"${_scopeId}><div class="flex items-start justify-between"${_scopeId}><div class="flex-1 space-y-3"${_scopeId}><div${_scopeId}><h4 class="text-lg font-semibold text-black dark:text-white"${_scopeId}>${ssrInterpolate(certificate.courseName)}</h4></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}>Номер сертификата:</p><p class="font-medium text-black dark:text-white font-mono"${_scopeId}>${ssrInterpolate(certificate.certificateNumber)}</p></div><div${_scopeId}><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}>Дата получения:</p><p class="font-medium text-black dark:text-white"${_scopeId}>${ssrInterpolate(formatDate(certificate.issueDate))}</p></div>`);
                if (certificate.expiryDate) {
                  _push2(`<div${_scopeId}><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}>Срок годности:</p><p class="${ssrRenderClass([isExpired(certificate.expiryDate) ? "text-danger" : "text-black dark:text-white", "font-medium"])}"${_scopeId}>${ssrInterpolate(formatDate(certificate.expiryDate))} `);
                  if (isExpired(certificate.expiryDate)) {
                    _push2(`<span class="text-xs"${_scopeId}>(Истек)</span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</p></div>`);
                } else {
                  _push2(`<!---->`);
                }
                if (certificate.fileUrl) {
                  _push2(`<div${_scopeId}><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}>Файл:</p><a${ssrRenderAttr("href", certificate.fileUrl)}${ssrRenderAttr("download", getCertificateFileName(certificate))} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg> Скачать </a></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div><div class="flex items-center gap-2 ml-4"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_UiButton, {
                  variant: "danger",
                  size: "sm",
                  onClick: ($event) => handleDeleteCertificate(certificate.id),
                  title: "Удалить сертификат"
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"${_scopeId2}></path></svg>`);
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
                }, _parent2, _scopeId));
                _push2(`</div></div></div>`);
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<div class="text-center py-12"${_scopeId}><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg><p class="mt-4 text-gray-600 dark:text-gray-400"${_scopeId}> У этого студента пока нет сертификатов </p></div>`);
            }
            _push2(`</div>`);
            if (isAddCertificateOpen.value && __props.student) {
              _push2(ssrRenderComponent(_component_DatabaseCertificateManualFormModal, {
                "preselected-student": __props.student,
                "is-open": isAddCertificateOpen.value,
                onClose: closeAddCertificateForm,
                onCreated: handleCertificateCreated
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            _push2(ssrRenderComponent(_component_UiConfirmModal, {
              "is-open": isDeleteConfirmOpen.value,
              title: "Подтверждение удаления",
              message: "Вы уверены, что хотите удалить этот сертификат?",
              "item-name": certificateToDelete.value?.courseName,
              warning: "Это действие нельзя отменить",
              "confirm-text": "Удалить",
              "cancel-text": "Отмена",
              variant: "danger",
              loading: isDeleting.value,
              onConfirm: confirmDeleteCertificate,
              onCancel: cancelDeleteCertificate
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode("div", { class: "flex justify-end" }, [
                  createVNode(_component_UiButton, {
                    variant: "primary",
                    onClick: openAddCertificateForm,
                    class: "flex items-center gap-2"
                  }, {
                    default: withCtx(() => [
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
                      ])),
                      createTextVNode(" Добавить сертификат ")
                    ]),
                    _: 1
                  })
                ]),
                __props.student && __props.student.certificates.length > 0 ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "space-y-4"
                }, [
                  (openBlock(true), createBlock(Fragment, null, renderList(__props.student.certificates, (certificate) => {
                    return openBlock(), createBlock("div", {
                      key: certificate.id,
                      class: "rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark"
                    }, [
                      createVNode("div", { class: "flex items-start justify-between" }, [
                        createVNode("div", { class: "flex-1 space-y-3" }, [
                          createVNode("div", null, [
                            createVNode("h4", { class: "text-lg font-semibold text-black dark:text-white" }, toDisplayString(certificate.courseName), 1)
                          ]),
                          createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                            createVNode("div", null, [
                              createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, "Номер сертификата:"),
                              createVNode("p", { class: "font-medium text-black dark:text-white font-mono" }, toDisplayString(certificate.certificateNumber), 1)
                            ]),
                            createVNode("div", null, [
                              createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, "Дата получения:"),
                              createVNode("p", { class: "font-medium text-black dark:text-white" }, toDisplayString(formatDate(certificate.issueDate)), 1)
                            ]),
                            certificate.expiryDate ? (openBlock(), createBlock("div", { key: 0 }, [
                              createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, "Срок годности:"),
                              createVNode("p", {
                                class: ["font-medium", isExpired(certificate.expiryDate) ? "text-danger" : "text-black dark:text-white"]
                              }, [
                                createTextVNode(toDisplayString(formatDate(certificate.expiryDate)) + " ", 1),
                                isExpired(certificate.expiryDate) ? (openBlock(), createBlock("span", {
                                  key: 0,
                                  class: "text-xs"
                                }, "(Истек)")) : createCommentVNode("", true)
                              ], 2)
                            ])) : createCommentVNode("", true),
                            certificate.fileUrl ? (openBlock(), createBlock("div", { key: 1 }, [
                              createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, "Файл:"),
                              createVNode("a", {
                                href: certificate.fileUrl,
                                download: getCertificateFileName(certificate),
                                target: "_blank",
                                rel: "noopener noreferrer",
                                class: "inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
                              }, [
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
                                    d: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  })
                                ])),
                                createTextVNode(" Скачать ")
                              ], 8, ["href", "download"])
                            ])) : createCommentVNode("", true)
                          ])
                        ]),
                        createVNode("div", { class: "flex items-center gap-2 ml-4" }, [
                          createVNode(_component_UiButton, {
                            variant: "danger",
                            size: "sm",
                            onClick: ($event) => handleDeleteCertificate(certificate.id),
                            title: "Удалить сертификат"
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
                                  d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                                })
                              ]))
                            ]),
                            _: 1
                          }, 8, ["onClick"])
                        ])
                      ])
                    ]);
                  }), 128))
                ])) : (openBlock(), createBlock("div", {
                  key: 1,
                  class: "text-center py-12"
                }, [
                  (openBlock(), createBlock("svg", {
                    class: "mx-auto h-12 w-12 text-gray-400",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    })
                  ])),
                  createVNode("p", { class: "mt-4 text-gray-600 dark:text-gray-400" }, " У этого студента пока нет сертификатов ")
                ]))
              ]),
              isAddCertificateOpen.value && __props.student ? (openBlock(), createBlock(_component_DatabaseCertificateManualFormModal, {
                key: 0,
                "preselected-student": __props.student,
                "is-open": isAddCertificateOpen.value,
                onClose: closeAddCertificateForm,
                onCreated: handleCertificateCreated
              }, null, 8, ["preselected-student", "is-open"])) : createCommentVNode("", true),
              createVNode(_component_UiConfirmModal, {
                "is-open": isDeleteConfirmOpen.value,
                title: "Подтверждение удаления",
                message: "Вы уверены, что хотите удалить этот сертификат?",
                "item-name": certificateToDelete.value?.courseName,
                warning: "Это действие нельзя отменить",
                "confirm-text": "Удалить",
                "cancel-text": "Отмена",
                variant: "danger",
                loading: isDeleting.value,
                onConfirm: confirmDeleteCertificate,
                onCancel: cancelDeleteCertificate
              }, null, 8, ["is-open", "item-name", "loading"])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/StudentCertificatesModal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main, { __name: "DatabaseStudentCertificatesModal" });

export { __nuxt_component_2 as _, __nuxt_component_3 as a };
//# sourceMappingURL=StudentCertificatesModal-BG5Xd3Hu.mjs.map
