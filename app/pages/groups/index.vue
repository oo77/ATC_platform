<template>
  <!-- Внешний враппер без двойного отступа: отступы уже задаёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Заголовок страницы: единый UiPageHeader вместо самописного h1; одно главное действие — «Создать группу» -->
    <UiPageHeader title="Учебные группы" description="Управление контингентом слушателей и расписанием">
      <template #actions>
        <UiButton v-if="canCreateGroups" variant="primary" size="md" :start-icon="Plus" @click="showCreateModal = true">
          Создать группу
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Метрики одной строкой: 4 плоские карточки вместо крупных bento-блоков, чтобы таблица была выше сгиба -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <UiStat label="Всего групп" :value="stats.total" :icon="Users" tone="primary" />
      <UiStat label="Активных" :value="stats.active" :icon="CheckCircle" tone="success" />
      <UiStat label="Завершённых" :value="stats.completed" :icon="Archive" tone="warning" />
      <UiStat label="Слушателей" :value="stats.totalStudents" :icon="GraduationCap" tone="info" />
    </div>

    <!-- Вкладки «Текущие / Архив»: UiTabs вместо самописного переключателя; при смене сбрасываем страницу и грузим список -->
    <UiTabs :model-value="activeTab" :tabs="groupTabs" @change="handleTabChange" />

    <!-- Единый блок фильтров: поиск (debounce 300 мс), сегмент статуса, программа и даты в раскрывающейся панели, чипы и сброс -->
    <UiFilterBar
      v-model:search="filters.search"
      search-placeholder="Поиск по коду группы..."
      :debounce="300"
      :segments="statusSegments"
      :segment="statusSegment"
      :chips="filterChips"
      :active-count="activeFilterCount"
      :total="pagination.total"
      persist-key="groups-list"
      @search="handleFilterChange"
      @update:segment="handleStatusSegment"
      @remove="handleChipRemove"
      @reset="resetFilters"
    >
      <!-- Второстепенные фильтры: программа и период обучения (подписи 12px, контролы h-9) -->
      <template #filters>
        <label class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Учебная программа</span>
          <select
            v-model="filters.courseId"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            @change="handleFilterChange"
          >
            <option value="">Все программы</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.shortName }} - {{ course.name }}
            </option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Обучение с</span>
          <input
            v-model="filters.startDateFrom"
            type="date"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
            @change="handleFilterChange"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Обучение по</span>
          <input
            v-model="filters.startDateTo"
            type="date"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
            @change="handleFilterChange"
          />
        </label>
      </template>
    </UiFilterBar>

    <!-- Карточка списка: единый стиль карточки, внутри — таблица и пагинация-футер -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <!-- Загрузка -->
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-sm text-gray-500">Загрузка учебных групп...</p>
      </div>

      <!-- Пустой список: UiEmptyState с подсказкой следующего шага -->
      <UiEmptyState
        v-else-if="groups.length === 0"
        :icon="Users"
        title="Учебные группы не найдены"
        :description="filters.isArchived ? 'В архиве пока нет групп' : 'Создайте первую группу кнопкой «Создать группу» вверху страницы'"
      />

      <!-- Таблица: sticky-шапка внутри контейнера с max-h, строка кликабельна (как и раньше) -->
      <div v-else class="custom-scrollbar max-h-[calc(100vh-22rem)] min-h-[240px] overflow-auto">
        <table class="w-full border-collapse text-left">
          <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Группа</th>
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Учебная программа</th>
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Даты обучения</th>
              <th class="whitespace-nowrap px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Слушатели</th>
              <th class="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Статус</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="group in groups"
              :key="group.id"
              class="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
              @click="viewGroup(group)"
            >
              <!-- Код группы с компактным аватаром (40px вместо 48px) -->
              <td class="px-4 py-3 align-middle">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/10 text-sm font-semibold text-primary">
                    {{ group.code.substring(0, 2).toUpperCase() }}
                  </div>
                  <span class="font-semibold text-gray-900 transition-colors group-hover:text-primary dark:text-white">
                    {{ group.code }}
                  </span>
                </div>
              </td>
              <!-- Программа: короткое имя + полное (усечённое) -->
              <td class="px-4 py-3 align-middle">
                <div v-if="group.course" class="space-y-0.5">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{{ group.course.shortName }}</div>
                  <div class="max-w-xs truncate text-sm text-gray-500 dark:text-gray-400" :title="group.course.name">
                    {{ group.course.name }}
                  </div>
                </div>
                <span v-else class="text-gray-400">—</span>
              </td>
              <!-- Даты: одна строка «с — по», меньше высоты строки -->
              <td class="px-4 py-3 align-middle">
                <div class="flex items-center gap-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  <CalendarDays class="h-4 w-4 shrink-0 text-gray-400" />
                  <span>{{ formatDate(group.startDate) }} — {{ formatDate(group.endDate) }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-center align-middle">
                <span class="inline-flex min-w-9 items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium tabular-nums text-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
                  {{ group.studentCount || 0 }}
                </span>
              </td>
              <!-- Статус: без CAPS, шрифт не меньше 12px -->
              <td class="px-4 py-3 text-right align-middle">
                <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', getStatusClass(group)]">
                  {{ getStatusText(group) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Пагинация: UiPagination в футере карточки вместо самописных «Назад/Вперёд» -->
      <div v-if="!loading && groups.length > 0" class="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
        <UiPagination
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          :total="pagination.total"
          :limit="pagination.limit"
          @update:page="changePage"
          @update:limit="changeLimit"
        />
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
// Оставлены только иконки, реально используемые в новом шаблоне
import { Plus, Users, CheckCircle, Archive, GraduationCap, CalendarDays } from "lucide-vue-next";
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

// --- Презентационные добавки для UiTabs / UiFilterBar (логика загрузки не менялась) ---

// Активная вкладка вычисляется из существующего filters.isArchived
const activeTab = computed(() => (filters.value.isArchived ? "archive" : "current"));
const groupTabs = [
  { id: "current", label: "Текущие группы", icon: Users },
  { id: "archive", label: "Архив групп", icon: Archive },
];

// Смена вкладки: прежний вызов loadGroups + сброс страницы, чтобы не остаться на несуществующей странице
const handleTabChange = (id: string) => {
  filters.value.isArchived = id === "archive";
  pagination.value.page = 1;
  loadGroups();
};

// Сегмент статуса показываем только для текущих групп (как и раньше блок «Статус» был скрыт в архиве)
const statusSegments = computed(() =>
  filters.value.isArchived
    ? undefined
    : [
        { value: "all", label: "Все" },
        { value: "active", label: "Активные" },
        { value: "inactive", label: "Неактивные" },
      ],
);
// Преобразуем tri-state filters.isActive в значение сегмента
const statusSegment = computed(() =>
  filters.value.isActive === undefined ? "all" : filters.value.isActive ? "active" : "inactive",
);
const handleStatusSegment = (v: string | number | boolean) => {
  filters.value.isActive = v === "all" ? undefined : v === "active";
  handleFilterChange();
};

// Чипы применённых фильтров: пользователь видит состояние и снимает по одному
const filterChips = computed(() => {
  const chips: { key: string; label: string }[] = [];
  if (filters.value.courseId) {
    const c = courses.value.find((x) => String(x.id) === String(filters.value.courseId));
    chips.push({ key: "courseId", label: `Программа: ${c?.shortName || c?.name || filters.value.courseId}` });
  }
  if (filters.value.startDateFrom) chips.push({ key: "startDateFrom", label: `С: ${formatDate(filters.value.startDateFrom)}` });
  if (filters.value.startDateTo) chips.push({ key: "startDateTo", label: `По: ${formatDate(filters.value.startDateTo)}` });
  if (filters.value.isActive !== undefined && !filters.value.isArchived) {
    chips.push({ key: "isActive", label: filters.value.isActive ? "Активные" : "Неактивные" });
  }
  return chips;
});
// Счётчик на кнопке «Фильтры» — только скрытые в панели поля (программа, даты)
const activeFilterCount = computed(
  () => [filters.value.courseId, filters.value.startDateFrom, filters.value.startDateTo].filter(Boolean).length,
);

// Снятие отдельного чипа: сбрасываем поле и перезагружаем через прежний handleFilterChange
const handleChipRemove = (key: string) => {
  if (key === "isActive") filters.value.isActive = undefined;
  else if (key === "courseId") filters.value.courseId = "";
  else if (key === "startDateFrom") filters.value.startDateFrom = "";
  else if (key === "startDateTo") filters.value.startDateTo = "";
  handleFilterChange();
};

// Смена размера страницы из UiPagination (раньше лимит был фиксированным)
const changeLimit = (limit: number) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
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
