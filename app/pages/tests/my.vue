<template>
  <!-- Обёртка без двойного отступа (отступы задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок страницы -->
    <UiPageHeader title="Мои тесты" description="Назначенные вам тесты для прохождения" />

    <!-- Метрики: одна плоская строка UiStat вместо 5 больших карточек с inline-SVG -->
    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      <UiStat label="Ожидают начала" :value="stats.notStarted" :icon="CalendarDays" />
      <UiStat label="Доступны сейчас" :value="stats.pending" :icon="Clock" tone="warning" />
      <UiStat label="В процессе" :value="stats.inProgress" :icon="PlayCircle" tone="primary" />
      <UiStat label="Успешно пройдены" :value="stats.passed" :icon="CheckCircle2" tone="success" />
      <UiStat label="Не пройдены" :value="stats.failed" :icon="XCircle" tone="danger" />
    </div>

    <!-- Фильтр по статусу: UiTabs со счётчиками вместо кнопок-таблеток -->
    <UiTabs v-model="activeTab" :tabs="tabItems" />

    <!-- Список тестов -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Загрузка тестов...</p>
      </div>

      <!-- Пусто: общий компонент -->
      <UiEmptyState
        v-else-if="filteredAssignments.length === 0"
        title="Тесты не найдены"
        :description="getEmptyMessage()"
      />

      <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="assignment in filteredAssignments"
          :key="assignment.id"
          class="p-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] md:p-5"
        >
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <!-- Информация о тесте -->
            <div class="flex-1">
              <div class="flex items-start gap-4">
                <!-- Иконка статуса: lucide вместо inline-SVG, цвета из прежних функций -->
                <div :class="['flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', getStatusBgClass(assignment)]">
                  <Clock v-if="assignment.has_active_session" :class="['h-5 w-5', getStatusIconClass(assignment)]" />
                  <CheckCircle2 v-else-if="assignment.passed" :class="['h-5 w-5', getStatusIconClass(assignment)]" />
                  <XCircle v-else-if="assignment.best_score !== null && !assignment.passed" :class="['h-5 w-5', getStatusIconClass(assignment)]" />
                  <FileText v-else :class="['h-5 w-5', getStatusIconClass(assignment)]" />
                </div>
                <div class="flex-1">
                  <div class="mb-1 flex flex-wrap items-center gap-2">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ assignment.template_name }}</h3>
                    <!-- Бейдж перездачи через UiBadge (без purple) -->
                    <UiBadge
                      v-if="assignment.original_event_id || assignment.allowed_student_ids"
                      size="sm"
                      color="info"
                      title="Тест для перездачи"
                    >
                      <RefreshCw class="h-3 w-3" />
                      Перездача
                    </UiBadge>
                  </div>
                  <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
                    {{ assignment.group_name }} •
                    {{ assignment.discipline_name || "Дисциплина не указана" }}
                  </p>

                  <!-- Метаданные теста -->
                  <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <span class="inline-flex items-center gap-1.5">
                      <HelpCircle class="h-4 w-4" />
                      {{ assignment.questions_count || "?" }} вопросов
                    </span>
                    <span v-if="assignment.time_limit" class="inline-flex items-center gap-1.5">
                      <Clock class="h-4 w-4" />
                      {{ assignment.time_limit }} мин
                    </span>
                    <span class="inline-flex items-center gap-1.5">
                      <CheckCircle2 class="h-4 w-4" />
                      от {{ assignment.passing_score }}%
                    </span>
                    <span v-if="assignment.max_attempts" class="inline-flex items-center gap-1.5">
                      <RefreshCw class="h-4 w-4" />
                      {{ assignment.attempts_used || 0 }}/{{ assignment.max_attempts }} попыток
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Статус и действия -->
            <div class="flex flex-col items-start gap-3 md:items-end">
              <span :class="getStatusBadgeClass(assignment)">{{ getStatusLabel(assignment) }}</span>

              <div v-if="assignment.event_date" class="text-sm text-gray-500 dark:text-gray-400 md:text-right">
                <div class="font-medium">{{ formatDate(assignment.event_date) }}</div>
                <div v-if="assignment.start_date || assignment.end_date" class="mt-1 text-xs font-medium text-primary">Весь день</div>
                <div v-else-if="assignment.event_time" class="mt-1">{{ assignment.event_time }}</div>
              </div>

              <!-- Результат, если завершён -->
              <div v-if="assignment.best_score !== null && assignment.best_score !== undefined" class="md:text-right">
                <div class="text-xs text-gray-500 dark:text-gray-400">Лучший результат</div>
                <div :class="['text-lg font-semibold', assignment.passed ? 'text-success' : 'text-danger']">
                  {{ Math.round(assignment.best_score) }}%
                </div>
              </div>

              <!-- Одно главное действие строки: «Начать/Продолжить», иначе вторичное «Результаты» -->
              <UiButton
                v-if="canTakeTest(assignment)"
                @click="startTest(assignment)"
                :loading="startingTest === assignment.id"
              >
                <PlayCircle class="mr-2 h-4 w-4" />
                {{ assignment.has_active_session ? "Продолжить" : "Начать тест" }}
              </UiButton>

              <UiButton v-else-if="assignment.best_score !== null" variant="outline" @click="viewResults(assignment)">
                <BarChart3 class="mr-2 h-4 w-4" />
                Результаты
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка выбора языка -->
    <TestsLanguageSelectModal
      :is-open="showLanguageModal"
      :assignment-id="selectedAssignmentId"
      @close="closeLanguageModal"
      @confirm="handleLanguageConfirm"
    />

    <!-- Уведомления -->
    <UiNotification
      v-if="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      @close="notification.show = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
