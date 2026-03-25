<template>
  <div
    class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
        История проведенных занятий
      </h3>
      <button
        v-if="courseHistory.length === 0 && !loading && !error"
        @click="loadCourseHistory"
        class="text-sm text-primary hover:underline"
      >
        Загрузить историю
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div
        class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
      ></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-6">
      <p class="text-danger mb-3">{{ error }}</p>
      <button
        @click="loadCourseHistory"
        class="text-sm text-primary hover:underline"
      >
        Попробовать снова
      </button>
    </div>

    <!-- Course History Content -->
    <div v-else-if="courseHistory && courseHistory.length > 0">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th
                class="py-3 px-3 text-left font-medium text-gray-900 dark:text-gray-300"
              >
                Занятие / Дисциплина
              </th>
              <th
                class="py-3 px-3 text-left font-medium text-gray-900 dark:text-gray-300"
              >
                Группа / Курс
              </th>
              <th
                class="py-3 px-3 text-left font-medium text-gray-900 dark:text-gray-300"
              >
                Дата и время
              </th>
              <th
                class="py-3 px-3 text-center font-medium text-gray-900 dark:text-gray-300"
              >
                Тип
              </th>
              <th
                class="py-3 px-3 text-right font-medium text-gray-900 dark:text-gray-300"
              >
                Часы
              </th>
              <th
                class="py-3 px-3 text-center font-medium text-gray-900 dark:text-gray-300"
              >
                Прогресс / Посещаемость
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="event in courseHistory"
              :key="event.id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td class="py-3 px-3">
                <p class="font-medium text-black dark:text-white">{{ event.title || event.discipline?.name }}</p>
                <p class="text-xs text-gray-500" v-if="event.title && event.discipline?.name">{{ event.discipline.name }}</p>
              </td>
              <td class="py-3 px-3">
                <p class="font-medium text-black dark:text-white">{{ event.group?.code || '—' }}</p>
                <p class="text-xs text-gray-500 line-clamp-1" :title="event.group?.courseName">{{ event.group?.courseName || '—' }}</p>
              </td>
              <td class="py-3 px-3 text-gray-600 dark:text-gray-400">
                <div class="flex flex-col">
                  <span class="font-medium">{{ formatDate(event.date) }}</span>
                  <span class="text-xs">{{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}</span>
                </div>
              </td>
              <td class="py-3 px-3 text-center">
                <span
                  class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                  :class="{
                    'bg-primary/10 text-primary': event.eventType === 'theory',
                    'bg-warning/10 text-warning': event.eventType === 'practice',
                    'bg-danger/10 text-danger': event.eventType === 'assessment',
                    'bg-gray-100 text-gray-600': event.eventType === 'other'
                  }"
                >
                  {{ formatEventType(event.eventType) }}
                </span>
              </td>
              <td class="py-3 px-3 text-right">
                <span class="font-bold text-black dark:text-white">{{ event.academicHours }} ч.</span>
              </td>
              <td class="py-3 px-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <div class="h-2 w-16 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                    <div 
                      class="h-full rounded-full" 
                      :class="event.statistics?.completionPercent === 100 ? 'bg-success' : 'bg-primary'"
                      :style="{ width: `${event.statistics?.completionPercent || 0}%` }"
                    ></div>
                  </div>
                  <span class="text-xs font-medium">{{ event.statistics?.completionPercent || 0 }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Пагинация -->
      <UiPagination
        v-if="pagination.totalPages > 0"
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="loading"
        @update:page="handlePageChange"
        @update:limit="handleLimitChange"
      />
    </div>

    <!-- Initial / Empty State -->
    <div v-else class="text-center py-8">
      <div
        class="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center"
      >
        <svg
          class="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <p class="text-gray-600 dark:text-gray-400 mb-3">
        История занятий пуста или не загружена
      </p>
      <button
        @click="loadCourseHistory"
        class="inline-flex items-center justify-center rounded bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
      >
        Загрузить историю
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";

const props = defineProps<{
  instructorId: string;
  initialLoad?: boolean;
}>();

const { authFetch } = useAuthFetch();

interface CourseHistoryEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  eventType: "theory" | "practice" | "assessment" | "other";
  academicHours: number;
  group: {
    id: string;
    code: string;
    courseName: string;
  };
  discipline: {
    name: string;
  };
  statistics: {
    totalStudents: number;
    studentsMarked: number;
    studentsGraded: number;
    avgAttendanceHours: number;
    avgGrade: number | null;
    completionPercent: number;
  };
}

const courseHistory = ref<CourseHistoryEvent[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Пагинация
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const loadCourseHistory = async () => {
  if (!props.instructorId) return;

  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();
    params.append('page', pagination.value.page.toString());
    params.append('limit', pagination.value.limit.toString());

    const response = await authFetch<{
      success: boolean;
      history: CourseHistoryEvent[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/instructors/${props.instructorId}/course-history?${params.toString()}`);

    if (response.success) {
      courseHistory.value = response.history;
      pagination.value.total = response.total || 0;
      pagination.value.totalPages = response.totalPages || 0;
      pagination.value.page = response.page || 1;
      pagination.value.limit = response.limit || 10;
    }
  } catch (err: any) {
    console.error("Error loading course history:", err);
    error.value = "Не удалось загрузить историю курсов";
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.value.page = page;
  loadCourseHistory();
};

const handleLimitChange = (limit: number) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  loadCourseHistory();
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ru-RU");
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  return new Date(timeStr).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatEventType = (type: string) => {
  const map: Record<string, string> = {
    theory: "Теория",
    practice: "Практика",
    assessment: "Проверка знаний",
    other: "Другое",
  };
  return map[type] || type;
};

onMounted(() => {
  if (props.initialLoad && props.instructorId) {
    loadCourseHistory();
  }
});

defineExpose({
  load: loadCourseHistory,
  hasData: computed(() => courseHistory.value.length > 0),
});
</script>
