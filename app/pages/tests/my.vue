<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Мои тесты
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Назначенные вам тесты для прохождения
        </p>
      </div>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Ожидают прохождения</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.pending }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">В процессе</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.inProgress }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Успешно пройдены</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.passed }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
            <svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Не пройдены</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.failed }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Фильтр по статусу -->
    <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === tab.value
              ? 'bg-primary text-white shadow-sm'
              : 'bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          ]"
        >
          {{ tab.label }}
          <span 
            v-if="tab.count > 0"
            :class="[
              'ml-2 px-2 py-0.5 rounded-full text-xs',
              activeTab === tab.value
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 dark:bg-gray-600'
            ]"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Список тестов -->
    <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка тестов...</p>
      </div>

      <div v-else-if="filteredAssignments.length === 0" class="p-12 text-center text-gray-500 dark:text-gray-400">
        <svg class="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-lg font-medium">Тесты не найдены</p>
        <p class="mt-2 text-sm">{{ getEmptyMessage() }}</p>
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="assignment in filteredAssignments"
          :key="assignment.id"
          class="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <!-- Информация о тесте -->
            <div class="flex-1">
              <div class="flex items-start gap-4">
                <div :class="[
                  'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl',
                  getStatusBgClass(assignment)
                ]">
                  <svg :class="['w-7 h-7', getStatusIconClass(assignment)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <!-- В процессе -->
                    <path v-if="assignment.has_active_session" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <!-- Сдан -->
                    <path v-else-if="assignment.passed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <!-- Не сдан -->
                    <path v-else-if="assignment.best_score !== null && !assignment.passed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <!-- Ожидает -->
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {{ assignment.template_name }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {{ assignment.group_name }} • {{ assignment.discipline_name || 'Дисциплина не указана' }}
                  </p>
                  
                  <!-- Метаданные теста -->
                  <div class="flex flex-wrap gap-3 text-sm">
                    <span class="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ assignment.questions_count || '?' }} вопросов
                    </span>
                    <span v-if="assignment.time_limit" class="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ assignment.time_limit }} мин
                    </span>
                    <span class="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      от {{ assignment.passing_score }}%
                    </span>
                    <span v-if="assignment.max_attempts" class="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {{ assignment.attempts_used || 0 }}/{{ assignment.max_attempts }} попыток
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Статус и действия -->
            <div class="flex flex-col items-end gap-3">
              <div class="flex items-center gap-2">
                <span :class="getStatusBadgeClass(assignment)">
                  {{ getStatusLabel(assignment) }}
                </span>
              </div>

              <div v-if="assignment.event_date" class="text-sm text-gray-500 dark:text-gray-400 text-right">
                <div class="font-medium">{{ formatDate(assignment.event_date) }}</div>
                <div v-if="assignment.start_date || assignment.end_date" class="mt-1">
                  <span v-if="assignment.start_date">{{ formatTime(assignment.start_date) }}</span>
                  <span v-if="assignment.start_date && assignment.end_date"> — </span>
                  <span v-if="assignment.end_date">{{ formatTime(assignment.end_date) }}</span>
                </div>
                <div v-else-if="assignment.event_time">{{ assignment.event_time }}</div>
              </div>

              <!-- Результат если завершён -->
              <div v-if="assignment.best_score !== null && assignment.best_score !== undefined" class="text-right">
                <div class="text-sm text-gray-500 dark:text-gray-400">Лучший результат:</div>
                <div :class="[
                  'text-xl font-bold',
                  assignment.passed ? 'text-success' : 'text-danger'
                ]">
                  {{ Math.round(assignment.best_score) }}%
                </div>
              </div>

              <!-- Кнопка действия -->
              <UiButton
                v-if="canTakeTest(assignment)"
                @click="startTest(assignment)"
                :loading="startingTest === assignment.id"
                class="mt-2"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ assignment.has_active_session ? 'Продолжить' : 'Начать тест' }}
              </UiButton>

              <UiButton
                v-else-if="assignment.best_score !== null"
                variant="outline"
                @click="viewResults(assignment)"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
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
import { ref, computed, onMounted } from 'vue';

definePageMeta({
  layout: 'default',
});

const { authFetch } = useAuthFetch();

