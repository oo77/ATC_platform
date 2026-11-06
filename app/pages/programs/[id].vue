<template>
  <!-- Внешний враппер без двойного отступа (отступ задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Загрузка: компактный спиннер -->
    <div v-if="loading" class="flex min-h-[400px] items-center justify-center">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Загрузка информации об учебной программе...</p>
      </div>
    </div>

    <!-- Ошибка: единственное действие — повторить загрузку -->
    <div v-else-if="error" class="flex min-h-[400px] items-center justify-center">
      <div class="max-w-md text-center">
        <div class="mb-4 inline-block rounded-full bg-gray-100 p-5 dark:bg-white/[0.06]">
          <BookOpen class="h-10 w-10 text-gray-400" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Ошибка загрузки</h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ error }}</p>
        <UiButton class="mt-6" @click="loadCourse">Попробовать снова</UiButton>
      </div>
    </div>

    <!-- Контент -->
    <template v-else-if="course">
      <!-- Единая шапка: крошки, короткое имя (text-xl/2xl), тип/статус бейджами, полное название в мета-строке -->
      <UiPageHeader
        :title="course.shortName"
        :breadcrumbs="[{ label: 'Программы', to: '/programs' }, { label: course.shortName }]"
      >
        <!-- Бейджи: тип, активность, архив (без CAPS и 10px) -->
        <template #badge>
          <span class="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {{ course.courseType || "КПП" }}
          </span>
          <span
            class="rounded-md border px-2 py-0.5 text-xs font-medium"
            :class="course.isActive ? 'border-success/20 bg-success/10 text-success' : 'border-danger/20 bg-danger/10 text-danger'"
          >
            {{ course.isActive ? "Активна" : "Неактивна" }}
          </span>
          <span
            v-if="course.isArchived"
            class="rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-white/[0.06] dark:text-gray-300"
          >
            В архиве
          </span>
        </template>

        <!-- Мета-строка: полное название (и узбекское); «Всего часов» убрано — оно в полосе метрик -->
        <template #meta>
          <span>{{ course.name }}</span>
          <span v-if="course.nameUz" class="inline-flex items-center gap-1.5">
            <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-white/[0.06]">УЗ</span>
            {{ course.nameUz }}
          </span>
        </template>

        <!-- Действия: «Редактировать» (главное) + «Дублировать» + «⋯» (Архив/Восстановить, затем «Опасные»: Удалить) -->
        <template #actions>
          <UiButton
            v-if="canEditCourses && !course.isArchived"
            variant="primary"
            :start-icon="Settings"
            @click="editCourse"
          >
            Редактировать
          </UiButton>
          <UiButton
            v-if="canCreateCourses"
            variant="outline"
            :start-icon="Copy"
            :loading="isDuplicating"
            @click="handleDuplicate"
          >
            Дублировать
          </UiButton>
          <UiDropdown
            v-if="canArchiveCourses || canDeleteCourses"
            icon-only
            variant="outline"
            aria-label="Другие действия"
            :groups="menuGroups"
            @select="onMenuSelect"
          />
        </template>
      </UiPageHeader>

      <!-- Полоса метрик в одну строку вместо 3 крупных карточек -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <UiStat label="Дисциплин" :value="course.disciplines?.length || 0" :icon="BookOpen" tone="primary" />
        <UiStat label="Инструкторов" :value="totalInstructors" :icon="Users" tone="success" />
        <UiStat label="Всего часов" :value="course.totalHours" :icon="Clock" tone="warning" />
      </div>

      <!-- Единая карточка «Основная информация»: заголовок и названия не дублируем (они уже в шапке) -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <LayoutDashboard class="h-4 w-4 text-gray-400" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Основная информация</h3>
        </div>
        <div class="grid grid-cols-1 gap-x-8 gap-y-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Код программы</p>
            <p class="font-mono text-sm font-medium text-gray-900 dark:text-white">{{ course.code }}</p>
          </div>
          <div>
            <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">ID программы</p>
            <p class="break-all font-mono text-sm text-gray-600 dark:text-gray-300">{{ course.id }}</p>
          </div>
          <div>
            <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Шаблон сертификата</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ course.certificateTemplate?.name || "Не указан" }}</p>
          </div>
          <div>
            <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Дата создания</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDateTime(course.createdAt) }}</p>
          </div>
          <div>
            <p class="mb-0.5 text-xs text-gray-500 dark:text-gray-400">Последнее обновление</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDateTime(course.updatedAt) }}</p>
          </div>
          <div v-if="course.description" class="rounded-lg border border-gray-100 bg-gray-50 p-3 sm:col-span-2 lg:col-span-3 dark:border-gray-800 dark:bg-white/[0.03]">
            <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">Описание</p>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{{ course.description }}</p>
          </div>
        </div>
      </div>

      <!-- Дисциплины курса -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-col justify-between gap-3 border-b border-gray-100 px-5 py-3 sm:flex-row sm:items-center dark:border-gray-800">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <BookOpen class="h-4 w-4 text-gray-400" />
            Дисциплины курса
          </h3>
          <!-- Одно действие секции; если список пуст — главным становится кнопка в пустом состоянии -->
          <UiButton
            v-if="canManageDisciplines && course.disciplines?.length"
            variant="outline"
            size="sm"
            :start-icon="Plus"
            @click="openDisciplineModal()"
          >
            Добавить дисциплину
          </UiButton>
        </div>

        <!-- Пустое состояние -->
        <div v-if="!course.disciplines || course.disciplines.length === 0" class="p-10 text-center">
          <UiEmptyState title="Дисциплины пока не добавлены" :icon="BookOpen" />
          <UiButton v-if="canManageDisciplines" variant="primary" class="mt-2" @click="openDisciplineModal()">
            Добавить первую дисциплину
          </UiButton>
        </div>

        <div v-else class="space-y-2 p-4">
          <div
            v-for="(discipline, index) in course.disciplines"
            :key="discipline.id"
            class="group relative rounded-lg border border-gray-200 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-primary/5 dark:border-gray-800"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-500 transition-colors group-hover:bg-primary group-hover:text-white dark:bg-white/[0.06]"
              >
                {{ index + 1 }}
              </div>

              <span
                v-if="discipline.shortName"
                class="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"
              >
                {{ discipline.shortName }}
              </span>

              <div class="min-w-0 flex-1">
                <h4 class="truncate text-sm font-medium text-gray-900 dark:text-white" :title="discipline.name">
                  {{ discipline.name }}
                </h4>
              </div>

              <div class="hidden shrink-0 items-center gap-3 text-xs text-gray-500 md:flex dark:text-gray-400">
                <span>Т: {{ discipline.theoryHours }}ч</span>
                <span>П: {{ discipline.practiceHours }}ч</span>
                <span>К: {{ discipline.assessmentHours }}ч</span>
                <span class="font-medium text-primary">Всего: {{ discipline.hours }}ч</span>
              </div>
              <span class="shrink-0 text-xs font-semibold text-primary md:hidden">{{ discipline.hours }}ч</span>

              <div
                v-if="discipline.instructors && discipline.instructors.length > 0"
                class="hidden shrink-0 items-center gap-1 lg:flex"
                :title="discipline.instructors.map(di => di.instructor?.fullName).join(', ')"
              >
                <Users class="h-3.5 w-3.5 text-gray-400" />
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ discipline.instructors.length }}</span>
              </div>

              <!-- Действия строки: одна видимая иконка (изменить) + «⋯» с удалением (опасное — последним) -->
              <div v-if="canManageDisciplines" class="flex shrink-0 items-center gap-1">
                <UiButton variant="ghost" size="sm" icon title="Изменить" aria-label="Изменить дисциплину" @click="openDisciplineModal(discipline)">
                  <Settings class="h-4 w-4" />
                </UiButton>
                <UiDropdown
                  icon-only
                  variant="ghost"
                  size="sm"
                  aria-label="Другие действия"
                  :groups="[{ items: [{ key: 'delete', label: 'Удалить дисциплину', icon: Trash2, danger: true }] }]"
                  @select="(key: string) => key === 'delete' && handleDeleteDiscipline(discipline)"
                />
              </div>
            </div>

            <p
              v-if="discipline.description"
              class="ml-11 mt-1 truncate text-xs text-gray-500 dark:text-gray-400"
              :title="discipline.description"
            >
              {{ discipline.description }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Модальные окна (логика без изменений) -->
    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление учебной программы"
      message="Вы уверены, что хотите удалить эту учебную программу?"
      :item-name="course?.name"
      warning="Это действие нельзя отменить. Все данные программы и связанные дисциплины будут удалены."
      :loading="isDeleting"
      loading-text="Удаление…"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />

    <UiConfirmModal
      :is-open="isArchiveModalOpen"
      variant="warning"
      title="Архивация учебной программы"
      message="Вы уверены, что хотите переместить эту учебную программу в архив?"
      confirm-text="В архив"
      :item-name="course?.name"
      warning="Архивная программа не будет доступна для создания новых групп. Вы сможете восстановить её позже."
      :loading="isArchiving"
      loading-text="Архивация…"
      @confirm="confirmArchive"
      @cancel="closeArchiveModal"
    />

    <UiConfirmModal
      :is-open="isRestoreModalOpen"
      variant="warning"
      title="Восстановление учебной программы"
      message="Вы уверены, что хотите восстановить эту учебную программу из архива?"
      confirm-text="Восстановить"
      :item-name="course?.name"
      :loading="isRestoring"
      loading-text="Восстановление…"
      @confirm="confirmRestore"
      @cancel="closeRestoreModal"
    />

    <ProgramsDisciplineFormModal
      :is-open="isDisciplineModalOpen"
      :course-id="id"
      :discipline="selectedDiscipline"
      @close="closeDisciplineModal"
      @success="handleDisciplineSuccess"
    />

    <UiConfirmModal
      :is-open="isDeleteDisciplineModalOpen"
      title="Удаление дисциплины"
      message="Вы уверены, что хотите удалить эту дисциплину?"
      :item-name="selectedDiscipline?.name"
      warning="Это действие нельзя отменить. Дисциплина будет удалена из курса."
      :loading="isDeletingDiscipline"
      loading-text="Удаление…"
      @confirm="confirmDeleteDiscipline"
      @cancel="closeDeleteDisciplineModal"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  BookOpen,
  Users,
  Settings,
  Clock,
  Trash2,
  CalendarDays,
  LayoutDashboard,
  FileText,
  Plus,
  Copy,
} from "lucide-vue-next";
import type { Course, Discipline } from "~/types/course";
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  definePageMeta,
  useHead,
  useAuthFetch,
  useNotification,
  usePermissions,
} from "#imports";

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

