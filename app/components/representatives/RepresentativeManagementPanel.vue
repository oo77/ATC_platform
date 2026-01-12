<template>
  <div>
    <!-- Заголовок и статистика -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-xl font-semibold text-black dark:text-white">
          Представители организаций
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Управление заявками и доступом представителей
        </p>
      </div>

      <!-- Статистика -->
      <div v-if="stats" class="flex gap-3">
        <div class="rounded-lg bg-primary/10 px-4 py-2">
          <div class="text-xs text-gray-600 dark:text-gray-400">Всего</div>
          <div class="text-lg font-bold text-primary">{{ stats.total }}</div>
        </div>
        <div class="rounded-lg bg-warning/10 px-4 py-2">
          <div class="text-xs text-gray-600 dark:text-gray-400">Ожидают</div>
          <div class="text-lg font-bold text-warning">{{ stats.pending }}</div>
        </div>
        <div class="rounded-lg bg-success/10 px-4 py-2">
          <div class="text-xs text-gray-600 dark:text-gray-400">Одобрено</div>
          <div class="text-lg font-bold text-success">{{ stats.approved }}</div>
        </div>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="mb-6 rounded-lg bg-white dark:bg-boxdark p-4 shadow-sm">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <!-- Поиск -->
        <div>
          <label class="mb-2 block text-sm font-medium text-black dark:text-white">
            Поиск
          </label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="ФИО, телефон, организация..."
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
            @input="debouncedSearch"
          />
        </div>

        <!-- Статус -->
        <div>
          <label class="mb-2 block text-sm font-medium text-black dark:text-white">
            Статус
          </label>
          <select
            v-model="filters.status"
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
            @change="loadRepresentatives"
          >
            <option value="">Все статусы</option>
            <option value="pending">Ожидают одобрения</option>
            <option value="approved">Одобрены</option>
            <option value="blocked">Заблокированы</option>
          </select>
        </div>

        <!-- Организация -->
        <div>
          <label class="mb-2 block text-sm font-medium text-black dark:text-white">
            Организация
          </label>
          <select
            v-model="filters.organizationId"
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
            @change="loadRepresentatives"
          >
            <option value="">Все организации</option>
            <option v-for="org in organizations" :key="org.id" :value="org.id">
              {{ org.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Таблица представителей -->
    <RepresentativesRepresentativeTable
      :representatives="representatives"
      :loading="loading"
      @view="handleView"
      @approve="handleApprove"
      @block="handleBlock"
      @delete="handleDelete"
    />

    <!-- Пагинация -->
    <div v-if="totalPages > 1" class="mt-6 flex justify-center">
      <nav class="flex gap-2">
        <button
          v-for="page in totalPages"
          :key="page"
          @click="changePage(page)"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            currentPage === page
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4'
          ]"
        >
          {{ page }}
        </button>
      </nav>
    </div>

    <!-- Модальные окна -->
    <RepresentativesRepresentativeDetailModal
      v-if="selectedRepresentative"
      :representative="selectedRepresentative"
      :is-open="showDetailModal"
      @close="closeDetailModal"
      @approve="handleApprove"
      @block="handleBlock"
      @updated="handleRepresentativeUpdated"
    />

    <RepresentativesApproveRepresentativeModal
      v-if="representativeToApprove"
      :representative="representativeToApprove"
      :is-open="showApproveModal"
      @close="closeApproveModal"
      @submit="submitApproval"
    />

    <RepresentativesBlockRepresentativeModal
      v-if="representativeToBlock"
      :representative="representativeToBlock"
      :is-open="showBlockModal"
      @close="closeBlockModal"
      @submit="submitBlock"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';

// Типы
interface Representative {
  id: string;
  organizationId: string;
  organizationName?: string;
  fullName: string;
  phone: string;
  telegramChatId: string | null;
  telegramUsername: string | null;
  status: 'pending' | 'approved' | 'blocked';
  accessGroups: string[] | null;
  notificationsEnabled: boolean;
  lastActivityAt: Date | null;
  approvedBy: string | null;
  approvedByName?: string;
  approvedAt: Date | null;
  blockedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Organization {
  id: string;
  name: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  blocked: number;
}

// Composables
const { authFetch } = useAuthFetch();
const notification = useNotification();

// Состояние
const loading = ref(false);
const representatives = ref<Representative[]>([]);
const organizations = ref<Organization[]>([]);
const stats = ref<Stats | null>(null);

const filters = reactive({
  search: '',
  status: '',
  organizationId: '',
});

const currentPage = ref(1);
const totalPages = ref(1);
const limit = 20;

// Модальные окна
const showDetailModal = ref(false);
const selectedRepresentative = ref<Representative | null>(null);

const showApproveModal = ref(false);
const representativeToApprove = ref<Representative | null>(null);

const showBlockModal = ref(false);
const representativeToBlock = ref<Representative | null>(null);

// Debounce для поиска
let searchTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    loadRepresentatives();
  }, 300);
};

