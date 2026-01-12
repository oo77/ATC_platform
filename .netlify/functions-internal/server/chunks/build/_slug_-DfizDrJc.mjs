import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_0$1 } from './Modal-DQYphXo7.mjs';
import { defineComponent, computed, ref, watch, mergeProps, unref, withCtx, createTextVNode, toDisplayString, createBlock, openBlock, createVNode, createCommentVNode, withDirectives, isRef, vModelText, Fragment, renderList, vModelSelect, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { u as useNotification } from './useNotification-C2RwAN1X.mjs';
import { c as useRoute } from './server.mjs';
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
import './Notification-Bd1V2gNg.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "AttendanceCell",
  __ssrInlineRender: true,
  props: {
    cell: {},
    column: {},
    studentId: {}
  },
  emits: ["update"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const toast = useNotification();
    const showAttendanceModal = ref(false);
    const showGradeModal = ref(false);
    const showConfirmModal = ref(false);
    const saving = ref(false);
    const attendanceInput = ref(0);
    const attendanceNotes = ref("");
    const gradeInput = ref(0);
    const gradeNotes = ref("");
    const pendingConfirmGrade = ref(null);
    const maxHours = computed(() => props.column.scheduleEvent.academicHours);
    const quickOptions = computed(() => {
      const max = maxHours.value;
      const options = [0, max];
      if (max >= 2) {
        options.push(max / 2);
        options.push(max - 0.5);
      }
      return [...new Set(options)].sort((a, b) => a - b);
    });
    const attendanceDisplay = computed(() => {
      if (!props.cell.attendance) return "—";
      const hours = props.cell.attendance.hoursAttended;
      if (hours === 0) return "0";
      if (hours === maxHours.value) return "✓";
      return hours.toString();
    });
    const attendanceButtonClass = computed(() => {
      if (!props.cell.attendance) {
        return "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600";
      }
      const hours = props.cell.attendance.hoursAttended;
      const max = props.cell.attendance.maxHours;
      const percent = hours / max * 100;
      if (percent >= 100) return "bg-success/20 text-success hover:bg-success/30";
      if (percent > 0) return "bg-warning/20 text-warning hover:bg-warning/30";
      return "bg-danger/20 text-danger hover:bg-danger/30";
    });
    const attendanceTooltip = computed(() => {
      if (!props.cell.attendance) return "Отметить посещаемость";
      const a = props.cell.attendance;
      let text = `${a.hoursAttended} из ${a.maxHours} а-ч`;
      if (a.notes) text += `
${a.notes}`;
      return text;
    });
    const gradeDisplay = computed(() => {
      if (!props.cell.grade) return "—";
      return props.cell.grade.grade.toString();
    });
    const gradeButtonClass = computed(() => {
      if (!props.cell.grade) {
        return "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600";
      }
      const grade = props.cell.grade.grade;
      const isModified = props.cell.grade.isModified;
      if (isModified) {
        return "bg-purple-200 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-300 dark:hover:bg-purple-800/50 ring-1 ring-purple-400";
      }
      if (grade >= 60) return "bg-success/20 text-success hover:bg-success/30";
      if (grade >= 40) return "bg-warning/20 text-warning hover:bg-warning/30";
      return "bg-danger/20 text-danger hover:bg-danger/30";
    });
    const gradeTooltip = computed(() => {
      if (!props.cell.grade) return "Выставить оценку";
      const g = props.cell.grade;
      let text = `Оценка: ${g.grade}`;
      if (g.isFromTest && !g.isModified) {
        text += "\n🤖 Автоматическая оценка из теста";
      }
      if (g.isModified && g.originalGrade !== null && g.originalGrade !== void 0) {
        text += `
✏️ Изменена (из теста: ${g.originalGrade})`;
      }
      if (g.notes) text += `
${g.notes}`;
      return text;
    });
    const saveAttendance = async () => {
      if (attendanceInput.value < 0 || attendanceInput.value > maxHours.value) {
        toast.error(`Часы должны быть от 0 до ${maxHours.value}`);
        return;
      }
      saving.value = true;
      try {
        const response = await authFetch("/api/attendance", {
          method: "POST",
          body: {
            studentId: props.studentId,
            scheduleEventId: props.column.scheduleEvent.id,
            hoursAttended: attendanceInput.value,
            maxHours: maxHours.value,
            notes: attendanceNotes.value || void 0
          }
        });
        if (response.success) {
          toast.success("Посещаемость сохранена");
          showAttendanceModal.value = false;
          emit("update", {
            studentId: props.studentId,
            scheduleEventId: props.column.scheduleEvent.id,
            type: "attendance"
          });
        } else {
          toast.error(response.message || "Ошибка сохранения");
        }
      } catch (error) {
        toast.error(error.message || "Ошибка сохранения");
      } finally {
        saving.value = false;
      }
    };
    const saveGrade = async (confirmModify = false) => {
      if (gradeInput.value < 0 || gradeInput.value > 100) {
        toast.error("Оценка должна быть от 0 до 100");
        return;
      }
      saving.value = true;
      try {
        const response = await authFetch("/api/grades", {
          method: "POST",
          body: {
            studentId: props.studentId,
            scheduleEventId: props.column.scheduleEvent.id,
            grade: gradeInput.value,
            notes: gradeNotes.value || void 0,
            confirmModify
          }
        });
        if (response.requireConfirmation) {
          pendingConfirmGrade.value = gradeInput.value;
          showGradeModal.value = false;
          showConfirmModal.value = true;
          saving.value = false;
          return;
        }
        if (response.success) {
          toast.success("Оценка сохранена");
          showGradeModal.value = false;
          showConfirmModal.value = false;
          emit("update", {
            studentId: props.studentId,
            scheduleEventId: props.column.scheduleEvent.id,
            type: "grade"
          });
        } else {
          toast.error(response.message || "Ошибка сохранения");
        }
      } catch (error) {
        toast.error(error.message || "Ошибка сохранения");
      } finally {
        saving.value = false;
      }
    };
    const confirmModifyGrade = async () => {
      if (pendingConfirmGrade.value !== null) {
        gradeInput.value = pendingConfirmGrade.value;
        await saveGrade(true);
        pendingConfirmGrade.value = null;
      }
    };
    const cancelModifyGrade = () => {
      showConfirmModal.value = false;
      pendingConfirmGrade.value = null;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "inline-block" }, _attrs))}>`);
      if (__props.column.hasGrade) {
        _push(`<div class="flex flex-col items-center gap-1"><button class="${ssrRenderClass([unref(attendanceButtonClass), "w-10 h-6 rounded text-xs font-medium transition-all"])}"${ssrRenderAttr("title", unref(attendanceTooltip))}>${ssrInterpolate(unref(attendanceDisplay))}</button><button class="${ssrRenderClass([unref(gradeButtonClass), "w-10 h-6 rounded text-xs font-medium transition-all relative"])}"${ssrRenderAttr("title", unref(gradeTooltip))}>${ssrInterpolate(unref(gradeDisplay))} `);
        if (props.cell.grade?.isFromTest && !props.cell.grade?.isModified) {
          _push(`<span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" title="Автоматическая оценка из теста"></span>`);
        } else {
          _push(`<!---->`);
        }
        if (props.cell.grade?.isModified) {
          _push(`<span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500" title="Оценка была изменена"></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button></div>`);
      } else {
        _push(`<button class="${ssrRenderClass([unref(attendanceButtonClass), "w-10 h-8 rounded text-xs font-medium transition-all"])}"${ssrRenderAttr("title", unref(attendanceTooltip))}>${ssrInterpolate(unref(attendanceDisplay))}</button>`);
      }
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": unref(showAttendanceModal),
        title: "Отметка посещаемости",
        onClose: ($event) => showAttendanceModal.value = false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Посещённые академические часы (из ${ssrInterpolate(unref(maxHours))}) </label><div class="flex items-center gap-2"${_scopeId}><input${ssrRenderAttr("value", unref(attendanceInput))} type="number" step="0.5" min="0"${ssrRenderAttr("max", unref(maxHours))} class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"${_scopeId}><span class="text-gray-500"${_scopeId}>а-ч</span></div><div class="flex gap-2 mt-3"${_scopeId}><!--[-->`);
            ssrRenderList(unref(quickOptions), (option) => {
              _push2(`<button class="${ssrRenderClass([unref(attendanceInput) === option ? "bg-primary text-white border-primary" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700", "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"])}"${_scopeId}>${ssrInterpolate(option)}</button>`);
            });
            _push2(`<!--]--></div></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Примечание (необязательно) </label><input${ssrRenderAttr("value", unref(attendanceNotes))} type="text" placeholder="Причина отсутствия и т.д." class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"${_scopeId}></div><div class="flex justify-end gap-3 pt-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: ($event) => showAttendanceModal.value = false
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
              loading: unref(saving),
              onClick: saveAttendance
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Сохранить `);
                } else {
                  return [
                    createTextVNode(" Сохранить ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-4" }, [
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Посещённые академические часы (из " + toDisplayString(unref(maxHours)) + ") ", 1),
                  createVNode("div", { class: "flex items-center gap-2" }, [
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => isRef(attendanceInput) ? attendanceInput.value = $event : null,
                      type: "number",
                      step: "0.5",
                      min: "0",
                      max: unref(maxHours),
                      class: "flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    }, null, 8, ["onUpdate:modelValue", "max"]), [
                      [
                        vModelText,
                        unref(attendanceInput),
                        void 0,
                        { number: true }
                      ]
                    ]),
                    createVNode("span", { class: "text-gray-500" }, "а-ч")
                  ]),
                  createVNode("div", { class: "flex gap-2 mt-3" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(unref(quickOptions), (option) => {
                      return openBlock(), createBlock("button", {
                        key: option,
                        class: ["px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors", unref(attendanceInput) === option ? "bg-primary text-white border-primary" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"],
                        onClick: ($event) => attendanceInput.value = option
                      }, toDisplayString(option), 11, ["onClick"]);
                    }), 128))
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Примечание (необязательно) "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => isRef(attendanceNotes) ? attendanceNotes.value = $event : null,
                    type: "text",
                    placeholder: "Причина отсутствия и т.д.",
                    class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(attendanceNotes)]
                  ])
                ]),
                createVNode("div", { class: "flex justify-end gap-3 pt-4" }, [
                  createVNode(_component_UiButton, {
                    variant: "outline",
                    onClick: ($event) => showAttendanceModal.value = false
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["onClick"]),
                  createVNode(_component_UiButton, {
                    loading: unref(saving),
                    onClick: saveAttendance
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Сохранить ")
                    ]),
                    _: 1
                  }, 8, ["loading"])
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": unref(showGradeModal),
        title: "Выставление оценки",
        onClose: ($event) => showGradeModal.value = false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Оценка (0-100) </label><input${ssrRenderAttr("value", unref(gradeInput))} type="number" min="0" max="100" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"${_scopeId}><div class="flex flex-wrap gap-2 mt-3"${_scopeId}><!--[-->`);
            ssrRenderList([100, 90, 80, 70, 60, 50, 40], (grade) => {
              _push2(`<button class="${ssrRenderClass([unref(gradeInput) === grade ? "bg-primary text-white border-primary" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700", "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"])}"${_scopeId}>${ssrInterpolate(grade)}</button>`);
            });
            _push2(`<!--]--></div></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Комментарий (необязательно) </label><input${ssrRenderAttr("value", unref(gradeNotes))} type="text" placeholder="Комментарий к оценке" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"${_scopeId}></div>`);
            if (props.cell.grade?.isFromTest && !props.cell.grade?.isModified) {
              _push2(`<div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"${_scopeId}><div class="flex items-start gap-2"${_scopeId}><svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg><p class="text-sm text-blue-700 dark:text-blue-300"${_scopeId}> Эта оценка была автоматически выставлена на основе результатов теста. При изменении будет сохранена исходная оценка. </p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="flex justify-end gap-3 pt-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: ($event) => showGradeModal.value = false
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
              loading: unref(saving),
              onClick: () => saveGrade()
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Сохранить `);
                } else {
                  return [
                    createTextVNode(" Сохранить ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-4" }, [
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Оценка (0-100) "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => isRef(gradeInput) ? gradeInput.value = $event : null,
                    type: "number",
                    min: "0",
                    max: "100",
                    class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [
                      vModelText,
                      unref(gradeInput),
                      void 0,
                      { number: true }
                    ]
                  ]),
                  createVNode("div", { class: "flex flex-wrap gap-2 mt-3" }, [
                    (openBlock(), createBlock(Fragment, null, renderList([100, 90, 80, 70, 60, 50, 40], (grade) => {
                      return createVNode("button", {
                        key: grade,
                        class: ["px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors", unref(gradeInput) === grade ? "bg-primary text-white border-primary" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"],
                        onClick: ($event) => gradeInput.value = grade
                      }, toDisplayString(grade), 11, ["onClick"]);
                    }), 64))
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Комментарий (необязательно) "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => isRef(gradeNotes) ? gradeNotes.value = $event : null,
                    type: "text",
                    placeholder: "Комментарий к оценке",
                    class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(gradeNotes)]
                  ])
                ]),
                props.cell.grade?.isFromTest && !props.cell.grade?.isModified ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                }, [
                  createVNode("div", { class: "flex items-start gap-2" }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      })
                    ])),
                    createVNode("p", { class: "text-sm text-blue-700 dark:text-blue-300" }, " Эта оценка была автоматически выставлена на основе результатов теста. При изменении будет сохранена исходная оценка. ")
                  ])
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "flex justify-end gap-3 pt-4" }, [
                  createVNode(_component_UiButton, {
                    variant: "outline",
                    onClick: ($event) => showGradeModal.value = false
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["onClick"]),
                  createVNode(_component_UiButton, {
                    loading: unref(saving),
                    onClick: () => saveGrade()
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Сохранить ")
                    ]),
                    _: 1
                  }, 8, ["loading", "onClick"])
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": unref(showConfirmModal),
        title: "Изменение автоматической оценки",
        onClose: cancelModifyGrade
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}><div class="p-4 bg-warning/10 rounded-lg border border-warning/30"${_scopeId}><div class="flex items-start gap-3"${_scopeId}><svg class="w-6 h-6 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><div${_scopeId}><h4 class="font-medium text-warning mb-1"${_scopeId}>Внимание!</h4><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}> Вы собираетесь изменить автоматически выставленную оценку из теста. </p></div></div></div><div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"${_scopeId}><div class="flex items-center justify-between"${_scopeId}><div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Текущая оценка (из теста)</p><p class="text-2xl font-bold text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(props.cell.grade?.grade)}</p></div><svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"${_scopeId}></path></svg><div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Новая оценка</p><p class="text-2xl font-bold text-purple-600 dark:text-purple-400"${_scopeId}>${ssrInterpolate(unref(pendingConfirmGrade))}</p></div></div></div><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}> Исходная оценка будет сохранена в истории. Изменённая оценка будет отмечена специальным цветом. </p><div class="flex justify-end gap-3 pt-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: cancelModifyGrade
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
              loading: unref(saving),
              onClick: confirmModifyGrade
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Подтвердить изменение `);
                } else {
                  return [
                    createTextVNode(" Подтвердить изменение ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-4" }, [
                createVNode("div", { class: "p-4 bg-warning/10 rounded-lg border border-warning/30" }, [
                  createVNode("div", { class: "flex items-start gap-3" }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-6 h-6 text-warning flex-shrink-0",
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
                      createVNode("h4", { class: "font-medium text-warning mb-1" }, "Внимание!"),
                      createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, " Вы собираетесь изменить автоматически выставленную оценку из теста. ")
                    ])
                  ])
                ]),
                createVNode("div", { class: "bg-gray-50 dark:bg-gray-800 rounded-lg p-4" }, [
                  createVNode("div", { class: "flex items-center justify-between" }, [
                    createVNode("div", null, [
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Текущая оценка (из теста)"),
                      createVNode("p", { class: "text-2xl font-bold text-gray-900 dark:text-white" }, toDisplayString(props.cell.grade?.grade), 1)
                    ]),
                    (openBlock(), createBlock("svg", {
                      class: "w-6 h-6 text-gray-400",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M14 5l7 7m0 0l-7 7m7-7H3"
                      })
                    ])),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Новая оценка"),
                      createVNode("p", { class: "text-2xl font-bold text-purple-600 dark:text-purple-400" }, toDisplayString(unref(pendingConfirmGrade)), 1)
                    ])
                  ])
                ]),
                createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, " Исходная оценка будет сохранена в истории. Изменённая оценка будет отмечена специальным цветом. "),
                createVNode("div", { class: "flex justify-end gap-3 pt-4" }, [
                  createVNode(_component_UiButton, {
                    variant: "outline",
                    onClick: cancelModifyGrade
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }),
                  createVNode(_component_UiButton, {
                    variant: "warning",
                    loading: unref(saving),
                    onClick: confirmModifyGrade
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Подтвердить изменение ")
                    ]),
                    _: 1
                  }, 8, ["loading"])
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/attendance/AttendanceCell.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const AttendanceCell = Object.assign(_sfc_main$2, { __name: "AttendanceCell" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "FinalGradeCell",
  __ssrInlineRender: true,
  props: {
    finalGrade: {},
    studentId: {},
    groupId: {},
    disciplineId: {},
    attendancePercent: {}
  },
  emits: ["update"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const toast = useNotification();
    const showModal = ref(false);
    const saving = ref(false);
    const gradeInput = ref(void 0);
    const statusInput = ref("in_progress");
    const notesInput = ref("");
    const displayText = computed(() => {
      if (!props.finalGrade) return "—";
      const fg = props.finalGrade;
      if (fg.finalGrade !== void 0) {
        return fg.finalGrade.toString();
      }
      const statusLabels = {
        in_progress: "...",
        passed: "✓",
        failed: "✗",
        not_allowed: "Н/Д"
      };
      return statusLabels[fg.status];
    });
    const buttonClass = computed(() => {
      if (!props.finalGrade) {
        return "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600";
      }
      const fg = props.finalGrade;
      switch (fg.status) {
        case "passed":
          return "bg-success/20 text-success hover:bg-success/30";
        case "failed":
          return "bg-danger/20 text-danger hover:bg-danger/30";
        case "not_allowed":
          return "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500";
        default:
          if (fg.finalGrade !== void 0) {
            if (fg.finalGrade >= 60) return "bg-success/20 text-success hover:bg-success/30";
            return "bg-warning/20 text-warning hover:bg-warning/30";
          }
          return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50";
      }
    });
    const tooltip = computed(() => {
      if (!props.finalGrade) return "Выставить итоговую оценку";
      const fg = props.finalGrade;
      const statusLabels = {
        in_progress: "В процессе",
        passed: "Сдано",
        failed: "Не сдано",
        not_allowed: "Не допущен"
      };
      let text = `Статус: ${statusLabels[fg.status]}`;
      if (fg.finalGrade !== void 0) {
        text = `Оценка: ${fg.finalGrade}
