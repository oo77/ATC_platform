import { defineComponent, ref, mergeProps, unref, withCtx, createVNode, computed, watch, withModifiers, createBlock, createCommentVNode, withDirectives, vModelText, openBlock, toDisplayString, createTextVNode, nextTick, resolveDynamicComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderComponent, ssrRenderList, ssrRenderAttr, ssrRenderStyle, ssrRenderTeleport, ssrRenderVNode } from 'vue/server-renderer';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import { _ as __nuxt_component_0 } from './Modal-DQYphXo7.mjs';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { u as useNotification } from './useNotification-C2RwAN1X.mjs';
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

const _sfc_main$b = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M5.25012 3C5.25012 2.58579 5.58591 2.25 6.00012 2.25C6.41433 2.25 6.75012 2.58579 6.75012 3V5.25012L9.00034 5.25012C9.41455 5.25012 9.75034 5.58591 9.75034 6.00012C9.75034 6.41433 9.41455 6.75012 9.00034 6.75012H6.75012V9.00034C6.75012 9.41455 6.41433 9.75034 6.00012 9.75034C5.58591 9.75034 5.25012 9.41455 5.25012 9.00034L5.25012 6.75012H3C2.58579 6.75012 2.25 6.41433 2.25 6.00012C2.25 5.58591 2.58579 5.25012 3 5.25012H5.25012V3Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/PlusIcon.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const PlusIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$b, [["ssrRender", _sfc_ssrRender$1]]), { __name: "PlusIcon" });
const _sfc_main$a = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path fill-rule="evenodd" clip-rule="evenodd" d="M6.54118 3.7915C6.54118 2.54886 7.54854 1.5415 8.79118 1.5415H11.2078C12.4505 1.5415 13.4578 2.54886 13.4578 3.7915V4.0415H15.6249H16.6658C17.08 4.0415 17.4158 4.37729 17.4158 4.7915C17.4158 5.20572 17.08 5.5415 16.6658 5.5415H16.3749V8.24638V13.2464V16.2082C16.3749 17.4508 15.3676 18.4582 14.1249 18.4582H5.87492C4.63228 18.4582 3.62492 17.4508 3.62492 16.2082V13.2464V8.24638V5.5415H3.33325C2.91904 5.5415 2.58325 5.20572 2.58325 4.7915C2.58325 4.37729 2.91904 4.0415 3.33325 4.0415H4.37492H6.54118V3.7915ZM14.8749 13.2464V8.24638V5.5415H13.4578H12.7078H7.29118H6.54118H5.12492V8.24638V13.2464V16.2082C5.12492 16.6224 5.46071 16.9582 5.87492 16.9582H14.1249C14.5391 16.9582 14.8749 16.6224 14.8749 16.2082V13.2464ZM8.04118 4.0415H11.9578V3.7915C11.9578 3.37729 11.6221 3.0415 11.2078 3.0415H8.79118C8.37696 3.0415 8.04118 3.37729 8.04118 3.7915V4.0415ZM8.33325 7.99984C8.74747 7.99984 9.08325 8.33562 9.08325 8.74984V13.7498C9.08325 14.1641 8.74747 14.4998 8.33325 14.4998C7.91904 14.4998 7.58325 14.1641 7.58325 13.7498V8.74984C7.58325 8.33562 7.91904 7.99984 8.33325 7.99984ZM12.4166 8.74984C12.4166 8.33562 12.0808 7.99984 11.6666 7.99984C11.2524 7.99984 10.9166 8.33562 10.9166 8.74984V13.7498C10.9166 14.1641 11.2524 14.4998 11.6666 14.4998C12.0808 14.4998 12.4166 14.1641 12.4166 13.7498V8.74984Z" fill="currentColor"></path></svg>`);
}
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/icons/TrashIcon.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const TrashIcon = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$a, [["ssrRender", _sfc_ssrRender]]), { __name: "TrashIcon" });
const useFileManager = () => {
  const { authFetch } = useAuthFetch();
  const uploadFile = async (file, category, folderId, relatedId, metadata) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    if (folderId !== void 0 && folderId !== null) {
      formData.append("folderId", String(folderId));
    }
    if (relatedId) {
      formData.append("relatedId", String(relatedId));
    }
    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata));
    }
    const response = await authFetch("/api/files/upload", {
      method: "POST",
      body: formData
    });
    if (!response.success || !response.file) {
      throw new Error(response.message || "Не удалось загрузить файл");
    }
    return response.file;
  };
  const getFiles = async (params) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.search) queryParams.append("search", params.search);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.userId) queryParams.append("userId", String(params.userId));
    if (params?.courseId) queryParams.append("courseId", String(params.courseId));
    if (params?.groupId) queryParams.append("groupId", String(params.groupId));
    const url = `/api/files${queryParams.toString() ? `?${queryParams}` : ""}`;
    const response = await authFetch(url);
    if (!response.success) {
      throw new Error(response.message || "Не удалось получить список файлов");
    }
    return response;
  };
  const deleteFile = async (uuid) => {
    const response = await authFetch(`/api/files/${uuid}`, {
      method: "DELETE"
    });
    if (!response.success) {
      throw new Error(response.message || "Не удалось удалить файл");
    }
  };
  const getFileUrl = (uuid) => {
    return `/api/files/${uuid}`;
  };
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };
  return {
    uploadFile,
    getFiles,
    deleteFile,
    getFileUrl,
    formatFileSize
  };
};
const _sfc_main$9 = /* @__PURE__ */ defineComponent({
  __name: "FileUploader",
  __ssrInlineRender: true,
  props: {
    category: {},
    folderId: {},
    relatedId: {},
    accept: { default: "*/*" },
    maxSizeMb: { default: 50 },
    multiple: { type: Boolean, default: false },
    showPreview: { type: Boolean, default: true },
    metadata: {}
  },
  emits: ["uploaded", "error", "deleted"],
  setup(__props, { emit: __emit }) {
    const { formatFileSize } = useFileManager();
    ref(null);
    const isDragging = ref(false);
    const isUploading = ref(false);
    const uploadProgress = ref(0);
    const uploadedFiles = ref([]);
    const isImage = (mimeType) => {
      return mimeType.startsWith("image/");
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "file-uploader" }, _attrs))} data-v-4d895357><div class="${ssrRenderClass([
        "relative rounded-lg border-2 border-dashed p-8 transition-all duration-200",
        isDragging.value ? "border-primary bg-primary/5 scale-[1.02]" : "border-stroke dark:border-strokedark hover:border-primary/50",
        "cursor-pointer"
      ])}" data-v-4d895357><input type="file"${ssrRenderAttr("accept", __props.accept)}${ssrIncludeBooleanAttr(__props.multiple) ? " multiple" : ""} class="hidden" data-v-4d895357><div class="flex flex-col items-center justify-center gap-4 text-center" data-v-4d895357><div class="${ssrRenderClass([
        "flex h-16 w-16 items-center justify-center rounded-full transition-all",
        isDragging.value ? "bg-primary text-white scale-110" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
      ])}" data-v-4d895357><svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4d895357><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" data-v-4d895357></path></svg></div><div data-v-4d895357><p class="text-lg font-medium text-black dark:text-white" data-v-4d895357>${ssrInterpolate(isDragging.value ? "Отпустите файл" : "Перетащите файл сюда")}</p><p class="mt-1 text-sm text-gray-500 dark:text-gray-400" data-v-4d895357> или нажмите для выбора </p><p class="mt-2 text-xs text-gray-400 dark:text-gray-500" data-v-4d895357> Максимальный размер: ${ssrInterpolate(__props.maxSizeMb)} MB </p></div>`);
      if (isUploading.value) {
        _push(`<div class="w-full max-w-md" data-v-4d895357><div class="flex items-center justify-between mb-2" data-v-4d895357><span class="text-sm text-gray-600 dark:text-gray-400" data-v-4d895357>Загрузка...</span><span class="text-sm font-medium text-primary" data-v-4d895357>${ssrInterpolate(uploadProgress.value)}%</span></div><div class="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" data-v-4d895357><div class="h-full bg-linear-to-r from-primary to-secondary transition-all duration-300" style="${ssrRenderStyle({ width: `${uploadProgress.value}%` })}" data-v-4d895357></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (__props.showPreview && uploadedFiles.value.length > 0) {
        _push(`<div class="mt-4" data-v-4d895357><h4 class="text-sm font-medium text-black dark:text-white mb-3" data-v-4d895357> Загруженные файлы (${ssrInterpolate(uploadedFiles.value.length)}) </h4><div class="space-y-2" data-v-4d895357><!--[-->`);
        ssrRenderList(uploadedFiles.value, (file) => {
          _push(`<div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" data-v-4d895357><div class="shrink-0 h-10 w-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-700" data-v-4d895357>`);
          if (isImage(file.mimeType)) {
            _push(`<img${ssrRenderAttr("src", file.url)}${ssrRenderAttr("alt", file.filename)} class="h-full w-full object-cover" data-v-4d895357>`);
          } else {
            _push(`<div class="h-full w-full flex items-center justify-center" data-v-4d895357><svg class="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" data-v-4d895357><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" data-v-4d895357></path></svg></div>`);
          }
          _push(`</div><div class="flex-1 min-w-0" data-v-4d895357><p class="text-sm font-medium text-black dark:text-white truncate" data-v-4d895357>${ssrInterpolate(file.filename)}</p><p class="text-xs text-gray-500 dark:text-gray-400" data-v-4d895357>${ssrInterpolate(unref(formatFileSize)(file.sizeBytes))}</p></div><button type="button" class="shrink-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Удалить" data-v-4d895357><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-4d895357><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" data-v-4d895357></path></svg></button></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/FileUploader.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const FileUploader = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$9, [["__scopeId", "data-v-4d895357"]]), { __name: "CommonFileUploader" });
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  __name: "FileTypeIcon",
  __ssrInlineRender: true,
  props: {
    mimeType: {},
    extension: {},
    size: { default: "md" }
  },
  setup(__props) {
    const props = __props;
    const isImage = computed(() => props.mimeType.startsWith("image/"));
    const isPdf = computed(() => props.mimeType === "application/pdf" || props.extension === "pdf");
    const isVideo = computed(() => props.mimeType.startsWith("video/"));
    const isAudio = computed(() => props.mimeType.startsWith("audio/"));
    const isArchive = computed(() => {
      const archiveTypes = ["application/zip", "application/x-rar", "application/x-7z-compressed", "application/x-tar"];
      const archiveExts = ["zip", "rar", "7z", "tar", "gz"];
      return archiveTypes.includes(props.mimeType) || props.extension && archiveExts.includes(props.extension.toLowerCase());
    });
    const isExcel = computed(() => {
      const excelTypes = ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
      const excelExts = ["xls", "xlsx", "csv"];
      return excelTypes.includes(props.mimeType) || props.extension && excelExts.includes(props.extension.toLowerCase());
    });
    const isWord = computed(() => {
      const wordTypes = ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      const wordExts = ["doc", "docx"];
      return wordTypes.includes(props.mimeType) || props.extension && wordExts.includes(props.extension.toLowerCase());
    });
    const sizeClass = computed(() => {
      switch (props.size) {
        case "sm":
          return "h-4 w-4";
        case "md":
          return "h-6 w-6";
        case "lg":
          return "h-8 w-8";
        case "xl":
          return "h-12 w-12";
        default:
          return "h-6 w-6";
      }
    });
    const colorClass = computed(() => {
      if (isImage.value) return "text-purple-500";
      if (isPdf.value) return "text-red-500";
      if (isVideo.value) return "text-pink-500";
      if (isAudio.value) return "text-green-500";
      if (isArchive.value) return "text-yellow-500";
      if (isExcel.value) return "text-emerald-600";
      if (isWord.value) return "text-blue-600";
      return "text-gray-400";
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["inline-flex items-center justify-center", sizeClass.value]
      }, _attrs))}>`);
      if (isImage.value) {
        _push(`<svg class="${ssrRenderClass([colorClass.value, "w-full h-full"])}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg>`);
      } else if (isPdf.value) {
        _push(`<svg class="${ssrRenderClass([colorClass.value, "w-full h-full"])}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path></svg>`);
      } else if (isVideo.value) {
        _push(`<svg class="${ssrRenderClass([colorClass.value, "w-full h-full"])}" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path></svg>`);
      } else if (isArchive.value) {
        _push(`<svg class="${ssrRenderClass([colorClass.value, "w-full h-full"])}" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"></path><path fill-rule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>`);
      } else if (isExcel.value) {
        _push(`<svg class="${ssrRenderClass([colorClass.value, "w-full h-full"])}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd"></path></svg>`);
      } else if (isWord.value) {
        _push(`<svg class="${ssrRenderClass([colorClass.value, "w-full h-full"])}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path></svg>`);
      } else if (isAudio.value) {
        _push(`<svg class="${ssrRenderClass([colorClass.value, "w-full h-full"])}" fill="currentColor" viewBox="0 0 20 20"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"></path></svg>`);
      } else {
        _push(`<svg class="${ssrRenderClass([colorClass.value, "w-full h-full"])}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path></svg>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/common/FileTypeIcon.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const FileTypeIcon = Object.assign(_sfc_main$8, { __name: "CommonFileTypeIcon" });
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "FilePreviewModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    file: {}
  },
  emits: ["close"],
  setup(__props) {
    const props = __props;
    const { formatFileSize } = useFileManager();
    const isImage = computed(() => props.file.mimeType.startsWith("image/"));
    const isVideo = computed(() => props.file.mimeType.startsWith("video/"));
    const isAudio = computed(() => props.file.mimeType.startsWith("audio/"));
    const getCategoryLabel = (category) => {
      const labels = {
        profile: "Профиль",
        certificate_template: "Шаблон",
        certificate_generated: "Сертификат",
        course_material: "Материал",
        course_media: "Медиа",
        course_cover: "Обложка",
        group_gallery: "Галерея",
        group_file: "Файл",
        assignment: "Задание",
        other: "Другое"
      };
      return labels[category] || category;
    };
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderTeleport(_push, (_push2) => {
        if (__props.isOpen) {
          _push2(`<div class="fixed inset-0 flex items-center justify-center overflow-y-auto z-99999 p-4" data-v-312828fb><div class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" aria-hidden="true" data-v-312828fb></div><div class="relative bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-4xl transition-all" role="dialog" aria-modal="true" data-v-312828fb><div class="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark" data-v-312828fb><h3 class="text-xl font-semibold text-black dark:text-white truncate" data-v-312828fb>${ssrInterpolate(__props.file?.filename || "Просмотр файла")}</h3><button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" data-v-312828fb><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-312828fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" data-v-312828fb></path></svg></button></div><div class="p-6" data-v-312828fb>`);
          if (isImage.value) {
            _push2(`<div class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4" data-v-312828fb><img${ssrRenderAttr("src", __props.file.url)}${ssrRenderAttr("alt", __props.file.filename)} class="max-w-full max-h-[60vh] object-contain rounded" data-v-312828fb></div>`);
          } else if (isVideo.value) {
            _push2(`<div class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4" data-v-312828fb><video${ssrRenderAttr("src", __props.file.url)} controls class="max-w-full max-h-[60vh] rounded" data-v-312828fb> Ваш браузер не поддерживает видео. </video></div>`);
          } else if (isAudio.value) {
            _push2(`<div class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-8" data-v-312828fb><audio${ssrRenderAttr("src", __props.file.url)} controls class="w-full" data-v-312828fb> Ваш браузер не поддерживает аудио. </audio></div>`);
          } else {
            _push2(`<div class="text-center py-12" data-v-312828fb>`);
            _push2(ssrRenderComponent(FileTypeIcon, {
              "mime-type": __props.file.mimeType,
              extension: __props.file.extension,
              size: "xl",
              class: "mx-auto mb-4"
            }, null, _parent));
            _push2(`<p class="text-lg font-medium text-black dark:text-white mb-2" data-v-312828fb>${ssrInterpolate(__props.file.filename)}</p><p class="text-sm text-gray-500 dark:text-gray-400" data-v-312828fb> Предпросмотр недоступен для этого типа файлов </p></div>`);
          }
          _push2(`<div class="mt-6 grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" data-v-312828fb><div data-v-312828fb><p class="text-xs text-gray-500 dark:text-gray-400 mb-1" data-v-312828fb>Размер</p><p class="text-sm font-medium text-black dark:text-white" data-v-312828fb>${ssrInterpolate(unref(formatFileSize)(__props.file.sizeBytes))}</p></div><div data-v-312828fb><p class="text-xs text-gray-500 dark:text-gray-400 mb-1" data-v-312828fb>Тип</p><p class="text-sm font-medium text-black dark:text-white" data-v-312828fb>${ssrInterpolate(__props.file.extension.toUpperCase())}</p></div><div data-v-312828fb><p class="text-xs text-gray-500 dark:text-gray-400 mb-1" data-v-312828fb>Категория</p><p class="text-sm font-medium text-black dark:text-white" data-v-312828fb>${ssrInterpolate(getCategoryLabel(__props.file.category))}</p></div><div data-v-312828fb><p class="text-xs text-gray-500 dark:text-gray-400 mb-1" data-v-312828fb>Дата загрузки</p><p class="text-sm font-medium text-black dark:text-white" data-v-312828fb>${ssrInterpolate(formatDate(__props.file.createdAt))}</p></div></div></div><div class="px-6 py-4 border-t border-stroke dark:border-strokedark flex justify-end gap-3" data-v-312828fb><a${ssrRenderAttr("href", __props.file.url)} download class="inline-flex items-center gap-2 rounded-md bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" data-v-312828fb><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-312828fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" data-v-312828fb></path></svg> Скачать </a><a${ssrRenderAttr("href", __props.file.url)} target="_blank" class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 transition-colors" data-v-312828fb><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-312828fb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" data-v-312828fb></path></svg> Открыть в новой вкладке </a></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/files/FilePreviewModal.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const FilePreviewModal = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$7, [["__scopeId", "data-v-312828fb"]]), { __name: "FilesFilePreviewModal" });
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "Breadcrumbs",
  __ssrInlineRender: true,
  props: {
    path: {},
    currentFolderId: {}
  },
  emits: ["navigate"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const { authFetch } = useAuthFetch();
    const pathIdCache = ref(/* @__PURE__ */ new Map());
    async function loadFolderPath(folderId) {
      if (folderId === null) return;
      try {
        const response = await authFetch(
          `/api/folders/${folderId}/path`
        );
        if (response.success && response.path) {
          let currentPath = "";
          for (const folder of response.path) {
            currentPath += "/" + folder.name;
            pathIdCache.value.set(currentPath, folder.id);
          }
        }
      } catch (error) {
        console.error("Ошибка загрузки пути папки:", error);
      }
    }
    const pathSegments = computed(() => {
      if (!props.path || props.path === "/") {
        return [];
      }
      const parts = props.path.split("/").filter(Boolean);
      const segments = [];
      let currentPath = "";
      parts.forEach((name, index) => {
        currentPath += "/" + name;
        const id = pathIdCache.value.get(currentPath) || null;
        segments.push({
          id,
          name
        });
      });
      return segments;
    });
    watch(() => props.currentFolderId, (newId) => {
      loadFolderPath(newId);
    }, { immediate: true });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<nav${ssrRenderAttrs(mergeProps({ class: "flex items-center gap-2 text-sm mb-4" }, _attrs))}><button class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors" title="Корневая папка"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg><span class="font-medium">storage</span></button><!--[-->`);
      ssrRenderList(pathSegments.value, (segment, index) => {
        _push(`<!--[--><svg class="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`);
        if (index < pathSegments.value.length - 1) {
          _push(`<button class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium truncate max-w-48"${ssrRenderAttr("title", segment.name)}>${ssrInterpolate(segment.name)}</button>`);
        } else {
          _push(`<span class="text-black dark:text-white font-semibold truncate max-w-48"${ssrRenderAttr("title", segment.name)}>${ssrInterpolate(segment.name)}</span>`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--></nav>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/files/Breadcrumbs.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const Breadcrumbs = Object.assign(_sfc_main$6, { __name: "FilesBreadcrumbs" });
const useFolderManager = () => {
  const { authFetch } = useAuthFetch();
  const createFolder = async (name, parentId) => {
    const response = await authFetch("/api/folders", {
      method: "POST",
      body: { name, parentId }
    });
    if (!response.success || !response.folder) {
      throw new Error(response.message || "Не удалось создать папку");
    }
    return response.folder;
  };
  const getFolders = async (parentId) => {
    const query = parentId !== void 0 && parentId !== null ? `?parentId=${parentId}` : "";
    const response = await authFetch(`/api/folders${query}`);
    if (!response.success || !response.folders) {
      throw new Error(response.message || "Не удалось получить список папок");
    }
    return response.folders;
  };
  const getFolderContents = async (folderId) => {
    const id = folderId === null ? "root" : String(folderId);
    console.log("getFolderContents - запрос:", { folderId, id, url: `/api/folders/${id}/contents` });
    try {
      const response = await authFetch(`/api/folders/${id}/contents`);
      console.log("getFolderContents - ответ:", response);
      if (!response.success) {
        throw new Error(response.message || "Не удалось получить содержимое папки");
      }
      return response;
    } catch (error) {
      console.error("getFolderContents - ошибка:", error);
      throw error;
    }
  };
  const getRootFolders = async () => {
    return getFolders(null);
  };
  return {
    createFolder,
    getFolders,
    getFolderContents,
    getRootFolders
  };
};
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "CreateFolderModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    parentId: {}
  },
  emits: ["close", "created"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { createFolder } = useFolderManager();
    const folderName = ref("");
    const isLoading = ref(false);
    const error = ref("");
    const handleSubmit = async () => {
      if (!folderName.value.trim()) {
        error.value = "Введите название папки";
        return;
      }
      isLoading.value = true;
      error.value = "";
      try {
        const folder = await createFolder(folderName.value.trim(), props.parentId || null);
        folderName.value = "";
        emit("created", folder.id);
        emit("close");
      } catch (err) {
        error.value = err instanceof Error ? err.message : "Ошибка создания папки";
      } finally {
        isLoading.value = false;
      }
    };
    watch(() => props.isOpen, (isOpen) => {
      if (!isOpen) {
        folderName.value = "";
        error.value = "";
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(__nuxt_component_0, mergeProps({
        "is-open": __props.isOpen,
        title: "Создать папку",
        size: "md",
        onClose: ($event) => _ctx.$emit("close")
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form${_scopeId}><div class="mb-4"${_scopeId}><label class="mb-2 block text-sm font-medium text-black dark:text-white"${_scopeId}> Название папки </label><input${ssrRenderAttr("value", folderName.value)} type="text" placeholder="Введите название..." class="w-full rounded border border-stroke bg-transparent px-4 py-2.5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"${ssrIncludeBooleanAttr(isLoading.value) ? " disabled" : ""} required${_scopeId}></div>`);
            if (error.value) {
              _push2(`<div class="mb-4 rounded bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400"${_scopeId}>${ssrInterpolate(error.value)}</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="flex justify-end gap-3"${_scopeId}><button type="button" class="rounded border border-stroke px-4 py-2 text-black transition hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-gray-800"${ssrIncludeBooleanAttr(isLoading.value) ? " disabled" : ""}${_scopeId}> Отмена </button><button type="submit" class="rounded bg-primary px-4 py-2 text-white transition hover:bg-opacity-90 disabled:opacity-50"${ssrIncludeBooleanAttr(isLoading.value || !folderName.value.trim()) ? " disabled" : ""}${_scopeId}>${ssrInterpolate(isLoading.value ? "Создание..." : "Создать")}</button></div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(handleSubmit, ["prevent"])
              }, [
                createVNode("div", { class: "mb-4" }, [
                  createVNode("label", { class: "mb-2 block text-sm font-medium text-black dark:text-white" }, " Название папки "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => folderName.value = $event,
                    type: "text",
                    placeholder: "Введите название...",
                    class: "w-full rounded border border-stroke bg-transparent px-4 py-2.5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary",
                    disabled: isLoading.value,
                    required: ""
                  }, null, 8, ["onUpdate:modelValue", "disabled"]), [
                    [vModelText, folderName.value]
                  ])
                ]),
                error.value ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "mb-4 rounded bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400"
                }, toDisplayString(error.value), 1)) : createCommentVNode("", true),
                createVNode("div", { class: "flex justify-end gap-3" }, [
                  createVNode("button", {
                    type: "button",
                    onClick: ($event) => _ctx.$emit("close"),
                    class: "rounded border border-stroke px-4 py-2 text-black transition hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-gray-800",
                    disabled: isLoading.value
                  }, " Отмена ", 8, ["onClick", "disabled"]),
                  createVNode("button", {
                    type: "submit",
                    class: "rounded bg-primary px-4 py-2 text-white transition hover:bg-opacity-90 disabled:opacity-50",
                    disabled: isLoading.value || !folderName.value.trim()
                  }, toDisplayString(isLoading.value ? "Создание..." : "Создать"), 9, ["disabled"])
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
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/files/CreateFolderModal.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const CreateFolderModal = Object.assign(_sfc_main$5, { __name: "FilesCreateFolderModal" });
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "RenameModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    currentName: {},
    title: {}
  },
  emits: ["close", "submit"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const newName = ref("");
    const error = ref("");
    const isSubmitting = ref(false);
    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        newName.value = props.currentName;
        error.value = "";
        isSubmitting.value = false;
      }
    });
    const handleSubmit = () => {
      error.value = "";
      if (!newName.value.trim()) {
        error.value = "Имя не может быть пустым";
        return;
      }
      if (newName.value.trim() === props.currentName) {
        error.value = "Новое имя совпадает с текущим";
        return;
      }
      isSubmitting.value = true;
      emit("submit", newName.value.trim());
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        onClose: ($event) => _ctx.$emit("close"),
        title: __props.title
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-4"${_scopeId}><div${_scopeId}><label for="newName" class="mb-2.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Новое имя <span class="text-danger"${_scopeId}>*</span></label><input id="newName"${ssrRenderAttr("value", newName.value)} type="text" required autofocus class="${ssrRenderClass([{ "border-danger": error.value }, "w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}"${_scopeId}>`);
            if (error.value) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(error.value)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="flex justify-end gap-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              type: "button",
              variant: "secondary",
              onClick: ($event) => _ctx.$emit("close"),
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
              type: "submit",
              variant: "primary",
              disabled: isSubmitting.value
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (!isSubmitting.value) {
                    _push3(`<span${_scopeId2}>Переименовать</span>`);
                  } else {
                    _push3(`<span class="flex items-center gap-2"${_scopeId2}><div class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"${_scopeId2}></div> Сохранение... </span>`);
                  }
                } else {
                  return [
                    !isSubmitting.value ? (openBlock(), createBlock("span", { key: 0 }, "Переименовать")) : (openBlock(), createBlock("span", {
                      key: 1,
                      class: "flex items-center gap-2"
                    }, [
                      createVNode("div", { class: "h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" }),
                      createTextVNode(" Сохранение... ")
                    ]))
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
                  createVNode("label", {
                    for: "newName",
                    class: "mb-2.5 block text-sm font-medium text-black dark:text-white"
                  }, [
                    createTextVNode(" Новое имя "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  withDirectives(createVNode("input", {
                    id: "newName",
                    "onUpdate:modelValue": ($event) => newName.value = $event,
                    type: "text",
                    required: "",
                    autofocus: "",
                    class: ["w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary", { "border-danger": error.value }]
                  }, null, 10, ["onUpdate:modelValue"]), [
                    [vModelText, newName.value]
                  ]),
                  error.value ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-sm text-danger"
                  }, toDisplayString(error.value), 1)) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "flex justify-end gap-4" }, [
                  createVNode(_component_UiButton, {
                    type: "button",
                    variant: "secondary",
                    onClick: ($event) => _ctx.$emit("close"),
                    disabled: isSubmitting.value
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["onClick", "disabled"]),
                  createVNode(_component_UiButton, {
                    type: "submit",
                    variant: "primary",
                    disabled: isSubmitting.value
                  }, {
                    default: withCtx(() => [
                      !isSubmitting.value ? (openBlock(), createBlock("span", { key: 0 }, "Переименовать")) : (openBlock(), createBlock("span", {
                        key: 1,
                        class: "flex items-center gap-2"
                      }, [
                        createVNode("div", { class: "h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" }),
                        createTextVNode(" Сохранение... ")
                      ]))
                    ]),
                    _: 1
                  }, 8, ["disabled"])
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
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/files/RenameModal.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const RenameModal = Object.assign(_sfc_main$4, { __name: "FilesRenameModal" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "SetPasswordModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    folderId: {}
  },
  emits: ["close", "submit"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const password = ref("");
    const confirmPassword = ref("");
    const error = ref("");
    const isSubmitting = ref(false);
    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        password.value = "";
        confirmPassword.value = "";
        error.value = "";
        isSubmitting.value = false;
      }
    });
    const handleSubmit = () => {
      error.value = "";
      if (password.value.length < 6) {
        error.value = "Пароль должен содержать минимум 6 символов";
        return;
      }
      if (password.value !== confirmPassword.value) {
        error.value = "Пароли не совпадают";
        return;
      }
      isSubmitting.value = true;
      emit("submit", password.value);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        onClose: ($event) => _ctx.$emit("close"),
        title: "Установить пароль на папку"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-4"${_scopeId}><div${_scopeId}><label for="password" class="mb-2.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Пароль <span class="text-danger"${_scopeId}>*</span></label><input id="password"${ssrRenderAttr("value", password.value)} type="password" required autofocus minlength="6" class="${ssrRenderClass([{ "border-danger": error.value }, "w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" placeholder="Минимум 6 символов"${_scopeId}></div><div${_scopeId}><label for="confirmPassword" class="mb-2.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Подтвердите пароль <span class="text-danger"${_scopeId}>*</span></label><input id="confirmPassword"${ssrRenderAttr("value", confirmPassword.value)} type="password" required minlength="6" class="${ssrRenderClass([{ "border-danger": error.value }, "w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" placeholder="Повторите пароль"${_scopeId}>`);
            if (error.value) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(error.value)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="flex justify-end gap-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              type: "button",
              variant: "secondary",
              onClick: ($event) => _ctx.$emit("close"),
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
              type: "submit",
              variant: "primary",
              disabled: isSubmitting.value
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (!isSubmitting.value) {
                    _push3(`<span${_scopeId2}>Установить пароль</span>`);
                  } else {
                    _push3(`<span class="flex items-center gap-2"${_scopeId2}><div class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"${_scopeId2}></div> Сохранение... </span>`);
                  }
                } else {
                  return [
                    !isSubmitting.value ? (openBlock(), createBlock("span", { key: 0 }, "Установить пароль")) : (openBlock(), createBlock("span", {
                      key: 1,
                      class: "flex items-center gap-2"
                    }, [
                      createVNode("div", { class: "h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" }),
                      createTextVNode(" Сохранение... ")
                    ]))
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
                  createVNode("label", {
                    for: "password",
                    class: "mb-2.5 block text-sm font-medium text-black dark:text-white"
                  }, [
                    createTextVNode(" Пароль "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  withDirectives(createVNode("input", {
                    id: "password",
                    "onUpdate:modelValue": ($event) => password.value = $event,
                    type: "password",
                    required: "",
                    autofocus: "",
                    minlength: "6",
                    class: ["w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary", { "border-danger": error.value }],
                    placeholder: "Минимум 6 символов"
                  }, null, 10, ["onUpdate:modelValue"]), [
                    [vModelText, password.value]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", {
                    for: "confirmPassword",
                    class: "mb-2.5 block text-sm font-medium text-black dark:text-white"
                  }, [
                    createTextVNode(" Подтвердите пароль "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  withDirectives(createVNode("input", {
                    id: "confirmPassword",
                    "onUpdate:modelValue": ($event) => confirmPassword.value = $event,
                    type: "password",
                    required: "",
                    minlength: "6",
                    class: ["w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary", { "border-danger": error.value }],
                    placeholder: "Повторите пароль"
                  }, null, 10, ["onUpdate:modelValue"]), [
                    [vModelText, confirmPassword.value]
                  ]),
                  error.value ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-sm text-danger"
                  }, toDisplayString(error.value), 1)) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "flex justify-end gap-4" }, [
                  createVNode(_component_UiButton, {
                    type: "button",
                    variant: "secondary",
                    onClick: ($event) => _ctx.$emit("close"),
                    disabled: isSubmitting.value
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["onClick", "disabled"]),
                  createVNode(_component_UiButton, {
                    type: "submit",
                    variant: "primary",
                    disabled: isSubmitting.value
                  }, {
                    default: withCtx(() => [
                      !isSubmitting.value ? (openBlock(), createBlock("span", { key: 0 }, "Установить пароль")) : (openBlock(), createBlock("span", {
                        key: 1,
                        class: "flex items-center gap-2"
                      }, [
                        createVNode("div", { class: "h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" }),
                        createTextVNode(" Сохранение... ")
                      ]))
                    ]),
                    _: 1
                  }, 8, ["disabled"])
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
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/files/SetPasswordModal.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const SetPasswordModal = Object.assign(_sfc_main$3, { __name: "FilesSetPasswordModal" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "UnlockFolderModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    folderId: {}
  },
  emits: ["close", "submit", "error"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const password = ref("");
    const error = ref("");
    const isSubmitting = ref(false);
    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        password.value = "";
        error.value = "";
        isSubmitting.value = false;
      }
    });
    const handleSubmit = () => {
      error.value = "";
      if (!password.value) {
        error.value = "Введите пароль";
        return;
      }
      isSubmitting.value = true;
      emit("submit", password.value);
    };
    const setError = (message) => {
      error.value = message;
      isSubmitting.value = false;
    };
    __expose({
      setError
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        onClose: ($event) => _ctx.$emit("close"),
        title: "Введите пароль"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-4"${_scopeId}><div class="flex items-center gap-3 mb-4"${_scopeId}><svg class="h-12 w-12 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"${_scopeId}></path></svg><div${_scopeId}><p class="text-sm font-medium text-black dark:text-white"${_scopeId}> Папка защищена паролем </p><p class="text-xs text-gray-500 dark:text-gray-400"${_scopeId}> Введите пароль для доступа к содержимому </p></div></div><div${_scopeId}><label for="password" class="mb-2.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Пароль <span class="text-danger"${_scopeId}>*</span></label><input id="password"${ssrRenderAttr("value", password.value)} type="password" required autofocus class="${ssrRenderClass([{ "border-danger": error.value }, "w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"])}" placeholder="Введите пароль"${_scopeId}>`);
            if (error.value) {
              _push2(`<p class="mt-1 text-sm text-danger"${_scopeId}>${ssrInterpolate(error.value)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="flex justify-end gap-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              type: "button",
              variant: "secondary",
              onClick: ($event) => _ctx.$emit("close"),
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
              type: "submit",
              variant: "primary",
              disabled: isSubmitting.value
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (!isSubmitting.value) {
                    _push3(`<span${_scopeId2}>Разблокировать</span>`);
                  } else {
                    _push3(`<span class="flex items-center gap-2"${_scopeId2}><div class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"${_scopeId2}></div> Проверка... </span>`);
                  }
                } else {
                  return [
                    !isSubmitting.value ? (openBlock(), createBlock("span", { key: 0 }, "Разблокировать")) : (openBlock(), createBlock("span", {
                      key: 1,
                      class: "flex items-center gap-2"
                    }, [
                      createVNode("div", { class: "h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" }),
                      createTextVNode(" Проверка... ")
                    ]))
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
                createVNode("div", { class: "flex items-center gap-3 mb-4" }, [
                  (openBlock(), createBlock("svg", {
                    class: "h-12 w-12 text-warning",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    })
                  ])),
                  createVNode("div", null, [
                    createVNode("p", { class: "text-sm font-medium text-black dark:text-white" }, " Папка защищена паролем "),
                    createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, " Введите пароль для доступа к содержимому ")
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", {
                    for: "password",
                    class: "mb-2.5 block text-sm font-medium text-black dark:text-white"
                  }, [
                    createTextVNode(" Пароль "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  withDirectives(createVNode("input", {
                    id: "password",
                    "onUpdate:modelValue": ($event) => password.value = $event,
                    type: "password",
                    required: "",
                    autofocus: "",
                    class: ["w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary", { "border-danger": error.value }],
                    placeholder: "Введите пароль",
                    onInput: ($event) => error.value = ""
                  }, null, 42, ["onUpdate:modelValue", "onInput"]), [
                    [vModelText, password.value]
                  ]),
                  error.value ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-sm text-danger"
                  }, toDisplayString(error.value), 1)) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "flex justify-end gap-4" }, [
                  createVNode(_component_UiButton, {
                    type: "button",
                    variant: "secondary",
                    onClick: ($event) => _ctx.$emit("close"),
                    disabled: isSubmitting.value
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["onClick", "disabled"]),
                  createVNode(_component_UiButton, {
                    type: "submit",
                    variant: "primary",
                    disabled: isSubmitting.value
                  }, {
                    default: withCtx(() => [
                      !isSubmitting.value ? (openBlock(), createBlock("span", { key: 0 }, "Разблокировать")) : (openBlock(), createBlock("span", {
                        key: 1,
                        class: "flex items-center gap-2"
                      }, [
                        createVNode("div", { class: "h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" }),
                        createTextVNode(" Проверка... ")
                      ]))
                    ]),
                    _: 1
                  }, 8, ["disabled"])
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
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/files/UnlockFolderModal.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const UnlockFolderModal = Object.assign(_sfc_main$2, { __name: "FilesUnlockFolderModal" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ContextMenu",
  __ssrInlineRender: true,
  props: {
    visible: { type: Boolean },
    position: {},
    items: {}
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const menuRef = ref(null);
    watch(() => props.visible, async (visible) => {
      if (visible) {
        await nextTick();
        if (menuRef.value) {
          const menu = menuRef.value;
          const rect = menu.getBoundingClientRect();
          const viewportWidth = (void 0).innerWidth;
          const viewportHeight = (void 0).innerHeight;
          let { x, y } = props.position;
          if (rect.right > viewportWidth) {
            x = viewportWidth - rect.width - 10;
          }
          if (rect.bottom > viewportHeight) {
            y = viewportHeight - rect.height - 10;
          }
          if (x < 0) {
            x = 10;
          }
          if (y < 0) {
            y = 10;
          }
          menu.style.left = x + "px";
          menu.style.top = y + "px";
        }
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderTeleport(_push, (_push2) => {
        if (__props.visible) {
          _push2(`<div style="${ssrRenderStyle({ top: __props.position.y + "px", left: __props.position.x + "px" })}" class="fixed z-99999 min-w-48 rounded-md border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark"><div class="py-2"><!--[-->`);
          ssrRenderList(__props.items, (item, index) => {
            _push2(`<button${ssrIncludeBooleanAttr(item.disabled) ? " disabled" : ""} class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">`);
            if (item.icon) {
              ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(item.icon), {
                class: ["h-5 w-5", item.iconClass]
              }, null), _parent);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<span>${ssrInterpolate(item.label)}</span></button>`);
          });
          _push2(`<!--]--></div></div>`);
        } else {
          _push2(`<!---->`);
        }
        if (__props.visible) {
          _push2(`<div class="fixed inset-0 z-99998"></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/files/ContextMenu.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const ContextMenu = Object.assign(_sfc_main$1, { __name: "FilesContextMenu" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const { getFolderContents } = useFolderManager();
    const { formatFileSize } = useFileManager();
    const { authFetch } = useAuthFetch();
    const notification = useNotification();
    const folders = ref([]);
    const files = ref([]);
    const isLoading = ref(false);
    const isSyncing = ref(false);
    const showCreateFolderModal = ref(false);
    const showUploadModal = ref(false);
    const showPreviewModal = ref(false);
    const showRenameModal = ref(false);
    const showSetPasswordModal = ref(false);
    const showUnlockModal = ref(false);
    const previewFile = ref(null);
    const renameTarget = ref(null);
    const passwordTarget = ref(null);
    const unlockTarget = ref(null);
    const unlockModalRef = ref(null);
    const unlockedFolders = ref(/* @__PURE__ */ new Set());
    const contextMenu = ref({
      visible: false,
      position: { x: 0, y: 0 },
      items: [],
      target: null
    });
    const currentFolderId = ref(null);
    const currentPath = ref("/");
    const loadFolderContents = async () => {
      isLoading.value = true;
      try {
        const contents = await getFolderContents(currentFolderId.value);
        folders.value = contents.folders;
        files.value = contents.files;
      } catch (error) {
        console.error("Ошибка загрузки содержимого папки:", error);
        alert("Не удалось загрузить содержимое папки");
      } finally {
        isLoading.value = false;
      }
    };
    const navigateToFolder = async (folderId) => {
      if (folderId !== null) {
        const folder = folders.value.find((f) => f.id === folderId);
        if (folder?.passwordHash && !unlockedFolders.value.has(folderId)) {
          unlockTarget.value = { id: folder.id, name: folder.name };
          showUnlockModal.value = true;
          return;
        }
      }
      currentFolderId.value = folderId;
      if (folderId === null) {
        currentPath.value = "/";
      } else {
        try {
          const response = await authFetch(
            `/api/folders/${folderId}/path`
          );
          if (response.success && response.currentFolder?.path) {
            currentPath.value = response.currentFolder.path;
          } else {
            const folder = folders.value.find((f) => f.id === folderId);
            if (folder) {
              currentPath.value = folder.path;
            }
          }
        } catch (error) {
          console.error("Ошибка получения пути папки:", error);
          const folder = folders.value.find((f) => f.id === folderId);
          if (folder) {
            currentPath.value = folder.path;
          }
        }
      }
      loadFolderContents();
    };
    const handleFolderCreated = (folderId) => {
      console.log("Папка создана:", folderId);
      loadFolderContents();
    };
    const handleFileUploaded = (file) => {
      console.log("Файл загружен:", file.filename);
      showUploadModal.value = false;
      loadFolderContents();
    };
    const handleUploadError = (message) => {
      console.error("Ошибка загрузки:", message);
    };
    const isImage = (mimeType) => {
      return mimeType.startsWith("image/");
    };
    const handleRename = async (newName) => {
      if (!renameTarget.value) return;
      try {
        const { type, id } = renameTarget.value;
        if (type === "folder") {
          await authFetch(`/api/folders/${id}/rename`, {
            method: "PUT",
            body: { newName }
          });
          notification.success("Папка успешно переименована", "Успех");
        } else {
          await authFetch(`/api/files/${id}/rename`, {
            method: "PUT",
            body: { newName }
          });
          notification.success("Файл успешно переименован", "Успех");
        }
        showRenameModal.value = false;
        renameTarget.value = null;
        loadFolderContents();
      } catch (error) {
        console.error("Ошибка переименования:", error);
        const errorMessage = error?.data?.message || error?.message || "Произошла ошибка при переименовании";
        notification.error(errorMessage, "Ошибка");
      }
    };
    const handleSetPassword = async (password) => {
      if (!passwordTarget.value) return;
      try {
        await authFetch(`/api/folders/${passwordTarget.value.id}/set-password`, {
          method: "POST",
          body: { password }
        });
        notification.success("Пароль успешно установлен", "Успех");
        showSetPasswordModal.value = false;
        passwordTarget.value = null;
        loadFolderContents();
      } catch (error) {
        console.error("Ошибка установки пароля:", error);
        const errorMessage = error?.data?.message || error?.message || "Произошла ошибка при установке пароля";
        notification.error(errorMessage, "Ошибка");
      }
    };
    const handleUnlockFolder = async (password) => {
      if (!unlockTarget.value) return;
      try {
        await authFetch(`/api/folders/${unlockTarget.value.id}/verify-password`, {
          method: "POST",
          body: { password }
        });
        unlockedFolders.value.add(unlockTarget.value.id);
        sessionStorage.setItem("unlockedFolders", JSON.stringify(Array.from(unlockedFolders.value)));
        showUnlockModal.value = false;
        const folderId = unlockTarget.value.id;
        unlockTarget.value = null;
        navigateToFolder(folderId);
      } catch (error) {
        console.error("Ошибка проверки пароля:", error);
        const errorMessage = error?.data?.message || error?.message || "Неверный пароль";
        if (unlockModalRef.value) {
          unlockModalRef.value.setError(errorMessage);
        }
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-title-md2 font-bold text-black dark:text-white"> Файловый менеджер </h2><div class="flex gap-2"><button${ssrIncludeBooleanAttr(isSyncing.value) ? " disabled" : ""} class="inline-flex items-center gap-2 rounded-md border border-meta-3 bg-transparent px-4 py-2.5 text-sm font-medium text-meta-3 hover:bg-meta-3 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Синхронизировать файлы и папки из storage/uploads"><svg class="${ssrRenderClass([{ "animate-spin": isSyncing.value }, "h-5 w-5"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> ${ssrInterpolate(isSyncing.value ? "Синхронизация..." : "Синхронизировать")}</button><button class="inline-flex items-center gap-2 rounded-md border border-primary bg-transparent px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary hover:text-white transition-all duration-200"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg> Создать папку </button><button class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 transition-all duration-200">`);
      _push(ssrRenderComponent(PlusIcon, { class: "h-5 w-5" }, null, _parent));
      _push(` Загрузить файлы </button></div></div>`);
      _push(ssrRenderComponent(Breadcrumbs, {
        path: currentPath.value,
        "current-folder-id": currentFolderId.value,
        onNavigate: navigateToFolder
      }, null, _parent));
      _push(`<div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"><div class="p-4 md:p-6">`);
      if (isLoading.value) {
        _push(`<div class="flex items-center justify-center py-12"><div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (folders.value.length === 0 && files.value.length === 0) {
        _push(`<div class="py-12 text-center"><svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg><p class="text-gray-500 dark:text-gray-400"> Папка пуста. Создайте подпапку или загрузите файлы. </p></div>`);
      } else {
        _push(`<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"><!--[-->`);
        ssrRenderList(folders.value, (folder) => {
          _push(`<div class="group relative rounded-lg border border-stroke dark:border-strokedark p-4 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer"><div class="flex flex-col items-center gap-3"><div class="relative text-yellow-500"><svg class="h-16 w-16" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>`);
          if (folder.passwordHash) {
            _push(`<svg class="absolute -bottom-1 -right-1 h-6 w-6 text-warning bg-white dark:bg-boxdark rounded-full p-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Защищена паролем"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><p class="text-sm font-medium text-black dark:text-white text-center truncate w-full"${ssrRenderAttr("title", folder.name)}>${ssrInterpolate(folder.name)}</p>`);
          if (folder.isSystem) {
            _push(`<span class="text-xs text-gray-500 dark:text-gray-400"> Системная </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--><!--[-->`);
        ssrRenderList(files.value, (file) => {
          _push(`<div class="group relative rounded-lg border border-stroke dark:border-strokedark p-4 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer"><div class="aspect-square mb-3 rounded overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">`);
          if (isImage(file.mimeType)) {
            _push(`<img${ssrRenderAttr("src", file.url)}${ssrRenderAttr("alt", file.filename)} class="w-full h-full object-cover">`);
          } else {
            _push(ssrRenderComponent(FileTypeIcon, {
              "mime-type": file.mimeType,
              extension: file.extension,
              size: "xl"
            }, null, _parent));
          }
          _push(`</div><div><p class="text-sm font-medium text-black dark:text-white truncate mb-1"${ssrRenderAttr("title", file.filename)}>${ssrInterpolate(file.filename)}</p><p class="text-xs text-gray-500 dark:text-gray-400">${ssrInterpolate(unref(formatFileSize)(file.sizeBytes))}</p></div><div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"><button class="p-1.5 rounded bg-white dark:bg-gray-800 text-red-500 hover:bg-red-500 hover:text-white shadow transition-colors" title="Удалить">`);
          _push(ssrRenderComponent(TrashIcon, { class: "h-4 w-4" }, null, _parent));
          _push(`</button></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div>`);
      _push(ssrRenderComponent(CreateFolderModal, {
        "is-open": showCreateFolderModal.value,
        "parent-id": currentFolderId.value,
        onClose: ($event) => showCreateFolderModal.value = false,
        onCreated: handleFolderCreated
      }, null, _parent));
      _push(ssrRenderComponent(__nuxt_component_0, {
        "is-open": showUploadModal.value,
        title: "Загрузить файлы",
        size: "lg",
        onClose: ($event) => showUploadModal.value = false
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(FileUploader, {
              category: "other",
              "folder-id": currentFolderId.value,
              accept: "*/*",
              "max-size-mb": 50,
              multiple: true,
              onUploaded: handleFileUploaded,
              onError: handleUploadError
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(FileUploader, {
                category: "other",
                "folder-id": currentFolderId.value,
                accept: "*/*",
                "max-size-mb": 50,
                multiple: true,
                onUploaded: handleFileUploaded,
                onError: handleUploadError
              }, null, 8, ["folder-id"])
            ];
          }
        }),
        _: 1
      }, _parent));
      if (previewFile.value) {
        _push(ssrRenderComponent(FilePreviewModal, {
          "is-open": showPreviewModal.value,
          file: previewFile.value,
          onClose: ($event) => showPreviewModal.value = false
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(RenameModal, {
        "is-open": showRenameModal.value,
        "current-name": renameTarget.value?.name || "",
        title: renameTarget.value?.type === "folder" ? "Переименовать папку" : "Переименовать файл",
        onClose: ($event) => showRenameModal.value = false,
        onSubmit: handleRename
      }, null, _parent));
      if (passwordTarget.value) {
        _push(ssrRenderComponent(SetPasswordModal, {
          "is-open": showSetPasswordModal.value,
          "folder-id": passwordTarget.value.id,
          onClose: ($event) => showSetPasswordModal.value = false,
          onSubmit: handleSetPassword
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unlockTarget.value) {
        _push(ssrRenderComponent(UnlockFolderModal, {
          ref_key: "unlockModalRef",
          ref: unlockModalRef,
          "is-open": showUnlockModal.value,
          "folder-id": unlockTarget.value.id,
          onClose: ($event) => showUnlockModal.value = false,
          onSubmit: handleUnlockFolder
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(ContextMenu, {
        visible: contextMenu.value.visible,
        position: contextMenu.value.position,
        items: contextMenu.value.items,
        onClose: ($event) => contextMenu.value.visible = false
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/files/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-CDGXZtm6.mjs.map
