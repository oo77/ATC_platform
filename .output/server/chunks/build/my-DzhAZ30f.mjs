import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { _ as _sfc_main$1 } from './LanguageSelectModal-CH8tSNVs.mjs';
import { _ as __nuxt_component_4 } from './Notification-CQvvdM2O.mjs';
import { ref, computed, mergeProps, withCtx, createBlock, createTextVNode, openBlock, createVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderComponent } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';
import { n as navigateTo } from './server.mjs';
import './Modal-DQYphXo7.mjs';
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
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main = {
  __name: "my",
  __ssrInlineRender: true,
  setup(__props) {
    const { authFetch } = useAuthFetch();
    const parseLocalDateTime = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr instanceof Date) return dateStr;
      if (typeof dateStr === "string") {
        if (dateStr.includes("Z") || dateStr.includes("+")) {
          return new Date(dateStr);
        }
        const normalized = dateStr.replace("T", " ").trim();
        const parts = normalized.split(/[- :]/);
        if (parts.length >= 5) {
          return new Date(
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
        }
      }
      return new Date(dateStr);
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
      {
        value: "not_started",
        label: "Ожидают начала",
        count: stats.value.notStarted
      },
      { value: "pending", label: "Доступны сейчас", count: stats.value.pending },
      { value: "in_progress", label: "В процессе", count: stats.value.inProgress },
      {
        value: "completed",
        label: "Завершённые",
        count: stats.value.passed + stats.value.failed
      }
    ]);
    const stats = computed(() => {
      const now = /* @__PURE__ */ new Date();
      const notStarted = assignments.value.filter((a) => {
        const startDate = parseLocalDateTime(a.start_date);
        const notStartedYet = startDate && startDate > now;
        const isScheduled = !a.status || a.status === "scheduled";
        return isScheduled && !a.has_active_session && notStartedYet;
      }).length;
      const pending = assignments.value.filter((a) => {
        const isExpired = a.end_date && parseLocalDateTime(a.end_date) < now;
        const startDate = parseLocalDateTime(a.start_date);
        const notStartedYet = startDate && startDate > now;
        const isScheduled = !a.status || a.status === "scheduled";
        return isScheduled && !a.has_active_session && (a.attempts_used || 0) < (a.max_attempts || 1) && !isExpired && !notStartedYet;
      }).length;
      const inProgress = assignments.value.filter(
        (a) => a.has_active_session || a.status === "in_progress"
      ).length;
      const passed = assignments.value.filter((a) => a.passed).length;
      const failed = assignments.value.filter((a) => {
        const isExpired = a.end_date && parseLocalDateTime(a.end_date) < now;
        const attemptsExhausted = (a.attempts_used || 0) >= (a.max_attempts || 1);
        return !a.passed && (attemptsExhausted || isExpired) && !a.has_active_session;
      }).length;
      return { notStarted, pending, inProgress, passed, failed };
    });
    const filteredAssignments = computed(() => {
      if (activeTab.value === "all") {
        return assignments.value;
      }
      const now = /* @__PURE__ */ new Date();
      if (activeTab.value === "not_started") {
        return assignments.value.filter((a) => {
          const startDate = parseLocalDateTime(a.start_date);
          const notStartedYet = startDate && startDate > now;
          const isScheduled = !a.status || a.status === "scheduled";
          return isScheduled && !a.has_active_session && notStartedYet;
        });
      }
      if (activeTab.value === "pending") {
        return assignments.value.filter((a) => {
          const isExpired = a.end_date && parseLocalDateTime(a.end_date) < now;
          const startDate = parseLocalDateTime(a.start_date);
          const notStartedYet = startDate && startDate > now;
          const isScheduled = !a.status || a.status === "scheduled";
          return isScheduled && !a.has_active_session && (a.attempts_used || 0) < (a.max_attempts || 1) && !isExpired && !notStartedYet;
        });
      }
      if (activeTab.value === "in_progress") {
        return assignments.value.filter(
          (a) => a.has_active_session || a.status === "in_progress"
        );
      }
      if (activeTab.value === "completed") {
        return assignments.value.filter((a) => {
          const isExpired = a.end_date && parseLocalDateTime(a.end_date) < /* @__PURE__ */ new Date();
          const attemptsExhausted = (a.attempts_used || 0) >= (a.max_attempts || 1);
          const isFailed = !a.passed && (attemptsExhausted || isExpired) && !a.has_active_session;
          return a.passed || isFailed;
        });
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
          showNotification(
            "error",
            "Ошибка",
            response.message || "Не удалось начать тест"
          );
        }
      } catch (error) {
        console.error("Ошибка начала теста:", error);
        showNotification("error", "Ошибка", "Произошла ошибка при начале теста");
      } finally {
        startingTest.value = null;
      }
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
        console.log(
          `[canTakeTest] ❌ Попытки исчерпаны: ${assignment.attempts_used}/${assignment.max_attempts}`
        );
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
      showNotification(
        "info",
        "В разработке",
        "Страница результатов находится в разработке"
      );
    };
    const getStatusLabel = (assignment) => {
      const now = /* @__PURE__ */ new Date();
      if (assignment.has_active_session) return "В процессе";
      if (assignment.passed) return "Сдан";
      if (assignment.end_date) {
        const endDate = parseLocalDateTime(assignment.end_date);
        if (endDate && endDate < now && !assignment.passed) {
          return "Просрочено";
        }
      }
      if ((assignment.attempts_used || 0) >= (assignment.max_attempts || 1) && !assignment.passed) {
        return "Не сдан";
      }
      if (assignment.status === "cancelled") return "Отменён";
      if (assignment.status === "completed") return "Завершён";
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
      const label = getStatusLabel(assignment);
      if (label === "В процессе") return `${base} bg-primary/10 text-primary`;
      if (label === "Сдан") return `${base} bg-success/10 text-success`;
      if (label === "Просрочено") return `${base} bg-warning/10 text-warning`;
      if (label === "Не сдан") return `${base} bg-danger/10 text-danger`;
      if (label === "Отменён")
        return `${base} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400`;
      if (label === "Ожидает начала")
        return `${base} bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400`;
      if (label === "Завершён") return `${base} bg-primary/10 text-primary`;
      return `${base} bg-success/10 text-success`;
    };
    const getStatusBgClass = (assignment) => {
      if (assignment.has_active_session) return "bg-primary/10";
      if (assignment.passed) return "bg-success/10";
      const label = getStatusLabel(assignment);
      if (label === "Просрочено") return "bg-warning/10";
      if (label === "Не сдан") return "bg-danger/10";
      return "bg-warning/10";
    };
    const getStatusIconClass = (assignment) => {
      if (assignment.has_active_session) return "text-primary";
      if (assignment.passed) return "text-success";
      const label = getStatusLabel(assignment);
      if (label === "Просрочено") return "text-warning";
      if (label === "Не сдан") return "text-danger";
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" }, _attrs))}><div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="text-title-md2 font-bold text-black dark:text-white"> Мои тесты </h2><p class="text-sm text-gray-600 dark:text-gray-400 mt-1"> Назначенные вам тесты для прохождения </p></div></div><div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6"><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"><svg class="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> Ожидают начала </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.notStarted)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10"><svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> Доступны сейчас </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.pending)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> В процессе </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.inProgress)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"><svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> Успешно пройдены </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.passed)}</p></div></div></div><div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10"><svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><h3 class="text-sm font-medium text-gray-600 dark:text-gray-400"> Не пройдены </h3><p class="text-2xl font-bold text-black dark:text-white">${ssrInterpolate(stats.value.failed)}</p></div></div></div></div><div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6"><div class="flex flex-wrap gap-2"><!--[-->`);
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
          _push(`</svg></div><div class="flex-1"><div class="flex items-center gap-2 mb-1"><h3 class="text-lg font-semibold text-gray-900 dark:text-white">${ssrInterpolate(assignment.template_name)}</h3>`);
          if (assignment.original_event_id || assignment.allowed_student_ids) {
            _push(`<span class="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300" title="Тест для перездачи"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Перездача </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><p class="text-sm text-gray-500 dark:text-gray-400 mb-3">${ssrInterpolate(assignment.group_name)} • ${ssrInterpolate(assignment.discipline_name || "Дисциплина не указана")}</p><div class="flex flex-wrap gap-3 text-sm"><span class="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${ssrInterpolate(assignment.questions_count || "?")} вопросов </span>`);
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
            _push(`<div class="text-right"><div class="text-sm text-gray-500 dark:text-gray-400"> Лучший результат: </div><div class="${ssrRenderClass([
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
//# sourceMappingURL=my-DzhAZ30f.mjs.map
