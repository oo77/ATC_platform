import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { _ as __nuxt_component_1$1 } from './Pagination-BWEvmW2R.mjs';
import { _ as __nuxt_component_0 } from './Modal-DQYphXo7.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, createBlock, createTextVNode, openBlock, createVNode, watch, withModifiers, createCommentVNode, toDisplayString, withDirectives, vModelText, vModelSelect, vModelRadio, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderClass, ssrRenderStyle } from 'vue/server-renderer';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
import { s as setInterval } from './interval-CUTXZwGJ.mjs';
import { _ as __nuxt_component_3$1 } from './ConfirmModal-D4ued3Bi.mjs';
import './Notification-CQvvdM2O.mjs';

const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "UploadBookModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean }
  },
  emits: ["close", "uploaded"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const toast = useNotification();
    const pdfInput = ref();
    const coverInput = ref();
    const triggerPdfInput = () => {
      pdfInput.value?.click();
    };
    const triggerCoverInput = () => {
      coverInput.value?.click();
    };
    const isDragging = ref(false);
    const uploading = ref(false);
    const uploadProgress = ref(0);
    const coverPreview = ref("");
    const form = ref({
      pdfFile: null,
      coverFile: null,
      title: "",
      author: "",
      description: "",
      language: ""
    });
    const errors = ref({
      pdfFile: "",
      title: "",
      language: ""
    });
    const handleDrop = (e) => {
      isDragging.value = false;
      const files = e.dataTransfer?.files;
      if (files && files[0]) {
        validateAndSetPdfFile(files[0]);
      }
    };
    const handleFileSelect = (e) => {
      const target = e.target;
      if (target.files && target.files[0]) {
        validateAndSetPdfFile(target.files[0]);
      }
    };
    const validateAndSetPdfFile = (file) => {
      errors.value.pdfFile = "";
      if (file.type !== "application/pdf") {
        errors.value.pdfFile = "Пожалуйста, выберите PDF файл";
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        errors.value.pdfFile = "Размер файла не должен превышать 100 МБ";
        return;
      }
      form.value.pdfFile = file;
    };
    const removeFile = () => {
      form.value.pdfFile = null;
      if (pdfInput.value) {
        pdfInput.value.value = "";
      }
    };
    const handleCoverSelect = (e) => {
      const target = e.target;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        if (!file.type.startsWith("image/")) {
          toast.error("Пожалуйста, выберите изображение");
          return;
        }
        form.value.coverFile = file;
        const reader = new FileReader();
        reader.onload = (e2) => {
          coverPreview.value = e2.target?.result;
        };
        reader.readAsDataURL(file);
      }
    };
    const removeCover = () => {
      form.value.coverFile = null;
      coverPreview.value = "";
      if (coverInput.value) {
        coverInput.value.value = "";
      }
    };
    const validate = () => {
      errors.value = {
        pdfFile: "",
        title: "",
        language: ""
      };
      let isValid = true;
      if (!form.value.pdfFile) {
        errors.value.pdfFile = "Пожалуйста, выберите PDF файл";
        isValid = false;
      }
      if (!form.value.title.trim()) {
        errors.value.title = "Пожалуйста, введите название книги";
        isValid = false;
      }
      if (!form.value.language) {
        errors.value.language = "Пожалуйста, выберите язык";
        isValid = false;
      }
      return isValid;
    };
    const handleSubmit = async () => {
      if (!validate()) return;
      uploading.value = true;
      uploadProgress.value = 0;
      try {
        const formData = new FormData();
        formData.append("file", form.value.pdfFile);
        if (form.value.coverFile) {
          formData.append("cover", form.value.coverFile);
        }
        formData.append("title", form.value.title);
        formData.append("author", form.value.author || "");
        formData.append("description", form.value.description || "");
        formData.append("language", form.value.language);
        const progressInterval = setInterval(() => {
          if (uploadProgress.value < 90) {
            uploadProgress.value += 10;
          }
        }, 200);
        await $fetch("/api/library/admin/books", {
          method: "POST",
          body: formData
        });
        clearInterval(progressInterval);
        uploadProgress.value = 100;
        toast.success("Книга успешно загружена");
        emit("uploaded");
        resetForm();
      } catch (error) {
        toast.error(error.data?.message || "Ошибка загрузки книги");
      } finally {
        uploading.value = false;
        uploadProgress.value = 0;
      }
    };
    const handleClose = () => {
      if (!uploading.value) {
        emit("close");
      }
    };
    const resetForm = () => {
      form.value = {
        pdfFile: null,
        coverFile: null,
        title: "",
        author: "",
        description: "",
        language: ""
      };
      errors.value = {
        pdfFile: "",
        title: "",
        language: ""
      };
      coverPreview.value = "";
      if (pdfInput.value) pdfInput.value.value = "";
      if (coverInput.value) coverInput.value.value = "";
    };
    const formatFileSize = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };
    watch(
      () => props.isOpen,
      (isOpen) => {
        if (!isOpen) {
          resetForm();
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Загрузить книгу",
        size: "lg",
        onClose: handleClose
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "secondary",
              disabled: uploading.value,
              onClick: handleClose
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
              disabled: uploading.value,
              onClick: handleSubmit
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (uploading.value) {
                    _push3(`<span class="flex items-center gap-2"${_scopeId2}><svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"${_scopeId2}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId2}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId2}></path></svg> Загрузка... </span>`);
                  } else {
                    _push3(`<span${_scopeId2}>Загрузить книгу</span>`);
                  }
                } else {
                  return [
                    uploading.value ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "flex items-center gap-2"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 animate-spin",
                        fill: "none",
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
                    ])) : (openBlock(), createBlock("span", { key: 1 }, "Загрузить книгу"))
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
                  variant: "secondary",
                  disabled: uploading.value,
                  onClick: handleClose
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Отмена ")
                  ]),
                  _: 1
                }, 8, ["disabled"]),
                createVNode(_component_UiButton, {
                  disabled: uploading.value,
                  onClick: handleSubmit
                }, {
                  default: withCtx(() => [
                    uploading.value ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "flex items-center gap-2"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 animate-spin",
                        fill: "none",
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
                    ])) : (openBlock(), createBlock("span", { key: 1 }, "Загрузить книгу"))
                  ]),
                  _: 1
                }, 8, ["disabled"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form${_scopeId}><div class="space-y-6"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> PDF файл книги <span class="text-red-500"${_scopeId}>*</span></label><div class="${ssrRenderClass([
              "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
              isDragging.value ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-600 hover:border-primary",
              errors.value.pdfFile ? "border-red-500" : ""
            ])}"${_scopeId}><input type="file" accept=".pdf" class="hidden"${_scopeId}>`);
            if (!form.value.pdfFile) {
              _push2(`<div${_scopeId}><svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"${_scopeId}></path></svg><p class="text-gray-600 dark:text-gray-400 mb-2"${_scopeId}> Перетащите PDF файл сюда или нажмите для выбора </p><p class="text-xs text-gray-500"${_scopeId}>Максимальный размер: 100 МБ</p></div>`);
            } else {
              _push2(`<div class="flex items-center justify-center gap-3"${_scopeId}><svg class="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20"${_scopeId}><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"${_scopeId}></path></svg><div class="text-left"${_scopeId}><p class="font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(form.value.pdfFile.name)}</p><p class="text-sm text-gray-500"${_scopeId}>${ssrInterpolate(formatFileSize(form.value.pdfFile.size))}</p></div><button type="button" class="ml-auto p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></button></div>`);
            }
            _push2(`</div>`);
            if (errors.value.pdfFile) {
              _push2(`<p class="mt-1 text-sm text-red-500"${_scopeId}>${ssrInterpolate(errors.value.pdfFile)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Обложка (опционально) </label><div class="flex items-start gap-4"${_scopeId}>`);
            if (coverPreview.value) {
              _push2(`<div class="relative w-32 h-44 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0"${_scopeId}><img${ssrRenderAttr("src", coverPreview.value)} alt="Обложка" class="w-full h-full object-cover"${_scopeId}><button type="button" class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></button></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="flex-1"${_scopeId}><input type="file" accept="image/*" class="hidden"${_scopeId}><button type="button" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"${_scopeId}>${ssrInterpolate(coverPreview.value ? "Изменить обложку" : "Выбрать обложку")}</button><p class="mt-2 text-xs text-gray-500"${_scopeId}> Если не указана, будет использована первая страница PDF </p></div></div></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Название книги <span class="text-red-500"${_scopeId}>*</span></label><input${ssrRenderAttr("value", form.value.title)} type="text" placeholder="Введите название книги" class="${ssrRenderClass([{ "border-red-500": errors.value.title }, "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"])}"${_scopeId}>`);
            if (errors.value.title) {
              _push2(`<p class="mt-1 text-sm text-red-500"${_scopeId}>${ssrInterpolate(errors.value.title)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Автор </label><input${ssrRenderAttr("value", form.value.author)} type="text" placeholder="Введите имя автора" class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Описание </label><textarea rows="3" placeholder="Краткое описание книги" class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"${_scopeId}>${ssrInterpolate(form.value.description)}</textarea></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Язык <span class="text-red-500"${_scopeId}>*</span></label><select class="${ssrRenderClass([{ "border-red-500": errors.value.language }, "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"])}"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(form.value.language) ? ssrLooseContain(form.value.language, "") : ssrLooseEqual(form.value.language, "")) ? " selected" : ""}${_scopeId}>Выберите язык</option><option value="ru"${ssrIncludeBooleanAttr(Array.isArray(form.value.language) ? ssrLooseContain(form.value.language, "ru") : ssrLooseEqual(form.value.language, "ru")) ? " selected" : ""}${_scopeId}>Русский</option><option value="uz"${ssrIncludeBooleanAttr(Array.isArray(form.value.language) ? ssrLooseContain(form.value.language, "uz") : ssrLooseEqual(form.value.language, "uz")) ? " selected" : ""}${_scopeId}>O&#39;zbekcha</option><option value="en"${ssrIncludeBooleanAttr(Array.isArray(form.value.language) ? ssrLooseContain(form.value.language, "en") : ssrLooseEqual(form.value.language, "en")) ? " selected" : ""}${_scopeId}>English</option><option value="kk"${ssrIncludeBooleanAttr(Array.isArray(form.value.language) ? ssrLooseContain(form.value.language, "kk") : ssrLooseEqual(form.value.language, "kk")) ? " selected" : ""}${_scopeId}>Қазақша</option></select>`);
            if (errors.value.language) {
              _push2(`<p class="mt-1 text-sm text-red-500"${_scopeId}>${ssrInterpolate(errors.value.language)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (uploadProgress.value > 0 && uploadProgress.value < 100) {
              _push2(`<div class="space-y-2"${_scopeId}><div class="flex items-center justify-between text-sm"${_scopeId}><span class="text-gray-600 dark:text-gray-400"${_scopeId}>Загрузка...</span><span class="font-medium text-primary"${_scopeId}>${ssrInterpolate(uploadProgress.value)}%</span></div><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"${_scopeId}><div class="bg-primary rounded-full h-2 transition-all duration-300" style="${ssrRenderStyle({ width: `${uploadProgress.value}%` })}"${_scopeId}></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(handleSubmit, ["prevent"])
              }, [
                createVNode("div", { class: "space-y-6" }, [
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                      createTextVNode(" PDF файл книги "),
                      createVNode("span", { class: "text-red-500" }, "*")
                    ]),
                    createVNode("div", {
                      onDrop: withModifiers(handleDrop, ["prevent"]),
                      onDragover: withModifiers(($event) => isDragging.value = true, ["prevent"]),
                      onDragleave: withModifiers(($event) => isDragging.value = false, ["prevent"]),
                      class: [
                        "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
                        isDragging.value ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-600 hover:border-primary",
                        errors.value.pdfFile ? "border-red-500" : ""
                      ],
                      onClick: triggerPdfInput
                    }, [
                      createVNode("input", {
                        ref_key: "pdfInput",
                        ref: pdfInput,
                        type: "file",
                        accept: ".pdf",
                        class: "hidden",
                        onChange: handleFileSelect
                      }, null, 544),
                      !form.value.pdfFile ? (openBlock(), createBlock("div", { key: 0 }, [
                        (openBlock(), createBlock("svg", {
                          class: "mx-auto h-12 w-12 text-gray-400 mb-4",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          })
                        ])),
                        createVNode("p", { class: "text-gray-600 dark:text-gray-400 mb-2" }, " Перетащите PDF файл сюда или нажмите для выбора "),
                        createVNode("p", { class: "text-xs text-gray-500" }, "Максимальный размер: 100 МБ")
                      ])) : (openBlock(), createBlock("div", {
                        key: 1,
                        class: "flex items-center justify-center gap-3"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-10 h-10 text-red-500",
                          fill: "currentColor",
                          viewBox: "0 0 20 20"
                        }, [
                          createVNode("path", {
                            "fill-rule": "evenodd",
                            d: "M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z",
                            "clip-rule": "evenodd"
                          })
                        ])),
                        createVNode("div", { class: "text-left" }, [
                          createVNode("p", { class: "font-medium text-gray-900 dark:text-white" }, toDisplayString(form.value.pdfFile.name), 1),
                          createVNode("p", { class: "text-sm text-gray-500" }, toDisplayString(formatFileSize(form.value.pdfFile.size)), 1)
                        ]),
                        createVNode("button", {
                          type: "button",
                          onClick: withModifiers(removeFile, ["stop"]),
                          class: "ml-auto p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        }, [
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
                              d: "M6 18L18 6M6 6l12 12"
                            })
                          ]))
                        ])
                      ]))
                    ], 42, ["onDragover", "onDragleave"]),
                    errors.value.pdfFile ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-red-500"
                    }, toDisplayString(errors.value.pdfFile), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Обложка (опционально) "),
                    createVNode("div", { class: "flex items-start gap-4" }, [
                      coverPreview.value ? (openBlock(), createBlock("div", {
                        key: 0,
                        class: "relative w-32 h-44 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0"
                      }, [
                        createVNode("img", {
                          src: coverPreview.value,
                          alt: "Обложка",
                          class: "w-full h-full object-cover"
                        }, null, 8, ["src"]),
                        createVNode("button", {
                          type: "button",
                          onClick: removeCover,
                          class: "absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        }, [
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
                              d: "M6 18L18 6M6 6l12 12"
                            })
                          ]))
                        ])
                      ])) : createCommentVNode("", true),
                      createVNode("div", { class: "flex-1" }, [
                        createVNode("input", {
                          ref_key: "coverInput",
                          ref: coverInput,
                          type: "file",
                          accept: "image/*",
                          class: "hidden",
                          onChange: handleCoverSelect
                        }, null, 544),
                        createVNode("button", {
                          type: "button",
                          onClick: triggerCoverInput,
                          class: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        }, toDisplayString(coverPreview.value ? "Изменить обложку" : "Выбрать обложку"), 1),
                        createVNode("p", { class: "mt-2 text-xs text-gray-500" }, " Если не указана, будет использована первая страница PDF ")
                      ])
                    ])
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                      createTextVNode(" Название книги "),
                      createVNode("span", { class: "text-red-500" }, "*")
                    ]),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => form.value.title = $event,
                      type: "text",
                      placeholder: "Введите название книги",
                      class: ["w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary", { "border-red-500": errors.value.title }]
                    }, null, 10, ["onUpdate:modelValue"]), [
                      [vModelText, form.value.title]
                    ]),
                    errors.value.title ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-red-500"
                    }, toDisplayString(errors.value.title), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Автор "),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => form.value.author = $event,
                      type: "text",
                      placeholder: "Введите имя автора",
                      class: "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelText, form.value.author]
                    ])
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Описание "),
                    withDirectives(createVNode("textarea", {
                      "onUpdate:modelValue": ($event) => form.value.description = $event,
                      rows: "3",
                      placeholder: "Краткое описание книги",
                      class: "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vModelText, form.value.description]
                    ])
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                      createTextVNode(" Язык "),
                      createVNode("span", { class: "text-red-500" }, "*")
                    ]),
                    withDirectives(createVNode("select", {
                      "onUpdate:modelValue": ($event) => form.value.language = $event,
                      class: ["w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none", { "border-red-500": errors.value.language }]
                    }, [
                      createVNode("option", { value: "" }, "Выберите язык"),
                      createVNode("option", { value: "ru" }, "Русский"),
                      createVNode("option", { value: "uz" }, "O'zbekcha"),
                      createVNode("option", { value: "en" }, "English"),
                      createVNode("option", { value: "kk" }, "Қазақша")
                    ], 10, ["onUpdate:modelValue"]), [
                      [vModelSelect, form.value.language]
                    ]),
                    errors.value.language ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-red-500"
                    }, toDisplayString(errors.value.language), 1)) : createCommentVNode("", true)
                  ]),
                  uploadProgress.value > 0 && uploadProgress.value < 100 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "space-y-2"
                  }, [
                    createVNode("div", { class: "flex items-center justify-between text-sm" }, [
                      createVNode("span", { class: "text-gray-600 dark:text-gray-400" }, "Загрузка..."),
                      createVNode("span", { class: "font-medium text-primary" }, toDisplayString(uploadProgress.value) + "%", 1)
                    ]),
                    createVNode("div", { class: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" }, [
                      createVNode("div", {
                        class: "bg-primary rounded-full h-2 transition-all duration-300",
                        style: { width: `${uploadProgress.value}%` }
                      }, null, 4)
                    ])
                  ])) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/library/UploadBookModal.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$4, { __name: "LibraryUploadBookModal" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "EditBookModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    book: {}
  },
  emits: ["close", "updated"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const toast = useNotification();
    const saving = ref(false);
    const form = ref({
      title: "",
      author: "",
      description: "",
      language: "ru"
    });
    const errors = ref({
      title: "",
      language: ""
    });
    const validate = () => {
      errors.value = {
        title: "",
        language: ""
      };
      let isValid = true;
      if (!form.value.title.trim()) {
        errors.value.title = "Пожалуйста, введите название книги";
        isValid = false;
      }
      if (!form.value.language) {
        errors.value.language = "Пожалуйста, выберите язык";
        isValid = false;
      }
      return isValid;
    };
    const handleSubmit = async () => {
      if (!validate() || !props.book) return;
      saving.value = true;
      try {
        await $fetch(`/api/library/admin/books/${props.book.id}`, {
          method: "PATCH",
          body: {
            title: form.value.title,
            author: form.value.author || null,
            description: form.value.description || null,
            language: form.value.language
          }
        });
        toast.success("Книга успешно обновлена");
        emit("updated");
      } catch (error) {
        toast.error(error.data?.message || "Ошибка обновления книги");
      } finally {
        saving.value = false;
      }
    };
    const handleClose = () => {
      if (!saving.value) {
        emit("close");
      }
    };
    watch(
      () => props.book,
      (book) => {
        if (book) {
          form.value = {
            title: book.title,
            author: book.author || "",
            description: book.description || "",
            language: book.language
          };
        }
      },
      { immediate: true }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Редактировать книгу",
        size: "md",
        onClose: handleClose
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "secondary",
              disabled: saving.value,
              onClick: handleClose
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
              disabled: saving.value,
              onClick: handleSubmit
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  if (saving.value) {
                    _push3(`<span class="flex items-center gap-2"${_scopeId2}><svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"${_scopeId2}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId2}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId2}></path></svg> Сохранение... </span>`);
                  } else {
                    _push3(`<span${_scopeId2}>Сохранить</span>`);
                  }
                } else {
                  return [
                    saving.value ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "flex items-center gap-2"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 animate-spin",
                        fill: "none",
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
                      createTextVNode(" Сохранение... ")
                    ])) : (openBlock(), createBlock("span", { key: 1 }, "Сохранить"))
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
                  variant: "secondary",
                  disabled: saving.value,
                  onClick: handleClose
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Отмена ")
                  ]),
                  _: 1
                }, 8, ["disabled"]),
                createVNode(_component_UiButton, {
                  disabled: saving.value,
                  onClick: handleSubmit
                }, {
                  default: withCtx(() => [
                    saving.value ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "flex items-center gap-2"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-4 h-4 animate-spin",
                        fill: "none",
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
                      createTextVNode(" Сохранение... ")
                    ])) : (openBlock(), createBlock("span", { key: 1 }, "Сохранить"))
                  ]),
                  _: 1
                }, 8, ["disabled"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-4"${_scopeId}><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Название книги <span class="text-red-500"${_scopeId}>*</span></label><input${ssrRenderAttr("value", form.value.title)} type="text" class="${ssrRenderClass([{ "border-red-500": errors.value.title }, "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"])}"${_scopeId}>`);
            if (errors.value.title) {
              _push2(`<p class="mt-1 text-sm text-red-500"${_scopeId}>${ssrInterpolate(errors.value.title)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Автор </label><input${ssrRenderAttr("value", form.value.author)} type="text" class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Описание </label><textarea rows="3" class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"${_scopeId}>${ssrInterpolate(form.value.description)}</textarea></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Язык <span class="text-red-500"${_scopeId}>*</span></label><select class="${ssrRenderClass([{ "border-red-500": errors.value.language }, "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"])}"${_scopeId}><option value="ru"${ssrIncludeBooleanAttr(Array.isArray(form.value.language) ? ssrLooseContain(form.value.language, "ru") : ssrLooseEqual(form.value.language, "ru")) ? " selected" : ""}${_scopeId}>Русский</option><option value="uz"${ssrIncludeBooleanAttr(Array.isArray(form.value.language) ? ssrLooseContain(form.value.language, "uz") : ssrLooseEqual(form.value.language, "uz")) ? " selected" : ""}${_scopeId}>O&#39;zbekcha</option><option value="en"${ssrIncludeBooleanAttr(Array.isArray(form.value.language) ? ssrLooseContain(form.value.language, "en") : ssrLooseEqual(form.value.language, "en")) ? " selected" : ""}${_scopeId}>English</option><option value="kk"${ssrIncludeBooleanAttr(Array.isArray(form.value.language) ? ssrLooseContain(form.value.language, "kk") : ssrLooseEqual(form.value.language, "kk")) ? " selected" : ""}${_scopeId}>Қазақша</option></select>`);
            if (errors.value.language) {
              _push2(`<p class="mt-1 text-sm text-red-500"${_scopeId}>${ssrInterpolate(errors.value.language)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(handleSubmit, ["prevent"]),
                class: "space-y-4"
              }, [
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                    createTextVNode(" Название книги "),
                    createVNode("span", { class: "text-red-500" }, "*")
                  ]),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => form.value.title = $event,
                    type: "text",
                    class: ["w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary", { "border-red-500": errors.value.title }]
                  }, null, 10, ["onUpdate:modelValue"]), [
                    [vModelText, form.value.title]
                  ]),
                  errors.value.title ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-sm text-red-500"
                  }, toDisplayString(errors.value.title), 1)) : createCommentVNode("", true)
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Автор "),
                  withDirectives(createVNode("input", {
                    "onUpdate:modelValue": ($event) => form.value.author = $event,
                    type: "text",
                    class: "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, form.value.author]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Описание "),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => form.value.description = $event,
                    rows: "3",
                    class: "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, form.value.description]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, [
                    createTextVNode(" Язык "),
                    createVNode("span", { class: "text-red-500" }, "*")
                  ]),
                  withDirectives(createVNode("select", {
                    "onUpdate:modelValue": ($event) => form.value.language = $event,
                    class: ["w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none", { "border-red-500": errors.value.language }]
                  }, [
                    createVNode("option", { value: "ru" }, "Русский"),
                    createVNode("option", { value: "uz" }, "O'zbekcha"),
                    createVNode("option", { value: "en" }, "English"),
                    createVNode("option", { value: "kk" }, "Қазақша")
                  ], 10, ["onUpdate:modelValue"]), [
                    [vModelSelect, form.value.language]
                  ]),
                  errors.value.language ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-sm text-red-500"
                  }, toDisplayString(errors.value.language), 1)) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/library/EditBookModal.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$3, { __name: "LibraryEditBookModal" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "AccessModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    book: {}
  },
  emits: ["close"],
  setup(__props) {
    const props = __props;
    const toast = useNotification();
    const loadingAccess = ref(false);
    const granting = ref(false);
    const accesses = ref([]);
    const users = ref([]);
    const groups = ref([]);
    const roles = [
      { id: "STUDENT", name: "Слушатель" },
      { id: "TEACHER", name: "Преподаватель" },
      { id: "MANAGER", name: "Менеджер" },
      { id: "ADMIN", name: "Администратор" }
    ];
    const accessForm = ref({
      type: "user",
      targetId: "",
      expiresAt: ""
    });
    const fetchAccesses = async () => {
      if (!props.book) return;
      loadingAccess.value = true;
      try {
        const response = await $fetch(
          `/api/library/admin/books/${props.book.id}/access`
        );
        accesses.value = response.data.accessList;
      } catch (error) {
        toast.error(error.data?.message || "Ошибка загрузки списка доступов");
      } finally {
        loadingAccess.value = false;
      }
    };
    const grantAccess = async () => {
      if (!props.book || !accessForm.value.targetId) return;
      granting.value = true;
      try {
        await $fetch(`/api/library/admin/books/${props.book.id}/access`, {
          method: "POST",
          body: {
            type: accessForm.value.type,
            userId: accessForm.value.type === "user" ? String(accessForm.value.targetId) : void 0,
            groupId: accessForm.value.type === "group" ? Number(accessForm.value.targetId) : void 0,
            roleName: accessForm.value.type === "role" ? accessForm.value.targetId : void 0
            // expiresAt excluded
          }
        });
        toast.success("Доступ успешно назначен");
        accessForm.value.targetId = "";
        accessForm.value.expiresAt = "";
        fetchAccesses();
      } catch (error) {
        toast.error(error.data?.message || "Ошибка назначения доступа");
      } finally {
        granting.value = false;
      }
    };
    const revokeAccess = async (access) => {
      if (!props.book) return;
      try {
        await $fetch(`/api/library/admin/books/${props.book.id}/access`, {
          method: "DELETE",
          body: { accessId: access.id }
        });
        toast.success("Доступ успешно отозван");
        fetchAccesses();
      } catch (error) {
        toast.error(error.data?.message || "Ошибка отзыва доступа");
      }
    };
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    };
    watch(
      () => props.isOpen,
      (isOpen) => {
        if (isOpen && props.book) {
          fetchAccesses();
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Управление доступом",
        size: "lg",
        onClose: ($event) => _ctx.$emit("close")
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (__props.book) {
              _push2(`<div class="space-y-6"${_scopeId}><div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"${_scopeId}><div class="h-16 w-12 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0"${_scopeId}>`);
              if (__props.book.cover_url) {
                _push2(`<img${ssrRenderAttr("src", __props.book.cover_url)}${ssrRenderAttr("alt", __props.book.title)} class="h-full w-full object-cover"${_scopeId}>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div${_scopeId}><h3 class="font-semibold text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(__props.book.title)}</h3><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(__props.book.author || "Автор не указан")}</p></div></div><div class="space-y-4"${_scopeId}><h4 class="font-semibold text-gray-900 dark:text-white"${_scopeId}> Назначить доступ </h4><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Тип доступа </label><div class="flex gap-4"${_scopeId}><label class="flex items-center gap-2 cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(ssrLooseEqual(accessForm.value.type, "user")) ? " checked" : ""} type="radio" value="user" class="text-primary focus:ring-primary"${_scopeId}><span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}> Пользователь </span></label><label class="flex items-center gap-2 cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(ssrLooseEqual(accessForm.value.type, "group")) ? " checked" : ""} type="radio" value="group" class="text-primary focus:ring-primary"${_scopeId}><span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}> Группа </span></label><label class="flex items-center gap-2 cursor-pointer"${_scopeId}><input${ssrIncludeBooleanAttr(ssrLooseEqual(accessForm.value.type, "role")) ? " checked" : ""} type="radio" value="role" class="text-primary focus:ring-primary"${_scopeId}><span class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}> Роль </span></label></div></div><div${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}>${ssrInterpolate(accessForm.value.type === "user" ? "Пользователь" : accessForm.value.type === "group" ? "Группа" : "Роль")}</label><select class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(accessForm.value.targetId) ? ssrLooseContain(accessForm.value.targetId, "") : ssrLooseEqual(accessForm.value.targetId, "")) ? " selected" : ""}${_scopeId}>${ssrInterpolate(accessForm.value.type === "user" ? "Выберите пользователя" : accessForm.value.type === "group" ? "Выберите группу" : "Выберите роль")}</option>`);
              if (accessForm.value.type === "user") {
                _push2(`<!--[-->`);
                ssrRenderList(users.value, (item) => {
                  _push2(`<option${ssrRenderAttr("value", item.id)}${ssrIncludeBooleanAttr(Array.isArray(accessForm.value.targetId) ? ssrLooseContain(accessForm.value.targetId, item.id) : ssrLooseEqual(accessForm.value.targetId, item.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(item.name)}</option>`);
                });
                _push2(`<!--]-->`);
              } else if (accessForm.value.type === "group") {
                _push2(`<!--[-->`);
                ssrRenderList(groups.value, (item) => {
                  _push2(`<option${ssrRenderAttr("value", item.id)}${ssrIncludeBooleanAttr(Array.isArray(accessForm.value.targetId) ? ssrLooseContain(accessForm.value.targetId, item.id) : ssrLooseEqual(accessForm.value.targetId, item.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(item.name)}</option>`);
                });
                _push2(`<!--]-->`);
              } else if (accessForm.value.type === "role") {
                _push2(`<!--[-->`);
                ssrRenderList(roles, (item) => {
                  _push2(`<option${ssrRenderAttr("value", item.id)}${ssrIncludeBooleanAttr(Array.isArray(accessForm.value.targetId) ? ssrLooseContain(accessForm.value.targetId, item.id) : ssrLooseEqual(accessForm.value.targetId, item.id)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(item.name)}</option>`);
                });
                _push2(`<!--]-->`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</select></div>`);
              _push2(ssrRenderComponent(_component_UiButton, {
                onClick: grantAccess,
                disabled: !accessForm.value.targetId || granting.value,
                class: "w-full"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    if (granting.value) {
                      _push3(`<span class="flex items-center justify-center gap-2"${_scopeId2}><svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"${_scopeId2}><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"${_scopeId2}></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"${_scopeId2}></path></svg> Назначение... </span>`);
                    } else {
                      _push3(`<span${_scopeId2}>Назначить доступ</span>`);
                    }
                  } else {
                    return [
                      granting.value ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "flex items-center justify-center gap-2"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-4 h-4 animate-spin",
                          fill: "none",
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
                        createTextVNode(" Назначение... ")
                      ])) : (openBlock(), createBlock("span", { key: 1 }, "Назначить доступ"))
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div><div class="border-t border-gray-200 dark:border-gray-700 pt-6"${_scopeId}><h4 class="font-semibold text-gray-900 dark:text-white mb-4"${_scopeId}> Текущие доступы </h4>`);
              if (loadingAccess.value) {
                _push2(`<div class="text-center py-8"${_scopeId}><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"${_scopeId}></div></div>`);
              } else if (accesses.value.length === 0) {
                _push2(`<div class="text-center py-8 text-gray-500 dark:text-gray-400"${_scopeId}><p${_scopeId}>Доступы не назначены</p></div>`);
              } else {
                _push2(`<div class="space-y-2"${_scopeId}><!--[-->`);
                ssrRenderList(accesses.value, (access) => {
                  _push2(`<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"${_scopeId}>`);
                  if (access.type === "user") {
                    _push2(`<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"${_scopeId}></path></svg>`);
                  } else {
                    _push2(`<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"${_scopeId}></path></svg>`);
                  }
                  _push2(`</div><div${_scopeId}><p class="font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(access.name)}</p><p class="text-xs text-gray-500 dark:text-gray-400"${_scopeId}>${ssrInterpolate(access.type === "user" ? "Пользователь" : "Группа")} ${ssrInterpolate(access.expires_at ? ` • До ${formatDate(access.expires_at)}` : " • Бессрочно")}</p></div></div><button class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Отозвать доступ"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"${_scopeId}></path></svg></button></div>`);
                });
                _push2(`<!--]--></div>`);
              }
              _push2(`</div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              __props.book ? (openBlock(), createBlock("div", {
                key: 0,
                class: "space-y-6"
              }, [
                createVNode("div", { class: "flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" }, [
                  createVNode("div", { class: "h-16 w-12 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0" }, [
                    __props.book.cover_url ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: __props.book.cover_url,
                      alt: __props.book.title,
                      class: "h-full w-full object-cover"
                    }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("h3", { class: "font-semibold text-gray-900 dark:text-white" }, toDisplayString(__props.book.title), 1),
                    createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, toDisplayString(__props.book.author || "Автор не указан"), 1)
                  ])
                ]),
                createVNode("div", { class: "space-y-4" }, [
                  createVNode("h4", { class: "font-semibold text-gray-900 dark:text-white" }, " Назначить доступ "),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Тип доступа "),
                    createVNode("div", { class: "flex gap-4" }, [
                      createVNode("label", { class: "flex items-center gap-2 cursor-pointer" }, [
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => accessForm.value.type = $event,
                          type: "radio",
                          value: "user",
                          class: "text-primary focus:ring-primary"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelRadio, accessForm.value.type]
                        ]),
                        createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, " Пользователь ")
                      ]),
                      createVNode("label", { class: "flex items-center gap-2 cursor-pointer" }, [
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => accessForm.value.type = $event,
                          type: "radio",
                          value: "group",
                          class: "text-primary focus:ring-primary"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelRadio, accessForm.value.type]
                        ]),
                        createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, " Группа ")
                      ]),
                      createVNode("label", { class: "flex items-center gap-2 cursor-pointer" }, [
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => accessForm.value.type = $event,
                          type: "radio",
                          value: "role",
                          class: "text-primary focus:ring-primary"
                        }, null, 8, ["onUpdate:modelValue"]), [
                          [vModelRadio, accessForm.value.type]
                        ]),
                        createVNode("span", { class: "text-sm text-gray-700 dark:text-gray-300" }, " Роль ")
                      ])
                    ])
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, toDisplayString(accessForm.value.type === "user" ? "Пользователь" : accessForm.value.type === "group" ? "Группа" : "Роль"), 1),
                    withDirectives(createVNode("select", {
                      "onUpdate:modelValue": ($event) => accessForm.value.targetId = $event,
                      class: "w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                    }, [
                      createVNode("option", { value: "" }, toDisplayString(accessForm.value.type === "user" ? "Выберите пользователя" : accessForm.value.type === "group" ? "Выберите группу" : "Выберите роль"), 1),
                      accessForm.value.type === "user" ? (openBlock(true), createBlock(Fragment, { key: 0 }, renderList(users.value, (item) => {
                        return openBlock(), createBlock("option", {
                          key: item.id,
                          value: item.id
                        }, toDisplayString(item.name), 9, ["value"]);
                      }), 128)) : accessForm.value.type === "group" ? (openBlock(true), createBlock(Fragment, { key: 1 }, renderList(groups.value, (item) => {
                        return openBlock(), createBlock("option", {
                          key: item.id,
                          value: item.id
                        }, toDisplayString(item.name), 9, ["value"]);
                      }), 128)) : accessForm.value.type === "role" ? (openBlock(), createBlock(Fragment, { key: 2 }, renderList(roles, (item) => {
                        return createVNode("option", {
                          key: item.id,
                          value: item.id
                        }, toDisplayString(item.name), 9, ["value"]);
                      }), 64)) : createCommentVNode("", true)
                    ], 8, ["onUpdate:modelValue"]), [
                      [vModelSelect, accessForm.value.targetId]
                    ])
                  ]),
                  createVNode(_component_UiButton, {
                    onClick: grantAccess,
                    disabled: !accessForm.value.targetId || granting.value,
                    class: "w-full"
                  }, {
                    default: withCtx(() => [
                      granting.value ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "flex items-center justify-center gap-2"
                      }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-4 h-4 animate-spin",
                          fill: "none",
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
                        createTextVNode(" Назначение... ")
                      ])) : (openBlock(), createBlock("span", { key: 1 }, "Назначить доступ"))
                    ]),
                    _: 1
                  }, 8, ["disabled"])
                ]),
                createVNode("div", { class: "border-t border-gray-200 dark:border-gray-700 pt-6" }, [
                  createVNode("h4", { class: "font-semibold text-gray-900 dark:text-white mb-4" }, " Текущие доступы "),
                  loadingAccess.value ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "text-center py-8"
                  }, [
                    createVNode("div", { class: "inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" })
                  ])) : accesses.value.length === 0 ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "text-center py-8 text-gray-500 dark:text-gray-400"
                  }, [
                    createVNode("p", null, "Доступы не назначены")
                  ])) : (openBlock(), createBlock("div", {
                    key: 2,
                    class: "space-y-2"
                  }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(accesses.value, (access) => {
                      return openBlock(), createBlock("div", {
                        key: access.id,
                        class: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      }, [
                        createVNode("div", { class: "flex items-center gap-3" }, [
                          createVNode("div", { class: "h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center" }, [
                            access.type === "user" ? (openBlock(), createBlock("svg", {
                              key: 0,
                              class: "w-5 h-5 text-primary",
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
                            ])) : (openBlock(), createBlock("svg", {
                              key: 1,
                              class: "w-5 h-5 text-primary",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              })
                            ]))
                          ]),
                          createVNode("div", null, [
                            createVNode("p", { class: "font-medium text-gray-900 dark:text-white" }, toDisplayString(access.name), 1),
                            createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, toDisplayString(access.type === "user" ? "Пользователь" : "Группа") + " " + toDisplayString(access.expires_at ? ` • До ${formatDate(access.expires_at)}` : " • Бессрочно"), 1)
                          ])
                        ]),
                        createVNode("button", {
                          onClick: ($event) => revokeAccess(access),
                          class: "p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors",
                          title: "Отозвать доступ"
                        }, [
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
                              d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            })
                          ]))
                        ], 8, ["onClick"])
                      ]);
                    }), 128))
                  ]))
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/library/AccessModal.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_4 = Object.assign(_sfc_main$2, { __name: "LibraryAccessModal" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "AnalyticsModal",
  __ssrInlineRender: true,
  props: {
    isOpen: { type: Boolean },
    book: {}
  },
  emits: ["close"],
  setup(__props) {
    const props = __props;
    const toast = useNotification();
    const loading = ref(false);
    const analytics = ref(null);
    const fetchAnalytics = async () => {
      if (!props.book) return;
      loading.value = true;
      try {
        const response = await $fetch(
          `/api/library/admin/books/${props.book.id}/analytics`
        );
        analytics.value = response;
      } catch (error) {
        toast.error(error.data?.message || "Ошибка загрузки аналитики");
      } finally {
        loading.value = false;
      }
    };
    const getInitials = (name) => {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    };
    const formatDateTime = (date) => {
      return new Date(date).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const formatDuration = (seconds) => {
      if (!seconds) return "—";
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor(seconds % 3600 / 60);
      if (hours > 0) {
        return `${hours}ч ${minutes}м`;
      }
      return `${minutes}м`;
    };
    watch(
      () => props.isOpen,
      (isOpen) => {
        if (isOpen && props.book) {
          fetchAnalytics();
        }
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Аналитика книги",
        size: "xl",
        onClose: ($event) => _ctx.$emit("close")
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (__props.book) {
              _push2(`<div class="space-y-6"${_scopeId}><div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"${_scopeId}><div class="h-16 w-12 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0"${_scopeId}>`);
              if (__props.book.cover_url) {
                _push2(`<img${ssrRenderAttr("src", __props.book.cover_url)}${ssrRenderAttr("alt", __props.book.title)} class="h-full w-full object-cover"${_scopeId}>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div${_scopeId}><h3 class="font-semibold text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(__props.book.title)}</h3><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(__props.book.author || "Автор не указан")}</p></div></div>`);
              if (loading.value) {
                _push2(`<div class="text-center py-12"${_scopeId}><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"${_scopeId}></div><p class="mt-4 text-gray-600 dark:text-gray-400"${_scopeId}> Загрузка аналитики... </p></div>`);
              } else if (analytics.value) {
                _push2(`<div${_scopeId}><div class="grid grid-cols-1 md:grid-cols-3 gap-4"${_scopeId}><div class="p-4 bg-primary/10 rounded-lg"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"${_scopeId}></path></svg><div${_scopeId}><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}> Всего просмотров </p><p class="text-2xl font-bold text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(analytics.value.totalViews)}</p></div></div></div><div class="p-4 bg-success/10 rounded-lg"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><svg class="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"${_scopeId}></path></svg><div${_scopeId}><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}> Уникальных читателей </p><p class="text-2xl font-bold text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(analytics.value.uniqueReaders)}</p></div></div></div><div class="p-4 bg-warning/10 rounded-lg"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><svg class="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg><div${_scopeId}><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}> Завершили чтение </p><p class="text-2xl font-bold text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(analytics.value.completedReaders)}</p></div></div></div></div><div class="p-4 bg-white dark:bg-boxdark border border-gray-200 dark:border-gray-700 rounded-lg"${_scopeId}><h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"${_scopeId}> Средний прогресс чтения </h4><div class="flex items-center gap-4"${_scopeId}><div class="flex-1"${_scopeId}><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"${_scopeId}><div class="bg-primary rounded-full h-3 transition-all duration-300" style="${ssrRenderStyle({ width: `${analytics.value.averageProgress}%` })}"${_scopeId}></div></div></div><span class="text-lg font-semibold text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(analytics.value.averageProgress)}% </span></div></div><div${_scopeId}><h4 class="font-semibold text-gray-900 dark:text-white mb-4"${_scopeId}> Активные читатели </h4>`);
                if (analytics.value.activeReaders.length === 0) {
                  _push2(`<div class="text-center py-8 text-gray-500 dark:text-gray-400"${_scopeId}><p${_scopeId}>Нет активных читателей</p></div>`);
                } else {
                  _push2(`<div class="space-y-2"${_scopeId}><!--[-->`);
                  ssrRenderList(analytics.value.activeReaders, (reader) => {
                    _push2(`<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"${_scopeId}><div class="flex items-center gap-3"${_scopeId}><div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"${_scopeId}><span class="text-sm font-semibold text-primary"${_scopeId}>${ssrInterpolate(getInitials(reader.userName))}</span></div><div${_scopeId}><p class="font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(reader.userName)}</p><p class="text-xs text-gray-500 dark:text-gray-400"${_scopeId}> Последняя активность: ${ssrInterpolate(formatDate(reader.lastActivity))}</p></div></div><div class="text-right"${_scopeId}><p class="text-sm font-medium text-gray-900 dark:text-white"${_scopeId}> Стр. ${ssrInterpolate(reader.currentPage)} / ${ssrInterpolate(__props.book.total_pages)}</p><div class="flex items-center gap-2 mt-1"${_scopeId}><div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5"${_scopeId}><div class="bg-primary rounded-full h-1.5" style="${ssrRenderStyle({ width: `${reader.progress}%` })}"${_scopeId}></div></div><span class="text-xs text-gray-500 dark:text-gray-400"${_scopeId}>${ssrInterpolate(reader.progress)}% </span></div></div></div>`);
                  });
                  _push2(`<!--]--></div>`);
                }
                _push2(`</div><div${_scopeId}><h4 class="font-semibold text-gray-900 dark:text-white mb-4"${_scopeId}> Последние сессии чтения </h4>`);
                if (analytics.value.recentSessions.length === 0) {
                  _push2(`<div class="text-center py-8 text-gray-500 dark:text-gray-400"${_scopeId}><p${_scopeId}>Нет записей о сессиях</p></div>`);
                } else {
                  _push2(`<div class="overflow-x-auto"${_scopeId}><table class="w-full"${_scopeId}><thead${_scopeId}><tr class="border-b border-gray-200 dark:border-gray-700"${_scopeId}><th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"${_scopeId}> Читатель </th><th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"${_scopeId}> Начало </th><th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"${_scopeId}> Окончание </th><th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400"${_scopeId}> Длительность </th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"${_scopeId}><!--[-->`);
                  ssrRenderList(analytics.value.recentSessions, (session) => {
                    _push2(`<tr class="hover:bg-gray-50 dark:hover:bg-gray-800"${_scopeId}><td class="px-4 py-3 text-sm text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(session.userName)}</td><td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(formatDateTime(session.startedAt))}</td><td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(session.endedAt ? formatDateTime(session.endedAt) : "В процессе")}</td><td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right"${_scopeId}>${ssrInterpolate(formatDuration(session.duration))}</td></tr>`);
                  });
                  _push2(`<!--]--></tbody></table></div>`);
                }
                _push2(`</div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              __props.book ? (openBlock(), createBlock("div", {
                key: 0,
                class: "space-y-6"
              }, [
                createVNode("div", { class: "flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" }, [
                  createVNode("div", { class: "h-16 w-12 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0" }, [
                    __props.book.cover_url ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: __props.book.cover_url,
                      alt: __props.book.title,
                      class: "h-full w-full object-cover"
                    }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                  ]),
                  createVNode("div", null, [
                    createVNode("h3", { class: "font-semibold text-gray-900 dark:text-white" }, toDisplayString(__props.book.title), 1),
                    createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, toDisplayString(__props.book.author || "Автор не указан"), 1)
                  ])
                ]),
                loading.value ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "text-center py-12"
                }, [
                  createVNode("div", { class: "inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" }),
                  createVNode("p", { class: "mt-4 text-gray-600 dark:text-gray-400" }, " Загрузка аналитики... ")
                ])) : analytics.value ? (openBlock(), createBlock("div", { key: 1 }, [
                  createVNode("div", { class: "grid grid-cols-1 md:grid-cols-3 gap-4" }, [
                    createVNode("div", { class: "p-4 bg-primary/10 rounded-lg" }, [
                      createVNode("div", { class: "flex items-center gap-3" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-8 h-8 text-primary",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          }),
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          })
                        ])),
                        createVNode("div", null, [
                          createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, " Всего просмотров "),
                          createVNode("p", { class: "text-2xl font-bold text-gray-900 dark:text-white" }, toDisplayString(analytics.value.totalViews), 1)
                        ])
                      ])
                    ]),
                    createVNode("div", { class: "p-4 bg-success/10 rounded-lg" }, [
                      createVNode("div", { class: "flex items-center gap-3" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-8 h-8 text-success",
                          fill: "none",
                          stroke: "currentColor",
                          viewBox: "0 0 24 24"
                        }, [
                          createVNode("path", {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          })
                        ])),
                        createVNode("div", null, [
                          createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, " Уникальных читателей "),
                          createVNode("p", { class: "text-2xl font-bold text-gray-900 dark:text-white" }, toDisplayString(analytics.value.uniqueReaders), 1)
                        ])
                      ])
                    ]),
                    createVNode("div", { class: "p-4 bg-warning/10 rounded-lg" }, [
                      createVNode("div", { class: "flex items-center gap-3" }, [
                        (openBlock(), createBlock("svg", {
                          class: "w-8 h-8 text-warning",
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
                        ])),
                        createVNode("div", null, [
                          createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, " Завершили чтение "),
                          createVNode("p", { class: "text-2xl font-bold text-gray-900 dark:text-white" }, toDisplayString(analytics.value.completedReaders), 1)
                        ])
                      ])
                    ])
                  ]),
                  createVNode("div", { class: "p-4 bg-white dark:bg-boxdark border border-gray-200 dark:border-gray-700 rounded-lg" }, [
                    createVNode("h4", { class: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-3" }, " Средний прогресс чтения "),
                    createVNode("div", { class: "flex items-center gap-4" }, [
                      createVNode("div", { class: "flex-1" }, [
                        createVNode("div", { class: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3" }, [
                          createVNode("div", {
                            class: "bg-primary rounded-full h-3 transition-all duration-300",
                            style: { width: `${analytics.value.averageProgress}%` }
                          }, null, 4)
                        ])
                      ]),
                      createVNode("span", { class: "text-lg font-semibold text-gray-900 dark:text-white" }, toDisplayString(analytics.value.averageProgress) + "% ", 1)
                    ])
                  ]),
                  createVNode("div", null, [
                    createVNode("h4", { class: "font-semibold text-gray-900 dark:text-white mb-4" }, " Активные читатели "),
                    analytics.value.activeReaders.length === 0 ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "text-center py-8 text-gray-500 dark:text-gray-400"
                    }, [
                      createVNode("p", null, "Нет активных читателей")
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "space-y-2"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(analytics.value.activeReaders, (reader) => {
                        return openBlock(), createBlock("div", {
                          key: reader.userId,
                          class: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        }, [
                          createVNode("div", { class: "flex items-center gap-3" }, [
                            createVNode("div", { class: "h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center" }, [
                              createVNode("span", { class: "text-sm font-semibold text-primary" }, toDisplayString(getInitials(reader.userName)), 1)
                            ]),
                            createVNode("div", null, [
                              createVNode("p", { class: "font-medium text-gray-900 dark:text-white" }, toDisplayString(reader.userName), 1),
                              createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400" }, " Последняя активность: " + toDisplayString(formatDate(reader.lastActivity)), 1)
                            ])
                          ]),
                          createVNode("div", { class: "text-right" }, [
                            createVNode("p", { class: "text-sm font-medium text-gray-900 dark:text-white" }, " Стр. " + toDisplayString(reader.currentPage) + " / " + toDisplayString(__props.book.total_pages), 1),
                            createVNode("div", { class: "flex items-center gap-2 mt-1" }, [
                              createVNode("div", { class: "w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5" }, [
                                createVNode("div", {
                                  class: "bg-primary rounded-full h-1.5",
                                  style: { width: `${reader.progress}%` }
                                }, null, 4)
                              ]),
                              createVNode("span", { class: "text-xs text-gray-500 dark:text-gray-400" }, toDisplayString(reader.progress) + "% ", 1)
                            ])
                          ])
                        ]);
                      }), 128))
                    ]))
                  ]),
                  createVNode("div", null, [
                    createVNode("h4", { class: "font-semibold text-gray-900 dark:text-white mb-4" }, " Последние сессии чтения "),
                    analytics.value.recentSessions.length === 0 ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "text-center py-8 text-gray-500 dark:text-gray-400"
                    }, [
                      createVNode("p", null, "Нет записей о сессиях")
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "overflow-x-auto"
                    }, [
                      createVNode("table", { class: "w-full" }, [
                        createVNode("thead", null, [
                          createVNode("tr", { class: "border-b border-gray-200 dark:border-gray-700" }, [
                            createVNode("th", { class: "px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400" }, " Читатель "),
                            createVNode("th", { class: "px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400" }, " Начало "),
                            createVNode("th", { class: "px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400" }, " Окончание "),
                            createVNode("th", { class: "px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400" }, " Длительность ")
                          ])
                        ]),
                        createVNode("tbody", { class: "divide-y divide-gray-200 dark:divide-gray-700" }, [
                          (openBlock(true), createBlock(Fragment, null, renderList(analytics.value.recentSessions, (session) => {
                            return openBlock(), createBlock("tr", {
                              key: session.id,
                              class: "hover:bg-gray-50 dark:hover:bg-gray-800"
                            }, [
                              createVNode("td", { class: "px-4 py-3 text-sm text-gray-900 dark:text-white" }, toDisplayString(session.userName), 1),
                              createVNode("td", { class: "px-4 py-3 text-sm text-gray-600 dark:text-gray-400" }, toDisplayString(formatDateTime(session.startedAt)), 1),
                              createVNode("td", { class: "px-4 py-3 text-sm text-gray-600 dark:text-gray-400" }, toDisplayString(session.endedAt ? formatDateTime(session.endedAt) : "В процессе"), 1),
                              createVNode("td", { class: "px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right" }, toDisplayString(formatDuration(session.duration)), 1)
                            ]);
                          }), 128))
                        ])
                      ])
                    ]))
                  ])
                ])) : createCommentVNode("", true)
              ])) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/library/AnalyticsModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_5 = Object.assign(_sfc_main$1, { __name: "LibraryAnalyticsModal" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const exportBooks = () => {
      const params = new URLSearchParams({
        ...filters.value.search && { search: filters.value.search },
        ...filters.value.status && { status: filters.value.status },
        ...filters.value.language && { language: filters.value.language }
      });
      (void 0).open(`/api/library/admin/books/export?${params}`, "_blank");
    };
    const toast = useNotification();
    const loading = ref(false);
    const books = ref([]);
    const pagination = ref({
      page: 1,
      limit: 20,
      total: 0
    });
    const stats = ref({
      ready: 0,
      processing: 0,
      failed: 0
    });
    const filters = ref({
      search: "",
      status: "",
      language: ""
    });
    const isUploadModalOpen = ref(false);
    const isEditModalOpen = ref(false);
    const isAccessModalOpen = ref(false);
    const isAnalyticsModalOpen = ref(false);
    const isDeleteModalOpen = ref(false);
    const isDeleting = ref(false);
    const selectedBook = ref(null);
    const hasActiveFilters = computed(() => {
      return filters.value.search || filters.value.status || filters.value.language;
    });
    const fetchBooks = async () => {
      loading.value = true;
      try {
        const params = new URLSearchParams({
          page: pagination.value.page.toString(),
          limit: pagination.value.limit.toString(),
          ...filters.value.search && { search: filters.value.search },
          ...filters.value.status && { status: filters.value.status },
          ...filters.value.language && { language: filters.value.language }
        });
        const response = await $fetch(`/api/library/admin/books?${params}`);
        books.value = response.books;
        pagination.value.total = response.total;
        stats.value = response.stats;
      } catch (error) {
        toast.error(error.data?.message || "Ошибка загрузки книг");
      } finally {
        loading.value = false;
      }
    };
    const handlePageChange = (page) => {
      pagination.value.page = page;
      fetchBooks();
    };
    const openUploadModal = () => {
      isUploadModalOpen.value = true;
    };
    const closeUploadModal = () => {
      isUploadModalOpen.value = false;
    };
    const handleBookUploaded = () => {
      closeUploadModal();
      fetchBooks();
      toast.success("Книга успешно загружена и отправлена на обработку");
    };
    const closeEditModal = () => {
      isEditModalOpen.value = false;
      selectedBook.value = null;
    };
    const handleBookUpdated = () => {
      closeEditModal();
      fetchBooks();
      toast.success("Книга успешно обновлена");
    };
    const closeAccessModal = () => {
      isAccessModalOpen.value = false;
      selectedBook.value = null;
    };
    const closeAnalyticsModal = () => {
      isAnalyticsModalOpen.value = false;
      selectedBook.value = null;
    };
    const closeDeleteModal = () => {
      isDeleteModalOpen.value = false;
      selectedBook.value = null;
    };
    const handleDelete = async () => {
      if (!selectedBook.value) return;
      isDeleting.value = true;
      try {
        await $fetch(`/api/library/admin/books/${selectedBook.value.id}`, {
          method: "DELETE"
        });
        toast.success("Книга успешно удалена");
        closeDeleteModal();
        fetchBooks();
      } catch (error) {
        toast.error(error.data?.message || "Ошибка удаления книги");
      } finally {
        isDeleting.value = false;
      }
    };
    const getStatusLabel = (status) => {
      const labels = {
        ready: "Готова",
        processing: "Обработка",
        failed: "Ошибка"
      };
      return labels[status] || status;
    };
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    };
    const getLanguageLabel = (lang) => {
      if (!lang) return "—";
      const labels = {
        ru: "🇷🇺 Русский",
        uz: "🇺🇿 O'zbekcha",
        en: "🇬🇧 English",
        kk: "🇰🇿 Қазақша"
      };
      return labels[lang] || lang.toUpperCase();
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      const _component_UiPagination = __nuxt_component_1$1;
      const _component_LibraryUploadBookModal = __nuxt_component_2;
      const _component_LibraryEditBookModal = __nuxt_component_3;
      const _component_LibraryAccessModal = __nuxt_component_4;
      const _component_LibraryAnalyticsModal = __nuxt_component_5;
      const _component_UiConfirmModal = __nuxt_component_3$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Управление библиотекой </h2><p class="text-sm text-gray-600 dark:text-gray-400 mt-1"> Загрузка, редактирование и управление доступом к книгам </p></div><div class="flex gap-2">`);
      _push(ssrRenderComponent(_component_UiButton, {
        onClick: exportBooks,
        variant: "secondary",
        class: "flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"${_scopeId}></path></svg> Экспорт `);
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
                  d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                })
              ])),
              createTextVNode(" Экспорт ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UiButton, {
        onClick: openUploadModal,
        class: "flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"${_scopeId}></path></svg> Загрузить книгу `);
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
                  d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                })
              ])),
              createTextVNode(" Загрузить книгу ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6"><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> Всего книг </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(pagination.value.total)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"><svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> Готовы к чтению </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.ready)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10"><svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> В обработке </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.processing)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10"><svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> С ошибками </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.failed)}</p></div></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6"><div class="flex items-center gap-3 mb-4"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg></div><h4 class="text-lg font-semibold text-black dark:text-white"> Фильтры </h4>`);
      if (hasActiveFilters.value) {
        _push(`<button class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Сбросить </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Поиск </label><div class="relative"><input${ssrRenderAttr("value", filters.value.search)} type="text" placeholder="Название, автор..." class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Статус </label><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.value.status) ? ssrLooseContain(filters.value.status, "") : ssrLooseEqual(filters.value.status, "")) ? " selected" : ""}>Все статусы</option><option value="ready"${ssrIncludeBooleanAttr(Array.isArray(filters.value.status) ? ssrLooseContain(filters.value.status, "ready") : ssrLooseEqual(filters.value.status, "ready")) ? " selected" : ""}>Готовы к чтению</option><option value="processing"${ssrIncludeBooleanAttr(Array.isArray(filters.value.status) ? ssrLooseContain(filters.value.status, "processing") : ssrLooseEqual(filters.value.status, "processing")) ? " selected" : ""}>В обработке</option><option value="failed"${ssrIncludeBooleanAttr(Array.isArray(filters.value.status) ? ssrLooseContain(filters.value.status, "failed") : ssrLooseEqual(filters.value.status, "failed")) ? " selected" : ""}>С ошибками</option></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Язык </label><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.value.language) ? ssrLooseContain(filters.value.language, "") : ssrLooseEqual(filters.value.language, "")) ? " selected" : ""}>Все языки</option><option value="ru"${ssrIncludeBooleanAttr(Array.isArray(filters.value.language) ? ssrLooseContain(filters.value.language, "ru") : ssrLooseEqual(filters.value.language, "ru")) ? " selected" : ""}>Русский</option><option value="uz"${ssrIncludeBooleanAttr(Array.isArray(filters.value.language) ? ssrLooseContain(filters.value.language, "uz") : ssrLooseEqual(filters.value.language, "uz")) ? " selected" : ""}>O&#39;zbekcha</option><option value="en"${ssrIncludeBooleanAttr(Array.isArray(filters.value.language) ? ssrLooseContain(filters.value.language, "en") : ssrLooseEqual(filters.value.language, "en")) ? " selected" : ""}>English</option><option value="kk"${ssrIncludeBooleanAttr(Array.isArray(filters.value.language) ? ssrLooseContain(filters.value.language, "kk") : ssrLooseEqual(filters.value.language, "kk")) ? " selected" : ""}>Қазақша</option></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">`);
      if (loading.value) {
        _push(`<div class="p-12 text-center"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div><p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка книг...</p></div>`);
      } else if (books.value.length === 0) {
        _push(`<div class="p-12 text-center text-gray-500 dark:text-gray-400"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg><p class="mt-4 text-lg font-medium">Книги не найдены</p><p class="mt-2">Загрузите первую книгу в библиотеку</p></div>`);
      } else {
        _push(`<div class="overflow-x-auto"><table class="w-full"><thead class="bg-gray-50 dark:bg-meta-4"><tr class="border-b border-stroke dark:border-strokedark"><th class="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Обложка </th><th class="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Название / Автор </th><th class="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Язык </th><th class="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Страницы </th><th class="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Статус </th><th class="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Читатели </th><th class="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Дата загрузки </th><th class="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"> Действия </th></tr></thead><tbody class="divide-y divide-stroke dark:divide-strokedark"><!--[-->`);
        ssrRenderList(books.value, (book) => {
          _push(`<tr class="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"><td class="px-4 py-3"><div class="h-16 w-12 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">`);
          if (book.cover_url) {
            _push(`<img${ssrRenderAttr("src", book.cover_url)}${ssrRenderAttr("alt", book.title)} class="h-full w-full object-cover">`);
          } else {
            _push(`<div class="h-full w-full flex items-center justify-center bg-primary/10"><svg class="w-6 h-6 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg></div>`);
          }
          _push(`</div></td><td class="px-4 py-3"><div class="max-w-md"><p class="font-semibold text-gray-900 dark:text-white line-clamp-2">${ssrInterpolate(book.title)}</p><p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${ssrInterpolate(book.author || "Автор не указан")}</p>`);
          if (book.description) {
            _push(`<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">${ssrInterpolate(book.description)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></td><td class="px-4 py-3"><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">${ssrInterpolate(getLanguageLabel(book.language))}</span></td><td class="px-4 py-3 text-center"><div class="flex items-center justify-center gap-1"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg><span class="text-sm text-gray-900 dark:text-white">${ssrInterpolate(book.total_pages || 0)}</span></div></td><td class="px-4 py-3 text-center"><span class="${ssrRenderClass([
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
            book.status === "ready" ? "bg-success/10 text-success" : book.status === "processing" ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger"
          ])}">${ssrInterpolate(getStatusLabel(book.status))}</span></td><td class="px-4 py-3 text-center"><div class="flex items-center justify-center gap-1"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg><span class="text-sm text-gray-900 dark:text-white">${ssrInterpolate(book.readers_count || 0)}</span></div></td><td class="px-4 py-3"><span class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(formatDate(book.created_at))}</span></td><td class="px-4 py-3"><div class="flex items-center justify-center gap-1"><button class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Аналитика"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></button><button class="p-2 text-gray-500 hover:text-success hover:bg-success/10 rounded-lg transition-colors" title="Управление доступом"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></button><button class="p-2 text-gray-500 hover:text-warning hover:bg-warning/10 rounded-lg transition-colors" title="Редактировать"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>`);
          if (book.status !== "processing") {
            _push(`<button class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Переобработать"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button class="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Удалить"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      }
      if (pagination.value.total > pagination.value.limit) {
        _push(`<div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4">`);
        _push(ssrRenderComponent(_component_UiPagination, {
          "current-page": pagination.value.page,
          "total-pages": Math.ceil(pagination.value.total / pagination.value.limit),
          total: pagination.value.total,
          limit: pagination.value.limit,
          "onUpdate:page": handlePageChange,
          "onUpdate:limit": (l) => {
            pagination.value.limit = l;
            fetchBooks();
          }
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_LibraryUploadBookModal, {
        "is-open": isUploadModalOpen.value,
        onClose: closeUploadModal,
        onUploaded: handleBookUploaded
      }, null, _parent));
      _push(ssrRenderComponent(_component_LibraryEditBookModal, {
        "is-open": isEditModalOpen.value,
        book: selectedBook.value,
        onClose: closeEditModal,
        onUpdated: handleBookUpdated
      }, null, _parent));
      _push(ssrRenderComponent(_component_LibraryAccessModal, {
        "is-open": isAccessModalOpen.value,
        book: selectedBook.value,
        onClose: closeAccessModal
      }, null, _parent));
      _push(ssrRenderComponent(_component_LibraryAnalyticsModal, {
        "is-open": isAnalyticsModalOpen.value,
        book: selectedBook.value,
        onClose: closeAnalyticsModal
      }, null, _parent));
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": isDeleteModalOpen.value,
        title: "Подтверждение удаления",
        message: "Вы уверены, что хотите удалить эту книгу?",
        "item-name": selectedBook.value?.title,
        warning: "Все файлы книги и история чтения будут безвозвратно удалены.",
        loading: isDeleting.value,
        onConfirm: handleDelete,
        onCancel: closeDeleteModal
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/library/books/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-DmEGwghg.mjs.map
