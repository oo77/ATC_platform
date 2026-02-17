import { _ as __nuxt_component_0 } from './Modal-DQYphXo7.mjs';
import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { defineComponent, mergeProps, withCtx, createTextVNode, createBlock, createCommentVNode, openBlock, createVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderClass, ssrInterpolate, ssrRenderAttr } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "CertificateDetailModal",
  __ssrInlineRender: true,
  props: {
    certificate: {},
    isOpen: { type: Boolean }
  },
  emits: ["close"],
  setup(__props) {
    function formatDate(date) {
      if (!date) return "—";
      return new Date(date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }
    function formatDateTime(date) {
      if (!date) return "—";
      return new Date(date).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        onClose: ($event) => _ctx.$emit("close"),
        title: `Сертификат ${__props.certificate?.certificateNumber || ""}`,
        size: "lg"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (__props.certificate) {
              _push2(`<div class="space-y-6"${_scopeId}><div class="${ssrRenderClass([
                __props.certificate.status === "issued" ? "bg-success/10" : "bg-danger/10",
                "flex items-center justify-between p-4 rounded-lg"
              ])}"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="${ssrRenderClass([
                "h-12 w-12 rounded-full flex items-center justify-center",
                __props.certificate.status === "issued" ? "bg-success/20" : "bg-danger/20"
              ])}"${_scopeId}>`);
              if (__props.certificate.status === "issued") {
                _push2(`<svg class="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg>`);
              } else {
                _push2(`<svg class="h-6 w-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg>`);
              }
              _push2(`</div><div${_scopeId}><p class="${ssrRenderClass([
                __props.certificate.status === "issued" ? "text-success" : "text-danger",
                "font-semibold text-lg"
              ])}"${_scopeId}>${ssrInterpolate(__props.certificate.status === "issued" ? "Сертификат выдан" : "Сертификат отозван")}</p><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(formatDate(__props.certificate.issueDate))}</p></div></div><span class="font-mono text-lg font-bold text-primary"${_scopeId}>${ssrInterpolate(__props.certificate.certificateNumber)}</span></div>`);
              if (__props.certificate.hasWarnings) {
                _push2(`<div class="p-4 bg-warning/10 border border-warning/20 rounded-lg"${_scopeId}><div class="flex items-center gap-2 mb-2"${_scopeId}><svg class="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><span class="font-medium text-warning"${_scopeId}>Выдан с предупреждениями</span></div><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}> Этот сертификат был выдан несмотря на несоответствие некоторым требованиям (например, недостаточная посещаемость или отсутствие оценок). </p></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.certificate.status === "revoked" && __props.certificate.revokeReason) {
                _push2(`<div class="p-4 bg-danger/10 border border-danger/20 rounded-lg"${_scopeId}><p class="font-medium text-danger mb-1"${_scopeId}>Причина отзыва:</p><p class="text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(__props.certificate.revokeReason)}</p><p class="text-sm text-gray-500 mt-2"${_scopeId}> Дата отзыва: ${ssrInterpolate(formatDate(__props.certificate.revokedAt))}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden"${_scopeId}><div class="bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark"${_scopeId}><h4 class="font-semibold text-black dark:text-white flex items-center gap-2"${_scopeId}><svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"${_scopeId}></path></svg> Слушатель </h4></div><div class="p-4 space-y-3"${_scopeId}><div class="grid grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>ФИО</p><p class="font-medium text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.student.fullName)}</p></div>`);
              if (__props.certificate.student.pinfl) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>ПИНФЛ</p><p class="font-mono text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.student.pinfl)}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.certificate.student.organization) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}> Организация </p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.student.organization)}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.certificate.student.position) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Должность</p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.student.position)}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div></div><div class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden"${_scopeId}><div class="bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark"${_scopeId}><div class="flex items-center justify-between"${_scopeId}><h4 class="font-semibold text-black dark:text-white flex items-center gap-2"${_scopeId}><svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"${_scopeId}></path></svg> Курс </h4>`);
              if (__props.certificate.sourceType === "import") {
                _push2(`<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-info/20 text-info"${_scopeId}> 📥 Импортирован </span>`);
              } else if (__props.certificate.sourceType === "manual") {
                _push2(`<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400"${_scopeId}> ✍️ Добавлен вручную </span>`);
              } else {
                _push2(`<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-success/20 text-success"${_scopeId}> 📋 Из журнала группы </span>`);
              }
              _push2(`</div></div><div class="p-4 space-y-3"${_scopeId}><div class="grid grid-cols-2 gap-4"${_scopeId}><div class="col-span-2"${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}> Название курса </p><p class="font-medium text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.course?.name || "Не указан")}</p></div>`);
              if (__props.certificate.course?.code) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Код курса</p><p class="font-mono text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.course.code)}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.certificate.course?.hours) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}> Количество часов </p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.course.hours)} ч. </p></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.certificate.group?.code) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Группа</p><p class="font-mono text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.group.code)}</p></div>`);
              } else if (__props.certificate.sourceType !== "group_journal") {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Группа</p><p class="text-gray-400 dark:text-gray-500 italic"${_scopeId}>Без группы</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.certificate.expiryDate) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}> Срок действия до </p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(formatDate(__props.certificate.expiryDate))}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div></div><div class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden"${_scopeId}><div class="bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark"${_scopeId}><h4 class="font-semibold text-black dark:text-white flex items-center gap-2"${_scopeId}><svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg> Информация о выдаче </h4></div><div class="p-4 space-y-3"${_scopeId}><div class="grid grid-cols-2 gap-4"${_scopeId}>`);
              if (__props.certificate.template) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Шаблон</p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.template.name)}</p></div>`);
              } else {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Шаблон</p><p class="text-gray-400 dark:text-gray-500 italic"${_scopeId}> Без шаблона (standalone) </p></div>`);
              }
              if (__props.certificate.issuedBy) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Выдал</p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.issuedBy.name)}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.certificate.issuedAt) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}> Дата и время выдачи </p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(formatDateTime(__props.certificate.issuedAt))}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Создано</p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(formatDateTime(__props.certificate.createdAt))}</p></div></div>`);
              if (__props.certificate.notes) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Примечания</p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.notes)}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div><div class="flex justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark"${_scopeId}>`);
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
              if (__props.certificate.id) {
                _push2(`<a${ssrRenderAttr("href", `/api/certificates/download/${__props.certificate.id}`)} target="_blank" class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-white font-medium hover:bg-primary/90 transition-colors"${_scopeId}><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg> Скачать PDF </a>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              __props.certificate ? (openBlock(), createBlock("div", {
                key: 0,
                class: "space-y-6"
              }, [
                createVNode("div", {
                  class: [
                    "flex items-center justify-between p-4 rounded-lg",
                    __props.certificate.status === "issued" ? "bg-success/10" : "bg-danger/10"
                  ]
                }, [
                  createVNode("div", { class: "flex items-center gap-3" }, [
                    createVNode("div", {
                      class: [
                        "h-12 w-12 rounded-full flex items-center justify-center",
                        __props.certificate.status === "issued" ? "bg-success/20" : "bg-danger/20"
                      ]
                    }, [
                      __props.certificate.status === "issued" ? (openBlock(), createBlock("svg", {
                        key: 0,
                        class: "h-6 w-6 text-success",
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
                      ])) : (openBlock(), createBlock("svg", {
                        key: 1,
                        class: "h-6 w-6 text-danger",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        })
                      ]))
                    ], 2),
                    createVNode("div", null, [
                      createVNode("p", {
                        class: [
                          "font-semibold text-lg",
                          __props.certificate.status === "issued" ? "text-success" : "text-danger"
                        ]
                      }, toDisplayString(__props.certificate.status === "issued" ? "Сертификат выдан" : "Сертификат отозван"), 3),
                      createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, toDisplayString(formatDate(__props.certificate.issueDate)), 1)
                    ])
                  ]),
                  createVNode("span", { class: "font-mono text-lg font-bold text-primary" }, toDisplayString(__props.certificate.certificateNumber), 1)
                ], 2),
                __props.certificate.hasWarnings ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "p-4 bg-warning/10 border border-warning/20 rounded-lg"
                }, [
                  createVNode("div", { class: "flex items-center gap-2 mb-2" }, [
                    (openBlock(), createBlock("svg", {
                      class: "h-5 w-5 text-warning",
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
                    createVNode("span", { class: "font-medium text-warning" }, "Выдан с предупреждениями")
                  ]),
                  createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, " Этот сертификат был выдан несмотря на несоответствие некоторым требованиям (например, недостаточная посещаемость или отсутствие оценок). ")
                ])) : createCommentVNode("", true),
                __props.certificate.status === "revoked" && __props.certificate.revokeReason ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "p-4 bg-danger/10 border border-danger/20 rounded-lg"
                }, [
                  createVNode("p", { class: "font-medium text-danger mb-1" }, "Причина отзыва:"),
                  createVNode("p", { class: "text-gray-600 dark:text-gray-400" }, toDisplayString(__props.certificate.revokeReason), 1),
                  createVNode("p", { class: "text-sm text-gray-500 mt-2" }, " Дата отзыва: " + toDisplayString(formatDate(__props.certificate.revokedAt)), 1)
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "border border-stroke dark:border-strokedark rounded-lg overflow-hidden" }, [
                  createVNode("div", { class: "bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark" }, [
                    createVNode("h4", { class: "font-semibold text-black dark:text-white flex items-center gap-2" }, [
                      (openBlock(), createBlock("svg", {
                        class: "h-5 w-5 text-primary",
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
                      ])),
                      createTextVNode(" Слушатель ")
                    ])
                  ]),
                  createVNode("div", { class: "p-4 space-y-3" }, [
                    createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                      createVNode("div", null, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "ФИО"),
                        createVNode("p", { class: "font-medium text-black dark:text-white" }, toDisplayString(__props.certificate.student.fullName), 1)
                      ]),
                      __props.certificate.student.pinfl ? (openBlock(), createBlock("div", { key: 0 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "ПИНФЛ"),
                        createVNode("p", { class: "font-mono text-black dark:text-white" }, toDisplayString(__props.certificate.student.pinfl), 1)
                      ])) : createCommentVNode("", true),
                      __props.certificate.student.organization ? (openBlock(), createBlock("div", { key: 1 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, " Организация "),
                        createVNode("p", { class: "text-black dark:text-white" }, toDisplayString(__props.certificate.student.organization), 1)
                      ])) : createCommentVNode("", true),
                      __props.certificate.student.position ? (openBlock(), createBlock("div", { key: 2 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Должность"),
                        createVNode("p", { class: "text-black dark:text-white" }, toDisplayString(__props.certificate.student.position), 1)
                      ])) : createCommentVNode("", true)
                    ])
                  ])
                ]),
                createVNode("div", { class: "border border-stroke dark:border-strokedark rounded-lg overflow-hidden" }, [
                  createVNode("div", { class: "bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark" }, [
                    createVNode("div", { class: "flex items-center justify-between" }, [
                      createVNode("h4", { class: "font-semibold text-black dark:text-white flex items-center gap-2" }, [
                        (openBlock(), createBlock("svg", {
                          class: "h-5 w-5 text-primary",
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
                        ])),
                        createTextVNode(" Курс ")
                      ]),
                      __props.certificate.sourceType === "import" ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-info/20 text-info"
                      }, " 📥 Импортирован ")) : __props.certificate.sourceType === "manual" ? (openBlock(), createBlock("span", {
                        key: 1,
                        class: "inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400"
                      }, " ✍️ Добавлен вручную ")) : (openBlock(), createBlock("span", {
                        key: 2,
                        class: "inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-success/20 text-success"
                      }, " 📋 Из журнала группы "))
                    ])
                  ]),
                  createVNode("div", { class: "p-4 space-y-3" }, [
                    createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                      createVNode("div", { class: "col-span-2" }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, " Название курса "),
                        createVNode("p", { class: "font-medium text-black dark:text-white" }, toDisplayString(__props.certificate.course?.name || "Не указан"), 1)
                      ]),
                      __props.certificate.course?.code ? (openBlock(), createBlock("div", { key: 0 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Код курса"),
                        createVNode("p", { class: "font-mono text-black dark:text-white" }, toDisplayString(__props.certificate.course.code), 1)
                      ])) : createCommentVNode("", true),
                      __props.certificate.course?.hours ? (openBlock(), createBlock("div", { key: 1 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, " Количество часов "),
                        createVNode("p", { class: "text-black dark:text-white" }, toDisplayString(__props.certificate.course.hours) + " ч. ", 1)
                      ])) : createCommentVNode("", true),
                      __props.certificate.group?.code ? (openBlock(), createBlock("div", { key: 2 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Группа"),
                        createVNode("p", { class: "font-mono text-black dark:text-white" }, toDisplayString(__props.certificate.group.code), 1)
                      ])) : __props.certificate.sourceType !== "group_journal" ? (openBlock(), createBlock("div", { key: 3 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Группа"),
                        createVNode("p", { class: "text-gray-400 dark:text-gray-500 italic" }, "Без группы")
                      ])) : createCommentVNode("", true),
                      __props.certificate.expiryDate ? (openBlock(), createBlock("div", { key: 4 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, " Срок действия до "),
                        createVNode("p", { class: "text-black dark:text-white" }, toDisplayString(formatDate(__props.certificate.expiryDate)), 1)
                      ])) : createCommentVNode("", true)
                    ])
                  ])
                ]),
                createVNode("div", { class: "border border-stroke dark:border-strokedark rounded-lg overflow-hidden" }, [
                  createVNode("div", { class: "bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark" }, [
                    createVNode("h4", { class: "font-semibold text-black dark:text-white flex items-center gap-2" }, [
                      (openBlock(), createBlock("svg", {
                        class: "h-5 w-5 text-primary",
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
                      createTextVNode(" Информация о выдаче ")
                    ])
                  ]),
                  createVNode("div", { class: "p-4 space-y-3" }, [
                    createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                      __props.certificate.template ? (openBlock(), createBlock("div", { key: 0 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Шаблон"),
                        createVNode("p", { class: "text-black dark:text-white" }, toDisplayString(__props.certificate.template.name), 1)
                      ])) : (openBlock(), createBlock("div", { key: 1 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Шаблон"),
                        createVNode("p", { class: "text-gray-400 dark:text-gray-500 italic" }, " Без шаблона (standalone) ")
                      ])),
                      __props.certificate.issuedBy ? (openBlock(), createBlock("div", { key: 2 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Выдал"),
                        createVNode("p", { class: "text-black dark:text-white" }, toDisplayString(__props.certificate.issuedBy.name), 1)
                      ])) : createCommentVNode("", true),
                      __props.certificate.issuedAt ? (openBlock(), createBlock("div", { key: 3 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, " Дата и время выдачи "),
                        createVNode("p", { class: "text-black dark:text-white" }, toDisplayString(formatDateTime(__props.certificate.issuedAt)), 1)
                      ])) : createCommentVNode("", true),
                      createVNode("div", null, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Создано"),
                        createVNode("p", { class: "text-black dark:text-white" }, toDisplayString(formatDateTime(__props.certificate.createdAt)), 1)
                      ])
                    ]),
                    __props.certificate.notes ? (openBlock(), createBlock("div", { key: 0 }, [
                      createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Примечания"),
                      createVNode("p", { class: "text-black dark:text-white" }, toDisplayString(__props.certificate.notes), 1)
                    ])) : createCommentVNode("", true)
                  ])
                ]),
                createVNode("div", { class: "flex justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark" }, [
                  createVNode(_component_UiButton, {
                    variant: "secondary",
                    onClick: ($event) => _ctx.$emit("close")
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Закрыть ")
                    ]),
                    _: 1
                  }, 8, ["onClick"]),
                  __props.certificate.id ? (openBlock(), createBlock("a", {
                    key: 0,
                    href: `/api/certificates/download/${__props.certificate.id}`,
                    target: "_blank",
                    class: "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-white font-medium hover:bg-primary/90 transition-colors"
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "h-5 w-5",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24"
                    }, [
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      })
                    ])),
                    createTextVNode(" Скачать PDF ")
                  ], 8, ["href"])) : createCommentVNode("", true)
                ])
              ])) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/CertificateDetailModal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main, { __name: "DatabaseCertificateDetailModal" });

export { __nuxt_component_2 as _ };
//# sourceMappingURL=CertificateDetailModal-D7vJflL2.mjs.map
