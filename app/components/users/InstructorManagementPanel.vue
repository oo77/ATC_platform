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
        />
      </div>
      <div class="sm:w-48">
        <select
          v-model="statusFilter"
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        >
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>
      </div>
    </div>

    <!-- Таблица инструкторов -->
    <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <UsersInstructorTable
        :instructors="filteredInstructors"
        :loading="loading"
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
import { ref, computed, onMounted } from 'vue';
import type { Instructor } from '~/types/instructor';

// Состояние
const loading = ref(false);
const instructors = ref<Instructor[]>([]);
const searchQuery = ref('');
const statusFilter = ref('all');
const showModal = ref(false);
const selectedInstructor = ref<Instructor | null>(null);

// Вычисляемые свойства
const filteredInstructors = computed(() => {
  let result = instructors.value;

  // Фильтр по поиску
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (instructor) =>
        instructor.fullName.toLowerCase().includes(query) ||
        instructor.email?.toLowerCase().includes(query) ||
        instructor.phone?.toLowerCase().includes(query)
    );
  }

  // Фильтр по статусу
  if (statusFilter.value !== 'all') {
    const isActive = statusFilter.value === 'active';
    result = result.filter(instructor => instructor.isActive === isActive);
  }

  return result;
});

// Методы
const fetchInstructors = async () => {
  loading.value = true;
  try {
    const { token } = useAuth();
    
    const response = await $fetch<{ success: boolean; instructors: Instructor[] }>(
      '/api/instructors',
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      }
    );
    if (response.success) {
      instructors.value = response.instructors;
    }
  } catch (error) {
    console.error('Error fetching instructors:', error);
    // TODO: Показать уведомление об ошибке
  } finally {
    loading.value = false;
  }
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
