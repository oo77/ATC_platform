<template>
  <UiModal
    :is-open="isOpen"
    title="Создать пересдачу"
    size="lg"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Информация об оригинальном занятии -->
      <div
        v-if="originalEvent"
        class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"
          >
            <svg
              class="w-5 h-5 text-orange-600 dark:text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Оригинальное занятие
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ originalEvent.title }}
            </p>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400">Дата:</span>
            <span class="ml-1 font-medium text-gray-900 dark:text-white">
              {{ formatDate(originalEvent.startTime) }}
            </span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Время:</span>
            <span class="ml-1 font-medium text-gray-900 dark:text-white">
              {{ formatTime(originalEvent.startTime) }} -
              {{ formatTime(originalEvent.endTime) }}
            </span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Тип:</span>
            <span class="ml-1 font-medium text-gray-900 dark:text-white">
              {{ eventTypeLabels[originalEvent.eventType] }}
            </span>
          </div>
        </div>
      </div>

      <!-- Выбор студентов -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Студенты для пересдачи <span class="text-danger">*</span>
          </label>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="text-xs text-primary hover:underline"
              @click="selectAllStudents"
            >
              Выбрать всех
            </button>
            <span class="text-gray-300">|</span>
            <button
              type="button"
              class="text-xs text-primary hover:underline"
              @click="clearStudents"
            >
              Снять выбор
            </button>
          </div>
        </div>

        <UiMultiSelect
          v-model="form.studentIds"
          :options="students"
          placeholder="Выберите студентов"
          searchable
        />

        <p v-if="loadingStudents" class="mt-1 text-xs text-primary">
          Загрузка студентов...
        </p>
        <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Выбрано: {{ form.studentIds.length }} из {{ students.length }}
        </p>
        <p v-if="errors.studentIds" class="mt-1 text-xs text-danger">
          {{ errors.studentIds }}
        </p>
      </div>

      <!-- Дата и время -->
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Дата <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.date"
            type="date"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p v-if="errors.date" class="mt-1 text-xs text-danger">
            {{ errors.date }}
          </p>
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Начало <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.startTime"
            type="time"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p v-if="errors.startTime" class="mt-1 text-xs text-danger">
            {{ errors.startTime }}
          </p>
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Окончание <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.endTime"
            type="time"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p v-if="errors.endTime" class="mt-1 text-xs text-danger">
            {{ errors.endTime }}
          </p>
        </div>
      </div>

      <!-- Инструктор -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Преподаватель <span class="text-danger">*</span>
        </label>
        <select
          v-model="form.instructorId"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Выберите преподавателя</option>
          <option
            v-for="instructor in instructors"
            :key="instructor.id"
            :value="instructor.id"
          >
            {{ instructor.fullName }}
          </option>
        </select>
        <p v-if="errors.instructorId" class="mt-1 text-xs text-danger">
          {{ errors.instructorId }}
        </p>
      </div>

      <!-- Аудитория (опционально) -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Аудитория
        </label>
        <select
          v-model="form.classroomId"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Не указана</option>
          <option
            v-for="classroom in classrooms"
            :key="classroom.id"
            :value="classroom.id"
          >
            {{ classroom.name }}
          </option>
        </select>
      </div>

      <!-- Кнопки -->
      <div
        class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <UiButton variant="outline" type="button" @click="handleClose">
          Отмена
        </UiButton>
        <UiButton
          variant="primary"
          type="submit"
          :loading="submitting"
          :disabled="form.studentIds.length === 0"
        >
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Создать пересдачу
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { useNotification } from "~/composables/useNotification";
import { useAuthFetch } from "~/composables/useAuthFetch";
import UiMultiSelect from "~/components/ui/MultiSelect.vue";

interface OriginalEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  eventType: "theory" | "practice" | "assessment" | "other";
  groupId: string;
  disciplineId: string;
  instructorId?: string;
  classroomId?: string;
}

interface Student {
  id: string;
  fullName: string;
  grade?: number;
}

interface StudentOption {
  id: string;
  label: string;
  description?: string;
  grade?: number;
}

interface Instructor {
  id: string;
  fullName: string;
}

interface Classroom {
  id: string;
  name: string;
}

