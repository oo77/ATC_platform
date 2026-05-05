<template>
  <div class="flex flex-col gap-6">
    <!-- Header & Actions -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
      <div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Инструкторы
        </h3>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Управление инструкторами учебного центра
        </p>
      </div>
      <button 
        @click="openCreateModal"
        class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg transition-all whitespace-nowrap"
      >
        <Plus class="w-4 h-4" />
        Добавить инструктора
      </button>
    </div>

    <!-- Filters Section -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search -->
        <div class="relative flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по ФИО, email, телефону..."
            class="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
            @input="debouncedFetch"
          />
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        
        <!-- Status Filter -->
        <div class="sm:w-56">
          <div class="relative">
            <select
              v-model="statusFilter"
              class="w-full appearance-none rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
              @change="handleFilterChange"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
            <Filter class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <!-- Таблица инструкторов -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <UsersInstructorTable
        :instructors="instructors"
        :loading="loading"
        @edit="handleEdit"
      />
      <!-- Пагинация -->
      <UiPagination
        v-if="pagination.totalPages > 0"
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="loading"
        @update:page="handlePageChange"
        @update:limit="handleLimitChange"
      />
    </div>

    <!-- Модальное окно создания/редактирования -->
    <UsersInstructorFormModal
      v-if="showModal"
      :instructor="selectedInstructor"
      @close="closeModal"
      @saved="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Instructor } from '~/types/instructor';
import { Search, Plus, Filter } from "lucide-vue-next";

const { authFetch } = useAuthFetch();

// Тип ответа
interface InstructorsResponse {
  success: boolean;
  instructors: Instructor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Состояние
const loading = ref(false);
const instructors = ref<Instructor[]>([]);
const searchQuery = ref('');
const statusFilter = ref('all');
const showModal = ref(false);
const selectedInstructor = ref<Instructor | null>(null);

// Пагинация
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Методы
const fetchInstructors = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.append('page', pagination.value.page.toString());
    params.append('limit', pagination.value.limit.toString());
    
    if (searchQuery.value) {
      params.append('search', searchQuery.value);
    }
    
    if (statusFilter.value !== 'all') {
      params.append('isActive', statusFilter.value === 'active' ? 'true' : 'false');
    }

    const response = await authFetch<InstructorsResponse>(
      `/api/instructors?${params.toString()}`,
      {
        method: 'GET',
      }
    );
    
    if (response.success) {
      instructors.value = response.instructors;
      pagination.value.total = response.total || 0;
      pagination.value.totalPages = response.totalPages || 0;
      pagination.value.page = response.page || 1;
      pagination.value.limit = response.limit || 10;
    }
  } catch (error) {
    console.error('Error fetching instructors:', error);
  } finally {
    loading.value = false;
  }
};

const debouncedFetch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    pagination.value.page = 1;
    fetchInstructors();
  }, 300);
};

const handleFilterChange = () => {
  pagination.value.page = 1;
  fetchInstructors();
};

const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchInstructors();
};

const handleLimitChange = (limit: number) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  fetchInstructors();
};

const openCreateModal = () => {
  selectedInstructor.value = null;
  showModal.value = true;
};

const handleEdit = (instructor: Instructor) => {
  selectedInstructor.value = { ...instructor };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedInstructor.value = null;
};

const handleSave = async () => {
  await fetchInstructors();
  closeModal();
};

// Загрузка данных при монтировании
onMounted(() => {
  fetchInstructors();
});
</script>
