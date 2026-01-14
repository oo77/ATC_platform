<template>
  <UiModal
    :is-open="isOpen"
    :title="isEdit ? 'Редактировать группу' : 'Создать группу'"
    size="lg"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Предупреждения -->
      <div
        v-if="group?.isArchived"
        class="rounded bg-yellow-100 p-4 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
      >
        <div class="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="font-medium">Группа находится в архиве</span>
        </div>
      </div>

      <div
        v-if="!canEditDates && isEdit"
        class="rounded bg-blue-100 p-4 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
      >
        <div class="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-sm"
            >Редактирование дат заблокировано (группа завершена). Для изменения
            обратитесь к администратору.</span
          >
        </div>
      </div>

      <!-- Код группы -->
      <div>
        <label
          class="mb-2.5 block text-sm font-medium text-black dark:text-white"
        >
          Код группы <span class="text-danger">*</span>
        </label>
        <input
          v-model="form.code"
          type="text"
          placeholder="Например: АПАК-20"
          :class="[
            'w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition',
            errors.code
              ? 'border-danger focus:border-danger'
              : 'border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary',
          ]"
        />
        <p v-if="errors.code" class="mt-1 text-sm text-danger">
          {{ errors.code }}
        </p>
      </div>

      <!-- Учебная программа -->
      <div>
        <label
          class="mb-2.5 block text-sm font-medium text-black dark:text-white"
        >
          Учебная программа <span class="text-danger">*</span>
        </label>
        <div class="relative">
          <select
            v-model="form.courseId"
            :class="[
              'w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition appearance-none',
              errors.courseId
                ? 'border-danger focus:border-danger'
                : 'border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary',
            ]"
          >
            <option value="">Выберите программу...</option>
            <option
              v-for="course in courses"
              :key="course.id"
              :value="course.id"
            >
              {{ course.shortName }} - {{ course.name }} ({{
                course.totalHours
              }}
              ч.)
            </option>
          </select>
          <svg
            class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
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
        <p v-if="errors.courseId" class="mt-1 text-sm text-danger">
          {{ errors.courseId }}
        </p>
      </div>

      <!-- Даты -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label
            class="mb-2.5 block text-sm font-medium text-black dark:text-white"
          >
            Дата начала <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.startDate"
            type="date"
            :disabled="isEdit && !canEditDates"
            :class="[
              'w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition',
              errors.startDate
                ? 'border-danger focus:border-danger'
                : 'border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary',
              isEdit && !canEditDates
                ? 'bg-gray-100 dark:bg-meta-4 opacity-70 cursor-not-allowed'
                : '',
            ]"
          />
          <p v-if="errors.startDate" class="mt-1 text-sm text-danger">
            {{ errors.startDate }}
          </p>
        </div>
        <div>
          <label
            class="mb-2.5 block text-sm font-medium text-black dark:text-white"
          >
            Дата окончания <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.endDate"
            type="date"
            :disabled="isEdit && !canEditDates"
            :class="[
              'w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition',
              errors.endDate
                ? 'border-danger focus:border-danger'
                : 'border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary',
              isEdit && !canEditDates
                ? 'bg-gray-100 dark:bg-meta-4 opacity-70 cursor-not-allowed'
                : '',
            ]"
          />
          <p v-if="errors.endDate" class="mt-1 text-sm text-danger">
            {{ errors.endDate }}
          </p>
        </div>
      </div>

      <!-- Аудитория и Описание -->
      <div>
        <label
          class="mb-2.5 block text-sm font-medium text-black dark:text-white"
        >
          Аудитория
        </label>
        <input
          v-model="form.classroom"
          type="text"
          placeholder="Например: Ауд. 305"
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
        />
      </div>

      <div>
        <label
          class="mb-2.5 block text-sm font-medium text-black dark:text-white"
        >
          Описание
        </label>
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="Дополнительная информация о группе..."
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary resize-none"
        ></textarea>
      </div>

      <!-- Статус -->
      <div class="flex items-center gap-3">
        <label class="relative inline-flex cursor-pointer items-center">
          <input v-model="form.isActive" type="checkbox" class="peer sr-only" />
          <div
            class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"
          ></div>
        </label>
        <span class="text-sm font-medium text-black dark:text-white">
          {{ form.isActive ? "Активная группа" : "Неактивная группа" }}
        </span>
      </div>

      <!-- Файлы PDF (Обязательны при создании) -->
      <div class="border-t pt-4 dark:border-form-strokedark">
        <label
          class="mb-2.5 block text-sm font-medium text-black dark:text-white"
        >
          Официальные основания (PDF)
          <span class="text-danger" v-if="!isEdit">*</span>
        </label>

        <!-- Загрузка новых файлов (при создании) -->
        <div v-if="!isEdit">
          <GroupsGroupReportUploader
            ref="uploaderRef"
            :loading="false"
            @files-selected="handleFilesSelected"
          />
          <p v-if="errors.file" class="mt-2 text-sm text-danger">
            {{ errors.file }}
          </p>
        </div>

        <!-- Список файлов (Режим просмотра) -->
        <div v-else class="space-y-3">
          <div v-if="loadingReports" class="text-sm text-gray-500">
            Загрузка документов...
          </div>
          <div
            v-else-if="existingReports.length === 0"
            class="text-sm text-gray-500"
          >
            Нет загруженных документов
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="report in existingReports"
              :key="report.id"
              class="flex items-center justify-between rounded border border-stroke p-3 dark:border-form-strokedark"
            >
              <div class="flex items-center gap-3 overflow-hidden">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-danger/10 text-danger"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">{{ report.name }}</p>
                  <p class="text-xs text-gray-500">
                    {{ new Date(report.uploadedAt).toLocaleDateString() }} •
                    {{ formatFileSize(report.size) }}
                  </p>
                </div>
              </div>
              <a
                :href="report.url"
                target="_blank"
                class="flex shrink-0 items-center gap-1 rounded bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
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
                Скачать
              </a>
            </div>

            <!-- Инфо-подсказка -->
            <div class="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
              Для загрузки новых файлов используйте кнопку "Загрузить документ"
              на странице группы.
            </div>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UiButton variant="outline" @click="$emit('close')"> Отмена </UiButton>
        <UiButton :loading="loading" @click="handleSubmit">
          {{ isEdit ? "Сохранить" : "Создать группу" }}
        </UiButton>
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
  classroom: "",
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
    errors.value.code = "Код группы обязателен";
  }

  if (!form.value.courseId) {
    errors.value.courseId = "Выберите учебную программу";
  }

  if (!form.value.startDate) {
    errors.value.startDate = "Укажите дату начала";
  }

  if (!form.value.endDate) {
    errors.value.endDate = "Укажите дату окончания";
  } else if (
    form.value.startDate &&
    new Date(form.value.endDate) < new Date(form.value.startDate)
  ) {
    errors.value.endDate = "Дата окончания не может быть раньше даты начала";
  }

  // При создании файлы обязательны
  if (!isEdit.value && selectedFiles.value.length === 0) {
    errors.value.file = "Загрузите хотя бы один PDF-файл";
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
        toast.success("Группа успешно обновлена");
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
        toast.success("Группа успешно создана");
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
      toast.error("Произошла ошибка при сохранении");
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
    toast.error(response.message || "Проверьте введённые данные");
  } else {
    toast.error(response.message || "Ошибка при сохранении");
  }
};

const resetForm = () => {
  form.value = {
    code: "",
    courseId: "",
    startDate: "",
    endDate: "",
    classroom: "",
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
    classroom: group.classroom || "",
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