const props = defineProps<{
  isOpen: boolean;
  originalEvent: OriginalEvent | null;
  students?: Student[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created", retakeEventId: string): void;
}>();

const { authFetch } = useAuthFetch();
const { success, error: showError } = useNotification();

const eventTypeLabels: Record<string, string> = {
  theory: "Теория",
  practice: "Практика",
  assessment: "Проверка знаний",
  other: "Другое",
};

// Состояние формы
const form = reactive({
  studentIds: [] as string[],
  date: "",
  startTime: "",
  endTime: "",
  instructorId: "",
  classroomId: "",
});

const errors = reactive({
  studentIds: "",
  date: "",
  startTime: "",
  endTime: "",
  instructorId: "",
});

const submitting = ref(false);
const loadingStudents = ref(false);
const students = ref<StudentOption[]>([]);
const instructors = ref<Instructor[]>([]);
const classrooms = ref<Classroom[]>([]);

// Форматирование
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Загрузка данных
const loadData = async () => {
  if (!props.originalEvent) return;

  loadingStudents.value = true;

  try {
    // Загружаем студентов с оценками
    if (props.students && props.students.length > 0) {
      students.value = props.students.map((s) => ({
        id: s.id,
        label: s.fullName,
        description:
          s.grade !== undefined
            ? `Оценка: ${s.grade}%${s.grade < 60 ? " (Не сдал)" : ""}`
            : undefined,
        grade: s.grade,
      }));
    } else {
      const groupResponse = await authFetch<{
        success: boolean;
        group: { students: any[] };
      }>(`/api/groups/${props.originalEvent.groupId}`);

      if (groupResponse.success && groupResponse.group?.students) {
        students.value = groupResponse.group.students.map((s: any) => {
          const student = s.student || {};
          const fullName = student.fullName || s.fullName || "Студент";
          // Check if grade is present in the response (it might not be for simple group fetch)
          const grade = s.grade;
          const description =
            grade !== undefined
              ? `Оценка: ${grade}%${grade < 60 ? " (Не сдал)" : ""}`
              : undefined;

          return {
            id: s.studentId || s.id,
            label: fullName,
            description,
            grade,
          };
        });
      }
    }

    // Загружаем инструкторов
    const instructorsResponse = await authFetch("/api/instructors");
    if (instructorsResponse.success) {
      instructors.value = instructorsResponse.instructors.map((i: any) => ({
        id: i.id,
        fullName: i.fullName,
      }));
    }

    // Загружаем аудитории
    const classroomsResponse = await authFetch("/api/classrooms");
    if (classroomsResponse.success) {
      classrooms.value = classroomsResponse.classrooms.map((c: any) => ({
        id: c.id,
        name: c.name,
      }));
    }

    // Устанавливаем значения по умолчанию
    if (props.originalEvent.instructorId) {
      form.instructorId = props.originalEvent.instructorId;
    }
    if (props.originalEvent.classroomId) {
      form.classroomId = props.originalEvent.classroomId;
    }

    // Устанавливаем время из оригинального занятия
    const originalStart = new Date(props.originalEvent.startTime);
    const originalEnd = new Date(props.originalEvent.endTime);
    form.startTime = originalStart.toTimeString().slice(0, 5);
    form.endTime = originalEnd.toTimeString().slice(0, 5);

    // Дату ставим завтра по умолчанию
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    form.date = tomorrow.toISOString().split("T")[0] || "";

    // Автоматически выбираем студентов с низкой оценкой
    form.studentIds = students.value
      .filter((s) => s.grade !== undefined && s.grade < 60)
      .map((s) => s.id);
  } catch (err) {
    console.error("[RetakeModal] Error loading data:", err);
    showError("Ошибка загрузки данных");
  } finally {
    loadingStudents.value = false;
  }
};

// Выбор студентов
const selectAllStudents = () => {
  form.studentIds = students.value.map((s) => s.id);
};

const clearStudents = () => {
  form.studentIds = [];
};

// Валидация
const validate = (): boolean => {
  let isValid = true;

  // Очищаем ошибки
  errors.studentIds = "";
  errors.date = "";
  errors.startTime = "";
  errors.endTime = "";
  errors.instructorId = "";

  if (form.studentIds.length === 0) {
    errors.studentIds = "Выберите хотя бы одного студента";
    isValid = false;
  }

  if (!form.date) {
    errors.date = "Укажите дату";
    isValid = false;
  }

  if (!form.startTime) {
    errors.startTime = "Укажите время начала";
    isValid = false;
  }

  if (!form.endTime) {
    errors.endTime = "Укажите время окончания";
    isValid = false;
  }

  if (form.startTime && form.endTime && form.startTime >= form.endTime) {
    errors.endTime = "Время окончания должно быть больше времени начала";
    isValid = false;
  }

  if (!form.instructorId) {
    errors.instructorId = "Выберите преподавателя";
    isValid = false;
  }

  return isValid;
};

// Отправка формы
const handleSubmit = async () => {
  if (!validate() || !props.originalEvent) return;

  submitting.value = true;

  try {
    const response = await authFetch("/api/schedule/retake", {
      method: "POST",
      body: {
        originalEventId: props.originalEvent.id,
        studentIds: form.studentIds,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        instructorId: form.instructorId,
        classroomId: form.classroomId || undefined,
      },
    });

    if (response.success) {
      success(response.message || "Пересдача создана");
      emit("created", response.retakeEventId);
      handleClose();
    } else {
      showError(response.message || "Ошибка создания пересдачи");
    }
  } catch (err: any) {
    console.error("[RetakeModal] Submit error:", err);
    showError(err.data?.message || err.message || "Ошибка создания пересдачи");
  } finally {
    submitting.value = false;
  }
};

// Закрытие
const handleClose = () => {
  // Сброс формы
  form.studentIds = [];
  form.date = "";
  form.startTime = "";
  form.endTime = "";
  form.instructorId = "";
  form.classroomId = "";

  // Сброс ошибок
  errors.studentIds = "";
  errors.date = "";
  errors.startTime = "";
  errors.endTime = "";
  errors.instructorId = "";

  emit("close");
};

// Следим за открытием
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      loadData();
    }
  }
);
</script>
