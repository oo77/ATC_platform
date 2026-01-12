import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_0$1 } from './Modal-DQYphXo7.mjs';
import { defineComponent, computed, ref, mergeProps, unref, withCtx, createBlock, createTextVNode, openBlock, createVNode, toDisplayString, createCommentVNode, Fragment, renderList, watch, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderList, ssrRenderClass, ssrRenderTeleport, ssrRenderStyle } from 'vue/server-renderer';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import { c as useRoute, u as useHead } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { u as useNotification } from './useNotification-C2RwAN1X.mjs';
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

const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "WarningsModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    student: {},
    warnings: {}
  },
  emits: ["close", "confirm"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const warningLabels = {
      low_attendance: "Низкая посещаемость",
      missing_grades: "Не все оценки выставлены",
      low_grade: "Низкий балл",
      incomplete_disciplines: "Пройдены не все дисциплины"
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Предупреждения перед выдачей",
        size: "sm",
        onClose: ($event) => emit("close")
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: ($event) => emit("close")
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
              variant: "warning",
              onClick: ($event) => emit("confirm")
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId2}></path></svg> Всё равно выдать `);
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
                        d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      })
                    ])),
                    createTextVNode(" Всё равно выдать ")
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
                  onClick: ($event) => emit("close")
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Отмена ")
                  ]),
                  _: 1
                }, 8, ["onClick"]),
                createVNode(_component_UiButton, {
                  variant: "warning",
                  onClick: ($event) => emit("confirm")
                }, {
                  default: withCtx(() => [
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
                        d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      })
                    ])),
                    createTextVNode(" Всё равно выдать ")
                  ]),
                  _: 1
                }, 8, ["onClick"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex flex-col items-center text-center mb-6"${_scopeId}><div class="mx-auto mb-4 h-14 w-14 rounded-full bg-warning/10 flex items-center justify-center"${_scopeId}><svg class="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg></div>`);
            if (__props.student) {
              _push2(`<p class="text-gray-500 dark:text-gray-400 mb-4"${_scopeId}> Студент: <span class="font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(__props.student.fullName)}</span></p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="space-y-3 mb-6"${_scopeId}><!--[-->`);
            ssrRenderList(__props.warnings, (warning, idx) => {
              _push2(`<div class="flex gap-3 p-3 bg-warning/5 border border-warning/20 rounded-lg"${_scopeId}><svg class="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><div${_scopeId}><p class="text-sm font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(warningLabels[warning.type] || warning.type)}</p><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(warning.message)}</p></div></div>`);
            });
            _push2(`<!--]--></div><p class="text-sm text-center text-gray-500 dark:text-gray-400 mb-4"${_scopeId}> Вы уверены, что хотите выдать сертификат несмотря на предупреждения? </p>`);
          } else {
            return [
              createVNode("div", { class: "flex flex-col items-center text-center mb-6" }, [
                createVNode("div", { class: "mx-auto mb-4 h-14 w-14 rounded-full bg-warning/10 flex items-center justify-center" }, [
                  (openBlock(), createBlock("svg", {
                    class: "w-8 h-8 text-warning",
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
                __props.student ? (openBlock(), createBlock("p", {
                  key: 0,
                  class: "text-gray-500 dark:text-gray-400 mb-4"
                }, [
                  createTextVNode(" Студент: "),
                  createVNode("span", { class: "font-medium text-gray-900 dark:text-white" }, toDisplayString(__props.student.fullName), 1)
                ])) : createCommentVNode("", true)
              ]),
              createVNode("div", { class: "space-y-3 mb-6" }, [
                (openBlock(true), createBlock(Fragment, null, renderList(__props.warnings, (warning, idx) => {
                  return openBlock(), createBlock("div", {
                    key: idx,
                    class: "flex gap-3 p-3 bg-warning/5 border border-warning/20 rounded-lg"
                  }, [
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
                    createVNode("div", null, [
                      createVNode("p", { class: "text-sm font-medium text-gray-900 dark:text-white" }, toDisplayString(warningLabels[warning.type] || warning.type), 1),
                      createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, toDisplayString(warning.message), 1)
                    ])
                  ]);
                }), 128))
              ]),
              createVNode("p", { class: "text-sm text-center text-gray-500 dark:text-gray-400 mb-4" }, " Вы уверены, что хотите выдать сертификат несмотря на предупреждения? ")
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/WarningsModal.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$3, { __name: "CertificatesWarningsModal" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "ResultsModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    results: {}
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const successCount = computed(() => props.results.filter((r) => r.success).length);
    const errorCount = computed(() => props.results.filter((r) => !r.success).length);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Результаты выдачи",
        size: "md",
        onClose: ($event) => emit("close")
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-center"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              onClick: ($event) => emit("close")
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Закрыть `);
                } else {
                  return [
                    createTextVNode(" Закрыть ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-center" }, [
                createVNode(_component_UiButton, {
                  onClick: ($event) => emit("close")
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Закрыть ")
                  ]),
                  _: 1
                }, 8, ["onClick"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex flex-col items-center text-center mb-6"${_scopeId}><div class="mx-auto mb-4 h-14 w-14 rounded-full bg-success/10 flex items-center justify-center"${_scopeId}><svg class="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg></div><p class="text-gray-500 dark:text-gray-400"${_scopeId}> Успешно: <span class="text-success font-semibold"${_scopeId}>${ssrInterpolate(unref(successCount))}</span> • Ошибок: <span class="text-danger font-semibold"${_scopeId}>${ssrInterpolate(unref(errorCount))}</span></p></div><div class="max-h-80 overflow-y-auto space-y-2"${_scopeId}><!--[-->`);
            ssrRenderList(__props.results, (result) => {
              _push2(`<div class="${ssrRenderClass([
                "flex items-center gap-3 p-3 rounded-lg",
                result.success ? "bg-success/5 border border-success/20" : "bg-danger/5 border border-danger/20"
              ])}"${_scopeId}><div class="${ssrRenderClass([
                "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                result.success ? "bg-success/10" : "bg-danger/10"
              ])}"${_scopeId}>`);
              if (result.success) {
                _push2(`<svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"${_scopeId}></path></svg>`);
              } else {
                _push2(`<svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg>`);
              }
              _push2(`</div><div class="flex-1 min-w-0"${_scopeId}><p class="font-medium text-gray-900 dark:text-white truncate"${_scopeId}>${ssrInterpolate(result.studentName)}</p>`);
              if (result.success) {
                _push2(`<p class="text-sm text-success"${_scopeId}> Сертификат № ${ssrInterpolate(result.certificateNumber)}</p>`);
              } else {
                _push2(`<p class="text-sm text-danger"${_scopeId}>${ssrInterpolate(result.error)}</p>`);
              }
              _push2(`</div></div>`);
            });
            _push2(`<!--]--></div>`);
          } else {
            return [
              createVNode("div", { class: "flex flex-col items-center text-center mb-6" }, [
                createVNode("div", { class: "mx-auto mb-4 h-14 w-14 rounded-full bg-success/10 flex items-center justify-center" }, [
                  (openBlock(), createBlock("svg", {
                    class: "w-8 h-8 text-success",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    })
                  ]))
                ]),
                createVNode("p", { class: "text-gray-500 dark:text-gray-400" }, [
                  createTextVNode(" Успешно: "),
                  createVNode("span", { class: "text-success font-semibold" }, toDisplayString(unref(successCount)), 1),
                  createTextVNode(" • Ошибок: "),
                  createVNode("span", { class: "text-danger font-semibold" }, toDisplayString(unref(errorCount)), 1)
                ])
              ]),
              createVNode("div", { class: "max-h-80 overflow-y-auto space-y-2" }, [
                (openBlock(true), createBlock(Fragment, null, renderList(__props.results, (result) => {
                  return openBlock(), createBlock("div", {
                    key: result.studentId,
                    class: [
                      "flex items-center gap-3 p-3 rounded-lg",
                      result.success ? "bg-success/5 border border-success/20" : "bg-danger/5 border border-danger/20"
                    ]
                  }, [
                    createVNode("div", {
                      class: [
                        "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        result.success ? "bg-success/10" : "bg-danger/10"
                      ]
                    }, [
                      result.success ? (openBlock(), createBlock("svg", {
                        key: 0,
                        class: "w-5 h-5 text-success",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M5 13l4 4L19 7"
                        })
                      ])) : (openBlock(), createBlock("svg", {
                        key: 1,
                        class: "w-5 h-5 text-danger",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M6 18L18 6M6 6l12 12"
                        })
                      ]))
                    ], 2),
                    createVNode("div", { class: "flex-1 min-w-0" }, [
                      createVNode("p", { class: "font-medium text-gray-900 dark:text-white truncate" }, toDisplayString(result.studentName), 1),
                      result.success ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "text-sm text-success"
                      }, " Сертификат № " + toDisplayString(result.certificateNumber), 1)) : (openBlock(), createBlock("p", {
                        key: 1,
                        class: "text-sm text-danger"
                      }, toDisplayString(result.error), 1))
                    ])
                  ], 2);
                }), 128))
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/ResultsModal.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$2, { __name: "CertificatesResultsModal" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "BulkIssueModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    studentsCount: {},
    templateName: {}
  },
  emits: ["close", "confirm", "progress", "complete"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const isProcessing = ref(false);
    const isCompleted = ref(false);
    const isConfirming = ref(false);
    const processedCount = ref(0);
    const currentStudentName = ref("");
    const successCount = ref(0);
    const warningCount = ref(0);
    const errorCount = ref(0);
    const errors = ref([]);
    const progressPercent = computed(() => {
      if (props.studentsCount === 0) return 0;
      return Math.round(processedCount.value / props.studentsCount * 100);
    });
    const handleClose = () => {
      if (!isProcessing.value) {
        resetState();
        emit("close");
      }
    };
    const handleConfirm = () => {
      if (isConfirming.value) return;
      isConfirming.value = true;
      emit("confirm");
    };
    const resetState = () => {
      isProcessing.value = false;
      isCompleted.value = false;
      isConfirming.value = false;
      processedCount.value = 0;
      currentStudentName.value = "";
      successCount.value = 0;
      warningCount.value = 0;
      errorCount.value = 0;
      errors.value = [];
    };
    const startProcessing = () => {
      isProcessing.value = true;
      isCompleted.value = false;
      processedCount.value = 0;
      successCount.value = 0;
      warningCount.value = 0;
      errorCount.value = 0;
      errors.value = [];
    };
    const updateProgress = (studentName, processed) => {
      currentStudentName.value = studentName;
      processedCount.value = processed;
    };
    const addResult = (result) => {
      if (result.success) {
        if (result.warnings && result.warnings.length > 0) {
          warningCount.value++;
        } else {
          successCount.value++;
        }
      } else {
        errorCount.value++;
        errors.value.push({
          studentName: result.studentName,
          error: result.error || "Неизвестная ошибка"
        });
      }
    };
    const completeProcessing = (results) => {
      isProcessing.value = false;
      isCompleted.value = true;
      currentStudentName.value = "";
      emit("complete", results);
    };
    watch(() => props.isOpen, (open) => {
      if (!open) {
        resetState();
      }
    });
    __expose({
      startProcessing,
      updateProgress,
      addResult,
      completeProcessing
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      ssrRenderTeleport(_push, (_push2) => {
        if (__props.isOpen) {
          _push2(`<div class="fixed inset-0 z-9999 flex items-center justify-center" data-v-40da6b6a><div class="absolute inset-0 bg-black/50 backdrop-blur-sm" data-v-40da6b6a></div><div class="relative bg-white dark:bg-boxdark rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" data-v-40da6b6a><div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700" data-v-40da6b6a><div class="flex items-center gap-3" data-v-40da6b6a><div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center" data-v-40da6b6a><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-40da6b6a><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" data-v-40da6b6a></path></svg></div><div data-v-40da6b6a><h3 class="text-lg font-semibold text-gray-900 dark:text-white" data-v-40da6b6a>${ssrInterpolate(unref(isProcessing) ? "Выдача сертификатов" : "Подтверждение выдачи")}</h3><p class="text-sm text-gray-500 dark:text-gray-400" data-v-40da6b6a>${ssrInterpolate(unref(isProcessing) ? "Пожалуйста, подождите..." : `${__props.studentsCount} слушателей`)}</p></div></div></div><div class="px-6 py-6" data-v-40da6b6a>`);
          if (!unref(isProcessing) && !unref(isCompleted)) {
            _push2(`<!--[--><p class="text-gray-600 dark:text-gray-300 mb-4" data-v-40da6b6a> Вы собираетесь выдать сертификаты <strong data-v-40da6b6a>${ssrInterpolate(__props.studentsCount)}</strong> слушателям. </p><div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4" data-v-40da6b6a><div class="flex items-center gap-3" data-v-40da6b6a><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-40da6b6a><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-v-40da6b6a></path></svg><div data-v-40da6b6a><p class="text-sm font-medium text-gray-900 dark:text-white" data-v-40da6b6a>${ssrInterpolate(__props.templateName)}</p><p class="text-xs text-gray-500" data-v-40da6b6a>Шаблон сертификата</p></div></div></div><p class="text-sm text-gray-500 dark:text-gray-400" data-v-40da6b6a> Продолжить выдачу? </p><!--]-->`);
          } else if (unref(isProcessing)) {
            _push2(`<div class="space-y-4" data-v-40da6b6a><div data-v-40da6b6a><div class="flex justify-between text-sm mb-2" data-v-40da6b6a><span class="text-gray-600 dark:text-gray-400" data-v-40da6b6a>Прогресс</span><span class="font-medium text-gray-900 dark:text-white" data-v-40da6b6a>${ssrInterpolate(unref(processedCount))} / ${ssrInterpolate(__props.studentsCount)}</span></div><div class="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" data-v-40da6b6a><div class="absolute left-0 top-0 h-full bg-linear-to-r from-primary to-primary/80 rounded-full transition-all duration-300 ease-out" style="${ssrRenderStyle({ width: `${unref(progressPercent)}%` })}" data-v-40da6b6a></div>`);
            if (unref(progressPercent) < 100) {
              _push2(`<div class="absolute right-0 top-0 h-full w-12 bg-linear-to-l from-primary/30 to-transparent animate-pulse" style="${ssrRenderStyle({ left: `${Math.max(0, unref(progressPercent) - 5)}%` })}" data-v-40da6b6a></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg" data-v-40da6b6a><div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse" data-v-40da6b6a><svg class="w-4 h-4 text-primary animate-spin" fill="none" viewBox="0 0 24 24" data-v-40da6b6a><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-40da6b6a></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-v-40da6b6a></path></svg></div><div class="min-w-0 flex-1" data-v-40da6b6a><p class="text-sm font-medium text-gray-900 dark:text-white truncate" data-v-40da6b6a>${ssrInterpolate(unref(currentStudentName) || "Обработка...")}</p><p class="text-xs text-gray-500" data-v-40da6b6a>Создание сертификата...</p></div></div><div class="grid grid-cols-3 gap-3 text-center" data-v-40da6b6a><div class="p-2 bg-success/10 rounded-lg" data-v-40da6b6a><p class="text-lg font-bold text-success" data-v-40da6b6a>${ssrInterpolate(unref(successCount))}</p><p class="text-xs text-success/80" data-v-40da6b6a>Успешно</p></div><div class="p-2 bg-warning/10 rounded-lg" data-v-40da6b6a><p class="text-lg font-bold text-warning" data-v-40da6b6a>${ssrInterpolate(unref(warningCount))}</p><p class="text-xs text-warning/80" data-v-40da6b6a>С замечаниями</p></div><div class="p-2 bg-danger/10 rounded-lg" data-v-40da6b6a><p class="text-lg font-bold text-danger" data-v-40da6b6a>${ssrInterpolate(unref(errorCount))}</p><p class="text-xs text-danger/80" data-v-40da6b6a>Ошибки</p></div></div></div>`);
          } else if (unref(isCompleted)) {
            _push2(`<div class="text-center py-4" data-v-40da6b6a><div class="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4" data-v-40da6b6a><svg class="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-40da6b6a><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-40da6b6a></path></svg></div><h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2" data-v-40da6b6a> Выдача завершена </h4><p class="text-gray-500 dark:text-gray-400 mb-4" data-v-40da6b6a> Обработано ${ssrInterpolate(unref(processedCount))} из ${ssrInterpolate(__props.studentsCount)} слушателей </p><div class="grid grid-cols-3 gap-3 text-center mb-4" data-v-40da6b6a><div class="p-3 bg-success/10 rounded-lg" data-v-40da6b6a><p class="text-2xl font-bold text-success" data-v-40da6b6a>${ssrInterpolate(unref(successCount))}</p><p class="text-xs text-success/80" data-v-40da6b6a>Выдано</p></div><div class="p-3 bg-warning/10 rounded-lg" data-v-40da6b6a><p class="text-2xl font-bold text-warning" data-v-40da6b6a>${ssrInterpolate(unref(warningCount))}</p><p class="text-xs text-warning/80" data-v-40da6b6a>С замечаниями</p></div><div class="p-3 bg-danger/10 rounded-lg" data-v-40da6b6a><p class="text-2xl font-bold text-danger" data-v-40da6b6a>${ssrInterpolate(unref(errorCount))}</p><p class="text-xs text-danger/80" data-v-40da6b6a>Ошибки</p></div></div>`);
            if (unref(errors).length > 0) {
              _push2(`<div class="text-left max-h-32 overflow-y-auto" data-v-40da6b6a><p class="text-sm font-medium text-danger mb-2" data-v-40da6b6a>Ошибки:</p><ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1" data-v-40da6b6a><!--[-->`);
              ssrRenderList(unref(errors), (err, idx) => {
                _push2(`<li class="flex items-start gap-2" data-v-40da6b6a><svg class="w-4 h-4 text-danger shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-40da6b6a><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-40da6b6a></path></svg><span data-v-40da6b6a>${ssrInterpolate(err.studentName)}: ${ssrInterpolate(err.error)}</span></li>`);
              });
              _push2(`<!--]--></ul></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div><div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3" data-v-40da6b6a>`);
          if (!unref(isProcessing) && !unref(isCompleted)) {
            _push2(`<!--[-->`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: handleClose
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
              variant: "primary",
              onClick: handleConfirm,
              disabled: unref(isConfirming)
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-40da6b6a${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-40da6b6a${_scopeId}></path></svg> Выдать сертификаты `);
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
                        d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      })
                    ])),
                    createTextVNode(" Выдать сертификаты ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push2(`<!--]-->`);
          } else if (unref(isCompleted)) {
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "primary",
              onClick: handleClose
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(` Закрыть `);
                } else {
                  return [
                    createTextVNode(" Закрыть ")
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/BulkIssueModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_4 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["__scopeId", "data-v-40da6b6a"]]), { __name: "CertificatesBulkIssueModal" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "certificates",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const { authFetch } = useAuthFetch();
    const { success: showSuccess, error: showError } = useNotification();
    const groupId = computed(() => route.params.id);
    const loading = ref(true);
    const group = ref(null);
    const journal = ref([]);
    const stats = ref({
      totalStudents: 0,
      eligible: 0,
      withWarnings: 0,
      issued: 0,
      revoked: 0
    });
    const template = ref(null);
    const issueDate = ref((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    const selectedStudentIds = ref([]);
    const isIssuing = ref(false);
    const issuingStudentId = ref(null);
    const issueResults = ref([]);
    const resultsModalOpen = ref(false);
    const bulkIssueModalOpen = ref(false);
    const bulkIssueModalRef = ref(null);
    const bulkIssueStudentIds = ref([]);
    const bulkIssueMode = ref("eligible");
    const warningsModalOpen = ref(false);
    const selectedStudent = ref(null);
    const selectedWarnings = ref([]);
    const pendingIssueStudentId = ref(null);
    const certificateStatusLabels = {
      draft: "Черновик",
      issued: "Выдан",
      revoked: "Отозван"
    };
    const isAllSelected = computed(() => {
      const available = journal.value.filter((r) => r.certificate?.status !== "issued");
      return available.length > 0 && available.every((r) => selectedStudentIds.value.includes(r.student.id));
    });
    const isPartialSelected = computed(() => {
      if (isAllSelected.value) return false;
      return selectedStudentIds.value.length > 0;
    });
    const eligibleWithoutCertificate = computed(() => {
      return journal.value.filter(
        (r) => r.eligibility.isEligible && r.certificate?.status !== "issued"
      ).length;
    });
    useHead(() => ({
      title: group.value ? `Выдача сертификатов — ${group.value.code}` : "Загрузка..."
    }));
    const loadData = async () => {
      loading.value = true;
      try {
        const journalRes = await authFetch(`/api/certificates/issue/${groupId.value}`);
        if (journalRes.success) {
          group.value = journalRes.group;
          journal.value = journalRes.journal;
          stats.value = journalRes.stats;
          template.value = journalRes.template;
        }
      } catch (e) {
        console.error("Error loading data:", e);
        showError(e.message || "Ошибка загрузки данных");
      } finally {
        loading.value = false;
      }
    };
    const getInitials = (name) => {
      if (!name) return "?";
      const parts = name.split(" ");
      return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("");
    };
    const handleIssueWithWarnings = () => {
      if (isIssuing.value || issuingStudentId.value) return;
      if (pendingIssueStudentId.value) {
        issuingStudentId.value = pendingIssueStudentId.value;
        issueToStudents([pendingIssueStudentId.value], true);
      }
      warningsModalOpen.value = false;
    };
    const openBulkIssueModal = (mode) => {
      if (isIssuing.value) {
        console.warn("[Certificates] Выдача уже выполняется");
        return;
      }
      if (!template.value) {
        showError("Шаблон сертификата не назначен для курса");
        return;
      }
      bulkIssueMode.value = mode;
      if (mode === "eligible") {
        bulkIssueStudentIds.value = journal.value.filter((r) => r.eligibility.isEligible && r.certificate?.status !== "issued").map((r) => r.student.id);
      } else {
        bulkIssueStudentIds.value = [...selectedStudentIds.value];
      }
      if (bulkIssueStudentIds.value.length === 0) {
        showError("Нет студентов для выдачи сертификатов");
        return;
      }
      bulkIssueModalOpen.value = true;
    };
    const executeBulkIssue = async () => {
      if (isIssuing.value) {
        console.warn("[Certificates] executeBulkIssue уже выполняется, пропускаем");
        return;
      }
      if (!template.value || !bulkIssueModalRef.value) return;
      isIssuing.value = true;
      bulkIssueModalRef.value.startProcessing();
      const results = [];
      const processedStudentIds = /* @__PURE__ */ new Set();
      const studentRows = journal.value.filter(
        (r) => bulkIssueStudentIds.value.includes(r.student.id)
      );
      console.log(`[Certificates] Начинаем массовую выдачу: ${studentRows.length} студентов`);
      for (let i = 0; i < studentRows.length; i++) {
        const row = studentRows[i];
        if (processedStudentIds.has(row.student.id)) {
          console.warn(`[Certificates] Студент ${row.student.fullName} уже обработан, пропускаем`);
          continue;
        }
        processedStudentIds.add(row.student.id);
        bulkIssueModalRef.value.updateProgress(row.student.fullName, i + 1);
        try {
          const response = await authFetch(
            `/api/certificates/issue/${groupId.value}`,
            {
              method: "POST",
              body: {
                templateId: template.value.id,
                studentIds: [row.student.id],
                issueDate: issueDate.value,
                expiryMode: group.value?.course?.certificateValidityMonths ? "auto" : "none",
                overrideWarnings: !row.eligibility.isEligible
              }
            }
          );
          if (response.success && response.results.length > 0) {
            const result = response.results[0];
            results.push(result);
            bulkIssueModalRef.value.addResult(result);
          }
        } catch (e) {
          console.error(`Error issuing certificate for ${row.student.fullName}:`, e);
          const errorResult = {
            studentId: row.student.id,
            studentName: row.student.fullName,
            success: false,
            error: e.data?.message || e.message || "Ошибка выдачи"
          };
          results.push(errorResult);
          bulkIssueModalRef.value.addResult(errorResult);
        }
        if (i < studentRows.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      bulkIssueModalRef.value.completeProcessing(results);
      isIssuing.value = false;
    };
    const handleBulkIssueComplete = async (results) => {
      const successCount = results.filter((r) => r.success).length;
      selectedStudentIds.value = [];
      await loadData();
      if (successCount > 0) {
        showSuccess(`Выдано ${successCount} сертификатов`);
      }
    };
    const issueToStudents = async (studentIds, overrideWarnings) => {
      isIssuing.value = true;
      try {
        const response = await authFetch(
          `/api/certificates/issue/${groupId.value}`,
          {
            method: "POST",
            body: {
              templateId: template.value.id,
              studentIds,
              issueDate: issueDate.value,
              expiryMode: group.value?.course?.certificateValidityMonths ? "auto" : "none",
              overrideWarnings
            }
          }
        );
        if (response.success) {
          issueResults.value = response.results;
          resultsModalOpen.value = true;
          await loadData();
          showSuccess(response.message);
        }
      } catch (e) {
        console.error("Issue error:", e);
        showError(e.data?.message || e.message || "Ошибка выдачи сертификатов");
      } finally {
        isIssuing.value = false;
        issuingStudentId.value = null;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_CertificatesWarningsModal = __nuxt_component_2;
      const _component_CertificatesResultsModal = __nuxt_component_3;
      const _component_CertificatesBulkIssueModal = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: `/groups/${unref(groupId)}`,
        class: "inline-flex items-center gap-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"${_scopeId}></path></svg> Назад к группе `);
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
              createTextVNode(" Назад к группе ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (unref(loading)) {
        _push(`<div class="flex justify-center items-center py-20"><div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (unref(group)) {
        _push(`<!--[--><div class="mb-6"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Выдача сертификатов </h2><p class="mt-1 text-gray-500 dark:text-gray-400"> Группа ${ssrInterpolate(unref(group).code)} • ${ssrInterpolate(unref(group).course?.name)}</p></div><div class="flex flex-wrap items-center gap-3">`);
        if (unref(template)) {
          _push(`<div class="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><span class="text-sm font-medium">${ssrInterpolate(unref(template).name)}</span></div>`);
        } else {
          _push(`<div class="flex items-center gap-2 px-3 py-2 bg-warning/10 text-warning rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><span class="text-sm font-medium">Шаблон не назначен для курса</span>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/programs/edit/${unref(group).course?.id}`,
            class: "text-xs underline hover:no-underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Настроить `);
              } else {
                return [
                  createTextVNode(" Настроить ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div>`);
        }
        _push(`<div class="flex items-center gap-2"><label class="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Дата выдачи:</label><input${ssrRenderAttr("value", unref(issueDate))} type="date" class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"></div>`);
        if (unref(group).course?.certificateValidityMonths) {
          _push(`<div class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-sm text-gray-600 dark:text-gray-400"> Срок: ${ssrInterpolate(unref(group).course.certificateValidityMonths)} мес. </span></div>`);
        } else {
          _push(`<div class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-sm text-gray-600 dark:text-gray-400">Бессрочный</span></div>`);
        }
        _push(`</div></div><div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6"><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm"><p class="text-sm text-gray-500 dark:text-gray-400">Всего слушателей</p><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(stats).totalStudents)}</p></div><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm"><p class="text-sm text-gray-500 dark:text-gray-400">Допущены</p><p class="text-2xl font-bold text-success">${ssrInterpolate(unref(stats).eligible)}</p></div><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm"><p class="text-sm text-gray-500 dark:text-gray-400">С предупреждениями</p><p class="text-2xl font-bold text-warning">${ssrInterpolate(unref(stats).withWarnings)}</p></div><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm"><p class="text-sm text-gray-500 dark:text-gray-400">Выдано</p><p class="text-2xl font-bold text-primary">${ssrInterpolate(unref(stats).issued)}</p></div><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm"><p class="text-sm text-gray-500 dark:text-gray-400">Отозвано</p><p class="text-2xl font-bold text-danger">${ssrInterpolate(unref(stats).revoked)}</p></div></div><div class="flex flex-wrap gap-3 mt-6">`);
        _push(ssrRenderComponent(_component_UiButton, {
          onClick: ($event) => openBulkIssueModal("eligible"),
          disabled: !unref(template) || unref(eligibleWithoutCertificate) === 0 || unref(isIssuing),
          variant: "primary"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"${_scopeId}></path></svg> Выдать всем допущенным (${ssrInterpolate(unref(eligibleWithoutCertificate))}) `);
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
                    d: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  })
                ])),
                createTextVNode(" Выдать всем допущенным (" + toDisplayString(unref(eligibleWithoutCertificate)) + ") ", 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UiButton, {
          onClick: ($event) => openBulkIssueModal("selected"),
          disabled: !unref(template) || unref(selectedStudentIds).length === 0 || unref(isIssuing),
          variant: "outline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg> Выдать выбранным (${ssrInterpolate(unref(selectedStudentIds).length)}) `);
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
                    d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  })
                ])),
                createTextVNode(" Выдать выбранным (" + toDisplayString(unref(selectedStudentIds).length) + ") ", 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div><div class="rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden"><div class="overflow-x-auto"><table class="w-full"><thead><tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"><th class="px-4 py-3 text-left"><input type="checkbox"${ssrIncludeBooleanAttr(unref(isAllSelected)) ? " checked" : ""}${ssrRenderAttr("indeterminate", unref(isPartialSelected))} class="rounded border-gray-300 text-primary focus:ring-primary"></th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Слушатель </th><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Посещаемость </th><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Дисциплин </th><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Ср. балл </th><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Допуск </th><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Сертификат </th><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Действия </th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
        ssrRenderList(unref(journal), (row) => {
          _push(`<tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><td class="px-4 py-4"><input type="checkbox"${ssrIncludeBooleanAttr(unref(selectedStudentIds).includes(row.student.id)) ? " checked" : ""}${ssrIncludeBooleanAttr(row.certificate?.status === "issued") ? " disabled" : ""} class="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"></td><td class="px-4 py-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">${ssrInterpolate(getInitials(row.student.fullName))}</div><div class="min-w-0"><p class="font-medium text-gray-900 dark:text-white truncate">${ssrInterpolate(row.student.fullName)}</p><p class="text-sm text-gray-500 dark:text-gray-400 truncate">${ssrInterpolate(row.student.organization)}</p></div></div></td><td class="px-4 py-4 text-center"><span class="${ssrRenderClass([
            "px-2 py-1 rounded-full text-sm font-medium",
            row.totalAttendancePercent >= 75 ? "bg-success/10 text-success" : row.totalAttendancePercent >= 50 ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger"
          ])}">${ssrInterpolate(row.totalAttendancePercent.toFixed(0))}% </span></td><td class="px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(row.eligibility.completedDisciplines)}/${ssrInterpolate(row.eligibility.totalDisciplines)}</td><td class="px-4 py-4 text-center">`);
          if (row.averageGrade !== null) {
            _push(`<span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(row.averageGrade.toFixed(1))}</span>`);
          } else {
            _push(`<span class="text-gray-400">—</span>`);
          }
          _push(`</td><td class="px-4 py-4 text-center">`);
          if (row.eligibility.isEligible) {
            _push(`<div class="flex items-center justify-center gap-1 text-success"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="text-sm">Допущен</span></div>`);
          } else {
            _push(`<button class="flex items-center justify-center gap-1 text-warning hover:text-warning/80"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><span class="text-sm">${ssrInterpolate(row.eligibility.warnings.length)} замеч.</span></button>`);
          }
          _push(`</td><td class="px-4 py-4 text-center">`);
          if (row.certificate) {
            _push(`<span class="${ssrRenderClass([
              "px-2 py-1 rounded-full text-xs font-medium",
              row.certificate.status === "issued" ? "bg-success/10 text-success" : row.certificate.status === "revoked" ? "bg-danger/10 text-danger" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            ])}">${ssrInterpolate(certificateStatusLabels[row.certificate.status])}</span>`);
          } else {
            _push(`<span class="text-gray-400 text-sm">Не выдан</span>`);
          }
          _push(`</td><td class="px-4 py-4"><div class="flex items-center justify-center gap-2">`);
          if (row.certificate?.status === "issued") {
            _push(`<a${ssrRenderAttr("href", `/api/certificates/download/${row.certificate.id}`)} target="_blank" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary transition-colors" title="Скачать сертификат"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></a>`);
          } else {
            _push(`<!---->`);
          }
          if (!row.certificate || row.certificate.status !== "issued") {
            _push(`<button${ssrIncludeBooleanAttr(!unref(template) || unref(isIssuing) || unref(issuingStudentId) === row.student.id) ? " disabled" : ""} class="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Выдать сертификат">`);
            if (unref(issuingStudentId) === row.student.id) {
              _push(`<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
            } else {
              _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
            }
            _push(`</button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div></div><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_CertificatesWarningsModal, {
        "is-open": unref(warningsModalOpen),
        student: unref(selectedStudent),
        warnings: unref(selectedWarnings),
        onClose: ($event) => warningsModalOpen.value = false,
        onConfirm: handleIssueWithWarnings
      }, null, _parent));
      _push(ssrRenderComponent(_component_CertificatesResultsModal, {
        "is-open": unref(resultsModalOpen),
        results: unref(issueResults),
        onClose: ($event) => resultsModalOpen.value = false
      }, null, _parent));
      _push(ssrRenderComponent(_component_CertificatesBulkIssueModal, {
        ref_key: "bulkIssueModalRef",
        ref: bulkIssueModalRef,
        "is-open": unref(bulkIssueModalOpen),
        "students-count": unref(bulkIssueStudentIds).length,
        "template-name": unref(template)?.name || "",
        onClose: ($event) => bulkIssueModalOpen.value = false,
        onConfirm: executeBulkIssue,
        onComplete: handleBulkIssueComplete
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/groups/[id]/certificates.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=certificates-Beh8Cwqe.mjs.map
