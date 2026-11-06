<template>
  <!-- Обёртка без двойного отступа (отступы задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок страницы вместо h2 text-title-md2 -->
    <UiPageHeader title="Мои курсы" description="Курсы, на которые вы зачислены, и ваш прогресс" />

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Пустой список: общий компонент с подсказкой следующего шага -->
    <div v-else-if="courses.length === 0" class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <UiEmptyState title="Нет активных курсов" description="Вы пока не записаны ни на один курс. Обратитесь к администратору для зачисления." />
    </div>

    <!-- Список курсов: плоские карточки без теней -->
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="course in courses"
        :key="course.group_id"
        class="group relative flex flex-col rounded-xl border border-gray-200 bg-white transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700"
      >
        <div class="flex flex-1 flex-col p-5">
          <!-- Заголовок + статус в одной строке (статус больше не накладывается на заголовок) -->
          <div class="mb-4 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="mb-1 text-base font-semibold text-gray-900 transition-colors group-hover:text-primary dark:text-white">
                <NuxtLink :to="`/my-courses/${course.group_id}`">
                  {{ course.course_name }}
                </NuxtLink>
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Группа: {{ course.group_name }}</p>
            </div>
            <!-- Статус через общий UiBadge вместо самодельного span -->
            <UiBadge size="sm" :color="course.status === 'active' ? 'success' : course.status === 'completed' ? 'primary' : 'error'">
              {{ getStatusLabel(course.status) }}
            </UiBadge>
          </div>

          <!-- Информация -->
          <div class="mb-5 space-y-2">
            <div class="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
              <User class="h-4 w-4 shrink-0" />
              <span>{{ course.teacher_name || 'Преподаватель не назначен' }}</span>
            </div>
            <div class="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
              <CalendarDays class="h-4 w-4 shrink-0" />
              <span>{{ formatDate(course.start_date) }} — {{ formatDate(course.end_date) }}</span>
            </div>
          </div>

          <!-- Прогресс (прижат к низу) -->
          <div class="mt-auto">
            <div class="mb-1.5 flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900 dark:text-white">Прогресс</span>
              <span class="text-sm font-medium text-primary">{{ course.progress }}%</span>
            </div>
            <div class="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                class="absolute left-0 h-full rounded-full bg-primary transition-all duration-500"
                :style="{ width: `${course.progress}%` }"
              ></div>
            </div>
            <div class="mt-2 text-right text-xs text-gray-500 dark:text-gray-400">
              Посещено: {{ course.attended_lessons }} / {{ course.total_lessons }} занятий
            </div>
          </div>
        </div>

        <!-- Единственное главное действие карточки -->
        <NuxtLink
          :to="`/my-courses/${course.group_id}`"
          class="flex h-11 items-center justify-center gap-2 rounded-b-xl border-t border-gray-200 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 hover:text-primary dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.04]"
        >
          Перейти к обучению
          <ArrowRight class="h-4 w-4" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// Иконки lucide вместо inline-SVG (единый набор иконок)
import { User, CalendarDays, ArrowRight } from 'lucide-vue-next';

definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Мои курсы | TailAdmin',
});

const loading = ref(true);
const courses = ref([]);

const { authFetch } = useAuthFetch();

const fetchCourses = async () => {
  loading.value = true;
  try {
    const data = await authFetch('/api/students/my-courses');
    if (data) {
      courses.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    useNotification().error('Не удалось загрузить список курсов');
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'TBA';
  return new Date(dateStr).toLocaleDateString('ru-RU');
};

const getStatusLabel = (status) => {
  const map = {
    active: 'Активен',
    completed: 'Завершен',
    dropped: 'Отчислен'
  };
  return map[status] || status;
};

onMounted(() => {
  fetchCourses();
});
</script>

