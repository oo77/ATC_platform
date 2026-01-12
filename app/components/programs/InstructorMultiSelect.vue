<template>
  <div class="space-y-4">
    <!-- Мультиселект инструкторов -->
    <div>
      <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
        Инструкторы
      </label>
      <div class="relative">
        <select
          v-model="selectedInstructorId"
          @change="addInstructor"
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        >
          <option value="">Выберите инструктора...</option>
          <option
            v-for="instructor in availableInstructors"
            :key="instructor.id"
            :value="instructor.id"
          >
            {{ instructor.fullName }}
          </option>
        </select>
      </div>
    </div>

    <!-- Список выбранных инструкторов -->
    <div v-if="modelValue.length > 0" class="space-y-2">
      <label class="block text-sm font-medium text-black dark:text-white">
        Выбранные инструкторы
      </label>
      <div class="space-y-2">
        <div
          v-for="(instructorId, index) in modelValue"
          :key="instructorId"
          class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {{ getInstructorInitials(instructorId) }}
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ getInstructorName(instructorId) }}
              </p>
              <button
                v-if="index === 0"
                type="button"
                class="text-xs text-primary"
              >
                ★ Основной инструктор
              </button>
              <button
                v-else
                type="button"
                @click="setPrimary(index)"
                class="text-xs text-gray-500 hover:text-primary transition-colors"
              >
                ☆ Сделать основным
              </button>
            </div>
          </div>
          <button
            type="button"
            @click="removeInstructor(index)"
            class="text-danger hover:text-danger/80 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Instructor } from '~/types/course';

const props = defineProps<{
  modelValue: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const { authFetch } = useAuthFetch();

// State
const instructors = ref<Instructor[]>([]);
const selectedInstructorId = ref('');
const loading = ref(false);

// Computed
const availableInstructors = computed(() => {
  return instructors.value.filter(i => !props.modelValue.includes(i.id));
});

// Methods
const loadInstructors = async () => {
  loading.value = true;
  try {
    const response = await authFetch<{ success: boolean; instructors: Instructor[] }>('/api/instructors', {
      method: 'GET',
      params: { isActive: true, limit: 1000 },
    });
    
    if (response.success && response.instructors) {
      instructors.value = response.instructors;
    }
  } catch (error) {
    console.error('Error loading instructors:', error);
  } finally {
    loading.value = false;
  }
};

const addInstructor = () => {
  if (selectedInstructorId.value && !props.modelValue.includes(selectedInstructorId.value)) {
    emit('update:modelValue', [...props.modelValue, selectedInstructorId.value]);
    selectedInstructorId.value = '';
  }
};

const removeInstructor = (index: number) => {
  const newValue = [...props.modelValue];
  newValue.splice(index, 1);
  emit('update:modelValue', newValue);
};

const setPrimary = (index: number) => {
  const newValue = [...props.modelValue];
  const instructor = newValue.splice(index, 1)[0];
  if (instructor) {
    newValue.unshift(instructor);
    emit('update:modelValue', newValue);
  }
};

const getInstructorName = (id: string): string => {
  const instructor = instructors.value.find(i => i.id === id);
  return instructor?.fullName || 'Неизвестный инструктор';
};

const getInstructorInitials = (id: string): string => {
  const name = getInstructorName(id);
  const parts = name.split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Load instructors on mount
onMounted(() => {
  loadInstructors();
});
</script>
