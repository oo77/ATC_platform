<template>
  <UiModal
    :is-open="isOpen"
    :title="isEdit ? 'Редактировать группу' : 'Создать группу'"
    size="xl"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <!-- Левая колонка: Детали группы -->
        <div class="space-y-4">
          <!-- Предупреждения -->
          <div
            v-if="group?.isArchived"
            class="rounded-lg bg-yellow-100 p-2.5 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
          >
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="font-medium">Группа в архиве</span>
            </div>
          </div>

          <div
            v-if="!canEditDates && isEdit"
            class="rounded-lg bg-blue-100 p-2.5 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
          >
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Даты завершены.</span>
            </div>
          </div>

          <!-- Учебная программа -->
          <div>
            <label
              class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
            >
              Учебная программа <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <select
                v-model="form.courseId"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none transition-all font-medium"
                :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.courseId }"
              >
                <option value="">Выберите программу...</option>
                <option
                  v-for="course in courses"
                  :key="course.id"
                  :value="course.id"
                >
                  {{ course.shortName }} - {{ course.name }}
                </option>
              </select>
              <div
                class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <p v-if="errors.courseId" class="mt-1 text-xs text-danger">
              {{ errors.courseId }}
            </p>
          </div>

          <!-- Код группы -->
          <div>
            <label
              class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
            >
              Код группы <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.code"
              type="text"
              placeholder="АПАК-20"
              class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium"
              :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.code }"
            />
            <p v-if="errors.code" class="mt-1 text-xs text-danger">
              {{ errors.code }}
            </p>
          </div>

          <!-- Ряд: Даты -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
              >
                Начало
              </label>
              <input
                v-model="form.startDate"
                type="date"
                :disabled="isEdit && !canEditDates"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium"
                :class="[
                  errors.startDate ? 'border-danger focus:border-danger focus:ring-danger' : '',
                  isEdit && !canEditDates ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50' : ''
                ]"
              />
              <p v-if="errors.startDate" class="mt-1 text-xs text-danger">
                {{ errors.startDate }}
              </p>
            </div>
            <div>
              <label
                class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
              >
                Окончание
              </label>
              <input
                v-model="form.endDate"
                type="date"
                :disabled="isEdit && !canEditDates"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium"
                :class="[
                  errors.endDate ? 'border-danger focus:border-danger focus:ring-danger' : '',
                  isEdit && !canEditDates ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50' : ''
                ]"
              />
              <p v-if="errors.endDate" class="mt-1 text-xs text-danger">
                {{ errors.endDate }}
              </p>
            </div>
          </div>

          <!-- Описание (маленькое) -->
          <div>
            <label
              class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
            >
              Заметки
            </label>
            <textarea
              v-model="form.description"
              placeholder="..."
              rows="2"
              class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium resize-none"
            ></textarea>
          </div>

          <!-- Статус -->
          <div class="space-y-3">
            <label
              class="block text-xs font-bold text-slate-400 uppercase tracking-wider"
            >
              Статус группы
            </label>
            <div
              class="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
            >
              <span
                class="font-bold text-sm"
                :class="
                  form.isActive ? 'text-success' : 'text-slate-500'
                "
              >
                {{
                  form.isActive
                    ? "Группа активна"
                    : "Группа неактивна"
                }}
              </span>
              <label
                class="relative inline-flex items-center cursor-pointer"
              >
                <input
                  v-model="form.isActive"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-success peer-checked:border-success"
                ></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Правая колонка: Только Файлы (Официальные основания) -->
        <div class="h-full flex flex-col">
          <label
            class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
          >
            Официальные основания (PDF)
            <span class="text-danger" v-if="!isEdit">*</span>
          </label>

          <div
            class="grow rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 flex flex-col"
          >
            <!-- Загрузка новых файлов (при создании) -->
            <div v-if="!isEdit" class="h-full">
              <GroupsGroupReportUploader
                ref="uploaderRef"
                :loading="false"
                @files-selected="handleFilesSelected"
                class="h-full"
              />
              <p v-if="errors.file" class="mt-2 text-xs text-danger">
                {{ errors.file }}
              </p>
            </div>

            <!-- Список файлов (Режим просмотра) -->
            <div v-else class="h-full flex flex-col">
              <div
                v-if="loadingReports"
                class="text-sm text-gray-500 grow flex items-center justify-center"
              >
                <span class="inline-flex items-center gap-2">
                  <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Загрузка...
                </span>
              </div>
              <div
                v-else-if="existingReports.length === 0"
                class="text-sm text-gray-500 grow flex items-center justify-center italic"
              >
                Нет документов
              </div>
              <div
                v-else
                class="grow overflow-y-auto pr-1 custom-scrollbar space-y-2 max-h-[300px]"
              >
                <div
                  v-for="report in existingReports"
                  :key="report.id"
                  class="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-700 hover:shadow-sm"
                >
                  <div class="flex items-center gap-3 overflow-hidden">
                    <div
                      class="h-8 w-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0"
                    >
                      <span class="text-[10px] font-bold">PDF</span>
                    </div>
                    <div class="min-w-0">
                      <p
                        class="truncate text-sm font-medium"
                        :title="report.name"
                      >
                        {{ report.name }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ new Date(report.uploadedAt).toLocaleDateString() }}
                      </p>
                    </div>
                  </div>
                  <a
                    :href="report.url"
                    target="_blank"
                    class="text-gray-500 hover:text-primary p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Скачать"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              <div
                class="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center border-t border-slate-200 dark:border-slate-700 pt-2"
              >
                Управление документами на странице группы
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div
        class="flex justify-between items-center pt-2 border-t border-stroke dark:border-strokedark mt-2"
      >
        <div class="text-xs text-gray-400">
          {{
            isEdit ? "ID: " + group?.id.slice(0, 8) : "* - Обязательные поля"
          }}
        </div>
        <div class="flex gap-3">
          <UiButton variant="outline" @click="$emit('close')">
            Отмена
          </UiButton>
          <UiButton
            :loading="loading"
            @click="handleSubmit"
            class="min-w-[140px]"
          >
            {{ isEdit ? "Сохранить" : "Создать группу" }}
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { StudyGroup } from "~/types/group";
import type { Course } from "~/types/course";

