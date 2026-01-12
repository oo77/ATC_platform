<template>
  <div class="space-y-4">
    <!-- Поиск слушателей -->
    <div>
      <label class="mb-2.5 block text-sm font-medium text-black dark:text-white">
        Добавить слушателей
      </label>
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по ФИО или ПИНФЛ..."
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 pr-10 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          @input="debouncedSearch"
        />
        <div v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
        </div>
        <svg v-else class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <!-- Результаты поиска -->
      <div
        v-if="searchResults.length > 0 && searchQuery"
        class="mt-2 max-h-60 overflow-y-auto rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-lg"
      >
        <button
          v-for="student in searchResults"
          :key="student.id"
          type="button"
          :disabled="modelValue.includes(student.id) || excludeIds.includes(student.id)"
          @click="addStudent(student)"
          :class="[
            'w-full px-4 py-3 text-left transition-colors flex items-center justify-between gap-3',
            modelValue.includes(student.id) || excludeIds.includes(student.id)
              ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {{ getInitials(student.fullName) }}
            </div>
            <div class="min-w-0">
              <p class="font-medium text-gray-900 dark:text-white truncate">{{ student.fullName }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ student.pinfl }} • {{ student.organization }}
              </p>
            </div>
          </div>
          <div v-if="modelValue.includes(student.id) || excludeIds.includes(student.id)" class="shrink-0">
            <span class="text-xs text-gray-500">Уже добавлен</span>
          </div>
          <div v-else class="shrink-0">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </button>
      </div>
      
      <!-- Пустой результат -->
      <div
        v-else-if="searchQuery && !loading && searchResults.length === 0"
        class="mt-2 p-4 text-center text-gray-500 dark:text-gray-400 rounded-lg border border-stroke dark:border-strokedark"
      >
        Слушатели не найдены
      </div>
    </div>

    <!-- Список выбранных слушателей -->
    <div v-if="modelValue.length > 0" class="space-y-2">
      <label class="block text-sm font-medium text-black dark:text-white">
        Выбранные слушатели ({{ modelValue.length }})
      </label>
      <div class="space-y-2 max-h-80 overflow-y-auto">
        <div
          v-for="studentId in modelValue"
          :key="studentId"
          class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success font-semibold">
              {{ getStudentInitials(studentId) }}
            </div>
            <div class="min-w-0">
              <p class="font-medium text-gray-900 dark:text-white truncate">
                {{ getStudentName(studentId) }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ getStudentInfo(studentId) }}
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="removeStudent(studentId)"
            class="shrink-0 text-danger hover:text-danger/80 transition-colors p-1"
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
import type { Student } from '~/types/student';

const props = defineProps<{
  modelValue: string[];
  excludeIds?: string[]; // ID слушателей, которых нельзя выбрать (уже в группе)
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const { authFetch } = useAuthFetch();

// State
const searchQuery = ref('');
const searchResults = ref<Student[]>([]);
const selectedStudents = ref<Map<string, Student>>(new Map());
const loading = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// Computed
const excludeIds = computed(() => props.excludeIds || []);

// Methods
const searchStudents = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }

  loading.value = true;
  try {
    const response = await authFetch<{ success: boolean; students: Student[] }>('/api/students', {
      method: 'GET',
      params: { 
        search: searchQuery.value,
        limit: 20 
      },
    });
    
    if (response.success && response.students) {
      searchResults.value = response.students;
      // Сохраняем в кэш
      for (const student of response.students) {
        if (!selectedStudents.value.has(student.id)) {
          selectedStudents.value.set(student.id, student);
        }
      }
    }
  } catch (error) {
    console.error('Error searching students:', error);
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
};

const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    searchStudents();
  }, 300);
};

const addStudent = (student: Student) => {
  if (!props.modelValue.includes(student.id) && !excludeIds.value.includes(student.id)) {
    selectedStudents.value.set(student.id, student);
    emit('update:modelValue', [...props.modelValue, student.id]);
    searchQuery.value = '';
    searchResults.value = [];
  }
};

const removeStudent = (studentId: string) => {
  const newValue = props.modelValue.filter(id => id !== studentId);
  emit('update:modelValue', newValue);
};

const getStudentName = (id: string): string => {
  const student = selectedStudents.value.get(id);
  return student?.fullName || 'Загрузка...';
};

const getStudentInfo = (id: string): string => {
  const student = selectedStudents.value.get(id);
  if (!student) return '';
  return `${student.pinfl} • ${student.organization}`;
};

const getStudentInitials = (id: string): string => {
  const name = getStudentName(id);
  return getInitials(name);
};

const getInitials = (name: string): string => {
  const parts = name.split(' ');
  const first = parts[0] || '';
  const second = parts[1] || '';
  if (first.length > 0 && second.length > 0) {
    return (first.charAt(0) + second.charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Загрузка данных о выбранных студентах при монтировании
const loadSelectedStudents = async () => {
  if (props.modelValue.length === 0) return;
  
  // Загружаем информацию о каждом выбранном студенте, которого нет в кэше
  for (const studentId of props.modelValue) {
    if (!selectedStudents.value.has(studentId)) {
      try {
        const response = await authFetch<{ success: boolean; student: Student }>(`/api/students/${studentId}`);
        if (response.success && response.student) {
          selectedStudents.value.set(studentId, response.student);
        }
      } catch (error) {
        console.error(`Error loading student ${studentId}:`, error);
      }
    }
  }
};

// Watch для загрузки данных при изменении выбранных ID
watch(() => props.modelValue, () => {
  loadSelectedStudents();
}, { immediate: true });
</script>
