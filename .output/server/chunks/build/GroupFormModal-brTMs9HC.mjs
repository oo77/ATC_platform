import { _ as __nuxt_component_0 } from './Modal-DQYphXo7.mjs';
import { defineComponent, ref, computed, watch, mergeProps, withCtx, createVNode, withModifiers, createBlock, createCommentVNode, openBlock, createTextVNode, withDirectives, Fragment, renderList, toDisplayString, vModelSelect, vModelText, vModelCheckbox, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderAttrs } from 'vue/server-renderer';
import { _ as __nuxt_component_1$1 } from './Button-D9CRGwzT.mjs';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
import { e as useAuth } from './server.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "GroupReportUploader",
  __ssrInlineRender: true,
  props: {
    loading: { type: Boolean }
  },
  emits: ["filesSelected"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const fileInput = ref(null);
    const isDragging = ref(false);
    const selectedFiles = ref([]);
    const formatFileSize = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };
    const clearFiles = () => {
      selectedFiles.value = [];
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    };
    __expose({
      clearFiles
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-6" }, _attrs))}><div class="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20"><div class="flex items-start gap-4"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="flex-1"><h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100"> Требования к файлам </h3><ul class="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-200"><li class="flex items-start gap-2"><svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Формат файла: <strong>только .pdf</strong></span></li><li class="flex items-start gap-2"><svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Максимальный размер файла: <strong>10 МБ</strong></span></li><li class="flex items-start gap-2"><svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Можно загрузить <strong>несколько файлов</strong> одновременно</span></li></ul></div></div></div><div class="${ssrRenderClass([
        "relative rounded-xl border-2 border-dashed transition-all duration-300",
        isDragging.value ? "border-primary bg-primary/5 scale-[1.02]" : "border-gray-300 dark:border-gray-600",
        __props.loading ? "pointer-events-none opacity-60" : ""
      ])}"><input type="file" accept=".pdf" multiple class="hidden"><div class="flex flex-col items-center justify-center p-12"><div class="${ssrRenderClass([
        "mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300",
        isDragging.value ? "bg-primary scale-110" : "bg-gray-100 dark:bg-gray-800"
      ])}">`);
      if (!__props.loading) {
        _push(`<svg class="${ssrRenderClass([
          "w-10 h-10 transition-colors duration-300",
          isDragging.value ? "text-white" : "text-gray-400 dark:text-gray-500"
        ])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>`);
      } else {
        _push(`<svg class="w-10 h-10 text-primary animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
      }
      _push(`</div><div class="text-center"><p class="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">${ssrInterpolate(__props.loading ? "Загрузка файлов..." : isDragging.value ? "Отпустите файлы" : "Перетащите файлы сюда")}</p><p class="mb-4 text-sm text-gray-500 dark:text-gray-400">или</p><button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Выбрать файлы </button></div>`);
      if (selectedFiles.value.length > 0) {
        _push(`<div class="mt-6 w-full max-w-2xl space-y-2"><p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"> Выбрано файлов: ${ssrInterpolate(selectedFiles.value.length)}</p><!--[-->`);
        ssrRenderList(selectedFiles.value, (file, index) => {
          _push(`<div class="flex items-center justify-between gap-3 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20"><div class="flex items-center gap-3 flex-1 min-w-0"><svg class="w-6 h-6 text-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><div class="flex-1 min-w-0"><p class="text-sm font-medium text-green-800 dark:text-green-200 truncate">${ssrInterpolate(file.name)}</p><p class="text-xs text-green-600 dark:text-green-400">${ssrInterpolate(formatFileSize(file.size))}</p></div></div><button${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""} class="text-gray-500 hover:text-danger transition-colors disabled:opacity-50"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/groups/GroupReportUploader.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$1, { __name: "GroupsGroupReportUploader" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "GroupFormModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    group: {}
  },
  emits: ["close", "created", "updated"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const toast = useNotification();
    const { user } = useAuth();
    const loading = ref(false);
    const courses = ref([]);
    const form = ref({
      code: "",
      courseId: "",
      startDate: "",
      endDate: "",
      description: "",
      isActive: true
    });
    const errors = ref({});
    const uploaderRef = ref(null);
    const selectedFiles = ref([]);
    const existingReports = ref([]);
    const loadingReports = ref(false);
    const isEdit = computed(() => !!props.group);
    const userRole = computed(() => user.value?.role);
    const canEditDates = computed(() => {
      if (!isEdit.value) return true;
      if (userRole.value === "ADMIN") return true;
      if (props.group && props.group.endDate) {
        const now = /* @__PURE__ */ new Date();
        const endDate = new Date(props.group.endDate);
        return now <= endDate;
      }
      return true;
    });
    const handleFilesSelected = (files) => {
      selectedFiles.value = files;
      errors.value.file = "";
    };
    const loadReports = async (groupId) => {
      loadingReports.value = true;
      try {
        const response = await authFetch(
          `/api/groups/${groupId}/reports`
        );
        if (response.success) {
          existingReports.value = response.files;
        }
      } catch (error) {
        console.error("Ошибка загрузки отчетов:", error);
      } finally {
        loadingReports.value = false;
      }
    };
    const loadCourses = async () => {
      try {
        const response = await authFetch(
          "/api/courses",
          {
            params: { limit: 1e3, isActive: true }
          }
        );
        if (response.success && response.courses) {
          courses.value = response.courses;
        }
      } catch (error) {
        console.error("Error loading courses:", error);
      }
    };
    const validateForm = () => {
      errors.value = {};
      if (!form.value.code.trim()) {
        errors.value.code = "Код обязателен";
      }
      if (!form.value.courseId) {
        errors.value.courseId = "Выберите программу";
      }
      if (!form.value.startDate) {
        errors.value.startDate = "Укажите начало";
      }
      if (!form.value.endDate) {
        errors.value.endDate = "Укажите окончание";
      } else if (form.value.startDate && new Date(form.value.endDate) < new Date(form.value.startDate)) {
        errors.value.endDate = "Ошибка дат";
      }
      if (!isEdit.value && selectedFiles.value.length === 0) {
        errors.value.file = "Загрузите PDF";
      }
      return Object.keys(errors.value).length === 0;
    };
    const handleSubmit = async () => {
      if (loading.value) return;
      if (!validateForm()) return;
      loading.value = true;
      try {
        if (isEdit.value && props.group) {
          const updateData = { ...form.value };
          const response = await authFetch(`/api/groups/${props.group.id}`, {
            method: "PUT",
            body: updateData
          });
          if (response.success && response.group) {
            toast.success("Группа обновлена");
            emit("updated", response.group);
            emit("close");
          } else {
            handleErrors(response);
          }
        } else {
          const formData = new FormData();
          formData.append("data", JSON.stringify(form.value));
          for (const file of selectedFiles.value) {
            formData.append("reportFile", file);
          }
          const response = await authFetch("/api/groups", {
            method: "POST",
            body: formData
            // Важно: не устанавливаем Content-Type вручную, браузер сам сделает это для FormData
          });
          if (response.success && response.group) {
            toast.success("Группа создана");
            emit("created", response.group);
            emit("close");
          } else {
            handleErrors(response);
          }
        }
      } catch (error) {
        if (error.data) {
          handleErrors(error.data);
        } else {
          toast.error("Ошибка сохранения");
        }
      } finally {
        loading.value = false;
      }
    };
    const handleErrors = (response) => {
      if (response.errors && Array.isArray(response.errors)) {
        for (const err of response.errors) {
          if (err.field) {
            const fieldName = err.field.includes(".") ? err.field.split(".").pop() : err.field;
            errors.value[fieldName] = err.message;
          }
        }
        toast.error(response.message || "Проверьте данные");
      } else {
        toast.error(response.message || "Ошибка");
      }
    };
    const resetForm = () => {
      form.value = {
        code: "",
        courseId: "",
        startDate: "",
        endDate: "",
        description: "",
        isActive: true
      };
      errors.value = {};
      selectedFiles.value = [];
      uploaderRef.value?.clearFiles();
      existingReports.value = [];
    };
    const fillFormFromGroup = (group) => {
      form.value = {
        code: group.code,
        courseId: group.courseId,
        startDate: formatDateForInput(group.startDate),
        endDate: formatDateForInput(group.endDate),
        description: group.description || "",
        isActive: Boolean(group.isActive)
      };
      if (group.id) {
        loadReports(group.id);
      }
    };
    const formatDateForInput = (date) => {
      if (!date) return "";
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    watch(
      () => props.isOpen,
      (isOpen) => {
        if (isOpen) {
          loadCourses();
          if (props.group) {
            fillFormFromGroup(props.group);
          } else {
            resetForm();
          }
        }
      }
    );
    watch(
      () => props.group,
      (group) => {
        if (group && props.isOpen) {
          fillFormFromGroup(group);
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_GroupsGroupReportUploader = __nuxt_component_1;
      const _component_UiButton = __nuxt_component_1$1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: isEdit.value ? "Редактировать группу" : "Создать группу",
        size: "xl",
        onClose: ($event) => _ctx.$emit("close")
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-between items-center pt-2 border-t border-stroke dark:border-strokedark mt-2"${_scopeId}><div class="text-xs text-gray-400"${_scopeId}>${ssrInterpolate(isEdit.value ? "ID: " + __props.group?.id.slice(0, 8) : "* - Обязательные поля")}</div><div class="flex gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: ($event) => _ctx.$emit("close")
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
              loading: loading.value,
              onClick: handleSubmit,
              class: "min-w-[140px]"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`${ssrInterpolate(isEdit.value ? "Сохранить" : "Создать группу")}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(isEdit.value ? "Сохранить" : "Создать группу"), 1)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-between items-center pt-2 border-t border-stroke dark:border-strokedark mt-2" }, [
                createVNode("div", { class: "text-xs text-gray-400" }, toDisplayString(isEdit.value ? "ID: " + __props.group?.id.slice(0, 8) : "* - Обязательные поля"), 1),
                createVNode("div", { class: "flex gap-3" }, [
                  createVNode(_component_UiButton, {
                    variant: "outline",
                    onClick: ($event) => _ctx.$emit("close")
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Отмена ")
                    ]),
                    _: 1
                  }, 8, ["onClick"]),
                  createVNode(_component_UiButton, {
                    loading: loading.value,
                    onClick: handleSubmit,
                    class: "min-w-[140px]"
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(isEdit.value ? "Сохранить" : "Создать группу"), 1)
                    ]),
                    _: 1
                  }, 8, ["loading"])
                ])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form${_scopeId}><div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"${_scopeId}><div class="space-y-4"${_scopeId}>`);
            if (__props.group?.isArchived) {
              _push2(`<div class="rounded-lg bg-yellow-100 p-2.5 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"${_scopeId}><div class="flex items-center gap-2"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"${_scopeId}><path fill-rule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clip-rule="evenodd"${_scopeId}></path></svg><span class="font-medium"${_scopeId}>Группа в архиве</span></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (!canEditDates.value && isEdit.value) {
              _push2(`<div class="rounded-lg bg-blue-100 p-2.5 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"${_scopeId}><div class="flex items-center gap-2"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"${_scopeId}><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"${_scopeId}></path></svg><span${_scopeId}>Даты завершены.</span></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div${_scopeId}><label class="mb-1.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Учебная программа <span class="text-danger"${_scopeId}>*</span></label><div class="relative"${_scopeId}><select class="${ssrRenderClass([
              "w-full rounded-lg border-[1.5px] bg-white dark:bg-boxdark px-4 py-2 font-medium outline-none transition appearance-none text-sm",
              errors.value.courseId ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
            ])}"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(form.value.courseId) ? ssrLooseContain(form.value.courseId, "") : ssrLooseEqual(form.value.courseId, "")) ? " selected" : ""}${_scopeId}>Выберите программу...</option><!--[-->`);
            ssrRenderList(courses.value, (course) => {
              _push2(`<option${ssrRenderAttr("value", course.id)}${ssrIncludeBooleanAttr(Array.isArray(form.value.courseId) ? ssrLooseContain(form.value.courseId, course.id) : ssrLooseEqual(form.value.courseId, course.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(course.shortName)} - ${ssrInterpolate(course.name)}</option>`);
            });
            _push2(`<!--]--></select><div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div>`);
            if (errors.value.courseId) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(errors.value.courseId)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="mb-1.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Код группы <span class="text-danger"${_scopeId}>*</span></label><input${ssrRenderAttr("value", form.value.code)} type="text" placeholder="АПАК-20" class="${ssrRenderClass([
              "w-full rounded-lg border-[1.5px] bg-white dark:bg-boxdark px-4 py-2 font-medium outline-none transition text-sm",
              errors.value.code ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
            ])}"${_scopeId}>`);
            if (errors.value.code) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(errors.value.code)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="grid grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><label class="mb-1.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Начало </label><input${ssrRenderAttr("value", form.value.startDate)} type="date"${ssrIncludeBooleanAttr(isEdit.value && !canEditDates.value) ? " disabled" : ""} class="${ssrRenderClass([
              "w-full rounded-lg border-[1.5px] bg-white dark:bg-boxdark px-4 py-2 font-medium outline-none transition text-sm",
              errors.value.startDate ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary",
              isEdit.value && !canEditDates.value ? "bg-gray-100 dark:bg-meta-4 opacity-70 cursor-not-allowed" : ""
            ])}"${_scopeId}>`);
            if (errors.value.startDate) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(errors.value.startDate)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="mb-1.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Окончание </label><input${ssrRenderAttr("value", form.value.endDate)} type="date"${ssrIncludeBooleanAttr(isEdit.value && !canEditDates.value) ? " disabled" : ""} class="${ssrRenderClass([
              "w-full rounded-lg border-[1.5px] bg-white dark:bg-boxdark px-4 py-2 font-medium outline-none transition text-sm",
              errors.value.endDate ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary",
              isEdit.value && !canEditDates.value ? "bg-gray-100 dark:bg-meta-4 opacity-70 cursor-not-allowed" : ""
            ])}"${_scopeId}>`);
            if (errors.value.endDate) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(errors.value.endDate)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div${_scopeId}><label class="mb-1.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Заметки </label><textarea placeholder="..." rows="2" class="w-full rounded-lg border-[1.5px] border-stroke bg-white dark:bg-boxdark px-4 py-2 font-medium outline-none transition text-sm focus:border-primary dark:border-form-strokedark dark:focus:border-primary resize-none"${_scopeId}>${ssrInterpolate(form.value.description)}</textarea></div><div class="pt-1"${_scopeId}><label class="relative inline-flex cursor-pointer items-center group"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(form.value.isActive) ? ssrLooseContain(form.value.isActive, null) : form.value.isActive) ? " checked" : ""} type="checkbox" class="peer sr-only"${_scopeId}><div class="h-5 w-9 shrink-0 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[&#39;&#39;] peer-checked:bg-success peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"${_scopeId}></div><span class="ml-3 text-sm font-medium text-black dark:text-white group-hover:text-primary transition-colors"${_scopeId}>${ssrInterpolate(form.value.isActive ? "Активна" : "Неактивна")}</span></label></div></div><div class="h-full flex flex-col"${_scopeId}><label class="mb-1.5 block text-sm font-medium text-black dark:text-white"${_scopeId}> Официальные основания (PDF) `);
            if (!isEdit.value) {
              _push2(`<span class="text-danger"${_scopeId}>*</span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</label><div class="grow rounded-lg border border-stroke bg-gray-50 dark:bg-meta-4/20 dark:border-strokedark p-4 flex flex-col"${_scopeId}>`);
            if (!isEdit.value) {
              _push2(`<div class="h-full"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_GroupsGroupReportUploader, {
                ref_key: "uploaderRef",
                ref: uploaderRef,
                loading: false,
                onFilesSelected: handleFilesSelected,
                class: "h-full"
              }, null, _parent2, _scopeId));
              if (errors.value.file) {
                _push2(`<p class="mt-2 text-xs text-danger"${_scopeId}>${ssrInterpolate(errors.value.file)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<div class="h-full flex flex-col"${_scopeId}>`);
              if (loadingReports.value) {
                _push2(`<div class="text-sm text-gray-500 grow flex items-center justify-center"${_scopeId}><span class="inline-flex items-center gap-2"${_scopeId}><svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"${_scopeId}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId}></path></svg> Загрузка... </span></div>`);
              } else if (existingReports.value.length === 0) {
                _push2(`<div class="text-sm text-gray-500 grow flex items-center justify-center italic"${_scopeId}> Нет документов </div>`);
              } else {
                _push2(`<div class="grow overflow-y-auto pr-1 custom-scrollbar space-y-2 max-h-[300px]"${_scopeId}><!--[-->`);
                ssrRenderList(existingReports.value, (report) => {
                  _push2(`<div class="flex items-center justify-between rounded bg-white dark:bg-boxdark p-3 border border-stroke dark:border-strokedark hover:shadow-sm"${_scopeId}><div class="flex items-center gap-3 overflow-hidden"${_scopeId}><div class="h-8 w-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0"${_scopeId}><span class="text-[10px] font-bold"${_scopeId}>PDF</span></div><div class="min-w-0"${_scopeId}><p class="truncate text-sm font-medium"${ssrRenderAttr("title", report.name)}${_scopeId}>${ssrInterpolate(report.name)}</p><p class="text-xs text-gray-500"${_scopeId}>${ssrInterpolate(new Date(report.uploadedAt).toLocaleDateString())}</p></div></div><a${ssrRenderAttr("href", report.url)} target="_blank" class="text-gray-500 hover:text-primary p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Скачать"${_scopeId}><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"${_scopeId}></path></svg></a></div>`);
                });
                _push2(`<!--]--></div>`);
              }
              _push2(`<div class="mt-3 text-[10px] text-gray-400 text-center border-t border-stroke dark:border-strokedark pt-2"${_scopeId}> Управление документами на странице группы </div></div>`);
            }
            _push2(`</div></div></div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(handleSubmit, ["prevent"])
              }, [
                createVNode("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-8 items-start" }, [
                  createVNode("div", { class: "space-y-4" }, [
                    __props.group?.isArchived ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "rounded-lg bg-yellow-100 p-2.5 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                    }, [
                      createVNode("div", { class: "flex items-center gap-2" }, [
                        (openBlock(), createBlock("svg", {
                          xmlns: "http://www.w3.org/2000/svg",
                          class: "h-4 w-4",
                          viewBox: "0 0 20 20",
                          fill: "currentColor"
                        }, [
                          createVNode("path", {
                            "fill-rule": "evenodd",
                            d: "M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z",
                            "clip-rule": "evenodd"
                          })
                        ])),
                        createVNode("span", { class: "font-medium" }, "Группа в архиве")
                      ])
                    ])) : createCommentVNode("", true),
                    !canEditDates.value && isEdit.value ? (openBlock(), createBlock("div", {
                      key: 1,
                      class: "rounded-lg bg-blue-100 p-2.5 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                    }, [
                      createVNode("div", { class: "flex items-center gap-2" }, [
                        (openBlock(), createBlock("svg", {
                          xmlns: "http://www.w3.org/2000/svg",
                          class: "h-4 w-4 shrink-0",
                          viewBox: "0 0 20 20",
                          fill: "currentColor"
                        }, [
                          createVNode("path", {
                            "fill-rule": "evenodd",
                            d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z",
                            "clip-rule": "evenodd"
                          })
                        ])),
                        createVNode("span", null, "Даты завершены.")
                      ])
                    ])) : createCommentVNode("", true),
                    createVNode("div", null, [
                      createVNode("label", { class: "mb-1.5 block text-sm font-medium text-black dark:text-white" }, [
                        createTextVNode(" Учебная программа "),
                        createVNode("span", { class: "text-danger" }, "*")
                      ]),
                      createVNode("div", { class: "relative" }, [
                        withDirectives(createVNode("select", {
                          "onUpdate:modelValue": ($event) => form.value.courseId = $event,
                          class: [
                            "w-full rounded-lg border-[1.5px] bg-white dark:bg-boxdark px-4 py-2 font-medium outline-none transition appearance-none text-sm",
                            errors.value.courseId ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
                          ]
                        }, [
                          createVNode("option", { value: "" }, "Выберите программу..."),
                          (openBlock(true), createBlock(Fragment, null, renderList(courses.value, (course) => {
                            return openBlock(), createBlock("option", {
                              key: course.id,
                              value: course.id
                            }, toDisplayString(course.shortName) + " - " + toDisplayString(course.name), 9, ["value"]);
                          }), 128))
                        ], 10, ["onUpdate:modelValue"]), [
                          [vModelSelect, form.value.courseId]
                        ]),
                        createVNode("div", { class: "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" }, [
                          (openBlock(), createBlock("svg", {
                            class: "w-4 h-4",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24"
                          }, [
                            createVNode("path", {
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              d: "M19 9l-7 7-7-7"
                            })
                          ]))
                        ])
                      ]),
                      errors.value.courseId ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "mt-1 text-xs text-danger"
                      }, toDisplayString(errors.value.courseId), 1)) : createCommentVNode("", true)
                    ]),
                    createVNode("div", null, [
                      createVNode("label", { class: "mb-1.5 block text-sm font-medium text-black dark:text-white" }, [
                        createTextVNode(" Код группы "),
                        createVNode("span", { class: "text-danger" }, "*")
                      ]),
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => form.value.code = $event,
                        type: "text",
                        placeholder: "АПАК-20",
                        class: [
                          "w-full rounded-lg border-[1.5px] bg-white dark:bg-boxdark px-4 py-2 font-medium outline-none transition text-sm",
                          errors.value.code ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
                        ]
                      }, null, 10, ["onUpdate:modelValue"]), [
                        [vModelText, form.value.code]
                      ]),
                      errors.value.code ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "mt-1 text-xs text-danger"
                      }, toDisplayString(errors.value.code), 1)) : createCommentVNode("", true)
                    ]),
                    createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                      createVNode("div", null, [
                        createVNode("label", { class: "mb-1.5 block text-sm font-medium text-black dark:text-white" }, " Начало "),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => form.value.startDate = $event,
                          type: "date",
                          disabled: isEdit.value && !canEditDates.value,
                          class: [
                            "w-full rounded-lg border-[1.5px] bg-white dark:bg-boxdark px-4 py-2 font-medium outline-none transition text-sm",
                            errors.value.startDate ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary",
                            isEdit.value && !canEditDates.value ? "bg-gray-100 dark:bg-meta-4 opacity-70 cursor-not-allowed" : ""
                          ]
                        }, null, 10, ["onUpdate:modelValue", "disabled"]), [
                          [vModelText, form.value.startDate]
                        ]),
                        errors.value.startDate ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "mt-1 text-xs text-danger"
                        }, toDisplayString(errors.value.startDate), 1)) : createCommentVNode("", true)
                      ]),
                      createVNode("div", null, [
                        createVNode("label", { class: "mb-1.5 block text-sm font-medium text-black dark:text-white" }, " Окончание "),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => form.value.endDate = $event,
                          type: "date",
                          disabled: isEdit.value && !canEditDates.value,
                          class: [
                            "w-full rounded-lg border-[1.5px] bg-white dark:bg-boxdark px-4 py-2 font-medium outline-none transition text-sm",
                            errors.value.endDate ? "border-danger focus:border-danger" : "border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary",
                            isEdit.value && !canEditDates.value ? "bg-gray-100 dark:bg-meta-4 opacity-70 cursor-not-allowed" : ""
                          ]
                        }, null, 10, ["onUpdate:modelValue", "disabled"]), [
                          [vModelText, form.value.endDate]
                        ]),
                        errors.value.endDate ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "mt-1 text-xs text-danger"
                        }, toDisplayString(errors.value.endDate), 1)) : createCommentVNode("", true)
                      ])
                    ]),
                    createVNode("div", null, [
                      createVNode("label", { class: "mb-1.5 block text-sm font-medium text-black dark:text-white" }, " Заметки "),
                      withDirectives(createVNode("textarea", {
                        "onUpdate:modelValue": ($event) => form.value.description = $event,
                        placeholder: "...",
                        rows: "2",
                        class: "w-full rounded-lg border-[1.5px] border-stroke bg-white dark:bg-boxdark px-4 py-2 font-medium outline-none transition text-sm focus:border-primary dark:border-form-strokedark dark:focus:border-primary resize-none"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelText, form.value.description]
                      ])
                    ]),
                    createVNode("div", { class: "pt-1" }, [
                      createVNode("label", { class: "relative inline-flex cursor-pointer items-center group" }, [
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => form.value.isActive = $event,
                          type: "checkbox",
                          class: "peer sr-only"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelCheckbox, form.value.isActive]
                        ]),
                        createVNode("div", { class: "h-5 w-9 shrink-0 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-success peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700" }),
                        createVNode("span", { class: "ml-3 text-sm font-medium text-black dark:text-white group-hover:text-primary transition-colors" }, toDisplayString(form.value.isActive ? "Активна" : "Неактивна"), 1)
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "h-full flex flex-col" }, [
                    createVNode("label", { class: "mb-1.5 block text-sm font-medium text-black dark:text-white" }, [
                      createTextVNode(" Официальные основания (PDF) "),
                      !isEdit.value ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "text-danger"
                      }, "*")) : createCommentVNode("", true)
                    ]),
                    createVNode("div", { class: "grow rounded-lg border border-stroke bg-gray-50 dark:bg-meta-4/20 dark:border-strokedark p-4 flex flex-col" }, [
                      !isEdit.value ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "h-full"
                      }, [
                        createVNode(_component_GroupsGroupReportUploader, {
                          ref_key: "uploaderRef",
                          ref: uploaderRef,
                          loading: false,
                          onFilesSelected: handleFilesSelected,
                          class: "h-full"
                        }, null, 512),
                        errors.value.file ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "mt-2 text-xs text-danger"
                        }, toDisplayString(errors.value.file), 1)) : createCommentVNode("", true)
                      ])) : (openBlock(), createBlock("div", {
                        key: 1,
                        class: "h-full flex flex-col"
                      }, [
                        loadingReports.value ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "text-sm text-gray-500 grow flex items-center justify-center"
                        }, [
                          createVNode("span", { class: "inline-flex items-center gap-2" }, [
                            (openBlock(), createBlock("svg", {
                              class: "animate-spin h-5 w-5",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("circle", {
                                class: "opacity-25",
                                cx: "12",
                                cy: "12",
                                r: "10",
                                stroke: "currentColor",
                                "stroke-width": "4"
                              }),
                              createVNode("path", {
                                class: "opacity-75",
                                fill: "currentColor",
                                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              })
                            ])),
                            createTextVNode(" Загрузка... ")
                          ])
                        ])) : existingReports.value.length === 0 ? (openBlock(), createBlock("div", {
                          key: 1,
                          class: "text-sm text-gray-500 grow flex items-center justify-center italic"
                        }, " Нет документов ")) : (openBlock(), createBlock("div", {
                          key: 2,
                          class: "grow overflow-y-auto pr-1 custom-scrollbar space-y-2 max-h-[300px]"
                        }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(existingReports.value, (report) => {
                            return openBlock(), createBlock("div", {
                              key: report.id,
                              class: "flex items-center justify-between rounded bg-white dark:bg-boxdark p-3 border border-stroke dark:border-strokedark hover:shadow-sm"
                            }, [
                              createVNode("div", { class: "flex items-center gap-3 overflow-hidden" }, [
                                createVNode("div", { class: "h-8 w-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0" }, [
                                  createVNode("span", { class: "text-[10px] font-bold" }, "PDF")
                                ]),
                                createVNode("div", { class: "min-w-0" }, [
                                  createVNode("p", {
                                    class: "truncate text-sm font-medium",
                                    title: report.name
                                  }, toDisplayString(report.name), 9, ["title"]),
                                  createVNode("p", { class: "text-xs text-gray-500" }, toDisplayString(new Date(report.uploadedAt).toLocaleDateString()), 1)
                                ])
                              ]),
                              createVNode("a", {
                                href: report.url,
                                target: "_blank",
                                class: "text-gray-500 hover:text-primary p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                title: "Скачать"
                              }, [
                                (openBlock(), createBlock("svg", {
                                  xmlns: "http://www.w3.org/2000/svg",
                                  class: "h-5 w-5",
                                  fill: "none",
                                  viewBox: "0 0 24 24",
                                  stroke: "currentColor"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  })
                                ]))
                              ], 8, ["href"])
                            ]);
                          }), 128))
                        ])),
                        createVNode("div", { class: "mt-3 text-[10px] text-gray-400 text-center border-t border-stroke dark:border-strokedark pt-2" }, " Управление документами на странице группы ")
                      ]))
                    ])
                  ])
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
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/groups/GroupFormModal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main, { __name: "GroupsGroupFormModal" });

export { __nuxt_component_2 as _, __nuxt_component_1 as a };
//# sourceMappingURL=GroupFormModal-brTMs9HC.mjs.map
