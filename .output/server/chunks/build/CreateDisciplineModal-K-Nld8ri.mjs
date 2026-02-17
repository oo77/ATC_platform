import { _ as __nuxt_component_0 } from './Modal-DQYphXo7.mjs';
import { _ as __nuxt_component_1 } from './MultiSelect-D4TFMDTt.mjs';
import { _ as __nuxt_component_1$1 } from './Button-D9CRGwzT.mjs';
import { defineComponent, ref, computed, watch, mergeProps, unref, withCtx, createTextVNode, toDisplayString, createVNode, withModifiers, withDirectives, createBlock, createCommentVNode, vModelText, openBlock, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderAttr, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "CreateDisciplineModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    discipline: {},
    instructorOptions: {}
  },
  emits: ["close", "save"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
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
        formData.value = { ...props.discipline };
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
      if (!formData.value.instructorIds || formData.value.instructorIds.length === 0) {
        errors.value.instructors = "Необходимо выбрать хотя бы одного инструктора";
      }
      return Object.keys(errors.value).length === 0;
    };
    const handleSubmit = () => {
      if (!validateForm()) {
        const firstError = Object.values(errors.value)[0];
        if (firstError) {
          showError(firstError, "Ошибка валидации");
        }
        return;
      }
      emit("save", { ...formData.value });
      resetForm();
    };
    const handleClose = () => {
      resetForm();
      emit("close");
    };
    const { error: showError } = useNotification();
    watch(() => props.isOpen, (newValue) => {
      if (newValue) {
        loadDisciplineData();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiMultiSelect = __nuxt_component_1;
      const _component_UiButton = __nuxt_component_1$1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: unref(title),
        size: "lg"
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
            _push2(`</div><div${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiMultiSelect, {
              modelValue: unref(formData).instructorIds,
              "onUpdate:modelValue": ($event) => unref(formData).instructorIds = $event,
              options: __props.instructorOptions,
              label: "Инструкторы",
              placeholder: "Выберите инструкторов...",
              hint: "Можно выбрать несколько инструкторов"
            }, null, _parent2, _scopeId));
            _push2(`</div><div class="flex justify-end gap-3 border-t border-stroke pt-6 dark:border-strokedark"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              type: "button",
              variant: "outline",
              onClick: handleClose
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
              variant: "primary"
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
                createVNode("div", null, [
                  createVNode(_component_UiMultiSelect, {
                    modelValue: unref(formData).instructorIds,
                    "onUpdate:modelValue": ($event) => unref(formData).instructorIds = $event,
                    options: __props.instructorOptions,
                    label: "Инструкторы",
                    placeholder: "Выберите инструкторов...",
                    hint: "Можно выбрать несколько инструкторов"
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                ]),
                createVNode("div", { class: "flex justify-end gap-3 border-t border-stroke pt-6 dark:border-strokedark" }, [
                  createVNode(_component_UiButton, {
                    type: "button",
                    variant: "outline",
                    onClick: handleClose
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }),
                  createVNode(_component_UiButton, {
                    type: "submit",
                    variant: "primary"
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(__props.discipline ? "Сохранить изменения" : "Добавить дисциплину"), 1)
                    ]),
                    _: 1
                  })
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
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/programs/CreateDisciplineModal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main, { __name: "ProgramsCreateDisciplineModal" });

export { __nuxt_component_2 as _ };
//# sourceMappingURL=CreateDisciplineModal-K-Nld8ri.mjs.map
