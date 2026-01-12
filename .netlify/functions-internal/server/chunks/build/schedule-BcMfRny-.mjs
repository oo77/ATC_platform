import { _ as __nuxt_component_1$1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_0$1 } from './Modal-DQYphXo7.mjs';
import { defineComponent, ref, mergeProps, unref, computed, withCtx, createBlock, createTextVNode, openBlock, createVNode, watch, createCommentVNode, toDisplayString, Fragment, renderList, withModifiers, withDirectives, vModelSelect, vModelText, isRef, vModelCheckbox, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderAttr, ssrRenderStyle } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { u as usePermissions } from './usePermissions-C-v7fTov.mjs';
import { _ as __nuxt_component_0$2 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_3 } from './ConfirmModal-GQ4JU241.mjs';
import { u as useNotification } from './useNotification-C2RwAN1X.mjs';
import { u as useScheduleSettings } from './useScheduleSettings-CNJlVtwC.mjs';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import ruLocale from '@fullcalendar/core/locales/ru';
import { u as useHead } from './server.mjs';
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
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "EventDetailModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    event: {}
  },
  emits: ["close", "edit"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const { canEditSchedule } = usePermissions();
    const loading = ref(false);
    const loadingStudents = ref(false);
    const students = ref([]);
    const loadStudents = async (groupId) => {
      loadingStudents.value = true;
      try {
        const response = await authFetch(`/api/groups/${groupId}`);
        if (response.success && response.group?.students) {
          students.value = response.group.students.filter((s) => s.student).map((s) => ({
            id: s.student.id,
            fullName: s.student.fullName,
            organization: s.student.organization,
            position: s.student.position
          }));
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
            _push2(`<div class="flex justify-between items-center"${_scopeId}><div${_scopeId}></div><div class="flex gap-3"${_scopeId}>`);
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
            if (unref(canEditSchedule)) {
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
                createVNode("div"),
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
                  unref(canEditSchedule) ? (openBlock(), createBlock(_component_UiButton, {
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
              _push2(`</div>`);
              if (__props.event.eventType) {
                _push2(`<span class="${ssrRenderClass([getEventTypeBadgeClass(__props.event.eventType), "px-3 py-1 rounded-full text-xs font-medium"])}"${_scopeId}>${ssrInterpolate(getEventTypeLabel(__props.event.eventType))}</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-meta-4 rounded-lg"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center"${_scopeId}><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"${_scopeId}></path></svg></div><div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Дата и время</p><p class="font-medium text-black dark:text-white"${_scopeId}>${ssrInterpolate(unref(formatEventDate)(__props.event.startTime))}</p><p class="text-sm text-gray-600 dark:text-gray-300"${_scopeId}>${ssrInterpolate(unref(formatEventTime)(__props.event.startTime))} — ${ssrInterpolate(unref(formatEventTime)(__props.event.endTime))}</p></div></div>`);
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
                  __props.event.eventType ? (openBlock(), createBlock("span", {
                    key: 0,
                    class: ["px-3 py-1 rounded-full text-xs font-medium", getEventTypeBadgeClass(__props.event.eventType)]
                  }, toDisplayString(getEventTypeLabel(__props.event.eventType)), 3)) : createCommentVNode("", true)
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
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/schedule/EventDetailModal.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$3, { __name: "ScheduleEventDetailModal" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
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
    const disciplineTests = ref([]);
    const loadingTests = ref(false);
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
      description: ""
    });
    const errors = ref({});
    const submitting = ref(false);
    const showDeleteConfirm = ref(false);
    const deleting = ref(false);
    const hoursWarning = ref(null);
    const instructorHoursWarning = ref(null);
    const instructorHoursCheckLoading = ref(false);
    const isEditMode = computed(() => !!props.event);
    const selectedDiscipline = computed(() => {
      if (!form.value.disciplineId) return null;
      return disciplines.value.find((d) => d.id === form.value.disciplineId) || null;
    });
    const disciplineInstructors = computed(() => {
      return selectedDiscipline.value?.instructors || [];
    });
    const firstDisciplineTest = computed(() => {
      return disciplineTests.value.length > 0 ? disciplineTests.value[0] : null;
    });
    const computedTimeRange = computed(() => {
      if (selectedPairs.value.length === 0) return "";
      const sorted = [...selectedPairs.value].sort((a, b) => a - b);
      const first = lessonPairs.value.find((p) => p.number === sorted[0]);
      const last = lessonPairs.value.find((p) => p.number === sorted[sorted.length - 1]);
      if (!first || !last) return "";
      return `${first.startTime} - ${last.endTime}`;
    });
    const computedDuration = computed(() => {
      const periodDurationMinutes = parseInt(scheduleSettings.value.period_duration_minutes || "40", 10);
      if (timeMode.value === "pairs") {
        const totalMinutes = selectedPairs.value.length * periodDurationMinutes;
        return Math.ceil(totalMinutes / 45);
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
      return Math.ceil((endMinutes - startMinutes) / 45);
    });
    const colorOptions = [
      { value: "primary", bg: "bg-primary", label: "Синий" },
      { value: "success", bg: "bg-success", label: "Зелёный" },
      { value: "warning", bg: "bg-warning", label: "Оранжевый" },
      { value: "danger", bg: "bg-danger", label: "Красный" }
    ];
    const formatDateShort$1 = (dateStr) => {
      return formatDateShort(dateStr);
    };
    const getAcademicHourWord = (count) => {
      if (count === 1) return "а-ч";
      return "а-ч";
    };
    const getTestWord = (count) => {
      const lastDigit = count % 10;
      const lastTwoDigits = count % 100;
      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "тестов";
      if (lastDigit === 1) return "тест";
      if (lastDigit >= 2 && lastDigit <= 4) return "теста";
      return "тестов";
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
        const response = await authFetch("/api/groups?limit=1000&isActive=true");
        console.log("[EventModal] Ответ API groups:", response);
        if (response.success && response.groups) {
          if (response.groups.length > 0) {
            console.log("[EventModal] Первая группа:", JSON.stringify(response.groups[0], null, 2));
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
            const disciplineExists = disciplines.value.some((d) => d.id === savedDisciplineId);
            if (disciplineExists) {
              form.value.disciplineId = savedDisciplineId;
              if (savedInstructorId) {
                const discipline = disciplines.value.find((d) => d.id === savedDisciplineId);
                const instructorExists = discipline?.instructors.some((i) => i.id === savedInstructorId);
                if (instructorExists) {
                  form.value.instructorId = savedInstructorId;
                }
              }
              if (form.value.eventType === "assessment") {
                loadDisciplineTests(savedDisciplineId);
              }
              validateHours();
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
      if (form.value.groupId) {
        loadGroupDisciplines(form.value.groupId);
      } else {
        selectedGroupInfo.value = null;
      }
      validateHours();
    };
    const handleDisciplineChange = () => {
      form.value.instructorId = "";
      disciplineTests.value = [];
      if (selectedDiscipline.value?.instructors.length) {
        const primary = selectedDiscipline.value.instructors.find((i) => i.isPrimary);
        if (primary) {
          form.value.instructorId = primary.id;
        }
      }
      if (form.value.eventType === "assessment" && form.value.disciplineId) {
        loadDisciplineTests(form.value.disciplineId);
      }
      validateHours();
    };
    const loadDisciplineTests = async (disciplineId) => {
      if (!disciplineId) {
        disciplineTests.value = [];
        return;
      }
      console.log("[EventModal] Загрузка тестов для дисциплины:", disciplineId);
      loadingTests.value = true;
      try {
        const response = await authFetch(
          `/api/discipline-tests?discipline_id=${disciplineId}`
        );
        console.log("[EventModal] Ответ API discipline-tests:", response);
        if (response.success) {
          disciplineTests.value = response.tests || [];
          console.log("[EventModal] Загружено тестов:", disciplineTests.value.length);
        }
      } catch (err) {
        console.error("[EventModal] Error loading discipline tests:", err);
        disciplineTests.value = [];
      } finally {
        loadingTests.value = false;
      }
    };
    const handleEventTypeChange = () => {
      if (form.value.eventType === "assessment" && form.value.disciplineId) {
        loadDisciplineTests(form.value.disciplineId);
      } else {
        disciplineTests.value = [];
      }
      validateHours();
    };
    const handlePairChange = () => {
      selectedPairs.value.sort((a, b) => a - b);
      validateHours();
    };
    const validateHours = () => {
      hoursWarning.value = null;
      if (!selectedDiscipline.value || !form.value.eventType) return;
      const eventType = form.value.eventType;
      if (eventType !== "theory" && eventType !== "practice" && eventType !== "assessment") {
        return;
      }
      const remainingHours = selectedDiscipline.value.remainingHours[eventType];
      const plannedHours = computedDuration.value;
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
      const durationMinutes = computedDuration.value * 45;
      if (durationMinutes <= 0) return;
      instructorHoursCheckLoading.value = true;
      try {
        const response = await authFetch(`/api/instructors/${form.value.instructorId}/hours/check?minutes=${durationMinutes}`, {
          method: "GET"
        });
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
      } else if (selectedGroupInfo.value) {
        const date = form.value.date;
        if (date < selectedGroupInfo.value.startDate || date > selectedGroupInfo.value.endDate) {
          errors.value.date = "Дата должна быть в пределах периода обучения группы";
        }
      }
      if (timeMode.value === "pairs") {
        if (selectedPairs.value.length === 0) {
          errors.value.time = "Выберите хотя бы одну пару";
        }
      } else {
        if (!form.value.startTime) {
          errors.value.startTime = "Укажите время начала";
        }
        if (!form.value.endTime) {
          errors.value.endTime = "Укажите время окончания";
        }
        if (form.value.startTime && form.value.endTime && form.value.endTime <= form.value.startTime) {
          errors.value.endTime = "Время окончания должно быть позже начала";
        }
      }
      if (hoursWarning.value) {
        errors.value.time = "Исправьте превышение лимита часов";
      }
      return Object.keys(errors.value).length === 0;
    };
    const getSubmitDataForGroup = (pairNumbers) => {
      const sorted = [...pairNumbers].sort((a, b) => a - b);
      const first = lessonPairs.value.find((p) => p.number === sorted[0]);
      const last = lessonPairs.value.find((p) => p.number === sorted[sorted.length - 1]);
      const startTimeStr = toLocalISOString(form.value.date, first.startTime);
      const endTimeStr = toLocalISOString(form.value.date, last.endTime);
      const title = selectedDiscipline.value?.name || "Занятие";
      return {
        title,
        description: form.value.description.trim() || void 0,
        groupId: form.value.groupId,
        disciplineId: form.value.disciplineId,
        instructorId: form.value.instructorId,
        classroomId: form.value.classroomId || void 0,
        startTime: startTimeStr,
        endTime: endTimeStr,
        isAllDay: false,
        color: form.value.color,
        eventType: form.value.eventType
      };
    };
    const getSubmitData = () => {
      let startTimeStr;
      let endTimeStr;
      if (timeMode.value === "pairs" && selectedPairs.value.length > 0) {
        return getSubmitDataForGroup(selectedPairs.value);
      } else {
        startTimeStr = toLocalISOString(form.value.date, form.value.startTime);
        endTimeStr = toLocalISOString(form.value.date, form.value.endTime);
      }
      const title = selectedDiscipline.value?.name || "Занятие";
      return {
        title,
        description: form.value.description.trim() || void 0,
        groupId: form.value.groupId,
        disciplineId: form.value.disciplineId,
        instructorId: form.value.instructorId,
        classroomId: form.value.classroomId || void 0,
        startTime: startTimeStr,
        endTime: endTimeStr,
        isAllDay: false,
        color: form.value.color,
        eventType: form.value.eventType
      };
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
          console.log("[Schedule] Обновление занятия:", JSON.stringify(data, null, 2));
          const response = await authFetch(
            `/api/schedule/${props.event.id}`,
            { method: "PUT", body: data }
          );
          if (response.success) {
            notification.show({
              type: "success",
              title: "Занятие обновлено",
              message: `Занятие "${response.event.title}" успешно обновлено`
            });
            emit("saved", response.event);
          }
        } else if (timeMode.value === "pairs" && hasNonConsecutivePairs.value) {
          console.log("[Schedule] Создание нескольких занятий:", consecutiveGroups.value);
          const createdEvents = [];
          for (const group of consecutiveGroups.value) {
            const data = getSubmitDataForGroup(group);
            console.log("[Schedule] Создание занятия для группы а-ч:", group, data);
            const response = await authFetch(
              "/api/schedule",
              { method: "POST", body: data }
            );
            if (response.success) {
              createdEvents.push(response.event);
              if (form.value.eventType === "assessment" && disciplineTests.value.length > 0 && response.event.id) {
                await createTestAssignments(response.event.id, response.event.startTime);
              }
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
          console.log("[Schedule] Создание занятия:", JSON.stringify(data, null, 2));
          const response = await authFetch(
            "/api/schedule",
            { method: "POST", body: data }
          );
          if (response.success) {
            if (form.value.eventType === "assessment" && disciplineTests.value.length > 0 && response.event.id) {
              await createTestAssignments(response.event.id, response.event.startTime);
            }
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
    const createTestAssignments = async (eventId, eventStartTime) => {
      const tests = disciplineTests.value;
      if (tests.length === 0) {
        return;
      }
      let successCount = 0;
      let errorCount = 0;
      for (const test of tests) {
        try {
          let startDate = void 0;
          let endDate = void 0;
          if (form.value.date && form.value.startTime) {
            startDate = `${form.value.date} ${form.value.startTime}:00`;
          }
          if (form.value.date && form.value.endTime) {
            endDate = `${form.value.date} ${form.value.endTime}:00`;
          }
          const assignmentData = {
            schedule_event_id: eventId,
            test_template_id: test.test_template_id,
            group_id: form.value.groupId,
            start_date: startDate,
            // Тест доступен с начала занятия
            end_date: endDate
            // Тест недоступен после окончания занятия
          };
          console.log("[Schedule] Создание назначения теста:", test.template_name, assignmentData);
          const response = await authFetch("/api/tests/assignments", {
            method: "POST",
            body: assignmentData
          });
          console.log("[Schedule] Ответ сервера:", JSON.stringify(response, null, 2));
          if (response.success) {
            successCount++;
          } else {
            errorCount++;
            console.warn("Не удалось создать назначение для теста:", test.template_name, response.message, response.error);
          }
        } catch (err) {
          errorCount++;
          console.error("Ошибка создания назначения теста:", test.template_name, err);
        }
      }
      if (successCount > 0) {
        notification.show({
          type: "success",
          title: "Тесты назначены",
          message: tests.length === 1 ? `Тест "${tests[0]?.template_name}" успешно привязан к занятию` : `Успешно назначено ${successCount} ${getTestWord(successCount)}`
        });
      }
      if (errorCount > 0) {
        notification.show({
          type: "warning",
          title: "Предупреждение",
          message: `Не удалось назначить ${errorCount} ${getTestWord(errorCount)}`
        });
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
      timeMode.value = "pairs";
      selectedPairs.value = [];
      hoursWarning.value = null;
      instructorHoursWarning.value = null;
      errors.value = {};
      disciplineTests.value = [];
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
          description: props.event.description || ""
        };
        if (form.value.groupId) {
          loadGroupDisciplines(form.value.groupId, true);
        }
        timeMode.value = "exact";
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
          description: ""
        };
        disciplines.value = [];
        selectedGroupInfo.value = null;
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
      }
    };
    watch(() => props.isOpen, async (isOpen) => {
      if (isOpen) {
        await loadScheduleSettings();
        await Promise.all([
          loadGroups(),
          loadClassrooms()
        ]);
        initForm();
      }
    });
    watch([() => form.value.startTime, () => form.value.endTime, () => selectedPairs.value.length], () => {
      validateHours();
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_NuxtLink = __nuxt_component_0$2;
      const _component_UiButton = __nuxt_component_1$1;
      const _component_UiConfirmModal = __nuxt_component_3;
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
              _push2(`<button type="button" class="${ssrRenderClass([[color.bg, unref(form).color === color.value ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-boxdark" : ""], "w-7 h-7 rounded-full transition-transform hover:scale-110"])}"${ssrRenderAttr("title", color.label)}${_scopeId}></button>`);
            });
            _push2(`<!--]--></div></div></div>`);
            if (unref(form).eventType === "assessment" && unref(form).disciplineId) {
              _push2(`<div class="rounded-lg border border-primary/30 bg-primary/5 p-4"${_scopeId}><div class="flex items-center gap-2 mb-3"${_scopeId}><div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"${_scopeId}><svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"${_scopeId}></path></svg></div><div${_scopeId}><h4 class="text-sm font-medium text-gray-900 dark:text-white"${_scopeId}>Автоматическое тестирование</h4><p class="text-xs text-gray-500 dark:text-gray-400"${_scopeId}>Тесты привязываются к дисциплине в разделе &quot;Учебные программы&quot;</p></div></div>`);
              if (unref(loadingTests)) {
                _push2(`<div class="flex items-center gap-2 py-2"${_scopeId}><div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"${_scopeId}></div><span class="text-sm text-gray-500"${_scopeId}>Проверка привязанных тестов...</span></div>`);
              } else if (unref(disciplineTests).length === 0) {
                _push2(`<div class="py-2"${_scopeId}><div class="flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/30"${_scopeId}><svg class="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><div${_scopeId}><p class="text-sm font-medium text-warning"${_scopeId}>К дисциплине не привязаны тесты</p><p class="text-xs text-gray-600 dark:text-gray-400 mt-1"${_scopeId}> Занятие будет создано без автоматического тестирования. `);
                _push2(ssrRenderComponent(_component_NuxtLink, {
                  to: "/programs",
                  class: "text-primary hover:underline"
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`Привязать тест в Учебных программах →`);
                    } else {
                      return [
                        createTextVNode("Привязать тест в Учебных программах →")
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
                _push2(`</p></div></div></div>`);
              } else if (unref(disciplineTests).length === 1 && unref(firstDisciplineTest)) {
                _push2(`<div class="py-2"${_scopeId}><div class="flex items-start gap-2 p-3 bg-success/10 rounded-lg border border-success/30"${_scopeId}><svg class="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg><div class="flex-1"${_scopeId}><p class="text-sm font-medium text-success"${_scopeId}>Будет использован тест:</p><p class="text-sm text-gray-900 dark:text-white font-medium mt-1"${_scopeId}>${ssrInterpolate(unref(firstDisciplineTest).template_name)} <span class="text-xs font-normal text-gray-500"${_scopeId}>(${ssrInterpolate(unref(firstDisciplineTest).template_code)})</span></p><div class="mt-2 flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400"${_scopeId}><span class="inline-flex items-center gap-1"${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg> ${ssrInterpolate(unref(firstDisciplineTest).questions_count)} вопросов </span>`);
                if (unref(firstDisciplineTest).time_limit_minutes) {
                  _push2(`<span class="inline-flex items-center gap-1"${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg> ${ssrInterpolate(unref(firstDisciplineTest).time_limit_minutes)} мин. </span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<span class="inline-flex items-center gap-1"${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg> Проходной: ${ssrInterpolate(unref(firstDisciplineTest).passing_score)}% </span>`);
                if (unref(firstDisciplineTest).is_required) {
                  _push2(`<span class="inline-flex items-center gap-1 text-danger"${_scopeId}><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg> Обязательный </span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div></div></div>`);
              } else {
                _push2(`<div class="py-2"${_scopeId}><div class="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/30"${_scopeId}><svg class="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"${_scopeId}></path></svg><div class="flex-1"${_scopeId}><p class="text-sm font-medium text-primary"${_scopeId}> К дисциплине привязано ${ssrInterpolate(unref(disciplineTests).length)} ${ssrInterpolate(getTestWord(unref(disciplineTests).length))}</p><p class="text-xs text-gray-600 dark:text-gray-400 mt-1"${_scopeId}> Будут созданы назначения для всех тестов </p><div class="mt-3 space-y-2"${_scopeId}><!--[-->`);
                ssrRenderList(unref(disciplineTests), (test) => {
                  _push2(`<div class="flex items-center justify-between p-2 bg-white/50 dark:bg-boxdark/50 rounded border border-stroke/50 dark:border-strokedark/50"${_scopeId}><div${_scopeId}><span class="text-sm text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(test.template_name)}</span><span class="text-xs text-gray-500 ml-1"${_scopeId}>(${ssrInterpolate(test.template_code)})</span></div><div class="flex items-center gap-2 text-xs text-gray-500"${_scopeId}><span${_scopeId}>${ssrInterpolate(test.questions_count)} вопр.</span>`);
                  if (test.time_limit_minutes) {
                    _push2(`<span${_scopeId}>${ssrInterpolate(test.time_limit_minutes)} мин.</span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (test.is_required) {
                    _push2(`<span class="text-danger font-medium"${_scopeId}>Обязат.</span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div></div>`);
                });
                _push2(`<!--]--></div></div></div></div>`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="grid grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Дата <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", unref(form).date)} type="date"${ssrRenderAttr("min", unref(selectedGroupInfo)?.startDate)}${ssrRenderAttr("max", unref(selectedGroupInfo)?.endDate)} class="${ssrRenderClass([{ "border-danger": unref(errors).date }, "w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary text-sm"])}"${_scopeId}>`);
            if (unref(errors).date) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).date)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}>Аудитория</label><div class="relative"${_scopeId}><select class="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).classroomId) ? ssrLooseContain(unref(form).classroomId, "") : ssrLooseEqual(unref(form).classroomId, "")) ? " selected" : ""}${_scopeId}>Не выбрана</option><!--[-->`);
            ssrRenderList(unref(classrooms), (classroom) => {
              _push2(`<option${ssrRenderAttr("value", classroom.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).classroomId) ? ssrLooseContain(unref(form).classroomId, classroom.id) : ssrLooseEqual(unref(form).classroomId, classroom.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(classroom.name)} (${ssrInterpolate(classroom.capacity)} мест) </option>`);
            });
            _push2(`<!--]--></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div></div><div${_scopeId}><div class="flex items-center justify-between mb-2"${_scopeId}><label class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}> Время <span class="text-danger"${_scopeId}>*</span></label><div class="flex rounded-lg border border-stroke dark:border-strokedark overflow-hidden"${_scopeId}><button type="button" class="${ssrRenderClass([[unref(timeMode) === "pairs" ? "bg-primary text-white" : "bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300"], "px-3 py-1 text-xs font-medium transition-colors"])}"${_scopeId}>По а-ч</button><button type="button" class="${ssrRenderClass([[unref(timeMode) === "exact" ? "bg-primary text-white" : "bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300"], "px-3 py-1 text-xs font-medium transition-colors"])}"${_scopeId}>Точное</button></div></div>`);
            if (unref(timeMode) === "pairs") {
              _push2(`<div${_scopeId}><div class="grid grid-cols-4 gap-1.5"${_scopeId}><!--[-->`);
              ssrRenderList(unref(lessonPairs), (pair) => {
                _push2(`<label class="${ssrRenderClass([[unref(selectedPairs).includes(pair.number) ? "border-primary bg-primary/10" : "border-stroke dark:border-strokedark hover:border-primary/50"], "relative flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all text-center"])}"${_scopeId}><input type="checkbox"${ssrRenderAttr("value", pair.number)}${ssrIncludeBooleanAttr(Array.isArray(unref(selectedPairs)) ? ssrLooseContain(unref(selectedPairs), pair.number) : unref(selectedPairs)) ? " checked" : ""} class="sr-only"${_scopeId}><div${_scopeId}><div class="text-xs font-medium"${_scopeId}>${ssrInterpolate(pair.number)} а-ч</div><div class="text-[10px] text-gray-500"${_scopeId}>${ssrInterpolate(pair.startTime)}-${ssrInterpolate(pair.endTime)}</div></div>`);
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
            } else {
              _push2(`<div class="grid grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><label class="block text-xs text-gray-500 mb-1"${_scopeId}>Начало</label><input${ssrRenderAttr("value", unref(form).startTime)} type="time" class="${ssrRenderClass([{ "border-danger": unref(errors).startTime }, "w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 text-sm"])}"${_scopeId}></div><div${_scopeId}><label class="block text-xs text-gray-500 mb-1"${_scopeId}>Окончание</label><input${ssrRenderAttr("value", unref(form).endTime)} type="time" class="${ssrRenderClass([{ "border-danger": unref(errors).endTime }, "w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 text-sm"])}"${_scopeId}></div></div>`);
            }
            if (unref(errors).time || unref(errors).startTime || unref(errors).endTime) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(errors).time || unref(errors).startTime || unref(errors).endTime)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(hoursWarning)) {
              _push2(`<div class="mt-2 p-2 bg-warning/10 rounded-lg border border-warning/30 flex items-start gap-2"${_scopeId}><svg class="w-4 h-4 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><p class="text-xs text-warning"${_scopeId}>${ssrInterpolate(unref(hoursWarning))}</p></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(instructorHoursWarning)) {
              _push2(`<div class="mt-2 p-2 bg-danger/10 rounded-lg border border-danger/30 flex items-start gap-2"${_scopeId}><svg class="w-4 h-4 text-danger shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><div${_scopeId}><p class="text-xs text-danger font-medium"${_scopeId}>Лимит часов инструктора</p><p class="text-xs text-danger"${_scopeId}>${ssrInterpolate(unref(instructorHoursWarning))}</p></div></div>`);
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
                          class: ["w-7 h-7 rounded-full transition-transform hover:scale-110", [color.bg, unref(form).color === color.value ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-boxdark" : ""]],
                          title: color.label
                        }, null, 10, ["onClick", "title"]);
                      }), 64))
                    ])
                  ])
                ]),
                unref(form).eventType === "assessment" && unref(form).disciplineId ? (openBlock(), createBlock("div", {
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
                      createVNode("h4", { class: "text-sm font-medium text-gray-900 dark:text-white" }, "Автоматическое тестирование"),
                      createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, 'Тесты привязываются к дисциплине в разделе "Учебные программы"')
                    ])
                  ]),
                  unref(loadingTests) ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "flex items-center gap-2 py-2"
                  }, [
                    createVNode("div", { class: "h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" }),
                    createVNode("span", { class: "text-sm text-gray-500" }, "Проверка привязанных тестов...")
                  ])) : unref(disciplineTests).length === 0 ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "py-2"
                  }, [
                    createVNode("div", { class: "flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/30" }, [
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
                        createVNode("p", { class: "text-sm font-medium text-warning" }, "К дисциплине не привязаны тесты"),
                        createVNode("p", { class: "text-xs text-gray-600 dark:text-gray-400 mt-1" }, [
                          createTextVNode(" Занятие будет создано без автоматического тестирования. "),
                          createVNode(_component_NuxtLink, {
                            to: "/programs",
                            class: "text-primary hover:underline"
                          }, {
                            default: withCtx(() => [
                              createTextVNode("Привязать тест в Учебных программах →")
                            ]),
                            _: 1
                          })
                        ])
                      ])
                    ])
                  ])) : unref(disciplineTests).length === 1 && unref(firstDisciplineTest) ? (openBlock(), createBlock("div", {
                    key: 2,
                    class: "py-2"
                  }, [
                    createVNode("div", { class: "flex items-start gap-2 p-3 bg-success/10 rounded-lg border border-success/30" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-success shrink-0 mt-0.5",
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
                      createVNode("div", { class: "flex-1" }, [
                        createVNode("p", { class: "text-sm font-medium text-success" }, "Будет использован тест:"),
                        createVNode("p", { class: "text-sm text-gray-900 dark:text-white font-medium mt-1" }, [
                          createTextVNode(toDisplayString(unref(firstDisciplineTest).template_name) + " ", 1),
                          createVNode("span", { class: "text-xs font-normal text-gray-500" }, "(" + toDisplayString(unref(firstDisciplineTest).template_code) + ")", 1)
                        ]),
                        createVNode("div", { class: "mt-2 flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400" }, [
                          createVNode("span", { class: "inline-flex items-center gap-1" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-3.5 h-3.5",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              })
                            ])),
                            createTextVNode(" " + toDisplayString(unref(firstDisciplineTest).questions_count) + " вопросов ", 1)
                          ]),
                          unref(firstDisciplineTest).time_limit_minutes ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "inline-flex items-center gap-1"
                          }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-3.5 h-3.5",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              })
                            ])),
                            createTextVNode(" " + toDisplayString(unref(firstDisciplineTest).time_limit_minutes) + " мин. ", 1)
                          ])) : createCommentVNode("", true),
                          createVNode("span", { class: "inline-flex items-center gap-1" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-3.5 h-3.5",
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
                            createTextVNode(" Проходной: " + toDisplayString(unref(firstDisciplineTest).passing_score) + "% ", 1)
                          ]),
                          unref(firstDisciplineTest).is_required ? (openBlock(), createBlock("span", {
                            key: 1,
                            class: "inline-flex items-center gap-1 text-danger"
                          }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-3.5 h-3.5",
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
                            createTextVNode(" Обязательный ")
                          ])) : createCommentVNode("", true)
                        ])
                      ])
                    ])
                  ])) : (openBlock(), createBlock("div", {
                    key: 3,
                    class: "py-2"
                  }, [
                    createVNode("div", { class: "flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/30" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-primary shrink-0 mt-0.5",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        })
                      ])),
                      createVNode("div", { class: "flex-1" }, [
                        createVNode("p", { class: "text-sm font-medium text-primary" }, " К дисциплине привязано " + toDisplayString(unref(disciplineTests).length) + " " + toDisplayString(getTestWord(unref(disciplineTests).length)), 1),
                        createVNode("p", { class: "text-xs text-gray-600 dark:text-gray-400 mt-1" }, " Будут созданы назначения для всех тестов "),
                        createVNode("div", { class: "mt-3 space-y-2" }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(unref(disciplineTests), (test) => {
                            return openBlock(), createBlock("div", {
                              key: test.id,
                              class: "flex items-center justify-between p-2 bg-white/50 dark:bg-boxdark/50 rounded border border-stroke/50 dark:border-strokedark/50"
                            }, [
                              createVNode("div", null, [
                                createVNode("span", { class: "text-sm text-gray-900 dark:text-white" }, toDisplayString(test.template_name), 1),
                                createVNode("span", { class: "text-xs text-gray-500 ml-1" }, "(" + toDisplayString(test.template_code) + ")", 1)
                              ]),
                              createVNode("div", { class: "flex items-center gap-2 text-xs text-gray-500" }, [
                                createVNode("span", null, toDisplayString(test.questions_count) + " вопр.", 1),
                                test.time_limit_minutes ? (openBlock(), createBlock("span", { key: 0 }, toDisplayString(test.time_limit_minutes) + " мин.", 1)) : createCommentVNode("", true),
                                test.is_required ? (openBlock(), createBlock("span", {
                                  key: 1,
                                  class: "text-danger font-medium"
                                }, "Обязат.")) : createCommentVNode("", true)
                              ])
                            ]);
                          }), 128))
                        ])
                      ])
                    ])
                  ]))
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
                      min: unref(selectedGroupInfo)?.startDate,
                      max: unref(selectedGroupInfo)?.endDate,
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
                    ]),
                    createVNode("div", { class: "flex rounded-lg border border-stroke dark:border-strokedark overflow-hidden" }, [
                      createVNode("button", {
                        type: "button",
                        onClick: ($event) => timeMode.value = "pairs",
                        class: ["px-3 py-1 text-xs font-medium transition-colors", [unref(timeMode) === "pairs" ? "bg-primary text-white" : "bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300"]]
                      }, "По а-ч", 10, ["onClick"]),
                      createVNode("button", {
                        type: "button",
                        onClick: ($event) => timeMode.value = "exact",
                        class: ["px-3 py-1 text-xs font-medium transition-colors", [unref(timeMode) === "exact" ? "bg-primary text-white" : "bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300"]]
                      }, "Точное", 10, ["onClick"])
                    ])
                  ]),
                  unref(timeMode) === "pairs" ? (openBlock(), createBlock("div", { key: 0 }, [
                    createVNode("div", { class: "grid grid-cols-4 gap-1.5" }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(lessonPairs), (pair) => {
                        return openBlock(), createBlock("label", {
                          key: pair.number,
                          class: ["relative flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all text-center", [unref(selectedPairs).includes(pair.number) ? "border-primary bg-primary/10" : "border-stroke dark:border-strokedark hover:border-primary/50"]]
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
                  ])) : (openBlock(), createBlock("div", {
                    key: 1,
                    class: "grid grid-cols-2 gap-4"
                  }, [
                    createVNode("div", null, [
                      createVNode("label", { class: "block text-xs text-gray-500 mb-1" }, "Начало"),
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => unref(form).startTime = $event,
                        type: "time",
                        class: ["w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 text-sm", { "border-danger": unref(errors).startTime }]
                      }, null, 10, ["onUpdate:modelValue"]), [
                        [vModelText, unref(form).startTime]
                      ])
                    ]),
                    createVNode("div", null, [
                      createVNode("label", { class: "block text-xs text-gray-500 mb-1" }, "Окончание"),
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => unref(form).endTime = $event,
                        type: "time",
                        class: ["w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 text-sm", { "border-danger": unref(errors).endTime }]
                      }, null, 10, ["onUpdate:modelValue"]), [
                        [vModelText, unref(form).endTime]
                      ])
                    ])
                  ])),
                  unref(errors).time || unref(errors).startTime || unref(errors).endTime ? (openBlock(), createBlock("p", {
                    key: 2,
                    class: "mt-1 text-xs text-danger"
                  }, toDisplayString(unref(errors).time || unref(errors).startTime || unref(errors).endTime), 1)) : createCommentVNode("", true),
                  unref(hoursWarning) ? (openBlock(), createBlock("div", {
                    key: 3,
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
                    key: 4,
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
                      createVNode("p", { class: "text-xs text-danger font-medium" }, "Лимит часов инструктора"),
                      createVNode("p", { class: "text-xs text-danger" }, toDisplayString(unref(instructorHoursWarning)), 1)
                    ])
                  ])) : createCommentVNode("", true),
                  unref(instructorHoursCheckLoading) ? (openBlock(), createBlock("div", {
                    key: 5,
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
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/schedule/EventModal.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$2, { __name: "ScheduleEventModal" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "CalendarView",
  __ssrInlineRender: true,
  setup(__props) {
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const {
      canCreateSchedule,
      canEditSchedule
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
    const selectedEvent = ref(null);
    const editingEvent = ref(null);
    const defaultEventStart = ref(void 0);
    const defaultEventEnd = ref(void 0);
    const currentDateRange = ref(null);
    const filters = ref({
      groupId: "",
      instructorId: "",
      classroomId: ""
    });
    const hasActiveFilters = computed(() => {
      return filters.value.groupId || filters.value.instructorId || filters.value.classroomId;
    });
    const viewOptions = [
      { value: "dayGridMonth", label: "Месяц" },
      { value: "timeGridWeek", label: "Неделя" },
      { value: "timeGridDay", label: "День" },
      { value: "listWeek", label: "Список" }
    ];
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
      return Array.from(groupMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    });
    const transformEventForCalendar = (event) => {
      const defaultColors = { bg: "#3C50E0", border: "#3C50E0", text: "#ffffff" };
      const colors = eventColors[event.color] ?? defaultColors;
      const titleWithClassroom = event.classroom?.name ? `${event.title} (${event.classroom.name})` : event.title;
      const groupColor = getGroupColor(event.groupId || void 0);
      return {
        id: event.id,
        title: titleWithClassroom,
        start: event.startTime,
        end: event.endTime,
        allDay: false,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        // Добавляем класс с data-атрибутом для CSS-стилизации полосы группы
        classNames: event.groupId ? [`group-stripe-${hashStringToIndex(event.groupId)}`] : [],
        extendedProps: {
          description: event.description || void 0,
          groupId: event.groupId || void 0,
          groupCode: event.group?.code,
          groupColor,
          instructorId: event.instructorId || void 0,
          instructorName: event.instructor?.fullName,
          classroomId: event.classroomId || void 0,
          classroomName: event.classroom?.name,
          eventType: event.eventType,
          color: event.color
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
        const startTimeStr = `${String(arg.start.getHours()).padStart(2, "0")}:${String(arg.start.getMinutes()).padStart(2, "0")}`;
        const endTimeStr = `${String(arg.end.getHours()).padStart(2, "0")}:${String(arg.end.getMinutes()).padStart(2, "0")}`;
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
      const isCopyMode = info.jsEvent.ctrlKey || info.jsEvent.metaKey;
      try {
        if (isCopyMode) {
          info.revert();
          const newStartTime = info.event.start ? dateToLocalIsoString(info.event.start) : void 0;
          const newEndTime = info.event.end ? dateToLocalIsoString(info.event.end) : dateToLocalIsoString(new Date(info.event.start.getTime() + 60 * 60 * 1e3));
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
          await authFetch(`/api/schedule/${event.id}`, {
            method: "PUT",
            body: {
              startTime: info.event.start ? dateToLocalIsoString(info.event.start) : void 0,
              endTime: info.event.end ? dateToLocalIsoString(info.event.end) : dateToLocalIsoString(new Date(info.event.start.getTime() + 60 * 60 * 1e3))
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
      try {
        await authFetch(`/api/schedule/${event.id}`, {
          method: "PUT",
          body: {
            endTime: info.event.end ? dateToLocalIsoString(info.event.end) : void 0
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
      <span class="event-tooltip-text">${getEventTypeLabel(extendedProps.eventType)}</span>
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
      return `${String(Math.max(0, hours)).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
    });
    const slotMaxTime = computed(() => {
      const lastEnd = getLastPeriodEnd.value;
      const parts = lastEnd.split(":").map(Number);
      const h = parts[0] ?? 18;
      const m = parts[1] ?? 20;
      const bufferMinutes = h * 60 + m + 30;
      const hours = Math.floor(bufferMinutes / 60);
      const mins = bufferMinutes % 60;
      return `${String(Math.min(24, hours)).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
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
      const timeStr = `${String(arg.date.getHours()).padStart(2, "0")}:${String(arg.date.getMinutes()).padStart(2, "0")}`;
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
      const periodDuration = parseInt(scheduleSettings.value.period_duration_minutes || "40", 10);
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
        if (filters.value.instructorId) params.append("instructorId", filters.value.instructorId);
        if (filters.value.classroomId) params.append("classroomId", filters.value.classroomId);
        const response = await authFetch(
          `/api/schedule?${params.toString()}`,
          { signal: controller.signal }
        );
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
      const transformedEvents = events.value.map(transformEventForCalendar);
      transformedEvents.forEach((event) => {
        api.addEvent(event);
      });
    };
    const openAddModal = (start) => {
      editingEvent.value = null;
      defaultEventStart.value = /* @__PURE__ */ new Date();
      defaultEventEnd.value = new Date((/* @__PURE__ */ new Date()).getTime() + 90 * 60 * 1e3);
      showEventModal.value = true;
    };
    const closeDetailModal = () => {
      showDetailModal.value = false;
      selectedEvent.value = null;
    };
    const handleEditFromDetail = (event) => {
      showDetailModal.value = false;
      editingEvent.value = event;
      showEventModal.value = true;
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
      if (currentDateRange.value) {
        loadEvents(currentDateRange.value.start, currentDateRange.value.end);
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$1;
      const _component_ScheduleEventDetailModal = __nuxt_component_1;
      const _component_ScheduleEventModal = __nuxt_component_2;
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
      _push(`<div class="mb-2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-4"><span>💡 <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-meta-4 rounded text-[10px]">CTRL</kbd> + перетаскивание = копирование занятия</span></div>`);
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
          })}"${ssrRenderAttr("title", unref(filters).groupId === group.id ? "Нажмите, чтобы сбросить фильтр" : "Нажмите, чтобы фильтровать по группе")}><span class="w-3 h-3 rounded-full shrink-0 shadow-sm" style="${ssrRenderStyle({ backgroundColor: group.color })}"></span><span class="text-gray-700 dark:text-gray-300">${ssrInterpolate(group.code)}</span></button>`);
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
        onEdit: handleEditFromDetail
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
    useAuthFetch();
    const stats = ref({
      today: 0,
      thisWeek: 0,
      activeGroups: 0,
      classrooms: 0
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
//# sourceMappingURL=schedule-BcMfRny-.mjs.map