const props = defineProps<{
  isOpen: boolean;
  group?: StudyGroup | null;
}>();

const emit = defineEmits<{
  close: [];
  created: [group: StudyGroup];
  updated: [group: StudyGroup];
}>();

const { authFetch } = useAuthFetch();
const toast = useNotification();
const { user } = useAuth();

// State
const loading = ref(false);
const courses = ref<Course[]>([]);
const form = ref({
  code: "",
  courseId: "",
  startDate: "",
  endDate: "",
  description: "",
  isActive: true,
});
const errors = ref<Record<string, string>>({});

// Files
const uploaderRef = ref<any>(null);
const selectedFiles = ref<File[]>([]);
const existingReports = ref<any[]>([]);
const loadingReports = ref(false);

// Computed
const isEdit = computed(() => !!props.group);
const userRole = computed(() => user.value?.role);

// Check if dates can be edited
const canEditDates = computed(() => {
  if (!isEdit.value) return true; // При создании можно
  if (userRole.value === "ADMIN") return true; // Админ может всегда

  if (props.group && props.group.endDate) {
    const now = new Date();
    const endDate = new Date(props.group.endDate);
    return now <= endDate; // Если дата окончания в будущем, можно редактировать
  }

  return true;
});

// Methods
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const handleFilesSelected = (files: File[]) => {
  selectedFiles.value = files;
  errors.value.file = "";
};

const loadReports = async (groupId: string) => {
  loadingReports.value = true;
  try {
    const response = await authFetch<{ success: boolean; files: any[] }>(
      `/api/groups/${groupId}/reports`
    );
    if (response.success) {
      existingReports.value = response.files;
    }
  } catch (error) {
    console.error("Ошибка загрузки отчетов:", error);
  } finally {
    loadingReports.value = false;
  }
};

const loadCourses = async () => {
  try {
    const response = await authFetch<{ success: boolean; courses: Course[] }>(
      "/api/courses",
      {
        params: { limit: 1000, isActive: true },
      }
    );

    if (response.success && response.courses) {
      courses.value = response.courses;
    }
  } catch (error) {
    console.error("Error loading courses:", error);
  }
};

