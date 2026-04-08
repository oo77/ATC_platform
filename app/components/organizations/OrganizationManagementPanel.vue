<template>
  <div class="flex flex-col gap-6">
    <!-- Action Bar -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Организации
        </h2>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
          Всего: {{ pagination.total }}
          <span v-if="hasActiveFilters" class="text-primary">· (фильтр активен)</span>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton variant="primary" size="sm" class="h-10 px-4 gap-2 font-bold shadow-sm" @click="openCreateModal">
          <Plus class="w-4 h-4" />
          Добавить организацию
        </UiButton>
      </div>
    </div>

    <!-- Bento Box Metrics -->
    <div v-if="globalStats" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Выдано сертификатов</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ globalStats.totalIssued }}</h3>
          </div>
          <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
            <Award class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Организаций</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ pagination.total }}</h3>
          </div>
          <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
            <Building2 class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Среднее на орг.</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ averagePerOrg }}</h3>
          </div>
          <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
            <FileCheck class="w-6 h-6" />
          </div>
        </div>
        <p class="mt-1 text-xs font-medium text-slate-400">серт./орг.</p>
      </div>
    </div>

    <!-- Filters Panel -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Filter class="w-5 h-5" />
          </div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white">Фильтры</h4>
        </div>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10"
        >
          <RotateCcw class="w-4 h-4" />
          Сбросить
        </button>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Search -->
        <div class="relative max-w-xl">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Поиск по названию, коду организации..."
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
            @input="debouncedFetch"
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        <!-- Status chips -->
        <div class="space-y-3">
          <label class="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Activity class="w-3.5 h-3.5" />
            Статус
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              @click="filters.isActive = opt.value; handleFilterChange()"
              class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              :class="filters.isActive === opt.value
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <OrganizationsOrganizationTable
        :organizations="organizations"
        :loading="loading"
        @edit="openEditModal"
        @delete="openDeleteModal"
        @view="openDetailModal"
        @download="openDownloadModal"
      />

      <!-- Pagination -->
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

    <!-- Modals -->
    <OrganizationsOrganizationFormModal
      v-if="isFormModalOpen"
      :organization="selectedOrganization"
      :is-open="isFormModalOpen"
      @close="closeFormModal"
      @submit="handleSubmit"
    />

    <OrganizationsOrganizationDetailModal
      v-if="isDetailModalOpen"
      :organization="selectedOrganization"
      :is-open="isDetailModalOpen"
      @close="closeDetailModal"
      @edit="openEditModalFromDetail"
    />

    <OrganizationsDownloadCertificatesModal
      v-if="isDownloadModalOpen"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Plus, Award, Building2, FileCheck, Filter, RotateCcw, Search, Activity } from 'lucide-vue-next';

const { authFetch } = useAuthFetch();
const notification = useNotification();

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
  totalCertificates?: number;
  issuedCertificates?: number;
  revokedCertificates?: number;
  latestCertificateDate?: string | null;
}

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
