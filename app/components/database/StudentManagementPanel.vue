<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок и кнопки действий -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-xl font-semibold text-black dark:text-white">
          Управление студентами
        </h3>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Всего студентов: {{ pagination.total }}
          <span v-if="hasActiveFilters" class="text-primary">
            (отфильтровано)
          </span>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <NuxtLink
          to="/database/import"
          class="inline-flex items-center gap-2 rounded-lg border-2 border-primary bg-transparent px-4 py-2 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
        >
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Импорт студентов
        </NuxtLink>
        <UiButton
          variant="primary"
          @click="openCreateModal"
          class="flex items-center gap-2"
        >
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
          Добавить студента
        </UiButton>
      </div>
    </div>

    <!-- Панель фильтрации -->
    <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h4 class="text-lg font-semibold text-black dark:text-white">Фильтры</h4>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Сбросить фильтры
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Поиск по ФИО -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Поиск по ФИО
          </label>
          <div class="relative">
            <input
              v-model="filters.fullName"
              type="text"
              placeholder="Введите имя..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              @input="debouncedFetch"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Поиск по ПИНФЛ -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Поиск по ПИНФЛ
          </label>
          <div class="relative">
            <input
              v-model="filters.pinfl"
              type="text"
              placeholder="Введите ПИНФЛ..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              @input="debouncedFetch"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </div>
        </div>

        <!-- Поиск по организации -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Организация
          </label>
          <div class="relative">
            <input
              v-model="filters.organization"
              type="text"
              placeholder="Введите организацию..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              @input="debouncedFetch"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        <!-- Поиск по должности -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Должность
          </label>
          <div class="relative">
            <input
              v-model="filters.position"
              type="text"
              placeholder="Введите должность..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              @input="debouncedFetch"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Дополнительные фильтры -->
      <div class="mt-4 flex flex-wrap gap-3">
        <label class="inline-flex items-center gap-2 cursor-pointer">
          <input
            v-model="filters.hasCertificates"
            type="checkbox"
            class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            @change="handleFilterChange"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Только с сертификатами</span>
        </label>

        <label class="inline-flex items-center gap-2 cursor-pointer">
          <input
            v-model="filters.noCertificates"
            type="checkbox"
            class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            @change="handleFilterChange"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Только без сертификатов</span>
        </label>
      </div>
    </div>

    <!-- Таблица студентов -->
    <div class="bg-white dark:bg-boxdark rounded-xl shadow-md overflow-hidden">
      <DatabaseStudentTable
        :students="students"
        :loading="loading"
        @edit="openEditModal"
        @delete="openDeleteModal"
        @view-certificates="openCertificatesModal"
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

    <!-- Модальное окно создания/редактирования студента -->
    <DatabaseStudentFormModal
      v-if="isFormModalOpen"
      :student="selectedStudent"
      :is-open="isFormModalOpen"
      @close="closeFormModal"
      @submit="handleSubmit"
    />

    <!-- Модальное окно просмотра сертификатов -->
    <DatabaseStudentCertificatesModal
      v-if="isCertificatesModalOpen"
      :student="selectedStudent"
      :is-open="isCertificatesModalOpen"
      @close="closeCertificatesModal"
      @refresh="handleCertificatesRefresh"
    />

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление студента"
      message="Вы уверены, что хотите удалить этого студента?"
      :item-name="deleteStudent?.fullName"
      warning="Это действие нельзя отменить. Все данные студента будут удалены."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import type { Student, CreateStudentData, UpdateStudentData } from '~/types/student';

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();

// Тип ответа от API
interface StudentsResponse {
  success: boolean;
  students: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Состояние
const students = ref<Student[]>([]);
const loading = ref(false);
const isFormModalOpen = ref(false);
const isCertificatesModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const selectedStudent = ref<Student | null>(null);
const deleteStudent = ref<Student | null>(null);

// Пагинация
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

// Фильтры
const filters = ref({
  fullName: '',
  pinfl: '',
  organization: '',
  position: '',
  hasCertificates: false,
  noCertificates: false,
});

// Debounce таймер
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Вычисляемые свойства
const hasActiveFilters = computed(() => {
  return (
    filters.value.fullName !== '' ||
    filters.value.pinfl !== '' ||
    filters.value.organization !== '' ||
    filters.value.position !== '' ||
    filters.value.hasCertificates ||
    filters.value.noCertificates
  );
});

// Debounced fetch для фильтров
const debouncedFetch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    pagination.value.page = 1; // Сброс на первую страницу при фильтрации
    fetchStudents();
  }, 300);
};

// Обработка изменения фильтров-чекбоксов
const handleFilterChange = () => {
  pagination.value.page = 1;
  fetchStudents();
};

// Сброс фильтров
const clearFilters = () => {
  filters.value = {
    fullName: '',
    pinfl: '',
    organization: '',
    position: '',
    hasCertificates: false,
    noCertificates: false,
  };
  pagination.value.page = 1;
  fetchStudents();
};

// Обработка изменения страницы
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchStudents();
};

// Обработка изменения количества записей на странице
const handleLimitChange = (limit: number) => {
  pagination.value.limit = limit;
  pagination.value.page = 1; // Сброс на первую страницу
  fetchStudents();
};

