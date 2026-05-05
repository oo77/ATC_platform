<template>
  <div class="flex flex-col gap-6">
    <!-- Header & Actions -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
      <div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Представители организаций
        </h3>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Управление заявками и доступом представителей
        </p>
      </div>

      <!-- Статистика -->
      <div v-if="stats" class="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 shadow-sm flex items-center gap-4">
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Всего</div>
            <div class="text-xl font-black text-slate-900 dark:text-white">{{ stats.total }}</div>
          </div>
          <div class="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            <Users class="w-5 h-5" />
          </div>
        </div>
        <div class="rounded-2xl border border-warning/20 bg-warning/5 px-5 py-3 shadow-sm flex items-center gap-4">
          <div>
            <div class="text-xs font-bold text-warning uppercase tracking-widest">Ожидают</div>
            <div class="text-xl font-black text-warning">{{ stats.pending }}</div>
          </div>
          <div class="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
            <Clock class="w-5 h-5" />
          </div>
        </div>
        <div class="rounded-2xl border border-success/20 bg-success/5 px-5 py-3 shadow-sm flex items-center gap-4">
          <div>
            <div class="text-xs font-bold text-success uppercase tracking-widest">Одобрено</div>
            <div class="text-xl font-black text-success">{{ stats.approved }}</div>
          </div>
          <div class="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
            <CheckCircle class="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Filter class="w-5 h-5" />
        </div>
        <h4 class="text-lg font-bold text-slate-900 dark:text-white">
          Фильтры
        </h4>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <!-- Поиск -->
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Поиск
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="ФИО, телефон, организация..."
              class="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
              @input="debouncedSearch"
            />
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        <!-- Статус -->
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Статус
          </label>
          <div class="relative">
            <select
              v-model="filters.status"
              class="w-full appearance-none rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
              @change="loadRepresentatives"
            >
              <option value="">Все статусы</option>
              <option value="pending">Ожидают одобрения</option>
              <option value="approved">Одобрены</option>
              <option value="blocked">Заблокированы</option>
            </select>
            <ChevronDown class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <!-- Организация -->
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Организация
          </label>
          <div class="relative">
            <select
              v-model="filters.organizationId"
              class="w-full appearance-none rounded-xl border border-slate-200 bg-white dark:bg-slate-900 py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm text-slate-700 dark:text-slate-300"
              @change="loadRepresentatives"
            >
              <option value="">Все организации</option>
              <option v-for="org in organizations" :key="org.id" :value="org.id">
                {{ org.name }}
              </option>
            </select>
            <Building2 class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <!-- Таблица представителей -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <RepresentativesRepresentativeTable
        :representatives="representatives"
        :loading="loading"
        @view="handleView"
        @approve="handleApprove"
        @block="handleBlock"
        @unblock="handleUnblock"
        @delete="handleDelete"
      />

      <!-- Пагинация -->
      <div v-if="totalPages > 1" class="px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-center">
        <nav class="flex gap-2">
          <button
            v-for="page in totalPages"
            :key="page"
            @click="changePage(page)"
            :class="[
              'px-4 py-2 rounded-lg font-bold transition-all text-sm',
              currentPage === page
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
            ]"
          >
            {{ page }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Модальные окна -->
    <RepresentativesRepresentativeDetailModal
      v-if="selectedRepresentative"
      :representative="selectedRepresentative"
      :is-open="showDetailModal"
      @close="closeDetailModal"
      @approve="handleApprove"
      @block="handleBlock"
      @unblock="handleUnblock"
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

    <RepresentativesUnblockRepresentativeModal
      v-if="representativeToUnblock"
      :representative="representativeToUnblock"
      :is-open="showUnblockModal"
      @close="closeUnblockModal"
      @submit="submitUnblock"
    />

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление представителя"
      message="Вы уверены, что хотите удалить этого представителя?"
      :item-name="representativeToDelete?.fullName"
      warning="Это действие нельзя отменить. Все данные представителя будут удалены."
      confirm-text="Удалить"
      cancel-text="Отмена"
      variant="danger"
      :loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Users, Clock, CheckCircle, Search, Filter, ChevronDown, Building2 } from "lucide-vue-next";