// Проверка прав доступа
const {
  canCreateCourses,
  canEditCourses,
  canDeleteCourses,
  canArchiveCourses,
  canManageDisciplines,
} = usePermissions();

// State
const course = ref<Course | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const isArchiveModalOpen = ref(false);
const isArchiving = ref(false);
const isRestoreModalOpen = ref(false);
const isRestoring = ref(false);
const isDuplicating = ref(false);
const isDisciplineModalOpen = ref(false);
const selectedDiscipline = ref<Discipline | undefined>(undefined);
const isDeleteDisciplineModalOpen = ref(false);
const isDeletingDiscipline = ref(false);

// Meta
definePageMeta({
  title: "Учебная программа",
});

useHead({
  title: "Учебная программа - АТЦ Платформа",
});

// Computed
const totalInstructors = computed(() => {
  if (!course.value?.disciplines) return 0;
  const instructorIds = new Set<string>();
  course.value.disciplines.forEach((discipline: Discipline) => {
    discipline.instructors?.forEach((di: any) => {
      instructorIds.add(di.instructorId);
    });
  });
  return instructorIds.size;
});

// Меню «⋯» в шапке: «В архив»/«Восстановить» (по состоянию курса и правам), затем группа «Опасные» с удалением
const menuGroups = computed(() => [
  {
    items: [
      { key: "archive", label: "В архив", icon: CalendarDays, hidden: !(canArchiveCourses.value && !course.value?.isArchived) },
      { key: "restore", label: "Восстановить из архива", icon: Clock, hidden: !(canArchiveCourses.value && course.value?.isArchived) },
    ],
  },
  {
    label: "Опасные",
    items: [{ key: "delete", label: "Удалить программу", icon: Trash2, danger: true, hidden: !canDeleteCourses.value }],
  },
]);
// Пункты меню вызывают прежние обработчики (каждый открывает свой UiConfirmModal)
const onMenuSelect = (key: string) => {
  if (key === "archive") handleArchive();
  else if (key === "restore") handleRestore();
  else if (key === "delete") handleDelete();
};

