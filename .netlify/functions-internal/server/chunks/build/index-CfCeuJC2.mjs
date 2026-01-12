import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_0$1 } from './Modal-DQYphXo7.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createBlock, createTextVNode, openBlock, createVNode, reactive, watch, withModifiers, withDirectives, createCommentVNode, vModelText, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderAttr, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { u as useHead, n as navigateTo } from './server.mjs';
import { u as useNotification } from './useNotification-C2RwAN1X.mjs';
import { _ as __nuxt_component_3 } from './ConfirmModal-GQ4JU241.mjs';
import { u as usePermissions } from './usePermissions-C-v7fTov.mjs';
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
import './Notification-Bd1V2gNg.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "TemplateFormModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean }
  },
  emits: ["close", "created"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const { success: showSuccess, error: showError } = useNotification();
    const form = reactive({
      name: "",
      description: "",
      numberFormat: "ATC{YY}_{CODE}_{NUM}"
    });
    const errors = reactive({
      name: ""
    });
    const isSubmitting = ref(false);
    const resetForm = () => {
      form.name = "";
      form.description = "";
      form.numberFormat = "ATC{YY}_{CODE}_{NUM}";
      errors.name = "";
    };
    const handleClose = () => {
      if (!isSubmitting.value) {
        resetForm();
        emit("close");
      }
    };
    const handleSubmit = async () => {
      errors.name = "";
      if (!form.name.trim()) {
        errors.name = "Название обязательно";
        return;
      }
      isSubmitting.value = true;
      try {
        const response = await authFetch(
          "/api/certificates/templates",
          {
            method: "POST",
            body: {
              name: form.name.trim(),
              description: form.description.trim() || void 0,
              numberFormat: form.numberFormat.trim() || void 0
            }
          }
        );
        if (response.success) {
          showSuccess("Шаблон успешно создан");
          resetForm();
          emit("created", response.template);
        } else {
          showError(response.message || "Ошибка создания шаблона");
        }
      } catch (error) {
        console.error("Error creating template:", error);
        showError(error.data?.message || error.message || "Ошибка создания шаблона");
      } finally {
        isSubmitting.value = false;
      }
    };
    watch(() => props.isOpen, (newVal) => {
      if (newVal) {
        resetForm();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Создание шаблона сертификата",
        size: "sm",
        onClose: handleClose
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Название шаблона * </label><input${ssrRenderAttr("value", unref(form).name)} type="text" placeholder="Например: Стандартный сертификат" class="${ssrRenderClass([{ "border-danger": unref(errors).name }, "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"])}" required${_scopeId}>`);
            if (unref(errors).name) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(unref(errors).name)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Описание </label><textarea rows="3" placeholder="Краткое описание шаблона..." class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"${_scopeId}>${ssrInterpolate(unref(form).description)}</textarea></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Формат номера сертификата </label><input${ssrRenderAttr("value", unref(form).numberFormat)} type="text" placeholder="ATC{YY}_{CODE}_{NUM}" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"${_scopeId}><p class="mt-1 text-xs text-gray-500 dark:text-gray-400"${_scopeId}> Переменные: <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded"${_scopeId}>{YY}</code> — год, <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded"${_scopeId}>{CODE}</code> — код курса, <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded"${_scopeId}>{NUM}</code> — порядковый номер </p></div><div class="flex justify-end gap-3 pt-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              type: "button",
              variant: "outline",
              onClick: handleClose,
              disabled: unref(isSubmitting)
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
              type: "submit",
              loading: unref(isSubmitting)
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Создать `);
                } else {
                  return [
                    createTextVNode(" Создать ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(handleSubmit, ["prevent"]),
                class: "space-y-4"
              }, [
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, " Название шаблона * "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => unref(form).name = $event,
                    type: "text",
                    placeholder: "Например: Стандартный сертификат",
                    class: ["w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20", { "border-danger": unref(errors).name }],
                    required: ""
                  }, null, 10, ["onUpdate:modelValue"]), [
                    [vModelText, unref(form).name]
                  ]),
                  unref(errors).name ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-sm text-danger"
                  }, toDisplayString(unref(errors).name), 1)) : createCommentVNode("", true)
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, " Описание "),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => unref(form).description = $event,
                    rows: "3",
                    placeholder: "Краткое описание шаблона...",
                    class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(form).description]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, " Формат номера сертификата "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => unref(form).numberFormat = $event,
                    type: "text",
                    placeholder: "ATC{YY}_{CODE}_{NUM}",
                    class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(form).numberFormat]
                  ]),
                  createVNode("p", { class: "mt-1 text-xs text-gray-500 dark:text-gray-400" }, [
                    createTextVNode(" Переменные: "),
                    createVNode("code", { class: "bg-gray-100 dark:bg-gray-700 px-1 rounded" }, "{YY}"),
                    createTextVNode(" — год, "),
                    createVNode("code", { class: "bg-gray-100 dark:bg-gray-700 px-1 rounded" }, "{CODE}"),
                    createTextVNode(" — код курса, "),
                    createVNode("code", { class: "bg-gray-100 dark:bg-gray-700 px-1 rounded" }, "{NUM}"),
                    createTextVNode(" — порядковый номер ")
                  ])
                ]),
                createVNode("div", { class: "flex justify-end gap-3 pt-4" }, [
                  createVNode(_component_UiButton, {
                    type: "button",
                    variant: "outline",
                    onClick: handleClose,
                    disabled: unref(isSubmitting)
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["disabled"]),
                  createVNode(_component_UiButton, {
                    type: "submit",
                    loading: unref(isSubmitting)
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Создать ")
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
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/TemplateFormModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$1, { __name: "CertificatesTemplateFormModal" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Шаблоны сертификатов - АТЦ Платформа"
    });
    const { authFetch } = useAuthFetch();
    const { success: showSuccess, error: showError } = useNotification();
    const { canCreateTemplates, canDeleteTemplates } = usePermissions();
    const loading = ref(true);
    const templates = ref([]);
    const showCreateModal = ref(false);
    const showDeleteModal = ref(false);
    const templateToDelete = ref(null);
    const isDeleting = ref(false);
    const loadTemplates = async () => {
      loading.value = true;
      try {
        const response = await authFetch(
          "/api/certificates/templates"
        );
        if (response.success) {
          templates.value = response.templates;
        }
      } catch (error) {
        console.error("Error loading templates:", error);
        showError(error.message || "Ошибка загрузки шаблонов");
      } finally {
        loading.value = false;
      }
    };
    const handleCreated = (template) => {
      showCreateModal.value = false;
      navigateTo(`/certificates/templates/${template.id}`);
    };
    const handleDelete = async () => {
      if (!templateToDelete.value) return;
      isDeleting.value = true;
      try {
        await authFetch(`/api/certificates/templates/${templateToDelete.value.id}`, {
          method: "DELETE"
        });
        showSuccess("Шаблон успешно удалён");
        await loadTemplates();
      } catch (error) {
        console.error("Error deleting template:", error);
        showError(error.data?.message || error.message || "Ошибка удаления");
      } finally {
        isDeleting.value = false;
        showDeleteModal.value = false;
        templateToDelete.value = null;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_CertificatesTemplateFormModal = __nuxt_component_2;
      const _component_UiConfirmModal = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Шаблоны сертификатов </h2><p class="mt-1 text-sm text-gray-500 dark:text-gray-400"> Управление шаблонами для генерации сертификатов </p></div>`);
      if (unref(canCreateTemplates)) {
        _push(ssrRenderComponent(_component_UiButton, {
          onClick: ($event) => showCreateModal.value = true
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Создать шаблон `);
            } else {
              return [
                (openBlock(), createBlock("svg", {
                  class: "w-4 h-4 mr-2",
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
                createTextVNode(" Создать шаблон ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(loading)) {
        _push(`<div class="flex justify-center items-center py-20"><div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (unref(templates).length === 0) {
        _push(`<div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-12 text-center"><div class="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center"><svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2"> Нет шаблонов </h3><p class="text-gray-500 dark:text-gray-400 mb-6"> Создайте первый шаблон сертификата для начала работы </p>`);
        if (unref(canCreateTemplates)) {
          _push(ssrRenderComponent(_component_UiButton, {
            onClick: ($event) => showCreateModal.value = true
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Создать шаблон `);
              } else {
                return [
                  createTextVNode(" Создать шаблон ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><!--[-->`);
        ssrRenderList(unref(templates), (template) => {
          _push(`<div class="group rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden hover:shadow-lg transition-all duration-200"><div class="relative h-48 bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">`);
          if (template.backgroundUrl) {
            _push(`<div class="absolute inset-0"><img${ssrRenderAttr("src", template.backgroundUrl)}${ssrRenderAttr("alt", template.name)} class="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"><div class="absolute inset-0 bg-linear-to-t from-black/30 to-transparent"></div></div>`);
          } else if (template.originalFileUrl) {
            _push(`<div class="absolute inset-0 flex flex-col items-center justify-center"><div class="w-24 h-28 bg-white dark:bg-gray-200 rounded-lg shadow-lg flex flex-col items-center justify-center transform -rotate-2 transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105"><svg class="w-10 h-10 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><span class="text-xs font-semibold text-gray-600">.docx</span></div><p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Word шаблон загружен</p></div>`);
          } else {
            _push(`<div class="text-center px-4"><div class="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg></div><span class="text-sm text-gray-500 dark:text-gray-400">Загрузите шаблон</span></div>`);
          }
          if (template.originalFileUrl || template.backgroundUrl) {
            _push(`<div class="${ssrRenderClass([template.variables && template.variables.length > 0 ? "bg-success/80 text-white" : "bg-warning/80 text-white", "absolute bottom-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur-sm"])}">`);
            if (template.variables && template.variables.length > 0) {
              _push(`<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`);
            } else {
              _push(`<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>`);
            }
            _push(` ${ssrInterpolate(template.variables && template.variables.length > 0 ? "Готов" : "Настройте")}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="absolute top-3 left-3 flex gap-2"><span class="${ssrRenderClass([
            "px-2 py-1 rounded-full text-xs font-medium",
            template.isActive ? "bg-success/20 text-success" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          ])}">${ssrInterpolate(template.isActive ? "Активен" : "Неактивен")}</span></div><div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/certificates/templates/${template.id}/editor`,
            class: "p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors",
            title: "Открыть редактор"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"${_scopeId}></path></svg>`);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "w-5 h-5 text-primary",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    })
                  ]))
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/certificates/templates/${template.id}`,
            class: "p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors",
            title: "Настройки"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path></svg>`);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "w-5 h-5 text-gray-700",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    }),
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    })
                  ]))
                ];
              }
            }),
            _: 2
          }, _parent));
          if (unref(canDeleteTemplates)) {
            _push(`<button class="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors" title="Удалить"><svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><div class="p-5"><h3 class="font-semibold text-gray-900 dark:text-white mb-2 truncate">${ssrInterpolate(template.name)}</h3>`);
          if (template.description) {
            _push(`<p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">${ssrInterpolate(template.description)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="flex flex-wrap gap-3 text-xs"><span class="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg> ${ssrInterpolate(template.variables?.length || 0)} переменных </span><span class="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> ${ssrInterpolate(template.lastNumber)} выдано </span></div><div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"><span class="text-xs text-gray-400">Формат:</span><code class="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">${ssrInterpolate(template.numberFormat)}</code></div></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(ssrRenderComponent(_component_CertificatesTemplateFormModal, {
        "is-open": unref(showCreateModal),
        onClose: ($event) => showCreateModal.value = false,
        onCreated: handleCreated
      }, null, _parent));
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": unref(showDeleteModal),
        title: "Удаление шаблона",
        message: "Вы уверены, что хотите удалить этот шаблон?",
        "item-name": unref(templateToDelete)?.name,
        warning: "Это действие нельзя отменить.",
        loading: unref(isDeleting),
        onConfirm: handleDelete,
        onCancel: ($event) => showDeleteModal.value = false
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/certificates/templates/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-CfCeuJC2.mjs.map
