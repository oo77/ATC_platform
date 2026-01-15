<template>
  <UiModal :is-open="isOpen" @close="handleClose" size="md">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"
        >
          <svg
            class="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-black dark:text-white">
          Скачивание сертификатов
        </h3>
      </div>
    </template>

    <template #default>
      <div class="space-y-5">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Выберите параметры для скачивания архива сертификатов организации
          <span class="font-semibold text-black dark:text-white">{{
            organization?.name
          }}</span
          >.
        </p>

        <!-- Выбор курса -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Курс
          </label>
          <select
            v-model="filters.courseId"
            class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary disabled:opacity-50"
            :disabled="loadingCourses"
          >
            <option value="all">Все курсы</option>
            <option
              v-for="course in courses"
              :key="course.id"
              :value="course.id"
            >
              {{ course.name }} {{ course.code ? `(${course.code})` : "" }}
            </option>
          </select>
          <p v-if="loadingCourses" class="mt-1 text-xs text-primary">
            Загрузка курсов...
          </p>
        </div>

        <!-- Выбор группы -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Группа
            <span
              v-if="loadingGroups"
              class="ml-2 text-xs text-primary animate-pulse"
              >(Загрузка...)</span
            >
          </label>
          <select
            v-model="filters.groupId"
            class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
            :disabled="filters.courseId === 'all' || loadingGroups"
          >
            <option value="all">Все группы курса</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.name }} ({{ formatDate(group.start_date) }} -
              {{ formatDate(group.end_date) }})
            </option>
          </select>
          <p
            v-if="filters.courseId === 'all'"
            class="mt-1 text-xs text-gray-500"
          >
            Выберите курс, чтобы увидеть список групп
          </p>
        </div>

        <!-- Выбор диапазона дат -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              С даты выдачи
            </label>
            <flat-pickr
              v-model="filters.startDate"
              :config="dateConfig"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              placeholder="ДД.ММ.ГГГГ"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              По дату выдачи
            </label>
            <flat-pickr
              v-model="filters.endDate"
              :config="dateConfig"
              class="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              placeholder="ДД.ММ.ГГГГ"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UiButton
          variant="outline"
          @click="handleClose"
          :disabled="isDownloading"
        >
          Отмена
        </UiButton>
        <UiButton
          variant="primary"
          @click="downloadArchive"
          :loading="isDownloading"
          class="flex items-center gap-2"
        >
          <svg
            v-if="!isDownloading"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Скачать архив
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import flatPickr from "vue-flatpickr-component";
import { Russian } from "flatpickr/dist/l10n/ru.js";
import "flatpickr/dist/flatpickr.css";

const { authFetch } = useAuthFetch();
const notification = useNotification();

interface Organization {
  id: string;
  name: string;
}

interface Course {
  id: string;
  name: string;
  code: string | null;
}

const props = defineProps<{
  organization: Organization | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const courses = ref<Course[]>([]);
const groups = ref<any[]>([]);
const loadingCourses = ref(false);
const loadingGroups = ref(false);
const isDownloading = ref(false);

const filters = ref({
  courseId: "all",
  groupId: "all",
  startDate: "",
  endDate: "",
});

const dateConfig = {
  locale: Russian,
  dateFormat: "Y-m-d",
  allowInput: true,
  altInput: true,
  altFormat: "d.m.Y",
};

// Fetch courses when modal opens
onMounted(() => {
  if (props.isOpen && props.organization) {
    fetchCourses();
  }
});

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.organization) {
      // Reset filters when opening
      filters.value = {
        courseId: "all",
        groupId: "all",
        startDate: "",
        endDate: "",
      };
      await fetchCourses();
    }
  }
);

// Watch for course change to fetch groups
watch(
  () => filters.value.courseId,
  async (newCourseId) => {
    filters.value.groupId = "all";
    if (newCourseId !== "all") {
      await fetchGroups(newCourseId);
    } else {
      groups.value = [];
    }
  }
);

const fetchCourses = async () => {
  if (!props.organization) return;

  loadingCourses.value = true;
  try {
    const response = await authFetch<{ success: boolean; data: Course[] }>(
      `/api/organizations/${props.organization.id}/courses`,
      { method: "GET" }
    );
    if (response.success) {
      courses.value = response.data;
    }
  } catch (error) {
    console.error("Ошибка загрузки курсов:", error);
    notification.error("Не удалось загрузить список курсов");
  } finally {
    loadingCourses.value = false;
  }
};

const fetchGroups = async (courseId: string) => {
  if (!props.organization) return;

  loadingGroups.value = true;
  try {
    const response = await authFetch<{ success: boolean; data: any[] }>(
      `/api/organizations/${props.organization.id}/groups?courseId=${courseId}`,
      { method: "GET" }
    );
    if (response.success) {
      groups.value = response.data;
    }
  } catch (error) {
    console.error("Ошибка загрузки групп:", error);
    notification.error("Не удалось загрузить список групп");
  } finally {
    loadingGroups.value = false;
  }
};

const formatDate = (date: string | Date | null) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU");
};

const downloadArchive = async () => {
  if (!props.organization) return;

  isDownloading.value = true;
  try {
    const params = new URLSearchParams();
    if (filters.value.courseId !== "all") {
      params.append("courseId", filters.value.courseId);
    }
    if (filters.value.groupId !== "all") {
      params.append("groupId", filters.value.groupId);
    }
    if (filters.value.startDate) {
      params.append("startDate", filters.value.startDate);
    }
    if (filters.value.endDate) {
      params.append("endDate", filters.value.endDate);
    }

    // We use standard fetch here to get blob, but we need auth token
    // authFetch handles token automatically
    const token = useCookie("auth_token").value;

    const response = await fetch(
      `/api/organizations/${
        props.organization.id
      }/certificates/archive?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Ошибка скачивания");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Try to get filename from headers
    const contentDisposition = response.headers.get("content-disposition");
    let filename = `certificates_${props.organization.id}.zip`;
    if (contentDisposition) {
      const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
      if (matches && matches[1]) {
        filename = matches[1];
      }
    }

    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    notification.success("Архив успешно скачан");
    handleClose();
  } catch (error: any) {
    console.error("Ошибка скачивания архива:", error);
    notification.error(
      error.message || "Не удалось скачать архив сертификатов"
    );
  } finally {
    isDownloading.value = false;
  }
};

const handleClose = () => {
  if (!isDownloading.value) {
    emit("close");
  }
};
</script>
