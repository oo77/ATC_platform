<script setup lang="ts">
/**
 * Страница управления заявками на обучение (Admin / Moderator)
 */
definePageMeta({ layout: "default" });

const { authFetch } = useAuthFetch();
const { success: notifySuccess, error: notifyError } = useNotification();

// ─── Типы ───
type RequestStatus = "pending" | "approved" | "rejected" | "in_progress" | "completed";
type ContractStatus = "not_signed" | "signed";
type PaymentStatus  = "not_paid" | "paid";

interface StudentDetail { id: string; fullName: string; position: string | null; department: string | null; }
interface RequestItem {
  id: string; courseId: string; courseName: string; trainingMonth: string;
  studentsCount: number; groupLabel: string | null;
  students?: StudentDetail[];
  _showStudents?: boolean;
}
interface TrainingRequest {
  id: string; representativeName: string; organizationName: string; organizationId: string;
  totalItemsCount: number; totalStudentsCount: number;
  status: RequestStatus; contractStatus: ContractStatus; paymentStatus: PaymentStatus;
  adminComment: string | null; createdAt: string;
  items: RequestItem[];
}
interface Stats {
  byMonth: { month: string; totalRequests: number; totalStudents: number }[];
  byCourse: { courseId: string; courseName: string; totalRequests: number; totalStudents: number }[];
  totals: Record<RequestStatus, number> & { total: number };
}

// ─── Состояние ───
const activeTab     = ref<"list" | "analytics">("list");
const loading       = ref(true);
const saving        = ref<string | null>(null);
const requests      = ref<TrainingRequest[]>([]);
const stats         = ref<Stats | null>(null);
const selectedRequest = ref<TrainingRequest | null>(null);
const showDetailModal = ref(false);
const actionModalOpen = ref(false);
const activeActionRequest = ref<TrainingRequest | null>(null);

// ─── Фильтры ───
const filterStatus   = ref("");
const filterMonth    = ref("");
const filterOrg      = ref("");
const filterCourseId = ref("");
const currentPage    = ref(1);
const totalItems     = ref(0);
const PAGE_SIZE      = 20;

// ─── Уникальные организации из загруженных данных ───
const orgList = computed(() => {
  const map = new Map<string, string>();
  requests.value.forEach((r) => {
    if (r.organizationId) map.set(r.organizationId, r.organizationName);
  });
  return [...map.entries()].map(([id, name]) => ({ id, name }));
});

// ─── Метки ───
const STATUS_LABELS: Record<string, string> = {
  pending: "На рассмотрении", approved: "Одобрена",
  rejected: "Отклонена", in_progress: "В процессе", completed: "Завершена",
};
const STATUS_COLORS: Record<string, string> = {
  pending:     "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed:   "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};
const MONTHS_RU = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

// ─── Загрузка ───
async function loadData() {
  loading.value = true;
  try {
    const params: Record<string, string | number> = {
      page: currentPage.value, limit: PAGE_SIZE,
    };
    if (filterStatus.value)   params.status         = filterStatus.value;
    if (filterMonth.value)    params.month          = filterMonth.value;
    if (filterOrg.value)      params.organizationId = filterOrg.value;
    if (filterCourseId.value) params.courseId       = filterCourseId.value;

    const [requestsRes, statsRes] = await Promise.all([
      authFetch<{ success: boolean; data: TrainingRequest[]; total: number }>(
        "/api/training-requests", { params }
      ),
      authFetch<{ success: boolean; stats: Stats }>("/api/training-requests/stats"),
    ]);

    if (requestsRes.success) {
      requests.value   = requestsRes.data;
      totalItems.value = requestsRes.total;
    }
    if (statsRes.success) {
      stats.value = statsRes.stats;
    }
  } catch (err: any) {
    notifyError(err.data?.message || "Ошибка загрузки данных");
  } finally {
    loading.value = false;
  }
}

