<template>
  <div class="flex flex-col gap-6">
    <!-- Header & Actions -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
      <div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Управление студентами
        </h3>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Всего студентов: {{ pagination.total }}
          <span v-if="hasActiveFilters" class="text-primary font-bold">
            (отфильтровано)
          </span>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button
          @click="isSyncModalOpen = true"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-emerald-500/80 bg-transparent text-sm font-bold text-emerald-600 dark:text-emerald-400 transition-all duration-200 hover:bg-emerald-600 hover:text-white hover:shadow-md hover:shadow-emerald-500/20"
        >
          <RefreshCw class="w-4 h-4" />
          Обновить слушателей
        </button>
        <NuxtLink
          to="/database/import"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-primary bg-transparent text-sm font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-white hover:shadow-md hover:shadow-primary/20"
        >
          <Upload class="w-4 h-4" />
          Импорт студентов
        </NuxtLink>
        <button
          @click="openCreateModal"
          class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg transition-all whitespace-nowrap"
        >
          <Plus class="w-4 h-4" />
          Добавить студента
        </button>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Filter class="w-5 h-5" />
          </div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white">
            Фильтры
          </h4>
        </div>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10"
        >
          <RotateCcw class="w-4 h-4" />
          Сбросить фильтры
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Поиск по ФИО -->
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Поиск по ФИО
          </label>
          <div class="relative">
            <input
              v-model="filters.fullName"
              type="text"
              placeholder="Введите имя..."
              class="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
              @input="debouncedFetch"
            />
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        <!-- Поиск по ПИНФЛ -->
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Поиск по ПИНФЛ
          </label>
          <div class="relative">
            <input
              v-model="filters.pinfl"
              type="text"
              placeholder="Введите ПИНФЛ..."
              class="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
              @input="debouncedFetch"
            />
            <CreditCard class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        <!-- Поиск по организации -->
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Организация
          </label>
          <div class="relative">
            <input
              v-model="filters.organization"
              type="text"
              placeholder="Введите организацию..."
              class="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
              @input="debouncedFetch"
            />
            <Building2 class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        <!-- Поиск по должности -->
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Должность
          </label>
          <div class="relative">
            <input
              v-model="filters.position"
              type="text"
              placeholder="Введите должность..."
              class="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
              @input="debouncedFetch"
            />
            <Briefcase class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      <!-- Дополнительные фильтры -->
      <div class="mt-6 flex flex-wrap gap-4">
        <label class="inline-flex items-center gap-2.5 cursor-pointer group">
          <div class="relative flex items-center">
            <input
              v-model="filters.hasCertificates"
              type="checkbox"
              class="peer sr-only"
              @change="handleFilterChange"
            />
            <div class="h-5 w-5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 transition-all peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary/50 flex items-center justify-center">
              <svg class="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span class="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Только с сертификатами</span>
        </label>

        <label class="inline-flex items-center gap-2.5 cursor-pointer group">
          <div class="relative flex items-center">
            <input
              v-model="filters.noCertificates"
              type="checkbox"
              class="peer sr-only"
              @change="handleFilterChange"
            />
            <div class="h-5 w-5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 transition-all peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary/50 flex items-center justify-center">
              <svg class="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span class="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Только без сертификатов</span>
        </label>
      </div>
    </div>

    <!-- Таблица студентов -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
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

    <StudentsSyncStudentsModal
      :show="isSyncModalOpen"
      @close="isSyncModalOpen = false"
      @synced="fetchStudents"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import type { Student, CreateStudentData, UpdateStudentData } from '~/types/student';
import { Search, Plus, Filter, RotateCcw, Upload, CreditCard, Building2, Briefcase, RefreshCw } from "lucide-vue-next";

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
const isSyncModalOpen = ref(false);
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
