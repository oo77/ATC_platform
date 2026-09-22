<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-slate-600 dark:text-slate-400 font-medium">
          Загрузка информации об учебной программе...
        </p>
      </div>
    </div>

    <!-- Ошибка -->
    <div
      v-else-if="error"
      class="flex items-center justify-center min-h-[400px]"
    >
      <div class="text-center max-w-md">
        <div
          class="bg-slate-100 dark:bg-slate-800 p-6 rounded-full inline-block mb-6"
        >
          <BookOpen class="w-12 h-12 text-slate-400" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 dark:text-white">
          Ошибка загрузки
        </h3>
        <p class="mt-2 text-slate-500 dark:text-gray-400">
          {{ error }}
        </p>
        <UiButton class="mt-8 shadow-lg" @click="loadCourse"
          >Попробовать снова</UiButton
        >
      </div>
    </div>

    <!-- Контент -->
    <template v-else-if="course">
      <!-- Header Section -->
      <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <!-- Breadcrumbs / Back Navigation -->
        <div class="mb-6">
          <NuxtLink
            to="/programs"
            class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft
                class="w-4 h-4 transition-transform group-hover:-translate-x-1"
              />
            </div>
            Назад к списку
          </NuxtLink>
        </div>

        <div
          class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <!-- Left: Title & Info -->
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-3">
              <h1
                class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase"
              >
                {{ course.shortName }}
              </h1>
              <div
                class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary/20 bg-primary/10 text-primary"
              >
                {{ course.courseType || "КПП" }}
              </div>
              <div
                class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border"
                :class="
                  course.isActive
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-danger/10 text-danger border-danger/20'
                "
              >
                {{ course.isActive ? "Активна" : "Неактивна" }}
              </div>
              <div
                v-if="course.isArchived"
                class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              >
                В архиве
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div
                class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400"
              >
                {{ course.name }}
              </div>
              <div
                v-if="course.nameUz"
                class="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-500"
              >
                <span class="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-black uppercase text-slate-500">УЗ</span>
                {{ course.nameUz }}
              </div>
              <div
                class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400"
              >
                <Clock class="w-4 h-4 text-slate-400" />
                Всего: {{ course.totalHours }} часов
              </div>
            </div>
          </div>

          <!-- Right: Action Buttons Group -->
          <div class="flex flex-wrap items-center gap-2">
            <UiButton
              v-if="canEditCourses && !course.isArchived"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold"
              @click="editCourse"
            >
              <Settings class="w-4 h-4" />
              Редактировать
            </UiButton>

            <UiButton
              v-if="canArchiveCourses && !course.isArchived"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold text-warning border-warning/20 hover:bg-warning/5 hover:border-warning/40"
              @click="handleArchive"
            >
              <CalendarDays class="w-4 h-4" />
              В архив
            </UiButton>

            <UiButton
              v-if="canArchiveCourses && course.isArchived"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold text-success border-success/20 hover:bg-success/5 hover:border-success/40"
              @click="handleRestore"
            >
              <Clock class="w-4 h-4" />
              Восстановить
            </UiButton>

            <UiButton
              v-if="canDeleteCourses"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold text-danger border-danger/20 hover:bg-danger/5 hover:border-danger/40"
              @click="handleDelete"
            >
              <Trash2 class="w-4 h-4" />
              Удалить
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Bento Box Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <!-- Disciplines Card -->
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Дисциплин
              </p>
              <h3
                class="mt-1 text-2xl font-bold text-slate-900 dark:text-white"
              >
                {{ course.disciplines?.length || 0 }}
              </h3>
            </div>
            <div
              class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12"
            >
              <BookOpen class="w-6 h-6" />
            </div>
          </div>
        </div>

        <!-- Instructors Card -->
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Инструкторов
              </p>
              <h3
                class="mt-1 text-2xl font-bold text-slate-900 dark:text-white"
              >
                {{ totalInstructors }}
              </h3>
            </div>
            <div
              class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12"
            >
              <Users class="w-6 h-6" />
            </div>
          </div>
        </div>

        <!-- Hours Card -->
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Всего часов
              </p>
              <h3
                class="mt-1 text-2xl font-bold text-slate-900 dark:text-white"
              >
                {{ course.totalHours }}
              </h3>
            </div>
            <div
              class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12"
            >
              <Clock class="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <!-- Overview Grid -->
      <div
        class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8"
      >
        <div class="lg:col-span-2 space-y-6">
          <!-- Main Info Card -->
          <div
            class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all hover:shadow-md"
          >
            <div
              class="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-2"
            >
              <h3
                class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
              >
                <LayoutDashboard class="w-5 h-5 text-primary" />
                Основная информация
              </h3>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-1">
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                    >Полное название</label
                  >
                  <p class="text-sm font-bold text-slate-900 dark:text-white">
                    {{ course.name }}
                  </p>
                </div>
                <div class="space-y-1">
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                    >Короткое название</label
                  >
                  <p class="text-sm font-bold text-slate-900 dark:text-white">
                    {{ course.shortName }}
                  </p>
                </div>
                <div v-if="course.nameUz" class="space-y-1">
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                    >Название на узбекском</label
                  >
                  <p class="text-sm font-bold text-slate-900 dark:text-white">
                    {{ course.nameUz }}
                  </p>
                </div>
                <div class="space-y-1">
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                    >Код программы</label
                  >
                  <p
                    class="text-sm font-bold text-slate-900 dark:text-white font-mono"
                  >
                    {{ course.code }}
                  </p>
                </div>
                <div class="space-y-1">
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                    >ID программы</label
                  >
                  <p
                    class="text-sm font-bold text-slate-900 dark:text-white font-mono opacity-80"
                  >
                    {{ course.id }}
                  </p>
                </div>
                <div
                  v-if="course.description"
                  class="col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1"
                    >Описание</label
                  >
                  <p
                    class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed"
                  >
                    {{ course.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Additional Info Card -->
          <div
            class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all hover:shadow-md"
          >
            <div
              class="bg-linear-to-br from-info/10 to-transparent px-6 py-2 border-b border-slate-100 dark:border-slate-800"
            >
              <h3
                class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
              >
                <FileText class="w-5 h-5 text-info" />
                Дополнительно
              </h3>
            </div>
            <div class="p-6 space-y-2">
              <div class="space-y-1">
                <label
                  class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                  >Шаблон сертификата</label
                >
                <p class="text-sm font-bold text-slate-900 dark:text-white">
                  {{ course.certificateTemplate?.name || "Не указан" }}
                </p>
              </div>
              <div class="space-y-1">
                <label
                  class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                  >Дата создания</label
                >
                <p class="text-sm font-bold text-slate-900 dark:text-white">
                  {{ formatDateTime(course.createdAt) }}
                </p>
              </div>
              <div class="space-y-1">
                <label
                  class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                  >Последнее обновление</label
                >
                <p class="text-sm font-bold text-slate-900 dark:text-white">
                  {{ formatDateTime(course.updatedAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Disciplines Section -->
      <div
        class="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150"
      >
        <div
          class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
        >
          <div
            class="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h3
                class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
              >
                <BookOpen class="w-5 h-5 text-primary" />
                Дисциплины курса
              </h3>
            </div>
            <div class="flex items-center gap-2">
              <UiButton
                v-if="canManageDisciplines"
                variant="outline"
                size="sm"
                class="gap-2 font-bold"
                @click="openDisciplineModal()"
              >
                <Plus class="w-4 h-4" />
                Добавить дисциплину
              </UiButton>
            </div>
          </div>

          <div
            v-if="!course.disciplines || course.disciplines.length === 0"
            class="p-16 text-center"
          >
            <div
              class="bg-slate-50 dark:bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <BookOpen class="w-8 h-8 text-slate-300" />
            </div>
            <p class="text-slate-500 font-medium mb-4">
              Дисциплины пока не добавлены
            </p>
            <UiButton
              v-if="canManageDisciplines"
              variant="primary"
              @click="openDisciplineModal()"
            >
              Добавить первую дисциплину
            </UiButton>
          </div>

          <div v-else class="p-4 space-y-2">
            <div
              v-for="(discipline, index) in course.disciplines"
              :key="discipline.id"
              class="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 hover:border-primary/30 hover:bg-primary/5 transition-all group relative"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm font-semibold shrink-0 group-hover:bg-primary group-hover:text-white transition-colors"
                >
                  {{ index + 1 }}
                </div>

                <span
                  v-if="discipline.shortName"
                  class="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-black uppercase tracking-wide text-primary"
                >
                  {{ discipline.shortName }}
                </span>

                <div class="flex-1 min-w-0">
                  <h4
                    class="truncate text-sm font-bold text-slate-900 dark:text-white"
                    :title="discipline.name"
                  >
                    {{ discipline.name }}
                  </h4>
                </div>

                <div
                  class="hidden md:flex items-center gap-3 shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400"
                >
                  <span>Т: {{ discipline.theoryHours }}ч</span>
                  <span>П: {{ discipline.practiceHours }}ч</span>
                  <span>К: {{ discipline.assessmentHours }}ч</span>
                  <span class="text-primary">Всего: {{ discipline.hours }}ч</span>
                </div>
                <span class="md:hidden shrink-0 text-xs font-black text-primary">
                  {{ discipline.hours }}ч
                </span>

                <div
                  v-if="discipline.instructors && discipline.instructors.length > 0"
                  class="hidden lg:flex items-center gap-1 shrink-0"
                  :title="discipline.instructors.map(di => di.instructor?.fullName).join(', ')"
                >
                  <Users class="w-3.5 h-3.5 text-slate-400" />
                  <span class="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {{ discipline.instructors.length }}
                  </span>
                </div>

                <!-- Actions -->
                <div
                  v-if="canManageDisciplines"
                  class="flex items-center gap-1 shrink-0"
                >
                  <UiButton
                    variant="outline"
                    size="sm"
                    class="h-7 w-7 p-0!"
                    @click="openDisciplineModal(discipline)"
                  >
                    <Settings class="w-3.5 h-3.5 text-slate-500" />
                  </UiButton>
                  <UiButton
                    variant="outline"
                    size="sm"
                    class="h-7 w-7 p-0! border-danger/20 hover:bg-danger/5 hover:border-danger/40"
                    @click="handleDeleteDiscipline(discipline)"
                  >
                    <Trash2 class="w-3.5 h-3.5 text-danger" />
                  </UiButton>
                </div>
              </div>

              <p
                v-if="discipline.description"
                class="mt-1 ml-11 truncate text-xs text-slate-500 dark:text-slate-400"
                :title="discipline.description"
              >
                {{ discipline.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление учебной программы"
      message="Вы уверены, что хотите удалить эту учебную программу?"
      :item-name="course?.name"
      warning="Это действие нельзя отменить. Все данные программы и связанные дисциплины будут удалены."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />

    <UiConfirmModal
      :is-open="isArchiveModalOpen"
      title="Архивация учебной программы"
      message="Вы уверены, что хотите переместить эту учебную программу в архив?"
      :item-name="course?.name"
      warning="Архивная программа не будет доступна для создания новых групп. Вы сможете восстановить её позже."
      :loading="isArchiving"
      @confirm="confirmArchive"
      @cancel="closeArchiveModal"
    />

    <UiConfirmModal
      :is-open="isRestoreModalOpen"
      title="Восстановление учебной программы"
      message="Вы уверены, что хотите восстановить эту учебную программу из архива?"
      :item-name="course?.name"
      :loading="isRestoring"
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
