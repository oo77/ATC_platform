<template>
  <UiModal :is-open="isOpen" :title="title" size="lg">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      
      <!-- Название дисциплины -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          Название дисциплины <span class="text-danger">*</span>
        </label>
        <input
          v-model="formData.name"
          type="text"
          placeholder="Введите название дисциплины"
          class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium"
          :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.name }"
          required
        />
        <p v-if="errors.name" class="mt-1 text-xs font-bold text-danger">{{ errors.name }}</p>
      </div>

      <!-- Описание -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          Описание
        </label>
        <textarea
          v-model="formData.description"
          rows="3"
          placeholder="Введите описание дисциплины"
          class="w-full rounded-xl border border-slate-200 bg-transparent py-3 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 transition-all font-medium custom-scrollbar"
        ></textarea>
      </div>

      <!-- Разбивка часов -->
      <div class="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <h4 class="mb-4 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock class="w-4 h-4 text-primary" />
          Распределение часов по видам
        </h4>
        
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <!-- Теория -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 text-center py-1 rounded border border-slate-100 dark:border-slate-700">
              Теория <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <input
                v-model.number="formData.theoryHours"
                type="number"
                min="0"
                placeholder="0"
                class="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-800 px-4 py-2.5 font-bold text-slate-900 dark:text-white outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 pl-12"
                :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.theoryHours }"
                required
              />
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">ч</span>
            </div>
            <p v-if="errors.theoryHours" class="mt-1 text-xs font-bold text-danger">{{ errors.theoryHours }}</p>
          </div>

          <!-- Практика -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 text-center py-1 rounded border border-slate-100 dark:border-slate-700">
              Практика <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <input
                v-model.number="formData.practiceHours"
                type="number"
                min="0"
                placeholder="0"
                class="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-800 px-4 py-2.5 font-bold text-slate-900 dark:text-white outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 pl-12"
                :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.practiceHours }"
                required
              />
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">ч</span>
            </div>
            <p v-if="errors.practiceHours" class="mt-1 text-xs font-bold text-danger">{{ errors.practiceHours }}</p>
          </div>

          <!-- Проверка знаний -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 text-center py-1 rounded border border-slate-100 dark:border-slate-700">
              Проверка <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <input
                v-model.number="formData.assessmentHours"
                type="number"
                min="0"
                placeholder="0"
                class="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-800 px-4 py-2.5 font-bold text-slate-900 dark:text-white outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 pl-12"
                :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.assessmentHours }"
                required
              />
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">ч</span>
            </div>
            <p v-if="errors.assessmentHours" class="mt-1 text-xs font-bold text-danger">{{ errors.assessmentHours }}</p>
          </div>
        </div>

        <!-- Общая сумма часов -->
        <div class="mt-4 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
          <span class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Всего часов:</span>
          <span class="text-xl font-black text-primary">{{ totalHours }} ч</span>
        </div>
        <p v-if="errors.totalHours" class="mt-2 text-xs font-bold text-danger">{{ errors.totalHours }}</p>
      </div>

      <!-- Инструкторы -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          Инструкторы дисциплины <span class="text-danger">*</span>
        </label>
        <UiMultiSelect
          v-model="formData.instructorIds"
          :options="instructorOptions"
          placeholder="Выберите инструкторов..."
          hint="Можно выбрать несколько инструкторов"
        />
        <p v-if="errors.instructors" class="mt-1 text-xs font-bold text-danger">{{ errors.instructors }}</p>
      </div>

      <!-- Кнопки действий -->
      <div class="flex justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
        <UiButton
          type="button"
          variant="outline"
          class="px-6 font-bold"
          @click="handleClose"
        >
          Отмена
        </UiButton>
        <UiButton
          type="submit"
          variant="success"
          class="px-6 shadow-md"
        >
          {{ discipline ? 'Сохранить изменения' : 'Добавить дисциплину' }}
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Clock } from 'lucide-vue-next';
import { useNotification } from '#imports';
import type { CreateDisciplineData } from '~/types/course';

const props = defineProps<{
  isOpen: boolean;
  discipline?: CreateDisciplineData;
  instructorOptions: Array<{ id: string; label: string; description?: string }>;
}>();

const emit = defineEmits<{
  close: [];
  save: [discipline: CreateDisciplineData];
}>();

// State
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
  return props.discipline ? 'Редактировать дисциплину' : 'Новая дисциплина';
});

const totalHours = computed(() => {
  return (formData.value.theoryHours || 0) + (formData.value.practiceHours || 0) + (formData.value.assessmentHours || 0);
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
    formData.value = { ...props.discipline };
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

  if (!formData.value.instructorIds || formData.value.instructorIds.length === 0) {
    errors.value.instructors = 'Необходимо выбрать хотя бы одного инструктора';
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = () => {
  if (!validateForm()) {
    const firstError = Object.values(errors.value)[0];
    if (firstError) {
      showError(firstError, 'Ошибка валидации');
    }
    return;
  }

  emit('save', { ...formData.value });
  resetForm();
};

const handleClose = () => {
  resetForm();
  emit('close');
};

// Уведомления
const { error: showError } = useNotification();

// Watch for changes in props
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    loadDisciplineData();
  }
});
</script>
