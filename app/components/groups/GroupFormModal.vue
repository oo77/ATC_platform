<template>
  <UiModal :is-open="isOpen" :title="isEdit ? 'Редактировать группу' : 'Создать группу'" size="md" @close="$emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Код группы -->
      <div>
        <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
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
              : 'border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary'
          ]"
        />
        <p v-if="errors.code" class="mt-1 text-sm text-danger">{{ errors.code }}</p>
      </div>

      <!-- Учебная программа -->
      <div>
        <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Учебная программа <span class="text-danger">*</span>
        </label>
        <div class="relative">
          <select
            v-model="form.courseId"
            :class="[
              'w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition appearance-none',
              errors.courseId
                ? 'border-danger focus:border-danger'
                : 'border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary'
            ]"
          >
            <option value="">Выберите программу...</option>
            <option
              v-for="course in courses"
              :key="course.id"
              :value="course.id"
            >
              {{ course.shortName }} - {{ course.name }} ({{ course.totalHours }} ч.)
            </option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p v-if="errors.courseId" class="mt-1 text-sm text-danger">{{ errors.courseId }}</p>
      </div>

      <!-- Даты -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
            Дата начала <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.startDate"
            type="date"
            :class="[
              'w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition',
              errors.startDate
                ? 'border-danger focus:border-danger'
                : 'border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary'
            ]"
          />
          <p v-if="errors.startDate" class="mt-1 text-sm text-danger">{{ errors.startDate }}</p>
        </div>
        <div>
          <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
            Дата окончания <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.endDate"
            type="date"
            :class="[
              'w-full rounded border-[1.5px] bg-transparent px-5 py-3 font-medium outline-none transition',
              errors.endDate
                ? 'border-danger focus:border-danger'
                : 'border-stroke focus:border-primary dark:border-form-strokedark dark:focus:border-primary'
            ]"
          />
          <p v-if="errors.endDate" class="mt-1 text-sm text-danger">{{ errors.endDate }}</p>
        </div>
      </div>

      <!-- Аудитория -->
      <div>
        <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Аудитория
        </label>
        <input
          v-model="form.classroom"
          type="text"
          placeholder="Например: Ауд. 305"
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:focus:border-primary"
        />
      </div>

      <!-- Описание -->
      <div>
        <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
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
          <input
            v-model="form.isActive"
            type="checkbox"
            class="peer sr-only"
          />
          <div class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"></div>
        </label>
        <span class="text-sm font-medium text-black dark:text-white">
          {{ form.isActive ? 'Активная группа' : 'Неактивная группа' }}
        </span>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UiButton variant="outline" @click="$emit('close')">
          Отмена
        </UiButton>
        <UiButton
          :loading="loading"
          @click="handleSubmit"
        >
          {{ isEdit ? 'Сохранить' : 'Создать группу' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { StudyGroup } from '~/types/group';
import type { Course } from '~/types/course';

const props = defineProps<{
  isOpen: boolean;
  group?: StudyGroup | null; // Если передано, режим редактирования
}>();

const emit = defineEmits<{
  close: [];
  created: [group: StudyGroup];
  updated: [group: StudyGroup];
}>();

const { authFetch } = useAuthFetch();
const toast = useNotification();

// State
const loading = ref(false);
const courses = ref<Course[]>([]);
const form = ref({
  code: '',
  courseId: '',
  startDate: '',
  endDate: '',
  classroom: '',
  description: '',
  isActive: true,
});
const errors = ref<Record<string, string>>({});

// Computed
const isEdit = computed(() => !!props.group);

// Methods
const loadCourses = async () => {
  try {
    const response = await authFetch<{ success: boolean; courses: Course[] }>('/api/courses', {
      params: { limit: 1000, isActive: true },
    });

    if (response.success && response.courses) {
      courses.value = response.courses;
    }
  } catch (error) {
    console.error('Error loading courses:', error);
  }
};

const validateForm = (): boolean => {
  errors.value = {};

  if (!form.value.code.trim()) {
    errors.value.code = 'Код группы обязателен';
  }

  if (!form.value.courseId) {
    errors.value.courseId = 'Выберите учебную программу';
  }

  if (!form.value.startDate) {
    errors.value.startDate = 'Укажите дату начала';
  }

  if (!form.value.endDate) {
    errors.value.endDate = 'Укажите дату окончания';
  } else if (form.value.startDate && new Date(form.value.endDate) < new Date(form.value.startDate)) {
    errors.value.endDate = 'Дата окончания не может быть раньше даты начала';
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  // Защита от двойного вызова при быстром клике
  if (loading.value) return;
  
  if (!validateForm()) return;

  loading.value = true;
  try {
    if (isEdit.value && props.group) {
      // Обновление
      const response = await authFetch<{ success: boolean; group?: StudyGroup; message?: string; errors?: any[] }>(
        `/api/groups/${props.group.id}`,
        {
          method: 'PUT',
          body: form.value,
        }
      );

      if (response.success && response.group) {
        toast.success('Группа успешно обновлена');
        emit('updated', response.group);
        emit('close');
      } else {
        handleErrors(response);
      }
    } else {
      // Создание
      const response = await authFetch<{ success: boolean; group?: StudyGroup; message?: string; errors?: any[] }>(
        '/api/groups',
        {
          method: 'POST',
          body: form.value,
        }
      );

      if (response.success && response.group) {
        toast.success('Группа успешно создана');
        emit('created', response.group);
        emit('close');
      } else {
        handleErrors(response);
      }
    }
  } catch (error) {
    toast.error('Произошла ошибка при сохранении');
  } finally {
    loading.value = false;
  }
};

const handleErrors = (response: { message?: string; errors?: any[] }) => {
  if (response.errors && Array.isArray(response.errors)) {
    for (const err of response.errors) {
      if (err.field) {
        errors.value[err.field] = err.message;
      }
    }
    toast.error(response.message || 'Проверьте введённые данные');
  } else {
    toast.error(response.message || 'Ошибка при сохранении');
  }
};

const resetForm = () => {
  form.value = {
    code: '',
    courseId: '',
    startDate: '',
    endDate: '',
    classroom: '',
    description: '',
    isActive: true,
  };
  errors.value = {};
};

const fillFormFromGroup = (group: StudyGroup) => {
  form.value = {
    code: group.code,
    courseId: group.courseId,
    startDate: formatDateForInput(group.startDate),
    endDate: formatDateForInput(group.endDate),
    classroom: group.classroom || '',
    description: group.description || '',
    isActive: Boolean(group.isActive),
  };
};

const formatDateForInput = (date: string | Date): string => {
  const d = new Date(date);
  // Используем локальные методы для избежания сдвига временной зоны
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Watch for modal open/close
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadCourses();
    if (props.group) {
      fillFormFromGroup(props.group);
    } else {
      resetForm();
    }
  }
});

// Watch for group changes (edit mode)
watch(() => props.group, (group) => {
  if (group && props.isOpen) {
    fillFormFromGroup(group);
  }
});
</script>