// Utils (Moved up for usage in computed)
const parseLocalDateTime = (dateStr) => {
  if (!dateStr) return null;
  
  // Если есть 'Z' — это UTC время, используем стандартный парсинг
  if (dateStr.includes('Z') || dateStr.includes('+')) {
    return new Date(dateStr);
  }
  
  // Если нет 'Z' — это локальное время (формат MySQL)
  const normalized = dateStr.replace('T', ' ').trim();
  const parts = normalized.split(/[- :]/);
  
  if (parts.length >= 5) {
    return new Date(
      parseInt(parts[0]),      // год
      parseInt(parts[1]) - 1,  // месяц (0-indexed)
      parseInt(parts[2]),      // день
      parseInt(parts[3]) || 0, // часы
      parseInt(parts[4]) || 0, // минуты
      parseInt(parts[5]) || 0  // секунды
    );
  }
  
  return new Date(dateStr);
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const parsed = parseLocalDateTime(dateTimeStr);
  if (!parsed) return '';
  return parsed.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Состояние
const loading = ref(false);
const assignments = ref([]);
const activeTab = ref('all');
const startingTest = ref(null);

// Модалка выбора языка
const showLanguageModal = ref(false);
const selectedAssignmentId = ref(null);
const selectedAssignment = ref(null);

// Уведомления
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
});

// Вкладки
const tabs = computed(() => [
  { value: 'all', label: 'Все тесты', count: assignments.value.length },
  { value: 'pending', label: 'Ожидают', count: stats.value.pending },
  { value: 'in_progress', label: 'В процессе', count: stats.value.inProgress },
  { value: 'completed', label: 'Завершённые', count: stats.value.passed + stats.value.failed },
]);

// Статистика
// Статистика
const stats = computed(() => {
  const now = new Date();
  
  const pending = assignments.value.filter(a => {
    const isExpired = a.end_date && parseLocalDateTime(a.end_date) < now;
    return a.status === 'scheduled' && !a.has_active_session && (a.attempts_used || 0) < (a.max_attempts || 1) && !isExpired;
  }).length;
  
  const inProgress = assignments.value.filter(a => 
    a.has_active_session || a.status === 'in_progress'
  ).length;
  
  const passed = assignments.value.filter(a => a.passed).length;
  
  // Failed includes: explicitly failed tests OR expired tests that were not passed
  const failed = assignments.value.filter(a => {
    const isExpired = a.end_date && parseLocalDateTime(a.end_date) < now;
    const attemptsExhausted = (a.attempts_used || 0) >= (a.max_attempts || 1);
    return !a.passed && (attemptsExhausted || isExpired) && !a.has_active_session;
  }).length;

  return { pending, inProgress, passed, failed };
});

// Фильтрованный список
const filteredAssignments = computed(() => {
  if (activeTab.value === 'all') {
    return assignments.value;
  }
  
  if (activeTab.value === 'pending') {
    return assignments.value.filter(a => 
      a.status === 'scheduled' && !a.has_active_session && (a.attempts_used || 0) < (a.max_attempts || 1)
    );
  }
  
  if (activeTab.value === 'in_progress') {
    return assignments.value.filter(a => 
      a.has_active_session || a.status === 'in_progress'
    );
  }
  
  if (activeTab.value === 'completed') {
    // Show passed OR failed (including expired)
    return assignments.value.filter(a => {
        const isExpired = a.end_date && parseLocalDateTime(a.end_date) < new Date();
        const attemptsExhausted = (a.attempts_used || 0) >= (a.max_attempts || 1);
        const isFailed = !a.passed && (attemptsExhausted || isExpired) && !a.has_active_session;
        return a.passed || isFailed;
    });
  }
  
  return assignments.value;
});