// ─── Патч ───
async function patchRequest(
  id: string,
  changes: Partial<{ status: RequestStatus; contractStatus: ContractStatus; paymentStatus: PaymentStatus; adminComment: string }>
) {
  saving.value = id;
  try {
    await authFetch(`/api/training-requests/${id}`, { method: "PATCH", body: changes });
    notifySuccess("Изменения успешно сохранены");
    await loadData();
    if (selectedRequest.value?.id === id) {
      selectedRequest.value = requests.value.find((r) => r.id === id) || null;
    }
  } catch (err: any) {
    notifyError(err.data?.message || "Ошибка сохранения");
  } finally {
    saving.value = null;
  }
}

// ─── Action Modal ───
function openActionModal(req: TrainingRequest) {
  activeActionRequest.value = JSON.parse(JSON.stringify(req));
  actionModalOpen.value = true;
}
function closeActionModal() {
  activeActionRequest.value = null;
  actionModalOpen.value = false;
}
async function saveActionModal() {
  if (!activeActionRequest.value) return;
  const changes = {
    status:         activeActionRequest.value.status,
    contractStatus: activeActionRequest.value.contractStatus,
    paymentStatus:  activeActionRequest.value.paymentStatus,
    adminComment:   activeActionRequest.value.adminComment || "",
  };
  await patchRequest(activeActionRequest.value.id, changes);
  closeActionModal();
}

// ─── Детали заявки ───
async function openDetail(req: TrainingRequest) {
  selectedRequest.value = req;
  showDetailModal.value = true;
  try {
    const res = await authFetch<{ success: boolean; data: TrainingRequest }>(
      `/api/training-requests/${req.id}`
    );
    if (res.success) selectedRequest.value = res.data;
  } catch { /* silently */ }
}

// ─── Фильтр по курсу через клик на блоке "По курсам" ───
function toggleCourseFilter(courseId: string) {
  filterCourseId.value = filterCourseId.value === courseId ? "" : courseId;
  currentPage.value = 1;
  activeTab.value = "list";
}

// ─── Утилиты ───
function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatMonth(m: string) {
  if (!m) return "";
  const parts = m.split("-");
  const y = parts[0];
  const mo = parts[1];
  if (!y || !mo) return m;
  const idx = parseInt(mo) - 1;
  return `${MONTHS_RU[idx] || mo} ${y}`;
}
function uniqueCourseNames(items: RequestItem[]) {
  return [...new Set(items.map((i) => i.courseName))];
}
function shortName(name: string) {
  // Обрезаем слишком длинные названия курсов
  return name.length > 30 ? name.substring(0, 28) + "…" : name;
}
function totalPages() { return Math.ceil(totalItems.value / PAGE_SIZE); }

function resetFilters() {
  filterStatus.value   = "";
  filterMonth.value    = "";
  filterOrg.value      = "";
  filterCourseId.value = "";
  currentPage.value    = 1;
}

const hasActiveFilters = computed(() =>
  !!(filterStatus.value || filterMonth.value || filterOrg.value || filterCourseId.value)
);

// Макс по курсам для прогресс-баров
const maxCourseRequests = computed(() =>
  Math.max(...(stats.value?.byCourse.map((c) => c.totalRequests) || [1]), 1)
);

// ─── Жизненный цикл ───
onMounted(loadData);
watch([filterStatus, filterMonth, filterOrg, filterCourseId, currentPage], loadData);
</script>

