<template>
  <div class="flex flex-col gap-4">
    <!-- Метрики сертификатов: компактная полоса в одну строку; дубль «Организаций» убран (число уже в «Найдено» фильтра) -->
    <div v-if="globalStats" class="grid grid-cols-2 gap-3">
      <UiStat label="Выдано сертификатов" :value="globalStats.totalIssued" :icon="Award" tone="primary" />
      <UiStat label="Среднее на организацию" :value="averagePerOrg" hint="серт./орг." :icon="FileCheck" tone="success" />
    </div>

    <!-- Единый блок фильтров: поиск + сегмент статуса. Главное действие — «Добавить организацию» -->
    <UiFilterBar
      v-model:search="filters.search"
      search-placeholder="Поиск по названию, ИНН, коду или контактам…"
      :debounce="0"
      :segments="statusOptions"
      :segment="filters.isActive"
      :total="pagination.total"
      :chips="filterChips"
      @search="debouncedFetch"
      @update:segment="onSegmentChange"
      @remove="removeFilterChip"
      @reset="clearFilters"
    >
      <!-- Действия: «⋯» с вторичным действием + одно главное -->
      <template #actions>
        <UiDropdown
          icon-only
          variant="outline"
          size="md"
          aria-label="Дополнительные действия"
          :groups="toolbarMenu"
          @select="onToolbarSelect"
        />
        <UiButton variant="primary" size="md" :start-icon="Plus" @click="openCreateModal">
          Добавить организацию
        </UiButton>
      </template>
    </UiFilterBar>

    <!-- Карточка таблицы: таблица + пагинация-футер внутри одной карточки. Лимит 20 теперь есть в списке опций -->
    <div id="organizations-table" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <OrganizationsOrganizationTable
        :organizations="organizations"
        :loading="loading"
        @edit="openEditModal"
        @delete="openDeleteModal"
        @view="openDetailModal"
        @download="openDownloadModal"
      />

      <!-- Пагинация -->
      <UiPagination
        v-if="pagination.totalPages > 0"
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="loading"
        scroll-target="#organizations-table"
        @update:page="handlePageChange"
        @update:limit="handleLimitChange"
      />
    </div>

    <!-- Modals -->
    <OrganizationsOrganizationFormModal
      v-if="isFormModalOpen"
      :organization="selectedOrganization"
      :is-open="isFormModalOpen"
      @close="closeFormModal"
      @submit="handleSubmit"
    />

    <OrganizationsOrganizationDetailModal
      v-if="isDetailModalOpen && selectedOrganization"
      :organization="selectedOrganization"
      :is-open="isDetailModalOpen"
      @close="closeDetailModal"
      @edit="openEditModalFromDetail"
    />

    <OrganizationsDownloadCertificatesModal
      v-if="isDownloadModalOpen && selectedOrganization"
      :organization="selectedOrganization"
      :is-open="isDownloadModalOpen"
      @close="closeDownloadModal"
    />

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

    <StudentsSyncStudentsModal
      :show="isSyncModalOpen"
      @close="isSyncModalOpen = false"
      @synced="fetchOrganizations"
    />
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
// Убраны иконки фильтров (Building2/Filter/RotateCcw/Search/Activity) — их рисуют UiFilterBar и UiStat
import { Plus, Award, FileCheck, RefreshCw } from 'lucide-vue-next';
import type { Organization } from '~/types/organization';

const { authFetch } = useAuthFetch();
const notification = useNotification();

interface OrganizationsResponse {
  success: boolean;
  data: Organization[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: { totalIssued: number };
}

const statusOptions = [
  { value: '', label: 'Все' },
  { value: 'true', label: 'Активные' },
  { value: 'false', label: 'Неактивные' },
];

// State
const organizations = ref<Organization[]>([]);
const loading = ref(false);
const isFormModalOpen = ref(false);
const isDetailModalOpen = ref(false);
const isSyncModalOpen = ref(false);
const isDownloadModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const selectedOrganization = ref<Organization | null>(null);
const deleteOrganization = ref<Organization | null>(null);

const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });
const globalStats = ref<{ totalIssued: number } | null>(null);

const filters = ref({ search: '', isActive: '' as string });

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const hasActiveFilters = computed(() => filters.value.search !== '' || filters.value.isActive !== '');
const averagePerOrg = computed(() => {
  if (!pagination.value.total) return 0;
  const avg = (globalStats.value?.totalIssued || 0) / pagination.value.total;
  return isNaN(avg) ? 0 : avg.toFixed(1);
});

// ---- Презентационные хелперы для UiFilterBar (запросы и состояние фильтров не затронуты) ----

// Сегмент статуса: записываем значение в тот же filters.isActive и зовём прежний handleFilterChange
const onSegmentChange = (value: string | number | boolean) => {
  filters.value.isActive = String(value);
  handleFilterChange();
};

