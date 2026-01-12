<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Учебные программы
      </h2>
      <UiButton v-if="canCreateCourses" @click="navigateTo('/programs/create')" class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Создать учебную программу
      </UiButton>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Всего программ</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.totalCourses }}</p>
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
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Активных программ</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.activeCourses }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Всего часов</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.totalHours }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Фильтры и поиск -->
    <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h4 class="text-lg font-semibold text-black dark:text-white">Фильтры</h4>
        <button
          v-if="hasActiveFilters"
          @click="resetFilters"
          class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Сбросить фильтры
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Поиск -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Поиск
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Название, код курса..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              @input="handleFilterChange"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Статус -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Статус
          </label>
          <div class="relative">
            <select
              v-model="filters.isActive"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              @change="handleFilterChange"
            >
              <option :value="undefined">Все</option>
              <option :value="true">Активные</option>
              <option :value="false">Неактивные</option>
            </select>
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Список курсов -->
    <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка учебных программ...</p>
      </div>

      <div v-else-if="courses.length === 0" class="p-12 text-center text-gray-500 dark:text-gray-400">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p class="mt-4 text-lg font-medium">Учебные программы не найдены</p>
        <p class="mt-2">Создайте первую учебную программу, нажав кнопку "Создать учебную программу"</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Учебная программа
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Код
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Дисциплины
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Часы
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Статус
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="course in courses"
              :key="course.id"
              @click="viewCourse(course)"
              class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <td class="px-6 py-4">
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ course.name }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ course.shortName }}</div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                  {{ course.code }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                {{ course.disciplineCount || 0 }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                {{ course.totalHours }}
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    course.isActive
                      ? 'bg-success/10 text-success'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  ]"
                >
                  {{ course.isActive ? 'Активна' : 'Неактивна' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Пагинация -->
      <div v-if="pagination.totalPages > 1" class="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Показано <span class="font-medium">{{ ((pagination.page - 1) * pagination.limit) + 1 }}</span>
            -
            <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
            из
            <span class="font-medium">{{ pagination.total }}</span>
            программ
          </div>
          <div class="flex gap-2">
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page === 1"
              class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Назад
            </button>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Вперёд
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Course } from '~/types/course';

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
});

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();
const { canCreateCourses } = usePermissions();

// Состояние
const loading = ref(false);
const courses = ref<Course[]>([]);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const filters = ref({
  search: '',
  isActive: undefined as boolean | undefined,
});

// Статистика
const stats = computed(() => {
  return {
    totalCourses: pagination.value.total,
    activeCourses: courses.value.filter(c => c.isActive).length,
    totalHours: courses.value.reduce((sum, c) => sum + c.totalHours, 0),
  };
});

// Проверка активных фильтров
const hasActiveFilters = computed(() => {
  return filters.value.search !== '' || filters.value.isActive !== undefined;
});

// Загрузка курсов
const loadCourses = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (filters.value.search) {
      params.append('search', filters.value.search);
    }

    if (filters.value.isActive !== undefined) {
      params.append('isActive', filters.value.isActive.toString());
    }

    const response = await authFetch(`/api/courses?${params.toString()}`);
    
    if (response.success) {
      courses.value = response.courses;
      pagination.value.total = response.total;
      pagination.value.totalPages = response.totalPages;
    }
  } catch (error) {
    console.error('Ошибка загрузки курсов:', error);
  } finally {
    loading.value = false;
  }
};

// Обработчики
const handleFilterChange = () => {
  pagination.value.page = 1;
  loadCourses();
};

const resetFilters = () => {
  filters.value.search = '';
  filters.value.isActive = undefined;
  pagination.value.page = 1;
  loadCourses();
};

const changePage = (page: number) => {
  pagination.value.page = page;
  loadCourses();
};

const viewCourse = (course: Course) => {
  navigateTo(`/programs/${course.id}`);
};

// Инициализация
onMounted(() => {
  loadCourses();
});
</script>
