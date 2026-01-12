import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_1$1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_0$1 } from './Modal-DQYphXo7.mjs';
import { _ as __nuxt_component_3 } from './ConfirmModal-GQ4JU241.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, createBlock, createTextVNode, openBlock, createVNode, unref, watch, toDisplayString, withModifiers, withDirectives, createCommentVNode, Fragment, renderList, vModelSelect, vModelCheckbox, vModelText, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { c as useRoute, d as useRouter, u as useHead } from './server.mjs';
import { u as useNotification } from './useNotification-C2RwAN1X.mjs';
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

const _sfc_main$3 = {
  __name: "ProgramsDisciplineTestsSection",
  __ssrInlineRender: true,
  props: {
    disciplineId: {
      type: String,
      required: true
    },
    canManage: {
      type: Boolean,
      default: false
    }
  },
  emits: ["updated"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const { success: showSuccess, error: showError } = useNotification();
    const tests = ref([]);
    const loading = ref(true);
    const isModalOpen = ref(false);
    const editingTest = ref(null);
    const submitting = ref(false);
    const isDeleteModalOpen = ref(false);
    const deletingTest = ref(null);
    const deleting = ref(false);
    const allTemplates = ref([]);
    ref(false);
    const formData = ref({
      test_template_id: "",
      is_required: false,
      notes: ""
    });
    const errors = ref({});
    const availableTemplates = computed(() => {
      const addedIds = new Set(tests.value.map((t) => t.test_template_id));
      return allTemplates.value.filter(
        (t) => !addedIds.has(t.id) || t.id === editingTest.value?.test_template_id
      );
    });
    const loadTests = async () => {
      loading.value = true;
      try {
        const response = await authFetch(`/api/discipline-tests?discipline_id=${props.disciplineId}`);
        if (response.success) {
          tests.value = response.tests || [];
        } else {
          tests.value = [];
        }
      } catch (err) {
        console.error("Error loading discipline tests:", err);
        tests.value = [];
      } finally {
        loading.value = false;
      }
    };
    const closeModal = () => {
      if (!submitting.value) {
        isModalOpen.value = false;
        editingTest.value = null;
      }
    };
    const validateForm = () => {
      const newErrors = {};
      if (!formData.value.test_template_id) {
        newErrors.test_template_id = "Выберите шаблон теста";
      }
      errors.value = newErrors;
      return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async () => {
      if (!validateForm()) return;
      submitting.value = true;
      try {
        if (editingTest.value) {
          const response = await authFetch(`/api/discipline-tests/${editingTest.value.id}`, {
            method: "PUT",
            body: {
              is_required: formData.value.is_required,
              notes: formData.value.notes
            }
          });
          if (response.success) {
            showSuccess("Привязка теста обновлена", "Успех");
            await loadTests();
            emit("updated");
            closeModal();
          } else {
            showError(response.message || "Ошибка сохранения", "Ошибка");
          }
        } else {
          const response = await authFetch("/api/discipline-tests", {
            method: "POST",
            body: {
              discipline_id: props.disciplineId,
              test_template_id: formData.value.test_template_id,
              is_required: formData.value.is_required,
              notes: formData.value.notes
            }
          });
          if (response.success) {
            showSuccess("Тест привязан к дисциплине", "Успех");
            await loadTests();
            emit("updated");
            closeModal();
          } else {
            showError(response.message || "Ошибка привязки теста", "Ошибка");
          }
        }
      } catch (err) {
        console.error("Error saving discipline test:", err);
        showError(err.data?.message || "Ошибка сохранения", "Ошибка");
      } finally {
        submitting.value = false;
      }
    };
    const closeDeleteModal = () => {
      if (!deleting.value) {
        isDeleteModalOpen.value = false;
        deletingTest.value = null;
      }
    };
    const removeTest = async () => {
      if (!deletingTest.value) return;
      deleting.value = true;
      try {
        const response = await authFetch(`/api/discipline-tests/${deletingTest.value.id}`, {
          method: "DELETE"
        });
        if (response.success) {
          showSuccess("Тест отвязан от дисциплины", "Успех");
          await loadTests();
          emit("updated");
        } else {
          showError(response.message || "Ошибка удаления", "Ошибка");
        }
      } catch (err) {
        console.error("Error removing discipline test:", err);
        showError(err.data?.message || "Ошибка удаления", "Ошибка");
      } finally {
        deleting.value = false;
        closeDeleteModal();
      }
    };
    watch(
      () => props.disciplineId,
      () => {
        loadTests();
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1$1;
      const _component_UiConfirmModal = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" }, _attrs))}><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2"><div class="flex h-6 w-6 items-center justify-center rounded bg-primary/10"><svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg></div><span class="text-sm font-medium text-gray-900 dark:text-white"> Тесты для контроля знаний </span>`);
      if (unref(tests).length > 0) {
        _push(`<span class="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary">${ssrInterpolate(unref(tests).length)}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (__props.canManage) {
        _push(`<button class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Добавить тест </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(loading)) {
        _push(`<div class="flex items-center justify-center py-4"><div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div></div>`);
      } else if (unref(tests).length === 0) {
        _push(`<div class="text-center py-4"><div class="mx-auto mb-2 h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></div><p class="text-sm text-gray-500 dark:text-gray-400"> Тесты не привязаны к дисциплине </p>`);
        if (__props.canManage) {
          _push(`<button class="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-600 transition-colors"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Добавить первый тест </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(unref(tests), (test) => {
          _push(`<div class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 hover:border-primary/30 transition-colors group"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><h5 class="text-sm font-medium text-gray-900 dark:text-white truncate">${ssrInterpolate(test.template_name)}</h5>`);
          if (test.is_required) {
            _push(`<span class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-danger/10 text-danger"> Обязательный </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400"><span class="inline-flex items-center gap-1"${ssrRenderAttr("title", "Код: " + test.template_code)}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg> ${ssrInterpolate(test.template_code)}</span><span class="inline-flex items-center gap-1" title="Количество вопросов"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${ssrInterpolate(test.questions_count)} вопр. </span>`);
          if (test.time_limit_minutes) {
            _push(`<span class="inline-flex items-center gap-1" title="Лимит времени"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${ssrInterpolate(test.time_limit_minutes)} мин. </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<span class="inline-flex items-center gap-1" title="Проходной балл"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${ssrInterpolate(test.passing_score)}% </span></div>`);
          if (test.notes) {
            _push(`<p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic">${ssrInterpolate(test.notes)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (__props.canManage) {
            _push(`<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button class="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-200 hover:text-primary dark:hover:bg-gray-700 transition-colors" title="Редактировать"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button><button class="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-danger/10 hover:text-danger transition-colors" title="Удалить"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": unref(isModalOpen),
        title: unref(editingTest) ? "Редактировать привязку теста" : "Добавить тест к дисциплине",
        size: "md",
        onClose: closeModal
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form${_scopeId}><div class="space-y-4"${_scopeId}><div${_scopeId}><label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"${_scopeId}> Шаблон теста <span class="text-danger"${_scopeId}>*</span></label><select${ssrIncludeBooleanAttr(!!unref(editingTest)) ? " disabled" : ""} class="${ssrRenderClass([{ "border-danger": unref(errors).test_template_id }, "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-900"])}"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(formData).test_template_id) ? ssrLooseContain(unref(formData).test_template_id, "") : ssrLooseEqual(unref(formData).test_template_id, "")) ? " selected" : ""}${_scopeId}>Выберите тест...</option><!--[-->`);
            ssrRenderList(unref(availableTemplates), (template) => {
              _push2(`<option${ssrRenderAttr("value", template.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(formData).test_template_id) ? ssrLooseContain(unref(formData).test_template_id, template.id) : ssrLooseEqual(unref(formData).test_template_id, template.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(template.name)} (${ssrInterpolate(template.code)}) </option>`);
            });
            _push2(`<!--]--></select>`);
            if (unref(errors).test_template_id) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(unref(errors).test_template_id)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(editingTest)) {
              _push2(`<p class="mt-1 text-xs text-gray-500"${_scopeId}> Для изменения шаблона удалите эту привязку и создайте новую </p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="flex items-center gap-3 cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(unref(formData).is_required) ? ssrLooseContain(unref(formData).is_required, null) : unref(formData).is_required) ? " checked" : ""} type="checkbox" class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800"${_scopeId}><span class="text-sm font-medium text-gray-900 dark:text-white"${_scopeId}> Обязательный тест </span></label><p class="ml-8 text-xs text-gray-500 dark:text-gray-400"${_scopeId}> Студенты должны будут пройти этот тест для завершения дисциплины </p></div><div${_scopeId}><label class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"${_scopeId}> Примечания </label><textarea rows="2" placeholder="Дополнительная информация о тестировании..." class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"${_scopeId}>${ssrInterpolate(unref(formData).notes)}</textarea></div></div><div class="mt-6 flex justify-end gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              type: "button",
              variant: "outline",
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
              type: "submit",
              variant: "primary",
              loading: unref(submitting)
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`${ssrInterpolate(unref(editingTest) ? "Сохранить" : "Добавить")}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(unref(editingTest) ? "Сохранить" : "Добавить"), 1)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(handleSubmit, ["prevent"])
              }, [
                createVNode("div", { class: "space-y-4" }, [
                  createVNode("div", null, [
                    createVNode("label", { class: "mb-2 block text-sm font-medium text-gray-900 dark:text-white" }, [
                      createTextVNode(" Шаблон теста "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    withDirectives(createVNode("select", {
                      "onUpdate:modelValue": ($event) => unref(formData).test_template_id = $event,
                      disabled: !!unref(editingTest),
                      class: ["w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-900", { "border-danger": unref(errors).test_template_id }]
                    }, [
                      createVNode("option", { value: "" }, "Выберите тест..."),
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(availableTemplates), (template) => {
                        return openBlock(), createBlock("option", {
                          key: template.id,
                          value: template.id
                        }, toDisplayString(template.name) + " (" + toDisplayString(template.code) + ") ", 9, ["value"]);
                      }), 128))
                    ], 10, ["onUpdate:modelValue", "disabled"]), [
                      [vModelSelect, unref(formData).test_template_id]
                    ]),
                    unref(errors).test_template_id ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-danger"
                    }, toDisplayString(unref(errors).test_template_id), 1)) : createCommentVNode("", true),
                    unref(editingTest) ? (openBlock(), createBlock("p", {
                      key: 1,
                      class: "mt-1 text-xs text-gray-500"
                    }, " Для изменения шаблона удалите эту привязку и создайте новую ")) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "flex items-center gap-3 cursor-pointer" }, [
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => unref(formData).is_required = $event,
                        type: "checkbox",
                        class: "h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelCheckbox, unref(formData).is_required]
                      ]),
                      createVNode("span", { class: "text-sm font-medium text-gray-900 dark:text-white" }, " Обязательный тест ")
                    ]),
                    createVNode("p", { class: "ml-8 text-xs text-gray-500 dark:text-gray-400" }, " Студенты должны будут пройти этот тест для завершения дисциплины ")
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "mb-2 block text-sm font-medium text-gray-900 dark:text-white" }, " Примечания "),
                    withDirectives(createVNode("textarea", {
                      "onUpdate:modelValue": ($event) => unref(formData).notes = $event,
                      rows: "2",
                      placeholder: "Дополнительная информация о тестировании...",
                      class: "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelText, unref(formData).notes]
                    ])
                  ])
                ]),
                createVNode("div", { class: "mt-6 flex justify-end gap-3" }, [
                  createVNode(_component_UiButton, {
                    type: "button",
                    variant: "outline",
                    onClick: closeModal
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }),
                  createVNode(_component_UiButton, {
                    type: "submit",
                    variant: "primary",
                    loading: unref(submitting)
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(unref(editingTest) ? "Сохранить" : "Добавить"), 1)
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
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": unref(isDeleteModalOpen),
        title: "Удаление теста из дисциплины",
        message: "Вы уверены, что хотите отвязать этот тест от дисциплины?",
        "item-name": unref(deletingTest)?.template_name,
        warning: "Это не удалит сам шаблон теста, только его привязку к дисциплине.",
        loading: unref(deleting),
        onConfirm: removeTest,
        onCancel: closeDeleteModal
      }, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/programs/DisciplineTestsSection.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "InstructorMultiSelect",
  __ssrInlineRender: true,
  props: {
    modelValue: {}
  },
  emits: ["update:modelValue"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    useAuthFetch();
    const instructors = ref([]);
    const selectedInstructorId = ref("");
    ref(false);
    const availableInstructors = computed(() => {
      return instructors.value.filter((i) => !props.modelValue.includes(i.id));
    });
    const getInstructorName = (id) => {
      const instructor = instructors.value.find((i) => i.id === id);
      return instructor?.fullName || "Неизвестный инструктор";
    };
    const getInstructorInitials = (id) => {
      const name = getInstructorName(id);
      const parts = name.split(" ");
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4" }, _attrs))}><div><label class="mb-2.5 block text-sm font-medium text-black dark:text-white"> Инструкторы </label><div class="relative"><select class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(selectedInstructorId)) ? ssrLooseContain(unref(selectedInstructorId), "") : ssrLooseEqual(unref(selectedInstructorId), "")) ? " selected" : ""}>Выберите инструктора...</option><!--[-->`);
      ssrRenderList(unref(availableInstructors), (instructor) => {
        _push(`<option${ssrRenderAttr("value", instructor.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(selectedInstructorId)) ? ssrLooseContain(unref(selectedInstructorId), instructor.id) : ssrLooseEqual(unref(selectedInstructorId), instructor.id)) ? " selected" : ""}>${ssrInterpolate(instructor.fullName)}</option>`);
      });
      _push(`<!--]--></select></div></div>`);
      if (__props.modelValue.length > 0) {
        _push(`<div class="space-y-2"><label class="block text-sm font-medium text-black dark:text-white"> Выбранные инструкторы </label><div class="space-y-2"><!--[-->`);
        ssrRenderList(__props.modelValue, (instructorId, index) => {
          _push(`<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">${ssrInterpolate(getInstructorInitials(instructorId))}</div><div><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(getInstructorName(instructorId))}</p>`);
          if (index === 0) {
            _push(`<button type="button" class="text-xs text-primary"> ★ Основной инструктор </button>`);
          } else {
            _push(`<button type="button" class="text-xs text-gray-500 hover:text-primary transition-colors"> ☆ Сделать основным </button>`);
          }
          _push(`</div></div><button type="button" class="text-danger hover:text-danger/80 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/programs/InstructorMultiSelect.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$2, { __name: "ProgramsInstructorMultiSelect" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "DisciplineFormModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    courseId: {},
    discipline: {}
  },
  emits: ["close", "success"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const { success: showSuccess, error: showError } = useNotification();
    const loading = ref(false);
    const errors = ref({});
    const formData = ref({
      name: "",
      description: "",
      theoryHours: 0,
      practiceHours: 0,
      assessmentHours: 0,
      instructorIds: []
    });
    const title = computed(() => {
      return props.discipline ? "Редактировать дисциплину" : "Добавить дисциплину";
    });
    const totalHours = computed(() => {
      return formData.value.theoryHours + formData.value.practiceHours + formData.value.assessmentHours;
    });
    const resetForm = () => {
      formData.value = {
        name: "",
        description: "",
        theoryHours: 0,
        practiceHours: 0,
        assessmentHours: 0,
        instructorIds: []
      };
      errors.value = {};
    };
    const loadDisciplineData = () => {
      if (props.discipline) {
        formData.value = {
          name: props.discipline.name,
          description: props.discipline.description || "",
          theoryHours: props.discipline.theoryHours,
          practiceHours: props.discipline.practiceHours,
          assessmentHours: props.discipline.assessmentHours,
          instructorIds: props.discipline.instructors?.map((di) => di.instructorId) || []
        };
      } else {
        resetForm();
      }
    };
    const validateForm = () => {
      errors.value = {};
      if (!formData.value.name.trim()) {
        errors.value.name = "Название обязательно";
      }
      if (formData.value.theoryHours < 0) {
        errors.value.theoryHours = "Не может быть отрицательным";
      }
      if (formData.value.practiceHours < 0) {
        errors.value.practiceHours = "Не может быть отрицательным";
      }
      if (formData.value.assessmentHours < 0) {
        errors.value.assessmentHours = "Не может быть отрицательным";
      }
      if (totalHours.value === 0) {
        errors.value.totalHours = "Общее количество часов должно быть больше нуля";
      }
      return Object.keys(errors.value).length === 0;
    };
    const handleSubmit = async () => {
      if (!validateForm()) {
        return;
      }
      loading.value = true;
      try {
        if (props.discipline) {
          await authFetch(`/api/courses/${props.courseId}/disciplines/${props.discipline.id}`, {
            method: "PATCH",
            body: formData.value
          });
          showSuccess("Дисциплина успешно обновлена", "Успех");
        } else {
          await authFetch(`/api/courses/${props.courseId}/disciplines`, {
            method: "POST",
            body: formData.value
          });
          showSuccess("Дисциплина успешно добавлена", "Успех");
        }
        emit("success");
        handleClose();
      } catch (error) {
        console.error("Error saving discipline:", error);
        showError(
          error.data?.message || "Не удалось сохранить дисциплину",
          "Ошибка"
        );
      } finally {
        loading.value = false;
      }
    };
    const handleClose = () => {
      if (!loading.value) {
        resetForm();
        emit("close");
      }
    };
    watch(() => props.isOpen, (newValue) => {
      if (newValue) {
        loadDisciplineData();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_ProgramsInstructorMultiSelect = __nuxt_component_1;
      const _component_UiButton = __nuxt_component_1$1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: unref(title),
        size: "lg",
        onClose: handleClose
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-6"${_scopeId}><div${_scopeId}><label class="mb-2.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Название дисциплины <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", unref(formData).name)} type="text" placeholder="Введите название дисциплины" class="${ssrRenderClass([{ "border-danger": unref(errors).name }, "w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" required${_scopeId}>`);
            if (unref(errors).name) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(unref(errors).name)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="mb-2.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Описание </label><textarea rows="3" placeholder="Введите описание дисциплины" class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"${_scopeId}>${ssrInterpolate(unref(formData).description)}</textarea></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"${_scopeId}><h4 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white"${_scopeId}> Распределение часов по видам обучения </h4><div class="grid grid-cols-1 gap-4 sm:grid-cols-3"${_scopeId}><div${_scopeId}><label class="mb-2 block text-sm font-medium text-black dark:text-white"${_scopeId}> Теория <span class="text-danger"${_scopeId}>*</span></label><div class="relative"${_scopeId}><input${ssrRenderAttr("value", unref(formData).theoryHours)} type="number" min="0" placeholder="0" class="${ssrRenderClass([{ "border-danger": unref(errors).theoryHours }, "w-full rounded border-[1.5px] border-stroke bg-white px-4 py-2.5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" required${_scopeId}><span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500"${_scopeId}>ч</span></div>`);
            if (unref(errors).theoryHours) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).theoryHours)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="mb-2 block text-sm font-medium text-black dark:text-white"${_scopeId}> Практика <span class="text-danger"${_scopeId}>*</span></label><div class="relative"${_scopeId}><input${ssrRenderAttr("value", unref(formData).practiceHours)} type="number" min="0" placeholder="0" class="${ssrRenderClass([{ "border-danger": unref(errors).practiceHours }, "w-full rounded border-[1.5px] border-stroke bg-white px-4 py-2.5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" required${_scopeId}><span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500"${_scopeId}>ч</span></div>`);
            if (unref(errors).practiceHours) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).practiceHours)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="mb-2 block text-sm font-medium text-black dark:text-white"${_scopeId}> Проверка знаний <span class="text-danger"${_scopeId}>*</span></label><div class="relative"${_scopeId}><input${ssrRenderAttr("value", unref(formData).assessmentHours)} type="number" min="0" placeholder="0" class="${ssrRenderClass([{ "border-danger": unref(errors).assessmentHours }, "w-full rounded border-[1.5px] border-stroke bg-white px-4 py-2.5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" required${_scopeId}><span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500"${_scopeId}>ч</span></div>`);
            if (unref(errors).assessmentHours) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).assessmentHours)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="mt-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3"${_scopeId}><span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}>Всего часов:</span><span class="text-lg font-bold text-primary"${_scopeId}>${ssrInterpolate(unref(totalHours))} ч</span></div>`);
            if (unref(errors).totalHours) {
              _push2(`<p class="mt-2 text-sm text-danger"${_scopeId}>${ssrInterpolate(unref(errors).totalHours)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            _push2(ssrRenderComponent(_component_ProgramsInstructorMultiSelect, {
              modelValue: unref(formData).instructorIds,
              "onUpdate:modelValue": ($event) => unref(formData).instructorIds = $event
            }, null, _parent2, _scopeId));
            _push2(`<div class="flex justify-end gap-3 border-t border-stroke pt-6 dark:border-strokedark"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              type: "button",
              variant: "outline",
              onClick: handleClose,
              disabled: unref(loading)
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
              variant: "primary",
              loading: unref(loading),
              disabled: unref(loading)
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`${ssrInterpolate(__props.discipline ? "Сохранить изменения" : "Добавить дисциплину")}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(__props.discipline ? "Сохранить изменения" : "Добавить дисциплину"), 1)
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
                class: "space-y-6"
              }, [
                createVNode("div", null, [
                  createVNode("label", { class: "mb-2.5 block text-sm font-medium text-black dark:text-white" }, [
                    createTextVNode(" Название дисциплины "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => unref(formData).name = $event,
                    type: "text",
                    placeholder: "Введите название дисциплины",
                    class: ["w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary", { "border-danger": unref(errors).name }],
                    required: ""
                  }, null, 10, ["onUpdate:modelValue"]), [
                    [vModelText, unref(formData).name]
                  ]),
                  unref(errors).name ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-sm text-danger"
                  }, toDisplayString(unref(errors).name), 1)) : createCommentVNode("", true)
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "mb-2.5 block text-sm font-medium text-black dark:text-white" }, " Описание "),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => unref(formData).description = $event,
                    rows: "3",
                    placeholder: "Введите описание дисциплины",
                    class: "w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(formData).description]
                  ])
                ]),
                createVNode("div", { class: "rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50" }, [
                  createVNode("h4", { class: "mb-4 text-sm font-semibold text-gray-900 dark:text-white" }, " Распределение часов по видам обучения "),
                  createVNode("div", { class: "grid grid-cols-1 gap-4 sm:grid-cols-3" }, [
                    createVNode("div", null, [
                      createVNode("label", { class: "mb-2 block text-sm font-medium text-black dark:text-white" }, [
                        createTextVNode(" Теория "),
                        createVNode("span", { class: "text-danger" }, "*")
                      ]),
                      createVNode("div", { class: "relative" }, [
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(formData).theoryHours = $event,
                          type: "number",
                          min: "0",
                          placeholder: "0",
                          class: ["w-full rounded border-[1.5px] border-stroke bg-white px-4 py-2.5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary", { "border-danger": unref(errors).theoryHours }],
                          required: ""
                        }, null, 10, ["onUpdate:modelValue"]), [
                          [
                            vModelText,
                            unref(formData).theoryHours,
                            void 0,
                            { number: true }
                          ]
                        ]),
                        createVNode("span", { class: "absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500" }, "ч")
                      ]),
                      unref(errors).theoryHours ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "mt-1 text-xs text-danger"
                      }, toDisplayString(unref(errors).theoryHours), 1)) : createCommentVNode("", true)
                    ]),
                    createVNode("div", null, [
                      createVNode("label", { class: "mb-2 block text-sm font-medium text-black dark:text-white" }, [
                        createTextVNode(" Практика "),
                        createVNode("span", { class: "text-danger" }, "*")
                      ]),
                      createVNode("div", { class: "relative" }, [
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(formData).practiceHours = $event,
                          type: "number",
                          min: "0",
                          placeholder: "0",
                          class: ["w-full rounded border-[1.5px] border-stroke bg-white px-4 py-2.5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary", { "border-danger": unref(errors).practiceHours }],
                          required: ""
                        }, null, 10, ["onUpdate:modelValue"]), [
                          [
                            vModelText,
                            unref(formData).practiceHours,
                            void 0,
                            { number: true }
                          ]
                        ]),
                        createVNode("span", { class: "absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500" }, "ч")
                      ]),
                      unref(errors).practiceHours ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "mt-1 text-xs text-danger"
                      }, toDisplayString(unref(errors).practiceHours), 1)) : createCommentVNode("", true)
                    ]),
                    createVNode("div", null, [
                      createVNode("label", { class: "mb-2 block text-sm font-medium text-black dark:text-white" }, [
                        createTextVNode(" Проверка знаний "),
                        createVNode("span", { class: "text-danger" }, "*")
                      ]),
                      createVNode("div", { class: "relative" }, [
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => unref(formData).assessmentHours = $event,
                          type: "number",
                          min: "0",
                          placeholder: "0",
                          class: ["w-full rounded border-[1.5px] border-stroke bg-white px-4 py-2.5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary", { "border-danger": unref(errors).assessmentHours }],
                          required: ""
                        }, null, 10, ["onUpdate:modelValue"]), [
                          [
                            vModelText,
                            unref(formData).assessmentHours,
                            void 0,
                            { number: true }
                          ]
                        ]),
                        createVNode("span", { class: "absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500" }, "ч")
                      ]),
                      unref(errors).assessmentHours ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "mt-1 text-xs text-danger"
                      }, toDisplayString(unref(errors).assessmentHours), 1)) : createCommentVNode("", true)
                    ])
                  ]),
                  createVNode("div", { class: "mt-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3" }, [
                    createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, "Всего часов:"),
                    createVNode("span", { class: "text-lg font-bold text-primary" }, toDisplayString(unref(totalHours)) + " ч", 1)
                  ]),
                  unref(errors).totalHours ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-2 text-sm text-danger"
                  }, toDisplayString(unref(errors).totalHours), 1)) : createCommentVNode("", true)
                ]),
                createVNode(_component_ProgramsInstructorMultiSelect, {
                  modelValue: unref(formData).instructorIds,
                  "onUpdate:modelValue": ($event) => unref(formData).instructorIds = $event
                }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                createVNode("div", { class: "flex justify-end gap-3 border-t border-stroke pt-6 dark:border-strokedark" }, [
                  createVNode(_component_UiButton, {
                    type: "button",
                    variant: "outline",
                    onClick: handleClose,
                    disabled: unref(loading)
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["disabled"]),
                  createVNode(_component_UiButton, {
                    type: "submit",
                    variant: "primary",
                    loading: unref(loading),
                    disabled: unref(loading)
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(__props.discipline ? "Сохранить изменения" : "Добавить дисциплину"), 1)
                    ]),
                    _: 1
                  }, 8, ["loading", "disabled"])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/programs/DisciplineFormModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_4 = Object.assign(_sfc_main$1, { __name: "ProgramsDisciplineFormModal" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const router = useRouter();
    const id = route.params.id;
    const { authFetch } = useAuthFetch();
    const { success: showSuccess, error: showError } = useNotification();
    const { canEditCourses, canDeleteCourses, canManageDisciplines } = usePermissions();
    const course = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const isDeleteModalOpen = ref(false);
    const isDeleting = ref(false);
    const isDisciplineModalOpen = ref(false);
    const selectedDiscipline = ref(void 0);
    const isDeleteDisciplineModalOpen = ref(false);
    const isDeletingDiscipline = ref(false);
    useHead({
      title: "Учебная программа - АТЦ Платформа"
    });
    const totalInstructors = computed(() => {
      if (!course.value?.disciplines) return 0;
      const instructorIds = /* @__PURE__ */ new Set();
      course.value.disciplines.forEach((discipline) => {
        discipline.instructors?.forEach((di) => {
          instructorIds.add(di.instructorId);
        });
      });
      return instructorIds.size;
    });
    const loadCourse = async () => {
      loading.value = true;
      error.value = null;
      try {
        console.log("Loading course with ID:", id);
        const response = await authFetch(
          `/api/courses/${id}`,
          {
            method: "GET"
          }
        );
        console.log("API Response:", response);
        if (response.success && response.course) {
          course.value = response.course;
          console.log("Course loaded successfully:", course.value);
        } else {
          error.value = response.message || "Не удалось загрузить данные учебной программы";
          console.error("API returned error:", response.message);
        }
      } catch (err) {
        console.error("Error loading course:", err);
        console.error("Error details:", {
          message: err.message,
          data: err.data,
          statusCode: err.statusCode,
          response: err.response
        });
        error.value = err.data?.message || err.message || "Не удалось загрузить данные учебной программы";
      } finally {
        loading.value = false;
      }
    };
    const editCourse = () => {
      router.push(`/programs/edit/${id}`);
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
          `/api/courses/${id}`,
          {
            method: "DELETE"
          }
        );
        showSuccess("Учебная программа успешно удалена", "Успех");
        setTimeout(() => {
          router.push("/programs");
        }, 1e3);
      } catch (err) {
        console.error("Error deleting course:", err);
        showError(
          err.data?.message || "Не удалось удалить учебную программу",
          "Ошибка"
        );
      } finally {
        isDeleting.value = false;
        isDeleteModalOpen.value = false;
      }
    };
    const openDisciplineModal = (discipline) => {
      selectedDiscipline.value = discipline;
      isDisciplineModalOpen.value = true;
    };
    const closeDisciplineModal = () => {
      isDisciplineModalOpen.value = false;
      selectedDiscipline.value = void 0;
    };
    const handleDisciplineSuccess = () => {
      loadCourse();
    };
    const closeDeleteDisciplineModal = () => {
      if (!isDeletingDiscipline.value) {
        isDeleteDisciplineModalOpen.value = false;
        selectedDiscipline.value = void 0;
      }
    };
    const confirmDeleteDiscipline = async () => {
      if (!selectedDiscipline.value) return;
      isDeletingDiscipline.value = true;
      try {
        await authFetch(
          `/api/courses/${id}/disciplines/${selectedDiscipline.value.id}`,
          {
            method: "DELETE"
          }
        );
        showSuccess("Дисциплина успешно удалена", "Успех");
        await loadCourse();
      } catch (err) {
        console.error("Error deleting discipline:", err);
        showError(
          err.data?.message || "Не удалось удалить дисциплину",
          "Ошибка"
        );
      } finally {
        isDeletingDiscipline.value = false;
        isDeleteDisciplineModalOpen.value = false;
        selectedDiscipline.value = void 0;
      }
    };
    const formatDateTime = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1$1;
      const _component_ProgramsDisciplineTestsSection = _sfc_main$3;
      const _component_UiConfirmModal = __nuxt_component_3;
      const _component_ProgramsDisciplineFormModal = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div class="mb-3">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/programs",
        class: "flex items-center gap-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"${_scopeId}></path></svg> Назад к списку учебных программ `);
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
                  d: "M15 19l-7-7 7-7"
                })
              ])),
              createTextVNode(" Назад к списку учебных программ ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Учебная программа </h2></div></div>`);
      if (unref(loading)) {
        _push(`<div class="flex justify-center items-center py-20"><div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (unref(error)) {
        _push(`<div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-8"><div class="text-center"><div class="mx-auto mb-4 h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center"><svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><h3 class="mb-2 text-xl font-semibold text-black dark:text-white">Ошибка загрузки</h3><p class="text-gray-600 dark:text-gray-400 mb-4">${ssrInterpolate(unref(error))}</p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          onClick: loadCourse
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
      } else if (unref(course)) {
        _push(`<div><div class="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="relative h-48 overflow-hidden rounded-t-sm bg-linear-to-r from-primary to-primary-600"><div class="absolute inset-0 bg-black/10"></div><div class="absolute inset-0 flex items-center justify-center"><svg class="w-24 h-24 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div></div><div class="px-6 pb-6"><div class="relative -mt-16 mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end"><div class="relative"><div class="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg dark:border-gray-900 dark:bg-boxdark"><div class="h-full w-full flex items-center justify-center bg-primary/10"><span class="text-primary font-bold text-4xl">${ssrInterpolate(unref(course).shortName)}</span></div></div></div><div class="flex-1 text-center sm:text-left"><h3 class="mb-1 text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(course).name)}</h3><p class="mb-2 text-gray-600 dark:text-gray-400"> Код: ${ssrInterpolate(unref(course).code)}</p><div class="flex flex-wrap items-center justify-center gap-3 sm:justify-start"><span class="${ssrRenderClass([
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
          unref(course).isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        ])}"><span class="${ssrRenderClass(["h-2 w-2 rounded-full", unref(course).isActive ? "bg-success" : "bg-danger"])}"></span> ${ssrInterpolate(unref(course).isActive ? "Активна" : "Неактивна")}</span><span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${ssrInterpolate(unref(course).totalHours)} часов </span></div></div><div class="flex gap-3">`);
        if (unref(canEditCourses)) {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "outline",
            size: "md",
            onClick: editCourse
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
        if (unref(canDeleteCourses)) {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "danger",
            size: "md",
            onClick: handleDelete
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg> Удалить `);
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
                  ])),
                  createTextVNode(" Удалить ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div><div><p class="text-sm text-gray-600 dark:text-gray-400">Дисциплин</p><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(course).disciplines?.length || 0)}</p></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-success/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10"><svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div><div><p class="text-sm text-gray-600 dark:text-gray-400">Инструкторов</p><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(totalInstructors))}</p></div></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-warning/50 dark:border-gray-700 dark:bg-gray-800/50"><div class="flex items-center gap-3"><div class="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10"><svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><p class="text-sm text-gray-600 dark:text-gray-400">Всего часов</p><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(course).totalHours)}</p></div></div></div></div></div></div><div class="grid grid-cols-1 gap-6 lg:grid-cols-2"><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Основная информация </h3><div class="space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Полное название</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(unref(course).name)}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Короткое название</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(unref(course).shortName)}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Код программы</p><p class="font-medium text-gray-900 dark:text-white font-mono">${ssrInterpolate(unref(course).code)}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Описание</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(unref(course).description || "—")}</p></div></div></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Дополнительная информация </h3><div class="space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Шаблон сертификата</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(unref(course).certificateTemplate?.name || "Не указан")}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Дата создания</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(formatDateTime(unref(course).createdAt))}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Последнее обновление</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(formatDateTime(unref(course).updatedAt))}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400">ID программы</p><p class="font-medium text-gray-900 dark:text-white font-mono text-sm">${ssrInterpolate(unref(course).id)}</p></div></div></div></div><div class="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><div class="flex items-center justify-between mb-4"><h3 class="text-xl font-semibold text-gray-900 dark:text-white"> Дисциплины курса </h3>`);
        if (unref(canManageDisciplines)) {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "primary",
            size: "sm",
            onClick: ($event) => openDisciplineModal()
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Добавить дисциплину `);
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
                      d: "M12 4v16m8-8H4"
                    })
                  ])),
                  createTextVNode(" Добавить дисциплину ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (!unref(course).disciplines || unref(course).disciplines.length === 0) {
          _push(`<div class="text-center py-8"><div class="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div><p class="text-gray-600 dark:text-gray-400 mb-4"> Дисциплины пока не добавлены </p>`);
          if (unref(canManageDisciplines)) {
            _push(ssrRenderComponent(_component_UiButton, {
              variant: "primary",
              onClick: ($event) => openDisciplineModal()
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` Добавить первую дисциплину `);
                } else {
                  return [
                    createTextVNode(" Добавить первую дисциплину ")
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
          _push(`<div class="space-y-4"><!--[-->`);
          ssrRenderList(unref(course).disciplines, (discipline, index) => {
            _push(`<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-primary/50 transition-all"><div class="flex items-start gap-4"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">${ssrInterpolate(index + 1)}</div><div class="flex-1 min-w-0"><h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${ssrInterpolate(discipline.name)}</h4>`);
            if (discipline.description) {
              _push(`<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${ssrInterpolate(discipline.description)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<div class="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50"><div class="grid grid-cols-2 gap-3 sm:grid-cols-4"><div><p class="text-xs text-gray-500 dark:text-gray-400">Теория</p><p class="text-sm font-semibold text-gray-900 dark:text-white">${ssrInterpolate(discipline.theoryHours)} ч</p></div><div><p class="text-xs text-gray-500 dark:text-gray-400">Практика</p><p class="text-sm font-semibold text-gray-900 dark:text-white">${ssrInterpolate(discipline.practiceHours)} ч</p></div><div><p class="text-xs text-gray-500 dark:text-gray-400">Проверка знаний</p><p class="text-sm font-semibold text-gray-900 dark:text-white">${ssrInterpolate(discipline.assessmentHours)} ч</p></div><div class="col-span-2 sm:col-span-1"><p class="text-xs text-gray-500 dark:text-gray-400">Всего</p><p class="text-sm font-bold text-primary">${ssrInterpolate(discipline.hours)} ч</p></div></div></div><div class="flex flex-wrap gap-3">`);
            if (discipline.instructors && discipline.instructors.length > 0) {
              _push(`<span class="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> ${ssrInterpolate(discipline.instructors.length)} ${ssrInterpolate(discipline.instructors.length === 1 ? "инструктор" : "инструктора")}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
            if (discipline.instructors && discipline.instructors.length > 0) {
              _push(`<div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"><p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Инструкторы:</p><div class="flex flex-wrap gap-2"><!--[-->`);
              ssrRenderList(discipline.instructors, (di) => {
                _push(`<span class="inline-flex items-center gap-1.5 rounded-md bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">${ssrInterpolate(di.instructor?.fullName)} `);
                if (di.isPrimary) {
                  _push(`<span class="text-primary">★</span>`);
                } else {
                  _push(`<!---->`);
                }
                _push(`</span>`);
              });
              _push(`<!--]--></div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(ssrRenderComponent(_component_ProgramsDisciplineTestsSection, {
              "discipline-id": discipline.id,
              "can-manage": unref(canManageDisciplines),
              onUpdated: loadCourse
            }, null, _parent));
            _push(`</div>`);
            if (unref(canManageDisciplines)) {
              _push(`<div class="flex gap-2 shrink-0"><button class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-primary dark:hover:text-primary" title="Редактировать"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button><button class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-danger hover:text-danger dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-danger dark:hover:text-danger" title="Удалить"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": unref(isDeleteModalOpen),
        title: "Удаление учебной программы",
        message: "Вы уверены, что хотите удалить эту учебную программу?",
        "item-name": unref(course)?.name,
        warning: "Это действие нельзя отменить. Все данные программы и связанные дисциплины будут удалены.",
        loading: unref(isDeleting),
        onConfirm: confirmDelete,
        onCancel: closeDeleteModal
      }, null, _parent));
      _push(ssrRenderComponent(_component_ProgramsDisciplineFormModal, {
        "is-open": unref(isDisciplineModalOpen),
        "course-id": unref(id),
        discipline: unref(selectedDiscipline),
        onClose: closeDisciplineModal,
        onSuccess: handleDisciplineSuccess
      }, null, _parent));
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": unref(isDeleteDisciplineModalOpen),
        title: "Удаление дисциплины",
        message: "Вы уверены, что хотите удалить эту дисциплину?",
        "item-name": unref(selectedDiscipline)?.name,
        warning: "Это действие нельзя отменить. Дисциплина будет удалена из курса.",
        loading: unref(isDeletingDiscipline),
        onConfirm: confirmDeleteDiscipline,
        onCancel: closeDeleteDisciplineModal
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/programs/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-CbvheQea.mjs.map
