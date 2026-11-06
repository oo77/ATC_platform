<template>
  <!-- Обёртка без двойного отступа (отступы задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Курс не найден: общий пустой экран со ссылкой назад -->
    <div v-else-if="!course" class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <UiEmptyState title="Курс не найден" description="Возможно, у вас нет доступа к этому курсу.">
        <template #actions>
          <UiButton to="/my-courses" variant="outline" size="sm">К списку курсов</UiButton>
        </template>
      </UiEmptyState>
    </div>

    <div v-else class="space-y-4">
      <!-- Единый заголовок с хлебными крошками вместо крупной ссылки «Назад» -->
      <UiPageHeader
        :title="course.info.course_name"
        :breadcrumbs="[{ label: 'Мои курсы', to: '/my-courses' }, { label: course.info.group_name }]"
      >
        <!-- Статус рядом с заголовком через UiBadge -->
        <template #badge>
          <UiBadge size="sm" :color="course.info.status === 'active' ? 'success' : course.info.status === 'completed' ? 'primary' : 'error'">
            {{ getStatusLabel(course.info.status) }}
          </UiBadge>
        </template>
        <!-- Мета-строка: группа, преподаватель, даты (убран дубль в правой колонке) -->
        <template #meta>
          <span>Группа: {{ course.info.group_name }}</span>
          <span>{{ course.info.teacher_name || 'Преподаватель не назначен' }}</span>
          <span>{{ formatDate(course.info.start_date) }} — {{ formatDate(course.info.end_date) }}</span>
        </template>
      </UiPageHeader>

      <!-- Прогресс обучения: компактная плоская карточка -->
      <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-900 dark:text-white">Прогресс обучения</span>
          <span class="text-sm font-medium text-primary">{{ course.info.progress }}%</span>
        </div>
        <div class="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div class="absolute left-0 h-full rounded-full bg-primary" :style="{ width: `${course.info.progress}%` }"></div>
        </div>
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Посещено: {{ course.info.attended_lessons }} / {{ course.info.total_lessons }} занятий
        </div>
      </div>

      <!-- Вкладки: UiTabs со счётчиками вместо старого стиля TailAdmin (кнопки-таблетки) -->
      <div class="flex flex-col gap-4">
        <UiTabs v-model="activeTab" :tabs="tabItems" />

        <!-- Содержимое вкладок -->
        <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

          <!-- Расписание / План -->
          <div v-show="activeTab === 'schedule'" class="p-5">
            <div class="space-y-4">
              <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Программа курса</h3>

              <div v-if="course.schedule.length === 0" class="text-sm text-gray-500 dark:text-gray-400">Расписание пока не составлено</div>

              <div v-for="(lesson, index) in course.schedule" :key="lesson.id"
                class="relative ml-3 flex gap-4 border-l border-gray-200 pb-6 pl-6 last:pb-0 dark:border-gray-700"
              >
                <!-- Маркер статуса -->
                <div class="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border border-white dark:border-gray-900"
                  :class="{
                    'bg-success': lesson.attendance_status === 'present',
                    'bg-danger': lesson.attendance_status === 'absent',
                    'bg-warning': lesson.attendance_status === 'late',
                    'bg-primary': lesson.attendance_status === 'excused',
                    'bg-gray-300 dark:bg-gray-600': !lesson.attendance_status && isPast(lesson.start_time),
                    'bg-blue-400': !lesson.attendance_status && !isPast(lesson.start_time)
                  }"
                ></div>

                <div class="flex-1">
                  <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                      {{ lesson.title }}
                      <!-- Тип занятия через UiBadge вместо самодельного span -->
                      <UiBadge v-if="lesson.event_type !== 'theory'" size="sm" color="light" class="ml-2">
                        {{ getEventTypeLabel(lesson.event_type) }}
                      </UiBadge>
                    </h4>
                    <span class="text-sm font-medium" :class="isPast(lesson.start_time) ? 'text-gray-500 dark:text-gray-400' : 'text-primary'">
                      {{ formatDateTime(lesson.start_time) }}
                    </span>
                  </div>

                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ lesson.description || 'Нет описания' }}</p>

                  <!-- Оценки и посещаемость -->
                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <UiBadge
                      v-if="lesson.attendance_status"
                      size="sm"
                      :color="lesson.attendance_status === 'present' ? 'success' : lesson.attendance_status === 'absent' ? 'error' : lesson.attendance_status === 'late' ? 'warning' : 'primary'"
                    >
                      {{ getAttendanceLabel(lesson.attendance_status) }}
                    </UiBadge>
                    <UiBadge v-else-if="isPast(lesson.start_time)" size="sm" color="light">Нет статуса</UiBadge>

                    <UiBadge v-if="lesson.grade !== null" size="sm" color="info">
                      Оценка: {{ lesson.grade }} / {{ lesson.max_grade || 100 }}
                    </UiBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Тесты -->
          <div v-show="activeTab === 'tests'" class="p-5">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Тестирование</h3>
              <NuxtLink to="/tests/my" class="text-sm text-primary hover:underline">Все мои тесты</NuxtLink>
            </div>

            <div v-if="testsLoading" class="flex justify-center py-10">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>

            <!-- Пусто: общий компонент вместо inline-SVG -->
            <UiEmptyState v-else-if="tests.length === 0" title="Тесты пока не назначены" />

            <div v-else class="grid gap-4 md:grid-cols-2">
              <div v-for="test in tests" :key="test.id"
                class="rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700"
              >
                <div class="mb-3 flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h4 class="text-base font-semibold text-gray-900 dark:text-white">{{ test.template_name }}</h4>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ test.discipline_name || 'Основной курс' }}</span>
                  </div>
                  <!-- Статус теста: класс из прежней функции getTestStatusClass сохранён -->
                  <span :class="['shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', getTestStatusClass(test.status, test.passed)]">
                    {{ getTestStatusLabel(test.status, test.passed) }}
                  </span>
                </div>

                <div class="mb-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div v-if="test.end_date" class="flex items-center gap-2">
                    <Clock class="h-4 w-4" />
                    <span>Дедлайн: {{ formatDateTime(test.end_date) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <CheckCircle2 class="h-4 w-4" />
                    <span>Попыток: {{ test.attempts_used }} / {{ test.max_attempts }}</span>
                  </div>
                  <div v-if="test.best_score !== null" class="flex items-center gap-2">
                    <Zap class="h-4 w-4" />
                    <span :class="test.passed ? 'font-medium text-success' : 'font-medium text-danger'">
                      Результат: {{ test.best_score }}% {{ test.passed ? '(Сдан)' : '(Не сдан)' }}
                    </span>
                  </div>
                </div>

                <!-- Одно главное действие карточки — через UiButton -->
                <UiButton v-if="test.status === 'in_progress'" :to="`/tests/session/${test.active_session_id}`" block>
                  Продолжить попытку
                </UiButton>
                <UiButton v-else-if="canTakeTest(test)" :to="`/tests/start/${test.id}`" block>
                  Начать тест
                </UiButton>
                <UiButton v-else variant="secondary" block disabled>Недоступен</UiButton>
              </div>
            </div>
          </div>

          <!-- Документы / Сертификаты -->
          <div v-show="activeTab === 'documents'" class="p-5">
            <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Сертификаты и документы</h3>

            <UiEmptyState v-if="certificates.length === 0" title="Документов пока нет" />

            <div class="grid gap-4 md:grid-cols-2">
              <div v-for="cert in certificates" :key="cert.id"
                class="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                    <FileText class="h-5 w-5" />
                  </div>
                  <div class="min-w-0">
                    <h4 class="truncate text-sm font-medium text-gray-900 dark:text-white">Сертификат {{ cert.certificate_number }}</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Выдан: {{ formatDate(cert.issue_date) }}</p>
                  </div>
                </div>

                <UiButton :to="`/certificates/view/${cert.uuid || ''}`" size="sm" target="_blank">Скачать</UiButton>
              </div>
            </div>
          </div>

          <!-- Журнал -->
          <div v-show="activeTab === 'grades'">
            <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Успеваемость</h3>
            </div>
            <div class="max-h-[60vh] max-w-full overflow-auto">
              <table class="w-full table-auto text-sm">
                <!-- Sticky-шапка таблицы: заголовки видны при прокрутке -->
                <thead class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                  <tr class="text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    <th class="min-w-[220px] px-4 py-3">Занятие</th>
                    <th class="min-w-[150px] px-4 py-3">Дата</th>
                    <th class="min-w-[120px] px-4 py-3">Посещаемость</th>
                    <th class="px-4 py-3">Оценка</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="gradedLessons.length === 0">
                    <td colspan="4" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Оценок пока нет</td>
                  </tr>
                  <tr v-for="lesson in gradedLessons" :key="lesson.id" class="border-t border-gray-100 dark:border-gray-800">
                    <td class="px-4 py-3">
                      <h5 class="font-medium text-gray-900 dark:text-white">{{ lesson.title }}</h5>
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{ getEventTypeLabel(lesson.event_type) }}</span>
                    </td>
                    <td class="px-4 py-3 text-gray-900 dark:text-white">{{ formatDate(lesson.start_time) }}</td>
                    <td class="px-4 py-3">
                      <UiBadge
                        size="sm"
                        :color="lesson.attendance_status === 'present' ? 'success' : lesson.attendance_status === 'absent' ? 'error' : lesson.attendance_status === 'late' ? 'warning' : lesson.attendance_status === 'excused' ? 'primary' : 'light'"
                      >
                        {{ getAttendanceLabel(lesson.attendance_status) || '-' }}
                      </UiBadge>
                    </td>
                    <td class="px-4 py-3">
                      <span v-if="lesson.grade !== null" class="font-semibold text-gray-900 dark:text-white">
                        {{ lesson.grade }} / {{ lesson.max_grade || 100 }}
                      </span>
                      <span v-else class="text-gray-400">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
// Иконки lucide вместо inline-SVG (единый набор)
import { Clock, CheckCircle2, Zap, FileText } from 'lucide-vue-next';

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const groupId = route.params.id;

// State
const loading = ref(true);
const course = ref(null);
const activeTab = ref('schedule');
const tests = ref([]);
const certificates = ref([]);
const testsLoading = ref(false);

const tabs = [
  { id: 'schedule', label: 'Программа обучения' },
  { id: 'tests', label: 'Тесты' },
  { id: 'documents', label: 'Документы' },
  { id: 'grades', label: 'Журнал оценок' },
];

// Вкладки для UiTabs: добавлены счётчики тестов и документов (раньше рисовались вручную внутри кнопок)
const tabItems = computed(() => tabs.map((t) => ({
  ...t,
  count: t.id === 'tests' && tests.value.length > 0 ? tests.value.length
    : t.id === 'documents' && certificates.value.length > 0 ? certificates.value.length
    : undefined,
})));

// Computed
const gradedLessons = computed(() => {
  if (!course.value || !course.value.schedule) return [];
  return course.value.schedule.filter((l) => isPast(l.start_time) || l.grade !== null);
});

// Fetch
const { authFetch } = useAuthFetch();

const fetchCourseDetails = async () => {
  loading.value = true;
  try {
    const data = await authFetch(`/api/students/my-courses/${groupId}`);
    if (data) {
      course.value = data;
      useHead({
        title: `${data.info.course_name} | Занятия`,
      });
      
      // Загружаем связанные данные
      fetchRelatedData();
    }
  } catch (error) {
    console.error('Failed to fetch course details:', error);
    useNotification().error('Курс не найден');
  } finally {
    loading.value = false;
  }
};

const fetchRelatedData = async () => {
    testsLoading.value = true;
    try {
        // Fetch tests
        const testsResponse = await authFetch('/api/tests/my');
        if (testsResponse && testsResponse.assignments) {
            // Фильтруем тесты, относящиеся к этой группе
            tests.value = testsResponse.assignments.filter(t => String(t.group_id) === String(groupId));
        }
        
        // Fetch certificates
        const certsResponse = await authFetch('/api/certificates/my');
        if (certsResponse && certsResponse.certificates) {
            certificates.value = certsResponse.certificates.filter(c => String(c.group_id) === String(groupId));
        }
    } catch (e) {
        console.error("Error fetching related data", e);
    } finally {
        testsLoading.value = false;
    }
}

// Utils
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusLabel = (status) => {
  const map = {
    active: 'Активен',
    completed: 'Завершен',
    dropped: 'Отчислен'
  };
  return map[status] || status;
};

const getEventTypeLabel = (type) => {
  const map = {
    theory: 'Лекция',
    practice: 'Практика',
    assessment: 'Тест/Экзамен',
    other: 'Другое'
  };
  return map[type] || type;
};

const getAttendanceLabel = (status) => {
  const map = {
    present: 'Присутствовал',
    absent: 'Пропуск',
    late: 'Опоздание',
    excused: 'Ув. причина'
  };
  return map[status] || status;
};

const isPast = (dateStr) => {
  return new Date(dateStr) < new Date();
};

const getTestStatusLabel = (status, passed) => {
    if (status === 'completed') return passed ? 'Сдан' : 'Не сдан';
    if (status === 'in_progress') return 'В процессе';
    return 'Назначен';
}

const getTestStatusClass = (status, passed) => {
    if (status === 'completed') return passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger';
    if (status === 'in_progress') return 'bg-warning/10 text-warning';
    return 'bg-primary/10 text-primary';
}

const canTakeTest = (test) => {
  const now = new Date();
  if (test.status === 'completed' && test.attempts_used >= test.max_attempts) return false;
  if (test.start_date && new Date(test.start_date) > now) return false;
  if (test.end_date && new Date(test.end_date) < now) return false;
  return true;
}

onMounted(() => {
  fetchCourseDetails();
});
</script>