// Методы
const loadRepresentatives = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.toString(),
    });

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.organizationId) params.append('organizationId', filters.organizationId);

    const response = await authFetch<{
      success: boolean;
      data: Representative[];
      total: number;
      totalPages: number;
    }>(`/api/representatives?${params.toString()}`, { method: 'GET' });

    if (response.success) {
      representatives.value = response.data;
      totalPages.value = response.totalPages;
    }
  } catch (error) {
    console.error('Error loading representatives:', error);
    notification.error('Ошибка при загрузке представителей');
  } finally {
    loading.value = false;
  }
};

const loadOrganizations = async () => {
  try {
    const response = await authFetch<{
      success: boolean;
      data: Organization[];
    }>('/api/organizations?limit=1000', { method: 'GET' });

    if (response.success) {
      organizations.value = response.data;
    }
  } catch (error) {
    console.error('Error loading organizations:', error);
  }
};

const loadStats = async () => {
  try {
    const response = await authFetch<{
      success: boolean;
      data: Stats;
    }>('/api/representatives/stats', { method: 'GET' });

    if (response.success) {
      stats.value = response.data;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

const changePage = (page: number) => {
  currentPage.value = page;
  loadRepresentatives();
};

// Обработчики действий
const handleView = (representative: Representative) => {
  selectedRepresentative.value = representative;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedRepresentative.value = null;
};

const handleApprove = (representative: Representative) => {
  representativeToApprove.value = representative;
  showApproveModal.value = true;
  closeDetailModal();
};

const closeApproveModal = () => {
  showApproveModal.value = false;
  representativeToApprove.value = null;
};

const submitApproval = async (data: { accessGroups?: string[] }) => {
  if (!representativeToApprove.value) return;

  try {
    const response = await authFetch(
      `/api/representatives/${representativeToApprove.value.id}/approve`,
      {
        method: 'POST',
        body: data,
      }
    );

    if (response.success) {
      notification.success('Представитель успешно одобрен');
      closeApproveModal();
      await Promise.all([loadRepresentatives(), loadStats()]);
    }
  } catch (error: any) {
    notification.error(error.data?.message || 'Ошибка при одобрении');
  }
};

const handleBlock = (representative: Representative) => {
  representativeToBlock.value = representative;
  showBlockModal.value = true;
  closeDetailModal();
};

const closeBlockModal = () => {
  showBlockModal.value = false;
  representativeToBlock.value = null;
};

const submitBlock = async (data: { reason: string }) => {
  if (!representativeToBlock.value) return;

  try {
    const response = await authFetch(
      `/api/representatives/${representativeToBlock.value.id}/block`,
      {
        method: 'POST',
        body: data,
      }
    );

    if (response.success) {
      notification.success('Представитель заблокирован');
      closeBlockModal();
      await Promise.all([loadRepresentatives(), loadStats()]);
    }
  } catch (error: any) {
    notification.error(error.data?.message || 'Ошибка при блокировке');
  }
};

const handleDelete = async (representative: Representative) => {
  if (!confirm(`Удалить представителя ${representative.fullName}?`)) return;

  try {
    const response = await authFetch(`/api/representatives/${representative.id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      notification.success('Представитель удалён');
      await Promise.all([loadRepresentatives(), loadStats()]);
    }
  } catch (error: any) {
    notification.error(error.data?.message || 'Ошибка при удалении');
  }
};

const handleRepresentativeUpdated = async () => {
  // Перезагружаем данные после обновления разрешений
  await loadRepresentatives();
};

// Инициализация
onMounted(async () => {
  await Promise.all([
    loadRepresentatives(),
    loadOrganizations(),
    loadStats(),
  ]);
});
</script>
