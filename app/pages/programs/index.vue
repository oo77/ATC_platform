<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Section -->
    <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Учебные программы
          </h1>
          <p class="text-slate-500 font-medium">
            Управление курсами, дисциплинами и планами обучения
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UiButton v-if="canCreateCourses" variant="primary" size="sm" class="h-10 px-4 gap-2 font-bold shadow-sm" @click="navigateTo('/programs/create')">
            <Plus class="w-4 h-4" />
            Создать учебную программу
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Bento Box Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Всего программ</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.totalCourses }}</h3>
          </div>
          <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
            <BookOpen class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Активных программ</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.activeCourses }}</h3>
          </div>
          <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
            <CheckCircle class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Всего часов</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.totalHours }}</h3>
          </div>
          <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
            <Clock class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="mb-8 overflow-x-auto custom-scrollbar pb-2">
      <div class="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <nav class="flex gap-1" aria-label="Tabs">
          <button
            @click="filters.isArchived = false; loadCourses()"
            :class="['flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap', !filters.isArchived ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200']"
          >
            <BookOpen class="h-4 w-4" />
            Активные программы
          </button>
          <button
            @click="filters.isArchived = true; loadCourses()"
            :class="['flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap', filters.isArchived ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200']"
          >
            <Archive class="h-4 w-4" />
            Архив программ
          </button>
        </nav>
      </div>
    </div>

    <!-- Фильтры и поиск -->
    <!-- Фильтры и поиск -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Filter class="w-5 h-5" />
          </div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white">
            Фильтры
          </h4>
        </div>
        <button
          v-if="hasActiveFilters"
          @click="resetFilters"
          class="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10"
        >
          <RotateCcw class="w-4 h-4" />
          Сбросить фильтры
        </button>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Поиск -->
        <div class="relative max-w-xl">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Поиск по названию или коду программы..."
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium"
            @input="handleFilterChange"
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        <div class="flex flex-wrap gap-x-12 gap-y-6">
          <!-- Тип программы (Interactive Chips) -->
          <div class="space-y-3">
            <label class="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <BookOpen class="w-3.5 h-3.5" />
              Тип программы
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="filters.courseType = undefined; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                :class="filters.courseType === undefined ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
              >
                Все
              </button>
              <button
                @click="filters.courseType = 'КПП'; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                :class="filters.courseType === 'КПП' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
              >
                КПП (Первоначальная подготовка)
              </button>
              <button
                @click="filters.courseType = 'КПК'; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                :class="filters.courseType === 'КПК' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
              >
                КПК (Повышение квалификации)
              </button>
            </div>
          </div>

          <!-- Статус -->
          <div v-if="!filters.isArchived" class="space-y-3">
            <label class="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Activity class="w-3.5 h-3.5" />
              Статус
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="filters.isActive = undefined; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                :class="filters.isActive === undefined ? 'bg-slate-800 text-white shadow-md dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
              >
                Все
              </button>
              <button
                @click="filters.isActive = true; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
                :class="filters.isActive === true ? 'bg-success text-white shadow-md shadow-success/20' : 'bg-success/5 text-success hover:bg-success/10 border border-success/20'"
              >
                <span v-if="filters.isActive === true" class="w-1.5 h-1.5 rounded-full bg-white"></span>
                Активные
              </button>
              <button
                @click="filters.isActive = false; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
                :class="filters.isActive === false ? 'bg-slate-500 text-white shadow-md dark:bg-slate-400 dark:text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'"
              >
                Неактивные
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Список курсов -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <div class="mx-auto inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 font-bold text-slate-900 dark:text-white">
          Загрузка учебных программ...
        </p>
      </div>

      <div v-else-if="courses.length === 0" class="p-16 text-center">
        <div class="bg-slate-50 dark:bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen class="w-8 h-8 text-slate-300" />
        </div>
        <p class="text-lg font-bold text-slate-900 dark:text-white">Учебные программы не найдены</p>
        <p class="mt-2 text-slate-500 font-medium max-w-sm mx-auto">
          Создайте первую учебную программу, нажав кнопку "Создать учебную программу"
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Учебная программа</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Код</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Дисциплины</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Часы</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Статус</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="course in courses"
              :key="course.id"
              @click="viewCourse(course)"
              class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
            >
              <td class="px-6 py-4">
                <div>
                  <div class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {{ course.name }}
                  </div>
                  <div class="text-xs font-bold text-slate-500 mt-1">
                    {{ course.shortName }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                  {{ course.code }}
                </span>
              </td>
              <td class="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                {{ course.disciplineCount || 0 }}
              </td>
              <td class="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                {{ course.totalHours }} ч.
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest border"
                  :class="course.isActive ? 'bg-success/5 text-success border-success/20' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'"
                >
                  {{ course.isActive ? "Активна" : "Неактивна" }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Compact Pagination -->
      <div v-if="pagination.totalPages > 1" class="px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Показано {{ (pagination.page - 1) * pagination.limit + 1 }} - {{ Math.min(pagination.page * pagination.limit, pagination.total) }} из {{ pagination.total }}
        </span>
        <div class="flex gap-2">
          <UiButton
            variant="outline"
            size="sm"
            class="h-8 px-3"
            :disabled="pagination.page === 1"
            @click="changePage(pagination.page - 1)"
          >
            Назад
          </UiButton>
          <UiButton
            variant="outline"
            size="sm"
            class="h-8 px-3"
            :disabled="pagination.page >= pagination.totalPages"
            @click="changePage(pagination.page + 1)"
          >
            Вперед
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { definePageMeta, useAuthFetch, usePermissions, navigateTo } from "#imports";
import { Plus, BookOpen, CheckCircle, Clock, Archive, Filter, RotateCcw, Search, Activity, ChevronDown } from "lucide-vue-next";
import type { Course, CourseType } from "~/types/course";

// Определяем мета-данные страницы
definePageMeta({
  layout: "default",
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

const filters = ref<{
  search: string;
  isActive: boolean | undefined;
  isArchived: boolean;
  courseType: CourseType | undefined;
}>({
  search: "",
  isActive: undefined,
  isArchived: false,
  courseType: undefined,
});

// Статистика
const stats = computed(() => {
  return {
    totalCourses: pagination.value.total,
    activeCourses: courses.value.filter((c) => c.isActive).length,
    totalHours: courses.value.reduce((sum, c) => sum + c.totalHours, 0),
  };
});

// Проверка активных фильтров
const hasActiveFilters = computed(() => {
  return filters.value.search !== "" || filters.value.isActive !== undefined || filters.value.courseType !== undefined;
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
      params.append("search", filters.value.search);
    }

    if (filters.value.isActive !== undefined) {
      params.append("isActive", filters.value.isActive.toString());
    }

    if (filters.value.courseType) {
      params.append("courseType", filters.value.courseType);
    }

    params.append("isArchived", filters.value.isArchived.toString());

    const response = await authFetch<{
      success: boolean;
      courses: Course[];
      total: number;
      totalPages: number;
    }>(`/api/courses?${params.toString()}`);

    if (response.success && response.courses) {
      courses.value = response.courses;
      pagination.value.total = response.total;
      pagination.value.totalPages = response.totalPages;
    }
  } catch (error) {
    console.error("Ошибка загрузки курсов:", error);
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
  filters.value.search = "";
  filters.value.isActive = undefined;
  filters.value.courseType = undefined;
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
