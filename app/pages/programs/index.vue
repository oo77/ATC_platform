<template>
  <!-- Внешний враппер без собственных отступов (убран двойной padding) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок; единственное главное действие страницы — «Создать» (виден только при правах) -->
    <UiPageHeader
      title="Учебные программы"
      description="Курсы, дисциплины и планы обучения. КПП — первоначальная подготовка, КПК — повышение квалификации"
    >
      <template #actions>
        <UiButton v-if="canCreateCourses" variant="primary" size="md" :start-icon="Plus" @click="navigateTo('/programs/create')">
          Создать программу
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- KPI-карточки удалены: «всего» теперь в счётчике «Найдено N», а «активных на странице» и «часы на странице» вводили в заблуждение (считались только по текущей странице) -->

    <!-- Вкладки «Активные / Архив» вместо самописных таблеток; логика переключения прежняя (isArchived + loadCourses) -->
    <UiTabs
      :model-value="filters.isArchived ? 'archive' : 'active'"
      :tabs="programTabs"
      @update:model-value="onTabChange"
    />

    <!-- Единый блок фильтров: поиск + сегмент типа программы; статус — в сворачиваемой панели -->
    <UiFilterBar
      v-model:search="filters.search"
      search-placeholder="Поиск по названию или коду программы..."
      :segments="typeSegments"
      :segment="filters.courseType ?? 'all'"
      :chips="filterChips"
      :active-count="filterChips.length"
      :total="pagination.total"
      persist-key="programs"
      @search="handleFilterChange"
      @update:segment="onTypeChange"
      @remove="onChipRemove"
      @reset="resetFilters"
    >
      <!-- Второстепенный фильтр: статус (в архиве не применяется — как и раньше) -->
      <template #filters>
        <div v-if="!filters.isArchived">
          <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Статус</label>
          <select
            :value="statusValue"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            @change="onStatusChange"
          >
            <option value="all">Все</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>
        <p v-else class="text-sm text-gray-500 dark:text-gray-400">Для архива дополнительных фильтров нет</p>
      </template>
    </UiFilterBar>

    <!-- Список программ: одна карточка = таблица + пагинация-футер -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <!-- Загрузка -->
      <div v-if="loading" class="p-12 text-center">
        <div class="mx-auto inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Загрузка учебных программ...</p>
      </div>

      <!-- Пусто: единое пустое состояние со следующим шагом (создать или сбросить фильтры) -->
      <UiEmptyState
        v-else-if="courses.length === 0"
        title="Учебные программы не найдены"
        :description="hasActiveFilters ? 'Попробуйте изменить или сбросить фильтры' : 'Создайте первую учебную программу'"
        :icon="BookOpen"
      >
        <template #actions>
          <UiButton v-if="hasActiveFilters" variant="outline" size="md" @click="resetFilters">Сбросить фильтры</UiButton>
          <UiButton v-else-if="canCreateCourses" variant="primary" size="md" :start-icon="Plus" @click="navigateTo('/programs/create')">
            Создать программу
          </UiButton>
        </template>
      </UiEmptyState>

      <!-- Таблица: контейнер со скроллом, чтобы шапка была sticky -->
      <div v-else class="max-h-[calc(100vh-20rem)] min-h-[200px] overflow-auto">
        <table class="w-full border-collapse text-left text-sm">
          <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Учебная программа</th>
              <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Код</th>
              <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Дисциплины</th>
              <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Часы</th>
              <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Статус</th>
              <th class="w-16 px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                <span class="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <!-- Строка кликабельна (как было): открывает программу -->
            <tr
              v-for="course in courses"
              :key="course.id"
              class="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              @click="viewCourse(course)"
            >
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900 transition-colors group-hover:text-primary dark:text-white">{{ course.name }}</div>
                <div class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ course.shortName }}</div>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-white/[0.06] dark:text-gray-300">{{ course.code }}</span>
              </td>
              <td class="px-4 py-3 tabular-nums text-gray-700 dark:text-gray-300">{{ course.disciplineCount || 0 }}</td>
              <td class="px-4 py-3 tabular-nums text-gray-700 dark:text-gray-300">{{ course.totalHours }} ч.</td>
              <!-- Статус: единый UiBadge вместо плашки uppercase -->
              <td class="px-4 py-3">
                <UiBadge :color="course.isActive ? 'success' : 'light'">{{ course.isActive ? "Активна" : "Неактивна" }}</UiBadge>
              </td>
              <!-- Действия: «⋯» (всегда виден, в том числе на touch); клик не открывает строку -->
              <td class="px-4 py-3 text-right" @click.stop>
                <UiDropdown
                  :groups="rowMenu(course)"
                  icon-only
                  variant="ghost"
                  size="sm"
                  aria-label="Действия с программой"
                  @select="(key) => onRowAction(key, course)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Единая пагинация вместо «Назад/Вперёд»; страница не умеет менять limit → hideLimit -->
      <UiPagination
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="loading"
        hide-limit
        @update:page="changePage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { definePageMeta, useAuthFetch, useNotification, usePermissions, navigateTo } from "#imports";
