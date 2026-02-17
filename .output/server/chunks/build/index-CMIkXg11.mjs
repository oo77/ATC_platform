import { ref, computed, mergeProps, createVNode, resolveDynamicComponent, watch, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrRenderComponent, ssrRenderClass, ssrRenderVNode, ssrRenderList, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderStyle, ssrRenderTeleport } from 'vue/server-renderer';
import { _ as _imports_0 } from './virtual_public-IWZl7zz2.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import { u as useHead } from './server.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
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
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main$a = {
  __name: "TgAppRegistrationForm",
  __ssrInlineRender: true,
  props: {
    telegramData: {
      type: Object,
      required: true
    }
  },
  emits: ["registered"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const step = ref(1);
    ref(null);
    const phoneNumber = ref("");
    const formData = ref({
      fullName: "",
      phone: "",
      organizationName: "",
      organizationId: null
    });
    const errors = ref({
      fullName: "",
      phone: "",
      organizationName: ""
    });
    const generalError = ref("");
    const submitting = ref(false);
    const organizations = ref([]);
    const showSuggestions = ref(false);
    ref(null);
    ref(false);
    const filteredOrganizations = computed(() => {
      if (!formData.value.organizationName) return [];
      const query = formData.value.organizationName.toLowerCase();
      return organizations.value.filter((org) => org.name.toLowerCase().includes(query)).slice(0, 10);
    });
    watch(
      () => props.telegramData,
      (data) => {
        if (data?.user) {
          const firstName = data.user.first_name || "";
          const lastName = data.user.last_name || "";
          if (firstName && !formData.value.fullName) {
            formData.value.fullName = `${lastName} ${firstName}`.trim();
          }
        }
      },
      { immediate: true }
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "tg-registration-form" }, _attrs))} data-v-87302619><form data-v-87302619>`);
      if (step.value === 1) {
        _push(`<div class="tg-form-step" data-v-87302619><div class="tg-step-indicator" data-v-87302619><div class="tg-step-progress" data-v-87302619><div class="tg-step-dot active" data-v-87302619><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" data-v-87302619></path></svg></div><div class="tg-step-line" data-v-87302619></div><div class="tg-step-dot" data-v-87302619><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" data-v-87302619></path></svg></div><div class="tg-step-line" data-v-87302619></div><div class="tg-step-dot" data-v-87302619><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" data-v-87302619></path></svg></div></div><span class="tg-step-text" data-v-87302619>Шаг 1 из 3</span></div><div class="tg-form-header" data-v-87302619><h2 data-v-87302619>Введите ваше ФИО</h2><p data-v-87302619>Укажите полные данные</p></div><div class="tg-form-group" data-v-87302619><input${ssrRenderAttr("value", formData.value.fullName)} type="text" placeholder="Фамилия Имя Отчество" class="${ssrRenderClass([{ error: errors.value.fullName }, "tg-input"])}" autocomplete="name" data-v-87302619>`);
        if (errors.value.fullName) {
          _push(`<p class="tg-error-text" data-v-87302619>${ssrInterpolate(errors.value.fullName)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><button type="button" class="tg-btn-next" data-v-87302619><span data-v-87302619>Продолжить</span><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-87302619></path></svg></button></div>`);
      } else {
        _push(`<!---->`);
      }
      if (step.value === 2) {
        _push(`<div class="tg-form-step" data-v-87302619><div class="tg-step-indicator" data-v-87302619><div class="tg-step-progress" data-v-87302619><div class="tg-step-dot completed" data-v-87302619><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" data-v-87302619></path></svg></div><div class="tg-step-line filled" data-v-87302619></div><div class="tg-step-dot active" data-v-87302619><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" data-v-87302619></path></svg></div><div class="tg-step-line" data-v-87302619></div><div class="tg-step-dot" data-v-87302619><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" data-v-87302619></path></svg></div></div><span class="tg-step-text" data-v-87302619>Шаг 2 из 3</span></div><div class="tg-form-header" data-v-87302619><h2 data-v-87302619>Номер телефона</h2><p data-v-87302619>Введите номер в формате Узбекистана</p></div><div class="tg-form-group" data-v-87302619><div class="tg-phone-input-wrapper" data-v-87302619><span class="tg-phone-prefix" data-v-87302619>+998</span><input${ssrRenderAttr("value", phoneNumber.value)} type="tel" placeholder="XX XXX XX XX" class="${ssrRenderClass([{ error: errors.value.phone }, "tg-input tg-phone-input"])}" autocomplete="tel" maxlength="12" data-v-87302619></div>`);
        if (errors.value.phone) {
          _push(`<p class="tg-error-text" data-v-87302619>${ssrInterpolate(errors.value.phone)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="tg-form-actions" data-v-87302619><button type="button" class="tg-btn-back" data-v-87302619><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-v-87302619></path></svg><span data-v-87302619>Назад</span></button><button type="button" class="tg-btn-next" data-v-87302619><span data-v-87302619>Продолжить</span><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-87302619></path></svg></button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (step.value === 3) {
        _push(`<div class="tg-form-step" data-v-87302619><div class="tg-step-indicator" data-v-87302619><div class="tg-step-progress" data-v-87302619><div class="tg-step-dot completed" data-v-87302619><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" data-v-87302619></path></svg></div><div class="tg-step-line filled" data-v-87302619></div><div class="tg-step-dot completed" data-v-87302619><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" data-v-87302619></path></svg></div><div class="tg-step-line filled" data-v-87302619></div><div class="tg-step-dot active" data-v-87302619><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" data-v-87302619></path></svg></div></div><span class="tg-step-text" data-v-87302619>Шаг 3 из 3</span></div><div class="tg-form-header" data-v-87302619><h2 data-v-87302619>Организация</h2><p data-v-87302619>Выберите или введите название</p></div><div class="tg-form-group" data-v-87302619><div class="tg-autocomplete" data-v-87302619><input${ssrRenderAttr("value", formData.value.organizationName)} type="text" placeholder="Название организации" class="${ssrRenderClass([{ error: errors.value.organizationName }, "tg-input"])}" autocomplete="off" data-v-87302619>`);
        if (showSuggestions.value && filteredOrganizations.value.length > 0) {
          _push(`<div class="tg-organizations-dropdown" data-v-87302619><!--[-->`);
          ssrRenderList(filteredOrganizations.value, (org) => {
            _push(`<button type="button" class="tg-org-item" data-v-87302619><svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" data-v-87302619></path></svg><span class="tg-org-name" data-v-87302619>${ssrInterpolate(org.name)}</span><svg class="w-4 h-4 tg-org-check" fill="currentColor" viewBox="0 0 20 20" data-v-87302619><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" data-v-87302619></path></svg></button>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (errors.value.organizationName) {
          _push(`<p class="tg-error-text" data-v-87302619>${ssrInterpolate(errors.value.organizationName)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="tg-form-actions" data-v-87302619><button type="button" class="tg-btn-back" data-v-87302619><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-v-87302619></path></svg><span data-v-87302619>Назад</span></button><button type="submit"${ssrIncludeBooleanAttr(submitting.value) ? " disabled" : ""} class="tg-btn-submit" data-v-87302619>`);
        if (!submitting.value) {
          _push(`<span class="flex items-center gap-2" data-v-87302619><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" data-v-87302619></path></svg> Отправить </span>`);
        } else {
          _push(`<span class="tg-btn-loading" data-v-87302619><span class="tg-spinner-small" data-v-87302619></span> Отправка... </span>`);
        }
        _push(`</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (generalError.value) {
        _push(`<div class="tg-general-error" data-v-87302619><svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-87302619><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-87302619></path></svg><p data-v-87302619>${ssrInterpolate(generalError.value)}</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</form></div>`);
    };
  }
};
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tg-app/RegistrationForm.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const RegistrationForm = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["__scopeId", "data-v-87302619"]]);
const _sfc_main$9 = {
  __name: "TgAppStudentDetailModal",
  __ssrInlineRender: true,
  props: {
    show: {
      type: Boolean,
      default: false
    },
    studentId: {
      type: String,
      default: null
    },
    student: {
      type: Object,
      default: null
    },
    organizationId: {
      type: String,
      required: true
    },
    representativeChatId: {
      type: String,
      default: null
    }
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const loading = ref(false);
    const error = ref(null);
    const studentDetail = ref(null);
    const certificates = ref([]);
    const stats = ref({ total: 0, issued: 0, expired: 0, revoked: 0 });
    const downloadingId = ref(null);
    watch(
      () => [props.show, props.studentId],
      ([isOpen, id]) => {
        if (isOpen && id) {
          loadDetails();
        } else if (!isOpen) {
          studentDetail.value = null;
          certificates.value = [];
          error.value = null;
        }
      },
      { immediate: true }
    );
    function getInitials(fullName) {
      if (!fullName) return "?";
      const parts = fullName.trim().split(" ");
      if (parts.length >= 2) {
        return parts[0][0] + parts[1][0];
      }
      return fullName[0];
    }
    async function loadDetails() {
      if (!props.studentId) return;
      loading.value = true;
      error.value = null;
      try {
        const data = await $fetch(`/api/tg-app/students/${props.studentId}`, {
          params: {
            organizationId: props.organizationId
          }
        });
        studentDetail.value = data.student;
        certificates.value = data.certificates || [];
        stats.value = data.stats || { total: 0, issued: 0, expired: 0, revoked: 0 };
      } catch (err) {
        console.error("Ошибка загрузки данных слушателя:", err);
        error.value = err.data?.message || "Не удалось загрузить данные";
      } finally {
        loading.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderTeleport(_push, (_push2) => {
        if (__props.show) {
          _push2(`<div class="tg-modal-overlay" data-v-5774dfcf><div class="tg-modal-container" data-v-5774dfcf><div class="tg-modal-header" data-v-5774dfcf><div class="tg-modal-title" data-v-5774dfcf><div class="tg-student-avatar-lg" data-v-5774dfcf>${ssrInterpolate(getInitials(__props.student?.fullName))}</div><div data-v-5774dfcf><h2 data-v-5774dfcf>${ssrInterpolate(__props.student?.fullName)}</h2><p class="tg-subtitle" data-v-5774dfcf>${ssrInterpolate(__props.student?.position)}</p></div></div><button class="tg-modal-close" data-v-5774dfcf><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-5774dfcf><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-5774dfcf></path></svg></button></div><div class="tg-modal-content" data-v-5774dfcf>`);
          if (loading.value) {
            _push2(`<div class="tg-loading-block" data-v-5774dfcf><div class="tg-spinner" data-v-5774dfcf></div><p data-v-5774dfcf>Загрузка данных...</p></div>`);
          } else if (error.value) {
            _push2(`<div class="tg-error-block" data-v-5774dfcf><span class="tg-error-icon" data-v-5774dfcf>⚠️</span><p data-v-5774dfcf>${ssrInterpolate(error.value)}</p><button class="tg-btn-retry" data-v-5774dfcf> Повторить </button></div>`);
          } else if (studentDetail.value) {
            _push2(`<!--[--><div class="tg-info-section" data-v-5774dfcf><h3 class="tg-section-title" data-v-5774dfcf><span class="tg-section-icon" data-v-5774dfcf>👤</span> Информация </h3><div class="tg-info-grid" data-v-5774dfcf><div class="tg-info-item" data-v-5774dfcf><span class="tg-info-label" data-v-5774dfcf>Должность</span><span class="tg-info-value" data-v-5774dfcf>${ssrInterpolate(studentDetail.value.position)}</span></div>`);
            if (studentDetail.value.department) {
              _push2(`<div class="tg-info-item" data-v-5774dfcf><span class="tg-info-label" data-v-5774dfcf>Отдел</span><span class="tg-info-value" data-v-5774dfcf>${ssrInterpolate(studentDetail.value.department)}</span></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="tg-info-item" data-v-5774dfcf><span class="tg-info-label" data-v-5774dfcf>Организация</span><span class="tg-info-value" data-v-5774dfcf>${ssrInterpolate(studentDetail.value.organizationName)}</span></div>`);
            if (studentDetail.value.pinfl) {
              _push2(`<div class="tg-info-item" data-v-5774dfcf><span class="tg-info-label" data-v-5774dfcf>ПИНФЛ</span><span class="tg-info-value tg-pinfl" data-v-5774dfcf>${ssrInterpolate(studentDetail.value.pinfl)}</span></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (studentDetail.value.registeredAt) {
              _push2(`<div class="tg-info-item" data-v-5774dfcf><span class="tg-info-label" data-v-5774dfcf>В системе с</span><span class="tg-info-value" data-v-5774dfcf>${ssrInterpolate(studentDetail.value.registeredAt)}</span></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="tg-stats-section" data-v-5774dfcf><div class="tg-stat-card tg-stat-total" data-v-5774dfcf><span class="tg-stat-value" data-v-5774dfcf>${ssrInterpolate(stats.value.total)}</span><span class="tg-stat-label" data-v-5774dfcf>Всего</span></div><div class="tg-stat-card tg-stat-issued" data-v-5774dfcf><span class="tg-stat-value" data-v-5774dfcf>${ssrInterpolate(stats.value.issued)}</span><span class="tg-stat-label" data-v-5774dfcf>Активных</span></div>`);
            if (stats.value.expired > 0) {
              _push2(`<div class="tg-stat-card tg-stat-expired" data-v-5774dfcf><span class="tg-stat-value" data-v-5774dfcf>${ssrInterpolate(stats.value.expired)}</span><span class="tg-stat-label" data-v-5774dfcf>Истёк срок</span></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (stats.value.revoked > 0) {
              _push2(`<div class="tg-stat-card tg-stat-revoked" data-v-5774dfcf><span class="tg-stat-value" data-v-5774dfcf>${ssrInterpolate(stats.value.revoked)}</span><span class="tg-stat-label" data-v-5774dfcf>Отозвано</span></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="tg-certificates-section" data-v-5774dfcf><h3 class="tg-section-title" data-v-5774dfcf><span class="tg-section-icon" data-v-5774dfcf>📜</span> Сертификаты </h3>`);
            if (certificates.value.length === 0) {
              _push2(`<div class="tg-empty-certs" data-v-5774dfcf><span class="tg-empty-icon" data-v-5774dfcf>📭</span><p data-v-5774dfcf>Сертификаты не найдены</p></div>`);
            } else {
              _push2(`<div class="tg-certificates-list" data-v-5774dfcf><!--[-->`);
              ssrRenderList(certificates.value, (cert) => {
                _push2(`<div class="${ssrRenderClass([{
                  "tg-cert-expired": cert.isExpired,
                  "tg-cert-revoked": cert.status === "revoked"
                }, "tg-cert-card"])}" data-v-5774dfcf><div class="tg-cert-header" data-v-5774dfcf><div class="tg-cert-info" data-v-5774dfcf><h4 data-v-5774dfcf>${ssrInterpolate(cert.courseName)}</h4><span class="tg-cert-number" data-v-5774dfcf>${ssrInterpolate(cert.certificateNumber)}</span></div><div class="tg-cert-badges" data-v-5774dfcf>`);
                if (cert.isExpired) {
                  _push2(`<span class="tg-badge tg-badge-expired" data-v-5774dfcf> Истёк </span>`);
                } else if (cert.status === "revoked") {
                  _push2(`<span class="tg-badge tg-badge-revoked" data-v-5774dfcf> Отозван </span>`);
                } else {
                  _push2(`<span class="tg-badge tg-badge-active" data-v-5774dfcf> Активен </span>`);
                }
                if (cert.importSource === "ai_scan") {
                  _push2(`<span class="tg-badge tg-badge-ai" data-v-5774dfcf> AI </span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div><div class="tg-cert-details" data-v-5774dfcf><div class="tg-cert-meta" data-v-5774dfcf>`);
                if (cert.issueDate) {
                  _push2(`<span class="tg-meta-item" data-v-5774dfcf> 📅 Выдан: ${ssrInterpolate(cert.issueDate)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (cert.expiryDate) {
                  _push2(`<span class="tg-meta-item" data-v-5774dfcf> ⏰ До: ${ssrInterpolate(cert.expiryDate)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (cert.courseHours) {
                  _push2(`<span class="tg-meta-item" data-v-5774dfcf> 🕐 ${ssrInterpolate(cert.courseHours)} ч. </span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (cert.groupCode) {
                  _push2(`<span class="tg-meta-item" data-v-5774dfcf> 👥 ${ssrInterpolate(cert.groupCode)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div>`);
                if (cert.hasPdf && cert.status === "issued") {
                  _push2(`<button class="tg-btn-download"${ssrIncludeBooleanAttr(downloadingId.value === cert.id) ? " disabled" : ""} data-v-5774dfcf>`);
                  if (downloadingId.value === cert.id) {
                    _push2(`<div class="tg-spinner-small" data-v-5774dfcf></div>`);
                  } else {
                    _push2(`<!--[--><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-5774dfcf><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" data-v-5774dfcf></path></svg> Скачать <!--]-->`);
                  }
                  _push2(`</button>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
              });
              _push2(`<!--]--></div>`);
            }
            _push2(`</div><!--]-->`);
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
};
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tg-app/StudentDetailModal.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const StudentDetailModal = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["__scopeId", "data-v-5774dfcf"]]);
const _sfc_main$8 = {
  __name: "TgAppStudentsTab",
  __ssrInlineRender: true,
  props: {
    organizationId: {
      type: String,
      required: true
    },
    permissions: {
      type: Object,
      required: true
    },
    representative: {
      type: Object,
      default: null
    }
  },
  setup(__props) {
    const props = __props;
    const loading = ref(false);
    const error = ref(null);
    const viewMode = ref("all");
    const searchQuery = ref("");
    const selectedCourse = ref("");
    const expandedGroups = ref({});
    const allStudents = ref([]);
    const groupStudents = ref([]);
    const showStudentModal = ref(false);
    const selectedStudentId = ref(null);
    const selectedStudent = ref(null);
    watch(
      () => props.organizationId,
      (newId) => {
        if (newId) {
          loadData();
        }
      },
      { immediate: true }
    );
    async function loadData() {
      loading.value = true;
      error.value = null;
      try {
        const [allResponse, groupsResponse] = await Promise.all([
          $fetch("/api/tg-app/students", {
            params: { organizationId: props.organizationId, mode: "all" }
          }),
          $fetch("/api/tg-app/students", {
            params: { organizationId: props.organizationId, mode: "groups" }
          }).catch(() => ({ students: [] }))
          // Fallback если нет данных
        ]);
        allStudents.value = allResponse.students || [];
        groupStudents.value = groupsResponse.students || [];
        if (Object.keys(groupedStudents.value).length > 0) {
          const firstGroup = Object.keys(groupedStudents.value)[0];
          expandedGroups.value[firstGroup] = true;
        }
      } catch (err) {
        console.error("Ошибка загрузки слушателей:", err);
        error.value = err.data?.message || "Не удалось загрузить список слушателей";
      } finally {
        loading.value = false;
      }
    }
    const filteredAllStudents = computed(() => {
      let result = allStudents.value;
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(
          (s) => s.fullName.toLowerCase().includes(query) || s.position && s.position.toLowerCase().includes(query)
        );
      }
      return result;
    });
    const filteredGroupStudents = computed(() => {
      let result = groupStudents.value;
      if (selectedCourse.value) {
        result = result.filter((s) => s.courseName === selectedCourse.value);
      }
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter((s) => s.fullName.toLowerCase().includes(query));
      }
      return result;
    });
    const availableCourses = computed(() => {
      const courses = /* @__PURE__ */ new Set();
      groupStudents.value.forEach((student) => {
        if (student.courseName) {
          courses.add(student.courseName);
        }
      });
      return Array.from(courses).sort();
    });
    const groupedStudents = computed(() => {
      const grouped = {};
      filteredGroupStudents.value.forEach((student) => {
        const groupName = student.groupName || "Без группы";
        if (!grouped[groupName]) {
          grouped[groupName] = {
            courseName: student.courseName,
            startDate: student.startDate,
            endDate: student.endDate,
            students: []
          };
        }
        grouped[groupName].students.push(student);
      });
      return grouped;
    });
    function getInitials(fullName) {
      if (!fullName) return "?";
      const parts = fullName.trim().split(" ");
      if (parts.length >= 2) {
        return parts[0][0] + parts[1][0];
      }
      return fullName[0];
    }
    function getGroupStatus(endDateStr) {
      if (!endDateStr) return { label: "Активна", class: "status-active" };
      const [day, month, year] = endDateStr.split(".").map(Number);
      const endDate = new Date(year, month - 1, day);
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      if (endDate < today) {
        return { label: "Завершена", class: "status-completed" };
      }
      return { label: "Активна", class: "status-active" };
    }
    function closeStudentModal() {
      showStudentModal.value = false;
      selectedStudentId.value = null;
      selectedStudent.value = null;
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "tg-students-tab" }, _attrs))} data-v-4202c452>`);
      if (!__props.permissions?.can_view_students) {
        _push(`<div class="tg-no-permission" data-v-4202c452><div class="tg-icon-wrapper" data-v-4202c452><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4202c452><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" data-v-4202c452></path></svg></div><h3 data-v-4202c452>Нет доступа</h3><p data-v-4202c452>У вас нет прав на просмотр списка слушателей</p></div>`);
      } else {
        _push(`<div data-v-4202c452><div class="tg-view-switcher" data-v-4202c452><button class="${ssrRenderClass([{ active: viewMode.value === "all" }, "tg-view-btn"])}" data-v-4202c452><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4202c452><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" data-v-4202c452></path></svg> Все слушатели </button><button class="${ssrRenderClass([{ active: viewMode.value === "groups" }, "tg-view-btn"])}" data-v-4202c452><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4202c452><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" data-v-4202c452></path></svg> По группам </button></div><div class="tg-filters" data-v-4202c452><div class="tg-search-wrapper" data-v-4202c452><div class="tg-search-icon" data-v-4202c452><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4202c452><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-4202c452></path></svg></div><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="Поиск по имени..." class="tg-search-input" data-v-4202c452></div>`);
        if (viewMode.value === "groups") {
          _push(`<select class="tg-select" data-v-4202c452><option value="" data-v-4202c452${ssrIncludeBooleanAttr(Array.isArray(selectedCourse.value) ? ssrLooseContain(selectedCourse.value, "") : ssrLooseEqual(selectedCourse.value, "")) ? " selected" : ""}>Все курсы</option><!--[-->`);
          ssrRenderList(availableCourses.value, (course) => {
            _push(`<option${ssrRenderAttr("value", course)} data-v-4202c452${ssrIncludeBooleanAttr(Array.isArray(selectedCourse.value) ? ssrLooseContain(selectedCourse.value, course) : ssrLooseEqual(selectedCourse.value, course)) ? " selected" : ""}>${ssrInterpolate(course)}</option>`);
          });
          _push(`<!--]--></select>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (loading.value) {
          _push(`<div class="tg-loading-block" data-v-4202c452><div class="tg-spinner" data-v-4202c452></div><p data-v-4202c452>Загрузка слушателей...</p></div>`);
        } else if (error.value) {
          _push(`<div class="tg-error-block" data-v-4202c452><div class="tg-icon-wrapper tg-error-icon-wrapper" data-v-4202c452><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4202c452><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-4202c452></path></svg></div><p data-v-4202c452>${ssrInterpolate(error.value)}</p><button class="tg-btn-retry" data-v-4202c452>Повторить</button></div>`);
        } else if (viewMode.value === "all") {
          _push(`<!--[-->`);
          if (filteredAllStudents.value.length > 0) {
            _push(`<div class="tg-all-students" data-v-4202c452><div class="tg-list-header" data-v-4202c452><h3 data-v-4202c452>Слушатели организации</h3><span class="tg-count" data-v-4202c452>${ssrInterpolate(filteredAllStudents.value.length)}</span></div><div class="tg-students-grid" data-v-4202c452><!--[-->`);
            ssrRenderList(filteredAllStudents.value, (student) => {
              _push(`<div class="tg-student-card" data-v-4202c452><div class="tg-student-avatar" data-v-4202c452>${ssrInterpolate(getInitials(student.fullName))}</div><div class="tg-student-main" data-v-4202c452><h4 data-v-4202c452>${ssrInterpolate(student.fullName)}</h4><p class="tg-position" data-v-4202c452>${ssrInterpolate(student.position)}</p><div class="tg-student-meta" data-v-4202c452>`);
              if (student.certificatesCount > 0) {
                _push(`<span class="tg-meta-badge tg-certs-badge" data-v-4202c452> 📜 ${ssrInterpolate(student.certificatesCount)}</span>`);
              } else {
                _push(`<!---->`);
              }
              if (student.lastCertificateDate) {
                _push(`<span class="tg-meta-date" data-v-4202c452>${ssrInterpolate(student.lastCertificateDate)}</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div></div><div class="tg-student-arrow" data-v-4202c452><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4202c452><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-4202c452></path></svg></div></div>`);
            });
            _push(`<!--]--></div></div>`);
          } else {
            _push(`<div class="tg-empty-state" data-v-4202c452><div class="tg-icon-wrapper" data-v-4202c452><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4202c452><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" data-v-4202c452></path></svg></div><h3 data-v-4202c452>Нет слушателей</h3>`);
            if (searchQuery.value) {
              _push(`<p data-v-4202c452>Попробуйте изменить поисковый запрос</p>`);
            } else {
              _push(`<p data-v-4202c452>В данный момент нет слушателей от вашей организации</p>`);
            }
            _push(`</div>`);
          }
          _push(`<!--]-->`);
        } else if (viewMode.value === "groups") {
          _push(`<!--[-->`);
          if (filteredGroupStudents.value.length > 0) {
            _push(`<div class="tg-students-list" data-v-4202c452><div class="tg-list-header" data-v-4202c452><h3 data-v-4202c452>Слушатели в группах</h3><span class="tg-count" data-v-4202c452>${ssrInterpolate(filteredGroupStudents.value.length)}</span></div><!--[-->`);
            ssrRenderList(groupedStudents.value, (groupData, groupName) => {
              _push(`<div class="tg-group-section" data-v-4202c452><div class="tg-group-header" data-v-4202c452><div class="tg-group-info" data-v-4202c452><div class="tg-group-title-row" data-v-4202c452><h4 data-v-4202c452>${ssrInterpolate(groupName)}</h4><span class="${ssrRenderClass([getGroupStatus(groupData.endDate).class, "tg-group-status"])}" data-v-4202c452>${ssrInterpolate(getGroupStatus(groupData.endDate).label)}</span></div>`);
              if (groupData.courseName) {
                _push(`<p data-v-4202c452>${ssrInterpolate(groupData.courseName)}</p>`);
              } else {
                _push(`<!---->`);
              }
              if (groupData.startDate && groupData.endDate) {
                _push(`<div class="tg-group-dates" data-v-4202c452> 📅 ${ssrInterpolate(groupData.startDate)} - ${ssrInterpolate(groupData.endDate)}</div>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div><div class="tg-group-toggle" data-v-4202c452><span class="tg-student-count" data-v-4202c452>${ssrInterpolate(groupData.students.length)}</span><span class="${ssrRenderClass([{ expanded: expandedGroups.value[groupName] }, "tg-toggle-icon"])}" data-v-4202c452><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4202c452><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" data-v-4202c452></path></svg></span></div></div>`);
              if (expandedGroups.value[groupName]) {
                _push(`<div class="tg-students-in-group" data-v-4202c452><!--[-->`);
                ssrRenderList(groupData.students, (student, index2) => {
                  _push(`<div class="tg-student-item" data-v-4202c452><div class="tg-student-avatar" data-v-4202c452>${ssrInterpolate(getInitials(student.fullName))}</div><div class="tg-student-info" data-v-4202c452><h5 data-v-4202c452>${ssrInterpolate(student.fullName)}</h5></div><div class="tg-student-arrow-small" data-v-4202c452><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4202c452><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-4202c452></path></svg></div></div>`);
                });
                _push(`<!--]--></div>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<div class="tg-empty-state" data-v-4202c452><div class="tg-icon-wrapper" data-v-4202c452><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4202c452><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" data-v-4202c452></path></svg></div><h3 data-v-4202c452>Нет активных групп</h3>`);
            if (searchQuery.value || selectedCourse.value) {
              _push(`<p data-v-4202c452> Попробуйте изменить фильтры </p>`);
            } else {
              _push(`<p data-v-4202c452> В данный момент нет активных учебных групп с вашими слушателями </p>`);
            }
            _push(`</div>`);
          }
          _push(`<!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(ssrRenderComponent(StudentDetailModal, {
        show: showStudentModal.value,
        "student-id": selectedStudentId.value,
        student: selectedStudent.value,
        "organization-id": __props.organizationId,
        "representative-chat-id": __props.representative?.telegramChatId,
        onClose: closeStudentModal
      }, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tg-app/StudentsTab.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const StudentsTab = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__scopeId", "data-v-4202c452"]]);
const _sfc_main$7 = {
  __name: "TgAppScheduleTab",
  __ssrInlineRender: true,
  props: {
    organizationId: {
      type: String,
      required: true
    },
    permissions: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const loading = ref(false);
    const error = ref(null);
    const schedule = ref([]);
    const groupedSchedule = computed(() => {
      const grouped = {};
      schedule.value.forEach((event) => {
        const date = event.date;
        if (!grouped[date]) {
          grouped[date] = {
            date,
            events: []
          };
        }
        grouped[date].events.push(event);
      });
      return Object.values(grouped).sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
    });
    function parseDate(dateStr) {
      if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split("-").map(Number);
        return new Date(y, m - 1, d);
      }
      return new Date(dateStr);
    }
    function formatDate(dateStr) {
      const date = parseDate(dateStr);
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
    function formatDayOfWeek(dateStr) {
      const date = parseDate(dateStr);
      return date.toLocaleDateString("ru-RU", { weekday: "long" });
    }
    function getTypeIcon(type) {
      const icons = {
        theory: "📖",
        practice: "💻",
        knowledge_check: "📝",
        retake: "🔄"
      };
      return icons[type] || "📚";
    }
    function getTypeLabel(type) {
      const labels = {
        theory: "Теория",
        practice: "Практика",
        knowledge_check: "Проверка знаний",
        retake: "Пересдача"
      };
      return labels[type] || type;
    }
    async function loadSchedule() {
      loading.value = true;
      error.value = null;
      try {
        const data = await $fetch("/api/tg-app/schedule", {
          params: {
            organizationId: props.organizationId
          }
        });
        schedule.value = data.schedule || [];
      } catch (err) {
        console.error("Ошибка загрузки расписания:", err);
        error.value = err.data?.message || "Не удалось загрузить расписание";
      } finally {
        loading.value = false;
      }
    }
    watch(
      () => props.organizationId,
      (newId) => {
        if (newId) {
          loadSchedule();
        }
      },
      { immediate: true }
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "tg-schedule-tab" }, _attrs))} data-v-1d2bceed>`);
      if (!__props.permissions?.can_view_schedule) {
        _push(`<div class="tg-no-permission" data-v-1d2bceed><span class="tg-icon" data-v-1d2bceed>🚫</span><h3 data-v-1d2bceed>Нет доступа</h3><p data-v-1d2bceed>У вас нет прав на просмотр расписания</p></div>`);
      } else {
        _push(`<div data-v-1d2bceed>`);
        if (loading.value) {
          _push(`<div class="tg-loading-block" data-v-1d2bceed><div class="tg-spinner" data-v-1d2bceed></div><p data-v-1d2bceed>Загрузка расписания...</p></div>`);
        } else if (error.value) {
          _push(`<div class="tg-error-block" data-v-1d2bceed><span class="tg-icon" data-v-1d2bceed>⚠️</span><p data-v-1d2bceed>${ssrInterpolate(error.value)}</p><button class="tg-btn-retry" data-v-1d2bceed>Повторить</button></div>`);
        } else if (groupedSchedule.value.length > 0) {
          _push(`<div class="tg-schedule-list" data-v-1d2bceed><!--[-->`);
          ssrRenderList(groupedSchedule.value, (dateGroup) => {
            _push(`<div class="tg-date-group" data-v-1d2bceed><div class="tg-date-header" data-v-1d2bceed><span class="tg-date-icon" data-v-1d2bceed>📅</span><div class="tg-date-info" data-v-1d2bceed><h3 data-v-1d2bceed>${ssrInterpolate(formatDate(dateGroup.date))}</h3><p data-v-1d2bceed>${ssrInterpolate(formatDayOfWeek(dateGroup.date))}</p></div><span class="tg-events-count" data-v-1d2bceed>${ssrInterpolate(dateGroup.events.length)}</span></div><div class="tg-events" data-v-1d2bceed><!--[-->`);
            ssrRenderList(dateGroup.events, (event, index2) => {
              _push(`<div class="tg-event-card" data-v-1d2bceed><div class="tg-event-time" data-v-1d2bceed><span class="tg-time" data-v-1d2bceed>${ssrInterpolate(event.startTime)}</span><span class="tg-time-separator" data-v-1d2bceed>-</span><span class="tg-time" data-v-1d2bceed>${ssrInterpolate(event.endTime)}</span></div><div class="tg-event-content" data-v-1d2bceed><div class="${ssrRenderClass([`tg-type-${event.eventType}`, "tg-event-type"])}" data-v-1d2bceed><span class="tg-type-icon" data-v-1d2bceed>${ssrInterpolate(getTypeIcon(event.eventType))}</span><span class="tg-type-label" data-v-1d2bceed>${ssrInterpolate(getTypeLabel(event.eventType))}</span></div><h4 class="tg-event-discipline" data-v-1d2bceed>${ssrInterpolate(event.disciplineName)}</h4><div class="tg-event-details" data-v-1d2bceed><div class="tg-event-detail" data-v-1d2bceed><span class="tg-detail-icon" data-v-1d2bceed>👨‍🏫</span><span data-v-1d2bceed>${ssrInterpolate(event.instructorName)}</span></div><div class="tg-event-detail" data-v-1d2bceed><span class="tg-detail-icon" data-v-1d2bceed>👥</span><span data-v-1d2bceed>${ssrInterpolate(event.groupName)}</span></div>`);
              if (event.location) {
                _push(`<div class="tg-event-detail" data-v-1d2bceed><span class="tg-detail-icon" data-v-1d2bceed>🚪</span><span data-v-1d2bceed>${ssrInterpolate(event.location)}</span></div>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div></div></div>`);
            });
            _push(`<!--]--></div></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="tg-empty-state" data-v-1d2bceed><span class="tg-empty-icon" data-v-1d2bceed>📅</span><h3 data-v-1d2bceed>Нет занятий</h3><p data-v-1d2bceed> В ближайшее время нет запланированных занятий для слушателей вашей организации </p></div>`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tg-app/ScheduleTab.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const ScheduleTab = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-1d2bceed"]]);
const _sfc_main$6 = {
  __name: "TgAppCertificatesTab",
  __ssrInlineRender: true,
  props: {
    organizationId: {
      type: String,
      required: true
    },
    permissions: {
      type: Object,
      required: true
    },
    representative: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const loading = ref(false);
    const error = ref(null);
    const certificates = ref([]);
    const searchQuery = ref("");
    const selectedPeriod = ref("");
    const selectedGroup = ref("");
    const sendingCertId = ref(null);
    const downloadingZip = ref(false);
    const availablePeriods = computed(() => {
      const periods = /* @__PURE__ */ new Set();
      certificates.value.forEach((cert) => {
        if (cert.issueDate) {
          const parts = cert.issueDate.split(".");
          if (parts.length === 3) {
            const month = parts[1];
            const year = parts[2];
            periods.add(`${month}.${year}`);
          }
        }
      });
      return Array.from(periods).sort((a, b) => {
        const [aMonth, aYear] = a.split(".").map(Number);
        const [bMonth, bYear] = b.split(".").map(Number);
        if (aYear !== bYear) return bYear - aYear;
        return bMonth - aMonth;
      });
    });
    const availableGroups = computed(() => {
      const groups = /* @__PURE__ */ new Set();
      certificates.value.forEach((cert) => {
        if (cert.groupCode) {
          groups.add(cert.groupCode);
        }
      });
      return Array.from(groups).sort();
    });
    const filteredCertificates = computed(() => {
      let result = certificates.value;
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(
          (cert) => cert.studentName.toLowerCase().includes(query)
        );
      }
      if (selectedPeriod.value) {
        result = result.filter((cert) => {
          if (!cert.issueDate) return false;
          const parts = cert.issueDate.split(".");
          if (parts.length !== 3) return false;
          const period = `${parts[1]}.${parts[2]}`;
          return period === selectedPeriod.value;
        });
      }
      if (selectedGroup.value) {
        result = result.filter((cert) => cert.groupCode === selectedGroup.value);
      }
      return result;
    });
    async function loadCertificates() {
      loading.value = true;
      error.value = null;
      try {
        const data = await $fetch("/api/tg-app/certificates", {
          params: {
            organizationId: props.organizationId
          }
        });
        certificates.value = data.certificates || [];
      } catch (err) {
        console.error("Ошибка загрузки сертификатов:", err);
        error.value = err.data?.message || "Не удалось загрузить сертификаты";
      } finally {
        loading.value = false;
      }
    }
    watch(
      () => props.organizationId,
      (newId) => {
        if (newId) {
          loadCertificates();
        }
      },
      { immediate: true }
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "tg-certificates-tab" }, _attrs))} data-v-deaf5613>`);
      if (!__props.permissions?.can_view_certificates) {
        _push(`<div class="tg-no-permission" data-v-deaf5613><div class="tg-icon-wrapper" data-v-deaf5613><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-deaf5613><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" data-v-deaf5613></path></svg></div><h3 data-v-deaf5613>Нет доступа</h3><p data-v-deaf5613>У вас нет прав на просмотр сертификатов</p></div>`);
      } else {
        _push(`<div data-v-deaf5613><div class="tg-filters" data-v-deaf5613><div class="tg-search-wrapper" data-v-deaf5613><svg class="tg-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-deaf5613><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-deaf5613></path></svg><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="Поиск по имени студента..." class="tg-search-input" data-v-deaf5613></div><div class="tg-filter-row" data-v-deaf5613><select class="tg-select" data-v-deaf5613><option value="" data-v-deaf5613${ssrIncludeBooleanAttr(Array.isArray(selectedPeriod.value) ? ssrLooseContain(selectedPeriod.value, "") : ssrLooseEqual(selectedPeriod.value, "")) ? " selected" : ""}>Все периоды</option><!--[-->`);
        ssrRenderList(availablePeriods.value, (period) => {
          _push(`<option${ssrRenderAttr("value", period)} data-v-deaf5613${ssrIncludeBooleanAttr(Array.isArray(selectedPeriod.value) ? ssrLooseContain(selectedPeriod.value, period) : ssrLooseEqual(selectedPeriod.value, period)) ? " selected" : ""}>${ssrInterpolate(period)}</option>`);
        });
        _push(`<!--]--></select><select class="tg-select" data-v-deaf5613><option value="" data-v-deaf5613${ssrIncludeBooleanAttr(Array.isArray(selectedGroup.value) ? ssrLooseContain(selectedGroup.value, "") : ssrLooseEqual(selectedGroup.value, "")) ? " selected" : ""}>Все группы</option><!--[-->`);
        ssrRenderList(availableGroups.value, (group) => {
          _push(`<option${ssrRenderAttr("value", group)} data-v-deaf5613${ssrIncludeBooleanAttr(Array.isArray(selectedGroup.value) ? ssrLooseContain(selectedGroup.value, group) : ssrLooseEqual(selectedGroup.value, group)) ? " selected" : ""}>${ssrInterpolate(group)}</option>`);
        });
        _push(`<!--]--></select></div></div>`);
        if (loading.value) {
          _push(`<div class="tg-loading-block" data-v-deaf5613><div class="tg-spinner" data-v-deaf5613></div><p data-v-deaf5613>Загрузка сертификатов...</p></div>`);
        } else if (error.value) {
          _push(`<div class="tg-error-block" data-v-deaf5613><div class="tg-icon-wrapper" data-v-deaf5613><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-deaf5613><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-deaf5613></path></svg></div><p data-v-deaf5613>${ssrInterpolate(error.value)}</p><button class="tg-btn-retry" data-v-deaf5613> Повторить </button></div>`);
        } else if (filteredCertificates.value.length > 0) {
          _push(`<div data-v-deaf5613><div class="tg-list-header" data-v-deaf5613><div class="tg-header-info" data-v-deaf5613><h3 data-v-deaf5613>Сертификаты</h3><span class="tg-count" data-v-deaf5613>${ssrInterpolate(filteredCertificates.value.length)}</span></div>`);
          if (selectedGroup.value && filteredCertificates.value.length > 0) {
            _push(`<button${ssrIncludeBooleanAttr(downloadingZip.value) ? " disabled" : ""} class="tg-btn-zip" data-v-deaf5613>`);
            if (!downloadingZip.value) {
              _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-deaf5613><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" data-v-deaf5613></path></svg>`);
            } else {
              _push(`<div class="tg-spinner-small" data-v-deaf5613></div>`);
            }
            _push(`<span data-v-deaf5613>${ssrInterpolate(downloadingZip.value ? "Загрузка..." : "ZIP")}</span></button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="tg-table-wrapper" data-v-deaf5613><table class="tg-table" data-v-deaf5613><thead data-v-deaf5613><tr data-v-deaf5613><th style="${ssrRenderStyle({ "width": "80%" })}" data-v-deaf5613>Сертификат</th><th style="${ssrRenderStyle({ "width": "20%", "text-align": "center" })}" data-v-deaf5613>Действия</th></tr></thead><tbody data-v-deaf5613><!--[-->`);
          ssrRenderList(filteredCertificates.value, (cert, index2) => {
            _push(`<tr class="${ssrRenderClass({ revoked: cert.status === "revoked" })}" data-v-deaf5613><td class="tg-cell-info" data-v-deaf5613><div class="tg-student-name" data-v-deaf5613>${ssrInterpolate(cert.studentName)}</div><div class="tg-cert-details" data-v-deaf5613><span class="tg-course-name" data-v-deaf5613>${ssrInterpolate(cert.courseName)}</span></div><div class="tg-cert-meta" data-v-deaf5613><span class="tg-date" data-v-deaf5613>${ssrInterpolate(cert.issueDate)}</span><span class="tg-separator" data-v-deaf5613>•</span><span class="tg-group-badge-small" data-v-deaf5613>${ssrInterpolate(cert.groupCode)}</span></div></td><td class="tg-cell-actions" data-v-deaf5613>`);
            if (cert.pdfFileUrl && cert.status === "issued") {
              _push(`<button${ssrIncludeBooleanAttr(sendingCertId.value === cert.id) ? " disabled" : ""} class="tg-btn-send" title="Скачать (отправить в чат)" data-v-deaf5613>`);
              if (sendingCertId.value === cert.id) {
                _push(`<div class="tg-spinner-small" data-v-deaf5613></div>`);
              } else {
                _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-deaf5613><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" data-v-deaf5613></path></svg>`);
              }
              _push(`</button>`);
            } else if (cert.status === "revoked") {
              _push(`<span class="tg-revoked-badge" data-v-deaf5613> Отозван </span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</td></tr>`);
          });
          _push(`<!--]--></tbody></table></div></div>`);
        } else {
          _push(`<div class="tg-empty-state" data-v-deaf5613><div class="tg-icon-wrapper" data-v-deaf5613><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-deaf5613><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" data-v-deaf5613></path></svg></div><h3 data-v-deaf5613>Нет сертификатов</h3>`);
          if (searchQuery.value || selectedPeriod.value || selectedGroup.value) {
            _push(`<p data-v-deaf5613> Попробуйте изменить фильтры </p>`);
          } else {
            _push(`<p data-v-deaf5613>В данный момент нет выданных сертификатов</p>`);
          }
          _push(`</div>`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tg-app/CertificatesTab.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const CertificatesTab = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-deaf5613"]]);
const _sfc_main$5 = {
  __name: "TgAppCertificateAIUploadTab",
  __ssrInlineRender: true,
  props: {
    organizationId: {
      type: String,
      required: true
    },
    permissions: {
      type: Object,
      required: true
    },
    representative: {
      type: Object,
      default: null
    }
  },
  setup(__props) {
    const props = __props;
    const canUpload = computed(() => {
      return props.permissions?.can_request_certificates || props.permissions?.can_upload_certificates;
    });
    const step = ref(1);
    const files = ref([]);
    ref(null);
    const isDragging = ref(false);
    const uploading = ref(false);
    const uploadError = ref("");
    ref([]);
    const analysisProgress = ref(0);
    const analysisResults = ref([]);
    ref(false);
    const expandedItems = ref({});
    const selectedStudents = ref({});
    const confirming = ref(false);
    const confirmError = ref("");
    const importSuccess = ref(false);
    const successMessage = ref("");
    const validResults = computed(() => {
      return analysisResults.value.filter(
        (r) => r.success && !r.extractedData?._isDuplicate
      );
    });
    const duplicateResults = computed(() => {
      return analysisResults.value.filter(
        (r) => r.success && r.extractedData?._isDuplicate
      );
    });
    const errorResults = computed(() => {
      return analysisResults.value.filter((r) => !r.success);
    });
    const readyCount = computed(() => {
      return validResults.value.filter((r) => selectedStudents.value[r.fileId]).length;
    });
    const canConfirm = computed(() => {
      return readyCount.value > 0;
    });
    function getStepLabel(s) {
      const labels = ["Загрузка", "Анализ", "Проверка", "Импорт"];
      return labels[s - 1] || "";
    }
    function formatSize(bytes) {
      if (bytes < 1024) return bytes + " Б";
      if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " КБ";
      return (bytes / (1024 * 1024)).toFixed(1) + " МБ";
    }
    function getScoreClass(score) {
      if (score >= 90) return "tg-score-excellent";
      if (score >= 70) return "tg-score-good";
      if (score >= 50) return "tg-score-medium";
      return "tg-score-low";
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "tg-ai-upload-tab" }, _attrs))} data-v-495044bd>`);
      if (!canUpload.value) {
        _push(`<div class="tg-no-permission" data-v-495044bd><div class="tg-icon-wrapper" data-v-495044bd><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-495044bd><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" data-v-495044bd></path></svg></div><h3 data-v-495044bd>Нет доступа</h3><p data-v-495044bd>У вас нет прав на загрузку сертификатов</p></div>`);
      } else {
        _push(`<div data-v-495044bd>`);
        if (importSuccess.value) {
          _push(`<div class="tg-success-block" data-v-495044bd><div class="tg-success-icon" data-v-495044bd><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-495044bd><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-495044bd></path></svg></div><h3 data-v-495044bd>Сертификаты импортированы!</h3><p data-v-495044bd>${ssrInterpolate(successMessage.value)}</p><button class="tg-btn-primary" data-v-495044bd> Импортировать ещё </button></div>`);
        } else {
          _push(`<div data-v-495044bd><div class="tg-wizard-progress" data-v-495044bd><!--[-->`);
          ssrRenderList(4, (s) => {
            _push(`<div class="${ssrRenderClass([{
              active: step.value === s,
              completed: step.value > s
            }, "tg-wizard-step"])}" data-v-495044bd><span class="tg-step-number" data-v-495044bd>${ssrInterpolate(s)}</span><span class="tg-step-label" data-v-495044bd>${ssrInterpolate(getStepLabel(s))}</span></div>`);
          });
          _push(`<!--]--></div>`);
          if (step.value === 1) {
            _push(`<div class="tg-step-content" data-v-495044bd><h2 class="tg-step-title" data-v-495044bd>📤 Загрузка файлов</h2><p class="tg-step-subtitle" data-v-495044bd> Загрузите изображения сертификатов для распознавания </p><div class="${ssrRenderClass([{
              "tg-dragging": isDragging.value,
              "tg-has-files": files.value.length > 0
            }, "tg-upload-zone"])}" data-v-495044bd>`);
            if (files.value.length === 0) {
              _push(`<div class="tg-upload-placeholder" data-v-495044bd><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-495044bd><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" data-v-495044bd></path></svg><p class="tg-upload-text" data-v-495044bd>Нажмите для выбора файлов</p><p class="tg-upload-hint" data-v-495044bd>или перетащите сюда</p></div>`);
            } else {
              _push(`<div class="tg-files-preview" data-v-495044bd><!--[-->`);
              ssrRenderList(files.value, (file, index2) => {
                _push(`<div class="tg-file-item" data-v-495044bd>`);
                if (file.preview) {
                  _push(`<img${ssrRenderAttr("src", file.preview)} class="tg-file-thumb" alt="" data-v-495044bd>`);
                } else {
                  _push(`<div class="tg-file-icon" data-v-495044bd>📄</div>`);
                }
                _push(`<div class="tg-file-info" data-v-495044bd><span class="tg-file-name" data-v-495044bd>${ssrInterpolate(file.name)}</span><span class="tg-file-size" data-v-495044bd>${ssrInterpolate(formatSize(file.size))}</span></div><button type="button" class="tg-file-remove" data-v-495044bd> ✕ </button></div>`);
              });
              _push(`<!--]--></div>`);
            }
            _push(`</div><input type="file" accept="image/jpeg,image/png,application/pdf" multiple class="tg-hidden-input" data-v-495044bd><div class="tg-upload-info" data-v-495044bd><span class="tg-info-badge" data-v-495044bd>📄 До 10 файлов</span><span class="tg-info-badge" data-v-495044bd>📏 До 10 МБ каждый</span><span class="tg-info-badge" data-v-495044bd>📋 JPG, PNG, PDF</span></div>`);
            if (uploadError.value) {
              _push(`<div class="tg-error-message" data-v-495044bd>${ssrInterpolate(uploadError.value)}</div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<button class="tg-btn-primary"${ssrIncludeBooleanAttr(files.value.length === 0 || uploading.value) ? " disabled" : ""} data-v-495044bd>`);
            if (uploading.value) {
              _push(`<span class="tg-btn-spinner" data-v-495044bd></span>`);
            } else {
              _push(`<!--[--> Загрузить и анализировать (${ssrInterpolate(files.value.length)}) <!--]-->`);
            }
            _push(`</button></div>`);
          } else {
            _push(`<!---->`);
          }
          if (step.value === 2) {
            _push(`<div class="tg-step-content" data-v-495044bd><h2 class="tg-step-title" data-v-495044bd>🤖 AI Анализ</h2><p class="tg-step-subtitle" data-v-495044bd>Распознавание данных с сертификатов</p><div class="tg-analysis-progress" data-v-495044bd><div class="tg-progress-bar" data-v-495044bd><div class="tg-progress-fill" style="${ssrRenderStyle({ width: analysisProgress.value + "%" })}" data-v-495044bd></div></div><p class="tg-progress-text" data-v-495044bd>${ssrInterpolate(analysisProgress.value)}% — Обработка... </p></div><div class="tg-analysis-items" data-v-495044bd><!--[-->`);
            ssrRenderList(analysisResults.value, (item) => {
              _push(`<div class="${ssrRenderClass([{
                "tg-item-success": item.success,
                "tg-item-error": !item.success,
                "tg-item-duplicate": item.extractedData?._isDuplicate
              }, "tg-analysis-item"])}" data-v-495044bd><span class="tg-item-icon" data-v-495044bd>${ssrInterpolate(item.success ? item.extractedData?._isDuplicate ? "⚠️" : "✅" : "❌")}</span><span class="tg-item-name" data-v-495044bd>${ssrInterpolate(item.filename)}</span>`);
              if (item.extractedData?._isDuplicate) {
                _push(`<span class="tg-item-badge tg-badge-warning" data-v-495044bd> Дубликат </span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            });
            _push(`<!--]--></div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (step.value === 3) {
            _push(`<div class="tg-step-content" data-v-495044bd><h2 class="tg-step-title" data-v-495044bd>👥 Проверка данных</h2><p class="tg-step-subtitle" data-v-495044bd> Проверьте распознанные данные и выберите слушателей </p><div class="tg-results-list" data-v-495044bd><!--[-->`);
            ssrRenderList(validResults.value, (item, index2) => {
              _push(`<div class="${ssrRenderClass([{ "tg-card-expanded": expandedItems.value[item.fileId] }, "tg-result-card"])}" data-v-495044bd><div class="tg-card-header" data-v-495044bd><div class="tg-card-info" data-v-495044bd><h4 data-v-495044bd>${ssrInterpolate(item.extractedData?.fullName || "Имя не распознано")}</h4><p class="tg-card-meta" data-v-495044bd> № ${ssrInterpolate(item.extractedData?.certificateNumber || "—")}</p></div><div class="tg-card-status" data-v-495044bd>`);
              if (selectedStudents.value[item.fileId]) {
                _push(`<span class="tg-status-badge tg-status-ready" data-v-495044bd> ✓ Готов </span>`);
              } else {
                _push(`<span class="tg-status-badge tg-status-pending" data-v-495044bd> Выберите </span>`);
              }
              _push(`</div><span class="${ssrRenderClass([{ "tg-arrow-up": expandedItems.value[item.fileId] }, "tg-card-arrow"])}" data-v-495044bd> ▼ </span></div>`);
              if (expandedItems.value[item.fileId]) {
                _push(`<div class="tg-card-body" data-v-495044bd><div class="tg-extracted-data" data-v-495044bd><div class="tg-data-row" data-v-495044bd><span class="tg-data-label" data-v-495044bd>Курс:</span><span class="tg-data-value" data-v-495044bd>${ssrInterpolate(item.extractedData?.courseName || "Не распознано")}</span></div><div class="tg-data-row" data-v-495044bd><span class="tg-data-label" data-v-495044bd>Дата:</span><span class="tg-data-value" data-v-495044bd>${ssrInterpolate(item.extractedData?.issueDate || "Не распознано")}</span></div>`);
                if (item.extractedData?.issuingOrganization) {
                  _push(`<div class="tg-data-row" data-v-495044bd><span class="tg-data-label" data-v-495044bd>Центр:</span><span class="tg-data-value" data-v-495044bd>${ssrInterpolate(item.extractedData.issuingOrganization)}</span></div>`);
                } else {
                  _push(`<!---->`);
                }
                _push(`</div><div class="tg-student-select" data-v-495044bd><label class="tg-select-label" data-v-495044bd>Выберите слушателя:</label>`);
                if (item.matchResult?.topAlternatives?.length) {
                  _push(`<div class="tg-alternatives" data-v-495044bd><!--[-->`);
                  ssrRenderList(item.matchResult.topAlternatives.slice(0, 5), (alt, altIndex) => {
                    _push(`<div class="${ssrRenderClass([{
                      "tg-item-selected": selectedStudents.value[item.fileId] === alt.student.id
                    }, "tg-alternative-item"])}" data-v-495044bd><div class="tg-alt-radio" data-v-495044bd>`);
                    if (selectedStudents.value[item.fileId] === alt.student.id) {
                      _push(`<span data-v-495044bd>●</span>`);
                    } else {
                      _push(`<span data-v-495044bd>○</span>`);
                    }
                    _push(`</div><div class="tg-alt-info" data-v-495044bd><span class="tg-alt-name" data-v-495044bd>${ssrInterpolate(alt.student.fullName)}</span><span class="tg-alt-position" data-v-495044bd>${ssrInterpolate(alt.student.position)}</span></div><div class="tg-alt-score" data-v-495044bd><span class="${ssrRenderClass([getScoreClass(alt.matchScore), "tg-score-badge"])}" data-v-495044bd>${ssrInterpolate(Math.round(alt.matchScore))}% </span>`);
                    if (altIndex === 0) {
                      _push(`<span class="tg-best-match" data-v-495044bd>🏆</span>`);
                    } else {
                      _push(`<!---->`);
                    }
                    _push(`</div></div>`);
                  });
                  _push(`<!--]--></div>`);
                } else {
                  _push(`<div class="tg-no-matches" data-v-495044bd><p data-v-495044bd>Совпадений не найдено</p><p class="tg-hint" data-v-495044bd> Проверьте, что слушатель добавлен в вашу организацию </p></div>`);
                }
                _push(`</div></div>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            });
            _push(`<!--]--></div>`);
            if (duplicateResults.value.length > 0) {
              _push(`<div class="tg-duplicates-section" data-v-495044bd><h4 class="tg-section-title" data-v-495044bd>⚠️ Дубликаты (будут пропущены)</h4><div class="tg-duplicate-list" data-v-495044bd><!--[-->`);
              ssrRenderList(duplicateResults.value, (dup) => {
                _push(`<div class="tg-duplicate-item" data-v-495044bd><span class="tg-dup-name" data-v-495044bd>${ssrInterpolate(dup.filename)}</span><span class="tg-dup-reason" data-v-495044bd>${ssrInterpolate(dup.extractedData?._duplicateInfo)}</span></div>`);
              });
              _push(`<!--]--></div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<div class="tg-step-actions" data-v-495044bd><button class="tg-btn-secondary" data-v-495044bd>← Назад</button><button class="tg-btn-primary"${ssrIncludeBooleanAttr(!canConfirm.value) ? " disabled" : ""} data-v-495044bd> Подтвердить (${ssrInterpolate(readyCount.value)}) </button></div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (step.value === 4) {
            _push(`<div class="tg-step-content" data-v-495044bd><h2 class="tg-step-title" data-v-495044bd>✅ Подтверждение</h2><p class="tg-step-subtitle" data-v-495044bd>Проверьте и подтвердите импорт</p><div class="tg-confirm-summary" data-v-495044bd><div class="tg-summary-card" data-v-495044bd><span class="tg-summary-value" data-v-495044bd>${ssrInterpolate(readyCount.value)}</span><span class="tg-summary-label" data-v-495044bd>К импорту</span></div><div class="tg-summary-card tg-card-warning" data-v-495044bd><span class="tg-summary-value" data-v-495044bd>${ssrInterpolate(duplicateResults.value.length)}</span><span class="tg-summary-label" data-v-495044bd>Дубликатов</span></div><div class="tg-summary-card tg-card-error" data-v-495044bd><span class="tg-summary-value" data-v-495044bd>${ssrInterpolate(errorResults.value.length)}</span><span class="tg-summary-label" data-v-495044bd>Ошибок</span></div></div>`);
            if (confirmError.value) {
              _push(`<div class="tg-error-message" data-v-495044bd>${ssrInterpolate(confirmError.value)}</div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<div class="tg-step-actions" data-v-495044bd><button class="tg-btn-secondary" data-v-495044bd>← Назад</button><button class="tg-btn-primary tg-btn-success"${ssrIncludeBooleanAttr(confirming.value || readyCount.value === 0) ? " disabled" : ""} data-v-495044bd>`);
            if (confirming.value) {
              _push(`<span class="tg-btn-spinner" data-v-495044bd></span>`);
            } else {
              _push(`<!--[--> Импортировать ${ssrInterpolate(readyCount.value)} сертификатов <!--]-->`);
            }
            _push(`</button></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tg-app/CertificateAIUploadTab.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const CertificateAIUploadTab = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-495044bd"]]);
const _sfc_main$4 = {
  __name: "TgAppCertificateManualUploadTab",
  __ssrInlineRender: true,
  props: {
    organizationId: {
      type: String,
      required: true
    },
    permissions: {
      type: Object,
      required: true
    },
    representative: {
      type: Object,
      default: null
    }
  },
  setup(__props) {
    const props = __props;
    const canUpload = computed(() => {
      return props.permissions?.can_request_certificates || props.permissions?.can_upload_certificates;
    });
    const form = ref({
      certificateNumber: "",
      courseName: "",
      issueDate: "",
      expiryDate: "",
      issuingOrganization: "",
      courseHours: "",
      notes: ""
    });
    const errors = ref({});
    const submitting = ref(false);
    const submitError = ref("");
    const uploadSuccess = ref(false);
    const successMessage = ref("");
    const showExtra = ref(false);
    const studentSearch = ref("");
    const studentResults = ref([]);
    const selectedStudent = ref(null);
    const searchingStudents = ref(false);
    const showStudentDropdown = ref(false);
    function getInitials(fullName) {
      if (!fullName) return "?";
      const parts = fullName.trim().split(" ");
      if (parts.length >= 2) {
        return parts[0][0] + parts[1][0];
      }
      return fullName[0];
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "tg-upload-tab" }, _attrs))} data-v-432ee6a6>`);
      if (!canUpload.value) {
        _push(`<div class="tg-no-permission" data-v-432ee6a6><div class="tg-icon-wrapper" data-v-432ee6a6><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-432ee6a6><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" data-v-432ee6a6></path></svg></div><h3 data-v-432ee6a6>Нет доступа</h3><p data-v-432ee6a6>У вас нет прав на загрузку сертификатов</p></div>`);
      } else {
        _push(`<div data-v-432ee6a6>`);
        if (uploadSuccess.value) {
          _push(`<div class="tg-success-block" data-v-432ee6a6><div class="tg-success-icon" data-v-432ee6a6><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-432ee6a6><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-432ee6a6></path></svg></div><h3 data-v-432ee6a6>Сертификат загружен!</h3><p data-v-432ee6a6>${ssrInterpolate(successMessage.value)}</p><button class="tg-btn-primary" data-v-432ee6a6>Загрузить ещё</button></div>`);
        } else {
          _push(`<form class="tg-upload-form" data-v-432ee6a6><h2 class="tg-form-title" data-v-432ee6a6>📜 Загрузка сертификата</h2><p class="tg-form-subtitle" data-v-432ee6a6> Добавьте сертификат для слушателя вашей организации </p><div class="tg-form-group" data-v-432ee6a6><label class="tg-label" data-v-432ee6a6>Слушатель *</label><div class="tg-autocomplete" data-v-432ee6a6><div class="tg-search-input-wrapper" data-v-432ee6a6><input${ssrRenderAttr("value", studentSearch.value)} type="text" placeholder="Введите имя слушателя..." class="${ssrRenderClass([{ "tg-input-error": errors.value.studentId }, "tg-input"])}" data-v-432ee6a6>`);
          if (searchingStudents.value) {
            _push(`<div class="tg-input-spinner" data-v-432ee6a6></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (showStudentDropdown.value && studentResults.value.length > 0) {
            _push(`<div class="tg-dropdown" data-v-432ee6a6><!--[-->`);
            ssrRenderList(studentResults.value, (student) => {
              _push(`<div class="tg-dropdown-item" data-v-432ee6a6><div class="tg-dropdown-avatar" data-v-432ee6a6>${ssrInterpolate(getInitials(student.fullName))}</div><div class="tg-dropdown-info" data-v-432ee6a6><span class="tg-dropdown-name" data-v-432ee6a6>${ssrInterpolate(student.fullName)}</span><span class="tg-dropdown-meta" data-v-432ee6a6>${ssrInterpolate(student.position)}</span></div>`);
              if (student.certificatesCount > 0) {
                _push(`<span class="tg-dropdown-badge" data-v-432ee6a6> 📜 ${ssrInterpolate(student.certificatesCount)}</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          if (selectedStudent.value) {
            _push(`<div class="tg-selected-student" data-v-432ee6a6><div class="tg-selected-avatar" data-v-432ee6a6>${ssrInterpolate(getInitials(selectedStudent.value.fullName))}</div><div class="tg-selected-info" data-v-432ee6a6><span class="tg-selected-name" data-v-432ee6a6>${ssrInterpolate(selectedStudent.value.fullName)}</span><span class="tg-selected-meta" data-v-432ee6a6>${ssrInterpolate(selectedStudent.value.position)}</span></div><button type="button" class="tg-btn-clear" data-v-432ee6a6><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-432ee6a6><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-432ee6a6></path></svg></button></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (errors.value.studentId) {
            _push(`<span class="tg-error-text" data-v-432ee6a6>${ssrInterpolate(errors.value.studentId)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="tg-form-group" data-v-432ee6a6><label class="tg-label" data-v-432ee6a6>Номер сертификата *</label><input${ssrRenderAttr("value", form.value.certificateNumber)} type="text" placeholder="Например: ATC25_001" class="${ssrRenderClass([{ "tg-input-error": errors.value.certificateNumber }, "tg-input"])}" data-v-432ee6a6>`);
          if (errors.value.certificateNumber) {
            _push(`<span class="tg-error-text" data-v-432ee6a6>${ssrInterpolate(errors.value.certificateNumber)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="tg-form-group" data-v-432ee6a6><label class="tg-label" data-v-432ee6a6>Название курса *</label><input${ssrRenderAttr("value", form.value.courseName)} type="text" placeholder="Например: Авиационная безопасность" class="${ssrRenderClass([{ "tg-input-error": errors.value.courseName }, "tg-input"])}" data-v-432ee6a6>`);
          if (errors.value.courseName) {
            _push(`<span class="tg-error-text" data-v-432ee6a6>${ssrInterpolate(errors.value.courseName)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="tg-form-row" data-v-432ee6a6><div class="tg-form-group tg-form-half" data-v-432ee6a6><label class="tg-label" data-v-432ee6a6>Дата выдачи *</label><input${ssrRenderAttr("value", form.value.issueDate)} type="date" class="${ssrRenderClass([{ "tg-input-error": errors.value.issueDate }, "tg-input"])}" data-v-432ee6a6>`);
          if (errors.value.issueDate) {
            _push(`<span class="tg-error-text" data-v-432ee6a6>${ssrInterpolate(errors.value.issueDate)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="tg-form-group tg-form-half" data-v-432ee6a6><label class="tg-label" data-v-432ee6a6>Срок действия</label><input${ssrRenderAttr("value", form.value.expiryDate)} type="date" class="tg-input" data-v-432ee6a6></div></div><div class="tg-collapsible" data-v-432ee6a6><button type="button" class="tg-collapsible-header" data-v-432ee6a6><span data-v-432ee6a6>Дополнительные данные</span><svg class="${ssrRenderClass([{ "tg-rotated": showExtra.value }, "w-4 h-4"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-432ee6a6><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" data-v-432ee6a6></path></svg></button>`);
          if (showExtra.value) {
            _push(`<div class="tg-collapsible-content" data-v-432ee6a6><div class="tg-form-group" data-v-432ee6a6><label class="tg-label" data-v-432ee6a6>Учебный центр</label><input${ssrRenderAttr("value", form.value.issuingOrganization)} type="text" placeholder="Организация, выдавшая сертификат" class="tg-input" data-v-432ee6a6></div><div class="tg-form-group" data-v-432ee6a6><label class="tg-label" data-v-432ee6a6>Количество часов</label><input${ssrRenderAttr("value", form.value.courseHours)} type="number" placeholder="72" min="1" class="tg-input" data-v-432ee6a6></div><div class="tg-form-group" data-v-432ee6a6><label class="tg-label" data-v-432ee6a6>Примечания</label><textarea placeholder="Дополнительная информация..." rows="2" class="tg-input tg-textarea" data-v-432ee6a6>${ssrInterpolate(form.value.notes)}</textarea></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (submitError.value) {
            _push(`<div class="tg-submit-error" data-v-432ee6a6><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-432ee6a6><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-432ee6a6></path></svg><span data-v-432ee6a6>${ssrInterpolate(submitError.value)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button type="submit" class="tg-btn-submit"${ssrIncludeBooleanAttr(submitting.value) ? " disabled" : ""} data-v-432ee6a6>`);
          if (submitting.value) {
            _push(`<div class="tg-btn-spinner" data-v-432ee6a6></div>`);
          } else {
            _push(`<!--[--><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-432ee6a6><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" data-v-432ee6a6></path></svg> Загрузить сертификат <!--]-->`);
          }
          _push(`</button></form>`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tg-app/CertificateManualUploadTab.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const CertificateManualUploadTab = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-432ee6a6"]]);
const _sfc_main$3 = {
  __name: "TgAppCertificateUploadWrapper",
  __ssrInlineRender: true,
  props: {
    organizationId: {
      type: String,
      required: true
    },
    permissions: {
      type: Object,
      required: true
    },
    representative: {
      type: Object,
      default: null
    }
  },
  setup(__props) {
    const mode = ref("ai");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "tg-upload-wrapper" }, _attrs))} data-v-6517c544><div class="tg-mode-switch" data-v-6517c544><button class="${ssrRenderClass([{ active: mode.value === "ai" }, "tg-mode-btn"])}" data-v-6517c544><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-6517c544><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" data-v-6517c544></path></svg><span class="tg-mode-label" data-v-6517c544>AI импорт</span><span class="tg-mode-badge" data-v-6517c544>Новое</span></button><button class="${ssrRenderClass([{ active: mode.value === "manual" }, "tg-mode-btn"])}" data-v-6517c544><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-6517c544><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" data-v-6517c544></path></svg><span class="tg-mode-label" data-v-6517c544>Вручную</span></button></div>`);
      if (mode.value === "ai") {
        _push(ssrRenderComponent(CertificateAIUploadTab, {
          "organization-id": __props.organizationId,
          permissions: __props.permissions,
          representative: __props.representative
        }, null, _parent));
      } else {
        _push(ssrRenderComponent(CertificateManualUploadTab, {
          "organization-id": __props.organizationId,
          permissions: __props.permissions,
          representative: __props.representative
        }, null, _parent));
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tg-app/CertificateUploadWrapper.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const CertificateUploadWrapper = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-6517c544"]]);
const _sfc_main$2 = {
  __name: "TgAppCertificateUploadTab",
  __ssrInlineRender: true,
  props: {
    organizationId: {
      type: String,
      required: true
    },
    permissions: {
      type: Object,
      required: true
    },
    representative: {
      type: Object,
      default: null
    }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(CertificateUploadWrapper, mergeProps({
        "organization-id": __props.organizationId,
        permissions: __props.permissions,
        representative: __props.representative
      }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tg-app/CertificateUploadTab.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "TgAppSettingsTab",
  __ssrInlineRender: true,
  props: {
    representative: {
      type: Object,
      required: true
    }
  },
  setup(__props) {
    function getStatusLabel(status) {
      const labels = {
        pending: "На рассмотрении",
        approved: "Активен",
        blocked: "Заблокирован"
      };
      return labels[status] || status;
    }
    function formatDate(date) {
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "tg-settings-tab" }, _attrs))} data-v-cc19062b><div class="tg-settings-section" data-v-cc19062b><h3 class="tg-section-title" data-v-cc19062b>Профиль</h3><div class="tg-settings-card" data-v-cc19062b><div class="tg-setting-item" data-v-cc19062b><span class="tg-setting-label" data-v-cc19062b>ФИО</span><span class="tg-setting-value" data-v-cc19062b>${ssrInterpolate(__props.representative.fullName)}</span></div><div class="tg-setting-item" data-v-cc19062b><span class="tg-setting-label" data-v-cc19062b>Телефон</span><span class="tg-setting-value" data-v-cc19062b>${ssrInterpolate(__props.representative.phone)}</span></div><div class="tg-setting-item" data-v-cc19062b><span class="tg-setting-label" data-v-cc19062b>Организация</span><span class="tg-setting-value" data-v-cc19062b>${ssrInterpolate(__props.representative.organizationName)}</span></div><div class="tg-setting-item" data-v-cc19062b><span class="tg-setting-label" data-v-cc19062b>Статус</span><span class="${ssrRenderClass([`tg-status-${__props.representative.status}`, "tg-setting-value"])}" data-v-cc19062b>${ssrInterpolate(getStatusLabel(__props.representative.status))}</span></div>`);
      if (__props.representative.telegramUsername) {
        _push(`<div class="tg-setting-item" data-v-cc19062b><span class="tg-setting-label" data-v-cc19062b>Telegram</span><span class="tg-setting-value" data-v-cc19062b>@${ssrInterpolate(__props.representative.telegramUsername)}</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="tg-settings-section" data-v-cc19062b><h3 class="tg-section-title" data-v-cc19062b>Права доступа</h3><div class="tg-settings-card" data-v-cc19062b><div class="tg-permission-item" data-v-cc19062b><div class="${ssrRenderClass([{
        "tg-active": __props.representative.permissions?.can_view_students
      }, "tg-permission-icon"])}" data-v-cc19062b><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-cc19062b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" data-v-cc19062b></path></svg></div><span class="tg-permission-label" data-v-cc19062b>Просмотр слушателей</span><div class="tg-permission-status" data-v-cc19062b>`);
      if (__props.representative.permissions?.can_view_students) {
        _push(`<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-cc19062b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" data-v-cc19062b></path></svg>`);
      } else {
        _push(`<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-cc19062b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-cc19062b></path></svg>`);
      }
      _push(`</div></div><div class="tg-permission-item" data-v-cc19062b><div class="${ssrRenderClass([{
        "tg-active": __props.representative.permissions?.can_view_schedule
      }, "tg-permission-icon"])}" data-v-cc19062b><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-cc19062b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" data-v-cc19062b></path></svg></div><span class="tg-permission-label" data-v-cc19062b>Просмотр расписания</span><div class="tg-permission-status" data-v-cc19062b>`);
      if (__props.representative.permissions?.can_view_schedule) {
        _push(`<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-cc19062b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" data-v-cc19062b></path></svg>`);
      } else {
        _push(`<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-cc19062b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-cc19062b></path></svg>`);
      }
      _push(`</div></div><div class="tg-permission-item" data-v-cc19062b><div class="${ssrRenderClass([{
        "tg-active": __props.representative.permissions?.can_view_certificates
      }, "tg-permission-icon"])}" data-v-cc19062b><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-cc19062b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-v-cc19062b></path></svg></div><span class="tg-permission-label" data-v-cc19062b>Просмотр сертификатов</span><div class="tg-permission-status" data-v-cc19062b>`);
      if (__props.representative.permissions?.can_view_certificates) {
        _push(`<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-cc19062b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" data-v-cc19062b></path></svg>`);
      } else {
        _push(`<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-cc19062b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-cc19062b></path></svg>`);
      }
      _push(`</div></div></div></div><div class="tg-settings-section" data-v-cc19062b><h3 class="tg-section-title" data-v-cc19062b>О приложении</h3><div class="tg-settings-card" data-v-cc19062b><div class="tg-about-item" data-v-cc19062b><h4 data-v-cc19062b>АТЦ Платформа</h4><p data-v-cc19062b>Система управления учебным процессом</p></div><div class="tg-about-item" data-v-cc19062b><span class="tg-about-label" data-v-cc19062b>Версия</span><span class="tg-about-value" data-v-cc19062b>1.0.0</span></div><div class="tg-about-item" data-v-cc19062b><span class="tg-about-label" data-v-cc19062b>Последнее обновление</span><span class="tg-about-value" data-v-cc19062b>${ssrInterpolate(formatDate(/* @__PURE__ */ new Date()))}</span></div></div></div><div class="tg-settings-section" data-v-cc19062b><button class="tg-action-btn primary" data-v-cc19062b><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-cc19062b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-cc19062b></path></svg><span data-v-cc19062b>Обновить данные</span></button><button class="tg-action-btn secondary" data-v-cc19062b><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-cc19062b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" data-v-cc19062b></path></svg><span data-v-cc19062b>Написать в поддержку</span></button></div><div class="tg-copyright" data-v-cc19062b><p data-v-cc19062b>© 2026 АТЦ Платформа</p><p class="tg-copyright-sub" data-v-cc19062b>Все права защищены</p></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tg-app/SettingsTab.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const SettingsTab = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-cc19062b"]]);
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      script: [
        {
          src: "https://telegram.org/js/telegram-web-app.js",
          onload: () => {
            console.log("TG SDK Loaded");
            setTimeout(initialize, 100);
          },
          defer: true
        }
      ]
    });
    const icons = {
      students: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`,
      schedule: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
      certificates: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>`,
      upload: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>`,
      settings: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>`
    };
    const state = ref("loading");
    const statusMessage = ref("Инициализация...");
    const errorMessage = ref("");
    const showDebug = ref(false);
    const telegramData = ref(null);
    const representative = ref(null);
    const activeTab = ref("students");
    const debugInfo = ref("");
    function parseInitDataFromHash(hash) {
      try {
        console.log("[TG] Parsing hash, length:", hash.length);
        const cleanHash = hash.startsWith("#") ? hash.substring(1) : hash;
        console.log("[TG] Clean hash (first 300):", cleanHash.substring(0, 300));
        const tgWebAppDataMatch = cleanHash.match(
          /tgWebAppData=([^&]*(?:&(?!tgWebApp)[^&]*)*)/
        );
        if (!tgWebAppDataMatch) {
          console.warn("[TG] No tgWebAppData found in hash");
          return null;
        }
        let initData = tgWebAppDataMatch[1];
        console.log("[TG] Extracted tgWebAppData length:", initData.length);
        console.log(
          "[TG] Extracted tgWebAppData (first 300):",
          initData.substring(0, 300)
        );
        const hashParams = new URLSearchParams(cleanHash);
        const importantParams = ["auth_date", "hash", "signature"];
        importantParams.forEach((param) => {
          const value = hashParams.get(param);
          if (value && !initData.includes(`${param}=`)) {
            console.log(
              `[TG] Adding ${param} from hash:`,
              value.substring(0, 20) + "..."
            );
            initData += `&${param}=${value}`;
          }
        });
        console.log("[TG] Final initData length:", initData.length);
        console.log("[TG] Final initData (first 300):", initData.substring(0, 300));
        const hasUser = initData.includes("user=");
        const hasHash = initData.includes("hash=");
        const hasAuthDate = initData.includes("auth_date=");
        console.log("[TG] Validation:", { hasUser, hasHash, hasAuthDate });
        if (!hasUser || !hasHash) {
          console.error("[TG] Missing required parameters in initData");
          return null;
        }
        return initData;
      } catch (error) {
        console.error("[TG] Error parsing hash:", error);
        return null;
      }
    }
    async function initialize() {
      state.value = "init";
      statusMessage.value = "Подключение к Telegram...";
      try {
        const tg = (void 0).Telegram?.WebApp;
        if (!tg) {
          throw new Error("Telegram WebApp не найден. Откройте через Telegram.");
        }
        tg.expand();
        let rawInitData = tg.initData || "";
        console.log(
          "[TG] SDK initData:",
          rawInitData ? `length ${rawInitData.length}` : "empty"
        );
        if ((!rawInitData || rawInitData.length < 50) && (void 0).location.hash) {
          console.warn(
            "[TG] SDK initData пуст или слишком короткий, парсим из hash..."
          );
          const parsedData = parseInitDataFromHash((void 0).location.hash);
          if (parsedData && parsedData.length > 50) {
            rawInitData = parsedData;
            console.log("[TG] ✅ initData успешно извлечен из hash");
            console.log("[TG] initData length:", rawInitData.length);
            console.log("[TG] initData sample:", rawInitData.substring(0, 150));
          } else {
            console.error("[TG] ❌ Не удалось извлечь initData из hash");
          }
        }
        const platform = tg.platform || "unknown";
        updateDebugInfo(tg, rawInitData);
        if (!rawInitData) {
          throw new Error("Отсутствуют данные авторизации (initData пуст).");
        }
        let userData = tg.initDataUnsafe?.user || null;
        if (!userData && rawInitData) {
          try {
            const params = new URLSearchParams(rawInitData);
            const userStr = params.get("user");
            if (userStr) {
              userData = JSON.parse(decodeURIComponent(userStr));
            }
          } catch (e) {
            console.warn("[TG] Could not parse user from initData:", e);
          }
        }
        telegramData.value = {
          initData: rawInitData,
          user: userData || {}
        };
        await checkAuth();
      } catch (e) {
        console.error("Init Error:", e);
        state.value = "error";
        errorMessage.value = e.message;
      }
    }
    async function checkAuth() {
      state.value = "loading";
      statusMessage.value = "Проверка доступа...";
      try {
        const payload = {
          initData: telegramData.value.initData
        };
        console.log(
          "[TG Client] Sending Auth with initData length:",
          payload.initData.length
        );
        const res = await $fetch("/api/tg-app/auth", {
          method: "POST",
          body: payload
        });
        if (res.representative) {
          representative.value = res.representative;
          state.value = "ready";
        }
      } catch (e) {
        console.error("Auth Failed:", e);
        console.log("Error statusCode:", e.statusCode);
        console.log("Error data:", e.data);
        if (e.statusCode === 404) {
          console.log("[TG] ✅ Пользователь не найден, переход к регистрации");
          state.value = "registration";
        } else {
          console.error("[TG] ❌ Ошибка авторизации, показ экрана ошибки");
          state.value = "error";
          errorMessage.value = e.data?.message || e.message || "Ошибка соединения с сервером";
        }
      }
    }
    function updateDebugInfo(tg, parsedInitData) {
      let extractedUser = null;
      if (parsedInitData) {
        try {
          const params = new URLSearchParams(parsedInitData);
          const userStr = params.get("user");
          if (userStr) {
            extractedUser = JSON.parse(decodeURIComponent(userStr));
          }
        } catch (e) {
          console.warn("[TG] Could not extract user from parsedInitData:", e);
        }
      }
      debugInfo.value = JSON.stringify(
        {
          version: tg.version,
          platform: tg.platform,
          locationHash: (void 0).location.hash.substring(0, 300) + "...",
          locationSearch: (void 0).location.search,
          sdkInitDataLen: tg.initData?.length || 0,
          parsedInitDataLen: parsedInitData?.length || 0,
          initDataSample: parsedInitData ? parsedInitData.substring(0, 150) + "..." : "empty",
          sdkUser: tg.initDataUnsafe?.user,
          extractedUser,
          hasHash: parsedInitData?.includes("hash=") || false,
          hasAuthDate: parsedInitData?.includes("auth_date=") || false,
          hasUser: parsedInitData?.includes("user=") || false
        },
        null,
        2
      );
    }
    function onRegistered(data) {
      representative.value = data.representative;
      state.value = "ready";
    }
    function getInitials(name) {
      return name ? name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() : "?";
    }
    function getStatusLabel(status) {
      const map = { pending: "Ожидание", approved: "Активен", blocked: "Блок" };
      return map[status] || status;
    }
    const activeTabComponent = computed(() => {
      switch (activeTab.value) {
        case "students":
          return StudentsTab;
        case "schedule":
          return ScheduleTab;
        case "certificates":
          return CertificatesTab;
        case "upload":
          return _sfc_main$2;
        case "settings":
          return SettingsTab;
        default:
          return StudentsTab;
      }
    });
    const availableTabs = computed(() => {
      if (!representative.value) return [];
      const p = representative.value.permissions || {};
      const list = [];
      if (p.can_view_students)
        list.push({ id: "students", label: "Студенты", icon: icons.students });
      if (p.can_view_schedule)
        list.push({ id: "schedule", label: "Расписание", icon: icons.schedule });
      if (p.can_view_certificates)
        list.push({
          id: "certificates",
          label: "Сертификаты",
          icon: icons.certificates
        });
      if (p.can_request_certificates || p.can_upload_certificates)
        list.push({
          id: "upload",
          label: "Загрузить",
          icon: icons.upload
        });
      list.push({ id: "settings", label: "Меню", icon: icons.settings });
      return list;
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "tg-app-root" }, _attrs))} data-v-109a7c8b>`);
      if (state.value === "loading" || state.value === "init") {
        _push(`<div class="tg-loading" data-v-109a7c8b><div class="tg-spinner" data-v-109a7c8b></div><p data-v-109a7c8b>Загрузка...</p><small data-v-109a7c8b>${ssrInterpolate(statusMessage.value)}</small></div>`);
      } else if (state.value === "error") {
        _push(`<div class="tg-auth-error" data-v-109a7c8b><div class="tg-error-icon" data-v-109a7c8b><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-109a7c8b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-109a7c8b></path></svg></div><h2 data-v-109a7c8b>Ошибка доступа</h2><p data-v-109a7c8b>${ssrInterpolate(errorMessage.value)}</p><div class="tg-actions" data-v-109a7c8b><button class="tg-btn-primary" data-v-109a7c8b><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-109a7c8b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-109a7c8b></path></svg> Повторить </button><button class="tg-btn-secondary" data-v-109a7c8b>${ssrInterpolate(showDebug.value ? "Скрыть детали" : "Детали ошибки")}</button></div>`);
        if (showDebug.value) {
          _push(`<div class="tg-debug-info" data-v-109a7c8b><h3 data-v-109a7c8b>Debug Info:</h3><pre data-v-109a7c8b>${ssrInterpolate(debugInfo.value)}</pre></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else if (state.value === "registration") {
        _push(`<div class="tg-registration" data-v-109a7c8b><div class="tg-welcome" data-v-109a7c8b><div class="tg-logo" data-v-109a7c8b><img${ssrRenderAttr("src", _imports_0)} alt="Logo" data-v-109a7c8b></div><h1 data-v-109a7c8b>Добро пожаловать</h1><p data-v-109a7c8b>Для продолжения заполните форму</p></div>`);
        _push(ssrRenderComponent(RegistrationForm, {
          "telegram-data": telegramData.value,
          onRegistered
        }, null, _parent));
        _push(`</div>`);
      } else if (state.value === "ready") {
        _push(`<div class="tg-main-app" data-v-109a7c8b><header class="tg-header" data-v-109a7c8b><div class="tg-header-content" data-v-109a7c8b><div class="tg-user-info" data-v-109a7c8b><div class="tg-avatar" data-v-109a7c8b>${ssrInterpolate(getInitials(representative.value?.fullName))}</div><div class="tg-user-details" data-v-109a7c8b><h3 data-v-109a7c8b>${ssrInterpolate(representative.value?.fullName)}</h3><p data-v-109a7c8b>${ssrInterpolate(representative.value?.organizationName)}</p></div></div><div class="${ssrRenderClass([`tg-status-${representative.value?.status}`, "tg-status"])}" data-v-109a7c8b>${ssrInterpolate(getStatusLabel(representative.value?.status))}</div></div></header>`);
        if (representative.value?.status === "pending") {
          _push(`<div class="tg-pending-notice" data-v-109a7c8b><div class="tg-notice-icon" data-v-109a7c8b><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-109a7c8b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" data-v-109a7c8b></path></svg></div><h3 data-v-109a7c8b>Заявка на рассмотрении</h3><p data-v-109a7c8b>Ожидайте подтверждения от администратора.</p></div>`);
        } else if (representative.value?.status === "blocked") {
          _push(`<div class="tg-blocked-notice" data-v-109a7c8b><div class="tg-notice-icon" data-v-109a7c8b><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-109a7c8b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" data-v-109a7c8b></path></svg></div><h3 data-v-109a7c8b>Доступ ограничен</h3><p data-v-109a7c8b>${ssrInterpolate(representative.value?.blockedReason || "Аккаунт заблокирован")}</p></div>`);
        } else if (representative.value?.status === "approved") {
          _push(`<div class="tg-content" data-v-109a7c8b>`);
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(activeTabComponent.value), {
            "organization-id": representative.value.organizationId,
            permissions: representative.value.permissions,
            representative: representative.value
          }, null), _parent);
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if (representative.value?.status === "approved") {
          _push(`<nav class="tg-nav" data-v-109a7c8b><!--[-->`);
          ssrRenderList(availableTabs.value, (tab) => {
            _push(`<button class="${ssrRenderClass(["tg-nav-btn", { active: activeTab.value === tab.id }])}" data-v-109a7c8b><span class="tg-nav-icon" data-v-109a7c8b>${tab.icon ?? ""}</span><span class="tg-nav-label" data-v-109a7c8b>${ssrInterpolate(tab.label)}</span></button>`);
          });
          _push(`<!--]--></nav>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/tg-app/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-109a7c8b"]]);

export { index as default };
//# sourceMappingURL=index-CMIkXg11.mjs.map
