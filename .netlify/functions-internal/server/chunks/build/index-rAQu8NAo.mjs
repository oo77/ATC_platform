import { _ as __nuxt_component_0, a as __nuxt_component_2$2 } from './StudentManagementPanel-BjWLUTcU.mjs';
import { _ as __nuxt_component_1$2 } from './Button-DE8MjHjS.mjs';
import { defineComponent, ref, mergeProps, computed, withCtx, createBlock, createTextVNode, openBlock, createVNode, h, unref, toDisplayString, withDirectives, vModelText, watch, withModifiers, createCommentVNode, vModelCheckbox, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderStyle, ssrRenderComponent, ssrRenderAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { _ as __nuxt_component_0$2 } from './Modal-DQYphXo7.mjs';
import { _ as __nuxt_component_3$1 } from './ConfirmModal-GQ4JU241.mjs';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { u as useNotification } from './useNotification-C2RwAN1X.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-BHRIAP0y.mjs';
import { b as _sfc_main$1$1 } from './StudentCertificatesModal-B7TOFcV4.mjs';
import './server.mjs';
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

const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "OrganizationTable",
  __ssrInlineRender: true,
  props: {
    organizations: {},
    loading: { type: Boolean }
  },
  emits: ["edit", "delete", "view"],
  setup(__props, { emit: __emit }) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "overflow-x-auto" }, _attrs))}><table class="w-full table-auto"><thead><tr class="bg-gray-50 dark:bg-meta-4 text-left"><th class="py-4 px-4 font-medium text-black dark:text-white"> Название </th><th class="py-4 px-4 font-medium text-black dark:text-white"> Код </th><th class="py-4 px-4 font-medium text-black dark:text-white text-center"> Слушатели </th><th class="py-4 px-4 font-medium text-black dark:text-white"> Контакты </th><th class="py-4 px-4 font-medium text-black dark:text-white text-center"> Статус </th><th class="py-4 px-4 font-medium text-black dark:text-white text-center"> Действия </th></tr></thead><tbody>`);
      if (__props.loading) {
        _push(`<tr><td colspan="6" class="py-10 text-center"><div class="flex items-center justify-center gap-2"><svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span class="text-gray-500 dark:text-gray-400">Загрузка...</span></div></td></tr>`);
      } else if (__props.organizations.length === 0) {
        _push(`<tr><td colspan="6" class="py-10 text-center"><div class="flex flex-col items-center gap-3"><div class="h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div><p class="text-gray-500 dark:text-gray-400">Организации не найдены</p></div></td></tr>`);
      } else {
        _push(`<!--[-->`);
        ssrRenderList(__props.organizations, (organization) => {
          _push(`<tr class="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors cursor-pointer"><td class="py-4 px-4"><div class="flex flex-col"><span class="font-medium text-black dark:text-white">${ssrInterpolate(organization.name)}</span>`);
          if (organization.shortName) {
            _push(`<span class="text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(organization.shortName)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td><td class="py-4 px-4"><span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800 dark:bg-meta-4 dark:text-gray-300">${ssrInterpolate(organization.code)}</span></td><td class="py-4 px-4 text-center"><span class="${ssrRenderClass([organization.studentsCount > 0 ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500 dark:bg-meta-4 dark:text-gray-400", "inline-flex items-center justify-center min-w-10 px-2 py-1 rounded-full text-sm font-semibold"])}">${ssrInterpolate(organization.studentsCount)}</span></td><td class="py-4 px-4"><div class="flex flex-col gap-1 text-sm">`);
          if (organization.contactPhone) {
            _push(`<div class="flex items-center gap-2 text-gray-600 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> ${ssrInterpolate(organization.contactPhone)}</div>`);
          } else {
            _push(`<!---->`);
          }
          if (organization.contactEmail) {
            _push(`<div class="flex items-center gap-2 text-gray-600 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> ${ssrInterpolate(organization.contactEmail)}</div>`);
          } else {
            _push(`<!---->`);
          }
          if (!organization.contactPhone && !organization.contactEmail) {
            _push(`<span class="text-gray-400 dark:text-gray-500"> Не указаны </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td><td class="py-4 px-4 text-center"><span class="${ssrRenderClass([organization.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"])}">${ssrInterpolate(organization.isActive ? "Активна" : "Неактивна")}</span></td><td class="py-4 px-4"><div class="flex items-center justify-center gap-2"><button class="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 transition-all" title="Редактировать"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button><button class="${ssrRenderClass([{ "opacity-50 cursor-not-allowed": organization.studentsCount > 0 }, "p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"])}"${ssrIncludeBooleanAttr(organization.studentsCount > 0) ? " disabled" : ""}${ssrRenderAttr("title", organization.studentsCount > 0 ? "Нельзя удалить: есть слушатели" : "Удалить")}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></td></tr>`);
        });
        _push(`<!--]-->`);
      }
      _push(`</tbody></table></div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/organizations/OrganizationTable.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_1$1 = Object.assign(_sfc_main$6, { __name: "OrganizationsOrganizationTable" });
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "OrganizationFormModal",
  __ssrInlineRender: true,
  props: {
    organization: {},
    isOpen: { type: Boolean }
  },
  emits: ["close", "submit"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const isSubmitting = ref(false);
    const errors = ref({});
    const isEditMode = computed(() => !!props.organization);
    const form = ref({
      name: "",
      code: "",
      shortName: "",
      contactPhone: "",
      contactEmail: "",
      address: "",
      description: "",
      isActive: true
    });
    watch(() => props.isOpen, (newValue) => {
      if (newValue) {
        if (props.organization) {
          form.value = {
            name: props.organization.name,
            code: props.organization.code,
            shortName: props.organization.shortName || "",
            contactPhone: props.organization.contactPhone || "",
            contactEmail: props.organization.contactEmail || "",
            address: props.organization.address || "",
            description: props.organization.description || "",
            isActive: props.organization.isActive
          };
        } else {
          form.value = {
            name: "",
            code: "",
            shortName: "",
            contactPhone: "",
            contactEmail: "",
            address: "",
            description: "",
            isActive: true
          };
        }
        errors.value = {};
      }
    });
    const validate = () => {
      errors.value = {};
      if (!form.value.name.trim()) {
        errors.value.name = "Название обязательно";
      }
      if (form.value.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.contactEmail)) {
        errors.value.contactEmail = "Некорректный email";
      }
      return Object.keys(errors.value).length === 0;
    };
    const handleSubmit = async () => {
      if (!validate()) return;
      isSubmitting.value = true;
      try {
        const data = {
          name: form.value.name.trim(),
          isActive: form.value.isActive
        };
        if (form.value.code.trim()) {
          data.code = form.value.code.trim();
        }
        if (form.value.shortName.trim()) {
          data.shortName = form.value.shortName.trim();
        } else {
          data.shortName = null;
        }
        if (form.value.contactPhone.trim()) {
          data.contactPhone = form.value.contactPhone.trim();
        } else {
          data.contactPhone = null;
        }
        if (form.value.contactEmail.trim()) {
          data.contactEmail = form.value.contactEmail.trim();
        } else {
          data.contactEmail = null;
        }
        if (form.value.address.trim()) {
          data.address = form.value.address.trim();
        } else {
          data.address = null;
        }
        if (form.value.description.trim()) {
          data.description = form.value.description.trim();
        } else {
          data.description = null;
        }
        emit("submit", data);
      } finally {
        isSubmitting.value = false;
      }
    };
    const handleClose = () => {
      if (!isSubmitting.value) {
        emit("close");
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$2;
      const _component_UiButton = __nuxt_component_1$2;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        onClose: handleClose,
        size: "lg"
      }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h3 class="text-xl font-semibold text-black dark:text-white"${_scopeId}>${ssrInterpolate(isEditMode.value ? "Редактирование организации" : "Создание организации")}</h3>`);
          } else {
            return [
              createVNode("h3", { class: "text-xl font-semibold text-black dark:text-white" }, toDisplayString(isEditMode.value ? "Редактирование организации" : "Создание организации"), 1)
            ];
          }
        }),
        body: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-5"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Название <span class="text-red-500"${_scopeId}>*</span></label><input${ssrRenderAttr("value", form.value.name)} type="text" placeholder="Полное название организации" class="${ssrRenderClass([{ "border-red-500": errors.value.name }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"])}"${_scopeId}>`);
            if (errors.value.name) {
              _push2(`<p class="mt-1 text-sm text-red-500"${_scopeId}>${ssrInterpolate(errors.value.name)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Краткое название </label><input${ssrRenderAttr("value", form.value.shortName)} type="text" placeholder="Сокращённое название" class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Код </label><input${ssrRenderAttr("value", form.value.code)} type="text" placeholder="Уникальный код (генерируется автоматически)" class="${ssrRenderClass([{ "border-red-500": errors.value.code }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"])}"${_scopeId}>`);
            if (errors.value.code) {
              _push2(`<p class="mt-1 text-sm text-red-500"${_scopeId}>${ssrInterpolate(errors.value.code)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Контактный телефон </label><input${ssrRenderAttr("value", form.value.contactPhone)} type="tel" placeholder="+998 XX XXX XX XX" class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Email </label><input${ssrRenderAttr("value", form.value.contactEmail)} type="email" placeholder="email@example.com" class="${ssrRenderClass([{ "border-red-500": errors.value.contactEmail }, "w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"])}"${_scopeId}>`);
            if (errors.value.contactEmail) {
              _push2(`<p class="mt-1 text-sm text-red-500"${_scopeId}>${ssrInterpolate(errors.value.contactEmail)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Адрес </label><input${ssrRenderAttr("value", form.value.address)} type="text" placeholder="Полный адрес организации" class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Описание </label><textarea rows="3" placeholder="Дополнительная информация об организации" class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"${_scopeId}>${ssrInterpolate(form.value.description)}</textarea></div><div class="flex items-center gap-3"${_scopeId}><label class="relative inline-flex items-center cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(form.value.isActive) ? ssrLooseContain(form.value.isActive, null) : form.value.isActive) ? " checked" : ""} type="checkbox" class="sr-only peer"${_scopeId}><div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[&#39;&#39;] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"${_scopeId}></div></label><span class="text-sm font-medium text-gray-700 dark:text-gray-300"${_scopeId}> Активная организация </span></div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(handleSubmit, ["prevent"]),
                class: "space-y-5"
              }, [
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                    createTextVNode(" Название "),
                    createVNode("span", { class: "text-red-500" }, "*")
                  ]),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => form.value.name = $event,
                    type: "text",
                    placeholder: "Полное название организации",
                    class: ["w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary", { "border-red-500": errors.value.name }]
                  }, null, 10, ["onUpdate:modelValue"]), [
                    [vModelText, form.value.name]
                  ]),
                  errors.value.name ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-sm text-red-500"
                  }, toDisplayString(errors.value.name), 1)) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Краткое название "),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => form.value.shortName = $event,
                      type: "text",
                      placeholder: "Сокращённое название",
                      class: "w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelText, form.value.shortName]
                    ])
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Код "),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => form.value.code = $event,
                      type: "text",
                      placeholder: "Уникальный код (генерируется автоматически)",
                      class: ["w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary", { "border-red-500": errors.value.code }]
                    }, null, 10, ["onUpdate:modelValue"]), [
                      [vModelText, form.value.code]
                    ]),
                    errors.value.code ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-red-500"
                    }, toDisplayString(errors.value.code), 1)) : createCommentVNode("", true)
                  ])
                ]),
                createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-4" }, [
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Контактный телефон "),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => form.value.contactPhone = $event,
                      type: "tel",
                      placeholder: "+998 XX XXX XX XX",
                      class: "w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelText, form.value.contactPhone]
                    ])
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Email "),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => form.value.contactEmail = $event,
                      type: "email",
                      placeholder: "email@example.com",
                      class: ["w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary", { "border-red-500": errors.value.contactEmail }]
                    }, null, 10, ["onUpdate:modelValue"]), [
                      [vModelText, form.value.contactEmail]
                    ]),
                    errors.value.contactEmail ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-red-500"
                    }, toDisplayString(errors.value.contactEmail), 1)) : createCommentVNode("", true)
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Адрес "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => form.value.address = $event,
                    type: "text",
                    placeholder: "Полный адрес организации",
                    class: "w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, form.value.address]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Описание "),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => form.value.description = $event,
                    rows: "3",
                    placeholder: "Дополнительная информация об организации",
                    class: "w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, form.value.description]
                  ])
                ]),
                createVNode("div", { class: "flex items-center gap-3" }, [
                  createVNode("label", { class: "relative inline-flex items-center cursor-pointer" }, [
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => form.value.isActive = $event,
                      type: "checkbox",
                      class: "sr-only peer"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelCheckbox, form.value.isActive]
                    ]),
                    createVNode("div", { class: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" })
                  ]),
                  createVNode("span", { class: "text-sm font-medium text-gray-700 dark:text-gray-300" }, " Активная организация ")
                ])
              ], 32)
            ];
          }
        }),
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: handleClose,
              disabled: isSubmitting.value
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
              onClick: handleSubmit,
              loading: isSubmitting.value
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`${ssrInterpolate(isEditMode.value ? "Сохранить" : "Создать")}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(isEditMode.value ? "Сохранить" : "Создать"), 1)
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
                  onClick: handleClose,
                  disabled: isSubmitting.value
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Отмена ")
                  ]),
                  _: 1
                }, 8, ["disabled"]),
                createVNode(_component_UiButton, {
                  variant: "primary",
                  onClick: handleSubmit,
                  loading: isSubmitting.value
                }, {
                  default: withCtx(() => [
                    createTextVNode(toDisplayString(isEditMode.value ? "Сохранить" : "Создать"), 1)
                  ]),
                  _: 1
                }, 8, ["loading"])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/organizations/OrganizationFormModal.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$5, { __name: "OrganizationsOrganizationFormModal" });
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "OrganizationDetailModal",
  __ssrInlineRender: true,
  props: {
    organization: {},
    isOpen: { type: Boolean }
  },
  emits: ["close", "edit"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const handleClose = () => {
      emit("close");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$2;
      const _component_UiButton = __nuxt_component_1$2;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        onClose: handleClose,
        size: "lg"
      }, _attrs), {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex items-center gap-3"${_scopeId}><div class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"${_scopeId}><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"${_scopeId}></path></svg></div><div${_scopeId}><h3 class="text-xl font-semibold text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.organization?.name)}</h3><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}> Код: ${ssrInterpolate(__props.organization?.code)}</p></div></div>`);
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
                      d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    })
                  ]))
                ]),
                createVNode("div", null, [
                  createVNode("h3", { class: "text-xl font-semibold text-black dark:text-white" }, toDisplayString(__props.organization?.name), 1),
                  createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, " Код: " + toDisplayString(__props.organization?.code), 1)
                ])
              ])
            ];
          }
        }),
        body: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (__props.organization) {
              _push2(`<div class="space-y-6"${_scopeId}><div class="flex items-center gap-2"${_scopeId}><span class="${ssrRenderClass([__props.organization.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"])}"${_scopeId}>${ssrInterpolate(__props.organization.isActive ? "Активна" : "Неактивна")}</span><span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"${_scopeId}>${ssrInterpolate(__props.organization.studentsCount)} слушателей </span></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6"${_scopeId}>`);
              if (__props.organization.shortName) {
                _push2(`<div${_scopeId}><h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"${_scopeId}> Краткое название </h4><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.organization.shortName)}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div${_scopeId}><h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"${_scopeId}> Контактный телефон </h4><p class="text-black dark:text-white flex items-center gap-2"${_scopeId}><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"${_scopeId}></path></svg> ${ssrInterpolate(__props.organization.contactPhone || "Не указан")}</p></div><div${_scopeId}><h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"${_scopeId}> Email </h4><p class="text-black dark:text-white flex items-center gap-2"${_scopeId}><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"${_scopeId}></path></svg> ${ssrInterpolate(__props.organization.contactEmail || "Не указан")}</p></div>`);
              if (__props.organization.address) {
                _push2(`<div class="md:col-span-2"${_scopeId}><h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"${_scopeId}> Адрес </h4><p class="text-black dark:text-white flex items-start gap-2"${_scopeId}><svg class="w-4 h-4 text-gray-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path></svg> ${ssrInterpolate(__props.organization.address)}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
              if (__props.organization.description) {
                _push2(`<div${_scopeId}><h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"${_scopeId}> Описание </h4><div class="bg-gray-50 dark:bg-meta-4 rounded-lg p-4"${_scopeId}><p class="text-black dark:text-white whitespace-pre-wrap"${_scopeId}>${ssrInterpolate(__props.organization.description)}</p></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div class="border-t border-stroke dark:border-strokedark pt-4"${_scopeId}><div class="grid grid-cols-2 gap-4 text-sm"${_scopeId}><div${_scopeId}><span class="text-gray-500 dark:text-gray-400"${_scopeId}>Создана:</span><span class="ml-2 text-black dark:text-white"${_scopeId}>${ssrInterpolate(formatDate(__props.organization.createdAt))}</span></div><div${_scopeId}><span class="text-gray-500 dark:text-gray-400"${_scopeId}>Обновлена:</span><span class="ml-2 text-black dark:text-white"${_scopeId}>${ssrInterpolate(formatDate(__props.organization.updatedAt))}</span></div></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              __props.organization ? (openBlock(), createBlock("div", {
                key: 0,
                class: "space-y-6"
              }, [
                createVNode("div", { class: "flex items-center gap-2" }, [
                  createVNode("span", {
                    class: ["inline-flex items-center px-3 py-1 rounded-full text-sm font-medium", __props.organization.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"]
                  }, toDisplayString(__props.organization.isActive ? "Активна" : "Неактивна"), 3),
                  createVNode("span", { class: "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary" }, toDisplayString(__props.organization.studentsCount) + " слушателей ", 1)
                ]),
                createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-6" }, [
                  __props.organization.shortName ? (openBlock(), createBlock("div", { key: 0 }, [
                    createVNode("h4", { class: "text-sm font-medium text-gray-500 dark:text-gray-400 mb-1" }, " Краткое название "),
                    createVNode("p", { class: "text-black dark:text-white" }, toDisplayString(__props.organization.shortName), 1)
                  ])) : createCommentVNode("", true),
                  createVNode("div", null, [
                    createVNode("h4", { class: "text-sm font-medium text-gray-500 dark:text-gray-400 mb-1" }, " Контактный телефон "),
                    createVNode("p", { class: "text-black dark:text-white flex items-center gap-2" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 text-gray-400",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        })
                      ])),
                      createTextVNode(" " + toDisplayString(__props.organization.contactPhone || "Не указан"), 1)
                    ])
                  ]),
                  createVNode("div", null, [
                    createVNode("h4", { class: "text-sm font-medium text-gray-500 dark:text-gray-400 mb-1" }, " Email "),
                    createVNode("p", { class: "text-black dark:text-white flex items-center gap-2" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 text-gray-400",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        })
                      ])),
                      createTextVNode(" " + toDisplayString(__props.organization.contactEmail || "Не указан"), 1)
                    ])
                  ]),
                  __props.organization.address ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "md:col-span-2"
                  }, [
                    createVNode("h4", { class: "text-sm font-medium text-gray-500 dark:text-gray-400 mb-1" }, " Адрес "),
                    createVNode("p", { class: "text-black dark:text-white flex items-start gap-2" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 text-gray-400 mt-1 shrink-0",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        }),
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        })
                      ])),
                      createTextVNode(" " + toDisplayString(__props.organization.address), 1)
                    ])
                  ])) : createCommentVNode("", true)
                ]),
                __props.organization.description ? (openBlock(), createBlock("div", { key: 0 }, [
                  createVNode("h4", { class: "text-sm font-medium text-gray-500 dark:text-gray-400 mb-2" }, " Описание "),
                  createVNode("div", { class: "bg-gray-50 dark:bg-meta-4 rounded-lg p-4" }, [
                    createVNode("p", { class: "text-black dark:text-white whitespace-pre-wrap" }, toDisplayString(__props.organization.description), 1)
                  ])
                ])) : createCommentVNode("", true),
                createVNode("div", { class: "border-t border-stroke dark:border-strokedark pt-4" }, [
                  createVNode("div", { class: "grid grid-cols-2 gap-4 text-sm" }, [
                    createVNode("div", null, [
                      createVNode("span", { class: "text-gray-500 dark:text-gray-400" }, "Создана:"),
                      createVNode("span", { class: "ml-2 text-black dark:text-white" }, toDisplayString(formatDate(__props.organization.createdAt)), 1)
                    ]),
                    createVNode("div", null, [
                      createVNode("span", { class: "text-gray-500 dark:text-gray-400" }, "Обновлена:"),
                      createVNode("span", { class: "ml-2 text-black dark:text-white" }, toDisplayString(formatDate(__props.organization.updatedAt)), 1)
                    ])
                  ])
                ])
              ])) : createCommentVNode("", true)
            ];
          }
        }),
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-between w-full"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: ($event) => emit("edit")
            }, {
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
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "primary",
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
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-between w-full" }, [
                createVNode(_component_UiButton, {
                  variant: "outline",
                  onClick: ($event) => emit("edit")
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
                }, 8, ["onClick"]),
                createVNode(_component_UiButton, {
                  variant: "primary",
                  onClick: handleClose
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Закрыть ")
                  ]),
                  _: 1
                })
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/organizations/OrganizationDetailModal.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_4 = Object.assign(_sfc_main$4, { __name: "OrganizationsOrganizationDetailModal" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "OrganizationManagementPanel",
  __ssrInlineRender: true,
  setup(__props) {
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const organizations = ref([]);
    const loading = ref(false);
    const isFormModalOpen = ref(false);
    const isDetailModalOpen = ref(false);
    const isDeleteModalOpen = ref(false);
    const isDeleting = ref(false);
    const selectedOrganization = ref(null);
    const deleteOrganization = ref(null);
    const pagination = ref({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    });
    const filters = ref({
      search: "",
      isActive: ""
    });
    const hasActiveFilters = computed(() => {
      return filters.value.search !== "" || filters.value.isActive !== "";
    });
    const handlePageChange = (page) => {
      pagination.value.page = page;
      fetchOrganizations();
    };
    const handleLimitChange = (limit) => {
      pagination.value.limit = limit;
      pagination.value.page = 1;
      fetchOrganizations();
    };
    const fetchOrganizations = async () => {
      loading.value = true;
      try {
        const params = new URLSearchParams();
        params.append("page", pagination.value.page.toString());
        params.append("limit", pagination.value.limit.toString());
        if (filters.value.search) {
          params.append("search", filters.value.search);
        }
        if (filters.value.isActive !== "") {
          params.append("isActive", filters.value.isActive);
        }
        const response = await authFetch(
          `/api/organizations?${params.toString()}`,
          { method: "GET" }
        );
        if (response.success) {
          organizations.value = response.data;
          pagination.value.total = response.total;
          pagination.value.totalPages = response.totalPages;
          pagination.value.page = response.page;
          pagination.value.limit = response.limit;
        }
      } catch (error) {
        console.error("Ошибка загрузки организаций:", error);
        notification.error("Не удалось загрузить список организаций", "Ошибка");
      } finally {
        loading.value = false;
      }
    };
    const openCreateModal = () => {
      selectedOrganization.value = null;
      isFormModalOpen.value = true;
    };
    const openEditModal = (organization) => {
      selectedOrganization.value = organization;
      isFormModalOpen.value = true;
    };
    const openEditModalFromDetail = () => {
      isDetailModalOpen.value = false;
      isFormModalOpen.value = true;
    };
    const closeFormModal = () => {
      isFormModalOpen.value = false;
      selectedOrganization.value = null;
    };
    const openDetailModal = (organization) => {
      selectedOrganization.value = organization;
      isDetailModalOpen.value = true;
    };
    const closeDetailModal = () => {
      isDetailModalOpen.value = false;
      selectedOrganization.value = null;
    };
    const openDeleteModal = (organizationId) => {
      const organization = organizations.value.find((o) => o.id === organizationId);
      if (organization) {
        deleteOrganization.value = organization;
        isDeleteModalOpen.value = true;
      }
    };
    const closeDeleteModal = () => {
      if (!isDeleting.value) {
        isDeleteModalOpen.value = false;
        deleteOrganization.value = null;
      }
    };
    const confirmDelete = async () => {
      if (!deleteOrganization.value) return;
      isDeleting.value = true;
      try {
        const response = await authFetch(
          `/api/organizations/${deleteOrganization.value.id}`,
          { method: "DELETE" }
        );
        if (response.success) {
          notification.success("Организация успешно удалена", "Успех");
          await fetchOrganizations();
          closeDeleteModal();
        }
      } catch (error) {
        console.error("Ошибка удаления организации:", error);
        const message = error.data?.statusMessage || "Не удалось удалить организацию";
        notification.error(message, "Ошибка");
      } finally {
        isDeleting.value = false;
      }
    };
    const handleSubmit = async (data) => {
      try {
        if (selectedOrganization.value) {
          const response = await authFetch(
            `/api/organizations/${selectedOrganization.value.id}`,
            {
              method: "PUT",
              body: data
            }
          );
          if (response.success) {
            const index = organizations.value.findIndex((o) => o.id === selectedOrganization.value.id);
            if (index !== -1) {
              organizations.value[index] = response.data;
            }
            notification.success("Организация успешно обновлена", "Успех");
            closeFormModal();
          }
        } else {
          const response = await authFetch(
            "/api/organizations",
            {
              method: "POST",
              body: data
            }
          );
          if (response.success) {
            await fetchOrganizations();
            notification.success("Организация успешно создана", "Успех");
            closeFormModal();
          }
        }
      } catch (error) {
        console.error("Ошибка сохранения организации:", error);
        const message = error.data?.statusMessage || "Не удалось сохранить организацию";
        notification.error(message, "Ошибка");
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$2;
      const _component_OrganizationsOrganizationTable = __nuxt_component_1$1;
      const _component_UiPagination = __nuxt_component_2$2;
      const _component_OrganizationsOrganizationFormModal = __nuxt_component_3;
      const _component_OrganizationsOrganizationDetailModal = __nuxt_component_4;
      const _component_UiConfirmModal = __nuxt_component_3$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 class="text-xl font-semibold text-black dark:text-white"> Управление организациями </h3><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Всего организаций: ${ssrInterpolate(pagination.value.total)} `);
      if (hasActiveFilters.value) {
        _push(`<span class="text-primary"> (отфильтровано) </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</p></div><div class="flex flex-wrap items-center gap-3">`);
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "primary",
        onClick: openCreateModal,
        class: "flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Добавить организацию `);
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
              createTextVNode(" Добавить организацию ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><div class="flex items-center gap-3 mb-4"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg></div><h4 class="text-lg font-semibold text-black dark:text-white">Фильтры</h4>`);
      if (hasActiveFilters.value) {
        _push(`<button class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Сбросить фильтры </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Поиск </label><div class="relative"><input${ssrRenderAttr("value", filters.value.search)} type="text" placeholder="Название, код..." class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Статус </label><select class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.value.isActive) ? ssrLooseContain(filters.value.isActive, "") : ssrLooseEqual(filters.value.isActive, "")) ? " selected" : ""}>Все</option><option value="true"${ssrIncludeBooleanAttr(Array.isArray(filters.value.isActive) ? ssrLooseContain(filters.value.isActive, "true") : ssrLooseEqual(filters.value.isActive, "true")) ? " selected" : ""}>Активные</option><option value="false"${ssrIncludeBooleanAttr(Array.isArray(filters.value.isActive) ? ssrLooseContain(filters.value.isActive, "false") : ssrLooseEqual(filters.value.isActive, "false")) ? " selected" : ""}>Неактивные</option></select></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md overflow-hidden">`);
      _push(ssrRenderComponent(_component_OrganizationsOrganizationTable, {
        organizations: organizations.value,
        loading: loading.value,
        onEdit: openEditModal,
        onDelete: openDeleteModal,
        onView: openDetailModal
      }, null, _parent));
      if (pagination.value.totalPages > 0) {
        _push(ssrRenderComponent(_component_UiPagination, {
          "current-page": pagination.value.page,
          "total-pages": pagination.value.totalPages,
          total: pagination.value.total,
          limit: pagination.value.limit,
          loading: loading.value,
          "onUpdate:page": handlePageChange,
          "onUpdate:limit": handleLimitChange
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (isFormModalOpen.value) {
        _push(ssrRenderComponent(_component_OrganizationsOrganizationFormModal, {
          organization: selectedOrganization.value,
          "is-open": isFormModalOpen.value,
          onClose: closeFormModal,
          onSubmit: handleSubmit
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (isDetailModalOpen.value) {
        _push(ssrRenderComponent(_component_OrganizationsOrganizationDetailModal, {
          organization: selectedOrganization.value,
          "is-open": isDetailModalOpen.value,
          onClose: closeDetailModal,
          onEdit: openEditModalFromDetail
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": isDeleteModalOpen.value,
        title: "Удаление организации",
        message: "Вы уверены, что хотите удалить эту организацию?",
        "item-name": deleteOrganization.value?.name,
        warning: "Это действие нельзя отменить. Организация будет удалена.",
        loading: isDeleting.value,
        onConfirm: confirmDelete,
        onCancel: closeDeleteModal
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/organizations/OrganizationManagementPanel.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$3, { __name: "OrganizationsOrganizationManagementPanel" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
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
      const _component_UiModal = __nuxt_component_0$2;
      const _component_UiButton = __nuxt_component_1$2;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        onClose: ($event) => _ctx.$emit("close"),
        title: `Сертификат ${__props.certificate?.certificateNumber || ""}`,
        size: "lg"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (__props.certificate) {
              _push2(`<div class="space-y-6"${_scopeId}><div class="${ssrRenderClass([__props.certificate.status === "issued" ? "bg-success/10" : "bg-danger/10", "flex items-center justify-between p-4 rounded-lg"])}"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="${ssrRenderClass([
                "h-12 w-12 rounded-full flex items-center justify-center",
                __props.certificate.status === "issued" ? "bg-success/20" : "bg-danger/20"
              ])}"${_scopeId}>`);
              if (__props.certificate.status === "issued") {
                _push2(`<svg class="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg>`);
              } else {
                _push2(`<svg class="h-6 w-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg>`);
              }
              _push2(`</div><div${_scopeId}><p class="${ssrRenderClass([__props.certificate.status === "issued" ? "text-success" : "text-danger", "font-semibold text-lg"])}"${_scopeId}>${ssrInterpolate(__props.certificate.status === "issued" ? "Сертификат выдан" : "Сертификат отозван")}</p><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(formatDate(__props.certificate.issueDate))}</p></div></div><span class="font-mono text-lg font-bold text-primary"${_scopeId}>${ssrInterpolate(__props.certificate.certificateNumber)}</span></div>`);
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
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Организация</p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.student.organization)}</p></div>`);
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
              _push2(`</div></div><div class="p-4 space-y-3"${_scopeId}><div class="grid grid-cols-2 gap-4"${_scopeId}><div class="col-span-2"${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Название курса</p><p class="font-medium text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.course?.name || "Не указан")}</p></div>`);
              if (__props.certificate.course?.code) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Код курса</p><p class="font-mono text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.course.code)}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.certificate.course?.hours) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Количество часов</p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.course.hours)} ч.</p></div>`);
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
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Срок действия до</p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(formatDate(__props.certificate.expiryDate))}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div></div><div class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden"${_scopeId}><div class="bg-gray-50 dark:bg-meta-4 px-4 py-3 border-b border-stroke dark:border-strokedark"${_scopeId}><h4 class="font-semibold text-black dark:text-white flex items-center gap-2"${_scopeId}><svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg> Информация о выдаче </h4></div><div class="p-4 space-y-3"${_scopeId}><div class="grid grid-cols-2 gap-4"${_scopeId}>`);
              if (__props.certificate.template) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Шаблон</p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.template.name)}</p></div>`);
              } else {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Шаблон</p><p class="text-gray-400 dark:text-gray-500 italic"${_scopeId}>Без шаблона (standalone)</p></div>`);
              }
              if (__props.certificate.issuedBy) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Выдал</p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(__props.certificate.issuedBy.name)}</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.certificate.issuedAt) {
                _push2(`<div${_scopeId}><p class="text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Дата и время выдачи</p><p class="text-black dark:text-white"${_scopeId}>${ssrInterpolate(formatDateTime(__props.certificate.issuedAt))}</p></div>`);
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
              if (__props.certificate.pdfFileUrl) {
                _push2(`<a${ssrRenderAttr("href", __props.certificate.pdfFileUrl)} target="_blank" class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-white font-medium hover:bg-primary/90 transition-colors"${_scopeId}><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg> Скачать PDF </a>`);
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
                  class: ["flex items-center justify-between p-4 rounded-lg", __props.certificate.status === "issued" ? "bg-success/10" : "bg-danger/10"]
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
                        class: ["font-semibold text-lg", __props.certificate.status === "issued" ? "text-success" : "text-danger"]
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
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Организация"),
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
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Название курса"),
                        createVNode("p", { class: "font-medium text-black dark:text-white" }, toDisplayString(__props.certificate.course?.name || "Не указан"), 1)
                      ]),
                      __props.certificate.course?.code ? (openBlock(), createBlock("div", { key: 0 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Код курса"),
                        createVNode("p", { class: "font-mono text-black dark:text-white" }, toDisplayString(__props.certificate.course.code), 1)
                      ])) : createCommentVNode("", true),
                      __props.certificate.course?.hours ? (openBlock(), createBlock("div", { key: 1 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Количество часов"),
                        createVNode("p", { class: "text-black dark:text-white" }, toDisplayString(__props.certificate.course.hours) + " ч.", 1)
                      ])) : createCommentVNode("", true),
                      __props.certificate.group?.code ? (openBlock(), createBlock("div", { key: 2 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Группа"),
                        createVNode("p", { class: "font-mono text-black dark:text-white" }, toDisplayString(__props.certificate.group.code), 1)
                      ])) : __props.certificate.sourceType !== "group_journal" ? (openBlock(), createBlock("div", { key: 3 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Группа"),
                        createVNode("p", { class: "text-gray-400 dark:text-gray-500 italic" }, "Без группы")
                      ])) : createCommentVNode("", true),
                      __props.certificate.expiryDate ? (openBlock(), createBlock("div", { key: 4 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Срок действия до"),
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
                        createVNode("p", { class: "text-gray-400 dark:text-gray-500 italic" }, "Без шаблона (standalone)")
                      ])),
                      __props.certificate.issuedBy ? (openBlock(), createBlock("div", { key: 2 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Выдал"),
                        createVNode("p", { class: "text-black dark:text-white" }, toDisplayString(__props.certificate.issuedBy.name), 1)
                      ])) : createCommentVNode("", true),
                      __props.certificate.issuedAt ? (openBlock(), createBlock("div", { key: 3 }, [
                        createVNode("p", { class: "text-sm text-gray-500 dark:text-gray-400" }, "Дата и время выдачи"),
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
                  __props.certificate.pdfFileUrl ? (openBlock(), createBlock("a", {
                    key: 0,
                    href: __props.certificate.pdfFileUrl,
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
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/CertificateDetailModal.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_2$1 = Object.assign(_sfc_main$2, { __name: "DatabaseCertificateDetailModal" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "CertificateManagementPanel",
  __ssrInlineRender: true,
  setup(__props) {
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const SortIcon = defineComponent({
      props: {
        active: Boolean,
        order: String
      },
      setup(props) {
        return () => h("svg", {
          class: ["h-4 w-4 transition-colors", props.active ? "text-primary" : "text-gray-400"],
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        }, [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: props.active && props.order === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"
          })
        ]);
      }
    });
    const data = ref([]);
    const loading = ref(false);
    const pagination = ref({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    });
    const stats = ref({
      total: 0,
      issued: 0,
      revoked: 0,
      organizations: 0,
      groups: 0
    });
    const filters = ref({
      search: "",
      status: "all",
      sourceType: "all",
      organizationName: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "issue_date",
      sortOrder: "desc"
    });
    const selectedCertificate = ref(null);
    const isDetailModalOpen = ref(false);
    const isRevokeModalOpen = ref(false);
    const revokeTarget = ref(null);
    const revokeReason = ref("");
    const isManualFormModalOpen = ref(false);
    const isRevoking = ref(false);
    const hasActiveFilters = computed(() => {
      return !!(filters.value.search || filters.value.status !== "all" || filters.value.sourceType !== "all" || filters.value.organizationName || filters.value.dateFrom || filters.value.dateTo);
    });
    async function loadData() {
      loading.value = true;
      try {
        const params = new URLSearchParams({
          page: String(pagination.value.page),
          limit: String(pagination.value.limit),
          sortBy: filters.value.sortBy,
          sortOrder: filters.value.sortOrder
        });
        if (filters.value.search) params.append("search", filters.value.search);
        if (filters.value.status !== "all") params.append("status", filters.value.status);
        if (filters.value.sourceType !== "all") params.append("sourceType", filters.value.sourceType);
        if (filters.value.organizationName) params.append("organizationName", filters.value.organizationName);
        if (filters.value.dateFrom) params.append("dateFrom", filters.value.dateFrom);
        if (filters.value.dateTo) params.append("dateTo", filters.value.dateTo);
        const response = await authFetch(`/api/certificates?${params.toString()}`);
        if (response.success) {
          data.value = response.data.items;
          pagination.value = response.data.pagination;
          stats.value = response.data.stats;
        }
      } catch (error) {
        console.error("Error loading certificates:", error);
        notification.error("Ошибка загрузки", error.message || "Не удалось загрузить сертификаты");
      } finally {
        loading.value = false;
      }
    }
    function formatDate(date) {
      return new Date(date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }
    function closeDetailModal() {
      isDetailModalOpen.value = false;
      selectedCertificate.value = null;
    }
    function closeRevokeModal() {
      isRevokeModalOpen.value = false;
      revokeTarget.value = null;
      revokeReason.value = "";
    }
    async function confirmRevoke() {
      if (!revokeTarget.value || !revokeReason.value.trim()) return;
      isRevoking.value = true;
      try {
        const response = await authFetch(`/api/certificates/${revokeTarget.value.id}/revoke`, {
          method: "PATCH",
          body: { reason: revokeReason.value.trim() }
        });
        if (response.success) {
          notification.success("Сертификат отозван", `Сертификат ${revokeTarget.value.certificateNumber} успешно отозван`);
          closeRevokeModal();
          loadData();
        } else {
          notification.error("Ошибка", response.message || "Не удалось отозвать сертификат");
        }
      } catch (error) {
        console.error("Error revoking certificate:", error);
        notification.error("Ошибка", error.message || "Не удалось отозвать сертификат");
      } finally {
        isRevoking.value = false;
      }
    }
    async function exportToExcel() {
      notification.info("В разработке", "Функция экспорта будет доступна в следующей версии");
    }
    function openManualFormModal() {
      isManualFormModalOpen.value = true;
    }
    function closeManualFormModal() {
      isManualFormModalOpen.value = false;
    }
    function handleCertificateCreated(certificate) {
      notification.success("Сертификат создан", `Сертификат ${certificate.certificateNumber} успешно добавлен`);
      loadData();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1$2;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_DatabaseCertificateDetailModal = __nuxt_component_2$1;
      const _component_UiModal = __nuxt_component_0$2;
      const _component_DatabaseCertificateManualFormModal = _sfc_main$1$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 class="text-xl font-semibold text-black dark:text-white"> База сертификатов </h3><p class="mt-1 text-sm text-gray-600 dark:text-gray-400"> Всего сертификатов: ${ssrInterpolate(stats.value.total)} `);
      if (hasActiveFilters.value) {
        _push(`<span class="text-primary"> (отфильтровано: ${ssrInterpolate(pagination.value.total)}) </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</p></div><div class="flex flex-wrap items-center gap-3">`);
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "primary",
        size: "sm",
        onClick: openManualFormModal
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Добавить вручную `);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                class: "mr-2 h-4 w-4",
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
              createTextVNode(" Добавить вручную ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/database/import-certificates",
        class: "inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"${_scopeId}></path></svg> Импорт из Excel `);
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
                  d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                })
              ])),
              createTextVNode(" Импорт из Excel ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UiButton, {
        variant: "secondary",
        size: "sm",
        onClick: exportToExcel,
        disabled: loading.value || !data.value.length
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg> Экспорт `);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                class: "mr-2 h-4 w-4",
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
              createTextVNode(" Экспорт ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="grid grid-cols-2 sm:grid-cols-4 gap-4"><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm border border-stroke dark:border-strokedark"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><p class="text-sm text-gray-500 dark:text-gray-400">Выдано</p><p class="text-2xl font-bold text-success">${ssrInterpolate(stats.value.issued)}</p></div></div></div><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm border border-stroke dark:border-strokedark"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-full bg-danger/10 flex items-center justify-center"><svg class="h-5 w-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><p class="text-sm text-gray-500 dark:text-gray-400">Отозвано</p><p class="text-2xl font-bold text-danger">${ssrInterpolate(stats.value.revoked)}</p></div></div></div><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm border border-stroke dark:border-strokedark"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center"><svg class="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div><div><p class="text-sm text-gray-500 dark:text-gray-400">Организаций</p><p class="text-2xl font-bold text-warning">${ssrInterpolate(stats.value.organizations)}</p></div></div></div><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm border border-stroke dark:border-strokedark"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center"><svg class="h-5 w-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div><div><p class="text-sm text-gray-500 dark:text-gray-400">Групп</p><p class="text-2xl font-bold text-info">${ssrInterpolate(stats.value.groups)}</p></div></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><div class="flex items-center gap-3 mb-4"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg></div><h4 class="font-semibold text-black dark:text-white">Фильтры</h4>`);
      if (hasActiveFilters.value) {
        _push(`<button class="ml-auto text-sm text-primary hover:underline flex items-center gap-1"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Сбросить фильтры </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Поиск </label><div class="relative"><input${ssrRenderAttr("value", filters.value.search)} type="text" placeholder="ФИО, номер сертификата, ПИНФЛ..." class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"><svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Статус </label><select class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(filters.value.status) ? ssrLooseContain(filters.value.status, "all") : ssrLooseEqual(filters.value.status, "all")) ? " selected" : ""}>Все статусы</option><option value="issued"${ssrIncludeBooleanAttr(Array.isArray(filters.value.status) ? ssrLooseContain(filters.value.status, "issued") : ssrLooseEqual(filters.value.status, "issued")) ? " selected" : ""}>Выданные</option><option value="revoked"${ssrIncludeBooleanAttr(Array.isArray(filters.value.status) ? ssrLooseContain(filters.value.status, "revoked") : ssrLooseEqual(filters.value.status, "revoked")) ? " selected" : ""}>Отозванные</option></select></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Источник </label><select class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(filters.value.sourceType) ? ssrLooseContain(filters.value.sourceType, "all") : ssrLooseEqual(filters.value.sourceType, "all")) ? " selected" : ""}>Все источники</option><option value="group_journal"${ssrIncludeBooleanAttr(Array.isArray(filters.value.sourceType) ? ssrLooseContain(filters.value.sourceType, "group_journal") : ssrLooseEqual(filters.value.sourceType, "group_journal")) ? " selected" : ""}>📋 Журнал группы</option><option value="import"${ssrIncludeBooleanAttr(Array.isArray(filters.value.sourceType) ? ssrLooseContain(filters.value.sourceType, "import") : ssrLooseEqual(filters.value.sourceType, "import")) ? " selected" : ""}>📥 Импорт</option><option value="manual"${ssrIncludeBooleanAttr(Array.isArray(filters.value.sourceType) ? ssrLooseContain(filters.value.sourceType, "manual") : ssrLooseEqual(filters.value.sourceType, "manual")) ? " selected" : ""}>✍️ Ручной ввод</option></select></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Организация </label><input${ssrRenderAttr("value", filters.value.organizationName)} type="text" placeholder="Название организации..." class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Период выдачи </label><div class="flex gap-2"><input${ssrRenderAttr("value", filters.value.dateFrom)} type="date" class="flex-1 rounded-lg border border-stroke bg-transparent py-2 px-3 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"><input${ssrRenderAttr("value", filters.value.dateTo)} type="date" class="flex-1 rounded-lg border border-stroke bg-transparent py-2 px-3 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"></div></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md overflow-hidden"><div class="overflow-x-auto"><table class="w-full"><thead><tr class="border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4"><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"><div class="flex items-center gap-1"> № Сертификата `);
      _push(ssrRenderComponent(unref(SortIcon), {
        active: filters.value.sortBy === "certificate_number",
        order: filters.value.sortOrder
      }, null, _parent));
      _push(`</div></th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"><div class="flex items-center gap-1"> Слушатель `);
      _push(ssrRenderComponent(unref(SortIcon), {
        active: filters.value.sortBy === "student_name",
        order: filters.value.sortOrder
      }, null, _parent));
      _push(`</div></th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"><div class="flex items-center gap-1"> Курс / Группа `);
      _push(ssrRenderComponent(unref(SortIcon), {
        active: filters.value.sortBy === "course_name",
        order: filters.value.sortOrder
      }, null, _parent));
      _push(`</div></th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"><div class="flex items-center gap-1"> Дата выдачи `);
      _push(ssrRenderComponent(unref(SortIcon), {
        active: filters.value.sortBy === "issue_date",
        order: filters.value.sortOrder
      }, null, _parent));
      _push(`</div></th><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Статус </th><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Действия </th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700">`);
      if (loading.value) {
        _push(`<tr><td colspan="6" class="px-4 py-12 text-center"><div class="flex flex-col items-center gap-3"><div class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div><p class="text-gray-500 dark:text-gray-400">Загрузка сертификатов...</p></div></td></tr>`);
      } else if (!data.value.length) {
        _push(`<tr><td colspan="6" class="px-4 py-12 text-center"><div class="flex flex-col items-center gap-3"><svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><p class="text-gray-500 dark:text-gray-400">${ssrInterpolate(hasActiveFilters.value ? "По заданным фильтрам сертификаты не найдены" : "Сертификаты пока не выданы")}</p></div></td></tr>`);
      } else {
        _push(`<!--[-->`);
        ssrRenderList(data.value, (cert) => {
          _push(`<tr class="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"><td class="px-4 py-4"><div class="flex items-center gap-2"><span class="font-mono text-sm font-semibold text-primary">${ssrInterpolate(cert.certificateNumber)}</span>`);
          if (cert.hasWarnings) {
            _push(`<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning" title="Выдан с предупреждениями"> ⚠️ </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td><td class="px-4 py-4"><div><p class="font-medium text-black dark:text-white">${ssrInterpolate(cert.student.fullName)}</p>`);
          if (cert.student.organization) {
            _push(`<p class="text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(cert.student.organization)}</p>`);
          } else {
            _push(`<!---->`);
          }
          if (cert.student.pinfl) {
            _push(`<p class="text-xs text-gray-400 font-mono"> ПИНФЛ: ${ssrInterpolate(cert.student.pinfl)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td><td class="px-4 py-4"><div><div class="flex items-center gap-2"><p class="font-medium text-black dark:text-white">${ssrInterpolate(cert.course.name)}</p>`);
          if (cert.sourceType === "import") {
            _push(`<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-info/20 text-info" title="Импортирован из Excel"> 📥 Импорт </span>`);
          } else if (cert.sourceType === "manual") {
            _push(`<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400" title="Добавлен вручную"> ✍️ Ручной </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (cert.group.code) {
            _push(`<p class="text-sm text-gray-500 dark:text-gray-400"> Группа: ${ssrInterpolate(cert.group.code)}</p>`);
          } else if (cert.sourceType !== "group_journal") {
            _push(`<p class="text-xs text-gray-400 italic"> Без группы </p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td><td class="px-4 py-4"><div class="text-sm"><p class="text-black dark:text-white">${ssrInterpolate(formatDate(cert.issueDate))}</p>`);
          if (cert.issuedBy) {
            _push(`<p class="text-gray-500 dark:text-gray-400">${ssrInterpolate(cert.issuedBy.name)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td><td class="px-4 py-4 text-center"><span class="${ssrRenderClass([
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
            cert.status === "issued" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
          ])}"><span class="mr-1">${ssrInterpolate(cert.status === "issued" ? "✓" : "✕")}</span> ${ssrInterpolate(cert.status === "issued" ? "Выдан" : "Отозван")}</span>`);
          if (cert.status === "revoked" && cert.revokeReason) {
            _push(`<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-32 truncate"${ssrRenderAttr("title", cert.revokeReason)}>${ssrInterpolate(cert.revokeReason)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td><td class="px-4 py-4 text-center"><div class="flex items-center justify-center gap-2">`);
          if (cert.pdfFileUrl) {
            _push(`<a${ssrRenderAttr("href", cert.pdfFileUrl)} target="_blank" class="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors" title="Скачать PDF"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></a>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors" title="Подробнее"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg></button>`);
          if (cert.status === "issued") {
            _push(`<button class="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors" title="Отозвать сертификат"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg></button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td></tr>`);
        });
        _push(`<!--]-->`);
      }
      _push(`</tbody></table></div>`);
      if (pagination.value.totalPages > 1) {
        _push(`<div class="flex items-center justify-between px-6 py-4 border-t border-stroke dark:border-strokedark"><p class="text-sm text-gray-600 dark:text-gray-400"> Показано ${ssrInterpolate((pagination.value.page - 1) * pagination.value.limit + 1)} - ${ssrInterpolate(Math.min(pagination.value.page * pagination.value.limit, pagination.value.total))} из ${ssrInterpolate(pagination.value.total)}</p><div class="flex items-center gap-2"><button${ssrIncludeBooleanAttr(pagination.value.page <= 1) ? " disabled" : ""} class="px-3 py-1 rounded border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"> ← </button><span class="px-3 py-1 text-sm">${ssrInterpolate(pagination.value.page)} / ${ssrInterpolate(pagination.value.totalPages)}</span><button${ssrIncludeBooleanAttr(pagination.value.page >= pagination.value.totalPages) ? " disabled" : ""} class="px-3 py-1 rounded border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"> → </button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (selectedCertificate.value) {
        _push(ssrRenderComponent(_component_DatabaseCertificateDetailModal, {
          certificate: selectedCertificate.value,
          "is-open": isDetailModalOpen.value,
          onClose: closeDetailModal
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": isRevokeModalOpen.value,
        onClose: closeRevokeModal,
        title: "Отзыв сертификата",
        size: "md"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}><div class="p-4 bg-danger/10 border border-danger/20 rounded-lg"${_scopeId}><p class="text-danger font-medium"${_scopeId}>⚠️ Внимание!</p><p class="text-sm text-gray-600 dark:text-gray-400 mt-1"${_scopeId}> Вы собираетесь отозвать сертификат <span class="font-mono font-semibold"${_scopeId}>${ssrInterpolate(revokeTarget.value?.certificateNumber)}</span> слушателя <span class="font-semibold"${_scopeId}>${ssrInterpolate(revokeTarget.value?.student.fullName)}</span>. Это действие будет записано в журнал. </p></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Причина отзыва <span class="text-danger"${_scopeId}>*</span></label><textarea rows="3" placeholder="Укажите причину отзыва сертификата..." class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white resize-none"${_scopeId}>${ssrInterpolate(revokeReason.value)}</textarea></div><div class="flex justify-end gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "secondary",
              onClick: closeRevokeModal
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
              variant: "danger",
              onClick: confirmRevoke,
              disabled: !revokeReason.value.trim() || isRevoking.value,
              loading: isRevoking.value
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` Отозвать сертификат `);
                } else {
                  return [
                    createTextVNode(" Отозвать сертификат ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-4" }, [
                createVNode("div", { class: "p-4 bg-danger/10 border border-danger/20 rounded-lg" }, [
                  createVNode("p", { class: "text-danger font-medium" }, "⚠️ Внимание!"),
                  createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400 mt-1" }, [
                    createTextVNode(" Вы собираетесь отозвать сертификат "),
                    createVNode("span", { class: "font-mono font-semibold" }, toDisplayString(revokeTarget.value?.certificateNumber), 1),
                    createTextVNode(" слушателя "),
                    createVNode("span", { class: "font-semibold" }, toDisplayString(revokeTarget.value?.student.fullName), 1),
                    createTextVNode(". Это действие будет записано в журнал. ")
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                    createTextVNode(" Причина отзыва "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => revokeReason.value = $event,
                    rows: "3",
                    placeholder: "Укажите причину отзыва сертификата...",
                    class: "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white resize-none"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, revokeReason.value]
                  ])
                ]),
                createVNode("div", { class: "flex justify-end gap-3" }, [
                  createVNode(_component_UiButton, {
                    variant: "secondary",
                    onClick: closeRevokeModal
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }),
                  createVNode(_component_UiButton, {
                    variant: "danger",
                    onClick: confirmRevoke,
                    disabled: !revokeReason.value.trim() || isRevoking.value,
                    loading: isRevoking.value
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отозвать сертификат ")
                    ]),
                    _: 1
                  }, 8, ["disabled", "loading"])
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_DatabaseCertificateManualFormModal, {
        "is-open": isManualFormModalOpen.value,
        onClose: closeManualFormModal,
        onCreated: handleCertificateCreated
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/CertificateManagementPanel.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$1, { __name: "DatabaseCertificateManagementPanel" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const activeTab = ref("students");
    const tabs = [
      {
        id: "students",
        label: "База студентов",
        disabled: false
      },
      {
        id: "organizations",
        label: "База организаций",
        disabled: false
      },
      {
        id: "courses",
        label: "База курсов",
        disabled: true
        // Пока отключено
      },
      {
        id: "certificates",
        label: "База сертификатов",
        disabled: false
        // Активировано
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_DatabaseStudentManagementPanel = __nuxt_component_0;
      const _component_OrganizationsOrganizationManagementPanel = __nuxt_component_1;
      const _component_DatabaseCertificateManagementPanel = __nuxt_component_2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-title-md2 font-bold text-black dark:text-white"> База данных </h2></div><div class="flex flex-col gap-6"><div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800"><nav class="flex gap-1" aria-label="Tabs"><!--[-->`);
      ssrRenderList(tabs, (tab) => {
        _push(`<button${ssrIncludeBooleanAttr(tab.disabled) ? " disabled" : ""} class="${ssrRenderClass([
          "flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200",
          activeTab.value === tab.id ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
          tab.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent"
        ])}"><span class="flex items-center justify-center gap-2">${ssrInterpolate(tab.label)} `);
        if (tab.disabled) {
          _push(`<span class="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-600 dark:text-gray-300"> Скоро </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</span></button>`);
      });
      _push(`<!--]--></nav></div><div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="p-6" style="${ssrRenderStyle(activeTab.value === "students" ? null : { display: "none" })}">`);
      _push(ssrRenderComponent(_component_DatabaseStudentManagementPanel, null, null, _parent));
      _push(`</div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "organizations" ? null : { display: "none" })}">`);
      _push(ssrRenderComponent(_component_OrganizationsOrganizationManagementPanel, null, null, _parent));
      _push(`</div><div class="p-6" style="${ssrRenderStyle(activeTab.value === "certificates" ? null : { display: "none" })}">`);
      _push(ssrRenderComponent(_component_DatabaseCertificateManagementPanel, null, null, _parent));
      _push(`</div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/database/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-rAQu8NAo.mjs.map