// Иконки lucide вместо inline-SVG (единый набор для переработанного шаблона)
import { CalendarDays, Clock, PlayCircle, CheckCircle2, XCircle, FileText, RefreshCw, HelpCircle, BarChart3 } from "lucide-vue-next";

definePageMeta({
  layout: "default",
});

const { authFetch } = useAuthFetch();

// Utils (Moved up for usage in computed)
const parseLocalDateTime = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  // Если это строка
  if (typeof dateStr === "string") {
    // Если есть 'Z' — это UTC время, используем стандартный парсинг
    if (dateStr.includes("Z") || dateStr.includes("+")) {
      return new Date(dateStr);
    }

    // Если нет 'Z' — это локальное время (формат MySQL)
    const normalized = dateStr.replace("T", " ").trim();
    const parts = normalized.split(/[- :]/);

    if (parts.length >= 5) {
      return new Date(
        parseInt(parts[0]), // год
        parseInt(parts[1]) - 1, // месяц (0-indexed)
        parseInt(parts[2]), // день
        parseInt(parts[3]) || 0, // часы
        parseInt(parts[4]) || 0, // минуты
        parseInt(parts[5]) || 0 // секунды
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
    year: "numeric",
  });
};

const formatTime = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  const parsed = parseLocalDateTime(dateTimeStr);
  if (!parsed) return "";
  return parsed.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Состояние
const loading = ref(false);
const assignments = ref([]);
const activeTab = ref("all");
const startingTest = ref(null);

// Модалка выбора языка
const showLanguageModal = ref(false);
const selectedAssignmentId = ref(null);
const selectedAssignment = ref(null);

// Уведомления
const notification = ref({
  show: false,
  type: "success",
  title: "",
  message: "",
});

// Вкладки
const tabs = computed(() => [
  { value: "all", label: "Все тесты", count: assignments.value.length },
  {
    value: "not_started",
    label: "Ожидают начала",
    count: stats.value.notStarted,
  },
  { value: "pending", label: "Доступны сейчас", count: stats.value.pending },
  { value: "in_progress", label: "В процессе", count: stats.value.inProgress },
  {
    value: "completed",
    label: "Завершённые",
    count: stats.value.passed + stats.value.failed,
  },
]);

