<template>
  <div class="space-y-4">
    <!-- Единый блок фильтров: поиск + сегмент статуса (со счётчиками вместо отдельных KPI-карточек) + организация в «Фильтры» -->
    <UiFilterBar
      v-model:search="filters.search"
      search-placeholder="ФИО, телефон, организация..."
      :debounce="0"
      :segments="statusSegments"
      :segment="filters.status"
      :chips="filterChips"
      :active-count="filterChips.length"
      :total="total"
      persist-key="representatives"
      @search="debouncedSearch"
      @update:segment="onStatusChange"
      @remove="onChipRemove"
      @reset="resetFilters"
    >
      <!-- Второстепенный фильтр: организация (редко нужен, поэтому спрятан в сворачиваемую панель) -->
      <template #filters>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Организация</label>
          <select
            v-model="filters.organizationId"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            @change="onOrgChange"
          >
            <option value="">Все организации</option>
            <option v-for="org in organizations" :key="org.id" :value="org.id">
              {{ org.name }}
            </option>
          </select>
        </div>
      </template>
    </UiFilterBar>

    <!-- Таблица представителей; пагинация — футер внутри карточки -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <RepresentativesRepresentativeTable
        :representatives="representatives"
        :loading="loading"
        @view="handleView"
        @approve="handleApprove"
        @block="handleBlock"
        @unblock="handleUnblock"
        @delete="handleDelete"
      />

      <!-- Единая пагинация вместо перечисления всех страниц; limit фиксирован → выбор размера скрыт -->
      <UiPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total="total"
        :limit="limit"
        :loading="loading"
        hide-limit
        @update:page="changePage"
      />
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
// Иконки KPI-карточек и фильтров больше не нужны: статистика ушла в счётчики сегментов, поля рисует UiFilterBar
import { ref, reactive, computed, onMounted } from "vue";

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
// Общее число записей — нужно UiPagination и счётчику «Найдено N» (API уже возвращает total)
const total = ref(0);
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
      total.value = response.total ?? 0;
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

// ---- Презентационная обвязка для UiFilterBar (вызывает прежние loadRepresentatives / debouncedSearch) ----

// Сегменты статуса со счётчиками из stats: заменяют отдельные KPI-карточки и убирают дубль информации
const statusSegments = computed(() => [
  { value: "", label: "Все", count: stats.value?.total },
  { value: "pending", label: "Ожидают", count: stats.value?.pending },
  { value: "approved", label: "Одобрены", count: stats.value?.approved },
  { value: "blocked", label: "Заблокированы", count: stats.value?.blocked },
]);

// Смена статуса: возвращаемся на 1-ю страницу, иначе при странице > числа результатов таблица окажется пустой
const onStatusChange = (value: string | number | boolean) => {
  filters.status = String(value);
  currentPage.value = 1;
  loadRepresentatives();
};

// Смена организации: так же сбрасываем страницу и перезагружаем список
const onOrgChange = () => {
  currentPage.value = 1;
  loadRepresentatives();
};

// Чип применённого фильтра по организации (виден в панели, чтобы состояние не нужно было помнить)
const filterChips = computed(() => {
  if (!filters.organizationId) return [];
  const org = organizations.value.find((o) => o.id === filters.organizationId);
  return [{ key: "organizationId", label: `Организация: ${org?.name ?? "—"}` }];
});

const onChipRemove = (key: string) => {
  if (key === "organizationId") {
    filters.organizationId = "";
    onOrgChange();
  }
};

// «Сбросить всё»: очищаем поиск, статус и организацию одним действием
const resetFilters = () => {
  filters.search = "";
  filters.status = "";
  filters.organizationId = "";
  currentPage.value = 1;
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
