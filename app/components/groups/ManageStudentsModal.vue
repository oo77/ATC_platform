<template>
  <UiModal :is-open="isOpen" size="full" @close="$emit('close')">
    <!-- Кастомная шапка с информацией о группе и переключателем вкладок -->
    <template #header>
      <div class="flex items-center justify-between w-full pr-6 gap-4 flex-wrap">
        <!-- Информация о группе -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
            <Users class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-slate-900 dark:text-white truncate">
                {{ group?.code }}
              </h3>
              <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                В группе: {{ currentStudents.length }}
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
              {{ group?.course?.name }}
              <span v-if="groupStartDate && groupEndDate"> • {{ groupStartDate }} — {{ groupEndDate }}</span>
            </p>
          </div>
        </div>

        <!-- Навигационные вкладки -->
        <div class="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs shrink-0">
          <button
            type="button"
            @click="activeTab = 'ai'"
            :class="[
              'px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'ai'
                ? 'bg-white text-primary shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
            ]"
          >
            <Sparkles class="w-4 h-4 text-amber-500" />
            <span>ИИ-Помощник зачисления</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'current'"
            :class="[
              'px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'current'
                ? 'bg-white text-primary shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
            ]"
          >
            <Users class="w-4 h-4" />
            <span>Слушатели группы ({{ currentStudents.length }})</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'search'"
            :class="[
              'px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'search'
                ? 'bg-white text-primary shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
            ]"
          >
            <Search class="w-4 h-4" />
            <span>Поиск в базе</span>
          </button>
        </div>
      </div>
    </template>

    <!-- Основное тело модального окна с фиксированной высотой (нет раздувания страницы) -->
    <div class="h-[84vh] max-h-[84vh] flex flex-col min-h-0 overflow-hidden -mx-6 -my-5">
      
      <!-- ==================== ВКЛАДКА 1: ИИ-ПОМОЩНИК (ПОЛНОЭКРАННЫЙ СПЛИТ) ==================== -->
      <div v-if="activeTab === 'ai'" class="flex-1 min-h-0 h-full overflow-hidden flex flex-col">
        <GroupsAiStudentAssistant
          :group-id="group?.id"
          :start-date="groupStartDate"
          :end-date="groupEndDate"
          :existing-student-ids="existingStudentIds"
          @confirm="handleAiAddStudents"
          class="flex-1 min-h-0 h-full"
        />
      </div>

      <!-- ==================== ВКЛАДКА 2: ТЕКУЩИЕ СЛУШАТЕЛИ ГРУППЫ ==================== -->
      <div v-else-if="activeTab === 'current'" class="flex-1 min-h-0 h-full overflow-hidden flex flex-col p-6 space-y-4">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h4 class="font-bold text-sm text-slate-900 dark:text-white">
              Список зачисленных слушателей
            </h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Всего в группе: {{ currentStudents.length }} слушателей
            </p>
          </div>

          <!-- Поиск по текущим слушателям -->
          <div class="relative w-72">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="currentSearchQuery"
              type="text"
              placeholder="Поиск по ФИО, организации..."
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <!-- Таблица слушателей -->
        <div class="flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 custom-scrollbar">
          <div v-if="filteredCurrentStudents.length === 0" class="h-64 flex flex-col items-center justify-center text-center p-6">
            <Users class="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
            <p class="text-sm font-bold text-slate-700 dark:text-slate-300">
              {{ currentSearchQuery ? 'Ничего не найдено по запросу' : 'В группе пока нет слушателей' }}
            </p>
            <p class="text-xs text-slate-400 mt-1 max-w-sm">
              Используйте вкладку «ИИ-Помощник зачисления» для распознавания приказов или «Поиск в базе» для ручного зачисления.
            </p>
          </div>

          <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
            <div
              v-for="gs in filteredCurrentStudents"
              :key="gs.id"
              class="flex items-center justify-between gap-4 p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div class="flex items-center gap-3.5 min-w-0 flex-1">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                  {{ getInitials(gs.student?.fullName) }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {{ gs.student?.fullName }}
                    </p>
                    <span v-if="gs.student?.pinfl" class="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {{ gs.student.pinfl }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {{ [gs.student?.organization, gs.student?.department, gs.student?.position].filter(Boolean).join(" · ") }}
                  </p>
                </div>
              </div>

              <!-- Действия -->
              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  @click="openTransferModal(gs)"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
                  title="Переместить в другую группу"
                >
                  <ArrowRightLeft class="w-3.5 h-3.5" />
                  <span>Переместить</span>
                </button>
                <button
                  type="button"
                  @click="removeStudentConfirm(gs)"
                  class="p-1.5 text-slate-400 hover:text-danger rounded-lg transition-colors cursor-pointer"
                  title="Удалить из группы"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== ВКЛАДКА 3: РУЧНОЙ ПОИСК В БАЗЕ ==================== -->
      <div v-else-if="activeTab === 'search'" class="flex-1 min-h-0 h-full overflow-hidden flex flex-col p-6 space-y-4">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h4 class="font-bold text-sm text-slate-900 dark:text-white">
              Поиск слушателей в базе данных
            </h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Введите ФИО или ПИНФЛ для выбора слушателей
            </p>
          </div>

          <button
            v-if="selectedStudentIds.length > 0"
            type="button"
            @click="addSelectedStudents"
            :disabled="addingStudents"
            class="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Loader2 v-if="addingStudents" class="w-3.5 h-3.5 animate-spin" />
            <UserCheck v-else class="w-3.5 h-3.5" />
            <span>Добавить выбранных ({{ selectedStudentIds.length }})</span>
          </button>
        </div>

        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Введите минимум 2 символа для поиска..."
            class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
            @input="debouncedSearch"
          />
        </div>

        <!-- Результаты ручного поиска -->
        <div class="flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 custom-scrollbar p-3">
          <div v-if="loading" class="h-48 flex flex-col items-center justify-center text-center">
            <Loader2 class="w-6 h-6 animate-spin text-primary mb-2" />
            <p class="text-xs text-slate-500">Поиск по базе...</p>
          </div>

          <div v-else-if="searchResults.length > 0" class="space-y-1">
            <label
              v-for="student in searchResults"
              :key="student.id"
              :class="[
                'flex items-center gap-3.5 p-3 rounded-xl cursor-pointer transition-all border',
                existingStudentIds.includes(student.id)
                  ? 'bg-slate-50 dark:bg-slate-800/40 opacity-50 cursor-not-allowed border-transparent'
                  : selectedStudentIds.includes(student.id)
                    ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50'
              ]"
            >
              <input
                type="checkbox"
                :checked="selectedStudentIds.includes(student.id)"
                :disabled="existingStudentIds.includes(student.id)"
                @change="toggleStudent(student)"
                class="w-4 h-4 rounded text-primary focus:ring-primary disabled:opacity-40 accent-primary"
              />
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {{ getInitials(student.fullName) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {{ student.fullName }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {{ student.pinfl }} • {{ student.organization }}
                </p>
              </div>
              <span v-if="existingStudentIds.includes(student.id)" class="text-xs font-bold text-slate-400 shrink-0">
                Уже в группе
              </span>
            </label>
          </div>

          <div v-else-if="searchQuery && !loading" class="h-48 flex flex-col items-center justify-center text-center text-slate-400">
            <Search class="w-8 h-8 mb-2 opacity-50" />
            <p class="text-xs">Слушатели не найдены</p>
          </div>

          <div v-else class="h-48 flex flex-col items-center justify-center text-center text-slate-400">
            <Search class="w-8 h-8 mb-2 opacity-50" />
            <p class="text-xs">Введите ФИО или ПИНФЛ в строке поиска выше</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно переноса слушателя -->
    <UiModal
      :is-open="showTransferModal"
      title="Переместить слушателя"
      size="sm"
      @close="showTransferModal = false"
    >
      <div class="space-y-4">
        <p class="text-xs text-slate-600 dark:text-slate-400">
          Выберите целевую группу для перемещения слушателя:
          <strong class="block mt-1 text-sm text-slate-900 dark:text-white">
            {{ studentToTransfer?.student?.fullName }}
          </strong>
        </p>

        <div v-if="loadingGroups" class="text-center py-6">
          <Loader2 class="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>

        <div v-else-if="availableGroups.length === 0" class="text-center py-6 text-xs text-slate-500">
          Нет доступных групп для перемещения
        </div>

        <div v-else class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          <button
            v-for="g in availableGroups"
            :key="g.id"
            type="button"
            @click="transferStudentToGroup(g.id)"
            class="w-full p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
          >
            <p class="font-bold text-xs text-slate-900 dark:text-white">{{ g.code }}</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{{ g.courseName }}</p>
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

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="showDeleteConfirm"
      title="Удаление слушателя"
      message="Вы уверены, что хотите исключить слушателя из этой группы?"
      :item-name="studentToDelete?.student?.fullName"
      confirm-text="Исключить"
      cancel-text="Отмена"
      variant="danger"
      :loading="deletingStudent"
      @confirm="confirmDeleteStudent"
      @cancel="cancelDeleteStudent"
    />
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Sparkles,
  Users,
  Search,
  ArrowRightLeft,
  Trash2,
  Loader2,
  UserCheck,
} from 'lucide-vue-next';
import GroupsAiStudentAssistant from './AiStudentAssistant.vue';
import type { GroupStudent } from '~/types/group';
import type { Student } from '~/types/student';

const props = defineProps<{
  isOpen: boolean;
  group: {
    id: string;
    code: string;
    course?: { name: string };
    startDate?: string | Date | null;
    endDate?: string | Date | null;
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
const activeTab = ref<'ai' | 'current' | 'search'>('ai');
const searchQuery = ref('');
const currentSearchQuery = ref('');
const searchResults = ref<Student[]>([]);
const selectedStudentIds = ref<string[]>([]);
const loading = ref(false);
const addingStudents = ref(false);

// State для переноса
const showTransferModal = ref(false);
const studentToTransfer = ref<GroupStudent | null>(null);
const availableGroups = ref<Array<{ id: string; code: string; courseName: string }>>([]);
const loadingGroups = ref(false);

// State для удаления
const showDeleteConfirm = ref(false);
const studentToDelete = ref<GroupStudent | null>(null);
const deletingStudent = ref(false);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// Computed
const currentStudents = computed(() => props.group?.students || []);
const existingStudentIds = computed(() => currentStudents.value.map((s) => s.studentId));

const filteredCurrentStudents = computed(() => {
  if (!currentSearchQuery.value.trim()) return currentStudents.value;
  const q = currentSearchQuery.value.toLowerCase().trim();
  return currentStudents.value.filter((gs) =>
    gs.student?.fullName?.toLowerCase().includes(q) ||
    gs.student?.pinfl?.includes(q) ||
    gs.student?.organization?.toLowerCase().includes(q)
  );
});

const groupStartDate = computed(() => {
  if (!props.group?.startDate) return undefined;
  return new Date(props.group.startDate).toISOString().split('T')[0];
});

const groupEndDate = computed(() => {
  if (!props.group?.endDate) return undefined;
  return new Date(props.group.endDate).toISOString().split('T')[0];
});

// Добавление слушателей через ИИ
const handleAiAddStudents = async (ids: string[]) => {
  if (!props.group || !ids.length) return;
  addingStudents.value = true;
  try {
    const response = await authFetch<{ success: boolean; message?: string; conflicts?: any[] }>(
      `/api/groups/${props.group.id}/students`,
      {
        method: 'POST',
        body: { studentIds: ids },
      }
    );

    if (response.success) {
      toast.success(response.message || `Успешно зачислено: ${ids.length} слушателей`);
      emit('updated');
      // Переключаем на вкладку текущих слушателей, чтобы сразу видеть результат
      activeTab.value = 'current';
    } else if (response.conflicts && response.conflicts.length > 0) {
      const conflictNames = response.conflicts.map((c: any) => c.studentName).join(', ');
      toast.error(`Конфликт расписания: ${conflictNames}`);
    } else {
      toast.error(response.message || 'Ошибка добавления слушателей');
    }
  } catch (error: any) {
    toast.error(error.data?.message || 'Ошибка при зачислении слушателей');
  } finally {
    addingStudents.value = false;
  }
};

// Ручной поиск слушателей
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
        limit: 30,
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
  if (searchTimeout) clearTimeout(searchTimeout);
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
      activeTab.value = 'current';
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

// Удаление слушателя
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
      toast.success('Слушатель исключен из группы');
      emit('updated');
    } else {
      toast.error(response.message || 'Ошибка удаления');
    }
  } catch (error) {
    toast.error('Ошибка исключения слушателя');
  }
};

// Перенос слушателя в другую группу
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
      toast.success(response.message || 'Слушатель перемещен');
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

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      activeTab.value = 'ai';
      searchQuery.value = '';
      currentSearchQuery.value = '';
      searchResults.value = [];
      selectedStudentIds.value = [];
    }
  }
);
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.35);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.55);
}
</style>