// Вкладки в формате UiTabs (id вместо value): прежний массив tabs не тронут, activeTab хранит те же значения
const tabItems = computed(() => tabs.value.map((t) => ({ id: t.value, label: t.label, count: t.count > 0 ? t.count : undefined })));

// Статистика
const stats = computed(() => {
  const now = new Date();

  // Тесты, которые еще не начались (start_date в будущем)
  const notStarted = assignments.value.filter((a) => {
    const startDate = parseLocalDateTime(a.start_date);
    const notStartedYet = startDate && startDate > now;

    // allow empty status for future tests if data inconsistency
    const isScheduled = !a.status || a.status === "scheduled";

    return isScheduled && !a.has_active_session && notStartedYet;
  }).length;

  // Тесты, доступные для прохождения сейчас
  const pending = assignments.value.filter((a) => {
    const isExpired = a.end_date && parseLocalDateTime(a.end_date) < now;
    const startDate = parseLocalDateTime(a.start_date);
    const notStartedYet = startDate && startDate > now;

    const isScheduled = !a.status || a.status === "scheduled";

    return (
      isScheduled &&
      !a.has_active_session &&
      (a.attempts_used || 0) < (a.max_attempts || 1) &&
      !isExpired &&
      !notStartedYet
    );
  }).length;

  const inProgress = assignments.value.filter(
    (a) => a.has_active_session || a.status === "in_progress"
  ).length;

  const passed = assignments.value.filter((a) => a.passed).length;

  // Failed includes: explicitly failed tests OR expired tests that were not passed
  const failed = assignments.value.filter((a) => {
    const isExpired = a.end_date && parseLocalDateTime(a.end_date) < now;
    const attemptsExhausted = (a.attempts_used || 0) >= (a.max_attempts || 1);
    return (
      !a.passed && (attemptsExhausted || isExpired) && !a.has_active_session
    );
  }).length;

  return { notStarted, pending, inProgress, passed, failed };
});

// Фильтрованный список
const filteredAssignments = computed(() => {
  if (activeTab.value === "all") {
    return assignments.value;
  }

  const now = new Date();

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

      return (
        isScheduled &&
        !a.has_active_session &&
        (a.attempts_used || 0) < (a.max_attempts || 1) &&
        !isExpired &&
        !notStartedYet
      );
    });
  }

  if (activeTab.value === "in_progress") {
    return assignments.value.filter(
      (a) => a.has_active_session || a.status === "in_progress"
    );
  }

  if (activeTab.value === "completed") {
    // Show passed OR failed (including expired)
    return assignments.value.filter((a) => {
      const isExpired =
        a.end_date && parseLocalDateTime(a.end_date) < new Date();
      const attemptsExhausted = (a.attempts_used || 0) >= (a.max_attempts || 1);
      const isFailed =
        !a.passed && (attemptsExhausted || isExpired) && !a.has_active_session;
      return a.passed || isFailed;
    });
  }

  return assignments.value;
});

// Загрузка данных
const loadAssignments = async () => {
  loading.value = true;
  try {
    const response = await authFetch("/api/tests/my");

    console.log("[Tests/My] Ответ API:", response);

    if (response.success) {
      assignments.value = response.assignments || [];
      console.log("[Tests/My] Загружено тестов:", assignments.value.length);

      // Логируем каждый тест для диагностики
      assignments.value.forEach((a, index) => {
        console.log(`[Tests/My] Тест ${index + 1}:`, {
          name: a.template_name,
          status: a.status,
          start_date: a.start_date,
          end_date: a.end_date,
          attempts_used: a.attempts_used,
          max_attempts: a.max_attempts,
          has_active_session: a.has_active_session,
          canTake: canTakeTest(a),
        });
      });
    } else {
      showNotification(
        "error",
        "Ошибка",
        response.message || "Не удалось загрузить тесты"
      );
    }
  } catch (error) {
    console.error("Ошибка загрузки тестов:", error);
    showNotification("error", "Ошибка", "Произошла ошибка при загрузке тестов");
  } finally {
    loading.value = false;
  }
};

