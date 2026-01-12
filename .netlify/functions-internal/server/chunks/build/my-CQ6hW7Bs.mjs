import { _ as __nuxt_component_1 } from './Button-DE8MjHjS.mjs';
import { _ as __nuxt_component_0 } from './Modal-DQYphXo7.mjs';
import { ref, computed, mergeProps, withCtx, createBlock, createTextVNode, openBlock, createVNode, toDisplayString, watch, Fragment, renderList, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-CmGEBSSi.mjs';
import { _ as __nuxt_component_4 } from './Notification-Bd1V2gNg.mjs';
import { n as navigateTo } from './server.mjs';
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
  __name: "TestsLanguageSelectModal",
  __ssrInlineRender: true,
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    assignmentId: {
      type: String,
      default: null
    }
  },
  emits: ["close", "confirm"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { authFetch } = useAuthFetch();
    const loading = ref(false);
    const error = ref(null);
    const languages = ref([]);
    const selectedLanguage = ref(null);
    const confirming = ref(false);
    watch(() => props.isOpen, async (isOpen) => {
      if (isOpen && props.assignmentId) {
        selectedLanguage.value = null;
        await loadLanguages();
      }
    });
    const loadLanguages = async () => {
      if (!props.assignmentId) return;
      loading.value = true;
      error.value = null;
      try {
        const response = await authFetch(`/api/tests/assignments/${props.assignmentId}/available-languages`);
        if (response.success) {
          languages.value = response.languages || [];
          if (languages.value.length === 1) {
            selectedLanguage.value = languages.value[0].value;
          }
          if (languages.value.length === 0) {
            error.value = "Для этого теста нет доступных языков. Обратитесь к администратору.";
          }
        } else {
          error.value = response.message || "Не удалось загрузить языки";
        }
      } catch (err) {
        console.error("Ошибка загрузки языков:", err);
        error.value = "Произошла ошибка при загрузке языков";
      } finally {
        loading.value = false;
      }
    };
    const selectLanguage = (lang) => {
      selectedLanguage.value = lang;
    };
    const confirmSelection = () => {
      if (!selectedLanguage.value) return;
      confirming.value = true;
      emit("confirm", selectedLanguage.value);
    };
    watch(() => props.isOpen, (isOpen) => {
      if (!isOpen) {
        confirming.value = false;
      }
    });
    const handleClose = () => {
      if (!confirming.value) {
        emit("close");
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiModal = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      _push(ssrRenderComponent(_component_UiModal, mergeProps({
        "is-open": __props.isOpen,
        title: "Выберите язык тестирования",
        size: "sm",
        onClose: handleClose
      }, _attrs), {
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex gap-3 justify-end"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: handleClose,
              disabled: confirming.value
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
              onClick: confirmSelection,
              disabled: !selectedLanguage.value || confirming.value,
              loading: confirming.value
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId2}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"${_scopeId2}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId2}></path></svg> Подтвердить и начать `);
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
                        d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      }),
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      })
                    ])),
                    createTextVNode(" Подтвердить и начать ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "flex gap-3 justify-end" }, [
                createVNode(_component_UiButton, {
                  variant: "outline",
                  onClick: handleClose,
                  disabled: confirming.value
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Отмена ")
                  ]),
                  _: 1
                }, 8, ["disabled"]),
                createVNode(_component_UiButton, {
                  onClick: confirmSelection,
                  disabled: !selectedLanguage.value || confirming.value,
                  loading: confirming.value
                }, {
                  default: withCtx(() => [
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
                        d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      }),
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      })
                    ])),
                    createTextVNode(" Подтвердить и начать ")
                  ]),
                  _: 1
                }, 8, ["disabled", "loading"])
              ])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-6"${_scopeId}><p class="text-sm text-gray-600 dark:text-gray-400"${_scopeId}> Выберите язык, на котором хотите проходить тест. После выбора язык изменить будет невозможно. </p>`);
            if (loading.value) {
              _push2(`<div class="py-8 text-center"${_scopeId}><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"${_scopeId}></div><p class="mt-2 text-sm text-gray-500 dark:text-gray-400"${_scopeId}>Загрузка доступных языков...</p></div>`);
            } else if (error.value) {
              _push2(`<div class="py-6 text-center"${_scopeId}><div class="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-3"${_scopeId}><svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg></div><p class="text-sm text-danger"${_scopeId}>${ssrInterpolate(error.value)}</p><button class="mt-3 text-sm text-primary hover:underline"${_scopeId}> Попробовать снова </button></div>`);
            } else {
              _push2(`<div class="space-y-3"${_scopeId}><!--[-->`);
              ssrRenderList(languages.value, (lang) => {
                _push2(`<label class="${ssrRenderClass([
                  "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  selectedLanguage.value === lang.value ? "border-primary bg-primary/5 shadow-md" : "border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-meta-4"
                ])}"${_scopeId}><div class="${ssrRenderClass([
                  "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  selectedLanguage.value === lang.value ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-600"
                ])}"${_scopeId}>`);
                if (selectedLanguage.value === lang.value) {
                  _push2(`<div class="w-2 h-2 rounded-full bg-white"${_scopeId}></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><span class="text-2xl"${_scopeId}>${ssrInterpolate(lang.flag)}</span><div class="flex-1"${_scopeId}><span class="block font-medium text-gray-900 dark:text-white"${_scopeId}>${ssrInterpolate(lang.label)}</span></div><input type="radio"${ssrRenderAttr("name", "language")}${ssrRenderAttr("value", lang.value)}${ssrIncludeBooleanAttr(selectedLanguage.value === lang.value) ? " checked" : ""} class="sr-only"${_scopeId}></label>`);
              });
              _push2(`<!--]--></div>`);
            }
            _push2(`<div class="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20"${_scopeId}><svg class="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg><p class="text-sm text-gray-700 dark:text-gray-300"${_scopeId}><span class="font-medium text-warning"${_scopeId}>Внимание!</span> После начала теста изменить язык будет невозможно. </p></div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-6" }, [
                createVNode("p", { class: "text-sm text-gray-600 dark:text-gray-400" }, " Выберите язык, на котором хотите проходить тест. После выбора язык изменить будет невозможно. "),
                loading.value ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "py-8 text-center"
                }, [
                  createVNode("div", { class: "inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" }),
                  createVNode("p", { class: "mt-2 text-sm text-gray-500 dark:text-gray-400" }, "Загрузка доступных языков...")
                ])) : error.value ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "py-6 text-center"
                }, [
                  createVNode("div", { class: "w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-3" }, [
                    (openBlock(), createBlock("svg", {
                      class: "w-6 h-6 text-danger",
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
                  createVNode("p", { class: "text-sm text-danger" }, toDisplayString(error.value), 1),
                  createVNode("button", {
                    onClick: loadLanguages,
                    class: "mt-3 text-sm text-primary hover:underline"
                  }, " Попробовать снова ")
                ])) : (openBlock(), createBlock("div", {
                  key: 2,
                  class: "space-y-3"
                }, [
                  (openBlock(true), createBlock(Fragment, null, renderList(languages.value, (lang) => {
                    return openBlock(), createBlock("label", {
                      key: lang.value,
                      onClick: ($event) => selectLanguage(lang.value),
                      class: [
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                        selectedLanguage.value === lang.value ? "border-primary bg-primary/5 shadow-md" : "border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-meta-4"
                      ]
                    }, [
                      createVNode("div", {
                        class: [
                          "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedLanguage.value === lang.value ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-600"
                        ]
                      }, [
                        selectedLanguage.value === lang.value ? (openBlock(), createBlock("div", {
                          key: 0,
                          class: "w-2 h-2 rounded-full bg-white"
                        })) : createCommentVNode("", true)
                      ], 2),
                      createVNode("span", { class: "text-2xl" }, toDisplayString(lang.flag), 1),
                      createVNode("div", { class: "flex-1" }, [
                        createVNode("span", { class: "block font-medium text-gray-900 dark:text-white" }, toDisplayString(lang.label), 1)
                      ]),
                      createVNode("input", {
                        type: "radio",
                        name: "language",
                        value: lang.value,
                        checked: selectedLanguage.value === lang.value,
                        class: "sr-only"
                      }, null, 8, ["value", "checked"])
                    ], 10, ["onClick"]);
                  }), 128))
                ])),
                createVNode("div", { class: "flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20" }, [
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
                  createVNode("p", { class: "text-sm text-gray-700 dark:text-gray-300" }, [
                    createVNode("span", { class: "font-medium text-warning" }, "Внимание!"),
                    createTextVNode(" После начала теста изменить язык будет невозможно. ")
                  ])
                ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/tests/LanguageSelectModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "my",
  __ssrInlineRender: true,
  setup(__props) {
    const { authFetch } = useAuthFetch();
    const loading = ref(false);
    const assignments = ref([]);
    const activeTab = ref("all");
    const startingTest = ref(null);
    const showLanguageModal = ref(false);
    const selectedAssignmentId = ref(null);
    const selectedAssignment = ref(null);
    const notification = ref({
      show: false,
      type: "success",
      title: "",
      message: ""
    });
    const tabs = computed(() => [
      { value: "all", label: "Все тесты", count: assignments.value.length },
      { value: "pending", label: "Ожидают", count: stats.value.pending },
      { value: "in_progress", label: "В процессе", count: stats.value.inProgress },
      { value: "completed", label: "Завершённые", count: stats.value.passed + stats.value.failed }
    ]);
    const stats = computed(() => {
      const pending = assignments.value.filter(
        (a) => a.status === "scheduled" && !a.has_active_session && (a.attempts_used || 0) < (a.max_attempts || 1)
      ).length;
      const inProgress = assignments.value.filter(
        (a) => a.has_active_session || a.status === "in_progress"
      ).length;
      const passed = assignments.value.filter((a) => a.passed).length;
      const failed = assignments.value.filter(
        (a) => a.best_score !== null && !a.passed && (a.attempts_used || 0) >= (a.max_attempts || 1)
      ).length;
      return { pending, inProgress, passed, failed };
    });
    const filteredAssignments = computed(() => {
      if (activeTab.value === "all") {
        return assignments.value;
      }
      if (activeTab.value === "pending") {
        return assignments.value.filter(
          (a) => a.status === "scheduled" && !a.has_active_session && (a.attempts_used || 0) < (a.max_attempts || 1)
        );
      }
      if (activeTab.value === "in_progress") {
        return assignments.value.filter(
          (a) => a.has_active_session || a.status === "in_progress"
        );
      }
      if (activeTab.value === "completed") {
        return assignments.value.filter((a) => a.best_score !== null);
      }
      return assignments.value;
    });
    const startTest = async (assignment) => {
      if (assignment.active_session_id) {
        startingTest.value = assignment.id;
        await navigateTo(`/tests/take/${assignment.active_session_id}`);
        startingTest.value = null;
        return;
      }
      selectedAssignment.value = assignment;
      selectedAssignmentId.value = assignment.id;
      showLanguageModal.value = true;
    };
    const closeLanguageModal = () => {
      showLanguageModal.value = false;
      selectedAssignmentId.value = null;
      selectedAssignment.value = null;
    };
    const handleLanguageConfirm = async (language) => {
      if (!selectedAssignment.value) return;
      startingTest.value = selectedAssignment.value.id;
      try {
        const response = await authFetch("/api/tests/sessions/start", {
          method: "POST",
          body: {
            assignment_id: selectedAssignment.value.id,
            language
          }
        });
        if (response.success) {
          closeLanguageModal();
          await navigateTo(`/tests/take/${response.session.id}`);
        } else {
          showNotification("error", "Ошибка", response.message || "Не удалось начать тест");
        }
      } catch (error) {
        console.error("Ошибка начала теста:", error);
        showNotification("error", "Ошибка", "Произошла ошибка при начале теста");
      } finally {
        startingTest.value = null;
      }
    };
    const parseLocalDateTime = (dateStr) => {
      if (!dateStr) return null;
      console.log(`[parseLocalDateTime] Вход: "${dateStr}"`);
      if (dateStr.includes("Z") || dateStr.includes("+")) {
        const date = new Date(dateStr);
        console.log(`[parseLocalDateTime] UTC формат → Локальное: ${date.toLocaleString()}`);
        return date;
      }
      const normalized = dateStr.replace("T", " ").trim();
      const parts = normalized.split(/[- :]/);
      if (parts.length >= 5) {
        const date = new Date(
          parseInt(parts[0]),
          // год
          parseInt(parts[1]) - 1,
          // месяц (0-indexed)
          parseInt(parts[2]),
          // день
          parseInt(parts[3]) || 0,
          // часы
          parseInt(parts[4]) || 0,
          // минуты
          parseInt(parts[5]) || 0
          // секунды
        );
        console.log(`[parseLocalDateTime] Локальный формат → ${date.toLocaleString()}`);
        return date;
      }
      console.log(`[parseLocalDateTime] Fallback парсинг`);
      return new Date(dateStr);
    };
    const canTakeTest = (assignment) => {
      const now = /* @__PURE__ */ new Date();
      console.log(`[canTakeTest] ═══════════════════════════════════════`);
      console.log(`[canTakeTest] Проверка теста: "${assignment.template_name}"`);
      console.log(`[canTakeTest] Данные из API:`, {
        start_date_raw: assignment.start_date,
        status: assignment.status,
        attempts: `${assignment.attempts_used || 0}/${assignment.max_attempts || 1}`,
        has_active_session: assignment.has_active_session
      });
      console.log(`[canTakeTest] Текущее время: ${now.toLocaleString()}`);
      if (assignment.has_active_session) {
        console.log(`[canTakeTest] ✅ Есть активная сессия`);
        return true;
      }
      if (assignment.status === "cancelled" || assignment.status === "completed") {
        console.log(`[canTakeTest] ❌ Статус: ${assignment.status}`);
        return false;
      }
      if ((assignment.attempts_used || 0) >= (assignment.max_attempts || 1)) {
        console.log(`[canTakeTest] ❌ Попытки исчерпаны: ${assignment.attempts_used}/${assignment.max_attempts}`);
        return false;
      }
      if (assignment.start_date) {
        const startDate = parseLocalDateTime(assignment.start_date);
        if (startDate && startDate > now) {
          console.log(`[canTakeTest] ❌ Тест ещё не начался.`);
          console.log(`[canTakeTest]    Начало: ${startDate.toLocaleString()}`);
          console.log(`[canTakeTest]    Сейчас: ${now.toLocaleString()}`);
          return false;
        }
      }
      if (assignment.end_date) {
        const endDate = parseLocalDateTime(assignment.end_date);
        if (endDate && endDate < now) {
          console.log(`[canTakeTest] ❌ Тест завершён.`);
          console.log(`[canTakeTest]    Окончание: ${endDate.toLocaleString()}`);
          console.log(`[canTakeTest]    Сейчас: ${now.toLocaleString()}`);
          return false;
        }
      }
      console.log(`[canTakeTest] ✅ Тест доступен для прохождения`);
      return true;
    };
    const viewResults = (assignment) => {
      showNotification("info", "В разработке", "Страница результатов находится в разработке");
    };
    const getStatusLabel = (assignment) => {
      const now = /* @__PURE__ */ new Date();
      if (assignment.has_active_session) return "В процессе";
      if (assignment.passed) return "Сдан";
      if (assignment.best_score !== null && !assignment.passed) return "Не сдан";
      if (assignment.status === "cancelled") return "Отменён";
      if (assignment.status === "completed") return "Завершён";
      if (assignment.end_date) {
        const endDate = parseLocalDateTime(assignment.end_date);
        if (endDate && endDate < now) {
          return "Просрочен";
        }
      }
      if (assignment.start_date) {
        const startDate = parseLocalDateTime(assignment.start_date);
        if (startDate && startDate > now) {
          return "Ожидает начала";
        }
      }
      return "Доступен";
    };
    const getStatusBadgeClass = (assignment) => {
      const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium";
      const now = /* @__PURE__ */ new Date();
      if (assignment.has_active_session) return `${base} bg-primary/10 text-primary`;
      if (assignment.passed) return `${base} bg-success/10 text-success`;
      if (assignment.best_score !== null && !assignment.passed) return `${base} bg-danger/10 text-danger`;
      if (assignment.status === "cancelled") return `${base} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400`;
      if (assignment.end_date) {
        const endDate = parseLocalDateTime(assignment.end_date);
        if (endDate && endDate < now) return `${base} bg-danger/10 text-danger`;
      }
      if (assignment.start_date) {
        const startDate = parseLocalDateTime(assignment.start_date);
        if (startDate && startDate > now) return `${base} bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400`;
      }
      return `${base} bg-success/10 text-success`;
    };
    const getStatusBgClass = (assignment) => {
      if (assignment.has_active_session) return "bg-primary/10";
      if (assignment.passed) return "bg-success/10";
      if (assignment.best_score !== null && !assignment.passed) return "bg-danger/10";
      return "bg-warning/10";
    };
    const getStatusIconClass = (assignment) => {
      if (assignment.has_active_session) return "text-primary";
      if (assignment.passed) return "text-success";
      if (assignment.best_score !== null && !assignment.passed) return "text-danger";
      return "text-warning";
    };
    const getEmptyMessage = () => {
      switch (activeTab.value) {
        case "pending":
          return "Нет тестов, ожидающих прохождения";
        case "in_progress":
          return "Нет тестов в процессе прохождения";
        case "completed":
          return "Вы ещё не завершили ни одного теста";
        default:
          return "Вам пока не назначено ни одного теста";
      }
    };
    const formatDate = (date) => {
      if (!date) return "";
      return new Date(date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    };
    const formatTime = (dateTimeStr) => {
      if (!dateTimeStr) return "";
      const parsed = parseLocalDateTime(dateTimeStr);
      if (!parsed) return "";
      return parsed.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const showNotification = (type, title, message) => {
      notification.value = { show: true, type, title, message };
      setTimeout(() => {
        notification.value.show = false;
      }, 5e3);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UiButton = __nuxt_component_1;
      const _component_TestsLanguageSelectModal = _sfc_main$1;
      const _component_UiNotification = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Мои тесты </h2><p class="text-sm text-gray-600 dark:text-gray-400 mt-1"> Назначенные вам тесты для прохождения </p></div></div><div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6"><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10"><svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Ожидают прохождения</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.pending)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">В процессе</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.inProgress)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"><svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Успешно пройдены</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.passed)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10"><svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Не пройдены</h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.failed)}</p></div></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6"><div class="flex flex-wrap gap-2"><!--[-->`);
      ssrRenderList(tabs.value, (tab) => {
        _push(`<button class="${ssrRenderClass([
          "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          activeTab.value === tab.value ? "bg-primary text-white shadow-sm" : "bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        ])}">${ssrInterpolate(tab.label)} `);
        if (tab.count > 0) {
          _push(`<span class="${ssrRenderClass([
            "ml-2 px-2 py-0.5 rounded-full text-xs",
            activeTab.value === tab.value ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-600"
          ])}">${ssrInterpolate(tab.count)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button>`);
      });
      _push(`<!--]--></div></div><div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">`);
      if (loading.value) {
        _push(`<div class="p-12 text-center"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div><p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка тестов...</p></div>`);
      } else if (filteredAssignments.value.length === 0) {
        _push(`<div class="p-12 text-center text-gray-500 dark:text-gray-400"><svg class="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><p class="text-lg font-medium">Тесты не найдены</p><p class="mt-2 text-sm">${ssrInterpolate(getEmptyMessage())}</p></div>`);
      } else {
        _push(`<div class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
        ssrRenderList(filteredAssignments.value, (assignment) => {
          _push(`<div class="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"><div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4"><div class="flex-1"><div class="flex items-start gap-4"><div class="${ssrRenderClass([
            "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl",
            getStatusBgClass(assignment)
          ])}"><svg class="${ssrRenderClass(["w-7 h-7", getStatusIconClass(assignment)])}" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
          if (assignment.has_active_session) {
            _push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>`);
          } else if (assignment.passed) {
            _push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`);
          } else if (assignment.best_score !== null && !assignment.passed) {
            _push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`);
          } else {
            _push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>`);
          }
          _push(`</svg></div><div class="flex-1"><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">${ssrInterpolate(assignment.template_name)}</h3><p class="text-sm text-gray-500 dark:text-gray-400 mb-3">${ssrInterpolate(assignment.group_name)} • ${ssrInterpolate(assignment.discipline_name || "Дисциплина не указана")}</p><div class="flex flex-wrap gap-3 text-sm"><span class="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${ssrInterpolate(assignment.questions_count || "?")} вопросов </span>`);
          if (assignment.time_limit) {
            _push(`<span class="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${ssrInterpolate(assignment.time_limit)} мин </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<span class="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> от ${ssrInterpolate(assignment.passing_score)}% </span>`);
          if (assignment.max_attempts) {
            _push(`<span class="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> ${ssrInterpolate(assignment.attempts_used || 0)}/${ssrInterpolate(assignment.max_attempts)} попыток </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div></div><div class="flex flex-col items-end gap-3"><div class="flex items-center gap-2"><span class="${ssrRenderClass(getStatusBadgeClass(assignment))}">${ssrInterpolate(getStatusLabel(assignment))}</span></div>`);
          if (assignment.event_date) {
            _push(`<div class="text-sm text-gray-500 dark:text-gray-400 text-right"><div class="font-medium">${ssrInterpolate(formatDate(assignment.event_date))}</div>`);
            if (assignment.start_date || assignment.end_date) {
              _push(`<div class="mt-1">`);
              if (assignment.start_date) {
                _push(`<span>${ssrInterpolate(formatTime(assignment.start_date))}</span>`);
              } else {
                _push(`<!---->`);
              }
              if (assignment.start_date && assignment.end_date) {
                _push(`<span> — </span>`);
              } else {
                _push(`<!---->`);
              }
              if (assignment.end_date) {
                _push(`<span>${ssrInterpolate(formatTime(assignment.end_date))}</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            } else if (assignment.event_time) {
              _push(`<div>${ssrInterpolate(assignment.event_time)}</div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          if (assignment.best_score !== null && assignment.best_score !== void 0) {
            _push(`<div class="text-right"><div class="text-sm text-gray-500 dark:text-gray-400">Лучший результат:</div><div class="${ssrRenderClass([
              "text-xl font-bold",
              assignment.passed ? "text-success" : "text-danger"
            ])}">${ssrInterpolate(Math.round(assignment.best_score))}% </div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (canTakeTest(assignment)) {
            _push(ssrRenderComponent(_component_UiButton, {
              onClick: ($event) => startTest(assignment),
              loading: startingTest.value === assignment.id,
              class: "mt-2"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"${_scopeId}></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg> ${ssrInterpolate(assignment.has_active_session ? "Продолжить" : "Начать тест")}`);
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
                        d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      }),
                      createVNode("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      })
                    ])),
                    createTextVNode(" " + toDisplayString(assignment.has_active_session ? "Продолжить" : "Начать тест"), 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else if (assignment.best_score !== null) {
            _push(ssrRenderComponent(_component_UiButton, {
              variant: "outline",
              onClick: ($event) => viewResults()
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"${_scopeId}></path></svg> Результаты `);
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
                        d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      })
                    ])),
                    createTextVNode(" Результаты ")
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_TestsLanguageSelectModal, {
        "is-open": showLanguageModal.value,
        "assignment-id": selectedAssignmentId.value,
        onClose: closeLanguageModal,
        onConfirm: handleLanguageConfirm
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/tests/my.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=my-CQ6hW7Bs.mjs.map
