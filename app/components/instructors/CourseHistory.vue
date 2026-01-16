<template>
  <div
    class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
        История курсов
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
                class="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400"
              >
                Курс
              </th>
              <th
                class="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400"
              >
                Группа
              </th>
              <th
                class="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400"
              >
                Период
              </th>
              <th
                class="py-2 px-3 text-right font-medium text-gray-600 dark:text-gray-400"
              >
                Отработано
              </th>
              <th
                class="py-2 px-3 text-center font-medium text-gray-600 dark:text-gray-400"
              >
                Статус
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="course in courseHistory"
              :key="course.id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td class="py-2 px-3 font-medium text-gray-900 dark:text-white">
                {{ course.name }}
              </td>
              <td class="py-2 px-3 text-gray-600 dark:text-gray-400">
                {{ course.groupName }}
              </td>
              <td class="py-2 px-3 text-gray-600 dark:text-gray-400">
                {{ formatDate(course.startDate) }} -
                {{ formatDate(course.endDate) }}
              </td>
              <td class="py-2 px-3 text-right">
                <span class="font-medium">{{ course.hoursWorked }} ч.</span>
              </td>
              <td class="py-2 px-3 text-center">
                <span
                  class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                  :class="{
                    'bg-success/10 text-success': course.status === 'completed',
                    'bg-primary/10 text-primary': course.status === 'active',
                    'bg-warning/10 text-warning': course.status === 'upcoming',
                  }"
                >
                  {{ formatStatus(course.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
        История курсов пуста или не загружена
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

interface CourseHistoryItem {
  id: string;
  name: string;
  groupName: string;
  startDate: string;
  endDate: string;
  hoursWorked: number;
  status: string;
}

const courseHistory = ref<CourseHistoryItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const loadCourseHistory = async () => {
  if (!props.instructorId) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await authFetch<{
      success: boolean;
      history: CourseHistoryItem[];
    }>(`/api/instructors/${props.instructorId}/course-history`);

    if (response.success) {
      courseHistory.value = response.history;
    }
  } catch (err: any) {
    console.error("Error loading course history:", err);
    error.value = "Не удалось загрузить историю курсов";
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ru-RU");
};

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    active: "Активен",
    completed: "Завершен",
    upcoming: "Скоро",
    archived: "В архиве",
  };
  return map[status] || status;
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