<template>
  <div class="container mx-auto px-4 py-6">

    <!-- ═══ ЗАГОЛОВОК + КНОПКИ ═══ -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Заявки на обучение</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          Управление заявками от представителей организаций
        </p>
      </div>
      <button @click="loadData" :disabled="loading"
        class="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800
               border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium
               hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
        <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Обновить
      </button>
    </div>

    <!-- ═══ ДАШБОРД: СТАТИСТИКА ═══ -->
    <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totals.total }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Всего заявок</p>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-yellow-200 dark:border-yellow-800 cursor-pointer transition-transform hover:scale-[1.02]"
        @click="filterStatus = filterStatus === 'pending' ? '' : 'pending'; activeTab = 'list'">
        <p class="text-2xl font-bold text-yellow-500">{{ stats.totals.pending }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">На рассмотрении</p>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-800 cursor-pointer transition-transform hover:scale-[1.02]"
        @click="filterStatus = filterStatus === 'approved' ? '' : 'approved'; activeTab = 'list'">
        <p class="text-2xl font-bold text-green-500">{{ stats.totals.approved }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Одобрено</p>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-blue-200 dark:border-blue-800 cursor-pointer transition-transform hover:scale-[1.02]"
        @click="filterStatus = filterStatus === 'in_progress' ? '' : 'in_progress'; activeTab = 'list'">
        <p class="text-2xl font-bold text-blue-500">{{ stats.totals.in_progress }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">В процессе</p>
      </div>
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-red-200 dark:border-red-800 cursor-pointer transition-transform hover:scale-[1.02]"
        @click="filterStatus = filterStatus === 'rejected' ? '' : 'rejected'; activeTab = 'list'">
        <p class="text-2xl font-bold text-red-500">{{ stats.totals.rejected }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Отклонено</p>
      </div>
    </div>

    <!-- ═══ ТАБЫ ═══ -->
    <div class="border-b border-gray-200 dark:border-gray-700 mb-5">
      <nav class="flex gap-1">
        <button
          @click="activeTab = 'list'"
          :class="[activeTab === 'list'
            ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 font-semibold'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            'px-5 py-3 text-sm transition-colors flex items-center gap-2']">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Список заявок
          <span v-if="totalItems > 0" class="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs px-2 py-0.5 rounded-full font-semibold">
            {{ totalItems }}
          </span>
        </button>
        <button
          @click="activeTab = 'analytics'"
          :class="[activeTab === 'analytics'
            ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 font-semibold'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            'px-5 py-3 text-sm transition-colors flex items-center gap-2']">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Аналитика
        </button>
      </nav>
    </div>

    <!-- ════════════════════════════════════════ -->
    <!-- ТАБ: СПИСОК ЗАЯВОК                       -->
    <!-- ════════════════════════════════════════ -->
    <template v-if="activeTab === 'list'">

      <!-- ─── Фильтры ─── -->
      <div class="flex flex-wrap gap-2 mb-4">
        <!-- Статус -->
        <select v-model="filterStatus" @change="currentPage = 1"
          class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                 rounded-lg text-sm text-gray-700 dark:text-gray-300 min-w-[150px]">
          <option value="">Все статусы</option>
          <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>

        <!-- Месяц -->
        <select v-model="filterMonth" @change="currentPage = 1"
          class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                 rounded-lg text-sm text-gray-700 dark:text-gray-300 min-w-[150px]">
          <option value="">Все месяцы</option>
          <option v-for="row in (stats?.byMonth || [])" :key="row.month" :value="row.month">
            {{ formatMonth(row.month) }}
          </option>
        </select>

        <!-- Организация -->
        <select v-model="filterOrg" @change="currentPage = 1"
          class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                 rounded-lg text-sm text-gray-700 dark:text-gray-300 min-w-[150px] max-w-[220px]">
          <option value="">Все организации</option>
          <option v-for="org in orgList" :key="org.id" :value="org.id">{{ org.name }}</option>
        </select>

        <!-- Курс (если выбрали в аналитике) -->
        <div v-if="filterCourseId"
          class="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-50 dark:bg-primary-900/20
                 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800
                 rounded-lg text-sm font-medium">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Курс: активен
          <button @click="filterCourseId = ''" class="ml-1 hover:text-primary-900">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Сброс -->
        <button v-if="hasActiveFilters" @click="resetFilters"
          class="px-3 py-2 text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
          Сбросить фильтры
        </button>

        <span class="ml-auto self-center text-sm text-gray-500 dark:text-gray-400">
          Найдено: {{ totalItems }}
        </span>
      </div>

      <!-- ─── Спиннер ─── -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>

      <!-- ─── Пусто ─── -->
      <div v-else-if="requests.length === 0"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
        <svg class="w-14 h-14 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-base font-semibold text-gray-700 dark:text-white mb-1">Заявок не найдено</p>
        <p class="text-sm text-gray-500">
          {{ hasActiveFilters ? "Попробуйте изменить фильтры" : "Пока ни одной заявки не поступало" }}
        </p>
      </div>

      <!-- ─── Таблица ─── -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm text-left align-middle">
            <thead class="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/70 border-b border-gray-100 dark:border-gray-700 uppercase tracking-wide">
              <tr>
                <th class="px-5 py-3.5 font-semibold">Организация / Представитель</th>
                <th class="px-5 py-3.5 font-semibold max-w-[220px]">Курсы</th>
                <th class="px-5 py-3.5 font-semibold text-center">Объёмы</th>
                <th class="px-5 py-3.5 font-semibold">Статус</th>
                <th class="px-5 py-3.5 font-semibold pl-4">Контракт / Оплата</th>
                <th class="px-5 py-3.5 font-semibold text-right pr-5">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700/60">
              <tr v-for="req in requests" :key="req.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <!-- Организация -->
                <td class="px-5 py-3.5 min-w-[180px]">
                  <div class="font-semibold text-gray-900 dark:text-white leading-tight">{{ req.organizationName }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">👤 {{ req.representativeName }}</div>
                  <div class="text-xs text-gray-400 mt-0.5">📅 {{ formatDate(req.createdAt) }}</div>
                </td>
                <!-- Курсы (сокращённые) -->
                <td class="px-5 py-3.5 max-w-[240px]">
                  <div class="flex flex-wrap gap-1">
                    <span v-for="name in uniqueCourseNames(req.items)" :key="name"
                      class="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium"
                      :title="name">
                      {{ shortName(name) }}
                    </span>
                  </div>
                </td>
                <!-- Объёмы -->
                <td class="px-5 py-3.5 text-center">
                  <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ req.totalStudentsCount }}</div>
                  <div class="text-xs text-gray-400">чел. / {{ req.totalItemsCount }} поз.</div>
                </td>
                <!-- Статус -->
                <td class="px-5 py-3.5">
                  <span :class="[STATUS_COLORS[req.status], 'px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap']">
                    {{ STATUS_LABELS[req.status] }}
                  </span>
                  <div v-if="req.adminComment" class="mt-1.5 text-xs text-gray-500 truncate max-w-[160px]" :title="req.adminComment">
                    💬 {{ req.adminComment }}
                  </div>
                </td>
                <!-- Контракт / оплата -->
                <td class="px-5 py-3.5 pl-4">
                  <div class="flex flex-col gap-1 text-xs font-medium">
                    <span :class="req.contractStatus === 'signed' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'">
                      {{ req.contractStatus === 'signed' ? '✓ Договор' : '⏳ Договор' }}
                    </span>
                    <span :class="req.paymentStatus === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'">
                      {{ req.paymentStatus === 'paid' ? '✓ Оплачено' : '⏳ Оплата' }}
                    </span>
                  </div>
                </td>
                <!-- Действия -->
                <td class="px-5 py-3.5 text-right pr-5">
                  <div class="flex justify-end items-center gap-1">
                    <!-- Просмотр деталей -->
                    <button @click="openDetail(req)" title="Просмотр"
                      class="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <svg class="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <!-- Редактировать -->
                    <button @click="openActionModal(req)" title="Изменить статусы"
                      class="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                      <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <circle cx="12" cy="12" r="3" stroke-width="2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ─── Пагинация ─── -->
        <div v-if="totalPages() > 1" class="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p class="text-xs text-gray-500 dark:text-gray-400">Страница {{ currentPage }} из {{ totalPages() }} (всего {{ totalItems }})</p>
          <div class="flex items-center gap-1.5">
            <button :disabled="currentPage <= 1" @click="currentPage--"
              class="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-xs font-medium bg-white dark:bg-gray-800
                     disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              ← Пред.
            </button>
            <button v-for="p in Math.min(totalPages(), 7)" :key="p"
              @click="currentPage = p"
              :class="[currentPage === p
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50',
                'w-8 h-8 rounded-md border text-xs font-medium transition-colors']">
              {{ p }}
            </button>
            <button :disabled="currentPage >= totalPages()" @click="currentPage++"
              class="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-xs font-medium bg-white dark:bg-gray-800
                     disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              След. →
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ════════════════════════════════════════ -->
    <!-- ТАБ: АНАЛИТИКА                           -->
    <!-- ════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'analytics'">

      <!-- Нет данных -->
      <div v-if="!stats" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>

      <div v-else class="space-y-6">

        <!-- ─── По месяцам ─── -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 dark:text-white text-sm">📅 По месяцам</h2>
            <span class="text-xs text-gray-400">Нажмите на строку — фильтрует заявки</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th class="px-5 py-2.5 text-left font-semibold">Месяц</th>
                  <th class="px-5 py-2.5 text-right font-semibold">Заявок</th>
                  <th class="px-5 py-2.5 text-right font-semibold">Слушателей</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
                <tr v-for="row in stats.byMonth" :key="row.month"
                  class="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                  :class="filterMonth === row.month ? 'bg-primary-50 dark:bg-primary-900/10' : ''"
                  @click="filterMonth = filterMonth === row.month ? '' : row.month; activeTab = 'list'; currentPage = 1">
                  <td class="px-5 py-3">
                    <span class="font-medium text-gray-900 dark:text-white">{{ formatMonth(row.month) }}</span>
                    <span v-if="filterMonth === row.month" class="ml-2 text-xs text-primary-600 font-semibold">✓ активен</span>
                  </td>
                  <td class="px-5 py-3 text-right font-bold text-gray-900 dark:text-white">{{ row.totalRequests }}</td>
                  <td class="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{{ row.totalStudents }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ─── По курсам (интерактивный блок) ─── -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 dark:text-white text-sm">📚 По курсам</h2>
            <span class="text-xs text-gray-400">Нажмите на курс — фильтрует список заявок</span>
          </div>
          <div class="p-5 space-y-3">
            <div
              v-for="row in stats.byCourse"
              :key="row.courseId"
              class="flex items-center gap-3 group cursor-pointer rounded-lg px-3 py-2 transition-colors"
              :class="filterCourseId === row.courseId
                ? 'bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-300 dark:ring-primary-700'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'"
              @click="toggleCourseFilter(row.courseId)"
            >
              <!-- Иконка выбранного -->
              <div class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all"
                :class="filterCourseId === row.courseId
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600'">
                <svg v-if="filterCourseId === row.courseId" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>

              <!-- Название + прогресс-бар -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-900 dark:text-white truncate"
                    :title="row.courseName">
                    {{ shortName(row.courseName) }}
                  </span>
                  <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-3">
                    <span class="font-semibold text-gray-900 dark:text-white">{{ row.totalRequests }} заявок</span>
                    <span>{{ row.totalStudents }} сл.</span>
                  </div>
                </div>
                <div class="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500"
                    :class="filterCourseId === row.courseId ? 'bg-primary-500' : 'bg-blue-400 dark:bg-blue-600'"
                    :style="{ width: `${(row.totalRequests / maxCourseRequests) * 100}%` }">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>

    <!-- ════════════════════════════════════════ -->
    <!-- МОДАЛКА: ДЕТАЛИ ЗАЯВКИ                  -->
    <!-- ════════════════════════════════════════ -->
    <div v-if="showDetailModal && selectedRequest"
      class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      @click.self="showDetailModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <!-- Шапка -->
        <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Детали заявки</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ selectedRequest.organizationName }} · {{ formatDate(selectedRequest.createdAt) }}
            </p>
          </div>
          <button @click="showDetailModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Статусы -->
        <div class="p-5 border-b border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-3">
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Заявка</p>
            <span :class="[STATUS_COLORS[selectedRequest.status], 'px-2.5 py-1 rounded-full text-xs font-semibold']">
              {{ STATUS_LABELS[selectedRequest.status] }}
            </span>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Договор</p>
            <span :class="selectedRequest.contractStatus === 'signed'
              ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
              : 'text-gray-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-400'"
              class="px-2.5 py-1 rounded-full text-xs font-semibold">
              {{ selectedRequest.contractStatus === 'signed' ? '✓ Подписан' : '⏳ Не подписан' }}
            </span>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Оплата</p>
            <span :class="selectedRequest.paymentStatus === 'paid'
              ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
              : 'text-gray-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-400'"
              class="px-2.5 py-1 rounded-full text-xs font-semibold">
              {{ selectedRequest.paymentStatus === 'paid' ? '✓ Оплачено' : '⏳ Не оплачено' }}
            </span>
          </div>
        </div>

        <!-- Позиции заявки -->
        <div class="p-5">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Позиции заявки ({{ selectedRequest.items?.length || 0 }})
          </h3>
          <div class="space-y-3">
            <div v-for="(item, idx) in selectedRequest.items" :key="item.id"
              class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
              <div class="flex items-start justify-between">
                <div class="flex items-start gap-3">
                  <span class="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400
                               rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {{ idx + 1 }}
                  </span>
                  <div>
                    <p class="font-semibold text-gray-900 dark:text-white leading-tight mb-1">{{ item.courseName }}</p>
                    <div class="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
                      <span>📅 {{ formatMonth(item.trainingMonth) }}</span>
                      <span>👥 {{ item.studentsCount }} чел.</span>
                    </div>
                    <div v-if="item.groupLabel" class="mt-1 text-xs text-primary-600 font-medium">Группа: {{ item.groupLabel }}</div>
                  </div>
                </div>
                <!-- Toggle слушателей -->
                <button v-if="item.students && item.students.length > 0"
                  @click="item._showStudents = !item._showStudents"
                  class="shrink-0 text-xs px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                  {{ item._showStudents ? 'Скрыть список' : 'Список слушателей' }}
                </button>
              </div>
              <!-- Раскрывающийся список слушателей -->
              <div v-if="item._showStudents && item.students"
                class="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <table class="w-full text-sm text-left">
                  <thead class="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400">
                    <tr>
                      <th class="py-2 px-4 font-semibold border-b border-gray-200 dark:border-gray-700">ФИО</th>
                      <th class="py-2 px-4 font-semibold border-b border-gray-200 dark:border-gray-700">Должность / Отдел</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                    <tr v-for="st in item.students" :key="st.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td class="py-2.5 px-4 font-medium text-gray-900 dark:text-white">{{ st.fullName }}</td>
                      <td class="py-2.5 px-4 text-gray-500 text-xs">
                        {{ st.position || '—' }}
                        <span v-if="st.department" class="block opacity-70">{{ st.department }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Комментарий -->
        <div class="p-5 border-t border-gray-100 dark:border-gray-700">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Комментарий администратора
          </label>
          <textarea
            :value="selectedRequest.adminComment || ''"
            @change="patchRequest(selectedRequest.id, { adminComment: ($event.target as HTMLTextAreaElement).value })"
            placeholder="Добавьте комментарий для представителя..."
            rows="2"
            class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600
                   rounded-lg text-sm text-gray-900 dark:text-white resize-none
                   focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          </textarea>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════ -->
    <!-- МОДАЛКА: ACTION (РЕДАКТИРОВАНИЕ)         -->
    <!-- ════════════════════════════════════════ -->
    <div v-if="actionModalOpen && activeActionRequest"
      class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      @click.self="closeActionModal">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-5">
        <!-- Шапка -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-bold text-gray-900 dark:text-white">Изменить статусы</h2>
            <p class="text-xs text-gray-500 mt-0.5">{{ activeActionRequest.organizationName }}</p>
          </div>
          <button @click="closeActionModal" class="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-3.5">
          <!-- Статус -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Статус заявки</label>
            <select v-model="activeActionRequest.status"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <!-- Договор -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Договор</label>
            <select v-model="activeActionRequest.contractStatus"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="not_signed">Не подписан</option>
              <option value="signed">Подписан ✓</option>
            </select>
          </div>
          <!-- Оплата -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Оплата</label>
            <select v-model="activeActionRequest.paymentStatus"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="not_paid">Не оплачено</option>
              <option value="paid">Оплачено ✓</option>
            </select>
          </div>
          <!-- Комментарий -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Комментарий</label>
            <textarea v-model="activeActionRequest.adminComment" rows="2"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Добавьте комментарий..."></textarea>
          </div>
        </div>

        <div class="mt-5 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button @click="closeActionModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            Отмена
          </button>
          <button @click="saveActionModal" :disabled="saving === activeActionRequest.id"
            class="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center gap-2 disabled:opacity-60">
            <svg v-if="saving === activeActionRequest.id" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ saving === activeActionRequest.id ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
