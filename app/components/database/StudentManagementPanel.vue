<template>
  <div class="flex flex-col gap-4">
    <!-- Единый блок фильтров: основной поиск по ФИО на виду, остальное — в сворачиваемой панели. Главное действие — «Добавить слушателя» -->
    <UiFilterBar
      v-model:search="filters.fullName"
      search-placeholder="Поиск по ФИО…"
      :debounce="0"
      :total="pagination.total"
      :active-count="activeFilterCount"
      :chips="filterChips"
      persist-key="students"
      @search="debouncedFetch"
      @remove="removeFilterChip"
      @reset="clearFilters"
    >
      <!-- Второстепенные фильтры: ПИНФЛ, организация, должность, наличие сертификатов -->
      <template #filters>
        <!-- ПИНФЛ -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">ПИНФЛ</span>
          <span class="relative block">
            <CreditCard class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              v-model="filters.pinfl"
              type="text"
              inputmode="numeric"
              placeholder="Введите ПИНФЛ"
              class="h-9 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
              @input="debouncedFetch"
            />
          </span>
        </label>

        <!-- Организация -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Организация</span>
          <span class="relative block">
            <Building2 class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              v-model="filters.organization"
              type="text"
              placeholder="Название организации"
              class="h-9 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
              @input="debouncedFetch"
            />
          </span>
        </label>

        <!-- Должность -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Должность</span>
          <span class="relative block">
            <Briefcase class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              v-model="filters.position"
              type="text"
              placeholder="Название должности"
              class="h-9 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
              @input="debouncedFetch"
            />
          </span>
        </label>

        <!-- Сертификаты: два взаимоисключающих варианта оформлены как единый переключатель «Любые / Есть / Нет»,
             чтобы было видно, что выбрать оба сразу нельзя. Пишет в те же ref filters.hasCertificates / filters.noCertificates -->
        <div>
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Сертификаты</span>
          <div class="inline-flex w-full rounded-lg bg-gray-100 p-0.5 dark:bg-white/[0.06]" role="radiogroup" aria-label="Фильтр по сертификатам">
            <button
              v-for="opt in certModeOptions"
              :key="opt.value"
              type="button"
              role="radio"
              :aria-checked="certMode === opt.value"
              :class="[
                'h-8 flex-1 rounded-md px-3 text-sm font-medium transition-colors',
                certMode === opt.value
                  ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
              ]"
              @click="setCertMode(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </template>

      <!-- Действия: одно главное (primary) + «⋯» с вторичными (импорт, обновление) -->
      <template #actions>
        <UiDropdown
          icon-only
          variant="outline"
          size="md"
          aria-label="Импорт и синхронизация"
          :groups="toolbarMenu"
          @select="onToolbarSelect"
        />
        <UiButton variant="primary" size="md" :start-icon="Plus" @click="openCreateModal">
          Добавить слушателя
        </UiButton>
      </template>
    </UiFilterBar>

    <!-- Карточка таблицы: таблица + пагинация-футер внутри одной карточки -->
    <div id="students-table" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <DatabaseStudentTable
        :students="students"
        :loading="loading"
        @edit="openEditModal"
        @delete="openDeleteModal"
        @view-certificates="openCertificatesModal"
      />

      <!-- Пагинация (футер карточки); после смены страницы прокручиваем к началу таблицы -->
      <UiPagination
        v-if="pagination.totalPages > 0"
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="loading"
        scroll-target="#students-table"
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
      title="Удаление слушателя"
      message="Вы уверены, что хотите удалить этого слушателя?"
      :item-name="deleteStudent?.fullName"
      warning="Это действие нельзя отменить. Все данные слушателя будут удалены."
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
// Search/Filter/RotateCcw убраны (их рисует UiFilterBar); Plus/Upload/RefreshCw — для кнопки и меню «⋯»
import { Plus, Upload, CreditCard, Building2, Briefcase, RefreshCw } from "lucide-vue-next";

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

/// ---- Презентационные вычисления для UiFilterBar (логика запросов не затронута) ----

// Сколько фильтров применено помимо основного поиска по ФИО — для бейджа на кнопке «Фильтры»
const activeFilterCount = computed(() => {
  const f = filters.value;
  return [f.pinfl, f.organization, f.position].filter((v) => v !== '').length
    + (f.hasCertificates ? 1 : 0)
    + (f.noCertificates ? 1 : 0);
});

// Чипы применённых фильтров: состояние видно без раскрытия панели
const filterChips = computed(() => {
  const f = filters.value;
  const chips: { key: string; label: string }[] = [];
  if (f.pinfl) chips.push({ key: 'pinfl', label: `ПИНФЛ: ${f.pinfl}` });
  if (f.organization) chips.push({ key: 'organization', label: `Организация: ${f.organization}` });
  if (f.position) chips.push({ key: 'position', label: `Должность: ${f.position}` });
  if (f.hasCertificates) chips.push({ key: 'hasCertificates', label: 'С сертификатами' });
  if (f.noCertificates) chips.push({ key: 'noCertificates', label: 'Без сертификатов' });
  return chips;
});

// Снятие одного чипа: обнуляем соответствующее поле и используем уже существующий handleFilterChange
const removeFilterChip = (key: string) => {
  const f = filters.value as Record<string, any>;
  f[key] = typeof f[key] === 'boolean' ? false : '';
  handleFilterChange();
};

// Переключатель сертификатов «Любые / Есть / Нет»: режим вычисляется из двух существующих флагов
const certModeOptions = [
  { value: 'any', label: 'Любые' },
  { value: 'with', label: 'Есть' },
  { value: 'without', label: 'Нет' },
];
const certMode = computed(() =>
  filters.value.hasCertificates ? 'with' : filters.value.noCertificates ? 'without' : 'any'
);
// Выставляем флаги так, чтобы активен был ровно один режим, затем вызываем прежний handleFilterChange
const setCertMode = (mode: string) => {
  filters.value.hasCertificates = mode === 'with';
  filters.value.noCertificates = mode === 'without';
  handleFilterChange();
};

// Меню «⋯» в панели: вторичные действия (импорт — ссылка, синхронизация — открывает прежнюю модалку)
const toolbarMenu = [
  {
    items: [
      { key: 'import', label: 'Импорт слушателей', description: 'Из файла Excel', icon: Upload, to: '/database/import' },
      { key: 'sync', label: 'Обновить слушателей', description: 'Синхронизация данных', icon: RefreshCw },
    ],
  },
];
const onToolbarSelect = (key: string) => {
  if (key === 'sync') isSyncModalOpen.value = true;
};

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
        notification.success('Слушатель успешно обновлен', 'Успех');
        
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
            'Слушатель и аккаунт созданы',
            10000 // Показываем дольше для копирования
          );
        } else if ((data as any).createAccount) {
          notification.success('Слушатель и учётная запись успешно созданы', 'Успех');
        } else {
          notification.success('Слушатель успешно создан', 'Успех');
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