// Убраны иконки KPI-карточек и самописных фильтров; добавлен Eye для пункта «Открыть» в меню строки
import { Plus, BookOpen, Archive, Copy, Eye } from "lucide-vue-next";
import type { Course, CourseType } from "~/types/course";

// Определяем мета-данные страницы
definePageMeta({
  layout: "default",
});

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();
const { canCreateCourses } = usePermissions();

// Состояние
const loading = ref(false);
const duplicatingId = ref<string | null>(null);
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

// ---- Презентационная обвязка для UiTabs / UiFilterBar (вызывает прежние loadCourses / handleFilterChange / resetFilters) ----

// Вкладки «Активные / Архив»
const programTabs = [
  { id: "active", label: "Активные программы", icon: BookOpen },
  { id: "archive", label: "Архив программ", icon: Archive },
];

// Переключение вкладки: ставим прежний флаг isArchived; страницу сбрасываем на 1-ю, чтобы не остаться за пределами списка
const onTabChange = (id: string) => {
  filters.value.isArchived = id === "archive";
  pagination.value.page = 1;
  loadCourses();
};

// Сегмент типа программы (значение «all» = без фильтра, то есть courseType = undefined)
const typeSegments = [
  { value: "all", label: "Все" },
  { value: "КПП", label: "КПП" },
  { value: "КПК", label: "КПК" },
];

const onTypeChange = (value: string | number | boolean) => {
  filters.value.courseType = value === "all" ? undefined : (value as CourseType);
  handleFilterChange();
};

// Селект статуса работает с tri-state isActive (undefined/true/false) через строковое значение
const statusValue = computed(() =>
  filters.value.isActive === undefined ? "all" : filters.value.isActive ? "active" : "inactive",
);

const onStatusChange = (e: Event) => {
  const v = (e.target as HTMLSelectElement).value;
  filters.value.isActive = v === "all" ? undefined : v === "active";
  handleFilterChange();
};

// Чипы применённых второстепенных фильтров (статус; в архиве он не отображается, но в запросе участвует, как раньше)
const filterChips = computed(() =>
  filters.value.isActive === undefined
    ? []
    : [{ key: "isActive", label: `Статус: ${filters.value.isActive ? "активные" : "неактивные"}` }],
);

const onChipRemove = (key: string) => {
  if (key === "isActive") {
    filters.value.isActive = undefined;
    handleFilterChange();
  }
};

// Меню «⋯» строки: «Открыть» для всех, «Дублировать» — только при праве создания; во время копирования пункт блокируется
const rowMenu = (course: Course) => [
  {
    items: [
      { key: "open", label: "Открыть", icon: Eye },
      {
        key: "duplicate",
        label: duplicatingId.value === course.id ? "Копирование..." : "Дублировать",
        description: "Создать копию программы",
        icon: Copy,
        hidden: !canCreateCourses.value,
        disabled: duplicatingId.value !== null,
        loading: duplicatingId.value === course.id,
      },
    ],
  },
];

const onRowAction = (key: string, course: Course) => {
  if (key === "open") viewCourse(course);
  else if (key === "duplicate") duplicateCourse(course);
};

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

// Создаёт копию программы и открывает её для редактирования
const duplicateCourse = async (course: Course) => {
  if (duplicatingId.value) return;

  duplicatingId.value = course.id;

  try {
    const response = await authFetch<{
      success: boolean;
      message?: string;
      course?: Course;
    }>(`/api/courses/${course.id}/duplicate`, {
      method: "POST",
    });

    if (response.success && response.course) {
      showSuccess("Копия учебной программы создана", "Успех");
      navigateTo(`/programs/edit/${response.course.id}`);
    } else {
      showError(
        response.message || "Не удалось создать копию учебной программы",
        "Ошибка",
      );
    }
  } catch (err: any) {
    showError(
      err.data?.message || "Не удалось создать копию учебной программы",
      "Ошибка",
    );
  } finally {
    duplicatingId.value = null;
  }
};

// Инициализация
onMounted(() => {
  loadCourses();
});
</script>