// Чип выбранного статуса: даёт видимое состояние и кнопку «Сбросить всё»
const filterChips = computed(() => {
  const chips: { key: string; label: string }[] = [];
  const opt = statusOptions.find((o) => o.value === filters.value.isActive);
  if (filters.value.isActive !== '' && opt) chips.push({ key: 'isActive', label: `Статус: ${opt.label}` });
  return chips;
});
const removeFilterChip = (key: string) => {
  if (key === 'isActive') {
    filters.value.isActive = '';
    handleFilterChange();
  }
};

// Меню «⋯» в панели: вторичное действие «Обновить слушателей» (открывает прежнюю модалку синхронизации)
const toolbarMenu = [
  { items: [{ key: 'sync', label: 'Обновить слушателей', description: 'Синхронизация данных', icon: RefreshCw }] },
];
const onToolbarSelect = (key: string) => {
  if (key === 'sync') isSyncModalOpen.value = true;
};

const debouncedFetch = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { pagination.value.page = 1; fetchOrganizations(); }, 300);
};

const handleFilterChange = () => { pagination.value.page = 1; fetchOrganizations(); };
const clearFilters = () => { filters.value = { search: '', isActive: '' }; pagination.value.page = 1; fetchOrganizations(); };
const handlePageChange = (page: number) => { pagination.value.page = page; fetchOrganizations(); };
const handleLimitChange = (limit: number) => { pagination.value.limit = limit; pagination.value.page = 1; fetchOrganizations(); };

const fetchOrganizations = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.append('page', pagination.value.page.toString());
    params.append('limit', pagination.value.limit.toString());
    if (filters.value.search) params.append('search', filters.value.search);
    if (filters.value.isActive !== '') params.append('isActive', filters.value.isActive);

    const response = await authFetch<OrganizationsResponse>(`/api/organizations?${params.toString()}`, { method: 'GET' });
    if (response.success) {
      organizations.value = response.data;
      pagination.value.total = response.total;
      pagination.value.totalPages = response.totalPages;
      pagination.value.page = response.page || 1;
      pagination.value.limit = response.limit || 20;
      if (response.stats) globalStats.value = response.stats;
    }
  } catch (error) {
    console.error('Ошибка загрузки организаций:', error);
    notification.error('Не удалось загрузить список организаций', 'Ошибка');
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => { selectedOrganization.value = null; isFormModalOpen.value = true; };
const openEditModal = (organization: Organization) => { selectedOrganization.value = organization; isFormModalOpen.value = true; };
const openEditModalFromDetail = () => { isDetailModalOpen.value = false; isFormModalOpen.value = true; };
const closeFormModal = () => { isFormModalOpen.value = false; selectedOrganization.value = null; };
const openDetailModal = (organization: Organization) => { selectedOrganization.value = organization; isDetailModalOpen.value = true; };
const closeDetailModal = () => { isDetailModalOpen.value = false; selectedOrganization.value = null; };
const openDownloadModal = (organization: Organization) => { selectedOrganization.value = organization; isDownloadModalOpen.value = true; };
const closeDownloadModal = () => { isDownloadModalOpen.value = false; selectedOrganization.value = null; };
const openDeleteModal = (organizationId: string) => {
  const organization = organizations.value.find(o => o.id === organizationId);
  if (organization) { deleteOrganization.value = organization; isDeleteModalOpen.value = true; }
};
const closeDeleteModal = () => {
  if (!isDeleting.value) { isDeleteModalOpen.value = false; deleteOrganization.value = null; }
};

const confirmDelete = async () => {
  if (!deleteOrganization.value) return;
  isDeleting.value = true;
  try {
    const response = await authFetch<{ success: boolean; message?: string }>(
      `/api/organizations/${deleteOrganization.value.id}`, { method: 'DELETE' }
    );
    if (response.success) {
      notification.success('Организация успешно удалена', 'Успех');
      await fetchOrganizations();
      closeDeleteModal();
    }
  } catch (error: any) {
    const message = error.data?.statusMessage || 'Не удалось удалить организацию';
    notification.error(message, 'Ошибка');
  } finally {
    isDeleting.value = false;
  }
};

const handleSubmit = async (data: Partial<Organization>) => {
  try {
    if (selectedOrganization.value) {
      const response = await authFetch<{ success: boolean; data: Organization }>(
        `/api/organizations/${selectedOrganization.value.id}`, { method: 'PUT', body: data }
      );
      if (response.success) {
        const index = organizations.value.findIndex(o => o.id === selectedOrganization.value!.id);
        if (index !== -1) organizations.value[index] = response.data;
        notification.success('Организация успешно обновлена', 'Успех');
        closeFormModal();
      }
    } else {
      const response = await authFetch<{ success: boolean; data: Organization }>(
        '/api/organizations', { method: 'POST', body: data }
      );
      if (response.success) {
        await fetchOrganizations();
        notification.success('Организация успешно создана', 'Успех');
        closeFormModal();
      }
    }
  } catch (error: any) {
    const message = error.data?.statusMessage || 'Не удалось сохранить организацию';
    notification.error(message, 'Ошибка');
  }
};

onMounted(() => { fetchOrganizations(); });
</script>
