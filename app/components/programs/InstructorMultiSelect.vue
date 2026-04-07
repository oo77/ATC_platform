<template>
  <div class="space-y-4">
    <!-- Мультиселект инструкторов -->
    <div class="space-y-2">
      <div class="relative">
        <select
          v-model="selectedInstructorId"
          @change="addInstructor"
          class="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-800 px-4 py-2.5 font-bold text-slate-900 dark:text-white outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 pl-10 appearance-none disabled:opacity-50"
          :disabled="loading"
        >
          <option value="">Выберите инструктора для добавления...</option>
          <option
            v-for="instructor in availableInstructors"
            :key="instructor.id"
            :value="instructor.id"
          >
            {{ instructor.fullName }}
          </option>
        </select>
        <Users class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      <p v-if="loading" class="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
        <div class="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin"></div> Загрузка...
      </p>
    </div>

    <!-- Список выбранных инструкторов -->
    <div v-if="modelValue.length > 0" class="mt-4">
      <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        Выбранные инструкторы ({{ modelValue.length }})
      </label>
      <div class="space-y-2">
        <div
          v-for="(instructorId, index) in modelValue"
          :key="instructorId"
          class="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/50 hover:border-primary/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-black text-sm">
              {{ getInstructorInitials(instructorId) }}
            </div>
            <div>
              <p class="font-bold text-slate-900 dark:text-white text-sm">
                {{ getInstructorName(instructorId) }}
              </p>
              
              <div class="flex items-center gap-2 mt-0.5">
                <span
                  v-if="index === 0"
                  class="inline-flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded"
                >
                  <Star class="w-3 h-3 fill-primary text-primary" /> Основной
                </span>
                <button
                  v-else
                  type="button"
                  @click="setPrimary(index)"
                  class="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-widest"
                >
                  <Star class="w-3 h-3" /> Сделать основным
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            @click="removeInstructor(index)"
            class="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-danger/10 hover:text-danger transition-colors"
            title="Удалить"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthFetch } from '#imports';
import { Users, ChevronDown, Star, X } from 'lucide-vue-next';
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
  const firstPart = parts[0];
  const secondPart = parts[1];
  
  if (parts.length >= 2 && firstPart && secondPart && firstPart[0] && secondPart[0]) {
    return (firstPart[0] + secondPart[0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Load instructors on mount
onMounted(() => {
  loadInstructors();
});
</script>
