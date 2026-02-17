import { _ as __nuxt_component_0 } from './nuxt-link-DnWQlAEm.mjs';
import { defineComponent, ref, mergeProps, withCtx, createTextVNode, unref, computed, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderStyle, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderAttr } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
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
import './server.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';
import './Notification-CQvvdM2O.mjs';

const useAICertificateImport = () => {
  const { authFetch } = useAuthFetch();
  const toast = useNotification();
  const batchItems = ref([]);
  const batchCurrentStep = ref(1);
  const batchStats = ref({
    totalFiles: 0,
    analyzedFiles: 0,
    readyFiles: 0,
    errorFiles: 0,
    totalCost: "0.00",
    totalTime: 0
  });
  const isProcessing = ref(false);
  const error = ref(null);
  const reset = () => {
    batchItems.value = [];
    batchCurrentStep.value = 1;
    batchStats.value = {
      totalFiles: 0,
      analyzedFiles: 0,
      readyFiles: 0,
      errorFiles: 0,
      totalCost: "0.00",
      totalTime: 0
    };
    isProcessing.value = false;
    error.value = null;
  };
  const resetBatch = reset;
  const uploadBatch = async (files) => {
    if (files.length === 0) {
      toast.error("Выберите файлы для загрузки");
      return;
    }
    if (files.length > 20) {
      toast.error("Максимум 20 файлов за раз");
      return;
    }
    isProcessing.value = true;
    error.value = null;
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      const result = await authFetch(
        "/api/ai-certificates/batch/upload",
        {
          method: "POST",
          body: formData
        }
      );
      batchItems.value = result.files.map((file) => ({
        file,
        analysisResult: null,
        selectedStudent: null,
        uiStatus: "uploaded",
        isExpanded: false
      }));
      batchStats.value.totalFiles = result.successCount;
      if (result.errorCount > 0) {
        toast.warning(
          `Загружено ${result.successCount} из ${files.length} файлов`
        );
      } else {
        toast.success(`Успешно загружено ${result.successCount} файлов`);
      }
      batchCurrentStep.value = 2;
      return result;
    } catch (e) {
      const msg = e.data?.message || e.message || "Ошибка загрузки файлов";
      error.value = msg;
      toast.error(msg);
      throw e;
    } finally {
      isProcessing.value = false;
    }
  };
  const analyzeBatch = async () => {
    if (batchItems.value.length === 0) {
      error.value = "Нет файлов для анализа";
      return;
    }
    isProcessing.value = true;
    error.value = null;
    batchItems.value.forEach((item) => {
      item.uiStatus = "analyzing";
    });
    try {
      const fileIds = batchItems.value.map((item) => item.file.fileId);
      const result = await authFetch(
        "/api/ai-certificates/batch/analyze",
        {
          method: "POST",
          body: { fileIds }
        }
      );
      result.results.forEach((analysisResult) => {
        const item = batchItems.value.find(
          (i) => i.file.fileId === analysisResult.fileId
        );
        if (item) {
          item.analysisResult = analysisResult;
          if (analysisResult.success) {
            item.uiStatus = "analyzed";
            if (analysisResult.matchResult?.topAlternatives && analysisResult.matchResult.topAlternatives.length > 0) {
              const firstAlternative = analysisResult.matchResult.topAlternatives[0];
              if (firstAlternative) {
                item.selectedStudent = firstAlternative.student;
                item.uiStatus = "ready";
              }
            }
          } else {
            item.uiStatus = "error";
          }
        }
      });
      batchStats.value.analyzedFiles = result.successCount;
      batchStats.value.errorFiles = result.errorCount;
      batchStats.value.totalCost = result.totalCost;
      batchStats.value.totalTime = result.totalProcessingTime;
      batchStats.value.readyFiles = batchItems.value.filter(
        (i) => i.uiStatus === "ready"
      ).length;
      if (result.errorCount > 0) {
        toast.warning(
          `Проанализировано ${result.successCount} из ${batchItems.value.length} файлов`
        );
      } else {
        toast.success(`Успешно проанализировано ${result.successCount} файлов`);
      }
      batchCurrentStep.value = 3;
      return result;
    } catch (e) {
      const msg = e.data?.message || e.message || "Ошибка анализа файлов";
      error.value = msg;
      toast.error(msg);
      batchItems.value.forEach((item) => {
        if (item.uiStatus === "analyzing") {
          item.uiStatus = "error";
        }
      });
      throw e;
    } finally {
      isProcessing.value = false;
    }
  };
  const selectStudentForFile = (fileId, student) => {
    const item = batchItems.value.find((i) => i.file.fileId === fileId);
    if (item) {
      item.selectedStudent = student;
      item.uiStatus = "ready";
      batchStats.value.readyFiles = batchItems.value.filter(
        (i) => i.uiStatus === "ready"
      ).length;
    }
  };
  const updateBatchItemData = (fileId, data) => {
    const item = batchItems.value.find((i) => i.file.fileId === fileId);
    if (item?.analysisResult?.extractedData) {
      item.analysisResult.extractedData = {
        ...item.analysisResult.extractedData,
        ...data
      };
    }
  };
  const toggleItemExpanded = (fileId) => {
    const item = batchItems.value.find((i) => i.file.fileId === fileId);
    if (item) {
      item.isExpanded = !item.isExpanded;
    }
  };
  const confirmBatchImport = async () => {
    const readyItems = batchItems.value.filter(
      (item) => item.uiStatus === "ready" && item.selectedStudent && item.analysisResult?.extractedData
    );
    if (readyItems.length === 0) {
      error.value = "Нет готовых файлов для импорта";
      toast.error("Выберите студентов для всех сертификатов");
      return;
    }
    isProcessing.value = true;
    error.value = null;
    try {
      const payload = {
        items: readyItems.map((item) => ({
          fileId: item.file.fileId,
          studentId: item.selectedStudent.id,
          extractedData: item.analysisResult.extractedData
        }))
      };
      const result = await authFetch(
        "/api/ai-certificates/batch/confirm",
        {
          method: "POST",
          body: payload
        }
      );
      result.results.forEach((confirmResult) => {
        const item = batchItems.value.find(
          (i) => i.file.fileId === confirmResult.fileId
        );
        if (item) {
          if (confirmResult.success) {
            item.uiStatus = "confirmed";
          } else {
            item.uiStatus = "error";
          }
        }
      });
      if (result.errorCount > 0) {
        toast.warning(
          `Импортировано ${result.successCount} из ${readyItems.length} сертификатов`
        );
      } else {
        toast.success(
          `Успешно импортировано ${result.successCount} сертификатов`
        );
      }
      batchCurrentStep.value = 5;
      return result;
    } catch (e) {
      const msg = e.data?.message || e.message || "Ошибка подтверждения импорта";
      error.value = msg;
      toast.error(msg);
      throw e;
    } finally {
      isProcessing.value = false;
    }
  };
  const getStats = async () => {
    try {
      return await authFetch("/api/ai-certificates/stats");
    } catch (e) {
      console.error("Ошибка получения статистики:", e);
      throw e;
    }
  };
  const getLogs = async (filters = {}) => {
    try {
      return await authFetch("/api/ai-certificates/logs", {
        params: filters
      });
    } catch (e) {
      console.error("Ошибка получения логов:", e);
      throw e;
    }
  };
  const batchProgress = computed(() => {
    if (batchStats.value.totalFiles === 0) return 0;
    return Math.round(
      batchStats.value.readyFiles / batchStats.value.totalFiles * 100
    );
  });
  const canConfirmBatch = computed(() => {
    return batchStats.value.readyFiles > 0;
  });
  return {
    // Batch Mode State
    batchItems,
    batchCurrentStep,
    batchStats,
    batchProgress,
    canConfirmBatch,
    isProcessing,
    error,
    // Batch Mode Actions
    reset,
    resetBatch,
    uploadBatch,
    analyzeBatch,
    selectStudentForFile,
    updateBatchItemData,
    toggleItemExpanded,
    confirmBatchImport,
    // Data getters
    getStats,
    getLogs
  };
};
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "ImportStats",
  __ssrInlineRender: true,
  props: {
    stats: {}
  },
  setup(__props) {
    const props = __props;
    const successRate = computed(() => {
      return props.stats.successRate ? Math.round(props.stats.successRate * 100) : 0;
    });
    const averageConfidence = computed(() => {
      return props.stats.averageConfidence ? Math.round(props.stats.averageConfidence * 100) : 0;
    });
    const totalCost = computed(() => {
      return props.stats.totalCost ? props.stats.totalCost.toFixed(2) : "0.00";
    });
    const averageCost = computed(() => {
      return props.stats.averageCost ? props.stats.averageCost.toFixed(3) : "0.000";
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "grid grid-cols-1 md:grid-cols-3 gap-6" }, _attrs))}><div class="bg-white dark:bg-boxdark p-6 rounded-xl shadow-sm border border-stroke dark:border-strokedark"><div class="flex items-center"><div class="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg text-primary mr-4"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div><p class="text-sm font-medium text-gray-500 dark:text-gray-400"> Всего обработано </p><h3 class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(__props.stats.totalProcessed || 0)}</h3></div></div><div class="mt-4 flex items-center text-sm"><span class="text-success font-medium flex items-center mr-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> ${ssrInterpolate(successRate.value)}% </span><span class="text-gray-400 dark:text-gray-500">успешно</span></div></div><div class="bg-white dark:bg-boxdark p-6 rounded-xl shadow-sm border border-stroke dark:border-strokedark"><div class="flex items-center"><div class="bg-success/10 dark:bg-success/20 p-3 rounded-lg text-success mr-4"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><p class="text-sm font-medium text-gray-500 dark:text-gray-400"> Средняя уверенность AI </p><h3 class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(averageConfidence.value)}% </h3></div></div><div class="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5"><div class="bg-success h-1.5 rounded-full transition-all duration-300" style="${ssrRenderStyle({ width: `${averageConfidence.value}%` })}"></div></div></div><div class="bg-white dark:bg-boxdark p-6 rounded-xl shadow-sm border border-stroke dark:border-strokedark"><div class="flex items-center"><div class="bg-warning/10 dark:bg-warning/20 p-3 rounded-lg text-warning mr-4"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><p class="text-sm font-medium text-gray-500 dark:text-gray-400"> Общие расходы </p><h3 class="text-2xl font-bold text-black dark:text-white"> $${ssrInterpolate(totalCost.value)}</h3></div></div><div class="mt-4 text-xs text-gray-500 dark:text-gray-400"> Средняя стоимость: $${ssrInterpolate(averageCost.value)} / шт. </div></div></div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/ai-import/ImportStats.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const ImportStats = Object.assign(_sfc_main$6, { __name: "DatabaseAiImportStats" });
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "ProcessingLogs",
  __ssrInlineRender: true,
  props: {
    logs: {},
    currentPage: {},
    totalPages: {}
  },
  emits: ["page-change", "refresh"],
  setup(__props, { emit: __emit }) {
    const isExpanded = ref(false);
    const formatDate = (date) => {
      return new Date(date).toLocaleString("ru-RU");
    };
    const formatBytes = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };
    const getStatusLabel = (status) => {
      switch (status) {
        case "success":
          return "Успешно";
        case "failed":
          return "Ошибка";
        case "partial":
          return "Частично";
        default:
          return status;
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-white dark:bg-boxdark shadow-sm rounded-lg border border-stroke dark:border-strokedark overflow-hidden" }, _attrs))} data-v-434e52c5><button class="w-full px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-meta-4 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors" data-v-434e52c5><div class="flex items-center gap-3" data-v-434e52c5><h3 class="text-lg font-medium text-gray-900 dark:text-white" data-v-434e52c5> История импортов </h3>`);
      if (__props.logs.length > 0) {
        _push(`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary" data-v-434e52c5>${ssrInterpolate(__props.logs.length)}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="flex items-center space-x-2" data-v-434e52c5><button class="p-2 text-gray-500 dark:text-gray-400 hover:text-primary rounded-full hover:bg-white dark:hover:bg-boxdark transition-colors" title="Обновить" data-v-434e52c5><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-v-434e52c5><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" data-v-434e52c5></path></svg></button><svg class="${ssrRenderClass([{ "rotate-180": isExpanded.value }, "h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform duration-200"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-434e52c5><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" data-v-434e52c5></path></svg></div></button>`);
      if (isExpanded.value) {
        _push(`<div class="overflow-hidden" data-v-434e52c5><div class="overflow-x-auto" data-v-434e52c5><table class="min-w-full divide-y divide-gray-200" data-v-434e52c5><thead class="bg-gray-50" data-v-434e52c5><tr data-v-434e52c5><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-v-434e52c5> Дата </th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-v-434e52c5> Файл </th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-v-434e52c5> Студент </th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-v-434e52c5> AI Модель </th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-v-434e52c5> Статус </th><th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" data-v-434e52c5> Стоимость </th></tr></thead><tbody class="bg-white divide-y divide-gray-200" data-v-434e52c5><!--[-->`);
        ssrRenderList(__props.logs, (log) => {
          _push(`<tr class="hover:bg-gray-50 transition-colors" data-v-434e52c5><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-v-434e52c5>${ssrInterpolate(formatDate(log.processingStartedAt))}</td><td class="px-6 py-4 whitespace-nowrap" data-v-434e52c5><div class="text-sm font-medium text-gray-900 truncate max-w-xs"${ssrRenderAttr("title", log.originalFilename)} data-v-434e52c5>${ssrInterpolate(log.originalFilename)}</div><div class="text-xs text-gray-500" data-v-434e52c5>${ssrInterpolate(formatBytes(log.fileSizeBytes))}</div></td><td class="px-6 py-4 whitespace-nowrap text-sm" data-v-434e52c5>`);
          if (log.extractedData) {
            _push(`<div class="text-gray-900" data-v-434e52c5>${ssrInterpolate(log.extractedData.fullName)}</div>`);
          } else {
            _push(`<div class="text-gray-400 italic" data-v-434e52c5>Нет данных</div>`);
          }
          if (log.matchMethod) {
            _push(`<div class="text-xs text-gray-500 mt-0.5 flex items-center" data-v-434e52c5>`);
            if (log.matchMethod === "exact_pinfl") {
              _push(`<span class="text-green-600 bg-green-50 px-1.5 rounded" data-v-434e52c5>ПИНФЛ</span>`);
            } else if (log.matchMethod === "exact_name") {
              _push(`<span class="text-blue-600 bg-blue-50 px-1.5 rounded" data-v-434e52c5>ФИО</span>`);
            } else if (log.matchMethod === "fuzzy_ai") {
              _push(`<span class="text-purple-600 bg-purple-50 px-1.5 rounded" data-v-434e52c5>AI</span>`);
            } else {
              _push(`<span class="text-gray-400 bg-gray-50 px-1.5 rounded" data-v-434e52c5>Ручной</span>`);
            }
            if (log.matchConfidence) {
              _push(`<span class="ml-1 text-gray-400" data-v-434e52c5> (${ssrInterpolate(Math.round(log.matchConfidence * 100))}%) </span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-v-434e52c5><span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800" data-v-434e52c5>${ssrInterpolate(log.aiModel)}</span><div class="text-xs text-gray-400 mt-1" data-v-434e52c5>${ssrInterpolate(log.aiTokensUsed)} токенов </div></td><td class="px-6 py-4 whitespace-nowrap" data-v-434e52c5><span class="${ssrRenderClass([{
            "bg-green-100 text-green-800": log.status === "success",
            "bg-red-100 text-red-800": log.status === "failed",
            "bg-yellow-100 text-yellow-800": log.status === "partial"
          }, "px-2 inline-flex text-xs leading-5 font-semibold rounded-full"])}" data-v-434e52c5>${ssrInterpolate(getStatusLabel(log.status))}</span>`);
          if (log.errorMessage) {
            _push(`<div class="text-xs text-red-500 mt-1 max-w-xs truncate"${ssrRenderAttr("title", log.errorMessage)} data-v-434e52c5>${ssrInterpolate(log.errorMessage)}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td><td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 font-mono" data-v-434e52c5> $${ssrInterpolate(log.aiCostUsd?.toFixed(4) || "0.00")}</td></tr>`);
        });
        _push(`<!--]-->`);
        if (__props.logs.length === 0) {
          _push(`<tr data-v-434e52c5><td colspan="6" class="px-6 py-8 text-center text-gray-500 text-sm" data-v-434e52c5> Истории обработок пока нет </td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</tbody></table></div>`);
        if (__props.totalPages > 1) {
          _push(`<div class="bg-white dark:bg-boxdark px-4 py-3 border-t border-gray-200 dark:border-strokedark flex items-center justify-between sm:px-6" data-v-434e52c5><div class="flex-1 flex justify-between sm:hidden" data-v-434e52c5><button${ssrIncludeBooleanAttr(__props.currentPage <= 1) ? " disabled" : ""} class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-gray-800" data-v-434e52c5> Previous </button><button${ssrIncludeBooleanAttr(__props.currentPage >= __props.totalPages) ? " disabled" : ""} class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-gray-800" data-v-434e52c5> Next </button></div><div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between" data-v-434e52c5><div data-v-434e52c5><p class="text-sm text-gray-700 dark:text-gray-300" data-v-434e52c5> Страница <span class="font-medium" data-v-434e52c5>${ssrInterpolate(__props.currentPage)}</span> из <span class="font-medium" data-v-434e52c5>${ssrInterpolate(__props.totalPages)}</span></p></div><div data-v-434e52c5><nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination" data-v-434e52c5><button${ssrIncludeBooleanAttr(__props.currentPage <= 1) ? " disabled" : ""} class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800" data-v-434e52c5><span class="sr-only" data-v-434e52c5>Previous</span><svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-v-434e52c5><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L8.414 10l4.293 4.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z" clip-rule="evenodd" data-v-434e52c5></path></svg></button><button${ssrIncludeBooleanAttr(__props.currentPage >= __props.totalPages) ? " disabled" : ""} class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800" data-v-434e52c5><span class="sr-only" data-v-434e52c5>Next</span><svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-v-434e52c5><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L11.586 10 7.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clip-rule="evenodd" data-v-434e52c5></path></svg></button></nav></div></div></div>`);
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
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/database/ai-import/ProcessingLogs.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const ProcessingLogs = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$5, [["__scopeId", "data-v-434e52c5"]]), { __name: "DatabaseAiImportProcessingLogs" });
const _sfc_main$4 = {
  __name: "CertificatesBatchFileUploader",
  __ssrInlineRender: true,
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    maxFiles: {
      type: Number,
      default: 20
    },
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024
      // 10 MB
    }
  },
  emits: ["upload"],
  setup(__props, { emit: __emit }) {
    ref(null);
    const isDragging = ref(false);
    const selectedFiles = ref([]);
    const validFilesCount = computed(() => {
      return selectedFiles.value.filter((f) => !f.error).length;
    });
    const hasValidFiles = computed(() => {
      return validFilesCount.value > 0;
    });
    const formatFileSize = (bytes) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))} data-v-ee52c66c><div class="${ssrRenderClass([
        "relative border-2 border-dashed rounded-xl transition-all duration-300",
        isDragging.value ? "border-primary bg-primary/5 dark:bg-primary/10 scale-[1.02]" : "border-gray-300 dark:border-gray-600 hover:border-primary/50 dark:hover:border-primary/50",
        __props.loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      ])}" data-v-ee52c66c><div class="p-8 lg:p-12 text-center" data-v-ee52c66c><div class="flex justify-center mb-4" data-v-ee52c66c><div class="${ssrRenderClass([
        "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300",
        isDragging.value ? "bg-primary text-white scale-110" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
      ])}" data-v-ee52c66c><svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-ee52c66c><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" data-v-ee52c66c></path></svg></div></div><h3 class="text-lg font-semibold text-black dark:text-white mb-2" data-v-ee52c66c>${ssrInterpolate(isDragging.value ? "Отпустите файлы здесь" : "Загрузите сертификаты")}</h3><p class="text-sm text-gray-600 dark:text-gray-400 mb-4" data-v-ee52c66c> Перетащите файлы или нажмите для выбора </p><div class="flex flex-wrap items-center justify-center gap-2" data-v-ee52c66c><span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" data-v-ee52c66c><svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" data-v-ee52c66c><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" data-v-ee52c66c></path></svg> Максимум 20 файлов </span><span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" data-v-ee52c66c><svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" data-v-ee52c66c><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" data-v-ee52c66c></path></svg> JPG, PNG, PDF </span><span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" data-v-ee52c66c><svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" data-v-ee52c66c><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" data-v-ee52c66c></path></svg> До 10 МБ каждый </span></div><input type="file" multiple accept="image/jpeg,image/jpg,image/png,application/pdf" class="hidden" data-v-ee52c66c></div>`);
      if (__props.loading) {
        _push(`<div class="absolute inset-0 bg-white/80 dark:bg-boxdark/80 backdrop-blur-sm rounded-xl flex items-center justify-center" data-v-ee52c66c><div class="text-center" data-v-ee52c66c><div class="h-12 w-12 mx-auto mb-3 animate-spin rounded-full border-4 border-primary border-t-transparent" data-v-ee52c66c></div><p class="text-sm font-medium text-gray-700 dark:text-gray-300" data-v-ee52c66c> Загрузка файлов... </p></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (selectedFiles.value.length > 0) {
        _push(`<div class="space-y-4" data-v-ee52c66c><div class="flex items-center justify-between" data-v-ee52c66c><h4 class="text-sm font-semibold text-black dark:text-white" data-v-ee52c66c> Выбрано файлов: ${ssrInterpolate(selectedFiles.value.length)}</h4><button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-v-ee52c66c> Очистить всё </button></div><div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" data-v-ee52c66c><!--[-->`);
        ssrRenderList(selectedFiles.value, (file, index) => {
          _push(`<div class="group relative bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark overflow-hidden hover:shadow-lg transition-all duration-300" data-v-ee52c66c><div class="aspect-square bg-gray-100 dark:bg-gray-800 relative" data-v-ee52c66c>`);
          if (file.preview) {
            _push(`<img${ssrRenderAttr("src", file.preview)}${ssrRenderAttr("alt", file.file.name)} class="w-full h-full object-cover" data-v-ee52c66c>`);
          } else {
            _push(`<div class="w-full h-full flex items-center justify-center text-gray-400" data-v-ee52c66c><svg class="h-12 w-12" fill="currentColor" viewBox="0 0 20 20" data-v-ee52c66c><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" data-v-ee52c66c></path></svg></div>`);
          }
          _push(`<button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" data-v-ee52c66c><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-ee52c66c><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-ee52c66c></path></svg></button><div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm" data-v-ee52c66c><span class="text-xs font-medium text-white" data-v-ee52c66c>${ssrInterpolate(formatFileSize(file.file.size))}</span></div>`);
          if (file.error) {
            _push(`<div class="absolute inset-0 bg-red-500/90 backdrop-blur-sm flex items-center justify-center p-2" data-v-ee52c66c><p class="text-xs text-white text-center font-medium" data-v-ee52c66c>${ssrInterpolate(file.error)}</p></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="p-2" data-v-ee52c66c><p class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate"${ssrRenderAttr("title", file.file.name)} data-v-ee52c66c>${ssrInterpolate(file.file.name)}</p></div></div>`);
        });
        _push(`<!--]--></div><div class="flex justify-end" data-v-ee52c66c><button${ssrIncludeBooleanAttr(__props.loading || !hasValidFiles.value) ? " disabled" : ""} class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all" data-v-ee52c66c>`);
        if (!__props.loading) {
          _push(`<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-ee52c66c><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" data-v-ee52c66c></path></svg>`);
        } else {
          _push(`<div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" data-v-ee52c66c></div>`);
        }
        _push(` ${ssrInterpolate(__props.loading ? "Загрузка..." : `Загрузить (${validFilesCount.value})`)}</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/BatchFileUploader.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const BatchFileUploader = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-ee52c66c"]]);
const _sfc_main$3 = {
  __name: "CertificatesStudentMatchAccordion",
  __ssrInlineRender: true,
  props: {
    fileId: {
      type: String,
      required: true
    },
    matchResult: {
      type: Object,
      default: null
    },
    selectedStudent: {
      type: Object,
      default: null
    }
  },
  emits: ["select", "create-new"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const isSelected = (studentId) => {
      return props.selectedStudent?.id === studentId;
    };
    const getScoreColor = (score) => {
      if (score >= 90) return "text-success";
      if (score >= 70) return "text-primary";
      if (score >= 50) return "text-warning";
      return "text-danger";
    };
    const getScoreBarColor = (score) => {
      if (score >= 90) return "bg-success";
      if (score >= 70) return "bg-primary";
      if (score >= 50) return "bg-warning";
      return "bg-danger";
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4" }, _attrs))} data-v-f03a98b4><div class="flex items-center justify-between" data-v-f03a98b4><h5 class="text-sm font-semibold text-black dark:text-white" data-v-f03a98b4> Выбор слушателя </h5>`);
      if (__props.selectedStudent) {
        _push(`<span class="text-xs text-success font-medium" data-v-f03a98b4> ✓ Выбран </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (__props.matchResult?.topAlternatives && __props.matchResult.topAlternatives.length > 0) {
        _push(`<div class="space-y-2" data-v-f03a98b4><!--[-->`);
        ssrRenderList(__props.matchResult.topAlternatives, (alternative, index) => {
          _push(`<div class="${ssrRenderClass([
            "relative rounded-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden",
            isSelected(alternative.student.id) ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md" : "border-stroke dark:border-strokedark hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-sm"
          ])}" data-v-f03a98b4><div class="p-4" data-v-f03a98b4><div class="flex items-start gap-4" data-v-f03a98b4><div class="shrink-0 pt-1" data-v-f03a98b4><div class="${ssrRenderClass([
            "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
            isSelected(alternative.student.id) ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-600"
          ])}" data-v-f03a98b4>`);
          if (isSelected(alternative.student.id)) {
            _push(`<div class="h-2 w-2 rounded-full bg-white" data-v-f03a98b4></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><div class="flex-1 min-w-0" data-v-f03a98b4><div class="flex items-start justify-between gap-4" data-v-f03a98b4><div class="flex-1 min-w-0" data-v-f03a98b4><div class="flex items-center gap-2 mb-2" data-v-f03a98b4><span class="${ssrRenderClass([
            "inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold",
            index === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : index === 1 ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          ])}" data-v-f03a98b4>${ssrInterpolate(index + 1)}</span><h6 class="text-sm font-semibold text-black dark:text-white truncate" data-v-f03a98b4>${ssrInterpolate(alternative.student.fullName)}</h6></div><div class="space-y-1" data-v-f03a98b4>`);
          if (alternative.student.pinfl) {
            _push(`<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400" data-v-f03a98b4><svg class="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" data-v-f03a98b4><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" data-v-f03a98b4></path></svg><span class="truncate" data-v-f03a98b4>ПИНФЛ: ${ssrInterpolate(alternative.student.pinfl)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          if (alternative.student.organization) {
            _push(`<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400" data-v-f03a98b4><svg class="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" data-v-f03a98b4><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd" data-v-f03a98b4></path></svg><span class="truncate font-medium" data-v-f03a98b4>${ssrInterpolate(alternative.student.organization)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          if (alternative.student.department) {
            _push(`<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400" data-v-f03a98b4><svg class="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" data-v-f03a98b4><path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd" data-v-f03a98b4></path><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" data-v-f03a98b4></path></svg><span class="truncate" data-v-f03a98b4>${ssrInterpolate(alternative.student.department)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          if (alternative.student.email) {
            _push(`<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400" data-v-f03a98b4><svg class="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" data-v-f03a98b4><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" data-v-f03a98b4></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" data-v-f03a98b4></path></svg><span class="truncate" data-v-f03a98b4>${ssrInterpolate(alternative.student.email)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><div class="shrink-0 text-right" data-v-f03a98b4><div class="${ssrRenderClass([
            "text-2xl font-bold",
            getScoreColor(alternative.matchScore)
          ])}" data-v-f03a98b4>${ssrInterpolate(alternative.matchScore)}% </div><div class="text-xs text-gray-500 dark:text-gray-400" data-v-f03a98b4> совпадение </div></div></div><div class="mt-3" data-v-f03a98b4><div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" data-v-f03a98b4><div class="${ssrRenderClass([
            "h-full transition-all duration-500 ease-out rounded-full",
            getScoreBarColor(alternative.matchScore)
          ])}" style="${ssrRenderStyle({ width: `${alternative.matchScore}%` })}" data-v-f03a98b4></div></div></div></div></div></div>`);
          if (isSelected(alternative.student.id)) {
            _push(`<div class="absolute top-0 right-0 bg-primary text-white px-3 py-1 rounded-bl-lg text-xs font-semibold" data-v-f03a98b4> Выбран </div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      } else if (__props.matchResult && (!__props.matchResult.topAlternatives || __props.matchResult.topAlternatives.length === 0)) {
        _push(`<div class="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 text-center" data-v-f03a98b4><div class="flex flex-col items-center" data-v-f03a98b4><div class="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3" data-v-f03a98b4><svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f03a98b4><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-f03a98b4></path></svg></div><h6 class="text-sm font-semibold text-black dark:text-white mb-1" data-v-f03a98b4> Совпадений не найдено </h6><p class="text-xs text-gray-600 dark:text-gray-400 mb-4" data-v-f03a98b4> В базе данных нет подходящих слушателей </p><button class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors" data-v-f03a98b4><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f03a98b4><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" data-v-f03a98b4></path></svg> Создать нового слушателя </button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.matchResult?.topAlternatives && __props.matchResult.topAlternatives.length > 0) {
        _push(`<div class="pt-2 border-t border-stroke dark:border-strokedark" data-v-f03a98b4><button class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all text-sm font-medium text-gray-700 dark:text-gray-300" data-v-f03a98b4><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-f03a98b4><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" data-v-f03a98b4></path></svg> Создать нового слушателя </button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/StudentMatchAccordion.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const StudentMatchAccordion = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-f03a98b4"]]);
const _sfc_main$2 = {
  __name: "CertificatesBatchAnalysisResults",
  __ssrInlineRender: true,
  props: {
    items: {
      type: Array,
      required: true
    },
    stats: {
      type: Object,
      required: true
    }
  },
  emits: ["toggle-item", "select-student", "update-field"],
  setup(__props, { emit: __emit }) {
    const getStatusClasses = (status) => {
      const classes = {
        uploaded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        analyzing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        analyzed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        ready: "bg-success/10 text-success dark:bg-success/20",
        error: "bg-danger/10 text-danger dark:bg-danger/20",
        confirmed: "bg-success/10 text-success dark:bg-success/20"
      };
      return classes[status] || classes.uploaded;
    };
    const getStatusDotClasses = (status) => {
      const classes = {
        uploaded: "bg-gray-500",
        analyzing: "bg-blue-500 animate-pulse",
        analyzed: "bg-purple-500",
        ready: "bg-success",
        error: "bg-danger",
        confirmed: "bg-success"
      };
      return classes[status] || classes.uploaded;
    };
    const getStatusText = (status) => {
      const texts = {
        uploaded: "Загружен",
        analyzing: "Анализ...",
        analyzed: "Проанализирован",
        ready: "Готов",
        error: "Ошибка",
        confirmed: "Подтверждён"
      };
      return texts[status] || "Неизвестно";
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4" }, _attrs))} data-v-bec04105><div class="bg-gradient-to-r from-primary/10 to-success/10 dark:from-primary/20 dark:to-success/20 rounded-xl p-6 border border-primary/20 dark:border-primary/30" data-v-bec04105><div class="flex items-center justify-between mb-4" data-v-bec04105><div data-v-bec04105><h3 class="text-lg font-semibold text-black dark:text-white" data-v-bec04105> Результаты анализа </h3><p class="text-sm text-gray-600 dark:text-gray-400 mt-1" data-v-bec04105>${ssrInterpolate(__props.stats.analyzedFiles)} из ${ssrInterpolate(__props.stats.totalFiles)} обработано </p></div><div class="text-right" data-v-bec04105><div class="text-2xl font-bold text-primary" data-v-bec04105>${ssrInterpolate(Math.round(__props.stats.analyzedFiles / __props.stats.totalFiles * 100))}% </div><div class="text-xs text-gray-500 dark:text-gray-400" data-v-bec04105>прогресс</div></div></div><div class="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" data-v-bec04105><div class="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-success transition-all duration-500 ease-out" style="${ssrRenderStyle({
        width: `${__props.stats.analyzedFiles / __props.stats.totalFiles * 100}%`
      })}" data-v-bec04105></div></div><div class="grid grid-cols-3 gap-4 mt-4" data-v-bec04105><div class="text-center" data-v-bec04105><div class="text-sm font-medium text-gray-600 dark:text-gray-400" data-v-bec04105> Готово </div><div class="text-xl font-bold text-success" data-v-bec04105>${ssrInterpolate(__props.stats.readyFiles)}</div></div><div class="text-center" data-v-bec04105><div class="text-sm font-medium text-gray-600 dark:text-gray-400" data-v-bec04105> Ошибки </div><div class="text-xl font-bold text-danger" data-v-bec04105>${ssrInterpolate(__props.stats.errorFiles)}</div></div><div class="text-center" data-v-bec04105><div class="text-sm font-medium text-gray-600 dark:text-gray-400" data-v-bec04105> Стоимость </div><div class="text-xl font-bold text-warning" data-v-bec04105> $${ssrInterpolate(__props.stats.totalCost)}</div></div></div></div><div class="space-y-3" data-v-bec04105><!--[-->`);
      ssrRenderList(__props.items, (item) => {
        _push(`<div class="bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark overflow-hidden transition-all duration-300 hover:shadow-lg" data-v-bec04105><button class="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" data-v-bec04105><div class="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0" data-v-bec04105>`);
        if (item.file.previewUrl) {
          _push(`<img${ssrRenderAttr("src", item.file.previewUrl)}${ssrRenderAttr("alt", item.file.originalName)} class="w-full h-full object-cover" data-v-bec04105>`);
        } else {
          _push(`<div class="w-full h-full flex items-center justify-center text-gray-400" data-v-bec04105><svg class="h-8 w-8" fill="currentColor" viewBox="0 0 20 20" data-v-bec04105><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" data-v-bec04105></path></svg></div>`);
        }
        _push(`</div><div class="flex-1 text-left min-w-0" data-v-bec04105><h4 class="text-sm font-semibold text-black dark:text-white truncate" data-v-bec04105>${ssrInterpolate(item.file.originalName)}</h4><div class="flex items-center gap-2 mt-1" data-v-bec04105><span class="${ssrRenderClass([
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          getStatusClasses(item.uiStatus)
        ])}" data-v-bec04105><span class="${ssrRenderClass([getStatusDotClasses(item.uiStatus), "h-1.5 w-1.5 rounded-full"])}" data-v-bec04105></span> ${ssrInterpolate(getStatusText(item.uiStatus))}</span>`);
        if (item.selectedStudent) {
          _push(`<span class="text-xs text-gray-600 dark:text-gray-400 truncate" data-v-bec04105> → ${ssrInterpolate(item.selectedStudent.fullName)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="flex-shrink-0" data-v-bec04105><svg class="${ssrRenderClass([{ "rotate-180": item.isExpanded }, "h-5 w-5 text-gray-400 transition-transform duration-200"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-bec04105><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" data-v-bec04105></path></svg></div></button>`);
        if (item.isExpanded) {
          _push(`<div class="border-t border-stroke dark:border-strokedark" data-v-bec04105><div class="p-6 space-y-6" data-v-bec04105>`);
          if (item.uiStatus === "error" && item.analysisResult?.error) {
            _push(`<div class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4" data-v-bec04105><div class="flex items-start gap-3" data-v-bec04105><svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" data-v-bec04105><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" data-v-bec04105></path></svg><div class="flex-1" data-v-bec04105><h5 class="text-sm font-semibold text-red-900 dark:text-red-200" data-v-bec04105> Ошибка обработки </h5><p class="text-sm text-red-700 dark:text-red-300 mt-1" data-v-bec04105>${ssrInterpolate(item.analysisResult.error)}</p></div></div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (item.analysisResult?.extractedData) {
            _push(`<div class="space-y-4" data-v-bec04105><div class="flex items-center justify-between mb-2" data-v-bec04105><h5 class="text-sm font-semibold text-black dark:text-white" data-v-bec04105> Извлечённые данные </h5><span class="text-xs text-gray-500 dark:text-gray-400" data-v-bec04105> Все поля редактируемы </span></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-v-bec04105><div class="space-y-1.5" data-v-bec04105><label class="text-xs font-medium text-gray-600 dark:text-gray-400" data-v-bec04105> ФИО <span class="text-red-500" data-v-bec04105>*</span></label><input${ssrRenderAttr("value", item.analysisResult.extractedData.fullName)} type="text" required class="${ssrRenderClass([{
              "border-red-500 dark:border-red-500": !item.analysisResult.extractedData.fullName
            }, "w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-boxdark text-black dark:text-white border-gray-300 dark:border-gray-600"])}" placeholder="Введите ФИО" data-v-bec04105>`);
            if (!item.analysisResult.extractedData.fullName) {
              _push(`<span class="text-xs text-red-500" data-v-bec04105> Обязательное поле </span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="space-y-1.5" data-v-bec04105><label class="text-xs font-medium text-gray-600 dark:text-gray-400" data-v-bec04105> Номер сертификата </label><input${ssrRenderAttr(
              "value",
              item.analysisResult.extractedData.certificateNumber
            )} type="text" class="w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-boxdark text-black dark:text-white border-gray-300 dark:border-gray-600" placeholder="Введите номер сертификата" data-v-bec04105></div><div class="space-y-1.5" data-v-bec04105><label class="text-xs font-medium text-gray-600 dark:text-gray-400" data-v-bec04105> Дата выдачи </label><input${ssrRenderAttr("value", item.analysisResult.extractedData.issueDate)} type="date" class="w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-boxdark text-black dark:text-white border-gray-300 dark:border-gray-600" data-v-bec04105></div><div class="space-y-1.5" data-v-bec04105><label class="text-xs font-medium text-gray-600 dark:text-gray-400" data-v-bec04105> Название курса </label><input${ssrRenderAttr("value", item.analysisResult.extractedData.courseName)} type="text" class="w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-boxdark text-black dark:text-white border-gray-300 dark:border-gray-600" placeholder="Введите название курса" data-v-bec04105></div><div class="space-y-1.5" data-v-bec04105><label class="text-xs font-medium text-gray-600 dark:text-gray-400" data-v-bec04105> Организация </label><input${ssrRenderAttr("value", item.analysisResult.extractedData.organization)} type="text" class="w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-boxdark text-black dark:text-white border-gray-300 dark:border-gray-600" placeholder="Введите организацию" data-v-bec04105></div><div class="space-y-1.5" data-v-bec04105><label class="text-xs font-medium text-gray-600 dark:text-gray-400" data-v-bec04105> Длительность </label><input${ssrRenderAttr("value", item.analysisResult.extractedData.duration)} type="text" class="w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-boxdark text-black dark:text-white border-gray-300 dark:border-gray-600" placeholder="Например: 72 часа" data-v-bec04105></div></div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (item.analysisResult?.matchResult) {
            _push(`<div data-v-bec04105>`);
            _push(ssrRenderComponent(StudentMatchAccordion, {
              "file-id": item.file.fileId,
              "match-result": item.analysisResult.matchResult,
              "selected-student": item.selectedStudent,
              onSelect: (student) => _ctx.$emit("select-student", item.file.fileId, student)
            }, null, _parent));
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div></div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/BatchAnalysisResults.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const BatchAnalysisResults = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-bec04105"]]);
const _sfc_main$1 = {
  __name: "CertificatesBatchConfirmPanel",
  __ssrInlineRender: true,
  props: {
    items: {
      type: Array,
      required: true
    },
    stats: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ["confirm", "cancel"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const readyItems = computed(() => {
      return props.items.filter(
        (item) => item.uiStatus === "ready" && item.selectedStudent && item.analysisResult?.extractedData
      );
    });
    const itemsNeedingAttention = computed(() => {
      return props.items.filter(
        (item) => item.uiStatus !== "ready" || !item.selectedStudent || !item.analysisResult?.extractedData
      );
    });
    const canConfirm = computed(() => {
      return readyItems.value.length > 0 && !props.loading;
    });
    const getMatchScore = (item) => {
      if (!item.selectedStudent || !item.analysisResult?.matchResult?.topAlternatives) {
        return 0;
      }
      const matchedAlternative = item.analysisResult.matchResult.topAlternatives.find(
        (alt) => alt.student.id === item.selectedStudent.id
      );
      return matchedAlternative?.matchScore || 0;
    };
    const getItemIssue = (item) => {
      if (item.uiStatus === "error") return "ошибка анализа";
      if (!item.selectedStudent) return "не выбран студент";
      if (!item.analysisResult?.extractedData) return "нет данных";
      return "требует проверки";
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))} data-v-6c9b392f><div class="bg-gradient-to-br from-primary/10 via-success/10 to-info/10 dark:from-primary/20 dark:via-success/20 dark:to-info/20 rounded-xl p-6 border-2 border-primary/30 dark:border-primary/40" data-v-6c9b392f><div class="flex items-start justify-between mb-6" data-v-6c9b392f><div data-v-6c9b392f><h3 class="text-xl font-bold text-black dark:text-white mb-2" data-v-6c9b392f> Подтверждение импорта </h3><p class="text-sm text-gray-600 dark:text-gray-400" data-v-6c9b392f> Проверьте сводку перед финальным сохранением </p></div><div class="h-14 w-14 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center" data-v-6c9b392f><svg class="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-6c9b392f><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-6c9b392f></path></svg></div></div><div class="grid grid-cols-2 md:grid-cols-4 gap-4" data-v-6c9b392f><div class="bg-white/60 dark:bg-boxdark/60 backdrop-blur-sm rounded-lg p-4 text-center" data-v-6c9b392f><div class="text-3xl font-bold text-black dark:text-white mb-1" data-v-6c9b392f>${ssrInterpolate(__props.stats.totalFiles)}</div><div class="text-xs text-gray-600 dark:text-gray-400 font-medium" data-v-6c9b392f> Всего файлов </div></div><div class="bg-white/60 dark:bg-boxdark/60 backdrop-blur-sm rounded-lg p-4 text-center" data-v-6c9b392f><div class="text-3xl font-bold text-success mb-1" data-v-6c9b392f>${ssrInterpolate(__props.stats.readyFiles)}</div><div class="text-xs text-gray-600 dark:text-gray-400 font-medium" data-v-6c9b392f> Готовы к импорту </div></div><div class="bg-white/60 dark:bg-boxdark/60 backdrop-blur-sm rounded-lg p-4 text-center" data-v-6c9b392f><div class="text-3xl font-bold text-warning mb-1" data-v-6c9b392f>${ssrInterpolate(__props.stats.totalFiles - __props.stats.readyFiles)}</div><div class="text-xs text-gray-600 dark:text-gray-400 font-medium" data-v-6c9b392f> Требуют внимания </div></div><div class="bg-white/60 dark:bg-boxdark/60 backdrop-blur-sm rounded-lg p-4 text-center" data-v-6c9b392f><div class="text-3xl font-bold text-primary mb-1" data-v-6c9b392f> $${ssrInterpolate(__props.stats.totalCost)}</div><div class="text-xs text-gray-600 dark:text-gray-400 font-medium" data-v-6c9b392f> Стоимость AI </div></div></div></div>`);
      if (readyItems.value.length > 0) {
        _push(`<div class="bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark overflow-hidden" data-v-6c9b392f><div class="px-6 py-4 border-b border-stroke dark:border-strokedark" data-v-6c9b392f><h4 class="text-sm font-semibold text-black dark:text-white" data-v-6c9b392f> Сертификаты к импорту (${ssrInterpolate(readyItems.value.length)}) </h4></div><div class="divide-y divide-stroke dark:divide-strokedark max-h-96 overflow-y-auto" data-v-6c9b392f><!--[-->`);
        ssrRenderList(readyItems.value, (item) => {
          _push(`<div class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" data-v-6c9b392f><div class="flex items-center gap-4" data-v-6c9b392f><div class="h-10 w-10 rounded-full bg-success/10 dark:bg-success/20 flex items-center justify-center flex-shrink-0" data-v-6c9b392f><svg class="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-6c9b392f><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" data-v-6c9b392f></path></svg></div><div class="flex-1 min-w-0" data-v-6c9b392f><div class="flex items-center gap-2 mb-1" data-v-6c9b392f><h5 class="text-sm font-semibold text-black dark:text-white truncate" data-v-6c9b392f>${ssrInterpolate(item.analysisResult?.extractedData?.fullName || "Без имени")}</h5><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary" data-v-6c9b392f>${ssrInterpolate(item.analysisResult?.extractedData?.certificateNumber || "Без номера")}</span></div><div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400" data-v-6c9b392f><svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" data-v-6c9b392f><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" data-v-6c9b392f></path></svg><span class="truncate" data-v-6c9b392f>${ssrInterpolate(item.selectedStudent?.fullName)}</span></div></div><div class="flex-shrink-0 text-right" data-v-6c9b392f><div class="text-lg font-bold text-success" data-v-6c9b392f>${ssrInterpolate(getMatchScore(item))}% </div><div class="text-xs text-gray-500 dark:text-gray-400" data-v-6c9b392f> совпадение </div></div></div></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (itemsNeedingAttention.value.length > 0) {
        _push(`<div class="bg-warning/10 dark:bg-warning/20 border-2 border-warning/30 dark:border-warning/40 rounded-xl p-6" data-v-6c9b392f><div class="flex items-start gap-4" data-v-6c9b392f><div class="h-10 w-10 rounded-full bg-warning/20 dark:bg-warning/30 flex items-center justify-center flex-shrink-0" data-v-6c9b392f><svg class="h-5 w-5 text-warning" fill="currentColor" viewBox="0 0 20 20" data-v-6c9b392f><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" data-v-6c9b392f></path></svg></div><div class="flex-1" data-v-6c9b392f><h5 class="text-sm font-semibold text-warning mb-2" data-v-6c9b392f> Требуют внимания (${ssrInterpolate(itemsNeedingAttention.value.length)}) </h5><ul class="space-y-1 text-sm text-gray-700 dark:text-gray-300" data-v-6c9b392f><!--[-->`);
        ssrRenderList(itemsNeedingAttention.value.slice(0, 3), (item) => {
          _push(`<li class="flex items-center gap-2" data-v-6c9b392f><span class="h-1.5 w-1.5 rounded-full bg-warning" data-v-6c9b392f></span><span class="truncate" data-v-6c9b392f>${ssrInterpolate(item.file.originalName)}</span><span class="text-xs text-gray-500 dark:text-gray-400" data-v-6c9b392f> (${ssrInterpolate(getItemIssue(item))}) </span></li>`);
        });
        _push(`<!--]-->`);
        if (itemsNeedingAttention.value.length > 3) {
          _push(`<li class="text-xs text-gray-500 dark:text-gray-400 italic" data-v-6c9b392f> и ещё ${ssrInterpolate(itemsNeedingAttention.value.length - 3)}... </li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</ul></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex flex-col sm:flex-row gap-3" data-v-6c9b392f><button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all" data-v-6c9b392f><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-6c9b392f><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-6c9b392f></path></svg> Отменить </button><button${ssrIncludeBooleanAttr(!canConfirm.value || __props.loading) ? " disabled" : ""} class="flex-1 sm:flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-success to-success-600 text-white rounded-lg text-sm font-semibold hover:from-success-600 hover:to-success-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-lg hover:shadow-xl" data-v-6c9b392f>`);
      if (!__props.loading) {
        _push(`<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-6c9b392f><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" data-v-6c9b392f></path></svg>`);
      } else {
        _push(`<div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" data-v-6c9b392f></div>`);
      }
      if (__props.loading) {
        _push(`<span data-v-6c9b392f>Импорт...</span>`);
      } else {
        _push(`<span data-v-6c9b392f>Импортировать ${ssrInterpolate(readyItems.value.length)} сертификатов</span>`);
      }
      _push(`</button></div>`);
      if (__props.loading) {
        _push(`<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4" data-v-6c9b392f><div class="flex items-center gap-3" data-v-6c9b392f><div class="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" data-v-6c9b392f></div><div class="flex-1" data-v-6c9b392f><p class="text-sm font-semibold text-black dark:text-white" data-v-6c9b392f> Импорт в процессе... </p><p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5" data-v-6c9b392f> Пожалуйста, не закрывайте страницу </p></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/certificates/BatchConfirmPanel.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const BatchConfirmPanel = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-6c9b392f"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ai-import-certificates",
  __ssrInlineRender: true,
  setup(__props) {
    const {
      // Batch Mode
      batchItems,
      batchCurrentStep,
      batchStats,
      canConfirmBatch,
      isProcessing,
      uploadBatch,
      analyzeBatch,
      selectStudentForFile,
      toggleItemExpanded,
      confirmBatchImport,
      // Stats
      getStats,
      getLogs
    } = useAICertificateImport();
    const batchSteps = [
      { number: 1, name: "Загрузка" },
      { number: 2, name: "Анализ" },
      { number: 3, name: "Выбор" },
      { number: 4, name: "Подтверждение" },
      { number: 5, name: "Финиш" }
    ];
    const stats = ref(null);
    const logs = ref([]);
    const logsPage = ref(1);
    const totalPages = ref(1);
    const handleBatchUpload = async (files) => {
      try {
        await uploadBatch(files);
        await analyzeBatch();
      } catch (e) {
        console.error(e);
      }
    };
    const handleBatchConfirm = async () => {
      try {
        await confirmBatchImport();
        loadStats();
        loadLogs();
      } catch (e) {
        console.error(e);
      }
    };
    const handleFieldUpdate = ({
      fileId,
      field,
      value
    }) => {
      const item = batchItems.value.find((i) => i.file.fileId === fileId);
      if (item?.analysisResult?.extractedData) {
        item.analysisResult.extractedData[field] = value;
      }
    };
    const loadStats = async () => {
      try {
        stats.value = await getStats();
      } catch (e) {
        console.error(e);
      }
    };
    const loadLogs = async (page = 1) => {
      try {
        const result = await getLogs({ page, limit: 5 });
        logs.value = result.logs;
        logsPage.value = result.page;
        totalPages.value = result.totalPages;
      } catch (e) {
        console.error(e);
      }
    };
    const handlePageChange = (page) => {
      loadLogs(page);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))} data-v-3fe34149><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" data-v-3fe34149><div data-v-3fe34149><div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2" data-v-3fe34149>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/database/import-certificates",
        class: "hover:text-primary transition-colors"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` База сертификатов `);
          } else {
            return [
              createTextVNode(" База сертификатов ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3fe34149><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-3fe34149></path></svg><span class="text-black dark:text-white font-medium" data-v-3fe34149>AI Импорт</span></div><h1 class="text-2xl font-semibold text-black dark:text-white" data-v-3fe34149> Пакетный AI Импорт Сертификатов </h1><p class="mt-1 text-sm text-gray-600 dark:text-gray-400" data-v-3fe34149> Массовое распознавание и импорт сертификатов с помощью искусственного интеллекта </p></div></div>`);
      if (stats.value) {
        _push(ssrRenderComponent(ImportStats, { stats: stats.value }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark p-6" data-v-3fe34149><div class="flex items-center justify-between mb-4" data-v-3fe34149><h3 class="text-sm font-medium text-gray-700 dark:text-gray-300" data-v-3fe34149> Прогресс импорта </h3><span class="text-xs text-gray-500 dark:text-gray-400" data-v-3fe34149> Шаг ${ssrInterpolate(unref(batchCurrentStep))} из ${ssrInterpolate(batchSteps.length)}</span></div><div class="relative" data-v-3fe34149><div class="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" data-v-3fe34149><div class="h-full bg-linear-to-r from-primary to-success transition-all duration-500" style="${ssrRenderStyle({
        width: `${(unref(batchCurrentStep) - 1) / (batchSteps.length - 1) * 100}%`
      })}" data-v-3fe34149></div></div><div class="relative flex justify-between" data-v-3fe34149><!--[-->`);
      ssrRenderList(batchSteps, (step) => {
        _push(`<div class="flex flex-col items-center z-10" style="${ssrRenderStyle({ width: `${100 / batchSteps.length}%` })}" data-v-3fe34149><div class="${ssrRenderClass([[
          unref(batchCurrentStep) === step.number ? "border-primary text-primary shadow-lg shadow-primary/30 scale-110" : unref(batchCurrentStep) > step.number ? "border-success bg-success text-white" : "border-gray-300 dark:border-gray-600 text-gray-400"
        ], "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 bg-white dark:bg-boxdark"])}" data-v-3fe34149>`);
        if (unref(batchCurrentStep) > step.number) {
          _push(`<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3fe34149><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" data-v-3fe34149></path></svg>`);
        } else {
          _push(`<span class="text-sm font-semibold" data-v-3fe34149>${ssrInterpolate(step.number)}</span>`);
        }
        _push(`</div><div class="mt-2 text-center w-full" data-v-3fe34149><p class="${ssrRenderClass([[
          unref(batchCurrentStep) >= step.number ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
        ], "text-xs font-medium transition-colors truncate px-1"])}" data-v-3fe34149>${ssrInterpolate(step.name)}</p></div></div>`);
      });
      _push(`<!--]--></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md border border-stroke dark:border-strokedark overflow-hidden" data-v-3fe34149><div class="p-6 lg:p-8" data-v-3fe34149><div data-v-3fe34149>`);
      if (unref(batchCurrentStep) === 1) {
        _push(`<div class="space-y-6" data-v-3fe34149><div class="flex items-center gap-3 mb-6" data-v-3fe34149><div class="h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0" data-v-3fe34149><svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3fe34149><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" data-v-3fe34149></path></svg></div><div data-v-3fe34149><h2 class="text-lg font-semibold text-black dark:text-white" data-v-3fe34149> Пакетная загрузка </h2><p class="text-sm text-gray-600 dark:text-gray-400" data-v-3fe34149> Загрузите до 20 файлов сертификатов (PDF, JPG, PNG) </p></div></div>`);
        _push(ssrRenderComponent(BatchFileUploader, {
          loading: unref(isProcessing),
          onUpload: handleBatchUpload
        }, null, _parent));
        _push(`</div>`);
      } else if (unref(batchCurrentStep) === 2) {
        _push(`<div class="space-y-6" data-v-3fe34149><div class="flex items-center gap-3 mb-6" data-v-3fe34149><div class="${ssrRenderClass([{ "animate-pulse": unref(isProcessing) }, "h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0"])}" data-v-3fe34149><svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3fe34149><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" data-v-3fe34149></path></svg></div><div data-v-3fe34149><h2 class="text-lg font-semibold text-black dark:text-white" data-v-3fe34149> Анализ файлов </h2><p class="text-sm text-gray-600 dark:text-gray-400" data-v-3fe34149> Идёт пакетная обработка и распознавание сертификатов </p></div></div>`);
        if (unref(isProcessing)) {
          _push(`<div class="text-center py-12" data-v-3fe34149><div class="h-16 w-16 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" data-v-3fe34149></div><h3 class="text-lg font-medium text-black dark:text-white" data-v-3fe34149> Обработка... </h3><p class="text-gray-500" data-v-3fe34149> Пожалуйста, подождите, это может занять некоторое время. </p></div>`);
        } else {
          _push(`<div class="text-center py-8" data-v-3fe34149><button class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90" data-v-3fe34149> Запустить анализ </button></div>`);
        }
        _push(`</div>`);
      } else if (unref(batchCurrentStep) === 3) {
        _push(`<div class="space-y-6" data-v-3fe34149><div class="flex items-center gap-3 mb-6" data-v-3fe34149><div class="h-12 w-12 rounded-lg bg-info/10 dark:bg-info/20 flex items-center justify-center shrink-0" data-v-3fe34149><svg class="h-6 w-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3fe34149><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" data-v-3fe34149></path></svg></div><div data-v-3fe34149><h2 class="text-lg font-semibold text-black dark:text-white" data-v-3fe34149> Проверка и выбор </h2><p class="text-sm text-gray-600 dark:text-gray-400" data-v-3fe34149> Проверьте результаты и выберите слушателей для каждого файла </p></div></div>`);
        _push(ssrRenderComponent(BatchAnalysisResults, {
          items: unref(batchItems),
          stats: unref(batchStats),
          onToggleItem: unref(toggleItemExpanded),
          onSelectStudent: unref(selectStudentForFile),
          onUpdateField: handleFieldUpdate
        }, null, _parent));
        _push(`</div>`);
      } else if (unref(batchCurrentStep) === 4) {
        _push(`<div class="space-y-6" data-v-3fe34149><div class="flex items-center gap-3 mb-6" data-v-3fe34149><div class="h-12 w-12 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center shrink-0" data-v-3fe34149><svg class="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3fe34149><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-3fe34149></path></svg></div><div data-v-3fe34149><h2 class="text-lg font-semibold text-black dark:text-white" data-v-3fe34149> Пакетное подтверждение </h2><p class="text-sm text-gray-600 dark:text-gray-400" data-v-3fe34149> Финальная проверка перед сохранением в базу </p></div></div>`);
        _push(ssrRenderComponent(BatchConfirmPanel, {
          items: unref(batchItems),
          stats: unref(batchStats),
          loading: unref(isProcessing),
          onConfirm: handleBatchConfirm,
          onCancel: ($event) => batchCurrentStep.value = 3
        }, null, _parent));
        _push(`</div>`);
      } else if (unref(batchCurrentStep) === 5) {
        _push(`<div class="py-12 text-center" data-v-3fe34149><div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10" data-v-3fe34149><svg class="h-10 w-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3fe34149><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" data-v-3fe34149></path></svg></div><h3 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white" data-v-3fe34149> Импорт завершен! </h3><p class="mt-2 text-gray-600 dark:text-gray-400" data-v-3fe34149> Все готовые сертификаты были успешно добавлены в базу данных. </p><div class="mt-8 flex justify-center gap-4" data-v-3fe34149><button class="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all" data-v-3fe34149> Загрузить ещё </button>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/database?tab=certificates",
          class: "rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Перейти в базу `);
            } else {
              return [
                createTextVNode(" Перейти в базу ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="flex flex-col sm:flex-row justify-between items-center gap-3 px-6 lg:px-8 py-4 bg-gray-50 dark:bg-meta-4 border-t border-stroke dark:border-strokedark" data-v-3fe34149>`);
      if (unref(batchCurrentStep) > 1 && unref(batchCurrentStep) < 5) {
        _push(`<button class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(isProcessing)) ? " disabled" : ""} data-v-3fe34149> ← Назад </button>`);
      } else {
        _push(`<div data-v-3fe34149></div>`);
      }
      if (unref(batchCurrentStep) === 3) {
        _push(`<button class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"${ssrIncludeBooleanAttr(!unref(canConfirmBatch)) ? " disabled" : ""} data-v-3fe34149> Далее к подтверждению <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-3fe34149><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-3fe34149></path></svg></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      _push(ssrRenderComponent(ProcessingLogs, {
        logs: logs.value,
        "current-page": logsPage.value,
        "total-pages": totalPages.value,
        onPageChange: handlePageChange,
        onRefresh: loadLogs
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/database/ai-import-certificates.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const aiImportCertificates = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-3fe34149"]]);

export { aiImportCertificates as default };
//# sourceMappingURL=ai-import-certificates-C7c2NS9Z.mjs.map
