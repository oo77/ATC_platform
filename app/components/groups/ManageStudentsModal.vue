<template>
  <UiModal :is-open="isOpen" title="Управление слушателями" size="xl" @close="$emit('close')">
    <div class="space-y-4">
      <!-- Информация о группе -->
      <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white">{{ group?.code }}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ group?.course?.name }}</p>
          </div>
        </div>
      </div>

      <!-- Двухколоночный layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Левая колонка: База слушателей -->
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h5 class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              База слушателей
            </h5>
          </div>
          
          <div class="p-3 space-y-3">
            <!-- Фильтры -->
            <div class="flex gap-2">
              <div class="relative flex-1">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Поиск по ФИО, ПИНФЛ..."
                  class="w-full rounded border border-stroke bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                  @input="debouncedSearch"
                />
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                v-if="selectedStudentIds.length > 0"
                type="button"
                @click="addSelectedStudents"
                :disabled="addingStudents"
                class="px-3 py-2 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <svg v-if="addingStudents" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Добавить ({{ selectedStudentIds.length }})</span>
              </button>
            </div>

            <!-- Статус загрузки -->
            <div v-if="loading" class="text-center py-6">
              <div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
              <p class="mt-2 text-sm text-gray-500">Поиск...</p>
            </div>

            <!-- Результаты поиска -->
            <div v-else-if="searchResults.length > 0" class="max-h-72 overflow-y-auto space-y-1">
              <label
                v-for="student in searchResults"
                :key="student.id"
                :class="[
                  'flex items-center gap-3 p-2 rounded cursor-pointer transition-colors',
                  existingStudentIds.includes(student.id)
                    ? 'bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed'
                    : selectedStudentIds.includes(student.id)
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                <input
                  type="checkbox"
                  :checked="selectedStudentIds.includes(student.id)"
                  :disabled="existingStudentIds.includes(student.id)"
                  @change="toggleStudent(student)"
                  class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                />
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {{ getInitials(student.fullName) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ student.fullName }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ student.pinfl }} • {{ student.organization }}</p>
                </div>
                <span v-if="existingStudentIds.includes(student.id)" class="text-xs text-gray-400">В группе</span>
              </label>
            </div>

            <!-- Пустой результат -->
            <div v-else-if="searchQuery && !loading" class="text-center py-6 text-gray-500 dark:text-gray-400">
              <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="mt-2 text-sm">Слушатели не найдены</p>
            </div>

            <!-- Подсказка -->
            <div v-else class="text-center py-6 text-gray-500 dark:text-gray-400">
              <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p class="mt-2 text-sm">Введите минимум 2 символа для поиска</p>
            </div>
          </div>
        </div>

        <!-- Правая колонка: Слушатели группы -->
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h5 class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              В группе ({{ currentStudents.length }})
            </h5>
          </div>
          
          <div class="p-3">
            <div v-if="currentStudents.length === 0" class="text-center py-6 text-gray-500 dark:text-gray-400">
              <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p class="mt-2 text-sm">Группа пуста</p>
              <p class="text-xs text-gray-400 mt-1">Выберите слушателей слева для добавления</p>
            </div>

            <div v-else class="max-h-72 overflow-y-auto space-y-1">
              <div
                v-for="gs in currentStudents"
                :key="gs.id"
                class="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800 group"
              >
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-success text-xs font-semibold">
                  {{ getInitials(gs.student?.fullName) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ gs.student?.fullName }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ gs.student?.organization }}</p>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    @click="openTransferModal(gs)"
                    class="p-1.5 text-gray-400 hover:text-primary rounded transition-colors"
                    title="Переместить"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    @click="removeStudentConfirm(gs)"
                    class="p-1.5 text-gray-400 hover:text-danger rounded transition-colors"
                    title="Удалить"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Модальное окно переноса -->
      <UiModal
        :is-open="showTransferModal"
        title="Переместить слушателя"
        size="sm"
        @close="showTransferModal = false"
      >
        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Выберите группу для перемещения:
            <strong class="block mt-1 text-gray-900 dark:text-white">{{ studentToTransfer?.student?.fullName }}</strong>
          </p>
          
          <div v-if="loadingGroups" class="text-center py-4">
            <div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
          </div>
          
          <div v-else-if="availableGroups.length === 0" class="text-center py-4 text-gray-500">
            Нет доступных групп для перемещения
          </div>
          
          <div v-else class="space-y-2 max-h-60 overflow-y-auto">
            <button
              v-for="g in availableGroups"
              :key="g.id"
              type="button"
              @click="transferStudentToGroup(g.id)"
              class="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <p class="font-medium text-gray-900 dark:text-white">{{ g.code }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ g.courseName }}</p>
            </button>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end">
            <UiButton variant="outline" @click="showTransferModal = false">
              Отмена
            </UiButton>
          </div>
        </template>
      </UiModal>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <UiButton variant="outline" @click="$emit('close')">
          Закрыть
        </UiButton>
      </div>
    </template>
  </UiModal>

  <!-- Модальное окно подтверждения удаления -->
  <UiConfirmModal
    :is-open="showDeleteConfirm"
    title="Удаление слушателя"
    message="Вы уверены, что хотите удалить слушателя из группы?"
    :item-name="studentToDelete?.student?.fullName"
    confirm-text="Удалить"
    cancel-text="Отмена"
    variant="danger"
    :loading="deletingStudent"
    @confirm="confirmDeleteStudent"
    @cancel="cancelDeleteStudent"
  />
