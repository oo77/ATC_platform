<template>
  <!-- Внешний враппер без двойного отступа (отступ уже задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Состояние загрузки: спокойный спиннер вместо крупного -->
    <div v-if="loading" class="flex min-h-[400px] items-center justify-center">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Загрузка информации о слушателе...</p>
      </div>
    </div>

    <!-- Ошибка: пустое состояние с единственным действием «К списку» -->
    <div v-else-if="error || !student" class="flex min-h-[400px] items-center justify-center">
      <div class="max-w-md text-center">
        <div class="mb-4 inline-block rounded-full bg-gray-100 p-5 text-gray-400 dark:bg-white/[0.06]">
          <UserIcon class="h-10 w-10" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ error || "Слушатель не найден" }}
        </h3>
        <UiButton class="mt-6" @click="$router.push('/students')">К списку слушателей</UiButton>
      </div>
    </div>

    <template v-else>
      <!-- Единая шапка: крошки вместо крупной ссылки «Назад», заголовок без CAPS/font-black -->
      <UiPageHeader
        :title="student.fullName"
        :breadcrumbs="[{ label: 'Слушатели', to: '/students' }, { label: student.fullName }]"
      >
        <!-- Мета-строка: организация и должность (одна строка вместо дублей по странице) -->
        <template #meta>
          <span class="inline-flex items-center gap-1.5"><BuildingIcon class="h-3.5 w-3.5 text-gray-400" />{{ student.organization }}</span>
          <span class="inline-flex items-center gap-1.5"><BriefcaseIcon class="h-3.5 w-3.5 text-gray-400" />{{ currentPosition }}</span>
        </template>

        <!-- Действия: одно главное (PDF) + «Изменить» + «⋯» с опасными действиями -->
        <template #actions>
          <UiButton variant="primary" size="md" :start-icon="FileDownIcon" @click="exportTranscript">Карточка PDF</UiButton>
          <UiButton v-if="canEditStudents" variant="outline" size="md" :start-icon="SettingsIcon" @click="openEditModal">Изменить</UiButton>
          <!-- Меню «⋯»: удаление отделено группой «Опасные», условие прав сохранено -->
          <UiDropdown
            v-if="canDeleteStudents"
            icon-only
            variant="outline"
            aria-label="Другие действия"
            :groups="menuGroups"
            @select="onMenuSelect"
          />
        </template>
      </UiPageHeader>

      <!-- Блок профиля: фото кликабельно (лайтбокс) + полоса метрик в одну строку вместо 4 «bento»-карточек -->
      <div class="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="group relative shrink-0 cursor-pointer" title="Нажмите для просмотра фото" @click="isPhotoModalOpen = true">
          <div class="relative h-16 w-16 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
            <img v-if="student.photo_base64" :src="student.photo_base64" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
              <span class="text-xl font-semibold">{{ getInitials(student.fullName) }}</span>
            </div>
            <!-- Иконка увеличения при наведении -->
            <div class="absolute inset-0 flex items-center justify-center bg-gray-900/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Maximize2Icon class="h-5 w-5" />
            </div>
          </div>
        </div>

        <div class="grid min-w-0 flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
          <UiStat label="Сертификаты" :value="student.certificates?.length || 0" hint="Всего получено" :icon="AwardIcon" tone="warning" />
          <UiStat label="Курсы" :value="studentCourses.length" :hint="`${activeCourses.length} активных`" :icon="BookOpenIcon" tone="primary" />
          <UiStat label="Посещаемость" :value="`${averageProgress}%`" :icon="ActivityIcon" tone="success" :progress="averageProgress" />
          <UiStat label="В системе" :value="registrationDays" :hint="`С ${formatDateShort(student.created_at)}`" :icon="CalendarIcon" tone="info" />
        </div>
      </div>

      <!-- Вкладки: единый UiTabs со счётчиками вместо самописных «таблеток» -->
      <UiTabs v-model="activeTab" :tabs="tabItems" />

      <!-- Содержимое вкладок -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <!-- Основная область (8 колонок) -->
        <div class="space-y-4 lg:col-span-8">
          <!-- Вкладка «Профиль» -->
          <div v-show="activeTab === 'info'" class="space-y-4">
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <div class="flex items-center gap-2">
                  <UserIcon class="h-4 w-4 text-gray-400" />
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Данные слушателя</h3>
                </div>

                <!-- Переключатель языка полей (RU/UZ/EN) — компактный сегмент, подписи не меньше 11px -->
                <div class="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900">
                  <span class="hidden px-1.5 text-[11px] text-gray-400 sm:inline">Язык:</span>
                  <button
                    v-for="lang in (['ru', 'uz', 'en'] as const)"
                    :key="lang"
                    type="button"
                    :class="[
                      'rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase transition-colors',
                      selectedLang === lang
                        ? 'bg-primary text-white'
                        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
                    ]"
                    @click="selectedLang = lang"
                  >
                    {{ lang }}
                  </button>
                </div>
              </div>
              <div class="divide-y divide-gray-100 dark:divide-gray-800">
                <!-- ПИНФЛ: маска + показать + копировать через UiSensitiveValue -->
                <div class="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span class="text-sm text-gray-500 dark:text-gray-400">ПИНФЛ</span>
                  <UiSensitiveValue :value="student.pinfl" class="text-gray-800 dark:text-gray-200" />
                </div>

                <div class="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Дата рождения</span>
                  <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ formatDate(student.birthDate) }}</span>
                </div>

                <div class="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Организация</span>
                  <span class="text-right text-sm font-medium text-gray-800 dark:text-gray-200">{{ student.organization }}</span>
                </div>

                <div class="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-gray-500 dark:text-gray-400">Подразделение (Служба)</span>
                    <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-primary dark:bg-white/[0.06]">{{ selectedLang }}</span>
                  </div>
                  <span class="text-right text-sm font-medium text-gray-800 dark:text-gray-200">{{ currentDepartment }}</span>
                </div>

                <div class="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-gray-500 dark:text-gray-400">Должность</span>
                    <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-primary dark:bg-white/[0.06]">{{ selectedLang }}</span>
                  </div>
                  <span class="text-right text-sm font-medium text-gray-800 dark:text-gray-200">{{ currentPosition }}</span>
                </div>
                <!-- Строка «Регистрация» убрана: дата уже есть в метриках и в блоке «Системная информация» -->
              </div>
            </div>
          </div>

          <!-- Вкладка «Обучение» -->
          <div v-show="activeTab === 'courses'" class="space-y-4">
            <div v-if="coursesLoading" class="flex justify-center py-10">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>

            <template v-else-if="studentCourses.length > 0">
              <!-- Текущее обучение: карточки с прогрессом -->
              <div v-if="activeCourses.length > 0">
                <div class="mb-3 flex items-center gap-2">
                  <div class="h-1.5 w-1.5 rounded-full bg-success"></div>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Текущее обучение</h3>
                </div>
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div
                    v-for="course in activeCourses"
                    :key="course.group_id"
                    class="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-primary/40 dark:border-gray-800 dark:bg-white/[0.03]"
                    @click="openCourseDetailModal(course)"
                  >
                    <div class="mb-2 flex items-start justify-between">
                      <h4 class="line-clamp-1 pr-6 text-sm font-medium text-gray-900 dark:text-gray-100">{{ course.course_name }}</h4>
                      <ArrowRightIcon class="absolute right-4 top-4 h-3.5 w-3.5 text-gray-300" />
                    </div>
                    <p class="mb-3 truncate text-xs text-gray-500 dark:text-gray-400">Группа: {{ course.group_name }}</p>

                    <div class="space-y-2">
                      <div class="flex items-end justify-between">
                        <span class="text-xs text-gray-400">Прогресс</span>
                        <span class="text-xs font-semibold text-primary">{{ course.progress }}%</span>
                      </div>
                      <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div class="h-full rounded-full bg-primary transition-all duration-500" :style="{ width: `${course.progress}%` }"></div>
                      </div>
                      <div class="flex justify-between pt-1">
                        <span class="text-xs text-gray-400">{{ formatShortDate(course.start_date) }} - {{ formatShortDate(course.end_date) }}</span>
                        <span class="text-xs text-gray-400">{{ course.attended_lessons }}/{{ course.total_lessons }} ач</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- История обучения: компактный список -->
              <div v-if="completedCourses.length > 0" :class="{ 'pt-2': activeCourses.length > 0 }">
                <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">История обучения</h3>
                <div class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-white/[0.03]">
                  <div
                    v-for="course in completedCourses"
                    :key="course.group_id"
                    class="group flex cursor-pointer items-center justify-between p-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    @click="openCourseDetailModal(course)"
                  >
                    <div class="flex min-w-0 items-center gap-3">
                      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10">
                        <CheckIcon class="h-4 w-4 text-success" />
                      </div>
                      <div class="min-w-0">
                        <h4 class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ course.course_name }}</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Завершен {{ formatShortDate(course.end_date) }} • {{ course.total_lessons }} ач • {{ course.progress }}%
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon class="h-3.5 w-3.5 shrink-0 text-gray-300" />
                  </div>
                </div>
              </div>
            </template>

            <!-- Пустое состояние вкладки (раньше вкладка была просто пустой) -->
            <UiEmptyState v-else title="Курсов пока нет" description="Слушатель ещё не зачислен ни в одну группу" :icon="BookOpenIcon" />
          </div>

          <!-- Вкладка «Сертификаты» -->
          <div v-show="activeTab === 'certificates'" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Выданные документы</h3>
              <UiButton v-if="canEditStudents" variant="outline" size="sm" :start-icon="PlusIcon" @click="openCertificatesModal">Добавить</UiButton>
            </div>

            <div v-if="student.certificates?.length > 0" class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-white/[0.03]">
              <div
                v-for="cert in student.certificates"
                :key="cert.id"
                class="group flex cursor-pointer items-center justify-between p-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                @click="openCertificateDetailModal(cert)"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                    <AwardIcon class="h-4 w-4 text-warning" />
                  </div>
                  <div class="min-w-0">
                    <h4 class="mb-1 truncate text-sm font-medium leading-none text-gray-900 dark:text-gray-100">{{ cert.courseName }}</h4>
                    <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>№ {{ cert.certificateNumber }}</span>
                      <span>•</span>
                      <span>Выдан {{ formatDateShort(cert.issueDate) }}</span>
                      <span>•</span>
                      <span :class="getExpiryBadgeClass(cert.expiryDate).replace('px-2 py-0.5 rounded-md', 'text-primary')">{{ getExpiryLabel(cert.expiryDate) }}</span>
                    </div>
                  </div>
                </div>
                <!-- Скачивание: на touch видно всегда, на десктопе — при hover/фокусе строки -->
                <div class="flex items-center gap-1">
                  <a v-if="cert.fileUrl" :href="`/api/certificates/download/${cert.id}`" target="_blank" title="Скачать" class="p-1.5 text-gray-400 transition-colors hover:text-primary lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100" @click.stop>
                    <DownloadIcon class="h-4 w-4" />
                  </a>
                  <ArrowRightIcon class="h-3.5 w-3.5 text-gray-300" />
                </div>
              </div>
            </div>

            <!-- Пустое состояние через UiEmptyState -->
            <UiEmptyState v-else title="Сертификаты не найдены" :icon="AwardIcon" />
          </div>
        </div>

        <!-- Боковая колонка (4 колонки): только системная информация; блок «Подсказка» убран как дубль кнопки PDF -->
        <div class="space-y-4 lg:col-span-4">
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Системная информация</h4>
            </div>
            <div class="space-y-4 p-4">
              <div class="flex items-center gap-3">
                <div class="shrink-0 rounded-lg bg-gray-100 p-2 dark:bg-white/[0.06]">
                  <ClockIcon class="h-4 w-4 text-gray-500" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Создан</p>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ formatDate(student.created_at) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="shrink-0 rounded-lg bg-gray-100 p-2 dark:bg-white/[0.06]">
                  <RefreshCwIcon class="h-4 w-4 text-gray-500" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs text-gray-500 dark:text-gray-400">Обновлен</p>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ formatDate(student.updated_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модальные окна (логика без изменений) -->
    <DatabaseStudentFormModal
      v-if="isEditModalOpen && student"
      :student="student"
      :is-open="isEditModalOpen"
      @close="closeEditModal"
      @submit="handleUpdate"
    />

    <DatabaseStudentCertificatesModal
      v-if="isCertificatesModalOpen && student"
      :student="student"
      :is-open="isCertificatesModalOpen"
      @close="closeCertificatesModal"
      @refresh="fetchStudent"
    />

    <DatabaseCertificateDetailModal
      v-if="isCertificateDetailModalOpen && selectedCertificate"
      :certificate="selectedCertificate"
      :is-open="isCertificateDetailModalOpen"
      @close="closeCertificateDetailModal"
    />

    <DatabaseStudentCourseDetailModal
      v-if="isCourseDetailModalOpen && selectedCourse"
      :course="selectedCourse"
      :is-open="isCourseDetailModalOpen"
      @close="closeCourseDetailModal"
    />

    <!-- Подтверждение удаления: тот же обработчик, что и раньше -->
    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление слушателя"
      message="Вы уверены, что хотите удалить этого слушателя? Это действие безвозвратно удалит все связанные данные."
      :item-name="student?.fullName"
      warning="Это действие нельзя отменить."
      :loading="isDeleting"
      loading-text="Удаление…"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />

    <!-- Лайтбокс фото: без blur/shadow-2xl, ПИНФЛ скрыт маской -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="isPhotoModalOpen && student"
          class="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/80 p-4"
          @click="isPhotoModalOpen = false"
        >
          <div
            class="relative w-full max-w-md space-y-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-5 text-center dark:border-gray-800 dark:bg-gray-900"
            @click.stop
          >
            <div class="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <div class="min-w-0 pr-2 text-left">
                <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ student.fullName }}</h3>
                <p class="flex items-center gap-1 text-xs text-gray-500">ПИНФЛ: <UiSensitiveValue :value="student.pinfl" /></p>
              </div>
              <button
                type="button"
                aria-label="Закрыть"
                class="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
                @click="isPhotoModalOpen = false"
              >
                <XIcon class="h-5 w-5" />
              </button>
            </div>

            <div class="relative flex max-h-[60vh] items-center justify-center overflow-hidden rounded-xl bg-gray-950 p-2">
              <img v-if="student.photo_base64" :src="student.photo_base64" class="max-h-[50vh] w-auto rounded-lg object-contain" />
              <div v-else class="flex h-36 w-36 items-center justify-center rounded-full bg-primary/10 text-4xl font-semibold text-primary">
                {{ getInitials(student.fullName) }}
              </div>
            </div>

            <div class="flex items-center justify-center space-x-1.5 pt-1 text-sm text-gray-500 dark:text-gray-400">
              <BuildingIcon class="h-3.5 w-3.5 text-gray-400" />
              <span>{{ student.organization }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type {
  Student,
  UpdateStudentData,
  StudentCertificate,
} from "~/types/student";
import {
  User as UserIcon,
  ArrowLeft,
  Check as CheckIcon,
  Building as BuildingIcon,
  Briefcase as BriefcaseIcon,
  FileDown as FileDownIcon,
  Settings as SettingsIcon,
  Trash2 as Trash2Icon,
  Award as AwardIcon,
  BookOpen as BookOpenIcon,
  Activity as ActivityIcon,
  Calendar as CalendarIcon,
  ArrowRight as ArrowRightIcon,
  Clock as ClockIcon,
  RefreshCw as RefreshCwIcon,
  Copy as CopyIcon,
  Plus as PlusIcon,
  Download as DownloadIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Info as InfoIcon,
  Maximize2 as Maximize2Icon,
  X as XIcon,
} from "lucide-vue-next";
import { usePDFExport } from "~/composables/usePDFExport";

const route = useRoute();
const router = useRouter();
const studentId = route.params.id as string;
const { authFetch } = useAuthFetch();
const notification = useNotification();
const { canEditStudents, canDeleteStudents } = usePermissions();

// State
const student = ref<Student | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const isPhotoModalOpen = ref(false);
const selectedLang = ref<"ru" | "uz" | "en">("ru");
const activeTab = ref("info");

const currentDepartment = computed(() => {
  if (!student.value) return "—";
  if (selectedLang.value === "uz")
    return student.value.departmentUz || student.value.department || "—";
  if (selectedLang.value === "en")
    return student.value.departmentEn || student.value.department || "—";
  return student.value.departmentRu || student.value.department || "—";
});

const currentPosition = computed(() => {
  if (!student.value) return "—";
  if (selectedLang.value === "uz")
    return student.value.positionUz || student.value.position || "—";
  if (selectedLang.value === "en")
    return student.value.positionEn || student.value.position || "—";
  return student.value.positionRu || student.value.position || "—";
});
const showPinfl = ref(false);

const availableTabs = [
  { id: "info", label: "Профиль", icon: UserIcon },
  { id: "courses", label: "Обучение", icon: BookOpenIcon },
  { id: "certificates", label: "Сертификаты", icon: AwardIcon },
];

// Презентационное: вкладки для UiTabs со счётчиками (видно объём раздела, не открывая его)
const tabItems = computed(() =>
  availableTabs.map((t) => ({
    ...t,
    count:
      t.id === "courses"
        ? studentCourses.value.length
        : t.id === "certificates"
          ? student.value?.certificates?.length || 0
          : undefined,
  })),
);

// Меню «⋯» в шапке: удаление вынесено в отдельную группу «Опасные» (показывается только при canDeleteStudents)
const menuGroups = [
  {
    label: "Опасные",
    items: [{ key: "delete", label: "Удалить слушателя", icon: Trash2Icon, danger: true }],
  },
];
// Выбор пункта меню вызывает прежний обработчик handleDelete (подтверждение через UiConfirmModal)
const onMenuSelect = (key: string) => {
  if (key === "delete") handleDelete();
};

/**
 * Курсы слушателя
 */
interface CourseRecord {
  group_id: string;
  course_id: string;
  course_name: string;
  course_code: string;
  group_name: string;
  start_date: string;
  end_date: string;
  total_lessons: number;
  attended_lessons: number;
  progress: number;
  status: "active" | "completed" | "dropped";
  teacher_name: string | null;
}

const studentCourses = ref<CourseRecord[]>([]);
const coursesLoading = ref(false);
const isCourseDetailModalOpen = ref(false);
const selectedCourse = ref<CourseRecord | null>(null);

const activeCourses = computed(() =>
  studentCourses.value.filter((c) => c.status === "active"),
);
const completedCourses = computed(() =>
  studentCourses.value.filter((c) => c.status === "completed"),
);

// Вычисляемые метрики
const averageProgress = computed(() => {
  if (studentCourses.value.length === 0) return 0;
  const sum = studentCourses.value.reduce((acc, c) => acc + c.progress, 0);
  return Math.round(sum / studentCourses.value.length);
});

const registrationDays = computed(() => {
  if (!student.value?.created_at) return "—";
  const created = new Date(student.value.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) return `${diffDays} дн.`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} мес.`;
  return `${Math.floor(months / 12)} г. ${months % 12} мес.`;
});

// Методы
const fetchStudent = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await authFetch<{ success: boolean; student: Student }>(
      `/api/students/${studentId}`,
    );
    if (response.success) {
      student.value = response.student;
      fetchStudentCourses();
    } else {
      error.value = "Не удалось загрузить данные";
    }
  } catch (e: any) {
    error.value = e.message || "Ошибка загрузки";
  } finally {
    loading.value = false;
  }
};

const fetchStudentCourses = async () => {
  coursesLoading.value = true;
  try {
    const response = await authFetch<{
      success: boolean;
      courses: CourseRecord[];
    }>(`/api/students/${studentId}/courses`);
    if (response.success) {
      studentCourses.value = response.courses;
    }
  } catch (err) {
    console.error("Failed to load courses:", err);
  } finally {
    coursesLoading.value = false;
  }
};

const openEditModal = () => (isEditModalOpen.value = true);
const closeEditModal = () => (isEditModalOpen.value = false);

const handleUpdate = async (data: UpdateStudentData) => {
  try {
    const response = await authFetch<{ success: boolean; student: Student }>(
      `/api/students/${studentId}`,
      {
        method: "PUT",
        body: data,
      },
    );

    if (response.success) {
      student.value = response.student;
      closeEditModal();
      notification.success("Данные слушателя обновлены");
    }
  } catch (e) {
    notification.error("Ошибка при обновлении данных");
  }
};

const handleDelete = () => (isDeleteModalOpen.value = true);
const closeDeleteModal = () => (isDeleteModalOpen.value = false);

const confirmDelete = async () => {
  isDeleting.value = true;
  try {
    await authFetch(`/api/students/${studentId}`, { method: "DELETE" });
    notification.success("Слушатель удален");
    router.push("/students");
  } catch (e) {
    notification.error("Ошибка удаления");
  } finally {
    isDeleting.value = false;
    closeDeleteModal();
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  notification.success("ПИНФЛ скопирован");
};

const exportTranscript = async () => {
  if (!student.value) return;
  notification.info("Формирование справки...");
  try {
    const { exportStudentProfile } = usePDFExport();
    await exportStudentProfile(student.value, studentCourses.value);
    notification.success("Справка успешно сформирована");
  } catch (e) {
    notification.error("Ошибка при экспорте PDF");
  }
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (date?: string | Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateShort = (date?: string | Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatShortDate = (date?: string | Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
};

// Сертификаты
const isCertificatesModalOpen = ref(false);
const isCertificateDetailModalOpen = ref(false);
const selectedCertificate = ref<any>(null);

const openCertificatesModal = () => (isCertificatesModalOpen.value = true);
const closeCertificatesModal = () => (isCertificatesModalOpen.value = false);

const openCertificateDetailModal = (cert: StudentCertificate) => {
  if (!student.value) return;
  selectedCertificate.value = {
    ...cert,
    student: {
      id: student.value.id,
      fullName: student.value.fullName,
      pinfl: student.value.pinfl,
      organization: student.value.organization,
      position: student.value.position,
      department: student.value.department,
    },
  };
  isCertificateDetailModalOpen.value = true;
};

const closeCertificateDetailModal = () => {
  isCertificateDetailModalOpen.value = false;
  selectedCertificate.value = null;
};

const openCourseDetailModal = (course: CourseRecord) => {
  selectedCourse.value = course;
  isCourseDetailModalOpen.value = true;
};

const closeCourseDetailModal = () => {
  isCourseDetailModalOpen.value = false;
  selectedCourse.value = null;
};

const getExpiryStatus = (expiryDate?: string | Date | null) => {
  if (!expiryDate) return "valid";
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "valid";
};

const getExpiryBadgeClass = (expiryDate?: string | Date | null) => {
  const status = getExpiryStatus(expiryDate);
  if (status === "expired") return "bg-danger/10 text-danger";
  if (status === "expiring") return "bg-warning/10 text-warning";
  return "bg-success/10 text-success";
};

const getExpiryLabel = (expiryDate?: string | Date | null) => {
  const status = getExpiryStatus(expiryDate);
  if (status === "expired") return "Истек";
  if (status === "expiring") return "Истекает";
  return "Активен";
};

onMounted(() => {
  fetchStudent();
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>
