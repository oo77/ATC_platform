<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Section -->
    <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Учебные группы
          </h1>
          <p class="text-slate-500 font-medium">
            Управление контингентом слушателей и расписанием
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UiButton v-if="canCreateGroups" variant="primary" size="sm" class="h-10 px-4 gap-2 font-bold shadow-sm" @click="showCreateModal = true">
            <Plus class="w-4 h-4" />
            Создать группу
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Bento Box Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Всего групп</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.total }}</h3>
          </div>
          <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
            <Users class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Активных</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.active }}</h3>
          </div>
          <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
            <CheckCircle class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Завершённых</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.completed }}</h3>
          </div>
          <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
            <Archive class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Слушателей</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.totalStudents }}</h3>
          </div>
          <div class="rounded-xl bg-info/10 p-3 text-info transition-transform group-hover:rotate-12">
            <GraduationCap class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="mb-8 overflow-x-auto custom-scrollbar pb-2">
      <div class="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <nav class="flex gap-1" aria-label="Tabs">
          <button
            @click="filters.isArchived = false; loadGroups()"
            :class="['flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap', !filters.isArchived ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200']"
          >
            <Users class="h-4 w-4" />
            Текущие группы
          </button>
          <button
            @click="filters.isArchived = true; loadGroups()"
            :class="['flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap', filters.isArchived ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200']"
          >
            <Archive class="h-4 w-4" />
            Архив групп
          </button>
        </nav>
      </div>
    </div>

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
            placeholder="Поиск по коду группы..."
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium"
            @input="handleFilterChange"
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Программа -->
          <div class="space-y-3">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <BookOpen class="w-3.5 h-3.5" />
              Учебная программа
            </label>
            <div class="relative">
              <select
                v-model="filters.courseId"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none font-medium text-sm"
                @change="handleFilterChange"
              >
                <option value="">Все программы</option>
                <option
                  v-for="course in courses"
                  :key="course.id"
                  :value="course.id"
                >
                  {{ course.shortName }} - {{ course.name }}
                </option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <!-- Период обучения -->
          <div class="space-y-3 lg:col-span-2">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <CalendarDays class="w-3.5 h-3.5" />
              Период обучения
            </label>
            <div class="grid grid-cols-2 gap-4">
              <div class="relative">
                <input
                  v-model="filters.startDateFrom"
                  type="date"
                  class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 text-sm font-medium"
                  @change="handleFilterChange"
                  title="Обучение с"
                />
              </div>
              <div class="relative">
                <input
                  v-model="filters.startDateTo"
                  type="date"
                  class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 text-sm font-medium"
                  @change="handleFilterChange"
                  title="Обучение по"
                />
              </div>
            </div>
          </div>

          <!-- Статус -->
          <div v-if="!filters.isArchived" class="space-y-3 lg:col-span-3">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <Activity class="w-3.5 h-3.5" />
              Статус активности
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

    <!-- Список групп -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <!-- Загрузка -->
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-slate-500 font-medium tracking-wide">
          Загрузка учебных групп...
        </p>
      </div>

      <!-- Пустой список -->
      <div
        v-else-if="groups.length === 0"
        class="py-20 px-6 text-center text-slate-500 dark:text-slate-400"
      >
        <div class="bg-slate-50 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users class="h-10 w-10 text-slate-400" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Учебные группы не найдены</h3>
        <p v-if="!filters.isArchived" class="max-w-md mx-auto text-slate-500">
          Создайте первую группу, нажав кнопку "Создать группу" в правом верхнем углу
        </p>
        <p v-else class="max-w-md mx-auto text-slate-500">В архиве пока нет групп</p>
      </div>

      <!-- Таблица -->
      <div v-else class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Группа</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Учебная программа</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Даты обучения</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Слушатели</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Статус</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="group in groups"
              :key="group.id"
              @click="viewGroup(group)"
              class="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <td class="px-6 py-4 align-middle">
                <div class="flex items-center gap-4">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold shadow-inner border border-primary/10">
                    {{ group.code.substring(0, 2).toUpperCase() }}
                  </div>
                  <div>
                    <h5 class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {{ group.code }}
                    </h5>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 align-middle">
                <div v-if="group.course" class="space-y-1">
                  <div class="font-bold text-slate-900 dark:text-white">
                    {{ group.course.shortName }}
                  </div>
                  <div class="text-sm font-medium text-slate-500 truncate max-w-xs" :title="group.course.name">
                    {{ group.course.name }}
                  </div>
                </div>
                <span v-else class="text-slate-400 font-medium">—</span>
              </td>
              <td class="px-6 py-4 align-middle">
                <div class="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays class="w-4 h-4 text-slate-400 shrink-0" />
                  <div class="flex flex-col">
                    <span class="text-slate-900 dark:text-white">{{ formatDate(group.startDate) }}</span>
                    <span class="text-slate-500">— {{ formatDate(group.endDate) }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 align-middle text-center">
                <span class="inline-flex items-center justify-center min-w-10 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                  {{ group.studentCount || 0 }}
                </span>
              </td>
              <td class="px-6 py-4 align-middle text-right">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase',
                    getStatusClass(group),
                  ]"
                >
                  {{ getStatusText(group) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Пагинация -->
      <div
        v-if="pagination.totalPages > 1"
        class="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium text-slate-500">
            Показано
            <span class="font-bold text-slate-900 dark:text-white">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
            -
            <span class="font-bold text-slate-900 dark:text-white">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
            из
            <span class="font-bold text-slate-900 dark:text-white">{{ pagination.total }}</span>
          </div>
          <div class="flex gap-2">
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page === 1"
              class="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
            >
              Назад
            </button>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
            >
              Вперёд
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания группы -->
    <GroupsGroupFormModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @created="handleGroupCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { Plus, Users, CheckCircle, Clock, Archive, Filter, RotateCcw, Search, BookOpen, Activity, ChevronDown, GraduationCap, CalendarDays } from "lucide-vue-next";
import type { StudyGroup } from "~/types/group";
import type { Course } from "~/types/course";

definePageMeta({
  layout: "default",
});

const { authFetch } = useAuthFetch();
const router = useRouter();
const { canCreateGroups } = usePermissions();

// State
const loading = ref(false);
const groups = ref<StudyGroup[]>([]);
const courses = ref<Course[]>([]);
const showCreateModal = ref(false);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});
const stats = ref({
  total: 0,
  active: 0,
  completed: 0,
  totalStudents: 0,
});
const filters = ref({
  search: "",
  courseId: "",
  isActive: undefined as boolean | undefined,
  isArchived: false,
  startDateFrom: "",
  startDateTo: "",
});

