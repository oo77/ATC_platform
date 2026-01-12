import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BHRIAP0y.mjs';
import { _ as __nuxt_component_0$1 } from './Modal-DQYphXo7.mjs';
import { ref, computed, mergeProps, unref, withCtx, createTextVNode, toDisplayString, createBlock, openBlock, createVNode, watch, createCommentVNode, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderClass, ssrRenderList, ssrRenderAttr } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { _ as __nuxt_component_4 } from './Notification-Bd1V2gNg.mjs';
import { c as useRoute, n as navigateTo } from './server.mjs';
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

const _sfc_main$1 = {
  __name: "AttendanceTestResultsModal",
  __ssrInlineRender: true,
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    sessionId: {
      type: String,
      default: null
    }
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const { authFetch } = useAuthFetch();
    const loading = ref(false);
    const error = ref(null);
    const data = ref(null);
    const formatDate = (dateStr) => {
      if (!dateStr) return "Н/Д";
      const date = new Date(dateStr);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const formatDuration = (seconds) => {
      if (!seconds) return "0 сек";
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (mins === 0) return `${secs} сек`;
      if (secs === 0) return `${mins} мин`;
      return `${mins} мин ${secs} сек`;
    };
    const getQuestionTypeName = (type) => {
      const names = {
        single: "Один ответ",
        multiple: "Несколько ответов",
        text: "Текстовый",
        order: "Порядок",
        match: "Соответствие"
      };
      return names[type] || type;
    };
    const getAnswerBorderClass = (answer) => {
      if (answer.isCorrect === true) return "border-success/30";
      if (answer.isCorrect === false) return "border-danger/30";
      return "border-stroke dark:border-strokedark";
    };
    const getAnswerBgClass = (answer) => {
      if (answer.isCorrect === true) return "bg-success/5";
      if (answer.isCorrect === false) return "bg-danger/5";
      return "bg-gray-50 dark:bg-meta-4";
    };
    const getAnswerBadgeClass = (answer) => {
      if (answer.isCorrect === true) return "bg-success text-white";
      if (answer.isCorrect === false) return "bg-danger text-white";
      return "bg-gray-200 dark:bg-strokedark text-gray-600 dark:text-gray-400";
    };
    const getOptions = (questionOptions) => {
      if (!questionOptions) return [];
      return questionOptions.options || [];
    };
    const isOptionSelected = (studentAnswer, optionId) => {
      if (!studentAnswer) return false;
      if (studentAnswer.selectedOption) {
        return studentAnswer.selectedOption === optionId;
      }
      if (studentAnswer.selectedOptions) {
        return studentAnswer.selectedOptions.includes(optionId);
      }
      return false;
    };
    const getOptionClass = (answer, option) => {
      const isSelected = isOptionSelected(answer.studentAnswer, option.id);
      if (option.correct && isSelected) {
        return "bg-success/10 border border-success/30";
      }
      if (option.correct && !isSelected) {
        return "bg-success/5 border border-success/20";
      }
      if (!option.correct && isSelected) {
        return "bg-danger/10 border border-danger/30";
      }
      return "bg-gray-50 dark:bg-meta-4";
    };
    const getOptionIconClass = (answer, option) => {
      const isSelected = isOptionSelected(answer.studentAnswer, option.id);
      if (option.correct && isSelected) {
        return "border-success bg-success text-white";
      }
      if (option.correct && !isSelected) {
        return "border-success text-success";
      }
      if (!option.correct && isSelected) {
        return "border-danger bg-danger text-white";
      }
      return "border-gray-300 dark:border-strokedark";
    };
    const getTextAnswer = (studentAnswer) => {
      if (!studentAnswer) return null;
      return studentAnswer.text || null;
    };
    const getCorrectTextAnswers = (questionOptions) => {
      if (!questionOptions || !questionOptions.correctAnswers) return "Н/Д";
      return questionOptions.correctAnswers.join(" | ");
    };
    const getOrderAnswer = (studentAnswer) => {
      if (!studentAnswer || !studentAnswer.orderedOptions) return [];
      return studentAnswer.orderedOptions;
    };
    const getOrderOptionText = (questionOptions, optionId) => {
      if (!questionOptions || !questionOptions.options) return optionId;
      const option = questionOptions.options.find((o) => o.id === optionId);
      return option ? option.text : optionId;
    };
    const getCorrectOrder = (questionOptions) => {
      if (!questionOptions || !questionOptions.options) return [];
      return [...questionOptions.options].sort((a, b) => a.correctOrder - b.correctOrder);
    };
    const getMatchPairs = (questionOptions) => {
      if (!questionOptions || !questionOptions.pairs) return [];
      return questionOptions.pairs;
    };
    const isMatchCorrect = (studentAnswer, pair) => {
      if (!studentAnswer || !studentAnswer.matches) return false;
      const match = studentAnswer.matches.find((m) => m.left === pair.left);
      return match && match.right === pair.right;
    };
    const getMatchedRight = (studentAnswer, leftText) => {
      if (!studentAnswer || !studentAnswer.matches) return null;
      const match = studentAnswer.matches.find((m) => m.left === leftText);
      return match ? match.right : null;
    };
    const loadDetails = async () => {
      if (!props.sessionId) return;
      loading.value = true;
      error.value = null;
      try {
        const response = await authFetch(`/api/tests/sessions/${props.sessionId}/details`);
        if (response.success) {
          data.value = response;
        } else {
          error.value = response.message || "Не удалось загрузить данные";
        }
      } catch (err) {
        console.error("Error loading session details:", err);
        error.value = "Ошибка при загрузке данных";
      } finally {
        loading.value = false;
      }
    };
    watch(() => props.isOpen, (newVal) => {
      if (newVal && props.sessionId) {
        loadDetails();
      } else {
        data.value = null;
        error.value = null;
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0$1;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Результаты тестирования",
        size: "xl",
        onClose: ($event) => _ctx.$emit("close")
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex justify-end"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              onClick: ($event) => _ctx.$emit("close")
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`Закрыть`);
                } else {
                  return [
                    createTextVNode("Закрыть")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex justify-end" }, [
                createVNode(_component_UiButton, {
                  onClick: ($event) => _ctx.$emit("close")
                }, {
                  default: withCtx(() => [
                    createTextVNode("Закрыть")
                  ]),
                  _: 1
                }, 8, ["onClick"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(loading)) {
              _push2(`<div class="flex items-center justify-center py-12"${_scopeId}><div class="text-center"${_scopeId}><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"${_scopeId}></div><p class="text-sm text-gray-500"${_scopeId}>Загрузка результатов...</p></div></div>`);
            } else if (unref(error)) {
              _push2(`<div class="text-center py-12"${_scopeId}><div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 mb-4"${_scopeId}><svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg></div><h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2"${_scopeId}>Ошибка загрузки</h3><p class="text-sm text-gray-500"${_scopeId}>${ssrInterpolate(unref(error))}</p></div>`);
            } else if (unref(data)) {
              _push2(`<div class="space-y-6"${_scopeId}><div class="bg-gray-50 dark:bg-meta-4 rounded-lg p-4"${_scopeId}><div class="grid grid-cols-2 md:grid-cols-4 gap-4"${_scopeId}><div${_scopeId}><p class="text-xs text-gray-500 dark:text-gray-400 mb-1"${_scopeId}>Студент</p><p class="text-sm font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(unref(data).session.studentName || "Н/Д")}</p>`);
              if (unref(data).session.studentPinfl) {
                _push2(`<p class="text-xs text-gray-400"${_scopeId}>${ssrInterpolate(unref(data).session.studentPinfl)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div${_scopeId}><p class="text-xs text-gray-500 dark:text-gray-400 mb-1"${_scopeId}>Тест</p><p class="text-sm font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(unref(data).template.name)}</p>`);
              if (unref(data).context.groupName) {
                _push2(`<p class="text-xs text-gray-400"${_scopeId}>${ssrInterpolate(unref(data).context.groupName)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div${_scopeId}><p class="text-xs text-gray-500 dark:text-gray-400 mb-1"${_scopeId}>Дата прохождения</p><p class="text-sm font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(formatDate(unref(data).session.completedAt || unref(data).session.startedAt))}</p><p class="text-xs text-gray-400"${_scopeId}>Попытка #${ssrInterpolate(unref(data).session.attemptNumber)}</p></div><div${_scopeId}><p class="text-xs text-gray-500 dark:text-gray-400 mb-1"${_scopeId}>Затрачено времени</p><p class="text-sm font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(formatDuration(unref(data).session.timeSpentSeconds))}</p>`);
              if (unref(data).template.timeLimitMinutes) {
                _push2(`<p class="text-xs text-gray-400"${_scopeId}> из ${ssrInterpolate(unref(data).template.timeLimitMinutes)} мин. </p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div></div><div class="${ssrRenderClass([unref(data).session.passed ? "bg-success/10 border border-success/30" : "bg-danger/10 border border-danger/30", "rounded-lg p-6 text-center"])}"${_scopeId}><div class="${ssrRenderClass([unref(data).session.passed ? "text-success" : "text-danger", "text-4xl font-bold mb-2"])}"${_scopeId}>${ssrInterpolate(Math.round(unref(data).session.scorePercent || 0))}% </div><p class="${ssrRenderClass([unref(data).session.passed ? "text-success" : "text-danger", "text-lg font-medium"])}"${_scopeId}>${ssrInterpolate(unref(data).session.passed ? "Тест сдан" : "Тест не сдан")}</p><p class="text-sm text-gray-600 dark:text-gray-400 mt-2"${_scopeId}>${ssrInterpolate(unref(data).stats.earnedPoints)} из ${ssrInterpolate(unref(data).stats.totalPoints)} баллов (проходной: ${ssrInterpolate(unref(data).template.passingScore)}%) </p><div class="flex justify-center gap-6 mt-4 text-sm"${_scopeId}><span class="inline-flex items-center gap-1 text-success"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"${_scopeId}></path></svg> ${ssrInterpolate(unref(data).stats.correctAnswers)} правильно </span><span class="inline-flex items-center gap-1 text-danger"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"${_scopeId}></path></svg> ${ssrInterpolate(unref(data).stats.incorrectAnswers)} неправильно </span>`);
              if (unref(data).stats.unanswered > 0) {
                _push2(`<span class="inline-flex items-center gap-1 text-gray-500"${_scopeId}><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg> ${ssrInterpolate(unref(data).stats.unanswered)} без ответа </span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div><div${_scopeId}><h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4"${_scopeId}>Ответы на вопросы</h3><div class="space-y-4"${_scopeId}><!--[-->`);
              ssrRenderList(unref(data).answers, (answer, index) => {
                _push2(`<div class="${ssrRenderClass([getAnswerBorderClass(answer), "border rounded-lg overflow-hidden"])}"${_scopeId}><div class="${ssrRenderClass([getAnswerBgClass(answer), "p-4 flex items-start gap-3"])}"${_scopeId}><div class="${ssrRenderClass([getAnswerBadgeClass(answer), "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"])}"${_scopeId}>${ssrInterpolate(index + 1)}</div><div class="flex-1 min-w-0"${_scopeId}><div class="flex items-center gap-2 mb-2"${_scopeId}><span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-400"${_scopeId}>${ssrInterpolate(getQuestionTypeName(answer.questionType))}</span><span class="text-xs text-gray-500"${_scopeId}>${ssrInterpolate(answer.pointsEarned)}/${ssrInterpolate(answer.questionPoints)} баллов </span>`);
                if (answer.timeSpentSeconds) {
                  _push2(`<span class="text-xs text-gray-400"${_scopeId}>${ssrInterpolate(formatDuration(answer.timeSpentSeconds))}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><p class="text-sm text-gray-900 dark:text-white whitespace-pre-line"${_scopeId}>${ssrInterpolate(answer.questionText)}</p></div><div class="flex-shrink-0"${_scopeId}>`);
                if (answer.isCorrect === true) {
                  _push2(`<svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg>`);
                } else if (answer.isCorrect === false) {
                  _push2(`<svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg>`);
                } else {
                  _push2(`<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg>`);
                }
                _push2(`</div></div><div class="p-4 bg-white dark:bg-boxdark border-t border-stroke dark:border-strokedark"${_scopeId}>`);
                if (answer.questionType === "single" || answer.questionType === "multiple") {
                  _push2(`<div${_scopeId}><div class="space-y-2"${_scopeId}><!--[-->`);
                  ssrRenderList(getOptions(answer.questionOptions), (option) => {
                    _push2(`<div class="${ssrRenderClass([getOptionClass(answer, option), "flex items-center gap-2 p-2 rounded"])}"${_scopeId}><span class="${ssrRenderClass([getOptionIconClass(answer, option), "w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs"])}"${_scopeId}>`);
                    if (isOptionSelected(answer.studentAnswer, option.id)) {
                      _push2(`<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"${_scopeId}><circle cx="10" cy="10" r="4"${_scopeId}></circle></svg>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</span><span class="${ssrRenderClass([option.correct ? "text-success font-medium" : "", "text-sm"])}"${_scopeId}>${ssrInterpolate(option.text)}</span>`);
                    if (option.correct) {
                      _push2(`<span class="ml-auto text-xs text-success"${_scopeId}>✓ Правильный</span>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div>`);
                  });
                  _push2(`<!--]--></div></div>`);
                } else if (answer.questionType === "text") {
                  _push2(`<div${_scopeId}><div class="space-y-3"${_scopeId}><div${_scopeId}><p class="text-xs text-gray-500 mb-1"${_scopeId}>Ответ студента:</p><p class="${ssrRenderClass([answer.isCorrect ? "text-success" : "text-danger", "text-sm p-2 bg-gray-50 dark:bg-meta-4 rounded"])}"${_scopeId}>${ssrInterpolate(getTextAnswer(answer.studentAnswer) || "(нет ответа)")}</p></div><div${_scopeId}><p class="text-xs text-gray-500 mb-1"${_scopeId}>Правильные ответы:</p><p class="text-sm text-success"${_scopeId}>${ssrInterpolate(getCorrectTextAnswers(answer.questionOptions))}</p></div></div></div>`);
                } else if (answer.questionType === "order") {
                  _push2(`<div${_scopeId}><div class="grid grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><p class="text-xs text-gray-500 mb-2"${_scopeId}>Ответ студента:</p><div class="space-y-1"${_scopeId}><!--[-->`);
                  ssrRenderList(getOrderAnswer(answer.studentAnswer), (itemId, idx) => {
                    _push2(`<div class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-meta-4 rounded text-sm"${_scopeId}><span class="w-5 h-5 rounded bg-gray-200 dark:bg-strokedark text-xs flex items-center justify-center"${_scopeId}>${ssrInterpolate(idx + 1)}</span> ${ssrInterpolate(getOrderOptionText(answer.questionOptions, itemId))}</div>`);
                  });
                  _push2(`<!--]--></div></div><div${_scopeId}><p class="text-xs text-gray-500 mb-2"${_scopeId}>Правильный порядок:</p><div class="space-y-1"${_scopeId}><!--[-->`);
                  ssrRenderList(getCorrectOrder(answer.questionOptions), (option) => {
                    _push2(`<div class="flex items-center gap-2 p-2 bg-success/10 rounded text-sm text-success"${_scopeId}><span class="w-5 h-5 rounded bg-success/20 text-xs flex items-center justify-center"${_scopeId}>${ssrInterpolate(option.correctOrder)}</span> ${ssrInterpolate(option.text)}</div>`);
                  });
                  _push2(`<!--]--></div></div></div></div>`);
                } else if (answer.questionType === "match") {
                  _push2(`<div${_scopeId}><div class="space-y-2"${_scopeId}><!--[-->`);
                  ssrRenderList(getMatchPairs(answer.questionOptions), (pair) => {
                    _push2(`<div class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-meta-4 rounded text-sm"${_scopeId}><span class="font-medium"${_scopeId}>${ssrInterpolate(pair.left)}</span><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"${_scopeId}></path></svg><span class="${ssrRenderClass(isMatchCorrect(answer.studentAnswer, pair) ? "text-success" : "text-danger")}"${_scopeId}>${ssrInterpolate(getMatchedRight(answer.studentAnswer, pair.left) || "(не выбрано)")}</span>`);
                    if (!isMatchCorrect(answer.studentAnswer, pair)) {
                      _push2(`<span class="text-xs text-success ml-auto"${_scopeId}> Правильно: ${ssrInterpolate(pair.right)}</span>`);
                    } else {
                      _push2(`<!---->`);
                    }
                    _push2(`</div>`);
                  });
                  _push2(`<!--]--></div></div>`);
                } else {
                  _push2(`<!---->`);
                }
                if (answer.questionExplanation) {
                  _push2(`<div class="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20"${_scopeId}><p class="text-xs text-primary font-medium mb-1"${_scopeId}>Пояснение:</p><p class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}>${ssrInterpolate(answer.questionExplanation)}</p></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div>`);
              });
              _push2(`<!--]--></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              unref(loading) ? (openBlock(), createBlock("div", {
                key: 0,
                class: "flex items-center justify-center py-12"
              }, [
                createVNode("div", { class: "text-center" }, [
                  createVNode("div", { class: "inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4" }),
                  createVNode("p", { class: "text-sm text-gray-500" }, "Загрузка результатов...")
                ])
              ])) : unref(error) ? (openBlock(), createBlock("div", {
                key: 1,
                class: "text-center py-12"
              }, [
                createVNode("div", { class: "inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 mb-4" }, [
                  (openBlock(), createBlock("svg", {
                    class: "w-8 h-8 text-danger",
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
                  ]))
                ]),
                createVNode("h3", { class: "text-lg font-medium text-gray-900 dark:text-white mb-2" }, "Ошибка загрузки"),
                createVNode("p", { class: "text-sm text-gray-500" }, toDisplayString(unref(error)), 1)
              ])) : unref(data) ? (openBlock(), createBlock("div", {
                key: 2,
                class: "space-y-6"
              }, [
                createVNode("div", { class: "bg-gray-50 dark:bg-meta-4 rounded-lg p-4" }, [
                  createVNode("div", { class: "grid grid-cols-2 md:grid-cols-4 gap-4" }, [
                    createVNode("div", null, [
                      createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400 mb-1" }, "Студент"),
                      createVNode("p", { class: "text-sm font-medium text-gray-900 dark:text-white" }, toDisplayString(unref(data).session.studentName || "Н/Д"), 1),
                      unref(data).session.studentPinfl ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "text-xs text-gray-400"
                      }, toDisplayString(unref(data).session.studentPinfl), 1)) : createCommentVNode("", true)
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400 mb-1" }, "Тест"),
                      createVNode("p", { class: "text-sm font-medium text-gray-900 dark:text-white" }, toDisplayString(unref(data).template.name), 1),
                      unref(data).context.groupName ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "text-xs text-gray-400"
                      }, toDisplayString(unref(data).context.groupName), 1)) : createCommentVNode("", true)
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400 mb-1" }, "Дата прохождения"),
                      createVNode("p", { class: "text-sm font-medium text-gray-900 dark:text-white" }, toDisplayString(formatDate(unref(data).session.completedAt || unref(data).session.startedAt)), 1),
                      createVNode("p", { class: "text-xs text-gray-400" }, "Попытка #" + toDisplayString(unref(data).session.attemptNumber), 1)
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-xs text-gray-500 dark:text-gray-400 mb-1" }, "Затрачено времени"),
                      createVNode("p", { class: "text-sm font-medium text-gray-900 dark:text-white" }, toDisplayString(formatDuration(unref(data).session.timeSpentSeconds)), 1),
                      unref(data).template.timeLimitMinutes ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "text-xs text-gray-400"
                      }, " из " + toDisplayString(unref(data).template.timeLimitMinutes) + " мин. ", 1)) : createCommentVNode("", true)
                    ])
                  ])
                ]),
                createVNode("div", {
                  class: ["rounded-lg p-6 text-center", unref(data).session.passed ? "bg-success/10 border border-success/30" : "bg-danger/10 border border-danger/30"]
                }, [
                  createVNode("div", {
                    class: ["text-4xl font-bold mb-2", unref(data).session.passed ? "text-success" : "text-danger"]
                  }, toDisplayString(Math.round(unref(data).session.scorePercent || 0)) + "% ", 3),
                  createVNode("p", {
                    class: ["text-lg font-medium", unref(data).session.passed ? "text-success" : "text-danger"]
                  }, toDisplayString(unref(data).session.passed ? "Тест сдан" : "Тест не сдан"), 3),
                  createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400 mt-2" }, toDisplayString(unref(data).stats.earnedPoints) + " из " + toDisplayString(unref(data).stats.totalPoints) + " баллов (проходной: " + toDisplayString(unref(data).template.passingScore) + "%) ", 1),
                  createVNode("div", { class: "flex justify-center gap-6 mt-4 text-sm" }, [
                    createVNode("span", { class: "inline-flex items-center gap-1 text-success" }, [
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
                          d: "M5 13l4 4L19 7"
                        })
                      ])),
                      createTextVNode(" " + toDisplayString(unref(data).stats.correctAnswers) + " правильно ", 1)
                    ]),
                    createVNode("span", { class: "inline-flex items-center gap-1 text-danger" }, [
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
                      ])),
                      createTextVNode(" " + toDisplayString(unref(data).stats.incorrectAnswers) + " неправильно ", 1)
                    ]),
                    unref(data).stats.unanswered > 0 ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "inline-flex items-center gap-1 text-gray-500"
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
                          d: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        })
                      ])),
                      createTextVNode(" " + toDisplayString(unref(data).stats.unanswered) + " без ответа ", 1)
                    ])) : createCommentVNode("", true)
                  ])
                ], 2),
                createVNode("div", null, [
                  createVNode("h3", { class: "text-lg font-medium text-gray-900 dark:text-white mb-4" }, "Ответы на вопросы"),
                  createVNode("div", { class: "space-y-4" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(unref(data).answers, (answer, index) => {
                      return openBlock(), createBlock("div", {
                        key: answer.questionId,
                        class: ["border rounded-lg overflow-hidden", getAnswerBorderClass(answer)]
                      }, [
                        createVNode("div", {
                          class: ["p-4 flex items-start gap-3", getAnswerBgClass(answer)]
                        }, [
                          createVNode("div", {
                            class: ["flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium", getAnswerBadgeClass(answer)]
                          }, toDisplayString(index + 1), 3),
                          createVNode("div", { class: "flex-1 min-w-0" }, [
                            createVNode("div", { class: "flex items-center gap-2 mb-2" }, [
                              createVNode("span", { class: "text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-400" }, toDisplayString(getQuestionTypeName(answer.questionType)), 1),
                              createVNode("span", { class: "text-xs text-gray-500" }, toDisplayString(answer.pointsEarned) + "/" + toDisplayString(answer.questionPoints) + " баллов ", 1),
                              answer.timeSpentSeconds ? (openBlock(), createBlock("span", {
                                key: 0,
                                class: "text-xs text-gray-400"
                              }, toDisplayString(formatDuration(answer.timeSpentSeconds)), 1)) : createCommentVNode("", true)
                            ]),
                            createVNode("p", { class: "text-sm text-gray-900 dark:text-white whitespace-pre-line" }, toDisplayString(answer.questionText), 1)
                          ]),
                          createVNode("div", { class: "flex-shrink-0" }, [
                            answer.isCorrect === true ? (openBlock(), createBlock("svg", {
                              key: 0,
                              class: "w-6 h-6 text-success",
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
                            ])) : answer.isCorrect === false ? (openBlock(), createBlock("svg", {
                              key: 1,
                              class: "w-6 h-6 text-danger",
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
                            ])) : (openBlock(), createBlock("svg", {
                              key: 2,
                              class: "w-6 h-6 text-gray-400",
                              fill: "none",
                              stroke: "currentColor",
                              viewBox: "0 0 24 24"
                            }, [
                              createVNode("path", {
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round",
                                "stroke-width": "2",
                                d: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              })
                            ]))
                          ])
                        ], 2),
                        createVNode("div", { class: "p-4 bg-white dark:bg-boxdark border-t border-stroke dark:border-strokedark" }, [
                          answer.questionType === "single" || answer.questionType === "multiple" ? (openBlock(), createBlock("div", { key: 0 }, [
                            createVNode("div", { class: "space-y-2" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(getOptions(answer.questionOptions), (option) => {
                                return openBlock(), createBlock("div", {
                                  key: option.id,
                                  class: ["flex items-center gap-2 p-2 rounded", getOptionClass(answer, option)]
                                }, [
                                  createVNode("span", {
                                    class: ["w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs", getOptionIconClass(answer, option)]
                                  }, [
                                    isOptionSelected(answer.studentAnswer, option.id) ? (openBlock(), createBlock("svg", {
                                      key: 0,
                                      class: "w-3 h-3",
                                      fill: "currentColor",
                                      viewBox: "0 0 20 20"
                                    }, [
                                      createVNode("circle", {
                                        cx: "10",
                                        cy: "10",
                                        r: "4"
                                      })
                                    ])) : createCommentVNode("", true)
                                  ], 2),
                                  createVNode("span", {
                                    class: ["text-sm", option.correct ? "text-success font-medium" : ""]
                                  }, toDisplayString(option.text), 3),
                                  option.correct ? (openBlock(), createBlock("span", {
                                    key: 0,
                                    class: "ml-auto text-xs text-success"
                                  }, "✓ Правильный")) : createCommentVNode("", true)
                                ], 2);
                              }), 128))
                            ])
                          ])) : answer.questionType === "text" ? (openBlock(), createBlock("div", { key: 1 }, [
                            createVNode("div", { class: "space-y-3" }, [
                              createVNode("div", null, [
                                createVNode("p", { class: "text-xs text-gray-500 mb-1" }, "Ответ студента:"),
                                createVNode("p", {
                                  class: ["text-sm p-2 bg-gray-50 dark:bg-meta-4 rounded", answer.isCorrect ? "text-success" : "text-danger"]
                                }, toDisplayString(getTextAnswer(answer.studentAnswer) || "(нет ответа)"), 3)
                              ]),
                              createVNode("div", null, [
                                createVNode("p", { class: "text-xs text-gray-500 mb-1" }, "Правильные ответы:"),
                                createVNode("p", { class: "text-sm text-success" }, toDisplayString(getCorrectTextAnswers(answer.questionOptions)), 1)
                              ])
                            ])
                          ])) : answer.questionType === "order" ? (openBlock(), createBlock("div", { key: 2 }, [
                            createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                              createVNode("div", null, [
                                createVNode("p", { class: "text-xs text-gray-500 mb-2" }, "Ответ студента:"),
                                createVNode("div", { class: "space-y-1" }, [
                                  (openBlock(true), createBlock(Fragment, null, renderList(getOrderAnswer(answer.studentAnswer), (itemId, idx) => {
                                    return openBlock(), createBlock("div", {
                                      key: idx,
                                      class: "flex items-center gap-2 p-2 bg-gray-50 dark:bg-meta-4 rounded text-sm"
                                    }, [
                                      createVNode("span", { class: "w-5 h-5 rounded bg-gray-200 dark:bg-strokedark text-xs flex items-center justify-center" }, toDisplayString(idx + 1), 1),
                                      createTextVNode(" " + toDisplayString(getOrderOptionText(answer.questionOptions, itemId)), 1)
                                    ]);
                                  }), 128))
                                ])
                              ]),
                              createVNode("div", null, [
                                createVNode("p", { class: "text-xs text-gray-500 mb-2" }, "Правильный порядок:"),
                                createVNode("div", { class: "space-y-1" }, [
                                  (openBlock(true), createBlock(Fragment, null, renderList(getCorrectOrder(answer.questionOptions), (option) => {
                                    return openBlock(), createBlock("div", {
                                      key: option.id,
                                      class: "flex items-center gap-2 p-2 bg-success/10 rounded text-sm text-success"
                                    }, [
                                      createVNode("span", { class: "w-5 h-5 rounded bg-success/20 text-xs flex items-center justify-center" }, toDisplayString(option.correctOrder), 1),
                                      createTextVNode(" " + toDisplayString(option.text), 1)
                                    ]);
                                  }), 128))
                                ])
                              ])
                            ])
                          ])) : answer.questionType === "match" ? (openBlock(), createBlock("div", { key: 3 }, [
                            createVNode("div", { class: "space-y-2" }, [
                              (openBlock(true), createBlock(Fragment, null, renderList(getMatchPairs(answer.questionOptions), (pair) => {
                                return openBlock(), createBlock("div", {
                                  key: pair.id,
                                  class: "flex items-center gap-2 p-2 bg-gray-50 dark:bg-meta-4 rounded text-sm"
                                }, [
                                  createVNode("span", { class: "font-medium" }, toDisplayString(pair.left), 1),
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
                                      d: "M17 8l4 4m0 0l-4 4m4-4H3"
                                    })
                                  ])),
                                  createVNode("span", {
                                    class: isMatchCorrect(answer.studentAnswer, pair) ? "text-success" : "text-danger"
                                  }, toDisplayString(getMatchedRight(answer.studentAnswer, pair.left) || "(не выбрано)"), 3),
                                  !isMatchCorrect(answer.studentAnswer, pair) ? (openBlock(), createBlock("span", {
                                    key: 0,
                                    class: "text-xs text-success ml-auto"
                                  }, " Правильно: " + toDisplayString(pair.right), 1)) : createCommentVNode("", true)
                                ]);
                              }), 128))
                            ])
                          ])) : createCommentVNode("", true),
                          answer.questionExplanation ? (openBlock(), createBlock("div", {
                            key: 4,
                            class: "mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20"
                          }, [
                            createVNode("p", { class: "text-xs text-primary font-medium mb-1" }, "Пояснение:"),
                            createVNode("p", { class: "text-sm text-gray-700 dark:text-gray-300" }, toDisplayString(answer.questionExplanation), 1)
                          ])) : createCommentVNode("", true)
                        ])
                      ], 2);
                    }), 128))
                  ])
                ])
              ])) : createCommentVNode("", true)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/attendance/TestResultsModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const { authFetch } = useAuthFetch();
    const loading = ref(true);
    const questionsLoading = ref(false);
    const error = ref(null);
    const template = ref(null);
    const questions = ref([]);
    const questionsModeLabels = {
      all: "Все вопросы",
      random: "Случайные",
      manual: "Вручную"
    };
    const showResultsLabels = {
      immediately: "Сразу",
      after_deadline: "После дедлайна",
      manual: "Вручную",
      never: "Никогда"
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
      ru: "Русский",
      uz: "O'zbek",
      en: "English"
    };
    const languageFlags = {
      ru: "🇷🇺",
      uz: "🇺🇿",
      en: "🇬🇧"
    };
    const languageBadgeClasses = {
      ru: "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30",
      uz: "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-green-100 dark:bg-green-900/30",
      en: "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30"
    };
    const languageCardClasses = {
      ru: "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
      uz: "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300",
      en: "bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300"
    };
    const languageStats = computed(() => {
      if (!questions.value.length) return [];
      const stats = {};
      questions.value.forEach((q) => {
        const lang = q.language || "ru";
        stats[lang] = (stats[lang] || 0) + 1;
      });
      return Object.entries(stats).map(([language, count]) => ({
        language,
        count
      })).sort((a, b) => b.count - a.count);
    });
    const usage = ref({
      disciplines: 0,
      assignments: 0,
      sessions: 0
    });
    const totalPoints = computed(() => {
      if (template.value?.questions_mode === "all") {
        return questions.value.reduce((sum, q) => sum + q.points, 0);
      }
      const avgPoints = questions.value.length > 0 ? questions.value.reduce((sum, q) => sum + q.points, 0) / questions.value.length : 1;
      return Math.round(avgPoints * (template.value?.questions_count || 0));
    });
    const notification = ref({
      show: false,
      type: "success",
      title: "",
      message: ""
    });
    const formatDate = (date) => {
      if (!date) return "—";
      return new Date(date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const previewTest = async () => {
      try {
        const response = await authFetch(`/api/test-bank/templates/${route.params.id}/preview`, {
          method: "POST"
        });
        if (response.success && response.session_id) {
          if (response.template) {
            localStorage.setItem(`preview_template_${response.session_id}`, JSON.stringify(response.template));
          }
          navigateTo(`/tests/take/${response.session_id}?preview=true`);
        } else {
          notification.value = {
            show: true,
            type: "error",
            title: "Ошибка",
            message: response.message || "Не удалось создать preview-сессию"
          };
          setTimeout(() => {
            notification.value.show = false;
          }, 3e3);
        }
      } catch (error2) {
        console.error("Ошибка создания preview-сессии:", error2);
        notification.value = {
          show: true,
          type: "error",
          title: "Ошибка",
          message: "Произошла ошибка при создании preview-сессии"
        };
        setTimeout(() => {
          notification.value.show = false;
        }, 3e3);
      }
    };
    const analyticsLoading = ref(false);
    const analytics = ref(null);
    const showSessionDetails = ref(false);
    const selectedSessionId = ref(null);
    const loadAnalytics = async () => {
      analyticsLoading.value = true;
      try {
        const response = await authFetch(`/api/test-bank/templates/${route.params.id}/analytics`);
        if (response.success) {
          analytics.value = response;
        } else {
          console.error("Ошибка загрузки аналитики:", response.message);
        }
      } catch (err) {
        console.error("Ошибка загрузки аналитики:", err);
      } finally {
        analyticsLoading.value = false;
      }
    };
    const formatDuration = (seconds) => {
      if (!seconds) return "0с";
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (mins === 0) return `${secs}с`;
      if (secs === 0) return `${mins}м`;
      return `${mins}м ${secs}с`;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AttendanceTestResultsModal = _sfc_main$1;
      const _component_UiNotification = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}>`);
      if (loading.value) {
        _push(`<div class="flex items-center justify-center h-64"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div></div>`);
      } else if (error.value) {
        _push(`<div class="text-center py-12"><svg class="mx-auto h-12 w-12 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><p class="mt-4 text-lg font-medium text-danger">${ssrInterpolate(error.value)}</p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          class: "mt-4",
          onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/test-bank/templates")
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
      } else if (template.value) {
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
        _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/test-bank/templates",
          class: "hover:text-primary transition-colors"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Шаблоны тестов `);
            } else {
              return [
                createTextVNode(" Шаблоны тестов ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg><span class="text-black dark:text-white">${ssrInterpolate(template.value.name)}</span></nav><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div class="flex items-center gap-4"><div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10"><svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div><div class="flex items-center gap-3"><h2 class="text-title-md2 font-bold text-black dark:text-white">${ssrInterpolate(template.value.name)}</h2><span class="${ssrRenderClass([
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          template.value.is_active ? "bg-success/10 text-success" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
        ])}">${ssrInterpolate(template.value.is_active ? "Активен" : "Неактивен")}</span></div><div class="flex items-center gap-3 mt-1"><span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">${ssrInterpolate(template.value.code)}</span><span class="text-sm text-gray-600 dark:text-gray-400"> Банк: `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/test-bank/${template.value.bank_id}`,
          class: "text-primary hover:underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(template.value.bank_name)}`);
            } else {
              return [
                createTextVNode(toDisplayString(template.value.bank_name), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</span><div class="flex items-center gap-1 ml-2">`);
        if (template.value.allowed_languages && template.value.allowed_languages.length > 0) {
          _push(`<!--[-->`);
          ssrRenderList(template.value.allowed_languages, (lang) => {
            _push(`<span class="${ssrRenderClass(languageBadgeClasses[lang])}"${ssrRenderAttr("title", languageLabels[lang])}>${ssrInterpolate(languageFlags[lang])}</span>`);
          });
          _push(`<!--]-->`);
        } else {
          _push(`<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"> 🌐 Все языки </span>`);
        }
        _push(`</div></div></div></div><div class="flex gap-3">`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "outline",
          onClick: previewTest,
          class: "flex items-center gap-2"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"${_scopeId}></path></svg> Предпросмотр `);
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
                    d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  }),
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  })
                ])),
                createTextVNode(" Предпросмотр ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-2 space-y-6"><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><h3 class="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Основные настройки </h3><div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4"><div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span class="text-gray-600 dark:text-gray-400">Режим вопросов</span><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(questionsModeLabels[template.value.questions_mode])}</span></div><div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span class="text-gray-600 dark:text-gray-400">Количество вопросов</span><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(template.value.questions_mode === "all" ? template.value.questions_total : template.value.questions_count)}</span></div><div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span class="text-gray-600 dark:text-gray-400">Лимит времени</span><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(template.value.time_limit_minutes ? `${template.value.time_limit_minutes} минут` : "Без лимита")}</span></div><div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span class="text-gray-600 dark:text-gray-400">Проходной балл</span><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(template.value.passing_score)}%</span></div><div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span class="text-gray-600 dark:text-gray-400">Максимум попыток</span><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(template.value.max_attempts)}</span></div><div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span class="text-gray-600 dark:text-gray-400">Вопросов на странице</span><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(template.value.questions_per_page === 0 ? "Все сразу" : template.value.questions_per_page)}</span></div><div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span class="text-gray-600 dark:text-gray-400">Показ результатов</span><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(showResultsLabels[template.value.show_results])}</span></div><div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span class="text-gray-600 dark:text-gray-400">Возврат к вопросам</span><span class="${ssrRenderClass(["font-medium", template.value.allow_back ? "text-success" : "text-danger"])}">${ssrInterpolate(template.value.allow_back ? "Разрешён" : "Запрещён")}</span></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><h3 class="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2"><svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Перемешивание </h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="${ssrRenderClass([template.value.shuffle_questions ? "bg-success/10" : "bg-gray-100 dark:bg-gray-800", "flex items-center gap-3 p-3 rounded-lg"])}"><svg class="${ssrRenderClass(["w-5 h-5", template.value.shuffle_questions ? "text-success" : "text-gray-400"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
        if (template.value.shuffle_questions) {
          _push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>`);
        } else {
          _push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>`);
        }
        _push(`</svg><span class="text-gray-900 dark:text-white">Перемешивать вопросы</span></div><div class="${ssrRenderClass([template.value.shuffle_options ? "bg-success/10" : "bg-gray-100 dark:bg-gray-800", "flex items-center gap-3 p-3 rounded-lg"])}"><svg class="${ssrRenderClass(["w-5 h-5", template.value.shuffle_options ? "text-success" : "text-gray-400"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
        if (template.value.shuffle_options) {
          _push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>`);
        } else {
          _push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>`);
        }
        _push(`</svg><span class="text-gray-900 dark:text-white">Перемешивать варианты ответов</span></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><div class="flex items-center justify-between mb-4"><h3 class="text-lg font-semibold text-black dark:text-white flex items-center gap-2"><svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Антипрокторинг </h3><span class="${ssrRenderClass([
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          template.value.proctoring_enabled ? "bg-success/10 text-success" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
        ])}">${ssrInterpolate(template.value.proctoring_enabled ? "Включён" : "Отключён")}</span></div>`);
        if (template.value.proctoring_enabled && template.value.proctoring_settings) {
          _push(`<div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="${ssrRenderClass([template.value.proctoring_settings.blockTabSwitch ? "bg-danger/10" : "bg-gray-100 dark:bg-gray-800", "flex items-center gap-3 p-3 rounded-lg"])}"><svg class="${ssrRenderClass(["w-5 h-5", template.value.proctoring_settings.blockTabSwitch ? "text-danger" : "text-gray-400"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg><span class="text-sm text-gray-900 dark:text-white">Блокировка вкладок</span></div><div class="${ssrRenderClass([template.value.proctoring_settings.blockCopyPaste ? "bg-danger/10" : "bg-gray-100 dark:bg-gray-800", "flex items-center gap-3 p-3 rounded-lg"])}"><svg class="${ssrRenderClass(["w-5 h-5", template.value.proctoring_settings.blockCopyPaste ? "text-danger" : "text-gray-400"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg><span class="text-sm text-gray-900 dark:text-white">Блокировка копирования</span></div><div class="${ssrRenderClass([template.value.proctoring_settings.blockRightClick ? "bg-danger/10" : "bg-gray-100 dark:bg-gray-800", "flex items-center gap-3 p-3 rounded-lg"])}"><svg class="${ssrRenderClass(["w-5 h-5", template.value.proctoring_settings.blockRightClick ? "text-danger" : "text-gray-400"])}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg><span class="text-sm text-gray-900 dark:text-white">Блокировка правого клика</span></div></div>`);
        } else {
          _push(`<p class="text-gray-500 dark:text-gray-400 text-sm"> Антипрокторинг отключён. Студенты смогут свободно переключаться между вкладками во время теста. </p>`);
        }
        _push(`</div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><h3 class="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2"><svg class="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg> Языки тестирования </h3>`);
        if (template.value.allowed_languages && template.value.allowed_languages.length > 0) {
          _push(`<div><div class="flex flex-wrap gap-3 mb-4"><!--[-->`);
          ssrRenderList(template.value.allowed_languages, (lang) => {
            _push(`<div class="${ssrRenderClass([languageCardClasses[lang], "flex items-center gap-2 px-4 py-2 rounded-lg"])}"><span class="text-xl">${ssrInterpolate(languageFlags[lang])}</span><span class="font-medium">${ssrInterpolate(languageLabels[lang])}</span></div>`);
          });
          _push(`<!--]--></div>`);
          if (languageStats.value.length > 0) {
            _push(`<div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"><p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Вопросов в банке по языкам:</p><div class="space-y-2"><!--[-->`);
            ssrRenderList(languageStats.value, (stat) => {
              _push(`<div class="flex items-center justify-between"><div class="flex items-center gap-2"><span>${ssrInterpolate(languageFlags[stat.language])}</span><span class="text-sm text-gray-700 dark:text-gray-300">${ssrInterpolate(languageLabels[stat.language])}</span></div><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(stat.count)}</span></div>`);
            });
            _push(`<!--]--></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<p class="text-gray-500 dark:text-gray-400"> Доступны все языки (ограничения не установлены) </p>`);
        }
        _push(`</div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><div class="flex items-center justify-between mb-4"><h3 class="text-lg font-semibold text-black dark:text-white flex items-center gap-2"><svg class="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Вопросы для теста </h3>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/test-bank/${template.value.bank_id}`,
          class: "text-sm text-primary hover:text-primary/80 flex items-center gap-1"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Перейти к банку <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"${_scopeId}></path></svg>`);
            } else {
              return [
                createTextVNode(" Перейти к банку "),
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
                    d: "M9 5l7 7-7 7"
                  })
                ]))
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
        if (questionsLoading.value) {
          _push(`<div class="flex items-center justify-center py-8"><div class="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-primary border-r-transparent"></div></div>`);
        } else if (questions.value.length === 0) {
          _push(`<div class="text-center py-8 text-gray-500 dark:text-gray-400"><p>Банк вопросов пуст</p></div>`);
        } else {
          _push(`<div class="space-y-3 max-h-96 overflow-y-auto"><!--[-->`);
          ssrRenderList(questions.value.slice(0, 10), (question, index) => {
            _push(`<div class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"><span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">${ssrInterpolate(index + 1)}</span><div class="flex-grow min-w-0"><p class="text-sm text-gray-900 dark:text-white line-clamp-2">${ssrInterpolate(question.question_text)}</p><div class="flex items-center gap-2 mt-1"><span class="${ssrRenderClass(["inline-flex items-center rounded-full px-1.5 py-0.5 text-xs", difficultyClasses[question.difficulty]])}">${ssrInterpolate(difficultyLabels[question.difficulty])}</span><span class="text-xs text-gray-500">${ssrInterpolate(question.points)} б.</span></div></div></div>`);
          });
          _push(`<!--]-->`);
          if (questions.value.length > 10) {
            _push(`<div class="text-center py-2"><span class="text-sm text-gray-500 dark:text-gray-400"> И ещё ${ssrInterpolate(questions.value.length - 10)} вопросов... </span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        }
        _push(`</div></div><div class="space-y-6"><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><h3 class="text-lg font-semibold text-black dark:text-white mb-4">Статистика</h3><div class="space-y-4"><div class="flex items-center justify-between"><span class="text-gray-600 dark:text-gray-400">Всего вопросов в банке</span><span class="text-xl font-bold text-primary">${ssrInterpolate(template.value.questions_total)}</span></div><div class="flex items-center justify-between"><span class="text-gray-600 dark:text-gray-400">Вопросов в тесте</span><span class="text-xl font-bold text-black dark:text-white">${ssrInterpolate(template.value.questions_mode === "all" ? template.value.questions_total : template.value.questions_count)}</span></div><div class="flex items-center justify-between"><span class="text-gray-600 dark:text-gray-400">Максимум баллов</span><span class="text-xl font-bold text-black dark:text-white">${ssrInterpolate(totalPoints.value)}</span></div><div class="flex items-center justify-between"><span class="text-gray-600 dark:text-gray-400">Для сдачи нужно</span><span class="text-xl font-bold text-success">${ssrInterpolate(Math.ceil(totalPoints.value * template.value.passing_score / 100))}</span></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><h3 class="text-lg font-semibold text-black dark:text-white mb-4">Банк вопросов</h3><div class="space-y-3"><div><p class="text-sm text-gray-600 dark:text-gray-400">Название</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(template.value.bank_name)}</p></div><div><p class="text-sm text-gray-600 dark:text-gray-400">Код</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(template.value.bank_code)}</p></div>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/test-bank/${template.value.bank_id}`,
          class: "inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm mt-2"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Открыть банк <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"${_scopeId}></path></svg>`);
            } else {
              return [
                createTextVNode(" Открыть банк "),
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
                    d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  })
                ]))
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><h3 class="text-lg font-semibold text-black dark:text-white mb-4">Использование</h3><div class="space-y-3 text-sm"><div class="flex items-center justify-between"><span class="text-gray-600 dark:text-gray-400">Привязано к дисциплинам</span><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(usage.value.disciplines)}</span></div><div class="flex items-center justify-between"><span class="text-gray-600 dark:text-gray-400">Назначено тестов</span><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(usage.value.assignments)}</span></div><div class="flex items-center justify-between"><span class="text-gray-600 dark:text-gray-400">Пройдено сессий</span><span class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(usage.value.sessions)}</span></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><h3 class="text-lg font-semibold text-black dark:text-white mb-4">Информация</h3><div class="space-y-3 text-sm"><div><p class="text-gray-600 dark:text-gray-400">Создан</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(formatDate(template.value.created_at))}</p></div><div><p class="text-gray-600 dark:text-gray-400">Обновлён</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(formatDate(template.value.updated_at))}</p></div>`);
        if (template.value.created_by_name) {
          _push(`<div><p class="text-gray-600 dark:text-gray-400">Автор</p><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(template.value.created_by_name)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div></div><div class="mt-8 bg-white dark:bg-boxdark rounded-xl shadow-md p-6"><div class="flex items-center justify-between mb-6"><h3 class="text-lg font-semibold text-black dark:text-white flex items-center gap-2"><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> Аналитика прохождений </h3>`);
        if (!analyticsLoading.value && !analytics.value) {
          _push(`<button class="text-sm text-primary hover:text-primary/80 flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Загрузить аналитику </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (analyticsLoading.value) {
          _push(`<div class="flex items-center justify-center py-8"><div class="text-center"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-2"></div><p class="text-sm text-gray-500">Загрузка аналитики...</p></div></div>`);
        } else if (!analytics.value) {
          _push(`<div class="text-center py-8"><svg class="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg><p class="text-gray-500 dark:text-gray-400 mb-4">Нажмите для загрузки статистики прохождений</p>`);
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "outline",
            size: "sm",
            onClick: loadAnalytics
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Загрузить аналитику `);
              } else {
                return [
                  createTextVNode(" Загрузить аналитику ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div>`);
        } else if (analytics.value.summary) {
          _push(`<div><div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"><div class="text-center p-4 bg-gray-50 dark:bg-meta-4 rounded-lg"><p class="text-2xl font-bold text-primary">${ssrInterpolate(analytics.value.summary.totalSessions)}</p><p class="text-xs text-gray-500 dark:text-gray-400">Прохождений</p></div><div class="text-center p-4 bg-gray-50 dark:bg-meta-4 rounded-lg"><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(analytics.value.summary.uniqueStudents)}</p><p class="text-xs text-gray-500 dark:text-gray-400">Студентов</p></div><div class="text-center p-4 bg-gray-50 dark:bg-meta-4 rounded-lg"><p class="text-2xl font-bold text-warning">${ssrInterpolate(analytics.value.summary.averageScore)}%</p><p class="text-xs text-gray-500 dark:text-gray-400">Средний балл</p></div><div class="text-center p-4 bg-gray-50 dark:bg-meta-4 rounded-lg"><p class="text-2xl font-bold text-success">${ssrInterpolate(analytics.value.summary.passRate)}%</p><p class="text-xs text-gray-500 dark:text-gray-400">% сдачи</p></div><div class="text-center p-4 bg-gray-50 dark:bg-meta-4 rounded-lg"><p class="text-2xl font-bold text-gray-600 dark:text-gray-300">${ssrInterpolate(formatDuration(analytics.value.summary.averageTimeSeconds))}</p><p class="text-xs text-gray-500 dark:text-gray-400">Среднее время</p></div></div>`);
          if (analytics.value.summary.totalSessions === 0) {
            _push(`<div class="text-center py-8 text-gray-500"><p>Пока нет данных о прохождениях этого теста</p></div>`);
          } else {
            _push(`<div><h4 class="text-md font-medium text-black dark:text-white mb-4">Последние прохождения</h4><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left border-b border-stroke dark:border-strokedark"><th class="pb-3 font-medium text-gray-600 dark:text-gray-400">Студент</th><th class="pb-3 font-medium text-gray-600 dark:text-gray-400">Группа</th><th class="pb-3 font-medium text-gray-600 dark:text-gray-400 text-center">Балл</th><th class="pb-3 font-medium text-gray-600 dark:text-gray-400 text-center">Статус</th><th class="pb-3 font-medium text-gray-600 dark:text-gray-400 text-center">Время</th><th class="pb-3 font-medium text-gray-600 dark:text-gray-400">Дата</th><th class="pb-3 font-medium text-gray-600 dark:text-gray-400"></th></tr></thead><tbody><!--[-->`);
            ssrRenderList(analytics.value.sessions.slice(0, 20), (session) => {
              _push(`<tr class="border-b border-stroke/50 dark:border-strokedark/50 hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"><td class="py-3"><div><p class="font-medium text-gray-900 dark:text-white">${ssrInterpolate(session.studentName)}</p>`);
              if (session.studentPinfl) {
                _push(`<p class="text-xs text-gray-400">${ssrInterpolate(session.studentPinfl)}</p>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div></td><td class="py-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(session.groupCode || "—")}</td><td class="py-3 text-center"><span class="${ssrRenderClass([session.passed ? "bg-success/10 text-success" : "bg-danger/10 text-danger", "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"])}">${ssrInterpolate(session.score)}% </span></td><td class="py-3 text-center">`);
              if (session.passed) {
                _push(`<svg class="w-5 h-5 text-success mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`);
              } else {
                _push(`<svg class="w-5 h-5 text-danger mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`);
              }
              _push(`</td><td class="py-3 text-center text-gray-600 dark:text-gray-400">${ssrInterpolate(formatDuration(session.timeSpentSeconds))}</td><td class="py-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(formatDate(session.completedAt))}</td><td class="py-3"><button class="text-primary hover:text-primary/80 text-xs"> Подробнее </button></td></tr>`);
            });
            _push(`<!--]--></tbody></table></div>`);
            if (analytics.value.questionStats && analytics.value.questionStats.length > 0) {
              _push(`<div class="mt-8"><h4 class="text-md font-medium text-black dark:text-white mb-4"> Статистика по вопросам <span class="text-xs font-normal text-gray-500 ml-2">(отсортировано по сложности)</span></h4><div class="space-y-2"><!--[-->`);
              ssrRenderList(analytics.value.questionStats.slice(0, 10), (q, idx) => {
                _push(`<div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-meta-4 rounded-lg"><span class="w-6 h-6 rounded-full bg-gray-200 dark:bg-strokedark flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">${ssrInterpolate(idx + 1)}</span><div class="flex-1 min-w-0"><p class="text-sm text-gray-900 dark:text-white truncate">${ssrInterpolate(q.questionText)}</p></div><div class="flex items-center gap-4 text-xs"><span class="${ssrRenderClass([q.correctRate >= 70 ? "bg-success/10 text-success" : q.correctRate >= 40 ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger", "px-2 py-1 rounded"])}">${ssrInterpolate(q.correctRate)}% правильно </span><span class="text-gray-500">${ssrInterpolate(q.totalAnswers)} ответов </span></div></div>`);
              });
              _push(`<!--]--></div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        _push(ssrRenderComponent(_component_AttendanceTestResultsModal, {
          "is-open": showSessionDetails.value,
          "session-id": selectedSessionId.value,
          onClose: ($event) => showSessionDetails.value = false
        }, null, _parent));
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/test-bank/templates/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-D-vqw9OK.mjs.map