// Начать тест
const startTest = async (assignment) => {
  // Если есть активная сессия - перейти к ней напрямую
  if (assignment.active_session_id) {
    startingTest.value = assignment.id;
    await navigateTo(`/tests/take/${assignment.active_session_id}`);
    startingTest.value = null;
    return;
  }

  // Открываем модалку выбора языка
  selectedAssignment.value = assignment;
  selectedAssignmentId.value = assignment.id;
  showLanguageModal.value = true;
};

// Закрытие модалки выбора языка
const closeLanguageModal = () => {
  showLanguageModal.value = false;
  selectedAssignmentId.value = null;
  selectedAssignment.value = null;
};

// Подтверждение выбора языка и старт теста
const handleLanguageConfirm = async (language) => {
  if (!selectedAssignment.value) return;

  startingTest.value = selectedAssignment.value.id;

  try {
    // Создаём новую сессию с выбранным языком
    const response = await authFetch("/api/tests/sessions/start", {
      method: "POST",
      body: {
        assignment_id: selectedAssignment.value.id,
        language: language,
      },
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

// Функции парсинга перемещены вверх

// Проверка возможности пройти тест
const canTakeTest = (assignment) => {
  const now = new Date();

  console.log(`[canTakeTest] ═══════════════════════════════════════`);
  console.log(`[canTakeTest] Проверка теста: "${assignment.template_name}"`);
  console.log(`[canTakeTest] Данные из API:`, {
    start_date_raw: assignment.start_date,
    status: assignment.status,
    attempts: `${assignment.attempts_used || 0}/${
      assignment.max_attempts || 1
    }`,
    has_active_session: assignment.has_active_session,
  });
  console.log(`[canTakeTest] Текущее время: ${now.toLocaleString()}`);

  // Если есть активная сессия - можно продолжить
  if (assignment.has_active_session) {
    console.log(`[canTakeTest] ✅ Есть активная сессия`);
    return true;
  }

  // Проверяем статус
  if (assignment.status === "cancelled" || assignment.status === "completed") {
    console.log(`[canTakeTest] ❌ Статус: ${assignment.status}`);
    return false;
  }

  // Проверяем попытки
  if ((assignment.attempts_used || 0) >= (assignment.max_attempts || 1)) {
    console.log(
      `[canTakeTest] ❌ Попытки исчерпаны: ${assignment.attempts_used}/${assignment.max_attempts}`
    );
    return false;
  }

  // Проверяем сроки ТОЛЬКО если start_date/end_date явно заданы
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

// Просмотр результатов
const viewResults = (assignment) => {
  navigateTo(`/tests/results/${assignment.id}`);
};

// Получение статуса
const getStatusLabel = (assignment) => {
  const now = new Date();

  // Тест в процессе
  if (assignment.has_active_session) return "В процессе";

  // Тест сдан
  if (assignment.passed) return "Сдан";

  // Проверяем срок - если просрочен, показываем "Просрочено"
  if (assignment.end_date) {
    const endDate = parseLocalDateTime(assignment.end_date);
    if (endDate && endDate < now && !assignment.passed) {
      return "Просрочено";
    }
  }

  // Проверяем попытки (если кончились и не сдан)
  if (
    (assignment.attempts_used || 0) >= (assignment.max_attempts || 1) &&
    !assignment.passed
  ) {
    return "Не сдан";
  }

  // Тест отменён
  if (assignment.status === "cancelled") return "Отменён";

  // Тест завершён админом
  if (assignment.status === "completed") return "Завершён";

  if (assignment.start_date) {
    const startDate = parseLocalDateTime(assignment.start_date);
    if (startDate && startDate > now) {
      return "Ожидает начала";
    }
  }

  // Тест доступен для прохождения
  return "Доступен";
};

const getStatusBadgeClass = (assignment) => {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium";
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

  // Доступен
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

// Функции форматирования даты перемещены вверх

// Уведомления
const showNotification = (type, title, message) => {
  notification.value = { show: true, type, title, message };
  setTimeout(() => {
    notification.value.show = false;
  }, 5000);
};

onMounted(() => {
  loadAssignments();
});
</script>
