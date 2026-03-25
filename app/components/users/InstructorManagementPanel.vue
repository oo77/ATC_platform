<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок и кнопка добавления -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xl font-semibold text-black dark:text-white">
          Инструкторы
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Управление инструкторами учебного центра
        </p>
      </div>
      <UiButton
        variant="success"
        size="md"
        @click="openCreateModal"
      >
        <template #iconLeft>
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </template>
        Добавить инструктора
      </UiButton>
    </div>

    <!-- Фильтры и поиск -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по ФИО, email, телефону..."
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          @input="debouncedFetch"
        />
      </div>
      <div class="sm:w-48">
        <select
          v-model="statusFilter"
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          @change="handleFilterChange"
        >
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>
      </div>
    </div>

    <!-- Таблица инструкторов -->
    <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
      <UsersInstructorTable
        :instructors="instructors"
        :loading="loading"
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