</template>

<script setup lang="ts">
import type { GroupStudent } from '~/types/group';
import type { Student } from '~/types/student';

const props = defineProps<{
  isOpen: boolean;
  group: {
    id: string;
    code: string;
    course?: { name: string };
    students?: GroupStudent[];
  } | null;
}>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const { authFetch } = useAuthFetch();
const toast = useNotification();

// State
const searchQuery = ref('');
const searchResults = ref<Student[]>([]);
const selectedStudentIds = ref<string[]>([]);
const loading = ref(false);
const addingStudents = ref(false);
const showTransferModal = ref(false);
const studentToTransfer = ref<GroupStudent | null>(null);
const availableGroups = ref<Array<{ id: string; code: string; courseName: string }>>([]);
const loadingGroups = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// State для модального подтверждения удаления
const showDeleteConfirm = ref(false);
const studentToDelete = ref<GroupStudent | null>(null);
const deletingStudent = ref(false);

// Computed
const currentStudents = computed(() => props.group?.students || []);
const existingStudentIds = computed(() => currentStudents.value.map(s => s.studentId));

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
        limit: 30 
      },
    });
    
    if (response.success && response.students) {
      searchResults.value = response.students;
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

const toggleStudent = (student: Student) => {
  if (existingStudentIds.value.includes(student.id)) return;
  
  const index = selectedStudentIds.value.indexOf(student.id);
  if (index === -1) {
    selectedStudentIds.value.push(student.id);
  } else {
    selectedStudentIds.value.splice(index, 1);
  }
};

const addSelectedStudents = async () => {
  if (selectedStudentIds.value.length === 0 || !props.group) return;

  addingStudents.value = true;
  try {
    const response = await authFetch<{ success: boolean; message?: string; conflicts?: any[] }>(
      `/api/groups/${props.group.id}/students`,
      {
        method: 'POST',
        body: { studentIds: selectedStudentIds.value },
      }
    );

    if (response.success) {
      toast.success(response.message || 'Слушатели добавлены');
      selectedStudentIds.value = [];
      searchQuery.value = '';
      searchResults.value = [];
      emit('updated');
    } else if (response.conflicts && response.conflicts.length > 0) {
      const conflictNames = response.conflicts.map((c: any) => c.studentName).join(', ');
      toast.error(`Конфликт дат: ${conflictNames}`);
    } else {
      toast.error(response.message || 'Ошибка добавления');
    }
  } catch (error) {
    toast.error('Ошибка при добавлении слушателей');
  } finally {
    addingStudents.value = false;
  }
};

const removeStudentConfirm = (gs: GroupStudent) => {
  studentToDelete.value = gs;
  showDeleteConfirm.value = true;
};

const confirmDeleteStudent = async () => {
  if (!studentToDelete.value) return;
  
  deletingStudent.value = true;
  await removeStudent(studentToDelete.value.studentId);
  deletingStudent.value = false;
  showDeleteConfirm.value = false;
  studentToDelete.value = null;
};

const cancelDeleteStudent = () => {
  showDeleteConfirm.value = false;
  studentToDelete.value = null;
};

const removeStudent = async (studentId: string) => {
  if (!props.group) return;

  try {
    const response = await authFetch<{ success: boolean; message?: string }>(
      `/api/groups/${props.group.id}/students/${studentId}`,
      { method: 'DELETE' }
    );

    if (response.success) {
      toast.success('Слушатель удалён');
      emit('updated');
    } else {
      toast.error(response.message || 'Ошибка удаления');
    }
  } catch (error) {
    toast.error('Ошибка удаления слушателя');
  }
};

const openTransferModal = async (gs: GroupStudent) => {
  studentToTransfer.value = gs;
  showTransferModal.value = true;
  
  loadingGroups.value = true;
  try {
    const response = await authFetch<{ success: boolean; groups: any[] }>(
      '/api/groups/select',
      { params: { excludeGroupId: props.group?.id } }
    );

    if (response.success) {
      availableGroups.value = response.groups;
    }
  } catch (error) {
    console.error('Error loading groups:', error);
    availableGroups.value = [];
  } finally {
    loadingGroups.value = false;
  }
};

const transferStudentToGroup = async (toGroupId: string) => {
  if (!props.group || !studentToTransfer.value) return;

  try {
    const response = await authFetch<{ success: boolean; message?: string }>(
      `/api/groups/${props.group.id}/students/transfer`,
      {
        method: 'POST',
        body: {
          studentId: studentToTransfer.value.studentId,
          toGroupId,
        },
      }
    );

    if (response.success) {
      toast.success(response.message || 'Слушатель перемещён');
      showTransferModal.value = false;
      studentToTransfer.value = null;
      emit('updated');
    } else {
      toast.error(response.message || 'Ошибка перемещения');
    }
  } catch (error) {
    toast.error('Ошибка перемещения слушателя');
  }
};

const getInitials = (name?: string): string => {
  if (!name) return '??';
  const parts = name.split(' ');
  const first = parts[0] || '';
  const second = parts[1] || '';
  if (first.length > 0 && second.length > 0) {
    return (first.charAt(0) + second.charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Reset on open
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    searchQuery.value = '';
    searchResults.value = [];
    selectedStudentIds.value = [];
  }
});
</script>