// Load course data
const loadCourse = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await authFetch<{
      success: boolean;
      course?: Course;
      message?: string;
    }>(`/api/courses/${id}`, {
      method: "GET",
    });

    if (response.success && response.course) {
      course.value = response.course;
    } else {
      error.value =
        response.message || "Не удалось загрузить данные учебной программы";
    }
  } catch (err: any) {
    error.value =
      err.data?.message ||
      err.message ||
      "Не удалось загрузить данные учебной программы";
  } finally {
    loading.value = false;
  }
};

// Edit course
const editCourse = () => {
  router.push(`/programs/edit/${id}`);
};

// Delete course
const handleDelete = () => {
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  if (!isDeleting.value) {
    isDeleteModalOpen.value = false;
  }
};

const confirmDelete = async () => {
  isDeleting.value = true;

  try {
    await authFetch(`/api/courses/${id}`, {
      method: "DELETE",
    });

    showSuccess("Учебная программа успешно удалена", "Успех");

    setTimeout(() => {
      router.push("/programs");
    }, 1000);
  } catch (err: any) {
    showError(
      err.data?.message || "Не удалось удалить учебную программу",
      "Ошибка",
    );
  } finally {
    isDeleting.value = false;
    isDeleteModalOpen.value = false;
  }
};

// Archive course
const handleArchive = () => {
  isArchiveModalOpen.value = true;
};

