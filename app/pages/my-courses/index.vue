<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Мои курсы
      </h2>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Пустой список -->
    <div v-else-if="courses.length === 0" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white px-5 pt-6 pb-2.5 shadow-md dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div class="flex flex-col items-center justify-center py-12">
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <svg class="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-2">Нет активных курсов</h3>
        <p class="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Вы пока не записаны ни на один курс. Обратитесь к администратору для зачисления.
        </p>
      </div>
    </div>

    <!-- Список курсов -->
    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <div 
        v-for="course in courses" 
        :key="course.group_id"
        class="group relative flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md transition-all hover:shadow-lg dark:bg-boxdark"
      >
        <!-- Статус курса (бэдж) -->
        <div class="absolute top-4 right-4 z-10">
          <span 
            :class="[
              'rounded-full px-3 py-1 text-xs font-medium',
              course.status === 'active' ? 'bg-success/10 text-success' : 
              course.status === 'completed' ? 'bg-primary/10 text-primary' : 
              'bg-danger/10 text-danger'
            ]"
          >
            {{ getStatusLabel(course.status) }}
          </span>
        </div>

        <div class="p-6 flex-1 flex flex-col">
          <!-- Заголовок -->
          <div class="mb-4">
            <h3 class="text-xl font-bold text-black dark:text-white mb-1 group-hover:text-primary transition-colors">
              <NuxtLink :to="`/my-courses/${course.group_id}`">
                {{ course.course_name }}
              </NuxtLink>
            </h3>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Группа: {{ course.group_name }}
            </p>
          </div>

          <!-- Информация -->
          <div class="mb-6 space-y-3">
             <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{{ course.teacher_name || 'Преподаватель не назначен' }}</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{{ formatDate(course.start_date) }} — {{ formatDate(course.end_date) }}</span>
            </div>
          </div>

          <!-- Прогресс (прижат к низу) -->
          <div class="mt-auto">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium text-black dark:text-white">Прогресс</span>
              <span class="text-sm font-medium text-primary">{{ course.progress }}%</span>
            </div>
            <div class="relative h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div 
                class="absolute left-0 h-full rounded-full bg-primary transition-all duration-500"
                :style="{ width: `${course.progress}%` }"
              ></div>
            </div>
            <div class="mt-2 text-xs text-gray-500 text-right">
              Посещено: {{ course.attended_lessons }} / {{ course.total_lessons }} занятий
            </div>
          </div>
        </div>
        
        <!-- Кнопка действия -->
        <NuxtLink 
          :to="`/my-courses/${course.group_id}`"
          class="flex items-center justify-center border-t border-gray-200 dark:border-gray-700 bg-gray-50 p-4 font-medium text-black transition hover:bg-gray-100 hover:text-primary dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          Перейти к обучению
          <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

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