// Загрузка студентов
const fetchStudents = async () => {
  loading.value = true;
  try {
    // Формируем параметры запроса
    const params = new URLSearchParams();
    params.append('page', pagination.value.page.toString());
    params.append('limit', pagination.value.limit.toString());

    if (filters.value.fullName) {
      params.append('fullName', filters.value.fullName);
    }
    if (filters.value.pinfl) {
      params.append('pinfl', filters.value.pinfl);
    }
    if (filters.value.organization) {
      params.append('organization', filters.value.organization);
    }
    if (filters.value.position) {
      params.append('position', filters.value.position);
    }
    if (filters.value.hasCertificates) {
      params.append('hasCertificates', 'true');
    }
    if (filters.value.noCertificates) {
      params.append('noCertificates', 'true');
    }

    const response = await authFetch<StudentsResponse>(
      `/api/students?${params.toString()}`,
      {
        method: 'GET',
      }
    );
    
    if (response.success) {
      students.value = response.students;
      pagination.value.total = response.total;
      pagination.value.totalPages = response.totalPages;
      pagination.value.page = response.page;
      pagination.value.limit = response.limit;
    }
  } catch (error) {
    console.error('Ошибка загрузки студентов:', error);
  } finally {
    loading.value = false;
  }
};

// Обновление данных конкретного студента
const refreshStudent = async (studentId: string) => {
  try {
    const response = await authFetch<{ success: boolean; student: Student }>(
      `/api/students/${studentId}`,
      {
        method: 'GET',
      }
    );

    if (response.success) {
      const index = students.value.findIndex(s => s.id === studentId);
      if (index !== -1) {
        students.value[index] = response.student;
        // Обновляем также selectedStudent, если это тот же студент
        if (selectedStudent.value?.id === studentId) {
          selectedStudent.value = response.student;
        }
      }
    }
  } catch (error) {
    console.error('Ошибка обновления студента:', error);
  }
};

// Открытие модального окна создания
const openCreateModal = () => {
  selectedStudent.value = null;
  isFormModalOpen.value = true;
};

// Открытие модального окна редактирования
const openEditModal = (student: Student) => {
  selectedStudent.value = student;
  isFormModalOpen.value = true;
};

// Закрытие модального окна формы
const closeFormModal = () => {
  isFormModalOpen.value = false;
  selectedStudent.value = null;
};

// Открытие модального окна сертификатов
const openCertificatesModal = (student: Student) => {
  selectedStudent.value = student;
  isCertificatesModalOpen.value = true;
};

// Закрытие модального окна сертификатов
const closeCertificatesModal = () => {
  isCertificatesModalOpen.value = false;
  selectedStudent.value = null;
};

// Открытие модального окна удаления
const openDeleteModal = (studentId: string) => {
  const student = students.value.find(s => s.id === studentId);
  if (student) {
    deleteStudent.value = student;
    isDeleteModalOpen.value = true;
  }
};

// Закрытие модального окна удаления
const closeDeleteModal = () => {
  if (!isDeleting.value) {
    isDeleteModalOpen.value = false;
    deleteStudent.value = null;
  }
};

// Подтверждение удаления
const confirmDelete = async () => {
  if (!deleteStudent.value) return;

  isDeleting.value = true;
  try {
    const response = await authFetch<{ success: boolean }>(
      `/api/students/${deleteStudent.value.id}`,
      {
        method: 'DELETE',
      }
    );

    if (response.success) {
      // Перезагружаем данные для корректного отображения пагинации
      await fetchStudents();
      closeDeleteModal();
    }
  } catch (error) {
    console.error('Ошибка удаления студента:', error);
  } finally {
    isDeleting.value = false;
  }
};

// Обработка обновления сертификатов
const handleCertificatesRefresh = () => {
  if (selectedStudent.value) {
    refreshStudent(selectedStudent.value.id);
  }
};

// Обработка отправки формы
const handleSubmit = async (data: CreateStudentData | UpdateStudentData) => {
  try {
    if (selectedStudent.value) {
      // Обновление существующего студента
      const response = await authFetch<{ success: boolean; student: Student }>(
        `/api/students/${selectedStudent.value.id}`,
        {
          method: 'PUT',
          body: data,
        }
      );

      if (response.success) {
        const index = students.value.findIndex(s => s.id === selectedStudent.value!.id);
        if (index !== -1) {
          students.value[index] = response.student;
        }
        
        // Показываем уведомление об успехе
        const notification = useNotification();
        notification.success('Студент успешно обновлен', 'Успех');
        
        closeFormModal();
      }
    } else {
      // Создание нового студента
      const response = await authFetch<{ 
        success: boolean; 
        student: Student;
        generatedPassword?: string;
        accountEmail?: string;
      }>('/api/students', {
        method: 'POST',
        body: data,
      });

      if (response.success) {
        // Перезагружаем данные для корректной пагинации
        await fetchStudents();
        
        // Показываем уведомление об успехе
        const notification = useNotification();
        
        // Показываем сгенерированный пароль, если он есть
        if (response.generatedPassword && response.accountEmail) {
          notification.success(
            `Учётная запись создана!\nEmail: ${response.accountEmail}\nПароль: ${response.generatedPassword}`,
            'Студент и аккаунт созданы',
            10000 // Показываем дольше для копирования
          );
        } else if ((data as any).createAccount) {
          notification.success('Студент и учётная запись успешно созданы', 'Успех');
        } else {
          notification.success('Студент успешно создан', 'Успех');
        }
        
        closeFormModal();
      }
    }
  } catch (error) {
    console.error('Ошибка сохранения студента:', error);
    // Ошибки будут обработаны в StudentFormModal
  }
};

// Загрузка данных при монтировании
onMounted(() => {
  fetchStudents();
});
</script>
