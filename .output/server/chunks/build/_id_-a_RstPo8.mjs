import { _ as __nuxt_component_0 } from './nuxt-link-DnWQlAEm.mjs';
import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { _ as __nuxt_component_2, a as __nuxt_component_3 } from './StudentCertificatesModal-BG5Xd3Hu.mjs';
import { _ as __nuxt_component_2$1 } from './CertificateDetailModal-D7vJflL2.mjs';
import { _ as __nuxt_component_0$1 } from './Modal-DQYphXo7.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, unref, createVNode, createTextVNode, createBlock, openBlock, resolveDynamicComponent, toDisplayString, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderVNode, ssrRenderStyle, ssrRenderAttr } from 'vue/server-renderer';
import { _ as __nuxt_component_3$1 } from './ConfirmModal-D4ued3Bi.mjs';
import { ArrowLeft, AlertCircle, User, BookOpen, Award } from 'lucide-vue-next';
import { l as useRoute, a as useRouter } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
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
import './CertificateManualFormModal-DS6NpHYJ.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';
import './Notification-CQvvdM2O.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "StudentCourseDetailModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    course: {}
  },
  emits: ["close"],
  setup(__props) {
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    };
    const calculateDuration = (startDate, endDate) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
      if (diffDays < 30) {
        return `${diffDays} дней`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев"}`;
      } else {
        const years = Math.floor(diffDays / 365);
        const months = Math.floor(diffDays % 365 / 30);
        return `${years} ${years === 1 ? "год" : years < 5 ? "года" : "лет"} ${months > 0 ? `${months} мес.` : ""}`;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        onClose: ($event) => _ctx.$emit("close"),
        size: "lg"
      }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex items-center gap-3"${_scopeId}><div class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"${_scopeId}><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"${_scopeId}></path></svg></div><div${_scopeId}><h2 class="text-xl font-bold text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.course.course_name)}</h2><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}> Группа: ${ssrInterpolate(__props.course.group_name)}</p></div></div>`);
          } else {
            return [
              createVNode("div", { class: "flex items-center gap-3" }, [
                createVNode("div", { class: "h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center" }, [
                  (openBlock(), createBlock("svg", {
                    class: "w-6 h-6 text-primary",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    })
                  ]))
                ]),
                createVNode("div", null, [
                  createVNode("h2", { class: "text-xl font-bold text-black dark:text-white" }, toDisplayString(__props.course.course_name), 1),
                  createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, " Группа: " + toDisplayString(__props.course.group_name), 1)
                ])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}><div class="bg-linear-to-br from-primary/5 to-transparent rounded-xl p-6 border border-gray-200 dark:border-strokedark"${_scopeId}><div class="flex items-center justify-between mb-4"${_scopeId}><h3 class="text-lg font-semibold text-black dark:text-white"${_scopeId}> Статус курса </h3>`);
            if (__props.course.status === "active") {
              _push2(`<span class="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-sm font-medium text-success"${_scopeId}><span class="h-2 w-2 rounded-full bg-success"${_scopeId}></span> Активен </span>`);
            } else {
              _push2(`<span class="inline-flex items-center gap-1.5 rounded-full bg-gray-200 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"${_scopeId}><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"${_scopeId}></path></svg> Завершен </span>`);
            }
            _push2(`</div><div class="mb-4"${_scopeId}><div class="flex justify-between items-center mb-2"${_scopeId}><span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}>Прогресс посещаемости</span><span class="text-lg font-bold text-primary"${_scopeId}>${ssrInterpolate(__props.course.progress)}%</span></div><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden"${_scopeId}><div class="h-3 rounded-full bg-linear-to-r from-primary to-purple-500 transition-all duration-500" style="${ssrRenderStyle({ width: `${__props.course.progress}%` })}"${_scopeId}></div></div></div><div class="grid grid-cols-2 gap-4"${_scopeId}><div class="bg-white dark:bg-boxdark rounded-lg p-4 border border-gray-200 dark:border-strokedark"${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400 mb-1"${_scopeId}> Посещено занятий </p><p class="text-2xl font-bold text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.course.attended_lessons)} <span class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>/ ${ssrInterpolate(__props.course.total_lessons)}</span></p></div><div class="bg-white dark:bg-boxdark rounded-lg p-4 border border-gray-200 dark:border-strokedark"${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400 mb-1"${_scopeId}> Процент посещаемости </p><p class="text-2xl font-bold text-primary"${_scopeId}>${ssrInterpolate(__props.course.progress)}% </p></div></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6"${_scopeId}><div class="bg-white dark:bg-boxdark rounded-xl p-6 border border-gray-200 dark:border-strokedark"${_scopeId}><h3 class="text-lg font-semibold text-black dark:text-white mb-4"${_scopeId}> Информация о курсе </h3><div class="space-y-3"${_scopeId}><div${_scopeId}><label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"${_scopeId}> Название курса </label><p class="text-base font-semibold text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.course.course_name)}</p></div><div${_scopeId}><label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"${_scopeId}> Код группы </label><p class="text-base font-mono text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.course.group_name)}</p></div>`);
            if (__props.course.teacher_name) {
              _push2(`<div${_scopeId}><label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"${_scopeId}> Преподаватель </label><p class="text-base text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.course.teacher_name)}</p></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="bg-white dark:bg-boxdark rounded-xl p-6 border border-gray-200 dark:border-strokedark"${_scopeId}><h3 class="text-lg font-semibold text-black dark:text-white mb-4"${_scopeId}> Период обучения </h3><div class="space-y-3"${_scopeId}><div${_scopeId}><label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"${_scopeId}> Дата начала </label><p class="text-base text-black dark:text-white"${_scopeId}>${ssrInterpolate(formatDate(__props.course.start_date))}</p></div><div${_scopeId}><label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"${_scopeId}> Дата окончания </label><p class="text-base text-black dark:text-white"${_scopeId}>${ssrInterpolate(formatDate(__props.course.end_date))}</p></div><div${_scopeId}><label class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"${_scopeId}> Продолжительность </label><p class="text-base text-black dark:text-white"${_scopeId}>${ssrInterpolate(calculateDuration(__props.course.start_date, __props.course.end_date))}</p></div></div></div></div><div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-strokedark"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "secondary",
              onClick: ($event) => _ctx.$emit("close")
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
            _push2(ssrRenderComponent(_component_NuxtLink, {
              to: `/groups/${__props.course.group_id}`
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_UiButton, {
                    variant: "primary",
                    class: "flex items-center gap-2"
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId3}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"${_scopeId3}></path></svg> Перейти к группе `);
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
                              d: "M13 7l5 5m0 0l-5 5m5-5H6"
                            })
                          ])),
                          createTextVNode(" Перейти к группе ")
                        ];
                      }
                    }),
                    _: 1
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_UiButton, {
                      variant: "primary",
                      class: "flex items-center gap-2"
                    }, {
                      default: withCtx(() => [
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
                            d: "M13 7l5 5m0 0l-5 5m5-5H6"
                          })
                        ])),
                        createTextVNode(" Перейти к группе ")
                      ]),
                      _: 1
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode("div", { class: "bg-linear-to-br from-primary/5 to-transparent rounded-xl p-6 border border-gray-200 dark:border-strokedark" }, [
                  createVNode("div", { class: "flex items-center justify-between mb-4" }, [
                    createVNode("h3", { class: "text-lg font-semibold text-black dark:text-white" }, " Статус курса "),
                    __props.course.status === "active" ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-sm font-medium text-success"
                    }, [
                      createVNode("span", { class: "h-2 w-2 rounded-full bg-success" }),
                      createTextVNode(" Активен ")
                    ])) : (openBlock(), createBlock("span", {
                      key: 1,
                      class: "inline-flex items-center gap-1.5 rounded-full bg-gray-200 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4",
                        fill: "currentColor",
                        viewBox: "0 0 20 20"
                      }, [
                        createVNode("path", {
                          "fill-rule": "evenodd",
                          d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                          "clip-rule": "evenodd"
                        })
                      ])),
                      createTextVNode(" Завершен ")
                    ]))
                  ]),
                  createVNode("div", { class: "mb-4" }, [
                    createVNode("div", { class: "flex justify-between items-center mb-2" }, [
                      createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, "Прогресс посещаемости"),
                      createVNode("span", { class: "text-lg font-bold text-primary" }, toDisplayString(__props.course.progress) + "%", 1)
                    ]),
                    createVNode("div", { class: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden" }, [
                      createVNode("div", {
                        class: "h-3 rounded-full bg-linear-to-r from-primary to-purple-500 transition-all duration-500",
                        style: { width: `${__props.course.progress}%` }
                      }, null, 4)
                    ])
                  ]),
                  createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                    createVNode("div", { class: "bg-white dark:bg-boxdark rounded-lg p-4 border border-gray-200 dark:border-strokedark" }, [
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400 mb-1" }, " Посещено занятий "),
                      createVNode("p", { class: "text-2xl font-bold text-black dark:text-white" }, [
                        createTextVNode(toDisplayString(__props.course.attended_lessons) + " ", 1),
                        createVNode("span", { class: "text-sm text-gray-500 dark:text-gray-400" }, "/ " + toDisplayString(__props.course.total_lessons), 1)
                      ])
                    ]),
                    createVNode("div", { class: "bg-white dark:bg-boxdark rounded-lg p-4 border border-gray-200 dark:border-strokedark" }, [
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400 mb-1" }, " Процент посещаемости "),
                      createVNode("p", { class: "text-2xl font-bold text-primary" }, toDisplayString(__props.course.progress) + "% ", 1)
                    ])
                  ])
                ]),
                createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-6" }, [
                  createVNode("div", { class: "bg-white dark:bg-boxdark rounded-xl p-6 border border-gray-200 dark:border-strokedark" }, [
                    createVNode("h3", { class: "text-lg font-semibold text-black dark:text-white mb-4" }, " Информация о курсе "),
                    createVNode("div", { class: "space-y-3" }, [
                      createVNode("div", null, [
                        createVNode("label", { class: "text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1" }, " Название курса "),
                        createVNode("p", { class: "text-base font-semibold text-black dark:text-white" }, toDisplayString(__props.course.course_name), 1)
                      ]),
                      createVNode("div", null, [
                        createVNode("label", { class: "text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1" }, " Код группы "),
                        createVNode("p", { class: "text-base font-mono text-black dark:text-white" }, toDisplayString(__props.course.group_name), 1)
                      ]),
                      __props.course.teacher_name ? (openBlock(), createBlock("div", { key: 0 }, [
                        createVNode("label", { class: "text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1" }, " Преподаватель "),
                        createVNode("p", { class: "text-base text-black dark:text-white" }, toDisplayString(__props.course.teacher_name), 1)
                      ])) : createCommentVNode("", true)
                    ])
                  ]),
                  createVNode("div", { class: "bg-white dark:bg-boxdark rounded-xl p-6 border border-gray-200 dark:border-strokedark" }, [
                    createVNode("h3", { class: "text-lg font-semibold text-black dark:text-white mb-4" }, " Период обучения "),
                    createVNode("div", { class: "space-y-3" }, [
                      createVNode("div", null, [
                        createVNode("label", { class: "text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1" }, " Дата начала "),
                        createVNode("p", { class: "text-base text-black dark:text-white" }, toDisplayString(formatDate(__props.course.start_date)), 1)
                      ]),
                      createVNode("div", null, [
                        createVNode("label", { class: "text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1" }, " Дата окончания "),
                        createVNode("p", { class: "text-base text-black dark:text-white" }, toDisplayString(formatDate(__props.course.end_date)), 1)
                      ]),
                      createVNode("div", null, [
                        createVNode("label", { class: "text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1" }, " Продолжительность "),
                        createVNode("p", { class: "text-base text-black dark:text-white" }, toDisplayString(calculateDuration(__props.course.start_date, __props.course.end_date)), 1)
                      ])
                    ])
                  ])
                ]),
                createVNode("div", { class: "flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-strokedark" }, [
                  createVNode(_component_UiButton, {
                    variant: "secondary",
                    onClick: ($event) => _ctx.$emit("close")
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Закрыть ")
                    ]),
                    _: 1
                  }, 8, ["onClick"]),
                  createVNode(_component_NuxtLink, {
                    to: `/groups/${__props.course.group_id}`
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_UiButton, {
                        variant: "primary",
                        class: "flex items-center gap-2"
                      }, {
                        default: withCtx(() => [
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
                              d: "M13 7l5 5m0 0l-5 5m5-5H6"
                            })
                          ])),
                          createTextVNode(" Перейти к группе ")
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["to"])
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
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/StudentCourseDetailModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_5 = Object.assign(_sfc_main$1, { __name: "DatabaseStudentCourseDetailModal" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const router = useRouter();
    const studentId = route.params.id;
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const { canEditStudents, canDeleteStudents } = usePermissions();
    const student = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const isEditModalOpen = ref(false);
    const isDeleteModalOpen = ref(false);
    const isDeleting = ref(false);
    const activeTab = ref("info");
    const availableTabs = [
      { id: "info", label: "Информация", icon: User },
      { id: "courses", label: "Курсы", icon: BookOpen },
      { id: "certificates", label: "Сертификаты", icon: Award }
    ];
    const studentCourses = ref([]);
    const coursesLoading = ref(false);
    const isCourseDetailModalOpen = ref(false);
    const selectedCourse = ref(null);
    const activeCourses = computed(
      () => studentCourses.value.filter((c) => c.status === "active")
    );
    const completedCourses = computed(
      () => studentCourses.value.filter((c) => c.status === "completed")
    );
    const fetchStudentCourses = async () => {
      coursesLoading.value = true;
      try {
        const response = await authFetch(`/api/students/${studentId}/courses`);
        if (response.success) {
          studentCourses.value = response.courses;
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        coursesLoading.value = false;
      }
    };
    const closeCourseDetailModal = () => {
      isCourseDetailModalOpen.value = false;
      selectedCourse.value = null;
    };
    const getInitials = (name) => {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };
    const formatDate = (dateString) => {
      if (!dateString) return "—";
      return new Date(dateString).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };
    const formatShortDate = (dateString) => {
      if (!dateString) return "—";
      return new Date(dateString).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "numeric",
        year: "numeric"
      });
    };
    const fetchStudent = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await authFetch(
          `/api/students/${studentId}`
        );
        if (response.success) {
          student.value = response.student;
          fetchStudentCourses();
        } else {
          error.value = "Не удалось загрузить данные";
        }
      } catch (e) {
        error.value = e.message || "Ошибка соединения с сервером";
      } finally {
        loading.value = false;
      }
    };
    const openEditModal = () => {
      isEditModalOpen.value = true;
    };
    const closeEditModal = () => {
      isEditModalOpen.value = false;
    };
    const handleUpdate = async (data) => {
      try {
        const response = await authFetch(
          `/api/students/${studentId}`,
          {
            method: "PUT",
            body: data
          }
        );
        if (response.success) {
          student.value = response.student;
          closeEditModal();
          notification.success("Данные студента обновлены");
        }
      } catch (e) {
        console.error("Error updating student:", e);
        notification.error("Ошибка при обновлении данных");
      }
    };
    const handleDelete = () => {
      isDeleteModalOpen.value = true;
    };
    const closeDeleteModal = () => {
      isDeleteModalOpen.value = false;
    };
    const confirmDelete = async () => {
      isDeleting.value = true;
      try {
        await authFetch(`/api/students/${studentId}`, {
          method: "DELETE"
        });
        router.push("/users?tab=students");
        notification.success("Студент удален");
      } catch (e) {
        console.error("Error deleting student:", e);
        notification.error("Ошибка удаления");
      } finally {
        isDeleting.value = false;
        closeDeleteModal();
      }
    };
    const isCertificatesModalOpen = ref(false);
    const isCertificateDetailModalOpen = ref(false);
    const selectedCertificate = ref(null);
    const openCertificatesModal = () => {
      isCertificatesModalOpen.value = true;
    };
    const closeCertificatesModal = () => {
      isCertificatesModalOpen.value = false;
    };
    const closeCertificateDetailModal = () => {
      isCertificateDetailModalOpen.value = false;
      selectedCertificate.value = null;
    };
    const getExpiryStatus = (expiryDate) => {
      if (!expiryDate) return "valid";
      const now = /* @__PURE__ */ new Date();
      const expiry = new Date(expiryDate);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
      if (diffDays < 0) return "expired";
      if (diffDays <= 30) return "expiring";
      return "valid";
    };
    const getExpiryStatusClass = (expiryDate) => {
      const status = getExpiryStatus(expiryDate);
      switch (status) {
        case "expired":
          return "text-danger";
        case "expiring":
          return "text-warning";
        default:
          return "text-black dark:text-white";
      }
    };
    const getExpiryBadgeClass = (expiryDate) => {
      const status = getExpiryStatus(expiryDate);
      switch (status) {
        case "expired":
          return "bg-danger/10 text-danger";
        case "expiring":
          return "bg-warning/10 text-warning";
        default:
          return "bg-success/10 text-success";
      }
    };
    const getExpiryLabel = (expiryDate) => {
      const status = getExpiryStatus(expiryDate);
      switch (status) {
        case "expired":
          return "Истек";
        case "expiring":
          return "Истекает скоро";
        default:
          return "Действителен";
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_DatabaseStudentFormModal = __nuxt_component_2;
      const _component_DatabaseStudentCertificatesModal = __nuxt_component_3;
      const _component_DatabaseCertificateDetailModal = __nuxt_component_2$1;
      const _component_DatabaseStudentCourseDetailModal = __nuxt_component_5;
      const _component_UiConfirmModal = __nuxt_component_3$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/users?tab=students",
        class: "inline-flex items-center gap-2 text-primary hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(ArrowLeft), { class: "h-4 w-4" }, null, _parent2, _scopeId));
            _push2(` Назад к списку `);
          } else {
            return [
              createVNode(unref(ArrowLeft), { class: "h-4 w-4" }),
              createTextVNode(" Назад к списку ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (loading.value) {
        _push(`<div class="flex justify-center items-center py-20"><div class="flex flex-col items-center gap-4"><div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div><p class="text-gray-600 dark:text-gray-400"> Загрузка данных студента... </p></div></div>`);
      } else if (error.value) {
        _push(`<div class="rounded-lg border border-danger/30 bg-danger/5 p-8 text-center">`);
        _push(ssrRenderComponent(unref(AlertCircle), { class: "mx-auto h-12 w-12 text-danger" }, null, _parent));
        _push(`<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"> Ошибка загрузки </h3><p class="mt-2 text-gray-600 dark:text-gray-400">${ssrInterpolate(error.value)}</p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          class: "mt-4",
          onClick: fetchStudent
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
        _push(`</div>`);
      } else if (student.value) {
        _push(`<!--[--><div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg overflow-hidden mb-6"><div class="h-32 bg-white dark:bg-boxdark relative"></div><div class="relative px-8 pb-8"><div class="flex flex-col sm:flex-row items-end gap-6 -mt-16 mb-6"><div class="relative"><div class="h-32 w-32 rounded-2xl bg-white dark:bg-boxdark shadow-xl flex items-center justify-center border-4 border-white dark:border-boxdark"><span class="text-5xl font-bold text-primary">${ssrInterpolate(getInitials(student.value.fullName))}</span></div><div class="absolute -bottom-2 -right-2 h-10 w-10 bg-success rounded-full border-4 border-white dark:border-boxdark flex items-center justify-center"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></div></div><div class="flex-1 pb-2 text-center sm:text-left"><h1 class="text-3xl font-bold text-black dark:text-white mb-2">${ssrInterpolate(student.value.fullName)}</h1><p class="text-lg text-gray-600 dark:text-gray-400">${ssrInterpolate(student.value.position)}</p></div><div class="flex gap-3 pb-2 w-full sm:w-auto justify-center sm:justify-end">`);
        if (unref(canEditStudents)) {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "primary",
            onClick: openEditModal,
            class: "flex items-center gap-2"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId}></path></svg> Редактировать `);
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
                      d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    })
                  ])),
                  createTextVNode(" Редактировать ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(canDeleteStudents)) {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "danger",
            onClick: handleDelete,
            class: "flex items-center gap-2"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"${_scopeId}></path></svg> Удалить `);
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
                      d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                    })
                  ])),
                  createTextVNode(" Удалить ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div><div class="flex flex-col gap-6"><div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800"><nav class="flex gap-1" aria-label="Tabs"><!--[-->`);
        ssrRenderList(availableTabs, (tab) => {
          _push(`<button class="${ssrRenderClass([
            "flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200",
            activeTab.value === tab.id ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          ])}"><span class="flex items-center justify-center gap-2">`);
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(tab.icon), { class: "h-5 w-5" }, null), _parent);
          _push(` ${ssrInterpolate(tab.label)}</span></button>`);
        });
        _push(`<!--]--></nav></div><div style="${ssrRenderStyle(activeTab.value === "info" ? null : { display: "none" })}"><div class="grid grid-cols-1 gap-6 lg:grid-cols-2"><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Личные данные </h3><div class="space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> ПИНФЛ </p><div class="flex items-center gap-2"><p class="font-medium text-gray-900 dark:text-white font-mono flex-1">${ssrInterpolate(student.value.pinfl)}</p><button class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Копировать"><svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button></div></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> Дата регистрации </p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(formatDate(student.value.created_at))}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> Последнее обновление </p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(formatDate(student.value.updated_at))}</p></div></div></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"> Рабочая информация </h3><div class="space-y-3"><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> Организация </p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(student.value.organization)}</p></div><div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> Должность </p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(student.value.position)}</p></div>`);
        if (student.value.department) {
          _push(`<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"><p class="mb-1 text-sm text-gray-600 dark:text-gray-400"> Служба/Отдел </p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(student.value.department)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div><div style="${ssrRenderStyle(activeTab.value === "courses" ? null : { display: "none" })}"><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><div class="flex items-center justify-between mb-6"><div><h2 class="text-xl font-bold text-black dark:text-white"> Курсы слушателя </h2><p class="text-sm text-gray-600 dark:text-gray-400"> Всего: ${ssrInterpolate(studentCourses.value.length)}</p></div></div>`);
        if (coursesLoading.value) {
          _push(`<div class="flex justify-center items-center py-12"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
        } else if (studentCourses.value.length > 0) {
          _push(`<div class="space-y-4">`);
          if (activeCourses.value.length > 0) {
            _push(`<div><h3 class="text-lg font-semibold text-black dark:text-white mb-3"> Активные курсы </h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><!--[-->`);
            ssrRenderList(activeCourses.value, (course) => {
              _push(`<div class="border border-gray-200 dark:border-strokedark rounded-xl p-4 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all cursor-pointer bg-linear-to-br from-primary/5 to-transparent"><div class="flex items-start justify-between gap-4 mb-3"><div class="flex-1"><h4 class="font-semibold text-black dark:text-white mb-1">${ssrInterpolate(course.course_name)}</h4><p class="text-sm text-gray-600 dark:text-gray-400"> Группа: ${ssrInterpolate(course.group_name)}</p></div><span class="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success"><span class="h-2 w-2 rounded-full bg-success"></span> Активен </span></div><div class="mb-3"><div class="flex justify-between items-center mb-1"><span class="text-xs text-gray-600 dark:text-gray-400">Прогресс</span><span class="text-xs font-medium text-primary">${ssrInterpolate(course.progress)}%</span></div><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"><div class="h-2 rounded-full bg-linear-to-r from-primary to-purple-500 transition-all duration-500" style="${ssrRenderStyle({ width: `${course.progress}%` })}"></div></div></div><div class="grid grid-cols-2 gap-3 text-sm"><div><span class="text-gray-500 dark:text-gray-400">Начало:</span><span class="ml-2 text-black dark:text-white">${ssrInterpolate(formatShortDate(course.start_date))}</span></div><div><span class="text-gray-500 dark:text-gray-400">Окончание:</span><span class="ml-2 text-black dark:text-white">${ssrInterpolate(formatShortDate(course.end_date))}</span></div><div><span class="text-gray-500 dark:text-gray-400">Занятий:</span><span class="ml-2 font-medium text-black dark:text-white">${ssrInterpolate(course.attended_lessons)}/${ssrInterpolate(course.total_lessons)}</span></div></div></div>`);
            });
            _push(`<!--]--></div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (completedCourses.value.length > 0) {
            _push(`<div class="mt-6"><h3 class="text-lg font-semibold text-black dark:text-white mb-3"> Завершенные курсы </h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><!--[-->`);
            ssrRenderList(completedCourses.value, (course) => {
              _push(`<div class="border border-gray-200 dark:border-strokedark rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all cursor-pointer bg-gray-50 dark:bg-gray-800/50"><div class="flex items-start justify-between gap-4 mb-3"><div class="flex-1"><h4 class="font-semibold text-black dark:text-white mb-1">${ssrInterpolate(course.course_name)}</h4><p class="text-sm text-gray-600 dark:text-gray-400"> Группа: ${ssrInterpolate(course.group_name)}</p></div><span class="inline-flex items-center gap-1.5 rounded-full bg-gray-200 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg> Завершен </span></div><div class="grid grid-cols-2 gap-3 text-sm"><div><span class="text-gray-500 dark:text-gray-400">Начало:</span><span class="ml-2 text-black dark:text-white">${ssrInterpolate(formatShortDate(course.start_date))}</span></div><div><span class="text-gray-500 dark:text-gray-400">Окончание:</span><span class="ml-2 text-black dark:text-white">${ssrInterpolate(formatShortDate(course.end_date))}</span></div><div><span class="text-gray-500 dark:text-gray-400">Посещаемость:</span><span class="ml-2 font-medium text-black dark:text-white">${ssrInterpolate(course.progress)}%</span></div></div></div>`);
            });
            _push(`<!--]--></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<div class="text-center py-12"><svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg><p class="text-gray-500 dark:text-gray-400 text-lg"> У студента пока нет курсов </p></div>`);
        }
        _push(`</div></div><div style="${ssrRenderStyle(activeTab.value === "certificates" ? null : { display: "none" })}"><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"><div class="flex items-center justify-between mb-6"><div><h2 class="text-xl font-bold text-black dark:text-white"> Сертификаты </h2><p class="text-sm text-gray-600 dark:text-gray-400"> Всего: ${ssrInterpolate(student.value.certificates.length)}</p></div>`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          onClick: openCertificatesModal,
          class: "flex items-center gap-2"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Управление сертификатами `);
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
                createTextVNode(" Управление сертификатами ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
        if (student.value.certificates.length > 0) {
          _push(`<div class="space-y-4"><!--[-->`);
          ssrRenderList(student.value.certificates, (certificate) => {
            _push(`<div class="border border-gray-200 dark:border-strokedark rounded-xl p-4 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all cursor-pointer relative"><div class="flex items-start justify-between gap-4"><div class="flex-1"><h3 class="font-semibold text-black dark:text-white mb-2">${ssrInterpolate(certificate.courseName)}</h3><div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"><div><span class="text-gray-500 dark:text-gray-400">Номер:</span><span class="ml-2 font-mono text-black dark:text-white">${ssrInterpolate(certificate.certificateNumber)}</span></div><div><span class="text-gray-500 dark:text-gray-400">Дата выдачи:</span><span class="ml-2 text-black dark:text-white">${ssrInterpolate(formatDate(certificate.issueDate))}</span></div>`);
            if (certificate.expiryDate) {
              _push(`<div><span class="text-gray-500 dark:text-gray-400">Срок действия:</span><span class="${ssrRenderClass([getExpiryStatusClass(certificate.expiryDate), "ml-2 font-medium"])}">${ssrInterpolate(formatDate(certificate.expiryDate))} `);
              if (getExpiryStatus(certificate.expiryDate) !== "valid") {
                _push(`<span class="${ssrRenderClass([getExpiryBadgeClass(certificate.expiryDate), "ml-1 text-xs px-1.5 py-0.5 rounded-full"])}">${ssrInterpolate(getExpiryLabel(certificate.expiryDate))}</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</span></div>`);
            } else {
              _push(`<div><span class="text-gray-500 dark:text-gray-400">Срок действия:</span><span class="ml-2 text-success font-medium">Бессрочный</span></div>`);
            }
            _push(`</div></div>`);
            if (certificate.fileUrl) {
              _push(`<div class="shrink-0">`);
              if (certificate.id) {
                _push(`<a${ssrRenderAttr("href", `/api/certificates/download/${certificate.id}`)} target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Скачать </a>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="text-center py-12"><svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><p class="text-gray-500 dark:text-gray-400 text-lg"> У студента пока нет сертификатов </p><p class="text-gray-400 dark:text-gray-500 text-sm mt-2"> Нажмите &quot;Управление сертификатами&quot; чтобы добавить </p></div>`);
        }
        _push(`</div></div></div><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      if (isEditModalOpen.value && student.value) {
        _push(ssrRenderComponent(_component_DatabaseStudentFormModal, {
          student: student.value,
          "is-open": isEditModalOpen.value,
          onClose: closeEditModal,
          onSubmit: handleUpdate
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (isCertificatesModalOpen.value && student.value) {
        _push(ssrRenderComponent(_component_DatabaseStudentCertificatesModal, {
          student: student.value,
          "is-open": isCertificatesModalOpen.value,
          onClose: closeCertificatesModal,
          onRefresh: fetchStudent
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (isCertificateDetailModalOpen.value && selectedCertificate.value) {
        _push(ssrRenderComponent(_component_DatabaseCertificateDetailModal, {
          certificate: selectedCertificate.value,
          "is-open": isCertificateDetailModalOpen.value,
          onClose: closeCertificateDetailModal
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (isCourseDetailModalOpen.value && selectedCourse.value) {
        _push(ssrRenderComponent(_component_DatabaseStudentCourseDetailModal, {
          course: selectedCourse.value,
          "is-open": isCourseDetailModalOpen.value,
          onClose: closeCourseDetailModal
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": isDeleteModalOpen.value,
        title: "Удаление студента",
        message: "Вы уверены, что хотите удалить этого студента?",
        "item-name": student.value?.fullName,
        warning: "Это действие нельзя отменить. Все данные студента будут удалены.",
        loading: isDeleting.value,
        onConfirm: confirmDelete,
        onCancel: closeDeleteModal
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/students/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-a_RstPo8.mjs.map
