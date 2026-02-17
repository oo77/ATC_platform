import { _ as __nuxt_component_1$1 } from './Button-D9CRGwzT.mjs';
import { _ as __nuxt_component_0$1 } from './Modal-DQYphXo7.mjs';
import { defineComponent, ref, mergeProps, unref, computed, watch, nextTick, withCtx, createBlock, createTextVNode, openBlock, createVNode, createCommentVNode, toDisplayString, Fragment, renderList, withModifiers, withDirectives, vModelSelect, vModelText, isRef, vModelCheckbox, reactive, vModelRadio, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderAttr, ssrRenderStyle } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
import { u as usePermissions } from './usePermissions-Dc3CsxMS.mjs';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
import { _ as __nuxt_component_3$1 } from './ConfirmModal-D4ued3Bi.mjs';
import { u as useScheduleSettings } from './useScheduleSettings-CjNTeZG0.mjs';
import { _ as __nuxt_component_1$2 } from './MultiSelect-D4TFMDTt.mjs';
import { u as useHead, e as useAuth } from './server.mjs';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import ruLocale from '@fullcalendar/core/locales/ru';
import './Notification-CQvvdM2O.mjs';
import '../_/nitro.mjs';
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
import 'node:url';
import 'jsonwebtoken';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

function toLocalISOString(dateStr, timeStr) {
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr}T${normalizedTime}`;
}
function dateToLocalIsoString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function formatTimeOnly(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
function formatDateShort(dateStr) {
  const parts = dateStr.split("-").map(Number);
  const year = parts[0] ?? 2e3;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  });
}
function parseDateTime(dateTimeStr) {
  if (!dateTimeStr) {
    return { date: "", time: "" };
  }
  let datePart;
  let timePart;
  if (dateTimeStr.includes("T")) {
    const parts = dateTimeStr.split("T");
    datePart = parts[0] ?? "";
    const timeWithMaybeMsAndZ = parts[1] ?? "00:00:00";
    timePart = timeWithMaybeMsAndZ.replace(/\.\d+Z?$/, "").replace(/Z$/, "").substring(0, 5);
  } else if (dateTimeStr.includes(" ")) {
    const parts = dateTimeStr.split(" ");
    datePart = parts[0] ?? "";
    timePart = (parts[1] ?? "00:00:00").substring(0, 5);
  } else {
    datePart = dateTimeStr;
    timePart = "00:00";
  }
  return { date: datePart, time: timePart };
}
function formatEventDate(dateTimeStr) {
  const { date } = parseDateTime(dateTimeStr);
  if (!date) return "";
  const dateParts = date.split("-").map(Number);
  const year = dateParts[0] ?? 2e3;
  const month = dateParts[1] ?? 1;
  const day = dateParts[2] ?? 1;
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}
function formatEventTime(dateTimeStr) {
  const { time } = parseDateTime(dateTimeStr);
  return time;
}
const _sfc_main$a = /* @__PURE__ */ defineComponent({
  __name: "EventDetailModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    event: {}
  },
  emits: ["close", "edit", "retake", "deleted"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const { canEditSchedule } = usePermissions();
    const loading = ref(false);
    const loadingStudents = ref(false);
    const students = ref([]);
    const deleting = ref(false);
    const showDeleteConfirm = ref(false);
    const isRetake = computed(() => {
      return props.event?.allowedStudentIds && props.event.allowedStudentIds.length > 0 || !!props.event?.originalEventId;
    });
    const toast = useNotification();
    const loadStudents = async (groupId) => {
      loadingStudents.value = true;
      try {
        const response = await authFetch(`/api/groups/${groupId}`);
        if (response.success && response.group?.students) {
          let allStudents = response.group.students.filter((s) => s.student).map((s) => ({
            id: s.student.id,
            fullName: s.student.fullName,
            organization: s.student.organization,
            position: s.student.position
          }));
          if (props.event?.allowedStudentIds && props.event.allowedStudentIds.length > 0) {
            allStudents = allStudents.filter(
              (student) => props.event.allowedStudentIds.includes(student.id)
            );
          }
          students.value = allStudents;
        }
      } catch (error) {
        console.error("Error loading students:", error);
      } finally {
        loadingStudents.value = false;
      }
    };
    const getInitials = (fullName) => {
      if (!fullName) return "??";
      const parts = fullName.split(" ");
      if (parts.length >= 2) {
        return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
      }
      return (parts[0]?.[0] ?? "?").toUpperCase();
    };
    const getStudentWord = (count) => {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod100 >= 11 && mod100 <= 19) return "слушателей";
      if (mod10 === 1) return "слушатель";
      if (mod10 >= 2 && mod10 <= 4) return "слушателя";
      return "слушателей";
    };
    const getColorClass = (color) => {
      const colorClasses = {
        primary: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        danger: "bg-danger"
      };
      return colorClasses[color] || "bg-primary";
    };
    const getEventTypeLabel = (type) => {
      const labels = {
        theory: "Теория",
        practice: "Практика",
        assessment: "Проверка знаний",
        other: "Другое"
      };
      return labels[type] || "Занятие";
    };
    const getEventTypeBadgeClass = (type) => {
      const classes = {
        theory: "bg-primary/10 text-primary dark:bg-primary/20",
        practice: "bg-success/10 text-success dark:bg-success/20",
        assessment: "bg-warning/10 text-warning dark:bg-warning/20",
        other: "bg-gray-100 text-gray-600 dark:bg-meta-4 dark:text-gray-300"
      };
      return classes[type] || classes.other;
    };
    const handleClose = () => {
      emit("close");
    };
    const handleEdit = () => {
      if (props.event) {
        emit("edit", props.event);
      }
    };
    const handleRetake = () => {
      if (props.event) {
        emit("retake", props.event);
      }
    };
    const handleDelete = async () => {
      if (!props.event || deleting.value) return;
      if (!showDeleteConfirm.value) {
        showDeleteConfirm.value = true;
        return;
      }
      deleting.value = true;
      try {
        const response = await authFetch(
          `/api/schedule/${props.event.id}`,
          { method: "DELETE" }
        );
        if (response.success) {
          toast.success("Занятие удалено");
          emit("deleted");
          emit("close");
        } else {
          toast.error(response.message || "Ошибка удаления");
        }
      } catch (error) {
        toast.error(error.data?.message || error.message || "Ошибка удаления");
      } finally {
        deleting.value = false;
        showDeleteConfirm.value = false;
      }
    };
    const cancelDelete = () => {
      showDeleteConfirm.value = false;
    };
    watch(
      () => props.isOpen,
      (isOpen) => {
        if (isOpen && props.event?.groupId) {
          loadStudents(props.event.groupId);
        } else {
          students.value = [];
        }
      }
    );
    watch(
      () => props.event,
      (event) => {
        if (props.isOpen && event?.groupId) {
          loadStudents(event.groupId);
        } else {
          students.value = [];
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1$1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Информация о занятии",
        size: "xl",
        onClose: handleClose
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-between items-center"${_scopeId}><div class="flex gap-2"${_scopeId}>`);
            if (unref(canEditSchedule) && __props.event && __props.event.groupId && (__props.event.eventType === "assessment" || __props.event.eventType === "practice") && !__props.event.originalEventId && !(__props.event.allowedStudentIds && __props.event.allowedStudentIds.length > 0) && !__props.event.group?.isArchived) {
              _push2(ssrRenderComponent(_component_UiButton, {
                variant: "warning",
                onClick: handleRetake
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"${_scopeId2}></path></svg> Создать пересдачу `);
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
                          d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        })
                      ])),
                      createTextVNode(" Создать пересдачу ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (unref(canEditSchedule) && unref(isRetake) && !__props.event.group?.isArchived) {
              _push2(`<div class="flex items-center gap-2"${_scopeId}>`);
              if (!unref(showDeleteConfirm)) {
                _push2(ssrRenderComponent(_component_UiButton, {
                  variant: "danger",
                  size: "sm",
                  loading: unref(deleting),
                  onClick: handleDelete
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId2}></path></svg> Удалить `);
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
                            d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          })
                        ])),
                        createTextVNode(" Удалить ")
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
              } else {
                _push2(`<!--[--><span class="text-sm text-danger font-medium"${_scopeId}>Удалить пересдачу?</span>`);
                _push2(ssrRenderComponent(_component_UiButton, {
                  variant: "danger",
                  size: "sm",
                  loading: unref(deleting),
                  onClick: handleDelete
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(` Да `);
                    } else {
                      return [
                        createTextVNode(" Да ")
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                _push2(ssrRenderComponent(_component_UiButton, {
                  variant: "outline",
                  size: "sm",
                  onClick: cancelDelete
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
                _push2(`<!--]-->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="flex gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: handleClose
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
            if (unref(canEditSchedule) && !__props.event.group?.isArchived) {
              _push2(ssrRenderComponent(_component_UiButton, { onClick: handleEdit }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId2}></path></svg> Редактировать `);
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
                          d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        })
                      ])),
                      createTextVNode(" Редактировать ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-between items-center" }, [
                createVNode("div", { class: "flex gap-2" }, [
                  unref(canEditSchedule) && __props.event && __props.event.groupId && (__props.event.eventType === "assessment" || __props.event.eventType === "practice") && !__props.event.originalEventId && !(__props.event.allowedStudentIds && __props.event.allowedStudentIds.length > 0) && !__props.event.group?.isArchived ? (openBlock(), createBlock(_component_UiButton, {
                    key: 0,
                    variant: "warning",
                    onClick: handleRetake
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
                          d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        })
                      ])),
                      createTextVNode(" Создать пересдачу ")
                    ]),
                    _: 1
                  })) : createCommentVNode("", true),
                  unref(canEditSchedule) && unref(isRetake) && !__props.event.group?.isArchived ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "flex items-center gap-2"
                  }, [
                    !unref(showDeleteConfirm) ? (openBlock(), createBlock(_component_UiButton, {
                      key: 0,
                      variant: "danger",
                      size: "sm",
                      loading: unref(deleting),
                      onClick: handleDelete
                    }, {
                      default: withCtx(() => [
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
                            d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          })
                        ])),
                        createTextVNode(" Удалить ")
                      ]),
                      _: 1
                    }, 8, ["loading"])) : (openBlock(), createBlock(Fragment, { key: 1 }, [
                      createVNode("span", { class: "text-sm text-danger font-medium" }, "Удалить пересдачу?"),
                      createVNode(_component_UiButton, {
                        variant: "danger",
                        size: "sm",
                        loading: unref(deleting),
                        onClick: handleDelete
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Да ")
                        ]),
                        _: 1
                      }, 8, ["loading"]),
                      createVNode(_component_UiButton, {
                        variant: "outline",
                        size: "sm",
                        onClick: cancelDelete
                      }, {
                        default: withCtx(() => [
                          createTextVNode(" Отмена ")
                        ]),
                        _: 1
                      })
                    ], 64))
                  ])) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "flex gap-3" }, [
                  createVNode(_component_UiButton, {
                    variant: "outline",
                    onClick: handleClose
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Закрыть ")
                    ]),
                    _: 1
                  }),
                  unref(canEditSchedule) && !__props.event.group?.isArchived ? (openBlock(), createBlock(_component_UiButton, {
                    key: 0,
                    onClick: handleEdit
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
                          d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        })
                      ])),
                      createTextVNode(" Редактировать ")
                    ]),
                    _: 1
                  })) : createCommentVNode("", true)
                ])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(loading)) {
              _push2(`<div class="flex items-center justify-center py-12"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"${_scopeId}></div><span class="text-gray-600 dark:text-gray-400"${_scopeId}>Загрузка информации...</span></div></div>`);
            } else if (__props.event) {
              _push2(`<div class="space-y-6"${_scopeId}><div class="flex items-start gap-4"${_scopeId}><div class="${ssrRenderClass([getColorClass(__props.event.color), "w-3 h-3 rounded-full mt-2 shrink-0"])}"${_scopeId}></div><div class="flex-1"${_scopeId}><h3 class="text-xl font-semibold text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.event.title)}</h3>`);
              if (__props.event.description) {
                _push2(`<p class="mt-1 text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(__props.event.description)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="flex items-center gap-2"${_scopeId}>`);
              if (unref(isRetake)) {
                _push2(`<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"${_scopeId}> Пересдача </span>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.event.eventType) {
                _push2(`<span class="${ssrRenderClass([getEventTypeBadgeClass(__props.event.eventType), "px-3 py-1 rounded-full text-xs font-medium"])}"${_scopeId}>${ssrInterpolate(getEventTypeLabel(__props.event.eventType))}</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-meta-4 rounded-lg"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center"${_scopeId}><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"${_scopeId}></path></svg></div><div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Дата и время</p><p class="font-medium text-black dark:text-white"${_scopeId}>${ssrInterpolate(unref(formatEventDate)(__props.event.startTime))}</p><p class="text-sm text-gray-600 dark:text-gray-300"${_scopeId}>${ssrInterpolate(unref(formatEventTime)(__props.event.startTime))} — ${ssrInterpolate(unref(formatEventTime)(__props.event.endTime))}</p></div></div>`);
              if (__props.event.group) {
                _push2(`<div class="flex items-center gap-3"${_scopeId}><div class="w-10 h-10 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center"${_scopeId}><svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path></svg></div><div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Группа</p><p class="font-medium text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.event.group.code)}</p></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.event.instructor) {
                _push2(`<div class="flex items-center gap-3"${_scopeId}><div class="w-10 h-10 rounded-lg bg-warning/10 dark:bg-warning/20 flex items-center justify-center"${_scopeId}><svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"${_scopeId}></path></svg></div><div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Инструктор</p><p class="font-medium text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.event.instructor.fullName)}</p></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.event.classroom) {
                _push2(`<div class="flex items-center gap-3"${_scopeId}><div class="w-10 h-10 rounded-lg bg-danger/10 dark:bg-danger/20 flex items-center justify-center"${_scopeId}><svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"${_scopeId}></path></svg></div><div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Аудитория</p><p class="font-medium text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.event.classroom.name)}</p></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
              if (__props.event.group) {
                _push2(`<div class="space-y-3"${_scopeId}><div class="flex items-center justify-between"${_scopeId}><h4 class="text-lg font-semibold text-black dark:text-white flex items-center gap-2"${_scopeId}><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"${_scopeId}></path></svg> Слушатели </h4><span class="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-full text-sm font-medium"${_scopeId}>${ssrInterpolate(unref(students).length)} ${ssrInterpolate(getStudentWord(unref(students).length))}</span></div>`);
                if (unref(loadingStudents)) {
                  _push2(`<div class="flex items-center justify-center py-8"${_scopeId}><div class="flex items-center gap-2 text-gray-500"${_scopeId}><div class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"${_scopeId}></div> Загрузка списка слушателей... </div></div>`);
                } else if (unref(students).length > 0) {
                  _push2(`<div class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden"${_scopeId}><div class="max-h-64 overflow-y-auto"${_scopeId}><table class="w-full"${_scopeId}><thead class="bg-gray-50 dark:bg-meta-4 sticky top-0"${_scopeId}><tr${_scopeId}><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"${_scopeId}> № </th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"${_scopeId}> ФИО </th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"${_scopeId}> Организация </th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"${_scopeId}> Должность </th></tr></thead><tbody class="bg-white dark:bg-boxdark divide-y divide-stroke dark:divide-strokedark"${_scopeId}><!--[-->`);
                  ssrRenderList(unref(students), (student, index) => {
                    _push2(`<tr class="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"${_scopeId}><td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"${_scopeId}>${ssrInterpolate(index + 1)}</td><td class="px-4 py-3 whitespace-nowrap"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary text-xs font-medium"${_scopeId}>${ssrInterpolate(getInitials(student.fullName))}</div><span class="text-sm font-medium text-black dark:text-white"${_scopeId}>${ssrInterpolate(student.fullName)}</span></div></td><td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"${_scopeId}>${ssrInterpolate(student.organization || "—")}</td><td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"${_scopeId}>${ssrInterpolate(student.position || "—")}</td></tr>`);
                  });
                  _push2(`<!--]--></tbody></table></div></div>`);
                } else {
                  _push2(`<div class="text-center py-8 text-gray-500 dark:text-gray-400"${_scopeId}><svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path></svg><p${_scopeId}>В группе пока нет слушателей</p></div>`);
                }
                _push2(`</div>`);
              } else {
                _push2(`<div class="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-meta-4 rounded-lg"${_scopeId}><p${_scopeId}>Занятие не привязано к учебной группе</p></div>`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              unref(loading) ? (openBlock(), createBlock("div", {
                key: 0,
                class: "flex items-center justify-center py-12"
              }, [
                createVNode("div", { class: "flex items-center gap-3" }, [
                  createVNode("div", { class: "inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" }),
                  createVNode("span", { class: "text-gray-600 dark:text-gray-400" }, "Загрузка информации...")
                ])
              ])) : __props.event ? (openBlock(), createBlock("div", {
                key: 1,
                class: "space-y-6"
              }, [
                createVNode("div", { class: "flex items-start gap-4" }, [
                  createVNode("div", {
                    class: ["w-3 h-3 rounded-full mt-2 shrink-0", getColorClass(__props.event.color)]
                  }, null, 2),
                  createVNode("div", { class: "flex-1" }, [
                    createVNode("h3", { class: "text-xl font-semibold text-black dark:text-white" }, toDisplayString(__props.event.title), 1),
                    __props.event.description ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-gray-600 dark:text-gray-400"
                    }, toDisplayString(__props.event.description), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", { class: "flex items-center gap-2" }, [
                    unref(isRetake) ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                    }, " Пересдача ")) : createCommentVNode("", true),
                    __props.event.eventType ? (openBlock(), createBlock("span", {
                      key: 1,
                      class: ["px-3 py-1 rounded-full text-xs font-medium", getEventTypeBadgeClass(__props.event.eventType)]
                    }, toDisplayString(getEventTypeLabel(__props.event.eventType)), 3)) : createCommentVNode("", true)
                  ])
                ]),
                createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-meta-4 rounded-lg" }, [
                  createVNode("div", { class: "flex items-center gap-3" }, [
                    createVNode("div", { class: "w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center" }, [
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
                          d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        })
                      ]))
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Дата и время"),
                      createVNode("p", { class: "font-medium text-black dark:text-white" }, toDisplayString(unref(formatEventDate)(__props.event.startTime)), 1),
                      createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-300" }, toDisplayString(unref(formatEventTime)(__props.event.startTime)) + " — " + toDisplayString(unref(formatEventTime)(__props.event.endTime)), 1)
                    ])
                  ]),
                  __props.event.group ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "flex items-center gap-3"
                  }, [
                    createVNode("div", { class: "w-10 h-10 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-success",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        })
                      ]))
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Группа"),
                      createVNode("p", { class: "font-medium text-black dark:text-white" }, toDisplayString(__props.event.group.code), 1)
                    ])
                  ])) : createCommentVNode("", true),
                  __props.event.instructor ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "flex items-center gap-3"
                  }, [
                    createVNode("div", { class: "w-10 h-10 rounded-lg bg-warning/10 dark:bg-warning/20 flex items-center justify-center" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-warning",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        })
                      ]))
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Инструктор"),
                      createVNode("p", { class: "font-medium text-black dark:text-white" }, toDisplayString(__props.event.instructor.fullName), 1)
                    ])
                  ])) : createCommentVNode("", true),
                  __props.event.classroom ? (openBlock(), createBlock("div", {
                    key: 2,
                    class: "flex items-center gap-3"
                  }, [
                    createVNode("div", { class: "w-10 h-10 rounded-lg bg-danger/10 dark:bg-danger/20 flex items-center justify-center" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-danger",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        })
                      ]))
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Аудитория"),
                      createVNode("p", { class: "font-medium text-black dark:text-white" }, toDisplayString(__props.event.classroom.name), 1)
                    ])
                  ])) : createCommentVNode("", true)
                ]),
                __props.event.group ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "space-y-3"
                }, [
                  createVNode("div", { class: "flex items-center justify-between" }, [
                    createVNode("h4", { class: "text-lg font-semibold text-black dark:text-white flex items-center gap-2" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-gray-500",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        })
                      ])),
                      createTextVNode(" Слушатели ")
                    ]),
                    createVNode("span", { class: "px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-full text-sm font-medium" }, toDisplayString(unref(students).length) + " " + toDisplayString(getStudentWord(unref(students).length)), 1)
                  ]),
                  unref(loadingStudents) ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "flex items-center justify-center py-8"
                  }, [
                    createVNode("div", { class: "flex items-center gap-2 text-gray-500" }, [
                      createVNode("div", { class: "inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" }),
                      createTextVNode(" Загрузка списка слушателей... ")
                    ])
                  ])) : unref(students).length > 0 ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "border border-stroke dark:border-strokedark rounded-lg overflow-hidden"
                  }, [
                    createVNode("div", { class: "max-h-64 overflow-y-auto" }, [
                      createVNode("table", { class: "w-full" }, [
                        createVNode("thead", { class: "bg-gray-50 dark:bg-meta-4 sticky top-0" }, [
                          createVNode("tr", null, [
                            createVNode("th", { class: "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" }, " № "),
                            createVNode("th", { class: "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" }, " ФИО "),
                            createVNode("th", { class: "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" }, " Организация "),
                            createVNode("th", { class: "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" }, " Должность ")
                          ])
                        ]),
                        createVNode("tbody", { class: "bg-white dark:bg-boxdark divide-y divide-stroke dark:divide-strokedark" }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(students), (student, index) => {
                            return openBlock(), createBlock("tr", {
                              key: student.id,
                              class: "hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                            }, [
                              createVNode("td", { class: "px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" }, toDisplayString(index + 1), 1),
                              createVNode("td", { class: "px-4 py-3 whitespace-nowrap" }, [
                                createVNode("div", { class: "flex items-center gap-3" }, [
                                  createVNode("div", { class: "w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary text-xs font-medium" }, toDisplayString(getInitials(student.fullName)), 1),
                                  createVNode("span", { class: "text-sm font-medium text-black dark:text-white" }, toDisplayString(student.fullName), 1)
                                ])
                              ]),
                              createVNode("td", { class: "px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300" }, toDisplayString(student.organization || "—"), 1),
                              createVNode("td", { class: "px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300" }, toDisplayString(student.position || "—"), 1)
                            ]);
                          }), 128))
                        ])
                      ])
                    ])
                  ])) : (openBlock(), createBlock("div", {
                    key: 2,
                    class: "text-center py-8 text-gray-500 dark:text-gray-400"
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-12 h-12 mx-auto mb-3 opacity-50",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      })
                    ])),
                    createVNode("p", null, "В группе пока нет слушателей")
                  ]))
                ])) : (openBlock(), createBlock("div", {
                  key: 1,
                  class: "text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-meta-4 rounded-lg"
                }, [
                  createVNode("p", null, "Занятие не привязано к учебной группе")
                ]))
              ])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/schedule/EventDetailModal.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$a, { __name: "ScheduleEventDetailModal" });
