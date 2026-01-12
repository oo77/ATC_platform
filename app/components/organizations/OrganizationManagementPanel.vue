<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок и кнопки действий -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-xl font-semibold text-black dark:text-white">
          Управление организациями
        </h3>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Всего организаций: {{ pagination.total }}
          <span v-if="hasActiveFilters" class="text-primary">
            (отфильтровано)
          </span>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
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
          Добавить организацию
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

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Поиск по названию -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Поиск
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Название, код..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              @input="debouncedFetch"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Фильтр по статусу -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Статус
          </label>
          <select
            v-model="filters.isActive"
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            @change="handleFilterChange"
          >
            <option value="">Все</option>
            <option value="true">Активные</option>
            <option value="false">Неактивные</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Таблица организаций -->
    <div class="bg-white dark:bg-boxdark rounded-xl shadow-md overflow-hidden">
      <OrganizationsOrganizationTable
        :organizations="organizations"
        :loading="loading"
        @edit="openEditModal"
        @delete="openDeleteModal"
        @view="openDetailModal"
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
    <OrganizationsOrganizationFormModal
      v-if="isFormModalOpen"
      :organization="selectedOrganization"
      :is-open="isFormModalOpen"
      @close="closeFormModal"
      @submit="handleSubmit"
    />

    <!-- Модальное окно деталей -->
    <OrganizationsOrganizationDetailModal
      v-if="isDetailModalOpen"
      :organization="selectedOrganization"
      :is-open="isDetailModalOpen"
      @close="closeDetailModal"
      @edit="openEditModalFromDetail"
    />

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление организации"
      message="Вы уверены, что хотите удалить эту организацию?"
      :item-name="deleteOrganization?.name"
      warning="Это действие нельзя отменить. Организация будет удалена."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();
const notification = useNotification();

// Интерфейс организации
interface Organization {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  description: string | null;
  isActive: boolean;
  studentsCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Тип ответа от API
interface OrganizationsResponse {
  success: boolean;
  data: Organization[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Состояние
const organizations = ref<Organization[]>([]);
const loading = ref(false);
const isFormModalOpen = ref(false);
const isDetailModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const selectedOrganization = ref<Organization | null>(null);
const deleteOrganization = ref<Organization | null>(null);

// Пагинация
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});

// Фильтры
const filters = ref({
  search: '',
  isActive: '' as string,
});

// Debounce таймер
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Вычисляемые свойства
const hasActiveFilters = computed(() => {
  return filters.value.search !== '' || filters.value.isActive !== '';
});

// Debounced fetch для фильтров
const debouncedFetch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    pagination.value.page = 1;
    fetchOrganizations();
  }, 300);
};

// Обработка изменения фильтров
const handleFilterChange = () => {
  pagination.value.page = 1;
  fetchOrganizations();
};

// Сброс фильтров
const clearFilters = () => {
  filters.value = {
    search: '',
    isActive: '',
  };
  pagination.value.page = 1;
  fetchOrganizations();
};

// Обработка изменения страницы
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchOrganizations();
};

// Обработка изменения количества записей на странице
const handleLimitChange = (limit: number) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  fetchOrganizations();
};

// Загрузка организаций
const fetchOrganizations = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.append('page', pagination.value.page.toString());
    params.append('limit', pagination.value.limit.toString());

    if (filters.value.search) {
      params.append('search', filters.value.search);
    }
    if (filters.value.isActive !== '') {
      params.append('isActive', filters.value.isActive);
    }

    const response = await authFetch<OrganizationsResponse>(
      `/api/organizations?${params.toString()}`,
      { method: 'GET' }
    );

    if (response.success) {
      organizations.value = response.data;
      pagination.value.total = response.total;
      pagination.value.totalPages = response.totalPages;
      pagination.value.page = response.page;
      pagination.value.limit = response.limit;
    }
  } catch (error) {
    console.error('Ошибка загрузки организаций:', error);
    notification.error('Не удалось загрузить список организаций', 'Ошибка');
  } finally {
    loading.value = false;
  }
};

// Открытие модального окна создания
const openCreateModal = () => {
  selectedOrganization.value = null;
  isFormModalOpen.value = true;
};

// Открытие модального окна редактирования
const openEditModal = (organization: Organization) => {
  selectedOrganization.value = organization;
  isFormModalOpen.value = true;
};

// Открытие модального окна редактирования из деталей
const openEditModalFromDetail = () => {
  isDetailModalOpen.value = false;
  isFormModalOpen.value = true;
};

// Закрытие модального окна формы
const closeFormModal = () => {
  isFormModalOpen.value = false;
  selectedOrganization.value = null;
};

// Открытие модального окна деталей
const openDetailModal = (organization: Organization) => {
  selectedOrganization.value = organization;
  isDetailModalOpen.value = true;
};

// Закрытие модального окна деталей
const closeDetailModal = () => {
  isDetailModalOpen.value = false;
  selectedOrganization.value = null;
};

// Открытие модального окна удаления
const openDeleteModal = (organizationId: string) => {
  const organization = organizations.value.find(o => o.id === organizationId);
  if (organization) {
    deleteOrganization.value = organization;
    isDeleteModalOpen.value = true;
  }
};

// Закрытие модального окна удаления
const closeDeleteModal = () => {
  if (!isDeleting.value) {
    isDeleteModalOpen.value = false;
    deleteOrganization.value = null;
  }
};

// Подтверждение удаления
const confirmDelete = async () => {
  if (!deleteOrganization.value) return;

  isDeleting.value = true;
  try {
    const response = await authFetch<{ success: boolean; message?: string }>(
      `/api/organizations/${deleteOrganization.value.id}`,
      { method: 'DELETE' }
    );

    if (response.success) {
      notification.success('Организация успешно удалена', 'Успех');
      await fetchOrganizations();
      closeDeleteModal();
    }
  } catch (error: any) {
    console.error('Ошибка удаления организации:', error);
    const message = error.data?.statusMessage || 'Не удалось удалить организацию';
    notification.error(message, 'Ошибка');
  } finally {
    isDeleting.value = false;
  }
};

// Обработка отправки формы
const handleSubmit = async (data: Partial<Organization>) => {
  try {
    if (selectedOrganization.value) {
      // Обновление
      const response = await authFetch<{ success: boolean; data: Organization }>(
        `/api/organizations/${selectedOrganization.value.id}`,
        {
          method: 'PUT',
          body: data,
        }
      );

      if (response.success) {
        const index = organizations.value.findIndex(o => o.id === selectedOrganization.value!.id);
        if (index !== -1) {
          organizations.value[index] = response.data;
        }
        notification.success('Организация успешно обновлена', 'Успех');
        closeFormModal();
      }
    } else {
      // Создание
      const response = await authFetch<{ success: boolean; data: Organization }>(
        '/api/organizations',
        {
          method: 'POST',
          body: data,
        }
      );

      if (response.success) {
        await fetchOrganizations();
        notification.success('Организация успешно создана', 'Успех');
        closeFormModal();
      }
    }
  } catch (error: any) {
    console.error('Ошибка сохранения организации:', error);
    const message = error.data?.statusMessage || 'Не удалось сохранить организацию';
    notification.error(message, 'Ошибка');
  }
};

// Загрузка данных при монтировании
onMounted(() => {
  fetchOrganizations();
});
</script>
