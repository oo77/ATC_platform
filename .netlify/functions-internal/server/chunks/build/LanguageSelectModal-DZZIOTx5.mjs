import { _ as __nuxt_component_0 } from './Modal-DQYphXo7.mjs';
import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { ref, watch, mergeProps, withCtx, createVNode, createBlock, openBlock, toDisplayString, Fragment, renderList, createCommentVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-pXCaAdz0.mjs';

const _sfc_main = {
  __name: "TestsLanguageSelectModal",
  __ssrInlineRender: true,
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    assignmentId: {
      type: String,
      default: null
    },
    // Позволяет передать список языков напрямую (для preview)
    customLanguages: {
      type: Array,
      default: null
    }
  },
  emits: ["close", "confirm"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const loading = ref(false);
    const error = ref(null);
    const languages = ref([]);
    const selectedLanguage = ref(null);
    const confirming = ref(false);
    watch(
      () => props.isOpen,
      async (isOpen) => {
        if (isOpen) {
          selectedLanguage.value = null;
          if (props.customLanguages) {
            languages.value = props.customLanguages;
            if (languages.value.length === 1) {
              selectedLanguage.value = languages.value[0].value;
            }
          } else if (props.assignmentId) {
            await loadLanguages();
          }
        }
      }
    );
    const loadLanguages = async () => {
      if (!props.assignmentId) return;
      loading.value = true;
      error.value = null;
      try {
        const response = await authFetch(
          `/api/tests/assignments/${props.assignmentId}/available-languages`
        );
        if (response.success) {
          languages.value = response.languages || [];
          if (languages.value.length === 1) {
            selectedLanguage.value = languages.value[0].value;
          }
          if (languages.value.length === 0) {
            error.value = "Для этого теста нет доступных языков. Обратитесь к администратору.";
          }
        } else {
          error.value = response.message || "Не удалось загрузить языки";
        }
      } catch (err) {
        console.error("Ошибка загрузки языков:", err);
        error.value = "Произошла ошибка при загрузке языков";
      } finally {
        loading.value = false;
      }
    };
    const selectLanguage = (lang) => {
      selectedLanguage.value = lang;
    };
    const confirmSelection = () => {
      if (!selectedLanguage.value) return;
      confirming.value = true;
      emit("confirm", selectedLanguage.value);
    };
    watch(
      () => props.isOpen,
      (isOpen) => {
        if (!isOpen) {
          confirming.value = false;
        }
      }
    );
    const handleClose = () => {
      if (!confirming.value) {
        emit("close");
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Выберите язык тестирования",
        size: "sm",
        onClose: handleClose
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex gap-3 justify-end"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: handleClose,
              disabled: confirming.value
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
              onClick: confirmSelection,
              disabled: !selectedLanguage.value || confirming.value,
              loading: confirming.value
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"${_scopeId2}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId2}></path></svg> Подтвердить и начать `);
                } else {
                  return [
                    (openBlock(), createBlock("svg", {
                      class: "w-5 h-5 mr-2",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      }),
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      })
                    ])),
                    createTextVNode(" Подтвердить и начать ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex gap-3 justify-end" }, [
                createVNode(_component_UiButton, {
                  variant: "outline",
                  onClick: handleClose,
                  disabled: confirming.value
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Отмена ")
                  ]),
                  _: 1
                }, 8, ["disabled"]),
                createVNode(_component_UiButton, {
                  onClick: confirmSelection,
                  disabled: !selectedLanguage.value || confirming.value,
                  loading: confirming.value
                }, {
                  default: withCtx(() => [
                    (openBlock(), createBlock("svg", {
                      class: "w-5 h-5 mr-2",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      }),
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      })
                    ])),
                    createTextVNode(" Подтвердить и начать ")
                  ]),
                  _: 1
                }, 8, ["disabled", "loading"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}> Выберите язык, на котором хотите проходить тест. После выбора язык изменить будет невозможно. </p>`);
            if (loading.value) {
              _push2(`<div class="py-8 text-center"${_scopeId}><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"${_scopeId}></div><p class="mt-2 text-sm text-gray-500 dark:text-gray-400"${_scopeId}> Загрузка доступных языков... </p></div>`);
            } else if (error.value) {
              _push2(`<div class="py-6 text-center"${_scopeId}><div class="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-3"${_scopeId}><svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg></div><p class="text-sm text-danger"${_scopeId}>${ssrInterpolate(error.value)}</p><button class="mt-3 text-sm text-primary hover:underline"${_scopeId}> Попробовать снова </button></div>`);
            } else {
              _push2(`<div class="space-y-3"${_scopeId}><!--[-->`);
              ssrRenderList(languages.value, (lang) => {
                _push2(`<label class="${ssrRenderClass([
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  selectedLanguage.value === lang.value ? "border-primary bg-primary/5 shadow-md" : "border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-meta-4"
                ])}"${_scopeId}><div class="${ssrRenderClass([
                  "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  selectedLanguage.value === lang.value ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-600"
                ])}"${_scopeId}>`);
                if (selectedLanguage.value === lang.value) {
                  _push2(`<div class="w-2 h-2 rounded-full bg-white"${_scopeId}></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><span class="text-2xl"${_scopeId}>${ssrInterpolate(lang.flag)}</span><div class="flex-1"${_scopeId}><span class="block font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(lang.label)}</span></div><input type="radio"${ssrRenderAttr("name", "language")}${ssrRenderAttr("value", lang.value)}${ssrIncludeBooleanAttr(selectedLanguage.value === lang.value) ? " checked" : ""} class="sr-only"${_scopeId}></label>`);
              });
              _push2(`<!--]--></div>`);
            }
            _push2(`<div class="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20"${_scopeId}><svg class="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><p class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}><span class="font-medium text-warning"${_scopeId}>Внимание!</span> После начала теста изменить язык будет невозможно. </p></div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, " Выберите язык, на котором хотите проходить тест. После выбора язык изменить будет невозможно. "),
                loading.value ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "py-8 text-center"
                }, [
                  createVNode("div", { class: "inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" }),
                  createVNode("p", { class: "mt-2 text-sm text-gray-500 dark:text-gray-400" }, " Загрузка доступных языков... ")
                ])) : error.value ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "py-6 text-center"
                }, [
                  createVNode("div", { class: "w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-3" }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-6 h-6 text-danger",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      })
                    ]))
                  ]),
                  createVNode("p", { class: "text-sm text-danger" }, toDisplayString(error.value), 1),
                  createVNode("button", {
                    onClick: loadLanguages,
                    class: "mt-3 text-sm text-primary hover:underline"
                  }, " Попробовать снова ")
                ])) : (openBlock(), createBlock("div", {
                  key: 2,
                  class: "space-y-3"
                }, [
                  (openBlock(true), createBlock(Fragment, null, renderList(languages.value, (lang) => {
                    return openBlock(), createBlock("label", {
                      key: lang.value,
                      onClick: ($event) => selectLanguage(lang.value),
                      class: [
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                        selectedLanguage.value === lang.value ? "border-primary bg-primary/5 shadow-md" : "border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-meta-4"
                      ]
                    }, [
                      createVNode("div", {
                        class: [
                          "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedLanguage.value === lang.value ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-600"
                        ]
                      }, [
                        selectedLanguage.value === lang.value ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "w-2 h-2 rounded-full bg-white"
                        })) : createCommentVNode("", true)
                      ], 2),
                      createVNode("span", { class: "text-2xl" }, toDisplayString(lang.flag), 1),
                      createVNode("div", { class: "flex-1" }, [
                        createVNode("span", { class: "block font-medium text-gray-900 dark:text-white" }, toDisplayString(lang.label), 1)
                      ]),
                      createVNode("input", {
                        type: "radio",
                        name: "language",
                        value: lang.value,
                        checked: selectedLanguage.value === lang.value,
                        class: "sr-only"
                      }, null, 8, ["value", "checked"])
                    ], 10, ["onClick"]);
                  }), 128))
                ])),
                createVNode("div", { class: "flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20" }, [
                  (openBlock(), createBlock("svg", {
                    class: "w-5 h-5 text-warning shrink-0 mt-0.5",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    })
                  ])),
                  createVNode("p", { class: "text-sm text-gray-700 dark:text-gray-300" }, [
                    createVNode("span", { class: "font-medium text-warning" }, "Внимание!"),
                    createTextVNode(" После начала теста изменить язык будет невозможно. ")
                  ])
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tests/LanguageSelectModal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=LanguageSelectModal-DZZIOTx5.mjs.map
