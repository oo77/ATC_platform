import { _ as __nuxt_component_0 } from './Modal-DQYphXo7.mjs';
import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { defineComponent, ref, computed, watch, mergeProps, unref, withCtx, createVNode, withModifiers, withDirectives, createBlock, createCommentVNode, createTextVNode, vModelText, openBlock, toDisplayString, Fragment, renderList, vModelSelect, vModelCheckbox, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderAttr, ssrRenderClass, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { u as useNotification } from './useNotification-C2RwAN1X.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "GroupFormModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    group: {}
  },
  emits: ["close", "created", "updated"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const toast = useNotification();
    const loading = ref(false);
    const courses = ref([]);
    const form = ref({
      code: "",
      courseId: "",
      startDate: "",
      endDate: "",
      classroom: "",
      description: "",
      isActive: true
    });
    const errors = ref({});
    const isEdit = computed(() => !!props.group);
    const loadCourses = async () => {
      try {
        const response = await authFetch("/api/courses", {
          params: { limit: 1e3, isActive: true }
        });
        if (response.success && response.courses) {
          courses.value = response.courses;
        }
      } catch (error) {
        console.error("Error loading courses:", error);
      }
    };
    const validateForm = () => {
      errors.value = {};
      if (!form.value.code.trim()) {
        errors.value.code = "Код группы обязателен";
      }
      if (!form.value.courseId) {
        errors.value.courseId = "Выберите учебную программу";
      }
      if (!form.value.startDate) {
        errors.value.startDate = "Укажите дату начала";
      }
      if (!form.value.endDate) {
        errors.value.endDate = "Укажите дату окончания";
      } else if (form.value.startDate && new Date(form.value.endDate) < new Date(form.value.startDate)) {
        errors.value.endDate = "Дата окончания не может быть раньше даты начала";
      }
      return Object.keys(errors.value).length === 0;
    };
    const handleSubmit = async () => {
      if (!validateForm()) return;
      loading.value = true;
      try {
        if (isEdit.value && props.group) {
          const response = await authFetch(
            `/api/groups/${props.group.id}`,
            {
              method: "PUT",
              body: form.value
            }
          );
          if (response.success && response.group) {
            toast.success("Группа успешно обновлена");
            emit("updated", response.group);
            emit("close");
          } else {
            handleErrors(response);
          }
        } else {
          const response = await authFetch(
            "/api/groups",
            {
              method: "POST",
              body: form.value
            }
          );
          if (response.success && response.group) {
            toast.success("Группа успешно создана");
            emit("created", response.group);
            emit("close");
          } else {
            handleErrors(response);
          }
        }
      } catch (error) {
        toast.error("Произошла ошибка при сохранении");
      } finally {
        loading.value = false;
      }
    };
    const handleErrors = (response) => {
      if (response.errors && Array.isArray(response.errors)) {
        for (const err of response.errors) {
          if (err.field) {
            errors.value[err.field] = err.message;
          }
        }
        toast.error(response.message || "Проверьте введённые данные");
      } else {
        toast.error(response.message || "Ошибка при сохранении");
      }
    };
    const resetForm = () => {
      form.value = {
        code: "",
        courseId: "",
        startDate: "",
        endDate: "",
        classroom: "",
        description: "",
        isActive: true
      };
      errors.value = {};
    };
    const fillFormFromGroup = (group) => {
      form.value = {
        code: group.code,
        courseId: group.courseId,
        startDate: formatDateForInput(group.startDate),
        endDate: formatDateForInput(group.endDate),
        classroom: group.classroom || "",
        description: group.description || "",
        isActive: group.isActive
      };
    };
    const formatDateForInput = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        loadCourses();
        if (props.group) {
          fillFormFromGroup(props.group);
        } else {
          resetForm();
        }
      }
    });
    watch(() => props.group, (group) => {
      if (group && props.isOpen) {
        fillFormFromGroup(group);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: unref(isEdit) ? "Редактировать группу" : "Создать группу",
        size: "md",
        onClose: ($event) => _ctx.$emit("close")
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: ($event) => _ctx.$emit("close")
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
              loading: unref(loading),
              onClick: handleSubmit
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`${ssrInterpolate(unref(isEdit) ? "Сохранить" : "Создать группу")}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(unref(isEdit) ? "Сохранить" : "Создать группу"), 1)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-end gap-3" }, [
                createVNode(_component_UiButton, {
                  variant: "outline",
                  onClick: ($event) => _ctx.$emit("close")
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Отмена ")
                  ]),
                  _: 1
                }, 8, ["onClick"]),
                createVNode(_component_UiButton, {
                  loading: unref(loading),
                  onClick: handleSubmit
                }, {
                  default: withCtx(() => [
                    createTextVNode(toDisplayString(unref(isEdit) ? "Сохранить" : "Создать группу"), 1)
                  ]),
                  _: 1
                }, 8, ["loading"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-6"${_scopeId}><div${_scopeId}><label class="mb-2.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Код группы <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", unref(form).code)} type="text" placeholder="Например: АПАК-20" class="${ssrRenderClass([
              "w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition",
              unref(errors).code ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
            ])}"${_scopeId}>`);
            if (unref(errors).code) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(unref(errors).code)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="mb-2.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Учебная программа <span class="text-danger"${_scopeId}>*</span></label><div class="relative"${_scopeId}><select class="${ssrRenderClass([
              "w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition appearance-none",
              unref(errors).courseId ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
            ])}"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).courseId) ? ssrLooseContain(unref(form).courseId, "") : ssrLooseEqual(unref(form).courseId, "")) ? " selected" : ""}${_scopeId}>Выберите программу...</option><!--[-->`);
            ssrRenderList(unref(courses), (course) => {
              _push2(`<option${ssrRenderAttr("value", course.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).courseId) ? ssrLooseContain(unref(form).courseId, course.id) : ssrLooseEqual(unref(form).courseId, course.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(course.shortName)} - ${ssrInterpolate(course.name)} (${ssrInterpolate(course.totalHours)} ч.) </option>`);
            });
            _push2(`<!--]--></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div>`);
            if (unref(errors).courseId) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(unref(errors).courseId)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="grid grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><label class="mb-2.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Дата начала <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", unref(form).startDate)} type="date" class="${ssrRenderClass([
              "w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition",
              unref(errors).startDate ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
            ])}"${_scopeId}>`);
            if (unref(errors).startDate) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(unref(errors).startDate)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="mb-2.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Дата окончания <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", unref(form).endDate)} type="date" class="${ssrRenderClass([
              "w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition",
              unref(errors).endDate ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
            ])}"${_scopeId}>`);
            if (unref(errors).endDate) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(unref(errors).endDate)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div${_scopeId}><label class="mb-2.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Аудитория </label><input${ssrRenderAttr("value", unref(form).classroom)} type="text" placeholder="Например: Ауд. 305" class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary"${_scopeId}></div><div${_scopeId}><label class="mb-2.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Описание </label><textarea rows="3" placeholder="Дополнительная информация о группе..." class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary resize-none"${_scopeId}>${ssrInterpolate(unref(form).description)}</textarea></div><div class="flex items-center gap-3"${_scopeId}><label class="relative inline-flex cursor-pointer items-center"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).isActive) ? ssrLooseContain(unref(form).isActive, null) : unref(form).isActive) ? " checked" : ""} type="checkbox" class="peer sr-only"${_scopeId}><div class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"${_scopeId}></div></label><span class="text-sm font-medium text-black dark:text-white"${_scopeId}>${ssrInterpolate(unref(form).isActive ? "Активная группа" : "Неактивная группа")}</span></div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(handleSubmit, ["prevent"]),
                class: "space-y-6"
              }, [
                createVNode("div", null, [
                  createVNode("label", { class: "mb-2.5 block text-sm font-medium text-black dark:text-white" }, [
                    createTextVNode(" Код группы "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => unref(form).code = $event,
                    type: "text",
                    placeholder: "Например: АПАК-20",
                    class: [
                      "w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition",
                      unref(errors).code ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
                    ]
                  }, null, 10, ["onUpdate:modelValue"]), [
                    [vModelText, unref(form).code]
                  ]),
                  unref(errors).code ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-sm text-danger"
                  }, toDisplayString(unref(errors).code), 1)) : createCommentVNode("", true)
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "mb-2.5 block text-sm font-medium text-black dark:text-white" }, [
                    createTextVNode(" Учебная программа "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  createVNode("div", { class: "relative" }, [
                    withDirectives(createVNode("select", {
                      "onUpdate:modelValue": ($event) => unref(form).courseId = $event,
                      class: [
                        "w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition appearance-none",
                        unref(errors).courseId ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
                      ]
                    }, [
                      createVNode("option", { value: "" }, "Выберите программу..."),
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(courses), (course) => {
                        return openBlock(), createBlock("option", {
                          key: course.id,
                          value: course.id
                        }, toDisplayString(course.shortName) + " - " + toDisplayString(course.name) + " (" + toDisplayString(course.totalHours) + " ч.) ", 9, ["value"]);
                      }), 128))
                    ], 10, ["onUpdate:modelValue"]), [
                      [vModelSelect, unref(form).courseId]
                    ]),
                    (openBlock(), createBlock("svg", {
                      class: "absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M19 9l-7 7-7-7"
                      })
                    ]))
                  ]),
                  unref(errors).courseId ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-sm text-danger"
                  }, toDisplayString(unref(errors).courseId), 1)) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                  createVNode("div", null, [
                    createVNode("label", { class: "mb-2.5 block text-sm font-medium text-black dark:text-white" }, [
                      createTextVNode(" Дата начала "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => unref(form).startDate = $event,
                      type: "date",
                      class: [
                        "w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition",
                        unref(errors).startDate ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
                      ]
                    }, null, 10, ["onUpdate:modelValue"]), [
                      [vModelText, unref(form).startDate]
                    ]),
                    unref(errors).startDate ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-danger"
                    }, toDisplayString(unref(errors).startDate), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "mb-2.5 block text-sm font-medium text-black dark:text-white" }, [
                      createTextVNode(" Дата окончания "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => unref(form).endDate = $event,
                      type: "date",
                      class: [
                        "w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition",
                        unref(errors).endDate ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
                      ]
                    }, null, 10, ["onUpdate:modelValue"]), [
                      [vModelText, unref(form).endDate]
                    ]),
                    unref(errors).endDate ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-danger"
                    }, toDisplayString(unref(errors).endDate), 1)) : createCommentVNode("", true)
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "mb-2.5 block text-sm font-medium text-black dark:text-white" }, " Аудитория "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => unref(form).classroom = $event,
                    type: "text",
                    placeholder: "Например: Ауд. 305",
                    class: "w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(form).classroom]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "mb-2.5 block text-sm font-medium text-black dark:text-white" }, " Описание "),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => unref(form).description = $event,
                    rows: "3",
                    placeholder: "Дополнительная информация о группе...",
                    class: "w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary resize-none"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(form).description]
                  ])
                ]),
                createVNode("div", { class: "flex items-center gap-3" }, [
                  createVNode("label", { class: "relative inline-flex cursor-pointer items-center" }, [
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => unref(form).isActive = $event,
                      type: "checkbox",
                      class: "peer sr-only"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelCheckbox, unref(form).isActive]
                    ]),
                    createVNode("div", { class: "h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700" })
                  ]),
                  createVNode("span", { class: "text-sm font-medium text-black dark:text-white" }, toDisplayString(unref(form).isActive ? "Активная группа" : "Неактивная группа"), 1)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/groups/GroupFormModal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main, { __name: "GroupsGroupFormModal" });

export { __nuxt_component_2 as _ };
//# sourceMappingURL=GroupFormModal-Do0sTku8.mjs.map
