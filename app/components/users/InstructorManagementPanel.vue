<template>
  <div class="space-y-4">
    <!-- Единый блок фильтров: поиск (debounce уже внутри debouncedFetch → 0) + сегмент статуса + главное действие -->
    <UiFilterBar
      v-model:search="searchQuery"
      search-placeholder="Поиск по ФИО, email, телефону..."
      :debounce="0"
      :segments="statusSegments"
      :segment="statusFilter"
      :total="pagination.total"
      @search="debouncedFetch"
      @update:segment="onSegmentChange"
    >
      <template #actions>
        <UiButton variant="primary" size="md" :start-icon="Plus" @click="openCreateModal">
          Добавить инструктора
        </UiButton>
      </template>
    </UiFilterBar>

    <!-- Таблица инструкторов; пагинация — футер внутри карточки -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <UsersInstructorTable
        :instructors="instructors"
        :loading="loading"
        @edit="handleEdit"
      />
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
// Search/Filter убраны — поиск и сегмент рисует UiFilterBar
import { Plus } from "lucide-vue-next";

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

// Сегменты статуса для UiFilterBar (значения те же, что были в селекте: all/active/inactive)
const statusSegments = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'inactive', label: 'Неактивные' },
];

// UiFilterBar отдаёт новое значение сегмента — записываем в прежний statusFilter и вызываем прежний обработчик
const onSegmentChange = (value: string | number | boolean) => {
  statusFilter.value = String(value);
  handleFilterChange();
};

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
