import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DnWQlAEm.mjs';
import { _ as __nuxt_component_0$1 } from './Modal-DQYphXo7.mjs';
import { ref, computed, mergeProps, unref, withCtx, createTextVNode, createBlock, openBlock, createVNode, withModifiers, createCommentVNode, withDirectives, vModelSelect, vModelText, vModelCheckbox, toDisplayString, Fragment, renderList, vModelRadio, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList } from 'vue/server-renderer';
import { x as xlsxExports } from '../_/xlsx.mjs';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
import { _ as __nuxt_component_3 } from './ConfirmModal-D4ued3Bi.mjs';
import { _ as __nuxt_component_4 } from './Notification-CQvvdM2O.mjs';
import { l as useRoute, n as navigateTo } from './server.mjs';
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
import 'fs';
import 'stream';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main$1 = {
  __name: "TestBankImportQuestionsModal",
  __ssrInlineRender: true,
  props: {
    bankId: {
      type: String,
      required: true
    }
  },
  emits: ["close", "imported"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const { authFetch } = useAuthFetch();
    const step = ref(1);
    const isDragging = ref(false);
    const selectedFile = ref(null);
    const fileError = ref("");
    const parsing = ref(false);
    const importing = ref(false);
    const parsedQuestions = ref([]);
    const defaultLanguage = ref("ru");
    const importResult = ref({
      success: false,
      imported: 0,
      skipped: 0,
      error: ""
    });
    const languageFlags = {
      ru: "🇷🇺",
      uz: "🇺🇿",
      en: "🇬🇧"
    };
    const languageBadgeClasses = {
      ru: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      uz: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      en: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
    };
    const validQuestionsCount = computed(() => {
      return parsedQuestions.value.filter((q) => q.valid).length;
    });
    const invalidQuestionsCount = computed(() => {
      return parsedQuestions.value.filter((q) => !q.valid).length;
    });
    const formatFileSize = (bytes) => {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };
    const onFileDrop = (e) => {
      isDragging.value = false;
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    };
    const onFileSelect = (e) => {
      const file = e.target.files[0];
      validateAndSetFile(file);
    };
    const validateAndSetFile = (file) => {
      fileError.value = "";
      if (!file) return;
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel"
      ];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        fileError.value = "Неверный формат файла. Загрузите Excel файл (.xlsx или .xls)";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        fileError.value = "Файл слишком большой. Максимальный размер 5MB";
        return;
      }
      selectedFile.value = file;
    };
    const clearFile = () => {
      selectedFile.value = null;
      fileError.value = "";
    };
    const parseFile = async () => {
      if (!selectedFile.value) return;
      parsing.value = true;
      fileError.value = "";
      try {
        const data = await readFileAsArrayBuffer(selectedFile.value);
        const workbook = xlsxExports.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsxExports.utils.sheet_to_json(sheet, { header: 1 });
        if (rows.length < 2) {
          fileError.value = "Файл пустой или не содержит данных";
          return;
        }
        const dataRows = rows.slice(1);
        parsedQuestions.value = dataRows.map((row, index) => {
          return parseRow(row, index + 2);
        });
        if (parsedQuestions.value.length === 0) {
          fileError.value = "Не найдено вопросов для импорта";
          return;
        }
        step.value = 2;
      } catch (err) {
        console.error("Ошибка парсинга файла:", err);
        fileError.value = "Ошибка чтения файла. Убедитесь, что файл не повреждён";
      } finally {
        parsing.value = false;
      }
    };
    const readFileAsArrayBuffer = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    };
    const parseRow = (row, rowNumber) => {
      let lang = String(row[8] || "").trim().toLowerCase();
      if (!["ru", "uz", "en"].includes(lang)) {
        lang = defaultLanguage.value;
      }
      const question = {
        question_text: String(row[0] || "").trim(),
        optionA: String(row[1] || "").trim(),
        optionB: String(row[2] || "").trim(),
        optionC: String(row[3] || "").trim(),
        optionD: String(row[4] || "").trim(),
        correctAnswer: String(row[5] || "").trim().toUpperCase(),
        points: parseInt(row[6]) || 1,
        difficulty: String(row[7] || "medium").trim().toLowerCase(),
        language: lang,
        valid: true,
        error: "",
        optionsCount: 0,
        rowNumber
      };
      const options = [question.optionA, question.optionB, question.optionC, question.optionD].filter((o) => o);
      question.optionsCount = options.length;
      if (!question.question_text) {
        question.valid = false;
        question.error = "Отсутствует текст вопроса";
        return question;
      }
      if (question.optionsCount < 2) {
        question.valid = false;
        question.error = "Минимум 2 варианта ответа";
        return question;
      }
      if (!["A", "B", "C", "D"].includes(question.correctAnswer)) {
        question.valid = false;
        question.error = "Неверный правильный ответ (должен быть A, B, C или D)";
        return question;
      }
      const correctIndex = { "A": 0, "B": 1, "C": 2, "D": 3 }[question.correctAnswer];
      if (correctIndex >= question.optionsCount) {
        question.valid = false;
        question.error = `Вариант ${question.correctAnswer} не заполнен`;
        return question;
      }
      if (!["easy", "medium", "hard"].includes(question.difficulty)) {
        question.difficulty = "medium";
      }
      if (question.points < 1 || question.points > 100) {
        question.points = 1;
      }
      return question;
    };
    const importQuestions = async () => {
      const validQuestions = parsedQuestions.value.filter((q) => q.valid);
      if (validQuestions.length === 0) return;
      importing.value = true;
      try {
        const questionsToImport = validQuestions.map((q) => {
          const options = [];
          if (q.optionA) options.push({ id: "a", text: q.optionA, correct: q.correctAnswer === "A" });
          if (q.optionB) options.push({ id: "b", text: q.optionB, correct: q.correctAnswer === "B" });
          if (q.optionC) options.push({ id: "c", text: q.optionC, correct: q.correctAnswer === "C" });
          if (q.optionD) options.push({ id: "d", text: q.optionD, correct: q.correctAnswer === "D" });
          return {
            bank_id: props.bankId,
            question_type: "single",
            question_text: q.question_text,
            options: { options },
            language: q.language,
            points: q.points,
            difficulty: q.difficulty,
            is_active: true
          };
        });
        const response = await authFetch("/api/test-bank/questions/import", {
          method: "POST",
          body: { questions: questionsToImport }
        });
        if (response.success) {
          importResult.value = {
            success: true,
            imported: response.imported || validQuestions.length,
            skipped: invalidQuestionsCount.value,
            error: ""
          };
        } else {
          importResult.value = {
            success: false,
            imported: 0,
            skipped: 0,
            error: response.message || "Ошибка при импорте вопросов"
          };
        }
        step.value = 3;
      } catch (err) {
        console.error("Ошибка импорта:", err);
        importResult.value = {
          success: false,
          imported: 0,
          skipped: 0,
          error: "Произошла ошибка при импорте"
        };
        step.value = 3;
      } finally {
        importing.value = false;
      }
    };
    const downloadTemplate = () => {
      const templateData = [
        ["Вопрос", "Вариант A", "Вариант B", "Вариант C", "Вариант D", "Правильный", "Баллы", "Сложность", "Язык"],
        ["Что такое СИЗ?", "Средства индивидуальной защиты", "Система измерения защиты", "Специальная инструкция защиты", "Стандарт измерения защиты", "A", 1, "easy", "ru"],
        ["Какой огнетушитель используется при пожаре класса E?", "Водный", "Порошковый", "Углекислотный", "Пенный", "C", 2, "medium", "ru"],
        ["Xavfsizlik texnikasi nima?", "Ishlab chiqarishda xavfsizlik qoidalari", "Texnik xizmat ko'rsatish", "Sifat nazorati", "Ishlab chiqarish rejasi", "A", 1, "easy", "uz"]
      ];
      const ws = xlsxExports.utils.aoa_to_sheet(templateData);
      const wb = xlsxExports.utils.book_new();
      xlsxExports.utils.book_append_sheet(wb, ws, "Вопросы");
      ws["!cols"] = [
        { wch: 40 },
        // Вопрос
        { wch: 30 },
        // Вариант A
        { wch: 30 },
        // Вариант B
        { wch: 30 },
        // Вариант C
        { wch: 30 },
        // Вариант D
        { wch: 12 },
        // Правильный
        { wch: 8 },
        // Баллы
        { wch: 12 },
        // Сложность
        { wch: 8 }
        // Язык
      ];
      xlsxExports.writeFile(wb, "questions_template.xlsx");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": true,
        title: "Импорт вопросов из Excel",
        size: "lg",
        onClose: ($event) => _ctx.$emit("close")
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-between"${_scopeId}>`);
            if (step.value === 2) {
              _push2(ssrRenderComponent(_component_UiButton, {
                variant: "outline",
                onClick: ($event) => step.value = 1
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(` Назад `);
                  } else {
                    return [
                      createTextVNode(" Назад ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<div${_scopeId}></div>`);
            }
            _push2(`<div class="flex gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: ($event) => _ctx.$emit("close")
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`${ssrInterpolate(step.value === 3 ? "Закрыть" : "Отмена")}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(step.value === 3 ? "Закрыть" : "Отмена"), 1)
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            if (step.value === 1) {
              _push2(ssrRenderComponent(_component_UiButton, {
                disabled: !selectedFile.value,
                loading: parsing.value,
                onClick: parseFile
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(` Далее `);
                  } else {
                    return [
                      createTextVNode(" Далее ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (step.value === 2) {
              _push2(ssrRenderComponent(_component_UiButton, {
                disabled: validQuestionsCount.value === 0,
                loading: importing.value,
                onClick: importQuestions
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(` Импортировать (${ssrInterpolate(validQuestionsCount.value)}) `);
                  } else {
                    return [
                      createTextVNode(" Импортировать (" + toDisplayString(validQuestionsCount.value) + ") ", 1)
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            if (step.value === 3 && importResult.value.success) {
              _push2(ssrRenderComponent(_component_UiButton, {
                onClick: ($event) => _ctx.$emit("imported")
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(` Готово `);
                  } else {
                    return [
                      createTextVNode(" Готово ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-between" }, [
                step.value === 2 ? (openBlock(), createBlock(_component_UiButton, {
                  key: 0,
                  variant: "outline",
                  onClick: ($event) => step.value = 1
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Назад ")
                  ]),
                  _: 1
                }, 8, ["onClick"])) : (openBlock(), createBlock("div", { key: 1 })),
                createVNode("div", { class: "flex gap-3" }, [
                  createVNode(_component_UiButton, {
                    variant: "outline",
                    onClick: ($event) => _ctx.$emit("close")
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(step.value === 3 ? "Закрыть" : "Отмена"), 1)
                    ]),
                    _: 1
                  }, 8, ["onClick"]),
                  step.value === 1 ? (openBlock(), createBlock(_component_UiButton, {
                    key: 0,
                    disabled: !selectedFile.value,
                    loading: parsing.value,
                    onClick: parseFile
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Далее ")
                    ]),
                    _: 1
                  }, 8, ["disabled", "loading"])) : createCommentVNode("", true),
                  step.value === 2 ? (openBlock(), createBlock(_component_UiButton, {
                    key: 1,
                    disabled: validQuestionsCount.value === 0,
                    loading: importing.value,
                    onClick: importQuestions
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Импортировать (" + toDisplayString(validQuestionsCount.value) + ") ", 1)
                    ]),
                    _: 1
                  }, 8, ["disabled", "loading"])) : createCommentVNode("", true),
                  step.value === 3 && importResult.value.success ? (openBlock(), createBlock(_component_UiButton, {
                    key: 2,
                    onClick: ($event) => _ctx.$emit("imported")
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Готово ")
                    ]),
                    _: 1
                  }, 8, ["onClick"])) : createCommentVNode("", true)
                ])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}>`);
            if (step.value === 1) {
              _push2(`<div${_scopeId}><div class="mb-4"${_scopeId}><h4 class="font-medium text-gray-900 dark:text-white mb-2"${_scopeId}>Формат файла</h4><p class="text-sm text-gray-600 dark:text-gray-400 mb-4"${_scopeId}> Загрузите Excel файл (.xlsx, .xls) с вопросами. Файл должен содержать следующие колонки: </p><div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto"${_scopeId}><table class="text-xs w-full"${_scopeId}><thead${_scopeId}><tr class="border-b border-gray-200 dark:border-gray-700"${_scopeId}><th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400"${_scopeId}>Вопрос</th><th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400"${_scopeId}>Вариант A</th><th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400"${_scopeId}>Вариант B</th><th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400"${_scopeId}>Вариант C</th><th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400"${_scopeId}>Вариант D</th><th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400"${_scopeId}>Правильный</th><th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400"${_scopeId}>Баллы</th><th class="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400"${_scopeId}>Сложность</th></tr></thead><tbody class="text-gray-500 dark:text-gray-400"${_scopeId}><tr${_scopeId}><td class="px-2 py-1"${_scopeId}>Что такое СИЗ?</td><td class="px-2 py-1"${_scopeId}>Средства защиты</td><td class="px-2 py-1"${_scopeId}>Система измерения</td><td class="px-2 py-1"${_scopeId}>Инструкция</td><td class="px-2 py-1"${_scopeId}>Стандарт</td><td class="px-2 py-1"${_scopeId}>A</td><td class="px-2 py-1"${_scopeId}>1</td><td class="px-2 py-1"${_scopeId}>easy</td></tr></tbody></table></div><div class="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400"${_scopeId}><p${_scopeId}><strong${_scopeId}>Правильный ответ:</strong> A, B, C или D (буква правильного варианта)</p><p${_scopeId}><strong${_scopeId}>Сложность:</strong> easy, medium или hard (необязательно, по умолчанию medium)</p><p${_scopeId}><strong${_scopeId}>Баллы:</strong> число от 1 до 100 (необязательно, по умолчанию 1)</p><p${_scopeId}><strong${_scopeId}>Язык:</strong> ru, uz или en (необязательно, по умолчанию язык, выбранный ниже)</p></div><div class="mt-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20"${_scopeId}><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"${_scopeId}> Язык по умолчанию для импортируемых вопросов </label><div class="flex items-center gap-4"${_scopeId}><label class="flex items-center gap-2 cursor-pointer"${_scopeId}><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(defaultLanguage.value, "ru")) ? " checked" : ""} value="ru" class="w-4 h-4 text-primary"${_scopeId}><span class="text-sm"${_scopeId}>🇷🇺 Русский</span></label><label class="flex items-center gap-2 cursor-pointer"${_scopeId}><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(defaultLanguage.value, "uz")) ? " checked" : ""} value="uz" class="w-4 h-4 text-primary"${_scopeId}><span class="text-sm"${_scopeId}>🇺🇿 O&#39;zbek</span></label><label class="flex items-center gap-2 cursor-pointer"${_scopeId}><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(defaultLanguage.value, "en")) ? " checked" : ""} value="en" class="w-4 h-4 text-primary"${_scopeId}><span class="text-sm"${_scopeId}>🇬🇧 English</span></label></div><p class="mt-2 text-xs text-gray-500 dark:text-gray-400"${_scopeId}> Этот язык будет применён ко всем вопросам, у которых не указан язык в файле </p></div><button class="mt-4 text-sm text-primary hover:text-primary/80 flex items-center gap-1"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"${_scopeId}></path></svg> Скачать шаблон </button></div><div class="${ssrRenderClass([
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging.value ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-600 hover:border-primary/50"
              ])}"${_scopeId}><input type="file" accept=".xlsx,.xls" class="hidden"${_scopeId}>`);
              if (!selectedFile.value) {
                _push2(`<div${_scopeId}><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"${_scopeId}></path></svg><p class="mt-2 text-gray-600 dark:text-gray-400"${_scopeId}> Перетащите файл сюда или <button type="button" class="text-primary hover:text-primary/80"${_scopeId}> выберите файл </button></p><p class="mt-1 text-xs text-gray-500"${_scopeId}>Excel файл (.xlsx, .xls)</p></div>`);
              } else {
                _push2(`<div class="flex items-center justify-center gap-3"${_scopeId}><svg class="h-10 w-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"${_scopeId}></path></svg><div class="text-left"${_scopeId}><p class="font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(selectedFile.value.name)}</p><p class="text-sm text-gray-500"${_scopeId}>${ssrInterpolate(formatFileSize(selectedFile.value.size))}</p></div><button type="button" class="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"${_scopeId}><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></button></div>`);
              }
              _push2(`</div>`);
              if (fileError.value) {
                _push2(`<p class="mt-2 text-sm text-danger"${_scopeId}>${ssrInterpolate(fileError.value)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (step.value === 2) {
              _push2(`<div${_scopeId}><div class="mb-4 flex items-center justify-between"${_scopeId}><div${_scopeId}><h4 class="font-medium text-gray-900 dark:text-white"${_scopeId}>Предпросмотр вопросов</h4><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}> Найдено ${ssrInterpolate(parsedQuestions.value.length)} вопросов для импорта </p></div>`);
              if (invalidQuestionsCount.value > 0) {
                _push2(`<span class="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning"${_scopeId}>${ssrInterpolate(invalidQuestionsCount.value)} с ошибками </span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700"${_scopeId}><table class="w-full text-sm"${_scopeId}><thead class="sticky top-0 bg-gray-50 dark:bg-gray-800"${_scopeId}><tr class="border-b border-gray-200 dark:border-gray-700"${_scopeId}><th class="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400 w-8"${_scopeId}>#</th><th class="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400"${_scopeId}>Вопрос</th><th class="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-16"${_scopeId}>Язык</th><th class="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-24"${_scopeId}>Вариантов</th><th class="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-20"${_scopeId}>Ответ</th><th class="px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-20"${_scopeId}>Статус</th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"${_scopeId}><!--[-->`);
              ssrRenderList(parsedQuestions.value, (q, index) => {
                _push2(`<tr class="${ssrRenderClass({ "bg-danger/5": !q.valid })}"${_scopeId}><td class="px-4 py-2 text-gray-500 dark:text-gray-400"${_scopeId}>${ssrInterpolate(index + 1)}</td><td class="px-4 py-2 text-gray-900 dark:text-white"${_scopeId}><div class="line-clamp-2"${_scopeId}>${ssrInterpolate(q.question_text || "—")}</div>`);
                if (q.error) {
                  _push2(`<p class="text-xs text-danger mt-1"${_scopeId}>${ssrInterpolate(q.error)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</td><td class="px-4 py-2 text-center"${_scopeId}><span class="${ssrRenderClass(languageBadgeClasses[q.language])}"${_scopeId}>${ssrInterpolate(languageFlags[q.language])}</span></td><td class="px-4 py-2 text-center text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(q.optionsCount || 0)}</td><td class="px-4 py-2 text-center"${_scopeId}>`);
                if (q.correctAnswer) {
                  _push2(`<span class="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"${_scopeId}>${ssrInterpolate(q.correctAnswer)}</span>`);
                } else {
                  _push2(`<span class="text-danger"${_scopeId}>—</span>`);
                }
                _push2(`</td><td class="px-4 py-2 text-center"${_scopeId}>`);
                if (q.valid) {
                  _push2(`<span class="text-success"${_scopeId}><svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"${_scopeId}></path></svg></span>`);
                } else {
                  _push2(`<span class="text-danger"${_scopeId}><svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></span>`);
                }
                _push2(`</td></tr>`);
              });
              _push2(`<!--]--></tbody></table></div>`);
              if (invalidQuestionsCount.value > 0) {
                _push2(`<div class="mt-4 p-3 bg-warning/10 rounded-lg"${_scopeId}><div class="flex items-start gap-2"${_scopeId}><svg class="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><div class="text-sm text-warning"${_scopeId}><p class="font-medium"${_scopeId}>${ssrInterpolate(invalidQuestionsCount.value)} вопросов с ошибками</p><p${_scopeId}>Вопросы с ошибками будут пропущены при импорте. Исправьте файл и загрузите снова, или продолжите импорт только валидных вопросов.</p></div></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (step.value === 3) {
              _push2(`<div${_scopeId}><div class="text-center py-6"${_scopeId}>`);
              if (importResult.value.success) {
                _push2(`<div class="text-success"${_scopeId}><svg class="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg><h4 class="mt-4 text-lg font-medium text-gray-900 dark:text-white"${_scopeId}> Импорт завершён успешно! </h4><p class="mt-2 text-gray-600 dark:text-gray-400"${_scopeId}> Импортировано ${ssrInterpolate(importResult.value.imported)} вопросов </p>`);
                if (importResult.value.skipped > 0) {
                  _push2(`<p class="text-sm text-warning"${_scopeId}> Пропущено ${ssrInterpolate(importResult.value.skipped)} вопросов с ошибками </p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
              } else {
                _push2(`<div class="text-danger"${_scopeId}><svg class="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg><h4 class="mt-4 text-lg font-medium"${_scopeId}>Ошибка импорта</h4><p class="mt-2"${_scopeId}>${ssrInterpolate(importResult.value.error)}</p></div>`);
              }
              _push2(`</div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                step.value === 1 ? (openBlock(), createBlock("div", { key: 0 }, [
                  createVNode("div", { class: "mb-4" }, [
                    createVNode("h4", { class: "font-medium text-gray-900 dark:text-white mb-2" }, "Формат файла"),
                    createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400 mb-4" }, " Загрузите Excel файл (.xlsx, .xls) с вопросами. Файл должен содержать следующие колонки: "),
                    createVNode("div", { class: "bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto" }, [
                      createVNode("table", { class: "text-xs w-full" }, [
                        createVNode("thead", null, [
                          createVNode("tr", { class: "border-b border-gray-200 dark:border-gray-700" }, [
                            createVNode("th", { class: "px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400" }, "Вопрос"),
                            createVNode("th", { class: "px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400" }, "Вариант A"),
                            createVNode("th", { class: "px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400" }, "Вариант B"),
                            createVNode("th", { class: "px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400" }, "Вариант C"),
                            createVNode("th", { class: "px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400" }, "Вариант D"),
                            createVNode("th", { class: "px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400" }, "Правильный"),
                            createVNode("th", { class: "px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400" }, "Баллы"),
                            createVNode("th", { class: "px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400" }, "Сложность")
                          ])
                        ]),
                        createVNode("tbody", { class: "text-gray-500 dark:text-gray-400" }, [
                          createVNode("tr", null, [
                            createVNode("td", { class: "px-2 py-1" }, "Что такое СИЗ?"),
                            createVNode("td", { class: "px-2 py-1" }, "Средства защиты"),
                            createVNode("td", { class: "px-2 py-1" }, "Система измерения"),
                            createVNode("td", { class: "px-2 py-1" }, "Инструкция"),
                            createVNode("td", { class: "px-2 py-1" }, "Стандарт"),
                            createVNode("td", { class: "px-2 py-1" }, "A"),
                            createVNode("td", { class: "px-2 py-1" }, "1"),
                            createVNode("td", { class: "px-2 py-1" }, "easy")
                          ])
                        ])
                      ])
                    ]),
                    createVNode("div", { class: "mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400" }, [
                      createVNode("p", null, [
                        createVNode("strong", null, "Правильный ответ:"),
                        createTextVNode(" A, B, C или D (буква правильного варианта)")
                      ]),
                      createVNode("p", null, [
                        createVNode("strong", null, "Сложность:"),
                        createTextVNode(" easy, medium или hard (необязательно, по умолчанию medium)")
                      ]),
                      createVNode("p", null, [
                        createVNode("strong", null, "Баллы:"),
                        createTextVNode(" число от 1 до 100 (необязательно, по умолчанию 1)")
                      ]),
                      createVNode("p", null, [
                        createVNode("strong", null, "Язык:"),
                        createTextVNode(" ru, uz или en (необязательно, по умолчанию язык, выбранный ниже)")
                      ])
                    ]),
                    createVNode("div", { class: "mt-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20" }, [
                      createVNode("label", { class: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, " Язык по умолчанию для импортируемых вопросов "),
                      createVNode("div", { class: "flex items-center gap-4" }, [
                        createVNode("label", { class: "flex items-center gap-2 cursor-pointer" }, [
                          withDirectives(createVNode("input", {
                            type: "radio",
                            "onUpdate:modelValue": ($event) => defaultLanguage.value = $event,
                            value: "ru",
                            class: "w-4 h-4 text-primary"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelRadio, defaultLanguage.value]
                          ]),
                          createVNode("span", { class: "text-sm" }, "🇷🇺 Русский")
                        ]),
                        createVNode("label", { class: "flex items-center gap-2 cursor-pointer" }, [
                          withDirectives(createVNode("input", {
                            type: "radio",
                            "onUpdate:modelValue": ($event) => defaultLanguage.value = $event,
                            value: "uz",
                            class: "w-4 h-4 text-primary"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelRadio, defaultLanguage.value]
                          ]),
                          createVNode("span", { class: "text-sm" }, "🇺🇿 O'zbek")
                        ]),
                        createVNode("label", { class: "flex items-center gap-2 cursor-pointer" }, [
                          withDirectives(createVNode("input", {
                            type: "radio",
                            "onUpdate:modelValue": ($event) => defaultLanguage.value = $event,
                            value: "en",
                            class: "w-4 h-4 text-primary"
                          }, null, 8, ["onUpdate:modelValue"]), [
                            [vModelRadio, defaultLanguage.value]
                          ]),
                          createVNode("span", { class: "text-sm" }, "🇬🇧 English")
                        ])
                      ]),
                      createVNode("p", { class: "mt-2 text-xs text-gray-500 dark:text-gray-400" }, " Этот язык будет применён ко всем вопросам, у которых не указан язык в файле ")
                    ]),
                    createVNode("button", {
                      onClick: downloadTemplate,
                      class: "mt-4 text-sm text-primary hover:text-primary/80 flex items-center gap-1"
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
                          d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        })
                      ])),
                      createTextVNode(" Скачать шаблон ")
                    ])
                  ]),
                  createVNode("div", {
                    onDrop: withModifiers(onFileDrop, ["prevent"]),
                    onDragover: withModifiers(($event) => isDragging.value = true, ["prevent"]),
                    onDragleave: withModifiers(($event) => isDragging.value = false, ["prevent"]),
                    class: [
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      isDragging.value ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-600 hover:border-primary/50"
                    ]
                  }, [
                    createVNode("input", {
                      ref: "fileInput",
                      type: "file",
                      accept: ".xlsx,.xls",
                      class: "hidden",
                      onChange: onFileSelect
                    }, null, 544),
                    !selectedFile.value ? (openBlock(), createBlock("div", { key: 0 }, [
                      (openBlock(), createBlock("svg", {
                        class: "mx-auto h-12 w-12 text-gray-400",
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
                      createVNode("p", { class: "mt-2 text-gray-600 dark:text-gray-400" }, [
                        createTextVNode(" Перетащите файл сюда или "),
                        createVNode("button", {
                          type: "button",
                          onClick: ($event) => _ctx.$refs.fileInput.click(),
                          class: "text-primary hover:text-primary/80"
                        }, " выберите файл ", 8, ["onClick"])
                      ]),
                      createVNode("p", { class: "mt-1 text-xs text-gray-500" }, "Excel файл (.xlsx, .xls)")
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "flex items-center justify-center gap-3"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "h-10 w-10 text-success",
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
                      createVNode("div", { class: "text-left" }, [
                        createVNode("p", { class: "font-medium text-gray-900 dark:text-white" }, toDisplayString(selectedFile.value.name), 1),
                        createVNode("p", { class: "text-sm text-gray-500" }, toDisplayString(formatFileSize(selectedFile.value.size)), 1)
                      ]),
                      createVNode("button", {
                        type: "button",
                        onClick: clearFile,
                        class: "p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
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
                  fileError.value ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-2 text-sm text-danger"
                  }, toDisplayString(fileError.value), 1)) : createCommentVNode("", true)
                ])) : createCommentVNode("", true),
                step.value === 2 ? (openBlock(), createBlock("div", { key: 1 }, [
                  createVNode("div", { class: "mb-4 flex items-center justify-between" }, [
                    createVNode("div", null, [
                      createVNode("h4", { class: "font-medium text-gray-900 dark:text-white" }, "Предпросмотр вопросов"),
                      createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, " Найдено " + toDisplayString(parsedQuestions.value.length) + " вопросов для импорта ", 1)
                    ]),
                    invalidQuestionsCount.value > 0 ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning"
                    }, toDisplayString(invalidQuestionsCount.value) + " с ошибками ", 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", { class: "max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700" }, [
                    createVNode("table", { class: "w-full text-sm" }, [
                      createVNode("thead", { class: "sticky top-0 bg-gray-50 dark:bg-gray-800" }, [
                        createVNode("tr", { class: "border-b border-gray-200 dark:border-gray-700" }, [
                          createVNode("th", { class: "px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400 w-8" }, "#"),
                          createVNode("th", { class: "px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400" }, "Вопрос"),
                          createVNode("th", { class: "px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-16" }, "Язык"),
                          createVNode("th", { class: "px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-24" }, "Вариантов"),
                          createVNode("th", { class: "px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-20" }, "Ответ"),
                          createVNode("th", { class: "px-4 py-2 text-center font-medium text-gray-600 dark:text-gray-400 w-20" }, "Статус")
                        ])
                      ]),
                      createVNode("tbody", { class: "divide-y divide-gray-200 dark:divide-gray-700" }, [
                        (openBlock(true), createBlock(Fragment, null, renderList(parsedQuestions.value, (q, index) => {
                          return openBlock(), createBlock("tr", {
                            key: index,
                            class: { "bg-danger/5": !q.valid }
                          }, [
                            createVNode("td", { class: "px-4 py-2 text-gray-500 dark:text-gray-400" }, toDisplayString(index + 1), 1),
                            createVNode("td", { class: "px-4 py-2 text-gray-900 dark:text-white" }, [
                              createVNode("div", { class: "line-clamp-2" }, toDisplayString(q.question_text || "—"), 1),
                              q.error ? (openBlock(), createBlock("p", {
                                key: 0,
                                class: "text-xs text-danger mt-1"
                              }, toDisplayString(q.error), 1)) : createCommentVNode("", true)
                            ]),
                            createVNode("td", { class: "px-4 py-2 text-center" }, [
                              createVNode("span", {
                                class: languageBadgeClasses[q.language]
                              }, toDisplayString(languageFlags[q.language]), 3)
                            ]),
                            createVNode("td", { class: "px-4 py-2 text-center text-gray-600 dark:text-gray-400" }, toDisplayString(q.optionsCount || 0), 1),
                            createVNode("td", { class: "px-4 py-2 text-center" }, [
                              q.correctAnswer ? (openBlock(), createBlock("span", {
                                key: 0,
                                class: "inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                              }, toDisplayString(q.correctAnswer), 1)) : (openBlock(), createBlock("span", {
                                key: 1,
                                class: "text-danger"
                              }, "—"))
                            ]),
                            createVNode("td", { class: "px-4 py-2 text-center" }, [
                              q.valid ? (openBlock(), createBlock("span", {
                                key: 0,
                                class: "text-success"
                              }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-5 h-5 mx-auto",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24"
                                }, [
                                  createVNode("path", {
                                    "stroke-linecap": "round",
                                    "stroke-linejoin": "round",
                                    "stroke-width": "2",
                                    d: "M5 13l4 4L19 7"
                                  })
                                ]))
                              ])) : (openBlock(), createBlock("span", {
                                key: 1,
                                class: "text-danger"
                              }, [
                                (openBlock(), createBlock("svg", {
                                  class: "w-5 h-5 mx-auto",
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
                              ]))
                            ])
                          ], 2);
                        }), 128))
                      ])
                    ])
                  ]),
                  invalidQuestionsCount.value > 0 ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "mt-4 p-3 bg-warning/10 rounded-lg"
                  }, [
                    createVNode("div", { class: "flex items-start gap-2" }, [
                      (openBlock(), createBlock("svg", {
                        class: "w-5 h-5 text-warning flex-shrink-0 mt-0.5",
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
                      createVNode("div", { class: "text-sm text-warning" }, [
                        createVNode("p", { class: "font-medium" }, toDisplayString(invalidQuestionsCount.value) + " вопросов с ошибками", 1),
                        createVNode("p", null, "Вопросы с ошибками будут пропущены при импорте. Исправьте файл и загрузите снова, или продолжите импорт только валидных вопросов.")
                      ])
                    ])
                  ])) : createCommentVNode("", true)
                ])) : createCommentVNode("", true),
                step.value === 3 ? (openBlock(), createBlock("div", { key: 2 }, [
                  createVNode("div", { class: "text-center py-6" }, [
                    importResult.value.success ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "text-success"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "mx-auto h-16 w-16",
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
                      createVNode("h4", { class: "mt-4 text-lg font-medium text-gray-900 dark:text-white" }, " Импорт завершён успешно! "),
                      createVNode("p", { class: "mt-2 text-gray-600 dark:text-gray-400" }, " Импортировано " + toDisplayString(importResult.value.imported) + " вопросов ", 1),
                      importResult.value.skipped > 0 ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "text-sm text-warning"
                      }, " Пропущено " + toDisplayString(importResult.value.skipped) + " вопросов с ошибками ", 1)) : createCommentVNode("", true)
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "text-danger"
                    }, [
                      (openBlock(), createBlock("svg", {
                        class: "mx-auto h-16 w-16",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24"
                      }, [
                        createVNode("path", {
                          "stroke-linecap": "round",
                          "stroke-linejoin": "round",
                          "stroke-width": "2",
                          d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        })
                      ])),
                      createVNode("h4", { class: "mt-4 text-lg font-medium" }, "Ошибка импорта"),
                      createVNode("p", { class: "mt-2" }, toDisplayString(importResult.value.error), 1)
                    ]))
                  ])
                ])) : createCommentVNode("", true)
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/test-bank/ImportQuestionsModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const { authFetch } = useAuthFetch();
    const { canManageTestBanks } = usePermissions();
    const loading = ref(true);
    const questionsLoading = ref(false);
    const savingQuestion = ref(false);
    const deletingQuestion = ref(false);
    const error = ref(null);
    const bank = ref(null);
    const questions = ref([]);
    const stats = ref({
      total: 0,
      difficulty: { easy: 0, medium: 0, hard: 0 },
      language: { ru: 0, uz: 0, en: 0 }
    });
    const questionFilters = ref({
      search: "",
      type: "",
      difficulty: "",
      language: "",
      isActive: void 0
    });
    const hasActiveQuestionFilters = computed(() => {
      return questionFilters.value.search !== "" || questionFilters.value.type !== "" || questionFilters.value.difficulty !== "" || questionFilters.value.language !== "" || questionFilters.value.isActive !== void 0;
    });
    const filteredQuestions = computed(() => {
      let result = questions.value;
      if (questionFilters.value.search) {
        const search = questionFilters.value.search.toLowerCase();
        result = result.filter(
          (q) => q.question_text.toLowerCase().includes(search)
        );
      }
      if (questionFilters.value.type) {
        result = result.filter(
          (q) => q.question_type === questionFilters.value.type
        );
      }
      if (questionFilters.value.difficulty) {
        result = result.filter(
          (q) => q.difficulty === questionFilters.value.difficulty
        );
      }
      if (questionFilters.value.language) {
        result = result.filter(
          (q) => (q.language || "ru") === questionFilters.value.language
        );
      }
      if (questionFilters.value.isActive !== void 0) {
        result = result.filter(
          (q) => q.is_active === questionFilters.value.isActive
        );
      }
      return result;
    });
    const questionTypeLabels = {
      single: "Один ответ",
      multiple: "Несколько ответов",
      text: "Текстовый",
      order: "Порядок",
      match: "Сопоставление"
    };
    const difficultyLabels = {
      easy: "Лёгкий",
      medium: "Средний",
      hard: "Сложный"
    };
    const difficultyClasses = {
      easy: "bg-success/10 text-success",
      medium: "bg-warning/10 text-warning",
      hard: "bg-danger/10 text-danger"
    };
    const languageLabels = {
      ru: "RU",
      uz: "UZ",
      en: "EN"
    };
    const languageFlags = {
      ru: "🇷🇺",
      uz: "🇺🇿",
      en: "🇬🇧"
    };
    const languageBadgeClasses = {
      ru: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      uz: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      en: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
    };
    const questionModalOpen = ref(false);
    const deleteQuestionModalOpen = ref(false);
    const showImportModal = ref(false);
    const editingQuestion = ref(null);
    const deletingQuestionData = ref(null);
    const questionForm = ref({
      question_type: "single",
      question_text: "",
      options: [
        { id: "a", text: "", correct: true },
        { id: "b", text: "", correct: false },
        { id: "c", text: "", correct: false },
        { id: "d", text: "", correct: false }
      ],
      language: "ru",
      points: 1,
      difficulty: "medium",
      explanation: "",
      is_active: true
    });
    const questionFormErrors = ref({
      question_text: "",
      options: ""
    });
    const notification = ref({
      show: false,
      type: "success",
      title: "",
      message: ""
    });
    const updateStats = async () => {
      try {
        const response = await authFetch(`/api/test-bank/banks/${route.params.id}`);
        if (response.success && response.stats) {
          stats.value = response.stats;
        }
      } catch (err) {
        console.error("Ошибка обновления статистики:", err);
      }
    };
    const loadQuestions = async () => {
      questionsLoading.value = true;
      try {
        const response = await authFetch(
          `/api/test-bank/questions?bank_id=${route.params.id}`
        );
        if (response.success) {
          questions.value = response.questions;
        }
      } catch (err) {
        console.error("Ошибка загрузки вопросов:", err);
      } finally {
        questionsLoading.value = false;
      }
    };
    const openCreateQuestionModal = () => {
      editingQuestion.value = null;
      questionForm.value = {
        question_type: "single",
        question_text: "",
        options: [
          { id: "a", text: "", correct: true },
          { id: "b", text: "", correct: false },
          { id: "c", text: "", correct: false },
          { id: "d", text: "", correct: false }
        ],
        language: "ru",
        points: 1,
        difficulty: "medium",
        explanation: "",
        is_active: true
      };
      questionFormErrors.value = { question_text: "", options: "" };
      questionModalOpen.value = true;
    };
    const closeQuestionModal = () => {
      questionModalOpen.value = false;
      editingQuestion.value = null;
    };
    const setCorrectOption = (index) => {
      questionForm.value.options.forEach((opt, i) => {
        opt.correct = i === index;
      });
    };
    const addOption = () => {
      const letters = "abcdefgh";
      const nextId = letters[questionForm.value.options.length];
      questionForm.value.options.push({
        id: nextId,
        text: "",
        correct: false
      });
    };
    const removeOption = (index) => {
      const wasCorrect = questionForm.value.options[index].correct;
      questionForm.value.options.splice(index, 1);
      if (wasCorrect && questionForm.value.options.length > 0) {
        questionForm.value.options[0].correct = true;
      }
      questionForm.value.options.forEach((opt, i) => {
        opt.id = "abcdefgh"[i];
      });
    };
    const validateQuestionForm = () => {
      questionFormErrors.value = { question_text: "", options: "" };
      let isValid = true;
      if (!questionForm.value.question_text.trim()) {
        questionFormErrors.value.question_text = "Текст вопроса обязателен";
        isValid = false;
      }
      if (questionForm.value.question_type === "single") {
        const filledOptions = questionForm.value.options.filter(
          (o) => o.text.trim()
        );
        if (filledOptions.length < 2) {
          questionFormErrors.value.options = "Минимум 2 варианта ответа";
          isValid = false;
        }
        const hasCorrect = questionForm.value.options.some(
          (o) => o.correct && o.text.trim()
        );
        if (!hasCorrect) {
          questionFormErrors.value.options = "Выберите правильный ответ";
          isValid = false;
        }
      }
      return isValid;
    };
    const saveQuestion = async () => {
      if (savingQuestion.value) return;
      if (!validateQuestionForm()) return;
      savingQuestion.value = true;
      try {
        const filteredOptions = questionForm.value.options.filter(
          (o) => o.text.trim()
        );
        const payload = {
          bank_id: route.params.id,
          question_type: questionForm.value.question_type,
          question_text: questionForm.value.question_text.trim(),
          options: { options: filteredOptions },
          language: questionForm.value.language,
          points: questionForm.value.points,
          difficulty: questionForm.value.difficulty,
          explanation: questionForm.value.explanation.trim() || void 0,
          is_active: questionForm.value.is_active
        };
        let response;
        if (editingQuestion.value) {
          response = await authFetch(
            `/api/test-bank/questions/${editingQuestion.value.id}`,
            {
              method: "PUT",
              body: payload
            }
          );
        } else {
          response = await authFetch("/api/test-bank/questions", {
            method: "POST",
            body: payload
          });
        }
        if (response.success) {
          showNotification(
            "success",
            "Успешно",
            editingQuestion.value ? "Вопрос обновлён" : "Вопрос добавлен"
          );
          closeQuestionModal();
          loadQuestions();
          updateStats();
        } else {
          showNotification(
            "error",
            "Ошибка",
            response.message || "Не удалось сохранить вопрос"
          );
        }
      } catch (err) {
        console.error("Ошибка сохранения вопроса:", err);
        showNotification("error", "Ошибка", "Произошла ошибка при сохранении");
      } finally {
        savingQuestion.value = false;
      }
    };
    const deleteQuestion = async () => {
      if (!deletingQuestionData.value) return;
      deletingQuestion.value = true;
      try {
        const response = await authFetch(
          `/api/test-bank/questions/${deletingQuestionData.value.id}`,
          {
            method: "DELETE"
          }
        );
        if (response.success) {
          showNotification("success", "Успешно", "Вопрос удалён");
          deleteQuestionModalOpen.value = false;
          deletingQuestionData.value = null;
          loadQuestions();
          updateStats();
        } else {
          showNotification(
            "error",
            "Ошибка",
            response.message || "Не удалось удалить вопрос"
          );
        }
      } catch (err) {
        console.error("Ошибка удаления вопроса:", err);
        showNotification("error", "Ошибка", "Произошла ошибка при удалении");
      } finally {
        deletingQuestion.value = false;
      }
    };
    const onQuestionsImported = () => {
      showImportModal.value = false;
      loadQuestions();
      updateStats();
      showNotification("success", "Успешно", "Вопросы импортированы");
    };
    const showNotification = (type, title, message) => {
      notification.value = {
        show: true,
        type,
        title,
        message
      };
      setTimeout(() => {
        notification.value.show = false;
      }, 5e3);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UiModal = __nuxt_component_0$1;
      const _component_TestBankImportQuestionsModal = _sfc_main$1;
      const _component_UiConfirmModal = __nuxt_component_3;
      const _component_UiNotification = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}>`);
      if (loading.value) {
        _push(`<div class="flex items-center justify-center h-64"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div></div>`);
      } else if (error.value) {
        _push(`<div class="text-center py-12"><svg class="mx-auto h-12 w-12 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><p class="mt-4 text-lg font-medium text-danger">${ssrInterpolate(error.value)}</p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          class: "mt-4",
          onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/test-bank")
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Вернуться к списку `);
            } else {
              return [
                createTextVNode(" Вернуться к списку ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else if (bank.value) {
        _push(`<!--[--><div class="mb-6"><nav class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/test-bank",
          class: "hover:text-primary transition-colors"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Банк тестов `);
            } else {
              return [
                createTextVNode(" Банк тестов ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg><span class="text-black dark:text-white">${ssrInterpolate(bank.value.name)}</span></nav><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div class="flex items-center gap-4"><div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10"><svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg></div><div><div class="flex items-center gap-3"><h2 class="text-title-md2 font-bold text-black dark:text-white">${ssrInterpolate(bank.value.name)}</h2><span class="${ssrRenderClass([
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          bank.value.is_active ? "bg-success/10 text-success" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
        ])}">${ssrInterpolate(bank.value.is_active ? "Активен" : "Неактивен")}</span></div><div class="flex items-center gap-3 mt-1"><span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">${ssrInterpolate(bank.value.code)}</span>`);
        if (bank.value.category) {
          _push(`<span class="text-sm text-gray-600 dark:text-gray-400">${ssrInterpolate(bank.value.category)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div><div class="flex gap-3">`);
        if (unref(canManageTestBanks)) {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "outline",
            onClick: ($event) => showImportModal.value = true,
            class: "flex items-center gap-2"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"${_scopeId}></path></svg> Импорт `);
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
                      d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    })
                  ])),
                  createTextVNode(" Импорт ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(canManageTestBanks)) {
          _push(ssrRenderComponent(_component_UiButton, {
            onClick: openCreateQuestionModal,
            class: "flex items-center gap-2"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Добавить вопрос `);
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
                  createTextVNode(" Добавить вопрос ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div><div class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6"><div class="md:col-span-2 rounded-lg bg-white dark:bg-boxdark p-4 shadow-md flex flex-col items-center justify-center"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><p class="text-xs font-medium text-gray-500 dark:text-gray-400"> Всего вопросов </p><p class="text-2xl font-bold text-black dark:text-white mt-1">${ssrInterpolate(stats.value.total)}</p></div><div class="md:col-span-5 rounded-lg bg-white dark:bg-boxdark p-4 shadow-md flex flex-col justify-center"><div class="flex items-center gap-2 mb-3 px-2"><div class="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10"><svg class="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div><p class="text-sm font-semibold text-gray-700 dark:text-gray-300"> Сложность </p></div><div class="grid grid-cols-3 gap-4 divide-x divide-gray-100 dark:divide-gray-700"><div class="flex flex-col items-center"><span class="text-xs text-gray-500 mb-1">Лёгкие</span><span class="text-xl font-bold text-success leading-none">${ssrInterpolate(stats.value.difficulty.easy)}</span></div><div class="flex flex-col items-center"><span class="text-xs text-gray-500 mb-1">Средние</span><span class="text-xl font-bold text-warning leading-none">${ssrInterpolate(stats.value.difficulty.medium)}</span></div><div class="flex flex-col items-center"><span class="text-xs text-gray-500 mb-1">Сложные</span><span class="text-xl font-bold text-danger leading-none">${ssrInterpolate(stats.value.difficulty.hard)}</span></div></div></div><div class="md:col-span-5 rounded-lg bg-white dark:bg-boxdark p-4 shadow-md flex flex-col justify-center"><div class="flex items-center gap-2 mb-3 px-2"><div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100/50 dark:bg-blue-900/30"><svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg></div><p class="text-sm font-semibold text-gray-700 dark:text-gray-300"> Языки </p></div><div class="grid grid-cols-3 gap-4 divide-x divide-gray-100 dark:divide-gray-700"><div class="flex flex-col items-center"><span class="text-lg mb-1 leading-none">🇷🇺</span><span class="text-xl font-bold text-black dark:text-white leading-none">${ssrInterpolate(stats.value.language.ru)}</span></div><div class="flex flex-col items-center"><span class="text-lg mb-1 leading-none">🇺🇿</span><span class="text-xl font-bold text-black dark:text-white leading-none">${ssrInterpolate(stats.value.language.uz)}</span></div><div class="flex flex-col items-center"><span class="text-lg mb-1 leading-none">🇬🇧</span><span class="text-xl font-bold text-black dark:text-white leading-none">${ssrInterpolate(stats.value.language.en)}</span></div></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6"><div class="flex items-center gap-3 mb-4"><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg></div><h4 class="text-lg font-semibold text-black dark:text-white"> Фильтры вопросов </h4>`);
        if (hasActiveQuestionFilters.value) {
          _push(`<button class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Сбросить </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="grid grid-cols-1 md:grid-cols-5 gap-4"><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Поиск </label><div class="relative"><input${ssrRenderAttr("value", questionFilters.value.search)} type="text" placeholder="Текст вопроса..." class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Тип вопроса </label><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"><option value=""${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.type) ? ssrLooseContain(questionFilters.value.type, "") : ssrLooseEqual(questionFilters.value.type, "")) ? " selected" : ""}>Все типы</option><option value="single"${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.type) ? ssrLooseContain(questionFilters.value.type, "single") : ssrLooseEqual(questionFilters.value.type, "single")) ? " selected" : ""}>Один ответ</option><option value="multiple"${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.type) ? ssrLooseContain(questionFilters.value.type, "multiple") : ssrLooseEqual(questionFilters.value.type, "multiple")) ? " selected" : ""}>Несколько ответов</option><option value="text"${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.type) ? ssrLooseContain(questionFilters.value.type, "text") : ssrLooseEqual(questionFilters.value.type, "text")) ? " selected" : ""}>Текстовый</option><option value="order"${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.type) ? ssrLooseContain(questionFilters.value.type, "order") : ssrLooseEqual(questionFilters.value.type, "order")) ? " selected" : ""}>Порядок</option><option value="match"${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.type) ? ssrLooseContain(questionFilters.value.type, "match") : ssrLooseEqual(questionFilters.value.type, "match")) ? " selected" : ""}>Сопоставление</option></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Сложность </label><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"><option value=""${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.difficulty) ? ssrLooseContain(questionFilters.value.difficulty, "") : ssrLooseEqual(questionFilters.value.difficulty, "")) ? " selected" : ""}>Любая</option><option value="easy"${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.difficulty) ? ssrLooseContain(questionFilters.value.difficulty, "easy") : ssrLooseEqual(questionFilters.value.difficulty, "easy")) ? " selected" : ""}>Лёгкий</option><option value="medium"${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.difficulty) ? ssrLooseContain(questionFilters.value.difficulty, "medium") : ssrLooseEqual(questionFilters.value.difficulty, "medium")) ? " selected" : ""}>Средний</option><option value="hard"${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.difficulty) ? ssrLooseContain(questionFilters.value.difficulty, "hard") : ssrLooseEqual(questionFilters.value.difficulty, "hard")) ? " selected" : ""}>Сложный</option></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Язык </label><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"><option value=""${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.language) ? ssrLooseContain(questionFilters.value.language, "") : ssrLooseEqual(questionFilters.value.language, "")) ? " selected" : ""}>Все языки</option><option value="ru"${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.language) ? ssrLooseContain(questionFilters.value.language, "ru") : ssrLooseEqual(questionFilters.value.language, "ru")) ? " selected" : ""}>🇷🇺 Русский</option><option value="uz"${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.language) ? ssrLooseContain(questionFilters.value.language, "uz") : ssrLooseEqual(questionFilters.value.language, "uz")) ? " selected" : ""}>🇺🇿 O&#39;zbek</option><option value="en"${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.language) ? ssrLooseContain(questionFilters.value.language, "en") : ssrLooseEqual(questionFilters.value.language, "en")) ? " selected" : ""}>🇬🇧 English</option></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div><div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Статус </label><div class="relative"><select class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"><option${ssrRenderAttr("value", void 0)}${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.isActive) ? ssrLooseContain(questionFilters.value.isActive, void 0) : ssrLooseEqual(questionFilters.value.isActive, void 0)) ? " selected" : ""}>Все</option><option${ssrRenderAttr("value", true)}${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.isActive) ? ssrLooseContain(questionFilters.value.isActive, true) : ssrLooseEqual(questionFilters.value.isActive, true)) ? " selected" : ""}>Активные</option><option${ssrRenderAttr("value", false)}${ssrIncludeBooleanAttr(Array.isArray(questionFilters.value.isActive) ? ssrLooseContain(questionFilters.value.isActive, false) : ssrLooseEqual(questionFilters.value.isActive, false)) ? " selected" : ""}>Неактивные</option></select><svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">`);
        if (questionsLoading.value) {
          _push(`<div class="p-12 text-center"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div><p class="mt-4 text-gray-600 dark:text-gray-400"> Загрузка вопросов... </p></div>`);
        } else if (filteredQuestions.value.length === 0) {
          _push(`<div class="p-12 text-center text-gray-500 dark:text-gray-400"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><p class="mt-4 text-lg font-medium">${ssrInterpolate(questions.value.length === 0 ? "Вопросы пока не добавлены" : "Нет вопросов по заданным фильтрам")}</p>`);
          if (questions.value.length === 0) {
            _push(`<p class="mt-2"> Нажмите &quot;Добавить вопрос&quot; или &quot;Импорт&quot; для добавления вопросов </p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead class="bg-gray-50 dark:bg-gray-800"><tr><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12"> # </th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"> Вопрос </th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24"> Язык </th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32"> Сложность </th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24"> Баллы </th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24"> Статус </th><th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32"> Действия </th></tr></thead><tbody class="bg-white dark:bg-boxdark divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
          ssrRenderList(filteredQuestions.value, (question, index) => {
            _push(`<tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${ssrInterpolate(index + 1)}</td><td class="px-6 py-4"><div class="flex flex-col gap-1"><div class="text-sm text-gray-900 dark:text-white font-medium line-clamp-2"${ssrRenderAttr("title", question.question_text)}>${ssrInterpolate(question.question_text)}</div><div class="flex items-center gap-2"><span class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">${ssrInterpolate(questionTypeLabels[question.question_type])}</span></div></div></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"><span class="${ssrRenderClass(languageBadgeClasses[question.language || "ru"])}">${ssrInterpolate(languageFlags[question.language || "ru"])} ${ssrInterpolate(languageLabels[question.language || "ru"])}</span></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"><span class="${ssrRenderClass([
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              difficultyClasses[question.difficulty]
            ])}">${ssrInterpolate(difficultyLabels[question.difficulty])}</span></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${ssrInterpolate(question.points)}</td><td class="px-6 py-4 whitespace-nowrap text-sm">`);
            if (question.is_active) {
              _push(`<span class="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"> Активен </span>`);
            } else {
              _push(`<span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-500"> Неактивен </span>`);
            }
            _push(`</td><td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div class="flex items-center justify-end gap-2">`);
            if (unref(canManageTestBanks)) {
              _push(`<button class="text-primary hover:text-primary/80 p-1" title="Редактировать"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>`);
            } else {
              _push(`<!---->`);
            }
            if (unref(canManageTestBanks)) {
              _push(`<button class="${ssrRenderClass([
                question.is_active ? "text-warning hover:text-warning/80" : "text-success hover:text-success/80",
                "p-1"
              ])}"${ssrRenderAttr(
                "title",
                question.is_active ? "Деактивировать" : "Активировать"
              )}>`);
              if (question.is_active) {
                _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
              } else {
                _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
              }
              _push(`</button>`);
            } else {
              _push(`<!---->`);
            }
            if (unref(canManageTestBanks)) {
              _push(`<button class="text-danger hover:text-danger/80 p-1" title="Удалить"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></td></tr>`);
          });
          _push(`<!--]--></tbody></table></div>`);
        }
        _push(`</div><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_UiModal, {
        "is-open": questionModalOpen.value,
        title: editingQuestion.value ? "Редактировать вопрос" : "Добавить вопрос",
        size: "lg",
        onClose: closeQuestionModal
      }, {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end gap-3"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: closeQuestionModal
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
              loading: savingQuestion.value,
              onClick: saveQuestion
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`${ssrInterpolate(editingQuestion.value ? "Сохранить" : "Добавить")}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(editingQuestion.value ? "Сохранить" : "Добавить"), 1)
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
                  onClick: closeQuestionModal
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Отмена ")
                  ]),
                  _: 1
                }),
                createVNode(_component_UiButton, {
                  loading: savingQuestion.value,
                  onClick: saveQuestion
                }, {
                  default: withCtx(() => [
                    createTextVNode(toDisplayString(editingQuestion.value ? "Сохранить" : "Добавить"), 1)
                  ]),
                  _: 1
                }, 8, ["loading"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<form class="space-y-4"${_scopeId}><div class="grid grid-cols-12 gap-3"${_scopeId}><div class="col-span-12 md:col-span-3"${_scopeId}><label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Тип </label><div class="relative"${_scopeId}><select class="w-full rounded-lg border border-stroke bg-transparent py-1.5 pl-3 pr-8 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"${_scopeId}><option value="single"${ssrIncludeBooleanAttr(Array.isArray(questionForm.value.question_type) ? ssrLooseContain(questionForm.value.question_type, "single") : ssrLooseEqual(questionForm.value.question_type, "single")) ? " selected" : ""}${_scopeId}>Один ответ</option><option value="multiple"${ssrIncludeBooleanAttr(Array.isArray(questionForm.value.question_type) ? ssrLooseContain(questionForm.value.question_type, "multiple") : ssrLooseEqual(questionForm.value.question_type, "multiple")) ? " selected" : ""}${_scopeId}>Несколько</option><option value="text"${ssrIncludeBooleanAttr(Array.isArray(questionForm.value.question_type) ? ssrLooseContain(questionForm.value.question_type, "text") : ssrLooseEqual(questionForm.value.question_type, "text")) ? " selected" : ""}${_scopeId}>Текст</option><option value="order"${ssrIncludeBooleanAttr(Array.isArray(questionForm.value.question_type) ? ssrLooseContain(questionForm.value.question_type, "order") : ssrLooseEqual(questionForm.value.question_type, "order")) ? " selected" : ""}${_scopeId}>Порядок</option><option value="match"${ssrIncludeBooleanAttr(Array.isArray(questionForm.value.question_type) ? ssrLooseContain(questionForm.value.question_type, "match") : ssrLooseEqual(questionForm.value.question_type, "match")) ? " selected" : ""}${_scopeId}>Пары</option></select><svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div><div class="col-span-6 md:col-span-3"${_scopeId}><label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Язык </label><div class="relative"${_scopeId}><select class="w-full rounded-lg border border-stroke bg-transparent py-1.5 pl-3 pr-8 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"${_scopeId}><option value="ru"${ssrIncludeBooleanAttr(Array.isArray(questionForm.value.language) ? ssrLooseContain(questionForm.value.language, "ru") : ssrLooseEqual(questionForm.value.language, "ru")) ? " selected" : ""}${_scopeId}>🇷🇺 Русский</option><option value="uz"${ssrIncludeBooleanAttr(Array.isArray(questionForm.value.language) ? ssrLooseContain(questionForm.value.language, "uz") : ssrLooseEqual(questionForm.value.language, "uz")) ? " selected" : ""}${_scopeId}>🇺🇿 O&#39;zbek</option><option value="en"${ssrIncludeBooleanAttr(Array.isArray(questionForm.value.language) ? ssrLooseContain(questionForm.value.language, "en") : ssrLooseEqual(questionForm.value.language, "en")) ? " selected" : ""}${_scopeId}>🇬🇧 English</option></select><svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div><div class="col-span-6 md:col-span-3"${_scopeId}><label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Сложность </label><div class="relative"${_scopeId}><select class="w-full rounded-lg border border-stroke bg-transparent py-1.5 pl-3 pr-8 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"${_scopeId}><option value="easy"${ssrIncludeBooleanAttr(Array.isArray(questionForm.value.difficulty) ? ssrLooseContain(questionForm.value.difficulty, "easy") : ssrLooseEqual(questionForm.value.difficulty, "easy")) ? " selected" : ""}${_scopeId}>Лёгкий</option><option value="medium"${ssrIncludeBooleanAttr(Array.isArray(questionForm.value.difficulty) ? ssrLooseContain(questionForm.value.difficulty, "medium") : ssrLooseEqual(questionForm.value.difficulty, "medium")) ? " selected" : ""}${_scopeId}>Средний</option><option value="hard"${ssrIncludeBooleanAttr(Array.isArray(questionForm.value.difficulty) ? ssrLooseContain(questionForm.value.difficulty, "hard") : ssrLooseEqual(questionForm.value.difficulty, "hard")) ? " selected" : ""}${_scopeId}>Сложный</option></select><svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"${_scopeId}></path></svg></div></div><div class="col-span-6 md:col-span-2"${_scopeId}><label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Баллы </label><input${ssrRenderAttr("value", questionForm.value.points)} type="number" min="1" max="100" class="w-full rounded-lg border border-stroke bg-transparent py-1.5 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"${_scopeId}></div><div class="col-span-6 md:col-span-1 flex items-end pb-1.5 justify-center"${_scopeId}><label class="cursor-pointer flex items-center" title="Активность"${_scopeId}><input${ssrIncludeBooleanAttr(Array.isArray(questionForm.value.is_active) ? ssrLooseContain(questionForm.value.is_active, null) : questionForm.value.is_active) ? " checked" : ""} type="checkbox" class="sr-only peer"${_scopeId}><div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[&#39;&#39;] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary relative"${_scopeId}></div></label></div></div><div${_scopeId}><label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Текст вопроса <span class="text-danger"${_scopeId}>*</span></label><textarea rows="2" placeholder="Введите текст вопроса..." class="${ssrRenderClass([{ "border-danger": questionFormErrors.value.question_text }, "w-full rounded-lg border border-stroke bg-transparent py-2 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"])}"${_scopeId}>${ssrInterpolate(questionForm.value.question_text)}</textarea>`);
            if (questionFormErrors.value.question_text) {
              _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(questionFormErrors.value.question_text)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            if (questionForm.value.question_type === "single") {
              _push2(`<div class="space-y-2"${_scopeId}><label class="block text-xs font-medium text-gray-700 dark:text-gray-300"${_scopeId}> Варианты ответов <span class="text-danger"${_scopeId}>*</span></label><div class="space-y-2 max-h-60 overflow-y-auto pr-1"${_scopeId}><!--[-->`);
              ssrRenderList(questionForm.value.options, (option, index) => {
                _push2(`<div class="flex items-center gap-2"${_scopeId}><label class="shrink-0 cursor-pointer"${_scopeId}><input type="radio"${ssrRenderAttr("name", "correct-option-" + editingQuestion.value?.id)}${ssrIncludeBooleanAttr(option.correct) ? " checked" : ""} class="sr-only peer"${_scopeId}><div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all peer-checked:border-success peer-checked:bg-success border-gray-300 dark:border-gray-600"${_scopeId}><svg class="w-3 h-3 text-white hidden peer-checked:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"${_scopeId}></path></svg></div></label><span class="shrink-0 w-7 h-7 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(String.fromCharCode(65 + index))}</span><input${ssrRenderAttr("value", option.text)} type="text"${ssrRenderAttr("placeholder", `Вариант ${String.fromCharCode(65 + index)}`)} class="${ssrRenderClass([{ "border-success": option.correct }, "grow rounded border border-stroke bg-transparent py-1.5 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"])}"${_scopeId}>`);
                if (questionForm.value.options.length > 2) {
                  _push2(`<button type="button" class="shrink-0 text-gray-400 hover:text-danger p-1" title="Удалить вариант"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg></button>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
              });
              _push2(`<!--]--></div>`);
              if (questionForm.value.options.length < 8) {
                _push2(`<button type="button" class="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mt-1"${_scopeId}><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"${_scopeId}></path></svg> Добавить вариант </button>`);
              } else {
                _push2(`<!---->`);
              }
              if (questionFormErrors.value.options) {
                _push2(`<p class="mt-1 text-xs text-danger"${_scopeId}>${ssrInterpolate(questionFormErrors.value.options)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div${_scopeId}><label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"${_scopeId}> Объяснение </label><textarea rows="1" placeholder="Комментарий к ответу..." class="w-full rounded-lg border border-stroke bg-transparent py-2 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"${_scopeId}>${ssrInterpolate(questionForm.value.explanation)}</textarea></div></form>`);
          } else {
            return [
              createVNode("form", {
                onSubmit: withModifiers(() => {
                }, ["prevent"]),
                class: "space-y-4"
              }, [
                createVNode("div", { class: "grid grid-cols-12 gap-3" }, [
                  createVNode("div", { class: "col-span-12 md:col-span-3" }, [
                    createVNode("label", { class: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1" }, " Тип "),
                    createVNode("div", { class: "relative" }, [
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => questionForm.value.question_type = $event,
                        class: "w-full rounded-lg border border-stroke bg-transparent py-1.5 pl-3 pr-8 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                      }, [
                        createVNode("option", { value: "single" }, "Один ответ"),
                        createVNode("option", { value: "multiple" }, "Несколько"),
                        createVNode("option", { value: "text" }, "Текст"),
                        createVNode("option", { value: "order" }, "Порядок"),
                        createVNode("option", { value: "match" }, "Пары")
                      ], 8, ["onUpdate:modelValue"]), [
                        [vModelSelect, questionForm.value.question_type]
                      ]),
                      (openBlock(), createBlock("svg", {
                        class: "absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
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
                  createVNode("div", { class: "col-span-6 md:col-span-3" }, [
                    createVNode("label", { class: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1" }, " Язык "),
                    createVNode("div", { class: "relative" }, [
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => questionForm.value.language = $event,
                        class: "w-full rounded-lg border border-stroke bg-transparent py-1.5 pl-3 pr-8 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                      }, [
                        createVNode("option", { value: "ru" }, "🇷🇺 Русский"),
                        createVNode("option", { value: "uz" }, "🇺🇿 O'zbek"),
                        createVNode("option", { value: "en" }, "🇬🇧 English")
                      ], 8, ["onUpdate:modelValue"]), [
                        [vModelSelect, questionForm.value.language]
                      ]),
                      (openBlock(), createBlock("svg", {
                        class: "absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
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
                  createVNode("div", { class: "col-span-6 md:col-span-3" }, [
                    createVNode("label", { class: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1" }, " Сложность "),
                    createVNode("div", { class: "relative" }, [
                      withDirectives(createVNode("select", {
                        "onUpdate:modelValue": ($event) => questionForm.value.difficulty = $event,
                        class: "w-full rounded-lg border border-stroke bg-transparent py-1.5 pl-3 pr-8 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                      }, [
                        createVNode("option", { value: "easy" }, "Лёгкий"),
                        createVNode("option", { value: "medium" }, "Средний"),
                        createVNode("option", { value: "hard" }, "Сложный")
                      ], 8, ["onUpdate:modelValue"]), [
                        [vModelSelect, questionForm.value.difficulty]
                      ]),
                      (openBlock(), createBlock("svg", {
                        class: "absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none",
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
                  createVNode("div", { class: "col-span-6 md:col-span-2" }, [
                    createVNode("label", { class: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1" }, " Баллы "),
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => questionForm.value.points = $event,
                      type: "number",
                      min: "1",
                      max: "100",
                      class: "w-full rounded-lg border border-stroke bg-transparent py-1.5 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [
                        vModelText,
                        questionForm.value.points,
                        void 0,
                        { number: true }
                      ]
                    ])
                  ]),
                  createVNode("div", { class: "col-span-6 md:col-span-1 flex items-end pb-1.5 justify-center" }, [
                    createVNode("label", {
                      class: "cursor-pointer flex items-center",
                      title: "Активность"
                    }, [
                      withDirectives(createVNode("input", {
                        "onUpdate:modelValue": ($event) => questionForm.value.is_active = $event,
                        type: "checkbox",
                        class: "sr-only peer"
                      }, null, 8, ["onUpdate:modelValue"]), [
                        [vModelCheckbox, questionForm.value.is_active]
                      ]),
                      createVNode("div", { class: "w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary relative" })
                    ])
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1" }, [
                    createTextVNode(" Текст вопроса "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => questionForm.value.question_text = $event,
                    rows: "2",
                    placeholder: "Введите текст вопроса...",
                    class: ["w-full rounded-lg border border-stroke bg-transparent py-2 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none", { "border-danger": questionFormErrors.value.question_text }]
                  }, null, 10, ["onUpdate:modelValue"]), [
                    [vModelText, questionForm.value.question_text]
                  ]),
                  questionFormErrors.value.question_text ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "mt-1 text-xs text-danger"
                  }, toDisplayString(questionFormErrors.value.question_text), 1)) : createCommentVNode("", true)
                ]),
                questionForm.value.question_type === "single" ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "space-y-2"
                }, [
                  createVNode("label", { class: "block text-xs font-medium text-gray-700 dark:text-gray-300" }, [
                    createTextVNode(" Варианты ответов "),
                    createVNode("span", { class: "text-danger" }, "*")
                  ]),
                  createVNode("div", { class: "space-y-2 max-h-60 overflow-y-auto pr-1" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(questionForm.value.options, (option, index) => {
                      return openBlock(), createBlock("div", {
                        key: option.id,
                        class: "flex items-center gap-2"
                      }, [
                        createVNode("label", { class: "shrink-0 cursor-pointer" }, [
                          createVNode("input", {
                            type: "radio",
                            name: "correct-option-" + editingQuestion.value?.id,
                            checked: option.correct,
                            onChange: ($event) => setCorrectOption(index),
                            class: "sr-only peer"
                          }, null, 40, ["name", "checked", "onChange"]),
                          createVNode("div", { class: "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all peer-checked:border-success peer-checked:bg-success border-gray-300 dark:border-gray-600" }, [
                            (openBlock(), createBlock("svg", {
                              class: "w-3 h-3 text-white hidden peer-checked:block",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M5 13l4 4L19 7"
                              })
                            ]))
                          ])
                        ]),
                        createVNode("span", { class: "shrink-0 w-7 h-7 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400" }, toDisplayString(String.fromCharCode(65 + index)), 1),
                        withDirectives(createVNode("input", {
                          "onUpdate:modelValue": ($event) => option.text = $event,
                          type: "text",
                          placeholder: `Вариант ${String.fromCharCode(65 + index)}`,
                          class: ["grow rounded border border-stroke bg-transparent py-1.5 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary", { "border-success": option.correct }]
                        }, null, 10, ["onUpdate:modelValue", "placeholder"]), [
                          [vModelText, option.text]
                        ]),
                        questionForm.value.options.length > 2 ? (openBlock(), createBlock("button", {
                          key: 0,
                          type: "button",
                          onClick: ($event) => removeOption(index),
                          class: "shrink-0 text-gray-400 hover:text-danger p-1",
                          title: "Удалить вариант"
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
                        ], 8, ["onClick"])) : createCommentVNode("", true)
                      ]);
                    }), 128))
                  ]),
                  questionForm.value.options.length < 8 ? (openBlock(), createBlock("button", {
                    key: 0,
                    type: "button",
                    onClick: addOption,
                    class: "text-xs text-primary hover:text-primary/80 flex items-center gap-1 mt-1"
                  }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-3 h-3",
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
                    createTextVNode(" Добавить вариант ")
                  ])) : createCommentVNode("", true),
                  questionFormErrors.value.options ? (openBlock(), createBlock("p", {
                    key: 1,
                    class: "mt-1 text-xs text-danger"
                  }, toDisplayString(questionFormErrors.value.options), 1)) : createCommentVNode("", true)
                ])) : createCommentVNode("", true),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1" }, " Объяснение "),
                  withDirectives(createVNode("textarea", {
                    "onUpdate:modelValue": ($event) => questionForm.value.explanation = $event,
                    rows: "1",
                    placeholder: "Комментарий к ответу...",
                    class: "w-full rounded-lg border border-stroke bg-transparent py-2 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, questionForm.value.explanation]
                  ])
                ])
              ], 40, ["onSubmit"])
            ];
          }
        }),
        _: 1
      }, _parent));
      if (showImportModal.value) {
        _push(ssrRenderComponent(_component_TestBankImportQuestionsModal, {
          "bank-id": unref(route).params.id,
          onClose: ($event) => showImportModal.value = false,
          onImported: onQuestionsImported
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": deleteQuestionModalOpen.value,
        title: "Удалить вопрос?",
        message: "Вы уверены, что хотите удалить этот вопрос? Это действие нельзя отменить.",
        "confirm-text": "Удалить",
        "cancel-text": "Отмена",
        variant: "danger",
        loading: deletingQuestion.value,
        onConfirm: deleteQuestion,
        onCancel: ($event) => deleteQuestionModalOpen.value = false
      }, null, _parent));
      if (notification.value.show) {
        _push(ssrRenderComponent(_component_UiNotification, {
          type: notification.value.type,
          title: notification.value.title,
          message: notification.value.message,
          onClose: ($event) => notification.value.show = false
        }, null, _parent));
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/test-bank/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-B-0xnZQN.mjs.map
