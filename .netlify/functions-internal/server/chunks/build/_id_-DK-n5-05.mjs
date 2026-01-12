import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_3 } from './ConfirmModal-GQ4JU241.mjs';
import { _ as __nuxt_component_4 } from './Notification-Bd1V2gNg.mjs';
import { c as useRoute, n as navigateTo } from './server.mjs';
import { computed, ref, watch, mergeProps, unref, withCtx, createTextVNode, createBlock, openBlock, createVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderClass, ssrRenderStyle, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderTeleport } from 'vue/server-renderer';
import { onBeforeRouteLeave } from 'vue-router';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import './Modal-DQYphXo7.mjs';
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

const _sfc_main = {
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const { authFetch } = useAuthFetch();
    const sessionId = computed(() => route.params.id);
    const isPreviewMode = computed(() => route.query.preview === "true");
    const loading = ref(true);
    const error = ref(null);
    const session = ref(null);
    const questions = ref([]);
    const answers = ref({});
    const templateInfo = ref(null);
    const currentQuestionIndex = ref(0);
    const finishing = ref(false);
    const selectedOption = ref(null);
    const timeLimit = ref(null);
    const remainingTime = ref(0);
    let timerInterval = null;
    const proctoringEnabled = ref(false);
    const proctoringSettings = ref(null);
    const violationsCount = ref(0);
    const showViolationWarning = ref(false);
    const maxViolations = computed(() => proctoringSettings.value?.maxViolations || 3);
    const showFinishModal = ref(false);
    const notification = ref({
      show: false,
      type: "success",
      title: "",
      message: ""
    });
    const questionsCount = computed(() => questions.value.length);
    const currentQuestion = computed(
      () => questions.value[currentQuestionIndex.value] || null
    );
    watch(currentQuestionIndex, () => {
      const qId = currentQuestion.value?.id;
      if (qId) {
        const ans = answers.value[qId];
        selectedOption.value = ans?.selectedOption || null;
      } else {
        selectedOption.value = null;
      }
    }, { immediate: true });
    watch(questions, () => {
      const qId = currentQuestion.value?.id;
      if (qId) {
        const ans = answers.value[qId];
        selectedOption.value = ans?.selectedOption || null;
      }
    });
    watch(selectedOption, (newVal) => {
      const qId = currentQuestion.value?.id;
      if (qId && newVal !== null) {
        answers.value[qId] = { selectedOption: newVal };
      }
    });
    computed(() => {
      const qId = currentQuestion.value?.id;
      if (!qId) return { selectedOption: null };
      return answers.value[qId] || { selectedOption: null };
    });
    const answeredCount = computed(
      () => Object.values(answers.value).filter(
        (a) => a && (a.selectedOption || a.selectedOptions?.length || a.text)
      ).length
    );
    const unansweredCount = computed(() => questionsCount.value - answeredCount.value);
    const progressPercent = computed(
      () => questionsCount.value > 0 ? answeredCount.value / questionsCount.value * 100 : 0
    );
    const isCompleted = computed(
      () => session.value?.status === "completed" || session.value?.status === "timeout" || session.value?.status === "violation"
    );
    const timerWarning = computed(() => remainingTime.value > 0 && remainingTime.value <= 60);
    const sessionLanguage = computed(() => session.value?.language || null);
    const LANGUAGE_DATA = {
      en: { label: "English", flag: "🇬🇧" },
      ru: { label: "Русский", flag: "🇷🇺" },
      uz: { label: "O'zbek", flag: "🇺🇿" }
    };
    const getLanguageLabel = (lang) => {
      return LANGUAGE_DATA[lang]?.label || lang;
    };
    const getLanguageFlag = (lang) => {
      return LANGUAGE_DATA[lang]?.flag || "";
    };
    const cleanupProctoring = () => {
      (void 0).removeEventListener("visibilitychange", handleVisibilityChange);
      (void 0).removeEventListener("blur", handleWindowBlur);
      (void 0).removeEventListener("contextmenu", preventContextMenu);
      (void 0).removeEventListener("copy", preventCopy);
      (void 0).removeEventListener("paste", preventPaste);
    };
    const handleVisibilityChange = () => {
      if ((void 0).hidden && !isCompleted.value) {
        recordViolation("visibility_change");
      }
    };
    const handleWindowBlur = () => {
      if (!isCompleted.value) {
        recordViolation("tab_switch");
      }
    };
    const preventContextMenu = (e) => {
      e.preventDefault();
      recordViolation("right_click");
    };
    const preventCopy = (e) => {
      e.preventDefault();
      recordViolation("copy_paste");
    };
    const preventPaste = (e) => {
      e.preventDefault();
      recordViolation("copy_paste");
    };
    const recordViolation = async (type) => {
      if (violationsCount.value >= maxViolations.value) {
        if (proctoringSettings.value?.autoSubmitOnViolation) {
          showViolationWarning.value = false;
          showNotification("error", "Тест завершён", "Превышен лимит нарушений");
          await finishTest();
        }
        return;
      }
      violationsCount.value++;
      showViolationWarning.value = true;
      try {
        await authFetch(`/api/tests/sessions/${sessionId.value}/violation`, {
          method: "POST",
          body: {
            type,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
      } catch (err) {
        console.error("Ошибка записи нарушения:", err);
      }
      if (violationsCount.value >= maxViolations.value && proctoringSettings.value?.autoSubmitOnViolation) {
        showViolationWarning.value = false;
        showNotification("error", "Тест завершён", "Превышен лимит нарушений");
        await finishTest();
      }
    };
    const dismissViolationWarning = () => {
      showViolationWarning.value = false;
    };
    let isNavigating = false;
    const nextQuestion = async () => {
      if (isNavigating) return;
      if (currentQuestionIndex.value < questionsCount.value - 1) {
        isNavigating = true;
        try {
          await saveCurrentAnswer();
          currentQuestionIndex.value++;
        } finally {
          isNavigating = false;
        }
      }
    };
    const prevQuestion = async () => {
      if (isNavigating) return;
      if (currentQuestionIndex.value > 0) {
        isNavigating = true;
        try {
          await saveCurrentAnswer();
          currentQuestionIndex.value--;
        } finally {
          isNavigating = false;
        }
      }
    };
    const goToQuestion = async (index) => {
      if (isNavigating) return;
      if (index !== currentQuestionIndex.value) {
        isNavigating = true;
        try {
          await saveCurrentAnswer();
          currentQuestionIndex.value = index;
        } finally {
          isNavigating = false;
        }
      }
    };
    const isQuestionAnswered = (index) => {
      const q = questions.value[index];
      if (!q) return false;
      const ans = answers.value[q.id];
      return ans && (ans.selectedOption || ans.selectedOptions?.length || ans.text);
    };
    let isSaving = false;
    const saveCurrentAnswer = async () => {
      if (isSaving) return;
      const question = currentQuestion.value;
      const answer = answers.value[question?.id];
      if (!question || !answer) return;
      isSaving = true;
      try {
        await authFetch(`/api/tests/sessions/${sessionId.value}/answer`, {
          method: "POST",
          body: {
            question_id: question.id,
            answer_data: answer,
            question_index: currentQuestionIndex.value
          }
        });
      } catch (err) {
        console.error("Ошибка сохранения ответа:", err);
      } finally {
        isSaving = false;
      }
    };
    const confirmFinish = () => {
      saveCurrentAnswer();
      showFinishModal.value = true;
    };
    const handleCancelFinish = () => {
      showFinishModal.value = false;
      if (unansweredCount.value > 0) {
        const firstUnansweredIndex = questions.value.findIndex((q, idx) => !isQuestionAnswered(idx));
        if (firstUnansweredIndex !== -1) {
          goToQuestion(firstUnansweredIndex);
        }
      }
    };
    const getFinishMessage = () => {
      isPreviewMode.value ? "" : "";
      if (unansweredCount.value > 0) {
        let message = `У вас есть ${unansweredCount.value} ${pluralize(unansweredCount.value, "неотвеченный вопрос", "неотвеченных вопроса", "неотвеченных вопросов")}.`;
        if (remainingTime.value > 60) {
          message += ` У вас ещё есть ${formatTimer(remainingTime.value)} времени, чтобы подумать.`;
        }
        message += " Вы уверены, что хотите отправить ответы?";
        return message;
      }
      if (isPreviewMode.value) {
        return "Вы ответили на все вопросы. Отправить ответы и посмотреть результаты?";
      }
      return "Вы ответили на все вопросы. Завершить тест и посмотреть результаты?";
    };
    const finishTest = async () => {
      finishing.value = true;
      showFinishModal.value = false;
      try {
        await saveCurrentAnswer();
        const response = await authFetch(`/api/tests/sessions/${sessionId.value}/finish`, {
          method: "POST"
        });
        if (response.success) {
          session.value = {
            ...session.value,
            status: "completed",
            ...response.results
          };
          cleanupProctoring();
          if (timerInterval) ;
        } else {
          showNotification("error", "Ошибка", response.message || "Не удалось завершить тест");
        }
      } catch (err) {
        console.error("Ошибка завершения теста:", err);
        showNotification("error", "Ошибка", "Произошла ошибка при завершении теста");
      } finally {
        finishing.value = false;
      }
    };
    const formatTimer = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor(seconds % 3600 / 60);
      const s = seconds % 60;
      if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
      }
      return `${m}:${s.toString().padStart(2, "0")}`;
    };
    const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m} мин ${s} сек`;
    };
    const pluralize = (n, one, few, many) => {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod100 >= 11 && mod100 <= 19) return many;
      if (mod10 === 1) return one;
      if (mod10 >= 2 && mod10 <= 4) return few;
      return many;
    };
    const showNotification = (type, title, message) => {
      notification.value = { show: true, type, title, message };
      setTimeout(() => {
        notification.value.show = false;
      }, 5e3);
    };
    onBeforeRouteLeave(async (to, from, next) => {
      if (!isCompleted.value && !isPreviewMode.value) {
        const confirmLeave = (void 0).confirm(
          "⚠️ ВНИМАНИЕ!\n\nПри выходе со страницы тест будет автоматически ЗАВЕРШЁН с текущими результатами.\n\nВы уверены, что хотите выйти и завершить тест?"
        );
        if (confirmLeave) {
          if (proctoringEnabled.value) {
            await recordViolation("tab_switch");
          }
          try {
            await finishTest();
            showNotification("warning", "Тест завершён", "Вы покинули страницу теста");
          } catch (err) {
            console.error("Ошибка завершения теста при уходе:", err);
          }
          next();
        } else {
          next(false);
        }
      } else {
        next();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      const _component_UiConfirmModal = __nuxt_component_3;
      const _component_UiNotification = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-100 dark:bg-boxdark-2" }, _attrs))} data-v-412c27eb>`);
      if (loading.value) {
        _push(`<div class="flex items-center justify-center min-h-screen" data-v-412c27eb><div class="text-center" data-v-412c27eb><div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4" data-v-412c27eb></div><p class="text-gray-600 dark:text-gray-400" data-v-412c27eb>Загрузка теста...</p></div></div>`);
      } else if (error.value) {
        _push(`<div class="flex items-center justify-center min-h-screen p-4" data-v-412c27eb><div class="bg-white dark:bg-boxdark rounded-2xl shadow-xl p-8 max-w-md w-full text-center" data-v-412c27eb><div class="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4" data-v-412c27eb><svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-412c27eb></path></svg></div><h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2" data-v-412c27eb>Ошибка загрузки</h2><p class="text-gray-600 dark:text-gray-400 mb-6" data-v-412c27eb>${ssrInterpolate(error.value)}</p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/tests/my")
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Вернуться к списку тестов `);
            } else {
              return [
                createTextVNode(" Вернуться к списку тестов ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
      } else if (isCompleted.value) {
        _push(`<div class="flex items-center justify-center min-h-screen p-4" data-v-412c27eb><div class="bg-white dark:bg-boxdark rounded-2xl shadow-xl p-8 max-w-lg w-full" data-v-412c27eb>`);
        if (isPreviewMode.value) {
          _push(`<div class="text-center mb-4" data-v-412c27eb><span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium" data-v-412c27eb><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" data-v-412c27eb></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" data-v-412c27eb></path></svg> Результат предпросмотра </span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="text-center mb-8" data-v-412c27eb><div class="${ssrRenderClass([
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
          session.value?.passed ? "bg-success/10" : "bg-danger/10"
        ])}" data-v-412c27eb>`);
        if (session.value?.passed) {
          _push(`<svg class="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-412c27eb></path></svg>`);
        } else {
          _push(`<svg class="w-10 h-10 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-412c27eb></path></svg>`);
        }
        _push(`</div><h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2" data-v-412c27eb>${ssrInterpolate(session.value?.passed ? isPreviewMode.value ? "Тест будет пройден!" : "Тест пройден!" : isPreviewMode.value ? "Тест не будет сдан" : "Тест не сдан")}</h2><p class="text-gray-600 dark:text-gray-400" data-v-412c27eb>`);
        if (isPreviewMode.value) {
          _push(`<!--[-->${ssrInterpolate(session.value?.passed ? "Студент с такими ответами успешно сдаст тест." : "Студент с такими ответами не наберёт проходной балл.")}<!--]-->`);
        } else {
          _push(`<!--[-->${ssrInterpolate(session.value?.passed ? "Поздравляем с успешным прохождением теста!" : "К сожалению, вы не набрали проходной балл.")}<!--]-->`);
        }
        _push(`</p></div><div class="bg-gray-50 dark:bg-meta-4 rounded-xl p-6 mb-6" data-v-412c27eb><div class="text-center mb-4" data-v-412c27eb><div class="${ssrRenderClass([
          "text-5xl font-bold mb-1",
          session.value?.passed ? "text-success" : "text-danger"
        ])}" data-v-412c27eb>${ssrInterpolate(session.value?.score_percent !== null ? Math.round(session.value.score_percent) : 0)}% </div><div class="text-sm text-gray-500 dark:text-gray-400" data-v-412c27eb>${ssrInterpolate(isPreviewMode.value ? "Результат" : "Ваш результат")}</div></div><div class="grid grid-cols-2 gap-4 text-center" data-v-412c27eb><div class="bg-white dark:bg-boxdark rounded-lg p-3" data-v-412c27eb><div class="text-lg font-bold text-gray-900 dark:text-white" data-v-412c27eb>${ssrInterpolate(session.value?.total_points || 0)} / ${ssrInterpolate(session.value?.max_points || 0)}</div><div class="text-xs text-gray-500 dark:text-gray-400" data-v-412c27eb>Баллов набрано</div></div><div class="bg-white dark:bg-boxdark rounded-lg p-3" data-v-412c27eb><div class="text-lg font-bold text-gray-900 dark:text-white" data-v-412c27eb>${ssrInterpolate(formatTime(session.value?.time_spent_seconds || 0))}</div><div class="text-xs text-gray-500 dark:text-gray-400" data-v-412c27eb>Время прохождения</div></div></div></div><div class="flex gap-3" data-v-412c27eb>`);
        if (isPreviewMode.value) {
          _push(ssrRenderComponent(_component_UiButton, {
            class: "flex-1",
            onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/test-bank/templates")
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" data-v-412c27eb${_scopeId}></path></svg> Вернуться к шаблонам `);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "w-5 h-5 mr-2",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      "stroke-width": "2",
                      d: "M11 17l-5-5m0 0l5-5m-5 5h12"
                    })
                  ])),
                  createTextVNode(" Вернуться к шаблонам ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "outline",
            class: "flex-1",
            onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/tests/my")
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` К списку тестов `);
              } else {
                return [
                  createTextVNode(" К списку тестов ")
                ];
              }
            }),
            _: 1
          }, _parent));
        }
        _push(`</div></div></div>`);
      } else {
        _push(`<div class="flex flex-col min-h-screen" data-v-412c27eb>`);
        if (isPreviewMode.value) {
          _push(`<div class="bg-primary/10 border-b-2 border-primary" data-v-412c27eb><div class="max-w-5xl mx-auto px-4 py-2" data-v-412c27eb><div class="flex items-center gap-3" data-v-412c27eb><svg class="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" data-v-412c27eb></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" data-v-412c27eb></path></svg><p class="text-sm text-gray-700 dark:text-gray-300" data-v-412c27eb><span class="font-medium text-primary" data-v-412c27eb>Режим предпросмотра.</span> Пройдите тест как студент, чтобы проверить его работу. Результаты не сохраняются. </p></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<header class="bg-white dark:bg-boxdark shadow-sm sticky top-0 z-50" data-v-412c27eb><div class="max-w-5xl mx-auto px-4 py-3" data-v-412c27eb><div class="flex items-center justify-between" data-v-412c27eb><div class="flex items-center gap-4" data-v-412c27eb><div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center" data-v-412c27eb><svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-v-412c27eb></path></svg></div><div data-v-412c27eb><h1 class="font-semibold text-gray-900 dark:text-white line-clamp-1" data-v-412c27eb>${ssrInterpolate(templateInfo.value?.name || "Тест")}</h1><p class="text-sm text-gray-500 dark:text-gray-400" data-v-412c27eb> Вопрос ${ssrInterpolate(currentQuestionIndex.value + 1)} из ${ssrInterpolate(questionsCount.value)}</p></div></div><div class="flex items-center gap-3" data-v-412c27eb>`);
        if (sessionLanguage.value) {
          _push(`<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-meta-4 text-sm" data-v-412c27eb><span class="text-lg" data-v-412c27eb>${ssrInterpolate(getLanguageFlag(sessionLanguage.value))}</span><span class="font-medium text-gray-700 dark:text-gray-300" data-v-412c27eb>${ssrInterpolate(getLanguageLabel(sessionLanguage.value))}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        if (timeLimit.value) {
          _push(`<div class="${ssrRenderClass([
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium",
            timerWarning.value ? "bg-danger/10 text-danger animate-pulse" : "bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-gray-300"
          ])}" data-v-412c27eb><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" data-v-412c27eb></path></svg><span class="tabular-nums" data-v-412c27eb>${ssrInterpolate(formatTimer(remainingTime.value))}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="mt-3 mb-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" data-v-412c27eb><span data-v-412c27eb>Прогресс:</span><span class="font-medium" data-v-412c27eb>${ssrInterpolate(answeredCount.value)}/${ssrInterpolate(questionsCount.value)}</span></div><div class="w-full h-2 bg-gray-200 dark:bg-meta-4 rounded-full overflow-hidden" data-v-412c27eb><div class="h-full bg-primary transition-all duration-300" style="${ssrRenderStyle({ width: `${progressPercent.value}%` })}" data-v-412c27eb></div></div></div></header><main class="flex-1 py-6" data-v-412c27eb><div class="max-w-3xl mx-auto px-4" data-v-412c27eb><div class="bg-white dark:bg-boxdark rounded-2xl shadow-lg overflow-hidden" data-v-412c27eb><div class="p-6 border-b border-gray-200 dark:border-gray-700" data-v-412c27eb><div class="flex items-start gap-4" data-v-412c27eb><div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold" data-v-412c27eb>${ssrInterpolate(currentQuestionIndex.value + 1)}</div><div class="flex-1" data-v-412c27eb><h2 class="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed" data-v-412c27eb>${ssrInterpolate(currentQuestion.value?.question_text)}</h2>`);
        if (currentQuestion.value?.points) {
          _push(`<div class="mt-2 inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400" data-v-412c27eb><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" data-v-412c27eb></path></svg> ${ssrInterpolate(currentQuestion.value.points)} ${ssrInterpolate(pluralize(currentQuestion.value.points, "балл", "балла", "баллов"))}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div><div class="p-6" data-v-412c27eb>`);
        if (currentQuestion.value?.question_type === "single") {
          _push(`<div class="space-y-3" data-v-412c27eb><!--[-->`);
          ssrRenderList(currentQuestion.value.options?.options, (option) => {
            _push(`<label class="${ssrRenderClass([
              "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
              selectedOption.value === option.id ? "border-primary bg-primary/5" : "border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-meta-4"
            ])}" data-v-412c27eb><div class="${ssrRenderClass([
              "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
              selectedOption.value === option.id ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-600"
            ])}" data-v-412c27eb>`);
            if (selectedOption.value === option.id) {
              _push(`<div class="w-2 h-2 rounded-full bg-white" data-v-412c27eb></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="flex-1" data-v-412c27eb><span class="block text-gray-900 dark:text-white" data-v-412c27eb>${ssrInterpolate(option.text)}</span></div><input type="radio"${ssrRenderAttr("name", `question-${currentQuestion.value.id}`)}${ssrRenderAttr("value", option.id)}${ssrIncludeBooleanAttr(selectedOption.value === option.id) ? " checked" : ""} class="sr-only" data-v-412c27eb></label>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="mt-6 flex flex-wrap gap-2 bg-white dark:bg-boxdark rounded-xl p-4 shadow" data-v-412c27eb><!--[-->`);
        ssrRenderList(questionsCount.value, (q, idx) => {
          _push(`<button class="${ssrRenderClass([
            "w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200",
            idx === currentQuestionIndex.value ? "bg-primary text-white shadow-lg scale-110" : isQuestionAnswered(idx) ? "bg-success/10 text-success hover:bg-success/20" : "bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          ])}" data-v-412c27eb>${ssrInterpolate(idx + 1)}</button>`);
        });
        _push(`<!--]--></div></div></main><footer class="bg-white dark:bg-boxdark border-t border-gray-200 dark:border-gray-700 sticky bottom-0" data-v-412c27eb><div class="max-w-3xl mx-auto px-4 py-4" data-v-412c27eb><div class="flex items-center justify-between" data-v-412c27eb>`);
        if (templateInfo.value?.allow_back !== false) {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "outline",
            disabled: currentQuestionIndex.value === 0,
            onClick: prevQuestion
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-v-412c27eb${_scopeId}></path></svg> Назад `);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "w-5 h-5 mr-2",
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
                  createTextVNode(" Назад ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<div data-v-412c27eb></div>`);
        }
        if (currentQuestionIndex.value < questionsCount.value - 1) {
          _push(ssrRenderComponent(_component_UiButton, { onClick: nextQuestion }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Далее <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" data-v-412c27eb${_scopeId}></path></svg>`);
              } else {
                return [
                  createTextVNode(" Далее "),
                  (openBlock(), createBlock("svg", {
                    class: "w-5 h-5 ml-2",
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
        } else {
          _push(ssrRenderComponent(_component_UiButton, {
            variant: "success",
            onClick: confirmFinish,
            loading: finishing.value
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" data-v-412c27eb${_scopeId}></path></svg> ${ssrInterpolate(isPreviewMode.value ? "Отправить ответы" : "Завершить тест")}`);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "w-5 h-5 mr-2",
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
                  createTextVNode(" " + toDisplayString(isPreviewMode.value ? "Отправить ответы" : "Завершить тест"), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
        }
        _push(`</div></div></footer></div>`);
      }
      ssrRenderTeleport(_push, (_push2) => {
        if (showViolationWarning.value) {
          _push2(`<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur" data-v-412c27eb><div class="bg-white dark:bg-boxdark rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-shake" data-v-412c27eb><div class="flex items-center gap-4 mb-4" data-v-412c27eb><div class="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0" data-v-412c27eb><svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-412c27eb><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" data-v-412c27eb></path></svg></div><div data-v-412c27eb><h3 class="text-lg font-bold text-gray-900 dark:text-white" data-v-412c27eb> Нарушение обнаружено! </h3><p class="text-sm text-gray-600 dark:text-gray-400" data-v-412c27eb> Переключение вкладок запрещено во время теста </p></div></div><div class="bg-danger/10 rounded-lg p-3 mb-4" data-v-412c27eb><p class="text-sm text-danger" data-v-412c27eb> Нарушений: ${ssrInterpolate(violationsCount.value)} (максимум: ${ssrInterpolate(maxViolations.value)}) </p>`);
          if (violationsCount.value >= maxViolations.value - 1 && violationsCount.value < maxViolations.value) {
            _push2(`<p class="text-sm text-danger mt-1 font-medium" data-v-412c27eb> Следующее нарушение приведёт к автоматическому завершению теста! </p>`);
          } else if (violationsCount.value >= maxViolations.value) {
            _push2(`<p class="text-sm text-danger mt-1 font-medium" data-v-412c27eb> Лимит нарушений превышен! Тест будет завершён. </p>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div>`);
          _push2(ssrRenderComponent(_component_UiButton, {
            class: "w-full",
            onClick: dismissViolationWarning
          }, {
            default: withCtx((_, _push3, _parent2, _scopeId) => {
              if (_push3) {
                _push3(` Продолжить тест `);
              } else {
                return [
                  createTextVNode(" Продолжить тест ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push2(`</div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(ssrRenderComponent(_component_UiConfirmModal, {
        "is-open": showFinishModal.value,
        title: isPreviewMode.value ? "Отправить ответы?" : "Завершить тест?",
        message: getFinishMessage(),
        "confirm-text": isPreviewMode.value ? "Отправить" : "Завершить",
        "cancel-text": unansweredCount.value > 0 ? "Вернуться к вопросам" : "Отмена",
        variant: unansweredCount.value > 0 ? "warning" : "success",
        loading: finishing.value,
        onConfirm: finishTest,
        onCancel: handleCancelFinish
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/tests/take/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _id_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-412c27eb"]]);

export { _id_ as default };
//# sourceMappingURL=_id_-DK-n5-05.mjs.map