${text}`;
      }
      if (fg.notes) {
        text += `
${fg.notes}`;
      }
      return text;
    });
    watch(showModal, (isOpen) => {
      if (isOpen) {
        gradeInput.value = props.finalGrade?.finalGrade;
        statusInput.value = props.finalGrade?.status || "in_progress";
        notesInput.value = props.finalGrade?.notes || "";
        if (props.attendancePercent < 75 && !props.finalGrade) {
          statusInput.value = "not_allowed";
        }
      }
    });
    const save = async () => {
      if (gradeInput.value !== void 0 && (gradeInput.value < 0 || gradeInput.value > 100)) {
        toast.error("Оценка должна быть от 0 до 100");
        return;
      }
      saving.value = true;
      try {
        const response = await authFetch("/api/final-grades", {
          method: "POST",
          body: {
            studentId: props.studentId,
            groupId: props.groupId,
            disciplineId: props.disciplineId,
            finalGrade: gradeInput.value,
            status: statusInput.value,
            notes: notesInput.value || void 0
          }
        });
        if (response.success) {
          toast.success("Итоговая оценка сохранена");
          showModal.value = false;
          emit("update");
        } else {
          toast.error(response.message || "Ошибка сохранения");
        }
      } catch (error) {
        toast.error(error.message || "Ошибка сохранения");
      } finally {
        saving.value = false;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "inline-block" }, _attrs))}><button class="${ssrRenderClass([unref(buttonClass), "px-3 py-1 rounded text-sm font-medium transition-all"])}"${ssrRenderAttr("title", unref(tooltip))}>${ssrInterpolate(unref(displayText))}</button>`);
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": unref(showModal),
        title: "Итоговая оценка",
        onClose: ($event) => showModal.value = false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}>`);
            if (__props.attendancePercent < 75) {
              _push2(`<div class="p-3 rounded-lg bg-warning/10 border border-warning/30"${_scopeId}><div class="flex items-start gap-2"${_scopeId}><svg class="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><div${_scopeId}><p class="text-sm font-medium text-warning"${_scopeId}>Низкая посещаемость</p><p class="text-xs text-warning/80 mt-1"${_scopeId}> Посещаемость ${ssrInterpolate(__props.attendancePercent.toFixed(1))}% (минимум 75%) </p></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Итоговая оценка (0-100) </label><input${ssrRenderAttr("value", unref(gradeInput))} type="number" min="0" max="100" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"${_scopeId}></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Статус </label><select class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"${_scopeId}><option value="in_progress"${ssrIncludeBooleanAttr(Array.isArray(unref(statusInput)) ? ssrLooseContain(unref(statusInput), "in_progress") : ssrLooseEqual(unref(statusInput), "in_progress")) ? " selected" : ""}${_scopeId}>В процессе</option><option value="passed"${ssrIncludeBooleanAttr(Array.isArray(unref(statusInput)) ? ssrLooseContain(unref(statusInput), "passed") : ssrLooseEqual(unref(statusInput), "passed")) ? " selected" : ""}${_scopeId}>Сдано</option><option value="failed"${ssrIncludeBooleanAttr(Array.isArray(unref(statusInput)) ? ssrLooseContain(unref(statusInput), "failed") : ssrLooseEqual(unref(statusInput), "failed")) ? " selected" : ""}${_scopeId}>Не сдано</option><option value="not_allowed"${ssrIncludeBooleanAttr(Array.isArray(unref(statusInput)) ? ssrLooseContain(unref(statusInput), "not_allowed") : ssrLooseEqual(unref(statusInput), "not_allowed")) ? " selected" : ""}${_scopeId}>Не допущен</option></select></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Примечание (необязательно) </label><textarea rows="2" placeholder="Дополнительные комментарии" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"${_scopeId}>${ssrInterpolate(unref(notesInput))}</textarea></div><div class="flex justify-end gap-3 pt-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: ($event) => showModal.value = false
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
              loading: unref(saving),
              onClick: save
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Сохранить `);
                } else {
                  return [
                    createTextVNode(" Сохранить ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-4" }, [
                __props.attendancePercent < 75 ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "p-3 rounded-lg bg-warning/10 border border-warning/30"
                }, [
                  createVNode("div", { class: "flex items-start gap-2" }, [
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
                      createVNode("p", { class: "text-sm font-medium text-warning" }, "Низкая посещаемость"),
                      createVNode("p", { class: "text-xs text-warning/80 mt-1" }, " Посещаемость " + toDisplayString(__props.attendancePercent.toFixed(1)) + "% (минимум 75%) ", 1)
                    ])
                  ])
                ])) : createCommentVNode("", true),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Итоговая оценка (0-100) "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => isRef(gradeInput) ? gradeInput.value = $event : null,
                    type: "number",
                    min: "0",
                    max: "100",
                    class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [
                      vModelText,
                      unref(gradeInput),
                      void 0,
                      { number: true }
                    ]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Статус "),
                  withDirectives(createVNode("select", {
                    "onUpdate:modelValue": ($event) => isRef(statusInput) ? statusInput.value = $event : null,
                    class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  }, [
                    createVNode("option", { value: "in_progress" }, "В процессе"),
                    createVNode("option", { value: "passed" }, "Сдано"),
                    createVNode("option", { value: "failed" }, "Не сдано"),
                    createVNode("option", { value: "not_allowed" }, "Не допущен")
                  ], 8, ["onUpdate:modelValue"]), [
                    [vModelSelect, unref(statusInput)]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Примечание (необязательно) "),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => isRef(notesInput) ? notesInput.value = $event : null,
                    rows: "2",
                    placeholder: "Дополнительные комментарии",
                    class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(notesInput)]
                  ])
                ]),
                createVNode("div", { class: "flex justify-end gap-3 pt-4" }, [
                  createVNode(_component_UiButton, {
                    variant: "outline",
                    onClick: ($event) => showModal.value = false
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["onClick"]),
                  createVNode(_component_UiButton, {
                    loading: unref(saving),
                    onClick: save
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Сохранить ")
                    ]),
                    _: 1
                  }, 8, ["loading"])
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/attendance/FinalGradeCell.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const FinalGradeCell = Object.assign(_sfc_main$1, { __name: "AttendanceFinalGradeCell" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const { authFetch } = useAuthFetch();
    const toast = useNotification();
    const slug = computed(() => route.params.slug);
    const groupId = computed(() => slug.value?.split("_")[0] || "");
    const disciplineId = computed(() => slug.value?.split("_")[1] || "");
    const loading = ref(true);
    const error = ref(null);
    const columns = ref([]);
    const rows = ref([]);
    const summary = ref(null);
    const groupCode = ref("");
    const disciplineName = ref("");
    const instructorName = ref("");
    const selectedEventId = ref("");
    const showBulkAttendanceModal = ref(false);
    const showBulkGradeModal = ref(false);
    const bulkSaving = ref(false);
    const bulkAttendanceHours = ref(0);
    const bulkGradeValue = ref(0);
    const selectedEvent = computed(() => {
      return columns.value.find((col) => col.scheduleEvent.id === selectedEventId.value);
    });
    const loadJournal = async () => {
      loading.value = true;
      error.value = null;
      if (!groupId.value || !disciplineId.value) {
        error.value = "Неверный URL журнала";
        loading.value = false;
        return;
      }
      try {
        const response = await authFetch(`/api/attendance/journal?groupId=${groupId.value}&disciplineId=${disciplineId.value}`);
        if (response.success) {
          columns.value = response.columns;
          rows.value = response.rows;
          summary.value = response.summary;
        } else {
          error.value = response.message || "Ошибка загрузки журнала";
        }
      } catch (err) {
        console.error("Error loading journal:", err);
        error.value = err.message || "Ошибка загрузки журнала";
      } finally {
        loading.value = false;
      }
    };
    const loadMeta = async () => {
      if (!groupId.value || !disciplineId.value) return;
      try {
        const groupResponse = await authFetch(`/api/groups/${groupId.value}`);
        if (groupResponse.success && groupResponse.group) {
          groupCode.value = groupResponse.group.code;
        }
        const disciplinesResponse = await authFetch(`/api/groups/${groupId.value}/disciplines`);
        if (disciplinesResponse.success && disciplinesResponse.disciplines) {
          const discipline = disciplinesResponse.disciplines.find(
            (d) => d.id === disciplineId.value
          );
          if (discipline) {
            disciplineName.value = discipline.name;
            if (discipline.instructors && discipline.instructors.length > 0) {
              const sorted = [...discipline.instructors].sort(
                (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
              );
              const names = sorted.slice(0, 2).map((i) => i.fullName);
              if (sorted.length > 2) {
                instructorName.value = `${names.join(", ")} и ещё ${sorted.length - 2}`;
              } else {
                instructorName.value = names.join(", ");
              }
            }
          } else {
            disciplineName.value = "Дисциплина";
          }
        }
      } catch (err) {
        console.error("Error loading meta:", err);
        disciplineName.value = "Дисциплина";
      }
    };
    const formatColumnDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    };
    const formatTimeRange = (startTime, endTime) => {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const startStr = start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      const endStr = end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      return `${startStr}-${endStr}`;
    };
    const getInitials = (name) => {
      const parts = name.split(" ");
      const first = parts[0] ?? "";
      const second = parts[1] ?? "";
      if (first.length > 0 && second.length > 0) {
        return (first.charAt(0) + second.charAt(0)).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };
    const getAttendanceColor = (percent) => {
      if (percent >= 75) return "text-success bg-success/10";
      if (percent >= 50) return "text-warning bg-warning/10";
      return "text-danger bg-danger/10";
    };
    const handleCellUpdate = async (_data) => {
      await loadJournal();
    };
    const handleFinalGradeUpdate = async () => {
      await loadJournal();
    };
    const openBulkAttendanceModal = () => {
      if (!selectedEvent.value) return;
      bulkAttendanceHours.value = selectedEvent.value.scheduleEvent.academicHours;
      showBulkAttendanceModal.value = true;
    };
    const openBulkGradeModal = () => {
      if (!selectedEvent.value) return;
      bulkGradeValue.value = 100;
      showBulkGradeModal.value = true;
    };
    const saveBulkAttendance = async () => {
      if (!selectedEvent.value || bulkSaving.value) return;
      const maxHours = selectedEvent.value.scheduleEvent.academicHours;
      if (bulkAttendanceHours.value < 0 || bulkAttendanceHours.value > maxHours) {
        toast.error(`Часы должны быть от 0 до ${maxHours}`);
        return;
      }
      bulkSaving.value = true;
      try {
        const attendances = rows.value.map((row) => ({
          studentId: row.student.id,
          hoursAttended: bulkAttendanceHours.value
        }));
        const response = await authFetch("/api/attendance", {
          method: "POST",
          body: {
            bulk: true,
            scheduleEventId: selectedEventId.value,
            maxHours,
            attendances
          }
        });
        if (response.success) {
          toast.success(`Отмечено ${response.count || attendances.length} записей`);
          showBulkAttendanceModal.value = false;
          await loadJournal();
        } else {
          toast.error(response.message || "Ошибка сохранения");
        }
      } catch (error2) {
        toast.error(error2.message || "Ошибка сохранения");
      } finally {
        bulkSaving.value = false;
      }
    };
    const saveBulkGrade = async () => {
      if (!selectedEvent.value || bulkSaving.value) return;
      if (bulkGradeValue.value < 0 || bulkGradeValue.value > 100) {
        toast.error("Оценка должна быть от 0 до 100");
        return;
      }
      bulkSaving.value = true;
      try {
        const grades = rows.value.map((row) => ({
          studentId: row.student.id,
          grade: bulkGradeValue.value
        }));
        const response = await authFetch("/api/grades", {
          method: "POST",
          body: {
            bulk: true,
            scheduleEventId: selectedEventId.value,
            grades
          }
        });
        if (response.success) {
          toast.success(`Выставлено ${response.count || grades.length} оценок`);
          showBulkGradeModal.value = false;
          await loadJournal();
        } else {
          toast.error(response.message || "Ошибка сохранения");
        }
      } catch (error2) {
        toast.error(error2.message || "Ошибка сохранения");
      } finally {
        bulkSaving.value = false;
      }
    };
    watch(slug, async () => {
      await Promise.all([loadJournal(), loadMeta()]);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiModal = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}>`);
      if (unref(loading)) {
        _push(`<div class="flex items-center justify-center min-h-[400px]"><div class="text-center"><div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div><p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка журнала...</p></div></div>`);
      } else if (unref(error)) {
        _push(`<div class="flex items-center justify-center min-h-[400px]"><div class="text-center"><svg class="mx-auto h-16 w-16 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Ошибка загрузки</h3><p class="mt-2 text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(error))}</p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          class: "mt-6",
          onClick: loadJournal
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
      } else {
        _push(`<!--[--><div class="mb-6"><div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/groups",
          class: "hover:text-primary transition-colors"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Учебные группы`);
            } else {
              return [
                createTextVNode("Учебные группы")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/groups/${unref(groupId)}`,
          class: "hover:text-primary transition-colors"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(groupCode))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(groupCode)), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg><span class="text-gray-900 dark:text-white">Журнал</span></div><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div class="flex items-center gap-4"><div class="flex h-14 w-14 items-center justify-center rounded-full bg-info/10 text-info"><svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg></div><div><h1 class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(unref(disciplineName) || "Журнал")}</h1><p class="text-gray-500 dark:text-gray-400">`);
        if (unref(instructorName)) {
          _push(`<span>${ssrInterpolate(unref(instructorName))} • </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(` Журнал посещаемости и оценок </p></div></div><div class="flex items-center gap-3"><div class="hidden lg:flex items-center gap-4 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2"><div class="text-center"><p class="text-xs text-gray-500 dark:text-gray-400">Студентов</p><p class="text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(summary)?.totalStudents || 0)}</p></div><div class="w-px h-8 bg-gray-300 dark:bg-gray-600"></div><div class="text-center"><p class="text-xs text-gray-500 dark:text-gray-400">Занятий</p><p class="text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(summary)?.totalEvents || 0)}</p></div><div class="w-px h-8 bg-gray-300 dark:bg-gray-600"></div><div class="text-center"><p class="text-xs text-gray-500 dark:text-gray-400">Ср. посещ.</p><p class="${ssrRenderClass([getAttendanceColor(unref(summary)?.averageAttendance || 0), "text-lg font-bold"])}">${ssrInterpolate((unref(summary)?.averageAttendance || 0).toFixed(1))}% </p></div></div></div></div></div>`);
        if (unref(columns).length === 0) {
          _push(`<div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-12 text-center"><svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Занятия не найдены</h3><p class="mt-2 text-gray-500 dark:text-gray-400"> Для этой дисциплины ещё нет запланированных занятий.<br> Добавьте занятия в расписание, чтобы вести журнал. </p>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/schedule?groupId=${unref(groupId)}`,
            class: "inline-block mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Перейти к расписанию `);
              } else {
                return [
                  createTextVNode(" Перейти к расписанию ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(columns).length > 0) {
          _push(`<div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-4 mb-4"><div class="flex flex-wrap items-center gap-4"><div class="flex-1"><h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Массовые операции</h3><p class="text-xs text-gray-500 dark:text-gray-400 mt-1"> Выберите занятие для массовой отметки посещаемости или оценки </p></div><select class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(selectedEventId)) ? ssrLooseContain(unref(selectedEventId), "") : ssrLooseEqual(unref(selectedEventId), "")) ? " selected" : ""}>— Выберите занятие —</option><!--[-->`);
          ssrRenderList(unref(columns), (col) => {
            _push(`<option${ssrRenderAttr("value", col.scheduleEvent.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(selectedEventId)) ? ssrLooseContain(unref(selectedEventId), col.scheduleEvent.id) : ssrLooseEqual(unref(selectedEventId), col.scheduleEvent.id)) ? " selected" : ""}>${ssrInterpolate(formatColumnDate(col.scheduleEvent.date))} ${ssrInterpolate(formatTimeRange(col.scheduleEvent.startTime, col.scheduleEvent.endTime))} ${ssrInterpolate(col.hasGrade ? "(с оценкой)" : "")}</option>`);
          });
          _push(`<!--]--></select><div class="flex gap-2">`);
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "primary",
            size: "sm",
            disabled: !unref(selectedEventId),
            onClick: openBulkAttendanceModal
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg> Отметить всех `);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "w-4 h-4 mr-1",
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
                  createTextVNode(" Отметить всех ")
                ];
              }
            }),
            _: 1
          }, _parent));
          if (unref(selectedEvent)?.hasGrade) {
            _push(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              size: "sm",
              disabled: !unref(selectedEventId),
              onClick: openBulkGradeModal
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId}></path></svg> Оценка всем `);
                } else {
                  return [
                    (openBlock(), createBlock("svg", {
                      class: "w-4 h-4 mr-1",
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
                    createTextVNode(" Оценка всем ")
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(columns).length > 0) {
          _push(`<div class="rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden"><div class="overflow-x-auto"><table class="w-full min-w-max"><thead><tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"><th class="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]"> Слушатель </th><!--[-->`);
          ssrRenderList(unref(columns), (column) => {
            _push(`<th class="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]"><div class="flex flex-col items-center gap-1"><span class="${ssrRenderClass([{
              "bg-blue-500": column.scheduleEvent.eventType === "theory",
              "bg-green-500": column.scheduleEvent.eventType === "practice",
              "bg-orange-500": column.scheduleEvent.eventType === "assessment",
              "bg-gray-500": column.scheduleEvent.eventType === "other"
            }, "inline-block w-2 h-2 rounded-full"])}"></span><span class="text-xs">${ssrInterpolate(formatColumnDate(column.scheduleEvent.date))}</span><span class="text-[10px] text-gray-400">${ssrInterpolate(formatTimeRange(column.scheduleEvent.startTime, column.scheduleEvent.endTime))}</span></div></th>`);
          });
          _push(`<!--]--><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px] bg-gray-100 dark:bg-gray-700"> Посещ. % </th><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px] bg-gray-100 dark:bg-gray-700"> Ср. оценка </th><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] bg-gray-100 dark:bg-gray-700"> Итог </th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
          ssrRenderList(unref(rows), (row) => {
            _push(`<tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"><td class="sticky left-0 z-10 bg-white dark:bg-boxdark px-4 py-3 whitespace-nowrap"><div class="flex items-center gap-3"><div class="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success text-sm font-semibold">${ssrInterpolate(getInitials(row.student.fullName))}</div><span class="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[150px]"${ssrRenderAttr("title", row.student.fullName)}>${ssrInterpolate(row.student.fullName)}</span></div></td><!--[-->`);
            ssrRenderList(row.cells, (cell, cellIndex) => {
              _push(`<td class="px-2 py-3 text-center">`);
              if (unref(columns)[cellIndex]) {
                _push(ssrRenderComponent(AttendanceCell, {
                  cell,
                  column: unref(columns)[cellIndex],
                  "student-id": row.student.id,
                  onUpdate: handleCellUpdate
                }, null, _parent));
              } else {
                _push(`<!---->`);
              }
              _push(`</td>`);
            });
            _push(`<!--]--><td class="px-4 py-3 text-center bg-gray-50 dark:bg-gray-800/30"><span class="${ssrRenderClass([getAttendanceColor(row.attendancePercent), "inline-block px-2 py-1 rounded text-sm font-medium"])}">${ssrInterpolate(row.attendancePercent.toFixed(1))}% </span></td><td class="px-4 py-3 text-center bg-gray-50 dark:bg-gray-800/30">`);
            if (row.averageGrade !== void 0) {
              _push(`<span class="text-sm font-medium text-gray-900 dark:text-white">${ssrInterpolate(row.averageGrade.toFixed(0))}</span>`);
            } else {
              _push(`<span class="text-gray-400">—</span>`);
            }
            _push(`</td><td class="px-4 py-3 text-center bg-gray-50 dark:bg-gray-800/30">`);
            _push(ssrRenderComponent(FinalGradeCell, {
              "final-grade": row.finalGrade,
              "student-id": row.student.id,
              "group-id": unref(groupId),
              "discipline-id": unref(disciplineId),
              "attendance-percent": row.attendancePercent,
              onUpdate: handleFinalGradeUpdate
            }, null, _parent));
            _push(`</td></tr>`);
          });
          _push(`<!--]--></tbody></table></div><div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400"><span class="font-medium">Типы занятий:</span><span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-blue-500"></span> Теория </span><span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-green-500"></span> Практика </span><span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-orange-500"></span> Проверка знаний (с оценкой) </span><span class="mx-2 text-gray-300 dark:text-gray-600">|</span><span class="font-medium">Оценки:</span><span class="flex items-center gap-1" title="Автоматическая оценка из теста"><span class="relative w-5 h-5 rounded bg-success/20 flex items-center justify-center text-xs text-success"><span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500"></span> 85 </span> Из теста </span><span class="flex items-center gap-1" title="Изменённая оценка"><span class="relative w-5 h-5 rounded bg-purple-200 dark:bg-purple-900/40 flex items-center justify-center text-xs text-purple-700 dark:text-purple-300 ring-1 ring-purple-400"><span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-500"></span> 78 </span> Изменена </span></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      }
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": unref(showBulkAttendanceModal),
        title: "Массовая отметка посещаемости",
        size: "md",
        onClose: ($event) => showBulkAttendanceModal.value = false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}>`);
            if (unref(selectedEvent)) {
              _push2(`<div${_scopeId}><p class="text-sm text-gray-600 dark:text-gray-400 mb-4"${_scopeId}> Занятие: ${ssrInterpolate(formatColumnDate(unref(selectedEvent).scheduleEvent.date))} ${ssrInterpolate(formatTimeRange(unref(selectedEvent).scheduleEvent.startTime, unref(selectedEvent).scheduleEvent.endTime))} (${ssrInterpolate(unref(selectedEvent).scheduleEvent.academicHours)} а-ч) </p><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Часы посещения для всех (из ${ssrInterpolate(unref(selectedEvent).scheduleEvent.academicHours)}) </label><div class="flex items-center gap-2"${_scopeId}><input${ssrRenderAttr("value", unref(bulkAttendanceHours))} type="number" step="0.5" min="0"${ssrRenderAttr("max", unref(selectedEvent).scheduleEvent.academicHours)} class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"${_scopeId}><span class="text-gray-500"${_scopeId}>а-ч</span></div><div class="flex gap-2 mt-3"${_scopeId}><button class="${ssrRenderClass([unref(bulkAttendanceHours) === 0 ? "bg-primary text-white border-primary" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700", "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"])}"${_scopeId}> Никто (0) </button><button class="${ssrRenderClass([unref(bulkAttendanceHours) === unref(selectedEvent).scheduleEvent.academicHours ? "bg-primary text-white border-primary" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700", "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"])}"${_scopeId}> Все (${ssrInterpolate(unref(selectedEvent).scheduleEvent.academicHours)}) </button></div></div><div class="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4"${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}> Будет отмечено ${ssrInterpolate(unref(rows).length)} слушателей </p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="flex justify-end gap-3 pt-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: ($event) => showBulkAttendanceModal.value = false
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
              loading: unref(bulkSaving),
              onClick: saveBulkAttendance
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Отметить всех `);
                } else {
                  return [
                    createTextVNode(" Отметить всех ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-4" }, [
                unref(selectedEvent) ? (openBlock(), createBlock("div", { key: 0 }, [
                  createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400 mb-4" }, " Занятие: " + toDisplayString(formatColumnDate(unref(selectedEvent).scheduleEvent.date)) + " " + toDisplayString(formatTimeRange(unref(selectedEvent).scheduleEvent.startTime, unref(selectedEvent).scheduleEvent.endTime)) + " (" + toDisplayString(unref(selectedEvent).scheduleEvent.academicHours) + " а-ч) ", 1),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Часы посещения для всех (из " + toDisplayString(unref(selectedEvent).scheduleEvent.academicHours) + ") ", 1),
                    createVNode("div", { class: "flex items-center gap-2" }, [
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => isRef(bulkAttendanceHours) ? bulkAttendanceHours.value = $event : null,
                        type: "number",
                        step: "0.5",
                        min: "0",
                        max: unref(selectedEvent).scheduleEvent.academicHours,
                        class: "flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      }, null, 8, ["onUpdate:modelValue", "max"]), [
                        [
                          vModelText,
                          unref(bulkAttendanceHours),
                          void 0,
                          { number: true }
                        ]
                      ]),
                      createVNode("span", { class: "text-gray-500" }, "а-ч")
                    ]),
                    createVNode("div", { class: "flex gap-2 mt-3" }, [
                      createVNode("button", {
                        class: ["px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors", unref(bulkAttendanceHours) === 0 ? "bg-primary text-white border-primary" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"],
                        onClick: ($event) => bulkAttendanceHours.value = 0
                      }, " Никто (0) ", 10, ["onClick"]),
                      createVNode("button", {
                        class: ["px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors", unref(bulkAttendanceHours) === unref(selectedEvent).scheduleEvent.academicHours ? "bg-primary text-white border-primary" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"],
                        onClick: ($event) => bulkAttendanceHours.value = unref(selectedEvent).scheduleEvent.academicHours
                      }, " Все (" + toDisplayString(unref(selectedEvent).scheduleEvent.academicHours) + ") ", 11, ["onClick"])
                    ])
                  ]),
                  createVNode("div", { class: "pt-4 border-t border-gray-200 dark:border-gray-700 mt-4" }, [
                    createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, " Будет отмечено " + toDisplayString(unref(rows).length) + " слушателей ", 1)
                  ])
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "flex justify-end gap-3 pt-4" }, [
                  createVNode(_component_UiButton, {
                    variant: "outline",
                    onClick: ($event) => showBulkAttendanceModal.value = false
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["onClick"]),
                  createVNode(_component_UiButton, {
                    loading: unref(bulkSaving),
                    onClick: saveBulkAttendance
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отметить всех ")
                    ]),
                    _: 1
                  }, 8, ["loading"])
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": unref(showBulkGradeModal),
        title: "Массовое выставление оценок",
        size: "md",
        onClose: ($event) => showBulkGradeModal.value = false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}>`);
            if (unref(selectedEvent)) {
              _push2(`<div${_scopeId}><p class="text-sm text-gray-600 dark:text-gray-400 mb-4"${_scopeId}> Занятие: ${ssrInterpolate(formatColumnDate(unref(selectedEvent).scheduleEvent.date))} ${ssrInterpolate(formatTimeRange(unref(selectedEvent).scheduleEvent.startTime, unref(selectedEvent).scheduleEvent.endTime))}</p><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Оценка для всех (0-100) </label><input${ssrRenderAttr("value", unref(bulkGradeValue))} type="number" min="0" max="100" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"${_scopeId}><div class="flex flex-wrap gap-2 mt-3"${_scopeId}><!--[-->`);
              ssrRenderList([100, 90, 80, 70, 60], (grade) => {
                _push2(`<button class="${ssrRenderClass([unref(bulkGradeValue) === grade ? "bg-primary text-white border-primary" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700", "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"])}"${_scopeId}>${ssrInterpolate(grade)}</button>`);
              });
              _push2(`<!--]--></div></div><div class="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4"${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}> Будет выставлено ${ssrInterpolate(unref(rows).length)} оценок </p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="flex justify-end gap-3 pt-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: ($event) => showBulkGradeModal.value = false
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
              loading: unref(bulkSaving),
              onClick: saveBulkGrade
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Выставить оценки `);
                } else {
                  return [
                    createTextVNode(" Выставить оценки ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-4" }, [
                unref(selectedEvent) ? (openBlock(), createBlock("div", { key: 0 }, [
                  createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400 mb-4" }, " Занятие: " + toDisplayString(formatColumnDate(unref(selectedEvent).scheduleEvent.date)) + " " + toDisplayString(formatTimeRange(unref(selectedEvent).scheduleEvent.startTime, unref(selectedEvent).scheduleEvent.endTime)), 1),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Оценка для всех (0-100) "),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => isRef(bulkGradeValue) ? bulkGradeValue.value = $event : null,
                      type: "number",
                      min: "0",
                      max: "100",
                      class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [
                        vModelText,
                        unref(bulkGradeValue),
                        void 0,
                        { number: true }
                      ]
                    ]),
                    createVNode("div", { class: "flex flex-wrap gap-2 mt-3" }, [
                      (openBlock(), createBlock(Fragment, null, renderList([100, 90, 80, 70, 60], (grade) => {
                        return createVNode("button", {
                          key: grade,
                          class: ["px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors", unref(bulkGradeValue) === grade ? "bg-primary text-white border-primary" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"],
                          onClick: ($event) => bulkGradeValue.value = grade
                        }, toDisplayString(grade), 11, ["onClick"]);
                      }), 64))
                    ])
                  ]),
                  createVNode("div", { class: "pt-4 border-t border-gray-200 dark:border-gray-700 mt-4" }, [
                    createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, " Будет выставлено " + toDisplayString(unref(rows).length) + " оценок ", 1)
                  ])
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "flex justify-end gap-3 pt-4" }, [
                  createVNode(_component_UiButton, {
                    variant: "outline",
                    onClick: ($event) => showBulkGradeModal.value = false
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["onClick"]),
                  createVNode(_component_UiButton, {
                    loading: unref(bulkSaving),
                    onClick: saveBulkGrade
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Выставить оценки ")
                    ]),
                    _: 1
                  }, 8, ["loading"])
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/groups/journal/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-DfizDrJc.mjs.map