const closeArchiveModal = () => {
  if (!isArchiving.value) {
    isArchiveModalOpen.value = false;
  }
};

const confirmArchive = async () => {
  isArchiving.value = true;

  try {
    await authFetch(`/api/courses/${id}/archive`, {
      method: "PUT",
      body: { isArchived: true },
    });

    showSuccess("Учебная программа перемещена в архив", "Успех");
    await loadCourse();
  } catch (err: any) {
    showError(
      err.data?.message || "Не удалось переместить учебную программу в архив",
      "Ошибка",
    );
  } finally {
    isArchiving.value = false;
    isArchiveModalOpen.value = false;
  }
};

// Restore course
const handleRestore = () => {
  isRestoreModalOpen.value = true;
};

const closeRestoreModal = () => {
  if (!isRestoring.value) {
    isRestoreModalOpen.value = false;
  }
};

const confirmRestore = async () => {
  isRestoring.value = true;

  try {
    await authFetch(`/api/courses/${id}/archive`, {
      method: "PUT",
      body: { isArchived: false },
    });

    showSuccess("Учебная программа восстановлена из архива", "Успех");
    await loadCourse();
  } catch (err: any) {
    showError(
      err.data?.message ||
        "Не удалось восстановить учебную программу из архива",
      "Ошибка",
    );
  } finally {
    isRestoring.value = false;
    isRestoreModalOpen.value = false;
  }
};

// Duplicate course: создаёт копию и сразу открывает её для редактирования
const handleDuplicate = async () => {
  if (isDuplicating.value) return;

  isDuplicating.value = true;

  try {
    const response = await authFetch<{
      success: boolean;
      message?: string;
      course?: Course;
    }>(`/api/courses/${id}/duplicate`, {
      method: "POST",
    });

    if (response.success && response.course) {
      showSuccess("Копия учебной программы создана", "Успех");
      router.push(`/programs/edit/${response.course.id}`);
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
    isDuplicating.value = false;
  }
};

// Discipline management
const openDisciplineModal = (discipline?: Discipline) => {
  selectedDiscipline.value = discipline;
  isDisciplineModalOpen.value = true;
};

const closeDisciplineModal = () => {
  isDisciplineModalOpen.value = false;
  selectedDiscipline.value = undefined;
};

const handleDisciplineSuccess = () => {
  loadCourse();
};

const handleDeleteDiscipline = (discipline: Discipline) => {
  selectedDiscipline.value = discipline;
  isDeleteDisciplineModalOpen.value = true;
};

const closeDeleteDisciplineModal = () => {
  if (!isDeletingDiscipline.value) {
    isDeleteDisciplineModalOpen.value = false;
    selectedDiscipline.value = undefined;
  }
};

const confirmDeleteDiscipline = async () => {
  if (!selectedDiscipline.value) return;

  isDeletingDiscipline.value = true;

  try {
    await authFetch(
      `/api/courses/${id}/disciplines/${selectedDiscipline.value.id}`,
      {
        method: "DELETE",
      },
    );

    showSuccess("Дисциплина успешно удалена", "Успех");
    await loadCourse();
  } catch (err: any) {
    console.error("Error deleting discipline:", err);
    showError(err.data?.message || "Не удалось удалить дисциплину", "Ошибка");
  } finally {
    isDeletingDiscipline.value = false;
    isDeleteDisciplineModalOpen.value = false;
    selectedDiscipline.value = undefined;
  }
};

// Utilities
const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Load data on mount
onMounted(() => {
  loadCourse();
});
</script>
