<template>
  <UiModal :is-open="isOpen" :title="title" size="lg" @close="handleClose">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Название дисциплины -->
      <div>
        <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Название дисциплины <span class="text-danger">*</span>
        </label>
        <input
          v-model="formData.name"
          type="text"
          placeholder="Введите название дисциплины"
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          :class="{ 'border-danger': errors.name }"
          required
        />
        <p v-if="errors.name" class="mt-1 text-sm text-danger">{{ errors.name }}</p>
      </div>

      <!-- Описание -->
      <div>
        <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Описание
        </label>
        <textarea
          v-model="formData.description"
          rows="3"
          placeholder="Введите описание дисциплины"
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        ></textarea>
      </div>

      <!-- Разбивка часов -->
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <h4 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          Распределение часов по видам обучения
        </h4>
        
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <!-- Теория -->
          <div>
            <label class="mb-2 block text-sm font-medium text-black dark:text-white">
              Теория <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <input
                v-model.number="formData.theoryHours"
                type="number"
                min="0"
                placeholder="0"
                class="w-full rounded border-[1.5px] border-stroke bg-white px-4 py-2.5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                :class="{ 'border-danger': errors.theoryHours }"
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">ч</span>
            </div>
            <p v-if="errors.theoryHours" class="mt-1 text-xs text-danger">{{ errors.theoryHours }}</p>
          </div>

          <!-- Практика -->
          <div>
            <label class="mb-2 block text-sm font-medium text-black dark:text-white">
              Практика <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <input
                v-model.number="formData.practiceHours"
                type="number"
                min="0"
                placeholder="0"
                class="w-full rounded border-[1.5px] border-stroke bg-white px-4 py-2.5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                :class="{ 'border-danger': errors.practiceHours }"
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">ч</span>
            </div>
            <p v-if="errors.practiceHours" class="mt-1 text-xs text-danger">{{ errors.practiceHours }}</p>
          </div>

          <!-- Проверка знаний -->
          <div>
            <label class="mb-2 block text-sm font-medium text-black dark:text-white">
              Проверка знаний <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <input
                v-model.number="formData.assessmentHours"
                type="number"
                min="0"
                placeholder="0"
                class="w-full rounded border-[1.5px] border-stroke bg-white px-4 py-2.5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                :class="{ 'border-danger': errors.assessmentHours }"
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">ч</span>
            </div>
            <p v-if="errors.assessmentHours" class="mt-1 text-xs text-danger">{{ errors.assessmentHours }}</p>
          </div>
        </div>

        <!-- Общая сумма часов -->
        <div class="mt-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Всего часов:</span>
          <span class="text-lg font-bold text-primary">{{ totalHours }} ч</span>
        </div>
        <p v-if="errors.totalHours" class="mt-2 text-sm text-danger">{{ errors.totalHours }}</p>
      </div>

      <!-- Инструкторы -->
      <ProgramsInstructorMultiSelect v-model="formData.instructorIds" />

      <!-- Кнопки действий -->
      <div class="flex justify-end gap-3 border-t border-stroke pt-6 dark:border-strokedark">
        <UiButton
          type="button"
          variant="outline"
          @click="handleClose"
          :disabled="loading"
        >
          Отмена
        </UiButton>
        <UiButton
          type="submit"
          variant="primary"
          :loading="loading"
          :disabled="loading"
        >
          {{ discipline ? 'Сохранить изменения' : 'Добавить дисциплину' }}
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import type { Discipline, CreateDisciplineData } from '~/types/course';

const props = defineProps<{
  isOpen: boolean;
  courseId: string;
  discipline?: Discipline;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

// State
const loading = ref(false);
const errors = ref<Record<string, string>>({});

const formData = ref<CreateDisciplineData>({
  name: '',
  description: '',
  theoryHours: 0,
  practiceHours: 0,
  assessmentHours: 0,
  instructorIds: [],
});

// Computed
const title = computed(() => {
  return props.discipline ? 'Редактировать дисциплину' : 'Добавить дисциплину';
});

const totalHours = computed(() => {
  return formData.value.theoryHours + formData.value.practiceHours + formData.value.assessmentHours;
});

// Methods
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    theoryHours: 0,
    practiceHours: 0,
    assessmentHours: 0,
    instructorIds: [],
  };
  errors.value = {};
};

const loadDisciplineData = () => {
  if (props.discipline) {
    formData.value = {
      name: props.discipline.name,
      description: props.discipline.description || '',
      theoryHours: props.discipline.theoryHours,
      practiceHours: props.discipline.practiceHours,
      assessmentHours: props.discipline.assessmentHours,
      instructorIds: props.discipline.instructors?.map(di => di.instructorId) || [],
    };
  } else {
    resetForm();
  }
};

const validateForm = (): boolean => {
  errors.value = {};

  if (!formData.value.name.trim()) {
    errors.value.name = 'Название обязательно';
  }

  if (formData.value.theoryHours < 0) {
    errors.value.theoryHours = 'Не может быть отрицательным';
  }

  if (formData.value.practiceHours < 0) {
    errors.value.practiceHours = 'Не может быть отрицательным';
  }

  if (formData.value.assessmentHours < 0) {
    errors.value.assessmentHours = 'Не может быть отрицательным';
  }

  if (totalHours.value === 0) {
    errors.value.totalHours = 'Общее количество часов должно быть больше нуля';
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  // Защита от двойного вызова при быстром клике
  if (loading.value) return;
  
  if (!validateForm()) {
    return;
  }

  loading.value = true;

  try {
    if (props.discipline) {
      // Обновление существующей дисциплины
      await authFetch(`/api/courses/${props.courseId}/disciplines/${props.discipline.id}`, {
        method: 'PATCH',
        body: formData.value,
      });
      showSuccess('Дисциплина успешно обновлена', 'Успех');
    } else {
      // Создание новой дисциплины
      await authFetch(`/api/courses/${props.courseId}/disciplines`, {
        method: 'POST',
        body: formData.value,
      });
      showSuccess('Дисциплина успешно добавлена', 'Успех');
    }

    emit('success');
    handleClose();
  } catch (error: any) {
    console.error('Error saving discipline:', error);
    showError(
      error.data?.message || 'Не удалось сохранить дисциплину',
      'Ошибка'
    );
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  if (!loading.value) {
    resetForm();
    emit('close');
  }
};

// Watch for changes in props
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    loadDisciplineData();
  }
});
</script>