// Типы
interface RepresentativePermissions {
  can_view_students: boolean;
  can_view_schedule: boolean;
  can_view_certificates: boolean;
  can_request_certificates: boolean;
}

interface Representative {
  id: string;
  organizationId: string;
  organizationName?: string;
  fullName: string;
  phone: string;
  telegramChatId: string | null;
  telegramUsername: string | null;
  status: "pending" | "approved" | "blocked";
  accessGroups: string[] | null;
  permissions?: RepresentativePermissions;
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
  search: "",
  status: "",
  organizationId: "",
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

const showUnblockModal = ref(false);
const representativeToUnblock = ref<Representative | null>(null);

// Модалка удаления
const showDeleteModal = ref(false);
const representativeToDelete = ref<Representative | null>(null);
const deleteLoading = ref(false);

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

    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.organizationId)
      params.append("organizationId", filters.organizationId);

    const response = await authFetch<{
      success: boolean;
      data: Representative[];
      total: number;
      totalPages: number;
    }>(`/api/representatives?${params.toString()}`, { method: "GET" });

    if (response.success) {
      representatives.value = response.data;
      totalPages.value = response.totalPages;
    }
  } catch (error) {
    console.error("Error loading representatives:", error);
    notification.error("Ошибка при загрузке представителей");
  } finally {
    loading.value = false;
  }
};

const loadOrganizations = async () => {
  try {
    const response = await authFetch<{
      success: boolean;
      data: Organization[];
    }>("/api/organizations?limit=1000", { method: "GET" });

    if (response.success) {
      organizations.value = response.data;
    }
  } catch (error) {
    console.error("Error loading organizations:", error);
  }
};

const loadStats = async () => {
  try {
    const response = await authFetch<{
      success: boolean;
      data: Stats;
    }>("/api/representatives/stats", { method: "GET" });

    if (response.success) {
      stats.value = response.data;
    }
  } catch (error) {
    console.error("Error loading stats:", error);
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
        method: "POST",
        body: data,
      },
    );

    if (response.success) {
      notification.success("Представитель успешно одобрен");
      closeApproveModal();
      await Promise.all([loadRepresentatives(), loadStats()]);
    }
  } catch (error: any) {
    notification.error(error.data?.message || "Ошибка при одобрении");
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
        method: "POST",
        body: data,
      },
    );

    if (response.success) {
      notification.success("Представитель заблокирован");
      closeBlockModal();
      await Promise.all([loadRepresentatives(), loadStats()]);
    }
  } catch (error: any) {
    notification.error(error.data?.message || "Ошибка при блокировке");
  }
};

const handleUnblock = (representative: Representative) => {
  representativeToUnblock.value = representative;
  showUnblockModal.value = true;
  closeDetailModal();
};

const closeUnblockModal = () => {
  showUnblockModal.value = false;
  representativeToUnblock.value = null;
};

const submitUnblock = async () => {
  if (!representativeToUnblock.value) return;

  try {
    const response = await authFetch(
      `/api/representatives/${representativeToUnblock.value.id}/unblock`,
      {
        method: "POST",
      },
    );

    if (response.success) {
      notification.success("Представитель разблокирован");
      closeUnblockModal();
      await Promise.all([loadRepresentatives(), loadStats()]);
    }
  } catch (error: any) {
    notification.error(error.data?.message || "Ошибка при разблокировке");
  }
};

const handleDelete = (representative: Representative) => {
  representativeToDelete.value = representative;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  representativeToDelete.value = null;
};

const confirmDelete = async () => {
  if (!representativeToDelete.value) return;

  deleteLoading.value = true;
  try {
    const response = await authFetch(
      `/api/representatives/${representativeToDelete.value.id}`,
      {
        method: "DELETE",
      },
    );

    if (response.success) {
      notification.success("Представитель удалён");
      closeDeleteModal();
      await Promise.all([loadRepresentatives(), loadStats()]);
    }
  } catch (error: any) {
    notification.error(error.data?.message || "Ошибка при удалении");
  } finally {
    deleteLoading.value = false;
  }
};

const handleRepresentativeUpdated = async () => {
  // Перезагружаем данные после обновления разрешений
  await loadRepresentatives();
};

// Инициализация
onMounted(async () => {
  await Promise.all([loadRepresentatives(), loadOrganizations(), loadStats()]);
});
</script>
