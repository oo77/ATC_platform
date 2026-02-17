import { _ as __nuxt_component_0 } from './nuxt-link-DnWQlAEm.mjs';
import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { C as CalenderIcon, A as AcademicCapIcon, a as ClipboardCheckIcon, b as CertificateIcon, U as UserGroupIcon, c as UserCircleIcon, S as SettingsIcon, G as GridIcon } from './GridIcon-mmTMaVf3.mjs';
import { defineComponent, unref, ref, computed, mergeProps, withCtx, createVNode, createTextVNode, toDisplayString, createBlock, createCommentVNode, openBlock, watch, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderStyle, ssrRenderAttr } from 'vue/server-renderer';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import { C as CheckIcon } from './CheckIcon-DDFpKDY7.mjs';
import { I as InfoCircleIcon } from './InfoCircleIcon-DHC8ezgr.mjs';
import { u as useHead, e as useAuth, a as useRouter, _ as __nuxt_component_0$1 } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
import { I as InstructorsHoursStats, a as InstructorsCourseHistory } from './CourseHistory-C2KH9Ed5.mjs';
import { P as PlusIcon } from './PlusIcon-Be-nNmwb.mjs';
import { u as usePermissions } from './usePermissions-Dc3CsxMS.mjs';
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

const _sfc_main$g = {};
function _sfc_ssrRender$8(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fillRule="evenodd" clipRule="evenodd" d="M3.6501 12.0001C3.6501 7.38852 7.38852 3.6501 12.0001 3.6501C16.6117 3.6501 20.3501 7.38852 20.3501 12.0001C20.3501 16.6117 16.6117 20.3501 12.0001 20.3501C7.38852 20.3501 3.6501 16.6117 3.6501 12.0001ZM12.0001 1.8501C6.39441 1.8501 1.8501 6.39441 1.8501 12.0001C1.8501 17.6058 6.39441 22.1501 12.0001 22.1501C17.6058 22.1501 22.1501 17.6058 22.1501 12.0001C22.1501 6.39441 17.6058 1.8501 12.0001 1.8501ZM10.9992 7.52517C10.9992 8.07746 11.4469 8.52517 11.9992 8.52517H12.0002C12.5525 8.52517 13.0002 8.07746 13.0002 7.52517C13.0002 6.97289 12.5525 6.52517 12.0002 6.52517H11.9992C11.4469 6.52517 10.9992 6.97289 10.9992 7.52517ZM12.0002 17.3715C11.586 17.3715 11.2502 17.0357 11.2502 16.6215V10.945C11.2502 10.5308 11.586 10.195 12.0002 10.195C12.4144 10.195 12.7502 10.5308 12.7502 10.945V16.6215C12.7502 17.0357 12.4144 17.3715 12.0002 17.3715Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$g = _sfc_main$g.setup;
_sfc_main$g.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/WarningIcon.vue");
  return _sfc_setup$g ? _sfc_setup$g(props, ctx) : void 0;
};
const __nuxt_component_17 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$g, [["ssrRender", _sfc_ssrRender$8]]), { __name: "IconsWarningIcon" });
const _sfc_main$f = {};
function _sfc_ssrRender$7(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM10.9991 7.52507C10.9991 8.07736 11.4468 8.52507 11.9991 8.52507H12.0001C12.5524 8.52507 13.0001 8.07736 13.0001 7.52507C13.0001 6.97279 12.5524 6.52507 12.0001 6.52507H11.9991C11.4468 6.52507 10.9991 6.97279 10.9991 7.52507ZM12.0001 17.3714C11.5859 17.3714 11.2501 17.0356 11.2501 16.6214V10.9449C11.2501 10.5307 11.5859 10.1949 12.0001 10.1949C12.4143 10.1949 12.7501 10.5307 12.7501 10.9449V16.6214C12.7501 17.0356 12.4143 17.3714 12.0001 17.3714Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$f = _sfc_main$f.setup;
_sfc_main$f.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/SupportIcon.vue");
  return _sfc_setup$f ? _sfc_setup$f(props, ctx) : void 0;
};
const __nuxt_component_8$1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$f, [["ssrRender", _sfc_ssrRender$7]]), { __name: "IconsSupportIcon" });
const _sfc_main$e = {};
function _sfc_ssrRender$6(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M9.85954 4.0835C9.5834 4.0835 9.35954 4.30735 9.35954 4.5835V15.4161C9.35954 15.6922 9.5834 15.9161 9.85954 15.9161H10.1373C10.4135 15.9161 10.6373 15.6922 10.6373 15.4161V4.5835C10.6373 4.30735 10.4135 4.0835 10.1373 4.0835H9.85954ZM7.85954 4.5835C7.85954 3.47893 8.75497 2.5835 9.85954 2.5835H10.1373C11.2419 2.5835 12.1373 3.47893 12.1373 4.5835V15.4161C12.1373 16.5206 11.2419 17.4161 10.1373 17.4161H9.85954C8.75497 17.4161 7.85954 16.5206 7.85954 15.4161V4.5835ZM4.58203 8.9598C4.30589 8.9598 4.08203 9.18366 4.08203 9.4598V15.4168C4.08203 15.693 4.30589 15.9168 4.58203 15.9168H4.85981C5.13595 15.9168 5.35981 15.693 5.35981 15.4168V9.4598C5.35981 9.18366 5.13595 8.9598 4.85981 8.9598H4.58203ZM2.58203 9.4598C2.58203 8.35523 3.47746 7.4598 4.58203 7.4598H4.85981C5.96438 7.4598 6.85981 8.35523 6.85981 9.4598V15.4168C6.85981 16.5214 5.96438 17.4168 4.85981 17.4168H4.58203C3.47746 17.4168 2.58203 16.5214 2.58203 15.4168V9.4598ZM14.637 12.435C14.637 12.1589 14.8609 11.935 15.137 11.935H15.4148C15.691 11.935 15.9148 12.1589 15.9148 12.435V15.4168C15.9148 15.693 15.691 15.9168 15.4148 15.9168H15.137C14.8609 15.9168 14.637 15.693 14.637 15.4168V12.435ZM15.137 10.435C14.0325 10.435 13.137 11.3304 13.137 12.435V15.4168C13.137 16.5214 14.0325 17.4168 15.137 17.4168H15.4148C16.5194 17.4168 17.4148 16.5214 17.4148 15.4168V12.435C17.4148 11.3304 16.5194 10.435 15.4148 10.435H15.137Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/BarChartIcon.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
const __nuxt_component_8 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$e, [["ssrRender", _sfc_ssrRender$6]]), { __name: "IconsBarChartIcon" });
const _sfc_main$d = {};
function _sfc_ssrRender$5(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M10.7487 2.29248C10.7487 1.87827 10.4129 1.54248 9.9987 1.54248C9.58448 1.54248 9.2487 1.87827 9.2487 2.29248V2.83613C6.08132 3.20733 3.6237 5.9004 3.6237 9.16748V14.4591H3.33203C2.91782 14.4591 2.58203 14.7949 2.58203 15.2091C2.58203 15.6234 2.91782 15.9591 3.33203 15.9591H4.3737H15.6237H16.6654C17.0796 15.9591 17.4154 15.6234 17.4154 15.2091C17.4154 14.7949 17.0796 14.4591 16.6654 14.4591H16.3737V9.16748C16.3737 5.9004 13.9161 3.20733 10.7487 2.83613V2.29248ZM14.8737 14.4591V9.16748C14.8737 6.47509 12.6911 4.29248 9.9987 4.29248C7.30631 4.29248 5.1237 6.47509 5.1237 9.16748V14.4591H14.8737ZM7.9987 17.7085C7.9987 18.1228 8.33448 18.4585 8.7487 18.4585H11.2487C11.6629 18.4585 11.9987 18.1228 11.9987 17.7085C11.9987 17.2943 11.6629 16.9585 11.2487 16.9585H8.7487C8.33448 16.9585 7.9987 17.2943 7.9987 17.7085Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/BellIcon.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const __nuxt_component_15 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$d, [["ssrRender", _sfc_ssrRender$5]]), { __name: "IconsBellIcon" });
const _sfc_main$c = {};
function _sfc_ssrRender$4(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    className: "fill-current",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fillRule="evenodd" clipRule="evenodd" d="M20.3499 12.0004C20.3499 16.612 16.6115 20.3504 11.9999 20.3504C7.38832 20.3504 3.6499 16.612 3.6499 12.0004C3.6499 7.38881 7.38833 3.65039 11.9999 3.65039C16.6115 3.65039 20.3499 7.38881 20.3499 12.0004ZM11.9999 22.1504C17.6056 22.1504 22.1499 17.6061 22.1499 12.0004C22.1499 6.3947 17.6056 1.85039 11.9999 1.85039C6.39421 1.85039 1.8499 6.3947 1.8499 12.0004C1.8499 17.6061 6.39421 22.1504 11.9999 22.1504ZM13.0008 16.4753C13.0008 15.923 12.5531 15.4753 12.0008 15.4753L11.9998 15.4753C11.4475 15.4753 10.9998 15.923 10.9998 16.4753C10.9998 17.0276 11.4475 17.4753 11.9998 17.4753L12.0008 17.4753C12.5531 17.4753 13.0008 17.0276 13.0008 16.4753ZM11.9998 6.62898C12.414 6.62898 12.7498 6.96476 12.7498 7.37898L12.7498 13.0555C12.7498 13.4697 12.414 13.8055 11.9998 13.8055C11.5856 13.8055 11.2498 13.4697 11.2498 13.0555L11.2498 7.37898C11.2498 6.96476 11.5856 6.62898 11.9998 6.62898Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/ErrorIcon.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const __nuxt_component_19 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$c, [["ssrRender", _sfc_ssrRender$4]]), { __name: "IconsErrorIcon" });
const _sfc_main$b = {};
function _sfc_ssrRender$3(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path d="M5.83333 12.6665L10 8.49984L5.83333 4.33317" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`);
}
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/ChevronRightIcon.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const __nuxt_component_13 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$b, [["ssrRender", _sfc_ssrRender$3]]), { __name: "IconsChevronRightIcon" });
const _sfc_main$a = {
  __name: "DashboardStudent",
  __ssrInlineRender: true,
  setup(__props) {
    const { user } = useAuth();
    const stats = ref(null);
    const notifications = ref([]);
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    useAuthFetch();
    const quickActions = [
      { to: "/tests/my", label: "Пройти тест", icon: "test" },
      { to: "/schedule", label: "Расписание", icon: "calendar" },
      { to: "/my-certificates", label: "Сертификаты", icon: "certificate" },
      { to: "/support", label: "Помощь", icon: "support" }
    ];
    const unreadCount = computed(() => {
      return notifications.value?.filter((n) => !n.is_read).length || 0;
    });
    const formatTime = (dateStr) => {
      return new Date(dateStr).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long"
      });
    };
    const formatDateTime = (dateStr) => {
      return new Date(dateStr).toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const formatRelativeTime = (dateStr) => {
      const date = new Date(dateStr);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 6e4);
      if (diffMins < 1) return "только что";
      if (diffMins < 60) return `${diffMins} мин назад`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} ч назад`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays} дн назад`;
      return formatDate(dateStr);
    };
    const getEventTypeLabel = (type) => {
      const map = {
        theory: "Лекция",
        practice: "Практика",
        assessment: "Тест",
        other: "Другое"
      };
      return map[type] || type;
    };
    const getEventTypeClass = (type) => {
      const map = {
        theory: "bg-primary/10 text-primary",
        practice: "bg-success/10 text-success",
        assessment: "bg-warning/10 text-warning",
        other: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
      };
      return map[type] || map.other;
    };
    const getGradeClass = (grade) => {
      const percentage = grade;
      if (percentage >= 85) return "bg-success/10 text-success";
      if (percentage >= 70) return "bg-primary/10 text-primary";
      if (percentage >= 60) return "bg-warning/10 text-warning";
      return "bg-danger/10 text-danger";
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_IconsCalenderIcon = CalenderIcon;
      const _component_IconsWarningIcon = __nuxt_component_17;
      const _component_IconsCheckIcon = CheckIcon;
      const _component_IconsAcademicCapIcon = AcademicCapIcon;
      const _component_IconsClipboardCheckIcon = ClipboardCheckIcon;
      const _component_IconsCertificateIcon = CertificateIcon;
      const _component_IconsSupportIcon = __nuxt_component_8$1;
      const _component_IconsBarChartIcon = __nuxt_component_8;
      const _component_IconsBellIcon = __nuxt_component_15;
      const _component_IconsErrorIcon = __nuxt_component_19;
      const _component_IconsInfoCircleIcon = InfoCircleIcon;
      const _component_IconsChevronRightIcon = __nuxt_component_13;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Добро пожаловать, ${ssrInterpolate(unref(user)?.name || "Студент")}! </h2><p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">${ssrInterpolate(unref(currentDate))} `);
      if (stats.value?.upcomingEvents?.length) {
        _push(`<span> • У вас запланировано ${ssrInterpolate(stats.value.upcomingEvents.length)} занятие(я) </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</p></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/schedule" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UiButton, { class: "flex items-center gap-2" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_IconsCalenderIcon, { class: "w-5 h-5" }, null, _parent3, _scopeId2));
                  _push3(` Посмотреть расписание `);
                } else {
                  return [
                    createVNode(_component_IconsCalenderIcon, { class: "w-5 h-5" }),
                    createTextVNode(" Посмотреть расписание ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_UiButton, { class: "flex items-center gap-2" }, {
                default: withCtx(() => [
                  createVNode(_component_IconsCalenderIcon, { class: "w-5 h-5" }),
                  createTextVNode(" Посмотреть расписание ")
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="grid grid-cols-1 gap-6 xl:grid-cols-3"><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden xl:col-span-2"><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">`);
      _push(ssrRenderComponent(_component_IconsCalenderIcon, { class: "w-5 h-5 text-primary" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white"> Ближайшие занятия </h3></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/schedule",
        class: "text-sm text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Все`);
          } else {
            return [
              createTextVNode("Все")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="p-6">`);
      if (!stats.value?.upcomingEvents?.length) {
        _push(`<div class="text-center text-gray-500 py-4"> Нет предстоящих занятий на ближайшее время </div>`);
      } else {
        _push(`<div class="flex flex-col gap-5"><!--[-->`);
        ssrRenderList(stats.value.upcomingEvents, (event) => {
          _push(`<div class="flex flex-col gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"><div class="flex justify-between items-start"><div class="flex-1"><div class="flex items-center gap-2 mb-1"><h4 class="text-lg font-bold text-black dark:text-white">${ssrInterpolate(event.title)}</h4>`);
          if (event.allowed_student_ids || event.original_event_id) {
            _push(`<span class="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300" title="Занятие для перездачи"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Перездача </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><p class="text-sm font-medium text-gray-500">${ssrInterpolate(event.course_name)} `);
          if (event.classroom_name) {
            _push(`<span class="ml-1">• Ауд. ${ssrInterpolate(event.classroom_name)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p></div><div class="text-right"><span class="block text-lg font-bold text-primary">${ssrInterpolate(formatTime(event.start_time))}</span><span class="block text-sm text-gray-500">${ssrInterpolate(formatDate(event.start_time))}</span></div></div><div class="flex items-center justify-between"><span class="${ssrRenderClass([getEventTypeClass(event.event_type), "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"])}">${ssrInterpolate(getEventTypeLabel(event.event_type))}</span>`);
          if (event.instructor_name) {
            _push(`<span class="text-sm text-gray-500"> Преподаватель: ${ssrInterpolate(event.instructor_name)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden"><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">`);
      _push(ssrRenderComponent(_component_IconsWarningIcon, { class: "w-5 h-5 text-warning" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white"> Горящие дедлайны </h3></div><div class="p-6">`);
      if (!stats.value?.upcomingDeadlines?.length) {
        _push(`<div class="flex flex-col items-center justify-center py-4 text-center"><div class="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">`);
        _push(ssrRenderComponent(_component_IconsCheckIcon, { class: "h-6 w-6 text-success" }, null, _parent));
        _push(`</div><p class="text-sm text-gray-500">Нет активных дедлайнов</p></div>`);
      } else {
        _push(`<div class="flex flex-col gap-4"><!--[-->`);
        ssrRenderList(stats.value.upcomingDeadlines, (deadline) => {
          _push(`<div class="flex items-center justify-between p-3 rounded-lg border border-warning/30 bg-warning/5"><div><h5 class="font-medium text-black dark:text-white">${ssrInterpolate(deadline.test_name)}</h5><p class="text-xs text-gray-500 mt-0.5">${ssrInterpolate(deadline.course_name)}</p></div><div class="text-right"><span class="text-sm font-bold text-warning">${ssrInterpolate(formatDateTime(deadline.end_date))}</span>`);
          if (deadline.id) {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/tests/take/${deadline.id}`,
              class: "block text-xs text-primary hover:underline mt-1"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` Пройти тест `);
                } else {
                  return [
                    createTextVNode(" Пройти тест ")
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div></div><div class="mt-6 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden"><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">`);
      _push(ssrRenderComponent(_component_IconsAcademicCapIcon, { class: "w-5 h-5 text-success" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white"> Мои курсы </h3></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/my-courses",
        class: "text-sm text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Все курсы`);
          } else {
            return [
              createTextVNode("Все курсы")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="p-6">`);
      if (!stats.value?.activeCourses?.length) {
        _push(`<div class="text-center text-gray-500 py-4"> У вас пока нет активных курсов </div>`);
      } else {
        _push(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><!--[-->`);
        ssrRenderList(stats.value.activeCourses, (course) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: course.id,
            to: `/my-courses/${course.id}`,
            class: "block rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-all hover:bg-gray-50 hover:border-primary dark:hover:bg-gray-800"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<h4 class="font-bold text-black dark:text-white mb-1"${_scopeId}>${ssrInterpolate(course.course_name)}</h4><p class="text-sm text-gray-500 mb-3"${_scopeId}> Группа: ${ssrInterpolate(course.group_code)}</p><div class="flex items-center justify-between text-xs mb-1"${_scopeId}><span class="text-gray-600 dark:text-gray-400"${_scopeId}>Прогресс</span><span class="font-medium text-primary"${_scopeId}>${ssrInterpolate(course.progress)}%</span></div><div class="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"${_scopeId}><div class="absolute left-0 h-full rounded-full bg-primary transition-all" style="${ssrRenderStyle({ width: `${course.progress}%` })}"${_scopeId}></div></div>`);
              } else {
                return [
                  createVNode("h4", { class: "font-bold text-black dark:text-white mb-1" }, toDisplayString(course.course_name), 1),
                  createVNode("p", { class: "text-sm text-gray-500 mb-3" }, " Группа: " + toDisplayString(course.group_code), 1),
                  createVNode("div", { class: "flex items-center justify-between text-xs mb-1" }, [
                    createVNode("span", { class: "text-gray-600 dark:text-gray-400" }, "Прогресс"),
                    createVNode("span", { class: "font-medium text-primary" }, toDisplayString(course.progress) + "%", 1)
                  ]),
                  createVNode("div", { class: "relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden" }, [
                    createVNode("div", {
                      class: "absolute left-0 h-full rounded-full bg-primary transition-all",
                      style: { width: `${course.progress}%` }
                    }, null, 4)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div><div class="mt-6 rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-3 mb-4"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div><h3 class="text-lg font-semibold text-black dark:text-white"> Быстрые действия </h3></div><div class="flex flex-wrap gap-3"><!--[-->`);
      ssrRenderList(quickActions, (action) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: action.to,
          to: action.to,
          class: "inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-primary hover:text-white hover:border-primary"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              if (action.icon === "test") {
                _push2(ssrRenderComponent(_component_IconsClipboardCheckIcon, { class: "w-4 h-4" }, null, _parent2, _scopeId));
              } else if (action.icon === "calendar") {
                _push2(ssrRenderComponent(_component_IconsCalenderIcon, { class: "w-4 h-4" }, null, _parent2, _scopeId));
              } else if (action.icon === "certificate") {
                _push2(ssrRenderComponent(_component_IconsCertificateIcon, { class: "w-4 h-4" }, null, _parent2, _scopeId));
              } else if (action.icon === "support") {
                _push2(ssrRenderComponent(_component_IconsSupportIcon, { class: "w-4 h-4" }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
              _push2(` ${ssrInterpolate(action.label)}`);
            } else {
              return [
                action.icon === "test" ? (openBlock(), createBlock(_component_IconsClipboardCheckIcon, {
                  key: 0,
                  class: "w-4 h-4"
                })) : action.icon === "calendar" ? (openBlock(), createBlock(_component_IconsCalenderIcon, {
                  key: 1,
                  class: "w-4 h-4"
                })) : action.icon === "certificate" ? (openBlock(), createBlock(_component_IconsCertificateIcon, {
                  key: 2,
                  class: "w-4 h-4"
                })) : action.icon === "support" ? (openBlock(), createBlock(_component_IconsSupportIcon, {
                  key: 3,
                  class: "w-4 h-4"
                })) : createCommentVNode("", true),
                createTextVNode(" " + toDisplayString(action.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></div></div>`);
      if (stats.value?.recentGrades?.length) {
        _push(`<div class="mt-6 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden"><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">`);
        _push(ssrRenderComponent(_component_IconsBarChartIcon, { class: "w-5 h-5 text-info" }, null, _parent));
        _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white"> Мои последние оценки </h3></div><div class="p-6"><div class="flex flex-col gap-3"><!--[-->`);
        ssrRenderList(stats.value.recentGrades, (grade) => {
          _push(`<div class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><div class="flex-1"><h5 class="font-medium text-black dark:text-white">${ssrInterpolate(grade.event_title)}</h5><p class="text-xs text-gray-500 mt-0.5">${ssrInterpolate(grade.course_name)} • ${ssrInterpolate(formatDate(grade.graded_at))}</p></div><div class="text-right"><span class="${ssrRenderClass([getGradeClass(grade.grade), "inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-bold"])}">${ssrInterpolate(grade.grade)}/${ssrInterpolate(grade.max_grade || 100)}</span>`);
          if (grade.comment) {
            _push(`<p class="text-xs text-gray-500 mt-1">${ssrInterpolate(grade.comment)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (notifications.value?.length) {
        _push(`<div class="mt-6 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden"><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">`);
        _push(ssrRenderComponent(_component_IconsBellIcon, { class: "w-5 h-5 text-primary" }, null, _parent));
        _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white"> Уведомления </h3>`);
        if (unreadCount.value > 0) {
          _push(`<span class="bg-danger text-white text-xs px-2 py-0.5 rounded-full">${ssrInterpolate(unreadCount.value)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unreadCount.value > 0) {
          _push(`<button class="text-sm text-primary hover:underline"> Отметить все как прочитанные </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="p-6"><div class="flex flex-col gap-3"><!--[-->`);
        ssrRenderList(notifications.value, (notification) => {
          _push(`<div class="${ssrRenderClass([
            notification.is_read ? "bg-gray-50 dark:bg-gray-800/50" : "bg-primary/5 border border-primary/20",
            "flex items-start gap-3 p-3 rounded-lg transition-colors"
          ])}">`);
          if (notification.type === "test_upcoming") {
            _push(ssrRenderComponent(_component_IconsClipboardCheckIcon, { class: "w-5 h-5 flex-shrink-0 text-primary" }, null, _parent));
          } else if (notification.type === "test_today" || notification.type === "deadline_warning") {
            _push(ssrRenderComponent(_component_IconsWarningIcon, { class: "w-5 h-5 flex-shrink-0 text-warning" }, null, _parent));
          } else if (notification.type === "test_overdue" || notification.type === "deadline_critical") {
            _push(ssrRenderComponent(_component_IconsErrorIcon, { class: "w-5 h-5 flex-shrink-0 text-danger" }, null, _parent));
          } else if (notification.type === "schedule_change") {
            _push(ssrRenderComponent(_component_IconsCalenderIcon, { class: "w-5 h-5 flex-shrink-0 text-info" }, null, _parent));
          } else if (notification.type === "grade_posted") {
            _push(ssrRenderComponent(_component_IconsBarChartIcon, { class: "w-5 h-5 flex-shrink-0 text-success" }, null, _parent));
          } else if (notification.type === "certificate_issued") {
            _push(ssrRenderComponent(_component_IconsCertificateIcon, { class: "w-5 h-5 flex-shrink-0 text-success" }, null, _parent));
          } else if (notification.type === "info") {
            _push(ssrRenderComponent(_component_IconsInfoCircleIcon, { class: "w-5 h-5 flex-shrink-0 text-info" }, null, _parent));
          } else {
            _push(ssrRenderComponent(_component_IconsBellIcon, { class: "w-5 h-5 flex-shrink-0 text-primary" }, null, _parent));
          }
          _push(`<div class="flex-1 min-w-0"><div class="flex items-start justify-between gap-2"><div class="flex-1"><h5 class="font-medium text-black dark:text-white">${ssrInterpolate(notification.title)}</h5><p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${ssrInterpolate(notification.message)}</p><p class="text-xs text-gray-500 mt-1">${ssrInterpolate(formatRelativeTime(notification.created_at))}</p></div>`);
          if (!notification.is_read) {
            _push(`<button class="text-xs text-primary hover:underline flex-shrink-0"> Прочитано </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (notification.action_url) {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: notification.action_url,
              class: "inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(notification.action_text || "Перейти")} `);
                  _push2(ssrRenderComponent(_component_IconsChevronRightIcon, { class: "w-3 h-3" }, null, _parent2, _scopeId));
                } else {
                  return [
                    createTextVNode(toDisplayString(notification.action_text || "Перейти") + " ", 1),
                    createVNode(_component_IconsChevronRightIcon, { class: "w-3 h-3" })
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dashboard/Student.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const _sfc_main$9 = {
  __name: "DashboardTeacher",
  __ssrInlineRender: true,
  setup(__props) {
    const { user } = useAuth();
    useAuthFetch();
    const stats = ref(null);
    const loading = ref(true);
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const formatTime = (dateStr) => {
      return new Date(dateStr).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long"
      });
    };
    const getEventTypeLabel = (type) => {
      const map = {
        theory: "Лекция",
        practice: "Практика",
        assessment: "Тест",
        other: "Другое"
      };
      return map[type] || type;
    };
    const getLessonStatusClass = (lesson) => {
      const now = /* @__PURE__ */ new Date();
      const start = new Date(lesson.start_time);
      const end = new Date(lesson.end_time);
      if (now >= start && now <= end) {
        return "border-success bg-success/5";
      } else if (now > end) {
        return "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50";
      }
      return "border-gray-200 dark:border-gray-700";
    };
    const getLessonDotClass = (lesson) => {
      const now = /* @__PURE__ */ new Date();
      const start = new Date(lesson.start_time);
      const end = new Date(lesson.end_time);
      if (now >= start && now <= end) {
        return "bg-success animate-pulse";
      } else if (now > end) {
        return "bg-gray-400";
      }
      return "bg-primary";
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_IconsCalenderIcon = CalenderIcon;
      const _component_IconsUserGroupIcon = UserGroupIcon;
      const _component_IconsUserCircleIcon = UserCircleIcon;
      const _component_IconsCheckIcon = CheckIcon;
      const _component_IconsWarningIcon = __nuxt_component_17;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Добрый день, ${ssrInterpolate(unref(user)?.name || "Преподаватель")}! </h2><p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">${ssrInterpolate(unref(currentDate))} `);
      if (stats.value?.todayLessons > 0) {
        _push(`<span> • У вас запланировано ${ssrInterpolate(stats.value.todayLessons)} занятие(й) </span>`);
      } else {
        _push(`<span class="text-success"> • Сегодня нет запланированных занятий </span>`);
      }
      _push(`</p></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/schedule" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UiButton, { class: "flex items-center gap-2" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_IconsCalenderIcon, { class: "w-5 h-5" }, null, _parent3, _scopeId2));
                  _push3(` Моё расписание `);
                } else {
                  return [
                    createVNode(_component_IconsCalenderIcon, { class: "w-5 h-5" }),
                    createTextVNode(" Моё расписание ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_UiButton, { class: "flex items-center gap-2" }, {
                default: withCtx(() => [
                  createVNode(_component_IconsCalenderIcon, { class: "w-5 h-5" }),
                  createTextVNode(" Моё расписание ")
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6"><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">`);
      _push(ssrRenderComponent(_component_IconsUserGroupIcon, { class: "w-6 h-6 text-primary" }, null, _parent));
      _push(`</div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> Мои группы </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value?.myGroups || 0)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">`);
      _push(ssrRenderComponent(_component_IconsUserCircleIcon, { class: "w-6 h-6 text-success" }, null, _parent));
      _push(`</div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> Мои студенты </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value?.myStudents || 0)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">`);
      _push(ssrRenderComponent(_component_IconsCalenderIcon, { class: "w-6 h-6 text-warning" }, null, _parent));
      _push(`</div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> Занятий сегодня </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value?.todayLessons || 0)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10"><svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> Часов за месяц </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value?.monthlyHours || 0)}</p></div></div></div></div><div class="grid grid-cols-1 gap-6 xl:grid-cols-3"><div class="xl:col-span-2 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden"><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">`);
      _push(ssrRenderComponent(_component_IconsCalenderIcon, { class: "w-5 h-5 text-primary" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white"> Мои занятия сегодня </h3></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/schedule",
        class: "text-sm text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Полное расписание `);
          } else {
            return [
              createTextVNode(" Полное расписание ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="p-6">`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-8"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div></div>`);
      } else if (!stats.value?.todaySchedule?.length) {
        _push(`<div class="flex flex-col items-center justify-center py-8 text-center"><div class="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">`);
        _push(ssrRenderComponent(_component_IconsCheckIcon, { class: "h-6 w-6 text-success" }, null, _parent));
        _push(`</div><p class="text-sm text-gray-500"> Сегодня нет запланированных занятий </p></div>`);
      } else {
        _push(`<div class="flex flex-col gap-4"><!--[-->`);
        ssrRenderList(stats.value.todaySchedule, (lesson) => {
          _push(`<div class="${ssrRenderClass([getLessonStatusClass(lesson), "rounded-lg border p-4 transition-all"])}"><div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div class="flex-1"><div class="flex items-center gap-2 mb-1"><span class="${ssrRenderClass([getLessonDotClass(lesson), "inline-flex h-2.5 w-2.5 rounded-full"])}"></span><span class="text-lg font-bold text-primary">${ssrInterpolate(formatTime(lesson.start_time))} - ${ssrInterpolate(formatTime(lesson.end_time))}</span></div><h4 class="font-semibold text-black dark:text-white">${ssrInterpolate(getEventTypeLabel(lesson.event_type))}: ${ssrInterpolate(lesson.title)}</h4><p class="text-sm text-gray-500 mt-1"> Группа: ${ssrInterpolate(lesson.group_code)} `);
          if (lesson.classroom_name) {
            _push(`<span> • Ауд. ${ssrInterpolate(lesson.classroom_name)}</span>`);
          } else {
            _push(`<!---->`);
          }
          if (lesson.student_count) {
            _push(`<span> • ${ssrInterpolate(lesson.student_count)} студентов</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p></div>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/groups/journal/${lesson.group_id}_${lesson.discipline_id}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_UiButton, {
                  size: "sm",
                  variant: "outline",
                  class: "flex items-center gap-1"
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(ssrRenderComponent(_component_IconsCheckIcon, { class: "w-4 h-4" }, null, _parent3, _scopeId2));
                      _push3(` Посещаемость `);
                    } else {
                      return [
                        createVNode(_component_IconsCheckIcon, { class: "w-4 h-4" }),
                        createTextVNode(" Посещаемость ")
                      ];
                    }
                  }),
                  _: 2
                }, _parent2, _scopeId));
              } else {
                return [
                  createVNode(_component_UiButton, {
                    size: "sm",
                    variant: "outline",
                    class: "flex items-center gap-1"
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_IconsCheckIcon, { class: "w-4 h-4" }),
                      createTextVNode(" Посещаемость ")
                    ]),
                    _: 1
                  })
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden"><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">`);
      _push(ssrRenderComponent(_component_IconsUserGroupIcon, { class: "w-5 h-5 text-success" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white"> Мои группы </h3></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/groups",
        class: "text-sm text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Все группы `);
          } else {
            return [
              createTextVNode(" Все группы ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="p-6">`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-8"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div></div>`);
      } else if (!stats.value?.groups?.length) {
        _push(`<div class="text-center text-gray-500 py-4"> Нет назначенных групп </div>`);
      } else {
        _push(`<div class="flex flex-col gap-4"><!--[-->`);
        ssrRenderList(stats.value.groups, (group) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: group.id,
            to: `/groups/${group.id}`,
            class: "block rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-all hover:bg-gray-50 hover:border-primary dark:hover:bg-gray-800"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<h4 class="font-bold text-black dark:text-white mb-1"${_scopeId}>${ssrInterpolate(group.code)}</h4><p class="text-sm text-gray-500 mb-2"${_scopeId}>${ssrInterpolate(group.course_name)}</p><div class="flex items-center justify-between text-xs"${_scopeId}><span class="text-gray-400"${_scopeId}>${ssrInterpolate(group.student_count)} студентов</span><span class="${ssrRenderClass([
                  group.attendance_rate >= 80 ? "text-success" : group.attendance_rate >= 60 ? "text-warning" : "text-danger",
                  "font-medium"
                ])}"${_scopeId}> Посещаемость: ${ssrInterpolate(group.attendance_rate)}% </span></div><div class="mt-2 relative h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"${_scopeId}><div class="${ssrRenderClass([
                  group.attendance_rate >= 80 ? "bg-success" : group.attendance_rate >= 60 ? "bg-warning" : "bg-danger",
                  "absolute left-0 h-full rounded-full transition-all"
                ])}" style="${ssrRenderStyle({ width: `${group.attendance_rate}%` })}"${_scopeId}></div></div>`);
              } else {
                return [
                  createVNode("h4", { class: "font-bold text-black dark:text-white mb-1" }, toDisplayString(group.code), 1),
                  createVNode("p", { class: "text-sm text-gray-500 mb-2" }, toDisplayString(group.course_name), 1),
                  createVNode("div", { class: "flex items-center justify-between text-xs" }, [
                    createVNode("span", { class: "text-gray-400" }, toDisplayString(group.student_count) + " студентов", 1),
                    createVNode("span", {
                      class: [
                        "font-medium",
                        group.attendance_rate >= 80 ? "text-success" : group.attendance_rate >= 60 ? "text-warning" : "text-danger"
                      ]
                    }, " Посещаемость: " + toDisplayString(group.attendance_rate) + "% ", 3)
                  ]),
                  createVNode("div", { class: "mt-2 relative h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden" }, [
                    createVNode("div", {
                      class: [
                        "absolute left-0 h-full rounded-full transition-all",
                        group.attendance_rate >= 80 ? "bg-success" : group.attendance_rate >= 60 ? "bg-warning" : "bg-danger"
                      ],
                      style: { width: `${group.attendance_rate}%` }
                    }, null, 6)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div></div>`);
      if (stats.value?.pendingAttendance?.length) {
        _push(`<div class="mt-6 rounded-lg bg-warning/5 border border-warning/30 shadow-md overflow-hidden"><div class="border-b border-warning/30 py-4 px-6 flex justify-between items-center"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">`);
        _push(ssrRenderComponent(_component_IconsWarningIcon, { class: "w-5 h-5 text-warning" }, null, _parent));
        _push(`</div><h3 class="text-lg font-semibold text-warning"> Требуется заполнить посещаемость </h3><span class="bg-warning text-white text-xs px-2 py-0.5 rounded-full">${ssrInterpolate(stats.value.pendingAttendance.length)}</span></div></div><div class="p-6"><div class="flex flex-col gap-3"><!--[-->`);
        ssrRenderList(stats.value.pendingAttendance, (item) => {
          _push(`<div class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-boxdark border border-gray-200 dark:border-gray-700"><div><span class="text-sm font-medium text-black dark:text-white">${ssrInterpolate(formatDate(item.date))}</span><span class="text-gray-500 mx-2">•</span><span class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(item.title)}</span><span class="text-gray-500 mx-2">•</span><span class="text-sm text-gray-500">${ssrInterpolate(item.group_code)}</span></div>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/groups/journal/${item.group_id}_${item.discipline_id}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_UiButton, {
                  size: "sm",
                  variant: "warning"
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`Заполнить`);
                    } else {
                      return [
                        createTextVNode("Заполнить")
                      ];
                    }
                  }),
                  _: 2
                }, _parent2, _scopeId));
              } else {
                return [
                  createVNode(_component_UiButton, {
                    size: "sm",
                    variant: "warning"
                  }, {
                    default: withCtx(() => [
                      createTextVNode("Заполнить")
                    ]),
                    _: 1
                  })
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div>`);
        });
        _push(`<!--]--></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mt-6 grid grid-cols-1 gap-6">`);
      if (unref(user)?.instructorId) {
        _push(ssrRenderComponent(InstructorsHoursStats, {
          "instructor-id": unref(user).instructorId,
          "initial-load": true
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(user)?.instructorId) {
        _push(ssrRenderComponent(InstructorsCourseHistory, {
          "instructor-id": unref(user).instructorId,
          "initial-load": true
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dashboard/Teacher.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const _sfc_main$8 = {};
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C11.5858 2 11.25 2.33579 11.25 2.75V12C11.25 12.4142 11.5858 12.75 12 12.75H21.25C21.6642 12.75 22 12.4142 22 12C22 6.47715 17.5228 2 12 2ZM12.75 11.25V3.53263C13.2645 3.57761 13.7659 3.66843 14.25 3.80098V3.80099C15.6929 4.19606 16.9827 4.96184 18.0104 5.98959C19.0382 7.01734 19.8039 8.30707 20.199 9.75C20.3316 10.2341 20.4224 10.7355 20.4674 11.25H12.75ZM2 12C2 7.25083 5.31065 3.27489 9.75 2.25415V3.80099C6.14748 4.78734 3.5 8.0845 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C15.9155 20.5 19.2127 17.8525 20.199 14.25H21.7459C20.7251 18.6894 16.7492 22 12 22C6.47715 22 2 17.5229 2 12Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/PieChartIcon.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const __nuxt_component_6 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$8, [["ssrRender", _sfc_ssrRender$2]]), { __name: "IconsPieChartIcon" });
const _sfc_main$7 = {
  __name: "ChartsDonutChart",
  __ssrInlineRender: true,
  props: {
    chartId: {
      type: String,
      default: "donut-chart"
    },
    title: {
      type: String,
      default: ""
    },
    series: {
      type: Array,
      default: () => []
    },
    labels: {
      type: Array,
      default: () => []
    },
    colors: {
      type: Array,
      default: () => [
        "#465FFF",
        "#9CB9FF",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#EC4899",
        "#06B6D4",
        "#84CC16",
        "#F97316"
      ]
    },
    height: {
      type: [Number, String],
      default: 350
    },
    showLegend: {
      type: Boolean,
      default: true
    },
    legendPosition: {
      type: String,
      default: "bottom"
    }
  },
  emits: ["click"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    ref(false);
    computed(() => {
      return props.series.map((s) => Number(s) || 0);
    });
    computed(() => ({
      chart: {
        fontFamily: "Inter, system-ui, sans-serif",
        type: "donut",
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 1200,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 450
          }
        },
        events: {
          dataPointSelection: (event, chartContext, config) => {
            emit("click", {
              seriesIndex: config.seriesIndex,
              dataPointIndex: config.dataPointIndex,
              label: props.labels[config.dataPointIndex],
              value: props.series[config.dataPointIndex]
            });
          },
          dataPointMouseEnter: function(event) {
            if (event && event.target) {
              event.target.style.cursor = "pointer";
            }
          }
        }
      },
      colors: props.colors.slice(0, props.series.length),
      labels: props.labels,
      legend: {
        show: props.showLegend,
        position: props.legendPosition,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "14px",
        fontWeight: 500,
        labels: {
          colors: "#6B7280",
          useSeriesColors: false
        },
        markers: {
          width: 12,
          height: 12,
          radius: 12,
          offsetX: -2
        },
        itemMargin: {
          horizontal: 12,
          vertical: 6
        },
        onItemClick: {
          toggleDataSeries: true
        },
        onItemHover: {
          highlightDataSeries: true
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "14px",
                fontWeight: 600,
                offsetY: -5
              },
              value: {
                show: true,
                fontSize: "20px",
                fontWeight: 700,
                formatter: function(val) {
                  return val;
                }
              },
              total: {
                show: true,
                showAlways: true,
                label: "Всего",
                fontSize: "14px",
                fontWeight: 600,
                color: "#6b7280",
                formatter: function(w) {
                  if (w && w.globals && w.globals.seriesTotals) {
                    return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                  }
                  return 0;
                }
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"]
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: function(val, opts) {
            const w = opts ? opts.w : void 0;
            if (w && w.globals && w.globals.seriesTotals) {
              const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
              const percent = total > 0 ? (val / total * 100).toFixed(1) : 0;
              return `${val} (${percent}%)`;
            }
            return val;
          }
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 280
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    }));
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-full overflow-x-auto custom-scrollbar" }, _attrs))}><div${ssrRenderAttr("id", __props.chartId)} class="min-w-[300px]">`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {
        fallback: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-center items-center" style="${ssrRenderStyle({ height: __props.height + "px" })}"${_scopeId}><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"${_scopeId}></div></div>`);
          } else {
            return [
              createVNode("div", {
                class: "flex justify-center items-center",
                style: { height: __props.height + "px" }
              }, [
                createVNode("div", { class: "h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" })
              ], 4)
            ];
          }
        })
      }, _parent));
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/charts/DonutChart.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const _sfc_main$6 = {
  __name: "ChartsDynamicBarChart",
  __ssrInlineRender: true,
  props: {
    chartId: {
      type: String,
      default: "dynamic-bar-chart"
    },
    title: {
      type: String,
      default: ""
    },
    series: {
      type: Array,
      default: () => [{ name: "Data", data: [] }]
    },
    categories: {
      type: Array,
      default: () => []
    },
    colors: {
      type: Array,
      default: () => ["#465FFF", "#10B981", "#F59E0B"]
    },
    height: {
      type: [Number, String],
      default: 280
    },
    horizontal: {
      type: Boolean,
      default: false
    },
    showLegend: {
      type: Boolean,
      default: false
    },
    showDataLabels: {
      type: Boolean,
      default: false
    },
    yAxisTitle: {
      type: String,
      default: ""
    },
    columnWidth: {
      type: String,
      default: "50%"
    },
    borderRadius: {
      type: Number,
      default: 5
    },
    formatTooltip: {
      type: Function,
      default: null
    },
    animationSpeed: {
      type: Number,
      default: 1e3
    }
  },
  emits: ["click"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    ref(false);
    computed(() => {
      return props.series.map((s) => ({
        name: s.name || "Данные",
        data: (s.data || []).map((d) => Number(d) || 0)
      }));
    });
    computed(() => ({
      colors: props.colors,
      chart: {
        fontFamily: "Inter, system-ui, sans-serif",
        type: "bar",
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: props.animationSpeed,
          animateGradually: {
            enabled: true,
            delay: 100
          },
          dynamicAnimation: {
            enabled: true,
            speed: 400
          }
        },
        events: {
          dataPointSelection: (event, chartContext, config) => {
            emit("click", {
              seriesIndex: config.seriesIndex,
              dataPointIndex: config.dataPointIndex,
              category: props.categories[config.dataPointIndex],
              value: config.w.globals.series[config.seriesIndex][config.dataPointIndex]
            });
          },
          dataPointMouseEnter: function(event) {
            if (event && event.target) {
              event.target.style.cursor = "pointer";
            }
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: props.horizontal,
          columnWidth: props.columnWidth,
          borderRadius: props.borderRadius,
          borderRadiusApplication: "end",
          distributed: props.series.length === 1 && props.colors.length > 1,
          dataLabels: {
            position: "top"
          }
        }
      },
      dataLabels: {
        enabled: props.showDataLabels,
        offsetY: -20,
        style: {
          fontSize: "12px",
          fontWeight: 600,
          colors: ["#6B7280"]
        }
      },
      stroke: {
        show: true,
        width: 4,
        colors: ["transparent"]
      },
      xaxis: {
        categories: props.categories,
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        labels: {
          style: {
            fontSize: "13px",
            fontWeight: 500,
            colors: "#6B7280",
            fontFamily: "Inter, system-ui, sans-serif"
          },
          rotate: props.horizontal ? 0 : -45,
          rotateAlways: false,
          trim: false
        }
      },
      legend: {
        show: props.showLegend,
        position: "top",
        horizontalAlign: "left",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "14px",
        fontWeight: 500,
        markers: {
          radius: 12
        }
      },
      yaxis: {
        title: {
          text: props.yAxisTitle,
          style: {
            fontSize: "13px",
            fontWeight: 600,
            color: "#6B7280",
            fontFamily: "Inter, system-ui, sans-serif"
          }
        },
        labels: {
          formatter: function(val) {
            return Math.round(val);
          },
          style: {
            fontSize: "13px",
            fontWeight: 500,
            colors: "#6B7280",
            fontFamily: "Inter, system-ui, sans-serif"
          }
        }
      },
      grid: {
        yaxis: {
          lines: {
            show: true
          }
        },
        xaxis: {
          lines: {
            show: false
          }
        },
        borderColor: "#E5E7EB",
        strokeDashArray: 4
      },
      fill: {
        opacity: 1,
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.25,
          gradientToColors: void 0,
          inverseColors: false,
          opacityFrom: 0.95,
          opacityTo: 0.75,
          stops: [0, 100]
        }
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        theme: "light",
        style: {
          fontSize: "13px",
          fontFamily: "Inter, system-ui, sans-serif"
        },
        x: {
          show: true,
          formatter: function(val) {
            return val;
          }
        },
        y: {
          formatter: props.formatTooltip || function(val) {
            return val.toString();
          }
        },
        marker: {
          show: true
        }
      },
      states: {
        hover: {
          filter: {
            type: "lighten",
            value: 0.1
          }
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: {
            type: "darken",
            value: 0.1
          }
        }
      },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: {
              height: 250
            },
            xaxis: {
              labels: {
                rotate: -90,
                style: {
                  fontSize: "11px"
                }
              }
            }
          }
        }
      ]
    }));
    watch(
      () => props.series,
      (newVal, oldVal) => {
        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) ;
      },
      { deep: true }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-full overflow-x-auto custom-scrollbar" }, _attrs))} data-v-c7ea2314><div${ssrRenderAttr("id", __props.chartId)} class="-ml-5 min-w-[500px] xl:min-w-full pl-2" data-v-c7ea2314>`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {
        fallback: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-center items-center" style="${ssrRenderStyle({ height: __props.height + "px" })}" data-v-c7ea2314${_scopeId}><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-c7ea2314${_scopeId}></div></div>`);
          } else {
            return [
              createVNode("div", {
                class: "flex justify-center items-center",
                style: { height: __props.height + "px" }
              }, [
                createVNode("div", { class: "h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" })
              ], 4)
            ];
          }
        })
      }, _parent));
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/charts/DynamicBarChart.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_9 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-c7ea2314"]]);
const _sfc_main$5 = {
  __name: "DashboardManager",
  __ssrInlineRender: true,
  setup(__props) {
    useRouter();
    const { user } = useAuth();
    useAuthFetch();
    const stats = ref(null);
    const loading = ref(true);
    const certificatePeriod = ref("months");
    const certificateTransitioning = ref(false);
    const certificatePeriods = [
      { value: "months", label: "Месяцы" },
      { value: "quarters", label: "Кварталы" },
      { value: "years", label: "Годы" }
    ];
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const coursesChartData = computed(() => {
      const courses = stats.value?.studentsByCourse || [];
      return {
        series: courses.map((c) => Number(c.count) || 0),
        labels: courses.map((c) => c.name || "Не указано")
      };
    });
    const certificatesChartData = computed(() => {
      const certs = stats.value?.certificatesByMonth || [];
      const monthNames = [
        "Янв",
        "Фев",
        "Мар",
        "Апр",
        "Май",
        "Июн",
        "Июл",
        "Авг",
        "Сен",
        "Окт",
        "Ноя",
        "Дек"
      ];
      return {
        series: [
          {
            name: "Сертификаты",
            data: certs.map((c) => Number(c.count) || 0)
          }
        ],
        categories: certs.map((c) => {
          const [year, month] = c.month.split("-");
          return monthNames[parseInt(month) - 1] + " " + year.slice(2);
        }),
        rawData: certs
      };
    });
    const certificatesByQuarters = computed(() => {
      const rawData = certificatesChartData.value.rawData || [];
      const quarterMap = /* @__PURE__ */ new Map();
      rawData.forEach((item) => {
        const [year, month] = item.month.split("-");
        const quarter = Math.ceil(parseInt(month) / 3);
        const key = `${year}-Q${quarter}`;
        if (!quarterMap.has(key)) {
          quarterMap.set(key, { count: 0, year, quarter });
        }
        quarterMap.get(key).count += Number(item.count) || 0;
      });
      const sorted = Array.from(quarterMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, data]) => ({
        label: `Q${data.quarter} ${data.year.slice(2)}`,
        count: data.count
      }));
      return {
        series: [
          {
            name: "Сертификаты",
            data: sorted.map((q) => q.count)
          }
        ],
        categories: sorted.map((q) => q.label)
      };
    });
    const certificatesByYears = computed(() => {
      const rawData = certificatesChartData.value.rawData || [];
      const yearMap = /* @__PURE__ */ new Map();
      rawData.forEach((item) => {
        const [year] = item.month.split("-");
        if (!yearMap.has(year)) {
          yearMap.set(year, 0);
        }
        yearMap.set(year, yearMap.get(year) + (Number(item.count) || 0));
      });
      const sorted = Array.from(yearMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([year, count]) => ({ year, count }));
      return {
        series: [
          {
            name: "Сертификаты",
            data: sorted.map((y) => y.count)
          }
        ],
        categories: sorted.map((y) => y.year)
      };
    });
    const currentCertificatesData = computed(() => {
      switch (certificatePeriod.value) {
        case "quarters":
          return certificatesByQuarters.value;
        case "years":
          return certificatesByYears.value;
        default:
          return certificatesChartData.value;
      }
    });
    const handleCourseChartClick = (data) => {
      console.log("Clicked on course:", data.label);
    };
    const formatTime = (dateStr) => {
      return new Date(dateStr).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long"
      });
    };
    const formatShortDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit"
      });
    };
    const getEventTypeLabel = (type) => {
      const map = {
        theory: "Лекция",
        practice: "Практика",
        assessment: "Тест",
        other: "Другое"
      };
      return map[type] || type;
    };
    const getEventTypeClass = (type) => {
      const map = {
        theory: "bg-primary/10 text-primary",
        practice: "bg-success/10 text-success",
        assessment: "bg-warning/10 text-warning",
        other: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
      };
      return map[type] || map.other;
    };
    const getDaysUntilEndClass = (endDate) => {
      const days = Math.ceil(
        (new Date(endDate) - /* @__PURE__ */ new Date()) / (1e3 * 60 * 60 * 24)
      );
      if (days <= 1) return "bg-danger animate-pulse";
      if (days <= 3) return "bg-warning";
      return "bg-success";
    };
    const getRankClass = (index) => {
      if (index === 0)
        return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
      if (index === 1)
        return "bg-gradient-to-br from-gray-300 to-gray-500 text-white";
      if (index === 2)
        return "bg-gradient-to-br from-orange-400 to-orange-600 text-white";
      return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_IconsUserGroupIcon = UserGroupIcon;
      const _component_IconsUserCircleIcon = UserCircleIcon;
      const _component_IconsClipboardCheckIcon = ClipboardCheckIcon;
      const _component_IconsCertificateIcon = CertificateIcon;
      const _component_IconsPieChartIcon = __nuxt_component_6;
      const _component_ChartsDonutChart = _sfc_main$7;
      const _component_IconsBarChartIcon = __nuxt_component_8;
      const _component_ChartsDynamicBarChart = __nuxt_component_9;
      const _component_IconsAcademicCapIcon = AcademicCapIcon;
      const _component_IconsCalenderIcon = CalenderIcon;
      const _component_IconsWarningIcon = __nuxt_component_17;
      const _component_IconsErrorIcon = __nuxt_component_19;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))} data-v-9edef435><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-v-9edef435><div data-v-9edef435><h2 class="text-title-md2 font-bold text-black dark:text-white" data-v-9edef435> Добрый день, ${ssrInterpolate(unref(user)?.name || "Менеджер")}! </h2><p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1" data-v-9edef435>${ssrInterpolate(unref(currentDate))} `);
      if (stats.value?.activeGroups > 0) {
        _push(`<span data-v-9edef435> • В работе ${ssrInterpolate(stats.value.activeGroups)} групп(ы) </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</p></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/groups" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UiButton, { class: "flex items-center gap-2" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_IconsUserGroupIcon, { class: "w-5 h-5" }, null, _parent3, _scopeId2));
                  _push3(` Все группы `);
                } else {
                  return [
                    createVNode(_component_IconsUserGroupIcon, { class: "w-5 h-5" }),
                    createTextVNode(" Все группы ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_UiButton, { class: "flex items-center gap-2" }, {
                default: withCtx(() => [
                  createVNode(_component_IconsUserGroupIcon, { class: "w-5 h-5" }),
                  createTextVNode(" Все группы ")
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6" data-v-9edef435><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" data-v-9edef435><div class="flex items-center gap-4" data-v-9edef435><div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10" data-v-9edef435>`);
      _push(ssrRenderComponent(_component_IconsUserGroupIcon, { class: "w-6 h-6 text-primary" }, null, _parent));
      _push(`</div><div data-v-9edef435><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400" data-v-9edef435> Активные группы </h3><p class="text-2xl font-bold text-black dark:text-white" data-v-9edef435>${ssrInterpolate(stats.value?.activeGroups || 0)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" data-v-9edef435><div class="flex items-center gap-4" data-v-9edef435><div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10" data-v-9edef435>`);
      _push(ssrRenderComponent(_component_IconsUserCircleIcon, { class: "w-6 h-6 text-success" }, null, _parent));
      _push(`</div><div data-v-9edef435><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400" data-v-9edef435> Студенты на курсах </h3><p class="text-2xl font-bold text-black dark:text-white" data-v-9edef435>${ssrInterpolate(stats.value?.studentsOnCourses || 0)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" data-v-9edef435><div class="flex items-center gap-4" data-v-9edef435><div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10" data-v-9edef435>`);
      _push(ssrRenderComponent(_component_IconsClipboardCheckIcon, { class: "w-6 h-6 text-warning" }, null, _parent));
      _push(`</div><div data-v-9edef435><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400" data-v-9edef435> Тесты сегодня </h3><p class="text-2xl font-bold text-black dark:text-white" data-v-9edef435>${ssrInterpolate(stats.value?.testsToday || 0)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" data-v-9edef435><div class="flex items-center gap-4" data-v-9edef435><div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10" data-v-9edef435>`);
      _push(ssrRenderComponent(_component_IconsCertificateIcon, { class: "w-6 h-6 text-info" }, null, _parent));
      _push(`</div><div data-v-9edef435><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400" data-v-9edef435> К выдаче сертификатов </h3><p class="text-2xl font-bold text-black dark:text-white" data-v-9edef435>${ssrInterpolate(stats.value?.certificatesPending || 0)}</p></div></div></div></div><div class="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-6" data-v-9edef435><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden" data-v-9edef435><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between" data-v-9edef435><div class="flex items-center gap-3" data-v-9edef435><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center" data-v-9edef435>`);
      _push(ssrRenderComponent(_component_IconsPieChartIcon, { class: "w-5 h-5 text-primary" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white" data-v-9edef435> Студенты по курсам </h3></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/groups",
        class: "text-sm text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Все курсы `);
          } else {
            return [
              createTextVNode(" Все курсы ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="p-6" data-v-9edef435>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-16" data-v-9edef435><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-9edef435></div></div>`);
      } else if (!coursesChartData.value.series.length) {
        _push(`<div class="flex flex-col items-center justify-center py-16 text-center" data-v-9edef435>`);
        _push(ssrRenderComponent(_component_IconsUserGroupIcon, { class: "h-12 w-12 text-gray-300 mb-3" }, null, _parent));
        _push(`<p class="text-sm text-gray-500" data-v-9edef435>Нет данных о студентах</p></div>`);
      } else {
        _push(ssrRenderComponent(_component_ChartsDonutChart, {
          "chart-id": "students-by-course",
          series: coursesChartData.value.series,
          labels: coursesChartData.value.labels,
          height: 350,
          "legend-position": "bottom",
          onClick: handleCourseChartClick
        }, null, _parent));
      }
      _push(`</div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden" data-v-9edef435><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between flex-wrap gap-3" data-v-9edef435><div class="flex items-center gap-3" data-v-9edef435><div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center" data-v-9edef435>`);
      _push(ssrRenderComponent(_component_IconsBarChartIcon, { class: "w-5 h-5 text-success" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white" data-v-9edef435> Сертификаты </h3></div><div class="flex items-center gap-3" data-v-9edef435><div class="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg" data-v-9edef435><!--[-->`);
      ssrRenderList(certificatePeriods, (period) => {
        _push(`<button class="${ssrRenderClass([
          certificatePeriod.value === period.value ? "bg-success text-white shadow-md transform scale-105" : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
          "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300"
        ])}" data-v-9edef435>${ssrInterpolate(period.label)}</button>`);
      });
      _push(`<!--]--></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/certificates",
        class: "text-sm text-primary hover:underline whitespace-nowrap"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Все сертификаты `);
          } else {
            return [
              createTextVNode(" Все сертификаты ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="p-6" data-v-9edef435>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-16" data-v-9edef435><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-9edef435></div></div>`);
      } else if (!currentCertificatesData.value.series[0]?.data?.length) {
        _push(`<div class="flex flex-col items-center justify-center py-16 text-center" data-v-9edef435>`);
        _push(ssrRenderComponent(_component_IconsCertificateIcon, { class: "h-12 w-12 text-gray-300 mb-3" }, null, _parent));
        _push(`<p class="text-sm text-gray-500" data-v-9edef435>Нет данных о сертификатах</p></div>`);
      } else {
        _push(`<div class="${ssrRenderClass([certificateTransitioning.value ? "opacity-50" : "opacity-100", "transition-opacity duration-500"])}" data-v-9edef435>`);
        _push(ssrRenderComponent(_component_ChartsDynamicBarChart, {
          key: certificatePeriod.value,
          "chart-id": "certificates-chart-manager",
          series: currentCertificatesData.value.series,
          categories: currentCertificatesData.value.categories,
          colors: ["#10B981"],
          height: 320,
          "y-axis-title": "Количество",
          "animation-speed": 800
        }, null, _parent));
        _push(`</div>`);
      }
      _push(`</div></div></div><div class="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-6" data-v-9edef435><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden" data-v-9edef435><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between" data-v-9edef435><div class="flex items-center gap-3" data-v-9edef435><div class="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center" data-v-9edef435>`);
      _push(ssrRenderComponent(_component_IconsAcademicCapIcon, { class: "w-5 h-5 text-info" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white" data-v-9edef435> Популярные курсы </h3></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/groups",
        class: "text-sm text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Все курсы `);
          } else {
            return [
              createTextVNode(" Все курсы ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="p-6" data-v-9edef435>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-8" data-v-9edef435><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-9edef435></div></div>`);
      } else if (!stats.value?.topCourses?.length) {
        _push(`<div class="flex flex-col items-center justify-center py-8 text-center" data-v-9edef435>`);
        _push(ssrRenderComponent(_component_IconsAcademicCapIcon, { class: "h-12 w-12 text-gray-300 mb-3" }, null, _parent));
        _push(`<p class="text-sm text-gray-500" data-v-9edef435>Нет данных о курсах</p></div>`);
      } else {
        _push(`<div class="space-y-4" data-v-9edef435><!--[-->`);
        ssrRenderList(stats.value.topCourses, (course, index) => {
          _push(`<div class="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer" data-v-9edef435><span class="${ssrRenderClass([getRankClass(index), "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold flex-shrink-0"])}" data-v-9edef435>${ssrInterpolate(index + 1)}</span><div class="flex-1 min-w-0" data-v-9edef435><p class="font-medium text-black dark:text-white truncate" data-v-9edef435>${ssrInterpolate(course.name)}</p><p class="text-xs text-gray-500" data-v-9edef435>${ssrInterpolate(course.code)}</p></div><div class="text-right flex-shrink-0" data-v-9edef435><p class="text-lg font-bold text-info" data-v-9edef435>${ssrInterpolate(course.students_count)}</p><p class="text-xs text-gray-500" data-v-9edef435>студентов</p></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden" data-v-9edef435><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center" data-v-9edef435><div class="flex items-center gap-3" data-v-9edef435><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center" data-v-9edef435>`);
      _push(ssrRenderComponent(_component_IconsUserGroupIcon, { class: "w-5 h-5 text-primary" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white" data-v-9edef435> Группы в работе </h3></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/groups",
        class: "text-sm text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Все группы `);
          } else {
            return [
              createTextVNode(" Все группы ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="p-6" data-v-9edef435>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-8" data-v-9edef435><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-9edef435></div></div>`);
      } else if (!stats.value?.groups?.length) {
        _push(`<div class="text-center text-gray-500 py-4" data-v-9edef435> Нет активных групп </div>`);
      } else {
        _push(`<div class="flex flex-col gap-3" data-v-9edef435><!--[-->`);
        ssrRenderList(stats.value.groups, (group) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: group.id,
            to: `/groups/${group.id}`,
            class: "block rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-all hover:bg-gray-50 hover:border-primary dark:hover:bg-gray-800 hover:scale-[1.01]"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="flex justify-between items-start mb-2" data-v-9edef435${_scopeId}><div data-v-9edef435${_scopeId}><h4 class="font-bold text-black dark:text-white" data-v-9edef435${_scopeId}>${ssrInterpolate(group.code)}</h4><p class="text-xs text-gray-500" data-v-9edef435${_scopeId}>${ssrInterpolate(group.course_name)}</p></div><span class="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary" data-v-9edef435${_scopeId}>${ssrInterpolate(group.student_count)} студ. </span></div><div class="flex items-center justify-between text-xs mb-1" data-v-9edef435${_scopeId}><span class="text-gray-600 dark:text-gray-400" data-v-9edef435${_scopeId}>Прогресс группы</span><span class="font-medium text-primary" data-v-9edef435${_scopeId}>${ssrInterpolate(group.progress)}%</span></div><div class="relative h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden" data-v-9edef435${_scopeId}><div class="absolute left-0 h-full rounded-full bg-primary transition-all duration-1000" style="${ssrRenderStyle({ width: `${group.progress}%` })}" data-v-9edef435${_scopeId}></div></div><div class="mt-2 text-right" data-v-9edef435${_scopeId}><span class="text-xs text-gray-400" data-v-9edef435${_scopeId}>До ${ssrInterpolate(formatShortDate(group.end_date))}</span></div>`);
              } else {
                return [
                  createVNode("div", { class: "flex justify-between items-start mb-2" }, [
                    createVNode("div", null, [
                      createVNode("h4", { class: "font-bold text-black dark:text-white" }, toDisplayString(group.code), 1),
                      createVNode("p", { class: "text-xs text-gray-500" }, toDisplayString(group.course_name), 1)
                    ]),
                    createVNode("span", { class: "text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary" }, toDisplayString(group.student_count) + " студ. ", 1)
                  ]),
                  createVNode("div", { class: "flex items-center justify-between text-xs mb-1" }, [
                    createVNode("span", { class: "text-gray-600 dark:text-gray-400" }, "Прогресс группы"),
                    createVNode("span", { class: "font-medium text-primary" }, toDisplayString(group.progress) + "%", 1)
                  ]),
                  createVNode("div", { class: "relative h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden" }, [
                    createVNode("div", {
                      class: "absolute left-0 h-full rounded-full bg-primary transition-all duration-1000",
                      style: { width: `${group.progress}%` }
                    }, null, 4)
                  ]),
                  createVNode("div", { class: "mt-2 text-right" }, [
                    createVNode("span", { class: "text-xs text-gray-400" }, "До " + toDisplayString(formatShortDate(group.end_date)), 1)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div></div><div class="grid grid-cols-1 gap-6 xl:grid-cols-3 mb-6" data-v-9edef435><div class="xl:col-span-2 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden" data-v-9edef435><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center" data-v-9edef435><div class="flex items-center gap-3" data-v-9edef435><div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center" data-v-9edef435>`);
      _push(ssrRenderComponent(_component_IconsCalenderIcon, { class: "w-5 h-5 text-success" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white" data-v-9edef435> Сегодня </h3></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/schedule",
        class: "text-sm text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Календарь `);
          } else {
            return [
              createTextVNode(" Календарь ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="p-6" data-v-9edef435>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-8" data-v-9edef435><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-9edef435></div></div>`);
      } else if (!stats.value?.todaySchedule?.length) {
        _push(`<div class="text-center text-gray-500 py-4" data-v-9edef435> Нет занятий на сегодня </div>`);
      } else {
        _push(`<div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-v-9edef435><!--[-->`);
        ssrRenderList(stats.value.todaySchedule, (event) => {
          _push(`<div class="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" data-v-9edef435><div class="flex items-center justify-between" data-v-9edef435><span class="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded" data-v-9edef435>${ssrInterpolate(formatTime(event.start_time))}</span><span class="${ssrRenderClass([getEventTypeClass(event.event_type), "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"])}" data-v-9edef435>${ssrInterpolate(getEventTypeLabel(event.event_type))}</span></div><h5 class="text-sm font-medium text-black dark:text-white truncate" data-v-9edef435>${ssrInterpolate(event.title)}</h5><div class="flex items-center gap-2 text-xs text-gray-500" data-v-9edef435>`);
          _push(ssrRenderComponent(_component_IconsUserGroupIcon, { class: "w-3 h-3" }, null, _parent));
          _push(`<span data-v-9edef435>${ssrInterpolate(event.group_code)}</span>`);
          if (event.instructor_name) {
            _push(`<span class="flex items-center gap-1 border-l border-gray-300 pl-2 ml-1" data-v-9edef435> • ${ssrInterpolate(event.instructor_name)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div>`);
      if (stats.value?.groupsEndingSoon?.length) {
        _push(`<div class="rounded-lg bg-warning/5 border border-warning/30 shadow-md overflow-hidden" data-v-9edef435><div class="border-b border-warning/30 py-4 px-6 flex justify-between items-center" data-v-9edef435><div class="flex items-center gap-3" data-v-9edef435><div class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center" data-v-9edef435>`);
        _push(ssrRenderComponent(_component_IconsWarningIcon, { class: "w-5 h-5 text-warning" }, null, _parent));
        _push(`</div><h3 class="text-lg font-semibold text-warning" data-v-9edef435> Завершаются скоро </h3><span class="bg-warning text-white text-xs px-2 py-0.5 rounded-full" data-v-9edef435>${ssrInterpolate(stats.value.groupsEndingSoon.length)}</span></div></div><div class="p-6" data-v-9edef435><div class="flex flex-col gap-3" data-v-9edef435><!--[-->`);
        ssrRenderList(stats.value.groupsEndingSoon, (group) => {
          _push(`<div class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-boxdark border border-gray-200 dark:border-gray-700" data-v-9edef435><div class="flex items-center gap-3" data-v-9edef435><span class="${ssrRenderClass([getDaysUntilEndClass(group.end_date), "flex h-2.5 w-2.5 rounded-full"])}" data-v-9edef435></span><div data-v-9edef435><h5 class="font-medium text-black dark:text-white text-sm" data-v-9edef435>${ssrInterpolate(group.code)}</h5><p class="text-xs text-gray-500" data-v-9edef435>${ssrInterpolate(formatDate(group.end_date))}</p></div></div><div class="text-right" data-v-9edef435>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/groups/${group.id}/certificates`,
            class: "block text-xs text-white bg-primary hover:bg-primary/90 px-3 py-1 rounded-md transition-colors"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Сертификаты `);
              } else {
                return [
                  createTextVNode(" Сертификаты ")
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div></div>`);
        });
        _push(`<!--]--></div></div></div>`);
      } else if (stats.value?.alerts?.length) {
        _push(`<div class="rounded-lg bg-danger/5 border border-danger/30 shadow-md overflow-hidden" data-v-9edef435><div class="border-b border-danger/30 py-4 px-6" data-v-9edef435><div class="flex items-center gap-3" data-v-9edef435><div class="h-10 w-10 rounded-lg bg-danger/10 flex items-center justify-center" data-v-9edef435>`);
        _push(ssrRenderComponent(_component_IconsErrorIcon, { class: "w-5 h-5 text-danger" }, null, _parent));
        _push(`</div><h3 class="text-lg font-semibold text-danger" data-v-9edef435>Требуют внимания</h3></div></div><div class="p-6" data-v-9edef435><ul class="space-y-3" data-v-9edef435><!--[-->`);
        ssrRenderList(stats.value.alerts, (alert, index) => {
          _push(`<li class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300" data-v-9edef435><span class="mt-1 h-1.5 w-1.5 rounded-full bg-danger flex-shrink-0" data-v-9edef435></span> ${ssrInterpolate(alert)}</li>`);
        });
        _push(`<!--]--></ul></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dashboard/Manager.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-9edef435"]]);
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "InstructorIcon",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<svg${ssrRenderAttrs(mergeProps({
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        "stroke-width": "1.5",
        stroke: "currentColor",
        class: "w-6 h-6"
      }, _attrs))}><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/InstructorIcon.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_4 = Object.assign(_sfc_main$4, { __name: "IconsInstructorIcon" });
const _sfc_main$3 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H18.5001C19.7427 20.75 20.7501 19.7426 20.7501 18.5V5.5C20.7501 4.25736 19.7427 3.25 18.5001 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H18.5001C18.9143 4.75 19.2501 5.08579 19.2501 5.5V18.5C19.2501 18.9142 18.9143 19.25 18.5001 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V5.5ZM6.25005 9.7143C6.25005 9.30008 6.58583 8.9643 7.00005 8.9643L17 8.96429C17.4143 8.96429 17.75 9.30008 17.75 9.71429C17.75 10.1285 17.4143 10.4643 17 10.4643L7.00005 10.4643C6.58583 10.4643 6.25005 10.1285 6.25005 9.7143ZM6.25005 14.2857C6.25005 13.8715 6.58583 13.5357 7.00005 13.5357H17C17.4143 13.5357 17.75 13.8715 17.75 14.2857C17.75 14.6999 17.4143 15.0357 17 15.0357H7.00005C6.58583 15.0357 6.25005 14.6999 6.25005 14.2857Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/ListIcon.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_14 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$3, [["ssrRender", _sfc_ssrRender$1]]), { __name: "IconsListIcon" });
const _sfc_main$2 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fillRule="evenodd" clipRule="evenodd" d="M3.70186 12.0001C3.70186 7.41711 7.41711 3.70186 12.0001 3.70186C16.5831 3.70186 20.2984 7.41711 20.2984 12.0001C20.2984 16.5831 16.5831 20.2984 12.0001 20.2984C7.41711 20.2984 3.70186 16.5831 3.70186 12.0001ZM12.0001 1.90186C6.423 1.90186 1.90186 6.423 1.90186 12.0001C1.90186 17.5772 6.423 22.0984 12.0001 22.0984C17.5772 22.0984 22.0984 17.5772 22.0984 12.0001C22.0984 6.423 17.5772 1.90186 12.0001 1.90186ZM15.6197 10.7395C15.9712 10.388 15.9712 9.81819 15.6197 9.46672C15.2683 9.11525 14.6984 9.11525 14.347 9.46672L11.1894 12.6243L9.6533 11.0883C9.30183 10.7368 8.73198 10.7368 8.38051 11.0883C8.02904 11.4397 8.02904 12.0096 8.38051 12.3611L10.553 14.5335C10.7217 14.7023 10.9507 14.7971 11.1894 14.7971C11.428 14.7971 11.657 14.7023 11.8257 14.5335L15.6197 10.7395Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/SuccessIcon.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_20 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$2, [["ssrRender", _sfc_ssrRender]]), { __name: "IconsSuccessIcon" });
const _sfc_main$1 = {
  __name: "DashboardAdmin",
  __ssrInlineRender: true,
  setup(__props) {
    const { user } = useAuth();
    useAuthFetch();
    useRouter();
    const stats = ref(null);
    const loading = ref(true);
    const courseTab = ref("groups");
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const certificatePeriod = ref("months");
    const certificateTransitioning = ref(false);
    const certificatePeriods = [
      { value: "months", label: "Месяцы" },
      { value: "quarters", label: "Кварталы" },
      { value: "years", label: "Годы" }
    ];
    const organizationChartData = computed(() => {
      const orgs = stats.value?.studentsByOrganization || [];
      return {
        series: orgs.map((o) => Number(o.count) || 0),
        labels: orgs.map((o) => o.name || "Не указано")
      };
    });
    const certificatesChartData = computed(() => {
      const certs = stats.value?.certificatesByMonth || [];
      const monthNames = [
        "Янв",
        "Фев",
        "Мар",
        "Апр",
        "Май",
        "Июн",
        "Июл",
        "Авг",
        "Сен",
        "Окт",
        "Ноя",
        "Дек"
      ];
      return {
        series: [
          {
            name: "Сертификаты",
            data: certs.map((c) => Number(c.count) || 0)
          }
        ],
        categories: certs.map((c) => {
          const [year, month] = c.month.split("-");
          return monthNames[parseInt(month) - 1] + " " + year.slice(2);
        }),
        rawData: certs
      };
    });
    const certificatesByQuarters = computed(() => {
      const rawData = certificatesChartData.value.rawData || [];
      const quarterMap = /* @__PURE__ */ new Map();
      rawData.forEach((item) => {
        const [year, month] = item.month.split("-");
        const quarter = Math.ceil(parseInt(month) / 3);
        const key = `${year}-Q${quarter}`;
        if (!quarterMap.has(key)) {
          quarterMap.set(key, { count: 0, year, quarter });
        }
        quarterMap.get(key).count += Number(item.count) || 0;
      });
      const sorted = Array.from(quarterMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, data]) => ({
        label: `Q${data.quarter} ${data.year.slice(2)}`,
        count: data.count
      }));
      return {
        series: [
          {
            name: "Сертификаты",
            data: sorted.map((q) => q.count)
          }
        ],
        categories: sorted.map((q) => q.label)
      };
    });
    const certificatesByYears = computed(() => {
      const rawData = certificatesChartData.value.rawData || [];
      const yearMap = /* @__PURE__ */ new Map();
      rawData.forEach((item) => {
        const [year] = item.month.split("-");
        if (!yearMap.has(year)) {
          yearMap.set(year, 0);
        }
        yearMap.set(year, yearMap.get(year) + (Number(item.count) || 0));
      });
      const sorted = Array.from(yearMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([year, count]) => ({ year, count }));
      return {
        series: [
          {
            name: "Сертификаты",
            data: sorted.map((y) => y.count)
          }
        ],
        categories: sorted.map((y) => y.year)
      };
    });
    const currentCertificatesData = computed(() => {
      switch (certificatePeriod.value) {
        case "quarters":
          return certificatesByQuarters.value;
        case "years":
          return certificatesByYears.value;
        default:
          return certificatesChartData.value;
      }
    });
    const currentTopCourses = computed(() => {
      if (courseTab.value === "groups") {
        return stats.value?.topCoursesByGroups || [];
      }
      return stats.value?.topCoursesByStudents || [];
    });
    const handleOrgChartClick = (data) => {
      console.log("Clicked on organization:", data.label);
    };
    const formatRelativeTime = (dateStr) => {
      const date = new Date(dateStr);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 6e4);
      if (diffMins < 1) return "только что";
      if (diffMins < 60) return `${diffMins} мин назад`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} ч назад`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays} дн назад`;
      return date.toLocaleDateString("ru-RU");
    };
    const getAlertClass = (type) => {
      const classes = {
        warning: "bg-warning/10 border border-warning/30",
        info: "bg-info/10 border border-info/30",
        error: "bg-danger/10 border border-danger/30",
        success: "bg-success/10 border border-success/30"
      };
      return classes[type] || classes.info;
    };
    const getActivityDotClass = (action) => {
      if (action.includes("создал") || action.includes("добавил"))
        return "bg-success";
      if (action.includes("удалил")) return "bg-danger";
      if (action.includes("изменил") || action.includes("обновил"))
        return "bg-warning";
      if (action.includes("вход")) return "bg-primary";
      return "bg-gray-400";
    };
    const getRankClass = (index) => {
      if (index === 0)
        return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
      if (index === 1)
        return "bg-gradient-to-br from-gray-300 to-gray-500 text-white";
      if (index === 2)
        return "bg-gradient-to-br from-orange-400 to-orange-600 text-white";
      return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
    };
    const getInitials = (name) => {
      if (!name) return "?";
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_IconsSettingsIcon = SettingsIcon;
      const _component_IconsUserGroupIcon = UserGroupIcon;
      const _component_IconsInstructorIcon = __nuxt_component_4;
      const _component_IconsCertificateIcon = CertificateIcon;
      const _component_IconsPieChartIcon = __nuxt_component_6;
      const _component_ChartsDonutChart = _sfc_main$7;
      const _component_IconsBarChartIcon = __nuxt_component_8;
      const _component_ChartsDynamicBarChart = __nuxt_component_9;
      const _component_IconsAcademicCapIcon = AcademicCapIcon;
      const _component_IconsUserCircleIcon = UserCircleIcon;
      const _component_IconsPlusIcon = PlusIcon;
      const _component_IconsGridIcon = GridIcon;
      const _component_IconsListIcon = __nuxt_component_14;
      const _component_IconsBellIcon = __nuxt_component_15;
      const _component_IconsCheckIcon = CheckIcon;
      const _component_IconsWarningIcon = __nuxt_component_17;
      const _component_IconsInfoCircleIcon = InfoCircleIcon;
      const _component_IconsErrorIcon = __nuxt_component_19;
      const _component_IconsSuccessIcon = __nuxt_component_20;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))} data-v-b9f45082><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-v-b9f45082><div data-v-b9f45082><h2 class="text-title-md2 font-bold text-black dark:text-white" data-v-b9f45082> Добро пожаловать, ${ssrInterpolate(unref(user)?.name || "Администратор")}! </h2><p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1" data-v-b9f45082>${ssrInterpolate(unref(currentDate))}</p></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/settings" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              class: "flex items-center gap-2"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_IconsSettingsIcon, { class: "w-5 h-5" }, null, _parent3, _scopeId2));
                  _push3(` Настройки системы `);
                } else {
                  return [
                    createVNode(_component_IconsSettingsIcon, { class: "w-5 h-5" }),
                    createTextVNode(" Настройки системы ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_UiButton, {
                variant: "outline",
                class: "flex items-center gap-2"
              }, {
                default: withCtx(() => [
                  createVNode(_component_IconsSettingsIcon, { class: "w-5 h-5" }),
                  createTextVNode(" Настройки системы ")
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6" data-v-b9f45082><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" data-v-b9f45082><div class="flex items-center gap-4" data-v-b9f45082><div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10" data-v-b9f45082>`);
      _push(ssrRenderComponent(_component_IconsUserGroupIcon, { class: "w-6 h-6 text-primary" }, null, _parent));
      _push(`</div><div data-v-b9f45082><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400" data-v-b9f45082> Всего студентов </h3><div class="flex items-center gap-2" data-v-b9f45082><p class="text-2xl font-bold text-black dark:text-white" data-v-b9f45082>${ssrInterpolate(stats.value?.totalStudents || 0)}</p>`);
      if (stats.value?.studentsTrend) {
        _push(`<span class="text-xs font-medium text-success" data-v-b9f45082> +${ssrInterpolate(stats.value.studentsTrend)}% </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" data-v-b9f45082><div class="flex items-center gap-4" data-v-b9f45082><div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10" data-v-b9f45082>`);
      _push(ssrRenderComponent(_component_IconsInstructorIcon, { class: "w-6 h-6 text-success" }, null, _parent));
      _push(`</div><div data-v-b9f45082><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400" data-v-b9f45082> Преподаватели </h3><p class="text-2xl font-bold text-black dark:text-white" data-v-b9f45082>${ssrInterpolate(stats.value?.totalInstructors || 0)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" data-v-b9f45082><div class="flex items-center gap-4" data-v-b9f45082><div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10" data-v-b9f45082>`);
      _push(ssrRenderComponent(_component_IconsUserGroupIcon, { class: "w-6 h-6 text-warning" }, null, _parent));
      _push(`</div><div data-v-b9f45082><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400" data-v-b9f45082> Активные группы </h3><p class="text-2xl font-bold text-black dark:text-white" data-v-b9f45082>${ssrInterpolate(stats.value?.activeGroups || 0)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" data-v-b9f45082><div class="flex items-center gap-4" data-v-b9f45082><div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10" data-v-b9f45082>`);
      _push(ssrRenderComponent(_component_IconsCertificateIcon, { class: "w-6 h-6 text-info" }, null, _parent));
      _push(`</div><div data-v-b9f45082><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400" data-v-b9f45082> Сертификаты за месяц </h3><p class="text-2xl font-bold text-black dark:text-white" data-v-b9f45082>${ssrInterpolate(stats.value?.certificatesThisMonth || 0)}</p></div></div></div></div><div class="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-6" data-v-b9f45082><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden" data-v-b9f45082><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between" data-v-b9f45082><div class="flex items-center gap-3" data-v-b9f45082><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center" data-v-b9f45082>`);
      _push(ssrRenderComponent(_component_IconsPieChartIcon, { class: "w-5 h-5 text-primary" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white" data-v-b9f45082> Студенты по организациям </h3></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/database?tab=organizations",
        class: "text-sm text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Все организации `);
          } else {
            return [
              createTextVNode(" Все организации ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="p-6" data-v-b9f45082>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-16" data-v-b9f45082><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-b9f45082></div></div>`);
      } else if (!organizationChartData.value.series.length) {
        _push(`<div class="flex flex-col items-center justify-center py-16 text-center" data-v-b9f45082>`);
        _push(ssrRenderComponent(_component_IconsUserGroupIcon, { class: "h-12 w-12 text-gray-300 mb-3" }, null, _parent));
        _push(`<p class="text-sm text-gray-500" data-v-b9f45082>Нет данных об организациях</p></div>`);
      } else {
        _push(ssrRenderComponent(_component_ChartsDonutChart, {
          "chart-id": "students-by-org",
          series: organizationChartData.value.series,
          labels: organizationChartData.value.labels,
          height: 350,
          "legend-position": "bottom",
          onClick: handleOrgChartClick
        }, null, _parent));
      }
      _push(`</div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden" data-v-b9f45082><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between flex-wrap gap-3" data-v-b9f45082><div class="flex items-center gap-3" data-v-b9f45082><div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center" data-v-b9f45082>`);
      _push(ssrRenderComponent(_component_IconsBarChartIcon, { class: "w-5 h-5 text-success" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white" data-v-b9f45082> Сертификаты </h3></div><div class="flex items-center gap-3" data-v-b9f45082><div class="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg" data-v-b9f45082><!--[-->`);
      ssrRenderList(certificatePeriods, (period) => {
        _push(`<button class="${ssrRenderClass([
          certificatePeriod.value === period.value ? "bg-success text-white shadow-md transform scale-105" : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
          "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300"
        ])}" data-v-b9f45082>${ssrInterpolate(period.label)}</button>`);
      });
      _push(`<!--]--></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/certificates",
        class: "text-sm text-primary hover:underline whitespace-nowrap"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Все сертификаты `);
          } else {
            return [
              createTextVNode(" Все сертификаты ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="p-6" data-v-b9f45082>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-16" data-v-b9f45082><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-b9f45082></div></div>`);
      } else if (!currentCertificatesData.value.series[0]?.data?.length) {
        _push(`<div class="flex flex-col items-center justify-center py-16 text-center" data-v-b9f45082>`);
        _push(ssrRenderComponent(_component_IconsCertificateIcon, { class: "h-12 w-12 text-gray-300 mb-3" }, null, _parent));
        _push(`<p class="text-sm text-gray-500" data-v-b9f45082>Нет данных о сертификатах</p></div>`);
      } else {
        _push(`<div class="${ssrRenderClass([certificateTransitioning.value ? "opacity-50" : "opacity-100", "transition-opacity duration-500"])}" data-v-b9f45082>`);
        _push(ssrRenderComponent(_component_ChartsDynamicBarChart, {
          key: certificatePeriod.value,
          "chart-id": "certificates-chart",
          series: currentCertificatesData.value.series,
          categories: currentCertificatesData.value.categories,
          colors: ["#10B981"],
          height: 320,
          "y-axis-title": "Количество",
          "animation-speed": 800
        }, null, _parent));
        _push(`</div>`);
      }
      _push(`</div></div></div><div class="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-6" data-v-b9f45082><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden" data-v-b9f45082><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between" data-v-b9f45082><div class="flex items-center gap-3" data-v-b9f45082><div class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center" data-v-b9f45082>`);
      _push(ssrRenderComponent(_component_IconsInstructorIcon, { class: "w-5 h-5 text-warning" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white" data-v-b9f45082> Топ инструкторов по часам </h3></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/programs",
        class: "text-sm text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Все инструкторы `);
          } else {
            return [
              createTextVNode(" Все инструкторы ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="p-6" data-v-b9f45082>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-8" data-v-b9f45082><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-b9f45082></div></div>`);
      } else if (!stats.value?.topInstructors?.length) {
        _push(`<div class="flex flex-col items-center justify-center py-8 text-center" data-v-b9f45082>`);
        _push(ssrRenderComponent(_component_IconsInstructorIcon, { class: "h-12 w-12 text-gray-300 mb-3" }, null, _parent));
        _push(`<p class="text-sm text-gray-500" data-v-b9f45082>Нет данных об инструкторах</p></div>`);
      } else {
        _push(`<div class="overflow-x-auto" data-v-b9f45082><table class="w-full text-sm" data-v-b9f45082><thead data-v-b9f45082><tr class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700" data-v-b9f45082><th class="pb-3 font-medium" data-v-b9f45082>#</th><th class="pb-3 font-medium" data-v-b9f45082>Инструктор</th><th class="pb-3 font-medium text-right" data-v-b9f45082>Часы</th><th class="pb-3 font-medium text-right" data-v-b9f45082>Занятий</th></tr></thead><tbody data-v-b9f45082><!--[-->`);
        ssrRenderList(stats.value.topInstructors, (instructor, index) => {
          _push(`<tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" data-v-b9f45082><td class="py-3" data-v-b9f45082><span class="${ssrRenderClass([getRankClass(index), "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"])}" data-v-b9f45082>${ssrInterpolate(index + 1)}</span></td><td class="py-3" data-v-b9f45082><div class="flex items-center gap-3" data-v-b9f45082><div class="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xs font-bold" data-v-b9f45082>${ssrInterpolate(getInitials(instructor.name))}</div><span class="font-medium text-black dark:text-white truncate max-w-[150px]" data-v-b9f45082>${ssrInterpolate(instructor.name)}</span></div></td><td class="py-3 text-right" data-v-b9f45082><span class="font-bold text-warning" data-v-b9f45082>${ssrInterpolate(instructor.hours)} ч</span></td><td class="py-3 text-right text-gray-600 dark:text-gray-400" data-v-b9f45082>${ssrInterpolate(instructor.lessonsCount)}</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      }
      _push(`</div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden" data-v-b9f45082><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between" data-v-b9f45082><div class="flex items-center gap-3" data-v-b9f45082><div class="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center" data-v-b9f45082>`);
      _push(ssrRenderComponent(_component_IconsAcademicCapIcon, { class: "w-5 h-5 text-info" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white" data-v-b9f45082> Топ курсов </h3></div><div class="flex gap-2" data-v-b9f45082><button class="${ssrRenderClass([
        courseTab.value === "groups" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
        "px-3 py-1 rounded-lg text-xs font-medium transition-colors"
      ])}" data-v-b9f45082> По группам </button><button class="${ssrRenderClass([
        courseTab.value === "students" ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
        "px-3 py-1 rounded-lg text-xs font-medium transition-colors"
      ])}" data-v-b9f45082> По слушателям </button></div></div><div class="p-6" data-v-b9f45082>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-8" data-v-b9f45082><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-b9f45082></div></div>`);
      } else if (!currentTopCourses.value?.length) {
        _push(`<div class="flex flex-col items-center justify-center py-8 text-center" data-v-b9f45082>`);
        _push(ssrRenderComponent(_component_IconsAcademicCapIcon, { class: "h-12 w-12 text-gray-300 mb-3" }, null, _parent));
        _push(`<p class="text-sm text-gray-500" data-v-b9f45082>Нет данных о курсах</p></div>`);
      } else {
        _push(`<div class="space-y-4" data-v-b9f45082><!--[-->`);
        ssrRenderList(currentTopCourses.value, (course, index) => {
          _push(`<div class="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer" data-v-b9f45082><span class="${ssrRenderClass([getRankClass(index), "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold flex-shrink-0"])}" data-v-b9f45082>${ssrInterpolate(index + 1)}</span><div class="flex-1 min-w-0" data-v-b9f45082><p class="font-medium text-black dark:text-white truncate" data-v-b9f45082>${ssrInterpolate(course.name)}</p><p class="text-xs text-gray-500" data-v-b9f45082>${ssrInterpolate(course.code)}</p></div><div class="text-right flex-shrink-0" data-v-b9f45082><p class="text-lg font-bold text-info" data-v-b9f45082>${ssrInterpolate(courseTab.value === "groups" ? course.groups_count : course.students_count)}</p><p class="text-xs text-gray-500" data-v-b9f45082>${ssrInterpolate(courseTab.value === "groups" ? "групп" : "слушателей")}</p></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div></div><div class="grid grid-cols-1 gap-6 xl:grid-cols-3 mb-6" data-v-b9f45082><div class="xl:col-span-2 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden" data-v-b9f45082><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center gap-3" data-v-b9f45082><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center" data-v-b9f45082>`);
      _push(ssrRenderComponent(_component_IconsBarChartIcon, { class: "w-5 h-5 text-primary" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white" data-v-b9f45082> Статистика системы </h3></div><div class="p-6" data-v-b9f45082>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-8" data-v-b9f45082><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-b9f45082></div></div>`);
      } else {
        _push(`<div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-v-b9f45082><div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer" data-v-b9f45082><div data-v-b9f45082><p class="text-sm text-gray-500 dark:text-gray-400" data-v-b9f45082> Всего пользователей </p><p class="text-2xl font-bold text-black dark:text-white mt-1" data-v-b9f45082>${ssrInterpolate(stats.value?.totalUsers || 0)}</p></div><div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center" data-v-b9f45082>`);
        _push(ssrRenderComponent(_component_IconsUserCircleIcon, { class: "w-6 h-6 text-primary" }, null, _parent));
        _push(`</div></div><div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800" data-v-b9f45082><div data-v-b9f45082><p class="text-sm text-gray-500 dark:text-gray-400" data-v-b9f45082> Зарегистрировано сегодня </p><p class="text-2xl font-bold text-black dark:text-white mt-1" data-v-b9f45082>${ssrInterpolate(stats.value?.todayRegistrations || 0)}</p></div><div class="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center" data-v-b9f45082>`);
        _push(ssrRenderComponent(_component_IconsPlusIcon, { class: "w-6 h-6 text-success" }, null, _parent));
        _push(`</div></div><div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800" data-v-b9f45082><div data-v-b9f45082><p class="text-sm text-gray-500 dark:text-gray-400" data-v-b9f45082> Активных сессий </p><p class="text-2xl font-bold text-black dark:text-white mt-1" data-v-b9f45082>${ssrInterpolate(stats.value?.activeSessions || 0)}</p></div><div class="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center" data-v-b9f45082>`);
        _push(ssrRenderComponent(_component_IconsGridIcon, { class: "w-6 h-6 text-warning" }, null, _parent));
        _push(`</div></div><div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer" data-v-b9f45082><div data-v-b9f45082><p class="text-sm text-gray-500 dark:text-gray-400" data-v-b9f45082> Логов сегодня </p><p class="text-2xl font-bold text-black dark:text-white mt-1" data-v-b9f45082>${ssrInterpolate(stats.value?.todayLogs || 0)}</p></div><div class="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center" data-v-b9f45082>`);
        _push(ssrRenderComponent(_component_IconsListIcon, { class: "w-6 h-6 text-info" }, null, _parent));
        _push(`</div></div></div>`);
      }
      _push(`</div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden" data-v-b9f45082><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center gap-3" data-v-b9f45082><div class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center" data-v-b9f45082>`);
      _push(ssrRenderComponent(_component_IconsBellIcon, { class: "w-5 h-5 text-warning" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white" data-v-b9f45082> Системные уведомления </h3></div><div class="p-6" data-v-b9f45082>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-8" data-v-b9f45082><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-b9f45082></div></div>`);
      } else if (!stats.value?.systemAlerts?.length) {
        _push(`<div class="flex flex-col items-center justify-center py-8 text-center" data-v-b9f45082><div class="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3" data-v-b9f45082>`);
        _push(ssrRenderComponent(_component_IconsCheckIcon, { class: "h-6 w-6 text-success" }, null, _parent));
        _push(`</div><p class="text-sm text-gray-500" data-v-b9f45082>Нет системных уведомлений</p></div>`);
      } else {
        _push(`<div class="flex flex-col gap-3" data-v-b9f45082><!--[-->`);
        ssrRenderList(stats.value.systemAlerts, (alert, index) => {
          _push(`<div class="${ssrRenderClass([getAlertClass(alert.type), "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"])}" data-v-b9f45082>`);
          if (alert.type === "warning") {
            _push(ssrRenderComponent(_component_IconsWarningIcon, { class: "w-5 h-5 text-warning flex-shrink-0" }, null, _parent));
          } else if (alert.type === "info") {
            _push(ssrRenderComponent(_component_IconsInfoCircleIcon, { class: "w-5 h-5 text-info flex-shrink-0" }, null, _parent));
          } else if (alert.type === "error") {
            _push(ssrRenderComponent(_component_IconsErrorIcon, { class: "w-5 h-5 text-danger flex-shrink-0" }, null, _parent));
          } else {
            _push(ssrRenderComponent(_component_IconsSuccessIcon, { class: "w-5 h-5 text-success flex-shrink-0" }, null, _parent));
          }
          _push(`<div class="flex-1" data-v-b9f45082><p class="text-sm font-medium text-black dark:text-white" data-v-b9f45082>${ssrInterpolate(alert.message)}</p>`);
          if (alert.action) {
            _push(`<p class="text-xs text-primary hover:underline cursor-pointer mt-1" data-v-b9f45082>${ssrInterpolate(alert.action)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden mb-6" data-v-b9f45082><div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center" data-v-b9f45082><div class="flex items-center gap-3" data-v-b9f45082><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center" data-v-b9f45082>`);
      _push(ssrRenderComponent(_component_IconsListIcon, { class: "w-5 h-5 text-primary" }, null, _parent));
      _push(`</div><h3 class="text-lg font-semibold text-black dark:text-white" data-v-b9f45082> Последние действия </h3></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/activity-logs",
        class: "text-sm text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Все логи `);
          } else {
            return [
              createTextVNode(" Все логи ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="p-6" data-v-b9f45082>`);
      if (loading.value) {
        _push(`<div class="flex justify-center py-8" data-v-b9f45082><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" data-v-b9f45082></div></div>`);
      } else if (!stats.value?.recentActivities?.length) {
        _push(`<div class="text-center text-gray-500 py-4" data-v-b9f45082> Нет недавних действий </div>`);
      } else {
        _push(`<div class="grid grid-cols-1 md:grid-cols-2 gap-3" data-v-b9f45082><!--[-->`);
        ssrRenderList(stats.value.recentActivities, (activity) => {
          _push(`<div class="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" data-v-b9f45082><span class="${ssrRenderClass([getActivityDotClass(activity.action), "flex h-2 w-2 rounded-full flex-shrink-0"])}" data-v-b9f45082></span><div class="flex-1 min-w-0" data-v-b9f45082><p class="text-sm text-black dark:text-white truncate" data-v-b9f45082><span class="font-medium" data-v-b9f45082>${ssrInterpolate(activity.user_name)}</span><span class="text-gray-500 mx-1" data-v-b9f45082>•</span><span class="text-gray-600 dark:text-gray-400" data-v-b9f45082>${ssrInterpolate(activity.action)}</span></p><p class="text-xs text-gray-500 mt-0.5" data-v-b9f45082>${ssrInterpolate(formatRelativeTime(activity.created_at))}</p></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dashboard/Admin.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-b9f45082"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Панель управления"
    });
    const { isStudent, isTeacher, isManager, isAdmin } = usePermissions();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_DashboardStudent = _sfc_main$a;
      const _component_DashboardTeacher = _sfc_main$9;
      const _component_DashboardManager = __nuxt_component_2;
      const _component_DashboardAdmin = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      if (unref(isStudent)) {
        _push(ssrRenderComponent(_component_DashboardStudent, null, null, _parent));
      } else if (unref(isTeacher)) {
        _push(ssrRenderComponent(_component_DashboardTeacher, null, null, _parent));
      } else if (unref(isManager)) {
        _push(ssrRenderComponent(_component_DashboardManager, null, null, _parent));
      } else if (unref(isAdmin)) {
        _push(ssrRenderComponent(_component_DashboardAdmin, null, null, _parent));
      } else {
        _push(`<div class="grid grid-cols-12 gap-4 md:gap-6"><div class="col-span-12"><div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"><h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-4"> Панель управления </h1><p class="text-gray-600 dark:text-gray-400"> Welcome to TailAdmin Nuxt 4 Dashboard! </p></div></div><div class="col-span-12 lg:col-span-6"><div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"><h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-2"> Monthly Revenue </h2><p class="text-3xl font-bold text-brand-500">$24,780</p></div></div><div class="col-span-12 lg:col-span-6"><div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"><h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-2"> Total Orders </h2><p class="text-3xl font-bold text-success-500">1,234</p></div></div></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-Bh36-vB6.mjs.map
