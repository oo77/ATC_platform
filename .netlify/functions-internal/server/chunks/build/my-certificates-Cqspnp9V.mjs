import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
import { u as useHead } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "my-certificates",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Мои сертификаты"
    });
    useAuthFetch();
    const loading = ref(true);
    const certificates = ref([]);
    const filterStatus = ref("");
    const filterPeriod = ref("");
    const availablePeriods = computed(() => {
      const periods = /* @__PURE__ */ new Set();
      certificates.value.forEach((cert) => {
        const date = new Date(cert.issuedAt);
        const period = `${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
        periods.add(period);
      });
      return Array.from(periods).sort().reverse();
    });
    const filteredCertificates = computed(() => {
      let result = [...certificates.value];
      if (filterStatus.value) {
        result = result.filter((c) => c.status === filterStatus.value);
      }
      if (filterPeriod.value) {
        const [month, year] = filterPeriod.value.split(".").map(Number);
        result = result.filter((c) => {
          const date = new Date(c.issuedAt);
          return date.getMonth() + 1 === month && date.getFullYear() === year;
        });
      }
      return result;
    });
    const validCount = computed(() => {
      return certificates.value.filter((c) => c.status === "issued" && !isExpired(c)).length;
    });
    const expiredCount = computed(() => {
      return certificates.value.filter((c) => c.status === "issued" && isExpired(c)).length;
    });
    const revokedCount = computed(() => {
      return certificates.value.filter((c) => c.status === "revoked").length;
    });
    const formatDate = (dateStr) => {
      if (!dateStr) return "—";
      const date = new Date(dateStr);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    };
    const isExpired = (cert) => {
      if (!cert.expiresAt) return false;
      return new Date(cert.expiresAt) < /* @__PURE__ */ new Date();
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Мои сертификаты </h2><p class="mt-1 text-gray-500 dark:text-gray-400"> Просмотр и скачивание полученных сертификатов </p></div>`);
      if (unref(loading)) {
        _push(`<div class="flex justify-center items-center py-20"><div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else {
        _push(`<!--[--><div class="mb-6 flex flex-wrap gap-4"><div class="flex items-center gap-2"><label class="text-sm text-gray-600 dark:text-gray-400">Статус:</label><select class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "") : ssrLooseEqual(unref(filterStatus), "")) ? " selected" : ""}>Все</option><option value="issued"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "issued") : ssrLooseEqual(unref(filterStatus), "issued")) ? " selected" : ""}>Выданные</option><option value="revoked"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "revoked") : ssrLooseEqual(unref(filterStatus), "revoked")) ? " selected" : ""}>Отозванные</option></select></div><div class="flex items-center gap-2"><label class="text-sm text-gray-600 dark:text-gray-400">Период:</label><select class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(filterPeriod)) ? ssrLooseContain(unref(filterPeriod), "") : ssrLooseEqual(unref(filterPeriod), "")) ? " selected" : ""}>Все</option><!--[-->`);
        ssrRenderList(unref(availablePeriods), (period) => {
          _push(`<option${ssrRenderAttr("value", period)}${ssrIncludeBooleanAttr(Array.isArray(unref(filterPeriod)) ? ssrLooseContain(unref(filterPeriod), period) : ssrLooseEqual(unref(filterPeriod), period)) ? " selected" : ""}>${ssrInterpolate(period)}</option>`);
        });
        _push(`<!--]--></select></div></div>`);
        if (unref(filteredCertificates).length === 0) {
          _push(`<div class="flex flex-col items-center justify-center py-20 rounded-xl bg-white dark:bg-boxdark shadow-md"><svg class="w-20 h-20 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg><h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400">${ssrInterpolate(unref(filterStatus) || unref(filterPeriod) ? "Сертификаты не найдены" : "У вас пока нет сертификатов")}</h3><p class="text-sm text-gray-500 dark:text-gray-500 mt-1">${ssrInterpolate(unref(filterStatus) || unref(filterPeriod) ? "Попробуйте изменить фильтры" : "После прохождения обучения здесь появятся ваши сертификаты")}</p></div>`);
        } else {
          _push(`<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"><!--[-->`);
          ssrRenderList(unref(filteredCertificates), (cert) => {
            _push(`<div class="group rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"><div class="relative aspect-[1.4/1] bg-linear-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center overflow-hidden"><svg class="w-24 h-24 text-primary/40 transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg><div class="${ssrRenderClass([
              "absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium",
              cert.status === "issued" && !isExpired(cert) ? "bg-success/20 text-success" : cert.status === "issued" && isExpired(cert) ? "bg-warning/20 text-warning" : "bg-danger/20 text-danger"
            ])}">${ssrInterpolate(cert.status === "issued" ? isExpired(cert) ? "Истёк срок" : "Действителен" : "Отозван")}</div></div><div class="p-4"><h3 class="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">${ssrInterpolate(cert.courseName)}</h3>`);
            if (cert.certificateNumber) {
              _push(`<p class="text-xs text-primary dark:text-primary/80 font-medium mb-1"> № ${ssrInterpolate(cert.certificateNumber)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">`);
            if (cert.groupCode) {
              _push(`<span>Группа: ${ssrInterpolate(cert.groupCode)}</span>`);
            } else {
              _push(`<!---->`);
            }
            if (cert.groupCode && cert.courseHours) {
              _push(`<span> · </span>`);
            } else {
              _push(`<!---->`);
            }
            if (cert.courseHours) {
              _push(`<span>${ssrInterpolate(cert.courseHours)} ч.</span>`);
            } else {
              _push(`<!---->`);
            }
            if (!cert.groupCode && !cert.courseHours) {
              _push(`<span>—</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p><div class="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400"><div class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>Выдан: ${ssrInterpolate(formatDate(cert.issuedAt))}</span></div>`);
            if (cert.expiresAt) {
              _push(`<div class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="${ssrRenderClass({ "text-warning": isExpired(cert) })}"> До: ${ssrInterpolate(formatDate(cert.expiresAt))}</span></div>`);
            } else {
              _push(`<div class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Бессрочный</span></div>`);
            }
            _push(`</div>`);
            if (cert.status === "issued" && (cert.fileUrl || cert.id)) {
              _push(`<a${ssrRenderAttr("href", cert.fileUrl || `/api/certificates/download/${cert.id}`)} target="_blank" class="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Скачать сертификат </a>`);
            } else {
              _push(`<div class="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg> Сертификат отозван </div>`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        if (unref(certificates).length > 0) {
          _push(`<div class="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4"><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm"><p class="text-sm text-gray-500 dark:text-gray-400">Всего</p><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(unref(certificates).length)}</p></div><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm"><p class="text-sm text-gray-500 dark:text-gray-400">Действительных</p><p class="text-2xl font-bold text-success">${ssrInterpolate(unref(validCount))}</p></div><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm"><p class="text-sm text-gray-500 dark:text-gray-400">Истёк срок</p><p class="text-2xl font-bold text-warning">${ssrInterpolate(unref(expiredCount))}</p></div><div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm"><p class="text-sm text-gray-500 dark:text-gray-400">Отозванных</p><p class="text-2xl font-bold text-danger">${ssrInterpolate(unref(revokedCount))}</p></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/my-certificates.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=my-certificates-Cqspnp9V.mjs.map