// Computed
const hasActiveFilters = computed(() => {
  return (
    filters.value.search !== "" ||
    filters.value.courseId !== "" ||
    filters.value.isActive !== undefined ||
    filters.value.startDateFrom !== "" ||
    filters.value.startDateTo !== ""
  );
});

// Methods
const loadGroups = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
      isArchived: filters.value.isArchived.toString(),
    });

    if (filters.value.search) {
      params.append("search", filters.value.search);
    }

    if (filters.value.courseId) {
      params.append("courseId", filters.value.courseId);
    }

    if (filters.value.isActive !== undefined) {
      params.append("isActive", filters.value.isActive.toString());
    }

    if (filters.value.startDateFrom) {
      params.append("startDateFrom", filters.value.startDateFrom);
    }

    if (filters.value.startDateTo) {
      params.append("startDateTo", filters.value.startDateTo);
    }

    const response = await authFetch<{
      success: boolean;
      groups: StudyGroup[];
      total: number;
      totalPages: number;
      stats: typeof stats.value;
    }>(`/api/groups?${params.toString()}`);

    if (response.success) {
      groups.value = response.groups;
      pagination.value.total = response.total;
      pagination.value.totalPages = response.totalPages;
      if (response.stats) {
        stats.value = response.stats;
      }
    }
  } catch (error) {
    console.error("Ошибка загрузки групп:", error);
  } finally {
    loading.value = false;
  }
};

const loadCourses = async () => {
  try {
    const response = await authFetch<{ success: boolean; courses: Course[] }>(
      "/api/courses",
      {
        params: { limit: 1000, isActive: true },
      },
    );

    if (response.success && response.courses) {
      courses.value = response.courses;
    }
  } catch (error) {
    console.error("Error loading courses:", error);
  }
};

const handleFilterChange = () => {
  pagination.value.page = 1;
  loadGroups();
};

const resetFilters = () => {
  filters.value.search = "";
  filters.value.courseId = "";
  filters.value.isActive = undefined;
  filters.value.startDateFrom = "";
  filters.value.startDateTo = "";
  pagination.value.page = 1;
  loadGroups();
};

const changePage = (page: number) => {
  pagination.value.page = page;
  loadGroups();
};

const viewGroup = (group: StudyGroup) => {
  router.push(`/groups/${group.id}`);
};

const handleGroupCreated = () => {
  showCreateModal.value = false;
  loadGroups();
};

const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getStatusClass = (group: StudyGroup): string => {
  if (group.isArchived) {
    return "bg-gray-100 dark:bg-gray-700 text-gray-500";
  }

  const today = new Date();
  const endDate = new Date(group.endDate);
  const startDate = new Date(group.startDate);

  if (!group.isActive) {
    return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
  }

  if (endDate < today) {
    return "bg-warning/10 text-warning";
  }

  if (startDate > today) {
    return "bg-info/10 text-info";
  }

  return "bg-success/10 text-success";
};

const getStatusText = (group: StudyGroup): string => {
  if (group.isArchived) {
    return "Архив";
  }

  const today = new Date();
  const endDate = new Date(group.endDate);
  const startDate = new Date(group.startDate);

  if (!group.isActive) {
    return "Неактивна";
  }

  if (endDate < today) {
    return "Завершена";
  }

  if (startDate > today) {
    return "Ожидает";
  }

  return "Активна";
};

// Initialize
onMounted(() => {
  loadGroups();
  loadCourses();
});
</script>
