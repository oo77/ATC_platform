import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_0$1 } from './Modal-DQYphXo7.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, createBlock, createTextVNode, openBlock, createVNode, unref, toDisplayString, reactive, watch, withModifiers, withDirectives, vModelText, vModelCheckbox, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderStyle, ssrRenderList, ssrRenderAttr, ssrRenderTeleport, ssrIncludeBooleanAttr, ssrLooseContain } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { c as useRoute, d as useRouter, u as useHead } from './server.mjs';
import { u as useNotification } from './useNotification-C2RwAN1X.mjs';
import { A as AVAILABLE_VARIABLES } from './useCertificateEditor-CXYGNl0s.mjs';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "TemplateEditModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    template: {}
  },
  emits: ["close", "updated"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const { success: showSuccess, error: showError } = useNotification();
    const form = reactive({
      name: "",
      description: "",
      isActive: true
    });
    const isSubmitting = ref(false);
    watch(() => props.template, (newTemplate) => {
      if (newTemplate) {
        form.name = newTemplate.name;
        form.description = newTemplate.description || "";
        form.isActive = newTemplate.isActive;
      }
    }, { immediate: true });
    const handleClose = () => {
      if (!isSubmitting.value) {
        emit("close");
      }
    };
    const handleSubmit = async () => {
      if (!props.template) return;
      isSubmitting.value = true;
      try {
        const response = await authFetch(
          `/api/certificates/templates/${props.template.id}`,
          {
            method: "PUT",
            body: {
              name: form.name.trim(),
              description: form.description.trim() || null,
              isActive: form.isActive
            }
          }
        );
        if (response.success) {
          showSuccess("Шаблон обновлён");
          emit("updated", response.template);
        }
      } catch (error) {
        console.error("Error updating template:", error);
        showError(error.data?.message || error.message || "Ошибка обновления");
      } finally {
        isSubmitting.value = false;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Редактирование шаблона",
        size: "sm",
        onClose: handleClose
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Название шаблона * </label><input${ssrRenderAttr("value", unref(form).name)} type="text" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" required${_scopeId}></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Описание </label><textarea rows="3" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"${_scopeId}>${ssrInterpolate(unref(form).description)}</textarea></div><div class="flex items-center gap-3"${_scopeId}><label class="relative inline-flex items-center cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).isActive) ? ssrLooseContain(unref(form).isActive, null) : unref(form).isActive) ? " checked" : ""} type="checkbox" class="sr-only peer"${_scopeId}><div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[&#39;&#39;] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"${_scopeId}></div></label><span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(unref(form).isActive ? "Активен" : "Неактивен")}</span></div><div class="flex justify-end gap-3 pt-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              type: "button",
              variant: "outline",
              onClick: handleClose,
              disabled: unref(isSubmitting)
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
              type: "submit",
              loading: unref(isSubmitting)
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
            _push2(`</div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(handleSubmit, ["prevent"]),
                class: "space-y-4"
              }, [
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, " Название шаблона * "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => unref(form).name = $event,
                    type: "text",
                    class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                    required: ""
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(form).name]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, " Описание "),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => unref(form).description = $event,
                    rows: "3",
                    class: "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(form).description]
                  ])
                ]),
                createVNode("div", { class: "flex items-center gap-3" }, [
                  createVNode("label", { class: "relative inline-flex items-center cursor-pointer" }, [
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => unref(form).isActive = $event,
                      type: "checkbox",
                      class: "sr-only peer"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelCheckbox, unref(form).isActive]
                    ]),
                    createVNode("div", { class: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" })
                  ]),
                  createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, toDisplayString(unref(form).isActive ? "Активен" : "Неактивен"), 1)
                ]),
                createVNode("div", { class: "flex justify-end gap-3 pt-4" }, [
                  createVNode(_component_UiButton, {
                    type: "button",
                    variant: "outline",
                    onClick: handleClose,
                    disabled: unref(isSubmitting)
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["disabled"]),
                  createVNode(_component_UiButton, {
                    type: "submit",
                    loading: unref(isSubmitting)
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Сохранить ")
                    ]),
                    _: 1
                  }, 8, ["loading"])
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
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/TemplateEditModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$1, { __name: "CertificatesTemplateEditModal" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const router = useRouter();
    const { authFetch } = useAuthFetch();
    const { success: showSuccess, error: showError } = useNotification();
    const loading = ref(true);
    const error = ref(null);
    const template = ref(null);
    const showEditModal = ref(false);
    const showDeleteConfirm = ref(false);
    const numberFormat = ref("ATC{YY}_{CODE}_{NUM}");
    const isSavingFormat = ref(false);
    const isTogglingActive = ref(false);
    const isDeleting = ref(false);
    const id = computed(() => route.params.id);
    const previewNumber = computed(() => {
      const now = /* @__PURE__ */ new Date();
      return numberFormat.value.replace("{YY}", now.getFullYear().toString().slice(-2)).replace("{YYYY}", now.getFullYear().toString()).replace("{CODE}", "SAMPLE").replace("{NUM}", "0001");
    });
    const previewContainerClass = computed(() => {
      const layout = template.value?.layout || template.value?.templateData?.layout;
      if (layout === "A4_portrait" || layout === "letter_portrait") {
        return "aspect-[1/1.414]";
      }
      return "aspect-[1.414/1]";
    });
    const previewWrapperStyle = computed(() => {
      if (!template.value?.templateData) return {};
      const data = template.value.templateData;
      const bg = data.background;
      const style = {
        width: "100%",
        maxWidth: "100%",
        aspectRatio: `${data.width} / ${data.height}`
      };
      if (bg?.type === "color") {
        style.background = bg.value;
      } else if (bg?.type === "image") {
        style.backgroundImage = `url(${bg.value})`;
        style.backgroundSize = "cover";
        style.backgroundPosition = "center";
      } else {
        style.background = "#fff";
      }
      return style;
    });
    useHead(() => ({
      title: template.value ? `${template.value.name} - Шаблоны сертификатов` : "Загрузка..."
    }));
    const loadTemplate = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await authFetch(`/api/certificates/templates/${id.value}`);
        if (response.success) {
          template.value = response.template;
          numberFormat.value = response.template.numberFormat || "ATC{YY}_{CODE}_{NUM}";
        } else {
          error.value = "Шаблон не найден";
        }
      } catch (e) {
        console.error("Error loading template:", e);
        error.value = e.message || "Ошибка загрузки шаблона";
      } finally {
        loading.value = false;
      }
    };
    const saveNumberFormat = async () => {
      isSavingFormat.value = true;
      try {
        await authFetch(`/api/certificates/templates/${id.value}`, {
          method: "PUT",
          body: { numberFormat: numberFormat.value }
        });
        showSuccess("Формат номера сохранён");
      } catch (e) {
        console.error("Save format error:", e);
        showError(e.data?.message || e.message || "Ошибка сохранения");
      } finally {
        isSavingFormat.value = false;
      }
    };
    const toggleActive = async () => {
      if (!template.value) return;
      isTogglingActive.value = true;
      try {
        const response = await authFetch(`/api/certificates/templates/${id.value}`, {
          method: "PUT",
          body: { isActive: !template.value.isActive }
        });
        if (response.success) {
          template.value = response.template;
          showSuccess(template.value.isActive ? "Шаблон активирован" : "Шаблон деактивирован");
        }
      } catch (e) {
        console.error("Toggle active error:", e);
        showError(e.data?.message || e.message || "Ошибка");
      } finally {
        isTogglingActive.value = false;
      }
    };
    const confirmDelete = () => {
      showDeleteConfirm.value = true;
    };
    const deleteTemplate = async () => {
      isDeleting.value = true;
      try {
        await authFetch(`/api/certificates/templates/${id.value}`, {
          method: "DELETE"
        });
        showSuccess("Шаблон удалён");
        router.push("/certificates/templates");
      } catch (e) {
        console.error("Delete error:", e);
        showError(e.data?.message || e.message || "Ошибка удаления");
        showDeleteConfirm.value = false;
      } finally {
        isDeleting.value = false;
      }
    };
    const handleUpdated = (updatedTemplate) => {
      template.value = updatedTemplate;
      showEditModal.value = false;
    };
    function formatDate(date) {
      return new Date(date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    function getLayoutLabel(layout) {
      const labels = {
        A4_landscape: "A4 альб.",
        A4_portrait: "A4 кн.",
        letter_landscape: "Letter альб.",
        letter_portrait: "Letter кн."
      };
      return labels[layout || ""] || "A4";
    }
    function getVariableLabel(key) {
      const variable = AVAILABLE_VARIABLES.find((v) => v.key === key);
      return variable?.label || key;
    }
    function getElementPreviewStyle(element) {
      const templateWidth = template.value?.templateData?.width || 1123;
      const templateHeight = template.value?.templateData?.height || 794;
      return {
        left: `${element.x / templateWidth * 100}%`,
        top: `${element.y / templateHeight * 100}%`,
        width: `${element.width / templateWidth * 100}%`,
        height: `${element.height / templateHeight * 100}%`,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : void 0
      };
    }
    function getTextPreviewStyle(element) {
      const templateWidth = template.value?.templateData?.width || 1123;
      const baseFontSize = element.fontSize / templateWidth * 100;
      return {
        fontFamily: element.fontFamily,
        fontSize: `clamp(6px, ${baseFontSize}vw, ${element.fontSize * 0.5}px)`,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        color: element.color,
        lineHeight: element.lineHeight,
        textAlign: element.textAlign,
        display: "flex",
        alignItems: "center",
        justifyContent: element.textAlign === "center" ? "center" : element.textAlign === "right" ? "flex-end" : "flex-start",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis"
      };
    }
    function getShapePreviewStyle(element) {
      const style = {};
      if (element.shapeType === "circle") {
        style.borderRadius = "50%";
      } else if (element.shapeType === "line") {
        style.height = `${element.strokeWidth || 2}px`;
        style.backgroundColor = element.strokeColor || "#000";
        return style;
      }
      if (element.fillColor && element.fillColor !== "transparent") {
        style.backgroundColor = element.fillColor;
      }
      if (element.strokeWidth && element.strokeColor) {
        style.border = `${element.strokeWidth}px solid ${element.strokeColor}`;
      }
      return style;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      const _component_CertificatesTemplateEditModal = __nuxt_component_2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/certificates/templates",
        class: "inline-flex items-center gap-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"${_scopeId}></path></svg> Назад к списку шаблонов `);
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
              createTextVNode(" Назад к списку шаблонов ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (unref(loading)) {
        _push(`<div class="flex justify-center items-center py-20"><div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (unref(error)) {
        _push(`<div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-8 text-center"><div class="mx-auto mb-4 h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center"><svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ошибка</h3><p class="text-gray-500 dark:text-gray-400 mb-4">${ssrInterpolate(unref(error))}</p>`);
        _push(ssrRenderComponent(_component_UiButton, { onClick: loadTemplate }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Попробовать снова`);
            } else {
              return [
                createTextVNode("Попробовать снова")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else if (unref(template)) {
        _push(`<!--[--><div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white">${ssrInterpolate(unref(template).name)}</h2>`);
        if (unref(template).description) {
          _push(`<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(template).description)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="flex items-center gap-3"><span class="${ssrRenderClass([
          "px-3 py-1 rounded-full text-sm font-medium",
          unref(template).isActive ? "bg-success/10 text-success" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
        ])}">${ssrInterpolate(unref(template).isActive ? "Активен" : "Неактивен")}</span>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/certificates/templates/${unref(template).id}/editor`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_UiButton, { variant: "primary" }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"${_scopeId2}></path></svg> Открыть редактор `);
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
                          d: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                        })
                      ])),
                      createTextVNode(" Открыть редактор ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              return [
                createVNode(_component_UiButton, { variant: "primary" }, {
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
                        d: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                      })
                    ])),
                    createTextVNode(" Открыть редактор ")
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "outline",
          onClick: ($event) => showEditModal.value = true
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path></svg> Настройки `);
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
                    d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  }),
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  })
                ])),
                createTextVNode(" Настройки ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div><div class="grid grid-cols-1 xl:grid-cols-2 gap-6"><div class="space-y-6"><div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4"> Предпросмотр шаблона </h3><div class="${ssrRenderClass([unref(previewContainerClass), "bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden"])}">`);
        if (!unref(template).templateData) {
          _push(`<div class="text-center p-8"><div class="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center"><svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg></div><h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2"> Шаблон не создан </h4><p class="text-sm text-gray-500 dark:text-gray-400 mb-4"> Откройте визуальный редактор, чтобы создать дизайн сертификата </p>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/certificates/templates/${unref(template).id}/editor`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_UiButton, null, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId2}></path></svg> Создать шаблон `);
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
                            d: "M12 4v16m8-8H4"
                          })
                        ])),
                        createTextVNode(" Создать шаблон ")
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
              } else {
                return [
                  createVNode(_component_UiButton, null, {
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
                          d: "M12 4v16m8-8H4"
                        })
                      ])),
                      createTextVNode(" Создать шаблон ")
                    ]),
                    _: 1
                  })
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div>`);
        } else {
          _push(`<div class="w-full h-full flex items-center justify-center p-4"><div class="bg-white shadow-lg rounded relative overflow-hidden" style="${ssrRenderStyle(unref(previewWrapperStyle))}"><!--[-->`);
          ssrRenderList(unref(template).templateData.elements, (element) => {
            _push(`<div class="absolute" style="${ssrRenderStyle(getElementPreviewStyle(element))}">`);
            if (element.type === "text") {
              _push(`<span style="${ssrRenderStyle(getTextPreviewStyle(element))}">${ssrInterpolate(element.content)}</span>`);
            } else if (element.type === "variable") {
              _push(`<span style="${ssrRenderStyle(getTextPreviewStyle(element))}" class="text-primary"> [${ssrInterpolate(getVariableLabel(element.variableKey))}] </span>`);
            } else if (element.type === "image") {
              _push(`<img${ssrRenderAttr("src", element.src)} class="w-full h-full object-contain">`);
            } else if (element.type === "qr") {
              _push(`<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs"> QR </div>`);
            } else if (element.type === "shape") {
              _push(`<div class="w-full h-full" style="${ssrRenderStyle(getShapePreviewStyle(element))}"></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></div>`);
        }
        _push(`</div>`);
        if (unref(template).templateData) {
          _push(`<div class="mt-4 grid grid-cols-3 gap-4 text-center"><div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"><p class="text-2xl font-bold text-primary">${ssrInterpolate(unref(template).templateData.elements?.length || 0)}</p><p class="text-xs text-gray-500">элементов</p></div><div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"><p class="text-lg font-bold text-gray-900 dark:text-white">${ssrInterpolate(getLayoutLabel(unref(template).layout))}</p><p class="text-xs text-gray-500">макет</p></div><div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"><p class="text-lg font-bold text-success">Готов</p><p class="text-xs text-gray-500">статус</p></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="space-y-6"><div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4"> Формат номера сертификата </h3><div class="space-y-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"> Шаблон номера </label><input${ssrRenderAttr("value", unref(numberFormat))} type="text" class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"></div><div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"><p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Пример:</p><code class="text-primary font-mono">${ssrInterpolate(unref(previewNumber))}</code></div><p class="text-xs text-gray-500"><code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{YY}</code> — год (25), <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{YYYY}</code> — год (2025), <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{CODE}</code> — код курса, <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{NUM}</code> — номер (0001) </p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          onClick: saveNumberFormat,
          loading: unref(isSavingFormat),
          variant: "outline",
          class: "w-full"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Сохранить формат `);
            } else {
              return [
                createTextVNode(" Сохранить формат ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div><div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4"> Статистика </h3><div class="space-y-4"><div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"><span class="text-gray-600 dark:text-gray-400">Последний номер</span><span class="font-mono font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(template).lastNumber || 0)}</span></div><div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"><span class="text-gray-600 dark:text-gray-400">Создан</span><span class="text-gray-900 dark:text-white">${ssrInterpolate(formatDate(unref(template).createdAt))}</span></div><div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"><span class="text-gray-600 dark:text-gray-400">Обновлён</span><span class="text-gray-900 dark:text-white">${ssrInterpolate(formatDate(unref(template).updatedAt))}</span></div></div></div><div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4"> Действия </h3><div class="space-y-3">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/certificates/templates/${unref(template).id}/editor`,
          class: "block"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_UiButton, {
                variant: "primary",
                class: "w-full"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"${_scopeId2}></path></svg> Редактировать шаблон `);
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
                      createTextVNode(" Редактировать шаблон ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              return [
                createVNode(_component_UiButton, {
                  variant: "primary",
                  class: "w-full"
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
                    createTextVNode(" Редактировать шаблон ")
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "outline",
          class: "w-full",
          onClick: toggleActive,
          loading: unref(isTogglingActive)
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}>`);
              if (unref(template).isActive) {
                _push2(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"${_scopeId}></path>`);
              } else {
                _push2(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path>`);
              }
              _push2(`</svg> ${ssrInterpolate(unref(template).isActive ? "Деактивировать" : "Активировать")}`);
            } else {
              return [
                (openBlock(), createBlock("svg", {
                  class: "w-4 h-4 mr-2",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  unref(template).isActive ? (openBlock(), createBlock("path", {
                    key: 0,
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  })) : (openBlock(), createBlock("path", {
                    key: 1,
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  }))
                ])),
                createTextVNode(" " + toDisplayString(unref(template).isActive ? "Деактивировать" : "Активировать"), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "danger",
          class: "w-full",
          onClick: confirmDelete
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg> Удалить шаблон `);
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
                    d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  })
                ])),
                createTextVNode(" Удалить шаблон ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div></div></div><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_CertificatesTemplateEditModal, {
        "is-open": unref(showEditModal),
        template: unref(template),
        onClose: ($event) => showEditModal.value = false,
        onUpdated: handleUpdated
      }, null, _parent));
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(showDeleteConfirm)) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center"><div class="absolute inset-0 bg-black/50"></div><div class="relative bg-white dark:bg-boxdark rounded-xl shadow-xl p-6 max-w-md w-full mx-4"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2"> Удалить шаблон? </h3><p class="text-gray-500 dark:text-gray-400 mb-6"> Вы уверены, что хотите удалить шаблон &quot;${ssrInterpolate(unref(template)?.name)}&quot;? Это действие нельзя отменить. </p><div class="flex gap-3 justify-end">`);
          _push2(ssrRenderComponent(_component_UiButton, {
            variant: "outline",
            onClick: ($event) => showDeleteConfirm.value = false
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
            variant: "danger",
            onClick: deleteTemplate,
            loading: unref(isDeleting)
          }, {
            default: withCtx((_, _push3, _parent2, _scopeId) => {
              if (_push3) {
                _push3(` Удалить `);
              } else {
                return [
                  createTextVNode(" Удалить ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push2(`</div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/certificates/templates/[id]/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-Djlv5bKx.mjs.map