// Загрузка данных
const loadAssignments = async () => {
  loading.value = true;
  try {
    const response = await authFetch('/api/tests/my');
    
    console.log('[Tests/My] Ответ API:', response);
    
    if (response.success) {
      assignments.value = response.assignments || [];
      console.log('[Tests/My] Загружено тестов:', assignments.value.length);
      
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
          canTake: canTakeTest(a)
        });
      });
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось загрузить тесты');
    }
  } catch (error) {
    console.error('Ошибка загрузки тестов:', error);
    showNotification('error', 'Ошибка', 'Произошла ошибка при загрузке тестов');
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
    const response = await authFetch('/api/tests/sessions/start', {
      method: 'POST',
      body: { 
        assignment_id: selectedAssignment.value.id,
        language: language,
      },
    });

    if (response.success) {
      closeLanguageModal();
      await navigateTo(`/tests/take/${response.session.id}`);
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось начать тест');
    }
  } catch (error) {
    console.error('Ошибка начала теста:', error);
    showNotification('error', 'Ошибка', 'Произошла ошибка при начале теста');
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
    attempts: `${assignment.attempts_used || 0}/${assignment.max_attempts || 1}`,
    has_active_session: assignment.has_active_session
  });
  console.log(`[canTakeTest] Текущее время: ${now.toLocaleString()}`);
  
  // Если есть активная сессия - можно продолжить
  if (assignment.has_active_session) {
    console.log(`[canTakeTest] ✅ Есть активная сессия`);
    return true;
  }
  
  // Проверяем статус
  if (assignment.status === 'cancelled' || assignment.status === 'completed') {
    console.log(`[canTakeTest] ❌ Статус: ${assignment.status}`);
    return false;
  }
  
  // Проверяем попытки
  if ((assignment.attempts_used || 0) >= (assignment.max_attempts || 1)) {
    console.log(`[canTakeTest] ❌ Попытки исчерпаны: ${assignment.attempts_used}/${assignment.max_attempts}`);
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
  // TODO: Страница результатов
  showNotification('info', 'В разработке', 'Страница результатов находится в разработке');
};


// Получение статуса
const getStatusLabel = (assignment) => {
  const now = new Date();
  
  // Тест в процессе
  if (assignment.has_active_session) return 'В процессе';
  
  // Тест сдан
  if (assignment.passed) return 'Сдан';
  
  // Тест не сдан (если просрочен или попытки кончились и не сдан)
  // Проверяем срок
  if (assignment.end_date) {
    const endDate = parseLocalDateTime(assignment.end_date);
    if (endDate && endDate < now && !assignment.passed) {
      return 'Не сдан';
    }
  }
  
  // Проверяем попытки (если кончились и не сдан)
  if ((assignment.attempts_used || 0) >= (assignment.max_attempts || 1) && !assignment.passed) {
      return 'Не сдан';
  }
  
  // Тест отменён
  if (assignment.status === 'cancelled') return 'Отменён';
  
  // Тест завершён админом
  if (assignment.status === 'completed') return 'Завершён';
  
  if (assignment.start_date) {
    const startDate = parseLocalDateTime(assignment.start_date);
    if (startDate && startDate > now) {
      return 'Ожидает начала';
    }
  }
  
  // Тест доступен для прохождения
  return 'Доступен';
};

const getStatusBadgeClass = (assignment) => {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium';
  const label = getStatusLabel(assignment);
  
  if (label === 'В процессе') return `${base} bg-primary/10 text-primary`;
  if (label === 'Сдан') return `${base} bg-success/10 text-success`;
  if (label === 'Не сдан') return `${base} bg-danger/10 text-danger`;
  if (label === 'Отменён') return `${base} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400`;
  if (label === 'Ожидает начала') return `${base} bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400`;
  if (label === 'Завершён') return `${base} bg-primary/10 text-primary`;
  
  // Доступен
  return `${base} bg-success/10 text-success`;
};

const getStatusBgClass = (assignment) => {
  if (assignment.has_active_session) return 'bg-primary/10';
  if (assignment.passed) return 'bg-success/10';
  const label = getStatusLabel(assignment);
  if (label === 'Не сдан') return 'bg-danger/10';
  return 'bg-warning/10';
};

const getStatusIconClass = (assignment) => {
  if (assignment.has_active_session) return 'text-primary';
  if (assignment.passed) return 'text-success';
  const label = getStatusLabel(assignment);
  if (label === 'Не сдан') return 'text-danger';
  return 'text-warning';
};

const getEmptyMessage = () => {
  switch (activeTab.value) {
    case 'pending': return 'Нет тестов, ожидающих прохождения';
    case 'in_progress': return 'Нет тестов в процессе прохождения';
    case 'completed': return 'Вы ещё не завершили ни одного теста';
    default: return 'Вам пока не назначено ни одного теста';
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
