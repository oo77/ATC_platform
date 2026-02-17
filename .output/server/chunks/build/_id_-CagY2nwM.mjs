import { _ as __nuxt_component_0 } from './nuxt-link-DnWQlAEm.mjs';
import { ref, computed, mergeProps, withCtx, createBlock, createTextVNode, openBlock, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderStyle, ssrRenderList, ssrRenderAttr } from 'vue/server-renderer';
import { l as useRoute } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
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

const _sfc_main = {
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    route.params.id;
    const loading = ref(true);
    const course = ref(null);
    const activeTab = ref("schedule");
    const tests = ref([]);
    const certificates = ref([]);
    const testsLoading = ref(false);
    const tabs = [
      { id: "schedule", label: "Программа обучения" },
      { id: "tests", label: "Тесты" },
      { id: "documents", label: "Документы" },
      { id: "grades", label: "Журнал оценок" }
    ];
    const gradedLessons = computed(() => {
      if (!course.value || !course.value.schedule) return [];
      return course.value.schedule.filter((l) => isPast(l.start_time) || l.grade !== null);
    });
    useAuthFetch();
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("ru-RU");
    };
    const formatDateTime = (dateStr) => {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const getStatusLabel = (status) => {
      const map = {
        active: "Активен",
        completed: "Завершен",
        dropped: "Отчислен"
      };
      return map[status] || status;
    };
    const getEventTypeLabel = (type) => {
      const map = {
        theory: "Лекция",
        practice: "Практика",
        assessment: "Тест/Экзамен",
        other: "Другое"
      };
      return map[type] || type;
    };
    const getAttendanceLabel = (status) => {
      const map = {
        present: "Присутствовал",
        absent: "Пропуск",
        late: "Опоздание",
        excused: "Ув. причина"
      };
      return map[status] || status;
    };
    const isPast = (dateStr) => {
      return new Date(dateStr) < /* @__PURE__ */ new Date();
    };
    const getTestStatusLabel = (status, passed) => {
      if (status === "completed") return passed ? "Сдан" : "Не сдан";
      if (status === "in_progress") return "В процессе";
      return "Назначен";
    };
    const getTestStatusClass = (status, passed) => {
      if (status === "completed") return passed ? "bg-success/10 text-success" : "bg-danger/10 text-danger";
      if (status === "in_progress") return "bg-warning/10 text-warning";
      return "bg-primary/10 text-primary";
    };
    const canTakeTest = (test) => {
      const now = /* @__PURE__ */ new Date();
      if (test.status === "completed" && test.attempts_used >= test.max_attempts) return false;
      if (test.start_date && new Date(test.start_date) > now) return false;
      if (test.end_date && new Date(test.end_date) < now) return false;
      return true;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/my-courses",
        class: "flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"${_scopeId}></path></svg> Назад к списку курсов `);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                class: "h-4 w-4",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": "2",
                  d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                })
              ])),
              createTextVNode(" Назад к списку курсов ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-20"><div class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (!course.value) {
        _push(`<div class="text-center py-10"><h3 class="text-xl font-medium">Курс не найден</h3></div>`);
      } else {
        _push(`<div class="space-y-6"><div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-6 shadow-md dark:bg-boxdark"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white mb-2">${ssrInterpolate(course.value.info.course_name)}</h2><p class="text-sm font-medium text-gray-500 dark:text-gray-400"> Группа: ${ssrInterpolate(course.value.info.group_name)} • ${ssrInterpolate(course.value.info.teacher_name || "Преподаватель не назначен")}</p></div><div class="flex flex-col items-end gap-2"><span class="${ssrRenderClass([
          "rounded-full px-3 py-1 text-sm font-medium",
          course.value.info.status === "active" ? "bg-success/10 text-success" : course.value.info.status === "completed" ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"
        ])}">${ssrInterpolate(getStatusLabel(course.value.info.status))}</span><span class="text-sm text-gray-500">${ssrInterpolate(formatDate(course.value.info.start_date))} — ${ssrInterpolate(formatDate(course.value.info.end_date))}</span></div></div><div class="mt-6"><div class="mb-2 flex items-center justify-between"><span class="text-sm font-medium text-black dark:text-white">Прогресс обучения</span><span class="text-sm font-medium text-primary">${ssrInterpolate(course.value.info.progress)}%</span></div><div class="relative h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700"><div class="absolute left-0 h-full rounded-full bg-primary" style="${ssrRenderStyle({ width: `${course.value.info.progress}%` })}"></div></div><div class="mt-2 text-xs text-gray-500 flex justify-between"><span>Посещено: ${ssrInterpolate(course.value.info.attended_lessons)} / ${ssrInterpolate(course.value.info.total_lessons)} занятий</span></div></div></div><div class="flex flex-col gap-6"><div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800 w-fit overflow-x-auto max-w-full"><nav class="flex gap-1"><!--[-->`);
        ssrRenderList(tabs, (tab) => {
          _push(`<button class="${ssrRenderClass([
            "rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap",
            activeTab.value === tab.id ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          ])}">${ssrInterpolate(tab.label)} `);
          if (tab.id === "tests" && tests.value.length > 0) {
            _push(`<span class="${ssrRenderClass([activeTab.value === tab.id ? "text-white" : "text-gray-600 dark:text-gray-400", "ml-1.5 inline-flex items-center justify-center rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-semibold"])}">${ssrInterpolate(tests.value.length)}</span>`);
          } else {
            _push(`<!---->`);
          }
          if (tab.id === "documents" && certificates.value.length > 0) {
            _push(`<span class="${ssrRenderClass([activeTab.value === tab.id ? "text-white" : "text-gray-600 dark:text-gray-400", "ml-1.5 inline-flex items-center justify-center rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-semibold"])}">${ssrInterpolate(certificates.value.length)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</button>`);
        });
        _push(`<!--]--></nav></div><div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark"><div class="p-6" style="${ssrRenderStyle(activeTab.value === "schedule" ? null : { display: "none" })}"><div class="space-y-4"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Программа курса</h3>`);
        if (course.value.schedule.length === 0) {
          _push(`<div class="text-gray-500">Расписание пока не составлено</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(course.value.schedule, (lesson, index) => {
          _push(`<div class="relative flex gap-4 pb-6 last:pb-0 border-l border-gray-200 dark:border-gray-700 ml-3 pl-6"><div class="${ssrRenderClass([{
            "bg-success": lesson.attendance_status === "present",
            "bg-danger": lesson.attendance_status === "absent",
            "bg-warning": lesson.attendance_status === "late",
            "bg-primary": lesson.attendance_status === "excused",
            "bg-gray-300 dark:bg-gray-600": !lesson.attendance_status && isPast(lesson.start_time),
            "bg-blue-400": !lesson.attendance_status && !isPast(lesson.start_time)
          }, "absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border border-white dark:border-boxdark"])}"></div><div class="flex-1"><div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1"><h4 class="text-base font-semibold text-black dark:text-white">${ssrInterpolate(lesson.title)} `);
          if (lesson.event_type !== "theory") {
            _push(`<span class="ml-2 text-xs font-normal px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">${ssrInterpolate(getEventTypeLabel(lesson.event_type))}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</h4><span class="${ssrRenderClass([isPast(lesson.start_time) ? "text-gray-500" : "text-primary", "text-sm font-medium"])}">${ssrInterpolate(formatDateTime(lesson.start_time))}</span></div><p class="text-sm text-gray-500 mt-1">${ssrInterpolate(lesson.description || "Нет описания")}</p><div class="mt-3 flex items-center gap-3">`);
          if (lesson.attendance_status) {
            _push(`<span class="${ssrRenderClass([
              "text-xs px-2 py-1 rounded font-medium",
              lesson.attendance_status === "present" ? "bg-success/10 text-success" : lesson.attendance_status === "absent" ? "bg-danger/10 text-danger" : lesson.attendance_status === "late" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
            ])}">${ssrInterpolate(getAttendanceLabel(lesson.attendance_status))}</span>`);
          } else if (isPast(lesson.start_time)) {
            _push(`<span class="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500"> Нет статуса </span>`);
          } else {
            _push(`<!---->`);
          }
          if (lesson.grade !== null) {
            _push(`<span class="text-xs px-2 py-1 rounded font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"> Оценка: ${ssrInterpolate(lesson.grade)} / ${ssrInterpolate(lesson.max_grade || 100)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div>`);
        });
        _push(`<!--]--></div></div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "tests" ? null : { display: "none" })}"><div class="flex justify-between items-center mb-4"><h3 class="text-lg font-semibold text-gray-900 dark:text-white">Тестирование</h3>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/tests/my",
          class: "text-sm text-primary hover:underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Все мои тесты`);
            } else {
              return [
                createTextVNode("Все мои тесты")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
        if (testsLoading.value) {
          _push(`<div class="flex justify-center py-10"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
        } else if (tests.value.length === 0) {
          _push(`<div class="flex flex-col items-center justify-center py-10 text-gray-500"><svg class="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><p>Тесты пока не назначены</p></div>`);
        } else {
          _push(`<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-2"><!--[-->`);
          ssrRenderList(tests.value, (test) => {
            _push(`<div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-5 shadow-sm dark:bg-boxdark hover:shadow-md transition-shadow"><div class="flex justify-between items-start mb-3"><div><h4 class="text-lg font-semibold text-black dark:text-white">${ssrInterpolate(test.template_name)}</h4><span class="text-xs text-gray-500">${ssrInterpolate(test.discipline_name || "Основной курс")}</span></div><span class="${ssrRenderClass([
              "px-2 py-1 text-xs font-medium rounded",
              getTestStatusClass(test.status, test.passed)
            ])}">${ssrInterpolate(getTestStatusLabel(test.status, test.passed))}</span></div><div class="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">`);
            if (test.end_date) {
              _push(`<div class="flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Дедлайн: ${ssrInterpolate(formatDateTime(test.end_date))}</span></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<div class="flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Попыток: ${ssrInterpolate(test.attempts_used)} / ${ssrInterpolate(test.max_attempts)}</span></div>`);
            if (test.best_score !== null) {
              _push(`<div class="flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg><span class="${ssrRenderClass(test.passed ? "text-success font-medium" : "text-danger font-medium")}"> Результат: ${ssrInterpolate(test.best_score)}% ${ssrInterpolate(test.passed ? "(Сдан)" : "(Не сдан)")}</span></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
            if (test.status === "in_progress") {
              _push(ssrRenderComponent(_component_NuxtLink, {
                to: `/tests/session/${test.active_session_id}`,
                class: "flex w-full justify-center rounded bg-primary p-2 font-medium text-gray hover:bg-opacity-90"
              }, {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    _push2(` Продолжить попытку `);
                  } else {
                    return [
                      createTextVNode(" Продолжить попытку ")
                    ];
                  }
                }),
                _: 2
              }, _parent));
            } else if (canTakeTest(test)) {
              _push(ssrRenderComponent(_component_NuxtLink, {
                to: `/tests/start/${test.id}`,
                class: "flex w-full justify-center rounded bg-primary p-2 font-medium text-gray hover:bg-opacity-90"
              }, {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    _push2(` Начать тест `);
                  } else {
                    return [
                      createTextVNode(" Начать тест ")
                    ];
                  }
                }),
                _: 2
              }, _parent));
            } else {
              _push(`<button class="flex w-full justify-center rounded bg-gray-200 p-2 font-medium text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400" disabled> Недоступен </button>`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "documents" ? null : { display: "none" })}"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Сертификаты и документы</h3>`);
        if (certificates.value.length === 0) {
          _push(`<div class="text-gray-500">Документов пока нет</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="grid gap-4 md:grid-cols-2"><!--[-->`);
        ssrRenderList(certificates.value, (cert) => {
          _push(`<div class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-4 shadow-sm dark:bg-boxdark"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded bg-primary/5 text-primary"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div><h4 class="font-medium text-black dark:text-white">Сертификат ${ssrInterpolate(cert.certificate_number)}</h4><p class="text-sm text-gray-500">Выдан: ${ssrInterpolate(formatDate(cert.issue_date))}</p></div></div><a${ssrRenderAttr("href", `/certificates/view/${cert.uuid || ""}`)} target="_blank" class="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"> Скачать </a></div>`);
        });
        _push(`<!--]--></div></div><div class="p-0" style="${ssrRenderStyle(activeTab.value === "grades" ? null : { display: "none" })}"><div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4"><h3 class="text-lg font-semibold text-gray-900 dark:text-white">Успеваемость</h3></div><div class="max-w-full overflow-x-auto"><table class="w-full table-auto"><thead><tr class="bg-gray-2 text-left dark:bg-meta-4"><th class="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">Занятие</th><th class="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Дата</th><th class="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Посещаемость</th><th class="py-4 px-4 font-medium text-black dark:text-white">Оценка</th></tr></thead><tbody>`);
        if (gradedLessons.value.length === 0) {
          _push(`<tr><td colspan="4" class="py-5 px-4 pl-9 xl:pl-11 text-center text-gray-500">Оценок пока нет</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(gradedLessons.value, (lesson) => {
          _push(`<tr><td class="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11"><h5 class="font-medium text-black dark:text-white">${ssrInterpolate(lesson.title)}</h5><span class="text-xs text-gray-500">${ssrInterpolate(getEventTypeLabel(lesson.event_type))}</span></td><td class="border-b border-[#eee] py-5 px-4 dark:border-strokedark"><p class="text-sm text-black dark:text-white">${ssrInterpolate(formatDate(lesson.start_time))}</p></td><td class="border-b border-[#eee] py-5 px-4 dark:border-strokedark"><span class="${ssrRenderClass([
            "inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium",
            lesson.attendance_status === "present" ? "bg-success text-success" : lesson.attendance_status === "absent" ? "bg-danger text-danger" : lesson.attendance_status === "late" ? "bg-warning text-warning" : lesson.attendance_status === "excused" ? "bg-primary text-primary" : "bg-gray-100 text-gray-500"
          ])}">${ssrInterpolate(getAttendanceLabel(lesson.attendance_status) || "-")}</span></td><td class="border-b border-[#eee] py-5 px-4 dark:border-strokedark">`);
          if (lesson.grade !== null) {
            _push(`<span class="font-bold text-black dark:text-white">${ssrInterpolate(lesson.grade)} / ${ssrInterpolate(lesson.max_grade || 100)}</span>`);
          } else {
            _push(`<span class="text-gray-400">-</span>`);
          }
          _push(`</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div></div></div></div></div>`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/my-courses/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-CagY2nwM.mjs.map