const _sfc_main$9 = /* @__PURE__ */ defineComponent({
  __name: "EventModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    event: { default: null },
    defaultStart: { default: void 0 },
    defaultEnd: { default: void 0 }
  },
  emits: ["close", "saved", "deleted"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const {
      periods,
      settings: scheduleSettings,
      loadSettings: loadScheduleSettings
    } = useScheduleSettings();
    const groups = ref([]);
    const disciplines = ref([]);
    const classrooms = ref([]);
    const selectedGroupInfo = ref(null);
    const loadingDisciplines = ref(false);
    const allTestTemplates = ref([]);
    const loadingTemplates = ref(false);
    const loadAllActiveTemplates = async () => {
      if (allTestTemplates.value.length > 0) return;
      loadingTemplates.value = true;
      try {
        const response = await authFetch("/api/test-bank/templates/select");
        if (response.success) {
          allTestTemplates.value = response.templates || [];
        }
      } catch (error) {
        console.error("Error loading test templates:", error);
      } finally {
        loadingTemplates.value = false;
      }
    };
    const loadCurrentAssignment = async (eventId) => {
      try {
        const response = await authFetch(
          `/api/tests/assignments/by-event/${eventId}`
        );
        if (response.success && response.assignment) {
          form.value.testTemplateId = response.assignment.test_template_id;
          if (response.assignment.allowed_student_ids && response.assignment.allowed_student_ids.length > 0) {
            isRetake.value = true;
            form.value.allowedStudentIds = response.assignment.allowed_student_ids;
          }
        }
      } catch (error) {
        console.error("Error loading current assignment:", error);
      }
    };
    const lessonPairs = computed(() => {
      return periods.value.map((p) => ({
        number: p.periodNumber,
        startTime: p.startTime,
        endTime: p.endTime,
        isAfterBreak: p.isAfterBreak
      }));
    });
    const timeMode = ref("pairs");
    const selectedPairs = ref([]);
    const groupStudents = ref([]);
    const loadingStudents = ref(false);
    const isRetake = ref(false);
    const loadGroupStudents = async (groupId) => {
      if (!groupId) return;
      if (groupStudents.value.length > 0 && groupStudents.value[0]?.groupId !== groupId) {
        groupStudents.value = [];
      }
      if (groupStudents.value.length > 0) return;
      loadingStudents.value = true;
      try {
        const response = await authFetch(
          `/api/groups/${groupId}`
        );
        if (response.success && response.group && response.group.students) {
          groupStudents.value = response.group.students.map((s) => ({
            id: s.student.id,
            label: s.student.fullName,
            groupId
            // Add groupId to option for tracking
          }));
        }
      } catch (error) {
        console.error("Error loading students:", error);
      } finally {
        loadingStudents.value = false;
      }
    };
    const form = ref({
      groupId: "",
      disciplineId: "",
      instructorId: "",
      classroomId: "",
      eventType: "theory",
      color: "primary",
      date: "",
      startTime: "",
      endTime: "",
      description: "",
      testTemplateId: "",
      allowedStudentIds: []
    });
    const errors = ref({});
    const submitting = ref(false);
    const showDeleteConfirm = ref(false);
    const deleting = ref(false);
    const hoursWarning = ref(null);
    const instructorHoursWarning = ref(null);
    const instructorHoursCheckLoading = ref(false);
    const isFormInitializing = ref(false);
    const isEditMode = computed(() => !!props.event);
    const selectedDiscipline = computed(() => {
      if (!form.value.disciplineId) return null;
      return disciplines.value.find((d) => d.id === form.value.disciplineId) || null;
    });
    const disciplineInstructors = computed(() => {
      return selectedDiscipline.value?.instructors || [];
    });
    const computedTimeRange = computed(() => {
      if (selectedPairs.value.length === 0) return "";
      const sorted = [...selectedPairs.value].sort((a, b) => a - b);
      const first = lessonPairs.value.find((p) => p.number === sorted[0]);
      const last = lessonPairs.value.find(
        (p) => p.number === sorted[sorted.length - 1]
      );
      if (!first || !last) return "";
      return `${first.startTime} - ${last.endTime}`;
    });
    const computedDuration = computed(() => {
      const periodDurationMinutes = parseInt(
        scheduleSettings.value.period_duration_minutes || "40",
        10
      );
      const academicHourMinutes = parseInt(
        scheduleSettings.value.academic_hour_minutes || "40",
        10
      );
      if (timeMode.value === "pairs") {
        const totalMinutes = selectedPairs.value.length * periodDurationMinutes;
        return Math.ceil(totalMinutes / academicHourMinutes);
      }
      if (!form.value.startTime || !form.value.endTime) return 0;
      const startParts = form.value.startTime.split(":").map(Number);
      const endParts = form.value.endTime.split(":").map(Number);
      const startH = startParts[0] ?? 0;
      const startM = startParts[1] ?? 0;
      const endH = endParts[0] ?? 0;
      const endM = endParts[1] ?? 0;
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (endMinutes <= startMinutes) return 0;
      return Math.ceil((endMinutes - startMinutes) / academicHourMinutes);
    });
    const colorOptions = [
      { value: "primary", bg: "bg-primary", label: "Синий" },
      {
        value: "success",
        bg: "bg-success",
        label: "Зелёный"
      },
      {
        value: "warning",
        bg: "bg-warning",
        label: "Оранжевый"
      },
      { value: "danger", bg: "bg-danger", label: "Красный" }
    ];
    const formatDateShort$1 = (dateStr) => {
      return formatDateShort(dateStr);
    };
    const getAcademicHourWord = (count) => {
      if (count === 1) return "а-ч";
      return "а-ч";
    };
    const consecutiveGroups = computed(() => {
      if (selectedPairs.value.length === 0) return [];
      const sorted = [...selectedPairs.value].sort((a, b) => a - b);
      const groups2 = [];
      const firstElement = sorted[0];
      let currentGroup = [firstElement];
      for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const previous = sorted[i - 1];
        if (current === previous + 1) {
          currentGroup.push(current);
        } else {
          groups2.push(currentGroup);
          currentGroup = [current];
        }
      }
      groups2.push(currentGroup);
      return groups2;
    });
    const hasNonConsecutivePairs = computed(() => {
      return consecutiveGroups.value.length > 1;
    });
    const getHoursClass = (type) => {
      if (!selectedDiscipline.value) return "bg-gray-100 dark:bg-boxdark";
      const remaining = selectedDiscipline.value.remainingHours[type];
      const total = selectedDiscipline.value.totalHours[type];
      if (total === 0) return "bg-gray-100 dark:bg-boxdark";
      if (remaining === 0) return "bg-danger/10 text-danger";
      if (remaining <= total * 0.2) return "bg-warning/10 text-warning";
      return "bg-success/10 text-success";
    };
    const loadGroups = async () => {
      try {
        const response = await authFetch(
          "/api/groups?limit=1000&isActive=true"
        );
        console.log("[EventModal] Ответ API groups:", response);
        if (response.success && response.groups) {
          if (response.groups.length > 0) {
            console.log(
              "[EventModal] Первая группа:",
              JSON.stringify(response.groups[0], null, 2)
            );
          }
          groups.value = response.groups.map((g) => ({
            id: g.id,
            code: g.code,
            // API возвращает course как объект с полем name
            courseName: g.course?.name || ""
          }));
          console.log("[EventModal] Загружено групп:", groups.value.length);
        }
      } catch (error) {
        console.error("[EventModal] Error loading groups:", error);
      }
    };
    const loadClassrooms = async () => {
      try {
        const response = await authFetch("/api/classrooms");
        if (response.success) {
          classrooms.value = response.classrooms;
        }
      } catch (error) {
        console.error("Error loading classrooms:", error);
      }
    };
    const loadGroupDisciplines = async (groupId, preserveSelection = false) => {
      if (!groupId) {
        disciplines.value = [];
        selectedGroupInfo.value = null;
        return;
      }
      const savedDisciplineId = preserveSelection ? form.value.disciplineId : "";
      const savedInstructorId = preserveSelection ? form.value.instructorId : "";
      loadingDisciplines.value = true;
      try {
        const response = await authFetch(`/api/groups/${groupId}/disciplines`);
        if (response.success) {
          disciplines.value = response.disciplines;
          selectedGroupInfo.value = response.group;
          if (preserveSelection && savedDisciplineId) {
            const disciplineExists = disciplines.value.some(
              (d) => d.id === savedDisciplineId
            );
            if (disciplineExists) {
              form.value.disciplineId = savedDisciplineId;
              if (savedInstructorId) {
                const discipline = disciplines.value.find(
                  (d) => d.id === savedDisciplineId
                );
                const instructorExists = discipline?.instructors.some(
                  (i) => i.id === savedInstructorId
                );
                if (instructorExists) {
                  form.value.instructorId = savedInstructorId;
                }
              }
              if (form.value.eventType === "assessment") {
                loadAllActiveTemplates();
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading group disciplines:", error);
        notification.show({
          type: "error",
          title: "Ошибка",
          message: "Не удалось загрузить дисциплины группы"
        });
      } finally {
        loadingDisciplines.value = false;
      }
    };
    const handleGroupChange = () => {
      form.value.disciplineId = "";
      form.value.instructorId = "";
      disciplines.value = [];
      groupStudents.value = [];
      isRetake.value = false;
      form.value.allowedStudentIds = [];
      if (form.value.groupId) {
        loadGroupDisciplines(form.value.groupId);
      } else {
        selectedGroupInfo.value = null;
      }
      validateHours();
    };
    const handleDisciplineChange = () => {
      form.value.instructorId = "";
      if (selectedDiscipline.value?.instructors.length) {
        const primary = selectedDiscipline.value.instructors.find(
          (i) => i.isPrimary
        );
        if (primary) {
          form.value.instructorId = primary.id;
        }
      }
      validateHours();
    };
    const handleEventTypeChange = () => {
      if (form.value.eventType === "assessment") {
        loadAllActiveTemplates();
      } else {
        form.value.testTemplateId = "";
        isRetake.value = false;
        form.value.allowedStudentIds = [];
      }
      validateHours();
    };
    const handlePairChange = () => {
      selectedPairs.value.sort((a, b) => a - b);
      validateHours();
    };
    const validateHours = () => {
      if (isFormInitializing.value) return;
      hoursWarning.value = null;
      if (!selectedDiscipline.value || !form.value.eventType) return;
      const eventType = form.value.eventType;
      if (eventType !== "theory" && eventType !== "practice" && eventType !== "assessment") {
        return;
      }
      let remainingHours = selectedDiscipline.value.remainingHours[eventType];
      const plannedHours = computedDuration.value;
      if (props.event?.id && props.event.eventType === eventType) {
        const academicHourMinutes = parseInt(
          scheduleSettings.value.academic_hour_minutes || "40",
          10
        );
        const currentEventMinutes = props.event.durationMinutes || (new Date(props.event.endTime).getTime() - new Date(props.event.startTime).getTime()) / (1e3 * 60);
        const currentEventHours = Math.ceil(
          currentEventMinutes / academicHourMinutes
        );
        remainingHours += currentEventHours;
      }
      if (plannedHours > remainingHours) {
        const typeNames = {
          theory: "теории",
          practice: "практики",
          assessment: "проверки знаний"
        };
        hoursWarning.value = `Превышение лимита часов! Для ${typeNames[eventType]} осталось ${remainingHours} ч., а запланировано ${plannedHours} ч.`;
      }
      validateInstructorHours();
    };
    const validateInstructorHours = async () => {
      instructorHoursWarning.value = null;
      if (!form.value.instructorId || computedDuration.value <= 0) {
        return;
      }
      const academicHourMinutes = parseInt(
        scheduleSettings.value.academic_hour_minutes || "40",
        10
      );
      const durationMinutes = computedDuration.value * academicHourMinutes;
      if (durationMinutes <= 0) return;
      instructorHoursCheckLoading.value = true;
      try {
        const response = await authFetch(
          `/api/instructors/${form.value.instructorId}/hours/check?minutes=${durationMinutes}`,
          {
            method: "GET"
          }
        );
        if (response.success && !response.canTake) {
          if (response.maxHours && response.maxHours > 0) {
            instructorHoursWarning.value = response.message || `Превышен лимит часов инструктора! Доступно: ${response.remainingHours} ч., запрашивается: ${response.requestedHours} ч.`;
          }
        }
      } catch (err) {
        console.warn("Failed to check instructor hours limit:", err);
      } finally {
        instructorHoursCheckLoading.value = false;
      }
    };
    const validate = () => {
      errors.value = {};
      if (!form.value.groupId) {
        errors.value.groupId = "Выберите группу";
      }
      if (!form.value.disciplineId) {
        errors.value.disciplineId = "Выберите дисциплину";
      }
      if (!form.value.instructorId) {
        errors.value.instructorId = "Выберите инструктора";
      }
      if (!form.value.date) {
        errors.value.date = "Укажите дату занятия";
      } else if (selectedGroupInfo.value && !isRetake.value) {
        const date = form.value.date;
        if (date < selectedGroupInfo.value.startDate || date > selectedGroupInfo.value.endDate) {
          errors.value.date = "Дата должна быть в пределах периода обучения группы";
        }
      }
      if (selectedPairs.value.length === 0) {
        errors.value.time = "Выберите хотя бы один а-ч";
      }
      if (hoursWarning.value) {
        errors.value.time = "Исправьте превышение лимита часов";
      }
      if (isRetake.value && form.value.allowedStudentIds.length === 0) {
        errors.value.allowedStudentIds = "Выберите студентов для пересдачи";
      }
      return Object.keys(errors.value).length === 0;
    };
    const getSubmitDataForGroup = (pairNumbers) => {
      const sorted = [...pairNumbers].sort((a, b) => a - b);
      const first = lessonPairs.value.find((p) => p.number === sorted[0]);
      const last = lessonPairs.value.find(
        (p) => p.number === sorted[sorted.length - 1]
      );
      const startTimeStr = toLocalISOString(form.value.date, first.startTime);
      const endTimeStr = toLocalISOString(form.value.date, last.endTime);
      const title = selectedDiscipline.value?.name || "Занятие";
      const academicHours = pairNumbers.length;
      const periodDurationMinutes = parseInt(
        scheduleSettings.value.period_duration_minutes || "40",
        10
      );
      const shortBreakMinutes = parseInt(
        scheduleSettings.value.short_break_minutes || "10",
        10
      );
      let durationMinutes = pairNumbers.length * periodDurationMinutes;
      for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const previous = sorted[i - 1];
        if (current === previous + 1) {
          const currentPeriod = lessonPairs.value.find((p) => p.number === current);
          if (currentPeriod?.isAfterBreak) {
            const lunchStart = scheduleSettings.value.lunch_break_start || "13:20";
            const lunchEnd = scheduleSettings.value.lunch_break_end || "14:00";
            const lunchStartParts = lunchStart.split(":").map(Number);
            const lunchEndParts = lunchEnd.split(":").map(Number);
            const lunchDuration = (lunchEndParts[0] ?? 0) * 60 + (lunchEndParts[1] ?? 0) - ((lunchStartParts[0] ?? 0) * 60 + (lunchStartParts[1] ?? 0));
            durationMinutes += lunchDuration;
          } else {
            durationMinutes += shortBreakMinutes;
          }
        }
      }
      return {
        title,
        description: form.value.description.trim() || void 0,
        groupId: form.value.groupId,
        disciplineId: form.value.disciplineId,
        instructorId: form.value.instructorId,
        classroomId: form.value.classroomId || void 0,
        startTime: startTimeStr,
        endTime: endTimeStr,
        durationMinutes,
        // Полная длительность с перерывами
        academicHours,
        // Количество а-ч напрямую
        isAllDay: false,
        color: form.value.color,
        eventType: form.value.eventType,
        testTemplateId: form.value.testTemplateId || void 0,
        allowedStudentIds: isRetake.value && form.value.testTemplateId ? form.value.allowedStudentIds : void 0
      };
    };
    const getSubmitData = () => {
      return getSubmitDataForGroup(selectedPairs.value);
    };
    const handleSubmit = async () => {
      if (submitting.value) {
        return;
      }
      if (!validate()) {
        notification.show({
          type: "error",
          title: "Ошибка валидации",
          message: "Проверьте правильность заполнения формы"
        });
        return;
      }
      submitting.value = true;
      try {
        if (isEditMode.value && props.event) {
          const data = getSubmitData();
          console.log(
            "[Schedule] Обновление занятия:",
            JSON.stringify(data, null, 2)
          );
          const response = await authFetch(`/api/schedule/${props.event.id}`, { method: "PUT", body: data });
          if (response.success) {
            notification.show({
              type: "success",
              title: "Занятие обновлено",
              message: `Занятие "${response.event.title}" успешно обновлено`
            });
            emit("saved", response.event);
          }
        } else if (hasNonConsecutivePairs.value) {
          console.log(
            "[Schedule] Создание нескольких занятий:",
            consecutiveGroups.value
          );
          const createdEvents = [];
          for (const group of consecutiveGroups.value) {
            const data = getSubmitDataForGroup(group);
            console.log("[Schedule] Создание занятия для группы а-ч:", group, data);
            const response = await authFetch("/api/schedule", { method: "POST", body: data });
            if (response.success) {
              createdEvents.push(response.event);
            }
          }
          if (createdEvents.length > 0) {
            notification.show({
              type: "success",
              title: "Занятия созданы",
              message: `Создано ${createdEvents.length} занятий`
            });
            const lastEvent = createdEvents[createdEvents.length - 1];
            if (lastEvent) {
              emit("saved", lastEvent);
            }
          }
        } else {
          const data = getSubmitData();
          console.log(
            "[Schedule] Создание занятия:",
            JSON.stringify(data, null, 2)
          );
          const response = await authFetch("/api/schedule", { method: "POST", body: data });
          if (response.success) {
            notification.show({
              type: "success",
              title: "Занятие создано",
              message: `Занятие "${response.event.title}" успешно добавлено`
            });
            emit("saved", response.event);
          }
        }
      } catch (error) {
        console.error("Error saving event:", error);
        notification.show({
          type: "error",
          title: "Ошибка",
          message: error.data?.statusMessage || error.message || "Не удалось сохранить занятие"
        });
      } finally {
        submitting.value = false;
      }
    };
    const handleDelete = () => {
      if (!props.event) return;
      showDeleteConfirm.value = true;
    };
    const confirmDelete = async () => {
      if (!props.event) return;
      deleting.value = true;
      try {
        const response = await authFetch(
          `/api/schedule/${props.event.id}`,
          { method: "DELETE" }
        );
        if (response.success) {
          notification.show({
            type: "success",
            title: "Занятие удалено",
            message: "Занятие успешно удалено из расписания"
          });
          showDeleteConfirm.value = false;
          emit("deleted", props.event.id);
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        notification.show({
          type: "error",
          title: "Ошибка",
          message: error.data?.statusMessage || error.message || "Не удалось удалить занятие"
        });
      } finally {
        deleting.value = false;
      }
    };
    const handleClose = () => {
      emit("close");
    };
    const findMatchingPairs = (startTime, endTime) => {
      const matchingPairs = [];
      for (const pair of lessonPairs.value) {
        const pairStartParts = pair.startTime.split(":").map(Number);
        const pairEndParts = pair.endTime.split(":").map(Number);
        const pairStartMinutes = (pairStartParts[0] ?? 0) * 60 + (pairStartParts[1] ?? 0);
        const pairEndMinutes = (pairEndParts[0] ?? 0) * 60 + (pairEndParts[1] ?? 0);
        const selectedStartParts = startTime.split(":").map(Number);
        const selectedEndParts = endTime.split(":").map(Number);
        const selectedStartMinutes = (selectedStartParts[0] ?? 0) * 60 + (selectedStartParts[1] ?? 0);
        const selectedEndMinutes = (selectedEndParts[0] ?? 0) * 60 + (selectedEndParts[1] ?? 0);
        if (pairStartMinutes >= selectedStartMinutes && pairEndMinutes <= selectedEndMinutes) {
          matchingPairs.push(pair.number);
        }
      }
      return matchingPairs;
    };
    const initForm = () => {
      isFormInitializing.value = true;
      timeMode.value = "pairs";
      selectedPairs.value = [];
      hoursWarning.value = null;
      instructorHoursWarning.value = null;
      errors.value = {};
      isRetake.value = false;
      form.value.allowedStudentIds = [];
      if (props.event) {
        const startTimeStr = props.event.startTime;
        const endTimeStr = props.event.endTime;
        const datePart = startTimeStr.substring(0, 10);
        const startTimePart = startTimeStr.substring(11, 16);
        const endTimePart = endTimeStr.substring(11, 16);
        form.value = {
          groupId: props.event.groupId || "",
          disciplineId: props.event.disciplineId || "",
          instructorId: props.event.instructorId || "",
          classroomId: props.event.classroomId || "",
          eventType: props.event.eventType,
          color: props.event.color,
          date: datePart,
          startTime: startTimePart,
          endTime: endTimePart,
          description: props.event.description || "",
          testTemplateId: "",
          // Will be loaded by loadCurrentAssignment
          allowedStudentIds: props.event.allowedStudentIds || []
        };
        if (props.event.allowedStudentIds && props.event.allowedStudentIds.length > 0 || props.event.originalEventId) {
          isRetake.value = true;
        }
        const matchingPairs = findMatchingPairs(startTimePart, endTimePart);
        if (matchingPairs.length > 0) {
          timeMode.value = "pairs";
          selectedPairs.value = matchingPairs;
        } else {
          timeMode.value = "exact";
        }
        if (form.value.groupId) {
          loadGroupDisciplines(form.value.groupId, true);
          if (isRetake.value) {
            loadGroupStudents(form.value.groupId);
          }
        }
        if (form.value.eventType === "assessment") {
          loadAllActiveTemplates().then(() => {
            loadCurrentAssignment(props.event.id).then(() => {
              if (isRetake.value && form.value.groupId) {
                loadGroupStudents(form.value.groupId);
              }
            });
          });
        }
      } else {
        const now = props.defaultStart ?? /* @__PURE__ */ new Date();
        const endDate = props.defaultEnd ?? new Date(now.getTime() + 90 * 60 * 1e3);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;
        const startHours = String(now.getHours()).padStart(2, "0");
        const startMinutes = String(now.getMinutes()).padStart(2, "0");
        const startTimeStr = `${startHours}:${startMinutes}`;
        const endHours = String(endDate.getHours()).padStart(2, "0");
        const endMinutes = String(endDate.getMinutes()).padStart(2, "0");
        const endTimeStr = `${endHours}:${endMinutes}`;
        const hasTimeSelection = now.getHours() !== 0 || now.getMinutes() !== 0 || endDate.getHours() !== 0 || endDate.getMinutes() !== 0;
        form.value = {
          groupId: "",
          disciplineId: "",
          instructorId: "",
          classroomId: "",
          eventType: "theory",
          color: "primary",
          date: dateStr,
          startTime: hasTimeSelection ? startTimeStr : "",
          endTime: hasTimeSelection ? endTimeStr : "",
          description: "",
          testTemplateId: "",
          allowedStudentIds: []
        };
        disciplines.value = [];
        selectedGroupInfo.value = null;
        if (form.value.eventType === "assessment") {
          loadAllActiveTemplates();
        }
        if (hasTimeSelection) {
          const matchingPairs = findMatchingPairs(startTimeStr, endTimeStr);
          if (matchingPairs.length > 0) {
            timeMode.value = "pairs";
            selectedPairs.value = matchingPairs;
          } else {
            timeMode.value = "exact";
          }
        } else {
          timeMode.value = "pairs";
          selectedPairs.value = [];
        }
        isFormInitializing.value = false;
      }
    };
    watch(
      () => props.isOpen,
      async (isOpen) => {
        if (isOpen) {
          await loadScheduleSettings();
          await Promise.all([loadGroups(), loadClassrooms()]);
          initForm();
        }
      }
    );
    watch(
      [
        () => form.value.startTime,
        () => form.value.endTime,
        () => selectedPairs.value.length
      ],
      () => {
        validateHours();
      }
    );
    watch(
      [() => disciplines.value.length, () => form.value.disciplineId],
      ([disciplinesCount, disciplineId]) => {
        if (props.event && disciplinesCount > 0 && disciplineId && !loadingDisciplines.value && isFormInitializing.value) {
          nextTick(() => {
            isFormInitializing.value = false;
            validateHours();
          });
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1$1;
      const _component_UiConfirmModal = __nuxt_component_3$1;
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": __props.isOpen,
        title: unref(isEditMode) ? "Редактировать занятие" : "Добавить занятие",
        size: "xl",
        onClose: handleClose
      }, {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-between items-center"${_scopeId}>`);
            if (unref(isEditMode)) {
              _push2(`<button type="button" class="px-4 py-2 text-sm font-medium text-danger hover:text-danger/80 transition-colors flex items-center gap-2"${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""}${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg> Удалить </button>`);
            } else {
              _push2(`<div${_scopeId}></div>`);
            }
            _push2(`<div class="flex gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: handleClose,
              disabled: unref(submitting)
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
              onClick: handleSubmit,
              disabled: unref(submitting) || !!unref(hoursWarning) || !!unref(instructorHoursWarning)
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (unref(submitting)) {
                    _push3(`<span class="flex items-center gap-2"${_scopeId2}><svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"${_scopeId2}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId2}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId2}></path></svg> Сохранение... </span>`);
                  } else {
                    _push3(`<span${_scopeId2}>${ssrInterpolate(unref(isEditMode) ? "Сохранить" : "Добавить")}</span>`);
                  }
                } else {
                  return [
                    unref(submitting) ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "flex items-center gap-2"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "animate-spin h-4 w-4",
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
                      createTextVNode(" Сохранение... ")
                    ])) : (openBlock(), createBlock("span", { key: 1 }, toDisplayString(unref(isEditMode) ? "Сохранить" : "Добавить"), 1))
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-between items-center" }, [
                unref(isEditMode) ? (openBlock(), createBlock("button", {
                  key: 0,
                  type: "button",
                  onClick: handleDelete,
                  class: "px-4 py-2 text-sm font-medium text-danger hover:text-danger/80 transition-colors flex items-center gap-2",
                  disabled: unref(submitting)
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
                      d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    })
                  ])),
                  createTextVNode(" Удалить ")
                ], 8, ["disabled"])) : (openBlock(), createBlock("div", { key: 1 })),
                createVNode("div", { class: "flex gap-3" }, [
                  createVNode(_component_UiButton, {
                    variant: "outline",
                    onClick: handleClose,
                    disabled: unref(submitting)
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["disabled"]),
                  createVNode(_component_UiButton, {
                    onClick: handleSubmit,
                    disabled: unref(submitting) || !!unref(hoursWarning) || !!unref(instructorHoursWarning)
                  }, {
                    default: withCtx(() => [
                      unref(submitting) ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "flex items-center gap-2"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "animate-spin h-4 w-4",
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
                        createTextVNode(" Сохранение... ")
                      ])) : (openBlock(), createBlock("span", { key: 1 }, toDisplayString(unref(isEditMode) ? "Сохранить" : "Добавить"), 1))
                    ]),
                    _: 1
                  }, 8, ["disabled"])
                ])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-4"${_scopeId}><div class="grid grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><div class="flex items-center justify-between mb-1"${_scopeId}><label class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}> Группа <span class="text-danger"${_scopeId}>*</span></label>`);
            if (unref(selectedGroupInfo)) {
              _push2(`<span class="text-xs text-primary font-medium"${_scopeId}>${ssrInterpolate(formatDateShort$1(unref(selectedGroupInfo).startDate))} – ${ssrInterpolate(formatDateShort$1(unref(selectedGroupInfo).endDate))}</span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="relative"${_scopeId}><select class="${ssrRenderClass([{ "border-danger": unref(errors).groupId }, "w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"])}"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).groupId) ? ssrLooseContain(unref(form).groupId, "") : ssrLooseEqual(unref(form).groupId, "")) ? " selected" : ""}${_scopeId}>Выберите группу</option><!--[-->`);
            ssrRenderList(unref(groups), (group) => {
              _push2(`<option${ssrRenderAttr("value", group.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).groupId) ? ssrLooseContain(unref(form).groupId, group.id) : ssrLooseEqual(unref(form).groupId, group.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(group.code)} — ${ssrInterpolate(group.courseName)}</option>`);
            });
            _push2(`<!--]--></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div>`);
            if (unref(errors).groupId) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).groupId)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Дисциплина <span class="text-danger"${_scopeId}>*</span></label><div class="relative"${_scopeId}><select${ssrIncludeBooleanAttr(!unref(form).groupId || unref(loadingDisciplines)) ? " disabled" : ""} class="${ssrRenderClass([{ "border-danger": unref(errors).disciplineId }, "w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"])}"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).disciplineId) ? ssrLooseContain(unref(form).disciplineId, "") : ssrLooseEqual(unref(form).disciplineId, "")) ? " selected" : ""}${_scopeId}>${ssrInterpolate(!unref(form).groupId ? "Сначала выберите группу" : "Выберите дисциплину")}</option><!--[-->`);
            ssrRenderList(unref(disciplines), (discipline) => {
              _push2(`<option${ssrRenderAttr("value", discipline.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).disciplineId) ? ssrLooseContain(unref(form).disciplineId, discipline.id) : ssrLooseEqual(unref(form).disciplineId, discipline.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(discipline.name)}</option>`);
            });
            _push2(`<!--]--></select>`);
            if (!unref(loadingDisciplines)) {
              _push2(`<svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg>`);
            } else {
              _push2(`<div class="absolute right-3 top-1/2 -translate-y-1/2"${_scopeId}><div class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"${_scopeId}></div></div>`);
            }
            _push2(`</div>`);
            if (unref(errors).disciplineId) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).disciplineId)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div>`);
            if (unref(selectedDiscipline)) {
              _push2(`<div class="flex items-center gap-4 p-2 bg-gray-50 dark:bg-meta-4 rounded-lg text-xs"${_scopeId}><span class="text-gray-500 dark:text-gray-400"${_scopeId}>Осталось:</span><span class="${ssrRenderClass(getHoursClass("theory"))}"${_scopeId}>Теория: ${ssrInterpolate(unref(selectedDiscipline).remainingHours.theory)}/${ssrInterpolate(unref(selectedDiscipline).totalHours.theory)}ч</span><span class="${ssrRenderClass(getHoursClass("practice"))}"${_scopeId}>Практика: ${ssrInterpolate(unref(selectedDiscipline).remainingHours.practice)}/${ssrInterpolate(unref(selectedDiscipline).totalHours.practice)}ч</span><span class="${ssrRenderClass(getHoursClass("assessment"))}"${_scopeId}>Проверка: ${ssrInterpolate(unref(selectedDiscipline).remainingHours.assessment)}/${ssrInterpolate(unref(selectedDiscipline).totalHours.assessment)}ч</span></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="grid grid-cols-3 gap-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Инструктор <span class="text-danger"${_scopeId}>*</span></label><div class="relative"${_scopeId}><select${ssrIncludeBooleanAttr(!unref(form).disciplineId) ? " disabled" : ""} class="${ssrRenderClass([{ "border-danger": unref(errors).instructorId }, "w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"])}"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).instructorId) ? ssrLooseContain(unref(form).instructorId, "") : ssrLooseEqual(unref(form).instructorId, "")) ? " selected" : ""}${_scopeId}>${ssrInterpolate(!unref(form).disciplineId ? "Сначала дисциплину" : "Выберите")}</option><!--[-->`);
            ssrRenderList(unref(disciplineInstructors), (instructor) => {
              _push2(`<option${ssrRenderAttr("value", instructor.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).instructorId) ? ssrLooseContain(unref(form).instructorId, instructor.id) : ssrLooseEqual(unref(form).instructorId, instructor.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(instructor.fullName)}${ssrInterpolate(instructor.isPrimary ? " ★" : "")}</option>`);
            });
            _push2(`<!--]--></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div>`);
            if (unref(errors).instructorId) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).instructorId)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Тип <span class="text-danger"${_scopeId}>*</span></label><div class="relative"${_scopeId}><select class="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"${_scopeId}><option value="theory"${ssrIncludeBooleanAttr(Array.isArray(unref(form).eventType) ? ssrLooseContain(unref(form).eventType, "theory") : ssrLooseEqual(unref(form).eventType, "theory")) ? " selected" : ""}${_scopeId}>Теория</option><option value="practice"${ssrIncludeBooleanAttr(Array.isArray(unref(form).eventType) ? ssrLooseContain(unref(form).eventType, "practice") : ssrLooseEqual(unref(form).eventType, "practice")) ? " selected" : ""}${_scopeId}>Практика</option><option value="assessment"${ssrIncludeBooleanAttr(Array.isArray(unref(form).eventType) ? ssrLooseContain(unref(form).eventType, "assessment") : ssrLooseEqual(unref(form).eventType, "assessment")) ? " selected" : ""}${_scopeId}>Проверка знаний</option></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}>Цвет</label><div class="flex gap-2 py-1.5"${_scopeId}><!--[-->`);
            ssrRenderList(colorOptions, (color) => {
              _push2(`<button type="button" class="${ssrRenderClass([[
                color.bg,
                unref(form).color === color.value ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-boxdark" : ""
              ], "w-7 h-7 rounded-full transition-transform hover:scale-110"])}"${ssrRenderAttr("title", color.label)}${_scopeId}></button>`);
            });
            _push2(`<!--]--></div></div></div>`);
            if (unref(form).eventType === "assessment") {
              _push2(`<div class="rounded-lg border border-primary/30 bg-primary/5 p-4"${_scopeId}><div class="flex items-center gap-2 mb-3"${_scopeId}><div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"${_scopeId}><svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"${_scopeId}></path></svg></div><div${_scopeId}><h4 class="text-sm font-medium text-gray-900 dark:text-white"${_scopeId}> Тестирование </h4><p class="text-xs text-gray-500 dark:text-gray-400"${_scopeId}> Выберите тест для проведения контроля знаний </p></div></div><div class="relative"${_scopeId}><select class="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary text-sm"${ssrIncludeBooleanAttr(unref(loadingTemplates)) ? " disabled" : ""}${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).testTemplateId) ? ssrLooseContain(unref(form).testTemplateId, "") : ssrLooseEqual(unref(form).testTemplateId, "")) ? " selected" : ""}${_scopeId}>Без теста (только запись в расписании)</option><!--[-->`);
              ssrRenderList(unref(allTestTemplates), (template) => {
                _push2(`<option${ssrRenderAttr("value", template.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).testTemplateId) ? ssrLooseContain(unref(form).testTemplateId, template.id) : ssrLooseEqual(unref(form).testTemplateId, template.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(template.name)} (${ssrInterpolate(template.code)}) </option>`);
              });
              _push2(`<!--]--></select>`);
              if (unref(loadingTemplates)) {
                _push2(`<div class="absolute right-3 top-1/2 -translate-y-1/2"${_scopeId}><div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"${_scopeId}></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
              if (!unref(form).testTemplateId) {
                _push2(`<p class="mt-2 text-xs text-warning"${_scopeId}> Внимание: Тест не выбран. Студенты не смогут пройти тестирование онлайн. </p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="grid grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Дата <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", unref(form).date)} type="date"${ssrRenderAttr("min", !unref(isRetake) ? unref(selectedGroupInfo)?.startDate : void 0)}${ssrRenderAttr("max", !unref(isRetake) ? unref(selectedGroupInfo)?.endDate : void 0)} class="${ssrRenderClass([{ "border-danger": unref(errors).date }, "w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary text-sm"])}"${_scopeId}>`);
            if (unref(errors).date) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).date)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}>Аудитория</label><div class="relative"${_scopeId}><select class="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).classroomId) ? ssrLooseContain(unref(form).classroomId, "") : ssrLooseEqual(unref(form).classroomId, "")) ? " selected" : ""}${_scopeId}>Не выбрана</option><!--[-->`);
            ssrRenderList(unref(classrooms), (classroom) => {
              _push2(`<option${ssrRenderAttr("value", classroom.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).classroomId) ? ssrLooseContain(unref(form).classroomId, classroom.id) : ssrLooseEqual(unref(form).classroomId, classroom.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(classroom.name)} (${ssrInterpolate(classroom.capacity)} мест) </option>`);
            });
            _push2(`<!--]--></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div></div><div${_scopeId}><div class="flex items-center justify-between mb-2"${_scopeId}><label class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}> Время <span class="text-danger"${_scopeId}>*</span></label></div><div${_scopeId}><div class="grid grid-cols-4 gap-1.5"${_scopeId}><!--[-->`);
            ssrRenderList(unref(lessonPairs), (pair) => {
              _push2(`<label class="${ssrRenderClass([[
                unref(selectedPairs).includes(pair.number) ? "border-primary bg-primary/10" : "border-stroke dark:border-strokedark hover:border-primary/50"
              ], "relative flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all text-center"])}"${_scopeId}><input type="checkbox"${ssrRenderAttr("value", pair.number)}${ssrIncludeBooleanAttr(Array.isArray(unref(selectedPairs)) ? ssrLooseContain(unref(selectedPairs), pair.number) : unref(selectedPairs)) ? " checked" : ""} class="sr-only"${_scopeId}><div${_scopeId}><div class="text-xs font-medium"${_scopeId}>${ssrInterpolate(pair.number)} а-ч</div><div class="text-[10px] text-gray-500"${_scopeId}>${ssrInterpolate(pair.startTime)}-${ssrInterpolate(pair.endTime)}</div></div>`);
              if (unref(selectedPairs).includes(pair.number)) {
                _push2(`<div class="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center"${_scopeId}><svg class="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"${_scopeId}></path></svg></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</label>`);
            });
            _push2(`<!--]--></div>`);
            if (unref(selectedPairs).length > 0) {
              _push2(`<div class="mt-2 p-2 bg-success/10 rounded text-xs"${_scopeId}><span class="font-medium"${_scopeId}>Выбрано:</span> ${ssrInterpolate(unref(selectedPairs).length)} ${ssrInterpolate(getAcademicHourWord(unref(selectedPairs).length))} • ${ssrInterpolate(unref(computedTimeRange))} `);
              if (unref(hasNonConsecutivePairs)) {
                _push2(`<span class="text-warning ml-2"${_scopeId}>(будет создано ${ssrInterpolate(unref(consecutiveGroups).length)} занятия)</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (unref(errors).time) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).time)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(hoursWarning)) {
              _push2(`<div class="mt-2 p-2 bg-warning/10 rounded-lg border border-warning/30 flex items-start gap-2"${_scopeId}><svg class="w-4 h-4 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><p class="text-xs text-warning"${_scopeId}>${ssrInterpolate(unref(hoursWarning))}</p></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(instructorHoursWarning)) {
              _push2(`<div class="mt-2 p-2 bg-danger/10 rounded-lg border border-danger/30 flex items-start gap-2"${_scopeId}><svg class="w-4 h-4 text-danger shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><div${_scopeId}><p class="text-xs text-danger font-medium"${_scopeId}> Лимит часов инструктора </p><p class="text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(instructorHoursWarning))}</p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(instructorHoursCheckLoading)) {
              _push2(`<div class="mt-2 flex items-center gap-2 text-xs text-gray-500"${_scopeId}><div class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"${_scopeId}></div><span${_scopeId}>Проверка лимита часов инструктора...</span></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}>Заметки</label><input${ssrRenderAttr("value", unref(form).description)} type="text" class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 text-sm" placeholder="Доп. информация о занятии..."${_scopeId}></div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(handleSubmit, ["prevent"]),
                class: "space-y-4"
              }, [
                createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                  createVNode("div", null, [
                    createVNode("div", { class: "flex items-center justify-between mb-1" }, [
                      createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, [
                        createTextVNode(" Группа "),
                        createVNode("span", { class: "text-danger" }, "*")
                      ]),
                      unref(selectedGroupInfo) ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "text-xs text-primary font-medium"
                      }, toDisplayString(formatDateShort$1(unref(selectedGroupInfo).startDate)) + " – " + toDisplayString(formatDateShort$1(unref(selectedGroupInfo).endDate)), 1)) : createCommentVNode("", true)
                    ]),
                    createVNode("div", { class: "relative" }, [
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => unref(form).groupId = $event,
                        onChange: handleGroupChange,
                        class: ["w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm", { "border-danger": unref(errors).groupId }]
                      }, [
                        createVNode("option", { value: "" }, "Выберите группу"),
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(groups), (group) => {
                          return openBlock(), createBlock("option", {
                            key: group.id,
                            value: group.id
                          }, toDisplayString(group.code) + " — " + toDisplayString(group.courseName), 9, ["value"]);
                        }), 128))
                      ], 42, ["onUpdate:modelValue"]), [
                        [vModelSelect, unref(form).groupId]
                      ]),
                      (openBlock(), createBlock("svg", {
                        class: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
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
                    unref(errors).groupId ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-xs text-danger"
                    }, toDisplayString(unref(errors).groupId), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, [
                      createTextVNode(" Дисциплина "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    createVNode("div", { class: "relative" }, [
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => unref(form).disciplineId = $event,
                        onChange: handleDisciplineChange,
                        disabled: !unref(form).groupId || unref(loadingDisciplines),
                        class: ["w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none disabled:opacity-50 disabled:cursor-not-allowed text-sm", { "border-danger": unref(errors).disciplineId }]
                      }, [
                        createVNode("option", { value: "" }, toDisplayString(!unref(form).groupId ? "Сначала выберите группу" : "Выберите дисциплину"), 1),
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(disciplines), (discipline) => {
                          return openBlock(), createBlock("option", {
                            key: discipline.id,
                            value: discipline.id
                          }, toDisplayString(discipline.name), 9, ["value"]);
                        }), 128))
                      ], 42, ["onUpdate:modelValue", "disabled"]), [
                        [vModelSelect, unref(form).disciplineId]
                      ]),
                      !unref(loadingDisciplines) ? (openBlock(), createBlock("svg", {
                        key: 0,
                        class: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
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
                      ])) : (openBlock(), createBlock("div", {
                        key: 1,
                        class: "absolute right-3 top-1/2 -translate-y-1/2"
                      }, [
                        createVNode("div", { class: "inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" })
                      ]))
                    ]),
                    unref(errors).disciplineId ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-xs text-danger"
                    }, toDisplayString(unref(errors).disciplineId), 1)) : createCommentVNode("", true)
                  ])
                ]),
                unref(selectedDiscipline) ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "flex items-center gap-4 p-2 bg-gray-50 dark:bg-meta-4 rounded-lg text-xs"
                }, [
                  createVNode("span", { class: "text-gray-500 dark:text-gray-400" }, "Осталось:"),
                  createVNode("span", {
                    class: getHoursClass("theory")
                  }, "Теория: " + toDisplayString(unref(selectedDiscipline).remainingHours.theory) + "/" + toDisplayString(unref(selectedDiscipline).totalHours.theory) + "ч", 3),
                  createVNode("span", {
                    class: getHoursClass("practice")
                  }, "Практика: " + toDisplayString(unref(selectedDiscipline).remainingHours.practice) + "/" + toDisplayString(unref(selectedDiscipline).totalHours.practice) + "ч", 3),
                  createVNode("span", {
                    class: getHoursClass("assessment")
                  }, "Проверка: " + toDisplayString(unref(selectedDiscipline).remainingHours.assessment) + "/" + toDisplayString(unref(selectedDiscipline).totalHours.assessment) + "ч", 3)
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "grid grid-cols-3 gap-4" }, [
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, [
                      createTextVNode(" Инструктор "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    createVNode("div", { class: "relative" }, [
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => unref(form).instructorId = $event,
                        disabled: !unref(form).disciplineId,
                        class: ["w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none disabled:opacity-50 disabled:cursor-not-allowed text-sm", { "border-danger": unref(errors).instructorId }]
                      }, [
                        createVNode("option", { value: "" }, toDisplayString(!unref(form).disciplineId ? "Сначала дисциплину" : "Выберите"), 1),
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(disciplineInstructors), (instructor) => {
                          return openBlock(), createBlock("option", {
                            key: instructor.id,
                            value: instructor.id
                          }, toDisplayString(instructor.fullName) + toDisplayString(instructor.isPrimary ? " ★" : ""), 9, ["value"]);
                        }), 128))
                      ], 10, ["onUpdate:modelValue", "disabled"]), [
                        [vModelSelect, unref(form).instructorId]
                      ]),
                      (openBlock(), createBlock("svg", {
                        class: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
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
                    unref(errors).instructorId ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-xs text-danger"
                    }, toDisplayString(unref(errors).instructorId), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, [
                      createTextVNode(" Тип "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    createVNode("div", { class: "relative" }, [
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => unref(form).eventType = $event,
                        onChange: handleEventTypeChange,
                        class: "w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
                      }, [
                        createVNode("option", { value: "theory" }, "Теория"),
                        createVNode("option", { value: "practice" }, "Практика"),
                        createVNode("option", { value: "assessment" }, "Проверка знаний")
                      ], 40, ["onUpdate:modelValue"]), [
                        [vModelSelect, unref(form).eventType]
                      ]),
                      (openBlock(), createBlock("svg", {
                        class: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
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
                    ])
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, "Цвет"),
                    createVNode("div", { class: "flex gap-2 py-1.5" }, [
                      (openBlock(), createBlock(Fragment, null, renderList(colorOptions, (color) => {
                        return createVNode("button", {
                          key: color.value,
                          type: "button",
                          onClick: ($event) => unref(form).color = color.value,
                          class: ["w-7 h-7 rounded-full transition-transform hover:scale-110", [
                            color.bg,
                            unref(form).color === color.value ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-boxdark" : ""
                          ]],
                          title: color.label
                        }, null, 10, ["onClick", "title"]);
                      }), 64))
                    ])
                  ])
                ]),
                unref(form).eventType === "assessment" ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "rounded-lg border border-primary/30 bg-primary/5 p-4"
                }, [
                  createVNode("div", { class: "flex items-center gap-2 mb-3" }, [
                    createVNode("div", { class: "flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 text-primary",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        })
                      ]))
                    ]),
                    createVNode("div", null, [
                      createVNode("h4", { class: "text-sm font-medium text-gray-900 dark:text-white" }, " Тестирование "),
                      createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, " Выберите тест для проведения контроля знаний ")
                    ])
                  ]),
                  createVNode("div", { class: "relative" }, [
                    withDirectives(createVNode("select", {
                      "onUpdate:modelValue": ($event) => unref(form).testTemplateId = $event,
                      class: "w-full rounded-lg border border-stroke bg-white px-4 py-2.5 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary text-sm",
                      disabled: unref(loadingTemplates)
                    }, [
                      createVNode("option", { value: "" }, "Без теста (только запись в расписании)"),
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(allTestTemplates), (template) => {
                        return openBlock(), createBlock("option", {
                          key: template.id,
                          value: template.id
                        }, toDisplayString(template.name) + " (" + toDisplayString(template.code) + ") ", 9, ["value"]);
                      }), 128))
                    ], 8, ["onUpdate:modelValue", "disabled"]), [
                      [vModelSelect, unref(form).testTemplateId]
                    ]),
                    unref(loadingTemplates) ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "absolute right-3 top-1/2 -translate-y-1/2"
                    }, [
                      createVNode("div", { class: "h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" })
                    ])) : createCommentVNode("", true)
                  ]),
                  !unref(form).testTemplateId ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-2 text-xs text-warning"
                  }, " Внимание: Тест не выбран. Студенты не смогут пройти тестирование онлайн. ")) : createCommentVNode("", true)
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, [
                      createTextVNode(" Дата "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => unref(form).date = $event,
                      type: "date",
                      min: !unref(isRetake) ? unref(selectedGroupInfo)?.startDate : void 0,
                      max: !unref(isRetake) ? unref(selectedGroupInfo)?.endDate : void 0,
                      class: ["w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary text-sm", { "border-danger": unref(errors).date }]
                    }, null, 10, ["onUpdate:modelValue", "min", "max"]), [
                      [vModelText, unref(form).date]
                    ]),
                    unref(errors).date ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-xs text-danger"
                    }, toDisplayString(unref(errors).date), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, "Аудитория"),
                    createVNode("div", { class: "relative" }, [
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => unref(form).classroomId = $event,
                        class: "w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
                      }, [
                        createVNode("option", { value: "" }, "Не выбрана"),
                        (openBlock(true), createBlock(Fragment, null, renderList(unref(classrooms), (classroom) => {
                          return openBlock(), createBlock("option", {
                            key: classroom.id,
                            value: classroom.id
                          }, toDisplayString(classroom.name) + " (" + toDisplayString(classroom.capacity) + " мест) ", 9, ["value"]);
                        }), 128))
                      ], 8, ["onUpdate:modelValue"]), [
                        [vModelSelect, unref(form).classroomId]
                      ]),
                      (openBlock(), createBlock("svg", {
                        class: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
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
                    ])
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("div", { class: "flex items-center justify-between mb-2" }, [
                    createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, [
                      createTextVNode(" Время "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ])
                  ]),
                  createVNode("div", null, [
                    createVNode("div", { class: "grid grid-cols-4 gap-1.5" }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(lessonPairs), (pair) => {
                        return openBlock(), createBlock("label", {
                          key: pair.number,
                          class: ["relative flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all text-center", [
                            unref(selectedPairs).includes(pair.number) ? "border-primary bg-primary/10" : "border-stroke dark:border-strokedark hover:border-primary/50"
                          ]]
                        }, [
                          withDirectives(createVNode("input", {
                            type: "checkbox",
                            value: pair.number,
                            "onUpdate:modelValue": ($event) => isRef(selectedPairs) ? selectedPairs.value = $event : null,
                            onChange: handlePairChange,
                            class: "sr-only"
                          }, null, 40, ["value", "onUpdate:modelValue"]), [
                            [vModelCheckbox, unref(selectedPairs)]
                          ]),
                          createVNode("div", null, [
                            createVNode("div", { class: "text-xs font-medium" }, toDisplayString(pair.number) + " а-ч", 1),
                            createVNode("div", { class: "text-[10px] text-gray-500" }, toDisplayString(pair.startTime) + "-" + toDisplayString(pair.endTime), 1)
                          ]),
                          unref(selectedPairs).includes(pair.number) ? (openBlock(), createBlock("div", {
                            key: 0,
                            class: "absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center"
                          }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-2 h-2 text-white",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "3",
                                d: "M5 13l4 4L19 7"
                              })
                            ]))
                          ])) : createCommentVNode("", true)
                        ], 2);
                      }), 128))
                    ]),
                    unref(selectedPairs).length > 0 ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "mt-2 p-2 bg-success/10 rounded text-xs"
                    }, [
                      createVNode("span", { class: "font-medium" }, "Выбрано:"),
                      createTextVNode(" " + toDisplayString(unref(selectedPairs).length) + " " + toDisplayString(getAcademicHourWord(unref(selectedPairs).length)) + " • " + toDisplayString(unref(computedTimeRange)) + " ", 1),
                      unref(hasNonConsecutivePairs) ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "text-warning ml-2"
                      }, "(будет создано " + toDisplayString(unref(consecutiveGroups).length) + " занятия)", 1)) : createCommentVNode("", true)
                    ])) : createCommentVNode("", true)
                  ]),
                  unref(errors).time ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-xs text-danger"
                  }, toDisplayString(unref(errors).time), 1)) : createCommentVNode("", true),
                  unref(hoursWarning) ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "mt-2 p-2 bg-warning/10 rounded-lg border border-warning/30 flex items-start gap-2"
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-4 h-4 text-warning shrink-0 mt-0.5",
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
                    createVNode("p", { class: "text-xs text-warning" }, toDisplayString(unref(hoursWarning)), 1)
                  ])) : createCommentVNode("", true),
                  unref(instructorHoursWarning) ? (openBlock(), createBlock("div", {
                    key: 2,
                    class: "mt-2 p-2 bg-danger/10 rounded-lg border border-danger/30 flex items-start gap-2"
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-4 h-4 text-danger shrink-0 mt-0.5",
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
                      createVNode("p", { class: "text-xs text-danger font-medium" }, " Лимит часов инструктора "),
                      createVNode("p", { class: "text-xs text-danger" }, toDisplayString(unref(instructorHoursWarning)), 1)
                    ])
                  ])) : createCommentVNode("", true),
                  unref(instructorHoursCheckLoading) ? (openBlock(), createBlock("div", {
                    key: 3,
                    class: "mt-2 flex items-center gap-2 text-xs text-gray-500"
                  }, [
                    createVNode("div", { class: "inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" }),
                    createVNode("span", null, "Проверка лимита часов инструктора...")
                  ])) : createCommentVNode("", true)
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, "Заметки"),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => unref(form).description = $event,
                    type: "text",
                    class: "w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 text-sm",
                    placeholder: "Доп. информация о занятии..."
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(form).description]
                  ])
                ])
              ], 32)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": unref(showDeleteConfirm),
        variant: "danger",
        title: "Удалить занятие?",
        message: `Вы уверены, что хотите удалить это занятие?`,
        warning: "Это действие нельзя отменить.",
        "confirm-text": "Удалить",
        "cancel-text": "Отмена",
        loading: unref(deleting),
        onConfirm: confirmDelete,
        onCancel: ($event) => showDeleteConfirm.value = false
      }, null, _parent));
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/schedule/EventModal.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$9, { __name: "ScheduleEventModal" });
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  __name: "RetakeModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    originalEvent: {},
    students: {},
    retakeEvent: {}
  },
  emits: ["close", "created", "updated"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const { success, error: showError } = useNotification();
    const eventTypeLabels = {
      theory: "Теория",
      practice: "Практика",
      assessment: "Проверка знаний",
      other: "Другое"
    };
    const isEditMode = computed(() => !!props.retakeEvent);
    const form = reactive({
      studentIds: [],
      date: "",
      startTime: "",
      endTime: "",
      instructorId: "",
      classroomId: ""
    });
    const errors = reactive({
      studentIds: "",
      date: "",
      startTime: "",
      endTime: "",
      instructorId: ""
    });
    const submitting = ref(false);
    const loadingStudents = ref(false);
    const students = ref([]);
    const instructors = ref([]);
    const classrooms = ref([]);
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    };
    const formatTime = (dateString) => {
      return new Date(dateString).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const loadData = async () => {
      if (!props.originalEvent) return;
      loadingStudents.value = true;
      try {
        if (props.students && props.students.length > 0) {
          students.value = props.students.map((s) => ({
            id: s.id,
            label: s.fullName,
            description: s.grade !== void 0 ? `Оценка: ${s.grade}%${s.grade < 60 ? " (Не сдал)" : ""}` : void 0,
            grade: s.grade
          }));
        } else {
          const groupResponse = await authFetch(`/api/groups/${props.originalEvent.groupId}`);
          if (groupResponse.success && groupResponse.group?.students) {
            students.value = groupResponse.group.students.map((s) => {
              const student = s.student || {};
              const fullName = student.fullName || s.fullName || "Студент";
              const grade = s.grade;
              const description = grade !== void 0 ? `Оценка: ${grade}%${grade < 60 ? " (Не сдал)" : ""}` : void 0;
              return {
                id: s.studentId || s.id,
                label: fullName,
                description,
                grade
              };
            });
          }
        }
        const instructorsResponse = await authFetch("/api/instructors");
        if (instructorsResponse.success) {
          instructors.value = instructorsResponse.instructors.map((i) => ({
            id: i.id,
            fullName: i.fullName
          }));
        }
        const classroomsResponse = await authFetch("/api/classrooms");
        if (classroomsResponse.success) {
          classrooms.value = classroomsResponse.classrooms.map((c) => ({
            id: c.id,
            name: c.name
          }));
        }
        if (props.originalEvent.instructorId) {
          form.instructorId = props.originalEvent.instructorId;
        }
        if (props.originalEvent.classroomId) {
          form.classroomId = props.originalEvent.classroomId;
        }
        if (isEditMode.value && props.retakeEvent) {
          const retakeStart = new Date(props.retakeEvent.startTime);
          const retakeEnd = new Date(props.retakeEvent.endTime);
          form.date = retakeStart.toISOString().split("T")[0] || "";
          form.startTime = retakeStart.toTimeString().slice(0, 5);
          form.endTime = retakeEnd.toTimeString().slice(0, 5);
          form.instructorId = props.retakeEvent.instructorId || "";
          form.classroomId = props.retakeEvent.classroomId || "";
          form.studentIds = props.retakeEvent.allowedStudentIds || [];
        } else {
          const originalStart = new Date(props.originalEvent.startTime);
          const originalEnd = new Date(props.originalEvent.endTime);
          form.startTime = originalStart.toTimeString().slice(0, 5);
          form.endTime = originalEnd.toTimeString().slice(0, 5);
          const tomorrow = /* @__PURE__ */ new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          form.date = tomorrow.toISOString().split("T")[0] || "";
          form.studentIds = students.value.filter((s) => s.grade !== void 0 && s.grade < 60).map((s) => s.id);
        }
      } catch (err) {
        console.error("[RetakeModal] Error loading data:", err);
        showError("Ошибка загрузки данных");
      } finally {
        loadingStudents.value = false;
      }
    };
    const selectAllStudents = () => {
      form.studentIds = students.value.map((s) => s.id);
    };
    const clearStudents = () => {
      form.studentIds = [];
    };
    const validate = () => {
      let isValid = true;
      errors.studentIds = "";
      errors.date = "";
      errors.startTime = "";
      errors.endTime = "";
      errors.instructorId = "";
      if (form.studentIds.length === 0) {
        errors.studentIds = "Выберите хотя бы одного студента";
        isValid = false;
      }
      if (!form.date) {
        errors.date = "Укажите дату";
        isValid = false;
      }
      if (!form.startTime) {
        errors.startTime = "Укажите время начала";
        isValid = false;
      }
      if (!form.endTime) {
        errors.endTime = "Укажите время окончания";
        isValid = false;
      }
      if (form.startTime && form.endTime && form.startTime >= form.endTime) {
        errors.endTime = "Время окончания должно быть больше времени начала";
        isValid = false;
      }
      if (!form.instructorId) {
        errors.instructorId = "Выберите преподавателя";
        isValid = false;
      }
      return isValid;
    };
    const handleSubmit = async () => {
      if (!validate()) return;
      submitting.value = true;
      try {
        if (isEditMode.value && props.retakeEvent) {
          const startDateTime = `${form.date}T${form.startTime}:00`;
          const endDateTime = `${form.date}T${form.endTime}:00`;
          const response = await authFetch(`/api/schedule/${props.retakeEvent.id}`, {
            method: "PUT",
            body: {
              startTime: startDateTime,
              endTime: endDateTime,
              instructorId: form.instructorId,
              classroomId: form.classroomId || null,
              allowedStudentIds: form.studentIds
            }
          });
          if (response.success) {
            success("Пересдача обновлена");
            emit("updated");
            handleClose();
          } else {
            showError(response.message || "Ошибка обновления пересдачи");
          }
        } else {
          if (!props.originalEvent) return;
          const response = await authFetch("/api/schedule/retake", {
            method: "POST",
            body: {
              originalEventId: props.originalEvent.id,
              studentIds: form.studentIds,
              date: form.date,
              startTime: form.startTime,
              endTime: form.endTime,
              instructorId: form.instructorId,
              classroomId: form.classroomId || void 0
            }
          });
          if (response.success) {
            success(response.message || "Пересдача создана");
            emit("created", response.retakeEventId);
            handleClose();
          } else {
            showError(response.message || "Ошибка создания пересдачи");
          }
        }
      } catch (err) {
        console.error("[RetakeModal] Submit error:", err);
        showError(err.data?.message || err.message || (isEditMode.value ? "Ошибка обновления пересдачи" : "Ошибка создания пересдачи"));
      } finally {
        submitting.value = false;
      }
    };
    const handleClose = () => {
      form.studentIds = [];
      form.date = "";
      form.startTime = "";
      form.endTime = "";
      form.instructorId = "";
      form.classroomId = "";
      errors.studentIds = "";
      errors.date = "";
      errors.startTime = "";
      errors.endTime = "";
      errors.instructorId = "";
      emit("close");
    };
    watch(
      () => props.isOpen,
      (newValue) => {
        if (newValue) {
          loadData();
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1$1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: unref(isEditMode) ? "Редактировать пересдачу" : "Создать пересдачу",
        size: "lg",
        onClose: handleClose
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-5"${_scopeId}>`);
            if (__props.originalEvent) {
              _push2(`<div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"${_scopeId}><div class="flex items-center gap-3 mb-2"${_scopeId}><div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"${_scopeId}><svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"${_scopeId}></path></svg></div><div${_scopeId}><p class="text-sm font-medium text-gray-900 dark:text-white"${_scopeId}> Оригинальное занятие </p><p class="text-xs text-gray-500 dark:text-gray-400"${_scopeId}>${ssrInterpolate(__props.originalEvent.title)}</p></div></div><div class="grid grid-cols-3 gap-4 text-sm"${_scopeId}><div${_scopeId}><span class="text-gray-500 dark:text-gray-400"${_scopeId}>Дата:</span><span class="ml-1 font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(formatDate(__props.originalEvent.startTime))}</span></div><div${_scopeId}><span class="text-gray-500 dark:text-gray-400"${_scopeId}>Время:</span><span class="ml-1 font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(formatTime(__props.originalEvent.startTime))} - ${ssrInterpolate(formatTime(__props.originalEvent.endTime))}</span></div><div${_scopeId}><span class="text-gray-500 dark:text-gray-400"${_scopeId}>Тип:</span><span class="ml-1 font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(eventTypeLabels[__props.originalEvent.eventType])}</span></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div${_scopeId}><div class="flex items-center justify-between mb-2"${_scopeId}><label class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}> Студенты для пересдачи <span class="text-danger"${_scopeId}>*</span></label><div class="flex items-center gap-2"${_scopeId}><button type="button" class="text-xs text-primary hover:underline"${_scopeId}> Выбрать всех </button><span class="text-gray-300"${_scopeId}>|</span><button type="button" class="text-xs text-primary hover:underline"${_scopeId}> Снять выбор </button></div></div>`);
            _push2(ssrRenderComponent(__nuxt_component_1$2, {
              modelValue: unref(form).studentIds,
              "onUpdate:modelValue": ($event) => unref(form).studentIds = $event,
              options: unref(students),
              placeholder: "Выберите студентов",
              searchable: ""
            }, null, _parent2, _scopeId));
            if (unref(loadingStudents)) {
              _push2(`<p class="mt-1 text-xs text-primary"${_scopeId}> Загрузка студентов... </p>`);
            } else {
              _push2(`<p class="mt-1 text-xs text-gray-500 dark:text-gray-400"${_scopeId}> Выбрано: ${ssrInterpolate(unref(form).studentIds.length)} из ${ssrInterpolate(unref(students).length)}</p>`);
            }
            if (unref(errors).studentIds) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).studentIds)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="grid grid-cols-3 gap-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Дата <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", unref(form).date)} type="date" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"${_scopeId}>`);
            if (unref(errors).date) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).date)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Начало <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", unref(form).startTime)} type="time" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"${_scopeId}>`);
            if (unref(errors).startTime) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).startTime)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Окончание <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", unref(form).endTime)} type="time" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"${_scopeId}>`);
            if (unref(errors).endTime) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).endTime)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Преподаватель <span class="text-danger"${_scopeId}>*</span></label><select class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).instructorId) ? ssrLooseContain(unref(form).instructorId, "") : ssrLooseEqual(unref(form).instructorId, "")) ? " selected" : ""}${_scopeId}>Выберите преподавателя</option><!--[-->`);
            ssrRenderList(unref(instructors), (instructor) => {
              _push2(`<option${ssrRenderAttr("value", instructor.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).instructorId) ? ssrLooseContain(unref(form).instructorId, instructor.id) : ssrLooseEqual(unref(form).instructorId, instructor.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(instructor.fullName)}</option>`);
            });
            _push2(`<!--]--></select>`);
            if (unref(errors).instructorId) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).instructorId)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Аудитория </label><select class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).classroomId) ? ssrLooseContain(unref(form).classroomId, "") : ssrLooseEqual(unref(form).classroomId, "")) ? " selected" : ""}${_scopeId}>Не указана</option><!--[-->`);
            ssrRenderList(unref(classrooms), (classroom) => {
              _push2(`<option${ssrRenderAttr("value", classroom.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).classroomId) ? ssrLooseContain(unref(form).classroomId, classroom.id) : ssrLooseEqual(unref(form).classroomId, classroom.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(classroom.name)}</option>`);
            });
            _push2(`<!--]--></select></div><div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              type: "button",
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
              variant: "primary",
              type: "submit",
              loading: unref(submitting),
              disabled: unref(form).studentIds.length === 0
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"${_scopeId2}></path></svg> ${ssrInterpolate(unref(isEditMode) ? "Сохранить изменения" : "Создать пересдачу")}`);
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
                        d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                      })
                    ])),
                    createTextVNode(" " + toDisplayString(unref(isEditMode) ? "Сохранить изменения" : "Создать пересдачу"), 1)
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
                class: "space-y-5"
              }, [
                __props.originalEvent ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                }, [
                  createVNode("div", { class: "flex items-center gap-3 mb-2" }, [
                    createVNode("div", { class: "w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-orange-600 dark:text-orange-400",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        })
                      ]))
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-sm font-medium text-gray-900 dark:text-white" }, " Оригинальное занятие "),
                      createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, toDisplayString(__props.originalEvent.title), 1)
                    ])
                  ]),
                  createVNode("div", { class: "grid grid-cols-3 gap-4 text-sm" }, [
                    createVNode("div", null, [
                      createVNode("span", { class: "text-gray-500 dark:text-gray-400" }, "Дата:"),
                      createVNode("span", { class: "ml-1 font-medium text-gray-900 dark:text-white" }, toDisplayString(formatDate(__props.originalEvent.startTime)), 1)
                    ]),
                    createVNode("div", null, [
                      createVNode("span", { class: "text-gray-500 dark:text-gray-400" }, "Время:"),
                      createVNode("span", { class: "ml-1 font-medium text-gray-900 dark:text-white" }, toDisplayString(formatTime(__props.originalEvent.startTime)) + " - " + toDisplayString(formatTime(__props.originalEvent.endTime)), 1)
                    ]),
                    createVNode("div", null, [
                      createVNode("span", { class: "text-gray-500 dark:text-gray-400" }, "Тип:"),
                      createVNode("span", { class: "ml-1 font-medium text-gray-900 dark:text-white" }, toDisplayString(eventTypeLabels[__props.originalEvent.eventType]), 1)
                    ])
                  ])
                ])) : createCommentVNode("", true),
                createVNode("div", null, [
                  createVNode("div", { class: "flex items-center justify-between mb-2" }, [
                    createVNode("label", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, [
                      createTextVNode(" Студенты для пересдачи "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    createVNode("div", { class: "flex items-center gap-2" }, [
                      createVNode("button", {
                        type: "button",
                        class: "text-xs text-primary hover:underline",
                        onClick: selectAllStudents
                      }, " Выбрать всех "),
                      createVNode("span", { class: "text-gray-300" }, "|"),
                      createVNode("button", {
                        type: "button",
                        class: "text-xs text-primary hover:underline",
                        onClick: clearStudents
                      }, " Снять выбор ")
                    ])
                  ]),
                  createVNode(__nuxt_component_1$2, {
                    modelValue: unref(form).studentIds,
                    "onUpdate:modelValue": ($event) => unref(form).studentIds = $event,
                    options: unref(students),
                    placeholder: "Выберите студентов",
                    searchable: ""
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"]),
                  unref(loadingStudents) ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-xs text-primary"
                  }, " Загрузка студентов... ")) : (openBlock(), createBlock("p", {
                    key: 1,
                    class: "mt-1 text-xs text-gray-500 dark:text-gray-400"
                  }, " Выбрано: " + toDisplayString(unref(form).studentIds.length) + " из " + toDisplayString(unref(students).length), 1)),
                  unref(errors).studentIds ? (openBlock(), createBlock("p", {
                    key: 2,
                    class: "mt-1 text-xs text-danger"
                  }, toDisplayString(unref(errors).studentIds), 1)) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "grid grid-cols-3 gap-4" }, [
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, [
                      createTextVNode(" Дата "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => unref(form).date = $event,
                      type: "date",
                      class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelText, unref(form).date]
                    ]),
                    unref(errors).date ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-xs text-danger"
                    }, toDisplayString(unref(errors).date), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, [
                      createTextVNode(" Начало "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => unref(form).startTime = $event,
                      type: "time",
                      class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelText, unref(form).startTime]
                    ]),
                    unref(errors).startTime ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-xs text-danger"
                    }, toDisplayString(unref(errors).startTime), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, [
                      createTextVNode(" Окончание "),
                      createVNode("span", { class: "text-danger" }, "*")
                    ]),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => unref(form).endTime = $event,
                      type: "time",
                      class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelText, unref(form).endTime]
                    ]),
                    unref(errors).endTime ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-xs text-danger"
                    }, toDisplayString(unref(errors).endTime), 1)) : createCommentVNode("", true)
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, [
                    createTextVNode(" Преподаватель "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  withDirectives(createVNode("select", {
                    "onUpdate:modelValue": ($event) => unref(form).instructorId = $event,
                    class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  }, [
                    createVNode("option", { value: "" }, "Выберите преподавателя"),
                    (openBlock(true), createBlock(Fragment, null, renderList(unref(instructors), (instructor) => {
                      return openBlock(), createBlock("option", {
                        key: instructor.id,
                        value: instructor.id
                      }, toDisplayString(instructor.fullName), 9, ["value"]);
                    }), 128))
                  ], 8, ["onUpdate:modelValue"]), [
                    [vModelSelect, unref(form).instructorId]
                  ]),
                  unref(errors).instructorId ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-xs text-danger"
                  }, toDisplayString(unref(errors).instructorId), 1)) : createCommentVNode("", true)
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, " Аудитория "),
                  withDirectives(createVNode("select", {
                    "onUpdate:modelValue": ($event) => unref(form).classroomId = $event,
                    class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  }, [
                    createVNode("option", { value: "" }, "Не указана"),
                    (openBlock(true), createBlock(Fragment, null, renderList(unref(classrooms), (classroom) => {
                      return openBlock(), createBlock("option", {
                        key: classroom.id,
                        value: classroom.id
                      }, toDisplayString(classroom.name), 9, ["value"]);
                    }), 128))
                  ], 8, ["onUpdate:modelValue"]), [
                    [vModelSelect, unref(form).classroomId]
                  ])
                ]),
                createVNode("div", { class: "flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700" }, [
                  createVNode(_component_UiButton, {
                    variant: "outline",
                    type: "button",
                    onClick: handleClose
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }),
                  createVNode(_component_UiButton, {
                    variant: "primary",
                    type: "submit",
                    loading: unref(submitting),
                    disabled: unref(form).studentIds.length === 0
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
                          d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
                        })
                      ])),
                      createTextVNode(" " + toDisplayString(unref(isEditMode) ? "Сохранить изменения" : "Создать пересдачу"), 1)
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
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/schedule/RetakeModal.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$8, { __name: "ScheduleRetakeModal" });
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "BulkActionsPanel",
  __ssrInlineRender: true,
  props: {
    selectedCount: {},
    canCreateTemplate: { type: Boolean, default: false }
  },
  emits: ["copy", "move", "createTemplate", "delete", "cancel"],
  setup(__props) {
    const props = __props;
    const selectedCountText = computed(() => {
      const count = props.selectedCount;
      if (count === 1) return "занятие выбрано";
      if (count >= 2 && count <= 4) return "занятия выбрано";
      return "занятий выбрано";
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.selectedCount > 0) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed bottom-6 left-1/2 -translate-x-1/2 z-50" }, _attrs))}><div class="flex items-center gap-4 px-6 py-4 bg-white dark:bg-boxdark rounded-2xl shadow-2xl border border-stroke dark:border-strokedark"><div class="flex items-center gap-2"><div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">${ssrInterpolate(__props.selectedCount)}</div><span class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(unref(selectedCountText))}</span></div><div class="w-px h-8 bg-gray-200 dark:bg-gray-700"></div><div class="flex items-center gap-2"><button class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors" title="Копировать выбранные занятия на другую дату"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg> Копировать </button><button class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-warning hover:bg-warning/90 rounded-lg transition-colors" title="Переместить выбранные занятия на другую дату"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg> Переместить </button>`);
        if (__props.canCreateTemplate) {
          _push(`<button class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 rounded-lg transition-colors" title="Создать шаблон из выбранных занятий"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Создать шаблон </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-danger hover:bg-danger/90 rounded-lg transition-colors" title="Удалить выбранные занятия"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> Удалить </button></div><div class="w-px h-8 bg-gray-200 dark:bg-gray-700"></div><button class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" title="Отменить выбор"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Отмена </button></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/schedule/BulkActionsPanel.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_4 = Object.assign(_sfc_main$7, { __name: "ScheduleBulkActionsPanel" });
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "CopyEventsModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    selectedEvents: {}
  },
  emits: ["close", "copied"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const targetDate = ref("");
    const preserveSequence = ref(true);
    const copying = ref(false);
    const minDate = computed(() => {
      const today = /* @__PURE__ */ new Date();
      return today.toISOString().split("T")[0];
    });
    const eventsCountText = computed(() => {
      const count = props.selectedEvents.length;
      if (count === 1) return "занятие";
      if (count >= 2 && count <= 4) return "занятия";
      return "занятий";
    });
    const formatEventTime2 = (event) => {
      return formatTimeOnly(new Date(event.startTime));
    };
    const handleCopy = async () => {
      if (!targetDate.value) return;
      copying.value = true;
      try {
        const response = await authFetch("/api/schedule/bulk-copy", {
          method: "POST",
          body: {
            eventIds: props.selectedEvents.map((e) => e.id),
            targetDate: targetDate.value,
            preserveSequence: preserveSequence.value
          }
        });
        if (response.success) {
          notification.show({
            type: "success",
            title: "Занятия скопированы",
            message: `Успешно скопировано ${response.copiedCount} занятий`
          });
          emit("copied", {
            copiedCount: response.copiedCount,
            createdEventIds: response.createdEventIds
          });
        }
      } catch (error) {
        console.error("Error copying events:", error);
        notification.show({
          type: "error",
          title: "Ошибка",
          message: error.data?.statusMessage || "Не удалось скопировать занятия"
        });
      } finally {
        copying.value = false;
      }
    };
    watch(
      () => props.isOpen,
      (open) => {
        if (!open) {
          targetDate.value = "";
          preserveSequence.value = true;
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Копировать занятия",
        size: "md",
        onClose: ($event) => _ctx.$emit("close")
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}><button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors"${_scopeId}> Отмена </button><button${ssrIncludeBooleanAttr(!unref(targetDate) || unref(copying)) ? " disabled" : ""} class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"${_scopeId}>`);
            if (unref(copying)) {
              _push2(`<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"${_scopeId}></path></svg>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(` ${ssrInterpolate(unref(copying) ? "Копирование..." : "Копировать")}</button></div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-end gap-3" }, [
                createVNode("button", {
                  onClick: ($event) => _ctx.$emit("close"),
                  class: "px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors"
                }, " Отмена ", 8, ["onClick"]),
                createVNode("button", {
                  onClick: handleCopy,
                  disabled: !unref(targetDate) || unref(copying),
                  class: "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                }, [
                  unref(copying) ? (openBlock(), createBlock("svg", {
                    key: 0,
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
                      d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    })
                  ])) : createCommentVNode("", true),
                  createTextVNode(" " + toDisplayString(unref(copying) ? "Копирование..." : "Копировать"), 1)
                ], 8, ["disabled"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}><div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="shrink-0"${_scopeId}><svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg></div><div${_scopeId}><p class="text-sm font-medium text-blue-800 dark:text-blue-200"${_scopeId}> Выбрано ${ssrInterpolate(__props.selectedEvents.length)} ${ssrInterpolate(unref(eventsCountText))}</p><p class="text-xs text-blue-600 dark:text-blue-300 mt-1"${_scopeId}> Занятия будут скопированы с сохранением порядка и интервалов </p></div></div></div>`);
            if (__props.selectedEvents.length > 0) {
              _push2(`<div class="max-h-40 overflow-y-auto"${_scopeId}><div class="space-y-1"${_scopeId}><!--[-->`);
              ssrRenderList(__props.selectedEvents.slice(0, 5), (event) => {
                _push2(`<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"${_scopeId}><span class="w-2 h-2 rounded-full bg-primary"${_scopeId}></span><span class="truncate"${_scopeId}>${ssrInterpolate(event.title)}</span><span class="text-xs text-gray-400"${_scopeId}>${ssrInterpolate(formatEventTime2(event))}</span></div>`);
              });
              _push2(`<!--]-->`);
              if (__props.selectedEvents.length > 5) {
                _push2(`<div class="text-xs text-gray-500 pl-4"${_scopeId}> ... и ещё ${ssrInterpolate(__props.selectedEvents.length - 5)}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Целевая дата </label><input${ssrRenderAttr("value", unref(targetDate))} type="date"${ssrRenderAttr("min", unref(minDate))} class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}></div><div class="flex items-center gap-3"${_scopeId}><input id="preserveSequence"${ssrIncludeBooleanAttr(Array.isArray(unref(preserveSequence)) ? ssrLooseContain(unref(preserveSequence), null) : unref(preserveSequence)) ? " checked" : ""} type="checkbox" class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600"${_scopeId}><label for="preserveSequence" class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}> Сохранить интервалы между занятиями </label></div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode("div", { class: "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4" }, [
                  createVNode("div", { class: "flex items-center gap-3" }, [
                    createVNode("div", { class: "shrink-0" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-blue-500",
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
                      ]))
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-sm font-medium text-blue-800 dark:text-blue-200" }, " Выбрано " + toDisplayString(__props.selectedEvents.length) + " " + toDisplayString(unref(eventsCountText)), 1),
                      createVNode("p", { class: "text-xs text-blue-600 dark:text-blue-300 mt-1" }, " Занятия будут скопированы с сохранением порядка и интервалов ")
                    ])
                  ])
                ]),
                __props.selectedEvents.length > 0 ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "max-h-40 overflow-y-auto"
                }, [
                  createVNode("div", { class: "space-y-1" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(__props.selectedEvents.slice(0, 5), (event) => {
                      return openBlock(), createBlock("div", {
                        key: event.id,
                        class: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                      }, [
                        createVNode("span", { class: "w-2 h-2 rounded-full bg-primary" }),
                        createVNode("span", { class: "truncate" }, toDisplayString(event.title), 1),
                        createVNode("span", { class: "text-xs text-gray-400" }, toDisplayString(formatEventTime2(event)), 1)
                      ]);
                    }), 128)),
                    __props.selectedEvents.length > 5 ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "text-xs text-gray-500 pl-4"
                    }, " ... и ещё " + toDisplayString(__props.selectedEvents.length - 5), 1)) : createCommentVNode("", true)
                  ])
                ])) : createCommentVNode("", true),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Целевая дата "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => isRef(targetDate) ? targetDate.value = $event : null,
                    type: "date",
                    min: unref(minDate),
                    class: "w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                  }, null, 8, ["onUpdate:modelValue", "min"]), [
                    [vModelText, unref(targetDate)]
                  ])
                ]),
                createVNode("div", { class: "flex items-center gap-3" }, [
                  withDirectives(createVNode("input", {
                    id: "preserveSequence",
                    "onUpdate:modelValue": ($event) => isRef(preserveSequence) ? preserveSequence.value = $event : null,
                    type: "checkbox",
                    class: "w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelCheckbox, unref(preserveSequence)]
                  ]),
                  createVNode("label", {
                    for: "preserveSequence",
                    class: "text-sm text-gray-700 dark:text-gray-300"
                  }, " Сохранить интервалы между занятиями ")
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/schedule/CopyEventsModal.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_5 = Object.assign(_sfc_main$6, { __name: "ScheduleCopyEventsModal" });
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "MoveEventsModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    selectedEvents: {}
  },
  emits: ["close", "moved"],
  setup(__props, { emit: __emit }) {
    useAuthFetch();
    const loading = ref(false);
    const error = ref(null);
    const targetDate = ref((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
    const preserveSequence = ref(true);
    const minDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.isOpen) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" }, _attrs))}><div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"></div><div class="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-white dark:bg-boxdark p-6 text-left shadow-xl transition-all sm:my-8"><div class="mb-5 flex items-center justify-between"><h3 class="text-xl font-bold text-black dark:text-white"> Перемещение занятий </h3><button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><div class="space-y-4"><div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"><div class="flex items-center gap-3"><div class="shrink-0"><svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><p class="text-sm font-medium text-blue-800 dark:text-blue-200"> Выбрано занятий: ${ssrInterpolate(__props.selectedEvents.length)}</p><p class="text-xs text-blue-600 dark:text-blue-300 mt-1"> Выберите новую дату, на которую нужно перенести эти занятия. </p></div></div></div><div><label class="mb-2.5 block font-medium text-black dark:text-white"> Целевая дата </label><div class="relative"><input type="date"${ssrRenderAttr("value", unref(targetDate))}${ssrRenderAttr("min", unref(minDate))} class="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"></div></div><div class="flex items-start gap-3 p-4 border border-stroke dark:border-strokedark rounded-lg bg-gray-50 dark:bg-meta-4/30"><input type="checkbox" id="preserveSequenceMove"${ssrIncludeBooleanAttr(Array.isArray(unref(preserveSequence)) ? ssrLooseContain(unref(preserveSequence), null) : unref(preserveSequence)) ? " checked" : ""} class="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-strokedark dark:bg-boxdark"><label for="preserveSequenceMove" class="text-sm cursor-pointer"><span class="block font-medium text-black dark:text-white"> Сохранить последовательность </span><span class="block text-gray-500 dark:text-gray-400 mt-1"> Временные интервалы между занятиями будут сохранены относительно времени первого занятия. </span></label></div>`);
        if (unref(error)) {
          _push(`<div class="rounded-lg bg-danger/10 p-4 text-sm text-danger">${ssrInterpolate(unref(error))}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="mt-6 flex justify-end gap-3"><button class="rounded-lg border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}> Отмена </button><button class="flex items-center gap-2 rounded-lg bg-primary py-2 px-6 font-medium text-white hover:bg-opacity-90"${ssrIncludeBooleanAttr(unref(loading) || !unref(targetDate)) ? " disabled" : ""}>`);
        if (unref(loading)) {
          _push(`<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<span>Переместить</span></button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/schedule/MoveEventsModal.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_6 = Object.assign(_sfc_main$5, { __name: "ScheduleMoveEventsModal" });
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "CreateTemplateModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    selectedEvents: {},
    groupInfo: {}
  },
  emits: ["close", "created"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const templateName = ref("");
    const templateDescription = ref("");
    const creating = ref(false);
    const nameError = ref("");
    const formatEventTime2 = (event) => {
      return formatTimeOnly(new Date(event.startTime));
    };
    const handleCreate = async () => {
      if (!templateName.value.trim()) {
        nameError.value = "Название обязательно";
        return;
      }
      nameError.value = "";
      creating.value = true;
      try {
        const response = await authFetch("/api/schedule/templates", {
          method: "POST",
          body: {
            name: templateName.value.trim(),
            description: templateDescription.value.trim() || null,
            eventIds: props.selectedEvents.map((e) => e.id),
            sourceGroupId: props.groupInfo?.id || null
          }
        });
        if (response.success) {
          notification.show({
            type: "success",
            title: "Шаблон создан",
            message: `Шаблон "${response.template.name}" успешно создан`
          });
          emit("created", response.template);
        }
      } catch (error) {
        console.error("Error creating template:", error);
        notification.show({
          type: "error",
          title: "Ошибка",
          message: error.data?.statusMessage || "Не удалось создать шаблон"
        });
      } finally {
        creating.value = false;
      }
    };
    watch(
      () => props.isOpen,
      (open) => {
        if (!open) {
          templateName.value = "";
          templateDescription.value = "";
          nameError.value = "";
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Создать шаблон расписания",
        size: "md",
        onClose: ($event) => _ctx.$emit("close")
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}><button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors"${_scopeId}> Отмена </button><button${ssrIncludeBooleanAttr(!unref(templateName).trim() || unref(creating)) ? " disabled" : ""} class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"${_scopeId}>`);
            if (unref(creating)) {
              _push2(`<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"${_scopeId}></path></svg>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(` ${ssrInterpolate(unref(creating) ? "Создание..." : "Создать шаблон")}</button></div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-end gap-3" }, [
                createVNode("button", {
                  onClick: ($event) => _ctx.$emit("close"),
                  class: "px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors"
                }, " Отмена ", 8, ["onClick"]),
                createVNode("button", {
                  onClick: handleCreate,
                  disabled: !unref(templateName).trim() || unref(creating),
                  class: "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                }, [
                  unref(creating) ? (openBlock(), createBlock("svg", {
                    key: 0,
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
                      d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    })
                  ])) : createCommentVNode("", true),
                  createTextVNode(" " + toDisplayString(unref(creating) ? "Создание..." : "Создать шаблон"), 1)
                ], 8, ["disabled"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}><div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="shrink-0"${_scopeId}><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg></div><div${_scopeId}><p class="text-sm font-medium text-green-800 dark:text-green-200"${_scopeId}> Создание шаблона из ${ssrInterpolate(__props.selectedEvents.length)} занятий </p><p class="text-xs text-green-600 dark:text-green-300 mt-1"${_scopeId}> Шаблон можно будет применять к другим группам </p></div></div></div>`);
            if (__props.groupInfo) {
              _push2(`<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path></svg><span${_scopeId}>Исходная группа: <strong${_scopeId}>${ssrInterpolate(__props.groupInfo.code)}</strong></span></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Название шаблона <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", unref(templateName))} type="text" placeholder="Например: Расписание первой недели" class="${ssrRenderClass([{ "border-danger": unref(nameError) }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"])}"${_scopeId}>`);
            if (unref(nameError)) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(nameError))}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Описание (необязательно) </label><textarea rows="3" placeholder="Краткое описание содержимого шаблона..." class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"${_scopeId}>${ssrInterpolate(unref(templateDescription))}</textarea></div><div${_scopeId}><p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Занятия в шаблоне: </p><div class="max-h-32 overflow-y-auto space-y-1 bg-gray-50 dark:bg-meta-4 rounded-lg p-3"${_scopeId}><!--[-->`);
            ssrRenderList(__props.selectedEvents, (event, index) => {
              _push2(`<div class="flex items-center gap-2 text-sm"${_scopeId}><span class="shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium"${_scopeId}>${ssrInterpolate(index + 1)}</span><span class="truncate text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(event.title)}</span><span class="text-xs text-gray-400 ml-auto"${_scopeId}>${ssrInterpolate(formatEventTime2(event))}</span></div>`);
            });
            _push2(`<!--]--></div></div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode("div", { class: "bg-green-50 dark:bg-green-900/20 rounded-lg p-4" }, [
                  createVNode("div", { class: "flex items-center gap-3" }, [
                    createVNode("div", { class: "shrink-0" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-green-500",
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
                      ]))
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-sm font-medium text-green-800 dark:text-green-200" }, " Создание шаблона из " + toDisplayString(__props.selectedEvents.length) + " занятий ", 1),
                      createVNode("p", { class: "text-xs text-green-600 dark:text-green-300 mt-1" }, " Шаблон можно будет применять к другим группам ")
                    ])
                  ])
                ]),
                __props.groupInfo ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
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
                      d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    })
                  ])),
                  createVNode("span", null, [
                    createTextVNode("Исходная группа: "),
                    createVNode("strong", null, toDisplayString(__props.groupInfo.code), 1)
                  ])
                ])) : createCommentVNode("", true),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                    createTextVNode(" Название шаблона "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => isRef(templateName) ? templateName.value = $event : null,
                    type: "text",
                    placeholder: "Например: Расписание первой недели",
                    class: ["w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary", { "border-danger": unref(nameError) }]
                  }, null, 10, ["onUpdate:modelValue"]), [
                    [vModelText, unref(templateName)]
                  ]),
                  unref(nameError) ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-xs text-danger"
                  }, toDisplayString(unref(nameError)), 1)) : createCommentVNode("", true)
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Описание (необязательно) "),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => isRef(templateDescription) ? templateDescription.value = $event : null,
                    rows: "3",
                    placeholder: "Краткое описание содержимого шаблона...",
                    class: "w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(templateDescription)]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("p", { class: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Занятия в шаблоне: "),
                  createVNode("div", { class: "max-h-32 overflow-y-auto space-y-1 bg-gray-50 dark:bg-meta-4 rounded-lg p-3" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(__props.selectedEvents, (event, index) => {
                      return openBlock(), createBlock("div", {
                        key: event.id,
                        class: "flex items-center gap-2 text-sm"
                      }, [
                        createVNode("span", { class: "shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium" }, toDisplayString(index + 1), 1),
                        createVNode("span", { class: "truncate text-gray-700 dark:text-gray-300" }, toDisplayString(event.title), 1),
                        createVNode("span", { class: "text-xs text-gray-400 ml-auto" }, toDisplayString(formatEventTime2(event)), 1)
                      ]);
                    }), 128))
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
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/schedule/CreateTemplateModal.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_7 = Object.assign(_sfc_main$4, { __name: "ScheduleCreateTemplateModal" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "ApplyTemplateModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    groups: {},
    instructors: {}
  },
  emits: ["close", "applied"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const loading = ref(false);
    const applying = ref(false);
    const templates = ref([]);
    const selectedTemplateId = ref("");
    const targetGroupId = ref("");
    const targetDate = ref("");
    const overrideInstructorId = ref("");
    const minDate = computed(() => {
      const today = /* @__PURE__ */ new Date();
      return today.toISOString().split("T")[0];
    });
    const canApply = computed(() => {
      return selectedTemplateId.value && targetGroupId.value && targetDate.value;
    });
    const loadTemplates = async () => {
      loading.value = true;
      try {
        const response = await authFetch("/api/schedule/templates");
        if (response.success) {
          templates.value = response.templates;
        }
      } catch (error) {
        console.error("Error loading templates:", error);
      } finally {
        loading.value = false;
      }
    };
    const handleApply = async () => {
      if (!canApply.value) return;
      applying.value = true;
      try {
        const response = await authFetch(`/api/schedule/templates/${selectedTemplateId.value}/apply`, {
          method: "POST",
          body: {
            targetGroupId: targetGroupId.value,
            targetDate: targetDate.value,
            overrideInstructorId: overrideInstructorId.value || null
          }
        });
        if (response.success) {
          notification.show({
            type: "success",
            title: "Шаблон применён",
            message: `Создано ${response.createdCount} занятий`
          });
          emit("applied", { createdCount: response.createdCount });
        }
      } catch (error) {
        console.error("Error applying template:", error);
        notification.show({
          type: "error",
          title: "Ошибка",
          message: error.data?.statusMessage || "Не удалось применить шаблон"
        });
      } finally {
        applying.value = false;
      }
    };
    watch(
      () => props.isOpen,
      (open) => {
        if (open) {
          loadTemplates();
        } else {
          selectedTemplateId.value = "";
          targetGroupId.value = "";
          targetDate.value = "";
          overrideInstructorId.value = "";
        }
      }
    );
    const handleDeleteTemplate = async (template) => {
      if (!confirm(`Вы уверены, что хотите удалить шаблон "${template.name}"?`)) {
        return;
      }
      try {
        await authFetch(`/api/schedule/templates/${template.id}`, {
          method: "DELETE"
        });
        notification.show({
          type: "success",
          title: "Шаблон удалён",
          message: "Шаблон успешно удалён"
        });
        await loadTemplates();
        if (selectedTemplateId.value === template.id) {
          selectedTemplateId.value = "";
        }
      } catch (e) {
        console.error("Error deleting template:", e);
        notification.show({
          type: "error",
          title: "Ошибка удаления",
          message: e.data?.statusMessage || "Не удалось удалить шаблон"
        });
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Применить шаблон",
        size: "lg",
        onClose: ($event) => _ctx.$emit("close")
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}><button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors"${_scopeId}> Отмена </button><button${ssrIncludeBooleanAttr(!unref(canApply) || unref(applying)) ? " disabled" : ""} class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"${_scopeId}>`);
            if (unref(applying)) {
              _push2(`<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"${_scopeId}></path></svg>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(` ${ssrInterpolate(unref(applying) ? "Применение..." : "Применить шаблон")}</button></div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-end gap-3" }, [
                createVNode("button", {
                  onClick: ($event) => _ctx.$emit("close"),
                  class: "px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors"
                }, " Отмена ", 8, ["onClick"]),
                createVNode("button", {
                  onClick: handleApply,
                  disabled: !unref(canApply) || unref(applying),
                  class: "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                }, [
                  unref(applying) ? (openBlock(), createBlock("svg", {
                    key: 0,
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
                      d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    })
                  ])) : createCommentVNode("", true),
                  createTextVNode(" " + toDisplayString(unref(applying) ? "Применение..." : "Применить шаблон"), 1)
                ], 8, ["disabled"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Выберите шаблон </label>`);
            if (unref(loading)) {
              _push2(`<div class="flex items-center justify-center py-8"${_scopeId}><div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"${_scopeId}></div><span class="ml-2 text-sm text-gray-500"${_scopeId}>Загрузка шаблонов...</span></div>`);
            } else if (unref(templates).length === 0) {
              _push2(`<div class="flex flex-col items-center justify-center py-10 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl"${_scopeId}><svg class="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg><p class="font-medium"${_scopeId}>Шаблоны не найдены</p><p class="text-xs mt-1 text-gray-400"${_scopeId}> Создайте шаблон из выбранных занятий в календаре </p></div>`);
            } else {
              _push2(`<div class="space-y-3 max-h-[320px] overflow-y-auto pr-1"${_scopeId}><!--[-->`);
              ssrRenderList(unref(templates), (template) => {
                _push2(`<div class="relative group"${_scopeId}><label class="${ssrRenderClass([[
                  unref(selectedTemplateId) === template.id ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-stroke dark:border-strokedark hover:border-primary/30 hover:bg-gray-50 dark:hover:bg-meta-4"
                ], "relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200"])}"${_scopeId}><div class="pt-1"${_scopeId}><input type="radio"${ssrRenderAttr("value", template.id)}${ssrIncludeBooleanAttr(ssrLooseEqual(unref(selectedTemplateId), template.id)) ? " checked" : ""} class="w-5 h-5 text-primary border-gray-300 focus:ring-primary dark:border-gray-600"${_scopeId}></div><div class="flex-1 min-w-0"${_scopeId}><div class="flex items-center justify-between gap-2 mb-1"${_scopeId}><span class="${ssrRenderClass([
                  unref(selectedTemplateId) === template.id ? "text-primary" : "text-black dark:text-white",
                  "font-semibold text-base"
                ])}"${_scopeId}>${ssrInterpolate(template.name)}</span></div>`);
                if (template.description) {
                  _push2(`<p class="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2"${_scopeId}>${ssrInterpolate(template.description)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="flex flex-wrap items-center gap-3 text-xs text-gray-400"${_scopeId}><div class="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"${_scopeId}><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"${_scopeId}></path></svg><span${_scopeId}>${ssrInterpolate(template.eventsData?.length || 0)} занятий</span></div>`);
                if (template.sourceGroupCode) {
                  _push2(`<div class="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"${_scopeId}><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path></svg><span${_scopeId}>Группа: ${ssrInterpolate(template.sourceGroupCode)}</span></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div></label><button class="absolute right-2 top-2 p-2 text-gray-400 hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100" title="Удалить шаблон"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg></button></div>`);
              });
              _push2(`<!--]--></div>`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Группа <span class="text-danger"${_scopeId}>*</span></label><div class="relative"${_scopeId}><select class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(targetGroupId)) ? ssrLooseContain(unref(targetGroupId), "") : ssrLooseEqual(unref(targetGroupId), "")) ? " selected" : ""}${_scopeId}>Выберите группу</option><!--[-->`);
            ssrRenderList(__props.groups, (group) => {
              _push2(`<option${ssrRenderAttr("value", group.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(targetGroupId)) ? ssrLooseContain(unref(targetGroupId), group.id) : ssrLooseEqual(unref(targetGroupId), group.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(group.code)}</option>`);
            });
            _push2(`<!--]--></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Дата <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", unref(targetDate))} type="date"${ssrRenderAttr("min", unref(minDate))} class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Инструктор (необязательно) </label><div class="relative"${_scopeId}><select class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(overrideInstructorId)) ? ssrLooseContain(unref(overrideInstructorId), "") : ssrLooseEqual(unref(overrideInstructorId), "")) ? " selected" : ""}${_scopeId}>Использовать из шаблона</option><!--[-->`);
            ssrRenderList(__props.instructors, (instructor) => {
              _push2(`<option${ssrRenderAttr("value", instructor.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(overrideInstructorId)) ? ssrLooseContain(unref(overrideInstructorId), instructor.id) : ssrLooseEqual(unref(overrideInstructorId), instructor.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(instructor.fullName)}</option>`);
            });
            _push2(`<!--]--></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div><p class="mt-1 text-xs text-gray-500"${_scopeId}> Если выбрать инструктора, он будет назначен на все занятия </p></div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Выберите шаблон "),
                  unref(loading) ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "flex items-center justify-center py-8"
                  }, [
                    createVNode("div", { class: "inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" }),
                    createVNode("span", { class: "ml-2 text-sm text-gray-500" }, "Загрузка шаблонов...")
                  ])) : unref(templates).length === 0 ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "flex flex-col items-center justify-center py-10 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl"
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-12 h-12 mb-3 text-gray-300 dark:text-gray-600",
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
                    createVNode("p", { class: "font-medium" }, "Шаблоны не найдены"),
                    createVNode("p", { class: "text-xs mt-1 text-gray-400" }, " Создайте шаблон из выбранных занятий в календаре ")
                  ])) : (openBlock(), createBlock("div", {
                    key: 2,
                    class: "space-y-3 max-h-[320px] overflow-y-auto pr-1"
                  }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(unref(templates), (template) => {
                      return openBlock(), createBlock("div", {
                        key: template.id,
                        class: "relative group"
                      }, [
                        createVNode("label", {
                          class: ["relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200", [
                            unref(selectedTemplateId) === template.id ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-stroke dark:border-strokedark hover:border-primary/30 hover:bg-gray-50 dark:hover:bg-meta-4"
                          ]]
                        }, [
                          createVNode("div", { class: "pt-1" }, [
                            withDirectives(createVNode("input", {
                              type: "radio",
                              value: template.id,
                              "onUpdate:modelValue": ($event) => isRef(selectedTemplateId) ? selectedTemplateId.value = $event : null,
                              class: "w-5 h-5 text-primary border-gray-300 focus:ring-primary dark:border-gray-600"
                            }, null, 8, ["value", "onUpdate:modelValue"]), [
                              [vModelRadio, unref(selectedTemplateId)]
                            ])
                          ]),
                          createVNode("div", { class: "flex-1 min-w-0" }, [
                            createVNode("div", { class: "flex items-center justify-between gap-2 mb-1" }, [
                              createVNode("span", {
                                class: [
                                  "font-semibold text-base",
                                  unref(selectedTemplateId) === template.id ? "text-primary" : "text-black dark:text-white"
                                ]
                              }, toDisplayString(template.name), 3)
                            ]),
                            template.description ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2"
                            }, toDisplayString(template.description), 1)) : createCommentVNode("", true),
                            createVNode("div", { class: "flex flex-wrap items-center gap-3 text-xs text-gray-400" }, [
                              createVNode("div", { class: "flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded" }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-3.5 h-3.5",
                                  fill: "none",
                                  viewBox: "0 0 24 24",
                                  stroke: "currentColor"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                  })
                                ])),
                                createVNode("span", null, toDisplayString(template.eventsData?.length || 0) + " занятий", 1)
                              ]),
                              template.sourceGroupCode ? (openBlock(), createBlock("div", {
                                key: 0,
                                class: "flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                              }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-3.5 h-3.5",
                                  fill: "none",
                                  viewBox: "0 0 24 24",
                                  stroke: "currentColor"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                  })
                                ])),
                                createVNode("span", null, "Группа: " + toDisplayString(template.sourceGroupCode), 1)
                              ])) : createCommentVNode("", true)
                            ])
                          ])
                        ], 2),
                        createVNode("button", {
                          onClick: withModifiers(($event) => handleDeleteTemplate(template), ["stop"]),
                          class: "absolute right-2 top-2 p-2 text-gray-400 hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100",
                          title: "Удалить шаблон"
                        }, [
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
                              d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            })
                          ]))
                        ], 8, ["onClick"])
                      ]);
                    }), 128))
                  ]))
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                    createTextVNode(" Группа "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  createVNode("div", { class: "relative" }, [
                    withDirectives(createVNode("select", {
                      "onUpdate:modelValue": ($event) => isRef(targetGroupId) ? targetGroupId.value = $event : null,
                      class: "w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                    }, [
                      createVNode("option", { value: "" }, "Выберите группу"),
                      (openBlock(true), createBlock(Fragment, null, renderList(__props.groups, (group) => {
                        return openBlock(), createBlock("option", {
                          key: group.id,
                          value: group.id
                        }, toDisplayString(group.code), 9, ["value"]);
                      }), 128))
                    ], 8, ["onUpdate:modelValue"]), [
                      [vModelSelect, unref(targetGroupId)]
                    ]),
                    (openBlock(), createBlock("svg", {
                      class: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
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
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                    createTextVNode(" Дата "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => isRef(targetDate) ? targetDate.value = $event : null,
                    type: "date",
                    min: unref(minDate),
                    class: "w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                  }, null, 8, ["onUpdate:modelValue", "min"]), [
                    [vModelText, unref(targetDate)]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Инструктор (необязательно) "),
                  createVNode("div", { class: "relative" }, [
                    withDirectives(createVNode("select", {
                      "onUpdate:modelValue": ($event) => isRef(overrideInstructorId) ? overrideInstructorId.value = $event : null,
                      class: "w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                    }, [
                      createVNode("option", { value: "" }, "Использовать из шаблона"),
                      (openBlock(true), createBlock(Fragment, null, renderList(__props.instructors, (instructor) => {
                        return openBlock(), createBlock("option", {
                          key: instructor.id,
                          value: instructor.id
                        }, toDisplayString(instructor.fullName), 9, ["value"]);
                      }), 128))
                    ], 8, ["onUpdate:modelValue"]), [
                      [vModelSelect, unref(overrideInstructorId)]
                    ]),
                    (openBlock(), createBlock("svg", {
                      class: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
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
                  createVNode("p", { class: "mt-1 text-xs text-gray-500" }, " Если выбрать инструктора, он будет назначен на все занятия ")
                ])
              ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/schedule/ApplyTemplateModal.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_8 = Object.assign(_sfc_main$3, { __name: "ScheduleApplyTemplateModal" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "BulkDeleteModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    selectedEvents: {}
  },
  emits: ["close", "deleted"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const confirmed = ref(false);
    const deleting = ref(false);
    const eventsCountText = computed(() => {
      const count = props.selectedEvents.length;
      if (count === 1) return "занятие";
      if (count >= 2 && count <= 4) return "занятия";
      return "занятий";
    });
    const formatEventDate2 = (event) => {
      return formatDateOnly(new Date(event.startTime));
    };
    const formatEventTime2 = (event) => {
      const start = formatTimeOnly(new Date(event.startTime));
      const end = formatTimeOnly(new Date(event.endTime));
      return `${start} - ${end}`;
    };
    const handleDelete = async () => {
      if (!confirmed.value) return;
      deleting.value = true;
      try {
        const response = await authFetch("/api/schedule/bulk-delete", {
          method: "POST",
          body: {
            eventIds: props.selectedEvents.map((e) => e.id)
          }
        });
        if (response.success) {
          notification.show({
            type: "success",
            title: "Занятия удалены",
            message: `Успешно удалено ${response.deletedCount} занятий`
          });
          emit("deleted", { deletedCount: response.deletedCount });
        }
      } catch (error) {
        console.error("Error deleting events:", error);
        notification.show({
          type: "error",
          title: "Ошибка",
          message: error.data?.statusMessage || "Не удалось удалить занятия"
        });
      } finally {
        deleting.value = false;
      }
    };
    watch(
      () => props.isOpen,
      (open) => {
        if (!open) {
          confirmed.value = false;
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Удаление занятий",
        size: "md",
        onClose: ($event) => _ctx.$emit("close")
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}><button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors"${_scopeId}> Отмена </button><button${ssrIncludeBooleanAttr(!unref(confirmed) || unref(deleting)) ? " disabled" : ""} class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-danger hover:bg-danger/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"${_scopeId}>`);
            if (unref(deleting)) {
              _push2(`<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"${_scopeId}></path></svg>`);
            } else {
              _push2(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg>`);
            }
            _push2(` ${ssrInterpolate(unref(deleting) ? "Удаление..." : "Удалить занятия")}</button></div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-end gap-3" }, [
                createVNode("button", {
                  onClick: ($event) => _ctx.$emit("close"),
                  class: "px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors"
                }, " Отмена ", 8, ["onClick"]),
                createVNode("button", {
                  onClick: handleDelete,
                  disabled: !unref(confirmed) || unref(deleting),
                  class: "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-danger hover:bg-danger/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                }, [
                  unref(deleting) ? (openBlock(), createBlock("svg", {
                    key: 0,
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
                      d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    })
                  ])),
                  createTextVNode(" " + toDisplayString(unref(deleting) ? "Удаление..." : "Удалить занятия"), 1)
                ], 8, ["disabled"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}><div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4"${_scopeId}><div class="flex items-start gap-3"${_scopeId}><div class="shrink-0"${_scopeId}><svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg></div><div${_scopeId}><h3 class="text-sm font-medium text-red-800 dark:text-red-200"${_scopeId}> Внимание! Это действие необратимо </h3><p class="text-sm text-red-600 dark:text-red-300 mt-1"${_scopeId}> Вы собираетесь удалить <strong${_scopeId}>${ssrInterpolate(__props.selectedEvents.length)}</strong> ${ssrInterpolate(unref(eventsCountText))}. Данные о посещаемости для этих занятий также будут удалены. </p></div></div></div><div${_scopeId}><p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Следующие занятия будут удалены: </p><div class="max-h-48 overflow-y-auto space-y-2 bg-gray-50 dark:bg-meta-4 rounded-lg p-3"${_scopeId}><!--[-->`);
            ssrRenderList(__props.selectedEvents, (event) => {
              _push2(`<div class="flex items-center gap-3 text-sm p-2 bg-white dark:bg-boxdark rounded border border-stroke dark:border-strokedark"${_scopeId}><div class="shrink-0 w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center"${_scopeId}><svg class="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg></div><div class="flex-1 min-w-0"${_scopeId}><p class="font-medium text-gray-900 dark:text-white truncate"${_scopeId}>${ssrInterpolate(event.title)}</p><div class="flex items-center gap-2 text-xs text-gray-500"${_scopeId}><span${_scopeId}>${ssrInterpolate(formatEventDate2(event))}</span><span${_scopeId}>•</span><span${_scopeId}>${ssrInterpolate(formatEventTime2(event))}</span>`);
              if (event.group?.code) {
                _push2(`<span${_scopeId}>• ${ssrInterpolate(event.group.code)}</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div></div>`);
            });
            _push2(`<!--]--></div></div><div class="flex items-center gap-3"${_scopeId}><input id="confirmDelete"${ssrIncludeBooleanAttr(Array.isArray(unref(confirmed)) ? ssrLooseContain(unref(confirmed), null) : unref(confirmed)) ? " checked" : ""} type="checkbox" class="w-4 h-4 text-danger bg-gray-100 border-gray-300 rounded focus:ring-danger dark:bg-gray-700 dark:border-gray-600"${_scopeId}><label for="confirmDelete" class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}> Я понимаю, что это действие необратимо </label></div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode("div", { class: "bg-red-50 dark:bg-red-900/20 rounded-lg p-4" }, [
                  createVNode("div", { class: "flex items-start gap-3" }, [
                    createVNode("div", { class: "shrink-0" }, [
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
                    createVNode("div", null, [
                      createVNode("h3", { class: "text-sm font-medium text-red-800 dark:text-red-200" }, " Внимание! Это действие необратимо "),
                      createVNode("p", { class: "text-sm text-red-600 dark:text-red-300 mt-1" }, [
                        createTextVNode(" Вы собираетесь удалить "),
                        createVNode("strong", null, toDisplayString(__props.selectedEvents.length), 1),
                        createTextVNode(" " + toDisplayString(unref(eventsCountText)) + ". Данные о посещаемости для этих занятий также будут удалены. ", 1)
                      ])
                    ])
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("p", { class: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Следующие занятия будут удалены: "),
                  createVNode("div", { class: "max-h-48 overflow-y-auto space-y-2 bg-gray-50 dark:bg-meta-4 rounded-lg p-3" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(__props.selectedEvents, (event) => {
                      return openBlock(), createBlock("div", {
                        key: event.id,
                        class: "flex items-center gap-3 text-sm p-2 bg-white dark:bg-boxdark rounded border border-stroke dark:border-strokedark"
                      }, [
                        createVNode("div", { class: "shrink-0 w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center" }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-4 h-4 text-danger",
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
                          ]))
                        ]),
                        createVNode("div", { class: "flex-1 min-w-0" }, [
                          createVNode("p", { class: "font-medium text-gray-900 dark:text-white truncate" }, toDisplayString(event.title), 1),
                          createVNode("div", { class: "flex items-center gap-2 text-xs text-gray-500" }, [
                            createVNode("span", null, toDisplayString(formatEventDate2(event)), 1),
                            createVNode("span", null, "•"),
                            createVNode("span", null, toDisplayString(formatEventTime2(event)), 1),
                            event.group?.code ? (openBlock(), createBlock("span", { key: 0 }, "• " + toDisplayString(event.group.code), 1)) : createCommentVNode("", true)
                          ])
                        ])
                      ]);
                    }), 128))
                  ])
                ]),
                createVNode("div", { class: "flex items-center gap-3" }, [
                  withDirectives(createVNode("input", {
                    id: "confirmDelete",
                    "onUpdate:modelValue": ($event) => isRef(confirmed) ? confirmed.value = $event : null,
                    type: "checkbox",
                    class: "w-4 h-4 text-danger bg-gray-100 border-gray-300 rounded focus:ring-danger dark:bg-gray-700 dark:border-gray-600"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelCheckbox, unref(confirmed)]
                  ]),
                  createVNode("label", {
                    for: "confirmDelete",
                    class: "text-sm text-gray-700 dark:text-gray-300"
                  }, " Я понимаю, что это действие необратимо ")
                ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/schedule/BulkDeleteModal.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_9 = Object.assign(_sfc_main$2, { __name: "ScheduleBulkDeleteModal" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "CalendarView",
  __ssrInlineRender: true,
  setup(__props) {
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const { user } = useAuth();
    const {
      canCreateSchedule,
      canEditSchedule,
      isStudent
    } = usePermissions();
    const {
      periods,
      settings: scheduleSettings,
      getFirstPeriodStart,
      getLastPeriodEnd,
      getNearestPeriod,
      getPeriodByTime
    } = useScheduleSettings();
    const calendarRef = ref(null);
    const loading = ref(true);
    const isInitialized = ref(false);
    const loadingAbortController = ref(null);
    const events = ref([]);
    const groups = ref([]);
    const instructors = ref([]);
    const classrooms = ref([]);
    const currentView = ref("dayGridMonth");
    const currentTitle = ref("");
    const showEventModal = ref(false);
    const showDetailModal = ref(false);
    const showRetakeModal = ref(false);
    const selectedEvent = ref(null);
    const editingEvent = ref(null);
    const retakeOriginalEvent = ref(null);
    const editingRetakeEvent = ref(null);
    const defaultEventStart = ref(void 0);
    const defaultEventEnd = ref(void 0);
    const currentDateRange = ref(null);
    const filters = ref({
      groupId: "",
      instructorId: "",
      classroomId: ""
    });
    const bulkSelectionMode = ref(false);
    const selectedEventIds = ref(/* @__PURE__ */ new Set());
    const showCopyEventsModal = ref(false);
    const showMoveEventsModal = ref(false);
    const showCreateTemplateModal = ref(false);
    const showApplyTemplateModal = ref(false);
    const showBulkDeleteModal = ref(false);
    const hasActiveFilters = computed(() => {
      return filters.value.groupId || filters.value.instructorId || filters.value.classroomId;
    });
    const viewOptions = [
      { value: "dayGridMonth", label: "Месяц" },
      { value: "timeGridWeek", label: "Неделя" },
      { value: "timeGridDay", label: "День" },
      { value: "listWeek", label: "Список" }
    ];
    const filteredEvents = computed(() => {
      return events.value.filter((event) => {
        if (filters.value.groupId && event.groupId !== filters.value.groupId) {
          return false;
        }
        if (filters.value.instructorId && event.instructorId !== filters.value.instructorId) {
          return false;
        }
        if (filters.value.classroomId && event.classroomId !== filters.value.classroomId) {
          return false;
        }
        return true;
      });
    });
    const selectedEventsArray = computed(() => {
      return events.value.filter((e) => selectedEventIds.value.has(e.id));
    });
    const canCreateTemplateFromSelection = computed(() => {
      const selected = selectedEventsArray.value;
      if (selected.length === 0) return false;
      const groupIds = new Set(selected.map((e) => e.groupId).filter(Boolean));
      return groupIds.size === 1;
    });
    const selectedEventsGroupInfo = computed(() => {
      const selected = selectedEventsArray.value;
      if (selected.length === 0) return null;
      const firstWithGroup = selected.find((e) => e.groupId && e.group);
      if (!firstWithGroup || !firstWithGroup.groupId || !firstWithGroup.group)
        return null;
      return {
        id: firstWithGroup.groupId,
        code: firstWithGroup.group.code
      };
    });
    const eventColors = {
      primary: { bg: "#3C50E0", border: "#3C50E0", text: "#ffffff" },
      success: { bg: "#10B981", border: "#10B981", text: "#ffffff" },
      warning: { bg: "#F59E0B", border: "#F59E0B", text: "#ffffff" },
      danger: { bg: "#EF4444", border: "#EF4444", text: "#ffffff" }
    };
    const GROUP_COLOR_PALETTE = [
      "#E91E63",
      // Розовый
      "#9C27B0",
      // Фиолетовый
      "#673AB7",
      // Глубокий фиолетовый
      "#3F51B5",
      // Индиго
      "#2196F3",
      // Синий
      "#00BCD4",
      // Циан
      "#009688",
      // Бирюзовый
      "#4CAF50",
      // Зелёный
      "#8BC34A",
      // Лаймовый
      "#FF9800",
      // Оранжевый
      "#FF5722",
      // Глубокий оранжевый
      "#795548"
      // Коричневый
    ];
    const hashStringToIndex = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return Math.abs(hash) % GROUP_COLOR_PALETTE.length;
    };
    const getGroupColor = (groupId) => {
      if (!groupId) return "transparent";
      return GROUP_COLOR_PALETTE[hashStringToIndex(groupId)] || "#3C50E0";
    };
    const usedGroupsWithColors = computed(() => {
      const groupMap = /* @__PURE__ */ new Map();
      for (const event of events.value) {
        if (event.groupId && event.group?.code && !groupMap.has(event.groupId)) {
          groupMap.set(event.groupId, {
            id: event.groupId,
            code: event.group.code,
            color: getGroupColor(event.groupId)
          });
        }
      }
      return Array.from(groupMap.values()).sort(
        (a, b) => a.code.localeCompare(b.code)
      );
    });
    const transformEventForCalendar = (event) => {
      const defaultColors = { bg: "#3C50E0", border: "#3C50E0", text: "#ffffff" };
      const colors = eventColors[event.color] ?? defaultColors;
      const isRetake = event.allowedStudentIds && event.allowedStudentIds.length > 0 || event.originalEventId;
      let titleWithClassroom = event.classroom?.name ? `${event.title} (${event.classroom.name})` : event.title;
      if (isRetake) {
        titleWithClassroom = `🔄 ${titleWithClassroom}`;
      }
      const groupColor = getGroupColor(event.groupId || void 0);
      const classNames = [];
      if (event.groupId) {
        classNames.push(`group-stripe-${hashStringToIndex(event.groupId)}`);
      }
      if (isRetake) {
        classNames.push("event-retake");
      }
      const isArchivedGroup = event.group?.isArchived;
      if (isArchivedGroup) {
        titleWithClassroom = `🔒 ${titleWithClassroom}`;
        classNames.push("opacity-75", "cursor-not-allowed");
      }
      return {
        id: event.id,
        title: titleWithClassroom,
        start: event.startTime,
        end: event.endTime,
        allDay: false,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        editable: !isArchivedGroup,
        startEditable: !isArchivedGroup,
        durationEditable: !isArchivedGroup,
        // Добавляем класс с data-атрибутом для CSS-стилизации полосы группы
        classNames,
        extendedProps: {
          description: event.description || void 0,
          groupId: event.groupId || void 0,
          groupCode: event.group?.code,
          groupColor,
          isGroupArchived: isArchivedGroup,
          instructorId: event.instructorId || void 0,
          instructorName: event.instructor?.fullName,
          classroomId: event.classroomId || void 0,
          classroomName: event.classroom?.name,
          eventType: event.eventType,
          color: event.color,
          isRetake,
          allowedStudentIds: event.allowedStudentIds,
          originalEventId: event.originalEventId,
          academicHours: event.academicHours,
          durationMinutes: event.durationMinutes
        }
      };
    };
    const onEventClick = (arg) => {
      const event = events.value.find((e) => e.id === arg.event.id);
      if (event) {
        selectedEvent.value = event;
        showDetailModal.value = true;
      }
    };
    const onDateSelect = (arg) => {
      editingEvent.value = null;
      const shouldSnap = scheduleSettings.value.snap_to_periods === "true";
      if (shouldSnap && (currentView.value === "timeGridWeek" || currentView.value === "timeGridDay")) {
        const startTimeStr = `${String(arg.start.getHours()).padStart(
          2,
          "0"
        )}:${String(arg.start.getMinutes()).padStart(2, "0")}`;
        const endTimeStr = `${String(arg.end.getHours()).padStart(2, "0")}:${String(
          arg.end.getMinutes()
        ).padStart(2, "0")}`;
        const nearestStartPeriod = getNearestPeriod(startTimeStr);
        const nearestEndPeriod = getPeriodByTime(endTimeStr) || getNearestPeriod(endTimeStr);
        if (nearestStartPeriod) {
          const parts = nearestStartPeriod.startTime.split(":").map(Number);
          const startH = parts[0] ?? 0;
          const startM = parts[1] ?? 0;
          arg.start.setHours(startH, startM, 0, 0);
        }
        if (nearestEndPeriod) {
          const endParts = nearestEndPeriod.endTime.split(":").map(Number);
          const endH = endParts[0] ?? 0;
          const endM = endParts[1] ?? 0;
          arg.end.setHours(endH, endM, 0, 0);
        }
      }
      defaultEventStart.value = arg.start;
      defaultEventEnd.value = arg.end;
      showEventModal.value = true;
    };
    const onDatesSet = (arg) => {
      currentTitle.value = arg.view.title;
      currentView.value = arg.view.type;
      const prevRange = currentDateRange.value;
      currentDateRange.value = { start: arg.start, end: arg.end };
      if (!isInitialized.value) {
        isInitialized.value = true;
        if (events.value.length > 0) {
          updateCalendarEvents();
          return;
        }
      }
      const rangeChanged = !prevRange || formatDateOnly(arg.start) !== formatDateOnly(prevRange.start) || formatDateOnly(arg.end) !== formatDateOnly(prevRange.end);
      if (rangeChanged) {
        loadEvents(arg.start, arg.end);
      }
    };
    const onEventDrop = async (info) => {
      const event = events.value.find((e) => e.id === info.event.id);
      if (!event) return;
      if (event.group?.isArchived) {
        info.revert();
        notification.show({
          type: "error",
          title: "Ошибка",
          message: "Нельзя изменять события архивной группы"
        });
        return;
      }
      const isCopyMode = info.jsEvent.ctrlKey || info.jsEvent.metaKey;
      try {
        if (isCopyMode) {
          info.revert();
          const newStartTime = info.event.start ? dateToLocalIsoString(info.event.start) : void 0;
          const newEndTime = info.event.end ? dateToLocalIsoString(info.event.end) : dateToLocalIsoString(
            new Date(info.event.start.getTime() + 60 * 60 * 1e3)
          );
          let durationMinutes;
          if (event.durationMinutes && event.durationMinutes > 0) {
            durationMinutes = event.durationMinutes;
          } else {
            const originalStartTime = new Date(event.startTime);
            const originalEndTime = new Date(event.endTime);
            const originalDurationMs = originalEndTime.getTime() - originalStartTime.getTime();
            const originalDurationMinutes = originalDurationMs / (1e3 * 60);
            const periodDurationMinutes = parseInt(
              scheduleSettings.value.period_duration_minutes || "40",
              10
            );
            const numberOfPairs = Math.ceil(
              originalDurationMinutes / periodDurationMinutes
            );
            durationMinutes = numberOfPairs * periodDurationMinutes;
          }
          await authFetch("/api/schedule", {
            method: "POST",
            body: {
              title: event.title,
              description: event.description,
              groupId: event.groupId,
              disciplineId: event.disciplineId,
              instructorId: event.instructorId,
              classroomId: event.classroomId,
              startTime: newStartTime,
              endTime: newEndTime,
              durationMinutes,
              // Передаем чистую длительность без перерывов (fallback)
              academicHours: event.academicHours,
              // Передаем количество а-ч напрямую
              isAllDay: event.isAllDay,
              color: event.color,
              eventType: event.eventType
            }
          });
          notification.show({
            type: "success",
            title: "Занятие скопировано",
            message: "Создана копия занятия на новую дату/время"
          });
        } else {
          let durationMinutes;
          if (event.durationMinutes && event.durationMinutes > 0) {
            durationMinutes = event.durationMinutes;
          } else {
            const originalStartTime = new Date(event.startTime);
            const originalEndTime = new Date(event.endTime);
            const originalDurationMs = originalEndTime.getTime() - originalStartTime.getTime();
            const originalDurationMinutes = originalDurationMs / (1e3 * 60);
            const periodDurationMinutes = parseInt(
              scheduleSettings.value.period_duration_minutes || "40",
              10
            );
            const numberOfPairs = Math.ceil(
              originalDurationMinutes / periodDurationMinutes
            );
            durationMinutes = numberOfPairs * periodDurationMinutes;
          }
          await authFetch(`/api/schedule/${event.id}`, {
            method: "PUT",
            body: {
              startTime: info.event.start ? dateToLocalIsoString(info.event.start) : void 0,
              endTime: info.event.end ? dateToLocalIsoString(info.event.end) : dateToLocalIsoString(
                new Date(info.event.start.getTime() + 60 * 60 * 1e3)
              ),
              durationMinutes,
              // Передаем чистую длительность без перерывов (fallback)
              academicHours: event.academicHours
              // Передаем количество а-ч напрямую
            }
          });
          notification.show({
            type: "success",
            title: "Занятие перемещено",
            message: "Время занятия успешно обновлено"
          });
        }
        if (currentDateRange.value) {
          loadEvents(currentDateRange.value.start, currentDateRange.value.end);
        }
      } catch (error) {
        console.error("Error updating event:", error);
        info.revert();
        notification.show({
          type: "error",
          title: "Ошибка",
          message: error.data?.statusMessage || "Не удалось выполнить операцию"
        });
      }
    };
    const onEventResize = async (info) => {
      const event = events.value.find((e) => e.id === info.event.id);
      if (!event) return;
      if (event.group?.isArchived) {
        info.revert();
        notification.show({
          type: "error",
          title: "Ошибка",
          message: "Нельзя изменять события архивной группы"
        });
        return;
      }
      try {
        const newStartTime = info.event.start || new Date(event.startTime);
        const newEndTime = info.event.end || new Date(event.endTime);
        const newDurationMs = newEndTime.getTime() - newStartTime.getTime();
        const newDurationMinutes = newDurationMs / (1e3 * 60);
        const periodDurationMinutes = parseInt(
          scheduleSettings.value.period_duration_minutes || "40",
          10
        );
        const numberOfPairs = Math.ceil(newDurationMinutes / periodDurationMinutes);
        const durationMinutes = numberOfPairs * periodDurationMinutes;
        await authFetch(`/api/schedule/${event.id}`, {
          method: "PUT",
          body: {
            endTime: info.event.end ? dateToLocalIsoString(info.event.end) : void 0,
            durationMinutes,
            // Передаем чистую длительность без перерывов (fallback)
            academicHours: numberOfPairs
            // Передаем рассчитанное количество а-ч
          }
        });
        notification.show({
          type: "success",
          title: "Занятие обновлено",
          message: "Длительность занятия успешно изменена"
        });
        if (currentDateRange.value) {
          loadEvents(currentDateRange.value.start, currentDateRange.value.end);
        }
      } catch (error) {
        console.error("Error updating event:", error);
        info.revert();
        notification.show({
          type: "error",
          title: "Ошибка",
          message: error.data?.statusMessage || "Не удалось изменить занятие"
        });
      }
    };
    const getEventTypeLabel = (eventType) => {
      const types = {
        theory: "Теория",
        practice: "Практика",
        assessment: "Аттестация",
        lecture: "Лекция",
        seminar: "Семинар",
        exam: "Экзамен",
        consultation: "Консультация",
        other: "Другое"
      };
      return types[eventType || ""] || eventType || "Занятие";
    };
    const onEventDidMount = (arg) => {
      const { event, el } = arg;
      const extendedProps = event.extendedProps;
      if (bulkSelectionMode.value && currentView.value === "listWeek") {
        const eventId = event.id;
        const isSelected = selectedEventIds.value.has(eventId);
        const checkboxContainer = (void 0).createElement("div");
        checkboxContainer.className = "bulk-select-checkbox";
        checkboxContainer.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      margin-right: 8px;
      cursor: pointer;
      flex-shrink: 0;
    `;
        const checkbox = (void 0).createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = isSelected;
        checkbox.className = "bulk-event-checkbox";
        checkbox.style.cssText = `
      width: 18px;
      height: 18px;
      accent-color: #3C50E0;
      cursor: pointer;
    `;
        checkbox.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleEventSelection(eventId);
          checkbox.checked = selectedEventIds.value.has(eventId);
        });
        checkboxContainer.appendChild(checkbox);
        const titleCell = el.querySelector(".fc-list-event-title");
        if (titleCell) {
          titleCell.insertBefore(checkboxContainer, titleCell.firstChild);
          if (isSelected) {
            el.classList.add("bulk-selected");
            el.style.backgroundColor = "rgba(60, 80, 224, 0.1)";
          }
        }
        el._bulkCheckbox = checkbox;
      }
      const parts = [];
      parts.push(`<div class="event-tooltip-title">${event.title}</div>`);
      if (event.start) {
        const startTime = formatTimeOnly(event.start);
        const endTime = event.end ? formatTimeOnly(event.end) : "";
        parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">🕐</span>
      <span class="event-tooltip-text">${startTime}${endTime ? " – " + endTime : ""}</span>
    </div>`);
      }
      if (extendedProps.groupCode) {
        parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">👥</span>
      <span class="event-tooltip-text">${extendedProps.groupCode}</span>
    </div>`);
      }
      if (extendedProps.instructorName) {
        parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">👨‍🏫</span>
      <span class="event-tooltip-text">${extendedProps.instructorName}</span>
    </div>`);
      }
      if (extendedProps.classroomName) {
        parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">🚪</span>
      <span class="event-tooltip-text">${extendedProps.classroomName}</span>
    </div>`);
      }
      if (extendedProps.eventType) {
        parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">📋</span>
      <span class="event-tooltip-text">${getEventTypeLabel(
          extendedProps.eventType
        )}</span>
    </div>`);
      }
      if (extendedProps.isRetake) {
        parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">🔄</span>
      <span class="event-tooltip-text" style="color: #9333ea; font-weight: 600;">Перездача</span>
    </div>`);
      }
      if (extendedProps.description) {
        const desc = extendedProps.description.length > 100 ? extendedProps.description.substring(0, 100) + "..." : extendedProps.description;
        parts.push(`<div class="event-tooltip-row event-tooltip-description">
      <span class="event-tooltip-text">${desc}</span>
    </div>`);
      }
      const tooltip = (void 0).createElement("div");
      tooltip.className = "event-tooltip";
      tooltip.innerHTML = parts.join("");
      const showTooltip = (e) => {
        (void 0).body.appendChild(tooltip);
        requestAnimationFrame(() => {
          const tooltipRect = tooltip.getBoundingClientRect();
          let left = e.clientX + 15;
          let top = e.clientY + 15;
          if (left + tooltipRect.width > (void 0).innerWidth - 10) {
            left = e.clientX - tooltipRect.width - 15;
          }
          if (top + tooltipRect.height > (void 0).innerHeight - 10) {
            top = e.clientY - tooltipRect.height - 15;
          }
          left = Math.max(10, left);
          top = Math.max(10, top);
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
          tooltip.classList.add("event-tooltip-visible");
        });
      };
      const moveTooltip = (e) => {
        if (!tooltip.parentNode) return;
        const tooltipRect = tooltip.getBoundingClientRect();
        let left = e.clientX + 10;
        let top = e.clientY + 10;
        if (left + tooltipRect.width > (void 0).innerWidth - 10) {
          left = e.clientX - tooltipRect.width - 10;
        }
        if (top + tooltipRect.height > (void 0).innerHeight - 10) {
          top = e.clientY - tooltipRect.height - 10;
        }
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      };
      const hideTooltip = () => {
        tooltip.classList.remove("event-tooltip-visible");
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      };
      el.addEventListener("mouseenter", showTooltip);
      el.addEventListener("mousemove", moveTooltip);
      el.addEventListener("mouseleave", hideTooltip);
      el._tooltipCleanup = () => {
        el.removeEventListener("mouseenter", showTooltip);
        el.removeEventListener("mousemove", moveTooltip);
        el.removeEventListener("mouseleave", hideTooltip);
        hideTooltip();
      };
    };
    const slotMinTime = computed(() => {
      const firstStart = getFirstPeriodStart.value;
      const parts = firstStart.split(":").map(Number);
      const h = parts[0] ?? 9;
      const m = parts[1] ?? 0;
      const bufferMinutes = h * 60 + m - 30;
      const hours = Math.floor(bufferMinutes / 60);
      const mins = bufferMinutes % 60;
      return `${String(Math.max(0, hours)).padStart(2, "0")}:${String(
        mins
      ).padStart(2, "0")}:00`;
    });
    const slotMaxTime = computed(() => {
      const lastEnd = getLastPeriodEnd.value;
      const parts = lastEnd.split(":").map(Number);
      const h = parts[0] ?? 18;
      const m = parts[1] ?? 20;
      const bufferMinutes = h * 60 + m + 30;
      const hours = Math.floor(bufferMinutes / 60);
      const mins = bufferMinutes % 60;
      return `${String(Math.min(24, hours)).padStart(2, "0")}:${String(
        mins
      ).padStart(2, "0")}:00`;
    });
    const slotDuration = computed(() => {
      return "00:10:00";
    });
    const slotLabelInterval = computed(() => {
      return "00:10:00";
    });
    computed(() => {
      return new Set(periods.value.map((p) => p.startTime));
    });
    computed(() => {
      return new Set(periods.value.map((p) => p.endTime));
    });
    const slotLabelContent = (arg) => {
      const showNumbers = scheduleSettings.value.show_period_numbers === "true";
      const timeStr = `${String(arg.date.getHours()).padStart(2, "0")}:${String(
        arg.date.getMinutes()
      ).padStart(2, "0")}`;
      const period = periods.value.find((p) => p.startTime === timeStr);
      if (period) {
        if (showNumbers) {
          return {
            html: `<div class="slot-label-period">
          <span class="period-badge">${period.periodNumber}</span>
          <div class="period-info">
            <span class="period-time-main">${period.startTime}</span>
            <span class="period-time-end">–${period.endTime}</span>
          </div>
        </div>`
          };
        }
        return {
          html: `<span class="period-time-start">${arg.text}</span>`
        };
      }
      return "";
    };
    const calendarOptions = computed(() => {
      const periodDuration = parseInt(
        scheduleSettings.value.period_duration_minutes || "40",
        10
      );
      const snapDurationValue = `00:${String(periodDuration).padStart(2, "0")}:00`;
      const isEditable = canEditSchedule.value || canCreateSchedule.value;
      return {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
        initialView: "dayGridMonth",
        locale: ruLocale,
        headerToolbar: false,
        height: "auto",
        timeZone: "local",
        // Используем локальное время для избежания сдвига дат
        // События будут управляться через API календаря
        events: [],
        // Блокируем редактирование для пользователей без прав
        editable: isEditable,
        selectable: isEditable,
        selectMirror: isEditable,
        eventStartEditable: isEditable,
        eventDurationEditable: isEditable,
        dayMaxEvents: 3,
        moreLinkClick: "popover",
        weekends: true,
        nowIndicator: true,
        slotMinTime: slotMinTime.value,
        slotMaxTime: slotMaxTime.value,
        slotDuration: slotDuration.value,
        slotLabelInterval: slotLabelInterval.value,
        allDaySlot: false,
        // Привязка к сетке при перетаскивании - привязываем к длительности пары
        snapDuration: snapDurationValue,
        slotLabelFormat: {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        },
        eventTimeFormat: {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        },
        // Кастомные метки слотов с номерами пар
        slotLabelContent,
        eventClick: onEventClick,
        select: onDateSelect,
        datesSet: onDatesSet,
        eventDrop: onEventDrop,
        eventResize: onEventResize,
        eventDidMount: onEventDidMount
      };
    });
    const loadEvents = async (start, end) => {
      if (loadingAbortController.value) {
        loadingAbortController.value.abort();
      }
      const controller = new AbortController();
      loadingAbortController.value = controller;
      loading.value = true;
      try {
        const api = calendarRef.value?.getApi();
        const viewStart = start || api?.view.activeStart;
        const viewEnd = end || api?.view.activeEnd;
        const now = /* @__PURE__ */ new Date();
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const params = new URLSearchParams();
        params.append("startDate", formatDateOnly(viewStart || defaultStart));
        params.append("endDate", formatDateOnly(viewEnd || defaultEnd));
        if (filters.value.groupId) params.append("groupId", filters.value.groupId);
        if (filters.value.instructorId)
          params.append("instructorId", filters.value.instructorId);
        if (filters.value.classroomId)
          params.append("classroomId", filters.value.classroomId);
        const response = await authFetch(`/api/schedule?${params.toString()}`, { signal: controller.signal });
        if (controller.signal.aborted) {
          return;
        }
        if (response.success) {
          events.value = response.events;
          updateCalendarEvents();
        }
      } catch (error) {
        if (error.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        if (loadingAbortController.value !== controller) {
          return;
        }
        console.error("Error loading events:", error);
        notification.show({
          type: "error",
          title: "Ошибка",
          message: "Не удалось загрузить расписание"
        });
      } finally {
        if (loadingAbortController.value === controller) {
          loading.value = false;
        }
      }
    };
    const updateCalendarEvents = () => {
      const api = calendarRef.value?.getApi();
      if (!api) return;
      api.removeAllEvents();
      let filteredEvents2 = events.value;
      if (isStudent.value) {
        const currentStudentId = user.value?.studentId;
        console.log("[CalendarView] Фильтрация для студента:", {
          userId: user.value?.id,
          studentId: currentStudentId,
          totalEvents: events.value.length,
          isStudent: isStudent.value
        });
        if (!currentStudentId) {
          console.warn("[CalendarView] У студента нет связанного studentId");
          filteredEvents2 = events.value.filter((event) => {
            const isRetake = event.allowedStudentIds && event.allowedStudentIds.length > 0 || event.originalEventId;
            return !isRetake;
          });
        } else {
          filteredEvents2 = events.value.filter((event) => {
            const isRetake = event.allowedStudentIds && event.allowedStudentIds.length > 0 || event.originalEventId;
            console.log("[CalendarView] Проверка события:", {
              title: event.title,
              isRetake,
              allowedStudentIds: event.allowedStudentIds,
              originalEventId: event.originalEventId,
              currentStudentId
            });
            if (!isRetake) {
              console.log("[CalendarView] → Показываем (не перездача)");
              return true;
            }
            if (event.allowedStudentIds && event.allowedStudentIds.length > 0) {
              const isAllowed = event.allowedStudentIds.includes(currentStudentId);
              console.log(
                "[CalendarView] → Перездача, студент в списке:",
                isAllowed
              );
              return isAllowed;
            }
            console.log(
              "[CalendarView] → Скрываем (перездача без списка студентов)"
            );
            return false;
          });
        }
        console.log("[CalendarView] После фильтрации:", {
          filteredCount: filteredEvents2.length,
          hiddenCount: events.value.length - filteredEvents2.length
        });
      }
      const transformedEvents = filteredEvents2.map(transformEventForCalendar);
      transformedEvents.forEach((event) => {
        api.addEvent(event);
      });
    };
    const openAddModal = (start) => {
      editingEvent.value = null;
      defaultEventStart.value = /* @__PURE__ */ new Date();
      defaultEventEnd.value = new Date(
        (/* @__PURE__ */ new Date()).getTime() + 90 * 60 * 1e3
      );
      showEventModal.value = true;
    };
    const closeDetailModal = () => {
      showDetailModal.value = false;
      selectedEvent.value = null;
    };
    const handleEditFromDetail = (event) => {
      const isRetake = event.allowedStudentIds && event.allowedStudentIds.length > 0 || event.originalEventId;
      showDetailModal.value = false;
      if (isRetake) {
        editingRetakeEvent.value = event;
        if (event.originalEventId) {
          const originalEvent = events.value.find(
            (e) => e.id === event.originalEventId
          );
          if (originalEvent) {
            retakeOriginalEvent.value = {
              id: originalEvent.id,
              title: originalEvent.title,
              startTime: originalEvent.startTime,
              endTime: originalEvent.endTime,
              eventType: originalEvent.eventType,
              groupId: originalEvent.groupId,
              disciplineId: originalEvent.disciplineId,
              instructorId: originalEvent.instructorId,
              classroomId: originalEvent.classroomId
            };
          } else {
            retakeOriginalEvent.value = {
              id: event.id,
              title: event.title,
              startTime: event.startTime,
              endTime: event.endTime,
              eventType: event.eventType,
              groupId: event.groupId,
              disciplineId: event.disciplineId,
              instructorId: event.instructorId,
              classroomId: event.classroomId
            };
          }
        } else {
          retakeOriginalEvent.value = {
            id: event.id,
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            eventType: event.eventType,
            groupId: event.groupId,
            disciplineId: event.disciplineId,
            instructorId: event.instructorId,
            classroomId: event.classroomId
          };
        }
        showRetakeModal.value = true;
      } else {
        editingEvent.value = event;
        showEventModal.value = true;
      }
    };
    const handleRetakeFromDetail = (event) => {
      showDetailModal.value = false;
      retakeOriginalEvent.value = {
        id: event.id,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        eventType: event.eventType,
        groupId: event.groupId,
        disciplineId: event.disciplineId,
        instructorId: event.instructorId,
        classroomId: event.classroomId
      };
      showRetakeModal.value = true;
    };
    const closeRetakeModal = () => {
      showRetakeModal.value = false;
      retakeOriginalEvent.value = null;
      editingRetakeEvent.value = null;
    };
    const handleRetakeCreated = (retakeEventId) => {
      closeRetakeModal();
      notification.show({
        type: "success",
        title: "Пересдача создана",
        message: "События пересдачи добавлено в расписание"
      });
      if (currentDateRange.value) {
        loadEvents(currentDateRange.value.start, currentDateRange.value.end);
      }
    };
    const handleRetakeUpdated = () => {
      closeRetakeModal();
      notification.show({
        type: "success",
        title: "Пересдача обновлена",
        message: "Изменения успешно сохранены"
      });
      if (currentDateRange.value) {
        loadEvents(currentDateRange.value.start, currentDateRange.value.end);
      }
    };
    const closeEventModal = () => {
      showEventModal.value = false;
      editingEvent.value = null;
      defaultEventStart.value = void 0;
      defaultEventEnd.value = void 0;
    };
    const handleEventSaved = () => {
      closeEventModal();
      if (currentDateRange.value) {
        loadEvents(currentDateRange.value.start, currentDateRange.value.end);
      }
    };
    const handleEventDeleted = () => {
      closeEventModal();
      closeDetailModal();
      if (currentDateRange.value) {
        loadEvents(currentDateRange.value.start, currentDateRange.value.end);
      }
    };
    const disableBulkSelection = () => {
      bulkSelectionMode.value = false;
      selectedEventIds.value = /* @__PURE__ */ new Set();
    };
    const toggleEventSelection = (eventId) => {
      const newSet = new Set(selectedEventIds.value);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      selectedEventIds.value = newSet;
    };
    const handleBulkCopied = (result) => {
      showCopyEventsModal.value = false;
      disableBulkSelection();
      if (currentDateRange.value) {
        loadEvents(currentDateRange.value.start, currentDateRange.value.end);
      }
    };
    const handleBulkMoved = (result) => {
      showMoveEventsModal.value = false;
      disableBulkSelection();
      if (currentDateRange.value) {
        loadEvents(currentDateRange.value.start, currentDateRange.value.end);
      }
    };
    const handleTemplateCreated = (template) => {
      showCreateTemplateModal.value = false;
      disableBulkSelection();
    };
    const handleTemplateApplied = (result) => {
      showApplyTemplateModal.value = false;
      if (currentDateRange.value) {
        loadEvents(currentDateRange.value.start, currentDateRange.value.end);
      }
    };
    const handleBulkDeleted = (result) => {
      showBulkDeleteModal.value = false;
      disableBulkSelection();
      if (currentDateRange.value) {
        loadEvents(currentDateRange.value.start, currentDateRange.value.end);
      }
    };
    watch(bulkSelectionMode, () => {
      nextTick(() => {
        updateCalendarEvents();
      });
    });
    watch(
      selectedEventIds,
      () => {
        if (bulkSelectionMode.value && currentView.value === "listWeek") {
          const api = calendarRef.value?.getApi();
          if (api) {
            api.getEvents().forEach((fcEvent) => {
              const el = (void 0).querySelector(
                `[data-event-id="${fcEvent.id}"]`
              );
              if (el) {
                const isSelected = selectedEventIds.value.has(fcEvent.id);
                if (isSelected) {
                  el.style.backgroundColor = "rgba(60, 80, 224, 0.1)";
                } else {
                  el.style.backgroundColor = "";
                }
              }
            });
          }
        }
      },
      { deep: true }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$1;
      const _component_ScheduleEventDetailModal = __nuxt_component_1;
      const _component_ScheduleEventModal = __nuxt_component_2;
      const _component_ScheduleRetakeModal = __nuxt_component_3;
      const _component_ScheduleBulkActionsPanel = __nuxt_component_4;
      const _component_ScheduleCopyEventsModal = __nuxt_component_5;
      const _component_ScheduleMoveEventsModal = __nuxt_component_6;
      const _component_ScheduleCreateTemplateModal = __nuxt_component_7;
      const _component_ScheduleApplyTemplateModal = __nuxt_component_8;
      const _component_ScheduleBulkDeleteModal = __nuxt_component_9;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "calendar-wrapper" }, _attrs))}><div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"><div class="flex items-center gap-3"><button class="p-2 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors" title="Назад"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button><button class="px-3 py-2 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors text-sm font-medium" title="Сегодня"> Сегодня </button><button class="p-2 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors" title="Вперёд"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>`);
      if (unref(canCreateSchedule)) {
        _push(ssrRenderComponent(_component_UiButton, {
          onClick: ($event) => openAddModal(),
          class: "flex items-center gap-2"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Добавить занятие `);
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
                createTextVNode(" Добавить занятие ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div><h2 class="text-xl font-semibold text-black dark:text-white order-first sm:order-0">${ssrInterpolate(unref(currentTitle))}</h2><div class="flex rounded-lg border border-stroke dark:border-strokedark overflow-hidden"><!--[-->`);
      ssrRenderList(viewOptions, (view) => {
        _push(`<button class="${ssrRenderClass([[
          unref(currentView) === view.value ? "bg-primary text-white" : "bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4"
        ], "px-4 py-2 text-sm font-medium transition-colors"])}">${ssrInterpolate(view.label)}</button>`);
      });
      _push(`<!--]--></div></div><div class="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-4 mb-6"><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Группа </label><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(filters).groupId) ? ssrLooseContain(unref(filters).groupId, "") : ssrLooseEqual(unref(filters).groupId, "")) ? " selected" : ""}>Все группы</option><!--[-->`);
      ssrRenderList(unref(groups), (group) => {
        _push(`<option${ssrRenderAttr("value", group.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(filters).groupId) ? ssrLooseContain(unref(filters).groupId, group.id) : ssrLooseEqual(unref(filters).groupId, group.id)) ? " selected" : ""}>${ssrInterpolate(group.code)}</option>`);
      });
      _push(`<!--]--></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Инструктор </label><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(filters).instructorId) ? ssrLooseContain(unref(filters).instructorId, "") : ssrLooseEqual(unref(filters).instructorId, "")) ? " selected" : ""}>Все инструкторы</option><!--[-->`);
      ssrRenderList(unref(instructors), (instructor) => {
        _push(`<option${ssrRenderAttr("value", instructor.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(filters).instructorId) ? ssrLooseContain(unref(filters).instructorId, instructor.id) : ssrLooseEqual(unref(filters).instructorId, instructor.id)) ? " selected" : ""}>${ssrInterpolate(instructor.fullName)}</option>`);
      });
      _push(`<!--]--></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Аудитория </label><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(filters).classroomId) ? ssrLooseContain(unref(filters).classroomId, "") : ssrLooseEqual(unref(filters).classroomId, "")) ? " selected" : ""}>Все аудитории</option><!--[-->`);
      ssrRenderList(unref(classrooms), (classroom) => {
        _push(`<option${ssrRenderAttr("value", classroom.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(filters).classroomId) ? ssrLooseContain(unref(filters).classroomId, classroom.id) : ssrLooseEqual(unref(filters).classroomId, classroom.id)) ? " selected" : ""}>${ssrInterpolate(classroom.name)}</option>`);
      });
      _push(`<!--]--></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div><div class="flex items-end">`);
      if (unref(hasActiveFilters)) {
        _push(`<button class="w-full px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Сбросить фильтры </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div><div class="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-4 relative min-h-[500px]">`);
      if (unref(loading)) {
        _push(`<div class="absolute inset-0 bg-white/80 dark:bg-boxdark/80 z-10 flex items-center justify-center rounded-lg"><div class="flex items-center gap-3"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div><span class="text-gray-600 dark:text-gray-400">Загрузка расписания...</span></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mb-2 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-between"><div class="flex items-center gap-4"><span>💡 <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-meta-4 rounded text-[10px]">CTRL</kbd> + перетаскивание = копирование занятия</span></div>`);
      if (unref(currentView) === "listWeek" && unref(canEditSchedule)) {
        _push(`<div class="flex items-center gap-2">`);
        if (!unref(bulkSelectionMode)) {
          _push(`<button class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg> Действия </button>`);
        } else {
          _push(`<!--[--><span class="text-gray-500"> Выбрано: <strong class="text-primary">${ssrInterpolate(unref(selectedEventIds).size)}</strong></span>`);
          if (unref(filteredEvents).length > 0) {
            _push(`<button class="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"> Выбрать все </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button class="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-danger transition-colors"> Отмена </button><!--]-->`);
        }
        _push(`<button class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-success bg-success/10 hover:bg-success/20 rounded-lg transition-colors" title="Применить сохранённый шаблон"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg> Шаблоны </button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(unref(FullCalendar), {
        ref_key: "calendarRef",
        ref: calendarRef,
        options: unref(calendarOptions),
        class: "schedule-calendar"
      }, null, _parent));
      if (unref(usedGroupsWithColors).length > 0) {
        _push(`<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"><div class="flex items-center gap-2 mb-2"><svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg><span class="text-sm font-medium text-gray-600 dark:text-gray-400">Группы:</span></div><div class="flex flex-wrap gap-2"><!--[-->`);
        ssrRenderList(unref(usedGroupsWithColors), (group) => {
          _push(`<button class="${ssrRenderClass([[
            unref(filters).groupId === group.id ? "ring-2 ring-offset-2 ring-primary dark:ring-offset-boxdark" : "hover:bg-gray-100 dark:hover:bg-meta-4"
          ], "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"])}" style="${ssrRenderStyle({
            backgroundColor: unref(filters).groupId === group.id ? group.color + "20" : "transparent",
            color: unref(filters).groupId === group.id ? group.color : void 0
          })}"${ssrRenderAttr(
            "title",
            unref(filters).groupId === group.id ? "Нажмите, чтобы сбросить фильтр" : "Нажмите, чтобы фильтровать по группе"
          )}><span class="w-3 h-3 rounded-full shrink-0 shadow-sm" style="${ssrRenderStyle({ backgroundColor: group.color })}"></span><span class="text-gray-700 dark:text-gray-300">${ssrInterpolate(group.code)}</span></button>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_ScheduleEventDetailModal, {
        "is-open": unref(showDetailModal),
        event: unref(selectedEvent),
        onClose: closeDetailModal,
        onEdit: handleEditFromDetail,
        onRetake: handleRetakeFromDetail,
        onDeleted: handleEventDeleted
      }, null, _parent));
      _push(ssrRenderComponent(_component_ScheduleEventModal, {
        "is-open": unref(showEventModal),
        event: unref(editingEvent),
        "default-start": unref(defaultEventStart),
        "default-end": unref(defaultEventEnd),
        onClose: closeEventModal,
        onSaved: handleEventSaved,
        onDeleted: handleEventDeleted
      }, null, _parent));
      _push(ssrRenderComponent(_component_ScheduleRetakeModal, {
        "is-open": unref(showRetakeModal),
        "original-event": unref(retakeOriginalEvent),
        "retake-event": unref(editingRetakeEvent),
        onClose: closeRetakeModal,
        onCreated: handleRetakeCreated,
        onUpdated: handleRetakeUpdated
      }, null, _parent));
      _push(ssrRenderComponent(_component_ScheduleBulkActionsPanel, {
        "selected-count": unref(selectedEventIds).size,
        "can-create-template": unref(canCreateTemplateFromSelection),
        onCopy: ($event) => showCopyEventsModal.value = true,
        onMove: ($event) => showMoveEventsModal.value = true,
        onCreateTemplate: ($event) => showCreateTemplateModal.value = true,
        onDelete: ($event) => showBulkDeleteModal.value = true,
        onCancel: disableBulkSelection
      }, null, _parent));
      _push(ssrRenderComponent(_component_ScheduleCopyEventsModal, {
        "is-open": unref(showCopyEventsModal),
        "selected-events": unref(selectedEventsArray),
        onClose: ($event) => showCopyEventsModal.value = false,
        onCopied: handleBulkCopied
      }, null, _parent));
      _push(ssrRenderComponent(_component_ScheduleMoveEventsModal, {
        "is-open": unref(showMoveEventsModal),
        "selected-events": unref(selectedEventsArray),
        onClose: ($event) => showMoveEventsModal.value = false,
        onMoved: handleBulkMoved
      }, null, _parent));
      _push(ssrRenderComponent(_component_ScheduleCreateTemplateModal, {
        "is-open": unref(showCreateTemplateModal),
        "selected-events": unref(selectedEventsArray),
        "group-info": unref(selectedEventsGroupInfo),
        onClose: ($event) => showCreateTemplateModal.value = false,
        onCreated: handleTemplateCreated
      }, null, _parent));
      _push(ssrRenderComponent(_component_ScheduleApplyTemplateModal, {
        "is-open": unref(showApplyTemplateModal),
        groups: unref(groups),
        instructors: unref(instructors),
        onClose: ($event) => showApplyTemplateModal.value = false,
        onApplied: handleTemplateApplied
      }, null, _parent));
      _push(ssrRenderComponent(_component_ScheduleBulkDeleteModal, {
        "is-open": unref(showBulkDeleteModal),
        "selected-events": unref(selectedEventsArray),
        onClose: ($event) => showBulkDeleteModal.value = false,
        onDeleted: handleBulkDeleted
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/schedule/CalendarView.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main$1, { __name: "ScheduleCalendarView" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "schedule",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Расписание | TailAdmin - Nuxt Tailwind CSS Dashboard"
    });
    usePermissions();
    useAuthFetch();
    const stats = ref({
      today: 0,
      thisWeek: 0,
      activeGroups: 0,
      classrooms: 0,
      showGroups: false
      // Flag to control UI visibility if needed, or just rely on 0
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ScheduleCalendarView = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Расписание занятий </h2><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Управление расписанием учебных групп </p></div></div><div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6"><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Сегодня</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(unref(stats).today)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"><svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">На этой неделе</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(unref(stats).thisWeek)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10"><svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Активных групп</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(unref(stats).activeGroups)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10"><svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Аудиторий</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(unref(stats).classrooms)}</p></div></div></div></div>`);
      _push(ssrRenderComponent(_component_ScheduleCalendarView, null, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/schedule.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=schedule-Czh3u5-w.mjs.map
