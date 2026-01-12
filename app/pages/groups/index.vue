<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Учебные группы
      </h2>
      <UiButton v-if="canCreateGroups" @click="showCreateModal = true" class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Создать группу
      </UiButton>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Всего групп</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.total }}</p>
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
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Активных</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.active }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Завершённых</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.completed }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Слушателей</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.totalStudents }}</p>
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

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Поиск -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Поиск
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Код группы, курс..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              @input="handleFilterChange"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Фильтр по курсу -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Учебная программа
          </label>
          <div class="relative">
            <select
              v-model="filters.courseId"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
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
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
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
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              @change="handleFilterChange"
            >
              <option :value="undefined">Все</option>
              <option :value="true">Активные</option>
              <option :value="false">Неактивные</option>
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Список групп -->
    <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка учебных групп...</p>
      </div>

      <div v-else-if="groups.length === 0" class="p-12 text-center text-gray-500 dark:text-gray-400">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p class="mt-4 text-lg font-medium">Учебные группы не найдены</p>
        <p class="mt-2">Создайте первую группу, нажав кнопку "Создать группу"</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Группа
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Учебная программа
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Даты обучения
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Слушатели
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Аудитория
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Статус
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="group in groups"
              :key="group.id"
              @click="viewGroup(group)"
              class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {{ group.code.substring(0, 2).toUpperCase() }}
                  </div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ group.code }}</div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div v-if="group.course">
                  <div class="font-medium text-gray-900 dark:text-white">{{ group.course.shortName }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{{ group.course.name }}</div>
                </div>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm">
                  <div class="text-gray-900 dark:text-white">{{ formatDate(group.startDate) }}</div>
                  <div class="text-gray-500 dark:text-gray-400">— {{ formatDate(group.endDate) }}</div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-sm font-medium text-gray-800 dark:text-gray-200">
                  {{ group.studentCount || 0 }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                {{ group.classroom || '—' }}
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    getStatusClass(group)
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
      <div v-if="pagination.totalPages > 1" class="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Показано <span class="font-medium">{{ ((pagination.page - 1) * pagination.limit) + 1 }}</span>
            -
            <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
            из
            <span class="font-medium">{{ pagination.total }}</span>
            групп
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

    <!-- Модальное окно создания группы -->
    <GroupsGroupFormModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @created="handleGroupCreated"
    />
  </div>
</template>

<script setup lang="ts">
import type { StudyGroup } from '~/types/group';
import type { Course } from '~/types/course';

definePageMeta({
  layout: 'default',
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
  search: '',
  courseId: '',
  isActive: undefined as boolean | undefined,
});

// Computed
const hasActiveFilters = computed(() => {
  return filters.value.search !== '' || filters.value.courseId !== '' || filters.value.isActive !== undefined;
});

// Methods
const loadGroups = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (filters.value.search) {
      params.append('search', filters.value.search);
    }

    if (filters.value.courseId) {
      params.append('courseId', filters.value.courseId);
    }

    if (filters.value.isActive !== undefined) {
      params.append('isActive', filters.value.isActive.toString());
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
    console.error('Ошибка загрузки групп:', error);
  } finally {
    loading.value = false;
  }
};

const loadCourses = async () => {
  try {
    const response = await authFetch<{ success: boolean; courses: Course[] }>('/api/courses', {
      params: { limit: 1000, isActive: true },
    });

    if (response.success && response.courses) {
      courses.value = response.courses;
    }
  } catch (error) {
    console.error('Error loading courses:', error);
  }
};

const handleFilterChange = () => {
  pagination.value.page = 1;
  loadGroups();
};

const resetFilters = () => {
  filters.value.search = '';
  filters.value.courseId = '';
  filters.value.isActive = undefined;
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
  // Если это строка в формате YYYY-MM-DD, парсим вручную
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const datePart = date.split('T')[0];
    const parts = datePart?.split('-').map(Number);
    if (parts && parts.length >= 3) {
      const [year, month, day] = parts as [number, number, number];
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }
  // Иначе используем обычное преобразование
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getStatusClass = (group: StudyGroup): string => {
  const today = new Date();
  const endDate = new Date(group.endDate);
  const startDate = new Date(group.startDate);

  if (!group.isActive) {
    return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  }

  if (endDate < today) {
    return 'bg-warning/10 text-warning';
  }

  if (startDate > today) {
    return 'bg-info/10 text-info';
  }

  return 'bg-success/10 text-success';
};

const getStatusText = (group: StudyGroup): string => {
  const today = new Date();
  const endDate = new Date(group.endDate);
  const startDate = new Date(group.startDate);

  if (!group.isActive) {
    return 'Неактивна';
  }

  if (endDate < today) {
    return 'Завершена';
  }

  if (startDate > today) {
    return 'Ожидает';
  }

  return 'Активна';
};

// Initialize
onMounted(() => {
  loadGroups();
  loadCourses();
});
</script>
