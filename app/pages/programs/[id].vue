<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="mb-3">
          <NuxtLink
            to="/programs"
            class="flex items-center gap-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Назад к списку учебных программ
          </NuxtLink>
        </div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Учебная программа
        </h2>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-8">
      <div class="text-center">
        <div class="mx-auto mb-4 h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center">
          <svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="mb-2 text-xl font-semibold text-black dark:text-white">Ошибка загрузки</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
        <UiButton variant="primary" @click="loadCourse">
          Попробовать снова
        </UiButton>
      </div>
    </div>

    <!-- Course Details -->
    <div v-else-if="course">
      <!-- Header Card -->
      <div class="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <!-- Cover Image -->
        <div class="relative h-48 overflow-hidden rounded-t-sm bg-linear-to-r from-primary to-primary-600">
          <div class="absolute inset-0 bg-black/10"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <svg class="w-24 h-24 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        <!-- Course Info -->
        <div class="px-6 pb-6">
          <div class="relative -mt-16 mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <!-- Icon -->
            <div class="relative">
              <div class="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg dark:border-gray-900 dark:bg-boxdark">
                <div class="h-full w-full flex items-center justify-center bg-primary/10">
                  <span class="text-primary font-bold text-4xl">
                    {{ course.shortName }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Course Info -->
            <div class="flex-1 text-center sm:text-left">
              <h3 class="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
                {{ course.name }}
              </h3>
              <p class="mb-2 text-gray-600 dark:text-gray-400">
                Код: {{ course.code }}
              </p>
              <div class="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                    course.isActive
                      ? 'bg-success/10 text-success'
                      : 'bg-danger/10 text-danger'
                  ]"
                >
                  <span :class="['h-2 w-2 rounded-full', course.isActive ? 'bg-success' : 'bg-danger']"></span>
                  {{ course.isActive ? 'Активна' : 'Неактивна' }}
                </span>
                <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ course.totalHours }} часов
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <UiButton v-if="canEditCourses" variant="outline" size="md" @click="editCourse">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Редактировать
              </UiButton>
              <UiButton v-if="canDeleteCourses" variant="danger" size="md" @click="handleDelete">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Удалить
              </UiButton>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Дисциплин</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ course.disciplines?.length || 0 }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-success/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Инструкторов</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalInstructors }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-warning/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Всего часов</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ course.totalHours }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Основная информация -->
        <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
          <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Основная информация
          </h3>
          <div class="space-y-3">
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Полное название</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ course.name }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Короткое название</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ course.shortName }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Код программы</p>
              <p class="font-medium text-gray-900 dark:text-white font-mono">{{ course.code }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Описание</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ course.description || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Дополнительная информация -->
        <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
          <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Дополнительная информация
          </h3>
          <div class="space-y-3">
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Шаблон сертификата</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ course.certificateTemplate?.name || 'Не указан' }}
              </p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Дата создания</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(course.createdAt) }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Последнее обновление</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(course.updatedAt) }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">ID программы</p>
              <p class="font-medium text-gray-900 dark:text-white font-mono text-sm">{{ course.id }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Disciplines -->
      <div class="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Дисциплины курса
          </h3>
          <UiButton v-if="canManageDisciplines" variant="primary" size="sm" @click="openDisciplineModal()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Добавить дисциплину
          </UiButton>
        </div>
        
        <div v-if="!course.disciplines || course.disciplines.length === 0" class="text-center py-8">
          <div class="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Дисциплины пока не добавлены
          </p>
          <UiButton v-if="canManageDisciplines" variant="primary" @click="openDisciplineModal()">
            Добавить первую дисциплину
          </UiButton>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="(discipline, index) in course.disciplines"
            :key="discipline.id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-primary/50 transition-all"
          >
            <div class="flex items-start gap-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {{ discipline.name }}
                </h4>
                <p v-if="discipline.description" class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {{ discipline.description }}
                </p>
                
                <!-- Разбивка часов -->
                <div class="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Теория</p>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ discipline.theoryHours }} ч</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Практика</p>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ discipline.practiceHours }} ч</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Проверка знаний</p>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ discipline.assessmentHours }} ч</p>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Всего</p>
                      <p class="text-sm font-bold text-primary">{{ discipline.hours }} ч</p>
                    </div>
                  </div>
                </div>
                
                <div class="flex flex-wrap gap-3">
                  <span
                    v-if="discipline.instructors && discipline.instructors.length > 0"
                    class="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {{ discipline.instructors.length }} {{ discipline.instructors.length === 1 ? 'инструктор' : 'инструктора' }}
                  </span>
                </div>
                
                <!-- Instructors List -->
                <div v-if="discipline.instructors && discipline.instructors.length > 0" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Инструкторы:</p>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="di in discipline.instructors"
                      :key="di.id"
                      class="inline-flex items-center gap-1.5 rounded-md bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      {{ di.instructor?.fullName }}
                      <span v-if="di.isPrimary" class="text-primary">★</span>
                    </span>
                  </div>
                </div>

                <!-- Tests Section -->
                <ProgramsDisciplineTestsSection
                  :discipline-id="discipline.id"
                  :can-manage="canManageDisciplines"
                  @updated="loadCourse"
                />
              </div>
              
              <!-- Кнопки действий -->
              <div v-if="canManageDisciplines" class="flex gap-2 shrink-0">
                <button
                  @click="openDisciplineModal(discipline)"
                  class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-primary dark:hover:text-primary"
                  title="Редактировать"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="handleDeleteDiscipline(discipline)"
                  class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-danger hover:text-danger dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-danger dark:hover:text-danger"
                  title="Удалить"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
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

    <!-- Discipline Form Modal -->
    <ProgramsDisciplineFormModal
      :is-open="isDisciplineModalOpen"
      :course-id="id"
      :discipline="selectedDiscipline"
      @close="closeDisciplineModal"
      @success="handleDisciplineSuccess"
    />

    <!-- Delete Discipline Confirmation Modal -->
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
import type { Course, Discipline } from '~/types/course';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

// Проверка прав доступа
const { canEditCourses, canDeleteCourses, canManageDisciplines } = usePermissions();

// State
const course = ref<Course | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const isDisciplineModalOpen = ref(false);
const selectedDiscipline = ref<Discipline | undefined>(undefined);
const isDeleteDisciplineModalOpen = ref(false);
const isDeletingDiscipline = ref(false);

// Meta
definePageMeta({
  title: 'Учебная программа',
});

useHead({
  title: 'Учебная программа - АТЦ Платформа',
});

// Computed
const totalInstructors = computed(() => {
  if (!course.value?.disciplines) return 0;
  const instructorIds = new Set<string>();
  course.value.disciplines.forEach(discipline => {
    discipline.instructors?.forEach(di => {
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
    console.log('Loading course with ID:', id);
    const response = await authFetch<{ success: boolean; course?: Course; message?: string }>(
      `/api/courses/${id}`,
      {
        method: 'GET',
      }
    );

    console.log('API Response:', response);

    if (response.success && response.course) {
      course.value = response.course;
      console.log('Course loaded successfully:', course.value);
    } else {
      error.value = response.message || 'Не удалось загрузить данные учебной программы';
      console.error('API returned error:', response.message);
    }
  } catch (err: any) {
    console.error('Error loading course:', err);
    console.error('Error details:', {
      message: err.message,
      data: err.data,
      statusCode: err.statusCode,
      response: err.response,
    });
    error.value = err.data?.message || err.message || 'Не удалось загрузить данные учебной программы';
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

// Close delete modal
const closeDeleteModal = () => {
  if (!isDeleting.value) {
    isDeleteModalOpen.value = false;
  }
};

// Confirm delete
const confirmDelete = async () => {
  isDeleting.value = true;

  try {
    await authFetch(
      `/api/courses/${id}`,
      {
        method: 'DELETE',
      }
    );

    showSuccess('Учебная программа успешно удалена', 'Успех');
    
    setTimeout(() => {
      router.push('/programs');
    }, 1000);
  } catch (err: any) {
    console.error('Error deleting course:', err);
    showError(
      err.data?.message || 'Не удалось удалить учебную программу',
      'Ошибка'
    );
  } finally {
    isDeleting.value = false;
    isDeleteModalOpen.value = false;
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
        method: 'DELETE',
      }
    );

    showSuccess('Дисциплина успешно удалена', 'Успех');
    await loadCourse();
  } catch (err: any) {
    console.error('Error deleting discipline:', err);
    showError(
      err.data?.message || 'Не удалось удалить дисциплину',
      'Ошибка'
    );
  } finally {
    isDeletingDiscipline.value = false;
    isDeleteDisciplineModalOpen.value = false;
    selectedDiscipline.value = undefined;
  }
};

// Utilities
const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Load data on mount
onMounted(() => {
  loadCourse();
});
</script>