const validateForm = (): boolean => {
  errors.value = {};

  if (!form.value.code.trim()) {
    errors.value.code = "Код обязателен";
  }

  if (!form.value.courseId) {
    errors.value.courseId = "Выберите программу";
  }

  if (!form.value.startDate) {
    errors.value.startDate = "Укажите начало";
  }

  if (!form.value.endDate) {
    errors.value.endDate = "Укажите окончание";
  } else if (
    form.value.startDate &&
    new Date(form.value.endDate) < new Date(form.value.startDate)
  ) {
    errors.value.endDate = "Ошибка дат";
  }

  // При создании файлы обязательны
  if (!isEdit.value && selectedFiles.value.length === 0) {
    errors.value.file = "Загрузите PDF";
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  if (loading.value) return;
  if (!validateForm()) return;

  loading.value = true;
  try {
    if (isEdit.value && props.group) {
      // Обновление (PUT)
      // При обновлении отправляем JSON, так как пока не поддерживаем загрузку новых файлов через PUT (или это не требуется в этом окне)
      const updateData = { ...form.value };

      const response = await authFetch<{
        success: boolean;
        group?: StudyGroup;
        message?: string;
        errors?: any[];
      }>(`/api/groups/${props.group.id}`, {
        method: "PUT",
        body: updateData,
      });

      if (response.success && response.group) {
        toast.success("Группа обновлена");
        emit("updated", response.group);
        emit("close");
      } else {
        handleErrors(response);
      }
    } else {
      // Создание (POST) - используем FormData
      const formData = new FormData();

      // Добавляем данные как JSON строку (согласно нашему API)
      formData.append("data", JSON.stringify(form.value));

      // Добавляем все файлы
      for (const file of selectedFiles.value) {
        formData.append("reportFile", file);
      }

      const response = await authFetch<{
        success: boolean;
        group?: StudyGroup;
        message?: string;
        errors?: any[];
      }>("/api/groups", {
        method: "POST",
        body: formData,
        // Важно: не устанавливаем Content-Type вручную, браузер сам сделает это для FormData
      });

      if (response.success && response.group) {
        toast.success("Группа создана");
        emit("created", response.group);
        emit("close");
      } else {
        handleErrors(response);
      }
    }
  } catch (error: any) {
    if (error.data) {
      handleErrors(error.data);
    } else {
      toast.error("Ошибка сохранения");
    }
  } finally {
    loading.value = false;
  }
};

const handleErrors = (response: { message?: string; errors?: any[] }) => {
  if (response.errors && Array.isArray(response.errors)) {
    for (const err of response.errors) {
      if (err.field) {
        // Если поле вложенное (например, data.code), берем последнюю часть
        const fieldName = err.field.includes(".")
          ? err.field.split(".").pop()
          : err.field;
        errors.value[fieldName] = err.message;
      }
    }
    toast.error(response.message || "Проверьте данные");
  } else {
    toast.error(response.message || "Ошибка");
  }
};

const resetForm = () => {
  form.value = {
    code: "",
    courseId: "",
    startDate: "",
    endDate: "",
    description: "",
    isActive: true,
  };
  errors.value = {};
  selectedFiles.value = [];
  uploaderRef.value?.clearFiles();
  existingReports.value = [];
};

const fillFormFromGroup = (group: any) => {
  // Используем any для group чтобы поддержать isArchived если он есть в ответе
  form.value = {
    code: group.code,
    courseId: group.courseId,
    startDate: formatDateForInput(group.startDate),
    endDate: formatDateForInput(group.endDate),
    description: group.description || "",
    isActive: Boolean(group.isActive),
  };

  if (group.id) {
    loadReports(group.id);
  }
};

const formatDateForInput = (date: string | Date): string => {
  if (!date) return "";
  const d = new Date(date);
  // Используем локальные методы для избежания сдвига временной зоны
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Watchers
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      loadCourses();
      if (props.group) {
        fillFormFromGroup(props.group);
      } else {
        resetForm();
      }
    }
  }
);

watch(
  () => props.group,
  (group) => {
    if (group && props.isOpen) {
      fillFormFromGroup(group);
    }
  }
);
</script>
