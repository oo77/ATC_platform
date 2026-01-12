import { _ as __nuxt_component_0 } from './Modal-DQYphXo7.mjs';
import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { defineComponent, mergeProps, withCtx, createVNode, createBlock, createCommentVNode, openBlock, toDisplayString, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ConfirmModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    title: { default: "Подтверждение удаления" },
    message: { default: "Вы уверены, что хотите удалить этот элемент?" },
    itemName: {},
    warning: {},
    confirmText: { default: "Удалить" },
    cancelText: { default: "Отмена" },
    variant: { default: "danger" },
    loading: { type: Boolean, default: false }
  },
  emits: ["confirm", "cancel"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const handleConfirm = () => {
      emit("confirm");
    };
    const handleCancel = () => {
      emit("cancel");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: __props.title,
        size: "sm",
        onClose: handleCancel
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "secondary",
              disabled: __props.loading,
              onClick: handleCancel
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`${ssrInterpolate(__props.cancelText)}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(__props.cancelText), 1)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: __props.variant === "danger" ? "danger" : "warning",
              disabled: __props.loading,
              onClick: handleConfirm
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (__props.loading) {
                    _push3(`<span class="flex items-center gap-2"${_scopeId2}><svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"${_scopeId2}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId2}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId2}></path></svg> Удаление... </span>`);
                  } else {
                    _push3(`<span${_scopeId2}>${ssrInterpolate(__props.confirmText)}</span>`);
                  }
                } else {
                  return [
                    __props.loading ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "flex items-center gap-2"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 animate-spin",
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
                          d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        })
                      ])),
                      createTextVNode(" Удаление... ")
                    ])) : (openBlock(), createBlock("span", { key: 1 }, toDisplayString(__props.confirmText), 1))
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
                  variant: "secondary",
                  disabled: __props.loading,
                  onClick: handleCancel
                }, {
                  default: withCtx(() => [
                    createTextVNode(toDisplayString(__props.cancelText), 1)
                  ]),
                  _: 1
                }, 8, ["disabled"]),
                createVNode(_component_UiButton, {
                  variant: __props.variant === "danger" ? "danger" : "warning",
                  disabled: __props.loading,
                  onClick: handleConfirm
                }, {
                  default: withCtx(() => [
                    __props.loading ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "flex items-center gap-2"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 animate-spin",
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
                          d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        })
                      ])),
                      createTextVNode(" Удаление... ")
                    ])) : (openBlock(), createBlock("span", { key: 1 }, toDisplayString(__props.confirmText), 1))
                  ]),
                  _: 1
                }, 8, ["variant", "disabled"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex flex-col items-center text-center"${_scopeId}><div class="relative mb-4"${_scopeId}><div class="${ssrRenderClass([[
              __props.variant === "danger" ? "bg-red-100 dark:bg-red-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"
            ], "h-16 w-16 rounded-full flex items-center justify-center"])}"${_scopeId}><svg class="${ssrRenderClass([[
              __props.variant === "danger" ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"
            ], "w-8 h-8 animate-pulse"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}>`);
            if (__props.variant === "danger") {
              _push2(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path>`);
            } else {
              _push2(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path>`);
            }
            _push2(`</svg></div><div class="${ssrRenderClass([[
              __props.variant === "danger" ? "border-red-500" : "border-yellow-500"
            ], "absolute inset-0 rounded-full border-2 animate-ping opacity-30"])}"${_scopeId}></div></div><p class="text-gray-600 dark:text-gray-400 text-base mb-2"${_scopeId}>${ssrInterpolate(__props.message)}</p>`);
            if (__props.itemName) {
              _push2(`<p class="font-medium text-black dark:text-white text-lg mb-4"${_scopeId}>${ssrInterpolate(__props.itemName)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            if (__props.warning) {
              _push2(`<p class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg"${_scopeId}>${ssrInterpolate(__props.warning)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex flex-col items-center text-center" }, [
                createVNode("div", { class: "relative mb-4" }, [
                  createVNode("div", {
                    class: ["h-16 w-16 rounded-full flex items-center justify-center", [
                      __props.variant === "danger" ? "bg-red-100 dark:bg-red-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"
                    ]]
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: ["w-8 h-8 animate-pulse", [
                        __props.variant === "danger" ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"
                      ]],
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      __props.variant === "danger" ? (openBlock(), createBlock("path", {
                        key: 0,
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      })) : (openBlock(), createBlock("path", {
                        key: 1,
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      }))
                    ], 2))
                  ], 2),
                  createVNode("div", {
                    class: ["absolute inset-0 rounded-full border-2 animate-ping opacity-30", [
                      __props.variant === "danger" ? "border-red-500" : "border-yellow-500"
                    ]]
                  }, null, 2)
                ]),
                createVNode("p", { class: "text-gray-600 dark:text-gray-400 text-base mb-2" }, toDisplayString(__props.message), 1),
                __props.itemName ? (openBlock(), createBlock("p", {
                  key: 0,
                  class: "font-medium text-black dark:text-white text-lg mb-4"
                }, toDisplayString(__props.itemName), 1)) : createCommentVNode("", true),
                __props.warning ? (openBlock(), createBlock("p", {
                  key: 1,
                  class: "text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg"
                }, toDisplayString(__props.warning), 1)) : createCommentVNode("", true)
              ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/ConfirmModal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main, { __name: "UiConfirmModal" });

export { __nuxt_component_3 as _ };
//# sourceMappingURL=ConfirmModal-GQ4JU241.mjs.map
